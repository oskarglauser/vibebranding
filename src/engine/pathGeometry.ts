/**
 * Path geometry: transforming and measuring SVG path data.
 *
 * Two jobs the drawn-mark library depends on and the older engine could not do:
 *
 * 1. Rotate path data. Marks tilt to follow the letterform's dominant stroke
 *    angle, and the transform has to be baked into the coordinates rather than
 *    wrapped in a <g> so the exported SVG stays flat.
 * 2. Measure the ink bounds of an arbitrary path. Every primitive used to
 *    compute its own box analytically, which works for a circle but not for a
 *    hand-drawn bezier. Measuring means a template's inkBox is a fact rather
 *    than an assertion.
 *
 * Transforms are restricted to *similarity* — rotate, uniform scale, translate,
 * optional mirror. That is deliberate: under a similarity, elliptical arcs stay
 * elliptical with uniformly scaled radii, so `A` commands survive exactly. A
 * general affine would force converting every arc to beziers, and nothing here
 * needs shear or non-uniform scale.
 */

export function formatNumber(value: number): string {
  const rounded = Math.round(value * 10000) / 10000
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

export type Similarity = {
  /** Uniform scale. Default 1. */
  scale?: number
  /** Rotation in degrees, clockwise in SVG's y-down space. Default 0. */
  rotate?: number
  /** Reflect across the vertical axis before rotating. Default false. */
  mirror?: boolean
  dx?: number
  dy?: number
}

/** Argument count per path command, used to know which numbers are x and which are y. */
const COMMAND_ARITY: Record<string, number> = {
  m: 2, l: 2, t: 2, h: 1, v: 1, c: 6, s: 4, q: 4, a: 7, z: 0,
}

const TOKENS = /[astvzqmhlc]|-?\d*\.?\d+(?:e[+-]?\d+)?/gi

type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number }

/**
 * Build the 2x3 matrix for a similarity.
 *
 * Composition is translate . rotate . scale . mirror, so a caller reads it as
 * "flip it, size it, turn it, then put it there".
 */
function toMatrix(t: Similarity): Matrix {
  const scale = t.scale ?? 1
  const radians = ((t.rotate ?? 0) * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const mx = t.mirror ? -1 : 1

  return {
    a: scale * mx * cos,
    b: scale * mx * sin,
    c: -scale * sin,
    d: scale * cos,
    e: t.dx ?? 0,
    f: t.dy ?? 0,
  }
}

function applyPoint(m: Matrix, x: number, y: number): [number, number] {
  return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]
}

/** Relative coordinates are deltas: the translation must not apply to them. */
function applyDelta(m: Matrix, x: number, y: number): [number, number] {
  return [m.a * x + m.c * y, m.b * x + m.d * y]
}

function isCommand(token: string): boolean {
  return /^[astvzqmhlc]$/i.test(token)
}

/**
 * Transform path data by a similarity, baking the result into the coordinates.
 *
 * H and V are rewritten to L/l when the transform rotates or mirrors, because a
 * horizontal line does not stay horizontal once turned. That requires tracking
 * the current point in source coordinates, which we do anyway for Z.
 */
