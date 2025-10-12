/**
 * Font utility functions for handling font class names and weight lookups
 */

/**
 * Get Tailwind font class from font family name
 */
export function getFontClass(font: string): string {
  const fontMap: Record<string, string> = {
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
  };

  return fontMap[font] || 'font-inter';
}
