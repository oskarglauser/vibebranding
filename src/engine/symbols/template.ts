/**
 * The mark template contract.
 *
 * A template is a hand-drawn mark plus a description of how it adapts. The
 * drawing lives in `draw` as literal tuned coordinates on a 0..100 grid; the
 * adapting is done by `FitContext`, which carries the measured letterform and
 * the axes derived from it.
 *
 * Determinism is structural rather than a convention. Templates receive a fixed
 * array of pre-drawn random values instead of a generator, so a template that
 * takes an early exit or skips a branch cannot shift the values every later
 * decision sees. `draw` is a pure function of its context.
 */

import { leanFor, type LetterForm } from './letterform'
import { bounds, mat, pathDataFor, transformAll, unionBounds, type Outline } from './pen'
import type { Box, LoadedFont, SymbolArt } from '../types'

/** The grid templates are authored on. */
export const GRID = 100

export type TemplateFamily = 'monogram' | 'geometric' | 'organic' | 'motion' | 'structural'

/**
 * How the brand's initial takes part.
 * - `none`   the mark stands alone
 * - `inside` the letter sits within the mark
 * - `carved` the letter is cut out of the mark as negative space
 * - `echo`   the mark borrows a gesture from the letter without showing it
 */
export type LetterRole = 'none' | 'inside' | 'carved' | 'echo'

/**
 * Tones are densities of one ink, not separate colours: the renderer supplies
 * the fill on the wrapping group, and a tinted part simply lets more of the
 * background through.
 *
 * A tint painted over a solid of the same colour is invisible — 35% of a colour
 * composited onto 100% of it is still 100%. So a tinted part only reads against
 * the background, which means tint is always the under-layer and must extend
 * beyond whatever solid sits on it.
 */
export type Tone = 'solid' | 'tint'

export const TONE_OPACITY: Record<Tone, number> = { solid: 1, tint: 0.32 }

export type MarkPart = {
  outlines: Outline[]
  tone?: Tone
  /** Even-odd turns overlapping outlines into knockouts. */
  evenodd?: boolean
}

export type FitAxes = {
  /** Stroke weight on the 0..100 grid, matched to the wordmark's stem. */
  stroke: number
  /** Degrees from upright, quantised and clamped. Nothing is ever inverted. */
  lean: number
  /** Horizontal stretch, following how wide the letter is. */
  aspect: number
  /** Corner softness on the 0..100 grid. */
  radius: number
  /** Somewhere inside the letter an element can sit, in grid space. */
  counterSlot: { cx: number; cy: number; size: number } | null
  /** Flip so the mark's diagonal runs with the letter's rather than against. */
  mirror: boolean
}

export type LetterPlacement = {
  /** The initial's outline, already placed on the 0..100 grid. */
  outline: Outline
  box: Box
  form: LetterForm
}

export type FitContext = {
  variant: number
  form: LetterForm
  secondForm: LetterForm | null
  fit: FitAxes
  /**
   * Draw the brand initial at a chosen cap height, centred on a point.
   *
   * The template picks the size, because how much air a letter needs depends
   * on what surrounds it: a ring wants a smaller letter than a bare slice.
   * Returns null when there is no usable letter.
   */
  letterAt(
    capHeight: number,
    cx?: number,
    cy?: number,
    maxWidth?: number,
    maxHeight?: number,
  ): LetterPlacement | null
  /** The same for the second initial, when the name has two words. */
  secondAt(
    capHeight: number,
    cx?: number,
    cy?: number,
    maxWidth?: number,
    maxHeight?: number,
  ): LetterPlacement | null
  /**
   * Eight values in [0,1), drawn before `draw` runs. Templates index this
   * rather than calling a generator, so no branch can desynchronise the
   * sequence and determinism holds by construction.
   */
  jitter: readonly number[]
  font: LoadedFont
  /** True when drawing for a very small size and detail should be dropped. */
  reduced: boolean
}

export type MarkTemplate = {
  id: string
  label: string
  family: TemplateFamily
  letterRole: LetterRole
  /** How many hand-authored variants `draw` can produce. */
  variants: number
  /** Smallest pixel size this still reads at. */
  minSize: 16 | 24 | 32
  /** How well this flatters a given letter. Below zero removes it entirely. */
  score(form: LetterForm): number
  /** Pure. Returns null when it cannot serve this letter. */
  draw(fit: FitContext): MarkPart[] | null
}

export const JITTER_COUNT = 8

/**
 * Derive the fit axes from the measured letter.
 *
 * Every axis is quantised. Two letters that measure almost the same should
 * produce the same mark rather than two marks that differ by an invisible
 * fraction of a degree.
 */
