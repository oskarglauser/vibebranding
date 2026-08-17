/**
 * Scanline and occupancy tools for reading an outline's shape.
 *
 * Used to measure letterforms and to check that a drawn mark behaves — how much
 * ink it carries, whether it holds together at favicon size, where its enclosed
 * space is.
 *
 * Everything works on flattened segments, so glyphs and hand-drawn marks go
 * through the same code.
 */

import type { Segment } from './metrics'
import type { Box } from './types'

export type Span = { x1: number; x2: number }

/**
 * Ink spans where a horizontal line crosses the outline, under the **nonzero**
 * fill rule.
 *
 * Nonzero rather than even-odd matters: pairing sorted crossings two at a time
 * assumes every overlap is a hole, so two same-wound contours that overlap
 * report a phantom gap between them. Real glyphs do this — several faces draw a
 * letter as overlapping strokes rather than one merged contour.
 */
export type FillRule = 'nonzero' | 'evenodd'

export function spansAt(segments: Segment[], y: number, rule: FillRule = 'nonzero'): Span[] {
  const crossings: Array<{ x: number; direction: number }> = []

  for (const s of segments) {
    if (s.y1 === s.y2) continue
    const low = Math.min(s.y1, s.y2)
    const high = Math.max(s.y1, s.y2)
    // Half-open so a vertex shared by two segments counts once.
    if (y < low || y >= high) continue
    const t = (y - s.y1) / (s.y2 - s.y1)
    crossings.push({ x: s.x1 + t * (s.x2 - s.x1), direction: s.y2 > s.y1 ? 1 : -1 })
  }

  crossings.sort((a, b) => a.x - b.x)

  const spans: Span[] = []
  // Winding count under nonzero; a plain crossing tally under even-odd.
  let count = 0
  let inside = false
  let start = 0

  for (const crossing of crossings) {
    count += rule === 'evenodd' ? 1 : crossing.direction
    const nowInside = rule === 'evenodd' ? count % 2 !== 0 : count !== 0
    if (!inside && nowInside) start = crossing.x
    else if (inside && !nowInside && crossing.x > start) {
      spans.push({ x1: start, x2: crossing.x })
    }
    inside = nowInside
  }
  return spans
}

/** The same, along a vertical line, by transposing the segments. */
export function spansAtX(segments: Segment[], x: number): Span[] {
  const flipped = segments.map((s) => ({ x1: s.y1, y1: s.x1, x2: s.y2, y2: s.x2 }))
  return spansAt(flipped, x)
}

/** Widths of the ink runs at a given height. */
export function runWidthsAt(segments: Segment[], y: number): number[] {
  return spansAt(segments, y).map((span) => span.x2 - span.x1)
}

export type Grid = { cells: Uint8Array; size: number }

/**
 * Sample the outline into a square occupancy grid over `bounds`.
 *
 * One scanline per row rather than a point test per cell, so the cost is
 * proportional to the grid's side, not its area.
 *
 * Rows run top-down in the returned grid regardless of the source's y
 * direction, so a grid built from a y-up glyph reads the same way as one built
 * from y-down mark geometry.
 */
export function occupancy(
  segments: Segment[],
  bounds: Box,
  size: number,
  yUp = false,
  rule: FillRule = 'nonzero',
): Grid {
  const cells = new Uint8Array(size * size)
  const width = bounds.x2 - bounds.x1
  const height = bounds.y2 - bounds.y1
  if (width <= 0 || height <= 0) return { cells, size }

  for (let row = 0; row < size; row++) {
    const fraction = (row + 0.5) / size
    const y = yUp ? bounds.y2 - height * fraction : bounds.y1 + height * fraction
    const spans = spansAt(segments, y, rule)
    if (spans.length === 0) continue

    for (let column = 0; column < size; column++) {
      const x = bounds.x1 + width * ((column + 0.5) / size)
      for (const span of spans) {
        if (x >= span.x1 && x <= span.x2) {
          cells[row * size + column] = 1
          break
        }
      }
    }
  }

  return { cells, size }
}

export function inkCoverage(grid: Grid): number {
  let ink = 0
  for (const cell of grid.cells) if (cell) ink++
  return ink / (grid.size * grid.size)
}

const NEIGHBOURS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

function floodFrom(grid: Grid, seeds: number[], wantInk: 0 | 1): Uint8Array {
  const { cells, size } = grid
  const seen = new Uint8Array(size * size)
  const stack: number[] = []

  for (const seed of seeds) {
    if (cells[seed] === wantInk && !seen[seed]) {
      seen[seed] = 1
      stack.push(seed)
    }
  }

  while (stack.length > 0) {
    const index = stack.pop()!
    const row = (index / size) | 0
    const column = index % size
    for (const [dr, dc] of NEIGHBOURS) {
      const r = row + dr
      const c = column + dc
      if (r < 0 || c < 0 || r >= size || c >= size) continue
      const next = r * size + c
      if (cells[next] === wantInk && !seen[next]) {
        seen[next] = 1
        stack.push(next)
      }
    }
  }

  return seen
}

/** Empty cells reachable from the edge: everything outside the shape. */
function backgroundMask(grid: Grid): Uint8Array {
  const { size } = grid
  const seeds: number[] = []
  for (let i = 0; i < size; i++) {
    seeds.push(i, (size - 1) * size + i, i * size, i * size + size - 1)
  }
  return floodFrom(grid, seeds, 0)
}

