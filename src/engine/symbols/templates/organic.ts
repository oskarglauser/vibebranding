/**
 * Organic marks: growth, flow, natural forms.
 *
 * These are the hardest to keep from looking like clip art. What saves them is
 * restraint — a leaf with one spine rather than seven veins, a bloom of three
 * petals rather than eight, a wave that modulates once. Every curve here is
 * placed by hand; none of it is a formula sampled at intervals.
 */

import { mat, pen, transform, type Outline } from '../pen'
import { circle } from '../shapes'
import { fitParts, GRID, type MarkPart, type MarkTemplate } from '../template'

const C = GRID / 2

/**
 * A leaf: pointed at both ends, with the widest part sitting below centre.
 *
 * The tips are what distinguish a leaf from a drop. Drawn with a rounded foot
 * it becomes a droplet, which is a different mark in this library — so the
 * tangents at both ends are steep enough to close to a proper point.
 */
const LEAF = pen(
  'M50 2' +
    'C68 18 78 36 78 54' +
    'C78 76 60 92 50 98' +
    'C40 92 22 76 22 54' +
    'C22 36 32 18 50 2Z',
)

/** The same leaf with its tip drawn over: a shoot rather than a blade. */
const SHOOT = pen(
  'M56 4' +
    'C72 22 80 42 76 60' +
    'C72 80 56 92 46 97' +
    'C38 90 20 74 22 54' +
    'C24 36 38 18 56 4Z',
)

/**
 * A petal: narrow at the base, full at the shoulder, closing to a point.
 *
 * Kept narrow deliberately. Wide petals repeated around a centre make a daisy,
 * which reads as clip art rather than as a mark.
 */
const PETAL = pen(
  'M50 56' +
    'C64 42 70 26 68 12' +
    'C66 2 58 -3 50 -3' +
    'C42 -3 34 2 32 12' +
    'C30 26 36 42 50 56Z',
)

export const leaf: MarkTemplate = {
  id: 'leaf',
  label: 'Leaf',
  family: 'organic',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.45 + form.roundness * 0.35,
  draw({ variant, fit }) {
    const stroke = Math.max(6, fit.stroke)
    const parts: MarkPart[] = []

    if (variant === 0) {
      // Leaf with the midrib cut through it, running the full length so the
      // two halves read as a blade rather than as a slot in a blob.
      const half = Math.max(2.5, stroke * 0.32)
      const spine = pen(`M${C - half} 16L${C + half} 16L${C + half} 92L${C - half} 92Z`)
      parts.push({ outlines: [LEAF, spine], evenodd: true })
    } else if (variant === 1) {
      // Two leaves from one stem, the second turned well away so the pair
      // reads as growth rather than as one shape with a shadow.
      const small = transform(
        SHOOT,
        mat.mul(mat.scaleAbout(0.66, 0.66, 50, 97), mat.rotate(-52, 50, 97)),
      )
      parts.push({ outlines: [small], tone: 'tint' })
      parts.push({ outlines: [SHOOT] })
    } else {
      // Outlined leaf: the silhouette with a second, smaller one cut from it.
      const inner = transform(LEAF, mat.scaleAbout(0.58, 0.66, 50, 72))
      parts.push({ outlines: [LEAF, inner], evenodd: true })
    }

    // Leaves lean further than most marks: upright, this reads as a droplet.
    const lean = -18 + fit.lean * 0.7
    return fitParts(
      parts.map((part) => ({
        ...part,
        outlines: part.outlines.map((o) => transform(o, mat.rotate(lean, C, C))),
      })),
      3,
    )
  },
}

