import { useState, useRef, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group'
import { Slider } from './components/ui/slider'
import { Download, Share2 } from 'lucide-react'
import JSZip from 'jszip'

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const fonts = [
  'Inter',
  'Playfair Display',
  'Roboto',
  'Montserrat',
  'Lato',
  'Open Sans',
  'Poppins',
  'Source Sans Pro',
  'Merriweather',
  'Oswald',
  'Outfit',
  'Work Sans',
  'DM Sans',
  'DM Serif Text',
  'Nunito Sans',
  'Quicksand',
  'Lexend Deca',
  'Questrial',
  'Funnel Sans',
  'Funnel Display',
  'Onest',
  'Gabarito',
  'Figtree',
  'Tomorrow',
  'Sniglet'
]

const fontWeightsByFamily: { [key: string]: { value: string; label: string }[] } = {
  'Inter': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Playfair Display': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Roboto': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '700', label: 'Bold' }
  ],
  'Montserrat': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Lato': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '700', label: 'Bold' }
  ],
  'Open Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Poppins': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Source Sans Pro': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Merriweather': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '700', label: 'Bold' }
  ],
  'Oswald': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Outfit': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Work Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'DM Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'DM Serif Text': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Nunito Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Quicksand': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Lexend Deca': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Questrial': [
    { value: '400', label: 'Regular' }
  ],
  'Funnel Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Funnel Display': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Onest': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Gabarito': [
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Figtree': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Tomorrow': [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
  ],
  'Sniglet': [
    { value: '400', label: 'Regular' },
    { value: '800', label: 'Extra Bold' }
  ]
}