export function fitAxesFor(form: LetterForm, font: LoadedFont, respondsToAxis: boolean): FitAxes {
  const stemRatio = font.metrics.stemWidth / font.metrics.capHeight
  const stroke = Math.min(Math.max(stemRatio * GRID, 4.5), 30)

  // Width follows the face: a condensed letter gets a condensed mark.
  const wide = Math.min(1, Math.max(0, (form.widthRatio - 0.35) / 0.45))
  const aspect = Math.round((0.88 + 0.24 * wide) / 0.06) * 0.06

  // Corner softness follows how curved the letter is drawn.
  const radius = form.roundness < 0.2 ? 0 : form.roundness < 0.5 ? 6 : form.roundness < 0.75 ? 12 : 20

  const counter = form.primaryCounter
  const counterSlot =
    counter && counter.areaShare >= 0.03
      ? {
          cx: counter.slot.cx * GRID,
          cy: counter.slot.cy * GRID,
          size: counter.slot.size * GRID * 0.8,
        }
      : null

  return {
    stroke,
    lean: respondsToAxis ? leanFor(form) : 0,
    aspect,
    radius,
    counterSlot,
    mirror:
      !form.symmetricVertical && form.diagonalAngle !== null && form.diagonalAngle > 90,
  }
}

/**
 * Turn drawn parts into a SymbolArt in the 0..1 box the engine expects.
 *
 * Parts sharing a tone and fill rule merge into one path, so a mark is one or
 * two path elements rather than a dozen. Colour is never emitted: the renderer
 * puts the fill on the group above, which is what lets the same geometry serve
 * the light and reversed variants.
 */
export function compileParts(parts: MarkPart[]): SymbolArt | null {
  const all = parts.flatMap((part) => part.outlines)
  const box = unionBounds(all)
  if (!box || box.x2 <= box.x1 || box.y2 <= box.y1) return null

  const toUnit = mat.scale(1 / GRID)
  const groups = new Map<string, Outline[]>()

  for (const part of parts) {
    if (part.outlines.length === 0) continue
    const key = `${part.tone ?? 'solid'}|${part.evenodd ? 'evenodd' : 'nonzero'}`
    const existing = groups.get(key)
    const scaled = transformAll(part.outlines, toUnit)
    if (existing) existing.push(...scaled)
    else groups.set(key, scaled)
  }

  // Solid first, so the dominant ink is never buried by a tint above it.
  const ordered = [...groups.entries()].sort(([a], [b]) => (a.startsWith('solid') ? -1 : b.startsWith('solid') ? 1 : 0))

  const pieces: string[] = []
  for (const [key, outlines] of ordered) {
    const [tone, rule] = key.split('|')
    const attributes = [
      rule === 'evenodd' ? ' fill-rule="evenodd"' : '',
      tone === 'tint' ? ` fill-opacity="${TONE_OPACITY.tint}"` : '',
    ].join('')
    pieces.push(`<path d="${pathDataFor(outlines)}"${attributes}/>`)
  }

  if (pieces.length === 0) return null

  return {
    content: pieces.join(''),
    inkBox: {
      x1: box.x1 / GRID,
      y1: box.y1 / GRID,
      x2: box.x2 / GRID,
      y2: box.y2 / GRID,
    },
  }
}

/** Ink bounds of a set of parts, on the authoring grid. */
export function partsBounds(parts: MarkPart[]): Box | null {
  return unionBounds(parts.flatMap((part) => part.outlines))
}

/**
 * Scale and centre a composition so it sits inside the grid.
 *
 * For marks assembled from several pieces — two interlocked initials, a row of
 * elements — the total size is not known until the pieces are placed. Rather
 * than have each template solve that arithmetic, compose freely and fit at the
 * end. Only shrinks: a mark drawn deliberately small stays small.
 */
export function fitParts(parts: MarkPart[], inset = 0): MarkPart[] {
  const box = partsBounds(parts)
  if (!box) return parts

  const available = GRID - inset * 2
  const width = box.x2 - box.x1
  const height = box.y2 - box.y1
  if (width <= 0 || height <= 0) return parts

  const scale = Math.min(1, available / width, available / height)
  const cx = (box.x1 + box.x2) / 2
  const cy = (box.y1 + box.y2) / 2
  const centre = GRID / 2
  const m = mat.mul(mat.scaleAbout(scale, scale, cx, cy), mat.translate(centre - cx, centre - cy))

  return parts.map((part) => ({ ...part, outlines: transformAll(part.outlines, m) }))
}

export { bounds }
