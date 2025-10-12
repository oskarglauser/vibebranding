declare module 'nearest-pantone' {
  export interface PantoneResult {
    pantone: string
    name: string
    hex: string
  }

  export function getClosestColor(hex: string): PantoneResult
}
