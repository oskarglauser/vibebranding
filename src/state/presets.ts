/**
 * Style presets.
 *
 * The single biggest usability gap in the old app: it opened on an empty text
 * field and a list of 38 font names, which is only useful if you already know
 * what you want. A preset is one click to a complete, considered starting
 * point — face, weight, tracking, case, companion tagline face and a matching
 * mark — that the user can then adjust.
 */

import type { DesignState } from './logoSpec'

export type Preset = {
  id: string
  name: string
  description: string
  /** Template the mark defaults to when this preset is applied. */
  symbolTemplate: string
  patch: Partial<DesignState>
}

export const PRESETS: Preset[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Tight geometric sans for software and studios',
    symbolTemplate: 'tile-knockout',
    patch: {
      fontFamily: 'Geist',
      fontWeight: 600,
      tracking: -0.03,
      textCase: 'normal',
      taglineFontFamily: 'Geist',
      taglineFontWeight: 400,
      taglineSize: 'md',
      color: '#111827',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Heavy caps with air for sport and retail',
    symbolTemplate: 'blade',
    patch: {
      fontFamily: 'Archivo Black',
      fontWeight: 400,
      tracking: -0.01,
      textCase: 'uppercase',
      taglineFontFamily: 'Inter',
      taglineFontWeight: 500,
      taglineCase: 'uppercase',
      taglineSize: 'sm',
      color: '#0f172a',
    },
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'High-contrast serif for beauty and hospitality',
    symbolTemplate: 'ring-monogram',
    patch: {
      fontFamily: 'Playfair Display',
      fontWeight: 500,
      tracking: -0.005,
      textCase: 'normal',
      taglineFontFamily: 'Inter',
      taglineFontWeight: 400,
      taglineCase: 'uppercase',
      taglineSize: 'sm',
      color: '#1c1917',
    },
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Monospaced and precise for dev tools and data',
    symbolTemplate: 'facet',
    patch: {
      fontFamily: 'JetBrains Mono',
      fontWeight: 700,
      tracking: -0.04,
      textCase: 'normal',
      taglineFontFamily: 'IBM Plex Sans',
      taglineFontWeight: 400,
      taglineSize: 'sm',
      color: '#0b3d2e',
    },
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Rounded and warm for consumer and wellness',
    symbolTemplate: 'bloom',
    patch: {
      fontFamily: 'Quicksand',
      fontWeight: 700,
      tracking: -0.01,
      textCase: 'normal',
      taglineFontFamily: 'Nunito Sans',
      taglineFontWeight: 400,
      taglineSize: 'md',
      color: '#7c2d12',
    },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Bookish serif for media and publishing',
    symbolTemplate: 'squircle-monogram',
    patch: {
      fontFamily: 'Fraunces',
      fontWeight: 600,
      tracking: -0.015,
      textCase: 'normal',
      taglineFontFamily: 'Inter',
      taglineFontWeight: 400,
      taglineSize: 'md',
      color: '#1e1b4b',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Light, wide and understated for architecture and art',
    symbolTemplate: 'quadrant',
    patch: {
      fontFamily: 'Inter',
      fontWeight: 300,
      tracking: 0.08,
      textCase: 'uppercase',
      taglineFontFamily: 'Inter',
      taglineFontWeight: 400,
      taglineTracking: 0.04,
      taglineSize: 'sm',
      color: '#111827',
    },
  },
  {
    id: 'grounded',
    name: 'Grounded',
    description: 'Sturdy humanist for trades and logistics',
    symbolTemplate: 'stack',
    patch: {
      fontFamily: 'Work Sans',
      fontWeight: 700,
      tracking: -0.02,
      textCase: 'normal',
      taglineFontFamily: 'Work Sans',
      taglineFontWeight: 400,
      taglineSize: 'md',
      color: '#164e63',
    },
  },
]

/** Curated brand colours — safe on white and, reversed, on near-black. */
export const BRAND_COLORS: Array<{ hex: string; name: string }> = [
  { hex: '#111827', name: 'Ink' },
  { hex: '#0f172a', name: 'Midnight' },
  { hex: '#1e293b', name: 'Slate' },
  { hex: '#1d4ed8', name: 'Cobalt' },
  { hex: '#0369a1', name: 'Azure' },
  { hex: '#0f766e', name: 'Teal' },
  { hex: '#15803d', name: 'Forest' },
  { hex: '#4d7c0f', name: 'Moss' },
  { hex: '#b45309', name: 'Amber' },
  { hex: '#c2410c', name: 'Ember' },
  { hex: '#b91c1c', name: 'Crimson' },
  { hex: '#9f1239', name: 'Wine' },
  { hex: '#86198f', name: 'Plum' },
  { hex: '#6d28d9', name: 'Violet' },
  { hex: '#4338ca', name: 'Indigo' },
  { hex: '#57534e', name: 'Stone' },
]

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((preset) => preset.id === id)
}
