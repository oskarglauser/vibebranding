/**
 * Structural marks: built things — shelter, span, stack, join.
 *
 * These carry the most weight of any family, so they are also the easiest to
 * make heavy. The counter matters more than the silhouette here: an arch is its
 * opening, a link is the space it encircles.
 */

import { mat, pen, transform, type Outline } from '../pen'
import { arcBand, circle, rect, roundedRect } from '../shapes'
import { fitParts, GRID, type MarkPart, type MarkTemplate } from '../template'

const C = GRID / 2

/**
 * A crest: straight shoulders, a curve that starts low on the flanks and runs
 * to a point. Drawn asymmetrically shallow so it does not read as a road sign.
 */
const CREST = pen(
  'M50 6' +
    'L88 20' +
    'L88 52' +
    'C88 74 72 88 50 96' +
    'C28 88 12 74 12 52' +
    'L12 20Z',
)

export const shield: MarkTemplate = {
  id: 'shield',
  label: 'Crest',
  family: 'structural',
  letterRole: 'carved',
  variants: 3,
  minSize: 24,
  score: (form) => 0.5 + (form.widthRatio < 0.9 ? 0.15 : 0),
  draw({ variant, fit, letterAt, form }) {
    const stroke = Math.max(6, fit.stroke)

    if (variant === 0) {
      // The initial cut out of the crest.
      const letter = letterAt(
        Math.min(52, 44 / Math.max(0.42, form.widthRatio) * 0.72),
        C,
        52,
        54,
        56,
      )
      if (!letter) return null
      return fitParts([{ outlines: [CREST, letter.outline], evenodd: true }], 2)
    }

    if (variant === 1) {
      // Outlined crest with a band across the shoulders.
      const inner = transform(CREST, mat.scaleAbout(0.66, 0.66, 50, 58))
      const band = rect(12, 42, 76, stroke)
      return fitParts(
        [
          { outlines: [CREST, inner], evenodd: true },
          { outlines: [band], tone: 'tint' },
        ],
        2,
      )
    }

    // Crest divided down the axis, one half held back.
    const left = pen('M50 6L12 20L12 52C12 74 28 88 50 96Z')
    const right = pen('M50 6L88 20L88 52C88 74 72 88 50 96Z')
    return fitParts(
      [
        { outlines: [left] },
        { outlines: [right], tone: 'tint' },
      ],
      2,
    )
  },
}

export const arch: MarkTemplate = {
  id: 'arch',
  label: 'Arch',
  family: 'structural',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.45 + form.roundness * 0.2,
  draw({ variant, fit }) {
    const stroke = Math.max(8, fit.stroke)
    const parts: MarkPart[] = []
    const springing = 56

    // Legs plus a half-round head: the opening is the mark, so the legs stop
    // short of the foot rather than closing into a solid.
    const leftLeg = rect(14, springing, stroke, 92 - springing)
    const rightLeg = rect(86 - stroke, springing, stroke, 92 - springing)
    const head = arcBand(50, springing, 36, stroke, 270, 360 + 90)

    if (variant === 0) {
      parts.push({ outlines: [leftLeg, rightLeg, head] })
    } else if (variant === 1) {
      // Arch within an arch, the inner one held light.
      parts.push({ outlines: [leftLeg, rightLeg, head] })
      parts.push({
        outlines: [
          rect(14 + stroke * 1.8, springing, stroke * 0.7, 92 - springing),
          rect(86 - stroke * 2.5, springing, stroke * 0.7, 92 - springing),
          arcBand(50, springing, 36 - stroke * 1.8, stroke * 0.7, 270, 450),
        ],
        tone: 'tint',
      })
    } else {
      // A single span with no legs: the arch reduced to its gesture.
      parts.push({ outlines: [arcBand(50, 68, 40, stroke, 270, 450)] })
      parts.push({ outlines: [rect(10, 76, 80, stroke * 0.8)], tone: 'tint' })
    }

    return fitParts(parts, 3)
  },
}

