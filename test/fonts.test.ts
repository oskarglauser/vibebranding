import { describe, expect, it } from 'vitest'
import {
  CATEGORY_ORDER,
  FONT_CATALOG,
  defaultTaglineFont,
  getFont,
  nearestWeight,
  taglineFontsFor,
} from '../src/constants/fonts'

describe('font catalogue', () => {
  it('has no duplicate families', () => {
    const families = FONT_CATALOG.map((entry) => entry.family)
    expect(new Set(families).size).toBe(families.length)
  })

  it('only offers default weights the family actually ships', () => {
    for (const entry of FONT_CATALOG) {
      expect(entry.weights.length).toBeGreaterThan(0)
      expect(entry.weights).toContain(entry.defaultWeight)
      expect([...entry.weights].sort((a, b) => a - b)).toEqual(entry.weights)
    }
  })

  it('uses known categories', () => {
    for (const entry of FONT_CATALOG) expect(CATEGORY_ORDER).toContain(entry.category)
  })

  it('pairs every family with faces that exist and work small', () => {
    const known = new Set(FONT_CATALOG.map((entry) => entry.family))
    for (const entry of FONT_CATALOG) {
      expect(entry.pairsWith.length).toBeGreaterThan(0)
      for (const partner of entry.pairsWith) {
        expect(known.has(partner)).toBe(true)
        expect(getFont(partner).taglineOk).toBe(true)
      }
    }
  })

  it('keeps display faces out of tagline slots', () => {
    // A tagline set in Archivo Black or Bebas Neue at a third of logo size is
    // unreadable; the picker must never default to one.
    for (const family of ['Archivo Black', 'Bebas Neue', 'Anton', 'Cal Sans']) {
      expect(getFont(family).taglineOk).toBe(false)
      expect(taglineFontsFor(family)).not.toContain(family)
      expect(getFont(defaultTaglineFont(family)).taglineOk).toBe(true)
    }
  })

  it('clamps requested weights to available ones', () => {
    expect(nearestWeight('Bebas Neue', 900)).toBe(400)
    expect(nearestWeight('Lato', 500)).toBe(400)
    expect(nearestWeight('Inter', 600)).toBe(600)
    expect(nearestWeight('Unknown Family', 600)).toBe(600)
  })

  it('applies tighter tracking to display faces than to condensed ones', () => {
    // Condensed faces are already tight; tightening them further closes counters.
    expect(getFont('Bebas Neue').defaultTracking).toBeGreaterThan(getFont('Inter').defaultTracking)
  })
})
