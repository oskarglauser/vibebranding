/**
 * GPOS pair-kerning reader.
 *
 * opentype.js only understands GPOS lookup type 2 laid out directly in the
 * lookup list. Most Google Fonts (Inter, Montserrat, Poppins…) wrap their kern
 * lookups in type 9 "Extension" subtables, which opentype.js stores as
 * `{ error: 'GPOS Lookup 9 not supported' }` — so `font.getKerningValue()`
 * silently returns 0 and every pair renders unkerned. Since kerning is the
 * difference between a wordmark and a row of letters, we parse the table
 * ourselves, straight from the font bytes.
 *
 * Subtables are parsed once and queried lazily: class-based (format 2) kerning
 * covers millions of pairs, so expanding it eagerly would cost tens of MB.
 */

type Reader = {
  u16: (offset: number) => number
  i16: (offset: number) => number
  u32: (offset: number) => number
  tag: (offset: number) => string
}

type PairSubtable =
  | {
      format: 1
      coverage: Map<number, number>
      /** first glyph id -> (second glyph id -> x advance in font units) */
      pairs: Map<number, Map<number, number>>
    }
  | {
      format: 2
      coverage: Map<number, number>
      classDef1: Map<number, number>
      classDef2: Map<number, number>
      class2Count: number
      values: Int16Array
    }

export type KerningTable = {
  /** x advance adjustment in font units for a glyph pair (0 when unkerned). */
  get(leftGlyphId: number, rightGlyphId: number): number
  readonly subtableCount: number
}

const EMPTY_KERNING: KerningTable = { get: () => 0, subtableCount: 0 }

function createReader(view: DataView): Reader {
  return {
    u16: (o) => view.getUint16(o),
    i16: (o) => view.getInt16(o),
    u32: (o) => view.getUint32(o),
    tag: (o) =>
      String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3)),
  }
}

function findTableOffset(r: Reader, tag: string): number | null {
  let base = 0
  if (r.tag(0) === 'ttcf') base = r.u32(12)
  const numTables = r.u16(base + 4)
  for (let i = 0; i < numTables; i++) {
    const record = base + 12 + i * 16
    if (r.tag(record) === tag) return r.u32(record + 8)
  }
  return null
}

function parseCoverage(r: Reader, offset: number): Map<number, number> {
  const coverage = new Map<number, number>()
  const format = r.u16(offset)
  if (format === 1) {
    const count = r.u16(offset + 2)
    for (let i = 0; i < count; i++) coverage.set(r.u16(offset + 4 + i * 2), i)
  } else if (format === 2) {
    const count = r.u16(offset + 2)
    for (let i = 0; i < count; i++) {
      const record = offset + 4 + i * 6
      const start = r.u16(record)
      const end = r.u16(record + 2)
      const startIndex = r.u16(record + 4)
      for (let glyph = start; glyph <= end; glyph++) coverage.set(glyph, startIndex + (glyph - start))
    }
  }
  return coverage
}

function parseClassDef(r: Reader, offset: number): Map<number, number> {
  const classes = new Map<number, number>()
  const format = r.u16(offset)
  if (format === 1) {
    const startGlyph = r.u16(offset + 2)
    const count = r.u16(offset + 4)
    for (let i = 0; i < count; i++) classes.set(startGlyph + i, r.u16(offset + 6 + i * 2))
  } else if (format === 2) {
    const count = r.u16(offset + 2)
    for (let i = 0; i < count; i++) {
      const record = offset + 4 + i * 6
      const start = r.u16(record)
      const end = r.u16(record + 2)
      const value = r.u16(record + 4)
      for (let glyph = start; glyph <= end; glyph++) classes.set(glyph, value)
    }
  }
  return classes
}

/** Size in bytes of a ValueRecord with the given format mask. */
function valueRecordSize(format: number): number {
  let size = 0
  for (let bit = 0; bit < 8; bit++) if (format & (1 << bit)) size += 2
  return size
}

/** Byte offset of X_ADVANCE within a ValueRecord, or -1 when absent. */
function xAdvanceOffset(format: number): number {
  if (!(format & 0x0004)) return -1
  let offset = 0
  if (format & 0x0001) offset += 2 // X_PLACEMENT
  if (format & 0x0002) offset += 2 // Y_PLACEMENT
  return offset
}

