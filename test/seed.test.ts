import { describe, expect, it } from 'vitest'

import { createSeededRandom, seedToNumber } from '../src/utils/seedUtils'

function draw(seed: string, count = 8): number[] {
  const random = createSeededRandom(seed)
  return Array.from({ length: count }, () => random())
}

describe('seeded randomness', () => {
  it('is deterministic for a given seed', () => {
    expect(draw('Northwind Studio')).toEqual(draw('Northwind Studio'))
  })

  it('stays inside [0, 1)', () => {
    const values = draw('coverage', 500)
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('separates names that differ by a single character', () => {
    // The whole reason for the hash swap: a name-derived seed must not let
    // similar names land on similar marks. Compare the decision sequence a
    // picker would actually make rather than one draw — two independent
    // uniforms sit close together often enough to make that flaky.
    const choices = (seed: string) => draw(seed, 5).map((value) => Math.floor(value * 12)).join(',')
    const names = ['Acme Co', 'Acme Ltd', 'Acme Cp', 'Acme co', 'Acme  Co']
    expect(new Set(names.map(choices)).size).toBe(names.length)
  })

  it('avalanches across a family of near-identical seeds', () => {
    // 40 seeds differing only in the final digit should scatter across the
    // range, not creep along it the way a plain LCG would.
    const firsts = Array.from({ length: 40 }, (_, i) => draw(`brand-${i}`)[0])
    const buckets = new Set(firsts.map((value) => Math.floor(value * 10)))
    expect(buckets.size).toBeGreaterThanOrEqual(7)

    // Consecutive seeds must not produce a monotonic ramp.
    let ascending = 0
    for (let i = 1; i < firsts.length; i++) if (firsts[i] > firsts[i - 1]) ascending++
    expect(ascending).toBeGreaterThan(8)
    expect(ascending).toBeLessThan(31)
  })

  it('spreads a single stream evenly across the range', () => {
    const values = draw('distribution check', 2000)
    const buckets = new Array(10).fill(0)
    for (const value of values) buckets[Math.floor(value * 10)]++
    for (const count of buckets) {
      expect(count).toBeGreaterThan(120)
      expect(count).toBeLessThan(280)
    }
  })

  it('does not repeat within a long stream', () => {
    const values = draw('period check', 5000)
    expect(new Set(values).size).toBeGreaterThan(4900)
  })

  it('keeps low-order decisions unbiased', () => {
    // Almost every choice in the mark system is floor(random() * n), so the
    // coarse buckets are what actually matter.
    let heads = 0
    const random = createSeededRandom('coin')
    for (let i = 0; i < 2000; i++) if (Math.floor(random() * 2) === 0) heads++
    expect(heads).toBeGreaterThan(900)
    expect(heads).toBeLessThan(1100)
  })

  it('hashes to an unsigned 32-bit integer', () => {
    for (const seed of ['', 'a', 'Northwind Studio', '🎨 emoji']) {
      const hash = seedToNumber(seed)
      expect(Number.isInteger(hash)).toBe(true)
      expect(hash).toBeGreaterThanOrEqual(0)
      expect(hash).toBeLessThanOrEqual(0xffffffff)
    }
  })

  it('gives distinct hashes to anagrams and reorderings', () => {
    const seeds = ['ab', 'ba', 'abc', 'acb', 'cab']
    expect(new Set(seeds.map(seedToNumber)).size).toBe(seeds.length)
  })
})
