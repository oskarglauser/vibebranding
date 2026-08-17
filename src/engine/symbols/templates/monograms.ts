/**
 * Monogram devices: the letter itself is the mark.
 *
 * These are the strongest marks the generator makes, because they are built
 * from the brand's own typeface rather than assembled beside it. Everything
 * here is sized in cap heights of the letter, so the amount of air around it
 * stays right across faces.
 */

import { circle, rect, roundedRect, ring, squircle, bar } from '../shapes'
import { fitParts, GRID, type MarkPart, type MarkTemplate } from '../template'
import { mat, transform, type Outline } from '../pen'

const CENTRE = GRID / 2

/** A container plus the letter cut out of it as true negative space. */
function carve(container: Outline, letter: Outline | null): MarkPart[] {
  if (!letter) return [{ outlines: [container] }]
  return [{ outlines: [container, letter], evenodd: true }]
}

/**
 * Cap height for a letter sitting inside a container.
 *
 * Sizing purely by cap height leaves a narrow letter looking lost: an I cut out
 * of a tile removes a twentieth of it and the mark reads as a solid square with
 * a scratch. Widening the letter is not an option — that would distort the
 * typeface — so a narrow letter is set taller instead, which is what a designer
 * does by eye.
 */
function capForLetter(widthRatio: number, base: number): number {
  const compensation = Math.min(1.4, Math.max(1, 0.7 / Math.max(0.2, widthRatio)))
  return Math.min(base * compensation, GRID * 0.86)
}

export const tileKnockout: MarkTemplate = {
  id: 'tile-knockout',
  label: 'Knockout initial',
  family: 'monogram',
  letterRole: 'carved',
  variants: 3,
  minSize: 16,
  score: () => 1,
  draw({ variant, letterAt, fit, form }) {
    // Three containers, deliberately different in character rather than in
    // degree: a disc, a soft tile and a near-square with just-broken corners.
    const container =
      variant === 0
        ? circle(CENTRE, CENTRE, 50)
        : variant === 1
          ? squircle(CENTRE, CENTRE, 50)
          : roundedRect(0, 0, GRID, GRID, Math.max(6, fit.radius))

    // A disc has less usable width than a square, so the letter sits smaller.
    const base = variant === 0 ? 46 : 52
    const room = variant === 0 ? 62 : 76
    const letter = letterAt(capForLetter(form.widthRatio, base), CENTRE, CENTRE, room)
    return carve(container, letter?.outline ?? null)
  },
}

export const ringMonogram: MarkTemplate = {
  id: 'ring-monogram',
  label: 'Initial in a ring',
  family: 'monogram',
  letterRole: 'inside',
  variants: 2,
  minSize: 24,
  // A ring flatters a letter that is not already round: an O inside a circle
  // reads as two circles.
  score: (form) => (form.straightness < 0.25 ? -0.4 : 0.8),
  draw({ variant, letterAt, fit }) {
    const stroke = Math.max(5, fit.stroke)
    const outer = ring(CENTRE, CENTRE, 50, stroke)
    const letter = letterAt(variant === 0 ? 42 : 48)
    if (!letter) return null

    return [{ outlines: [outer, letter.outline] }]
  },
}

export const squircleMonogram: MarkTemplate = {
  id: 'squircle-monogram',
  label: 'Initial in a square',
  family: 'monogram',
  letterRole: 'carved',
  variants: 2,
  minSize: 16,
  score: (form) => (form.straightness < 0.3 ? 0.9 : 0.5),
  draw({ variant, letterAt, fit, form }) {
    const stroke = Math.max(5, fit.stroke)
    const outer = squircle(CENTRE, CENTRE, 50)

    if (variant === 1) {
      // Outlined frame with the letter inside it.
      const frame = { commands: [...outer.commands, ...squircle(CENTRE, CENTRE, 50 - stroke).commands] }
      const letter = letterAt(capForLetter(form.widthRatio, 44), CENTRE, CENTRE, 62)
      if (!letter) return null
      return [{ outlines: [frame, letter.outline], evenodd: true }]
    }

    const letter = letterAt(capForLetter(form.widthRatio, 52), CENTRE, CENTRE, 72)
    return carve(outer, letter?.outline ?? null)
  },
}

