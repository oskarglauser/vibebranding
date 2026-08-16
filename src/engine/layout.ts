/**
 * Lockup layout — the one place that decides where anything sits.
 *
 * Every measurement is a multiple of the wordmark's **cap height**, so a logo
 * set in Bebas Neue (cap 0.70em) and one set in Playfair (cap 0.71em, but a far
 * bigger x-height and looser fit) get the same optical proportions. The old
 * implementation measured in font-size percentages, which is why symbols
 * changed apparent size and taglines changed apparent gap whenever the font or
 * the brand name changed.
 *
 * Layout space: 1 unit = 1 em of the wordmark font, baseline at y = 0, y down.
 */

import { shapeText, shapeWordmark, transformPathData, translatePathData } from './shape'
import type { Box, LayoutPiece, LoadedFont, LogoLayout, LogoSpec, SizeStep } from './types'

/**
 * Design constants, in cap heights.
 *
 * Symbol sizes are deliberately close to 1: a mark that reads as the same
 * optical weight as the capitals is what makes a lockup look drawn rather than
 * assembled. "Large" tops out at 1.5 rather than the old 2.0 because past that
 * the mark stops being a companion to the wordmark and starts competing.
 */
const RULES = {
  symbolHeight: { sm: 1.0, md: 1.25, lg: 1.5 } satisfies Record<SizeStep, number>,
  /** Gap between a left-placed symbol and the wordmark. */
  symbolGapLeft: 0.5,
  /** Gap between a stacked symbol and the cap line below it. */
  symbolGapAbove: 0.6,
  /** Tagline cap height as a fraction of the wordmark's. */
  taglineScale: { sm: 0.26, md: 0.34, lg: 0.44 } satisfies Record<SizeStep, number>,
  /** Baseline-to-cap-line gap between wordmark and tagline. */
  taglineGap: 0.45,
  /** Extra tracking applied to taglines — small text needs air to stay legible. */
  taglineTrackingBoost: 0.02,
  /** Extra tracking for uppercase settings, which look cramped at default fit. */
  uppercaseTrackingBoost: 0.04,
  /** Clear space around the lockup, in cap heights. */
  clearSpace: 1,
}

function unionBox(a: Box | null, b: Box): Box {
  if (!a) return b
  return {
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
    x2: Math.max(a.x2, b.x2),
    y2: Math.max(a.y2, b.y2),
  }
}

/**
 * Automatic tracking on top of the user's value.
 * Uppercase and small text both need loosening; this is applied silently so the
 * "Tracking" control stays a relative adjustment rather than an absolute one.
 */
export function effectiveTracking(base: number, options: { uppercase: boolean; isTagline: boolean }): number {
  let tracking = base
  if (options.uppercase) tracking += RULES.uppercaseTrackingBoost
  if (options.isTagline) tracking += RULES.taglineTrackingBoost
  return tracking
}

export type LayoutInput = {
  spec: LogoSpec
  wordmarkFont: LoadedFont
  taglineFont: LoadedFont | null
}

/**
 * Build the lockup. Pure function: same input, same geometry, every time.
 */
