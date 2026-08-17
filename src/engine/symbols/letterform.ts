/**
 * Measuring a letter so a mark can be fitted to it.
 *
 * The previous system classified letters with three hardcoded sets — O is
 * round, I is straight, N is diagonal — and used the result only to reorder the
 * candidate list. No mark's geometry ever changed. This closes that gap: every
 * value here is read off the actual outline, so the same N measures differently
 * in Bebas Neue than in Playfair, and the marks drawn beside them differ too.
 *
 * Two measurements here were arrived at by testing the obvious approach against
 * the real fixtures and finding it wrong; see `dominantDirections` and
 * `measureCounters` for what failed and why.
 */

import { flattenGlyph } from '../metrics'
import {
  boundsOfSegments,
  counters as countersOf,
  inkCoverage,
  inscribedSquare,
  occupancy,
  runWidthsAt,
  spansAtX,
} from '../outline'
import type { Segment } from '../metrics'
import type { Box, LoadedFont } from '../types'

export type LetterShape = 'round' | 'straight' | 'diagonal' | 'mixed'

/** Enclosed space inside a letter, in the letter's own 0..1 ink box, y down. */
export type Counter = {
  box: Box
  /** Largest square that fits inside it: where an element can sit. */
  slot: { cx: number; cy: number; size: number }
  /** Share of the letter's ink box this counter occupies. */
  areaShare: number
}

export type LetterForm = {
  character: string
  /** False when the font cannot render the character; all fields are neutral. */
  measured: boolean

  /** Ink width over cap height. Bebas H measures ~0.5, Playfair H ~1.0. */
  widthRatio: number
  /** Ink width over ink height. */
  aspect: number

  /**
   * Dominant stroke direction in degrees, 0..180 with 90 vertical, measured
   * y-up so it reads the way a designer would describe the letter.
   */
  axisAngle: number
  /** Share of long-run length in that direction. 0 means no straight runs. */
  axisStrength: number
  /** Dominant direction away from vertical and horizontal, or null. */
  diagonalAngle: number | null
  diagonalStrength: number

  /** Share of the outline made of straight runs. Low for O, high for I. */
  straightness: number
  /** Convenience inverse of straightness. */
  roundness: number

  counters: Counter[]
  primaryCounter: Counter | null

  /** True when the ink mirrors about its vertical centre (A, H, O, T, X). */
  symmetricVertical: boolean
  /** Stroke modulation: ~1 for a grotesk, high for a didone. */
  contrast: number
  /** Ink cells over grid cells: how solid the letter is. */
  coverage: number

  shape: LetterShape
}

/**
 * Grid resolution for occupancy work.
 *
 * Calibrated against the fixtures: at 24 and 32 the detector loses Playfair's
 * A, P and R, whose hairlines are thinner than a cell and let the counter leak
 * out to the background. At 48 all three faces agree on every letter tested;
 * 64 changes nothing and costs nearly twice as much.
 */
const GRID = 48

/** A run must be this much of the ink height to count as a stroke direction. */
const MIN_RUN_FRACTION = 0.12

const DIRECTION_BINS = 36
const BIN_DEGREES = 180 / DIRECTION_BINS

const cache = new Map<string, LetterForm>()
const CACHE_LIMIT = 512

const NEUTRAL: Omit<LetterForm, 'character'> = {
  measured: false,
  widthRatio: 0.72,
  aspect: 0.72,
  axisAngle: 90,
  axisStrength: 0,
  diagonalAngle: null,
  diagonalStrength: 0,
  straightness: 0.5,
  roundness: 0.5,
  counters: [],
  primaryCounter: null,
  symmetricVertical: true,
  contrast: 1,
  coverage: 0.5,
  shape: 'mixed',
}

function neutral(character: string): LetterForm {
  return { character, ...NEUTRAL }
}

/**
 * Dominant stroke directions, as a length-weighted histogram of long runs.
 *
 * The intuitive approach — PCA over the ink points — measures the elongation of
 * the point cloud, which is the letter's bounding proportion rather than its
 * stroke direction. Tested against the fixtures it returns roughly vertical for
 * H, I, E and N alike, and is unstable besides (Inter H reads 0 degrees,
 * Playfair N reads 142). Weighting actual straight runs by length measures what
 * a designer means by the letter's axis, and behaves: H and I land on 92.5 in
 * all three faces, X on 122.5, and a truly round O reports no runs at all.
 */
