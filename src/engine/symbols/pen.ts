/**
 * The drawing API for hand-authored marks.
 *
 * Templates are drawn as path data on a 0..100 grid, y down — the way you would
 * write it after drawing the shape in Figma. `pen()` parses that into control
 * points once, at module load, so a typo is a build-time error rather than a
 * blank mark in someone's brand package.
 *
 * Working in control points rather than path strings is what makes fitting
 * exact. Béziers are affine-covariant — the image of a curve under an affine
 * map is the curve through the mapped control points — so leaning, mirroring
 * and stretching a drawn mark is exact and needs no arc handling at all.
 * Bounds are solved from the curve extrema rather than sampled, which is what
 * lets the containment invariant be a real assertion.
 *
 * Only M, L, C, Q and Z are accepted. Arcs are deliberately excluded: they do
 * not survive a general affine, and nothing hand-drawn needs them.
 */

import type { Box } from '../types'
import { formatNumber } from '../pathGeometry'

export type Point = readonly [number, number]

export type Command =
  | readonly ['M', Point]
  | readonly ['L', Point]
  | readonly ['C', Point, Point, Point]
  | readonly ['Q', Point, Point]
  | readonly ['Z']

export type Outline = { readonly commands: readonly Command[] }

/** Affine matrix [a b c d e f], mapping (x,y) to (ax+cy+e, bx+dy+f). */
export type Matrix = readonly [number, number, number, number, number, number]

const ARITY: Record<string, number> = { M: 2, L: 2, C: 6, Q: 4, Z: 0 }

/**
 * Parse hand-authored path data into an outline.
 *
 * Absolute commands only, so what is written is what is drawn — relative
 * chains are unreadable to edit by hand and easy to get subtly wrong.
 */
export function pen(d: string): Outline {
  // Match every letter, not just the supported ones: an unmatched A or S would
  // otherwise be skipped silently and its numbers swallowed as an implicit
  // line, corrupting the drawing instead of reporting it.
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[+-]?\d+)?/g)
  if (!tokens) throw new Error(`pen: no path data in ${JSON.stringify(d)}`)

  const commands: Command[] = []
  let index = 0
  let current = ''

  while (index < tokens.length) {
    const token = tokens[index]
    if (/^[A-Za-z]$/.test(token)) {
      if (token !== token.toUpperCase()) {
        throw new Error(`pen: relative command "${token}" — use absolute commands`)
      }
      if (ARITY[token] === undefined) {
        throw new Error(`pen: unsupported command "${token}" — only M, L, C, Q and Z`)
      }
      if (commands.length === 0 && token !== 'M') {
        throw new Error(`pen: path data must start with M, got "${token}"`)
      }
      current = token
      index++
      if (current === 'Z') {
        commands.push(['Z'])
        continue
      }
    }
    if (!current) throw new Error(`pen: path data must start with a command`)
    if (current === 'Z') continue

    const arity = ARITY[current]
    if (arity === undefined) {
      throw new Error(`pen: unsupported command "${current}" — only M, L, C, Q and Z`)
    }

    const values: number[] = []
    for (let i = 0; i < arity && index < tokens.length; i++) {
      const value = Number(tokens[index++])
      if (!Number.isFinite(value)) throw new Error(`pen: bad number in ${JSON.stringify(d)}`)
      values.push(value)
    }
    if (values.length < arity) throw new Error(`pen: truncated "${current}" in ${JSON.stringify(d)}`)

    if (current === 'M') commands.push(['M', [values[0], values[1]]])
    else if (current === 'L') commands.push(['L', [values[0], values[1]]])
    else if (current === 'Q') commands.push(['Q', [values[0], values[1]], [values[2], values[3]]])
    else {
      commands.push([
        'C',
        [values[0], values[1]],
        [values[2], values[3]],
        [values[4], values[5]],
      ])
    }

    // An implicit repeat follows a coordinate run; M repeats as L.
    if (current === 'M') current = 'L'
  }

  if (commands.length === 0) throw new Error(`pen: empty path ${JSON.stringify(d)}`)
  return { commands }
}

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

