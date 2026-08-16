/**
 * Symbol archetypes.
 *
 * Each archetype is a small, opinionated design with a couple of seeded
 * decisions — never a random pile of shapes. The rules that make the output read
 * as designed rather than generated:
 *
 *  - Stroke weight comes from the wordmark's stem width, so a mark beside a
 *    Light wordmark stays light and beside a Black wordmark stays heavy.
 *  - Letters are real outlines from the wordmark font at the wordmark's weight —
 *    never live <text> (which rasterised as Times New Roman in the old exports)
 *    and never a hardcoded bold.
 *  - Knockouts are true negative space via fill-rule="evenodd", not a white
 *    letter painted on top, so a mark works on any background colour.
 *  - Rotation is restricted to symmetric arrangements. Nothing is upside down.
 *
 * Authoring space is a 0..1 box, y down. The layout engine rescales on ink.
 */

import { createSeededRandom } from '../../utils/seedUtils'
import { shapeText, transformPathData } from '../shape'
import type { LoadedFont, SymbolArt } from '../types'
import {
  arcBand,
  box,
  circle,
  lens,
  mergeShapes,
  polygon,
  rect,
  ring,
  roundedRect,
  roundedRectOutline,
  round,
  unionBox,
  type Shape,
} from './primitives'

export type ArchetypeId =
  | 'monogram-circle'
  | 'monogram-square'
  | 'monogram-knockout'
  | 'monogram-bar'
  | 'monogram-slice'
  | 'monogram-bracket'
  | 'monogram-duo'
  | 'dot-grid'
  | 'concentric'
  | 'bars'
  | 'arc'
  | 'chevron'
  | 'petals'
  | 'stack'

/**
 * `suits` narrows an archetype to the letterforms it flatters. An empty list
 * means it works with anything.
 */
export const ARCHETYPES: Array<{
  id: ArchetypeId
  label: string
  usesLetter: boolean
  needsTwoInitials?: boolean
  suits?: LetterShape[]
}> = [
  { id: 'monogram-knockout', label: 'Knockout initial', usesLetter: true },
  { id: 'monogram-slice', label: 'Sliced initial', usesLetter: true },
  { id: 'monogram-duo', label: 'Interlocked initials', usesLetter: true, needsTwoInitials: true },
  // A ring flatters a letter that is not already round.
  { id: 'monogram-circle', label: 'Initial in a circle', usesLetter: true, suits: ['straight', 'diagonal', 'mixed'] },
  { id: 'monogram-square', label: 'Initial in a square', usesLetter: true, suits: ['round', 'diagonal', 'mixed'] },
  // Brackets need vertical edges to sit against.
  { id: 'monogram-bracket', label: 'Bracketed initial', usesLetter: true, suits: ['straight', 'round', 'mixed'] },
  { id: 'monogram-bar', label: 'Initial with accent', usesLetter: true },
  { id: 'concentric', label: 'Concentric', usesLetter: false },
  { id: 'dot-grid', label: 'Dot grid', usesLetter: false },
  { id: 'bars', label: 'Bars', usesLetter: false },
  { id: 'arc', label: 'Arcs', usesLetter: false },
  { id: 'chevron', label: 'Chevron', usesLetter: false },
  { id: 'petals', label: 'Petals', usesLetter: false },
  { id: 'stack', label: 'Stack', usesLetter: false },
]

export type SymbolContext = {
  /** The wordmark font — the mark borrows its weight and its letterforms. */
  font: LoadedFont
  /** First letter of the brand name. */
  initial: string
  /** Initials of the first two words, when the name has two. */
  initials?: string[]
  seed: string
}

/**
 * Broad shape of a capital, used to steer which archetypes get offered.
 *
 * A ring around a round O is redundant; a bracket around a straight I has
 * nothing to hold. Matching the device to the letterform is most of what makes
 * a monogram look considered rather than assembled, and it is one of the few
 * judgements that can be made reliably from the outline itself.
 */
export type LetterShape = 'round' | 'straight' | 'diagonal' | 'mixed'

const ROUND_LETTERS = new Set(['C', 'G', 'O', 'Q', 'S', 'U', 'D', 'J'])
const STRAIGHT_LETTERS = new Set(['E', 'F', 'H', 'I', 'L', 'T'])
const DIAGONAL_LETTERS = new Set(['A', 'K', 'M', 'N', 'V', 'W', 'X', 'Y', 'Z'])