export function layoutLogo({ spec, wordmarkFont, taglineFont }: LayoutInput): LogoLayout {
  const cap = wordmarkFont.metrics.capHeight
  const pieces: LayoutPiece[] = []

  const wordmark = shapeWordmark(wordmarkFont, spec.brandName, {
    tracking: effectiveTracking(spec.tracking, {
      uppercase: spec.textCase === 'uppercase',
      isTagline: false,
    }),
    textCase: spec.textCase,
    trademark: spec.trademark,
  })

  const hasWordmark = wordmark.d !== ''
  const wordmarkBox = hasWordmark ? wordmark.inkBox : { x1: 0, y1: -cap, x2: 0, y2: 0 }

  // --- tagline -------------------------------------------------------------
  const taglineText = spec.tagline.trim()
  const showTagline = taglineText.length > 0 && taglineFont !== null
  let taglineShaped: ReturnType<typeof shapeText> | null = null
  let taglineScale = 1

  if (showTagline && taglineFont) {
    const targetCap = cap * RULES.taglineScale[spec.taglineSize]
    taglineScale = targetCap / taglineFont.metrics.capHeight
    taglineShaped = shapeText(taglineFont, taglineText, {
      // Tracking is specified in the tagline's own em, so it scales with it.
      tracking: effectiveTracking(spec.taglineTracking, {
        uppercase: spec.taglineCase === 'uppercase',
        isTagline: true,
      }),
      textCase: spec.taglineCase,
    })
  }

  const taglineInkWidth = taglineShaped
    ? (taglineShaped.inkBox.x2 - taglineShaped.inkBox.x1) * taglineScale
    : 0

  // --- text block (wordmark + tagline), origin at wordmark baseline --------
  const textBlockWidth = Math.max(wordmarkBox.x2 - wordmarkBox.x1, taglineInkWidth)

  // --- symbol --------------------------------------------------------------
  const hasSymbol = spec.symbol !== null && spec.symbolPlacement !== 'none'
  const symbolHeight = hasSymbol ? cap * RULES.symbolHeight[spec.symbolSize] : 0
  const symbolInk = spec.symbol?.inkBox
  const symbolAspect =
    symbolInk && symbolInk.y2 > symbolInk.y1
      ? (symbolInk.x2 - symbolInk.x1) / (symbolInk.y2 - symbolInk.y1)
      : 1
  const symbolWidth = symbolHeight * symbolAspect

  // Horizontal offsets: where the text block starts.
  let textX = 0
  let symbolX = 0
  let symbolY = 0

  if (hasSymbol && spec.symbolPlacement === 'left') {
    symbolX = 0
    textX = symbolWidth + RULES.symbolGapLeft * cap
    // Centre the mark on the cap band, not on the full ink box: descenders in
    // the name must not drag the symbol downward.
    symbolY = -cap / 2 - symbolHeight / 2
  } else if (hasSymbol && spec.symbolPlacement === 'above') {
    symbolX = (textBlockWidth - symbolWidth) / 2
    symbolY = -cap - RULES.symbolGapAbove * cap - symbolHeight
  }

  // Centre the wordmark within the text block when a stacked symbol or a wider
  // tagline makes the block wider than the name itself.
  const wordmarkWidth = wordmarkBox.x2 - wordmarkBox.x1
  const wordmarkX = textX + (textBlockWidth - wordmarkWidth) / 2 - wordmarkBox.x1

  let inkBox: Box | null = null

  if (hasWordmark) {
    pieces.push({
      kind: 'path',
      d: translatePathData(wordmark.d, wordmarkX, 0),
      color: spec.colors.wordmark,
    })
    inkBox = unionBox(inkBox, {
      x1: wordmarkBox.x1 + wordmarkX,
      y1: wordmarkBox.y1,
      x2: wordmarkBox.x2 + wordmarkX,
      y2: wordmarkBox.y2,
    })
  }

  if (taglineShaped && taglineShaped.d !== '') {
    // Cap line of the tagline sits a fixed gap below the wordmark baseline.
    const taglineBaseline = RULES.taglineGap * cap + taglineScale * taglineFont!.metrics.capHeight

    // Horizontal lockups align the tagline to the wordmark's left ink edge —
    // the shared left edge is what makes the two lines read as one block.
    // Stacked and wordmark-only lockups centre it, since there is no edge to
    // align to.
    const centred = spec.symbolPlacement !== 'left'
    const taglineX = centred
      ? textX + (textBlockWidth - taglineInkWidth) / 2 - taglineShaped.inkBox.x1 * taglineScale
      : wordmarkX + wordmarkBox.x1 - taglineShaped.inkBox.x1 * taglineScale

    const scaled = transformPathData(taglineShaped.d, taglineScale, taglineX, taglineBaseline)
    pieces.push({ kind: 'path', d: scaled, color: spec.colors.tagline })
    inkBox = unionBox(inkBox, {
      x1: taglineShaped.inkBox.x1 * taglineScale + taglineX,
      y1: taglineShaped.inkBox.y1 * taglineScale + taglineBaseline,
      x2: taglineShaped.inkBox.x2 * taglineScale + taglineX,
      y2: taglineShaped.inkBox.y2 * taglineScale + taglineBaseline,
    })
  }

  if (hasSymbol && spec.symbol) {
    // Normalise on ink: marks are authored in a 0..1 box but rarely fill it, and
    // an unnormalised mark changes apparent size from one design to the next.
    const ink = spec.symbol.inkBox
    const inkW = Math.max(ink.x2 - ink.x1, 1e-6)
    const inkH = Math.max(ink.y2 - ink.y1, 1e-6)
    const scale = symbolHeight / inkH
    const transform = `translate(${round(symbolX - ink.x1 * scale)} ${round(symbolY - ink.y1 * scale)}) scale(${round(scale)})`

    pieces.push({
      kind: 'symbol',
      content: spec.symbol.content,
      color: spec.colors.symbol,
      transform,
    })
    inkBox = unionBox(inkBox, {
      x1: symbolX,
      y1: symbolY,
      x2: symbolX + inkW * scale,
      y2: symbolY + symbolHeight,
    })
  }

  return {
    pieces,
    inkBox: inkBox ?? { x1: 0, y1: 0, x2: 0, y2: 0 },
    clearSpace: RULES.clearSpace * cap,
    capHeight: cap,
  }
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000
}

export { RULES as LAYOUT_RULES }
