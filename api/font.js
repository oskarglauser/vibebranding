/**
 * Google Fonts TTF proxy.
 *
 * GET /api/font?family=Inter&weight=600
 *   -> raw TrueType bytes for that exact static instance.
 *
 * Why this exists: the browser needs the actual font file twice over — once as
 * outlines (opentype.js, for true-vector rendering) and once as a FontFace (for
 * UI previews). Google's css2 endpoint serves woff2 to modern browsers, which
 * opentype.js cannot decode, so we ask for it without a User-Agent (which yields
 * TrueType) and hand the bytes back unchanged.
 *
 * Safety: the upstream host is pinned, inputs are charset/range validated, and
 * no request data is echoed into the response or the logs. Responses are
 * immutable and cached at the edge, so a given family+weight is fetched from
 * Google at most once per region.
 */

const GOOGLE_CSS = 'https://fonts.googleapis.com/css2'
const GSTATIC_HOST = 'fonts.gstatic.com'
const FAMILY_RE = /^[A-Za-z0-9][A-Za-z0-9 ]{0,49}$/
const VALID_WEIGHTS = new Set([100, 200, 300, 400, 500, 600, 700, 800, 900])
const FETCH_TIMEOUT_MS = 6000

function fail(res, status, code) {
  res.status(status).json({ error: code })
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return fail(res, 405, 'METHOD_NOT_ALLOWED')
  }

  const family = String(req.query.family ?? '').trim()
  const weight = Number(req.query.weight ?? 400)

  if (!FAMILY_RE.test(family)) return fail(res, 400, 'INVALID_FAMILY')
  if (!VALID_WEIGHTS.has(weight)) return fail(res, 400, 'INVALID_WEIGHT')

  try {
    const cssUrl = `${GOOGLE_CSS}?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weight}&display=swap`

    // No User-Agent header: Google then falls back to TrueType, which
    // opentype.js can parse. Any modern UA string would get us woff2.
    const cssRes = await fetchWithTimeout(cssUrl)
    if (!cssRes.ok) return fail(res, 502, 'FONT_CSS_UNAVAILABLE')
    const css = await cssRes.text()

    // Prefer a src entry explicitly marked truetype; fall back to the first url().
    const ttf = css.match(/url\((https:\/\/[^)]+)\)\s*format\('truetype'\)/)
    const any = ttf ?? css.match(/url\((https:\/\/[^)]+)\)/)
    if (!any) return fail(res, 502, 'FONT_FILE_NOT_FOUND')

    const fileUrl = new URL(any[1])
    if (fileUrl.protocol !== 'https:' || fileUrl.hostname !== GSTATIC_HOST) {
      return fail(res, 502, 'UNEXPECTED_FONT_HOST')
    }

    const fontRes = await fetchWithTimeout(fileUrl.toString())
    if (!fontRes.ok) return fail(res, 502, 'FONT_DOWNLOAD_FAILED')
    const bytes = Buffer.from(await fontRes.arrayBuffer())

    res.setHeader('Content-Type', 'font/ttf')
    res.setHeader('Content-Length', String(bytes.length))
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    return res.status(200).send(bytes)
  } catch (error) {
    const code = error?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR'
    return fail(res, 504, code)
  }
}
