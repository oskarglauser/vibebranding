import { useState, useRef, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group'
import { Slider } from './components/ui/slider'
import { Download, Share2, ChevronDown, RefreshCw } from 'lucide-react'
import JSZip from 'jszip'

// Import shared constants and utilities
import { FONTS, FONT_WEIGHTS_BY_FAMILY } from './constants/fonts'
import { API_CONFIG } from './constants/config'
import {
  getTrademarkSymbol,
  getLetterSpacingValue,
  getTextTransform,
  type TrademarkSymbolType,
  type TextCaseType
} from './utils/textUtils'
import { getFontClass } from './utils/fontUtils'
import { hexToPantone, formatPantone } from './utils/pantoneUtils'
import { FAQItem } from './components/FAQItem'
import { generateSymbol } from './utils/symbolGenerators'
import { generateSeed } from './utils/seedUtils'
import type { SymbolMode, SymbolPlacement } from './types/symbol'

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

// Font constants are now imported from constants/fonts.ts

function App() {
  const [brandName, setBrandName] = useState('')
  const [selectedFont, setSelectedFont] = useState('Inter')
  const [fontWeight, setFontWeight] = useState('600')
  const [letterSpacing, setLetterSpacing] = useState(-3)
  const [textCase, setTextCase] = useState<TextCaseType>('normal')
  const [logoColor, setLogoColor] = useState('#111827')
  const [colorInputValue, setColorInputValue] = useState('111827')
  const [trademarkSymbol, setTrademarkSymbol] = useState<TrademarkSymbolType>('none')
  const [previewFontSize, setPreviewFontSize] = useState('4rem')
  
  // Tagline states
  const [taglineText, setTaglineText] = useState('')
  const [taglineFont, setTaglineFont] = useState('Inter')
  const [taglineFontWeight, setTaglineFontWeight] = useState('400')
  const [taglineLetterSpacing, setTaglineLetterSpacing] = useState(0)
  const [taglineTextCase, setTaglineTextCase] = useState<TextCaseType>('normal')
  const [taglineSize, setTaglineSize] = useState(30) // Percentage of logo size
  const [taglineDistance, setTaglineDistance] = useState(20) // Distance between logo and tagline as percentage
  const [taglineColor, setTaglineColor] = useState('#111827') // Default to same as logo
  const [taglineColorInputValue, setTaglineColorInputValue] = useState('111827')
  const [showTaglineSection, setShowTaglineSection] = useState(false)
  const [showLogoSection, setShowLogoSection] = useState(true)

  // Symbol states
  const [showSymbolSection, setShowSymbolSection] = useState(false)
  const [symbolMode, setSymbolMode] = useState<SymbolMode>('none')
  const [symbolFont, setSymbolFont] = useState('Inter')
  const [symbolPlacement, setSymbolPlacement] = useState<SymbolPlacement>('above')
  const [symbolSize, setSymbolSize] = useState(100) // Percentage (100% = same size as text)
  const [symbolDistance, setSymbolDistance] = useState(20) // Percentage
  const [symbolColor, setSymbolColor] = useState('#111827')
  const [symbolColorInputValue, setSymbolColorInputValue] = useState('111827')
  const [symbolSeed, setSymbolSeed] = useState(() => generateSeed())
  const [symbolSvg, setSymbolSvg] = useState('')

  const logoRef = useRef<HTMLDivElement>(null)
  const mobileLogoRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileContainerRef = useRef<HTMLDivElement>(null)
  const taglineInputRef = useRef<HTMLInputElement>(null)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved !== null) return JSON.parse(saved)
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

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
      // Update tagline color to match logo color by default
      setTaglineColor(`#${fullHexColor}`)
      setTaglineColorInputValue(fullHexColor)
    }
  }

  const handleColorPickerChange = (value: string) => {
    setLogoColor(value)
    // Update the input field to show just the hex code without #
    setColorInputValue(value.slice(1))
    // Update tagline color to match logo color by default
    setTaglineColor(value)
    setTaglineColorInputValue(value.slice(1))
  }

  const handleTaglineColorInputChange = (value: string) => {
    // Remove any non-hex characters and limit to 6 characters
    const cleanValue = value.replace(/[^a-fA-F0-9]/g, '').slice(0, 6)
    setTaglineColorInputValue(cleanValue)
    
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
      const currentHex = taglineColor.slice(1) // Remove # from current color
      fullHexColor = (cleanValue + currentHex + '000000').slice(0, 6)
    }
    
    // Update the actual color if we have a valid hex
    if (fullHexColor.length === 6) {
      setTaglineColor(`#${fullHexColor}`)
    }
  }

  const handleTaglineColorPickerChange = (value: string) => {
    setTaglineColor(value)
    // Update the input field to show just the hex code without #
    setTaglineColorInputValue(value.slice(1))
  }

  const handleSymbolColorInputChange = (value: string) => {
    // Remove any non-hex characters and limit to 6 characters
    const cleanValue = value.replace(/[^a-fA-F0-9]/g, '').slice(0, 6)
    setSymbolColorInputValue(cleanValue)

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
      const currentHex = symbolColor.slice(1) // Remove # from current color
      fullHexColor = (cleanValue + currentHex + '000000').slice(0, 6)
    }

    // Update the actual color if we have a valid hex
    if (fullHexColor.length === 6) {
      setSymbolColor(`#${fullHexColor}`)
    }
  }

  const handleSymbolColorPickerChange = (value: string) => {
    setSymbolColor(value)
    // Update the input field to show just the hex code without #
    setSymbolColorInputValue(value.slice(1))
  }

  const getFullLogoText = () => {
    const displayName = brandName || 'Your Brand'
    const displayText = textCase === 'uppercase' ? displayName.toUpperCase() : displayName
    const symbol = getTrademarkSymbol(trademarkSymbol as TrademarkSymbolType)
    return displayText + symbol
  }

  const getFullTaglineText = () => {
    if (!taglineText.trim()) return ''
    const displayText = taglineTextCase === 'uppercase' ? taglineText.toUpperCase() : taglineText
    return displayText
  }

  const handleLogoSectionToggle = () => {
    if (!showLogoSection && showTaglineSection) {
      // If opening logo section and tagline is open, close tagline
      setShowTaglineSection(false)
    }
    setShowLogoSection(!showLogoSection)
  }

  const handleTaglineSectionToggle = () => {
    const isOpening = !showTaglineSection

    if (isOpening && showLogoSection) {
      // If opening tagline section and logo is open, close logo
      setShowLogoSection(false)
    }
    if (isOpening && showSymbolSection) {
      // If opening tagline section and symbol is open, close symbol
      setShowSymbolSection(false)
    }
    setShowTaglineSection(isOpening)

    // On mobile, scroll to tagline input when opening the section
    if (isOpening && window.innerWidth < 1024) { // lg breakpoint is 1024px
      setTimeout(() => {
        taglineInputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100) // Small delay to allow section to expand
    }
  }

  const handleSymbolSectionToggle = () => {
    const isOpening = !showSymbolSection

    if (isOpening && showLogoSection) {
      // If opening symbol section and logo is open, close logo
      setShowLogoSection(false)
    }
    if (isOpening && showTaglineSection) {
      // If opening symbol section and tagline is open, close tagline
      setShowTaglineSection(false)
    }
    setShowSymbolSection(isOpening)
  }

  const handleRegenerateSymbol = () => {
    setSymbolSeed(generateSeed())
  }

  const calculateOptimalFontSize = () => {
    // Use mobile container if it's visible, otherwise desktop
    const activeContainer = mobileContainerRef.current?.offsetParent ? mobileContainerRef.current : containerRef.current
    const activeLogo = mobileContainerRef.current?.offsetParent ? mobileLogoRef.current : logoRef.current
    
    if (!activeContainer || !activeLogo) return

    const containerWidth = activeContainer.offsetWidth - 64 // Account for padding
    const containerHeight = activeContainer.offsetHeight - 64 // Account for padding
    const logoText = getFullLogoText()
    const taglineText = getFullTaglineText()
    
    // Create a temporary canvas to measure text dimensions
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Start with a base font size and scale down if needed
    let fontSize = 64 // Start with 64px (4rem)
    const minFontSize = 16

    while (fontSize >= minFontSize) {
      // Measure logo width
      ctx.font = `${fontWeight} ${fontSize}px "${selectedFont}", sans-serif`
      let logoWidth = 0
      if (letterSpacing !== 0) {
        const spacingValue = letterSpacing * 1.2
        for (let i = 0; i < logoText.length; i++) {
          const char = logoText[i]
          const charWidth = ctx.measureText(char).width
          logoWidth += charWidth
          if (i < logoText.length - 1) logoWidth += spacingValue
        }
      } else {
        logoWidth = ctx.measureText(logoText).width
      }

      let maxWidth = logoWidth
      let totalHeight = fontSize * 1.2 // Logo height with line height

      // Add extra height for trademark symbol if present (it extends upward by 50% of font size)
      if (trademarkSymbol !== 'none') {
        totalHeight += fontSize * 0.5
      }

      // If tagline exists, measure its dimensions too
      if (taglineText) {
        const taglineFontSize = fontSize * (taglineSize / 100)
        ctx.font = `${taglineFontWeight} ${taglineFontSize}px "${taglineFont}", sans-serif`

        let taglineWidth = 0
        if (taglineLetterSpacing !== 0) {
          const taglineSpacingValue = taglineLetterSpacing * 1.2
          for (let i = 0; i < taglineText.length; i++) {
            const char = taglineText[i]
            const charWidth = ctx.measureText(char).width
            taglineWidth += charWidth
            if (i < taglineText.length - 1) taglineWidth += taglineSpacingValue
          }
        } else {
          taglineWidth = ctx.measureText(taglineText).width
        }

        // Calculate spacing between logo and tagline
        const spacing = fontSize * (Math.max(0, taglineDistance) / 100) // Handle negative spacing
        const taglineHeight = taglineFontSize * 1.3 // Tagline height with line height

        maxWidth = Math.max(logoWidth, taglineWidth)
        totalHeight += spacing + taglineHeight
      }

      // If symbol exists, account for its dimensions
      if (symbolMode !== 'none' && symbolSvg) {
        const symbolSizePixels = fontSize * (symbolSize / 100)
        const symbolDistancePixels = fontSize * (symbolDistance / 100)

        if (symbolPlacement === 'above') {
          // Symbol adds height above the logo
          totalHeight += symbolSizePixels + symbolDistancePixels
        } else if (symbolPlacement === 'left') {
          // Symbol adds width to the left of the logo
          const logoAndTaglineWidth = maxWidth
          maxWidth = symbolSizePixels + symbolDistancePixels + logoAndTaglineWidth
        } else if (symbolPlacement === 'separate') {
          // Symbol adds height with separator
          totalHeight += symbolSizePixels + (fontSize * 0.3) + 10 // separator space
        }
      }

      // Check if both width and height fit in container
      if (maxWidth <= containerWidth && totalHeight <= containerHeight) {
        setPreviewFontSize(`${fontSize}px`)
        return
      }
      
      fontSize -= 2 // Decrease by 2px each iteration
    }
    
    setPreviewFontSize(`${minFontSize}px`)
  }

  useEffect(() => {
    calculateOptimalFontSize()
  }, [brandName, selectedFont, fontWeight, letterSpacing, textCase, trademarkSymbol, taglineText, taglineFont, taglineFontWeight, taglineLetterSpacing, taglineSize, taglineDistance, symbolMode, symbolSvg, symbolSize, symbolDistance, symbolPlacement])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    const handleResize = () => calculateOptimalFontSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [brandName, selectedFont, fontWeight, letterSpacing, textCase, trademarkSymbol, taglineText, taglineFont, taglineFontWeight, taglineLetterSpacing, taglineSize, taglineDistance, symbolMode, symbolSvg, symbolSize, symbolDistance, symbolPlacement])

  // Generate symbol SVG when relevant state changes
  useEffect(() => {
    if (symbolMode === 'none') {
      setSymbolSvg('')
      return
    }

    try {
      const firstLetter = (brandName || 'Y').charAt(0)
      const result = generateSymbol(
        symbolMode,
        symbolSeed,
        symbolColor,
        {
          letter: firstLetter,
          font: symbolFont
        }
      )
      setSymbolSvg(result.svg)
    } catch (error) {
      console.error('Failed to generate symbol:', error)
      setSymbolSvg('')
    }
  }, [symbolMode, symbolSeed, symbolColor, symbolFont, brandName])

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
          logo_color: logoColor,
          has_tagline: !!getFullTaglineText(),
          tagline_font: getFullTaglineText() ? taglineFont : null,
          tagline_weight: getFullTaglineText() ? taglineFontWeight : null,
          tagline_size: getFullTaglineText() ? taglineSize : null,
          tagline_case: getFullTaglineText() ? taglineTextCase : null,
          tagline_distance: getFullTaglineText() ? taglineDistance : null,
          tagline_color: getFullTaglineText() ? taglineColor : null
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

          // Use the configured vector API endpoint
          const apiUrl = API_CONFIG.vectorApiUrl;

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
            } catch {
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
            status: error instanceof Error ? undefined : (error as {status?: number}).status,
            message: error instanceof Error ? error.message : String(error),
            response: error instanceof Error ? undefined : (error as {response?: unknown}).response
          })
          throw error
        }
      }

      // Helper function to create vector SVG with tagline
      const createClientVectorSVGWithTagline = async (logoColorParam: string, taglineColorParam?: string): Promise<string> => {
        try {
          console.log('Creating vector SVG with tagline using API')
          const apiUrl = API_CONFIG.vectorApiUrl

          // Use provided tagline color or default to user's tagline color
          const actualTaglineColor = taglineColorParam || taglineColor
          
          // Create logo SVG
          const logoRequestBody = {
            text: fullText,
            fontFamily: currentFont,
            fontWeight: currentWeight,
            fontSize: 120,
            letterSpacing: currentLetterSpacing,
            color: logoColorParam
          }
          
          const logoResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(logoRequestBody)
          })

          if (!logoResponse.ok) {
            throw new Error(`Logo API request failed: ${logoResponse.status}`)
          }

          const logoResult = await logoResponse.json()
          if (!logoResult.success) {
            throw new Error(logoResult.message || 'Logo vector conversion failed')
          }

          // Create tagline SVG if tagline exists
          if (getFullTaglineText()) {
            const taglineRequestBody = {
              text: getFullTaglineText(),
              fontFamily: taglineFont,
              fontWeight: taglineFontWeight,
              fontSize: 120 * (taglineSize / 100),
              letterSpacing: taglineLetterSpacing,
              color: actualTaglineColor
            }
            
            const taglineResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(taglineRequestBody)
            })

            if (!taglineResponse.ok) {
              throw new Error(`Tagline API request failed: ${taglineResponse.status}`)
            }

            const taglineResult = await taglineResponse.json()
            if (!taglineResult.success) {
              throw new Error(taglineResult.message || 'Tagline vector conversion failed')
            }

            // Combine logo and tagline SVGs
            const logoSvg = logoResult.data.svg
            const taglineSvg = taglineResult.data.svg
            
            // Extract paths from both SVGs
            const logoPathMatch = logoSvg.match(/<path[^>]*d="([^"]*)"[^>]*>/g)
            const taglinePathMatch = taglineSvg.match(/<path[^>]*d="([^"]*)"[^>]*>/g)
            
            if (logoPathMatch && taglinePathMatch) {
              // Extract viewBox dimensions from original SVGs to calculate proper layout
              const logoViewBoxMatch = logoSvg.match(/viewBox="([^"]*)"/)
              const taglineViewBoxMatch = taglineSvg.match(/viewBox="([^"]*)"/)
              
              let logoWidth = 400, taglineWidth = 400
              
              if (logoViewBoxMatch) {
                const [, , logoW] = logoViewBoxMatch[1].split(' ').map(Number)
                logoWidth = logoW
              }
              
              if (taglineViewBoxMatch) {
                const [, , tagW] = taglineViewBoxMatch[1].split(' ').map(Number)
                taglineWidth = tagW
              }
              
              // Use tighter width calculation - take 95% of API width to reduce excess space while maintaining balance
              logoWidth = logoWidth * 0.95
              taglineWidth = taglineWidth * 0.95
              
              // Calculate layout dimensions with proper spacing to match preview
              // Use consistent spacing calculation with preview
              const spacing = 120 * (taglineDistance / 100) // Base font size for consistent spacing
              const padding = 40 // Consistent padding on all sides
              const maxWidth = Math.max(logoWidth, taglineWidth)
              
              // Use font size for more accurate height calculation
              const logoFontHeight = 120 // Base logo font size
              const taglineFontHeight = 120 * (taglineSize / 100)
              
              // Calculate actual content dimensions
              const logoYPos = logoFontHeight * 0.8 // Logo baseline position
              const taglineYPos = logoYPos + logoFontHeight * 0.4 + spacing + taglineFontHeight * 0.8 // Tagline baseline position
              const contentHeight = taglineYPos + taglineFontHeight * 0.2 // Content height including tagline descent
              
              // Add equal padding to all sides
              const viewBoxWidth = maxWidth + (padding * 2)
              const viewBoxHeight = contentHeight + (padding * 2)
              
              // Calculate perfect centering offsets
              const logoXOffset = padding + (maxWidth - logoWidth) / 2
              const taglineXOffset = padding + (maxWidth - taglineWidth) / 2
              
              // Position elements with equal padding from edges
              const logoYOffset = padding + logoYPos
              const taglineYOffset = padding + taglineYPos
              
              const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">
                <g transform="translate(${logoXOffset}, ${logoYOffset})">
                  ${logoPathMatch.join('')}
                </g>
                <g transform="translate(${taglineXOffset}, ${taglineYOffset})">
                  ${taglinePathMatch.join('')}
                </g>
              </svg>`
              
              return combinedSvg
            }
          }
          
          // Fallback to logo-only SVG
          return logoResult.data.svg

        } catch (error) {
          console.error('Vector SVG with tagline creation failed:', error)
          // Fallback to logo-only vector SVG
          return createClientVectorSVG(logoColorParam)
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

      // Helper function to create logo with tagline assets
      const createLogoWithTaglineAssets = async (logoColorParam: string, taglineColorParam?: string) => {
        if (!getFullTaglineText()) {
          return createLogoAssets(logoColorParam) // Fallback to logo-only if no tagline
        }

        // Use provided tagline color or default to logo color
        const actualTaglineColor = taglineColorParam || taglineColor

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas context not available')
        }

        const logoFontSize = 120
        const taglineFontSize = logoFontSize * (taglineSize / 100)
        
        // Set up fonts for measurements
        ctx.font = `${currentWeight} ${logoFontSize}px "${currentFont}", Arial, sans-serif`
        
        // Apply letter spacing for accurate measurements
        if (currentLetterSpacing !== 0) {
          ctx.letterSpacing = `${currentLetterSpacing / 100}em`
        }
        
        // Measure logo text width (simplified measurement with letter spacing applied)
        const logoTextWithoutTrademark = fullText.replace(/[™®©]/g, '')
        const logoTextWidth = ctx.measureText(logoTextWithoutTrademark).width
        
        // Add trademark symbol width if present
        const logoTrademarkMatch = fullText.match(/[™®©]/)
        const tmExtraWidth = logoTrademarkMatch ? (logoFontSize * 0.35 * 0.5) : 0 // Approximate trademark width
        const totalLogoWidth = logoTextWidth + tmExtraWidth
        
        // Measure tagline text width
        const taglineDisplayText = getFullTaglineText()
        ctx.font = `${taglineFontWeight} ${taglineFontSize}px "${taglineFont}", Arial, sans-serif`
        
        // Apply tagline letter spacing for measurement
        if (taglineLetterSpacing !== 0) {
          ctx.letterSpacing = `${taglineLetterSpacing / 100}em`
        } else {
          ctx.letterSpacing = '0'
        }
        
        const taglineTextWidth = ctx.measureText(taglineDisplayText).width

        // Calculate canvas dimensions with proper spacing to match preview
        const padding = 60 // Increased padding for better spacing around content
        const lineSpacing = logoFontSize * (taglineDistance / 100)
        const maxWidth = Math.max(totalLogoWidth, taglineTextWidth)
        const canvasWidth = maxWidth + (padding * 2)
        
        // Use more accurate height calculation with proper bottom margin
        const logoHeightEstimate = logoFontSize // More accurate font height estimate
        const taglineHeightEstimate = taglineFontSize
        const canvasHeight = logoHeightEstimate + taglineHeightEstimate + lineSpacing + (padding * 2)
        
        // Set up high-resolution canvas
        const scale = 2
        canvas.width = canvasWidth * scale
        canvas.height = canvasHeight * scale
        ctx.scale(scale, scale)
        
        // Draw logo text
        ctx.font = `${currentWeight} ${logoFontSize}px "${currentFont}", Arial, sans-serif`
        ctx.fillStyle = logoColorParam
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        
        // Apply letter spacing for accurate rendering
        if (currentLetterSpacing !== 0) {
          ctx.letterSpacing = `${currentLetterSpacing / 100}em`
        }
        
        // Center the logo text with consistent positioning to match preview
        const logoY = padding + logoFontSize * 0.8 // Use font baseline positioning similar to SVG
        const logoX = canvasWidth / 2
        
        // For simplicity and better centering, draw the logo text as a single unit
        // Handle trademark symbols with proper scaling
        
        // Draw main text
        ctx.fillText(logoTextWithoutTrademark, logoX, logoY)
        
        // Draw trademark symbol if present
        if (logoTrademarkMatch) {
          const tmSymbol = logoTrademarkMatch[0]
          const tmFontSize = logoFontSize * 0.35
          const mainTextWidth = ctx.measureText(logoTextWithoutTrademark).width
          
          ctx.font = `${currentWeight} ${tmFontSize}px "${currentFont}", Arial, sans-serif`
          const tmX = logoX + (mainTextWidth / 2) + (tmFontSize / 2)
          const tmY = logoY - (logoFontSize * 0.5)
          ctx.fillText(tmSymbol, tmX, tmY)
          
          // Reset font for tagline
          ctx.font = `${currentWeight} ${logoFontSize}px "${currentFont}", Arial, sans-serif`
        }
        
        // Draw tagline text
        ctx.font = `${taglineFontWeight} ${taglineFontSize}px "${taglineFont}", Arial, sans-serif`
        ctx.fillStyle = actualTaglineColor
        ctx.textAlign = 'center'
        
        // Apply tagline letter spacing
        if (taglineLetterSpacing !== 0) {
          ctx.letterSpacing = `${taglineLetterSpacing / 100}em`
        } else {
          ctx.letterSpacing = '0'
        }
        
        const taglineY = logoY + logoFontSize * 0.4 + lineSpacing + taglineFontSize * 0.8 // Add logo descent + spacing + tagline ascent
        const taglineX = canvasWidth / 2
        
        // Draw tagline as a single centered text
        ctx.fillText(taglineDisplayText, taglineX, taglineY)

        // Convert canvas to blob for PNG
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create PNG'))
          }, 'image/png', 1.0)
        })

        // Create vector SVG for logo with tagline
        const svgFromVector = await createClientVectorSVGWithTagline(logoColorParam, taglineColorParam)

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

      // Helper function to calculate if a color is light or dark
      const getContrastColor = (hexColor: string): string => {
        // Remove # if present
        const hex = hexColor.replace('#', '')
        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        // Return black for light backgrounds, white for dark backgrounds
        return luminance > 0.5 ? '#000000' : '#ffffff'
      }

      // Helper function to create symbol-only assets
      const createSymbolAssets = async (color: string) => {
        // Create a colored version of the symbol SVG by replacing fill and stroke colors
        // Use more precise regex to handle colors properly
        let coloredSymbolSvg = symbolSvg.replace(/fill="#[0-9a-fA-F]{6}"/g, `fill="${color}"`)
                                       .replace(/stroke="#[0-9a-fA-F]{6}"/g, `stroke="${color}"`)

        // Also handle colors without quotes (shouldn't happen but be safe)
        coloredSymbolSvg = coloredSymbolSvg.replace(/fill=["]?#[0-9a-fA-F]{6}["]?/g, `fill="${color}"`)
                                           .replace(/stroke=["]?#[0-9a-fA-F]{6}["]?/g, `stroke="${color}"`)

        // Fixed size for symbol-only exports (doesn't matter per user request)
        const symbolSize = 512 // Standard icon size

        // For SVG export: Keep it simple, just replace the viewBox size and add proper dimensions
        // This matches how the preview displays it - just scaling the original SVG
        const svgContent = coloredSymbolSvg.replace(/<svg[^>]*>/, `<svg width="${symbolSize}" height="${symbolSize}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">`)

        // Create canvas for PNG generation
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas context not available')
        }

        // Set up high-resolution canvas
        const scale = 2
        canvas.width = symbolSize * scale
        canvas.height = symbolSize * scale
        ctx.scale(scale, scale)

        // Create image from SVG
        const img = new Image()
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        await new Promise((resolve, reject) => {
          img.onload = async () => {
            // Draw symbol centered
            ctx.drawImage(img, 0, 0, symbolSize, symbolSize)
            URL.revokeObjectURL(url)
            resolve(null)
          }
          img.onerror = (e) => {
            URL.revokeObjectURL(url)
            reject(e)
          }
          img.src = url
        })

        // Convert canvas to blob for PNG
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create symbol PNG'))
          }, 'image/png', 1.0)
        })

        return {
          png: pngBlob,
          svg: svgContent,
          width: symbolSize,
          height: symbolSize
        }
      }

      // Helper function to create social media icon with colored background
      const createSocialMediaIcon = async (backgroundColor: string, sizes: number[] = [512, 1024]) => {
        const contrastColor = getContrastColor(backgroundColor)

        // Create colored symbol with contrast color
        let coloredSymbolSvg = symbolSvg.replace(/fill="#[0-9a-fA-F]{6}"/g, `fill="${contrastColor}"`)
                                       .replace(/stroke="#[0-9a-fA-F]{6}"/g, `stroke="${contrastColor}"`)
        coloredSymbolSvg = coloredSymbolSvg.replace(/fill=["]?#[0-9a-fA-F]{6}["]?/g, `fill="${contrastColor}"`)
                                           .replace(/stroke=["]?#[0-9a-fA-F]{6}["]?/g, `stroke="${contrastColor}"`)

        const results: { [key: string]: { png: Blob, svg: string } } = {}

        for (const size of sizes) {
          // Create SVG with background
          const padding = size * 0.15 // 15% padding
          const symbolSize = size - (padding * 2)
          const svgWithBackground = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
  <g transform="translate(${padding}, ${padding}) scale(${symbolSize / 100})">
    ${coloredSymbolSvg.replace(/<svg[^>]*>|<\/svg>/g, '').replace(/xmlns="[^"]*"/g, '')}
  </g>
</svg>`

          // Create canvas for PNG
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            throw new Error('Canvas context not available')
          }

          const scale = 2
          canvas.width = size * scale
          canvas.height = size * scale
          ctx.scale(scale, scale)

          // Create image from SVG
          const img = new Image()
          const svgBlob = new Blob([svgWithBackground], { type: 'image/svg+xml;charset=utf-8' })
          const url = URL.createObjectURL(svgBlob)

          await new Promise((resolve, reject) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, size, size)
              URL.revokeObjectURL(url)
              resolve(null)
            }
            img.onerror = (e) => {
              URL.revokeObjectURL(url)
              reject(e)
            }
            img.src = url
          })

          // Convert canvas to PNG blob
          const pngBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(blob => {
              if (blob) resolve(blob)
              else reject(new Error('Failed to create social media icon PNG'))
            }, 'image/png', 1.0)
          })

          results[`${size}x${size}`] = {
            png: pngBlob,
            svg: svgWithBackground
          }
        }

        return results
      }

      // Helper function to create logo with symbol assets
      const createLogoWithSymbolAssets = async (logoColorParam: string, symbolColorParam: string, includeTagline: boolean = false) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas context not available')
        }

        // Get colored symbol SVG using improved color replacement
        let coloredSymbolSvg = symbolSvg.replace(/fill="#[0-9a-fA-F]{6}"/g, `fill="${symbolColorParam}"`)
                                        .replace(/stroke="#[0-9a-fA-F]{6}"/g, `stroke="${symbolColorParam}"`)
        // Also handle colors without quotes (shouldn't happen but be safe)
        coloredSymbolSvg = coloredSymbolSvg.replace(/fill=["]?#[0-9a-fA-F]{6}["]?/g, `fill="${symbolColorParam}"`)
                                           .replace(/stroke=["]?#[0-9a-fA-F]{6}["]?/g, `stroke="${symbolColorParam}"`)

        // Get logo SVG (with or without tagline)
        let logoSvg: string
        if (includeTagline && getFullTaglineText()) {
          logoSvg = await createClientVectorSVGWithTagline(logoColorParam, taglineColor)
        } else {
          logoSvg = await createClientVectorSVG(logoColorParam)
        }

        // Extract viewBox from logo SVG
        const logoViewBoxMatch = logoSvg.match(/viewBox="([^"]*)"/)
        let logoWidth = 400, logoHeight = 120
        if (logoViewBoxMatch) {
          const [, , logoW, logoH] = logoViewBoxMatch[1].split(' ').map(Number)
          logoWidth = logoW * 0.95
          logoHeight = logoH
        }

        // Calculate layout based on placement
        const fontSize = 120
        const symbolSizePixels = fontSize * (symbolSize / 100)
        const symbolDistancePixels = fontSize * (symbolDistance / 100)
        const padding = 40

        let canvasWidth, canvasHeight, symbolX, symbolY, logoX, logoY

        if (symbolPlacement === 'above') {
          canvasWidth = Math.max(symbolSizePixels, logoWidth) + (padding * 2)
          canvasHeight = symbolSizePixels + symbolDistancePixels + logoHeight + (padding * 2)
          symbolX = padding + (canvasWidth - padding * 2 - symbolSizePixels) / 2
          symbolY = padding
          logoX = padding + (canvasWidth - padding * 2 - logoWidth) / 2
          logoY = padding + symbolSizePixels + symbolDistancePixels
        } else if (symbolPlacement === 'left') {
          canvasWidth = symbolSizePixels + symbolDistancePixels + logoWidth + (padding * 2)
          canvasHeight = Math.max(symbolSizePixels, logoHeight) + (padding * 2)
          symbolX = padding
          // Align symbol center with logo center for better visual balance
          symbolY = padding + (logoHeight - symbolSizePixels) / 2
          logoX = padding + symbolSizePixels + symbolDistancePixels
          logoY = padding
        } else { // separate
          canvasWidth = Math.max(symbolSizePixels, logoWidth) + (padding * 2)
          const separatorSpace = fontSize * 0.3 + 10
          canvasHeight = symbolSizePixels + separatorSpace + logoHeight + (padding * 2)
          symbolX = padding + (canvasWidth - padding * 2 - symbolSizePixels) / 2
          symbolY = padding
          logoX = padding + (canvasWidth - padding * 2 - logoWidth) / 2
          logoY = padding + symbolSizePixels + separatorSpace
        }

        // Set up high-resolution canvas
        const scale = 2
        canvas.width = canvasWidth * scale
        canvas.height = canvasHeight * scale
        ctx.scale(scale, scale)

        // Draw symbol
        const tempDivSymbol = document.createElement('div')
        tempDivSymbol.style.position = 'absolute'
        tempDivSymbol.style.left = '-9999px'
        tempDivSymbol.innerHTML = coloredSymbolSvg
        document.body.appendChild(tempDivSymbol)

        const svgSymbolElement = tempDivSymbol.querySelector('svg')
        if (svgSymbolElement) {
          svgSymbolElement.setAttribute('width', symbolSizePixels.toString())
          svgSymbolElement.setAttribute('height', symbolSizePixels.toString())

          const symbolSvgData = new XMLSerializer().serializeToString(svgSymbolElement)
          const symbolImg = new Image()
          const symbolBlob = new Blob([symbolSvgData], { type: 'image/svg+xml;charset=utf-8' })
          const symbolUrl = URL.createObjectURL(symbolBlob)

          await new Promise((resolve, reject) => {
            symbolImg.onload = () => {
              ctx.drawImage(symbolImg, symbolX, symbolY, symbolSizePixels, symbolSizePixels)
              URL.revokeObjectURL(symbolUrl)
              resolve(null)
            }
            symbolImg.onerror = reject
            symbolImg.src = symbolUrl
          })
        }
        document.body.removeChild(tempDivSymbol)

        // Draw separator line for separate placement
        if (symbolPlacement === 'separate') {
          const separatorY = symbolY + symbolSizePixels + (fontSize * 0.3) / 2
          const separatorWidth = 100
          const separatorX = (canvasWidth - separatorWidth) / 2
          ctx.strokeStyle = '#d1d5db' // gray-300
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(separatorX, separatorY)
          ctx.lineTo(separatorX + separatorWidth, separatorY)
          ctx.stroke()
        }

        // Draw logo/tagline
        // For canvas rendering, we need to render the text directly since we can't easily embed the vector SVG
        // This is a simplified version - the SVG output will be more accurate
        ctx.fillStyle = logoColorParam
        ctx.font = `${fontWeight} ${fontSize}px "${selectedFont}", Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const logoTextToDraw = textCase === 'uppercase' ? brandName.toUpperCase() : brandName
        ctx.fillText(logoTextToDraw, logoX + logoWidth / 2, logoY)

        // Convert canvas to blob for PNG
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create PNG'))
          }, 'image/png', 1.0)
        })

        // Combine symbol and logo SVGs
        const logoPathContent = logoSvg.replace(/<svg[^>]*>|<\/svg>/g, '').replace(/xmlns="[^"]*"/g, '')
        const symbolContent = coloredSymbolSvg.replace(/<svg[^>]*>|<\/svg>/g, '').replace(/xmlns="[^"]*"/g, '')

        // Create combined SVG
        let combinedSvg: string
        if (symbolPlacement === 'above') {
          combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
            <g transform="translate(${symbolX}, ${symbolY}) scale(${symbolSizePixels / 100})">
              ${symbolContent}
            </g>
            <g transform="translate(${logoX}, ${logoY})">
              ${logoPathContent}
            </g>
          </svg>`
        } else if (symbolPlacement === 'left') {
          combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
            <g transform="translate(${symbolX}, ${symbolY}) scale(${symbolSizePixels / 100})">
              ${symbolContent}
            </g>
            <g transform="translate(${logoX}, ${logoY})">
              ${logoPathContent}
            </g>
          </svg>`
        } else { // separate
          const separatorY = symbolY + symbolSizePixels + (fontSize * 0.3) / 2
          const separatorWidth = 100
          const separatorX = (canvasWidth - separatorWidth) / 2
          combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
            <g transform="translate(${symbolX}, ${symbolY}) scale(${symbolSizePixels / 100})">
              ${symbolContent}
            </g>
            <line x1="${separatorX}" y1="${separatorY}" x2="${separatorX + separatorWidth}" y2="${separatorY}" stroke="#d1d5db" stroke-width="1"/>
            <g transform="translate(${logoX}, ${logoY})">
              ${logoPathContent}
            </g>
          </svg>`
        }

        return {
          png: pngBlob,
          svg: combinedSvg,
          width: Math.ceil(canvasWidth),
          height: Math.ceil(canvasHeight)
        }
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

      // Generate tagline variants if tagline exists
      let darkTaglineAssets, lightTaglineAssets
      const hasTagline = !!getFullTaglineText()
      
      if (hasTagline) {
        console.log('Generating dark variants with tagline...')
        darkTaglineAssets = await createLogoWithTaglineAssets(logoColor)
        console.log('Dark tagline assets generated')
        
        console.log('Generating light variants with tagline...')
        lightTaglineAssets = await createLogoWithTaglineAssets('#ffffff', '#ffffff')
        console.log('Light tagline assets generated')
      }

      // Add PNG files (using canvas-generated PNGs with correct fonts)
      pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark.png`, darkPNG)
      pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light.png`, lightPNG)

      // Add SVG files
      svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark.svg`, darkSVG)
      svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light.svg`, lightSVG)
      svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark-white-bg.svg`, darkSVGWhiteBG)
      svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light-dark-bg.svg`, lightSVGDarkBG)

      // Add tagline versions if tagline exists
      if (hasTagline && darkTaglineAssets && lightTaglineAssets) {
        // PNG files with tagline
        pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark.png`, darkTaglineAssets.png)
        pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light.png`, lightTaglineAssets.png)

        // SVG files with tagline
        const darkTaglineSVGWhiteBG = addBackgroundToSVG(darkTaglineAssets.svg, '#ffffff')
        const lightTaglineSVGDarkBG = addBackgroundToSVG(lightTaglineAssets.svg, '#000000')

        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark.svg`, darkTaglineAssets.svg)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light.svg`, lightTaglineAssets.svg)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark-white-bg.svg`, darkTaglineSVGWhiteBG)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light-dark-bg.svg`, lightTaglineSVGDarkBG)
      }

      // Generate symbol variants if symbol exists
      const hasSymbol = symbolMode !== 'none' && symbolSvg
      let darkSymbolAssets, lightSymbolAssets
      let darkLogoWithSymbolAssets, lightLogoWithSymbolAssets
      let darkLogoWithSymbolAndTaglineAssets, lightLogoWithSymbolAndTaglineAssets
      let socialMediaIcons

      if (hasSymbol) {
        console.log('Generating symbol variants...')

        // Symbol-only files
        darkSymbolAssets = await createSymbolAssets(logoColor)
        lightSymbolAssets = await createSymbolAssets('#ffffff')
        console.log('Symbol-only assets generated')

        // Logo with symbol files
        darkLogoWithSymbolAssets = await createLogoWithSymbolAssets(logoColor, symbolColor, false)
        lightLogoWithSymbolAssets = await createLogoWithSymbolAssets('#ffffff', '#ffffff', false)
        console.log('Logo with symbol assets generated')

        // Logo with symbol and tagline files (if tagline exists)
        if (hasTagline) {
          darkLogoWithSymbolAndTaglineAssets = await createLogoWithSymbolAssets(logoColor, symbolColor, true)
          lightLogoWithSymbolAndTaglineAssets = await createLogoWithSymbolAssets('#ffffff', '#ffffff', true)
          console.log('Logo with symbol and tagline assets generated')
        }

        // Generate social media icons with colored background
        console.log('Generating social media icons...')
        socialMediaIcons = await createSocialMediaIcon(symbolColor, [512, 1024])
        console.log('Social media icons generated')
      }

      // Add symbol-only files
      if (hasSymbol && darkSymbolAssets && lightSymbolAssets) {
        // PNG files
        pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-dark.png`, darkSymbolAssets.png)
        pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-light.png`, lightSymbolAssets.png)

        // SVG files
        const darkSymbolSVGWhiteBG = addBackgroundToSVG(darkSymbolAssets.svg, '#ffffff')
        const lightSymbolSVGDarkBG = addBackgroundToSVG(lightSymbolAssets.svg, '#000000')

        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-dark.svg`, darkSymbolAssets.svg)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-light.svg`, lightSymbolAssets.svg)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-dark-white-bg.svg`, darkSymbolSVGWhiteBG)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-light-dark-bg.svg`, lightSymbolSVGDarkBG)
      }

      // Add logo with symbol files
      if (hasSymbol && darkLogoWithSymbolAssets && lightLogoWithSymbolAssets) {
        // PNG files
        pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-dark.png`, darkLogoWithSymbolAssets.png)
        pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-light.png`, lightLogoWithSymbolAssets.png)

        // SVG files
        const darkLogoSymbolSVGWhiteBG = addBackgroundToSVG(darkLogoWithSymbolAssets.svg, '#ffffff')
        const lightLogoSymbolSVGDarkBG = addBackgroundToSVG(lightLogoWithSymbolAssets.svg, '#000000')

        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-dark.svg`, darkLogoWithSymbolAssets.svg)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-light.svg`, lightLogoWithSymbolAssets.svg)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-dark-white-bg.svg`, darkLogoSymbolSVGWhiteBG)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-light-dark-bg.svg`, lightLogoSymbolSVGDarkBG)
      }

      // Add logo with symbol and tagline files
      if (hasSymbol && hasTagline && darkLogoWithSymbolAndTaglineAssets && lightLogoWithSymbolAndTaglineAssets) {
        // PNG files
        pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-dark.png`, darkLogoWithSymbolAndTaglineAssets.png)
        pngFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-light.png`, lightLogoWithSymbolAndTaglineAssets.png)

        // SVG files
        const darkFullSVGWhiteBG = addBackgroundToSVG(darkLogoWithSymbolAndTaglineAssets.svg, '#ffffff')
        const lightFullSVGDarkBG = addBackgroundToSVG(lightLogoWithSymbolAndTaglineAssets.svg, '#000000')

        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-dark.svg`, darkLogoWithSymbolAndTaglineAssets.svg)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-light.svg`, lightLogoWithSymbolAndTaglineAssets.svg)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-dark-white-bg.svg`, darkFullSVGWhiteBG)
        svgFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-light-dark-bg.svg`, lightFullSVGDarkBG)
      }

      // Add social media icons
      if (hasSymbol && socialMediaIcons) {
        const socialFolder = zip.folder('Social-Media-Icons')

        // Add 512x512 icons
        if (socialMediaIcons['512x512']) {
          socialFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-icon-512x512.png`, socialMediaIcons['512x512'].png)
          socialFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-icon-512x512.svg`, socialMediaIcons['512x512'].svg)
        }

        // Add 1024x1024 icons
        if (socialMediaIcons['1024x1024']) {
          socialFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-icon-1024x1024.png`, socialMediaIcons['1024x1024'].png)
          socialFolder?.file(`${brandName.replace(/\s+/g, '-').toLowerCase()}-icon-1024x1024.svg`, socialMediaIcons['1024x1024'].svg)
        }
      }

      // Create simple brand info text file
      const brandInfo = `${brandName} Brand Package

FILES INCLUDED:
LOGO FILES:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark.png (for light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light.png (for dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark.svg (vector, light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light.svg (vector, dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark-white-bg.svg (with white background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light-dark-bg.svg (with dark background)${hasSymbol ? `

SYMBOL FILES:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-dark.png (symbol only, for light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-light.png (symbol only, for dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-dark.svg (symbol only, vector, light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-light.svg (symbol only, vector, dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-dark-white-bg.svg (symbol only, with white background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-symbol-light-dark-bg.svg (symbol only, with dark background)

LOGO WITH SYMBOL FILES:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-dark.png (logo + symbol, for light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-light.png (logo + symbol, for dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-dark.svg (logo + symbol, vector, light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-light.svg (logo + symbol, vector, dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-dark-white-bg.svg (logo + symbol, with white background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-light-dark-bg.svg (logo + symbol, with dark background)

SOCIAL MEDIA ICONS:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-icon-512x512.png (square icon, symbol color background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-icon-512x512.svg (square icon, symbol color background, vector)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-icon-1024x1024.png (high-res square icon, symbol color background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-icon-1024x1024.svg (high-res square icon, symbol color background, vector)` : ''}${hasTagline ? `

LOGO WITH TAGLINE FILES:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark.png (for light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light.png (for dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark.svg (vector, light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light.svg (vector, dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark-white-bg.svg (with white background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light-dark-bg.svg (with dark background)` : ''}${hasSymbol && hasTagline ? `

LOGO WITH SYMBOL AND TAGLINE FILES:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-dark.png (complete brand, for light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-light.png (complete brand, for dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-dark.svg (complete brand, vector, light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-light.svg (complete brand, vector, dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-dark-white-bg.svg (complete brand, with white background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-symbol-and-tagline-light-dark-bg.svg (complete brand, with dark background)` : ''}

BRAND SPECIFICATIONS:
LOGO:
Font: ${selectedFont}
Weight: ${fontWeight}
Letter Spacing: ${letterSpacing}px
Case: ${textCase === 'uppercase' ? 'Uppercase' : 'Standard Case'}${hasSymbol ? `

SYMBOL:
Mode: ${symbolMode === 'letter' ? `Letter (${(brandName || 'Y').charAt(0).toUpperCase()})` : symbolMode === 'shape' ? 'Geometric Shape' : 'Pattern'}${symbolMode === 'letter' ? `
Font: ${symbolFont}` : ''}
Placement: ${symbolPlacement === 'above' ? 'Above Logo' : symbolPlacement === 'left' ? 'To the Left of Logo' : 'Separate (with divider)'}
Size: ${symbolSize}% of logo size
Distance: ${symbolDistance}%
Color: ${symbolColor.toUpperCase()}
Seed: ${symbolSeed} (use this to recreate the exact same symbol)

SOCIAL MEDIA ICONS:
Background Color: ${symbolColor.toUpperCase()}
Symbol Color: ${getContrastColor(symbolColor).toUpperCase()} (automatically selected for optimal contrast)
Sizes: 512x512px and 1024x1024px (PNG and SVG formats)
Note: Symbol automatically appears in white or black depending on background brightness` : ''}${hasTagline ? `

TAGLINE: "${getFullTaglineText()}"
Font: ${taglineFont}
Weight: ${taglineFontWeight}
Letter Spacing: ${taglineLetterSpacing}px
Case: ${taglineTextCase === 'uppercase' ? 'Uppercase' : 'Standard Case'}
Size: ${taglineSize}% of logo size
Distance from Logo: ${taglineDistance}%
Color: ${taglineColor.toUpperCase()}` : ''}

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
Pantone: ${formatPantone(hexToPantone(logoColor))}

USAGE GUIDELINES:
✓ Use dark logos on light backgrounds
✓ Use light logos on dark backgrounds
✓ Use SVG files for websites and scalable applications
✓ Use PNG files for documents and presentations
✓ Maintain clear space around logo
✓ Scale proportionally - don't stretch or distort${hasSymbol ? `
✓ Use symbol-only files for app icons and social media
✓ Use logo with symbol files for complete brand identity` : ''}${hasTagline ? `
✓ Use logo-only files when space is limited
✓ Use logo with tagline files when more context is needed` : ''}

✗ Don't change colors, fonts, or spacing
✗ Don't add effects or modify the logo
✗ Don't use on busy backgrounds${hasSymbol ? `
✗ Don't separate logo and symbol in different contexts` : ''}${hasTagline ? `
✗ Don't separate logo and tagline in different layouts` : ''}

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
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      alert(`Failed to generate brand package: ${errorMessage}. Check console for details.`)
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
    } catch {
      // Final fallback: show URL in prompt
      prompt('Copy this link to share:', shareData.url)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 py-3 sm:p-6 transition-colors">
      <div className="mx-auto max-w-6xl">
        <header className="mb-3 sm:mb-4 relative flex items-center justify-between sm:pl-4">
          <div className="flex items-center gap-3">
            <img
              src="/gologotype-dark.svg"
              alt="GoLogotype"
              className="h-8 sm:h-10"
            />
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Logo generator with true vector SVG output</p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Mobile: Preview on top, compact */}
          <section ref={mobileContainerRef} className="lg:hidden bg-gray-50 -mx-4 rounded-none sm:mx-0 sm:rounded-lg p-4 flex items-center justify-center min-h-[200px] sticky top-4 z-10 relative overflow-visible" aria-label="Logo preview">
            <h2 className="sr-only">Logo Preview</h2>
            <div className="text-center w-full">
              {/* Symbol and Logo Layout */}
              <div className={`inline-flex items-center justify-center ${symbolPlacement === 'above' || symbolPlacement === 'separate' ? 'flex-col' : symbolPlacement === 'left' ? 'flex-row' : 'flex-col'}`}
                style={{
                  gap: symbolMode !== 'none' && symbolSvg && symbolPlacement === 'left' ? `calc(${previewFontSize} * ${symbolDistance / 100})` : '0'
                }}>
                {/* Symbol Above or Separate */}
                {symbolMode !== 'none' && symbolSvg && (symbolPlacement === 'above' || symbolPlacement === 'separate') && (
                  <>
                    <div
                      className="transition-opacity duration-300"
                      style={{
                        width: `calc(${previewFontSize} * ${symbolSize / 100})`,
                        height: `calc(${previewFontSize} * ${symbolSize / 100})`,
                        marginBottom: symbolPlacement === 'above' ? `calc(${previewFontSize} * ${symbolDistance / 100})` : `calc(${previewFontSize} * 0.3)`,
                      }}
                      dangerouslySetInnerHTML={{ __html: symbolSvg }}
                    />
                    {symbolPlacement === 'separate' && (
                      <div className="w-full border-t border-gray-300 dark:border-gray-600 my-2" style={{ maxWidth: '100px' }}></div>
                    )}
                  </>
                )}

                {/* Symbol To the Left */}
                {symbolMode !== 'none' && symbolSvg && symbolPlacement === 'left' && (
                  <div
                    className="transition-opacity duration-300 flex-shrink-0"
                    style={{
                      width: `calc(${previewFontSize} * ${symbolSize / 100})`,
                      height: `calc(${previewFontSize} * ${symbolSize / 100})`,
                    }}
                    dangerouslySetInnerHTML={{ __html: symbolSvg }}
                  />
                )}

                {/* Logo and Tagline Wrapper */}
                <div className="flex flex-col items-center">
                  {/* Logo */}
                  <div
                    ref={mobileLogoRef}
                    className={`select-none ${getFontClass(selectedFont)} inline-block`}
                    style={{
                      fontSize: previewFontSize,
                      fontWeight: fontWeight,
                      letterSpacing: getLetterSpacingValue(letterSpacing),
                      textTransform: getTextTransform(textCase) as React.CSSProperties['textTransform'],
                      color: logoColor,
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
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

                  {/* Tagline */}
                  {getFullTaglineText() && (
                    <div
                      className={`select-none ${getFontClass(taglineFont)}`}
                      style={{
                        fontSize: `calc(${previewFontSize} * ${taglineSize / 100})`,
                        fontWeight: taglineFontWeight,
                        letterSpacing: getLetterSpacingValue(taglineLetterSpacing),
                        textTransform: getTextTransform(taglineTextCase) as React.CSSProperties['textTransform'],
                        color: taglineColor,
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        marginTop: `calc(${previewFontSize} * ${taglineDistance / 100})`,
                      }}
                    >
                      {getFullTaglineText()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 -mx-4 rounded-none sm:mx-0 sm:rounded-lg p-4 sm:p-6 font-inter transition-colors" aria-label="Logo customization controls">
            <h2 className="sr-only">Logo Customization Options</h2>
            <div className="space-y-4">
              {/* Logo Section */}
              <div>
                <button
                  type="button"
                  onClick={handleLogoSectionToggle}
                  className="flex items-center justify-between w-full text-base font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <span>Logo Settings</span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${showLogoSection ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {showLogoSection && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Brand Name
                      </Label>
                      <Input
                        id="brand-name"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Enter your brand name"
                        className="text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-400 h-10 sm:h-9"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font</Label>
                        <Select value={selectedFont} onValueChange={(font) => {
                          setSelectedFont(font)
                          const availableWeights = FONT_WEIGHTS_BY_FAMILY[font] || []
                          if (availableWeights.length > 0 && !availableWeights.find(w => w.value === fontWeight)) {
                            setFontWeight(availableWeights[0].value)
                          }
                        }}>
                          <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm h-10 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONTS.map((font) => (
                              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                {font}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Weight</Label>
                        <Select value={fontWeight} onValueChange={setFontWeight}>
                          <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm h-10 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(FONT_WEIGHTS_BY_FAMILY[selectedFont] || []).map((weight) => (
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
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Letter Spacing</Label>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{letterSpacing}</span>
                        </div>
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
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Case</Label>
                        <RadioGroup value={textCase} onValueChange={setTextCase as (value: string) => void} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="normal" id="case-normal" className="h-4 w-4" />
                            <Label htmlFor="case-normal" className="text-sm cursor-pointer text-gray-600 dark:text-gray-300">Normal (Aa)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="uppercase" id="uppercase" className="h-4 w-4" />
                            <Label htmlFor="uppercase" className="text-sm cursor-pointer text-gray-600 dark:text-gray-300">Upper (AA)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trademark</Label>
                      <Select value={trademarkSymbol} onValueChange={setTrademarkSymbol as (value: string) => void}>
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
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo Color</Label>
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
                  </div>
                )}
              </div>

              {/* Symbol Section */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <button
                  type="button"
                  onClick={handleSymbolSectionToggle}
                  className="flex items-center justify-between w-full text-base font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <span>Symbol and App icon (Optional)</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showSymbolSection ? 'rotate-180' : ''}`}
                  />
                </button>

                {showSymbolSection && (
                  <div className="space-y-4 mt-4">
                    {/* Mode Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Symbol Mode</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          type="button"
                          variant={symbolMode === 'none' ? 'default' : 'outline'}
                          className="h-9 text-xs"
                          onClick={() => setSymbolMode('none')}
                        >
                          None
                        </Button>
                        <Button
                          type="button"
                          variant={symbolMode === 'letter' ? 'default' : 'outline'}
                          className="h-9 text-xs"
                          onClick={() => setSymbolMode('letter')}
                        >
                          Letter
                        </Button>
                        <Button
                          type="button"
                          variant={symbolMode === 'shape' ? 'default' : 'outline'}
                          className="h-9 text-xs"
                          onClick={() => setSymbolMode('shape')}
                        >
                          Shape
                        </Button>
                        <Button
                          type="button"
                          variant={symbolMode === 'pattern' ? 'default' : 'outline'}
                          className="h-9 text-xs"
                          onClick={() => setSymbolMode('pattern')}
                        >
                          Pattern
                        </Button>
                      </div>
                    </div>

                    {symbolMode !== 'none' && (
                      <>
                        {/* Letter Mode: Font Selector */}
                        {symbolMode === 'letter' && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Letter Font</Label>
                            <Select value={symbolFont} onValueChange={setSymbolFont}>
                              <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm h-10 sm:h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FONTS.map((font) => (
                                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Using first letter: {(brandName || 'Y').charAt(0).toUpperCase()}</p>
                          </div>
                        )}

                        {/* Placement Selector */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Placement</Label>
                          <RadioGroup value={symbolPlacement} onValueChange={setSymbolPlacement as (value: string) => void} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="above" id="placement-above" className="h-4 w-4" />
                              <Label htmlFor="placement-above" className="text-sm cursor-pointer text-gray-600 dark:text-gray-300">Above</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="left" id="placement-left" className="h-4 w-4" />
                              <Label htmlFor="placement-left" className="text-sm cursor-pointer text-gray-600 dark:text-gray-300">To the left</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="separate" id="placement-separate" className="h-4 w-4" />
                              <Label htmlFor="placement-separate" className="text-sm cursor-pointer text-gray-600 dark:text-gray-300">Separate</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Size Slider */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Symbol Size ({symbolSize}%)
                          </Label>
                          <div className="px-1">
                            <Slider
                              value={[symbolSize]}
                              onValueChange={(value) => setSymbolSize(value[0])}
                              min={50}
                              max={150}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>50%</span>
                              <span>100%</span>
                              <span>150%</span>
                            </div>
                          </div>
                        </div>

                        {/* Distance Slider (only for above/left placement) */}
                        {(symbolPlacement === 'above' || symbolPlacement === 'left') && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Distance from Logo ({symbolDistance}%)
                            </Label>
                            <div className="px-1">
                              <Slider
                                value={[symbolDistance]}
                                onValueChange={(value) => setSymbolDistance(value[0])}
                                min={0}
                                max={50}
                                step={5}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Close</span>
                                <span>Normal</span>
                                <span>Far</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Symbol Color */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Symbol Color</Label>
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs font-mono pointer-events-none">
                                #
                              </div>
                              <Input
                                value={symbolColorInputValue}
                                onChange={(e) => handleSymbolColorInputChange(e.target.value)}
                                placeholder="f00 or ff0000"
                                className="text-xs border-gray-300 focus:border-gray-900 font-mono h-10 sm:h-8 pl-6"
                                maxLength={6}
                              />
                            </div>
                            <input
                              type="color"
                              value={symbolColor}
                              onChange={(e) => handleSymbolColorPickerChange(e.target.value)}
                              className="w-10 h-10 sm:w-8 sm:h-8 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <p className="text-xs text-gray-500">3 or 6 digit hex color (e.g., f00, ff0000)</p>
                        </div>

                        {/* Regenerate Button with Seed */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Variation</Label>
                          <div className="flex gap-2">
                            <Input
                              value={symbolSeed}
                              onChange={(e) => setSymbolSeed(e.target.value)}
                              placeholder="Enter seed"
                              className="flex-1 text-xs border-gray-300 focus:border-gray-900 font-mono h-10 sm:h-9"
                            />
                            <Button
                              type="button"
                              variant="default"
                              className="h-10 sm:h-9 px-4 gap-2 font-medium"
                              onClick={handleRegenerateSymbol}
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span className="hidden sm:inline">Randomize</span>
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">Save this seed to recreate the same variation</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Tagline Section */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <button
                  type="button"
                  onClick={handleTaglineSectionToggle}
                  className="flex items-center justify-between w-full text-base font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <span>Add Tagline (Optional)</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showTaglineSection ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {showTaglineSection && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="tagline-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tagline Text
                      </Label>
                      <Input
                        ref={taglineInputRef}
                        id="tagline-text"
                        value={taglineText}
                        onChange={(e) => setTaglineText(e.target.value)}
                        placeholder="Enter your tagline"
                        className="text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-400 h-10 sm:h-9"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline Font</Label>
                        <Select value={taglineFont} onValueChange={(font) => {
                          setTaglineFont(font)
                          const availableWeights = FONT_WEIGHTS_BY_FAMILY[font] || []
                          if (availableWeights.length > 0 && !availableWeights.find(w => w.value === taglineFontWeight)) {
                            setTaglineFontWeight(availableWeights[0].value)
                          }
                        }}>
                          <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm h-10 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONTS.map((font) => (
                              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                {font}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline Weight</Label>
                        <Select value={taglineFontWeight} onValueChange={setTaglineFontWeight}>
                          <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm h-10 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(FONT_WEIGHTS_BY_FAMILY[taglineFont] || []).map((weight) => (
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
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline Letter Spacing</Label>
                        <div className="px-1">
                          <Slider
                            value={[taglineLetterSpacing]}
                            onValueChange={(value) => setTaglineLetterSpacing(value[0])}
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
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline Case</Label>
                        <RadioGroup value={taglineTextCase} onValueChange={setTaglineTextCase as (value: string) => void} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="normal" id="tagline-case-normal" className="h-4 w-4" />
                            <Label htmlFor="tagline-case-normal" className="text-sm cursor-pointer text-gray-600 dark:text-gray-300">Normal (Aa)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="uppercase" id="tagline-uppercase" className="h-4 w-4" />
                            <Label htmlFor="tagline-uppercase" className="text-sm cursor-pointer text-gray-600 dark:text-gray-300">Upper (AA)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tagline Size ({taglineSize}% of logo)
                        </Label>
                        <div className="px-1">
                          <Slider
                            value={[taglineSize]}
                            onValueChange={(value) => setTaglineSize(value[0])}
                            min={15}
                            max={80}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Small</span>
                            <span>Medium</span>
                            <span>Large</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Distance from Logo ({taglineDistance}%) {taglineDistance < 0 ? '(Overlapping)' : ''}
                        </Label>
                        <div className="px-1">
                          <Slider
                            value={[taglineDistance]}
                            onValueChange={(value) => setTaglineDistance(value[0])}
                            min={-10}
                            max={40}
                            step={2}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Overlap</span>
                            <span>Normal</span>
                            <span>Far</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline Color</Label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs font-mono pointer-events-none">
                              #
                            </div>
                            <Input
                              value={taglineColorInputValue}
                              onChange={(e) => handleTaglineColorInputChange(e.target.value)}
                              placeholder="f00 or ff0000"
                              className="text-xs border-gray-300 focus:border-gray-900 font-mono h-10 sm:h-8 pl-6"
                              maxLength={6}
                            />
                          </div>
                          <input
                            type="color"
                            value={taglineColor}
                            onChange={(e) => handleTaglineColorPickerChange(e.target.value)}
                            className="w-10 h-10 sm:w-8 sm:h-8 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-gray-500">3 or 6 digit hex color (e.g., f00, ff0000)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                <Button onClick={generateBrandPackage} className="w-full gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 h-12">
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
          <section ref={containerRef} className="hidden lg:flex bg-gray-50 rounded-lg p-4 sm:p-8 items-center justify-center min-h-[400px] sm:min-h-[500px] relative overflow-visible" aria-label="Logo preview">
            <h2 className="sr-only">Logo Preview</h2>
            <div className="text-center w-full">
              {/* Symbol and Logo Layout */}
              <div className={`inline-flex items-center justify-center ${symbolPlacement === 'above' || symbolPlacement === 'separate' ? 'flex-col' : symbolPlacement === 'left' ? 'flex-row' : 'flex-col'}`}
                style={{
                  gap: symbolMode !== 'none' && symbolSvg && symbolPlacement === 'left' ? `calc(${previewFontSize} * ${symbolDistance / 100})` : '0'
                }}>
                {/* Symbol Above or Separate */}
                {symbolMode !== 'none' && symbolSvg && (symbolPlacement === 'above' || symbolPlacement === 'separate') && (
                  <>
                    <div
                      className="transition-opacity duration-300"
                      style={{
                        width: `calc(${previewFontSize} * ${symbolSize / 100})`,
                        height: `calc(${previewFontSize} * ${symbolSize / 100})`,
                        marginBottom: symbolPlacement === 'above' ? `calc(${previewFontSize} * ${symbolDistance / 100})` : `calc(${previewFontSize} * 0.3)`,
                      }}
                      dangerouslySetInnerHTML={{ __html: symbolSvg }}
                    />
                    {symbolPlacement === 'separate' && (
                      <div className="w-full border-t border-gray-300 dark:border-gray-600 my-2" style={{ maxWidth: '100px' }}></div>
                    )}
                  </>
                )}

                {/* Symbol To the Left */}
                {symbolMode !== 'none' && symbolSvg && symbolPlacement === 'left' && (
                  <div
                    className="transition-opacity duration-300 flex-shrink-0"
                    style={{
                      width: `calc(${previewFontSize} * ${symbolSize / 100})`,
                      height: `calc(${previewFontSize} * ${symbolSize / 100})`,
                    }}
                    dangerouslySetInnerHTML={{ __html: symbolSvg }}
                  />
                )}

                {/* Logo and Tagline Wrapper */}
                <div className="flex flex-col items-center">
                  {/* Logo */}
                  <div
                    ref={logoRef}
                    className={`select-none ${getFontClass(selectedFont)} inline-block`}
                    style={{
                      fontSize: previewFontSize,
                      fontWeight: fontWeight,
                      letterSpacing: getLetterSpacingValue(letterSpacing),
                      textTransform: getTextTransform(textCase) as React.CSSProperties['textTransform'],
                      color: logoColor,
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
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

                  {/* Tagline */}
                  {getFullTaglineText() && (
                    <div
                      className={`select-none ${getFontClass(taglineFont)}`}
                      style={{
                        fontSize: `calc(${previewFontSize} * ${taglineSize / 100})`,
                        fontWeight: taglineFontWeight,
                        letterSpacing: getLetterSpacingValue(taglineLetterSpacing),
                        textTransform: getTextTransform(taglineTextCase) as React.CSSProperties['textTransform'],
                        color: taglineColor,
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        marginTop: `calc(${previewFontSize} * ${taglineDistance / 100})`,
                      }}
                    >
                      {getFullTaglineText()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* SEO Footer */}
        <footer className="mt-4 bg-gray-50 dark:bg-gray-800 -mx-4 rounded-none sm:mt-10 sm:mx-0 sm:rounded-lg p-8">
          <article className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Professional Logo Generator for Startups
            </h2>
            
            <div className="prose prose-gray mx-auto text-gray-600 dark:text-gray-400 leading-relaxed">
              <p className="text-lg mb-4">
                Create stunning, professional logos in seconds with the advanced logotype maker.
                Perfect for startups, small businesses and creative professionals who need high-quality
                brand assets quickly.
              </p>

              <section className="grid md:grid-cols-2 gap-6 text-left">
                <article>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">True Vector Output</h3>
                  <p className="text-sm">
                    Export genuine vector SVG files with outlined font paths - not embedded text.
                    Perfect for print, web, scalable brand applications, and importing into Figma for design workflows.
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Professional Features</h3>
                  <p className="text-sm">
                    Choose from premium Google Fonts, adjust letter spacing, add trademark symbols,
                    and export in multiple formats with transparent backgrounds.
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Perfect for Vibecoders</h3>
                  <p className="text-sm">
                    Ideal for creating logos for your next coding project, startup launch,
                    or client work. Perfect for vibecoders who need professional branding fast.
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Trademark Symbols</h3>
                  <p className="text-sm">
                    <strong>™</strong> - Unregistered trademark for any brand name<br/>
                    <strong>®</strong> - Registered trademark (requires official registration)<br/>
                    <strong>©</strong> - Copyright symbol for creative works<br/>
                    <a
                      href="https://en.wikipedia.org/wiki/Trademark"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 underline text-xs mt-1 inline-block"
                    >
                      Learn more about trademarks →
                    </a>
                  </p>
                </article>
              </section>
              
              <p className="text-center mt-6 text-gray-500 text-sm">
                Whether you're building the next big SaaS platform, launching an ecommerce brand, 
                or developing an innovative app, our logo generator provides the professional 
                branding assets you need. Perfect for creating the logo for your next vibe coded project.
              </p>
            </div>

            {/* FAQ Section */}
            <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">Frequently Asked Questions</h2>
              <div className="space-y-3 max-w-3xl mx-auto">
                <FAQItem 
                  question="What file formats do I get when I download my logo?"
                  answer="You get a complete brand package including SVG (vector), PNG (transparent background), and versions with white/dark backgrounds. All files are professionally optimized for web, print, and any other use case."
                />
                <FAQItem 
                  question="Are the logos truly vector-based?"
                  answer="Yes! Our SVG files contain true vector font outlines, not embedded text. This means your logo will scale perfectly at any size without losing quality, and you don't need to install any fonts."
                />
                <FAQItem 
                  question="Can I use these logos commercially?"
                  answer="Absolutely! All logos generated are free to use for any purpose including commercial projects, startups, businesses, and personal use. No attribution required."
                />
                <FAQItem 
                  question="Do I need to create an account to download logos?"
                  answer="No account needed! Simply customize your logo and download immediately. We believe in keeping the process simple and fast."
                />
                <FAQItem 
                  question="What's the difference between the tagline versions?"
                  answer="You get both logo-only files and logo-with-tagline files. Use logo-only when space is limited, and logo-with-tagline when you need more context or brand messaging."
                />
                <FAQItem 
                  question="Can I edit the colors after downloading?"
                  answer="Yes! The SVG files can be easily edited in any design software like Figma, Adobe Illustrator, or even code editors. You can change colors, modify spacing, or make other adjustments as needed."
                />
                <FAQItem 
                  question="How do I create a professional logo for my business?"
                  answer="Creating a professional logo is simple with our generator. Choose a font that reflects your brand personality, enter your business name, select appropriate colors, and optionally add a tagline. Our tool generates clean, scalable logos perfect for any business."
                />
                <FAQItem 
                  question="What makes a good logo design?"
                  answer="A good logo is simple, memorable, and scalable. It should work in both color and black/white, be readable at small sizes, and reflect your brand's personality. Our generator focuses on typography-based logos that meet all these criteria."
                />
                <FAQItem 
                  question="How to make a logo for free?"
                  answer="Our logo generator is completely free! Simply enter your brand name, customize the font, weight, spacing, and colors, then download your professional logo package. No subscriptions, watermarks, or hidden fees."
                />
                <FAQItem 
                  question="What's the best font for a logo?"
                  answer="The best font depends on your brand. Sans-serif fonts like Inter and Montserrat work well for modern, tech companies. Serif fonts like Playfair Display suit luxury or traditional brands. Our curated font collection includes the most versatile options for logo design."
                />
              </div>
            </section>

            <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3 text-center">
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">Need help developing your brand?</strong> Contact{' '}
                  <a
                    href="https://glauser.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 dark:text-white hover:underline font-medium"
                  >
                    Glauser Creative
                  </a>
                  {' '}for professional branding and design services.
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-center gap-2 text-xs text-gray-400">
                  <span>
                    Have suggestions for improving this tool? Email{' '}
                    <a
                      href="mailto:oskar@glauser.com"
                      className="text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 underline"
                    >
                      oskar@glauser.com
                    </a>
                  </span>
                </div>
              </div>
            </section>
          </article>
        </footer>
      </div>
    </div>
  )
}

export default App
