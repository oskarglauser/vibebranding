/**
 * Brand package assembly: plan the assets, render them, zip them up.
 */

import JSZip from 'jszip'
import type { LoadedFont, LogoSpec } from '../engine/types'
import { planAssets, renderAssets, slugify, type ExportColors } from './assets'
import { buildBrandJson, buildGuidelinesHtml } from './guidelines'
import { reversedVariant } from '../utils/colorUtils'

export type PackageInput = {
  spec: LogoSpec
  wordmarkFont: LoadedFont
  taglineFont: LoadedFont | null
  symbolRecipe: { archetype: string; seed: string } | null
  lightBackground?: string
  darkBackground?: string
}

export type PackageProgress = {
  done: number
  total: number
  label: string
}

/**
 * Derive the reversed palette. Each colour is lifted only as far as it needs to
 * carry on the dark background, so a brand blue stays recognisably itself
 * instead of being flattened to white.
 */
export function deriveColors(spec: LogoSpec, light: string, dark: string): ExportColors {
  return {
    primary: { ...spec.colors },
    reversed: {
      wordmark: reversedVariant(spec.colors.wordmark, dark),
      tagline: reversedVariant(spec.colors.tagline, dark),
      symbol: reversedVariant(spec.colors.symbol, dark),
    },
    lightBackground: light,
    darkBackground: dark,
  }
}

export async function buildBrandPackage(
  input: PackageInput,
  onProgress?: (progress: PackageProgress) => void,
): Promise<{ blob: Blob; filename: string }> {
  const light = input.lightBackground ?? '#ffffff'
  const dark = input.darkBackground ?? '#0b0d12'
  const colors = deriveColors(input.spec, light, dark)

  const context = {
    spec: input.spec,
    wordmarkFont: input.wordmarkFont,
    taglineFont: input.taglineFont,
    colors,
  }

  const plans = planAssets(context)
  const assets = await renderAssets(plans, (done, total) =>
    onProgress?.({ done, total, label: 'Rendering files' }),
  )

  onProgress?.({ done: assets.length, total: assets.length + 1, label: 'Writing guidelines' })

  const zip = new JSZip()
  for (const asset of assets) zip.file(asset.path, asset.content)

  const guidelinesInput = { ...context, symbolRecipe: input.symbolRecipe }
  zip.file('brand-guidelines.html', buildGuidelinesHtml(guidelinesInput))
  zip.file('brand.json', buildBrandJson(guidelinesInput))
  zip.file('README.txt', buildReadme(input.spec))

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return { blob, filename: `${slugify(input.spec.brandName)}-brand-package.zip` }
}

function buildReadme(spec: LogoSpec): string {
  const name = spec.brandName.trim() || 'Your brand'
  return `${name} brand package

Open brand-guidelines.html in a browser first. It shows every variant, the clear
space and minimum size rules, and the colour and type specification.

WHAT IS IN HERE

  logo/        The full lockup. "-light-bg" for light backgrounds,
               "-dark-bg" for dark ones. SVG plus PNG at 1000px and 3000px wide.
  symbol/      The mark on its own, where the full lockup will not fit.
  app-icon/    The mark on a solid tile, sized for app stores and avatars.
  favicon/     16, 32, 180 and 512px, plus the SVG browsers prefer.
  brand.json   The exact specification, including the symbol seed, so this
               design can be reproduced or adjusted later.

WHICH FILE DO I USE

  Websites, design tools, print   SVG
  Slides, documents, email        PNG
  Anything below the minimum size Use the symbol on its own

Every file contains outlined letterforms, so nobody needs the typeface installed
to use them.

Generated with GoLogotype: https://gologotype.com
`
}
