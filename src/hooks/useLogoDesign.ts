/**
 * Ties design state to loaded fonts and produces the rendered lockup.
 *
 * One place computes the SVG; the preview shows it and the exporter ships it.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { loadFont } from '../engine/fontLoader'
import { layoutLogo } from '../engine/layout'
import { renderSvg } from '../engine/render'
import { buildMark } from '../engine/symbols/compose'
import { initialsFor } from '../engine/symbols/select'
import { templateById } from '../engine/symbols/templates'
import type { LoadedFont, LogoSpec } from '../engine/types'
import {
  DEFAULT_STATE,
  decodeState,
  designReducer,
  encodeState,
  resolveColors,
  type DesignAction,
  type DesignState,
  OWN_KEYS,
} from '../state/logoSpec'

const STORAGE_KEY = 'gologotype:design'

function loadInitialState(): DesignState {
  if (typeof window === 'undefined') return DEFAULT_STATE

  // A shared link always wins over whatever this browser was last working on.
  const fromUrl = decodeState(window.location.search)
  if (fromUrl) return fromUrl

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const restored = decodeState(stored)
      if (restored) return restored
    }
  } catch {
    /* private browsing, quota, etc. */
  }
  return DEFAULT_STATE
}

export type FontStatus = 'idle' | 'loading' | 'ready' | 'error'

export function useLogoDesign() {
  const [state, dispatch] = useReducer(designReducer, undefined, loadInitialState)
  const [wordmarkFont, setWordmarkFont] = useState<LoadedFont | null>(null)
  const [taglineFont, setTaglineFont] = useState<LoadedFont | null>(null)
  const [status, setStatus] = useState<FontStatus>('idle')
  const requestRef = useRef(0)

  // --- font loading --------------------------------------------------------
  useEffect(() => {
    const request = ++requestRef.current
    setStatus('loading')

    loadFont(state.fontFamily, state.fontWeight)
      .then((font) => {
        if (requestRef.current !== request) return
        setWordmarkFont(font)
        setStatus('ready')
      })
      .catch(() => {
        if (requestRef.current !== request) return
        setStatus('error')
      })
  }, [state.fontFamily, state.fontWeight])

  useEffect(() => {
    if (!state.tagline.trim()) {
      setTaglineFont(null)
      return
    }
    let active = true
    loadFont(state.taglineFontFamily, state.taglineFontWeight)
      .then((font) => {
        if (active) setTaglineFont(font)
      })
      .catch(() => {
        if (active) setTaglineFont(null)
      })
    return () => {
      active = false
    }
  }, [state.tagline, state.taglineFontFamily, state.taglineFontWeight])

  // --- persistence ---------------------------------------------------------
  useEffect(() => {
    // Debounced: Safari and Firefox throw a SecurityError once replaceState is
    // called more than ~100 times in 10 seconds, which a dragged slider or
    // colour picker reaches easily — and an uncaught throw blanks the page.
    const timer = window.setTimeout(() => {
      const encoded = encodeState(state)
      try {
        window.localStorage.setItem(STORAGE_KEY, encoded)
      } catch {
        /* storage blocked or full: the URL still carries the design */
      }
      try {
        // Keep parameters that are not ours (utm_*, ref) rather than stripping
        // them from the address bar.
        const params = new URLSearchParams(encoded)
        const ours = new Set(params.keys())
        new URLSearchParams(window.location.search).forEach((value, key) => {
          if (!ours.has(key) && !OWN_KEYS.has(key)) params.append(key, value)
        })
        const query = params.toString()
        window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
      } catch {
        /* rate-limited by the browser: the next change will write it */
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [state])

  // --- derived design ------------------------------------------------------
  const symbolArt = useMemo(() => {
    if (!state.symbol || !wordmarkFont) return null
    const template = templateById(state.symbol.template)
    if (!template) return null
    const initials = initialsFor(state.brandName)
    return buildMark(template, {
      font: wordmarkFont,
      initial: initials[0] || 'A',
      initials,
      seed: state.symbol.seed,
    })
  }, [state.symbol, state.brandName, wordmarkFont])

  const spec: LogoSpec | null = useMemo(() => {
    if (!wordmarkFont) return null
    return {
      brandName: state.brandName.trim() || 'Your Brand',
      fontFamily: state.fontFamily,
      fontWeight: state.fontWeight,
      tracking: state.tracking,
      textCase: state.textCase,
      trademark: state.trademark,
      tagline: state.tagline,
      taglineFontFamily: state.taglineFontFamily,
      taglineFontWeight: state.taglineFontWeight,
      taglineTracking: state.taglineTracking,
      taglineCase: state.taglineCase,
      taglineSize: state.taglineSize,
      symbol: symbolArt,
      symbolPlacement: symbolArt ? state.symbolPlacement : 'none',
      symbolSize: state.symbolSize,
      colors: resolveColors(state),
    }
  }, [state, wordmarkFont, symbolArt])

  const layout = useMemo(() => {
    if (!spec || !wordmarkFont) return null
    return layoutLogo({ spec, wordmarkFont, taglineFont })
  }, [spec, wordmarkFont, taglineFont])

  const svg = useMemo(() => (layout ? renderSvg(layout, { targetWidth: 1200 }).svg : null), [layout])

  const shareUrl = useMemo(() => {
    const encoded = encodeState(state)
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}${window.location.pathname}${encoded ? `?${encoded}` : ''}`
  }, [state])

  const set = useCallback((patch: Partial<DesignState>) => dispatch({ type: 'set', patch }), [])
  const run = useCallback((action: DesignAction) => dispatch(action), [])

  return { state, set, dispatch: run, wordmarkFont, taglineFont, status, spec, layout, svg, shareUrl }
}
