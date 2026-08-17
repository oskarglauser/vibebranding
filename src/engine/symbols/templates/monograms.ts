/**
 * Monogram devices: the letter itself is the mark.
 *
 * These are the strongest marks the generator makes, because they are built
 * from the brand's own typeface rather than assembled beside it. Everything
 * here is sized in cap heights of the letter, so the amount of air around it
 * stays right across faces.
 */

import { circle, quad, rect, roundedRect, ring, squircle } from '../shapes'
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

/**
 * The initial reversed out of a faceted plate.
 *
 * This replaces a device that cut a band straight through the letter. That one
 * could not work: with only even-odd to hand, a band drawn across a letter
 * paints solid everywhere it is *not* over ink — including inside the counter
 * of an A — and subtracts only where the two overlap. The result read as a
 * glitch rather than a cut. Subtracting properly needs a real boolean
 * intersection, which the drawing system deliberately does not have.
 *
 * A second plane set behind the plate gives the same sense of a letter that has
 * been built rather than typed, and it composes cleanly: the tint never touches
 * the knockout, so there is nothing for the fill rule to get wrong.
 */
export const facetedInitial: MarkTemplate = {
  id: 'faceted-initial',
  label: 'Faceted initial',
  family: 'monogram',
  letterRole: 'carved',
  variants: 3,
  minSize: 24,
  score: () => 0.8,
  draw({ variant, letterAt, fit, form }) {
    const radius = Math.max(4, fit.radius)

    if (variant === 0) {
      // Plate with a second plane behind it, offset on the diagonal.
      const plate = squircle(42, 42, 40)
      const behind = squircle(58, 58, 40)
      const letter = letterAt(capForLetter(form.widthRatio, 42), 42, 42, 58)
      return fitParts(
        [
          { outlines: [behind], tone: 'tint' },
          ...carve(plate, letter?.outline ?? null),
        ],
        2,
      )
    }

    if (variant === 1) {
      // Card with a facet turned away from the light along its right edge.
      const plate = roundedRect(6, 14, 62, 72, radius)
      const facet = quad([62, 22], [92, 8], [92, 78], [62, 92])
      const letter = letterAt(capForLetter(form.widthRatio, 44), 37, 50, 48)
      return fitParts(
        [
          { outlines: [facet], tone: 'tint' },
          ...carve(plate, letter?.outline ?? null),
        ],
        2,
      )
    }

    // Angled plate: a rhombus rather than a square, with the lower facet held.
    const plate = quad([50, 4], [94, 50], [50, 96], [6, 50])
    const under = quad([50, 30], [88, 62], [50, 98], [12, 62])
    const letter = letterAt(capForLetter(form.widthRatio, 40), 50, 48, 52, 52)
    return fitParts(
      [
        { outlines: [under], tone: 'tint' },
        ...carve(plate, letter?.outline ?? null),
      ],
      2,
    )
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
      const letter = letterAt(74, 42, CENTRE, 60, 92)
      if (!letter) return null
      // A point set at the shoulder, not a full-height bar: run the accent the
      // whole height of the letter and it reads as a second character rather
      // than as a mark on the first.
      const at = 84 - thickness / 2
      return [
        {
          outlines: [
            letter.outline,
            circle(at, letter.box.y1 + thickness * 0.7, thickness * 0.7),
          ],
        },
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
  facetedInitial,
  duoLigature,
  ringMonogram,
  accentInitial,
]