export function classifyLetter(character: string): LetterShape {
  const upper = character.trim().slice(0, 1).toLocaleUpperCase()
  if (ROUND_LETTERS.has(upper)) return 'round'
  if (STRAIGHT_LETTERS.has(upper)) return 'straight'
  if (DIAGONAL_LETTERS.has(upper)) return 'diagonal'
  return 'mixed'
}

function solid(shape: Shape, evenodd = false): SymbolArt {
  const fillRule = evenodd ? ' fill-rule="evenodd"' : ''
  return { content: `<path d="${shape.d}"${fillRule}/>`, inkBox: shape.box }
}

/** Container + letter as one path, letter cut out as negative space. */
function knockout(container: Shape, letter: Shape | null): SymbolArt {
  if (!letter) return solid(container)
  return {
    content: `<path d="${container.d} ${letter.d}" fill-rule="evenodd"/>`,
    inkBox: container.box,
  }
}

/**
 * Stroke weight in unit-box terms.
 *
 * stemWidth / capHeight is the ratio that renders a stroke at exactly the
 * wordmark's stem thickness when the mark is set to one cap height. Clamped so
 * a hairline Thin or an ultra-heavy Black still yields a usable mark.
 */
export function strokeFor(font: LoadedFont, multiplier = 1): number {
  const ratio = font.metrics.stemWidth / font.metrics.capHeight
  return Math.min(Math.max(ratio * multiplier, 0.045), 0.3)
}

/**
 * Outline the brand initial, scaled by cap height (not ink height) so round
 * letters keep their natural overshoot and every letter reads at one size —
 * then centre it optically on its own ink.
 */
function letterShape(
  context: SymbolContext,
  targetCapHeight: number,
  cx: number,
  cy: number,
): Shape | null {
  const { font, initial } = context
  const character = initial.trim().slice(0, 1).toLocaleUpperCase()
  if (!character) return null

  const shaped = shapeText(font, character)
  if (!shaped.d) return null

  const scale = targetCapHeight / font.metrics.capHeight
  const inkWidth = (shaped.inkBox.x2 - shaped.inkBox.x1) * scale
  const inkHeight = (shaped.inkBox.y2 - shaped.inkBox.y1) * scale

  return {
    d: transformPathData(
      shaped.d,
      scale,
      cx - inkWidth / 2 - shaped.inkBox.x1 * scale,
      cy - inkHeight / 2 - shaped.inkBox.y1 * scale,
    ),
    box: box(cx - inkWidth / 2, cy - inkHeight / 2, cx + inkWidth / 2, cy + inkHeight / 2),
  }
}

/** Wrap a shape in a rotation. Used only for rotationally symmetric marks. */
function rotated(shape: Shape, degrees: number, cx: number, cy: number): string {
  return `<g transform="rotate(${round(degrees, 2)} ${round(cx)} ${round(cy)})"><path d="${shape.d}"/></g>`
}

type Builder = (context: SymbolContext, random: () => number) => SymbolArt | null