function App() {
  const [brandName, setBrandName] = useState('')
  const [selectedFont, setSelectedFont] = useState('Inter')
  const [fontWeight, setFontWeight] = useState('600')
  const [letterSpacing, setLetterSpacing] = useState(-3)
  const [textCase, setTextCase] = useState('normal')
  const [logoColor, setLogoColor] = useState('#111827')
  const [colorInputValue, setColorInputValue] = useState('111827')
  const [trademarkSymbol, setTrademarkSymbol] = useState('none')
  const [previewFontSize, setPreviewFontSize] = useState('4rem')
  const logoRef = useRef<HTMLDivElement>(null)
  const mobileLogoRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileContainerRef = useRef<HTMLDivElement>(null)

  const getLetterSpacingValue = (spacing: number) => {
    if (spacing === 0) return 'normal'
    return `${spacing / 100}em`
  }

  const getTextTransform = (caseType: string) => {
    return caseType === 'uppercase' ? 'uppercase' : 'none'
  }

  const getTrademarkSymbol = (symbol: string) => {
    switch (symbol) {
      case 'r': return '®'
      case 'c': return '©'
      case 'tm': return '™'
      default: return ''
    }
  }

  const handleColorInputChange = (value: string) => {
    // Remove any non-hex characters and limit to 6 characters
    const cleanValue = value.replace(/[^a-fA-F0-9]/g, '').slice(0, 6)
    setColorInputValue(cleanValue)
    
    // Convert to full hex color
    let fullHexColor = ''
    
    if (cleanValue.length === 3) {
      // Convert 3-digit hex to 6-digit (e.g., "f0a" → "ff00aa")
      fullHexColor = cleanValue.split('').map(char => char + char).join('')
    } else if (cleanValue.length === 6) {
      // Use as-is for 6-digit hex
      fullHexColor = cleanValue
    } else if (cleanValue.length > 0) {
      // For incomplete hex codes, pad with current color's digits or zeros
      const currentHex = logoColor.slice(1) // Remove # from current color
      fullHexColor = (cleanValue + currentHex + '000000').slice(0, 6)
    }
    
    // Update the actual color if we have a valid hex
    if (fullHexColor.length === 6) {
      setLogoColor(`#${fullHexColor}`)
    }
  }

  const handleColorPickerChange = (value: string) => {
    setLogoColor(value)
    // Update the input field to show just the hex code without #
    setColorInputValue(value.slice(1))
  }

  const getFullLogoText = () => {
    const displayName = brandName || 'Your Brand'
    const displayText = textCase === 'uppercase' ? displayName.toUpperCase() : displayName
    const symbol = getTrademarkSymbol(trademarkSymbol)
    return displayText + symbol
  }

  const getFontClass = (font: string) => {
    const fontMap: { [key: string]: string } = {
      'Inter': 'font-inter',
      'Playfair Display': 'font-playfair',
      'Roboto': 'font-roboto',
      'Montserrat': 'font-montserrat',
      'Lato': 'font-lato',
      'Open Sans': 'font-opensans',
      'Poppins': 'font-poppins',
      'Source Sans Pro': 'font-sourcesans',
      'Merriweather': 'font-merriweather',
      'Oswald': 'font-oswald',
      'Outfit': 'font-outfit',
      'Work Sans': 'font-worksans',
      'DM Sans': 'font-dmsans',
      'DM Serif Text': 'font-dmserif',
      'Nunito Sans': 'font-nunitosans',
      'Quicksand': 'font-quicksand',
      'Lexend Deca': 'font-lexenddeca',
      'Questrial': 'font-questrial',
      'Funnel Sans': 'font-funnelsans',
      'Funnel Display': 'font-funneldisplay',
      'Onest': 'font-onest',
      'Gabarito': 'font-gabarito',
      'Figtree': 'font-figtree',
      'Tomorrow': 'font-tomorrow',
      'Sniglet': 'font-sniglet'
    }
    return fontMap[font] || 'font-inter'
  }

  const calculateOptimalFontSize = () => {
    // Use mobile container if it's visible, otherwise desktop
    const activeContainer = mobileContainerRef.current?.offsetParent ? mobileContainerRef.current : containerRef.current
    const activeLogo = mobileContainerRef.current?.offsetParent ? mobileLogoRef.current : logoRef.current
    
    if (!activeContainer || !activeLogo) return

    const containerWidth = activeContainer.offsetWidth - 64 // Account for padding
    const displayText = getFullLogoText()
    
    // Create a temporary canvas to measure text width
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Start with a base font size and scale down if needed
    let fontSize = 64 // Start with 64px (4rem)
    const minFontSize = 16

    while (fontSize >= minFontSize) {
      ctx.font = `${fontWeight} ${fontSize}px "${selectedFont}", sans-serif`
      
      // Calculate text width including letter spacing
      let textWidth = 0
      if (letterSpacing !== 0) {
        const spacingValue = letterSpacing * 1.2
        for (let i = 0; i < displayText.length; i++) {
          const char = displayText[i]
          const charWidth = ctx.measureText(char).width
          textWidth += charWidth
          if (i < displayText.length - 1) textWidth += spacingValue
        }
      } else {
        textWidth = ctx.measureText(displayText).width
      }

      if (textWidth <= containerWidth) {
        setPreviewFontSize(`${fontSize}px`)
        return
      }
      
      fontSize -= 2 // Decrease by 2px each iteration
    }
    
    setPreviewFontSize(`${minFontSize}px`)
  }

  useEffect(() => {
    calculateOptimalFontSize()
  }, [brandName, selectedFont, fontWeight, letterSpacing, textCase, trademarkSymbol])

  useEffect(() => {
    const handleResize = () => calculateOptimalFontSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [brandName, selectedFont, fontWeight, letterSpacing, textCase, trademarkSymbol])

  const generateBrandPackage = async () => {
    if (!brandName.trim()) {
      alert('Please enter a brand name first!')
      return
    }

    try {
      // Track download event in Google Analytics
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'download_brand_package', {
          event_category: 'Brand Package',
          event_label: selectedFont,
          font_family: selectedFont,
          font_weight: fontWeight,
          brand_name_length: brandName.length,
          letter_spacing: letterSpacing,
          text_case: textCase,
          trademark_symbol: trademarkSymbol,
          logo_color: logoColor
        })
      }

      console.log('Starting brand package generation...')
      const displayText = textCase === 'uppercase' ? brandName.toUpperCase() : brandName
      const fullText = displayText + (getTrademarkSymbol(trademarkSymbol) || '')
      
      // Capture state variables for use in nested functions
      const currentFont = selectedFont
      const currentWeight = fontWeight
      const currentLetterSpacing = letterSpacing
      
      const zip = new JSZip()
      
      // Create folders
      const pngFolder = zip.folder('PNG')
      const svgFolder = zip.folder('SVG')
      
      // Use working vector API endpoint instead of client-side conversion
      const createClientVectorSVG = async (color: string): Promise<string> => {
        try {
          console.log('Using vector API for font-to-path conversion:', selectedFont, fontWeight)
          
          // Use the dedicated vector-api endpoint 
          const apiUrl = 'https://vector-cpxtftl6a-oskarglausers-projects.vercel.app/api/convert';
          
          const requestBody = {
            text: fullText,
            fontFamily: currentFont,
            fontWeight: currentWeight,
            fontSize: 120,
            letterSpacing: currentLetterSpacing,
            color: color
          }
          
          console.log('API Request Details:', {
            url: apiUrl,
            body: requestBody
          })
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('API Error Response:', errorText)
            let errorMessage = `API request failed: ${response.status}`
            try {
              const errorJson = JSON.parse(errorText)
              if (errorJson.message) {
                errorMessage = errorJson.message
              }
            } catch (e) {
              // errorText is not JSON, use as-is
              if (errorText) errorMessage = errorText
            }
            throw new Error(errorMessage)
          }

          const result = await response.json()
          
          if (!result.success) {
            console.error('Vector conversion failed:', result)
            throw new Error(result.message || 'Vector conversion failed')
          }

          console.log('Vector API conversion successful')
          console.log('SVG length:', result.data.svg.length)
          return result.data.svg

        } catch (error) {
          console.error('Vector API conversion failed:', error)
          console.error('API Error details:', {
            status: (error as any).status,
            message: (error as any).message,
            response: (error as any).response
          })
          throw error
        }
      }
      
      // Helper function to create canvas-based PNG and text-based SVG
      const createLogoAssets = async (color: string) => {
        // Create canvas for PNG generation (using loaded fonts)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas context not available')
        }

        const fontSize = 120
        ctx.font = `${currentWeight} ${fontSize}px "${currentFont}", Arial, sans-serif`
        
        // Measure actual text width accounting for trademark symbol scaling
        let textWidth = 0
        const letterSpacingValue = currentLetterSpacing * 1.2
        
        for (let i = 0; i < fullText.length; i++) {
          const char = fullText[i]
          const isTrademarkSymbol = ['™', '®', '©'].includes(char)
          
          if (isTrademarkSymbol) {
            // Trademark symbols are scaled to 35% width
            const normalWidth = ctx.measureText(char).width
            textWidth += normalWidth * 0.35
          } else {
            textWidth += ctx.measureText(char).width
          }
          
          // Add letter spacing
          if (currentLetterSpacing !== 0 && i < fullText.length - 1) {
            textWidth += letterSpacingValue
          }
        }

        // Calculate proper dimensions with minimal padding
        const padding = 20
        const canvasWidth = textWidth + (padding * 2)
        const canvasHeight = fontSize * 1.4 + (padding * 2)
        
        // Set up high-resolution canvas
        const scale = 2
        canvas.width = canvasWidth * scale
        canvas.height = canvasHeight * scale
        ctx.scale(scale, scale)
        
        // Set font and style
        ctx.font = `${currentWeight} ${fontSize}px "${currentFont}", Arial, sans-serif`
        ctx.fillStyle = color
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        
        // Draw text with character-by-character rendering for trademark symbol scaling
        const canvasLetterSpacing = currentLetterSpacing * 1.2
        let currentX = padding
        // Position baseline properly (roughly 80% down from top for most fonts)
        const baseY = canvasHeight * 0.7
        
        for (let i = 0; i < fullText.length; i++) {
          const char = fullText[i]
          const isTrademarkSymbol = ['™', '®', '©'].includes(char)
          
          if (isTrademarkSymbol) {
            // Scale trademark symbol to 35% like CSS and SVG
            const tmFontSize = fontSize * 0.35
            const tmY = baseY - (fontSize * 0.5)  // Raise it up
            
            ctx.font = `${currentWeight} ${tmFontSize}px "${currentFont}", Arial, sans-serif`
            ctx.fillText(char, currentX, tmY)
            
            // Use scaled width (35% of normal width)
            ctx.font = `${currentWeight} ${fontSize}px "${currentFont}", Arial, sans-serif`
            const normalWidth = ctx.measureText(char).width
            currentX += normalWidth * 0.35
          } else {
            // Regular character
            ctx.font = `${currentWeight} ${fontSize}px "${currentFont}", Arial, sans-serif`
            ctx.fillText(char, currentX, baseY)
            currentX += ctx.measureText(char).width
          }
          
          // Add letter spacing
          if (currentLetterSpacing !== 0 && i < fullText.length - 1) {
            currentX += canvasLetterSpacing
          }
        }

        // Convert canvas to blob for PNG
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create PNG'))
          }, 'image/png', 1.0)
        })

        // Create true vector SVG using client-side conversion
        const svgFromVector = await createClientVectorSVG(color)

        return {
          png: pngBlob,
          svg: svgFromVector,
          width: Math.ceil(canvasWidth),
          height: Math.ceil(canvasHeight)
        }
      }

      // Helper function to add background to SVG
      const addBackgroundToSVG = (svgString: string, backgroundColor: string) => {
        return svgString.replace(
          '<svg',
          `<svg style="background-color: ${backgroundColor}"`
        )
      }

      // Generate all variants
      console.log('Generating dark variants...')
      const darkAssets = await createLogoAssets(logoColor)
      console.log('Dark assets generated:', {
        svgLength: darkAssets.svg.length,
        pngSize: darkAssets.png.size,
        width: darkAssets.width,
        height: darkAssets.height
      })
      const darkSVG = darkAssets.svg
      const darkSVGWhiteBG = addBackgroundToSVG(darkAssets.svg, '#ffffff')
      const darkPNG = darkAssets.png
      
      console.log('Generating light variants...')
      const lightAssets = await createLogoAssets('#ffffff')
      console.log('Light assets generated:', {
        svgLength: lightAssets.svg.length,
        pngSize: lightAssets.png.size,
        width: lightAssets.width,
        height: lightAssets.height
      })
      const lightSVG = lightAssets.svg
      const lightSVGDarkBG = addBackgroundToSVG(lightAssets.svg, '#000000')
      const lightPNG = lightAssets.png

      // Add PNG files (using canvas-generated PNGs with correct fonts)
      pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-dark.png`, darkPNG)
      pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-light.png`, lightPNG)

      // Add SVG files
      svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-dark.svg`, darkSVG)
      svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-light.svg`, lightSVG)
      svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-dark-white-bg.svg`, darkSVGWhiteBG)
      svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-light-dark-bg.svg`, lightSVGDarkBG)


      // Create simple brand info text file
      const brandInfo = `${brandName} Brand Package

FILES INCLUDED:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-dark.png (for light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-light.png (for dark backgrounds)  
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-dark.svg (vector, light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-light.svg (vector, dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-dark-white-bg.svg (with white background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-light-dark-bg.svg (with dark background)

BRAND SPECIFICATIONS:
Font: ${selectedFont}
Weight: ${fontWeight}
Letter Spacing: ${letterSpacing}px
Case: ${textCase === 'uppercase' ? 'Uppercase' : 'Standard Case'}
Primary Color: ${logoColor.toUpperCase()}
RGB: rgb(${parseInt(logoColor.slice(1, 3), 16)}, ${parseInt(logoColor.slice(3, 5), 16)}, ${parseInt(logoColor.slice(5, 7), 16)})
CMYK: ${(() => {
        const r = parseInt(logoColor.slice(1, 3), 16) / 255
        const g = parseInt(logoColor.slice(3, 5), 16) / 255
        const b = parseInt(logoColor.slice(5, 7), 16) / 255
        const k = 1 - Math.max(r, g, b)
        const c = k === 1 ? 0 : (1 - r - k) / (1 - k)
        const m = k === 1 ? 0 : (1 - g - k) / (1 - k)
        const y = k === 1 ? 0 : (1 - b - k) / (1 - k)
        return `C${Math.round(c * 100)} M${Math.round(m * 100)} Y${Math.round(y * 100)} K${Math.round(k * 100)}`
      })()}

USAGE GUIDELINES:
✓ Use dark logos on light backgrounds
✓ Use light logos on dark backgrounds  
✓ Use SVG files for websites and scalable applications
✓ Use PNG files for documents and presentations
✓ Maintain clear space around logo
✓ Scale proportionally - don't stretch or distort

✗ Don't change colors, fonts, or spacing
✗ Don't add effects or modify the logo
✗ Don't use on busy backgrounds

PROFESSIONAL QUALITY:
All files contain true vector font outlines for professional reproduction at any size. No additional fonts required.

Generated with GoLogotype: https://gologotype.com
`

      // Add brand info to package
      zip.file('Brand-Info.txt', brandInfo)
      console.log('Added Brand-Info.txt to zip')

      // Generate and download zip
      console.log('Creating zip file...')
      console.log('ZIP structure:', Object.keys(zip.files))
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      console.log('ZIP blob generated:', zipBlob.size, 'bytes')
      
      const fileName = `${brandName.replace(/\s+/g, '-').toLowerCase()}-brand-package.zip`
      console.log('Downloading as:', fileName)
      
      const link = document.createElement('a')
      link.download = fileName
      link.href = URL.createObjectURL(zipBlob)
      document.body.appendChild(link)  // Add to DOM for better browser compatibility
      link.click()
      document.body.removeChild(link)  // Clean up
      
      // Track successful download completion
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'download_completed', {
          event_category: 'Brand Package',
          event_label: `${selectedFont} - ${fontWeight}`,
          value: 1
        })
      }
      
      console.log('Brand package downloaded successfully!')
      
    } catch (error) {
      console.error('Brand package generation failed:', error)
      console.error('Error details:', {
        message: (error as any).message,
        stack: (error as any).stack,
        name: (error as any).name
      })
      alert(`Failed to generate brand package: ${(error as any).message}. Check console for details.`)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: 'GoLogotype - Professional Logo Generator',
      text: 'Create professional logos instantly with true vector SVG output. Perfect for startups and developers!',
      url: window.location.href
    }

    // Track share event
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'share', {
        event_category: 'Social',
        event_label: 'Share Button',
        method: typeof navigator.share === 'function' ? 'native_share' : 'clipboard'
      })
    }

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(shareData)
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(shareData.url)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      // Final fallback: show URL in prompt
      prompt('Copy this link to share:', shareData.url)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-2">
            <img 
              src="/gologotype-dark.svg" 
              alt="GoLogotype" 
              className="h-8 sm:h-10"
            />
          </div>
          <p className="text-sm sm:text-base text-gray-600">Logo generator with true vector SVG output</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Mobile: Preview on top, compact */}
          <section ref={mobileContainerRef} className="lg:hidden bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-[200px]" aria-label="Logo preview">
            <h2 className="sr-only">Logo Preview</h2>
            <div className="text-center w-full">
              <div
                ref={mobileLogoRef}
                className={`select-none ${getFontClass(selectedFont)}`}
                style={{
                  fontSize: previewFontSize,
                  fontWeight: fontWeight,
                  letterSpacing: getLetterSpacingValue(letterSpacing),
                  textTransform: getTextTransform(textCase) as any,
                  color: logoColor,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {textCase === 'uppercase' ? (brandName || 'Your Brand').toUpperCase() : (brandName || 'Your Brand')}
                {trademarkSymbol !== 'none' && (
                  <span
                    style={{
                      fontSize: `calc(${previewFontSize} * 0.35)`,
                      verticalAlign: 'baseline',
                      marginLeft: '0.02em',
                      lineHeight: 1,
                      position: 'relative',
                      top: `calc(${previewFontSize} * -0.5)`,
                      display: 'inline-block',
                    }}
                  >
                    {getTrademarkSymbol(trademarkSymbol)}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white p-4 sm:p-6 font-inter" aria-label="Logo customization controls">
            <h2 className="sr-only">Logo Customization Options</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name" className="text-sm font-medium text-gray-700">
                  Brand Name
                </Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter your brand name"
                  className="text-base border-gray-300 focus:border-gray-900 h-10 sm:h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Font</Label>
                  <Select value={selectedFont} onValueChange={(font) => {
                    setSelectedFont(font)
                    const availableWeights = fontWeightsByFamily[font] || []
                    if (availableWeights.length > 0 && !availableWeights.find(w => w.value === fontWeight)) {
                      setFontWeight(availableWeights[0].value)
                    }
                  }}>
                    <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm h-10 sm:h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Weight</Label>
                  <Select value={fontWeight} onValueChange={setFontWeight}>
                    <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm h-10 sm:h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(fontWeightsByFamily[selectedFont] || []).map((weight) => (
                        <SelectItem key={weight.value} value={weight.value}>
                          {weight.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Letter Spacing</Label>
                  <div className="px-1">
                    <Slider
                      value={[letterSpacing]}
                      onValueChange={(value) => setLetterSpacing(value[0])}
                      min={-10}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Tight</span>
                      <span>Normal</span>
                      <span>Wide</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Case</Label>
                  <RadioGroup value={textCase} onValueChange={setTextCase} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="case-normal" className="h-4 w-4" />
                      <Label htmlFor="case-normal" className="text-sm cursor-pointer text-gray-600">Normal (Aa)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="uppercase" id="uppercase" className="h-4 w-4" />
                      <Label htmlFor="uppercase" className="text-sm cursor-pointer text-gray-600">Upper (AA)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Trademark</Label>
                <Select value={trademarkSymbol} onValueChange={setTrademarkSymbol}>
                  <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="r">® (Registered)</SelectItem>
                    <SelectItem value="c">© (Copyright)</SelectItem>
                    <SelectItem value="tm">™ (Trademark)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Logo Color</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs font-mono pointer-events-none">
                      #
                    </div>
                    <Input
                      value={colorInputValue}
                      onChange={(e) => handleColorInputChange(e.target.value)}
                      placeholder="f00 or ff0000"
                      className="text-xs border-gray-300 focus:border-gray-900 font-mono h-10 sm:h-8 pl-6"
                      maxLength={6}
                    />
                  </div>
                  <input
                    type="color"
                    value={logoColor}
                    onChange={(e) => handleColorPickerChange(e.target.value)}
                    className="w-10 h-10 sm:w-8 sm:h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">3 or 6 digit hex color (e.g., f00, ff0000)</p>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Button onClick={generateBrandPackage} className="w-full gap-2 bg-gray-900 hover:bg-gray-800 h-12">
                  <Download className="w-4 h-4" />
                  Download Brand Package
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Includes PNG, SVG files + basic brand guidelines
                </p>
                <Button 
                  onClick={handleShare} 
                  variant="outline" 
                  className="w-full gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 h-10"
                >
                  <Share2 className="w-4 h-4" />
                  Share GoLogotype
                </Button>
              </div>
            </div>
          </section>

          {/* Desktop: Preview on right side */}
          <section ref={containerRef} className="hidden lg:flex bg-gray-50 rounded-lg p-4 sm:p-8 items-center justify-center min-h-[400px] sm:min-h-[500px]" aria-label="Logo preview">
            <h2 className="sr-only">Logo Preview</h2>
            <div className="text-center w-full">
              <div
                className={`select-none ${getFontClass(selectedFont)}`}
                style={{
                  fontSize: previewFontSize,
                  fontWeight: fontWeight,
                  letterSpacing: getLetterSpacingValue(letterSpacing),
                  textTransform: getTextTransform(textCase) as any,
                  color: logoColor,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {textCase === 'uppercase' ? (brandName || 'Your Brand').toUpperCase() : (brandName || 'Your Brand')}
                {trademarkSymbol !== 'none' && (
                  <span
                    style={{
                      fontSize: `calc(${previewFontSize} * 0.35)`,
                      verticalAlign: 'baseline',
                      marginLeft: '0.02em',
                      lineHeight: 1,
                      position: 'relative',
                      top: `calc(${previewFontSize} * -0.5)`,
                      display: 'inline-block',
                    }}
                  >
                    {getTrademarkSymbol(trademarkSymbol)}
                  </span>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* SEO Footer */}
        <footer className="mt-24 bg-gray-50 rounded-lg p-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Professional Logo Generator for Modern Brands
            </h2>
            
            <div className="prose prose-gray mx-auto text-gray-600 leading-relaxed">
              <p className="text-lg mb-4">
                Create stunning, professional logos in seconds with our advanced logotype maker. 
                Perfect for startups, agencies, and creative professionals who need high-quality 
                brand assets quickly and efficiently.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">True Vector Output</h3>
                  <p className="text-sm">
                    Export genuine vector SVG files with outlined font paths - not embedded text. 
                    Perfect for print, web, and scalable brand applications.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Professional Features</h3>
                  <p className="text-sm">
                    Choose from premium Google Fonts, adjust letter spacing, add trademark symbols, 
                    and export in multiple formats with transparent backgrounds.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Perfect for Developers</h3>
                  <p className="text-sm">
                    Ideal for creating logos for your next coding project, startup launch, 
                    or client work. Generate brand-ready assets in seconds.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Trademark Symbols</h3>
                  <p className="text-sm">
                    <strong>™</strong> - Unregistered trademark for any brand name<br/>
                    <strong>®</strong> - Registered trademark (requires official registration)<br/>
                    <strong>©</strong> - Copyright symbol for creative works
                  </p>
                </div>
              </div>
              
              <p className="text-center mt-6 text-gray-500 text-sm">
                Whether you're building the next big SaaS platform, launching a creative agency, 
                or developing an innovative app, our logo generator provides the professional 
                branding assets you need. Perfect for creating the logo for your next vibe coded project.
              </p>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 space-y-3">
                <p>
                  <strong className="text-gray-900">Need help developing your brand?</strong> Contact{' '}
                  <a 
                    href="https://glauser.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:underline font-medium"
                  >
                    Glauser Creative
                  </a>
                  {' '}for professional branding and design services.
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-gray-400">
                  <span>This logo generator is a vibe coded project by Glauser Creative.</span>
                  <span>
                    Have suggestions for improving this tool?{' '}
                    <a 
                      href="mailto:oskar@glauser.com" 
                      className="text-gray-600 hover:text-gray-900 hover:underline"
                    >
                      Email oskar@glauser.com
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
