declare module 'nearest-pantone' {
  export interface PantoneResult {
    name: string
    hex: string
    distance: number
  }

  function nearestPantone(hex: string): PantoneResult
  export default nearestPantone
}
