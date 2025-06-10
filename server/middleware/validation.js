const rateLimit = require('express-rate-limit');

/**
 * Validation middleware for font conversion requests
 */
const validateFontRequest = (req, res, next) => {
  const { text, fontFamily, fontSize, letterSpacing, color } = req.body;

  // Validate required fields
  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      error: 'Text is required and must be a string',
      code: 'INVALID_TEXT'
    });
  }

  if (!fontFamily || typeof fontFamily !== 'string') {
    return res.status(400).json({
      error: 'Font family is required and must be a string',
      code: 'INVALID_FONT_FAMILY'
    });
  }

  // Validate text length
  if (text.length > 500) {
    return res.status(400).json({
      error: 'Text must be 500 characters or less',
      code: 'TEXT_TOO_LONG'
    });
  }

  // Validate font size
  if (fontSize !== undefined) {
    const size = Number(fontSize);
    if (isNaN(size) || size < 8 || size > 500) {
      return res.status(400).json({
        error: 'Font size must be between 8 and 500',
        code: 'INVALID_FONT_SIZE'
      });
    }
  }

  // Validate letter spacing
  if (letterSpacing !== undefined) {
    const spacing = Number(letterSpacing);
    if (isNaN(spacing) || spacing < -50 || spacing > 100) {
      return res.status(400).json({
        error: 'Letter spacing must be between -50 and 100',
        code: 'INVALID_LETTER_SPACING'
      });
    }
  }

  // Validate color (basic hex color validation)
  if (color !== undefined) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      return res.status(400).json({
        error: 'Color must be a valid hex color (e.g., #000000 or #000)',
        code: 'INVALID_COLOR'
      });
    }
  }

  // Validate font weight
  const { fontWeight } = req.body;
  if (fontWeight !== undefined) {
    const validWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'regular', 'bold'];
    if (!validWeights.includes(String(fontWeight))) {
      return res.status(400).json({
        error: 'Font weight must be one of: 100, 200, 300, 400, 500, 600, 700, 800, 900, regular, bold',
        code: 'INVALID_FONT_WEIGHT'
      });
    }
  }

  // Validate text alignment
  const { textAlign } = req.body;
  if (textAlign !== undefined) {
    const validAlignments = ['left', 'center', 'right'];
    if (!validAlignments.includes(textAlign)) {
      return res.status(400).json({
        error: 'Text alignment must be one of: left, center, right',
        code: 'INVALID_TEXT_ALIGN'
      });
    }
  }

  next();
};

/**
 * Rate limiting middleware
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Font loading errors
  if (err.message.includes('Failed to parse font') || err.message.includes('Could not download')) {
    return res.status(400).json({
      error: 'Font loading failed',
      message: err.message,
      code: 'FONT_LOAD_ERROR'
    });
  }

  // OpenType.js errors
  if (err.message.includes('opentype')) {
    return res.status(400).json({
      error: 'Font processing error',
      message: err.message,
      code: 'FONT_PROCESSING_ERROR'
    });
  }

  // Network errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Unable to download font resources',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    code: 'INTERNAL_ERROR'
  });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.path} was not found`,
    code: 'NOT_FOUND'
  });
};

/**
 * CORS configuration
 */
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] // Replace with your actual frontend domain
    : ['http://localhost:3000', 'http://localhost:5173'], // Vite dev server
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

module.exports = {
  validateFontRequest,
  createRateLimit,
  errorHandler,
  notFoundHandler,
  corsOptions,
  securityHeaders
};