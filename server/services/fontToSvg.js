const opentype = require('opentype.js');

class FontToSvgService {
  constructor() {
    this.fontCache = new Map();
  }

  /**
   * Load font from buffer and cache it
   */
  async loadFont(fontBuffer, fontKey) {
    if (this.fontCache.has(fontKey)) {
      return this.fontCache.get(fontKey);
    }

    try {
      const font = opentype.parse(fontBuffer.buffer || fontBuffer);
      this.fontCache.set(fontKey, font);
      return font;
    } catch (error) {
      throw new Error(`Failed to parse font: ${error.message}`);
    }
  }

  /**
   * Convert text to SVG paths
   */
  async textToSvg(options) {
    const {
      text,
      fontBuffer,
      fontKey,
      fontSize = 72,
      letterSpacing = 0,
      color = '#000000',
      x = 0,
      y = 0,
      textAlign = 'left',
      fontWeight = '400'
    } = options;

    if (!text) {
      throw new Error('Text is required');
    }

    if (!fontBuffer) {
      throw new Error('Font buffer is required');
    }

    // Load the font
    const font = await this.loadFont(fontBuffer, fontKey);

    // Calculate scaling factor
    const scale = fontSize / font.unitsPerEm;

    // Get font metrics
    const ascender = font.ascender * scale;
    const descender = font.descender * scale;
    const lineGap = font.lineGap || 0;
    const lineHeight = (font.ascender - font.descender + lineGap) * scale;

    // Split text into lines
    const lines = text.split('\n');
    const svgPaths = [];
    const svgElements = [];

    let totalWidth = 0;
    let totalHeight = lineHeight * lines.length;

    // Process each line
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineY = y + ascender + (lineIndex * lineHeight);
      
      // Calculate line width for alignment
      const lineWidth = this.calculateLineWidth(font, line, fontSize, letterSpacing);
      totalWidth = Math.max(totalWidth, lineWidth);

      let lineX = x;
      if (textAlign === 'center') {
        lineX = x - (lineWidth / 2);
      } else if (textAlign === 'right') {
        lineX = x - lineWidth;
      }

      // Convert each character to path
      let currentX = lineX;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const glyph = font.charToGlyph(char);
        
        if (glyph.unicode !== undefined) {
          const path = glyph.getPath(currentX, lineY, fontSize);
          const pathData = path.toPathData();
          
          if (pathData && pathData !== 'M0,0Z') {
            svgPaths.push({
              d: pathData,
              char: char,
              x: currentX,
              y: lineY
            });
          }
        }

        // Advance position
        const advance = glyph.advanceWidth * scale;
        currentX += advance + letterSpacing;

        // Add kerning if available
        if (i < line.length - 1) {
          const nextChar = line[i + 1];
          const nextGlyph = font.charToGlyph(nextChar);
          const kerning = font.getKerningValue(glyph, nextGlyph) * scale;
          currentX += kerning;
        }
      }
    }

    // Handle special characters (trademark symbols)
    const processedPaths = this.processSpecialCharacters(svgPaths, font, fontSize);

    // Create SVG structure
    const viewBoxWidth = Math.ceil(totalWidth + Math.abs(x) * 2) || 100;
    const viewBoxHeight = Math.ceil(totalHeight + Math.abs(y) + Math.abs(descender)) || 100;
    
    // Adjust viewBox for negative coordinates
    const minX = Math.min(0, x);
    const minY = Math.min(0, y + descender);

    const svgContent = this.createSvgContent(processedPaths, {
      viewBoxWidth,
      viewBoxHeight,
      minX,
      minY,
      color,
      fontSize,
      fontFamily: font.names.fontFamily?.en || 'Unknown'
    });

    return {
      svg: svgContent,
      width: viewBoxWidth,
      height: viewBoxHeight,
      paths: processedPaths,
      metrics: {
        ascender,
        descender,
        lineHeight,
        totalWidth,
        totalHeight,
        fontSize,
        letterSpacing
      }
    };
  }

  /**
   * Calculate line width including letter spacing
   */
  calculateLineWidth(font, text, fontSize, letterSpacing) {
    let width = 0;
    const scale = fontSize / font.unitsPerEm;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const glyph = font.charToGlyph(char);
      width += glyph.advanceWidth * scale;
      
      if (i < text.length - 1) {
        width += letterSpacing;
        
        // Add kerning if available
        const nextChar = text[i + 1];
        const nextGlyph = font.charToGlyph(nextChar);
        const kerning = font.getKerningValue(glyph, nextGlyph) * scale;
        width += kerning;
      }
    }

    return width;
  }

  /**
   * Process special characters like trademark symbols
   */
  processSpecialCharacters(paths, font, fontSize) {
    return paths.map(pathData => {
      const { char } = pathData;
      
      // Handle trademark symbols with better positioning
      if (char === '®' || char === '©' || char === '™') {
        return {
          ...pathData,
          special: true,
          type: this.getSymbolType(char)
        };
      }
      
      return pathData;
    });
  }

  /**
   * Get symbol type for special characters
   */
  getSymbolType(char) {
    switch (char) {
      case '®': return 'registered';
      case '©': return 'copyright';
      case '™': return 'trademark';
      default: return 'normal';
    }
  }

  /**
   * Create SVG content from paths
   */
  createSvgContent(paths, options) {
    const { viewBoxWidth, viewBoxHeight, minX, minY, color, fontSize, fontFamily } = options;
    
    const pathElements = paths.map((pathData, index) => {
      return `<path d="${pathData.d}" fill="${color}" data-char="${pathData.char}" data-index="${index}"/>`;
    }).join('\n    ');

    const svg = `<svg width="${viewBoxWidth}" height="${viewBoxHeight}" viewBox="${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .font-path {
        fill: ${color};
        font-family: ${fontFamily};
        font-size: ${fontSize}px;
      }
    </style>
  </defs>
  <g class="text-group">
    ${pathElements}
  </g>
</svg>`;

    return svg;
  }

  /**
   * Get font information
   */
  async getFontInfo(fontBuffer, fontKey) {
    const font = await this.loadFont(fontBuffer, fontKey);
    
    return {
      fontFamily: font.names.fontFamily?.en || 'Unknown',
      fontSubfamily: font.names.fontSubfamily?.en || 'Regular',
      version: font.names.version?.en || 'Unknown',
      unitsPerEm: font.unitsPerEm,
      ascender: font.ascender,
      descender: font.descender,
      lineGap: font.lineGap,
      numGlyphs: font.numGlyphs,
      supportedCharacters: this.getSupportedCharacters(font)
    };
  }

  /**
   * Get list of supported characters (sample)
   */
  getSupportedCharacters(font) {
    const chars = [];
    const testChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789®©™!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    for (const char of testChars) {
      const glyph = font.charToGlyph(char);
      if (glyph && glyph.unicode !== undefined) {
        chars.push(char);
      }
    }
    
    return chars;
  }

  /**
   * Clear font cache
   */
  clearCache() {
    this.fontCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.fontCache.size,
      fonts: Array.from(this.fontCache.keys())
    };
  }
}

module.exports = FontToSvgService;