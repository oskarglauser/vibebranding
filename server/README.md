# Vibe Branding Font Service

A Node.js server that converts text with Google Fonts to true vector SVG paths. This service provides accurate font rendering that matches preview exactly, perfect for logotype makers and design applications.

## Features

- 🔤 Convert text to true vector SVG paths using Google Fonts
- 📦 Automatic Google Fonts downloading and caching
- ⚡ High-performance font processing with opentype.js
- 🎨 Support for font weights, letter spacing, and positioning
- ©️ Handle trademark symbols (®, ©, ™) correctly
- 🚀 Express.js REST API with comprehensive validation
- 🛡️ Built-in security, rate limiting, and error handling

## Quick Start

### Installation

```bash
cd server
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### Font Conversion

#### POST `/api/fonts/convert`

Convert text to SVG using a specified Google Font.

**Request Body:**
```json
{
  "text": "Your Brand Name®",
  "fontFamily": "Roboto",
  "fontWeight": "400",
  "fontSize": 72,
  "letterSpacing": 0,
  "color": "#000000",
  "textAlign": "left",
  "x": 0,
  "y": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "svg": "<svg>...</svg>",
    "width": 400,
    "height": 100,
    "metrics": {
      "ascender": 68,
      "descender": -18,
      "lineHeight": 86,
      "totalWidth": 400,
      "totalHeight": 100
    }
  },
  "meta": {
    "fontFamily": "Roboto",
    "fontWeight": "400",
    "fontSize": 72,
    "characterCount": 15
  }
}
```

### Font Management

#### GET `/api/fonts/popular`
Get list of popular Google Fonts.

#### GET `/api/fonts/search?q=roboto`
Search Google Fonts by name.

#### GET `/api/fonts/:fontFamily/weights`
Get available weights for a specific font family.

#### POST `/api/fonts/preview`
Generate a preview SVG with sample text.

#### GET `/api/fonts/:fontFamily/:fontWeight/info`
Get detailed information about a specific font.

#### POST `/api/fonts/batch-convert`
Convert multiple text variations in a single request (up to 10 variations).

### System

#### GET `/health`
Health check endpoint.

#### GET `/`
API documentation and endpoint list.

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `GOOGLE_FONTS_API_KEY` - Optional Google Fonts API key
- `FONT_CACHE_TTL` - Font cache TTL in seconds (default: 86400)
- `FONT_CACHE_MAX_SIZE` - Maximum cached fonts (default: 100)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

### Rate Limiting

- General API: 100 requests per 15 minutes
- Conversion endpoints: 20 requests per 5 minutes

## Integration with React Frontend

### Basic Usage

```typescript
// Frontend service
class FontService {
  private baseUrl = 'http://localhost:3001/api/fonts';

  async convertTextToSvg(options: {
    text: string;
    fontFamily: string;
    fontWeight?: string;
    fontSize?: number;
    letterSpacing?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
  }) {
    const response = await fetch(`${this.baseUrl}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error('Font conversion failed');
    }
    
    return response.json();
  }

  async getPopularFonts() {
    const response = await fetch(`${this.baseUrl}/popular`);
    return response.json();
  }

  async searchFonts(query: string) {
    const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
    return response.json();
  }
}
```

### React Component Example

```tsx
import React, { useState } from 'react';

const LogotypeGenerator = () => {
  const [svg, setSvg] = useState('');
  const fontService = new FontService();

  const generateLogo = async () => {
    try {
      const result = await fontService.convertTextToSvg({
        text: 'My Brand™',
        fontFamily: 'Roboto',
        fontWeight: '700',
        fontSize: 72,
        color: '#1a1a1a'
      });
      
      setSvg(result.data.svg);
    } catch (error) {
      console.error('Error generating logo:', error);
    }
  };

  return (
    <div>
      <button onClick={generateLogo}>Generate Logo</button>
      {svg && (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
};
```

## Architecture

### Core Services

- **GoogleFontsService**: Downloads and caches Google Font files
- **FontToSvgService**: Converts text to SVG paths using opentype.js
- **Validation Middleware**: Input validation and security
- **Caching**: In-memory font caching with disk persistence

### Font Processing Flow

1. Client requests text conversion
2. Server validates input parameters
3. Google Font is downloaded (or retrieved from cache)
4. Font is parsed using opentype.js
5. Text is converted to individual glyph paths
6. Paths are combined into complete SVG
7. SVG with accurate metrics is returned

### Caching Strategy

- **Font Files**: Cached in memory and disk (24 hours default)
- **Font Metadata**: Cached in memory (1 hour)
- **Rate Limiting**: Per-IP request tracking

## Dependencies

### Core Libraries

- **opentype.js**: Font parsing and path extraction
- **express**: Web framework
- **axios**: HTTP client for font downloads
- **node-cache**: In-memory caching

### Security & Performance

- **helmet**: Security headers
- **cors**: Cross-origin requests
- **compression**: Response compression
- **express-rate-limit**: Rate limiting

## Error Handling

The API provides detailed error responses with specific error codes:

- `INVALID_TEXT`: Text validation failed
- `INVALID_FONT_FAMILY`: Font family validation failed
- `FONT_LOAD_ERROR`: Font download or parsing failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: External service unavailable

## Development

### Project Structure

```
server/
├── services/
│   ├── googleFonts.js      # Google Fonts API integration
│   └── fontToSvg.js        # Font to SVG conversion
├── routes/
│   └── fonts.js            # API routes
├── middleware/
│   └── validation.js       # Validation and security
├── fonts/                  # Font cache directory
├── server.js               # Main server file
└── package.json            # Dependencies
```

### Testing

```bash
# Run tests
npm test

# Test API endpoints
curl -X POST http://localhost:3001/api/fonts/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello World","fontFamily":"Roboto"}'
```

## Production Deployment

1. Set production environment variables
2. Configure proper CORS origins
3. Set up SSL/TLS
4. Configure reverse proxy (nginx recommended)
5. Set up monitoring and logging
6. Consider horizontal scaling for high traffic

## Troubleshooting

### Common Issues

1. **Font not found**: Ensure font family name matches Google Fonts exactly
2. **Large SVG size**: Reduce font size or text length
3. **Rate limiting**: Implement proper caching on frontend
4. **Memory usage**: Monitor font cache size in production

### Performance Tips

- Use font caching effectively
- Implement frontend caching for repeated conversions
- Consider CDN for static font assets
- Monitor server memory usage

## License

MIT License - see LICENSE file for details.