/**
 * Logo design state.
 *
 * A single reducer over one object, encoded into the URL so a design survives a
 * refresh and a shared link reproduces exactly what the sender saw. The old
 * implementation held 34 separate useState values, kept three shadow copies of
 * colours that silently overwrote each other, and persisted nothing — the Share
 * button sent a bare URL that rebuilt the default logo.
 */

import type { SizeStep, SymbolPlacement, TextCase, TrademarkKind } from '../engine/types'
import { isTemplateId } from '../engine/symbols/templates'
import { DEFAULT_FONT, defaultTaglineFont, getFont, nearestWeight } from '../constants/fonts'
import { normalizeHex } from '../utils/colorUtils'

export type SymbolChoice = {
  /** Id of a mark template. */
  template: string
  seed: string
}

export type DesignState = {
  brandName: string
  fontFamily: string
  fontWeight: number
  tracking: number
  textCase: TextCase
  trademark: TrademarkKind

  tagline: string
  taglineFontFamily: string
  taglineFontWeight: number
  taglineTracking: number
  taglineCase: TextCase
  taglineSize: SizeStep

  symbol: SymbolChoice | null
  symbolPlacement: Exclude<SymbolPlacement, 'none'>
  symbolSize: SizeStep
  /** How many times the user has asked for a different set of marks. */
  symbolShuffle: number

  color: string
  /** When set, the symbol departs from the single brand colour. */
  symbolColor: string | null
  taglineColor: string | null
}

export const DEFAULT_STATE: DesignState = {
  brandName: '',
  fontFamily: DEFAULT_FONT,
  fontWeight: getFont(DEFAULT_FONT).defaultWeight,
  tracking: getFont(DEFAULT_FONT).defaultTracking,
  textCase: 'normal',
  trademark: 'none',

  tagline: '',
  taglineFontFamily: defaultTaglineFont(DEFAULT_FONT),
  taglineFontWeight: 400,
  taglineTracking: 0,
  taglineCase: 'normal',
  taglineSize: 'md',

  symbol: null,
  symbolPlacement: 'left',
  symbolSize: 'md',
  symbolShuffle: 0,

  color: '#111827',
  symbolColor: null,
  taglineColor: null,
}

export type DesignAction =
  | { type: 'set'; patch: Partial<DesignState> }
  | { type: 'setFont'; family: string }
  | { type: 'setTaglineFont'; family: string }
  | { type: 'applyPreset'; preset: Partial<DesignState> }
  | { type: 'reset' }
  | { type: 'replace'; state: DesignState }

export function designReducer(state: DesignState, action: DesignAction): DesignState {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.patch }

    case 'setFont': {
      // Changing the face brings its own default weight and optical tracking —
      // one global tracking value cannot be right for both Bebas Neue and
      // Merriweather. The tagline follows its companion face unless the user
      // has already chosen one deliberately.
      const entry = getFont(action.family)
      const taglineWasDefault = state.taglineFontFamily === defaultTaglineFont(state.fontFamily)
      return {
        ...state,
        fontFamily: entry.family,
        fontWeight: entry.defaultWeight,
        tracking: entry.defaultTracking,
        taglineFontFamily: taglineWasDefault ? defaultTaglineFont(entry.family) : state.taglineFontFamily,
      }
    }

    case 'setTaglineFont':
      return {
        ...state,
        taglineFontFamily: action.family,
        taglineFontWeight: nearestWeight(action.family, state.taglineFontWeight),
      }

    case 'applyPreset':
      // A preset never overwrites what the user typed.
      return {
        ...state,
        ...action.preset,
        brandName: state.brandName,
        tagline: state.tagline,
      }

    case 'reset':
      return { ...DEFAULT_STATE, brandName: state.brandName, tagline: state.tagline }

    case 'replace':
      return action.state
  }
}

// --- URL encoding ----------------------------------------------------------

/**
 * Compact keys keep shared links short enough to paste anywhere.
 */
const KEY_MAP: Record<keyof DesignState, string> = {
  brandName: 'n',
  fontFamily: 'f',
  fontWeight: 'w',
  tracking: 't',
  textCase: 'c',
  trademark: 'm',
  tagline: 'g',
  taglineFontFamily: 'gf',
  taglineFontWeight: 'gw',
  taglineTracking: 'gt',
  taglineCase: 'gc',
  taglineSize: 'gs',
  symbol: 'y',
  symbolPlacement: 'p',
  symbolSize: 'z',
  symbolShuffle: 'ys',
  color: 'k',
  symbolColor: 'ks',
  taglineColor: 'kg',
}

