/**
 * Curated typeface catalogue.
 *
 * The previous list was 38 families with nothing but a weight array, so every
 * logo got the same default weight and the same tracking whether it was set in
 * a geometric sans or a high-contrast serif. Display type needs per-face
 * treatment: this catalogue carries the default weight, the optical tracking a
 * face wants at logo size, whether it survives at tagline size, and which
 * companion face to pair it with.
 *
 * Weight lists are verified against what the Google Fonts API actually serves —
 * the old UI offered weights (Inter 100/200/800/900 among them) that the
 * stylesheet never loaded, so the preview silently synthesised them while the
 * export used a different one.
 */

export type FontCategory = 'grotesk' | 'geometric' | 'humanist' | 'serif' | 'display' | 'condensed' | 'mono'

export type FontEntry = {
  family: string
  category: FontCategory
  /** Weights the Google Fonts API serves for this family. */
  weights: number[]
  /** Weight that shows the face at its best as a wordmark. */
  defaultWeight: number
  /**
   * Optical tracking at logo size, in em. Display type is set tighter than
   * body text; how much tighter depends on the face's natural fit.
   */
  defaultTracking: number
  /** Legible as a tagline at roughly a third of the wordmark's size. */
  taglineOk: boolean
  /** Companion faces for taglines, best first. */
  pairsWith: string[]
}

