/**
 * Dev-only visual harness for the rendering engine.
 *
 * Not part of the app bundle — it exists so mark templates and lockups can
 * be judged by eye across fonts, weights and brand names, which is the only way
 * to tell whether a mark reads as designed.
 */

import { loadFont } from '../src/engine/fontLoader'
import { layoutLogo } from '../src/engine/layout'
import { renderSvg } from '../src/engine/render'
import { buildMark } from '../src/engine/symbols/compose'
import { buildCandidates } from '../src/engine/symbols/select'
import { TEMPLATES, templateById } from '../src/engine/symbols/templates'
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

  // 0. The drawn template library. This is the section that decides whether the
  // marks read as designed, so it comes first and is the one to iterate on.
  const drawSymbol = (art: ReturnType<typeof buildMark>, font: LoadedFont, width: number) => {
    if (!art) return null
    const layout = layoutLogo({
      spec: baseSpec({ brandName: '', symbol: art, symbolPlacement: 'left', symbolSize: 'md' }),
      wordmarkFont: font,
      taglineFont: null,
    })
    return renderSvg(layout, { targetWidth: width }).svg
  }

  for (const [fontName, font, letters] of [
    ['Inter 600', inter600, ['N', 'O', 'A', 'S']],
    ['Playfair 700', playfair, ['N', 'O']],
    ['Bebas Neue', bebas, ['N', 'O']],
  ] as Array<[string, LoadedFont, string[]]>) {
    const grid = section(`Templates — ${fontName}`)
    grid.className = 'grid'
    for (const template of TEMPLATES) {
      for (const letter of letters) {
        for (let variant = 0; variant < template.variants; variant++) {
          const svg = drawSymbol(
            buildMark(template, {
              font,
              initial: letter,
              initials: [letter, 'S'],
              seed: `gallery-${letter}`,
              variant,
            }),
            font,
            104,
          )
          if (svg) grid.append(cell(svg, `${template.id} v${variant} · ${letter}`))
        }
      }
    }
  }

  // Small sizes are where marks fall apart, so look at them deliberately.
  const small = section('Templates at favicon size — 32px and 16px')
  small.className = 'grid'
  for (const template of TEMPLATES) {
    for (const size of [32, 16]) {
      const svg = drawSymbol(
        buildMark(template, {
          font: inter600,
          initial: 'N',
          initials: ['N', 'S'],
          seed: 'small',
          reduced: size <= 16,
        }),
        inter600,
        size,
      )
      if (svg) small.append(cell(svg, `${template.id} ${size}px`))
    }
  }

  // And reversed, since half the exported package is on a dark ground.
  const reversed = section('Templates reversed')
  reversed.className = 'grid'
  for (const template of TEMPLATES) {
    const art = buildMark(template, {
      font: inter600,
      initial: 'N',
      initials: ['N', 'S'],
      seed: 'reversed',
    })
    if (!art) continue
    const layout = layoutLogo({
      spec: baseSpec({
        brandName: '',
        symbol: art,
        symbolPlacement: 'left',
        colors: { wordmark: '#ffffff', tagline: '#ffffff', symbol: '#ffffff' },
      }),
      wordmarkFont: inter600,
      taglineFont: null,
    })
    reversed.append(cell(renderSvg(layout, { targetWidth: 96 }).svg, template.id, true))
  }

  // Stroke weight must track the wordmark weight.
  const weights = section('Stroke weight follows font weight')
  weights.className = 'grid'
  for (const [name, font] of [
    ['Inter 300', inter300],
    ['Inter 600', inter600],
    ['Inter 900', inter900],
    ['Playfair 700', playfair],
    ['Archivo Black', archivo],
  ] as Array<[string, LoadedFont]>) {
    for (const id of ['quadrant', 'aperture', 'blade'] as const) {
      const template = templateById(id)
      if (!template) continue
      const art = buildMark(template, { font, initial: 'N', seed: 'weights' })
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
    const art = buildMark(templateById('tile-knockout')!, {
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
  const art = buildMark(templateById('quadrant')!, { font: inter600, initial: 'N', seed: 'variants' })
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
  const candidates = section('Candidate grid for "Northwind Studio" — one template per family, in turn')
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
    candidates.append(cell(renderSvg(layout, { targetWidth: 90 }).svg, candidate.template))
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
    round.append(cell(renderSvg(layout, { targetWidth: 90 }).svg, candidate.template))
  }
}

main().catch((error) => {
  app.textContent = `Failed: ${String(error)}`
  console.error(error)
})
