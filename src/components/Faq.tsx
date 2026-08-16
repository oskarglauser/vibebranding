/**
 * Marketing copy and FAQ.
 *
 * Content is kept in one array so the page and the JSON-LD in index.html can be
 * checked against each other — the old build had 12 questions rendered and a
 * stale 10 in the structured data.
 */

import faqItems from '../content/faq.json'

/**
 * The same JSON feeds the FAQPage structured data injected into index.html at
 * build time, so the two can never drift apart the way they had.
 */
const FAQ_ITEMS = faqItems as Array<{ question: string; answer: string }>

export function Faq() {
  return (
    <section className="mt-20 border-t border-slate-200 pt-12 dark:border-slate-800">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight">
          A logotype generator that produces real vector artwork
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Type a name, pick a style, choose a mark, and download a complete set of brand files.
          Everything is built from font outlines and laid out on your typeface's cap height, so the
          result is proportioned like a designed logo rather than text in a box, and what you see
          on screen is exactly what lands in your download.
        </p>

        <dl className="mt-10 divide-y divide-slate-200 dark:divide-slate-800">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-900 marker:content-none dark:text-slate-100">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {item.answer}
              </p>
            </details>
          ))}
        </dl>

        <p className="mt-10 text-xs text-slate-400">
          Built by{' '}
          <a href="https://glauser.com" className="underline hover:text-slate-600 dark:hover:text-slate-300">
            Glauser Creative
          </a>
          . Need something bespoke?{' '}
          <a href="mailto:oskar@glauser.com" className="underline hover:text-slate-600 dark:hover:text-slate-300">
            Get in touch
          </a>
          .
        </p>
      </div>
    </section>
  )
}
