// Vercel Serverless Function for font conversion
import opentype from 'opentype.js';

export default async function handler(req, res) {
  // Dynamic CORS headers - allow gologotype.com and vercel deployments
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://gologotype.com',
    'https://www.gologotype.com',
    'http://localhost:3000',
    'http://localhost:5173'
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

  try {
    const {
      text,
      fontFamily,
      fontWeight = '400',
      fontSize = 120,
      letterSpacing = 0,
      color = '#000000',
      textAlign = 'center'
    } = req.body;

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
      'Inter', 'Playfair Display', 'Roboto', 'Montserrat', 'Lato', 'Open Sans', 
      'Poppins', 'Source Sans Pro', 'Merriweather', 'Oswald', 'Outfit', 'Work Sans', 
      'DM Sans', 'DM Serif Text', 'Nunito Sans', 'Quicksand', 'Lexend Deca', 'Questrial',
      'Funnel Sans', 'Funnel Display', 'Onest', 'Gabarito', 'Figtree', 'Tomorrow', 'Sniglet'
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
    // Download Google Font CSS to get font file URL
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${fontWeight}&display=swap`;
    
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

    // Parse font with opentype.js
    console.log('Parsing font with opentype.js...');
    const font = opentype.parse(fontBuffer);
    console.log(`Font parsed successfully: ${font.names.fontFamily?.en || 'Unknown'}`);

    // Convert text to vector paths
    const path = font.getPath(text, 0, 0, fontSize, {
      kerning: true,
      letterSpacing: letterSpacing
    });

    const pathData = path.toPathData(2); // 2 decimal places precision
    
    if (!pathData || pathData === 'M0,0Z') {
      throw new Error('No vector paths generated from text');
    }

    console.log(`Vector paths generated: ${pathData.length} characters`);

    // Calculate bounding box for proper sizing
    const bbox = path.getBoundingBox();
    const width = Math.ceil(bbox.x2 - bbox.x1 + 40); // Add padding
    const height = Math.ceil(bbox.y2 - bbox.y1 + 40);
    
    // Calculate centering
    let offsetX = 20 - bbox.x1;
    let offsetY = 20 - bbox.y1;
    
    // Handle text alignment
    if (textAlign === 'center') {
      offsetX = (width - (bbox.x2 - bbox.x1)) / 2 - bbox.x1;
    } else if (textAlign === 'right') {
      offsetX = width - 20 - bbox.x2;
    }

    // Generate clean vector SVG with only path elements
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${offsetX}, ${offsetY})">
    <path d="${pathData}" fill="${color}"/>
  </g>
</svg>`;

    return {
      svg,
      pathData,
      width,
      height,
      isVector: true,
      metrics: {
        boundingBox: bbox,
        fontSize,
        letterSpacing,
        fontFamily: font.names.fontFamily?.en || fontFamily
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