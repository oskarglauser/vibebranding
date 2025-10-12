// Vercel Serverless Function for font conversion
import * as fontkit from 'fontkit';

export default async function handler(req, res) {
  // Dynamic CORS headers - allow gologotype.com and vercel deployments
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://gologotype.com',
    'https://www.gologotype.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177'
  ];
  
  // Allow any vercel deployment URL for development/staging
  const isVercelDeploy = origin && (
    origin.includes('.vercel.app') || 
    origin.includes('gologotype')
  );
  
  if (allowedOrigins.includes(origin) || isVercelDeploy) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract variables outside try block for error handler access
  let text, fontFamily, fontWeight, fontSize, letterSpacing, color, textAlign;

  try {
    ({
      text,
      fontFamily,
      fontWeight = '400',
      fontSize = 120,
      letterSpacing = 0,
      color = '#000000',
      textAlign = 'center'
    } = req.body);

    // Validate input
    if (!text || !fontFamily) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Text and fontFamily are required'
      });
    }

    // Input sanitization
    if (typeof text !== 'string' || text.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid text input'
      });
    }

    // Validate font family against whitelist
    const allowedFonts = [
      'Alan Sans', 'Archivo Black', 'Asimovian', 'Bebas Neue', 'Cal Sans',
      'DM Sans', 'DM Serif Text', 'Figtree', 'Fjalla One', 'Funnel Display',
      'Funnel Sans', 'Gabarito', 'Geist', 'Inter', 'Lato', 'Lexend Deca',
      'Manrope', 'Merriweather', 'Montserrat', 'National Park', 'Nunito Sans',
      'Onest', 'Open Sans', 'Oswald', 'Outfit', 'Playfair Display', 'Poppins',
      'Questrial', 'Quicksand', 'Roboto', 'Sansation', 'Sniglet', 'Source Sans Pro',
      'Special Gothic', 'Special Gothic Condensed One', 'Special Gothic Expanded One',
      'Tomorrow', 'Vend Sans', 'Work Sans'
    ];
    if (!allowedFonts.some(font => fontFamily.toLowerCase().includes(font.toLowerCase()))) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Font not supported'
      });
    }

    // Try to create true vector SVG first, fallback to text-based
    let svgResult;
    try {
      console.log('Attempting vector conversion for:', fontFamily, fontWeight);
      svgResult = await createVectorSvg({
        text,
        fontFamily,
        fontWeight,
        fontSize,
        letterSpacing,
        color,
        textAlign
      });
      console.log('Vector conversion successful');
    } catch (vectorError) {
      console.error('Vector conversion failed:', vectorError);
      throw new Error('Vector conversion failed: ' + vectorError.message);
    }

    res.status(200).json({
      success: true,
      data: svgResult
    });

  } catch (error) {
    console.error('Font conversion error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      fontFamily,
      fontWeight,
      textLength: text ? text.length : 0
    });
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: `Font conversion failed: ${error.message}`
    });
  }
}