export const bloom: MarkTemplate = {
  id: 'bloom',
  label: 'Bloom',
  family: 'organic',
  letterRole: 'none',
  variants: 3,
  minSize: 32,
  score: (form) => 0.4 + form.roundness * 0.4,
  draw({ variant, fit, form }) {
    // Three or four petals, never more: past that the mark stops being a form
    // and becomes a flower. Rounder letters take the fuller count.
    const count = form.roundness > 0.55 ? 3 : 4
    const petals: Outline[] = []

    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + (variant === 1 ? 180 / count : 0)
      petals.push(transform(PETAL, mat.rotate(angle, 50, 50)))
    }

    // Even-odd on the overlapping bases opens a counter where the petals meet,
    // which is what gives the mark structure instead of a solid hub.
    const parts: MarkPart[] = [{ outlines: petals, evenodd: variant !== 2 }]

    if (variant === 2) {
      // A held centre, laid over the hub rather than cut from it. Cutting it
      // fights the even-odd counter the overlapping petal bases already make,
      // and the two cancel into a ragged star.
      parts.push({ outlines: [circle(50, 50, Math.max(5, fit.stroke * 0.55))], tone: 'tint' })
    }

    return fitParts(parts, 4)
  },
}

export const droplet: MarkTemplate = {
  id: 'droplet',
  label: 'Droplet',
  family: 'organic',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.4 + form.roundness * 0.3,
  draw({ variant, fit }) {
    const stroke = Math.max(6, fit.stroke)
    // Point at the top, full at the bottom, shoulders slightly uneven.
    const drop = pen('M50 6C64 26 84 44 84 62C84 82 68 94 50 94C32 94 16 82 16 62C16 44 36 26 50 6Z')
    const parts: MarkPart[] = []

    if (variant === 0) {
      parts.push({ outlines: [drop] })
    } else if (variant === 1) {
      // Outlined, with the counter following the outer curve.
      const inner = transform(drop, mat.scaleAbout(0.6, 0.6, 50, 66))
      parts.push({ outlines: [drop, inner], evenodd: true })
    } else {
      // A drop with a highlight cut from its shoulder — the one place a
      // knockout reads as light rather than as a hole.
      const highlight = circle(38, 58, stroke * 0.75)
      parts.push({ outlines: [drop, highlight], evenodd: true })
    }

    const lean = fit.lean * 0.55
    return fitParts(
      parts.map((part) => ({
        ...part,
        outlines: part.outlines.map((o) => transform(o, mat.rotate(lean, C, C))),
      })),
      3,
    )
  },
}

export const wave: MarkTemplate = {
  id: 'wave',
  label: 'Wave',
  family: 'organic',
  letterRole: 'none',
  variants: 3,
  minSize: 32,
  score: (form) => 0.45 + form.roundness * 0.25,
  draw({ variant, fit }) {
    const stroke = Math.max(7, fit.stroke)
    const parts: MarkPart[] = []

    // A band that swells through the middle of its run and thins at the ends,
    // which is what makes it read as drawn rather than stroked.
    const band = (y: number, thickness: number) =>
      pen(
        `M10 ${y}` +
          `C26 ${y - 20} 44 ${y - 22} 58 ${y - 6}` +
          `C68 ${y + 6} 80 ${y + 10} 90 ${y + 2}` +
          `L90 ${y + 2 + thickness}` +
          `C78 ${y + 12 + thickness} 66 ${y + 8 + thickness} 56 ${y - 4 + thickness}` +
          `C44 ${y - 18 + thickness} 28 ${y - 16 + thickness} 10 ${y + thickness}Z`,
      )

    if (variant === 0) {
      parts.push({ outlines: [band(50, stroke)] })
    } else if (variant === 1) {
      parts.push({ outlines: [band(36, stroke)] })
      parts.push({ outlines: [band(64, stroke)], tone: 'tint' })
    } else {
      parts.push({ outlines: [band(30, stroke * 0.8)] })
      parts.push({ outlines: [band(54, stroke)] })
      parts.push({ outlines: [band(78, stroke * 0.8)], tone: 'tint' })
    }

    return fitParts(parts, 4)
  },
}

export const ORGANIC_TEMPLATES: MarkTemplate[] = [leaf, bloom, droplet, wave]
