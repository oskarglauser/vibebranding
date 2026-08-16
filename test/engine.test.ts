import { describe, expect, it } from 'vitest'
import { loadFixture } from './fixtures'
import { shapeText, shapeWordmark, transformPathData } from '../src/engine/shape'
import { layoutLogo, effectiveTracking, LAYOUT_RULES } from '../src/engine/layout'
import { renderSvg, safeColor } from '../src/engine/render'
import type { LogoSpec, SymbolArt } from '../src/engine/types'

const inter = loadFixture('Inter-600')
const playfair = loadFixture('PlayfairDisplay-700')
const bebas = loadFixture('BebasNeue-400')

const squareSymbol: SymbolArt = {
  // Deliberately drawn small and off-centre inside its unit box, to prove the
  // layout normalises on ink rather than trusting the authored box.
  content: '<rect x="0.2" y="0.3" width="0.4" height="0.4"/>',
  inkBox: { x1: 0.2, y1: 0.3, x2: 0.6, y2: 0.7 },
}

function makeSpec(overrides: Partial<LogoSpec> = {}): LogoSpec {
  return {
    brandName: 'Northwind',
    fontFamily: 'Inter',
    fontWeight: 600,
    tracking: 0,
    textCase: 'normal',
    trademark: 'none',
    tagline: '',
    taglineFontFamily: 'Inter',
    taglineFontWeight: 400,
    taglineTracking: 0,
    taglineCase: 'normal',
    taglineSize: 'md',
    symbol: null,
    symbolPlacement: 'none',
    symbolSize: 'md',
    colors: { wordmark: '#111827', tagline: '#111827', symbol: '#111827' },
    ...overrides,
  }
}

describe('metrics', () => {
  it('reads cap height and x-height from the font, not a guess', () => {
    expect(inter.metrics.capHeight).toBeCloseTo(1490 / 2048, 4)
    expect(inter.metrics.xHeight).toBeCloseTo(1118 / 2048, 4)
    // Bebas is an all-caps face: x-height equals cap height.
    expect(bebas.metrics.xHeight).toBeCloseTo(bebas.metrics.capHeight, 3)
  })

  it('derives a stem width that tracks weight', () => {
    // Playfair Bold has thicker stems than Inter SemiBold relative to cap height.
    const interRatio = inter.metrics.stemWidth / inter.metrics.capHeight
    const playfairRatio = playfair.metrics.stemWidth / playfair.metrics.capHeight
    expect(interRatio).toBeGreaterThan(0.08)
    expect(interRatio).toBeLessThan(0.25)
    expect(playfairRatio).toBeGreaterThan(interRatio)
  })
})

describe('kerning', () => {
  it('reads pairs from GPOS extension lookups that opentype.js cannot', () => {
    // opentype.js reports 0 for these: Inter hides its kern feature behind a
    // type 9 Extension lookup. Values are negative (letters pull together).
    const pair = (a: string, b: string) =>
      inter.kerning.get(inter.font.charToGlyph(a).index, inter.font.charToGlyph(b).index)

    expect(pair('A', 'V')).toBeLessThan(0)
    expect(pair('T', 'o')).toBeLessThan(0)
    expect(inter.font.getKerningValue(inter.font.charToGlyph('A'), inter.font.charToGlyph('V'))).toBe(0)
  })

  it('narrows a kerned pair relative to an unkerned one', () => {
    const kerned = shapeText(inter, 'AV').advanceWidth
    const wide = shapeText(inter, 'HH').advanceWidth
    expect(kerned).toBeLessThan(wide)
  })
})

describe('shapeText', () => {
  it('returns outlines, never text elements', () => {
    const shaped = shapeText(inter, 'Hi')
    expect(shaped.d.startsWith('M')).toBe(true)
    expect(shaped.d).not.toContain('<text')
  })

  it('applies tracking between letters only', () => {
    const tight = shapeText(inter, 'ABC', { tracking: 0 })
    const loose = shapeText(inter, 'ABC', { tracking: 0.1 })
    // Three letters, two gaps.
    expect(loose.advanceWidth - tight.advanceWidth).toBeCloseTo(0.2, 5)
  })

  it('is unaffected by tracking for a single glyph', () => {
    const a = shapeText(inter, 'A', { tracking: 0 })
    const b = shapeText(inter, 'A', { tracking: 0.5 })
    expect(b.advanceWidth).toBeCloseTo(a.advanceWidth, 6)
  })

  it('uppercases when asked', () => {
    expect(shapeText(inter, 'abc', { textCase: 'uppercase' }).d).toBe(shapeText(inter, 'ABC').d)
  })

  it('handles empty and whitespace-only input', () => {
    expect(shapeText(inter, '').d).toBe('')
    expect(shapeText(inter, '').advanceWidth).toBe(0)
  })
})

