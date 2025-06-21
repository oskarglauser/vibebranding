import { useState, useRef, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group'
import { Slider } from './components/ui/slider'
import { Download, Share2, ChevronDown } from 'lucide-react'
import JSZip from 'jszip'

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// FAQ Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 text-left text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-gray-600 text-left">
          {answer}
        </div>
      )}
    </div>
  )
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
  
  // Tagline states
  const [taglineText, setTaglineText] = useState('')
  const [taglineFont, setTaglineFont] = useState('Inter')
  const [taglineFontWeight, setTaglineFontWeight] = useState('400')
  const [taglineLetterSpacing, setTaglineLetterSpacing] = useState(0)
  const [taglineTextCase, setTaglineTextCase] = useState('normal')
  const [taglineSize, setTaglineSize] = useState(30) // Percentage of logo size
  const [taglineDistance, setTaglineDistance] = useState(20) // Distance between logo and tagline as percentage
  const [taglineColor, setTaglineColor] = useState('#111827') // Default to same as logo
  const [taglineColorInputValue, setTaglineColorInputValue] = useState('111827')
  const [showTaglineSection, setShowTaglineSection] = useState(false)
  const [showLogoSection, setShowLogoSection] = useState(true)
  
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

  const getFullLogoText = () => {
    const displayName = brandName || 'Your Brand'
    const displayText = textCase === 'uppercase' ? displayName.toUpperCase() : displayName
    const symbol = getTrademarkSymbol(trademarkSymbol)
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
    if (!showTaglineSection && showLogoSection) {
      // If opening tagline section and logo is open, close logo
      setShowLogoSection(false)
    }
    setShowTaglineSection(!showTaglineSection)
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
  }, [brandName, selectedFont, fontWeight, letterSpacing, textCase, trademarkSymbol, taglineText, taglineFont, taglineFontWeight, taglineLetterSpacing, taglineSize, taglineDistance])

  useEffect(() => {
    const handleResize = () => calculateOptimalFontSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [brandName, selectedFont, fontWeight, letterSpacing, textCase, trademarkSymbol, taglineText, taglineFont, taglineFontWeight, taglineLetterSpacing, taglineSize, taglineDistance])

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
            status: (error as any).status,
            message: (error as any).message,
            response: (error as any).response
          })
          throw error
        }
      }

      // Helper function to create vector SVG with tagline
      const createClientVectorSVGWithTagline = async (logoColorParam: string, taglineColorParam?: string): Promise<string> => {
        try {
          console.log('Creating vector SVG with tagline using API')
          const apiUrl = 'https://vector-cpxtftl6a-oskarglausers-projects.vercel.app/api/convert'
          
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


      // Create simple brand info text file
      const brandInfo = `${brandName} Brand Package

FILES INCLUDED:
LOGO FILES:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark.png (for light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light.png (for dark backgrounds)  
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark.svg (vector, light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light.svg (vector, dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-dark-white-bg.svg (with white background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-logo-light-dark-bg.svg (with dark background)${hasTagline ? `

LOGO WITH TAGLINE FILES:
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark.png (for light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light.png (for dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark.svg (vector, light backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light.svg (vector, dark backgrounds)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-dark-white-bg.svg (with white background)
- ${brandName.replace(/\s+/g, '-').toLowerCase()}-with-tagline-light-dark-bg.svg (with dark background)` : ''}

BRAND SPECIFICATIONS:
LOGO:
Font: ${selectedFont}
Weight: ${fontWeight}
Letter Spacing: ${letterSpacing}px
Case: ${textCase === 'uppercase' ? 'Uppercase' : 'Standard Case'}${hasTagline ? `

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

USAGE GUIDELINES:
✓ Use dark logos on light backgrounds
✓ Use light logos on dark backgrounds  
✓ Use SVG files for websites and scalable applications
✓ Use PNG files for documents and presentations
✓ Maintain clear space around logo
✓ Scale proportionally - don't stretch or distort${hasTagline ? `
✓ Use logo-only files when space is limited
✓ Use logo with tagline files when more context is needed` : ''}

✗ Don't change colors, fonts, or spacing
✗ Don't add effects or modify the logo
✗ Don't use on busy backgrounds${hasTagline ? `
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
                className={`select-none ${getFontClass(selectedFont)} inline-block`}
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
              {getFullTaglineText() && (
                <div
                  className={`select-none ${getFontClass(taglineFont)}`}
                  style={{
                    fontSize: `calc(${previewFontSize} * ${taglineSize / 100})`,
                    fontWeight: taglineFontWeight,
                    letterSpacing: getLetterSpacingValue(taglineLetterSpacing),
                    textTransform: getTextTransform(taglineTextCase) as any,
                    color: taglineColor,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    marginTop: `calc(${previewFontSize} * ${taglineDistance / 100})`,
                  }}
                >
                  {getFullTaglineText()}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-4 sm:p-6 font-inter" aria-label="Logo customization controls">
            <h2 className="sr-only">Logo Customization Options</h2>
            <div className="space-y-4">
              {/* Logo Section */}
              <div>
                <button
                  type="button"
                  onClick={handleLogoSectionToggle}
                  className="flex items-center justify-between w-full text-base font-bold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span>Logo Settings</span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${showLogoSection ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {showLogoSection && (
                  <div className="space-y-4 mt-4">
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
                  </div>
                )}
              </div>

              {/* Tagline Section */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleTaglineSectionToggle}
                  className="flex items-center justify-between w-full text-base font-bold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span>Add Tagline (Optional)</span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${showTaglineSection ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {showTaglineSection && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="tagline-text" className="text-sm font-medium text-gray-700">
                        Tagline Text
                      </Label>
                      <Input
                        id="tagline-text"
                        value={taglineText}
                        onChange={(e) => setTaglineText(e.target.value)}
                        placeholder="Enter your tagline"
                        className="text-base border-gray-300 focus:border-gray-900 h-10 sm:h-9"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Tagline Font</Label>
                        <Select value={taglineFont} onValueChange={(font) => {
                          setTaglineFont(font)
                          const availableWeights = fontWeightsByFamily[font] || []
                          if (availableWeights.length > 0 && !availableWeights.find(w => w.value === taglineFontWeight)) {
                            setTaglineFontWeight(availableWeights[0].value)
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
                        <Label className="text-sm font-medium text-gray-700">Tagline Weight</Label>
                        <Select value={taglineFontWeight} onValueChange={setTaglineFontWeight}>
                          <SelectTrigger className="border-gray-300 focus:border-gray-900 text-sm h-10 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(fontWeightsByFamily[taglineFont] || []).map((weight) => (
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
                        <Label className="text-sm font-medium text-gray-700">Tagline Letter Spacing</Label>
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
                        <Label className="text-sm font-medium text-gray-700">Tagline Case</Label>
                        <RadioGroup value={taglineTextCase} onValueChange={setTaglineTextCase} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="normal" id="tagline-case-normal" className="h-4 w-4" />
                            <Label htmlFor="tagline-case-normal" className="text-sm cursor-pointer text-gray-600">Normal (Aa)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="uppercase" id="tagline-uppercase" className="h-4 w-4" />
                            <Label htmlFor="tagline-uppercase" className="text-sm cursor-pointer text-gray-600">Upper (AA)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
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
                        <Label className="text-sm font-medium text-gray-700">
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
                        <Label className="text-sm font-medium text-gray-700">Tagline Color</Label>
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
                className={`select-none ${getFontClass(selectedFont)} inline-block`}
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
              {getFullTaglineText() && (
                <div
                  className={`select-none ${getFontClass(taglineFont)}`}
                  style={{
                    fontSize: `calc(${previewFontSize} * ${taglineSize / 100})`,
                    fontWeight: taglineFontWeight,
                    letterSpacing: getLetterSpacingValue(taglineLetterSpacing),
                    textTransform: getTextTransform(taglineTextCase) as any,
                    color: taglineColor,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    marginTop: `calc(${previewFontSize} * ${taglineDistance / 100})`,
                  }}
                >
                  {getFullTaglineText()}
                </div>
              )}
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
                    Perfect for print, web, scalable brand applications, and importing into Figma for design workflows.
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
                  <h3 className="font-semibold text-gray-900 mb-2">Perfect for Vibecoders</h3>
                  <p className="text-sm">
                    Ideal for creating logos for your next coding project, startup launch, 
                    or client work. Perfect for vibecoders who need professional branding fast.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Trademark Symbols</h3>
                  <p className="text-sm">
                    <strong>™</strong> - Unregistered trademark for any brand name<br/>
                    <strong>®</strong> - Registered trademark (requires official registration)<br/>
                    <strong>©</strong> - Copyright symbol for creative works<br/>
                    <a 
                      href="https://en.wikipedia.org/wiki/Trademark" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-gray-900 hover:underline text-xs mt-1 inline-block"
                    >
                      Learn more about trademarks →
                    </a>
                  </p>
                </div>
              </div>
              
              <p className="text-center mt-6 text-gray-500 text-sm">
                Whether you're building the next big SaaS platform, launching a creative agency, 
                or developing an innovative app, our logo generator provides the professional 
                branding assets you need. Perfect for creating the logo for your next vibe coded project.
              </p>
            </div>
            
            {/* FAQ Section */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Frequently Asked Questions</h2>
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
