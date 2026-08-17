import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearLetterFormCache,
  leanFor,
  measureLetterForm,
} from '../src/engine/symbols/letterform'
import { loadFixture } from './fixtures'

const inter = loadFixture('Inter-600')
const playfair = loadFixture('PlayfairDisplay-700')
const bebas = loadFixture('BebasNeue-400')
const fonts = [
  ['Inter', inter],
  ['Playfair', playfair],
  ['Bebas', bebas],
] as const

beforeEach(() => {
  clearLetterFormCache()
})

describe('counters', () => {
  // Counter detection by contour winding fails on real fonts: Inter draws P's
  // counter as a keyhole inside one contour, and A, D and R as two contours of
  // the same winding. These cases are the reason the detector floods occupancy
  // from the edge instead, so they are worth pinning per font.
  const expected: Record<string, number> = {
    A: 1, B: 2, D: 1, O: 1, P: 1, R: 1, Q: 1,
    G: 0, N: 0, H: 0, E: 0, I: 0, T: 0, V: 0,
  }

  for (const [name, font] of fonts) {
    it(`finds the right number in ${name}`, () => {
      for (const [letter, count] of Object.entries(expected)) {
        expect(measureLetterForm(font, letter).counters.length, `${name} ${letter}`).toBe(count)
      }
    })
  }

  it('places a slot inside the counter it belongs to', () => {
    const o = measureLetterForm(inter, 'O')
    const counter = o.primaryCounter
    expect(counter).not.toBeNull()
    if (!counter) return
    expect(counter.slot.size).toBeGreaterThan(0.1)
    expect(counter.slot.cx).toBeGreaterThan(counter.box.x1)
    expect(counter.slot.cx).toBeLessThan(counter.box.x2)
    expect(counter.slot.cy).toBeGreaterThan(counter.box.y1)
    expect(counter.slot.cy).toBeLessThan(counter.box.y2)
  })

  it('reports the larger counter of a B first', () => {
    const b = measureLetterForm(inter, 'B')
    expect(b.counters.length).toBe(2)
    expect(b.counters[0].areaShare).toBeGreaterThanOrEqual(b.counters[1].areaShare)
  })
})

describe('stroke direction', () => {
  it('reads upright letters as vertical in every face', () => {
    for (const [name, font] of fonts) {
      for (const letter of ['H', 'I']) {
        const form = measureLetterForm(font, letter)
        expect(Math.abs(form.axisAngle - 90), `${name} ${letter}`).toBeLessThanOrEqual(10)
        expect(form.axisStrength).toBeGreaterThan(0.3)
      }
    }
  })

  it('finds a diagonal in X and V', () => {
    for (const letter of ['X', 'V']) {
      const form = measureLetterForm(inter, letter)
      expect(form.diagonalAngle, `Inter ${letter}`).not.toBeNull()
      expect(form.diagonalStrength).toBeGreaterThan(0.15)
    }
  })

  it('reports no straight runs for a truly round O', () => {
    // Inter's O is drawn entirely in curves, so there is no stroke direction to
    // find. A mark fitted to it must not pretend otherwise.
    expect(measureLetterForm(inter, 'O').axisStrength).toBe(0)
  })

  it('sees that a condensed O has straight sides', () => {
    // Bebas draws O as a rounded rectangle, so the same letter is genuinely
    // flat-sided here and round in Inter. A hardcoded letter set cannot say so.
    const bebasO = measureLetterForm(bebas, 'O')
    const interO = measureLetterForm(inter, 'O')
    expect(bebasO.straightness).toBeGreaterThan(interO.straightness)
  })

  it('leans the same letter differently across faces', () => {
    // The point of measuring rather than classifying: A is more diagonal in
    // Playfair than in a condensed face, and the mark should follow.
    const leans = fonts.map(([, font]) => Math.abs(leanFor(measureLetterForm(font, 'A'))))
    expect(new Set(leans).size).toBeGreaterThan(1)
  })

  it('never leans past the limit', () => {
    for (const [, font] of fonts) {
      for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        expect(Math.abs(leanFor(measureLetterForm(font, letter)))).toBeLessThanOrEqual(30)
      }
    }
  })
})

describe('proportion and weight', () => {
  it('measures a condensed face as narrower than a serif', () => {
    expect(measureLetterForm(bebas, 'H').widthRatio).toBeLessThan(
      measureLetterForm(inter, 'H').widthRatio,
    )
    expect(measureLetterForm(inter, 'H').widthRatio).toBeLessThan(
      measureLetterForm(playfair, 'H').widthRatio,
    )
  })

  it('separates a didone from a grotesk by stroke contrast', () => {
    const playfairContrast = measureLetterForm(playfair, 'O').contrast
    const interContrast = measureLetterForm(inter, 'O').contrast
    expect(playfairContrast).toBeGreaterThan(2.5)
    expect(interContrast).toBeLessThan(1.6)
    expect(playfairContrast).toBeGreaterThan(interContrast)
  })

  it('sees vertical symmetry where it exists and not where it does not', () => {
    for (const letter of ['H', 'I', 'O', 'A', 'T', 'X']) {
      expect(measureLetterForm(inter, letter).symmetricVertical, letter).toBe(true)
    }
    for (const letter of ['F', 'L', 'P', 'R']) {
      expect(measureLetterForm(inter, letter).symmetricVertical, letter).toBe(false)
    }
  })
})

describe('robustness', () => {
  it('returns a neutral profile for an unrenderable character', () => {
    const form = measureLetterForm(inter, '中')
    expect(form.measured).toBe(false)
    expect(form.counters).toEqual([])
  })

  it('returns a neutral profile for empty input', () => {
    expect(measureLetterForm(inter, '  ').measured).toBe(false)
  })

  it('keeps every field finite and in range for the whole alphabet', () => {
    for (const [name, font] of fonts) {
      for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        const form = measureLetterForm(font, letter)
        const where = `${name} ${letter}`
        expect(Number.isFinite(form.widthRatio), where).toBe(true)
        expect(Number.isFinite(form.aspect), where).toBe(true)
        expect(form.axisAngle, where).toBeGreaterThanOrEqual(0)
        expect(form.axisAngle, where).toBeLessThan(180)
        expect(form.straightness, where).toBeGreaterThanOrEqual(0)
        expect(form.straightness, where).toBeLessThanOrEqual(1)
        expect(form.coverage, where).toBeGreaterThan(0)
        expect(form.coverage, where).toBeLessThanOrEqual(1)
        for (const counter of form.counters) {
          expect(counter.box.x1, where).toBeGreaterThanOrEqual(0)
          expect(counter.box.y1, where).toBeGreaterThanOrEqual(0)
          expect(counter.box.x2, where).toBeLessThanOrEqual(1)
          expect(counter.box.y2, where).toBeLessThanOrEqual(1)
          expect(counter.slot.size, where).toBeGreaterThan(0)
        }
      }
    }
  })

  it('caches by font and letter without crossing the streams', () => {
    const a = measureLetterForm(inter, 'N')
    const b = measureLetterForm(inter, 'N')
    expect(b).toBe(a)
    expect(measureLetterForm(bebas, 'N')).not.toBe(a)
  })
})
