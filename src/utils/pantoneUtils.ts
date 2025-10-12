/**
 * Pantone color conversion utilities
 */
import { getClosestColor } from 'nearest-pantone'

export interface PantoneMatch {
  pantone: string
  name: string
  hex: string
}

/**
 * Convert hex color to nearest Pantone color
 */
export function hexToPantone(hex: string): PantoneMatch {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  try {
    const result = getClosestColor(cleanHex)
    return {
      pantone: result.pantone || 'Unknown',
      name: result.name || 'Unknown',
      hex: result.hex || `#${cleanHex}`
    }
  } catch (error) {
    console.error('Pantone conversion error:', error)
    return {
      pantone: 'Unknown',
      name: 'Unknown',
      hex: `#${cleanHex}`
    }
  }
}

/**
 * Format Pantone color for display
 */
export function formatPantone(pantone: PantoneMatch): string {
  return `${pantone.pantone} ${pantone.name}`
}
