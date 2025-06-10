const axios = require('axios');
const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');

class GoogleFontsService {
  constructor() {
    // Cache for font files (24 hours default)
    this.fontCache = new NodeCache({ 
      stdTTL: process.env.FONT_CACHE_TTL || 86400,
      maxKeys: process.env.FONT_CACHE_MAX_SIZE || 100
    });
    
    // Cache for font metadata (1 hour)
    this.metadataCache = new NodeCache({ stdTTL: 3600 });
    
    this.fontsDir = path.join(__dirname, '..', 'fonts');
    this.ensureFontsDirectory();
  }

  async ensureFontsDirectory() {
    try {
      await fs.access(this.fontsDir);
    } catch {
      await fs.mkdir(this.fontsDir, { recursive: true });
    }
  }

  /**
   * Get Google Fonts metadata
   */
  async getFontsMetadata() {
    const cacheKey = 'google_fonts_metadata';
    let metadata = this.metadataCache.get(cacheKey);
    
    if (!metadata) {
      try {
        const apiKey = process.env.GOOGLE_FONTS_API_KEY;
        const url = apiKey 
          ? `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}`
          : 'https://www.googleapis.com/webfonts/v1/webfonts';
          
        const response = await axios.get(url);
        metadata = response.data;
        this.metadataCache.set(cacheKey, metadata);
      } catch (error) {
        console.error('Error fetching Google Fonts metadata:', error.message);
        // Return a basic fallback
        metadata = { items: [] };
      }
    }
    
    return metadata;
  }

  /**
   * Download font file from Google Fonts
   * Uses CSS API to get font URLs, then downloads the actual font files
   */
  async downloadFont(fontFamily, weight = '400', format = 'ttf') {
    const cacheKey = `${fontFamily}_${weight}_${format}`;
    let fontBuffer = this.fontCache.get(cacheKey);
    
    if (!fontBuffer) {
      try {
        // Step 1: Get CSS with font URLs
        const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weight}&display=swap`;
        
        // Use different user agents to get different formats
        const userAgent = format === 'woff2' 
          ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
          : 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)'; // For TTF/OTF
        
        const cssResponse = await axios.get(cssUrl, {
          headers: { 'User-Agent': userAgent }
        });
        
        // Step 2: Extract font URL from CSS
        const fontUrlMatch = cssResponse.data.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/);
        
        if (!fontUrlMatch) {
          throw new Error(`Could not find font URL for ${fontFamily} weight ${weight}`);
        }
        
        const fontUrl = fontUrlMatch[1];
        
        // Step 3: Download the actual font file
        const fontResponse = await axios.get(fontUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        fontBuffer = Buffer.from(fontResponse.data);
        
        // Cache the font
        this.fontCache.set(cacheKey, fontBuffer);
        
        // Optionally save to disk for persistence
        const filename = `${fontFamily.replace(/\s+/g, '-')}-${weight}.${format}`;
        const filepath = path.join(this.fontsDir, filename);
        await fs.writeFile(filepath, fontBuffer);
        
        console.log(`Downloaded and cached font: ${fontFamily} ${weight}`);
        
      } catch (error) {
        console.error(`Error downloading font ${fontFamily} ${weight}:`, error.message);
        
        // Try to load from disk if download fails
        const filename = `${fontFamily.replace(/\s+/g, '-')}-${weight}.${format}`;
        const filepath = path.join(this.fontsDir, filename);
        
        try {
          fontBuffer = await fs.readFile(filepath);
          this.fontCache.set(cacheKey, fontBuffer);
          console.log(`Loaded font from disk: ${fontFamily} ${weight}`);
        } catch (diskError) {
          throw new Error(`Could not download or load font: ${fontFamily} ${weight}`);
        }
      }
    }
    
    return fontBuffer;
  }

  /**
   * Get popular Google Fonts list (hardcoded for reliability)
   */
  getPopularFonts() {
    return [
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Roboto Condensed',
      'Source Sans Pro', 'Oswald', 'Raleway', 'Poppins', 'Roboto Slab',
      'Merriweather', 'PT Sans', 'Playfair Display', 'Ubuntu', 'Nunito',
      'Libre Baskerville', 'Crimson Text', 'Work Sans', 'Fira Sans',
      'Barlow', 'Inter', 'Manrope', 'DM Sans', 'Plus Jakarta Sans'
    ];
  }

  /**
   * Search for fonts by name
   */
  async searchFonts(query) {
    const metadata = await this.getFontsMetadata();
    const searchTerm = query.toLowerCase();
    
    return metadata.items.filter(font => 
      font.family.toLowerCase().includes(searchTerm) ||
      font.category.toLowerCase().includes(searchTerm)
    ).slice(0, 20); // Limit results
  }

  /**
   * Get font weights available for a specific font family
   */
  async getFontWeights(fontFamily) {
    const metadata = await this.getFontsMetadata();
    const font = metadata.items.find(item => 
      item.family.toLowerCase() === fontFamily.toLowerCase()
    );
    
    return font ? font.variants : ['regular'];
  }

  /**
   * Clear cache (useful for development)
   */
  clearCache() {
    this.fontCache.flushAll();
    this.metadataCache.flushAll();
  }
}

module.exports = GoogleFontsService;