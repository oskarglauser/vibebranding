# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

GoLogotype is a logotype designer. The user types a brand name, picks a
typeface, an optional symbol and tagline, and downloads a brand package of SVG
and PNG files plus HTML brand guidelines.

## The one rule that matters

**There is a single renderer.** `src/engine/` turns state into one SVG string.
The preview shows that string, the export writes that string, and every PNG is
rasterised from it. If you find yourself computing a position, a size or a
spacing anywhere else, that is a bug: it will drift from the preview.

The previous version had three renderers (CSS preview, canvas PNG, server-side
SVG) that disagreed on tracking, trademark size and tagline placement. Do not
reintroduce a second one.

## Architecture

```
api/font.js            Google Fonts TTF proxy (the only backend)
src/engine/            Rendering engine
  kerning.ts           GPOS pair kerning, including Extension lookups
  metrics.ts           Cap height, x-height, stem width from the font file
  fontLoader.ts        Fetch + parse + cache; registers the same bytes as a FontFace
  shape.ts             Text to outlines, tracking, trademark placement
  layout.ts            Lockup geometry (the only place with design constants)
  render.ts            SVG serialisation and rasterisation
  symbols/             Symbol archetypes and geometry primitives
src/export/            Brand package: asset plan, guidelines document, ZIP
src/state/             Design state, URL encoding, presets
src/components/        Preview, symbol picker, controls, FAQ
dev/gallery.html       Dev-only visual harness for judging output by eye
```

### Coordinate system

Layout space is **em units of the wordmark font**, baseline at y = 0, y down.
Design constants are multiples of **cap height**, never font size: two faces at
the same px size can differ 30% in cap height, so font-size geometry drifts
between typefaces. See `LAYOUT_RULES` in `src/engine/layout.ts`.

### Fonts

`api/font.js` requests `fonts.googleapis.com/css2` with no User-Agent, which
makes Google serve TrueType rather than woff2 (opentype.js cannot decode woff2).
The same bytes are parsed for outlines and registered as a `FontFace`, so the
preview can never show a different weight from the export.

`src/constants/fonts.ts` carries per-typeface metadata: verified weight lists,
default weight, optical tracking, whether the face survives at tagline size, and
companion faces. Weight lists are verified against the API; do not add a weight
without checking it is served.

### Kerning

opentype.js cannot read GPOS lookup type 9 (Extension), which is where most
Google Fonts keep their kern feature, so `font.getKerningValue()` returns 0 for
Inter, Montserrat and others. `src/engine/kerning.ts` parses the table directly.

## Commands

```bash
npm run dev        # Vite, with api/font.js served by dev middleware
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run test       # Vitest
npm run check      # lint + typecheck + test
```

The dev server runs the real serverless handler, so local development exercises
the same code that ships. Do not add a proxy to production.

## Testing

`test/` runs against committed TrueType fixtures (`test/fixtures/*.ttf`) so the
engine is testable offline. Add a case there when changing metrics, shaping,
layout or colour maths.

Visual checks that tests cannot make: run `npm run dev` and open
`/dev/gallery.html` to see every archetype across weights and typefaces.

## Conventions

- No em dashes in user-facing copy.
- User-facing colour input is validated before it reaches markup (`safeColor`).
- FAQ content lives in `src/content/faq.json`; the page and the JSON-LD both
  read it, so they cannot drift.
