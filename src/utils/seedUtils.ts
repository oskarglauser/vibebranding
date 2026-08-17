/**
 * Seeded randomness for mark generation.
 *
 * Marks are a deterministic function of the brand name, so the quality of the
 * hash matters more than it would for a throwaway seed. A weak hash feeding a
 * weak generator would hand "Acme Co" and "Acme Ltd" near-identical first draws
 * and therefore near-identical marks — the exact failure the drawn library is
 * meant to fix. xmur3 avalanches the string, mulberry32 keeps the stream
 * well-distributed afterwards.
 */

/** Generate a fully random seed string, for the cases that want a fresh roll. */
export function generateSeed(): string {
  return (
    Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 11)
  );
}

/**
 * Hash a string to a 32-bit integer, avalanching so that a one-character change
 * redistributes the whole value rather than shifting it slightly.
 */
export function seedToNumber(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * Create a seeded pseudo-random number generator.
 * Returns a function producing numbers in [0, 1).
 */
export function createSeededRandom(seed: string): () => number {
  let state = seedToNumber(seed);

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Get a random integer between min and max (inclusive) using seeded random
 */
export function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Get a random float between min and max using seeded random
 */
export function randomFloat(random: () => number, min: number, max: number): number {
  return random() * (max - min) + min;
}

/**
 * Pick a random item from an array using seeded random
 */
export function randomChoice<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length)];
}
