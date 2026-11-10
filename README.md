# GoLogotype

A logotype designer that produces real vector artwork. Type a brand name, pick a
style, choose a mark, and download a complete set of brand files.

Everything is built from font outlines and laid out on the typeface's cap
height, so the result is proportioned like a designed logo rather than text in a
box. What appears on screen is the exact file that lands in the download.

## What it produces

A ZIP containing:

- `logo/` the primary lockup, the wordmark alone, and the alternate stacking,
  each for light and dark backgrounds, as SVG and PNG at 1000px and 3000px
- `symbol/` the mark on its own
- `app-icon/` the mark on a solid tile
- `favicon/` 16, 32, 180 and 512px, plus SVG
- `brand-guidelines.html` variants, clear space, minimum size, colour and type
  specification, and usage rules
- `brand.json` the exact specification, including the symbol seed

Letters are converted to outlines, so no typeface needs to be installed to open,
print or edit the files.

## How it works

One rendering engine produces a single SVG string. The preview displays it, the
export writes it, and every PNG is rasterised from it, so the files cannot
disagree with each other.

- **Kerning** comes from the font's own GPOS table, including the Extension
  lookups that opentype.js cannot read.
- **Geometry** is measured in cap heights, so symbol size, tagline gap and clear
  space stay proportionally identical across typefaces.
- **Symbols** come from a library of hand-drawn mark templates, fitted to the
  brand's own initial as measured in the chosen typeface: they lean with its
  strokes and take their weight from the wordmark's stem.
- **Trademark symbols** follow typographic rules: the registered and trademark
  symbols hang from the cap line, the copyright symbol rests on the baseline.

## Development

```bash
npm install
npm run dev          # Vite on :3012, /api/font served by the same module the Worker uses
npm run dev:worker   # the real Worker in workerd, against a production build
```

```bash
npm run check   # lint, typecheck (app and Worker) and tests
npm run build   # production build to dist/
```

Open `/dev/gallery.html` while the dev server is running to see every mark
template rendered across typefaces, at favicon size and reversed.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, opentype.js, JSZip.

Hosted as a **Worker app** on Cloudflare (see `~/Sites/infra/INFRA.md`,
"Project types"): no database and no login, so it does not need the VPS. The
built SPA is served from Workers static assets, and a small Worker
(`worker/index.ts`) sits in front of it for:

- `/api/font`: proxies TrueType files from Google Fonts, limited to the
  families and weights in `src/constants/fonts.ts`, cached at the edge for a
  year, rate limited per IP on cache misses.
- `/health`: `{"ok":true}` for uptime checks.
- `www.gologotype.com` 301s to the apex, path and query intact.
- AI agents are reported to Appscope after the response.

### Deploy

Workers Builds deploys every push to `main` (build `npm run build`, deploy
`npx wrangler deploy`). By hand: `npm run deploy`.

The Worker is attached to `gologotype.com/*` and `www.gologotype.com/*` with
**Worker routes** rather than custom domains, so the cutover from Vercel never
touched DNS: removing the routes sends traffic back to whatever the DNS records
point at. Secrets: `npx wrangler secret put APPSCOPE_SECRET_KEY`.

### Analytics

Appscope (`appscope.glauser.com`): the tracking script in `index.html`, product
events from `src/analytics.ts`, AI agents from the Worker.

## Colour values

CMYK values in the guidelines are an uncalibrated algebraic conversion: a
starting point, not a press specification. Confirm colour with your printer
against a proof.

## Credits

Built by [Glauser Creative](https://glauser.com).
