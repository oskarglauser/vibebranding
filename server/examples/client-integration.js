/**
 * Example client integration for the Font Service
 * This shows how to integrate the font service with your React frontend
 */

class FontServiceClient {
  constructor(baseUrl = 'http://localhost:3001/api/fonts') {
    this.baseUrl = baseUrl;
  }

  /**
   * Convert text to SVG using Google Fonts
   */
  async convertTextToSvg(options) {
    try {
      const response = await fetch(`${this.baseUrl}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Conversion failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Font conversion error:', error);
      throw error;
    }
  }

  /**
   * Get popular Google Fonts
   */
  async getPopularFonts() {
    try {
      const response = await fetch(`${this.baseUrl}/popular`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching popular fonts:', error);
      return [];
    }
  }

  /**
   * Search Google Fonts
   */
  async searchFonts(query) {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error searching fonts:', error);
      return [];
    }
  }

  /**
   * Get font weights for a specific font family
   */
  async getFontWeights(fontFamily) {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(fontFamily)}/weights`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching font weights:', error);
      return ['regular'];
    }
  }

  /**
   * Generate font preview
   */
  async generatePreview(fontFamily, fontWeight = '400') {
    try {
      const response = await fetch(`${this.baseUrl}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fontFamily, fontWeight })
      });

      if (!response.ok) {
        throw new Error('Preview generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Preview generation error:', error);
      throw error;
    }
  }

  /**
   * Convert multiple text variations
   */
  async batchConvert(fontFamily, fontWeight, variations) {
    try {
      const response = await fetch(`${this.baseUrl}/batch-convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fontFamily,
          fontWeight,
          variations
        })
      });

      if (!response.ok) {
        throw new Error('Batch conversion failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Batch conversion error:', error);
      throw error;
    }
  }
}

// Example usage in React component
const ExampleReactComponent = () => {
  const [svg, setSvg] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const fontService = new FontServiceClient();

  const handleConvert = async () => {
    setLoading(true);
    try {
      const result = await fontService.convertTextToSvg({
        text: 'My Brand™',
        fontFamily: 'Roboto',
        fontWeight: '700',
        fontSize: 72,
        letterSpacing: 2,
        color: '#1a1a1a',
        textAlign: 'center'
      });

      setSvg(result.data.svg);
      console.log('Conversion metrics:', result.data.metrics);
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Conversion failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'font-converter' }, [
    React.createElement('button', {
      key: 'button',
      onClick: handleConvert,
      disabled: loading
    }, loading ? 'Converting...' : 'Convert Text to SVG'),
    
    svg && React.createElement('div', {
      key: 'svg',
      className: 'svg-output',
      dangerouslySetInnerHTML: { __html: svg }
    })
  ]);
};

// Example usage for logotype generation
const LogotypeGenerator = {
  async generateLogo(brandName, options = {}) {
    const fontService = new FontServiceClient();
    
    const defaultOptions = {
      fontFamily: 'Montserrat',
      fontWeight: '600',
      fontSize: 48,
      letterSpacing: 1,
      color: '#000000',
      textAlign: 'left'
    };

    const mergedOptions = { ...defaultOptions, ...options, text: brandName };

    try {
      const result = await fontService.convertTextToSvg(mergedOptions);
      
      return {
        svg: result.data.svg,
        width: result.data.width,
        height: result.data.height,
        downloadUrl: `data:image/svg+xml;base64,${btoa(result.data.svg)}`,
        metrics: result.data.metrics
      };
    } catch (error) {
      throw new Error(`Logo generation failed: ${error.message}`);
    }
  },

  async generateVariations(brandName, fontOptions) {
    const fontService = new FontServiceClient();
    
    const variations = fontOptions.map(option => ({
      text: brandName,
      ...option
    }));

    try {
      const result = await fontService.batchConvert(
        fontOptions[0].fontFamily,
        fontOptions[0].fontWeight,
        variations
      );

      return result.data.map(variation => ({
        ...variation,
        downloadUrl: variation.success 
          ? `data:image/svg+xml;base64,${btoa(variation.data.svg)}`
          : null
      }));
    } catch (error) {
      throw new Error(`Variations generation failed: ${error.message}`);
    }
  }
};

// Example: Generate multiple logo variations
async function generateBrandingKit() {
  const brandName = "TechStart™";
  
  const variations = [
    { fontSize: 48, fontWeight: '400', color: '#333333' },
    { fontSize: 48, fontWeight: '700', color: '#333333' },
    { fontSize: 36, fontWeight: '600', color: '#0066cc' },
    { fontSize: 60, fontWeight: '300', color: '#000000', letterSpacing: 3 }
  ];

  try {
    const logos = await LogotypeGenerator.generateVariations(brandName, variations);
    
    logos.forEach((logo, index) => {
      if (logo.success) {
        console.log(`Logo variation ${index + 1}:`, {
          svg: logo.data.svg,
          downloadUrl: logo.downloadUrl,
          dimensions: `${logo.data.width}x${logo.data.height}`
        });
      } else {
        console.error(`Logo variation ${index + 1} failed:`, logo.error);
      }
    });

    return logos;
  } catch (error) {
    console.error('Branding kit generation failed:', error);
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FontServiceClient,
    LogotypeGenerator,
    generateBrandingKit
  };
}

// Example usage:
// const fontService = new FontServiceClient();
// fontService.convertTextToSvg({ text: "Hello World", fontFamily: "Roboto" });