export const stack: MarkTemplate = {
  id: 'stack',
  label: 'Stack',
  family: 'structural',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.5 - form.roundness * 0.1,
  draw({ variant, fit }) {
    const radius = Math.max(3, fit.radius * 0.7)
    const parts: MarkPart[] = []

    if (variant === 0) {
      // Two plates offset on the diagonal. The lower one is tinted and set
      // behind, which is the only order in which a tint reads at all. Keeping
      // them well clear of the corners leaves ground showing on both
      // diagonals, without which the pair reads as one heavy square.
      parts.push({ outlines: [roundedRect(36, 36, 54, 54, radius)], tone: 'tint' })
      parts.push({ outlines: [roundedRect(10, 10, 54, 54, radius)] })
    } else if (variant === 1) {
      // Three bars of decreasing length: a stack seen edge on.
      const height = Math.max(8, fit.stroke)
      parts.push({ outlines: [roundedRect(10, 22, 80, height, height / 2)] })
      parts.push({ outlines: [roundedRect(10, 44, 62, height, height / 2)] })
      parts.push({ outlines: [roundedRect(10, 66, 40, height, height / 2)], tone: 'tint' })
    } else {
      // Three plates stepping back on the diagonal, each smaller and lighter
      // than the one in front. A notched corner read as a UI glyph; a receding
      // series reads as depth.
      parts.push({ outlines: [roundedRect(52, 12, 36, 36, radius * 0.7)], tone: 'tint' })
      parts.push({ outlines: [roundedRect(34, 34, 44, 44, radius * 0.85)], tone: 'tint' })
      parts.push({ outlines: [roundedRect(10, 52, 52, 36, radius)] })
    }

    return fitParts(parts, 3)
  },
}

export const link: MarkTemplate = {
  id: 'link',
  label: 'Link',
  family: 'structural',
  letterRole: 'none',
  variants: 3,
  minSize: 32,
  score: (form) => 0.45 + form.roundness * 0.25,
  draw({ variant, fit }) {
    const stroke = Math.max(7, fit.stroke)
    const parts: MarkPart[] = []

    const ringAt = (cx: number, cy: number, r: number): Outline =>
      arcBand(cx, cy, r, stroke, 0, 360)

    if (variant === 0) {
      // Two rings overlapping, the crossing knocked out so they interlock
      // rather than merging into a figure of eight.
      parts.push({ outlines: [ringAt(36, 50, 30), ringAt(64, 50, 30)], evenodd: true })
    } else if (variant === 1) {
      // Offset pair on the diagonal, one held light.
      parts.push({ outlines: [ringAt(62, 62, 30)], tone: 'tint' })
      parts.push({ outlines: [ringAt(40, 40, 30)] })
    } else {
      // A ring caught on a bar: a join rather than a chain.
      parts.push({ outlines: [ringAt(56, 50, 34)], evenodd: true })
      parts.push({ outlines: [rect(8, 50 - stroke / 2, 44, stroke)] })
      parts.push({ outlines: [circle(12, 50, stroke * 0.75)] })
    }

    return fitParts(parts, 3)
  },
}

export const gem: MarkTemplate = {
  id: 'gem',
  label: 'Gem',
  family: 'structural',
  letterRole: 'none',
  variants: 3,
  minSize: 32,
  score: (form) => 0.45 - form.roundness * 0.15,
  draw({ variant, fit }) {
    const parts: MarkPart[] = []

    // One stone, cut the way a stone is actually cut: a flat table across the
    // top, shoulders at the widest point, and a pavilion tapering to a culet.
    // The girdle line at y = 38 is shared by every facet, which is what makes
    // the pieces read as one solid rather than as loose triangles.
    const TOP_LEFT: [number, number] = [30, 10]
    const TOP_RIGHT: [number, number] = [70, 10]
    const LEFT: [number, number] = [10, 38]
    const RIGHT: [number, number] = [90, 38]
    const CULET: [number, number] = [50, 92]

    const p = (...points: Array<[number, number]>) =>
      pen(`M${points.map(([x, y]) => `${x} ${y}`).join('L')}Z`)

    if (variant === 0) {
      // Crown lit, pavilion in shade.
      parts.push({ outlines: [p(TOP_LEFT, TOP_RIGHT, RIGHT, LEFT)] })
      parts.push({ outlines: [p(LEFT, RIGHT, CULET)], tone: 'tint' })
    } else if (variant === 1) {
      // The whole stone in outline. The counter is drawn as its own stone
      // rather than a scaled copy: scaling the silhouette moves every vertex
      // inward by a different amount and the band comes out uneven.
      const stone = p(TOP_LEFT, TOP_RIGHT, RIGHT, CULET, LEFT)
      const inner = p([34, 22], [66, 22], [78, 40], [50, 78], [22, 40])
      parts.push({ outlines: [stone, inner], evenodd: true })
    } else {
      // Split down the axis: two halves of one stone, one turned to the light.
      parts.push({ outlines: [p(TOP_LEFT, [50, 10], CULET, LEFT)] })
      parts.push({ outlines: [p([50, 10], TOP_RIGHT, RIGHT, CULET)], tone: 'tint' })
    }

    const lean = fit.lean * 0.4
    return fitParts(
      parts.map((part) => ({
        ...part,
        outlines: part.outlines.map((o) => transform(o, mat.rotate(lean, C, C))),
      })),
      3,
    )
  },
}

export const STRUCTURAL_TEMPLATES: MarkTemplate[] = [shield, arch, stack, link, gem]
