/**
 * The mark library.
 *
 * Templates are registered here and nowhere else, so a template that exists but
 * was never added to the registry cannot silently go missing from the picker.
 */

import type { MarkTemplate } from '../template'
import { GEOMETRIC_TEMPLATES } from './geometric'
import { MONOGRAM_TEMPLATES } from './monograms'
import { MOTION_TEMPLATES } from './motion'
import { ORGANIC_TEMPLATES } from './organic'
import { STRUCTURAL_TEMPLATES } from './structural'

/**
 * Ordered so the picker's default run alternates families rather than showing
 * six variations on a circle before anything else.
 */
export const TEMPLATES: MarkTemplate[] = [
  ...MONOGRAM_TEMPLATES,
  ...GEOMETRIC_TEMPLATES,
  ...ORGANIC_TEMPLATES,
  ...MOTION_TEMPLATES,
  ...STRUCTURAL_TEMPLATES,
]

const byId = new Map(TEMPLATES.map((template) => [template.id, template]))

export function templateById(id: string): MarkTemplate | null {
  return byId.get(id) ?? null
}

export function isTemplateId(id: string): boolean {
  return byId.has(id)
}

export type TemplateId = string