describe('trademark placement', () => {
  const cap = inter.metrics.capHeight

  it('hangs ® from the cap line and never above it', () => {
    // A lowercase name tops out at x-height, so any ink at the cap line must be
    // the mark itself — which is what makes this discriminating.
    const plain = shapeWordmark(inter, 'acme')
    const marked = shapeWordmark(inter, 'acme', { trademark: 'r' })

    expect(plain.inkBox.y1).toBeGreaterThan(-cap) // x-height only
    expect(marked.inkBox.y1).toBeCloseTo(-cap, 3) // mark reaches the cap line
    expect(marked.inkBox.x2).toBeGreaterThan(plain.inkBox.x2)
  })

  it('sits © on the baseline instead of superscripting it', () => {
    const plain = shapeWordmark(inter, 'acme')
    const copyright = shapeWordmark(inter, 'acme', { trademark: 'c' })

    // © is a full circular glyph, not a superscript form: it must not be
    // lifted to the cap line the way ® and ™ are.
    expect(copyright.inkBox.y1).toBeCloseTo(plain.inkBox.y1, 3)
    expect(copyright.inkBox.y1).toBeGreaterThan(-cap * 0.9)
    expect(copyright.inkBox.x2).toBeGreaterThan(plain.inkBox.x2)
  })

  it('keeps the mark small relative to the wordmark', () => {
    const marked = shapeWordmark(inter, 'ACME', { trademark: 'tm' })
    const plain = shapeWordmark(inter, 'ACME')
    const markWidth = marked.inkBox.x2 - plain.inkBox.x2
    // A ™ that is a third of a cap height wide reads as a mark, not a letter.
    expect(markWidth).toBeGreaterThan(0)
    expect(markWidth).toBeLessThan(cap)
  })

  it('leaves the wordmark untouched when set to none', () => {
    expect(shapeWordmark(inter, 'Acme', { trademark: 'none' }).d).toBe(shapeText(inter, 'Acme').d)
  })
})

describe('transformPathData', () => {
  it('scales and translates absolute commands', () => {
    expect(transformPathData('M0 0L10 20', 2, 5, 1)).toBe('M5 1L25 41')
  })

  it('treats H and V as single-axis commands', () => {
    expect(transformPathData('M0 0H10V20', 2, 5, 1)).toBe('M5 1H25V41')
  })

  it('leaves arc radii and flags alone while moving the endpoint', () => {
    expect(transformPathData('M0 0A5 5 0 0 1 10 10', 2, 0, 0)).toBe('M0 0A10 10 0 0 1 20 20')
  })

  it('does not translate relative commands', () => {
    expect(transformPathData('m0 0l10 10', 2, 100, 100)).toBe('m0 0l20 20')
  })
})