export const FONT_CATALOG: FontEntry[] = [
  // --- Grotesks: the workhorses -------------------------------------------
  { family: 'Inter', category: 'grotesk', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 600, defaultTracking: -0.025, taglineOk: true, pairsWith: ['Inter', 'Lora', 'JetBrains Mono'] },
  { family: 'Geist', category: 'grotesk', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 600, defaultTracking: -0.025, taglineOk: true, pairsWith: ['Geist', 'Inter'] },
  { family: 'Space Grotesk', category: 'grotesk', weights: [300, 400, 500, 600, 700], defaultWeight: 600, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Inter', 'Space Grotesk'] },
  { family: 'Work Sans', category: 'grotesk', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 600, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Work Sans', 'Lora'] },
  { family: 'Manrope', category: 'grotesk', weights: [200, 300, 400, 500, 600, 700, 800], defaultWeight: 700, defaultTracking: -0.03, taglineOk: true, pairsWith: ['Manrope', 'Inter'] },
  { family: 'Bricolage Grotesque', category: 'grotesk', weights: [200, 300, 400, 500, 600, 700, 800], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Inter'] },
  { family: 'Chivo', category: 'grotesk', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Chivo', 'Inter'] },
  { family: 'Roboto', category: 'grotesk', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Roboto'] },

  // --- Geometric ------------------------------------------------------------
  { family: 'Poppins', category: 'geometric', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 600, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Poppins', 'Lora'] },
  { family: 'Montserrat', category: 'geometric', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.015, taglineOk: true, pairsWith: ['Montserrat', 'Merriweather'] },
  { family: 'Outfit', category: 'geometric', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 600, defaultTracking: -0.025, taglineOk: true, pairsWith: ['Outfit', 'Inter'] },
  { family: 'DM Sans', category: 'geometric', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.03, taglineOk: true, pairsWith: ['DM Sans', 'Lora'] },
  { family: 'Figtree', category: 'geometric', weights: [300, 400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.025, taglineOk: true, pairsWith: ['Figtree'] },
  { family: 'Urbanist', category: 'geometric', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 600, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Urbanist', 'Inter'] },
  { family: 'Plus Jakarta Sans', category: 'geometric', weights: [200, 300, 400, 500, 600, 700, 800], defaultWeight: 700, defaultTracking: -0.025, taglineOk: true, pairsWith: ['Plus Jakarta Sans'] },
  { family: 'Sora', category: 'geometric', weights: [100, 200, 300, 400, 500, 600, 700, 800], defaultWeight: 600, defaultTracking: -0.025, taglineOk: true, pairsWith: ['Sora', 'Inter'] },
  { family: 'Gabarito', category: 'geometric', weights: [400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Gabarito', 'Inter'] },
  { family: 'Quicksand', category: 'geometric', weights: [300, 400, 500, 600, 700], defaultWeight: 600, defaultTracking: -0.01, taglineOk: true, pairsWith: ['Quicksand', 'Nunito Sans'] },

  // --- Humanist -------------------------------------------------------------
  { family: 'Nunito Sans', category: 'humanist', weights: [200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Nunito Sans'] },
  { family: 'Open Sans', category: 'humanist', weights: [300, 400, 500, 600, 700, 800], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Open Sans', 'Merriweather'] },
  { family: 'Lato', category: 'humanist', weights: [100, 300, 400, 700, 900], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Lato', 'Lora'] },
  { family: 'Epilogue', category: 'humanist', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 600, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Epilogue', 'Inter'] },
  { family: 'IBM Plex Sans', category: 'humanist', weights: [100, 200, 300, 400, 500, 600, 700], defaultWeight: 600, defaultTracking: -0.02, taglineOk: true, pairsWith: ['IBM Plex Sans', 'IBM Plex Mono'] },

  // --- Serifs ---------------------------------------------------------------
  { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.015, taglineOk: true, pairsWith: ['Inter', 'Lato'] },
  { family: 'Fraunces', category: 'serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 600, defaultTracking: -0.015, taglineOk: true, pairsWith: ['Inter', 'Work Sans'] },
  { family: 'Bodoni Moda', category: 'serif', weights: [400, 500, 600, 700, 800, 900], defaultWeight: 500, defaultTracking: -0.005, taglineOk: false, pairsWith: ['Inter', 'Lato'] },
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 500, 600, 700], defaultWeight: 600, defaultTracking: 0, taglineOk: false, pairsWith: ['Inter', 'Lato'] },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700], defaultWeight: 600, defaultTracking: -0.015, taglineOk: true, pairsWith: ['Lora', 'Inter'] },
  { family: 'Libre Baskerville', category: 'serif', weights: [400, 500, 600, 700], defaultWeight: 700, defaultTracking: -0.015, taglineOk: true, pairsWith: ['Inter', 'Work Sans'] },
  { family: 'Merriweather', category: 'serif', weights: [300, 400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Montserrat', 'Open Sans'] },
  { family: 'Spectral', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800], defaultWeight: 600, defaultTracking: -0.015, taglineOk: true, pairsWith: ['Inter', 'Spectral'] },
  { family: 'DM Serif Text', category: 'serif', weights: [400], defaultWeight: 400, defaultTracking: -0.015, taglineOk: false, pairsWith: ['DM Sans', 'Inter'] },
  { family: 'Instrument Serif', category: 'serif', weights: [400], defaultWeight: 400, defaultTracking: -0.01, taglineOk: false, pairsWith: ['Inter', 'Work Sans'] },

  // --- Display & condensed --------------------------------------------------
  { family: 'Archivo Black', category: 'display', weights: [400], defaultWeight: 400, defaultTracking: -0.02, taglineOk: false, pairsWith: ['Inter', 'Work Sans'] },
  { family: 'Anton', category: 'condensed', weights: [400], defaultWeight: 400, defaultTracking: 0, taglineOk: false, pairsWith: ['Inter', 'Work Sans'] },
  { family: 'Bebas Neue', category: 'condensed', weights: [400], defaultWeight: 400, defaultTracking: 0.02, taglineOk: false, pairsWith: ['Inter', 'Work Sans'] },
  { family: 'Oswald', category: 'condensed', weights: [200, 300, 400, 500, 600, 700], defaultWeight: 600, defaultTracking: 0.005, taglineOk: true, pairsWith: ['Inter', 'Lato'] },
  { family: 'Fjalla One', category: 'condensed', weights: [400], defaultWeight: 400, defaultTracking: 0.005, taglineOk: false, pairsWith: ['Inter', 'Lato'] },
  { family: 'Syne', category: 'display', weights: [400, 500, 600, 700, 800], defaultWeight: 700, defaultTracking: -0.01, taglineOk: false, pairsWith: ['Inter', 'Work Sans'] },
  { family: 'Special Gothic Expanded One', category: 'display', weights: [400], defaultWeight: 400, defaultTracking: -0.01, taglineOk: false, pairsWith: ['Inter', 'Work Sans'] },
  { family: 'Special Gothic Condensed One', category: 'display', weights: [400], defaultWeight: 400, defaultTracking: 0, taglineOk: false, pairsWith: ['Inter', 'Work Sans'] },
  { family: 'Red Hat Display', category: 'display', weights: [300, 400, 500, 600, 700, 800, 900], defaultWeight: 700, defaultTracking: -0.02, taglineOk: true, pairsWith: ['Red Hat Display', 'Inter'] },
  { family: 'Cal Sans', category: 'display', weights: [400], defaultWeight: 400, defaultTracking: -0.02, taglineOk: false, pairsWith: ['Inter', 'Work Sans'] },

  // --- Monospace ------------------------------------------------------------
  { family: 'JetBrains Mono', category: 'mono', weights: [100, 200, 300, 400, 500, 600, 700, 800], defaultWeight: 700, defaultTracking: -0.03, taglineOk: true, pairsWith: ['Inter', 'JetBrains Mono'] },
  { family: 'IBM Plex Mono', category: 'mono', weights: [100, 200, 300, 400, 500, 600, 700], defaultWeight: 600, defaultTracking: -0.02, taglineOk: true, pairsWith: ['IBM Plex Sans'] },
]

export const CATEGORY_LABELS: Record<FontCategory, string> = {
  grotesk: 'Grotesque',
  geometric: 'Geometric',
  humanist: 'Humanist',
  serif: 'Serif',
  display: 'Display',
  condensed: 'Condensed',
  mono: 'Monospace',
}

/** Order categories are offered in — most broadly useful first. */
export const CATEGORY_ORDER: FontCategory[] = [
  'grotesk',
  'geometric',
  'humanist',
  'serif',
  'display',
  'condensed',
  'mono',
]

const BY_FAMILY = new Map(FONT_CATALOG.map((entry) => [entry.family, entry]))

export const FONT_FAMILIES: string[] = FONT_CATALOG.map((entry) => entry.family)

export const DEFAULT_FONT = 'Inter'

export function getFont(family: string): FontEntry {
  return BY_FAMILY.get(family) ?? BY_FAMILY.get(DEFAULT_FONT)!
}

export const WEIGHT_LABELS: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
}

/** Clamp a weight to one the family actually ships. */
export function nearestWeight(family: string, weight: number): number {
  const { weights } = getFont(family)
  if (weights.includes(weight)) return weight
  return weights.reduce((best, candidate) =>
    Math.abs(candidate - weight) < Math.abs(best - weight) ? candidate : best,
  )
}

/** Faces that hold up at tagline size, with the family's own pairing first. */
export function taglineFontsFor(family: string): string[] {
  const entry = getFont(family)
  const preferred = entry.pairsWith.filter((candidate) => BY_FAMILY.has(candidate))
  const rest = FONT_CATALOG.filter(
    (candidate) => candidate.taglineOk && !preferred.includes(candidate.family),
  ).map((candidate) => candidate.family)
  return [...preferred, ...rest]
}

/** The companion face a wordmark should default its tagline to. */
export function defaultTaglineFont(family: string): string {
  return taglineFontsFor(family)[0] ?? DEFAULT_FONT
}