async function createVectorSvg({ text, fontFamily, fontWeight, fontSize, letterSpacing, color, textAlign }) {
  try {
    // Download Google Font CSS to get font file URL (WOFF2 supported by fontkit)
    // Add &text parameter to ensure all needed glyphs are included in the font file
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${fontWeight}&text=${encodeURIComponent(text)}&display=swap`;

    const cssResponse = await fetch(fontUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch font CSS: ${cssResponse.status}`);
    }

    const cssText = await cssResponse.text();
    console.log('Font CSS fetched successfully');
    console.log('CSS preview:', cssText.substring(0, 200));

    // Extract font file URL from CSS
    const fontMatch = cssText.match(/url\(([^)]+\.(woff2|woff|ttf))\)/);
    if (!fontMatch) {
      throw new Error('Font file URL not found in CSS');
    }

    const fontFileUrl = fontMatch[1];
    console.log('Font file URL:', fontFileUrl);

    // Download the font file
    const fontResponse = await fetch(fontFileUrl);
    if (!fontResponse.ok) {
      throw new Error(`Failed to download font file: ${fontResponse.status}`);
    }

    const fontBuffer = await fontResponse.arrayBuffer();
    console.log(`Font file downloaded: ${fontBuffer.byteLength} bytes`);

    // Parse font with fontkit (supports WOFF2)
    console.log('Parsing font with fontkit...');
    const font = fontkit.create(Buffer.from(fontBuffer));
    console.log(`Font parsed successfully: ${font.familyName || 'Unknown'}`);
    console.log(`Font has ${font.numGlyphs} glyphs total`);
    console.log(`Font characterSet size: ${font.characterSet ? font.characterSet.length : 'N/A'}`);

    // Debug: Check glyph mapping for each character
    console.log('Character to glyph mapping:');
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const codePoint = char.charCodeAt(0);
      const glyphId = font.glyphForCodePoint(codePoint);
      const glyphName = font.getGlyph(glyphId)?.name || 'unknown';
      console.log(`  '${char}' (U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}) -> glyph ID ${glyphId} (${glyphName})`);
    }

    // Layout text with fontkit to get positioned glyphs
    const run = font.layout(text);
    console.log(`Text layout complete: ${run.glyphs.length} glyphs`);

    // Calculate scale factor (fontkit uses font units, we need pixels)
    const scale = fontSize / font.unitsPerEm;
    console.log(`Scale factor: ${scale} (fontSize: ${fontSize}, unitsPerEm: ${font.unitsPerEm})`);

    // Build combined SVG with positioned glyphs
    const pathParts = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let currentX = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const position = run.positions[i];

      // Calculate glyph position with letter spacing
      const xOffset = currentX + (position.xOffset || 0) * scale;
      const yOffset = (position.yOffset || 0) * scale;

      // Debug glyph info
      console.log(`Glyph ${i} (${text[i]}):`, {
        id: glyph.id,
        name: glyph.name,
        hasPath: !!glyph.path,
        hasCommands: glyph.path && glyph.path.commands && glyph.path.commands.length,
        commandCount: glyph.path?.commands?.length || 0
      });

      // Build path data from commands array (toSVG() is broken - returns same box for all glyphs)
      let pathData = '';

      if (glyph.path && glyph.path.commands && glyph.path.commands.length > 0) {
        console.log(`Building from ${glyph.path.commands.length} commands`);

        // Debug: Log first command structure
        if (glyph.path.commands[0]) {
          console.log('First command structure:', JSON.stringify(glyph.path.commands[0]));
        }

        const commands = [];

        for (const cmd of glyph.path.commands) {
          switch (cmd.type) {
            case 'M':
              if (cmd.x !== undefined && cmd.y !== undefined) {
                commands.push(`M${cmd.x},${cmd.y}`);
              }
              break;
            case 'L':
              if (cmd.x !== undefined && cmd.y !== undefined) {
                commands.push(`L${cmd.x},${cmd.y}`);
              }
              break;
            case 'C':
              if (cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined && cmd.x !== undefined && cmd.y !== undefined) {
                commands.push(`C${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`);
              }
              break;
            case 'Q':
              if (cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x !== undefined && cmd.y !== undefined) {
                commands.push(`Q${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`);
              }
              break;
            case 'Z':
              commands.push('Z');
              break;
            default:
              console.warn(`Unknown command type: ${cmd.type}`);
          }
        }
        pathData = commands.join(' ');
        console.log(`Built path length: ${pathData.length}, first 100 chars: ${pathData.substring(0, 100)}...`);
      } else {
        console.warn(`No commands found for glyph ${i} (${text[i]})`);
      }

      if (pathData) {
        // Add glyph as a path with transform
        pathParts.push(`<path transform="translate(${xOffset.toFixed(2)},${yOffset.toFixed(2)}) scale(${scale.toFixed(6)})" d="${pathData}"/>`);
      } else {
        console.warn(`No path data for glyph ${i} (${text[i]})`);
      }

      // Update bounding box using glyph bbox
      if (glyph.bbox) {
        const bboxMinX = xOffset + glyph.bbox.minX * scale;
        const bboxMinY = yOffset + glyph.bbox.minY * scale;
        const bboxMaxX = xOffset + glyph.bbox.maxX * scale;
        const bboxMaxY = yOffset + glyph.bbox.maxY * scale;

        minX = Math.min(minX, bboxMinX);
        minY = Math.min(minY, bboxMinY);
        maxX = Math.max(maxX, bboxMaxX);
        maxY = Math.max(maxY, bboxMaxY);
      }

      // Advance position
      currentX += (position.xAdvance || 0) * scale + letterSpacing;
    }

    if (pathParts.length === 0) {
      throw new Error('No vector paths generated from text');
    }

    console.log(`Vector paths generated: ${pathParts.length} glyphs`);
    console.log(`Bounding box: minX=${minX}, minY=${minY}, maxX=${maxX}, maxY=${maxY}`);

    // Add padding
    const padding = 20;
    const width = Math.ceil(maxX - minX + padding * 2);
    const height = Math.ceil(maxY - minY + padding * 2);

    // Calculate offset for centering/alignment
    let offsetX = padding - minX;
    const offsetY = padding - minY;

    // Handle text alignment
    if (textAlign === 'center') {
      offsetX = (width - (maxX - minX)) / 2 - minX;
    } else if (textAlign === 'right') {
      offsetX = width - padding - maxX;
    }

    // Generate clean vector SVG
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)})" fill="${color}">
    ${pathParts.join('\n    ')}
  </g>
