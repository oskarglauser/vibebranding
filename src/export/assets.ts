/**
 * Brand package contents.
 *
 * Every file here — SVG, PNG, favicon, social icon — is produced from the same
 * `renderSvg` output as the on-screen preview. The old package built PNGs on a
 * separate canvas path that quietly dropped the tagline, the tracking and the
 * trademark, so files that sat next to each other in the ZIP did not match.
 */

import { layoutLogo } from '../engine/layout'
import { renderSvg, rasterize } from '../engine/render'
import type { LoadedFont, LogoSpec } from '../engine/types'

export type AssetPlan = {
  path: string
  svg: string
  /** PNG widths to rasterise, if any. */
  pngWidths: number[]
  square: boolean
}

export type ExportColors = {
  /** The mark's own colours, for light backgrounds. */
  primary: LogoSpec['colors']
  /** Reversed colours, for dark backgrounds. */
  reversed: LogoSpec['colors']
  lightBackground: string
  darkBackground: string
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'logo'
  )
}

type BuildContext = {
  spec: LogoSpec
  wordmarkFont: LoadedFont
  taglineFont: LoadedFont | null
  colors: ExportColors
}

function render(
  spec: LogoSpec,
  context: BuildContext,
  options: { background?: 'transparent' | 'light' | 'dark'; square?: boolean; targetWidth: number },
) {
  const layout = layoutLogo({
    spec,
    wordmarkFont: context.wordmarkFont,
    taglineFont: context.taglineFont,
  })
  return renderSvg(layout, {
    background: options.background ?? 'transparent',
    backgroundColors: { light: context.colors.lightBackground, dark: context.colors.darkBackground },
    square: options.square,
    targetWidth: options.targetWidth,
    // Icons are cropped tighter: a favicon with a full cap height of margin
    // wastes most of its pixels.
    paddingCaps: options.square ? 0.45 : 1,
  })
}

/**
 * The full asset list.
 *
 * Deliberately smaller than the old 35-file package: four near-identical name
 * variants of the same lockup made the ZIP harder to use, not more complete.
 * Each file here answers one question — which lockup, on which background.
 */
export function planAssets(context: BuildContext): AssetPlan[] {
  const { spec, colors } = context
  const slug = slugify(spec.brandName)
  const plans: AssetPlan[] = []

  const hasSymbol = spec.symbol !== null
  const hasTagline = spec.tagline.trim().length > 0

  const variants: Array<{ name: string; spec: LogoSpec }> = []

  // Primary lockup: whatever the user actually designed.
  variants.push({ name: 'primary', spec })

  // Wordmark on its own — the version that gets used most in practice.
  if (hasSymbol || hasTagline) {
    variants.push({
      name: 'wordmark',
      spec: { ...spec, symbolPlacement: 'none', tagline: '' },
    })
  }

  // The alternate stacking, so there is a lockup for narrow and wide spaces.
  if (hasSymbol) {
    variants.push({
      name: spec.symbolPlacement === 'above' ? 'horizontal' : 'stacked',
      spec: { ...spec, symbolPlacement: spec.symbolPlacement === 'above' ? 'left' : 'above' },
    })
  }

  for (const variant of variants) {
    for (const [tone, tint, background] of [
      ['light-bg', colors.primary, 'transparent'],
      ['dark-bg', colors.reversed, 'transparent'],
    ] as const) {
      const tinted: LogoSpec = { ...variant.spec, colors: tint }
      const { svg } = render(tinted, context, { background, targetWidth: 2000 })
      plans.push({
        path: `logo/${slug}-${variant.name}-${tone}.svg`,
        svg,
        pngWidths: [1000, 3000],
        square: false,
      })
    }
  }

  if (hasSymbol) {
    const symbolOnly: LogoSpec = { ...spec, brandName: '', tagline: '', symbolPlacement: 'left' }

    for (const [tone, tint] of [
      ['light-bg', colors.primary],
      ['dark-bg', colors.reversed],
    ] as const) {
      const { svg } = render({ ...symbolOnly, colors: tint }, context, {
        targetWidth: 1024,
        square: true,
      })
      plans.push({
        path: `symbol/${slug}-symbol-${tone}.svg`,
        svg,
        pngWidths: [512, 1024],
        square: true,
      })
    }

    // App icon: the mark reversed out of a solid brand-coloured tile.
    const iconSpec: LogoSpec = {
      ...symbolOnly,
      colors: { ...colors.reversed, symbol: colors.reversed.symbol },
    }
    const icon = render(iconSpec, context, { targetWidth: 1024, square: true, background: 'dark' })
    plans.push({ path: `app-icon/${slug}-app-icon.svg`, svg: icon.svg, pngWidths: [512, 1024], square: true })

    // Favicons: same geometry, sizes browsers ask for.
    const favicon = render({ ...symbolOnly, colors: colors.primary }, context, {
      targetWidth: 512,
      square: true,
    })
    plans.push({
      path: `favicon/${slug}-favicon.svg`,
      svg: favicon.svg,
      pngWidths: [16, 32, 180, 512],
      square: true,
    })
  }

  return plans
}

export type RenderedAsset = {
  path: string
  content: string | Blob
}

/**
 * Turn the plan into files. PNGs are rasterised from the plan's own SVG, so a
 * PNG can never disagree with the vector beside it.
 */
export async function renderAssets(
  plans: AssetPlan[],
  onProgress?: (done: number, total: number) => void,
): Promise<RenderedAsset[]> {
  const assets: RenderedAsset[] = []
  const total = plans.reduce((sum, plan) => sum + 1 + plan.pngWidths.length, 0)
  let done = 0

  const advance = () => {
    done += 1
    onProgress?.(done, total)
  }

  for (const plan of plans) {
    assets.push({ path: plan.path, content: plan.svg })
    advance()

    for (const width of plan.pngWidths) {
      const aspect = aspectOf(plan.svg)
      const height = plan.square ? width : Math.max(1, Math.round(width * aspect))
      const png = await rasterize(plan.svg, width, height)
      assets.push({ path: plan.path.replace(/\.svg$/, `-${width}px.png`), content: png })
      advance()
    }
  }

  return assets
}

function aspectOf(svg: string): number {
  const match = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)
  if (!match) return 1
  const width = Number(match[3])
  const height = Number(match[4])
  return width > 0 ? height / width : 1
}
