/**
 * Pantone color conversion utilities
 */
import nearestPantone from 'nearest-pantone'

export interface PantoneMatch {
  name: string
  hex: string
  distance: number
}

/**
 * Convert hex color to nearest Pantone color
 */
export function hexToPantone(hex: string): PantoneMatch {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  try {
    const result = nearestPantone(cleanHex)
    return {
      name: result.name || 'Unknown',
      hex: result.hex || cleanHex,
      distance: result.distance || 0
    }
  } catch (error) {
    console.error('Pantone conversion error:', error)
    return {
      name: 'Unknown',
      hex: cleanHex,
      distance: Infinity
    }
  }
}

/**
 * Format Pantone color for display
 */
export function formatPantone(pantone: PantoneMatch): string {
  return `${pantone.name} (${pantone.hex.toUpperCase()})`
}