function dominantDirections(
  segments: Segment[],
  inkHeight: number,
): {
  axisAngle: number
  axisStrength: number
  diagonalAngle: number | null
  diagonalStrength: number
  straightness: number
} {
  const bins = new Array<number>(DIRECTION_BINS).fill(0)
  const minimumRun = MIN_RUN_FRACTION * inkHeight
  let runLength = 0
  let totalLength = 0

  for (const s of segments) {
    const dx = s.x2 - s.x1
    const dy = s.y2 - s.y1
    const length = Math.hypot(dx, dy)
    if (length === 0) continue
    totalLength += length
    if (length < minimumRun) continue

    // Negate dy so the angle reads y-up: 90 is vertical, 0 horizontal.
    let degrees = (Math.atan2(-dy, dx) * 180) / Math.PI
    degrees = ((degrees % 180) + 180) % 180
    bins[Math.min(DIRECTION_BINS - 1, Math.floor(degrees / BIN_DEGREES))] += length
    runLength += length
  }

  const straightness = totalLength === 0 ? 0 : runLength / totalLength
  if (runLength === 0) {
    return {
      axisAngle: 90,
      axisStrength: 0,
      diagonalAngle: null,
      diagonalStrength: 0,
      straightness: 0,
    }
  }

  const centre = (bin: number) => bin * BIN_DEGREES + BIN_DEGREES / 2
  const offAxis = (bin: number) => {
    const angle = centre(bin)
    return Math.abs(angle - 90) > 12 && angle > 12 && angle < 168
  }

  let axisBin = 0
  let diagonalBin = -1
  for (let bin = 0; bin < DIRECTION_BINS; bin++) {
    if (bins[bin] > bins[axisBin]) axisBin = bin
    if (offAxis(bin) && (diagonalBin === -1 || bins[bin] > bins[diagonalBin])) diagonalBin = bin
  }

  const diagonalShare = diagonalBin === -1 ? 0 : bins[diagonalBin] / runLength
  return {
    axisAngle: centre(axisBin),
    axisStrength: bins[axisBin] / runLength,
    diagonalAngle: diagonalShare >= 0.12 ? centre(diagonalBin) : null,
    diagonalStrength: diagonalShare,
    straightness,
  }
}

/**
 * Counters, found by sampling occupancy and flooding the background inward.
 *
 * Contour winding is the obvious approach and it does not work. Fonts draw
 * counters however they please: Inter's P encloses its counter as a keyhole
 * pinched shut inside one contour, and Inter's A, D and R use two contours of
 * the *same* winding, so a sign test finds no counter in any of them. Flooding
 * from the edge asks the question that actually matters — which empty space
 * cannot reach the outside — and agrees across all three fixtures.
 */
function measureCounters(segments: Segment[], ink: Box): Counter[] {
  const grid = occupancy(segments, ink, GRID, true)
  const found = countersOf(grid, Math.max(4, Math.round(0.004 * GRID * GRID)))

  return found.map((component) => ({
    box: component.box,
    slot: inscribedSquare(grid, component),
    areaShare: component.cells / (GRID * GRID),
  }))
}

/** Mirror the occupancy grid and score the overlap, ink cells only. */
function measureVerticalSymmetry(segments: Segment[], ink: Box): boolean {
  const { cells, size } = occupancy(segments, ink, GRID, true)
  let intersection = 0
  let union = 0

  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const here = cells[row * size + column]
      const mirrored = cells[row * size + (size - 1 - column)]
      if (here || mirrored) union++
      if (here && mirrored) intersection++
    }
  }

  // Intersection over union rather than raw agreement: counting matching empty
  // background never drops below about 0.45 and flattens the useful range.
  return union > 0 && intersection / union >= 0.9
}

/**
 * Stroke modulation, as the ratio of the thickest stroke to the thinnest.
 *
 * Measured on the letter itself: horizontal scanlines catch the vertical
 * strokes, vertical scanlines the horizontal ones. A grotesk holds one weight
 * throughout and lands near 1; a didone swings widely.
 */
