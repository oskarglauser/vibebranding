/**
 * Drawing helpers shared by the templates.
 *
 * These are the shapes worth having exact — a circle whose curvature is right,
 * a superellipse that actually looks like one — rather than a general library.
 * Anything with character belongs in the template that draws it.
 */

import { mat, pen, transform, type Outline } from './pen'

/**
 * The constant that makes four cubics look like a circle.
 * (4/3)·tan(π/8): the classic Bézier circle approximation.
 */
const KAPPA = 0.5522847498307936

export function circle(cx: number, cy: number, r: number): Outline {
  const k = r * KAPPA
  return pen(
    `M${cx} ${cy - r}` +
      `C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}` +
      `C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}` +
      `C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}` +
      `C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}Z`,
  )
}

/** A circle wound the other way, so it knocks a hole under even-odd. */
export function circleReversed(cx: number, cy: number, r: number): Outline {
  const k = r * KAPPA
  return pen(
    `M${cx} ${cy - r}` +
      `C${cx - k} ${cy - r} ${cx - r} ${cy - k} ${cx - r} ${cy}` +
      `C${cx - r} ${cy + k} ${cx - k} ${cy + r} ${cx} ${cy + r}` +
      `C${cx + k} ${cy + r} ${cx + r} ${cy + k} ${cx + r} ${cy}` +
      `C${cx + r} ${cy - k} ${cx + k} ${cy - r} ${cx} ${cy - r}Z`,
  )
}

export function ring(cx: number, cy: number, outer: number, stroke: number): Outline {
  const inner = Math.max(0.5, outer - stroke)
  return {
    commands: [...circle(cx, cy, outer).commands, ...circleReversed(cx, cy, inner).commands],
  }
}

export function rect(x: number, y: number, width: number, height: number): Outline {
  return pen(`M${x} ${y}L${x + width} ${y}L${x + width} ${y + height}L${x} ${y + height}Z`)
}

/**
 * A rounded rectangle with Bézier corners rather than arcs, so it transforms
 * exactly and its bounds solve in closed form.
 */
export function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): Outline {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2))
  if (r === 0) return rect(x, y, width, height)

  const k = r * KAPPA
  const right = x + width
  const bottom = y + height

  return pen(
    `M${x + r} ${y}` +
      `L${right - r} ${y}` +
      `C${right - r + k} ${y} ${right} ${y + r - k} ${right} ${y + r}` +
      `L${right} ${bottom - r}` +
      `C${right} ${bottom - r + k} ${right - r + k} ${bottom} ${right - r} ${bottom}` +
      `L${x + r} ${bottom}` +
      `C${x + r - k} ${bottom} ${x} ${bottom - r + k} ${x} ${bottom - r}` +
      `L${x} ${y + r}` +
      `C${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y}Z`,
  )
}

/**
 * A superellipse — the shape an app icon actually uses.
 *
 * A rounded rectangle carries a visible break where the straight edge meets the
 * arc; a superellipse stays curved throughout, which is why it reads as
 * considered rather than default. Approximated with four cubics whose control
 * points are pulled out along the edges.
 */
export function squircle(cx: number, cy: number, radius: number, n = 0.62): Outline {
  const r = radius
  const c = r * n
  return pen(
    `M${cx} ${cy - r}` +
      `C${cx + c} ${cy - r} ${cx + r} ${cy - c} ${cx + r} ${cy}` +
      `C${cx + r} ${cy + c} ${cx + c} ${cy + r} ${cx} ${cy + r}` +
      `C${cx - c} ${cy + r} ${cx - r} ${cy + c} ${cx - r} ${cy}` +
      `C${cx - r} ${cy - c} ${cx - c} ${cy - r} ${cx} ${cy - r}Z`,
  )
}

/** Degrees clockwise from twelve o'clock, to a point on a circle. */
function onCircle(cx: number, cy: number, r: number, degrees: number): [number, number] {
  const radians = ((degrees - 90) * Math.PI) / 180
  return [cx + r * Math.cos(radians), cy + r * Math.sin(radians)]
}

/**
 * Cubic segments along a circular arc.
 *
 * Split into sweeps of at most 90 degrees — the Bézier approximation of a
 * circle degrades quickly past that — with the classic (4/3)·tan(Δ/4) control
 * arm. Returns the segment strings without a leading move, so an arc can be
 * stitched into a larger closed shape.
 */
function arcSegments(
  cx: number,
  cy: number,
  r: number,
  startDegrees: number,
  endDegrees: number,
): string {
  const sweep = endDegrees - startDegrees
  const steps = Math.max(1, Math.ceil(Math.abs(sweep) / 90))
  const step = sweep / steps
  const k = (4 / 3) * Math.tan((((step / 2) * Math.PI) / 180) / 2)

  let out = ''
  for (let i = 0; i < steps; i++) {
    const a0 = startDegrees + step * i
    const a1 = a0 + step
    const [x0, y0] = onCircle(cx, cy, r, a0)
    const [x1, y1] = onCircle(cx, cy, r, a1)
    // Tangents, which for a circle are perpendicular to the radius.
    const t0 = ((a0 - 90) * Math.PI) / 180
    const t1 = ((a1 - 90) * Math.PI) / 180
    const c1x = x0 - k * r * Math.sin(t0)
    const c1y = y0 + k * r * Math.cos(t0)
    const c2x = x1 + k * r * Math.sin(t1)
    const c2y = y1 - k * r * Math.cos(t1)
    out += `C${c1x} ${c1y} ${c2x} ${c2y} ${x1} ${y1}`
  }
  return out
}

