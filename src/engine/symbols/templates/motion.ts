/**
 * Motion marks: direction, speed, ascent.
 *
 * The failure mode here is the plain chevron and the five-point star — shapes
 * so common they carry no meaning. These earn their place through taper: an
 * arm that narrows, a point that is longer than its siblings, a peak that
 * breaks rather than closing.
 */

import { mat, pen, transform, type Outline } from '../pen'
import { circle, polyline } from '../shapes'
import { fitParts, GRID, type MarkPart, type MarkTemplate } from '../template'

const C = GRID / 2

/**
 * A chevron with weight: thick at the shoulder, thinner at the tips, and the
 * inner corner cut square so the two arms read as one folded band.
 */
function blade(x: number, y: number, reach: number, drop: number, thickness: number): Outline {
  return pen(
    `M${x - reach} ${y - drop}` +
      `L${x - reach + thickness * 0.9} ${y - drop - thickness * 0.15}` +
      `L${x + thickness * 0.1} ${y}` +
      `L${x - reach + thickness * 0.9} ${y + drop + thickness * 0.15}` +
      `L${x - reach} ${y + drop}` +
      `L${x - thickness * 0.75} ${y}Z`,
  )
}

/** A four-point star with concave flanks: a spark, not a snowflake. */
const SPARK = pen(
  'M50 4' +
    'C54 30 70 46 96 50' +
    'C70 54 54 70 50 96' +
    'C46 70 30 54 4 50' +
    'C30 46 46 30 50 4Z',
)

export const bladeMark: MarkTemplate = {
  id: 'blade',
  label: 'Blade',
  family: 'motion',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.5 + form.diagonalStrength * 0.35,
  draw({ variant, fit }) {
    const stroke = Math.max(8, fit.stroke)
    const parts: MarkPart[] = []

    if (variant === 0) {
      parts.push({ outlines: [blade(74, C, 46, 38, stroke)] })
    } else if (variant === 1) {
      // Two chevrons, the trailing one lighter, which reads as travel.
      parts.push({ outlines: [transform(blade(74, C, 40, 34, stroke * 0.85), mat.translate(-34, 0))], tone: 'tint' })
      parts.push({ outlines: [blade(84, C, 40, 34, stroke)] })
    } else {
      // Turned upward: an ascent rather than a direction.
      parts.push({ outlines: [transform(blade(74, C, 44, 36, stroke), mat.rotate(-90, C, C))] })
    }

    const lean = fit.lean * 0.5
    return fitParts(
      parts.map((part) => ({
        ...part,
        outlines: part.outlines.map((o) => transform(o, mat.rotate(lean, C, C))),
      })),
      4,
    )
  },
}

export const spark: MarkTemplate = {
  id: 'spark',
  label: 'Spark',
  family: 'motion',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.45 + form.diagonalStrength * 0.3,
  draw({ variant, fit }) {
    const parts: MarkPart[] = []

    if (variant === 0) {
      parts.push({ outlines: [SPARK] })
    } else if (variant === 1) {
      // A long-armed spark: stretching one axis is what stops a four-point
      // star reading as a compass rose.
      parts.push({ outlines: [transform(SPARK, mat.scaleAbout(0.72, 1, C, C))] })
    } else {
      // Spark with a smaller companion set low and light.
      parts.push({ outlines: [transform(SPARK, mat.scaleAbout(0.84, 0.84, 44, 44))] })
      parts.push({
        outlines: [transform(SPARK, mat.scaleAbout(0.34, 0.34, 82, 82))],
        tone: 'tint',
      })
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

export const pulse: MarkTemplate = {
  id: 'pulse',
  label: 'Pulse',
  family: 'motion',
  letterRole: 'none',
  variants: 3,
  minSize: 32,
  score: (form) => 0.45 + form.diagonalStrength * 0.3,
  draw({ variant, fit }) {
    const stroke = Math.max(8, fit.stroke)
    const parts: MarkPart[] = []

    // A climb that steps back before its final rise, so the line has a story
    // rather than being a plain zigzag. The last leg is the longest.
    const climb = [
      [12, 82],
      [36, 46],
      [54, 64],
      [88, 18],
    ] as const

    if (variant === 0) {
      parts.push({ outlines: [polyline([...climb], stroke)] })
    } else if (variant === 1) {
      // The climb with its summit held, which gives the eye somewhere to land.
      parts.push({ outlines: [polyline([...climb], stroke)] })
      parts.push({ outlines: [circle(88, 18, stroke * 0.95)] })
    } else {
      // A second, shallower run set behind: depth without perspective.
      const behind = [
        [12, 92],
        [40, 66],
        [60, 78],
        [88, 46],
      ] as const
      parts.push({ outlines: [polyline([...behind], stroke * 0.85)], tone: 'tint' })
      parts.push({ outlines: [polyline([...climb], stroke)] })
    }

    return fitParts(parts, 4)
  },
}

export const arrowhead: MarkTemplate = {
  id: 'arrowhead',
  label: 'Arrowhead',
  family: 'motion',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.45 + form.diagonalStrength * 0.35,
  draw({ variant, fit }) {
    const stroke = Math.max(8, fit.stroke)
    const parts: MarkPart[] = []

    // A triangle with the trailing edge notched inward, which is what makes an
    // arrowhead rather than a wedge.
    const head = pen('M50 6L92 90L50 68L8 90Z')

    if (variant === 0) {
      parts.push({ outlines: [head] })
    } else if (variant === 1) {
      // Split down the axis, the trailing half lighter.
      const left = pen('M50 6L50 68L8 90Z')
      const right = pen('M50 6L92 90L50 68Z')
      parts.push({ outlines: [left] })
      parts.push({ outlines: [right], tone: 'tint' })
    } else {
      // Outlined, with the notch carried through to the counter.
      const inner = transform(head, mat.scaleAbout(0.52, 0.52, 50, 58))
      parts.push({ outlines: [head, inner], evenodd: true })
      parts.push({ outlines: [circle(50, 84, stroke * 0.42)] })
    }

    const lean = fit.lean * 0.6
    return fitParts(
      parts.map((part) => ({
        ...part,
        outlines: part.outlines.map((o) => transform(o, mat.rotate(lean, C, C))),
      })),
      3,
    )
  },
}

export const MOTION_TEMPLATES: MarkTemplate[] = [bladeMark, spark, pulse, arrowhead]
