/**
 * GoLogotype on Cloudflare Workers.
 *
 * The app is a static single-page build served from Workers static assets.
 * This Worker sits in front of it for four things only:
 *
 *   /api/font   the Google Fonts TrueType proxy (cached at the edge)
 *   /health     liveness for uptime checks
 *   www         301 to the canonical host
 *   AI agents   reported to Appscope after the response
 *
 * Everything else goes straight to the assets.
 */

import { reportAgent } from './appscope'
import { fetchFont, parseFontRequest } from './font'

interface Env {
  ASSETS: Fetcher
  APP_URL: string
  APPSCOPE_SECRET_KEY?: string
  FONT_LIMITER?: RateLimit
}

async function handleFont(request: Request, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { allow: 'GET, HEAD' } })
  }

  const parsed = parseFontRequest(url.searchParams)
  if (parsed instanceof Response) return parsed

  // One cache entry per family and weight, whatever else is on the query
  // string, so a cache-busting parameter cannot force a trip to Google.
  const cacheKey = new Request(
    `${url.origin}/api/font?family=${encodeURIComponent(parsed.family)}&weight=${parsed.weight}`,
  )
  const cache = caches.default
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  // Only misses are limited: a hit costs nothing, a miss costs two upstream
  // fetches. Per IP, per Cloudflare location, eventually consistent.
  if (env.FONT_LIMITER) {
    const { success } = await env.FONT_LIMITER.limit({ key: request.headers.get('cf-connecting-ip') ?? 'unknown' })
    if (!success) {
      return Response.json(
        { error: 'RATE_LIMITED' },
        { status: 429, headers: { 'cache-control': 'no-store', 'retry-after': '60' } },
      )
    }
  }

  const response = await fetchFont(parsed)
  if (response.ok) ctx.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const canonical = new URL(env.APP_URL)

    let response: Response
    if (url.hostname === `www.${canonical.hostname}`) {
      response = Response.redirect(`${canonical.origin}${url.pathname}${url.search}`, 301)
    } else if (url.pathname === '/health') {
      response = Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } })
    } else if (url.pathname === '/api/font') {
      response = await handleFont(request, url, env, ctx)
    } else {
      response = await env.ASSETS.fetch(request)
    }

    reportAgent(request, response, env, ctx)
    return response
  },
} satisfies ExportedHandler<Env>
