/**
 * Brand guidelines document.
 *
 * The old package shipped a plain-text file listing its own contents, which is
 * an inventory, not guidance. This produces a self-contained HTML page that
 * shows the logo on light and dark, states clear space and minimum size as
 * measured values, lists the type and colour specification, and demonstrates
 * the misuse rules rather than asserting them.
 */

import { layoutLogo, LAYOUT_RULES } from '../engine/layout'
import { renderSvg } from '../engine/render'
import type { LoadedFont, LogoSpec } from '../engine/types'
import { escapeXml } from '../engine/render'
import { formatCmyk, formatRgb, hexToCmyk, hexToRgb, normalizeHex, assessContrast } from '../utils/colorUtils'
import { getFont, WEIGHT_LABELS } from '../constants/fonts'
import type { ExportColors } from './assets'

export type GuidelinesInput = {
  spec: LogoSpec
  wordmarkFont: LoadedFont
  taglineFont: LoadedFont | null
  colors: ExportColors
  /** Template and seed, so a mark can be reproduced exactly. */
  symbolRecipe: { template: string; seed: string } | null
}

const escape = escapeXml

function colorRow(label: string, hex: string): string {
  const normalized = normalizeHex(hex)
  const rgb = hexToRgb(normalized)
  const cmyk = hexToCmyk(normalized)
  return `
    <div class="swatch">
      <div class="chip" style="background:${normalized}"></div>
      <div>
        <h4>${escape(label)}</h4>
        <dl>
          <div><dt>HEX</dt><dd>${normalized.toUpperCase()}</dd></div>
          <div><dt>RGB</dt><dd>${formatRgb(rgb)}</dd></div>
          <div><dt>CMYK</dt><dd>${formatCmyk(cmyk)} <span class="note">approx.</span></dd></div>
        </dl>
      </div>
    </div>`
}

function renderVariant(
  input: GuidelinesInput,
  spec: LogoSpec,
  options: { reversed?: boolean; width?: number } = {},
): string {
  const layout = layoutLogo({
    spec: { ...spec, colors: options.reversed ? input.colors.reversed : input.colors.primary },
    wordmarkFont: input.wordmarkFont,
    taglineFont: input.taglineFont,
  })
  return renderSvg(layout, { targetWidth: options.width ?? 420 }).svg
}

/**
 * Clear space diagram: the lockup with its measured margin drawn around it.
 * Showing the rule beats stating it.
 */
function clearSpaceDiagram(input: GuidelinesInput): string {
  const layout = layoutLogo({
    spec: { ...input.spec, colors: input.colors.primary },
    wordmarkFont: input.wordmarkFont,
    taglineFont: input.taglineFont,
  })
  const { inkBox, clearSpace } = layout
  const { svg } = renderSvg(layout, { targetWidth: 420, paddingCaps: 1 })

  // Overlay the ink bounds so the margin is visible as a measurement.
  const overlay = svg.replace(
    '</svg>',
    `<rect x="${inkBox.x1}" y="${inkBox.y1}" width="${inkBox.x2 - inkBox.x1}" height="${inkBox.y2 - inkBox.y1}" fill="none" stroke="#2563eb" stroke-width="${clearSpace * 0.03}" stroke-dasharray="${clearSpace * 0.08} ${clearSpace * 0.08}"/></svg>`,
  )
  return overlay
}

export function buildGuidelinesHtml(input: GuidelinesInput): string {
  const { spec, wordmarkFont, taglineFont, colors, symbolRecipe } = input
  const name = spec.brandName.trim() || 'Your brand'
  const wordmarkEntry = getFont(spec.fontFamily)
  const hasTagline = spec.tagline.trim().length > 0
  const hasSymbol = spec.symbol !== null

  const primaryContrastLight = assessContrast(colors.primary.wordmark, colors.lightBackground)
  const reversedContrastDark = assessContrast(colors.reversed.wordmark, colors.darkBackground)

  const wordmarkOnly: LogoSpec = { ...spec, symbolPlacement: 'none', tagline: '' }
  const symbolOnly: LogoSpec = { ...spec, brandName: '', tagline: '', symbolPlacement: 'left' }

  // Minimum size: below roughly 8px of cap height, counters close up in print
  // and disappear on screen. Expressed in the lockup's own overall width.
  const layout = layoutLogo({ spec, wordmarkFont, taglineFont })
  const lockupWidth = layout.inkBox.x2 - layout.inkBox.x1
  const minWidthPx = Math.ceil((lockupWidth / layout.capHeight) * 9)
  const minWidthMm = Math.ceil((minWidthPx / 96) * 25.4)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(name)} brand guidelines</title>
