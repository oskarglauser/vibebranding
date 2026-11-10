/**
 * Google Fonts TrueType proxy.
 *
 * GET /api/font?family=Inter&weight=600 -> raw TrueType bytes for that exact
 * static instance.
 *
 * The browser needs the actual font file twice over: once as outlines
 * (opentype.js, for true-vector rendering) and once as a FontFace (for the UI
 * previews). Google's css2 endpoint serves woff2 to modern browsers, which
 * opentype.js cannot decode, so we ask without a User-Agent (which yields
 * TrueType) and hand the bytes back unchanged.
 *
 * Pure fetch-in, Response-out, so the Worker and the Vite dev server run the
 * same code. Caching and rate limiting belong to the caller.
 *
 * Only families and weights in the app's own catalogue are served. The proxy
 * used to accept any family name matching a charset, which made it a free,
 * anonymous mirror of all of Google Fonts.
 */

import { FONT_CATALOG } from '../src/constants/fonts'

const GOOGLE_CSS = 'https://fonts.googleapis.com/css2'
const GSTATIC_HOST = 'fonts.gstatic.com'
const FETCH_TIMEOUT_MS = 6000
const YEAR = 31536000

const WEIGHTS_BY_FAMILY = new Map(FONT_CATALOG.map((entry) => [entry.family, new Set(entry.weights)]))

export type FontRequest = { family: string; weight: number }

function fail(status: number, code: string): Response {
  return Response.json({ error: code }, { status, headers: { 'cache-control': 'no-store' } })
}

/**
 * Validate the query against the catalogue. Returns the normalised request or
 * an error response, so the caller can build a cache key from clean values.
 */
export function parseFontRequest(params: URLSearchParams): FontRequest | Response {
  const family = (params.get('family') ?? '').trim()
  const weight = Number(params.get('weight') ?? 400)
  const weights = WEIGHTS_BY_FAMILY.get(family)
  if (!weights) return fail(400, 'UNKNOWN_FAMILY')
  if (!weights.has(weight)) return fail(400, 'UNSUPPORTED_WEIGHT')
  return { family, weight }
}

/**
 * Outbound fetch with a timeout. On Cloudflare the `cf` options let the edge
 * cache Google's responses too; Node ignores them.
 */
async function fetchUpstream(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    // Cloudflare-only request options; Node's fetch ignores the extra key.
    const init = { signal: controller.signal, cf: { cacheEverything: true, cacheTtl: 86400 } }
    return await fetch(url, init as RequestInit)
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchFont({ family, weight }: FontRequest): Promise<Response> {
  try {
    const cssUrl = `${GOOGLE_CSS}?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weight}&display=swap`

    // No User-Agent header: Google then falls back to TrueType, which
    // opentype.js can parse. Any modern UA string would get woff2.
    const cssResponse = await fetchUpstream(cssUrl)
    if (!cssResponse.ok) return fail(502, 'FONT_CSS_UNAVAILABLE')
    const css = await cssResponse.text()

    // Prefer a src entry explicitly marked truetype; fall back to the first url().
    const match =
      css.match(/url\((https:\/\/[^)]+)\)\s*format\('truetype'\)/) ?? css.match(/url\((https:\/\/[^)]+)\)/)
    if (!match) return fail(502, 'FONT_FILE_NOT_FOUND')

    const fileUrl = new URL(match[1])
    if (fileUrl.protocol !== 'https:' || fileUrl.hostname !== GSTATIC_HOST) {
      return fail(502, 'UNEXPECTED_FONT_HOST')
    }

    const fontResponse = await fetchUpstream(fileUrl.toString())
    if (!fontResponse.ok) return fail(502, 'FONT_DOWNLOAD_FAILED')
    const bytes = await fontResponse.arrayBuffer()

    // A woff2 here would mean Google changed its UA sniffing; opentype.js
    // would then fail in the browser with a far less useful error.
    const signature = new DataView(bytes).getUint32(0)
    if (signature === 0x774f4632 /* wOF2 */) return fail(502, 'UNEXPECTED_FONT_FORMAT')

    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': 'font/ttf',
        'cache-control': `public, max-age=${YEAR}, immutable`,
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (error) {
    const code = error instanceof Error && error.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR'
    return fail(504, code)
  }
}
