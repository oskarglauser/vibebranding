import { describe, expect, it } from 'vitest'

import { pathBounds, transformPath } from '../src/engine/pathGeometry'
import { circle, lens, roundedRect } from '../src/engine/symbols/primitives'

/** Bounds compared loosely: curves are flattened, so exactness is not the claim. */
function expectBox(
  actual: ReturnType<typeof pathBounds>,
  expected: [number, number, number, number],
  precision = 2,
) {
  expect(actual).not.toBeNull()
  if (!actual) return
  expect(actual.x1).toBeCloseTo(expected[0], precision)
  expect(actual.y1).toBeCloseTo(expected[1], precision)
  expect(actual.x2).toBeCloseTo(expected[2], precision)
  expect(actual.y2).toBeCloseTo(expected[3], precision)
}

describe('pathBounds', () => {
  it('measures straight segments including the closing edge', () => {
    expectBox(pathBounds('M10 10 H30 V40 Z'), [10, 10, 30, 40])
  })

  it('follows relative commands', () => {
    expectBox(pathBounds('M10 10 h20 v30 z'), [10, 10, 30, 40])
  })

  it('measures a cubic past its endpoints', () => {
    // Control points pull the curve above y=0, but not all the way to -30.
    const box = pathBounds('M0 0 C0 -30 100 -30 100 0')
    expect(box).not.toBeNull()
    if (!box) return
    expect(box.x1).toBeCloseTo(0, 2)
    expect(box.x2).toBeCloseTo(100, 2)
    expect(box.y2).toBeCloseTo(0, 2)
    expect(box.y1).toBeLessThan(-20)
    expect(box.y1).toBeGreaterThan(-30)
  })

  it('resolves smooth curve continuations', () => {
    const smooth = pathBounds('M0 0 C0 -20 40 -20 40 0 S80 20 80 0')
    expect(smooth).not.toBeNull()
    if (!smooth) return
    expect(smooth.x2).toBeCloseTo(80, 2)
    // The reflected control point mirrors the first curve's, so it dips below.
    expect(smooth.y2).toBeGreaterThan(0)
  })

  it('measures a full circle built from two arcs', () => {
    expectBox(pathBounds(circle(50, 50, 20).d), [30, 30, 70, 70], 1)
  })

  it('agrees with the analytic box of the drawing primitives', () => {
    for (const shape of [circle(0.5, 0.5, 0.3), roundedRect(0.1, 0.2, 0.6, 0.5, 0.1), lens(0.5, 0.5, 0.2, 0.35)]) {
      const measured = pathBounds(shape.d)
      expect(measured).not.toBeNull()
      if (!measured) continue
      expect(measured.x1).toBeCloseTo(shape.box.x1, 2)
      expect(measured.y1).toBeCloseTo(shape.box.y1, 2)
      expect(measured.x2).toBeCloseTo(shape.box.x2, 2)
      expect(measured.y2).toBeCloseTo(shape.box.y2, 2)
    }
  })

  it('returns null for empty or unparseable data', () => {
    expect(pathBounds('')).toBeNull()
    expect(pathBounds('   ')).toBeNull()
  })
})

describe('transformPath', () => {
  it('scales and translates like the old transform did', () => {
    expectBox(pathBounds(transformPath('M0 0 H10 V10 Z', { scale: 2, dx: 5, dy: 5 })), [5, 5, 25, 25])
  })

  it('rotates a square about the origin', () => {
    // A 90 degree turn maps the unit square from x:0..10 to y:0..10.
    const turned = transformPath('M0 0 H10 V10 H0 Z', { rotate: 90 })
    expectBox(pathBounds(turned), [-10, 0, 0, 10])
  })

  it('rewrites H and V to line segments once the frame is turned', () => {
    const turned = transformPath('M0 0 H10', { rotate: 45 })
    expect(turned).not.toMatch(/H/)
    expect(turned).toMatch(/L/)
  })

  it('keeps H and V when the transform is axis aligned', () => {
    expect(transformPath('M0 0 H10', { scale: 2 })).toMatch(/H/)
  })

  it('preserves a circle through rotation, since a turned circle is itself', () => {
    const turned = transformPath(circle(0, 0, 10).d, { rotate: 37 })
    expectBox(pathBounds(turned), [-10, -10, 10, 10], 1)
  })

  it('rotates arc geometry rather than just its endpoints', () => {
    // A wide flat lens turned 90 degrees must become a tall narrow one.
    const upright = lens(0, 0, 10, 30)
    const turned = transformPath(upright.d, { rotate: 90 })
    const box = pathBounds(turned)
    expect(box).not.toBeNull()
    if (!box) return
    expect(box.x2 - box.x1).toBeCloseTo(60, 0)
    expect(box.y2 - box.y1).toBeCloseTo(20, 0)
  })

  it('mirrors across the vertical axis', () => {
    expectBox(pathBounds(transformPath('M0 0 H10 V5 Z', { mirror: true })), [-10, 0, 0, 5])
  })

  it('keeps a mirrored arc on the same side it started', () => {
    // Mirroring must flip the sweep flag, or the arc bulges the wrong way.
    const original = pathBounds('M0 0 A10 10 0 0 1 20 0')
    const mirrored = pathBounds(transformPath('M0 0 A10 10 0 0 1 20 0', { mirror: true }))
    expect(original).not.toBeNull()
    expect(mirrored).not.toBeNull()
    if (!original || !mirrored) return
    // Same vertical extent, mirrored horizontally.
    expect(mirrored.y1).toBeCloseTo(original.y1, 2)
    expect(mirrored.y2).toBeCloseTo(original.y2, 2)
    expect(mirrored.x1).toBeCloseTo(-original.x2, 2)
  })

  it('composes rotation with scale and translation', () => {
    const out = transformPath('M0 0 H10 V10 H0 Z', { rotate: 90, scale: 2, dx: 100, dy: 50 })
    expectBox(pathBounds(out), [80, 50, 100, 70])
  })

  it('leaves relative deltas free of the translation', () => {
    // Two identical relative steps must stay identical after transforming.
    const out = transformPath('M0 0 l10 0 l10 0', { scale: 2, dx: 7, dy: 9 })
    expectBox(pathBounds(out), [7, 9, 47, 9])
  })

  it('is a no-op for an identity transform', () => {
    expectBox(pathBounds(transformPath('M1 2 L3 4', {})), [1, 2, 3, 4])
  })
})