export function encodeState(state: DesignState): string {
  const params = new URLSearchParams()
  for (const [key, short] of Object.entries(KEY_MAP) as Array<[keyof DesignState, string]>) {
    const value = state[key]
    if (value === null || value === undefined) continue
    if (value === DEFAULT_STATE[key]) continue

    if (key === 'symbol') {
      const symbol = value as SymbolChoice
      params.set(short, `${symbol.template}~${symbol.seed}`)
    } else {
      params.set(short, String(value))
    }
  }
  return params.toString()
}

const TEXT_CASES: TextCase[] = ['normal', 'uppercase']
const TRADEMARKS: TrademarkKind[] = ['none', 'r', 'c', 'tm']
const SIZES: SizeStep[] = ['sm', 'md', 'lg']

function pick<T extends string>(value: string | null, allowed: T[], fallback: T): T {
  return value !== null && (allowed as string[]).includes(value) ? (value as T) : fallback
}

function pickNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (value === null || !Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

/**
 * Decode a shared link. Every field is validated: a link is untrusted input,
 * and a bad value must degrade to the default rather than break rendering.
 */
export function decodeState(search: string): DesignState | null {
  const params = new URLSearchParams(search)
  if ([...params.keys()].length === 0) return null

  const get = (key: keyof DesignState) => params.get(KEY_MAP[key])

  const familyRaw = get('fontFamily')
  const family = familyRaw ? getFont(familyRaw).family : DEFAULT_STATE.fontFamily
  const taglineFamilyRaw = get('taglineFontFamily')
  const taglineFamily = taglineFamilyRaw ? getFont(taglineFamilyRaw).family : defaultTaglineFont(family)

  let symbol: SymbolChoice | null = null
  const symbolRaw = get('symbol')
  if (symbolRaw) {
    const [template, ...rest] = symbolRaw.split('~')
    const seed = rest.join('~')
    // The template id is checked against the registry rather than cast. A link
    // from before the library changed would otherwise decode into a mark that
    // cannot be built: the preview would quietly drop it while the exported
    // guidelines still described a symbol the package never contained.
    if (template && seed && isTemplateId(template) && /^[\w|-]{1,80}$/.test(seed)) {
      symbol = { template, seed }
    }
  }

  return {
    brandName: (get('brandName') ?? DEFAULT_STATE.brandName).slice(0, 60),
    fontFamily: family,
    fontWeight: nearestWeight(family, pickNumber(get('fontWeight'), getFont(family).defaultWeight, 100, 900)),
    tracking: pickNumber(get('tracking'), getFont(family).defaultTracking, -0.15, 0.5),
    textCase: pick(get('textCase'), TEXT_CASES, DEFAULT_STATE.textCase),
    trademark: pick(get('trademark'), TRADEMARKS, DEFAULT_STATE.trademark),

    tagline: (get('tagline') ?? DEFAULT_STATE.tagline).slice(0, 80),
    taglineFontFamily: taglineFamily,
    taglineFontWeight: nearestWeight(taglineFamily, pickNumber(get('taglineFontWeight'), 400, 100, 900)),
    taglineTracking: pickNumber(get('taglineTracking'), 0, -0.15, 0.5),
    taglineCase: pick(get('taglineCase'), TEXT_CASES, DEFAULT_STATE.taglineCase),
    taglineSize: pick(get('taglineSize'), SIZES, DEFAULT_STATE.taglineSize),

    symbol,
    symbolPlacement: pick(get('symbolPlacement'), ['left', 'above'] as const, DEFAULT_STATE.symbolPlacement),
    symbolSize: pick(get('symbolSize'), SIZES, DEFAULT_STATE.symbolSize),
    symbolShuffle: Math.round(pickNumber(get('symbolShuffle'), 0, 0, 9999)),

    color: normalizeHex(get('color') ?? DEFAULT_STATE.color, DEFAULT_STATE.color),
    symbolColor: get('symbolColor') ? normalizeHex(get('symbolColor')!, DEFAULT_STATE.color) : null,
    taglineColor: get('taglineColor') ? normalizeHex(get('taglineColor')!, DEFAULT_STATE.color) : null,
  }
}

/** Resolved colours: one brand colour unless a part has been overridden. */
export function resolveColors(state: DesignState) {
  return {
    wordmark: state.color,
    symbol: state.symbolColor ?? state.color,
    tagline: state.taglineColor ?? state.color,
  }
}
