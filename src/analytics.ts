/**
 * Product events for Appscope (https://appscope.glauser.com).
 *
 * The tracking script in index.html records pageviews and exposes
 * `window.appscope`. These are the few actions that show the product works,
 * snake_case and past tense. Props never carry what the user typed (brand
 * name, tagline): only choices from fixed lists.
 *
 * Every call is a no-op when the script has not loaded (blocked, offline, or
 * running locally without it), and can never throw into the app.
 */

type Props = Record<string, string | number | boolean>

declare global {
  interface Window {
    appscope?: { track: (name: string, props?: Props) => void }
  }
}

function track(name: string, props?: Props): void {
  try {
    window.appscope?.track(name, props)
  } catch {
    /* analytics must never break the app */
  }
}

export const analytics = {
  /** The conversion event: a brand package was downloaded. */
  packageDownloaded: (props: { font: string; symbol: string; tagline: boolean }) =>
    track('package_downloaded', props),
  symbolSelected: (template: string) => track('symbol_selected', { template }),
  presetApplied: (preset: string) => track('preset_applied', { preset }),
  surpriseUsed: () => track('surprise_used'),
  linkCopied: () => track('link_copied'),
}
