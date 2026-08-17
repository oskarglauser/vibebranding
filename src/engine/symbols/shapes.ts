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
