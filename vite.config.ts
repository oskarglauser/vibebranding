import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = dirname(fileURLToPath(import.meta.url))

/**
 * Injects FAQPage structured data built from the same JSON the page renders, so
 * the markup and the rendered questions cannot drift apart.
 */
function faqStructuredData(): Plugin {
  return {
    name: 'gologotype-faq-jsonld',
    transformIndexHtml() {
      const items = JSON.parse(
        readFileSync(resolve(projectRoot, 'src/content/faq.json'), 'utf8'),
      ) as Array<{ question: string; answer: string }>

      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }

      return [
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify(jsonLd),
          injectTo: 'head' as const,
        },
      ]
    },
  }
}

/**
 * Serves /api/font in the dev server with the same module the Worker uses
 * (worker/font.ts), so local development exercises the code that ships
 * instead of proxying to production. Edge caching and rate limiting are the
 * Worker's job and are skipped here; `npm run dev:worker` runs the real thing.
 */
function apiDevServer(): Plugin {
  return {
    name: 'gologotype-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/font', async (req, res) => {
        try {
          const { parseFontRequest, fetchFont } = await server.ssrLoadModule('/worker/font.ts')
          const url = new URL(req.url ?? '/', 'http://localhost')
          const parsed = parseFontRequest(url.searchParams)
          const response: Response = parsed instanceof Response ? parsed : await fetchFont(parsed)
          res.statusCode = response.status
          response.headers.forEach((value, name) => res.setHeader(name, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'DEV_HANDLER_FAILED', message: String(error) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServer(), faqStructuredData()],
})
