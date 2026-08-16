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
- **Symbols** are built from designed archetypes with stroke weights derived
  from the wordmark's stem width, not assembled from random shapes.
- **Trademark symbols** follow typographic rules: the registered and trademark
  symbols hang from the cap line, the copyright symbol rests on the baseline.

## Development

```bash
npm install
npm run dev
```

The dev server runs the real serverless font handler, so local development
exercises the code that ships.

```bash
npm run check   # lint, typecheck and tests
npm run build   # production build
```

Open `/dev/gallery.html` while the dev server is running to see every symbol
archetype rendered across typefaces and weights.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, opentype.js, JSZip. One Vercel
serverless function proxies TrueType files from Google Fonts.

## Colour values

CMYK values in the guidelines are an uncalibrated algebraic conversion: a
starting point, not a press specification. Confirm colour with your printer
against a proof.

## Credits

Built by [Glauser Creative](https://glauser.com).
