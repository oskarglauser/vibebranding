/**
 * The mark library.
 *
 * Templates are registered here and nowhere else, so a template that exists but
 * was never added to the registry cannot silently go missing from the picker.
 */

import type { MarkTemplate } from '../template'
import { MONOGRAM_TEMPLATES } from './monograms'

export const TEMPLATES: MarkTemplate[] = [...MONOGRAM_TEMPLATES]

const byId = new Map(TEMPLATES.map((template) => [template.id, template]))

export function templateById(id: string): MarkTemplate | null {
  return byId.get(id) ?? null
}

export function isTemplateId(id: string): boolean {
  return byId.has(id)
}

export type TemplateId = string
