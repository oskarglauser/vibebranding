/**
 * GoLogotype — logotype designer.
 *
 * The whole app is a thin shell over the rendering engine: state in, one SVG
 * out, and the export ships that same SVG. Nothing here re-implements layout.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlignLeft,
  Check,
  Download,
  Link2,
  Loader2,
  Moon,
  Palette,
  RotateCcw,
  Shapes,
  Sparkles,
  Sun,
  Type,
} from 'lucide-react'

import { LogoPreview, type PreviewBackground } from './components/LogoPreview'
import { SymbolPicker } from './components/SymbolPicker'
import { Panel, RangeControl, SegmentedControl, Select, TextInput } from './components/controls'
import { Faq } from './components/Faq'
import { useLogoDesign } from './hooks/useLogoDesign'
import { BRAND_COLORS, PRESETS } from './state/presets'
import { DEFAULT_STATE } from './state/logoSpec'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  FONT_CATALOG,
  WEIGHT_LABELS,
  getFont,
  nearestWeight,
  taglineFontsFor,
} from './constants/fonts'
import { buildBrandPackage, deriveColors } from './export/package'
import { layoutLogo } from './engine/layout'
import { renderSvg } from './engine/render'
import { assessContrast, normalizeHex, reversedVariant } from './utils/colorUtils'
import { cn } from './lib/utils'
import type { LogoSpec } from './engine/types'

const DARK_BG = '#0b0d12'
const LIGHT_BG = '#ffffff'

type PanelId = 'wordmark' | 'symbol' | 'tagline' | 'color'

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10)
}

export default function App() {
  const { state, set, dispatch, wordmarkFont, taglineFont, status, spec, svg, shareUrl } =
    useLogoDesign()

  const [openPanel, setOpenPanel] = useState<PanelId | null>('wordmark')
  const [background, setBackground] = useState<PreviewBackground>('light')
  const [batchSeed, setBatchSeed] = useState(() => randomSeed())
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: 'ok' | 'error' } | null>(null)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem('gologotype:theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const toastTimer = useRef<number | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem('gologotype:theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const notify = useCallback((message: string, tone: 'ok' | 'error' = 'ok') => {
    setToast({ message, tone })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
  }, [])

  const fontEntry = getFont(state.fontFamily)
  const colors = useMemo(() => deriveColors(
    { ...(spec ?? ({} as LogoSpec)), colors: { wordmark: state.color, tagline: state.taglineColor ?? state.color, symbol: state.symbolColor ?? state.color } } as LogoSpec,
    LIGHT_BG,
    DARK_BG,
  ), [spec, state.color, state.symbolColor, state.taglineColor])

  // The reversed preview uses the same derived palette the export will use, so
  // what you check on screen is what lands in the ZIP.
  const reversedSvg = useMemo(() => {
    if (!spec || !wordmarkFont) return null
    const layout = layoutLogo({ spec: { ...spec, colors: colors.reversed }, wordmarkFont, taglineFont })
    return renderSvg(layout, {
      targetWidth: 1200,
      background: 'dark',
      backgroundColors: { light: LIGHT_BG, dark: DARK_BG },
    }).svg
  }, [spec, wordmarkFont, taglineFont, colors])

  const symbolOnlySvg = useMemo(() => {
    if (!spec || !wordmarkFont || !spec.symbol) return null
    const layout = layoutLogo({
      spec: {
        ...spec,
        brandName: '',
        tagline: '',
        symbolPlacement: 'left',
        colors: background === 'dark' ? colors.reversed : colors.primary,
      },
      wordmarkFont,
      taglineFont: null,
    })
    return renderSvg(layout, { targetWidth: 64, square: true, paddingCaps: 0.1 }).svg
  }, [spec, wordmarkFont, colors, background])

  const contrast = useMemo(
    () => assessContrast(state.color, background === 'dark' ? DARK_BG : LIGHT_BG),
    [state.color, background],
  )

  const handlePreset = useCallback(
    (presetId: string) => {
      const preset = PRESETS.find((entry) => entry.id === presetId)
      if (!preset) return
      dispatch({
        type: 'applyPreset',
        preset: {
          ...preset.patch,
          symbol: state.symbol ? { archetype: preset.symbolArchetype, seed: state.symbol.seed } : null,
        },
      })
    },
    [dispatch, state.symbol],
  )

  const handleSurprise = useCallback(() => {
    const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)]
    const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)]
    const seed = randomSeed()
    setBatchSeed(seed)
    dispatch({
      type: 'applyPreset',
      preset: {
        ...preset.patch,
        color: color.hex,
        symbolColor: null,
        taglineColor: null,
        symbol: { archetype: preset.symbolArchetype, seed },
        symbolPlacement: Math.random() > 0.35 ? 'left' : 'above',
      },
    })
    notify(`Applied "${preset.name}" in ${color.name}`)
  }, [dispatch, notify])

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      notify('Link copied. It opens this exact design')
    } catch {
      notify('Could not copy the link', 'error')
    }
  }, [shareUrl, notify])

  const handleExport = useCallback(async () => {
    if (!spec || !wordmarkFont || exporting) return
    if (!state.brandName.trim()) {
      notify('Enter a brand name first', 'error')
      return
    }

    setExporting(true)
    setProgress({ done: 0, total: 1 })
    try {
      const { blob, filename } = await buildBrandPackage(
        {
          spec: { ...spec, brandName: state.brandName.trim() },
          wordmarkFont,
          taglineFont,
          symbolRecipe: state.symbol,
          lightBackground: LIGHT_BG,
          darkBackground: DARK_BG,
        },
        (update) => setProgress({ done: update.done, total: update.total }),
      )

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.append(link)
      link.click()
      link.remove()
      // Give the browser a moment to start the download before revoking.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
      notify('Brand package downloaded')
    } catch (error) {
      console.error(error)
      notify(error instanceof Error ? error.message : 'Export failed', 'error')
    } finally {
      setExporting(false)
      setProgress(null)
    }
  }, [spec, wordmarkFont, taglineFont, state.brandName, state.symbol, exporting, notify])

  // ⌘/Ctrl + Enter downloads, the way a save shortcut would.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void handleExport()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleExport])

  const togglePanel = (id: PanelId) => setOpenPanel((current) => (current === id ? null : id))

  const fontOptions = useMemo(
    () =>
      CATEGORY_ORDER.flatMap((category) =>
        FONT_CATALOG.filter((entry) => entry.category === category).map((entry) => ({
          value: entry.family,
          label: entry.family,
          group: CATEGORY_LABELS[category],
        })),
      ),
    [],
  )

  const taglineOptions = useMemo(
    () => taglineFontsFor(state.fontFamily).map((family) => ({ value: family, label: family })),
    [state.fontFamily],
  )

  const weightOptions = useMemo(
    () => fontEntry.weights.map((weight) => ({ value: String(weight), label: WEIGHT_LABELS[weight] ?? String(weight) })),
    [fontEntry],
  )

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-tight">GoLogotype</span>
            <span className="hidden text-xs text-slate-500 sm:inline dark:text-slate-400">
              Real vector logotypes, in a minute
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDark((value) => !value)}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        <h1 className="sr-only">Free logotype generator with true vector SVG and PNG brand assets</h1>

        <main className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-12">
          {/* Controls ------------------------------------------------------ */}
          <div className="order-2 lg:order-1">
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Start from a style</span>
                <button
                  type="button"
                  onClick={handleSurprise}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <Sparkles className="h-3 w-3" />
                  Surprise me
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESETS.map((preset) => {
                  // A preset counts as active only when every value it sets is
                  // still in place. Matching on the typeface alone marked two
                  // presets active at once, since several share a face.
                  const active = (Object.keys(preset.patch) as Array<keyof typeof preset.patch>).every(
                    (key) => state[key] === preset.patch[key],
                  )
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePreset(preset.id)}
                      title={preset.description}
                      aria-pressed={active}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs font-medium transition',
                        active
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                          : 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500',
                      )}
                    >
                      {preset.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <TextInput
              label="Brand name"
              placeholder="Enter your brand name"
              value={state.brandName}
              maxLength={60}
              autoFocus
              onChange={(event) => set({ brandName: event.target.value })}
            />

            <div className="mt-5 rounded-xl border border-slate-200 px-4 dark:border-slate-800">
              <Panel
                id="wordmark"
                title="Typeface"
                icon={<Type className="h-4 w-4 text-slate-400" />}
                open={openPanel === 'wordmark'}
                onToggle={() => togglePanel('wordmark')}
              >
                <Select
                  label="Font"
                  value={state.fontFamily}
                  options={fontOptions}
                  onChange={(family) => dispatch({ type: 'setFont', family })}
                  hint={`${CATEGORY_LABELS[fontEntry.category]} · tracking and weight set to suit this face`}
                />
                <Select
                  label="Weight"
                  value={String(state.fontWeight)}
                  options={weightOptions}
                  onChange={(weight) => set({ fontWeight: Number(weight) })}
                />
                <SegmentedControl
                  label="Case"
                  value={state.textCase}
                  onChange={(textCase) => set({ textCase })}
                  options={[
                    { value: 'normal', label: 'Aa' },
                    { value: 'uppercase', label: 'AA' },
                  ]}
                />
                <RangeControl
                  label="Tracking"
                  value={Math.round(state.tracking * 1000)}
                  min={-60}
                  max={150}
                  step={5}
                  onChange={(value) => set({ tracking: value / 1000 })}
                  format={(value) => `${value > 0 ? '+' : ''}${value}`}
                />
                <Select
                  label="Trademark"
                  value={state.trademark}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'r', label: '® Registered' },
                    { value: 'tm', label: '™ Trademark' },
                    { value: 'c', label: '© Copyright' },
                  ]}
                  onChange={(trademark) => set({ trademark: trademark as typeof state.trademark })}
                />
              </Panel>

              <Panel
                id="symbol"
                title="Symbol"
                icon={<Shapes className="h-4 w-4 text-slate-400" />}
                open={openPanel === 'symbol'}
                onToggle={() => togglePanel('symbol')}
              >
                <SymbolPicker
                  font={wordmarkFont}
                  initial={state.brandName.trim().charAt(0)}
                  color={state.symbolColor ?? state.color}
                  batchSeed={batchSeed}
                  selected={state.symbol}
                  onSelect={(symbol) => set({ symbol })}
                  onShuffle={() => setBatchSeed(randomSeed())}
                />
                {state.symbol && (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <SegmentedControl
                      label="Placement"
                      value={state.symbolPlacement}
                      onChange={(symbolPlacement) => set({ symbolPlacement })}
                      options={[
                        { value: 'left', label: 'Beside' },
                        { value: 'above', label: 'Above' },
                      ]}
                    />
                    <SegmentedControl
                      label="Size"
                      value={state.symbolSize}
                      onChange={(symbolSize) => set({ symbolSize })}
                      options={[
                        { value: 'sm', label: 'S' },
                        { value: 'md', label: 'M' },
                        { value: 'lg', label: 'L' },
                      ]}
                    />
                  </div>
                )}
              </Panel>

              <Panel
                id="tagline"
                title="Tagline"
                icon={<AlignLeft className="h-4 w-4 text-slate-400" />}
                open={openPanel === 'tagline'}
                onToggle={() => togglePanel('tagline')}
              >
                <TextInput
                  label="Tagline"
                  placeholder="Optional, e.g. Design &amp; Strategy"
                  value={state.tagline}
                  maxLength={80}
                  onChange={(event) => set({ tagline: event.target.value })}
                />
                {state.tagline.trim() && (
                  <>
                    <Select
                      label="Font"
                      value={state.taglineFontFamily}
                      options={taglineOptions}
                      onChange={(family) => dispatch({ type: 'setTaglineFont', family })}
                      hint="Companion faces for this typeface, best match first"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Weight"
                        value={String(state.taglineFontWeight)}
                        options={getFont(state.taglineFontFamily).weights.map((weight) => ({
                          value: String(weight),
                          label: WEIGHT_LABELS[weight] ?? String(weight),
                        }))}
                        onChange={(weight) =>
                          set({ taglineFontWeight: nearestWeight(state.taglineFontFamily, Number(weight)) })
                        }
                      />
                      <SegmentedControl
                        label="Size"
                        value={state.taglineSize}
                        onChange={(taglineSize) => set({ taglineSize })}
                        options={[
                          { value: 'sm', label: 'S' },
                          { value: 'md', label: 'M' },
                          { value: 'lg', label: 'L' },
                        ]}
                      />
                    </div>
                    <SegmentedControl
                      label="Case"
                      value={state.taglineCase}
                      onChange={(taglineCase) => set({ taglineCase })}
                      options={[
                        { value: 'normal', label: 'Aa' },
                        { value: 'uppercase', label: 'AA' },
                      ]}
                    />
                  </>
                )}
              </Panel>

              <Panel
                id="color"
                title="Colour"
                icon={<Palette className="h-4 w-4 text-slate-400" />}
                open={openPanel === 'color'}
                onToggle={() => togglePanel('color')}
              >
                <div className="grid grid-cols-8 gap-2">
                  {BRAND_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.name}
                      aria-label={color.name}
                      aria-pressed={normalizeHex(state.color) === color.hex}
                      onClick={() => set({ color: color.hex, symbolColor: null, taglineColor: null })}
                      className={cn(
                        'aspect-square rounded-md border transition',
                        normalizeHex(state.color) === color.hex
                          ? 'border-slate-900 ring-2 ring-slate-900/20 dark:border-white dark:ring-white/30'
                          : 'border-black/10 hover:scale-105 dark:border-white/15',
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <TextInput
                      label="Custom colour"
                      value={state.color}
                      onChange={(event) => {
                        const value = event.target.value
                        set({ color: value.startsWith('#') ? value : `#${value}` })
                      }}
                      onBlur={(event) => set({ color: normalizeHex(event.target.value, DEFAULT_STATE.color) })}
                    />
                  </div>
                  <input
                    type="color"
                    aria-label="Pick a colour"
                    value={normalizeHex(state.color)}
                    onChange={(event) => set({ color: event.target.value })}
                    className="mb-[1px] h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Contrast on {background === 'dark' ? 'dark' : 'light'}: {contrast.ratio}:1{' '}
                  {contrast.passesGraphics ? (
                    <span className="text-emerald-600 dark:text-emerald-400">passes</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      low, so the export lifts it to {reversedVariant(state.color, DARK_BG)} on dark
                    </span>
                  )}
                </p>
              </Panel>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || status !== 'ready'}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress ? `Building ${progress.done}/${progress.total}` : 'Building…'}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download brand package
                  </>
                )}
              </button>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Lockups, symbol, app icon and favicons in SVG and PNG, on light and dark, plus brand
                guidelines with clear space, minimum size and colour values.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Copy link to this design
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'reset' })}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Preview -------------------------------------------------------- */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-8">
              <LogoPreview
                svg={svg}
                reversedSvg={reversedSvg}
                background={background}
                onBackgroundChange={setBackground}
                loading={status === 'loading'}
                error={
                  status === 'error'
                    ? `Could not load ${state.fontFamily} ${state.fontWeight}. Check your connection and try again.`
                    : null
                }
                symbolSvg={symbolOnlySvg}
              />
            </div>
          </div>
        </main>

        <Faq />
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm shadow-lg',
            toast.tone === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
          )}
        >
          {toast.tone === 'ok' && <Check className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