export function transformPath(d: string, transform: Similarity): string {
  const tokens = d.match(TOKENS)
  if (!tokens) return ''

  const m = toMatrix(transform)
  const scale = transform.scale ?? 1
  const rotation = transform.rotate ?? 0
  const mirror = transform.mirror ?? false
  // Axis-aligned commands only survive when the frame is not turned or flipped.
  const axisAligned = rotation % 360 === 0 && !mirror

  const out: string[] = []
  let index = 0
  let command = 'M'
  // Current point and subpath start, in *source* coordinates.
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  // Implicit repeats ("L1 2 3 4") re-emit the command only when it changes,
  // so the transform does not inflate the path data it is handed.
  let emitted = ''

  const pushCommand = (token: string) => {
    if (token === emitted) return
    out.push(token)
    emitted = token
  }

  const emit = (token: string, ...values: number[]) => {
    pushCommand(token)
    out.push(...values.map(formatNumber))
  }

  while (index < tokens.length) {
    const token = tokens[index]
    if (isCommand(token)) {
      command = token
      index++
      if (command.toLowerCase() === 'z') {
        pushCommand(command)
        x = startX
        y = startY
        continue
      }
    }

    const lower = command.toLowerCase()
    const relative = command === lower
    const arity = COMMAND_ARITY[lower] ?? 2
    const args: number[] = []
    for (let i = 0; i < arity && index < tokens.length; i++) args.push(Number(tokens[index++]))
    if (args.length < arity) break

    if (lower === 'h' || lower === 'v') {
      const horizontal = lower === 'h'
      const nextX = horizontal ? (relative ? x + args[0] : args[0]) : x
      const nextY = horizontal ? y : relative ? y + args[0] : args[0]

      if (axisAligned) {
        emit(command, horizontal ? nextX * scale + m.e : nextY * scale + m.f)
      } else if (relative) {
        const [dx, dy] = applyDelta(m, nextX - x, nextY - y)
        emit('l', dx, dy)
      } else {
        emit('L', ...applyPoint(m, nextX, nextY))
      }
      x = nextX
      y = nextY
    } else if (lower === 'a') {
      // rx ry x-axis-rotation large-arc sweep x y
      const [rx, ry, axisRotation, largeArc, sweep, ax, ay] = args
      // Mirroring reverses the sense of the ellipse's axis and of the sweep.
      const nextAxis = mirror ? rotation - axisRotation : rotation + axisRotation
      const nextSweep = mirror ? (sweep ? 0 : 1) : sweep

      const nextX = relative ? x + ax : ax
      const nextY = relative ? y + ay : ay
      const [px, py] = relative ? applyDelta(m, ax, ay) : applyPoint(m, ax, ay)

      emit(command, rx * scale, ry * scale, nextAxis, largeArc, nextSweep, px, py)
      x = nextX
      y = nextY
    } else {
      pushCommand(command)
      for (let i = 0; i + 1 < args.length; i += 2) {
        const [px, py] = relative
          ? applyDelta(m, args[i], args[i + 1])
          : applyPoint(m, args[i], args[i + 1])
        out.push(formatNumber(px), formatNumber(py))
      }
      const lastX = args[args.length - 2]
      const lastY = args[args.length - 1]
      x = relative ? x + lastX : lastX
      y = relative ? y + lastY : lastY
      if (lower === 'm') {
        startX = x
        startY = y
      }
    }

    // An implicit repeat of the last command follows (e.g. "L 1 2 3 4").
    if (lower === 'm') command = relative ? 'l' : 'L'
  }

  return out
    .join(' ')
    .replace(/ (?=[astvzqmhlc])/gi, '')
    .replace(/([astvzqmhlc]) /gi, '$1')
    .trim()
}

const CURVE_STEPS = 16

function quadPoint(p0: number, p1: number, p2: number, t: number): number {
  const u = 1 - t
  return u * u * p0 + 2 * u * t * p1 + t * t * p2
}

function cubicPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

/**
 * Sample an endpoint-parameterised elliptical arc.
 *
 * Follows the SVG implementation notes: convert endpoint form to centre form,
 * then walk the sweep. Out-of-range radii are scaled up per spec rather than
 * rejected, so a hand-authored path with slightly tight radii still measures.
 */
function sampleArc(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  axisDegrees: number,
  largeArc: number,
  sweep: number,
  x2: number,
  y2: number,
  push: (x: number, y: number) => void,
): void {
  if (rx === 0 || ry === 0) {
    push(x2, y2)
    return
  }

  let absRx = Math.abs(rx)
  let absRy = Math.abs(ry)
  const phi = ((axisDegrees % 360) * Math.PI) / 180
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)

  const dx2 = (x1 - x2) / 2
  const dy2 = (y1 - y2) / 2
  const x1p = cosPhi * dx2 + sinPhi * dy2
  const y1p = -sinPhi * dx2 + cosPhi * dy2

  const lambda = (x1p * x1p) / (absRx * absRx) + (y1p * y1p) / (absRy * absRy)
  if (lambda > 1) {
    const factor = Math.sqrt(lambda)
    absRx *= factor
    absRy *= factor
  }

  const sign = largeArc === sweep ? -1 : 1
  const numerator =
    absRx * absRx * absRy * absRy - absRx * absRx * y1p * y1p - absRy * absRy * x1p * x1p
  const denominator = absRx * absRx * y1p * y1p + absRy * absRy * x1p * x1p
  const coefficient = denominator === 0 ? 0 : sign * Math.sqrt(Math.max(0, numerator / denominator))

  const cxp = (coefficient * (absRx * y1p)) / absRy
  const cyp = (coefficient * -(absRy * x1p)) / absRx
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2

  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy))
    const value = len === 0 ? 0 : Math.acos(Math.min(1, Math.max(-1, dot / len)))
    return ux * vy - uy * vx < 0 ? -value : value
  }

  const startX = (x1p - cxp) / absRx
  const startY = (y1p - cyp) / absRy
  const theta = angle(1, 0, startX, startY)
  let delta = angle(startX, startY, (-x1p - cxp) / absRx, (-y1p - cyp) / absRy)
  if (sweep === 0 && delta > 0) delta -= 2 * Math.PI
  if (sweep === 1 && delta < 0) delta += 2 * Math.PI

  for (let i = 1; i <= CURVE_STEPS; i++) {
    const t = theta + (delta * i) / CURVE_STEPS
    const cosT = Math.cos(t)
    const sinT = Math.sin(t)
    push(
      cx + absRx * cosT * cosPhi - absRy * sinT * sinPhi,
      cy + absRx * cosT * sinPhi + absRy * sinT * cosPhi,
    )
  }
}

