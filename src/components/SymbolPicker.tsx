/**
 * Symbol picker.
 *
 * Shows a grid of candidates rendered with the user's own font and colour, so
 * choosing a mark is a visual comparison rather than a slot machine. The old
 * flow offered a single "Randomize design" button, which meant rolling until
 * something usable appeared.
 */

import { useMemo } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { buildCandidates, initialsFor } from '../engine/symbols/select'
import { templateById } from '../engine/symbols/templates'
import { renderSvg } from '../engine/render'
import { layoutLogo } from '../engine/layout'
import type { LoadedFont, LogoSpec } from '../engine/types'
import type { SymbolChoice } from '../state/logoSpec'
import { cn } from '../lib/utils'

type Props = {
  font: LoadedFont | null
  brandName: string
  color: string
  batchSeed: string
  selected: SymbolChoice | null
  onSelect: (choice: SymbolChoice | null) => void
  onShuffle: () => void
}

const CANDIDATE_COUNT = 12

export function SymbolPicker({
  font,
  brandName,
  color,
  batchSeed,
  selected,
  onSelect,
  onShuffle,
}: Props) {
  const candidates = useMemo(() => {
    if (!font) return []
    const initials = initialsFor(brandName)
    return buildCandidates(
      { font, initial: initials[0] || 'A', initials, seed: batchSeed },
      CANDIDATE_COUNT,
    )
  }, [font, brandName, batchSeed])

  const previews = useMemo(() => {
    if (!font) return []
    return candidates.map((candidate) => {
      const spec: LogoSpec = {
        brandName: '',
        fontFamily: font.family,
        fontWeight: font.weight,
        tracking: 0,
        textCase: 'normal',
        trademark: 'none',
        tagline: '',
        taglineFontFamily: font.family,
        taglineFontWeight: 400,
        taglineTracking: 0,
        taglineCase: 'normal',
        taglineSize: 'md',
        symbol: candidate.art,
        symbolPlacement: 'left',
        symbolSize: 'md',
        colors: { wordmark: color, tagline: color, symbol: color },
      }
      const layout = layoutLogo({ spec, wordmarkFont: font, taglineFont: null })
      return {
        candidate,
        svg: renderSvg(layout, { targetWidth: 88, paddingCaps: 0.15 }).svg,
      }
    })
  }, [candidates, font, color])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Choose a mark</span>
        <div className="flex items-center gap-1">
          {selected && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-3 w-3" />
              None
            </button>
          )}
          <button
            type="button"
            onClick={onShuffle}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <RefreshCw className="h-3 w-3" />
            More
          </button>
        </div>
      </div>

      <div role="radiogroup" aria-label="Symbol" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {previews.map(({ candidate, svg }) => {
          const isSelected =
            selected?.template === candidate.template && selected?.seed === candidate.seed
          return (
            <button
              key={`${candidate.template}-${candidate.seed}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={templateById(candidate.template)?.label ?? candidate.template}
              onClick={() => onSelect({ template: candidate.template, seed: candidate.seed })}
              className={cn(
                'flex aspect-square items-center justify-center rounded-lg border p-2 transition',
                isSelected
                  ? 'border-slate-900 ring-2 ring-slate-900/15 dark:border-white dark:ring-white/20'
                  : 'border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500',
              )}
            >
              <span
                className="block h-full w-full [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </button>
          )
        })}
        {previews.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs text-slate-400">Loading marks…</p>
        )}
      </div>
    </div>
  )
}