describe('layout', () => {
  it('places a left symbol centred on the cap band, ignoring descenders', () => {
    const withDescender = layoutLogo({
      spec: makeSpec({ brandName: 'Agency', symbol: squareSymbol, symbolPlacement: 'left' }),
      wordmarkFont: inter,
      taglineFont: null,
    })
    const withoutDescender = layoutLogo({
      spec: makeSpec({ brandName: 'Acme', symbol: squareSymbol, symbolPlacement: 'left' }),
      wordmarkFont: inter,
      taglineFont: null,
    })

    const symbolOf = (layout: typeof withDescender) =>
      layout.pieces.find((piece) => piece.kind === 'symbol')!
    expect(symbolOf(withDescender).transform).toBe(symbolOf(withoutDescender).transform)
  })

  it('sizes the symbol from cap height, so it matches across fonts', () => {
    const build = (font: typeof inter) =>
      layoutLogo({
        spec: makeSpec({ symbol: squareSymbol, symbolPlacement: 'left', symbolSize: 'md' }),
        wordmarkFont: font,
        taglineFont: null,
      })

    for (const font of [inter, playfair, bebas]) {
      const layout = build(font)
      const symbol = layout.pieces.find((piece) => piece.kind === 'symbol')!
      const scale = Number(/scale\(([-\d.]+)\)/.exec(symbol.transform)![1])
      // Authored ink is 0.4 units tall; rendered height must equal 1.25 caps.
      const renderedHeight = 0.4 * scale
      expect(renderedHeight).toBeCloseTo(font.metrics.capHeight * LAYOUT_RULES.symbolHeight.md, 4)
    }
  })

  it('normalises symbols on ink, not on their authored box', () => {
    const tiny: SymbolArt = {
      content: '<rect x="0.45" y="0.45" width="0.1" height="0.1"/>',
      inkBox: { x1: 0.45, y1: 0.45, x2: 0.55, y2: 0.55 },
    }
    const big = layoutLogo({
      spec: makeSpec({ symbol: squareSymbol, symbolPlacement: 'left' }),
      wordmarkFont: inter,
      taglineFont: null,
    })
    const small = layoutLogo({
      spec: makeSpec({ symbol: tiny, symbolPlacement: 'left' }),
      wordmarkFont: inter,
      taglineFont: null,
    })
    // Different authored sizes, identical rendered ink height.
    const height = (layout: typeof big) => layout.inkBox.y2 - layout.inkBox.y1
    expect(height(big)).toBeCloseTo(height(small), 6)
  })

  it('keeps the tagline gap proportional to cap height across fonts', () => {
    for (const font of [inter, playfair]) {
      const layout = layoutLogo({
        spec: makeSpec({ tagline: 'Design & Strategy' }),
        wordmarkFont: font,
        taglineFont: font,
      })
      expect(layout.pieces).toHaveLength(2)
      expect(layout.capHeight).toBeCloseTo(font.metrics.capHeight, 6)
    }
  })

  it('adds tracking automatically for uppercase and taglines', () => {
    expect(effectiveTracking(0, { uppercase: true, isTagline: false })).toBeGreaterThan(0)
    expect(effectiveTracking(0, { uppercase: false, isTagline: true })).toBeGreaterThan(0)
    expect(effectiveTracking(0, { uppercase: false, isTagline: false })).toBe(0)
  })

  it('produces an empty but valid layout for an empty name', () => {
    const layout = layoutLogo({ spec: makeSpec({ brandName: '' }), wordmarkFont: inter, taglineFont: null })
    expect(layout.pieces).toHaveLength(0)
    expect(Number.isFinite(layout.inkBox.x1)).toBe(true)
  })
})

describe('renderSvg', () => {
  it('emits outlines and no text elements', () => {
    const layout = layoutLogo({
      spec: makeSpec({ tagline: 'Studio', symbol: squareSymbol, symbolPlacement: 'left' }),
      wordmarkFont: inter,
      taglineFont: inter,
    })
    const { svg } = renderSvg(layout)
    expect(svg).toContain('<path')
    expect(svg).not.toContain('<text')
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('paints backgrounds as a rect so design tools keep them', () => {
    const layout = layoutLogo({ spec: makeSpec(), wordmarkFont: inter, taglineFont: null })
    const { svg } = renderSvg(layout, { background: 'light' })
    expect(svg).toContain('<rect')
    expect(svg).not.toContain('background-color')
  })

  it('keeps the viewBox aspect ratio in the width/height attributes', () => {
    const layout = layoutLogo({ spec: makeSpec(), wordmarkFont: inter, taglineFont: null })
    const { svg, width, height } = renderSvg(layout, { targetWidth: 800 })
    const [, , viewWidth, viewHeight] = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/
      .exec(svg)!
      .slice(1)
      .map(Number)
    expect(width).toBe(800)
    expect(height / width).toBeCloseTo(viewHeight / viewWidth, 2)
  })

  it('produces a square canvas when asked', () => {
    const layout = layoutLogo({
      spec: makeSpec({ symbol: squareSymbol, symbolPlacement: 'left' }),
      wordmarkFont: inter,
      taglineFont: null,
    })
    const { width, height } = renderSvg(layout, { square: true, targetWidth: 512 })
    expect(width).toBe(height)
  })

  it('refuses colours that are not plain hex', () => {
    expect(safeColor('#fff')).toBe('#fff')
    expect(safeColor('"><script>alert(1)</script>')).toBe('#000000')
    const layout = layoutLogo({
      spec: makeSpec({ colors: { wordmark: '" onload="x', tagline: '#000', symbol: '#000' } }),
      wordmarkFont: inter,
      taglineFont: null,
    })
    expect(renderSvg(layout).svg).not.toContain('onload')
  })

  it('escapes the title', () => {
    const layout = layoutLogo({ spec: makeSpec(), wordmarkFont: inter, taglineFont: null })
    const { svg } = renderSvg(layout, { title: '<script>' })
    expect(svg).toContain('&lt;script&gt;')
    expect(svg).not.toContain('<script>')
  })
})
