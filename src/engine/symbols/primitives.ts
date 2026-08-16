/**
 * Geometry helpers for symbol archetypes.
 *
 * Everything is authored in a 0..1 unit box with y growing downward, matching
 * the layout engine. Shapes are emitted as path data rather than <circle>/<rect>
 * so a mark can be flattened into a single path — necessary for knockouts — and
 * each helper reports its own exact bounds, so the layout engine can normalise a
 * mark on its ink instead of trusting the box it was drawn in.
 */

import type { Box } from '../types'

export type Shape = {
  d: string
  box: Box
}

export function round(value: number, decimals = 4): number {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}

const n = (value: number) => String(round(value))

export function box(x1: number, y1: number, x2: number, y2: number): Box {
  return { x1, y1, x2, y2 }
}

export function unionBox(a: Box | null, b: Box | null): Box | null {
  if (!a) return b
  if (!b) return a
  return {
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
    x2: Math.max(a.x2, b.x2),
    y2: Math.max(a.y2, b.y2),
  }
}

export function mergeShapes(shapes: Shape[]): Shape {
  let bounds: Box | null = null
  for (const shape of shapes) bounds = unionBox(bounds, shape.box)
  return {
    d: shapes.map((shape) => shape.d).join(' '),
    box: bounds ?? box(0, 0, 0, 0),
  }
}

/** Full circle as two arcs — closed, so it composes with fill rules. */
export function circle(cx: number, cy: number, r: number): Shape {
  return {
    d: `M${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)}Z`,
    box: box(cx - r, cy - r, cx + r, cy + r),
  }
}

/** Ring of a given stroke width: outer circle plus a counter-subpath. */
export function ring(cx: number, cy: number, outerR: number, strokeWidth: number): Shape {
  const innerR = Math.max(outerR - strokeWidth, 0.001)
  return {
    d: `${circle(cx, cy, outerR).d} ${circle(cx, cy, innerR).d}`,
    box: box(cx - outerR, cy - outerR, cx + outerR, cy + outerR),
  }
}

export function rect(x: number, y: number, width: number, height: number): Shape {
  return {
    d: `M${n(x)} ${n(y)}H${n(x + width)}V${n(y + height)}H${n(x)}Z`,
    box: box(x, y, x + width, y + height),
  }
}

export function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): Shape {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2))
  if (r === 0) return rect(x, y, width, height)
  const right = x + width
  const bottom = y + height
  return {
    d:
      `M${n(x + r)} ${n(y)}` +
      `H${n(right - r)}A${n(r)} ${n(r)} 0 0 1 ${n(right)} ${n(y + r)}` +
      `V${n(bottom - r)}A${n(r)} ${n(r)} 0 0 1 ${n(right - r)} ${n(bottom)}` +
      `H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(bottom - r)}` +
      `V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)}Z`,
    box: box(x, y, right, bottom),
  }
}

/** Rounded-rect outline of a given stroke width. */
export function roundedRectOutline(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeWidth: number,
): Shape {
  const inner = roundedRect(
    x + strokeWidth,
    y + strokeWidth,
    Math.max(width - strokeWidth * 2, 0.001),
    Math.max(height - strokeWidth * 2, 0.001),
    Math.max(radius - strokeWidth, 0),
  )
  return {
    d: `${roundedRect(x, y, width, height, radius).d} ${inner.d}`,
    box: box(x, y, x + width, y + height),
  }
}

const toXY = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

/**
 * A thick arc band between two angles in degrees, clockwise from 12 o'clock.
 * Bounds account for the axis crossings the arc actually sweeps through, so a
 * quarter arc reports a quarter-sized box rather than the whole circle.
 */
export function arcBand(
  cx: number,
  cy: number,
  outerR: number,
  strokeWidth: number,
  startDeg: number,
  endDeg: number,
): Shape {
  const innerR = Math.max(outerR - strokeWidth, 0.001)
  const sweep = Math.abs(endDeg - startDeg)
  const largeArc = sweep > 180 ? 1 : 0

  const [x1, y1] = toXY(cx, cy, outerR, startDeg)
  const [x2, y2] = toXY(cx, cy, outerR, endDeg)
  const [x3, y3] = toXY(cx, cy, innerR, endDeg)
  const [x4, y4] = toXY(cx, cy, innerR, startDeg)

  let bounds = box(Math.min(x1, x2, x3, x4), Math.min(y1, y2, y3, y4), Math.max(x1, x2, x3, x4), Math.max(y1, y2, y3, y4))

  // Extremes of the outer arc: every multiple of 90° it passes through.
  const from = Math.min(startDeg, endDeg)
  const to = Math.max(startDeg, endDeg)
  for (let angle = Math.ceil(from / 90) * 90; angle <= to; angle += 90) {
    const [px, py] = toXY(cx, cy, outerR, angle)
    bounds = unionBox(bounds, box(px, py, px, py))!
  }

  return {
    d:
      `M${n(x1)} ${n(y1)}` +
      `A${n(outerR)} ${n(outerR)} 0 ${largeArc} 1 ${n(x2)} ${n(y2)}` +
      `L${n(x3)} ${n(y3)}` +
      `A${n(innerR)} ${n(innerR)} 0 ${largeArc} 0 ${n(x4)} ${n(y4)}Z`,
    box: bounds,
  }
}

/** A lens / vesica: the shape two overlapping circles share. */
export function lens(cx: number, cy: number, halfWidth: number, halfHeight: number): Shape {
  const r = (halfHeight * halfHeight + halfWidth * halfWidth) / (2 * halfWidth)
  return {
    d:
      `M${n(cx)} ${n(cy - halfHeight)}` +
      `A${n(r)} ${n(r)} 0 0 1 ${n(cx)} ${n(cy + halfHeight)}` +
      `A${n(r)} ${n(r)} 0 0 1 ${n(cx)} ${n(cy - halfHeight)}Z`,
    box: box(cx - halfWidth, cy - halfHeight, cx + halfWidth, cy + halfHeight),
  }
}

export function polygon(points: Array<[number, number]>): Shape {
  if (points.length === 0) return { d: '', box: box(0, 0, 0, 0) }
  const [first, ...rest] = points
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  return {
    d: `M${n(first[0])} ${n(first[1])}${rest.map(([x, y]) => `L${n(x)} ${n(y)}`).join('')}Z`,
    box: box(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)),
  }
}