export type Component = { cells: number; box: Box }

function componentsOf(grid: Grid, wanted: 0 | 1, excluded: Uint8Array | null): Component[] {
  const { cells, size } = grid
  const seen = new Uint8Array(size * size)
  const found: Component[] = []

  for (let start = 0; start < cells.length; start++) {
    if (cells[start] !== wanted || seen[start]) continue
    if (excluded && excluded[start]) continue

    let count = 0
    let minRow = size
    let minColumn = size
    let maxRow = -1
    let maxColumn = -1
    const stack = [start]
    seen[start] = 1

    while (stack.length > 0) {
      const index = stack.pop()!
      const row = (index / size) | 0
      const column = index % size
      count++
      if (row < minRow) minRow = row
      if (row > maxRow) maxRow = row
      if (column < minColumn) minColumn = column
      if (column > maxColumn) maxColumn = column

      for (const [dr, dc] of NEIGHBOURS) {
        const r = row + dr
        const c = column + dc
        if (r < 0 || c < 0 || r >= size || c >= size) continue
        const next = r * size + c
        if (cells[next] !== wanted || seen[next]) continue
        if (excluded && excluded[next]) continue
        seen[next] = 1
        stack.push(next)
      }
    }

    found.push({
      cells: count,
      box: {
        x1: minColumn / size,
        y1: minRow / size,
        x2: (maxColumn + 1) / size,
        y2: (maxRow + 1) / size,
      },
    })
  }

  return found.sort((a, b) => b.cells - a.cells)
}

/** Separate blobs of ink. More than one means the mark is not a single form. */
export function inkComponents(grid: Grid, minimumCells = 1): Component[] {
  return componentsOf(grid, 1, null).filter((component) => component.cells >= minimumCells)
}

/**
 * Enclosed empty space — counters.
 *
 * Found by flooding the background inward from the edge and keeping whatever
 * empty cells it could not reach. Contour winding cannot do this job: fonts
 * routinely draw a counter as a keyhole pinched shut inside a single contour
 * (Inter's P) or as two same-wound contours (Inter's A and D), so a
 * winding-sign test reports no counter for most letters that plainly have one.
 */
export function counters(grid: Grid, minimumCells = 4): Component[] {
  return componentsOf(grid, 0, backgroundMask(grid)).filter(
    (component) => component.cells >= minimumCells,
  )
}

/**
 * Largest axis-aligned square of empty space inside a counter, as a placement
 * slot. Classic largest-square-of-ones dynamic program over the counter mask.
 */
export function inscribedSquare(
  grid: Grid,
  component: Component,
): { cx: number; cy: number; size: number } {
  const { size } = grid
  const background = backgroundMask(grid)
  const rowStart = Math.floor(component.box.y1 * size)
  const rowEnd = Math.ceil(component.box.y2 * size)
  const columnStart = Math.floor(component.box.x1 * size)
  const columnEnd = Math.ceil(component.box.x2 * size)

  const width = columnEnd - columnStart
  const table = new Int32Array((rowEnd - rowStart) * width)
  let best = 0
  let bestRow = rowStart
  let bestColumn = columnStart

  for (let row = rowStart; row < rowEnd; row++) {
    for (let column = columnStart; column < columnEnd; column++) {
      const index = row * size + column
      const local = (row - rowStart) * width + (column - columnStart)
      if (grid.cells[index] === 1 || background[index]) {
        table[local] = 0
        continue
      }
      const up = row > rowStart ? table[local - width] : 0
      const left = column > columnStart ? table[local - 1] : 0
      const upLeft = row > rowStart && column > columnStart ? table[local - width - 1] : 0
      table[local] = Math.min(up, left, upLeft) + 1
      if (table[local] > best) {
        best = table[local]
        bestRow = row
        bestColumn = column
      }
    }
  }

  // (bestRow, bestColumn) is the square's bottom-right cell.
  return {
    cx: (bestColumn + 0.5 - (best - 1) / 2) / size,
    cy: (bestRow + 0.5 - (best - 1) / 2) / size,
    size: best / size,
  }
}

/** Narrowest ink run anywhere in the grid, as a fraction of the grid side. */
export function thinnestRun(grid: Grid): number {
  const { cells, size } = grid
  let thinnest = Infinity

  const scan = (get: (a: number, b: number) => number) => {
    for (let a = 0; a < size; a++) {
      let run = 0
      for (let b = 0; b < size; b++) {
        if (get(a, b)) {
          run++
        } else {
          if (run > 0 && run < thinnest) thinnest = run
          run = 0
        }
      }
      if (run > 0 && run < thinnest) thinnest = run
    }
  }

  scan((row, column) => cells[row * size + column])
  scan((column, row) => cells[row * size + column])

  return thinnest === Infinity ? 0 : thinnest / size
}

export function boundsOfSegments(segments: Segment[]): Box | null {
  if (segments.length === 0) return null
  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity
  for (const s of segments) {
    x1 = Math.min(x1, s.x1, s.x2)
    x2 = Math.max(x2, s.x1, s.x2)
    y1 = Math.min(y1, s.y1, s.y2)
    y2 = Math.max(y2, s.y1, s.y2)
  }
  return { x1, y1, x2, y2 }
}