function measureContrast(segments: Segment[], ink: Box): number {
  const width = ink.x2 - ink.x1
  const height = ink.y2 - ink.y1
  if (width <= 0 || height <= 0) return 1

  const widths: number[] = []
  for (const fraction of [0.35, 0.5, 0.65]) {
    for (const run of runWidthsAt(segments, ink.y1 + height * fraction)) {
      if (run > width * 0.01) widths.push(run)
    }
    for (const span of spansAtX(segments, ink.x1 + width * fraction)) {
      const run = span.x2 - span.x1
      if (run > height * 0.01) widths.push(run)
    }
  }
  if (widths.length < 2) return 1

  const min = Math.min(...widths)
  return min <= 0 ? 1 : Math.min(12, Math.max(...widths) / min)
}

function classify(form: Omit<LetterForm, 'shape'>): LetterShape {
  if (form.diagonalAngle !== null && form.diagonalStrength >= 0.25) return 'diagonal'
  if (form.straightness < 0.35) return 'round'
  if (form.straightness > 0.7 && form.roundness < 0.45) return 'straight'
  return 'mixed'
}

/**
 * Measure a letter in a given font. Returns a neutral profile for a character
 * the font cannot render, so callers never have to special-case it.
 */
export function measureLetterForm(font: LoadedFont, character: string): LetterForm {
  const letter = character.trim().slice(0, 1)
  if (!letter) return neutral('')

  const key = `${font.family}@${font.weight}:${letter}`
  const cached = cache.get(key)
  if (cached) return cached

  const measured = measure(font, letter)

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, measured)
  return measured
}

function measure(font: LoadedFont, letter: string): LetterForm {
  const glyph = font.font.charToGlyph(letter)
  if (!glyph || glyph.unicode === undefined) return neutral(letter)

  const segments = flattenGlyph(glyph, font.font.unitsPerEm)
  const ink = boundsOfSegments(segments)
  if (!ink || ink.x2 <= ink.x1 || ink.y2 <= ink.y1) return neutral(letter)

  const inkWidth = ink.x2 - ink.x1
  const inkHeight = ink.y2 - ink.y1
  // metrics.capHeight is in em; flattenGlyph works in font units.
  const capHeight = font.metrics.capHeight * font.font.unitsPerEm

  const directions = dominantDirections(segments, inkHeight)
  const found = measureCounters(segments, ink)

  const partial = {
    character: letter,
    measured: true,
    widthRatio: capHeight > 0 ? inkWidth / capHeight : 0.72,
    aspect: inkWidth / inkHeight,
    axisAngle: directions.axisAngle,
    axisStrength: directions.axisStrength,
    diagonalAngle: directions.diagonalAngle,
    diagonalStrength: directions.diagonalStrength,
    straightness: directions.straightness,
    roundness: 1 - directions.straightness,
    counters: found,
    primaryCounter: found.length > 0 ? found[0] : null,
    symmetricVertical: measureVerticalSymmetry(segments, ink),
    contrast: measureContrast(segments, ink),
    coverage: inkCoverage(occupancy(segments, ink, GRID, true)),
  }

  return { ...partial, shape: classify(partial) }
}

/**
 * Snap an angle to a step, so marks land on deliberate angles rather than
 * whatever a measurement happened to produce.
 */
export function quantizeAngle(angle: number, step = 7.5): number {
  return Math.round(angle / step) * step
}

/**
 * How far a mark should lean to agree with the letter, in degrees from
 * upright. Clamped: nothing in this system is ever upside down.
 */
export function leanFor(form: LetterForm, limit = 30): number {
  if (!form.measured) return 0
  const source = form.diagonalAngle !== null && form.diagonalStrength >= 0.2
    ? form.diagonalAngle
    : form.axisStrength >= 0.25
      ? form.axisAngle
      : 90
  // Angles are y-up with 90 upright; SVG turns the other way.
  return Math.max(-limit, Math.min(limit, quantizeAngle(90 - source)))
}

/** Test seam: measurements are cached for the life of the page. */
export function clearLetterFormCache(): void {
  cache.clear()
}