const builders: Record<ArchetypeId, Builder> = {
  'monogram-circle': (context, random) => {
    const stroke = strokeFor(context.font)
    const outlined = random() > 0.45
    const container = outlined ? ring(0.5, 0.5, 0.5, stroke) : circle(0.5, 0.5, 0.5)
    // A letter inside a container needs air: 44% of the diameter.
    return knockout(container, letterShape(context, 0.44, 0.5, 0.5))
  },

  'monogram-square': (context, random) => {
    const stroke = strokeFor(context.font)
    const radius = [0, 0.14, 0.26][Math.floor(random() * 3)]
    const outlined = random() > 0.45
    const container = outlined
      ? roundedRectOutline(0, 0, 1, 1, radius, stroke)
      : roundedRect(0, 0, 1, 1, radius)
    return knockout(container, letterShape(context, 0.46, 0.5, 0.5))
  },

  'monogram-knockout': (context, random) => {
    // Solid container with the letter cut clean out: reads as negative space at
    // any size and works on any background.
    const choice = random()
    const container =
      choice > 0.6 ? circle(0.5, 0.5, 0.5) : roundedRect(0, 0, 1, 1, choice > 0.3 ? 0.24 : 0.06)
    return knockout(container, letterShape(context, 0.5, 0.5, 0.5))
  },

  'monogram-slice': (context, random) => {
    // A band cut clean through the letter. One of the most reliable monogram
    // devices: it reads as deliberate craft at any size, needs no container,
    // and the negative space does the work rather than added decoration.
    const letter = letterShape(context, 0.92, 0.5, 0.5)
    if (!letter) return null

    const bandWidth = strokeFor(context.font, 0.55)
    const height = letter.box.y2 - letter.box.y1
    const width = letter.box.x2 - letter.box.x1
    // Slice below the middle: cutting exactly through the centre halves the
    // letter and reads as a mistake.
    const at = letter.box.y1 + height * (random() > 0.5 ? 0.62 : 0.38)
    const band = rect(letter.box.x1 - width * 0.15, at, width * 1.3, bandWidth)

    return {
      content: `<path d="${letter.d} ${band.d}" fill-rule="evenodd"/>`,
      inkBox: letter.box,
    }
  },

  'monogram-bracket': (context, random) => {
    // Two brackets holding the letter. Lighter than a full container, and it
    // keeps working when the letter is wide.
    const letter = letterShape(context, 0.74, 0.5, 0.5)
    if (!letter) return null

    const stroke = strokeFor(context.font)
    const gap = stroke * 1.4
    const armLength = random() > 0.5 ? 0.22 : 0.34
    const top = letter.box.y1 - stroke * 0.6
    const bottom = letter.box.y2 + stroke * 0.6
    const height = bottom - top

    const bracket = (x: number, facingRight: boolean): Shape => {
      const armWidth = height * armLength
      return mergeShapes([
        rect(x - (facingRight ? 0 : stroke), top, stroke, height),
        rect(facingRight ? x : x - armWidth, top, armWidth, stroke),
        rect(facingRight ? x : x - armWidth, bottom - stroke, armWidth, stroke),
      ])
    }

    const merged = mergeShapes([
      bracket(letter.box.x1 - gap - stroke, true),
      bracket(letter.box.x2 + gap + stroke, false),
      letter,
    ])
    return solid(merged, true)
  },

  'monogram-duo': (context, random) => {
    // Two initials overlapping, with the overlap knocked out so they interlock.
    // The classic device for a two-word name, and the crossing shape is what
    // makes it read as a mark rather than two letters side by side.
    const initials = (context.initials ?? [context.initial]).filter(Boolean)
    if (initials.length < 2) return null

    const capHeight = 0.86
    const first = letterShape({ ...context, initial: initials[0] }, capHeight, 0, 0.5)
    const second = letterShape({ ...context, initial: initials[1] }, capHeight, 0, 0.5)
    if (!first || !second) return null

    const firstWidth = first.box.x2 - first.box.x1
    const secondWidth = second.box.x2 - second.box.x1
    const overlap = Math.min(firstWidth, secondWidth) * (random() > 0.5 ? 0.3 : 0.2)
    const total = firstWidth + secondWidth - overlap

    const shift = (shape: Shape, dx: number): Shape => ({
      d: transformPathData(shape.d, 1, dx, 0),
      box: box(shape.box.x1 + dx, shape.box.y1, shape.box.x2 + dx, shape.box.y2),
    })

    const left = shift(first, -total / 2 + firstWidth / 2 + 0.5 - first.box.x1 - firstWidth / 2)
    const right = shift(second, total / 2 - secondWidth / 2 + 0.5 - second.box.x1 - secondWidth / 2)

    return {
      content: `<path d="${left.d} ${right.d}" fill-rule="evenodd"/>`,
      inkBox: box(0.5 - total / 2, first.box.y1, 0.5 + total / 2, first.box.y2),
    }
  },

  'monogram-bar': (context, random) => {
    const stroke = strokeFor(context.font)
    const letter = letterShape(context, 0.78, 0.5, 0.42)
    if (!letter) return null

    const gap = stroke * 0.9
    const width = letter.box.x2 - letter.box.x1
    const accent =
      random() > 0.5
        ? rect(letter.box.x1, letter.box.y2 + gap, width, stroke)
        : rect(letter.box.x1, letter.box.y1 - gap - stroke, width, stroke)

    return solid(mergeShapes([letter, accent]), true)
  },

  'dot-grid': (_context, random) => {
    const size = random() > 0.5 ? 3 : 2
    const gapRatio = 0.5
    // n dots plus (n-1) gaps span the unit box.
    const diameter = 1 / (size + gapRatio * (size - 1))
    const step = diameter * (1 + gapRatio)
    const radius = diameter / 2

    // Exactly one dot is accented, always at a structural position — the centre
    // of an odd grid, the leading corner of an even one. The accent is a ring
    // rather than a bigger dot: same footprint, so the grid stays even, and it
    // reads as a deliberate focal point instead of a sizing mistake.
    const accentIndex = size % 2 === 1 ? (size * size - 1) / 2 : 0
    const accentStroke = Math.max(radius * 0.42, 0.03)
    const shapes: Shape[] = []
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        const index = row * size + column
        const cx = radius + column * step
        const cy = radius + row * step
        shapes.push(index === accentIndex ? ring(cx, cy, radius, accentStroke) : circle(cx, cy, radius))
      }
    }
    return solid(mergeShapes(shapes), true)
  },

  concentric: (context, random) => {
    // Ring count is decided first and the geometry is fitted to it, rather than
    // stepping inward until the rings run out. Fitting the other way round
    // collapsed heavier weights to a single ring, which is just a circle.
    const count = random() > 0.5 ? 3 : 2
    const filledCentre = random() > 0.5

    // Distribute the radius across count rings plus their gaps, then cap the
    // stroke by what the wordmark's stem suggests.
    const gapRatio = 1.1
    const available = 0.5 - (filledCentre ? 0.06 : 0)
    const fitted = available / (count + gapRatio * (count - 1))
    const stroke = Math.min(strokeFor(context.font), fitted)
    const step = stroke * (1 + gapRatio)

    const shapes: Shape[] = []
    for (let i = 0; i < count; i++) shapes.push(ring(0.5, 0.5, 0.5 - i * step, stroke))
    if (filledCentre) shapes.push(circle(0.5, 0.5, Math.max(0.5 - count * step, stroke * 0.8)))

    return solid(mergeShapes(shapes), true)
  },

  bars: (context, random) => {
    const stroke = strokeFor(context.font, 1.6)
    const count = 3
    const gap = stroke * 0.8
    const totalHeight = count * stroke + (count - 1) * gap
    const top = (1 - totalHeight) / 2
    const staircase = random() > 0.45

    const shapes: Shape[] = []
    for (let i = 0; i < count; i++) {
      const y = top + i * (stroke + gap)
      const width = staircase ? 0.45 + (i / (count - 1)) * 0.55 : 1 - Math.abs(i - 1) * 0.3
      const x = staircase ? 0 : (1 - width) / 2
      shapes.push(roundedRect(x, y, width, stroke, stroke / 2))
    }
    return solid(mergeShapes(shapes))
  },

  arc: (context, random) => {
    const stroke = strokeFor(context.font, 1.15)
    const style = Math.floor(random() * 3)
    const shapes: Shape[] = []

    if (style === 0) {
      // Open ring with a terminal dot closing the gap.
      shapes.push(arcBand(0.5, 0.5, 0.5, stroke, 35, 325))
      shapes.push(circle(0.5, stroke / 2, stroke / 2))
    } else if (style === 1) {
      // Two opposed quarter arcs — a rotationally balanced mark.
      shapes.push(arcBand(0.5, 0.5, 0.5, stroke, 0, 90))
      shapes.push(arcBand(0.5, 0.5, 0.5, stroke, 180, 270))
    } else {
      // Nested quarters radiating from one corner, like a signal mark.
      shapes.push(arcBand(0.5, 1, 1, stroke, 0, 90))
      shapes.push(arcBand(0.5, 1, 0.6, stroke, 0, 90))
      shapes.push(circle(0.5, 1 - stroke / 2, stroke / 2))
    }
    return solid(mergeShapes(shapes))
  },

  chevron: (context, random) => {
    const stroke = strokeFor(context.font, 1.5)
    const armWidth = 0.42

    // A stroked V drawn as two quadrilaterals, so the joint stays crisp.
    const makeV = (x: number): Shape =>
      mergeShapes([
        polygon([
          [x, 0],
          [x + stroke, 0],
          [x + armWidth + stroke, 0.5],
          [x + armWidth, 0.5],
        ]),
        polygon([
          [x + armWidth + stroke, 0.5],
          [x + armWidth, 0.5],
          [x, 1],
          [x + stroke, 1],
        ]),
      ])

    const shapes = [makeV(0)]
    if (random() > 0.5) shapes.push(makeV(stroke * 2.2))
    return solid(mergeShapes(shapes))
  },

  petals: (_context, random) => {
    if (random() > 0.5) {
      // Four petals from two crossed vesicas. Narrow half-widths matter: at a
      // third of the height the union stops reading as petals and turns into a
      // plain diamond.
      const petal = lens(0.5, 0.5, 0.17, 0.5)
      return {
        content: `<path d="${petal.d}"/>${rotated(petal, 90, 0.5, 0.5)}`,
        inkBox: box(0, 0, 1, 1),
      }
    }

    // Three-fold rosette.
    const petal = lens(0.5, 0.29, 0.17, 0.29)
    const content = [0, 120, 240].map((angle) => rotated(petal, angle, 0.5, 0.5)).join('')
    // The arrangement is radially symmetric about the centre, so its ink is a
    // disc whose radius is the farthest petal point from the centre.
    const reach = 0.5 - petal.box.y1
    return {
      content,
      inkBox: box(0.5 - reach, 0.5 - reach, 0.5 + reach, 0.5 + reach),
    }
  },

  stack: (context, random) => {
    const stroke = strokeFor(context.font, 1.2)
    const offset = random() > 0.5 ? 0.22 : 0.3
    const size = 1 - offset
    const radius = random() > 0.5 ? size * 0.22 : 0
    const outlinedBack = random() > 0.4

    const back = outlinedBack
      ? roundedRectOutline(offset, 0, size, size, radius, stroke)
      : roundedRect(offset, 0, size, size, radius)
    const front = roundedRect(0, offset, size, size, radius)

    // evenodd: the overlap punches through, so the plates read as layered.
    return {
      content: `<path d="${back.d} ${front.d}" fill-rule="evenodd"/>`,
      inkBox: unionBox(back.box, front.box)!,
    }
  },
}

