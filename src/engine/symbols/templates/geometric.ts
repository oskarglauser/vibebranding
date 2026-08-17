/**
 * Geometric marks: built from circles, arcs and planes.
 *
 * The trap with geometric marks is that they drift towards the shapes every
 * generator makes — a bullseye, a plain hexagon, a five-point star. What keeps
 * these from doing that is asymmetry: an arc that stops short rather than
 * closing, a ring whose node sits off-axis, a set of three where the third is
 * deliberately different.
 */

import { mat, transform, type Outline } from '../pen'
import { arcBand, bar, circle, circleReversed, lens, onCircle, quad, ring } from '../shapes'
import { fitParts, GRID, type MarkPart, type MarkTemplate } from '../template'

const C = GRID / 2

/** A ring squashed on one axis, which is what a tilted circle looks like. */
function ellipseRing(rx: number, ry: number, stroke: number): Outline {
  const scaled = mat.scaleAbout(1, ry / rx, C, C)
  return transform(ring(C, C, rx, stroke), scaled)
}

function lensRing(halfWidth: number, halfHeight: number, stroke: number): Outline {
  const outer = lens(C, C, halfWidth, halfHeight)
  const inner = lens(C, C, Math.max(2, halfWidth - stroke), Math.max(3, halfHeight - stroke * 1.5))
  return { commands: [...outer.commands, ...inner.commands] }
}

export const aperture: MarkTemplate = {
  id: 'aperture',
  label: 'Aperture',
  family: 'geometric',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.5 + form.roundness * 0.4,
  draw({ variant, fit }) {
    const stroke = Math.max(6, fit.stroke)
    const lean = fit.lean
    const parts: MarkPart[] = []

    if (variant === 0) {
      // A leaf outline with a smaller leaf inside it, echoing the outer shape
      // rather than sitting in it as a foreign dot. The inner form is sized off
      // the opening so it can never break through the surrounding band.
      const innerWidth = Math.max(3, 30 - stroke)
      const innerHeight = Math.max(5, 46 - stroke * 1.5)
      parts.push({ outlines: [lensRing(30, 46, stroke)], evenodd: true })
      parts.push({ outlines: [lens(C, C, innerWidth * 0.5, innerHeight * 0.5)] })
    } else if (variant === 1) {
      // Two blades passing each other, cut where they cross.
      const blade = lens(C, C, 24, 44)
      parts.push({
        outlines: [
          transform(blade, mat.rotate(-24, C, C)),
          transform(blade, mat.rotate(24, C, C)),
        ],
        evenodd: true,
      })
    } else {
      // A lens standing inside a broken ring, open at the foot.
      parts.push({ outlines: [arcBand(C, C, 46, stroke, 22, 338)] })
      parts.push({ outlines: [lens(C, C, 15, 28)] })
    }

    return fitParts(
      parts.map((part) => ({
        ...part,
        outlines: part.outlines.map((o) => transform(o, mat.rotate(lean, C, C))),
      })),
      3,
    )
  },
}

export const orbit: MarkTemplate = {
  id: 'orbit',
  label: 'Orbit',
  family: 'geometric',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.55 + (form.roundness > 0.5 ? 0.2 : 0),
  draw({ variant, fit }) {
    const stroke = Math.max(6, fit.stroke)
    // The tilt is the mark's character, so it leans further than most.
    const tilt = -28 + fit.lean * 0.8
    const parts: MarkPart[] = []

    if (variant === 0) {
      // A tilted path with a body held clear of it. Sitting the body on the
      // band merges the two into a lump; the gap is what makes it read as one
      // thing orbiting another.
      const path = transform(ellipseRing(40, 24, stroke), mat.rotate(tilt, C, C))
      const body = stroke * 0.95
      const [nx, ny] = onCircle(C, C, 40 + body * 1.35, 52)
      parts.push({ outlines: [path], evenodd: true })
      parts.push({ outlines: [circle(nx, ny, body)] })
    } else if (variant === 1) {
      // Ring and core: the classic orbit, saved from being a bullseye by the
      // ring being an ellipse and the core sitting off its centre.
      parts.push({
        outlines: [transform(ellipseRing(45, 28, stroke), mat.rotate(tilt, C, C))],
        evenodd: true,
      })
      parts.push({ outlines: [circle(C, C, stroke * 1.05)] })
    } else {
      // Two paths crossing, one lighter, so the crossing reads as depth.
      parts.push({
        outlines: [transform(ellipseRing(45, 22, stroke * 0.85), mat.rotate(tilt - 34, C, C))],
        tone: 'tint',
        evenodd: true,
      })
      parts.push({
        outlines: [transform(ellipseRing(45, 22, stroke), mat.rotate(tilt + 24, C, C))],
        evenodd: true,
      })
    }

    return fitParts(parts, 3)
  },
}

