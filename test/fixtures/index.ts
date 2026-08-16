/**
 * Real TrueType fixtures so engine tests run offline and deterministically.
 *
 * Inter (GPOS kerning behind Extension lookups), Playfair Display (serif, tall
 * ascenders), Bebas Neue (all-caps display, x-height == cap height) between them
 * cover the metric edge cases the layout engine has to survive.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import opentype from 'opentype.js'
import { parseKerning } from '../../src/engine/kerning'
import { getFontMetrics } from '../../src/engine/metrics'
import type { LoadedFont } from '../../src/engine/types'

const here = dirname(fileURLToPath(import.meta.url))

export function loadFixture(name: 'Inter-600' | 'PlayfairDisplay-700' | 'BebasNeue-400'): LoadedFont {
  const bytes = readFileSync(join(here, `${name}.ttf`))
  // Copy into a standalone ArrayBuffer: Node Buffers are views into a shared pool.
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const font = opentype.parse(buffer)
  const [family, weight] = name.split('-')
  return {
    family,
    weight: Number(weight),
    font,
    kerning: parseKerning(buffer),
    metrics: getFontMetrics(font),
  }
}
