/**
 * Choosing which marks to offer.
 *
 * The grid is the whole of the user's experience of the library — most people
 * will never press "More" — so what matters is not that the best mark is in it
 * but that it shows the *range*. A grid of six rings and a monogram makes the
 * generator look like it has one idea.
 *
 * So candidates are drawn family by family rather than straight down the
 * ranking, and every slot is a different template.
 */

import { createSeededRandom } from '../../utils/seedUtils'
import { buildMark, type ComposeContext } from './compose'
import { measureLetterForm } from './letterform'
import { TEMPLATES } from './templates'
import type { MarkTemplate, TemplateFamily } from './template'
import type { LoadedFont, SymbolArt } from '../types'

export type SymbolCandidate = {
  template: string
  seed: string
  art: SymbolArt
}

/** First letters of the first two words, which is what the marks can use. */
export function initialsFor(brandName: string): string[] {
  return brandName
    .trim()
    .split(/[\s&/-]+/)
    .filter((word) => /[a-z0-9]/i.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
}

/**
 * A stable seed for a brand.
 *
 * Derived from the name and face rather than rolled at random, so a name always
 * produces the same marks: reload the page or open a shared link and the grid
 * is the one you saw. The shuffle index is what moves it when the user asks.
 */
export function batchSeedFor(brandName: string, fontFamily: string, shuffle: number): string {
  const normalised = brandName.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
  return `${normalised}|${fontFamily}|${shuffle}`
}

const FAMILY_ORDER: TemplateFamily[] = ['monogram', 'geometric', 'structural', 'organic', 'motion']

type Ranked = { template: MarkTemplate; score: number }

/** Templates that will build for this letter, best fit first, by family. */
function rankByFamily(
  context: Omit<ComposeContext, 'seed'>,
  random: () => number,
): Map<TemplateFamily, Ranked[]> {
  const form = measureLetterForm(context.font, context.initial || 'A')
  const hasTwo = (context.initials?.length ?? 0) >= 2
  const grouped = new Map<TemplateFamily, Ranked[]>()

  for (const template of TEMPLATES) {
    if (template.letterRole !== 'none' && !context.initial) continue
    if (template.id === 'duo-ligature' && !hasTwo) continue

    const score = template.score(form)
    if (score < 0) continue

    // A little seeded noise so two brands with the same initial do not get the
    // same running order, while a strong fit still tends to come first.
    const jittered = score + random() * 0.35
    const list = grouped.get(template.family)
    if (list) list.push({ template, score: jittered })
    else grouped.set(template.family, [{ template, score: jittered }])
  }

  for (const list of grouped.values()) list.sort((a, b) => b.score - a.score)
  return grouped
}

/**
 * Build the candidate grid.
 *
 * Takes one template from each family in turn, so the first row alone spans
 * monogram, geometric, structural, organic and motion.
 */
export function buildCandidates(
  context: Omit<ComposeContext, 'seed'> & { seed: string },
  count: number,
): SymbolCandidate[] {
  const random = createSeededRandom(`${context.seed}:candidates`)
  const grouped = rankByFamily(context, random)
  const cursors = new Map<TemplateFamily, number>()
  const candidates: SymbolCandidate[] = []

  let exhausted = false
  while (candidates.length < count && !exhausted) {
    exhausted = true
    for (const family of FAMILY_ORDER) {
      if (candidates.length >= count) break
      const list = grouped.get(family)
      if (!list) continue
      const cursor = cursors.get(family) ?? 0
      if (cursor >= list.length) continue

      exhausted = false
      cursors.set(family, cursor + 1)

      const template = list[cursor].template
      const seed = `${context.seed}-${template.id}`
      const art = buildMark(template, { ...context, seed })
      if (art) candidates.push({ template: template.id, seed, art })
    }
  }

  return candidates
}

/**
 * The mark to fall back to when a stored choice names a template that no longer
 * exists — an old shared link, say. Picking the best fit for the letter means
 * such a link degrades into something considered rather than into nothing.
 */
export function defaultChoiceFor(
  font: LoadedFont,
  brandName: string,
): { template: string; seed: string } | null {
  const initials = initialsFor(brandName)
  const candidates = buildCandidates(
    {
      font,
      initial: initials[0] || '',
      initials,
      seed: batchSeedFor(brandName, font.family, 0),
    },
    1,
  )
  return candidates.length > 0
    ? { template: candidates[0].template, seed: candidates[0].seed }
    : null
}
