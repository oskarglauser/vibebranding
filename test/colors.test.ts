import { describe, expect, it } from 'vitest'
import {
  assessContrast,
  contrastRatio,
  formatCmyk,
  hexToCmyk,
  normalizeHex,
  readableInk,
  relativeLuminance,
  reversedVariant,
  saturation,
} from '../src/utils/colorUtils'
import { BRAND_COLORS } from '../src/state/presets'

const DARK = '#0b0d12'
const LIGHT = '#ffffff'

describe('hex handling', () => {
  it('normalises shorthand and missing hashes', () => {
    expect(normalizeHex('f00')).toBe('#ff0000')
    expect(normalizeHex('#ABCDEF')).toBe('#abcdef')
    expect(normalizeHex('nonsense')).toBe('#000000')
    expect(normalizeHex('nonsense', '#123456')).toBe('#123456')
  })
})

describe('contrast', () => {
  it('uses WCAG relative luminance, not YIQ luma', () => {
    // The two differ most on saturated green: YIQ over-weights it and would
    // call this light, WCAG resolves it correctly against both extremes.
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 3)
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 3)
  })

  it('picks readable ink for a background', () => {
    expect(readableInk('#ffffff')).toBe('#000000')
    expect(readableInk('#0b0d12')).toBe('#ffffff')
  })

  it('reports the graphics threshold separately from the text one', () => {
    const verdict = assessContrast('#767676', LIGHT)
    expect(verdict.passesGraphics).toBe(true)
    expect(verdict.passesText).toBe(true)
    const weak = assessContrast('#a0a0a0', LIGHT)
    expect(weak.passesText).toBe(false)
  })
})

describe('reversed variants', () => {
  it('turns an ink logo white rather than grey', () => {
    // Lifting a near-black only far enough to clear 4.5:1 gives a washed-out
    // grey; a black logo reversed is white.
    expect(reversedVariant('#111827', DARK)).toBe('#ffffff')
    expect(reversedVariant('#000000', DARK)).toBe('#ffffff')
  })

  it('keeps the hue of a saturated colour', () => {
    const reversed = reversedVariant('#1d4ed8', DARK)
    expect(reversed).not.toBe('#ffffff')
    expect(saturation(reversed)).toBeGreaterThan(0.3)
  })

  it('leaves colours that already carry alone', () => {
    expect(reversedVariant('#fbbf24', DARK)).toBe('#fbbf24')
  })

  it('produces a usable reverse for every curated brand colour', () => {
    for (const { hex, name } of BRAND_COLORS) {
      const reversed = reversedVariant(hex, DARK)
      expect(contrastRatio(reversed, DARK), `${name} reversed`).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(hex, LIGHT), `${name} on light`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('cmyk', () => {
  it('specifies neutrals as pure K instead of a four-colour build', () => {
    expect(hexToCmyk('#000000')).toEqual({ c: 0, m: 0, y: 0, k: 100 })
    expect(hexToCmyk('#1a1a1a')).toEqual({ c: 0, m: 0, y: 0, k: 100 })
    // A blue-black ink: the raw algebra gives C56 M38 Y0 K85, which prints
    // muddy and needs perfect registration. It is black.
    expect(hexToCmyk('#111827')).toEqual({ c: 0, m: 0, y: 0, k: 100 })
  })

  it('keeps mid greys as a tint of K rather than snapping to solid', () => {
    const grey = hexToCmyk('#808080')
    expect(grey).toMatchObject({ c: 0, m: 0, y: 0 })
    expect(grey.k).toBeGreaterThan(40)
    expect(grey.k).toBeLessThan(60)
  })

  it('keeps chroma for coloured inks', () => {
    const blue = hexToCmyk('#1d4ed8')
    expect(blue.c).toBeGreaterThan(50)
    expect(formatCmyk(blue)).toMatch(/^C\d+ M\d+ Y\d+ K\d+$/)
  })
})