/** A closed band of constant thickness following an arc. */
export function arcBand(
  cx: number,
  cy: number,
  outer: number,
  thickness: number,
  startDegrees: number,
  endDegrees: number,
): Outline {
  const inner = Math.max(0.5, outer - thickness)
  const [sx, sy] = onCircle(cx, cy, outer, startDegrees)
  const [ex, ey] = onCircle(cx, cy, inner, endDegrees)
  return pen(
    `M${sx} ${sy}` +
      arcSegments(cx, cy, outer, startDegrees, endDegrees) +
      `L${ex} ${ey}` +
      arcSegments(cx, cy, inner, endDegrees, startDegrees) +
      'Z',
  )
}

/** A wedge from the centre out, like a slice. */
export function wedge(
  cx: number,
  cy: number,
  r: number,
  startDegrees: number,
  endDegrees: number,
): Outline {
  const [sx, sy] = onCircle(cx, cy, r, startDegrees)
  return pen(
    `M${cx} ${cy}L${sx} ${sy}` + arcSegments(cx, cy, r, startDegrees, endDegrees) + 'Z',
  )
}

export { onCircle }

/** A lens: the shape two overlapping circles share. Drawn, not intersected. */
export function lens(cx: number, cy: number, halfWidth: number, halfHeight: number): Outline {
  const k = halfWidth * 1.34
  return pen(
    `M${cx} ${cy - halfHeight}` +
      `C${cx + k} ${cy - halfHeight * 0.42} ${cx + k} ${cy + halfHeight * 0.42} ${cx} ${cy + halfHeight}` +
      `C${cx - k} ${cy + halfHeight * 0.42} ${cx - k} ${cy - halfHeight * 0.42} ${cx} ${cy - halfHeight}Z`,
  )
}

/** A quadrilateral through four points. */
export function quad(
  a: readonly [number, number],
  b: readonly [number, number],
  c: readonly [number, number],
  d: readonly [number, number],
): Outline {
  return pen(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}L${d[0]} ${d[1]}Z`)
}

/** A straight bar of a given thickness between two points, with square ends. */
export function bar(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
): Outline {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy) || 1
  const nx = (-dy / length) * (thickness / 2)
  const ny = (dx / length) * (thickness / 2)
  return quad([x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny])
}

/**
 * A constant-width line through a run of points, with mitred joins.
 *
 * Offsetting a polyline by shifting its vertices vertically is the obvious
 * shortcut and it does not work: the band comes out thin on the steep segments
 * and thick on the shallow ones, which reads as a mistake rather than a stroke.
 * Offsetting along the angle bisector holds the width constant however the line
 * turns.
 */
export function polyline(points: Array<readonly [number, number]>, thickness: number): Outline {
  if (points.length < 2) throw new Error('polyline: needs at least two points')
  const half = thickness / 2

  /** Left-hand normal of each segment. */
  const normals = points.slice(0, -1).map((p, i) => {
    const [x1, y1] = p
    const [x2, y2] = points[i + 1]
    const length = Math.hypot(x2 - x1, y2 - y1) || 1
    return [-(y2 - y1) / length, (x2 - x1) / length] as const
  })

  const offsets = (side: 1 | -1) =>
    points.map((point, i) => {
      const before = normals[i - 1]
      const after = normals[i]
      if (!before) return [point[0] + after[0] * half * side, point[1] + after[1] * half * side]
      if (!after) return [point[0] + before[0] * half * side, point[1] + before[1] * half * side]

      const mx = before[0] + after[0]
      const my = before[1] + after[1]
      const length = Math.hypot(mx, my)
      // A doubled-back segment has no bisector; fall back to a butt end.
      if (length < 1e-6) return [point[0] + after[0] * half * side, point[1] + after[1] * half * side]

      const hx = mx / length
      const hy = my / length
      // Cap the mitre so a sharp turn does not throw a spike across the box.
      const cos = Math.max(0.35, hx * before[0] + hy * before[1])
      return [point[0] + (hx * half * side) / cos, point[1] + (hy * half * side) / cos]
    })

  // Wound clockwise to match every other shape here. Winding matters: two
  // overlapping shapes of opposite winding cancel under the nonzero rule, so a
  // counter-clockwise line would punch a hole wherever a dot or another mark
  // element sat on it.
  const all = [...offsets(-1), ...offsets(1).reverse()]
  return pen(`M${all.map(([x, y]) => `${x} ${y}`).join('L')}Z`)
}

export function rotate(outline: Outline, degrees: number, cx: number, cy: number): Outline {
  return transform(outline, mat.rotate(degrees, cx, cy))
}

/** Repeat an outline around a centre. */
export function radial(
  outline: Outline,
  count: number,
  cx: number,
  cy: number,
  startAngle = 0,
): Outline[] {
  return Array.from({ length: count }, (_, i) =>
    rotate(outline, startAngle + (360 / count) * i, cx, cy),
  )
}
