/**
 * Seed generation and seeded random number utilities
 */

/**
 * Generate a completely random seed string
 */
export function generateSeed(): string {
  // Generate a fully random seed using multiple random values
  return Math.random().toString(36).substr(2, 9) +
         Math.random().toString(36).substr(2, 9);
}

/**
 * Convert seed string to a deterministic number
 */
export function seedToNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Create a seeded pseudo-random number generator
 * Returns a function that generates numbers between 0 and 1
 */
export function createSeededRandom(seed: string): () => number {
  let hash = seedToNumber(seed);

  return () => {
    // Linear congruential generator
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
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
