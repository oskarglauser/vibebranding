/**
 * Design principles and utilities for award-winning generative design
 * Based on golden ratio, visual balance, and harmonic relationships
 */

// Constants
export const GOLDEN_RATIO = 1.618033988749895;
export const GOLDEN_RATIO_INVERSE = 0.618033988749895; // 1/φ
export const GOLDEN_ANGLE = 137.508; // 360° * (1 - 1/φ)

/**
 * Golden ratio points for positioning (rule of thirds meets golden ratio)
 * These create more visually pleasing compositions than simple center or thirds
 */
export function goldenPoints(): { x: number[]; y: number[] } {
  return {
    x: [0.382, 0.5, 0.618], // [1-φ⁻¹, center, φ⁻¹]
    y: [0.382, 0.5, 0.618]
  };
}

/**
 * Generate harmonic scale based on golden ratio
 * Each size is φ times the previous (or 1/φ for descending)
 */
export function harmonicScale(base: number, count: number, ascending: boolean = true): number[] {
  const scales: number[] = [base];
  for (let i = 1; i < count; i++) {
    if (ascending) {
      scales.push(scales[i - 1] * GOLDEN_RATIO);
    } else {
      scales.push(scales[i - 1] / GOLDEN_RATIO);
    }
  }
  return scales;
}

/**
 * Get complementary angle that creates visual harmony
 * Based on divisions of circle: 30°, 45°, 60°, 90°, 120°
 */
export function complementaryAngle(baseAngle: number, division: number = 4): number {
  const harmonicAngles = [30, 45, 60, 90, 120, 180];
  const step = harmonicAngles[Math.min(division, harmonicAngles.length - 1)] || 90;
  return (baseAngle + step) % 360;
}

/**
 * Get harmonic angles - angles that work well together
 */
export function harmonicAngles(): number[] {
  return [0, 15, 30, 45, 60, 75, 90, 120, 135, 150, 180];
}

/**
 * Pick a golden ratio-based size relationship
 */
export function goldenSizePair(base: number): { large: number; small: number } {
  return {
    large: base,
    small: base / GOLDEN_RATIO
  };
}

/**
 * Calculate visual weight of an element based on size and position
 * Larger elements and elements further from center have more weight
 */
export function visualWeight(size: number, x: number, y: number, centerX: number = 50, centerY: number = 50): number {
  const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  return size * (1 + distanceFromCenter / 100);
}

/**
 * Calculate balance point for a set of weighted positions
 * Useful for determining where to place a counterbalancing element
 */
export function calculateBalancePoint(
  elements: Array<{ x: number; y: number; weight: number }>,
  centerX: number = 50,
  centerY: number = 50
): { x: number; y: number } {
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const el of elements) {
    totalWeight += el.weight;
    weightedX += el.x * el.weight;
    weightedY += el.y * el.weight;
  }

  if (totalWeight === 0) return { x: centerX, y: centerY };

  const balanceX = weightedX / totalWeight;
  const balanceY = weightedY / totalWeight;

  // Return opposite point for counterbalance
  return {
    x: centerX + (centerX - balanceX),
    y: centerY + (centerY - balanceY)
  };
}

/**
 * Get a golden ratio position in viewbox
 */
export function goldenPosition(viewBoxSize: number, position: 'near' | 'center' | 'far', _axis: 'x' | 'y'): number {
  const positions = {
    near: viewBoxSize * 0.382,
    center: viewBoxSize * 0.5,
    far: viewBoxSize * 0.618
  };
  return positions[position];
}

/**
 * Get stroke width that follows harmonic progression
 * Common in professional design: 3, 5, 8, 13 (Fibonacci-like)
 * Minimum 3 to ensure visibility
 */
export function harmonicStrokeWidths(): number[] {
  return [3, 5, 8, 13];
}

/**
 * Pick a stroke width from harmonic progression
 */
export function selectHarmonicStroke(random: () => number): number {
  const strokes = harmonicStrokeWidths();
  const index = Math.floor(random() * strokes.length);
  return strokes[index];
}

/**
 * Get spacing that follows golden ratio
 */
