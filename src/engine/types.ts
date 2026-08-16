/**
 * Shared types for the logo rendering engine.
 *
 * The engine has one job: turn a LogoSpec (what the user chose) plus loaded
 * fonts into a LogoLayout (pure geometry), which renders to an SVG string. The
 * preview, the exported SVG and the rasterised PNG all come from that same
 * string, which is what keeps them identical.
 *
 * Coordinate system: everything is in **em units of the wordmark font** with
 * the wordmark baseline at y = 0 and y growing downward (SVG convention).
 * Design constants are expressed as multiples of cap height, never font size.
 */

import type { Font } from 'opentype.js'
import type { KerningTable } from './kerning'
import type { FontMetrics } from './metrics'

export type LoadedFont = {
  family: string
  weight: number
  font: Font
  kerning: KerningTable
  metrics: FontMetrics
}

export type TrademarkKind = 'none' | 'r' | 'c' | 'tm'
export type TextCase = 'normal' | 'uppercase'
export type SymbolPlacement = 'left' | 'above' | 'none'
export type SizeStep = 'sm' | 'md' | 'lg'

/** A generated mark, as pure geometry in a 0..1 unit box. */
export type SymbolArt = {
  /** SVG path/shape markup, coordinates within a 0 0 1 1 viewBox. */
  content: string
  /** Ink bounds within that box, used to optically normalise size. */
  inkBox: Box
}

export type Box = { x1: number; y1: number; x2: number; y2: number }

export type LogoSpec = {
  brandName: string
  fontFamily: string
  fontWeight: number
  /** Extra letter spacing in em (0.01 = 1% of the em). */
  tracking: number
  textCase: TextCase
  trademark: TrademarkKind

  tagline: string
  taglineFontFamily: string
  taglineFontWeight: number
  taglineTracking: number
  taglineCase: TextCase
  taglineSize: SizeStep

  symbol: SymbolArt | null
  symbolPlacement: SymbolPlacement
  symbolSize: SizeStep

  colors: {
    wordmark: string
    tagline: string
    symbol: string
  }
}

/** A drawable piece of the lockup, already positioned in layout space. */
export type LayoutPiece =
  | { kind: 'path'; d: string; color: string }
  | { kind: 'symbol'; content: string; color: string; transform: string }

export type LogoLayout = {
  pieces: LayoutPiece[]
  /** Tight ink bounds of everything drawn. */
  inkBox: Box
  /** Recommended clear space around the ink, in layout units (= 1 cap height). */
  clearSpace: number
  /** Cap height in layout units — the scale reference for the whole lockup. */
  capHeight: number
}