/**
 * Ink bounds of arbitrary path data.
 *
 * Curves are flattened rather than solved for extrema: at 16 steps the error is
 * far below the precision anything downstream cares about, and it keeps one
 * code path for cubics, quadratics and arcs alike.
 */
export function pathBounds(d: string): { x1: number; y1: number; x2: number; y2: number } | null {
  const tokens = d.match(TOKENS)
  if (!tokens) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let seen = false

  const push = (px: number, py: number) => {
    if (!Number.isFinite(px) || !Number.isFinite(py)) return
    seen = true
    if (px < minX) minX = px
    if (px > maxX) maxX = px
    if (py < minY) minY = py
    if (py > maxY) maxY = py
  }

  let index = 0
  let command = 'M'
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  // Previous control point, for the smooth forms S and T.
  let lastControlX = 0
  let lastControlY = 0
  let lastWasCubic = false
  let lastWasQuad = false

  while (index < tokens.length) {
    const token = tokens[index]
    if (isCommand(token)) {
      command = token
      index++
      if (command.toLowerCase() === 'z') {
        x = startX
        y = startY
        lastWasCubic = false
        lastWasQuad = false
        continue
      }
    }

    const lower = command.toLowerCase()
    const relative = command === lower
    const arity = COMMAND_ARITY[lower] ?? 2
    const args: number[] = []
    for (let i = 0; i < arity && index < tokens.length; i++) args.push(Number(tokens[index++]))
    if (args.length < arity) break

    const originX = relative ? x : 0
    const originY = relative ? y : 0

    if (lower === 'm') {
      x = originX + args[0]
      y = originY + args[1]
      startX = x
      startY = y
      push(x, y)
      lastWasCubic = false
      lastWasQuad = false
      command = relative ? 'l' : 'L'
    } else if (lower === 'l') {
      x = originX + args[0]
      y = originY + args[1]
      push(x, y)
      lastWasCubic = false
      lastWasQuad = false
    } else if (lower === 'h') {
      x = originX + args[0]
      push(x, y)
      lastWasCubic = false
      lastWasQuad = false
    } else if (lower === 'v') {
      y = originY + args[0]
      push(x, y)
      lastWasCubic = false
      lastWasQuad = false
    } else if (lower === 'c' || lower === 's') {
      let c1x: number
      let c1y: number
      if (lower === 'c') {
        c1x = originX + args[0]
        c1y = originY + args[1]
      } else {
        // Smooth: reflect the previous control point about the current point.
        c1x = lastWasCubic ? 2 * x - lastControlX : x
        c1y = lastWasCubic ? 2 * y - lastControlY : y
      }
      const offset = lower === 'c' ? 2 : 0
      const c2x = originX + args[offset]
      const c2y = originY + args[offset + 1]
      const endX = originX + args[offset + 2]
      const endY = originY + args[offset + 3]

      for (let i = 1; i <= CURVE_STEPS; i++) {
        const t = i / CURVE_STEPS
        push(cubicPoint(x, c1x, c2x, endX, t), cubicPoint(y, c1y, c2y, endY, t))
      }
      lastControlX = c2x
      lastControlY = c2y
      x = endX
      y = endY
      lastWasCubic = true
      lastWasQuad = false
    } else if (lower === 'q' || lower === 't') {
      let cx: number
      let cy: number
      if (lower === 'q') {
        cx = originX + args[0]
        cy = originY + args[1]
      } else {
        cx = lastWasQuad ? 2 * x - lastControlX : x
        cy = lastWasQuad ? 2 * y - lastControlY : y
      }
      const offset = lower === 'q' ? 2 : 0
      const endX = originX + args[offset]
      const endY = originY + args[offset + 1]

      for (let i = 1; i <= CURVE_STEPS; i++) {
        const t = i / CURVE_STEPS
        push(quadPoint(x, cx, endX, t), quadPoint(y, cy, endY, t))
      }
      lastControlX = cx
      lastControlY = cy
      x = endX
      y = endY
      lastWasQuad = true
      lastWasCubic = false
    } else if (lower === 'a') {
      const endX = originX + args[5]
      const endY = originY + args[6]
      sampleArc(x, y, args[0], args[1], args[2], args[3], args[4], endX, endY, push)
      x = endX
      y = endY
      lastWasCubic = false
      lastWasQuad = false
    }
  }

  if (!seen) return null
  return { x1: minX, y1: minY, x2: maxX, y2: maxY }
}
