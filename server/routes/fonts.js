const express = require('express');
const GoogleFontsService = require('../services/googleFonts');
const FontToSvgService = require('../services/fontToSvg');
const { validateFontRequest } = require('../middleware/validation');

const router = express.Router();
const googleFonts = new GoogleFontsService();
const fontToSvg = new FontToSvgService();

/**
 * GET /api/fonts/popular
 * Get list of popular Google Fonts
 */
router.get('/popular', async (req, res, next) => {
  try {
    const popularFonts = googleFonts.getPopularFonts();
    res.json({
      success: true,
      data: popularFonts,
      count: popularFonts.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fonts/search?q=query
 * Search Google Fonts by name
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_QUERY'
      });
    }

    const results = await googleFonts.searchFonts(query);
    res.json({
      success: true,
      data: results,
      count: results.length,
      query
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fonts/:fontFamily/weights
 * Get available weights for a specific font family
 */
router.get('/:fontFamily/weights', async (req, res, next) => {
  try {
    const { fontFamily } = req.params;
    const weights = await googleFonts.getFontWeights(fontFamily);
    
    res.json({
      success: true,
      data: weights,
      fontFamily
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/fonts/convert
 * Convert text to SVG using specified Google Font
 */
router.post('/convert', validateFontRequest, async (req, res, next) => {
  try {
    const {
      text,
      fontFamily,
      fontWeight = '400',
      fontSize = 72,
      letterSpacing = 0,
      color = '#000000',
      textAlign = 'left',
      x = 0,
      y = 0
    } = req.body;

    // Download the font
    const fontBuffer = await googleFonts.downloadFont(fontFamily, fontWeight);
    const fontKey = `${fontFamily}_${fontWeight}`;

    // Convert to SVG
    const result = await fontToSvg.textToSvg({
      text,
      fontBuffer,
      fontKey,
      fontSize: Number(fontSize),
      letterSpacing: Number(letterSpacing),
      color,
      textAlign,
      x: Number(x),
      y: Number(y),
      fontWeight
    });

    res.json({
      success: true,
      data: {
        svg: result.svg,
        width: result.width,
        height: result.height,
        metrics: result.metrics
      },
      meta: {
        fontFamily,
        fontWeight,
        fontSize,
        letterSpacing,
        color,
        textAlign,
        characterCount: text.length
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/fonts/preview
 * Generate a preview SVG with sample text
 */
router.post('/preview', async (req, res, next) => {
  try {
    const {
      fontFamily,
      fontWeight = '400',
      sampleText = 'The quick brown fox jumps over the lazy dog'
    } = req.body;

    if (!fontFamily) {
      return res.status(400).json({
        error: 'Font family is required',
        code: 'INVALID_FONT_FAMILY'
      });
    }

    // Download the font
    const fontBuffer = await googleFonts.downloadFont(fontFamily, fontWeight);
    const fontKey = `${fontFamily}_${fontWeight}_preview`;

    // Convert to SVG with smaller font size for preview
    const result = await fontToSvg.textToSvg({
      text: sampleText,
      fontBuffer,
      fontKey,
      fontSize: 24,
      letterSpacing: 0,
      color: '#333333',
      textAlign: 'left',
      fontWeight
    });

    res.json({
      success: true,
      data: {
        svg: result.svg,
        width: result.width,
        height: result.height
      },
      meta: {
        fontFamily,
        fontWeight,
        sampleText
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fonts/:fontFamily/:fontWeight/info
 * Get detailed information about a specific font
 */
router.get('/:fontFamily/:fontWeight/info', async (req, res, next) => {
  try {
    const { fontFamily, fontWeight } = req.params;

    // Download the font
    const fontBuffer = await googleFonts.downloadFont(fontFamily, fontWeight);
    const fontKey = `${fontFamily}_${fontWeight}`;

    // Get font information
    const fontInfo = await fontToSvg.getFontInfo(fontBuffer, fontKey);

    res.json({
      success: true,
      data: fontInfo,
      meta: {
        fontFamily,
        fontWeight
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/fonts/batch-convert
 * Convert multiple text variations in a single request
 */
router.post('/batch-convert', async (req, res, next) => {
  try {
    const { fontFamily, fontWeight = '400', variations } = req.body;

    if (!fontFamily || !variations || !Array.isArray(variations)) {
      return res.status(400).json({
        error: 'Font family and variations array are required',
        code: 'INVALID_BATCH_REQUEST'
      });
    }

    if (variations.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 variations allowed per batch',
        code: 'BATCH_LIMIT_EXCEEDED'
      });
    }

    // Download the font once
    const fontBuffer = await googleFonts.downloadFont(fontFamily, fontWeight);
    const fontKey = `${fontFamily}_${fontWeight}_batch`;

    const results = [];

    // Process each variation
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      
      try {
        const result = await fontToSvg.textToSvg({
          text: variation.text,
          fontBuffer,
          fontKey: `${fontKey}_${i}`,
          fontSize: Number(variation.fontSize || 72),
          letterSpacing: Number(variation.letterSpacing || 0),
          color: variation.color || '#000000',
          textAlign: variation.textAlign || 'left',
          fontWeight
        });

        results.push({
          index: i,
          success: true,
          data: {
            svg: result.svg,
            width: result.width,
            height: result.height,
            metrics: result.metrics
          },
          input: variation
        });

      } catch (variationError) {
        results.push({
          index: i,
          success: false,
          error: variationError.message,
          input: variation
        });
      }
    }

    res.json({
      success: true,
      data: results,
      meta: {
        fontFamily,
        fontWeight,
        totalVariations: variations.length,
        successfulConversions: results.filter(r => r.success).length
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;