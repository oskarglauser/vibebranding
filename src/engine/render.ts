/**
 * SVG serialisation and rasterisation.
 *
 * This is the only place that produces markup. The preview, the exported .svg
 * and the .png all consume the identical string, which is what guarantees they
 * agree — the previous implementation had three independent renderers and they
 * visibly disagreed on tracking, trademark size and tagline placement.
 */

import type { LogoLayout } from './types'

export type Background = 'transparent' | 'light' | 'dark'

export type RenderOptions = {
  background?: Background
  backgroundColors?: { light: string; dark: string }
  /**
   * Padding around the ink, in cap heights. Defaults to the layout's own clear
   * space so exported files carry their minimum clear space with them.
   */
  paddingCaps?: number
  /** Target width in pixels for the width/height attributes. */
  targetWidth?: number
  /** Optional square canvas (app icons); the lockup is centred within it. */
  square?: boolean
  title?: string
}

const DEFAULT_BACKGROUNDS = { light: '#ffffff', dark: '#0b0d12' }

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Reject anything that is not a plain hex colour before it reaches markup. */
export function safeColor(value: string, fallback = '#000000'): string {
  return /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
}

export type RenderedSvg = {
  svg: string
  width: number
  height: number
}

export function renderSvg(layout: LogoLayout, options: RenderOptions = {}): RenderedSvg {
  const { inkBox } = layout
  const padding = (options.paddingCaps ?? 1) * layout.capHeight

  const inkWidth = Math.max(inkBox.x2 - inkBox.x1, 0)
  const inkHeight = Math.max(inkBox.y2 - inkBox.y1, 0)

  let viewX = inkBox.x1 - padding
  let viewY = inkBox.y1 - padding
  let viewWidth = inkWidth + padding * 2
  let viewHeight = inkHeight + padding * 2

  if (options.square) {
    const side = Math.max(viewWidth, viewHeight)
    viewX -= (side - viewWidth) / 2
    viewY -= (side - viewHeight) / 2
    viewWidth = side
    viewHeight = side
  }

  if (viewWidth <= 0 || viewHeight <= 0) {
    viewWidth = Math.max(viewWidth, 1)
    viewHeight = Math.max(viewHeight, 1)
  }

  const aspect = viewHeight / viewWidth
  const width = Math.round(options.targetWidth ?? 1000)
  const height = Math.max(1, Math.round(width * aspect))

  const body: string[] = []

  const background = options.background ?? 'transparent'
  if (background !== 'transparent') {
    const palette = options.backgroundColors ?? DEFAULT_BACKGROUNDS
    const fill = safeColor(background === 'light' ? palette.light : palette.dark, '#ffffff')
    // A real <rect> rather than a CSS background: design tools and rasterisers
    // ignore styles on the root <svg>, which is why the old exports arrived
    // transparent when opened in Figma or Illustrator.
    body.push(
      `<rect x="${round(viewX)}" y="${round(viewY)}" width="${round(viewWidth)}" height="${round(viewHeight)}" fill="${fill}"/>`,
    )
  }

  for (const piece of layout.pieces) {
    if (piece.kind === 'path') {
      if (!piece.d) continue
      body.push(`<path d="${piece.d}" fill="${safeColor(piece.color)}"/>`)
    } else {
      body.push(
        `<g transform="${piece.transform}" fill="${safeColor(piece.color)}">${piece.content}</g>`,
      )
    }
  }

  const title = options.title ? `<title>${escapeXml(options.title)}</title>` : ''

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="${round(viewX)} ${round(viewY)} ${round(viewWidth)} ${round(viewHeight)}" ` +
    `role="img">${title}${body.join('')}</svg>`

  return { svg, width, height }
}

/**
 * Rasterise an SVG string to a PNG blob.
 *
 * Safe now that the engine emits outlines only: the old exports embedded live
 * <text>, and an SVG loaded through an <img> cannot see the page's webfonts —
 * so every letter-based mark rasterised in Times New Roman.
 */
export async function rasterize(svg: string, pixelWidth: number, pixelHeight: number): Promise<Blob> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const image = new Image()
    image.decoding = 'sync'
    image.src = url
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(pixelWidth))
    canvas.height = Math.max(1, Math.round(pixelHeight))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('PNG encoding failed'))),
        'image/png',
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}