<style>
  :root {
    --ink: #111827; --muted: #6b7280; --line: #e5e7eb; --bg: #ffffff;
    --dark: ${normalizeHex(colors.darkBackground)};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 48px 24px 96px;
    font: 15px/1.6 ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: var(--ink); background: var(--bg);
  }
  main { max-width: 860px; margin: 0 auto; }
  header { border-bottom: 2px solid var(--ink); padding-bottom: 24px; margin-bottom: 40px; }
  h1 { font-size: 32px; letter-spacing: -0.02em; margin: 0 0 4px; }
  header p { color: var(--muted); margin: 0; }
  section { margin: 0 0 48px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted);
       border-bottom: 1px solid var(--line); padding-bottom: 8px; margin: 0 0 20px; }
  h3 { font-size: 15px; margin: 0 0 8px; }
  h4 { font-size: 14px; margin: 0 0 6px; }
  p { margin: 0 0 12px; }
  .note { color: var(--muted); font-size: 13px; }
  .panel { border: 1px solid var(--line); border-radius: 10px; padding: 28px; display: flex;
           align-items: center; justify-content: center; min-height: 150px; }
  .panel.dark { background: var(--dark); border-color: transparent; }
  .panel svg { max-width: 100%; height: auto; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .cols-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .caption { font-size: 12px; color: var(--muted); margin-top: 8px; }
  .swatch { display: flex; gap: 16px; align-items: flex-start; border: 1px solid var(--line);
            border-radius: 10px; padding: 16px; }
  .chip { width: 64px; height: 64px; border-radius: 8px; border: 1px solid rgba(0,0,0,.08); flex: none; }
  dl { margin: 0; font-size: 13px; }
  dl div { display: flex; gap: 8px; }
  dt { color: var(--muted); width: 52px; flex: none; }
  dd { margin: 0; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { color: var(--muted); font-weight: 500; width: 190px; }
  ul { margin: 0; padding-left: 18px; }
  li { margin-bottom: 6px; }
  .rules { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .do h3 { color: #047857; }
  .dont h3 { color: #b91c1c; }
  footer { border-top: 1px solid var(--line); padding-top: 20px; color: var(--muted); font-size: 13px; }
  @media (max-width: 720px) { .cols, .cols-3, .rules { grid-template-columns: 1fr; } }
  @media print { body { padding: 0; } .panel { break-inside: avoid; } }
</style>
</head>
<body>
<main>
  <header>
    <h1>${escape(name)}</h1>
    <p>Brand guidelines${hasTagline ? ` · ${escape(spec.tagline.trim())}` : ''}</p>
  </header>

  <section>
    <h2>Primary lockup</h2>
    <div class="panel">${renderVariant(input, spec, { width: 480 })}</div>
    <p class="caption">The default version. Use it wherever there is room.</p>
  </section>

  <section>
    <h2>Backgrounds</h2>
    <div class="cols">
      <div>
        <div class="panel">${renderVariant(input, spec, { width: 340 })}</div>
        <p class="caption">On light, contrast ${primaryContrastLight.ratio}:1</p>
      </div>
      <div>
        <div class="panel dark">${renderVariant(input, spec, { reversed: true, width: 340 })}</div>
        <p class="caption">On dark, contrast ${reversedContrastDark.ratio}:1</p>
      </div>
    </div>
    <p class="note">Both variants clear the 3:1 WCAG threshold for non-text contrast${
      primaryContrastLight.passesGraphics && reversedContrastDark.passesGraphics
        ? '.'
        : ', except where noted above. Consider a stronger colour for that background.'
    }</p>
  </section>

  <section>
    <h2>Variants</h2>
    <div class="cols-3">
      <div>
        <div class="panel">${renderVariant(input, wordmarkOnly, { width: 240 })}</div>
        <p class="caption">Wordmark only</p>
      </div>
      ${
        hasSymbol
          ? `<div>
        <div class="panel">${renderVariant(input, symbolOnly, { width: 120 })}</div>
        <p class="caption">Symbol only, for app icons, avatars and favicons</p>
      </div>
      <div>
        <div class="panel">${renderVariant(input, { ...spec, symbolPlacement: spec.symbolPlacement === 'above' ? 'left' : 'above' }, { width: 240 })}</div>
        <p class="caption">Alternate lockup, for narrow or wide spaces</p>
      </div>`
          : ''
      }
    </div>
  </section>

  <section>
    <h2>Clear space &amp; minimum size</h2>
    <div class="cols">
      <div>
        <div class="panel">${clearSpaceDiagram(input)}</div>
        <p class="caption">Keep clear space of one cap height on every side. Nothing, whether type,
        an image edge or another logo, enters the dashed boundary.</p>
      </div>
      <div>
        <table>
          <tr><th>Clear space</th><td>1 &times; cap height on all sides</td></tr>
          <tr><th>Minimum width (screen)</th><td>${minWidthPx} px</td></tr>
          <tr><th>Minimum width (print)</th><td>${minWidthMm} mm</td></tr>
          ${hasSymbol ? '<tr><th>Below minimum</th><td>Use the symbol on its own</td></tr>' : ''}
        </table>
        <p class="note">Minimum sizes keep the cap height at or above 9&nbsp;px, the point where
        counters start to close up.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Colour</h2>
    <div class="cols">
      ${colorRow('Primary', colors.primary.wordmark)}
      ${
        colors.primary.symbol.toLowerCase() !== colors.primary.wordmark.toLowerCase()
          ? colorRow('Symbol', colors.primary.symbol)
          : colorRow('Reversed', colors.reversed.wordmark)
      }
    </div>
    <p class="note" style="margin-top:12px">CMYK values are an uncalibrated conversion: a starting
    point, not a press specification. Confirm colour with your printer against a proof, and ask them
    to match a spot colour if you need one.</p>
  </section>

  <section>
    <h2>Typography</h2>
    <table>
      <tr><th>Wordmark</th><td>${escape(spec.fontFamily)} ${WEIGHT_LABELS[spec.fontWeight] ?? spec.fontWeight}
        · ${wordmarkEntry.category} · tracking ${(spec.tracking * 1000).toFixed(0)}/1000 em</td></tr>
      ${
        hasTagline
          ? `<tr><th>Tagline</th><td>${escape(spec.taglineFontFamily)} ${WEIGHT_LABELS[spec.taglineFontWeight] ?? spec.taglineFontWeight}
        · set at ${Math.round(LAYOUT_RULES.taglineScale[spec.taglineSize] * 100)}% of the wordmark's cap height</td></tr>`
          : ''
      }
      ${spec.textCase === 'uppercase' ? '<tr><th>Case</th><td>Uppercase</td></tr>' : ''}
      ${
        symbolRecipe
          ? `<tr><th>Symbol recipe</th><td>${escape(symbolRecipe.template)} · seed <code>${escape(symbolRecipe.seed)}</code></td></tr>`
          : ''
      }
    </table>
    <p class="note">All supplied files carry outlined letterforms, so no font installation is needed
    to use them. To set matching text elsewhere, install ${escape(spec.fontFamily)} from Google Fonts.</p>
  </section>

  <section>
    <h2>Usage</h2>
    <div class="rules">
      <div class="do">
        <h3>Do</h3>
        <ul>
          <li>Use the supplied files rather than recreating the logo.</li>
          <li>Use SVG on the web and in design tools; PNG in documents and slides.</li>
          <li>Scale proportionally, from the corner.</li>
          <li>Use the reversed variant on dark or coloured backgrounds.</li>
          ${hasSymbol ? '<li>Use the symbol alone where the full lockup will not fit.</li>' : ''}
        </ul>
      </div>
      <div class="dont">
        <h3>Don't</h3>
        <ul>
          <li>Stretch, squash, rotate, or skew the logo.</li>
          <li>Recolour it outside the palette above.</li>
          <li>Add shadows, outlines, gradients, or other effects.</li>
          <li>Place it on a busy image without a clear area behind it.</li>
          <li>Rebuild the lockup by moving the ${hasSymbol ? 'symbol, ' : ''}wordmark${hasTagline ? ' or tagline' : ''}.</li>
        </ul>
      </div>
    </div>
  </section>

  <footer>
    <p>Generated with GoLogotype. Files in this package are yours to use commercially.
    Typeface: ${escape(spec.fontFamily)} (Google Fonts, open licence). The outlines embedded here are
    part of your artwork.</p>
  </footer>
</main>
</body>
</html>`
}

/** Machine-readable counterpart, so a design can be rebuilt exactly. */
export function buildBrandJson(input: GuidelinesInput): string {
  const { spec, colors, symbolRecipe } = input
  return JSON.stringify(
    {
      brand: spec.brandName,
      tagline: spec.tagline || null,
      typography: {
        wordmark: { family: spec.fontFamily, weight: spec.fontWeight, tracking: spec.tracking, case: spec.textCase },
        tagline: spec.tagline
          ? {
              family: spec.taglineFontFamily,
              weight: spec.taglineFontWeight,
              tracking: spec.taglineTracking,
              case: spec.taglineCase,
              size: spec.taglineSize,
            }
          : null,
      },
      symbol: symbolRecipe ? { ...symbolRecipe, placement: spec.symbolPlacement, size: spec.symbolSize } : null,
      trademark: spec.trademark === 'none' ? null : spec.trademark,
      colors: {
        primary: colors.primary,
        reversed: colors.reversed,
        backgrounds: { light: colors.lightBackground, dark: colors.darkBackground },
        cmykNote: 'Uncalibrated algebraic conversion. Confirm with your printer.',
      },
      generatedBy: 'gologotype',
    },
    null,
    2,
  )
}