export const mat = {
  translate(dx: number, dy: number): Matrix {
    return [1, 0, 0, 1, dx, dy]
  },
  scale(sx: number, sy = sx): Matrix {
    return [sx, 0, 0, sy, 0, 0]
  },
  /** Rotate clockwise in the y-down drawing space, about a point. */
  rotate(degrees: number, cx = 0, cy = 0): Matrix {
    const radians = (degrees * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    return [cos, sin, -sin, cos, cx - cx * cos + cy * sin, cy - cx * sin - cy * cos]
  },
  /** Reflect across the vertical line x = cx. */
  mirrorX(cx = 0): Matrix {
    return [-1, 0, 0, 1, 2 * cx, 0]
  },
  /** Scale about a point, so a mark grows from its own centre. */
  scaleAbout(sx: number, sy: number, cx: number, cy: number): Matrix {
    return [sx, 0, 0, sy, cx - cx * sx, cy - cy * sy]
  },
  /** Compose left to right: mul(a, b) applies a, then b. */
  mul(...matrices: Matrix[]): Matrix {
    return matrices.reduce((a, b) => [
      b[0] * a[0] + b[2] * a[1],
      b[1] * a[0] + b[3] * a[1],
      b[0] * a[2] + b[2] * a[3],
      b[1] * a[2] + b[3] * a[3],
      b[0] * a[4] + b[2] * a[5] + b[4],
      b[1] * a[4] + b[3] * a[5] + b[5],
    ], IDENTITY)
  },
}

function apply(m: Matrix, [x, y]: Point): Point {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

/** Map every control point. Exact for lines and Béziers alike. */
export function transform(outline: Outline, m: Matrix): Outline {
  return {
    commands: outline.commands.map((command) => {
      switch (command[0]) {
        case 'M':
          return ['M', apply(m, command[1])] as const
        case 'L':
          return ['L', apply(m, command[1])] as const
        case 'Q':
          return ['Q', apply(m, command[1]), apply(m, command[2])] as const
        case 'C':
          return ['C', apply(m, command[1]), apply(m, command[2]), apply(m, command[3])] as const
        default:
          return command
      }
    }),
  }
}

export function transformAll(outlines: Outline[], m: Matrix): Outline[] {
  return outlines.map((outline) => transform(outline, m))
}

/** Roots of at^2 + bt + c in the open interval (0, 1). */
function quadraticRoots(a: number, b: number, c: number): number[] {
  const roots: number[] = []
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) roots.push(-c / b)
  } else {
    const discriminant = b * b - 4 * a * c
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant)
      roots.push((-b + root) / (2 * a), (-b - root) / (2 * a))
    }
  }
  return roots.filter((t) => t > 0 && t < 1)
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function quadAt(p0: number, p1: number, p2: number, t: number): number {
  const u = 1 - t
  return u * u * p0 + 2 * u * t * p1 + t * t * p2
}

/**
 * Exact ink bounds, from curve extrema rather than sampling.
 *
 * Sampling would leave an error term, and the containment invariant needs to
 * assert that a mark is inside its box rather than probably inside it.
 */
export function bounds(outline: Outline): Box | null {
  const low = [Infinity, Infinity]
  const high = [-Infinity, -Infinity]
  let seen = false

  /** Extend one axis only: an x extremum says nothing about y. */
  const includeAxis = (axis: 0 | 1, value: number) => {
    seen = true
    if (value < low[axis]) low[axis] = value
    if (value > high[axis]) high[axis] = value
  }

  const includePoint = ([x, y]: Point) => {
    includeAxis(0, x)
    includeAxis(1, y)
  }

  let current: Point = [0, 0]
  let start: Point = [0, 0]

  for (const command of outline.commands) {
    if (command[0] === 'M') {
      current = command[1]
      start = command[1]
      includePoint(current)
    } else if (command[0] === 'L') {
      current = command[1]
      includePoint(current)
    } else if (command[0] === 'Z') {
      current = start
    } else if (command[0] === 'Q') {
      const [, control, end] = command
      includePoint(end)
      for (const axis of [0, 1] as const) {
        const p0 = current[axis]
        const p1 = control[axis]
        const p2 = end[axis]
        const denominator = p0 - 2 * p1 + p2
        if (Math.abs(denominator) < 1e-12) continue
        const t = (p0 - p1) / denominator
        if (t > 0 && t < 1) includeAxis(axis, quadAt(p0, p1, p2, t))
      }
      current = end
    } else {
      const [, c1, c2, end] = command
      includePoint(end)
      for (const axis of [0, 1] as const) {
        const p0 = current[axis]
        const p1 = c1[axis]
        const p2 = c2[axis]
        const p3 = end[axis]
        // B'(t) / 3 = at^2 + bt + c; the common factor does not move the roots.
        const a = -p0 + 3 * p1 - 3 * p2 + p3
        const b = 2 * (p0 - 2 * p1 + p2)
        const c = p1 - p0
        for (const t of quadraticRoots(a, b, c)) {
          includeAxis(axis, cubicAt(p0, p1, p2, p3, t))
        }
      }
      current = end
    }
  }

  return seen ? { x1: low[0], y1: low[1], x2: high[0], y2: high[1] } : null
}

export function unionBounds(outlines: Outline[]): Box | null {
  let result: Box | null = null
  for (const outline of outlines) {
    const box = bounds(outline)
    if (!box) continue
    result = result
      ? {
          x1: Math.min(result.x1, box.x1),
          y1: Math.min(result.y1, box.y1),
          x2: Math.max(result.x2, box.x2),
          y2: Math.max(result.y2, box.y2),
        }
      : box
  }
  return result
}

export function toPathData(outline: Outline): string {
  const parts: string[] = []
  let emitted = ''

  const push = (letter: string, points: readonly Point[]) => {
    if (letter !== emitted) {
      parts.push(letter)
      emitted = letter
    }
    for (const [x, y] of points) parts.push(`${formatNumber(x)} ${formatNumber(y)}`)
  }

  for (const command of outline.commands) {
    if (command[0] === 'Z') {
      parts.push('Z')
      emitted = ''
    } else if (command[0] === 'M') {
      push('M', [command[1]])
      // An M is followed by implicit L in path data, matching pen's parsing.
      emitted = 'L'
    } else if (command[0] === 'L') push('L', [command[1]])
    else if (command[0] === 'Q') push('Q', [command[1], command[2]])
    else push('C', [command[1], command[2], command[3]])
  }

  return parts
    .join(' ')
    .replace(/ (?=[MLCQZ])/g, '')
    .replace(/([MLCQZ]) /g, '$1')
    .trim()
}

export function pathDataFor(outlines: Outline[]): string {
  return outlines.map(toPathData).join(' ')
}
