/**
 * Reports AI agents to Appscope (https://appscope.glauser.com).
 *
 * Agents like ChatGPT-User, GPTBot and ClaudeBot never run the page's tracking
 * script, so only the Worker can see them. Only requests whose user agent looks
 * like a bot are sent, after the response (ctx.waitUntil), so visitors never
 * wait. Appscope keeps the known AI agents and checks their IP against the
 * operator's published ranges; the IP is never stored. Without the
 * APPSCOPE_SECRET_KEY secret nothing is sent.
 */

const AGENTS_ENDPOINT = 'https://appscope.glauser.com/api/v1/agents'
const AI_AGENT =
  /bot|crawl|spider|gpt|claude|anthropic|perplexity|openai|cohere|mistral|duckassist|meta-external|bytespider|diffbot/i

export function reportAgent(
  request: Request,
  response: Response,
  env: { APPSCOPE_SECRET_KEY?: string },
  ctx: ExecutionContext,
): void {
  const key = env.APPSCOPE_SECRET_KEY
  const userAgent = request.headers.get('user-agent') ?? ''
  if (!key || !AI_AGENT.test(userAgent)) return

  ctx.waitUntil(
    fetch(AGENTS_ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        ua: userAgent,
        path: new URL(request.url).pathname,
        status: response.status,
        ip: request.headers.get('cf-connecting-ip'),
      }),
    })
      .then((res) => {
        if (!res.ok) console.error(`appscope: agent report returned ${res.status}`)
      })
      .catch((error: Error) => console.error(`appscope: agent report failed: ${error.message}`)),
  )
}
