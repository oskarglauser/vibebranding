/**
 * Symbol feature type definitions
 */

export type SymbolMode = 'none' | 'letter' | 'shape' | 'pattern';

export type SymbolPlacement = 'above' | 'left' | 'separate';

export interface SymbolConfig {
  mode: SymbolMode;
  seed: string;
  font?: string; // Used for letter mode
  placement: SymbolPlacement;
  size: number; // Percentage (30-100)
  distance: number; // Percentage for spacing (0-50)
  color: string; // Hex color
}

export type SymbolSVGResult = {
  svg: string;
  viewBox: {
    width: number;
    height: number;
  };
}
