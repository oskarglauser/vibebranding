import { describe, expect, it } from 'vitest'

import { buildMark } from '../src/engine/symbols/compose'
import { TEMPLATES, templateById } from '../src/engine/symbols/templates'
import { pathBounds } from '../src/engine/pathGeometry'
import { inkComponents, inkCoverage, occupancy, thinnestRun } from '../src/engine/outline'
import type { SymbolArt } from '../src/engine/types'
import { loadFixture } from './fixtures'

const fonts = [
  ['Inter', loadFixture('Inter-600')],
  ['Playfair', loadFixture('PlayfairDisplay-700')],
  ['Bebas', loadFixture('BebasNeue-400')],
] as const

/** Letters chosen to span the measured space, not the alphabet. */
const LETTERS = ['A', 'H', 'I', 'O', 'S', 'W', 'B', 'Q'] as const

type Case = {
  label: string
  art: SymbolArt
  template: (typeof TEMPLATES)[number]
}

/** Every template, variant, font and letter that produces a mark. */
const cases: Case[] = []
for (const template of TEMPLATES) {
  for (const [fontName, font] of fonts) {
    for (const letter of LETTERS) {
      for (let variant = 0; variant < template.variants; variant++) {
        const art = buildMark(template, {
          font,
          initial: letter,
          initials: [letter, 'S'],
          seed: `case-${letter}`,
          variant,
        })
        if (art) {
          cases.push({ label: `${template.id} v${variant} ${fontName} ${letter}`, art, template })
        }
      }
    }
  }
}

/** Flatten a mark's paths and measure what it actually draws. */
function artBounds(art: SymbolArt) {
  const datas = [...art.content.matchAll(/d="([^"]*)"/g)].map((match) => match[1])
  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity
  for (const d of datas) {
    const box = pathBounds(d)
    if (!box) continue
    x1 = Math.min(x1, box.x1)
    y1 = Math.min(y1, box.y1)
    x2 = Math.max(x2, box.x2)
    y2 = Math.max(y2, box.y2)
  }
  return Number.isFinite(x1) ? { x1, y1, x2, y2 } : null
}

/**
 * Rasterise a mark the way the layout will: normalised on its ink.
 *
 * Fill rule matters here. A knockout is one path under even-odd, so sampling it
 * with the nonzero rule reports a solid tile and the letter cut out of it
 * disappears — which reads as 99% ink coverage for a mark that is plainly not.
 */
function gridFor(art: SymbolArt, size: number) {
  const paths = [...art.content.matchAll(/<path d="([^"]*)"([^>]*)>/g)]
  const evenodd = paths.some((match) => match[2].includes('evenodd'))
  const datas = paths.map((match) => match[1])
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  const STEPS = 12

  for (const d of datas) {
    // Reuse the sampling parser by walking its flattened output.
    const tokens = d.match(/[MLCQZmlcqz]|-?\d*\.?\d+(?:e[+-]?\d+)?/g) ?? []
    let index = 0
    let command = 'M'
    let x = 0
    let y = 0
    let startX = 0
    let startY = 0
    const push = (nx: number, ny: number) => {
      if (x !== nx || y !== ny) segments.push({ x1: x, y1: y, x2: nx, y2: ny })
      x = nx
      y = ny
    }
    while (index < tokens.length) {
      const token = tokens[index]
      if (/[MLCQZmlcqz]/.test(token)) {
        command = token
        index++
        if (command.toUpperCase() === 'Z') {
          push(startX, startY)
          continue
        }
      }
      const upper = command.toUpperCase()
      const arity = upper === 'C' ? 6 : upper === 'Q' ? 4 : 2
      const args: number[] = []
      for (let i = 0; i < arity && index < tokens.length; i++) args.push(Number(tokens[index++]))
      if (args.length < arity) break
      if (upper === 'M') {
        x = args[0]
        y = args[1]
        startX = x
        startY = y
        command = 'L'
      } else if (upper === 'L') {
        push(args[0], args[1])
      } else if (upper === 'C') {
        const [x0, y0] = [x, y]
        for (let i = 1; i <= STEPS; i++) {
          const t = i / STEPS
          const u = 1 - t
          push(
            u * u * u * x0 + 3 * u * u * t * args[0] + 3 * u * t * t * args[2] + t * t * t * args[4],
            u * u * u * y0 + 3 * u * u * t * args[1] + 3 * u * t * t * args[3] + t * t * t * args[5],
          )
        }
      } else if (upper === 'Q') {
        const [x0, y0] = [x, y]
        for (let i = 1; i <= STEPS; i++) {
          const t = i / STEPS
          const u = 1 - t
          push(
            u * u * x0 + 2 * u * t * args[0] + t * t * args[2],
            u * u * y0 + 2 * u * t * args[1] + t * t * args[3],
          )
        }
      }
    }
  }

  const box = artBounds(art)
  if (!box) return null
  return occupancy(segments, box, size, false, evenodd ? 'evenodd' : 'nonzero')
}

