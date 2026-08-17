import { describe, expect, it } from 'vitest'
import { loadFixture } from './fixtures'
import {
  ARCHETYPES,
  availableArchetypes,
  buildCandidates,
  buildSymbol,
  classifyLetter,
  initialsFor,
  strokeFor,
} from '../src/engine/symbols/archetypes'

const inter = loadFixture('Inter-600')
const playfair = loadFixture('PlayfairDisplay-700')
const context = (overrides: Partial<Parameters<typeof buildSymbol>[1]> = {}) => ({
  font: inter,
  initial: 'N',
  initials: ['N', 'S'],
  seed: 'test-seed',
  ...overrides,
})

describe('letter classification', () => {
  it('groups capitals by their dominant construction', () => {
    expect(classifyLetter('O')).toBe('round')
    expect(classifyLetter('c')).toBe('round')
    expect(classifyLetter('I')).toBe('straight')
    expect(classifyLetter('N')).toBe('diagonal')
    expect(classifyLetter('B')).toBe('mixed')
  })
})

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsFor('Northwind Studio')).toEqual(['N', 'S'])
    expect(initialsFor('Acme')).toEqual(['A'])
    expect(initialsFor('Black & White Co')).toEqual(['B', 'W'])
    expect(initialsFor('  ')).toEqual([])
  })
})

describe('archetype selection', () => {
  it('offers letter marks only when there is a letter', () => {
    const withoutLetter = availableArchetypes({ initial: '' })
    for (const id of withoutLetter) {
      expect(ARCHETYPES.find((entry) => entry.id === id)!.usesLetter).toBe(false)
    }
  })

  it('offers interlocked initials only for a two-word name', () => {
    expect(availableArchetypes({ initial: 'N', initials: ['N'] })).not.toContain('monogram-duo')
    expect(availableArchetypes({ initial: 'N', initials: ['N', 'S'] })).toContain('monogram-duo')
  })

  it('ranks a ring below other devices for an already-round letter', () => {
    // A circle around an O is redundant; around an N it is a real device.
    const forRound = availableArchetypes({ initial: 'O' })
    const forDiagonal = availableArchetypes({ initial: 'N' })
    expect(forRound.indexOf('monogram-circle')).toBeGreaterThan(
      forDiagonal.indexOf('monogram-circle'),
    )
    // Still available, just not led with.
    expect(forRound).toContain('monogram-circle')
  })

  it('ranks brackets below other devices for a diagonal letter', () => {
    expect(availableArchetypes({ initial: 'N' }).indexOf('monogram-bracket')).toBeGreaterThan(
      availableArchetypes({ initial: 'I' }).indexOf('monogram-bracket'),
    )
  })
})

describe('symbol construction', () => {
  it('builds every archetype without throwing', () => {
    for (const entry of ARCHETYPES) {
      const art = buildSymbol(entry.id, context())
      expect(art, entry.id).not.toBeNull()
      expect(art!.content, entry.id).toContain('<path')
      expect(art!.content, entry.id).not.toContain('<text')
    }
  })

  it('reports an ink box with real extent', () => {
    for (const entry of ARCHETYPES) {
      const art = buildSymbol(entry.id, context())!
      expect(art.inkBox.x2 - art.inkBox.x1, entry.id).toBeGreaterThan(0.05)
      expect(art.inkBox.y2 - art.inkBox.y1, entry.id).toBeGreaterThan(0.05)
    }
  })

  it('returns null for a two-letter mark when there is only one initial', () => {
    expect(buildSymbol('monogram-duo', context({ initials: ['N'] }))).toBeNull()
  })

  it('is deterministic for the same seed', () => {
    const first = buildSymbol('monogram-knockout', context())!
    const same = buildSymbol('monogram-knockout', context())!
    expect(first.content).toBe(same.content)
  })

  it('lets the seed reach the geometry', () => {
    // Not "any two seeds differ": an archetype has only a handful of authored
    // variants, so a given pair collides regularly and that is by design. What
    // must hold is that varying the seed varies the output at all.
    const outputs = new Set(
      Array.from(
        { length: 24 },
        (_, i) => buildSymbol('monogram-knockout', context({ seed: `seed-${i}` }))?.content,
      ),
    )
    expect(outputs.size).toBeGreaterThan(1)
  })

  it('cuts letters out as negative space rather than painting them white', () => {
    // A white letter over a container breaks on any non-white background, and
    // the export recolour used to repaint it into invisibility.
    const art = buildSymbol('monogram-knockout', context())!
    expect(art.content).toContain('fill-rule="evenodd"')
    expect(art.content).not.toContain('#ffffff')
  })

  it('never hardcodes a colour, so the layout can tint the mark', () => {
    for (const entry of ARCHETYPES) {
      expect(buildSymbol(entry.id, context())!.content, entry.id).not.toMatch(/fill="#/)
    }
  })
})

describe('stroke weight', () => {
  it('scales with the wordmark stem', () => {
    // Playfair Bold has heavier stems relative to cap height than Inter SemiBold.
    expect(strokeFor(playfair)).toBeGreaterThan(strokeFor(inter))
  })

  it('stays within usable bounds for any face', () => {
    for (const font of [inter, playfair]) {
      expect(strokeFor(font)).toBeGreaterThanOrEqual(0.045)
      expect(strokeFor(font, 2)).toBeLessThanOrEqual(0.3)
    }
  })
})

describe('candidates', () => {
  it('produces the requested number, best fit first', () => {
    const candidates = buildCandidates(context(), 12)
    expect(candidates).toHaveLength(12)
    expect(candidates[0].archetype).toBe(availableArchetypes({ initial: 'N', initials: ['N', 'S'] })[0])
  })

  it('gives every candidate a distinct seed', () => {
    const seeds = buildCandidates(context(), 12).map((candidate) => candidate.seed)
    expect(new Set(seeds).size).toBe(seeds.length)
  })

  it('is stable for a given batch seed', () => {
    const a = buildCandidates(context(), 6).map((candidate) => candidate.art.content)
    const b = buildCandidates(context(), 6).map((candidate) => candidate.art.content)
    expect(a).toEqual(b)
  })
})
