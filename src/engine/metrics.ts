/**
 * Typographic metrics derived from a font file.
 *
 * Everything the layout engine positions — symbol size, clear space, tagline
 * gap, trademark height — is expressed in **cap heights**, not font sizes. Two
 * fonts set at the same px size can differ by 30% in cap height, so font-size
 * based geometry (what the old implementation used) drifts from font to font.
 * Cap height is what the eye actually reads as "the size of the logo".
 *
 * All values are returned in em units (1 = one em), so they compose regardless
 * of the font's internal unitsPerEm.
 */

import type { Font, Glyph } from 'opentype.js'

export type FontMetrics = {
  unitsPerEm: number
  /** Height of a flat capital (H) above the baseline, in em. */
  capHeight: number
  /** Height of a flat lowercase (x) above the baseline, in em. */
  xHeight: number
  /** Typographic ascender, in em. */
  ascender: number
  /** Typographic descender (negative), in em. */
  descender: number
  /**
   * Width of a vertical stem, in em. Drives symbol stroke weight so a mark set
   * beside a Light wordmark stays light and beside a Black wordmark stays heavy.
   */
  stemWidth: number
}

export type Segment = { x1: number; y1: number; x2: number; y2: number }

const BEZIER_STEPS = 12

/**
 * Flatten a glyph outline (font units, y-up) into straight segments.
 *
 * Exported because the letterform measurement builds on the same flattening:
 * one traversal of the outline serves both the stem width here and the axis,
 * counters and symmetry read by the mark templates.
 */
export function flattenGlyph(glyph: Glyph, unitsPerEm: number): Segment[] {
  const path = glyph.getPath(0, 0, unitsPerEm)
  const segments: Segment[] = []
  let startX = 0
  let startY = 0
  let x = 0
  let y = 0

  const push = (x2: number, y2: number) => {
    if (x !== x2 || y !== y2) segments.push({ x1: x, y1: y, x2, y2 })
    x = x2
    y = y2
  }

  for (const cmd of path.commands) {
    switch (cmd.type) {
      case 'M':
        x = startX = cmd.x
        y = startY = cmd.y
        break
      case 'L':
        push(cmd.x, cmd.y)
        break
      case 'C': {
        const [x0, y0] = [x, y]
        for (let i = 1; i <= BEZIER_STEPS; i++) {
          const t = i / BEZIER_STEPS
          const mt = 1 - t
          const px =
            mt * mt * mt * x0 + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x
          const py =
            mt * mt * mt * y0 + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y
          push(px, py)
        }
        break
      }
      case 'Q': {
        const [x0, y0] = [x, y]
        for (let i = 1; i <= BEZIER_STEPS; i++) {
          const t = i / BEZIER_STEPS
          const mt = 1 - t
          push(mt * mt * x0 + 2 * mt * t * cmd.x1 + t * t * cmd.x, mt * mt * y0 + 2 * mt * t * cmd.y1 + t * t * cmd.y)
        }
        break
      }
      case 'Z':
        push(startX, startY)
        break
    }
  }

  return segments
}

/**
 * Widths of the ink runs where a horizontal line at `y` crosses the outline.
 * (`glyph.getPath` is y-down, so `y` for a capital is negative.)
 */
export function inkRunsAt(segments: Segment[], y: number): number[] {
  const crossings: number[] = []
  for (const s of segments) {
    const { x1, y1, x2, y2 } = s
    if (y1 === y2) continue
    const min = Math.min(y1, y2)
    const max = Math.max(y1, y2)
    if (y < min || y >= max) continue
    crossings.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1))
  }
  crossings.sort((a, b) => a - b)

  const runs: number[] = []
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    const width = crossings[i + 1] - crossings[i]
    if (width > 0) runs.push(width)
  }
  return runs
}

/**
 * Measure a vertical stem by slicing a glyph at mid-cap-height.
 * 'I' is ideal: at half height it is nothing but stem in both sans and serif
 * faces (serifs sit at the extremes), so we get weight without slab bias.
 */
function measureStemWidth(font: Font, capHeightUnits: number): number | null {
  for (const char of ['I', 'l', 'H', 'E']) {
    const glyph = font.charToGlyph(char)
    if (!glyph || glyph.unicode === undefined) continue

    const segments = flattenGlyph(glyph, font.unitsPerEm)
    if (segments.length === 0) continue

    // Sample a few heights and take the median run to dodge crossbars/spurs.
    const candidates: number[] = []
    for (const fraction of [0.4, 0.5, 0.6]) {
      const runs = inkRunsAt(segments, -capHeightUnits * fraction)
      if (runs.length > 0) candidates.push(Math.min(...runs))
    }
    if (candidates.length === 0) continue

    candidates.sort((a, b) => a - b)
    const median = candidates[Math.floor(candidates.length / 2)]
    if (median > 0) return median
  }
  return null
}

/**
 * Measure the ink height of a glyph above the baseline, in font units.
 * Used as a fallback when the OS/2 table omits cap height / x-height.
 */
function inkHeight(font: Font, char: string): number | null {
  const glyph = font.charToGlyph(char)
  if (!glyph) return null
  const box = glyph.getPath(0, 0, font.unitsPerEm).getBoundingBox()
  const height = -box.y1 // y-down: the top of the glyph is the most negative y
  return Number.isFinite(height) && height > 0 ? height : null
}

export function getFontMetrics(font: Font): FontMetrics {
  const unitsPerEm = font.unitsPerEm
  const os2 = font.tables.os2 as { sCapHeight?: number; sxHeight?: number } | undefined

  const capHeightUnits = os2?.sCapHeight || inkHeight(font, 'H') || unitsPerEm * 0.7
  const xHeightUnits = os2?.sxHeight || inkHeight(font, 'x') || capHeightUnits * 0.72
  const stemUnits = measureStemWidth(font, capHeightUnits) ?? unitsPerEm * 0.08

  return {
    unitsPerEm,
    capHeight: capHeightUnits / unitsPerEm,
    xHeight: xHeightUnits / unitsPerEm,
    ascender: font.ascender / unitsPerEm,
    descender: font.descender / unitsPerEm,
    stemWidth: stemUnits / unitsPerEm,
  }
}
