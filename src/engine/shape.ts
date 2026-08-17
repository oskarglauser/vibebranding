/**
 * Text shaping: glyphs -> outlines, with kerning, tracking and trademark rules.
 *
 * Output is in em units with the baseline at y = 0 and y growing downward, so a
 * shaped run drops straight into SVG. Nothing here knows about pixels; the
 * renderer picks the final scale.
 */

import { formatNumber, transformPath } from './pathGeometry'
import type { Box, LoadedFont, TextCase, TrademarkKind } from './types'

export { formatNumber }

export type ShapedText = {
  /** SVG path data for the whole run, in em units. */
  d: string
  /** Total advance width including tracking, in em. */
  advanceWidth: number
  /** Tight ink bounds, in em. Empty text yields a zero box. */
  inkBox: Box
}

const EMPTY_BOX: Box = { x1: 0, y1: 0, x2: 0, y2: 0 }

export const TRADEMARK_GLYPHS: Record<Exclude<TrademarkKind, 'none'>, string> = {
  r: '®',
  c: '©',
  tm: '™',
}

/**
 * Trademark marks are set at a fraction of cap height and aligned optically:
 * ® and ™ hang off the cap line (superscript position), © sits on the baseline
 * because it is a full-height circular glyph, not a superscript form.
 */
const TRADEMARK_RULES = {
  r: { heightOfCap: 0.42, align: 'cap' as const, gap: 0.05 },
  tm: { heightOfCap: 0.42, align: 'cap' as const, gap: 0.05 },
  c: { heightOfCap: 0.5, align: 'baseline' as const, gap: 0.06 },
}

export function applyCase(text: string, textCase: TextCase): string {
  return textCase === 'uppercase' ? text.toLocaleUpperCase() : text
}

function unionBox(a: Box, b: Box): Box {
  if (a === EMPTY_BOX) return b
  return {
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
    x2: Math.max(a.x2, b.x2),
    y2: Math.max(a.y2, b.y2),
  }
}

function isEmptyBox(box: Box): boolean {
  return box.x2 <= box.x1 && box.y2 <= box.y1
}

/**
 * Shape a run of text into a single path.
 *
 * @param tracking extra spacing between glyphs, in em
 */
export function shapeText(
  loaded: LoadedFont,
  text: string,
  options: { tracking?: number; textCase?: TextCase } = {},
): ShapedText {
  const { font, kerning, metrics } = loaded
  const tracking = options.tracking ?? 0
  const content = applyCase(text, options.textCase ?? 'normal')

  if (content.length === 0) return { d: '', advanceWidth: 0, inkBox: EMPTY_BOX }

  const scale = 1 / metrics.unitsPerEm
  const chars = Array.from(content)
  let pen = 0
  let previousGlyphIndex: number | null = null
  let d = ''
  let inkBox: Box = EMPTY_BOX

  for (const char of chars) {
    const glyph = font.charToGlyph(char)
    if (!glyph) continue

    if (previousGlyphIndex !== null) {
      pen += kerning.get(previousGlyphIndex, glyph.index) * scale
    }

    // getPath is y-down with the baseline at y = 0 — the SVG convention.
    const path = glyph.getPath(pen, 0, 1)
    const data = path.toPathData(4)
    if (data) {
      d += (d ? ' ' : '') + data
      const box = path.getBoundingBox()
      if (Number.isFinite(box.x1)) inkBox = unionBox(inkBox, box)
    }

    pen += (glyph.advanceWidth ?? 0) * scale + tracking
    previousGlyphIndex = glyph.index
  }

  // Tracking is spacing *between* letters; drop the trailing one.
  const advanceWidth = Math.max(0, pen - (chars.length > 0 ? tracking : 0))

  return { d, advanceWidth, inkBox: isEmptyBox(inkBox) ? EMPTY_BOX : inkBox }
}

/**
 * Shape the wordmark plus its trademark mark, if any.
 *
 * The mark is scaled to a fraction of cap height and positioned against the
 * wordmark's ink edge — not its advance width — so the optical gap stays even
 * whatever letter the name ends on.
 */
export function shapeWordmark(
  loaded: LoadedFont,
  text: string,
  options: { tracking?: number; textCase?: TextCase; trademark?: TrademarkKind } = {},
): ShapedText {
  const base = shapeText(loaded, text, options)
  const trademark = options.trademark ?? 'none'
  if (trademark === 'none' || base.d === '') return base

  const rule = TRADEMARK_RULES[trademark]
  const mark = shapeText(loaded, TRADEMARK_GLYPHS[trademark])
  if (mark.d === '' || isEmptyBox(mark.inkBox)) return base

  const capHeight = loaded.metrics.capHeight
  const markInkHeight = mark.inkBox.y2 - mark.inkBox.y1
  const scale = (capHeight * rule.heightOfCap) / markInkHeight

  // Left edge of the scaled mark, placed after the wordmark's ink.
  const x = base.inkBox.x2 + rule.gap * capHeight - mark.inkBox.x1 * scale
  // Cap-aligned marks hang from the cap line; © rests on the baseline.
  const y =
    rule.align === 'cap' ? -capHeight - mark.inkBox.y1 * scale : -mark.inkBox.y2 * scale

  const transformed = transformPathData(mark.d, scale, x, y)
  const markBox: Box = {
    x1: mark.inkBox.x1 * scale + x,
    y1: mark.inkBox.y1 * scale + y,
    x2: mark.inkBox.x2 * scale + x,
    y2: mark.inkBox.y2 * scale + y,
  }

  return {
    d: `${base.d} ${transformed}`,
    advanceWidth: Math.max(base.advanceWidth, markBox.x2),
    inkBox: unionBox(base.inkBox, markBox),
  }
}

/**
 * Scale and translate path data.
 *
 * Baking the transform into the coordinates (rather than wrapping in a <g>)
 * keeps the exported SVG flat: one path per colour, and no nested transforms
 * for design tools to flatten on import.
 *
 * The parsing lives in pathGeometry, which handles the general similarity case
 * (rotation and mirroring included) that the drawn marks need.
 */
export function transformPathData(d: string, scale: number, dx: number, dy: number): string {
  return transformPath(d, { scale, dx, dy })
}

export function translatePathData(d: string, dx: number, dy: number): string {
  return transformPathData(d, 1, dx, dy)
}