export function goldenSpacing(containerSize: number, elements: number): number[] {
  const spacings: number[] = [];
  const totalRatio = elements + (elements - 1) * GOLDEN_RATIO_INVERSE;
  const elementSize = containerSize / totalRatio;
  const gapSize = elementSize * GOLDEN_RATIO_INVERSE;

  let current = elementSize / 2;
  for (let i = 0; i < elements; i++) {
    spacings.push(current);
    current += elementSize + gapSize;
  }

  return spacings;
}

/**
 * Composition styles for letter mode
 */
export type CompositionStyle =
  | 'minimal'      // Letter + 1 simple shape
  | 'balanced'     // Letter + symmetrical elements
  | 'dynamic'      // Letter + asymmetric elements for energy
  | 'layered'      // Letter with depth/shadow effects
  | 'geometric'    // Letter + multiple geometric shapes
  | 'organic';     // Letter + curved/flowing forms

/**
 * Select composition style from seed
 */
export function selectCompositionStyle(random: () => number): CompositionStyle {
  const styles: CompositionStyle[] = ['minimal', 'balanced', 'dynamic', 'layered', 'geometric', 'organic'];
  const index = Math.floor(random() * styles.length);
  return styles[index];
}

/**
 * Shape composition types
 */
export type ShapeCompositionType =
  | 'intersecting'  // 2-3 shapes with meaningful overlap
  | 'nested'        // Concentric shapes with golden ratio sizing
  | 'split'         // Shape divided by lines/other shapes
  | 'scattered'     // 3-5 shapes in dynamic balance
  | 'orbital'       // Central shape + orbiting elements
  | 'layered'       // Shapes stacked with depth
  | 'radial'        // Elements radiating from center
  | 'organic';      // Curved forms in harmony

/**
 * Select shape composition type from seed
 */
export function selectShapeCompositionType(random: () => number): ShapeCompositionType {
  const types: ShapeCompositionType[] = [
    'intersecting', 'nested', 'split', 'scattered', 'orbital', 'layered', 'radial', 'organic'
  ];
  const index = Math.floor(random() * types.length);
  return types[index];
}

/**
 * Pattern structure types
 */
export type PatternStructure =
  | 'radial'        // Elements around center
  | 'circular'      // Concentric circles
  | 'square'        // Orthogonal grid
  | 'hexagonal'     // Honeycomb structure
  | 'triangular'    // Delta pattern
  | 'spiral'        // Golden/Fibonacci spiral
  | 'scattered'     // Organic distribution
  | 'wave'          // Flowing repetition
  | 'constellation' // Connected nodes
  | 'mandala';      // Symmetrical complexity

/**
 * Select pattern structure from seed
 */
export function selectPatternStructure(random: () => number): PatternStructure {
  const structures: PatternStructure[] = [
    'radial', 'circular', 'square', 'hexagonal', 'triangular',
    'spiral', 'scattered', 'wave', 'constellation', 'mandala'
  ];
  const index = Math.floor(random() * structures.length);
  return structures[index];
}

/**
 * Generate points along a golden spiral
 */
export function goldenSpiralPoints(count: number, centerX: number, centerY: number, maxRadius: number): Array<{ x: number; y: number; angle: number }> {
  const points: Array<{ x: number; y: number; angle: number }> = [];

  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN_ANGLE * (Math.PI / 180);
    const radius = (maxRadius * i) / count;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y, angle: angle * 180 / Math.PI });
  }

  return points;
}

/**
 * Generate points in a circular arrangement
 */
export function circularPoints(count: number, centerX: number, centerY: number, radius: number, startAngle: number = -90): Array<{ x: number; y: number; angle: number }> {
  const points: Array<{ x: number; y: number; angle: number }> = [];

  for (let i = 0; i < count; i++) {
    const angle = (startAngle + (i * 360 / count)) * Math.PI / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y, angle: angle * 180 / Math.PI });
  }

  return points;
}

/**
 * Check if two circles overlap (for intersection detection)
 */
export function circlesOverlap(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean {
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  return distance < (r1 + r2);
}

/**
 * Constrain value to range
 */
export function constrain(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map value from one range to another
 */
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
