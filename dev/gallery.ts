/**
 * Dev-only visual harness for the rendering engine.
 *
 * Not part of the app bundle — it exists so symbol archetypes and lockups can
 * be judged by eye across fonts, weights and brand names, which is the only way
 * to tell whether a mark reads as designed.
 */

import { loadFont } from '../src/engine/fontLoader'
import { layoutLogo } from '../src/engine/layout'
import { renderSvg } from '../src/engine/render'
import { ARCHETYPES, buildCandidates, buildSymbol } from '../src/engine/symbols/archetypes'
import type { LoadedFont, LogoSpec } from '../src/engine/types'

const app = document.getElementById('app')!

const baseSpec = (overrides: Partial<LogoSpec> = {}): LogoSpec => ({
  brandName: 'Northwind',
  fontFamily: 'Inter',
  fontWeight: 600,
  tracking: -0.02,
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
  colors: { wordmark: '#111827', tagline: '#4b5563', symbol: '#111827' },
  ...overrides,
})

function section(title: string): HTMLElement {
  const heading = document.createElement('h2')
  heading.textContent = title
  app.append(heading)
  const container = document.createElement('div')
  app.append(container)
  return container
}

function cell(svg: string, label: string, dark = false): HTMLElement {
  const element = document.createElement('div')
  element.className = `cell${dark ? ' dark' : ''}`
  element.innerHTML = `${svg}<div class="label">${label}</div>`
  return element
}

async function main() {
  const [inter600, inter300, inter900, playfair, bebas, archivo] = await Promise.all([
    loadFont('Inter', 600),
    loadFont('Inter', 300),
    loadFont('Inter', 900),
    loadFont('Playfair Display', 700),
    loadFont('Bebas Neue', 400),
    loadFont('Archivo Black', 400),
  ])
  app.innerHTML = ''

  // 1. Every archetype, same font.
  const all = section('All archetypes — Inter 600, Northwind Studio')
  all.className = 'grid'
  for (const { id, label } of ARCHETYPES) {
    const art = buildSymbol(id, { font: inter600, initial: 'N', initials: ['N', 'S'], seed: 'demo-seed' })
    if (!art) continue
    const layout = layoutLogo({
      spec: baseSpec({ brandName: '', symbol: art, symbolPlacement: 'left', symbolSize: 'md' }),
      wordmarkFont: inter600,
      taglineFont: null,
    })
    all.append(cell(renderSvg(layout, { targetWidth: 110 }).svg, label))
  }

  // 2. Stroke weight must track the wordmark weight.
  const weights = section('Stroke weight follows font weight (concentric + arc + chevron)')
  weights.className = 'grid'
  for (const [name, font] of [
    ['Inter 300', inter300],
    ['Inter 600', inter600],
    ['Inter 900', inter900],
    ['Playfair 700', playfair],
    ['Archivo Black', archivo],
  ] as Array<[string, LoadedFont]>) {
    for (const id of ['concentric', 'arc', 'chevron'] as const) {
      const art = buildSymbol(id, { font, initial: 'N', seed: 'weights' })
      if (!art) continue
      const layout = layoutLogo({
        spec: baseSpec({ brandName: '', symbol: art, symbolPlacement: 'left' }),
        wordmarkFont: font,
        taglineFont: null,
      })
      weights.append(cell(renderSvg(layout, { targetWidth: 90 }).svg, `${name} · ${id}`))
    }
  }

  // 3. Full lockups across fonts, with descender / no descender pairs.
  section('Lockups — cap-height alignment across names and fonts')
  for (const [name, font, brand] of [
    ['Inter 600', inter600, 'Northwind'],
    ['Inter 600', inter600, 'Agency'],
    ['Playfair 700', playfair, 'Highgrove'],
    ['Bebas Neue', bebas, 'Northwind'],
    ['Archivo Black', archivo, 'Acme'],
  ] as Array<[string, LoadedFont, string]>) {
    const art = buildSymbol('monogram-knockout', {
      font,
      initial: brand[0],
      seed: `lockup-${brand}`,
    })
    const row = document.createElement('div')
    row.className = 'row'
    const layout = layoutLogo({
      spec: baseSpec({
        brandName: brand,
        symbol: art,
        symbolPlacement: 'left',
        tagline: 'Design & Strategy',
      }),
      wordmarkFont: font,
      taglineFont: font,
    })
    row.innerHTML = `${renderSvg(layout, { targetWidth: 460 }).svg}<div class="label">${name} · ${brand}</div>`
    app.append(row)
  }

  // 4. Stacked lockup + trademark + uppercase.
  const variants = section('Variants — stacked, trademark, uppercase')
  variants.className = 'grid'
  const art = buildSymbol('concentric', { font: inter600, initial: 'N', seed: 'variants' })
  const cases: Array<[string, Partial<LogoSpec>]> = [
    ['stacked', { symbol: art, symbolPlacement: 'above', tagline: 'Studio' }],
    ['registered', { trademark: 'r' }],
    ['trademark', { trademark: 'tm' }],
    ['copyright', { trademark: 'c' }],
    ['uppercase', { textCase: 'uppercase' }],
    ['uppercase + ®', { textCase: 'uppercase', trademark: 'r' }],
    ['tagline sm', { tagline: 'Design & Strategy', taglineSize: 'sm' }],
    ['tagline lg', { tagline: 'Design & Strategy', taglineSize: 'lg' }],
  ]
  for (const [label, overrides] of cases) {
    const layout = layoutLogo({
      spec: baseSpec({ brandName: 'Northwind', ...overrides }),
      wordmarkFont: inter600,
      taglineFont: inter600,
    })
    variants.append(cell(renderSvg(layout, { targetWidth: 200 }).svg, label))
  }

  // 5. Candidate grid, as the picker will show it.
  const candidates = section('Candidate grid for "Northwind Studio" (N is diagonal)')
  candidates.className = 'grid'
  for (const candidate of buildCandidates(
    { font: inter600, initial: 'N', initials: ['N', 'S'], seed: 'pick-1' },
    14,
  )) {
    const layout = layoutLogo({
      spec: baseSpec({ brandName: '', symbol: candidate.art, symbolPlacement: 'left' }),
      wordmarkFont: inter600,
      taglineFont: null,
    })
    candidates.append(cell(renderSvg(layout, { targetWidth: 90 }).svg, candidate.archetype))
  }

  // 6. The same picker for a round initial, to show suitability ordering.
  const round = section('Candidate grid for "Orbit Labs" (O is round: no ring offered first)')
  round.className = 'grid'
  for (const candidate of buildCandidates(
    { font: inter600, initial: 'O', initials: ['O', 'L'], seed: 'pick-2' },
    14,
  )) {
    const layout = layoutLogo({
      spec: baseSpec({ brandName: '', symbol: candidate.art, symbolPlacement: 'left' }),
      wordmarkFont: inter600,
      taglineFont: null,
    })
    round.append(cell(renderSvg(layout, { targetWidth: 90 }).svg, candidate.archetype))
  }
}

main().catch((error) => {
  app.textContent = `Failed: ${String(error)}`
  console.error(error)
})
