import { describe, expect, it } from 'vitest'

import {
  bounds,
  mat,
  pathDataFor,
  pen,
  toPathData,
  transform,
  unionBounds,
} from '../src/engine/symbols/pen'
import { pathBounds } from '../src/engine/pathGeometry'

function expectBox(box: ReturnType<typeof bounds>, expected: number[], precision = 4) {
  expect(box).not.toBeNull()
  if (!box) return
  expect(box.x1).toBeCloseTo(expected[0], precision)
  expect(box.y1).toBeCloseTo(expected[1], precision)
  expect(box.x2).toBeCloseTo(expected[2], precision)
  expect(box.y2).toBeCloseTo(expected[3], precision)
}

describe('pen', () => {
  it('parses absolute commands', () => {
    expect(pen('M0 0 L10 0 L10 10 Z').commands).toEqual([
      ['M', [0, 0]],
      ['L', [10, 0]],
      ['L', [10, 10]],
      ['Z'],
    ])
  })

  it('treats coordinates after M as an implicit line', () => {
    expect(pen('M0 0 10 0').commands).toEqual([
      ['M', [0, 0]],
      ['L', [10, 0]],
    ])
  })

  it('handles repeated curve runs', () => {
    const outline = pen('M0 0 C1 2 3 4 5 6 C7 8 9 10 11 12')
    expect(outline.commands).toHaveLength(3)
    expect(outline.commands[2][0]).toBe('C')
  })

  it('rejects relative commands, which are unreadable to hand-edit', () => {
    expect(() => pen('M0 0 l10 0')).toThrow(/relative/)
  })

  it('rejects arcs and shorthand curves outright', () => {
    // Templates are hand-drawn; arcs do not survive a general affine, and the
    // smooth forms hide their control points from the author.
    expect(() => pen('M0 0 A5 5 0 0 1 10 10')).toThrow()
    expect(() => pen('M0 0 S1 2 3 4')).toThrow()
  })

  it('rejects empty and malformed data', () => {
    expect(() => pen('')).toThrow()
    expect(() => pen('L10 10')).toThrow(/start with M/)
    expect(() => pen('M0 0 C1 2 3')).toThrow(/truncated/)
  })
})

describe('bounds', () => {
  it('measures straight geometry', () => {
    expectBox(bounds(pen('M0 0 L30 0 L30 40 Z')), [0, 0, 30, 40])
  })

  it('solves a cubic extremum exactly', () => {
    // Symmetric curve: the true peak is at t=0.5, y = -0.75 * 30 = -22.5.
    expectBox(bounds(pen('M0 0 C0 -30 100 -30 100 0')), [0, -22.5, 100, 0])
  })

  it('solves a quadratic extremum exactly', () => {
    // Peak at t=0.5 is halfway to the control point: y = -10.
    expectBox(bounds(pen('M0 0 Q50 -20 100 0')), [0, -10, 100, 0])
  })

  it('does not let an extremum on one axis widen the other', () => {
    // A curve bulging only in x must not report a taller box than its points.
    expectBox(bounds(pen('M0 0 C30 0 30 10 0 10')), [0, 0, 22.5, 10])
  })

  it('agrees with the sampled measurement of the same path', () => {
    const outline = pen('M12 88 L12 34 C12 18 26 6 50 6 C74 6 88 18 88 34 L88 88 Z')
    const exact = bounds(outline)
    const sampled = pathBounds(toPathData(outline))
    expect(exact).not.toBeNull()
    expect(sampled).not.toBeNull()
    if (!exact || !sampled) return
    expect(exact.x1).toBeCloseTo(sampled.x1, 2)
    expect(exact.y1).toBeCloseTo(sampled.y1, 2)
    expect(exact.x2).toBeCloseTo(sampled.x2, 2)
    expect(exact.y2).toBeCloseTo(sampled.y2, 2)
  })

  it('unions across several outlines', () => {
    expectBox(unionBounds([pen('M0 0 L10 10 Z'), pen('M20 -5 L30 5 Z')]), [0, -5, 30, 10])
  })
})

describe('transform', () => {
  it('rotates exactly, including curve control points', () => {
    const square = pen('M0 0 L10 0 L10 10 L0 10 Z')
    expectBox(bounds(transform(square, mat.rotate(90))), [-10, 0, 0, 10])
  })

  it('rotates about a chosen centre', () => {
    const square = pen('M0 0 L10 0 L10 10 L0 10 Z')
    expectBox(bounds(transform(square, mat.rotate(180, 5, 5))), [0, 0, 10, 10])
  })

  it('mirrors across a vertical line', () => {
    expectBox(bounds(transform(pen('M0 0 L10 0 L10 5 Z'), mat.mirrorX(50))), [90, 0, 100, 5])
  })

  it('scales about a centre so a mark grows in place', () => {
    const square = pen('M40 40 L60 40 L60 60 L40 60 Z')
    expectBox(bounds(transform(square, mat.scaleAbout(2, 2, 50, 50))), [30, 30, 70, 70])
  })

  it('composes left to right', () => {
    // Scale then translate: the translation must not be scaled.
    const composed = mat.mul(mat.scale(2), mat.translate(10, 0))
    expectBox(bounds(transform(pen('M0 0 L5 0 L5 5 Z'), composed)), [10, 0, 20, 10])
  })

  it('keeps a curve a curve through rotation', () => {
    // A near-circular blob turned any amount keeps its extent. It is a cubic
    // approximation of a circle rather than a true one, so allow the small
    // wobble that approximation carries rather than demanding exactness.
    const blob = pen('M50 10 C72 10 90 28 90 50 C90 72 72 90 50 90 C28 90 10 72 10 50 C10 28 28 10 50 10 Z')
    const before = bounds(blob)!
    const after = bounds(transform(blob, mat.rotate(37, 50, 50)))!
    expect(after.x2 - after.x1).toBeCloseTo(before.x2 - before.x1, 0)
    expect(after.y2 - after.y1).toBeCloseTo(before.y2 - before.y1, 0)
  })
})

describe('serialisation', () => {
  it('round-trips through path data', () => {
    const source = 'M12 88 L12 34 C12 18 26 6 50 6 Z'
    const first = pen(source)
    const second = pen(toPathData(first))
    expect(second.commands).toEqual(first.commands)
  })

  it('emits compact data without redundant command letters', () => {
    // Coordinates following an M are an implicit line, so the L is dropped.
    expect(toPathData(pen('M0 0 L10 0 L10 10'))).toBe('M0 0 10 0 10 10')
  })

  it('joins several outlines into one path string', () => {
    const joined = pathDataFor([pen('M0 0 L1 0 Z'), pen('M5 5 L6 5 Z')])
    expect(joined).toContain('M0 0')
    expect(joined).toContain('M5 5')
  })

  it('produces data the sampling parser also understands', () => {
    const outline = pen('M10 10 Q50 -20 90 10 L90 90 Z')
    expect(pathBounds(toPathData(outline))).not.toBeNull()
  })
})
