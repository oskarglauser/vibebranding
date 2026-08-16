/**
 * Colour maths for brand specifications.
 *
 * Honest about its limits: the CMYK conversion here is the standard algebraic
 * approximation with no ICC profile behind it, so the guidelines label it as
 * such rather than presenting it as press-ready. Contrast uses real WCAG
 * relative luminance — the previous implementation used the NTSC luma formula
 * on gamma-encoded values while calling it "relative luminance", which picks
 * the wrong polarity for saturated mid-tones.
 */

export type RGB = { r: number; g: number; b: number }
export type CMYK = { c: number; m: number; y: number; k: number }

const HEX_PATTERN = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function isValidHex(value: string): boolean {
  return HEX_PATTERN.test(value.trim())
}

/** Normalise any accepted hex spelling to `#rrggbb`. */
export function normalizeHex(value: string, fallback = '#000000'): string {
  const match = HEX_PATTERN.exec(value.trim())
  if (!match) return fallback
  const digits = match[1]
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((character) => character + character)
          .join('')
      : digits
  return `#${full.toLowerCase()}`
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex)
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

/**
 * Algebraic RGB -> CMYK. No colour management: use it as a starting point for a
 * printer, not as a final specification.
 *
 * Neutrals are emitted as pure K. The naive formula turns near-black into a
 * four-colour build (#111827 -> C92 M79 Y0 K84), which is not a printable rich
 * black and would register badly on press.
 */
export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const red = r / 255
  const green = g / 255
  const blue = b / 255

  const k = 1 - Math.max(red, green, blue)
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 }

  const c = (1 - red - k) / (1 - k)
  const m = (1 - green - k) / (1 - k)
  const y = (1 - blue - k) / (1 - k)

  const round = (value: number) => Math.round(value * 100)
  const cmyk = { c: round(c), m: round(m), y: round(y), k: round(k) }

  // A near-neutral ink is specified as black only. The raw algebra turns a
  // blue-black like #111827 into C56 M38 Y0 K85, which is a heavy four-colour
  // build no printer wants for a logo: it needs perfect registration and still
  // prints muddy. Anything this dark and this close to grey is simply black.
  const isNeutral = Math.max(r, g, b) - Math.min(r, g, b) <= 36
  if (isNeutral) {
    return { c: 0, m: 0, y: 0, k: cmyk.k >= 85 ? 100 : cmyk.k }
  }
  return cmyk
}

export function hexToCmyk(hex: string): CMYK {
  return rgbToCmyk(hexToRgb(hex))
}

export function formatCmyk({ c, m, y, k }: CMYK): string {
  return `C${c} M${m} Y${y} K${k}`
}

export function formatRgb({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const channel = (value: number) => {
    const srgb = value / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Black or white, whichever a colour carries better. */
export function readableInk(background: string): string {
  return contrastRatio('#ffffff', background) >= contrastRatio('#000000', background)
    ? '#ffffff'
    : '#000000'
}

export type ContrastVerdict = {
  ratio: number
  /** Logos are graphics: WCAG asks for 3:1 on non-text contrast. */
  passesGraphics: boolean
  /** Small supporting text (a tagline) is held to the text threshold. */
  passesText: boolean
}

export function assessContrast(foreground: string, background: string): ContrastVerdict {
  const ratio = contrastRatio(foreground, background)
  return {
    ratio: Math.round(ratio * 100) / 100,
    passesGraphics: ratio >= 3,
    passesText: ratio >= 4.5,
  }
}

/** Lighten or darken a colour, for deriving a reversed variant. */
export function mixWith(hex: string, target: string, amount: number): string {
  const from = hexToRgb(hex)
  const to = hexToRgb(target)
  const blend = (a: number, b: number) => a + (b - a) * amount
  return rgbToHex({ r: blend(from.r, to.r), g: blend(from.g, to.g), b: blend(from.b, to.b) })
}

/**
 * Chroma, 0..1: how far a colour is from grey in absolute terms.
 *
 * Preferred over HSL saturation for deciding "is this effectively neutral",
 * because HSL saturation blows up at low lightness — #111827 scores 0.39
 * saturation despite being an ink that reads as black.
 */
export function chroma(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255
}

/** Saturation, 0..1, from the HSL model. */
export function saturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  if (max === min) return 0
  const lightness = (max + min) / 2
  return lightness > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
}

/**
 * A version of a brand colour that holds up on a dark background.
 *
 * Near-neutral colours reverse to white outright — that is what a designer does
 * with a black logo, and lifting an ink grey only far enough to clear a
 * contrast threshold leaves it looking washed out rather than deliberate.
 * Saturated colours keep their hue and are lightened only as far as they need.
 */
export function reversedVariant(hex: string, darkBackground: string): string {
  const normalized = normalizeHex(hex)

  // An ink or near-grey has no hue worth preserving.
  if (chroma(normalized) < 0.14) {
    return relativeLuminance(normalized) < relativeLuminance(darkBackground) + 0.25
      ? '#ffffff'
      : normalized
  }

  // Saturated colours are held to a firmer bar than the 4.5:1 text minimum, so
  // the mark reads as confident rather than merely legible.
  const target = 5.5
  if (contrastRatio(normalized, darkBackground) >= target) return normalized

  let best = '#ffffff'
  for (const amount of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85]) {
    const candidate = mixWith(normalized, '#ffffff', amount)
    if (contrastRatio(candidate, darkBackground) >= target) {
      best = candidate
      break
    }
  }
  return best
}
