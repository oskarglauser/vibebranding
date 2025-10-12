/**
 * Color utility functions for handling hex color conversions and validation
 */

export interface CMYKColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a hex color input (3 or 6 digits) and return a full 6-digit hex color
 */
export function parseHexColor(input: string, fallback: string = '000000'): string {
  // Remove any non-hex characters and limit to 6 characters
  const cleanValue = input.replace(/[^a-fA-F0-9]/g, '').slice(0, 6);

  if (cleanValue.length === 3) {
    // Convert 3-digit hex to 6-digit (e.g., "f0a" → "ff00aa")
    return cleanValue.split('').map(char => char + char).join('');
  } else if (cleanValue.length === 6) {
    // Use as-is for 6-digit hex
    return cleanValue;
  } else if (cleanValue.length > 0) {
    // For incomplete hex codes, pad with fallback digits
    const fallbackHex = fallback.replace('#', '');
    return (cleanValue + fallbackHex + '000000').slice(0, 6);
  }

  return fallback;
}

/**
 * Convert a hex color to RGB
 */
export function hexToRgb(hex: string): RGBColor {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16)
  };
}

/**
 * Convert RGB to CMYK
 */
export function rgbToCmyk(rgb: RGBColor): CMYKColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

/**
 * Convert hex color to CMYK
 */
export function hexToCmyk(hex: string): CMYKColor {
  const rgb = hexToRgb(hex);
  return rgbToCmyk(rgb);
}

/**
 * Format CMYK color as string
 */
export function formatCmyk(cmyk: CMYKColor): string {
  return `C${cmyk.c} M${cmyk.m} Y${cmyk.y} K${cmyk.k}`;
}

/**
 * Validate if a string is a valid hex color
 */
export function isValidHexColor(hex: string): boolean {
  const cleanHex = hex.replace('#', '');
  return /^[a-fA-F0-9]{3}$|^[a-fA-F0-9]{6}$/.test(cleanHex);
}