function parsePairSubtable(r: Reader, offset: number): PairSubtable | null {
  const format = r.u16(offset)
  const coverage = parseCoverage(r, offset + r.u16(offset + 2))
  const valueFormat1 = r.u16(offset + 4)
  const valueFormat2 = r.u16(offset + 6)
  const advanceOffset = xAdvanceOffset(valueFormat1)
  if (advanceOffset < 0) return null // nothing that affects horizontal spacing

  const size1 = valueRecordSize(valueFormat1)
  const size2 = valueRecordSize(valueFormat2)

  if (format === 1) {
    const pairSetCount = r.u16(offset + 8)
    const glyphByIndex = new Map<number, number>()
    for (const [glyph, index] of coverage) glyphByIndex.set(index, glyph)

    const pairs = new Map<number, Map<number, number>>()
    for (let i = 0; i < pairSetCount; i++) {
      const firstGlyph = glyphByIndex.get(i)
      if (firstGlyph === undefined) continue
      const setOffset = offset + r.u16(offset + 10 + i * 2)
      const pairCount = r.u16(setOffset)
      const seconds = new Map<number, number>()
      for (let j = 0; j < pairCount; j++) {
        const record = setOffset + 2 + j * (2 + size1 + size2)
        const value = r.i16(record + 2 + advanceOffset)
        if (value !== 0) seconds.set(r.u16(record), value)
      }
      if (seconds.size > 0) pairs.set(firstGlyph, seconds)
    }
    return pairs.size > 0 ? { format: 1, coverage, pairs } : null
  }

  if (format === 2) {
    const classDef1 = parseClassDef(r, offset + r.u16(offset + 8))
    const classDef2 = parseClassDef(r, offset + r.u16(offset + 10))
    const class1Count = r.u16(offset + 12)
    const class2Count = r.u16(offset + 14)
    const recordSize = size1 + size2
    const base = offset + 16

    const values = new Int16Array(class1Count * class2Count)
    let hasKerning = false
    for (let c1 = 0; c1 < class1Count; c1++) {
      for (let c2 = 0; c2 < class2Count; c2++) {
        const index = c1 * class2Count + c2
        const value = r.i16(base + index * recordSize + advanceOffset)
        values[index] = value
        if (value !== 0) hasKerning = true
      }
    }
    return hasKerning ? { format: 2, coverage, classDef1, classDef2, class2Count, values } : null
  }

  return null
}

/**
 * Extract horizontal kerning from a font's GPOS `kern` feature.
 * Returns a table that resolves 0 for every pair when the font has no kerning.
 */
export function parseKerning(buffer: ArrayBuffer): KerningTable {
  let subtables: PairSubtable[] = []

  try {
    const r = createReader(new DataView(buffer))
    const gposOffset = findTableOffset(r, 'GPOS')
    if (gposOffset === null) return EMPTY_KERNING

    const featureListOffset = gposOffset + r.u16(gposOffset + 6)
    const lookupListOffset = gposOffset + r.u16(gposOffset + 8)

    // Collect every lookup referenced by a `kern` feature, across all scripts.
    const kernLookups = new Set<number>()
    const featureCount = r.u16(featureListOffset)
    for (let i = 0; i < featureCount; i++) {
      const record = featureListOffset + 2 + i * 6
      if (r.tag(record) !== 'kern') continue
      const featureOffset = featureListOffset + r.u16(record + 4)
      const lookupCount = r.u16(featureOffset + 2)
      for (let j = 0; j < lookupCount; j++) kernLookups.add(r.u16(featureOffset + 4 + j * 2))
    }

    const lookupCount = r.u16(lookupListOffset)
    for (const index of kernLookups) {
      if (index >= lookupCount) continue
      const lookupOffset = lookupListOffset + r.u16(lookupListOffset + 2 + index * 2)
      const lookupType = r.u16(lookupOffset)
      const subtableCount = r.u16(lookupOffset + 4)

      for (let s = 0; s < subtableCount; s++) {
        let subtableOffset = lookupOffset + r.u16(lookupOffset + 6 + s * 2)
        let effectiveType = lookupType

        // Type 9 = Extension Positioning: the real subtable lives elsewhere.
        if (lookupType === 9) {
          effectiveType = r.u16(subtableOffset + 2)
          subtableOffset += r.u32(subtableOffset + 4)
        }
        if (effectiveType !== 2) continue

        const parsed = parsePairSubtable(r, subtableOffset)
        if (parsed) subtables.push(parsed)
      }
    }
  } catch {
    // A malformed or unusual GPOS table should never break rendering —
    // unkerned text is a far better outcome than no logo at all.
    subtables = []
  }

  if (subtables.length === 0) return EMPTY_KERNING

  const cache = new Map<number, number>()

  return {
    subtableCount: subtables.length,
    get(left: number, right: number): number {
      const key = left * 65536 + right
      const cached = cache.get(key)
      if (cached !== undefined) return cached

      let value = 0
      for (const subtable of subtables) {
        if (!subtable.coverage.has(left)) continue
        if (subtable.format === 1) {
          const found = subtable.pairs.get(left)?.get(right)
          if (found) {
            value = found
            break
          }
        } else {
          const class1 = subtable.classDef1.get(left) ?? 0
          const class2 = subtable.classDef2.get(right) ?? 0
          const found = subtable.values[class1 * subtable.class2Count + class2]
          if (found) {
            value = found
            break
          }
        }
      }

      cache.set(key, value)
      return value
    },
  }
}