export const slicedInitial: MarkTemplate = {
  id: 'sliced-initial',
  label: 'Sliced initial',
  family: 'monogram',
  letterRole: 'carved',
  variants: 3,
  minSize: 32,
  // The cut needs something to cut across. A narrow letter gives a sliver.
  score: (form) => (form.widthRatio < 0.45 ? -0.3 : 0.7),
  draw({ variant, letterAt, fit }) {
    // Leave room either side for the cut to overhang the letter, and room
    // below for a descending tail.
    const letter = letterAt(92, CENTRE, CENTRE, 88, 96)
    if (!letter) return null

    const { box } = letter
    const height = box.y2 - box.y1
    const thickness = Math.max(4, fit.stroke * 0.55)
    // Never halfway: an off-centre cut reads as deliberate, a centred one as
    // an accident of construction.
    const at = variant === 0 ? 0.62 : variant === 1 ? 0.38 : 0.72
    const y = box.y1 + height * at

    const cut = rect(box.x1 - 6, y - thickness / 2, box.x2 - box.x1 + 12, thickness)
    return [{ outlines: [letter.outline, cut], evenodd: true }]
  },
}

export const duoLigature: MarkTemplate = {
  id: 'duo-ligature',
  label: 'Interlocked initials',
  family: 'monogram',
  letterRole: 'inside',
  variants: 2,
  minSize: 32,
  score: () => 0.9,
  draw({ variant, letterAt, secondAt }) {
    const first = letterAt(86)
    const second = secondAt(86)
    if (!first || !second) return null

    const firstWidth = first.box.x2 - first.box.x1
    const secondWidth = second.box.x2 - second.box.x1
    const overlap = Math.min(firstWidth, secondWidth) * (variant === 0 ? 0.3 : 0.18)
    const total = firstWidth + secondWidth - overlap

    const left = transform(
      first.outline,
      mat.translate(CENTRE - total / 2 + firstWidth / 2 - (first.box.x1 + first.box.x2) / 2, 0),
    )
    const right = transform(
      second.outline,
      mat.translate(
        CENTRE + total / 2 - secondWidth / 2 - (second.box.x1 + second.box.x2) / 2,
        0,
      ),
    )

    // Even-odd turns the crossing into a knockout, which is what makes the
    // pair read as one drawn mark rather than two letters set side by side.
    // The pair can be wider than the grid, so fit it once it is assembled.
    return fitParts([{ outlines: [left, right], evenodd: true }], 4)
  },
}

export const accentInitial: MarkTemplate = {
  id: 'accent-initial',
  label: 'Initial with a rule',
  family: 'monogram',
  letterRole: 'inside',
  variants: 3,
  minSize: 24,
  score: () => 0.6,
  draw({ variant, letterAt, fit }) {
    const thickness = Math.max(4, fit.stroke)
    const gap = thickness * 1.5

    // Positions are fixed on the grid rather than derived from the letter, so
    // the mark keeps the same proportions whichever initial it is given.
    if (variant === 1) {
      const letter = letterAt(76, 40, CENTRE, 58, 92)
      if (!letter) return null
      const at = 86 - thickness / 2
      return [
        { outlines: [letter.outline, bar(at, letter.box.y2, at, letter.box.y1, thickness)] },
      ]
    }

    const ruleWidth = 56
    const x = CENTRE - ruleWidth / 2
    // Rule below: the letter sits above it, both inside the grid.
    if (variant === 0) {
      const letter = letterAt(70, CENTRE, 38, 78, 74)
      if (!letter) return null
      const y = Math.min(92 - thickness, letter.box.y2 + gap)
      return [{ outlines: [letter.outline, rect(x, y, ruleWidth, thickness)] }]
    }

    // Rule above.
    const letter = letterAt(70, CENTRE, 62, 78, 74)
    if (!letter) return null
    const y = Math.max(8, letter.box.y1 - gap - thickness)
    return [{ outlines: [letter.outline, rect(x, y, ruleWidth, thickness)] }]
  },
}

export const MONOGRAM_TEMPLATES: MarkTemplate[] = [
  tileKnockout,
  squircleMonogram,
  slicedInitial,
  duoLigature,
  ringMonogram,
  accentInitial,
]
