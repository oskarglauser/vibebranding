/**
 * Ties design state to loaded fonts and produces the rendered lockup.
 *
 * One place computes the SVG; the preview shows it and the exporter ships it.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { loadFont } from '../engine/fontLoader'
import { layoutLogo } from '../engine/layout'
import { renderSvg } from '../engine/render'
import { buildSymbol } from '../engine/symbols/archetypes'
import type { LoadedFont, LogoSpec } from '../engine/types'
import {
  DEFAULT_STATE,
  decodeState,
  designReducer,
  encodeState,
  resolveColors,
  type DesignAction,
  type DesignState,
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
    const encoded = encodeState(state)
    try {
      window.localStorage.setItem(STORAGE_KEY, encoded)
    } catch {
      /* ignore */
    }
    // replaceState keeps the address bar shareable without adding history noise
    // on every keystroke.
    const url = encoded ? `${window.location.pathname}?${encoded}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [state])

  // --- derived design ------------------------------------------------------
  const symbolArt = useMemo(() => {
    if (!state.symbol || !wordmarkFont) return null
    return buildSymbol(state.symbol.archetype, {
      font: wordmarkFont,
      initial: state.brandName.trim().charAt(0) || 'A',
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
