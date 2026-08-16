/**
 * Preview surface.
 *
 * Shows the exact SVG that gets exported — not a CSS approximation of it. The
 * background toggle and the small-size check exist because those are the two
 * things that actually catch a weak logo: how it holds up reversed, and whether
 * it survives at favicon size.
 */

import { useMemo } from 'react'
import { Check, Loader2, Moon, Sun } from 'lucide-react'
import { cn } from '../lib/utils'

export type PreviewBackground = 'light' | 'dark'

type Props = {
  svg: string | null
  reversedSvg: string | null
  background: PreviewBackground
  onBackgroundChange: (background: PreviewBackground) => void
  loading: boolean
  error: string | null
  symbolSvg: string | null
}

const LIGHT_BG = '#ffffff'
const DARK_BG = '#0b0d12'

export function LogoPreview({
  svg,
  reversedSvg,
  background,
  onBackgroundChange,
  loading,
  error,
  symbolSvg,
}: Props) {
  const shown = background === 'dark' ? reversedSvg : svg
  const isDark = background === 'dark'

  // The preview scales the artwork to fit; the SVG's own width/height would
  // otherwise force a fixed size.
  const responsiveSvg = useMemo(
    () => (shown ? shown.replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"') : null),
    [shown],
  )

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'relative flex min-h-[240px] items-center justify-center rounded-xl border p-8 transition-colors sm:min-h-[320px]',
          isDark ? 'border-transparent' : 'border-slate-200 dark:border-slate-700',
        )}
        style={{ backgroundColor: isDark ? DARK_BG : LIGHT_BG }}
      >
        {error ? (
          <p className="max-w-xs text-center text-sm text-red-600">{error}</p>
        ) : responsiveSvg ? (
          <div
            className="h-full w-full max-w-[520px] [&>svg]:h-auto [&>svg]:w-full"
            // Engine output: outlines and a background rect, built from
            // validated colours — never user markup.
            dangerouslySetInnerHTML={{ __html: responsiveSvg }}
          />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label="Loading preview" />
        )}

        {loading && responsiveSvg && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
          {(
            [
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => onBackgroundChange(value)}
              aria-pressed={background === value}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                background === value
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {symbolSvg && <SmallSizeCheck symbolSvg={symbolSvg} isDark={isDark} />}
      </div>
    </div>
  )
}

/**
 * The mark at the sizes it will actually be used at. A logo that only works at
 * hero size is not finished, and favicon-scale is where over-detailed marks
 * fall apart.
 *
 * The chips carry the preview's own background, since the mark is coloured for
 * that background and would otherwise vanish against the interface.
 */
function SmallSizeCheck({ symbolSvg, isDark }: { symbolSvg: string; isDark: boolean }) {
  const sized = (size: number) =>
    symbolSvg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`)

  return (
    <div className="flex items-center gap-2" title="How the mark holds up at small sizes">
      <span className="hidden text-xs text-slate-400 sm:inline">Small sizes</span>
      <div
        className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
        style={{
          backgroundColor: isDark ? DARK_BG : LIGHT_BG,
          borderColor: isDark ? 'transparent' : '#e2e8f0',
        }}
      >
        {[16, 24, 32].map((size) => (
          <span
            key={size}
            className="block [&>svg]:block"
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: sized(size) }}
          />
        ))}
        <Check className="h-3 w-3" style={{ color: isDark ? '#334155' : '#cbd5e1' }} />
      </div>
    </div>
  )
}
