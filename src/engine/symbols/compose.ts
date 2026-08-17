/**
 * Building a mark: measure the letter, derive the fit, draw, compile.
 *
 * This is the only place that knows how a template turns into a SymbolArt, so
 * the templates themselves stay pure drawing.
 */

import { createSeededRandom } from '../../utils/seedUtils'
import { shapeText } from '../shape'
import { measureLetterForm, type LetterForm } from './letterform'
import { bounds, mat, pen, transform, type Outline } from './pen'
import {
  compileParts,
  fitAxesFor,
  GRID,
  JITTER_COUNT,
  type FitContext,
  type LetterPlacement,
  type MarkTemplate,
} from './template'
import type { LoadedFont, SymbolArt } from '../types'

export type ComposeContext = {
  font: LoadedFont
  /** First letter of the brand name. */
  initial: string
  /** Initials of the first two words, when the name has two. */
  initials?: string[]
  seed: string
  variant?: number
  /** Drawing for a very small size: templates may drop detail. */
  reduced?: boolean
}

/**
 * Place a letter on the authoring grid at a given cap height, centred on its
 * own ink.
 *
 * Scaling by cap height rather than ink height is what keeps letters looking
 * the same size as each other: an O overshoots its cap line slightly and an X
 * does not, and normalising on ink would shrink the O to compensate for a
 * difference the eye reads as correct.
 */
export function placeLetter(
  font: LoadedFont,
  character: string,
  capHeight: number,
  cx: number,
  cy: number,
  maxWidth?: number,
  maxHeight?: number,
): LetterPlacement | null {
  if (!character) return null

  const shaped = shapeText(font, character)
  if (!shaped.d) return null

  let scale = capHeight / font.metrics.capHeight

  // Cap height is the right size to *set* a letter at, but not a bound on the
  // room it takes: a W is nearly twice the width of an I, and a Q hangs a tail
  // below the line it was measured against. Give the size back when the ink
  // does not fit what it has to sit in.
  if (maxWidth !== undefined || maxHeight !== undefined) {
    const natural = bounds(transform(pen(shaped.d), mat.scale(scale)))
    if (natural) {
      const width = natural.x2 - natural.x1
      const height = natural.y2 - natural.y1
      let shrink = 1
      if (maxWidth !== undefined && width > maxWidth) shrink = Math.min(shrink, maxWidth / width)
      if (maxHeight !== undefined && height > maxHeight) {
        shrink = Math.min(shrink, maxHeight / height)
      }
      scale *= shrink
    }
  }

  const outline = transform(pen(shaped.d), mat.scale(scale))
  const box = bounds(outline)
  if (!box) return null

  const centred = transform(
    outline,
    mat.translate(cx - (box.x1 + box.x2) / 2, cy - (box.y1 + box.y2) / 2),
  )
  const centredBox = bounds(centred)
  if (!centredBox) return null

  return { outline: centred, box: centredBox, form: measureLetterForm(font, character) }
}

function jitterFor(seed: string): number[] {
  const random = createSeededRandom(seed)
  return Array.from({ length: JITTER_COUNT }, () => random())
}

/**
 * Build a mark from a template.
 *
 * Returns null when the template cannot serve this input — a letter mark with
 * no letter, a two-initial mark with one word — so callers can simply drop it.
 */
export function buildMark(template: MarkTemplate, context: ComposeContext): SymbolArt | null {
  const initial = (context.initial || '').trim().slice(0, 1).toLocaleUpperCase()
  const needsLetter = template.letterRole !== 'none'
  if (needsLetter && !initial) return null

  const form: LetterForm = measureLetterForm(context.font, initial || 'A')
  if (needsLetter && !form.measured) return null

  // A negative score means the template does not flatter this letter. Honour
  // it here so the judgement lives in one place: a template that says no is
  // never built, rather than being built and then filtered somewhere else.
  if (template.score(form) < 0) return null

  const jitter = jitterFor(`${context.seed}:${template.id}:${initial}`)
  const variant =
    context.variant !== undefined
      ? ((context.variant % template.variants) + template.variants) % template.variants
      : Math.floor(jitter[0] * template.variants) % template.variants

  const respondsToAxis = template.letterRole === 'echo' || template.family !== 'monogram'
  const fit = fitAxesFor(form, context.font, respondsToAxis)

  const second = (context.initials?.[1] ?? '').trim().slice(0, 1).toLocaleUpperCase()
  const secondForm = second ? measureLetterForm(context.font, second) : null

  const fitContext: FitContext = {
    variant,
    form,
    secondForm,
    fit,
    letterAt: (capHeight, cx = GRID / 2, cy = GRID / 2, maxWidth = GRID, maxHeight = GRID) =>
      initial ? placeLetter(context.font, initial, capHeight, cx, cy, maxWidth, maxHeight) : null,
    secondAt: (capHeight, cx = GRID / 2, cy = GRID / 2, maxWidth = GRID, maxHeight = GRID) =>
      second ? placeLetter(context.font, second, capHeight, cx, cy, maxWidth, maxHeight) : null,
    jitter,
    font: context.font,
    reduced: context.reduced ?? false,
  }

  try {
    const parts = template.draw(fitContext)
    if (!parts || parts.length === 0) return null
    return compileParts(parts)
  } catch {
    // A template that throws must not take the page down with it.
    return null
  }
}

/** Convenience for templates that need the initial drawn at a given size. */
export function letterOutlineFor(
  font: LoadedFont,
  character: string,
  capHeight: number,
  cx = GRID / 2,
  cy = GRID / 2,
): Outline | null {
  return placeLetter(font, character, capHeight, cx, cy)?.outline ?? null
}
