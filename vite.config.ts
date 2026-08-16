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
 * Runs the real serverless handler (api/font.js) inside the dev server, so local
 * development exercises the same code that ships to Vercel instead of proxying
 * to production.
 */
function apiDevServer(): Plugin {
  return {
    name: 'gologotype-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/font', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const query: Record<string, string> = {}
        url.searchParams.forEach((value, key) => {
          query[key] = value
        })

        // Minimal Vercel-compatible response shim.
        const shim = {
          status(code: number) {
            res.statusCode = code
            return shim
          },
          setHeader(name: string, value: string) {
            res.setHeader(name, value)
            return shim
          },
          json(body: unknown) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
            return shim
          },
          send(body: Uint8Array | string) {
            res.end(body)
            return shim
          },
        }

        try {
          const { default: handler } = await server.ssrLoadModule('/api/font.js')
          await handler({ method: req.method, query }, shim)
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