export const facet: MarkTemplate = {
  id: 'facet',
  label: 'Facet',
  family: 'geometric',
  letterRole: 'none',
  variants: 3,
  minSize: 32,
  score: (form) => 0.6 - form.roundness * 0.25,
  draw({ variant, fit }) {
    const parts: MarkPart[] = []

    if (variant === 0) {
      // Three planes of a solid seen from above: the tinted plane is the one
      // turned away from the light.
      const top = quad([50, 8], [88, 30], [50, 52], [12, 30])
      const left = quad([12, 30], [50, 52], [50, 94], [12, 72])
      const right = quad([88, 30], [88, 72], [50, 94], [50, 52])
      parts.push({ outlines: [left, top] })
      parts.push({ outlines: [right], tone: 'tint' })
    } else if (variant === 1) {
      // A single folded plane, the crease running with the letter's lean.
      const front = quad([16, 20], [50, 34], [50, 88], [16, 74])
      const back = quad([50, 34], [84, 12], [84, 66], [50, 88])
      parts.push({ outlines: [front] })
      parts.push({ outlines: [back], tone: 'tint' })
    } else {
      // Two blades meeting at a shared edge, with a gap of ground between.
      const leftBlade = quad([14, 16], [46, 32], [46, 90], [14, 74])
      const rightBlade = quad([54, 32], [86, 16], [86, 74], [54, 90])
      parts.push({ outlines: [leftBlade, rightBlade] })
    }

    const lean = fit.lean * 0.5
    return fitParts(
      parts.map((part) => ({
        ...part,
        outlines: part.outlines.map((o) => transform(o, mat.rotate(lean, C, C))),
      })),
      3,
    )
  },
}

export const quadrant: MarkTemplate = {
  id: 'quadrant',
  label: 'Quadrant',
  family: 'geometric',
  letterRole: 'none',
  variants: 3,
  minSize: 24,
  score: (form) => 0.5 + form.roundness * 0.25,
  draw({ variant, fit }) {
    const stroke = Math.max(7, fit.stroke)
    const parts: MarkPart[] = []

    if (variant === 0) {
      // Three arcs stepping inward, the shortest one closing the figure. Equal
      // arcs would read as a target; unequal ones read as a drawn mark.
      parts.push({ outlines: [arcBand(C, C, 46, stroke, 0, 150)] })
      parts.push({ outlines: [arcBand(C, C, 46 - stroke * 1.7, stroke, 180, 300)] })
      parts.push({ outlines: [arcBand(C, C, 46 - stroke * 3.4, stroke, 40, 130)] })
    } else if (variant === 1) {
      // An open ring with a stop set in the mouth of it. The gap has to be
      // wide enough that the stop stays a separate object — closer and the two
      // merge into a lumpy terminal.
      parts.push({ outlines: [arcBand(C, C, 45, stroke, 52, 308)] })
      const [nx, ny] = onCircle(C, C, 45 - stroke / 2, 0)
      parts.push({ outlines: [circle(nx, ny, stroke * 0.52)] })
    } else {
      // Opposed quarters: a rotational pair, which reads as movement without
      // any of it being literal.
      parts.push({ outlines: [arcBand(C, C, 44, stroke, 10, 100)] })
      parts.push({ outlines: [arcBand(C, C, 44, stroke, 190, 280)] })
      parts.push({ outlines: [circle(C, C, stroke * 0.55)], tone: 'tint' })
    }

    const lean = fit.lean
    return fitParts(
      parts.map((part) => ({
        ...part,
        outlines: part.outlines.map((o) => transform(o, mat.rotate(lean, C, C))),
      })),
      3,
    )
  },
  drawSimple({ fit }) {
    // Three stepped arcs become a smudge at 16px. One open ring at full weight
    // keeps the gesture and stays legible.
    const stroke = Math.max(10, fit.stroke * 1.2)
    return fitParts([{ outlines: [arcBand(C, C, 46, stroke, 20, 320)] }], 3)
  },
}

export const helix: MarkTemplate = {
  id: 'helix',
  label: 'Helix',
  family: 'geometric',
  letterRole: 'none',
  variants: 3,
  minSize: 32,
  score: (form) => 0.45 + form.diagonalStrength * 0.5,
  draw({ variant, fit }) {
    const stroke = Math.max(8, fit.stroke)
    const parts: MarkPart[] = []

    if (variant === 0) {
      // Two bands crossing, knocked out where they meet so the crossing reads
      // as one passing behind the other rather than as a blot.
      const a = bar(18, 84, 82, 16, stroke)
      const b = bar(18, 16, 82, 84, stroke)
      parts.push({ outlines: [a, b], evenodd: true })
    } else if (variant === 1) {
      // Two half-turns stacked into an S, drawn as arcs rather than a curve so
      // the weight stays even through the join.
      parts.push({ outlines: [arcBand(C, 32, 24, stroke, 180, 360)] })
      parts.push({ outlines: [arcBand(C, 68, 24, stroke, 0, 180)] })
    } else {
      // A twist: one band solid, its pair tinted and set behind.
      const a = bar(24, 88, 76, 12, stroke)
      const b = bar(24, 12, 76, 88, stroke * 0.9)
      parts.push({ outlines: [b], tone: 'tint' })
      parts.push({ outlines: [a] })
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

export const GEOMETRIC_TEMPLATES: MarkTemplate[] = [aperture, orbit, quadrant, facet, helix]

export { circleReversed }