export function buildSymbol(archetype: ArchetypeId, context: SymbolContext): SymbolArt | null {
  const builder = builders[archetype]
  if (!builder) return null
  const random = createSeededRandom(`${context.seed}:${archetype}:${context.initial}`)
  try {
    return builder(context, random)
  } catch {
    return null
  }
}

/**
 * Archetypes worth offering for a given brand, best fit first.
 *
 * Letter marks need a letter, interlocks need two, and a device is only
 * offered when it flatters the letterform it has to work with. Ordering
 * matters: the picker shows these in sequence, so the strongest options for
 * this particular name land in the first row.
 */
export function availableArchetypes(context: {
  initial: string
  initials?: string[]
}): ArchetypeId[] {
  const initial = context.initial.trim()
  const hasInitial = initial.length > 0
  const hasTwo = (context.initials ?? []).filter(Boolean).length >= 2
  const shape = hasInitial ? classifyLetter(initial) : 'mixed'

  const suitable: ArchetypeId[] = []
  const rest: ArchetypeId[] = []

  for (const entry of ARCHETYPES) {
    if (entry.usesLetter && !hasInitial) continue
    if (entry.needsTwoInitials && !hasTwo) continue

    if (entry.suits && !entry.suits.includes(shape)) {
      // Still buildable, just not its best pairing: keep it, show it later.
      rest.push(entry.id)
    } else {
      suitable.push(entry.id)
    }
  }

  return [...suitable, ...rest]
}

export type SymbolCandidate = {
  archetype: ArchetypeId
  seed: string
  art: SymbolArt
}

/**
 * A spread of candidates to choose from. Showing several at once turns mark
 * selection from "reroll until something works" into an actual design choice.
 */
export function buildCandidates(context: SymbolContext, count: number): SymbolCandidate[] {
  const ids = availableArchetypes(context)
  const random = createSeededRandom(`${context.seed}:candidates`)
  const candidates: SymbolCandidate[] = []

  for (let index = 0; index < count; index++) {
    const archetype = ids[index % ids.length]
    const seed = `${context.seed}-${index}-${Math.floor(random() * 1e6).toString(36)}`
    const art = buildSymbol(archetype, { ...context, seed })
    if (art) candidates.push({ archetype, seed, art })
  }

  return candidates
}

/** Split a brand name into the initials a monogram can use. */
export function initialsFor(brandName: string): string[] {
  return brandName
    .trim()
    .split(/[\s&/-]+/)
    .filter((word) => /[a-z0-9]/i.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
}
