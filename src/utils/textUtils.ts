/**
 * Text utility functions for handling text transformations and trademark symbols
 */

export type TrademarkSymbolType = 'none' | 'r' | 'c' | 'tm';
export type TextCaseType = 'normal' | 'uppercase';

/**
 * Get the trademark symbol character from symbol type
 */
export function getTrademarkSymbol(symbol: TrademarkSymbolType): string {
  switch (symbol) {
    case 'r':
      return '®';
    case 'c':
      return '©';
    case 'tm':
      return '™';
    default:
      return '';
  }
}

/**
 * Apply text case transformation
 */
export function applyTextCase(text: string, caseType: TextCaseType): string {
  return caseType === 'uppercase' ? text.toUpperCase() : text;
}

/**
 * Get letter spacing CSS value
 */
export function getLetterSpacingValue(spacing: number): string {
  if (spacing === 0) return 'normal';
  return `${spacing / 100}em`;
}

/**
 * Get text transform CSS value
 */
export function getTextTransform(caseType: TextCaseType): 'uppercase' | 'none' {
  return caseType === 'uppercase' ? 'uppercase' : 'none';
}

/**
 * Get the full logo text with trademark symbol
 */
export function getFullLogoText(
  brandName: string,
  textCase: TextCaseType,
  trademarkSymbol: TrademarkSymbolType,
  placeholder: string = 'Your Brand'
): string {
  const displayName = brandName || placeholder;
  const displayText = applyTextCase(displayName, textCase);
  const symbol = getTrademarkSymbol(trademarkSymbol);
  return displayText + symbol;
}

/**
 * Format a string for use as a filename (lowercase, hyphens, no spaces)
 */
export function toFilename(text: string): string {
  return text.replace(/\s+/g, '-').toLowerCase();
}