</svg>`;

    return {
      svg,
      pathData: svg, // Return full SVG for compatibility
      width,
      height,
      isVector: true,
      metrics: {
        boundingBox: { minX, minY, maxX, maxY },
        fontSize,
        letterSpacing,
        fontFamily: font.familyName || fontFamily
      }
    };

  } catch (error) {
    console.error('Vector conversion failed:', error);
    console.error('Vector error details:', {
      fontFamily,
      fontWeight,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Vector conversion failed for ${fontFamily}: ${error.message}`);
  }
}

function createTextBasedSvg({ text, fontFamily, fontWeight, fontSize, letterSpacing, color, textAlign }) {
  // Calculate approximate dimensions
  const charWidth = fontSize * 0.6; // Approximate character width
  const spacing = letterSpacing;
  const totalWidth = (text.length * charWidth) + ((text.length - 1) * spacing);
  const totalHeight = fontSize * 1.2;
  
  // Add padding
  const padding = 40;
  const svgWidth = totalWidth + (padding * 2);
  const svgHeight = totalHeight + (padding * 2);
  
  // Calculate text position
  let textX = padding;
  if (textAlign === 'center') {
    textX = svgWidth / 2;
  } else if (textAlign === 'right') {
    textX = svgWidth - padding;
  }
  
  const textY = (svgHeight / 2) + (fontSize * 0.3); // Baseline adjustment

  // Create SVG with embedded font
  const svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${fontWeight}&amp;display=swap');
      .logo-text {
        font-family: '${fontFamily}', Arial, sans-serif;
        font-weight: ${fontWeight};
        font-size: ${fontSize}px;
        fill: ${color};
        letter-spacing: ${letterSpacing}px;
      }
    </style>
  </defs>
  <text x="${textX}" y="${textY}" 
        class="logo-text"
        text-anchor="${textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start'}"
        dominant-baseline="middle">${text}</text>
</svg>`;

  return {
    svg,
    width: svgWidth,
    height: svgHeight,
    metrics: {
      totalWidth,
      totalHeight,
      fontSize,
      letterSpacing
    }
  };
}