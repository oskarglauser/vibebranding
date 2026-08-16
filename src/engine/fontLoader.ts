/**
 * Font loading.
 *
 * One fetch per family+weight serves two purposes: opentype.js parses the bytes
 * into outlines for rendering, and the very same bytes are registered as a
 * FontFace so any CSS preview (the font picker) shows exactly the file we
 * render from. No second source, no chance of preview and export disagreeing on
 * which weight they got.
 */

import opentype from 'opentype.js'
import { parseKerning } from './kerning'
import { getFontMetrics } from './metrics'
import type { LoadedFont } from './types'

const cache = new Map<string, Promise<LoadedFont>>()
const registeredFaces = new Set<string>()

export class FontLoadError extends Error {
  readonly family: string
  readonly weight: number
  readonly reason: unknown

  constructor(family: string, weight: number, reason?: unknown) {
    super(`Could not load ${family} ${weight}`)
    this.name = 'FontLoadError'
    this.family = family
    this.weight = weight
    this.reason = reason
  }
}

function cacheKey(family: string, weight: number): string {
  return `${family}@${weight}`
}

/**
 * Register the bytes with the browser so CSS can render this exact file.
 * Non-fatal: rendering never depends on it.
 */
function registerFontFace(family: string, weight: number, buffer: ArrayBuffer): void {
  const key = cacheKey(family, weight)
  if (registeredFaces.has(key)) return
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return

  try {
    const face = new FontFace(family, buffer, { weight: String(weight), style: 'normal' })
    face
      .load()
      .then((loaded) => {
        document.fonts.add(loaded)
        registeredFaces.add(key)
      })
      .catch(() => {
        /* preview-only nicety */
      })
  } catch {
    /* preview-only nicety */
  }
}

export function loadFont(family: string, weight: number): Promise<LoadedFont> {
  const key = cacheKey(family, weight)
  const existing = cache.get(key)
  if (existing) return existing

  const promise = (async (): Promise<LoadedFont> => {
    const url = `/api/font?family=${encodeURIComponent(family)}&weight=${weight}`
    let response: Response
    try {
      response = await fetch(url)
    } catch (error) {
      throw new FontLoadError(family, weight, error)
    }
    if (!response.ok) throw new FontLoadError(family, weight, `HTTP ${response.status}`)

    const buffer = await response.arrayBuffer()
    let font: opentype.Font
    try {
      font = opentype.parse(buffer)
    } catch (error) {
      throw new FontLoadError(family, weight, error)
    }

    registerFontFace(family, weight, buffer.slice(0))

    return {
      family,
      weight,
      font,
      kerning: parseKerning(buffer),
      metrics: getFontMetrics(font),
    }
  })()

  // A failed load must not poison the cache — the user may simply be offline.
  promise.catch(() => cache.delete(key))
  cache.set(key, promise)
  return promise
}

/** Load several fonts at once, de-duplicated by family+weight. */
export function loadFonts(requests: Array<{ family: string; weight: number }>): Promise<LoadedFont[]> {
  const unique = new Map<string, { family: string; weight: number }>()
  for (const request of requests) unique.set(cacheKey(request.family, request.weight), request)
  return Promise.all([...unique.values()].map(({ family, weight }) => loadFont(family, weight)))
}

export function isFontCached(family: string, weight: number): boolean {
  return cache.has(cacheKey(family, weight))
}
