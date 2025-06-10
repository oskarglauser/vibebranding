import opentype from 'opentype.js'

export default async function handler(req, res) {
  // Dynamic CORS headers - allow gologotype.com and vercel deployments
  const origin = req.headers.origin
  const allowedOrigins = [
    'https://gologotype.com',
    'https://www.gologotype.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ]
  
  // Allow any vercel deployment URL for development/staging
  const isVercelDeploy = origin && (
    origin.includes('.vercel.app') || 
    origin.includes('gologotype')
  )
  
  if (allowedOrigins.includes(origin) || isVercelDeploy) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      text,
      fontFamily,
      fontWeight = '400',
      fontSize = 120,
      letterSpacing = 0,
      color = '#000000'
    } = req.body

    // Validate input
    if (!text || !fontFamily) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Text and fontFamily are required'
      })
    }

    // Input sanitization
    if (typeof text !== 'string' || text.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid text input'
      })
    }

    // Validate font family against whitelist
    const allowedFonts = [
      'Inter', 'Playfair Display', 'Roboto', 'Montserrat', 'Lato', 'Open Sans', 
      'Poppins', 'Source Sans Pro', 'Merriweather', 'Oswald', 'Outfit', 'Work Sans', 
      'DM Sans', 'DM Serif Text', 'Nunito Sans', 'Quicksand', 'Lexend Deca', 'Questrial',
      'Funnel Sans', 'Funnel Display', 'Onest', 'Gabarito', 'Figtree', 'Tomorrow', 'Sniglet'
    ]
    if (!allowedFonts.some(font => fontFamily.toLowerCase().includes(font.toLowerCase()))) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Font not supported'
      })
    }

    console.log(`Converting "${text}" using ${fontFamily} ${fontWeight} to vector paths`)
    console.log(`Font URL will be: https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${fontWeight}&display=swap`)

    // Convert font to vector paths
    const vectorResult = await convertFontToVectorPaths({
      text,
      fontFamily,
      fontWeight,
      fontSize,
      letterSpacing,
      color
    })

    res.status(200).json({
      success: true,
      data: vectorResult
    })

  } catch (error) {
    console.error('Font-to-path conversion error:', error)
    console.error('Error stack:', error.stack)
    console.error('Font details:', { fontFamily, fontWeight, text: text.substring(0, 20) })
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: `Font conversion failed: ${error.message}`
    })
  }
}

async function convertFontToVectorPaths({ text, fontFamily, fontWeight, fontSize, letterSpacing, color }) {
  try {
    // Download Google Font CSS to get font file URL - use older browser UA to get TTF/WOFF instead of WOFF2
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${fontWeight}&display=swap`
    
    const cssResponse = await fetch(fontUrl, {
      headers: {
        // Use older browser UA to get TTF/WOFF formats instead of WOFF2
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0'
      }
    })

    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch font CSS: ${cssResponse.status}`)
    }

    const cssText = await cssResponse.text()
    console.log('Font CSS fetched successfully')
    console.log('CSS content preview:', cssText.substring(0, 200))

    // Extract font file URLs from CSS and prioritize supported formats
    const fontUrls = []
    const urlMatches = cssText.matchAll(/url\(([^)]+\.(ttf|otf|woff|woff2))\)/g)
    
    for (const match of urlMatches) {
      const url = match[1]
      const format = match[2].toLowerCase()
      fontUrls.push({ url, format })
    }

    // Prioritize formats: TTF > OTF > WOFF > WOFF2 (opentype.js compatibility)
    const formatPriority = { 'ttf': 1, 'otf': 2, 'woff': 3, 'woff2': 4 }
    fontUrls.sort((a, b) => formatPriority[a.format] - formatPriority[b.format])

    if (fontUrls.length === 0) {
      throw new Error('No font file URLs found in CSS')
    }

    const selectedFont = fontUrls[0]
    const fontFileUrl = selectedFont.url
    console.log(`Selected font format: ${selectedFont.format}, URL: ${fontFileUrl}`)

    // Download the font file
    const fontResponse = await fetch(fontFileUrl)
    if (!fontResponse.ok) {
      throw new Error(`Failed to download font file: ${fontResponse.status}`)
    }

    const fontBuffer = await fontResponse.arrayBuffer()
    console.log(`Font file downloaded: ${fontBuffer.byteLength} bytes, format: ${selectedFont.format}`)

    // Validate format before parsing
    if (selectedFont.format === 'woff2') {
      throw new Error('WOFF2 format not supported by opentype.js. Please try a different font or contact support.')
    }

    // Parse font with opentype.js
    const font = opentype.parse(fontBuffer)
    console.log(`Font parsed successfully: ${font.names.fontFamily?.en || 'Unknown'}`)

    // Convert text to vector paths with proper letter spacing and orientation
    let totalWidth = 0
    let paths = []
    let currentX = 0
    
    // Process each character individually for better letter spacing control
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const glyph = font.charToGlyph(char)
      
      if (glyph && glyph.path) {
        // Check if character is a trademark symbol and scale it down (match CSS styling)
        const isTrademarkSymbol = ['™', '®', '©'].includes(char)
        const charFontSize = isTrademarkSymbol ? fontSize * 0.35 : fontSize  // Match CSS: 35%
        const yOffset = isTrademarkSymbol ? fontSize * -0.5 : 0 // Match CSS: -50% positioning
        
        // Get character path at proper size and position
        const charPath = glyph.getPath(currentX, yOffset, charFontSize)
        const charPathData = charPath.toPathData(2)
        
        if (charPathData && charPathData !== 'M0,0Z') {
          paths.push(charPathData)
        }
        
        // Calculate advance width with letter spacing (use smaller width for trademark symbols)
        const baseAdvanceWidth = glyph.advanceWidth * (fontSize / font.unitsPerEm)
        const scaledAdvanceWidth = isTrademarkSymbol ? baseAdvanceWidth * 0.35 : baseAdvanceWidth  // Match CSS: 35%
        currentX += scaledAdvanceWidth + (i < text.length - 1 ? letterSpacing : 0)
      }
    }
    
    // Combine all character paths
    const pathData = paths.join(' ')
    
    if (!pathData || pathData === 'M0,0Z') {
      throw new Error('No vector paths generated from text')
    }

    console.log(`Vector paths generated: ${pathData.length} characters, ${paths.length} glyphs`)

    // Calculate proper dimensions
    totalWidth = currentX
    const ascender = font.ascender * (fontSize / font.unitsPerEm)
    const descender = font.descender * (fontSize / font.unitsPerEm)
    
    const padding = 20
    const width = Math.ceil(totalWidth + (padding * 2))
    const height = Math.ceil(ascender - descender + (padding * 2))
    
    // Position text properly (ascender from top, no flipping needed)
    const offsetX = padding
    const offsetY = padding + ascender
    
    // Generate clean vector SVG with proper coordinate system
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${offsetX}, ${offsetY})">
    <path d="${pathData}" fill="${color}"/>
  </g>
</svg>`

    return {
      svg,
      pathData,
      width,
      height,
      isVector: true,
      metrics: {
        totalWidth,
        fontSize,
        letterSpacing,
        fontFamily: font.names.fontFamily?.en || fontFamily,
        ascender,
        descender
      }
    }

  } catch (error) {
    console.error('Vector conversion failed:', error)
    console.error('Vector conversion error details:', {
      fontFamily,
      fontWeight, 
      message: error.message,
      stack: error.stack
    })
    throw new Error(`Vector conversion failed for ${fontFamily} ${fontWeight}: ${error.message}`)
  }
}