describe('template library', () => {
  it('has cases to check', () => {
    expect(cases.length).toBeGreaterThan(0)
  })

  it('stays inside the unit box', () => {
    // Not enforced before, and the old archetypes broke it badly: `arc` drew
    // out to x = 1.5. Layout normalises on reported ink, so an oversized mark
    // is silently scaled down and its stroke lands too light next to the
    // wordmark. Templates have to stay where they say they are.
    for (const { label, art } of cases) {
      const box = artBounds(art)
      expect(box, label).not.toBeNull()
      if (!box) continue
      expect(box.x1, `${label} left`).toBeGreaterThanOrEqual(-0.002)
      expect(box.y1, `${label} top`).toBeGreaterThanOrEqual(-0.002)
      expect(box.x2, `${label} right`).toBeLessThanOrEqual(1.002)
      expect(box.y2, `${label} bottom`).toBeLessThanOrEqual(1.002)
    }
  })

  it('reports an ink box that matches what it draws', () => {
    for (const { label, art } of cases) {
      const box = artBounds(art)
      if (!box) continue
      expect(art.inkBox.x1, `${label} x1`).toBeCloseTo(box.x1, 2)
      expect(art.inkBox.y1, `${label} y1`).toBeCloseTo(box.y1, 2)
      expect(art.inkBox.x2, `${label} x2`).toBeCloseTo(box.x2, 2)
      expect(art.inkBox.y2, `${label} y2`).toBeCloseTo(box.y2, 2)
    }
  })

  it('carries enough ink to read, and not so much it becomes a blob', () => {
    for (const { label, art } of cases) {
      const grid = gridFor(art, 64)
      if (!grid) continue
      const coverage = inkCoverage(grid)
      expect(coverage, `${label} coverage`).toBeGreaterThan(0.1)
      expect(coverage, `${label} coverage`).toBeLessThan(0.92)
    }
  })

  it('survives the sizes it claims to', () => {
    for (const { label, art, template } of cases) {
      const grid = gridFor(art, template.minSize)
      if (!grid) continue
      // Nothing thinner than a pixel at the smallest size it promises.
      expect(thinnestRun(grid) * template.minSize, `${label} @${template.minSize}px`)
        .toBeGreaterThanOrEqual(0.9)
      // And it must still be there at all.
      expect(inkComponents(grid).length, `${label} components`).toBeGreaterThan(0)
    }
  })

  it('keeps a sane aspect so lockups stay balanced', () => {
    for (const { label, art } of cases) {
      const width = art.inkBox.x2 - art.inkBox.x1
      const height = art.inkBox.y2 - art.inkBox.y1
      expect(width / height, `${label} aspect`).toBeGreaterThan(0.4)
      expect(width / height, `${label} aspect`).toBeLessThan(2.5)
    }
  })

  it('never bakes in a colour, so the renderer can tint it', () => {
    for (const { label, art } of cases) {
      // fill-rule and fill-opacity are legal; a literal fill is not.
      expect(art.content, label).not.toMatch(/\bfill\s*=/)
      expect(art.content, label).not.toMatch(/\bstroke\s*=/)
      expect(art.content, label).not.toMatch(/\bstyle\s*=/)
    }
  })

  it('never ships live text', () => {
    // An SVG loaded through an <img> cannot see page webfonts, so a <text>
    // element rasterises in Times New Roman.
    for (const { label, art } of cases) {
      expect(art.content, label).not.toContain('<text')
      expect(art.content, label).not.toContain('<tspan')
    }
  })

  it('is deterministic', () => {
    for (const template of TEMPLATES) {
      for (const [, font] of fonts) {
        const once = buildMark(template, { font, initial: 'N', initials: ['N', 'S'], seed: 'fixed' })
        const twice = buildMark(template, { font, initial: 'N', initials: ['N', 'S'], seed: 'fixed' })
        expect(twice?.content, template.id).toBe(once?.content)
      }
    }
  })

  it('draws every authored variant differently', () => {
    // Catches a variant that was declared but never actually varies.
    const font = fonts[0][1]
    for (const template of TEMPLATES) {
      if (template.variants < 2) continue
      const drawn = new Set<string>()
      for (let variant = 0; variant < template.variants; variant++) {
        const art = buildMark(template, {
          font,
          initial: 'R',
          initials: ['R', 'S'],
          seed: 'variants',
          variant,
        })
        if (art) drawn.add(art.content)
      }
      expect(drawn.size, `${template.id} variants`).toBe(template.variants)
    }
  })

  it('cuts letters out rather than painting over them', () => {
    const font = fonts[0][1]
    for (const template of TEMPLATES) {
      if (template.letterRole !== 'carved') continue
      const art = buildMark(template, { font, initial: 'R', initials: ['R', 'S'], seed: 'carve' })
      expect(art?.content, template.id).toContain('fill-rule="evenodd"')
    }
  })

  it('declines rather than inventing a letter it does not have', () => {
    const font = fonts[0][1]
    for (const template of TEMPLATES) {
      if (template.letterRole === 'none') continue
      expect(buildMark(template, { font, initial: '', seed: 'x' }), template.id).toBeNull()
    }
  })

  it('registers every template exactly once, and finds them by id', () => {
    const ids = TEMPLATES.map((template) => template.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(templateById(id)?.id).toBe(id)
    expect(templateById('no-such-template')).toBeNull()
  })

  it('gives every template a usable id', () => {
    for (const template of TEMPLATES) {
      expect(template.id, template.label).toMatch(/^[a-z0-9-]{3,32}$/)
    }
  })
})
