import { describe, expect, it } from 'vitest'

import { batchSeedFor, buildCandidates, initialsFor } from '../src/engine/symbols/select'
import { templateById } from '../src/engine/symbols/templates'
import { decodeState, encodeState, DEFAULT_STATE } from '../src/state/logoSpec'
import { PRESETS } from '../src/state/presets'
import { loadFixture } from './fixtures'

const inter = loadFixture('Inter-600')

function candidates(brandName: string, count = 12, shuffle = 0) {
  const initials = initialsFor(brandName)
  return buildCandidates(
    {
      font: inter,
      initial: initials[0] || '',
      initials,
      seed: batchSeedFor(brandName, inter.family, shuffle),
    },
    count,
  )
}

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsFor('Northwind Studio')).toEqual(['N', 'S'])
    expect(initialsFor('Black & White Co')).toEqual(['B', 'W'])
    expect(initialsFor('Acme')).toEqual(['A'])
    expect(initialsFor('   ')).toEqual([])
  })
})

describe('candidate grid', () => {
  it('fills the grid', () => {
    expect(candidates('Northwind Studio').length).toBe(12)
  })

  it('never offers the same template twice', () => {
    const ids = candidates('Northwind Studio').map((candidate) => candidate.template)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('spans families in the first row rather than stacking one kind', () => {
    // The first five slots are what most people will look at, so they have to
    // show the range of the library, not five variations on a circle.
    const families = candidates('Northwind Studio')
      .slice(0, 5)
      .map((candidate) => templateById(candidate.template)?.family)
    expect(new Set(families).size).toBeGreaterThanOrEqual(4)
  })

  it('is the same grid every time for a given name', () => {
    const first = candidates('Northwind Studio').map((c) => `${c.template}~${c.seed}`)
    const again = candidates('Northwind Studio').map((c) => `${c.template}~${c.seed}`)
    expect(again).toEqual(first)
  })

  it('gives different names different marks', () => {
    const a = candidates('Northwind Studio').map((c) => c.art.content)
    const b = candidates('Orbit Labs').map((c) => c.art.content)
    expect(a.some((content, index) => content === b[index])).toBe(false)
  })

  it('separates names that differ by one character', () => {
    const a = candidates('Acme Co').map((c) => `${c.template}~${c.seed}`).join('|')
    const b = candidates('Acme Ltd').map((c) => `${c.template}~${c.seed}`).join('|')
    expect(a).not.toBe(b)
  })

  it('offers a genuinely different set when the user asks for more', () => {
    // Shuffling must move the templates on offer, not just re-roll the variant
    // within each one — that was the old behaviour and it felt like nothing
    // had happened.
    const first = candidates('Northwind Studio', 12, 0).map((c) => c.template)
    const second = candidates('Northwind Studio', 12, 1).map((c) => c.template)
    expect(second).not.toEqual(first)
  })

  it('offers only letterless marks when there is no name yet', () => {
    for (const candidate of candidates('', 8)) {
      expect(templateById(candidate.template)?.letterRole).toBe('none')
    }
  })

  it('keeps two-initial marks for two-word names only', () => {
    expect(candidates('Acme', 24).some((c) => c.template === 'duo-ligature')).toBe(false)
    expect(candidates('Northwind Studio', 24).some((c) => c.template === 'duo-ligature')).toBe(true)
  })
})

describe('shared links', () => {
  it('round-trips a symbol choice', () => {
    const state = {
      ...DEFAULT_STATE,
      brandName: 'Northwind',
      symbol: { template: 'tile-knockout', seed: 'abc-123' },
      symbolShuffle: 2,
    }
    const decoded = decodeState(encodeState(state))
    expect(decoded?.symbol).toEqual({ template: 'tile-knockout', seed: 'abc-123' })
    expect(decoded?.symbolShuffle).toBe(2)
  })

  it('drops a template that no longer exists', () => {
    // A link made before the library changed must not decode into a mark that
    // cannot be built: the preview would quietly lose it while the exported
    // guidelines still described a symbol the package never contained.
    const decoded = decodeState('n=Northwind&y=concentric~abc')
    expect(decoded?.symbol).toBeNull()
  })

  it('rejects a malformed seed', () => {
    expect(decodeState('n=X&y=tile-knockout~' + 'a'.repeat(200))?.symbol).toBeNull()
    expect(decodeState('n=X&y=tile-knockout')?.symbol).toBeNull()
  })
})

describe('presets', () => {
  it('names a template that exists', () => {
    for (const preset of PRESETS) {
      expect(templateById(preset.symbolTemplate), preset.id).not.toBeNull()
    }
  })
})
