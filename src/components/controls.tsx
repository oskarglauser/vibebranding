/**
 * Small shared controls.
 *
 * Two rules drive these: every control is labelled for assistive technology
 * (the old build had six unlabelled selects, three unlabelled colour inputs and
 * six unlabelled sliders), and no control exposes an implementation number.
 * "Symbol size 150%" told the user nothing; Small / Medium / Large does.
 */

import { useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

export function TextInput({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        {...props}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition',
          'placeholder:text-slate-400 focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:border-slate-300',
          props.className,
        )}
      />
    </Field>
  )
}

export type SelectOption = { value: string; label: string; group?: string }

/**
 * A native <select>: it is fully labelled, keyboard-navigable everywhere, and
 * on mobile it opens the platform picker — which beats a custom listbox for a
 * list of forty typefaces.
 */
export function Select({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  hint?: string
}) {
  const id = useId()
  const groups = options.reduce<Map<string, SelectOption[]>>((map, option) => {
    const key = option.group ?? ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(option)
    return map
  }, new Map())

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 outline-none transition',
            'focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10',
            'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:border-slate-300',
          )}
        >
          {[...groups.entries()].map(([group, items]) =>
            group ? (
              <optgroup key={group} label={group}>
                {items.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              items.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ),
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </Field>
  )
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string; title?: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex w-full rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              value === option.value
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {label}
        </label>
        <span className="text-xs tabular-nums text-slate-400">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900 dark:bg-slate-700 dark:accent-white"
      />
    </div>
  )
}

export function Panel({
  title,
  icon,
  open,
  onToggle,
  children,
  id,
}: {
  title: string
  icon: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  id: string
}) {
  return (
    <section className="border-b border-slate-200 last:border-b-0 dark:border-slate-800">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-content`}
          className="flex w-full items-center justify-between py-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {icon}
            {title}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </button>
      </h2>
      <div id={`${id}-content`} hidden={!open} className="space-y-4 pb-5">
        {children}
      </div>
    </section>
  )
}
