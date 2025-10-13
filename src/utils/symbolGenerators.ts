/**
 * Award-Winning Symbol Generation System
 * Uses generative design principles, golden ratio, and composition theory
 * to create unique, professional symbols from any seed
 */

import type { SymbolSVGResult } from '../types/symbol';
import { createSeededRandom } from './seedUtils';
import {
  GOLDEN_RATIO,
  GOLDEN_RATIO_INVERSE,
  goldenPoints,
  harmonicScale,
  complementaryAngle,
  harmonicAngles,
  goldenSizePair,
  selectCompositionStyle,
  selectShapeCompositionType,
  selectPatternStructure,
  goldenSpiralPoints,
  circularPoints,
  selectHarmonicStroke,
  goldenPosition,
  goldenSpacing
} from './designPrinciples';
import {
  generatePolygon,
  generateStar,
  generateOrganicShape,
  generateArc,
  generateWave,
  generateRoundedRect,
  generateDiamond,
  generateHexagon,
  generateTriangle,
  generatePentagon,
  constrainRadius,
  constrainToViewbox
} from './shapePrimitives';

const VIEWBOX_SIZE = 100;
const SAFE_MARGIN = 7; // Increased to prevent cutoff with rotation

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function pickFromArray<T>(random: () => number, array: T[]): T {
  return array[Math.floor(random() * array.length)];
}

// ============================================================================
// LETTER MODE - COMPOSITIONAL SYSTEM
// ============================================================================

/**
 * Generate award-winning letter-based symbol using composition theory
 */
export function generateLetterSymbol(
  letter: string,
  seed: string,
  color: string,
  font: string = 'Inter'
): SymbolSVGResult {
  const random = createSeededRandom(seed);
  const firstLetter = letter.charAt(0).toUpperCase();

  // Determine composition style from seed
  const style = selectCompositionStyle(random);

  // Letter properties
  const letterScale = 0.4 + random() * 0.25; // 40-65% of viewbox
  const letterSize = VIEWBOX_SIZE * letterScale;

  // Should we invert (light letter on dark background)?
  const shouldInvert = random() > 0.5;

  // Golden ratio positioning
  const positions = ['near', 'center', 'far'] as const;
  const xPos = positions[Math.floor(random() * positions.length)];
  const yPos = positions[Math.floor(random() * positions.length)];
  const letterX = goldenPosition(VIEWBOX_SIZE, xPos, 'x');
  const letterY = goldenPosition(VIEWBOX_SIZE, yPos, 'y');

  // Harmonic rotation
  const angles = harmonicAngles();
  const letterRotation = pickFromArray(random, angles);

  let shapes = '';

  switch (style) {
    case 'minimal':
      shapes = generateMinimalComposition(random, firstLetter, letterX, letterY, letterSize, letterRotation, font, color, shouldInvert);
      break;

    case 'balanced':
      shapes = generateBalancedComposition(random, firstLetter, letterX, letterY, letterSize, letterRotation, font, color, shouldInvert);
      break;

    case 'dynamic':
      shapes = generateDynamicComposition(random, firstLetter, letterX, letterY, letterSize, letterRotation, font, color, shouldInvert);
      break;

    case 'layered':
      shapes = generateLayeredComposition(random, firstLetter, letterX, letterY, letterSize, letterRotation, font, color, shouldInvert);
      break;

    case 'geometric':
      shapes = generateGeometricComposition(random, firstLetter, letterX, letterY, letterSize, letterRotation, font, color, shouldInvert);
      break;

    case 'organic':
      shapes = generateOrganicComposition(random, firstLetter, letterX, letterY, letterSize, letterRotation, font, color, shouldInvert);
      break;
  }

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

function generateMinimalComposition(
  random: () => number,
  letter: string,
  letterX: number,
  letterY: number,
  letterSize: number,
  letterRotation: number,
  font: string,
  color: string,
  shouldInvert: boolean
): string {
  // Letter + 1 simple shape
  const shapeType = Math.floor(random() * 4); // circle, polygon, diamond, arc
  const shapeSize = letterSize * GOLDEN_RATIO;
  const stroke = selectHarmonicStroke(random);

  const letterFill = shouldInvert ? '#ffffff' : color;
  const shapeFill = shouldInvert ? color : 'none';
  const shapeStroke = shouldInvert ? '' : `stroke="${color}" stroke-width="${stroke}"`;

  let bgShape = '';

  switch (shapeType) {
    case 0: // Circle
      const circleRadius = constrainRadius(50, 50, shapeSize / 2, stroke);
      bgShape = `<circle cx="50" cy="50" r="${circleRadius}" fill="${shapeFill}" ${shapeStroke}/>`;
      break;

    case 1: // Polygon
      const sides = 5 + Math.floor(random() * 4); // 5-8 sides
      const polyRadius = constrainRadius(50, 50, shapeSize / 2, stroke);
      const polyRotation = pickFromArray(random, harmonicAngles());
      const polyPoints = generatePolygon(sides, 50, 50, polyRadius, polyRotation);
      bgShape = `<polygon points="${polyPoints}" fill="${shapeFill}" ${shapeStroke}/>`;
      break;

    case 2: // Diamond
      const diamondSize = shapeSize * 0.85;
      const diamondPoints = generateDiamond(50, 50, diamondSize, pickFromArray(random, harmonicAngles()));
      bgShape = `<polygon points="${diamondPoints}" fill="${shapeFill}" ${shapeStroke}/>`;
      break;

    case 3: // Rounded rect
      const rectSize = shapeSize * 0.9;
      const rectOffset = (VIEWBOX_SIZE - rectSize) / 2;
      const cornerRadius = rectSize * 0.15;
      const rectRotation = pickFromArray(random, harmonicAngles());
      const rect = generateRoundedRect(rectOffset, rectOffset, rectSize, rectSize, cornerRadius, rectRotation);
      bgShape = `<path d="${rect.path}" fill="${shapeFill}" ${shapeStroke} transform="${rect.transform}"/>`;
      break;
  }

  return `
    ${bgShape}
    <text x="${letterX}" y="${letterY}" font-family="${font}" font-size="${letterSize}" font-weight="600"
          fill="${letterFill}" text-anchor="middle" dominant-baseline="central"
          transform="rotate(${letterRotation} ${letterX} ${letterY})">${letter}</text>
  `;
}

function generateBalancedComposition(
  random: () => number,
  letter: string,
  letterX: number,
  letterY: number,
  letterSize: number,
  letterRotation: number,
  font: string,
  color: string,
  shouldInvert: boolean
): string {
  // Letter + symmetrical elements
  const letterFill = shouldInvert ? '#ffffff' : color;
  const bgFill = shouldInvert ? color : 'none';

  // Background shape
  const shapeRadius = letterSize * GOLDEN_RATIO * 0.6;
  const constrainedRadius = constrainRadius(50, 50, shapeRadius);
  const stroke = selectHarmonicStroke(random);
  const bgStroke = shouldInvert ? '' : `stroke="${color}" stroke-width="${stroke}"`;

  // Symmetrical accent elements (fewer, bigger)
  const accentCount = 4 + Math.floor(random() * 2) * 2; // 4 or 6 (even for symmetry)
  const accentDistance = constrainedRadius * 1.3;
  const accentSize = letterSize * 0.25; // Increased from 0.15

  let shapes = `<circle cx="50" cy="50" r="${constrainedRadius}" fill="${bgFill}" ${bgStroke}/>`;

  // Place accents symmetrically
  for (let i = 0; i < accentCount; i++) {
    const angle = (i * 360 / accentCount) * Math.PI / 180;
    const x = 50 + accentDistance * Math.cos(angle);
    const y = 50 + accentDistance * Math.sin(angle);

    if (x >= SAFE_MARGIN && x <= VIEWBOX_SIZE - SAFE_MARGIN &&
        y >= SAFE_MARGIN && y <= VIEWBOX_SIZE - SAFE_MARGIN) {
      shapes += `<circle cx="${x}" cy="${y}" r="${accentSize}" fill="${color}"/>`;
    }
  }

  shapes += `<text x="${letterX}" y="${letterY}" font-family="${font}" font-size="${letterSize}" font-weight="600"
    fill="${letterFill}" text-anchor="middle" dominant-baseline="central"
    transform="rotate(${letterRotation} ${letterX} ${letterY})">${letter}</text>`;

  return shapes;
}

function generateDynamicComposition(
  random: () => number,
  letter: string,
  letterX: number,
  letterY: number,
  letterSize: number,
  letterRotation: number,
  font: string,
  color: string,
  _shouldInvert: boolean
): string {
  // Letter + asymmetric elements for energy
  const letterFill = color;

  // Diagonal line accent
  const lineAngle = pickFromArray(random, [30, 45, 60, 120, 135, 150]);
  const lineLength = VIEWBOX_SIZE * 0.7;
  const lineStroke = selectHarmonicStroke(random);
  const lineX1 = 50 - (lineLength / 2) * Math.cos(lineAngle * Math.PI / 180);
  const lineY1 = 50 - (lineLength / 2) * Math.sin(lineAngle * Math.PI / 180);
  const lineX2 = 50 + (lineLength / 2) * Math.cos(lineAngle * Math.PI / 180);
  const lineY2 = 50 + (lineLength / 2) * Math.sin(lineAngle * Math.PI / 180);

  // Asymmetric shapes
  const { large, small } = goldenSizePair(letterSize * 0.4);
  const largeAngle = random() * 360;
  const largeDistance = letterSize * 0.8;
  const largeX = 50 + largeDistance * Math.cos(largeAngle * Math.PI / 180);
  const largeY = 50 + largeDistance * Math.sin(largeAngle * Math.PI / 180);

  const smallAngle = complementaryAngle(largeAngle, 3);
  const smallDistance = letterSize * 0.9;
  const smallX = 50 + smallDistance * Math.cos(smallAngle * Math.PI / 180);
  const smallY = 50 + smallDistance * Math.sin(smallAngle * Math.PI / 180);

  let shapes = `<line x1="${lineX1}" y1="${lineY1}" x2="${lineX2}" y2="${lineY2}"
    stroke="${color}" stroke-width="${lineStroke}" stroke-linecap="round"/>`;

  // Add shapes if they're in bounds
  if (largeX >= SAFE_MARGIN + large && largeX <= VIEWBOX_SIZE - SAFE_MARGIN - large &&
      largeY >= SAFE_MARGIN + large && largeY <= VIEWBOX_SIZE - SAFE_MARGIN - large) {
    const triPoints = generateTriangle(largeX, largeY, large, random() * 360);
    shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
  }

  if (smallX >= SAFE_MARGIN + small && smallX <= VIEWBOX_SIZE - SAFE_MARGIN - small &&
      smallY >= SAFE_MARGIN + small && smallY <= VIEWBOX_SIZE - SAFE_MARGIN - small) {
    shapes += `<circle cx="${smallX}" cy="${smallY}" r="${small}" fill="${color}"/>`;
  }

  shapes += `<text x="${letterX}" y="${letterY}" font-family="${font}" font-size="${letterSize}" font-weight="700"
    fill="${letterFill}" text-anchor="middle" dominant-baseline="central"
    transform="rotate(${letterRotation} ${letterX} ${letterY})">${letter}</text>`;

  return shapes;
}

function generateLayeredComposition(
  random: () => number,
  letter: string,
  letterX: number,
  letterY: number,
  letterSize: number,
  letterRotation: number,
  font: string,
  color: string,
  _shouldInvert: boolean
): string {
  // Letter with depth/shadow effects using multiple layers
  const layerCount = 2 + Math.floor(random() * 2); // 2-3 layers
  const layerOffsetX = letterSize * 0.08;
  const layerOffsetY = letterSize * 0.08;

  const shapeType = Math.floor(random() * 2); // circle or polygon
  let shapes = '';

  for (let i = layerCount - 1; i >= 0; i--) {
    const offsetX = letterX + (layerOffsetX * i);
    const offsetY = letterY + (layerOffsetY * i);
    const strokeWidth = selectHarmonicStroke(random);
    const size = letterSize * GOLDEN_RATIO * (0.9 + i * 0.05);

    if (shapeType === 0) {
      const radius = constrainRadius(offsetX, offsetY, size / 2);
      shapes += `<circle cx="${offsetX}" cy="${offsetY}" r="${radius}"
        fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
    } else {
      const sides = 5 + Math.floor(random() * 4);
      const radius = constrainRadius(offsetX, offsetY, size / 2);
      const rotation = pickFromArray(random, harmonicAngles());
      const points = generatePolygon(sides, offsetX, offsetY, radius, rotation);
      shapes += `<polygon points="${points}" fill="none" stroke="${color}"
        stroke-width="${strokeWidth}"/>`;
    }
  }

  shapes += `<text x="${letterX}" y="${letterY}" font-family="${font}" font-size="${letterSize}" font-weight="700"
    fill="${color}" text-anchor="middle" dominant-baseline="central"
    transform="rotate(${letterRotation} ${letterX} ${letterY})">${letter}</text>`;

  return shapes;
}

function generateGeometricComposition(
  random: () => number,
  letter: string,
  letterX: number,
  letterY: number,
  letterSize: number,
  letterRotation: number,
  font: string,
  color: string,
  shouldInvert: boolean
): string {
  // Letter + multiple geometric shapes
  const letterFill = shouldInvert ? '#ffffff' : color;

  // Main geometric shape
  const mainType = Math.floor(random() * 3);
  const mainSize = letterSize * GOLDEN_RATIO * 0.7;
  const mainRotation = pickFromArray(random, harmonicAngles());
  const stroke = selectHarmonicStroke(random);

  const bgFill = shouldInvert ? color : 'none';
  const bgStroke = shouldInvert ? '' : `stroke="${color}" stroke-width="${stroke}"`;

  let shapes = '';

  switch (mainType) {
    case 0: // Hexagon
      const hexRadius = constrainRadius(50, 50, mainSize / 2);
      const hexPoints = generateHexagon(50, 50, hexRadius, mainRotation);
      shapes += `<polygon points="${hexPoints}" fill="${bgFill}" ${bgStroke}/>`;
      break;

    case 1: // Pentagon
      const pentRadius = constrainRadius(50, 50, mainSize / 2);
      const pentPoints = generatePentagon(50, 50, pentRadius, mainRotation);
      shapes += `<polygon points="${pentPoints}" fill="${bgFill}" ${bgStroke}/>`;
      break;

    case 2: // Star
      const starOuter = constrainRadius(50, 50, mainSize / 2);
      const starInner = starOuter / GOLDEN_RATIO;
      const starPoints = generateStar(5, 50, 50, starOuter, starInner, mainRotation);
      shapes += `<polygon points="${starPoints}" fill="${bgFill}" ${bgStroke}/>`;
      break;
  }

  // Add accent geometric elements (fewer, bigger)
  const accentCount = 2 + Math.floor(random() * 2); // 2-3 accents
  const accentTypes = [0, 1, 2]; // triangle, circle, square

  for (let i = 0; i < accentCount; i++) {
    const accentType = pickFromArray(random, accentTypes);
    const accentSize = letterSize * 0.3; // Increased from 0.2 / GOLDEN_RATIO
    const angle = (i * 360 / accentCount + random() * 60) * Math.PI / 180;
    const distance = mainSize * 0.85;
    const x = 50 + distance * Math.cos(angle);
    const y = 50 + distance * Math.sin(angle);

    if (x >= SAFE_MARGIN + accentSize && x <= VIEWBOX_SIZE - SAFE_MARGIN - accentSize &&
        y >= SAFE_MARGIN + accentSize && y <= VIEWBOX_SIZE - SAFE_MARGIN - accentSize) {
      switch (accentType) {
        case 0: // Triangle
          const triPoints = generateTriangle(x, y, accentSize, random() * 360);
          shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
          break;
        case 1: // Circle
          shapes += `<circle cx="${x}" cy="${y}" r="${accentSize}" fill="${color}"/>`;
          break;
        case 2: // Square
          shapes += `<rect x="${x - accentSize}" y="${y - accentSize}"
            width="${accentSize * 2}" height="${accentSize * 2}" fill="${color}"/>`;
          break;
      }
    }
  }

  shapes += `<text x="${letterX}" y="${letterY}" font-family="${font}" font-size="${letterSize}" font-weight="600"
    fill="${letterFill}" text-anchor="middle" dominant-baseline="central"
    transform="rotate(${letterRotation} ${letterX} ${letterY})">${letter}</text>`;

  return shapes;
}

function generateOrganicComposition(
  random: () => number,
  letter: string,
  letterX: number,
  letterY: number,
  letterSize: number,
  letterRotation: number,
  font: string,
  color: string,
  shouldInvert: boolean
): string {
  // Letter + curved/flowing forms
  const letterFill = shouldInvert ? '#ffffff' : color;

  // Organic blob background
  const blobSize = letterSize * GOLDEN_RATIO * 0.6;
  const blobPath = generateOrganicShape(50, 50, blobSize, 0.3, random, random() * 360);
  const stroke = selectHarmonicStroke(random);

  const bgFill = shouldInvert ? color : 'none';
  const bgStroke = shouldInvert ? '' : `stroke="${color}" stroke-width="${stroke}"`;

  let shapes = `<path d="${blobPath}" fill="${bgFill}" ${bgStroke}/>`;

  // Add flowing arcs
  const arcCount = 1 + Math.floor(random() * 2);
  for (let i = 0; i < arcCount; i++) {
    const arcRotation = (i * 120 + random() * 60) * Math.PI / 180;
    const arcRadius = letterSize * 0.6;
    const arcStart = random() * 90;
    const arcEnd = arcStart + 90 + random() * 90;
    const arcStroke = selectHarmonicStroke(random) * 0.8;

    const arcPath = generateArc(50, 50, arcRadius, arcStart, arcEnd);
    shapes += `<path d="${arcPath}" fill="none" stroke="${color}"
      stroke-width="${arcStroke}" stroke-linecap="round"
      transform="rotate(${arcRotation * 180 / Math.PI} 50 50)"/>`;
  }

  shapes += `<text x="${letterX}" y="${letterY}" font-family="${font}" font-size="${letterSize}" font-weight="600"
    fill="${letterFill}" text-anchor="middle" dominant-baseline="central"
    transform="rotate(${letterRotation} ${letterX} ${letterY})">${letter}</text>`;

  return shapes;
}

// ============================================================================
// SHAPE MODE - GEOMETRIC COMPOSITOR
// ============================================================================

/**
 * Generate award-winning geometric composition
 */
export function generateShapeSymbol(seed: string, color: string): SymbolSVGResult {
  const random = createSeededRandom(seed);

  // Determine composition type from seed
  const compositionType = selectShapeCompositionType(random);

  let shapes = '';

  switch (compositionType) {
    case 'intersecting':
      shapes = generateIntersectingShapes(random, color);
      break;

    case 'nested':
      shapes = generateNestedShapes(random, color);
      break;

    case 'split':
      shapes = generateSplitShapes(random, color);
      break;

    case 'scattered':
      shapes = generateScatteredShapes(random, color);
      break;

    case 'orbital':
      shapes = generateOrbitalShapes(random, color);
      break;

    case 'layered':
      shapes = generateLayeredShapes(random, color);
      break;

    case 'radial':
      shapes = generateRadialShapes(random, color);
      break;

    case 'organic':
      shapes = generateOrganicShapes(random, color);
      break;
  }

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

function generateIntersectingShapes(random: () => number, color: string): string {
  // 2-3 shapes with meaningful overlap
  const shapeCount = 2 + Math.floor(random() * 2);
  const baseSize = 35 + random() * 15;
  const { large, small } = goldenSizePair(baseSize);

  let shapes = '';
  const shapeTypes = ['circle', 'polygon', 'triangle', 'hexagon'];

  for (let i = 0; i < shapeCount; i++) {
    const shapeType = pickFromArray(random, shapeTypes);
    const size = i === 0 ? large : small;
    const angle = (i * 120 + random() * 60) * Math.PI / 180;
    const distance = size * 0.6; // Overlap distance
    const x = 50 + distance * Math.cos(angle);
    const y = 50 + distance * Math.sin(angle);
    const rotation = pickFromArray(random, harmonicAngles());
    const stroke = selectHarmonicStroke(random);

    const constrained = constrainToViewbox(x, y, size);

    switch (shapeType) {
      case 'circle':
        const radius = constrainRadius(constrained.x, constrained.y, constrained.size / 2);
        shapes += `<circle cx="${constrained.x}" cy="${constrained.y}" r="${radius}"
          fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        break;

      case 'polygon':
        const sides = 5 + Math.floor(random() * 4);
        const polyRadius = constrainRadius(constrained.x, constrained.y, constrained.size / 2);
        const points = generatePolygon(sides, constrained.x, constrained.y, polyRadius, rotation);
        shapes += `<polygon points="${points}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        break;

      case 'triangle':
        const triRadius = constrainRadius(constrained.x, constrained.y, constrained.size / 2);
        const triPoints = generateTriangle(constrained.x, constrained.y, triRadius, rotation);
        shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
        break;

      case 'hexagon':
        const hexRadius = constrainRadius(constrained.x, constrained.y, constrained.size / 2);
        const hexPoints = generateHexagon(constrained.x, constrained.y, hexRadius, rotation);
        shapes += `<polygon points="${hexPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        break;
    }
  }

  return shapes;
}

function generateNestedShapes(random: () => number, color: string): string {
  // Concentric shapes with golden ratio sizing
  const layerCount = 2 + Math.floor(random() * 2);
  const baseRadius = 40;
  const shapeType = pickFromArray(random, ['circle', 'polygon', 'star']);
  const rotation = pickFromArray(random, harmonicAngles());

  let shapes = '';

  for (let i = layerCount - 1; i >= 0; i--) {
    const radius = constrainRadius(50, 50, baseRadius * Math.pow(GOLDEN_RATIO_INVERSE, layerCount - 1 - i));
    const stroke = selectHarmonicStroke(random);
    const filled = i === 0;

    switch (shapeType) {
      case 'circle':
        shapes += `<circle cx="50" cy="50" r="${radius}"
          fill="${filled ? color : 'none'}" ${filled ? '' : `stroke="${color}" stroke-width="${stroke}"`}/>`;
        break;

      case 'polygon':
        const sides = 5 + Math.floor(random() * 4);
        const points = generatePolygon(sides, 50, 50, radius, rotation + i * 15);
        shapes += `<polygon points="${points}"
          fill="${filled ? color : 'none'}" ${filled ? '' : `stroke="${color}" stroke-width="${stroke}"`}/>`;
        break;

      case 'star':
        const innerRadius = radius / GOLDEN_RATIO;
        const starPoints = generateStar(5, 50, 50, radius, innerRadius, rotation + i * 15);
        shapes += `<polygon points="${starPoints}"
          fill="${filled ? color : 'none'}" ${filled ? '' : `stroke="${color}" stroke-width="${stroke}"`}/>`;
        break;
    }
  }

  return shapes;
}

function generateSplitShapes(random: () => number, color: string): string {
  // Shape divided by lines/other shapes
  const mainRadius = constrainRadius(50, 50, 38);
  const mainType = pickFromArray(random, ['circle', 'hexagon', 'pentagon']);
  const rotation = pickFromArray(random, harmonicAngles());

  let shapes = '';

  // Main shape
  switch (mainType) {
    case 'circle':
      shapes += `<circle cx="50" cy="50" r="${mainRadius}" fill="${color}"/>`;
      break;
    case 'hexagon':
      const hexPoints = generateHexagon(50, 50, mainRadius, rotation);
      shapes += `<polygon points="${hexPoints}" fill="${color}"/>`;
      break;
    case 'pentagon':
      const pentPoints = generatePentagon(50, 50, mainRadius, rotation);
      shapes += `<polygon points="${pentPoints}" fill="${color}"/>`;
      break;
  }

  // Splitting lines
  const lineCount = 1 + Math.floor(random() * 2);
  const lineStroke = selectHarmonicStroke(random) * 1.5;

  for (let i = 0; i < lineCount; i++) {
    const angle = (i * 180 / lineCount + random() * 30) * Math.PI / 180;
    const length = mainRadius * 2.5;
    const x1 = 50 - length * Math.cos(angle);
    const y1 = 50 - length * Math.sin(angle);
    const x2 = 50 + length * Math.cos(angle);
    const y2 = 50 + length * Math.sin(angle);

    shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      stroke="#ffffff" stroke-width="${lineStroke}" stroke-linecap="round"/>`;
  }

  return shapes;
}

function generateScatteredShapes(random: () => number, color: string): string {
  // 2-3 LARGE shapes in asymmetric balance (logo-style composition)
  const shapeCount = 2 + Math.floor(random() * 2);
  let shapes = '';

  // Create large, bold shapes with clear hierarchy
  for (let i = 0; i < shapeCount; i++) {
    const shapeType = pickFromArray(random, ['circle', 'triangle', 'square', 'pentagon', 'hexagon']);
    const size = i === 0 ? 35 + random() * 10 : 25 + random() * 10; // First shape largest

    // Use golden ratio for positioning with clear separation
    const gPoints = goldenPoints();
    const xIndex = Math.floor(random() * gPoints.x.length);
    const yIndex = Math.floor(random() * gPoints.y.length);
    const x = gPoints.x[xIndex] * VIEWBOX_SIZE;
    const y = gPoints.y[yIndex] * VIEWBOX_SIZE;

    const rotation = pickFromArray(random, harmonicAngles());
    const constrained = constrainToViewbox(x, y, size);
    const useFill = i === 0 || random() > 0.5; // First shape always filled
    const stroke = selectHarmonicStroke(random);

    switch (shapeType) {
      case 'circle':
        const radius = constrainRadius(constrained.x, constrained.y, constrained.size / 2);
        if (useFill) {
          shapes += `<circle cx="${constrained.x}" cy="${constrained.y}" r="${radius}" fill="${color}"/>`;
        } else {
          shapes += `<circle cx="${constrained.x}" cy="${constrained.y}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        }
        break;

      case 'triangle':
        const triRadius = constrainRadius(constrained.x, constrained.y, constrained.size / 2);
        const triPoints = generateTriangle(constrained.x, constrained.y, triRadius, rotation);
        if (useFill) {
          shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
        } else {
          shapes += `<polygon points="${triPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        }
        break;

      case 'square':
        const halfSize = constrained.size / 2;
        if (useFill) {
          shapes += `<rect x="${constrained.x - halfSize}" y="${constrained.y - halfSize}"
            width="${constrained.size}" height="${constrained.size}" fill="${color}"
            transform="rotate(${rotation} ${constrained.x} ${constrained.y})"/>`;
        } else {
          shapes += `<rect x="${constrained.x - halfSize}" y="${constrained.y - halfSize}"
            width="${constrained.size}" height="${constrained.size}" fill="none" stroke="${color}" stroke-width="${stroke}"
            transform="rotate(${rotation} ${constrained.x} ${constrained.y})"/>`;
        }
        break;

      case 'pentagon':
        const pentRadius = constrainRadius(constrained.x, constrained.y, constrained.size / 2);
        const pentPoints = generatePentagon(constrained.x, constrained.y, pentRadius, rotation);
        if (useFill) {
          shapes += `<polygon points="${pentPoints}" fill="${color}"/>`;
        } else {
          shapes += `<polygon points="${pentPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        }
        break;

      case 'hexagon':
        const hexRadius = constrainRadius(constrained.x, constrained.y, constrained.size / 2);
        const hexPoints = generateHexagon(constrained.x, constrained.y, hexRadius, rotation);
        if (useFill) {
          shapes += `<polygon points="${hexPoints}" fill="${color}"/>`;
        } else {
          shapes += `<polygon points="${hexPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        }
        break;
    }
  }

  return shapes;
}

function generateOrbitalShapes(random: () => number, color: string): string {
  // Two LARGE shapes in opposing/divided relationship (like yin-yang concept)
  const divisionType = Math.floor(random() * 3);
  let shapes = '';

  const shapeA = pickFromArray(random, ['circle', 'triangle', 'square', 'pentagon', 'hexagon']);
  const shapeB = pickFromArray(random, ['circle', 'triangle', 'square', 'pentagon', 'hexagon']);
  const size = 28 + random() * 8; // Large shapes
  const stroke = selectHarmonicStroke(random);

  switch (divisionType) {
    case 0: // Left-Right division
      const leftX = 30;
      const rightX = 70;
      const centerY = 50;

      // Left shape
      const leftConstrained = constrainToViewbox(leftX, centerY, size);
      shapes += generateSingleShape(shapeA, leftConstrained.x, leftConstrained.y, leftConstrained.size, random, color, stroke);

      // Right shape
      const rightConstrained = constrainToViewbox(rightX, centerY, size);
      shapes += generateSingleShape(shapeB, rightConstrained.x, rightConstrained.y, rightConstrained.size, random, color, stroke);
      break;

    case 1: // Top-Bottom division
      const centerX = 50;
      const topY = 30;
      const bottomY = 70;

      // Top shape
      const topConstrained = constrainToViewbox(centerX, topY, size);
      shapes += generateSingleShape(shapeA, topConstrained.x, topConstrained.y, topConstrained.size, random, color, stroke);

      // Bottom shape
      const bottomConstrained = constrainToViewbox(centerX, bottomY, size);
      shapes += generateSingleShape(shapeB, bottomConstrained.x, bottomConstrained.y, bottomConstrained.size, random, color, stroke);
      break;

    case 2: // Diagonal division
      const topLeft = { x: 30, y: 30 };
      const bottomRight = { x: 70, y: 70 };

      // Top-left shape
      const tlConstrained = constrainToViewbox(topLeft.x, topLeft.y, size);
      shapes += generateSingleShape(shapeA, tlConstrained.x, tlConstrained.y, tlConstrained.size, random, color, stroke);

      // Bottom-right shape
      const brConstrained = constrainToViewbox(bottomRight.x, bottomRight.y, size);
      shapes += generateSingleShape(shapeB, brConstrained.x, brConstrained.y, brConstrained.size, random, color, stroke);
      break;
  }

  return shapes;
}

// Helper function to generate a single shape
function generateSingleShape(
  shapeType: string,
  x: number,
  y: number,
  size: number,
  random: () => number,
  color: string,
  stroke: number
): string {
  const rotation = pickFromArray(random, harmonicAngles());
  const useFill = random() > 0.5;

  switch (shapeType) {
    case 'circle':
      const radius = constrainRadius(x, y, size / 2);
      return useFill
        ? `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`
        : `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;

    case 'triangle':
      const triRadius = constrainRadius(x, y, size / 2);
      const triPoints = generateTriangle(x, y, triRadius, rotation);
      return useFill
        ? `<polygon points="${triPoints}" fill="${color}"/>`
        : `<polygon points="${triPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;

    case 'square':
      const halfSize = size / 2;
      return useFill
        ? `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size}" height="${size}" fill="${color}" transform="rotate(${rotation} ${x} ${y})"/>`
        : `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${stroke}" transform="rotate(${rotation} ${x} ${y})"/>`;

    case 'pentagon':
      const pentRadius = constrainRadius(x, y, size / 2);
      const pentPoints = generatePentagon(x, y, pentRadius, rotation);
      return useFill
        ? `<polygon points="${pentPoints}" fill="${color}"/>`
        : `<polygon points="${pentPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;

    case 'hexagon':
      const hexRadius = constrainRadius(x, y, size / 2);
      const hexPoints = generateHexagon(x, y, hexRadius, rotation);
      return useFill
        ? `<polygon points="${hexPoints}" fill="${color}"/>`
        : `<polygon points="${hexPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;

    default:
      return '';
  }
}

function generateLayeredShapes(random: () => number, color: string): string {
  // Shapes stacked with depth
  const layerCount = 2 + Math.floor(random() * 2);
  const offsetX = 8;
  const offsetY = 8;
  const shapeType = pickFromArray(random, ['triangle', 'hexagon', 'pentagon', 'square']);

  let shapes = '';

  for (let i = layerCount - 1; i >= 0; i--) {
    const x = 50 + (offsetX * i);
    const y = 50 + (offsetY * i);
    const size = 35 - i * 3;
    const radius = constrainRadius(x, y, size / 2);
    const rotation = pickFromArray(random, harmonicAngles());
    const isFront = i === 0;
    const stroke = selectHarmonicStroke(random);

    switch (shapeType) {
      case 'triangle':
        const triPoints = generateTriangle(x, y, radius, rotation);
        if (isFront) {
          shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
        } else {
          shapes += `<polygon points="${triPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        }
        break;

      case 'hexagon':
        const hexPoints = generateHexagon(x, y, radius, rotation);
        if (isFront) {
          shapes += `<polygon points="${hexPoints}" fill="${color}"/>`;
        } else {
          shapes += `<polygon points="${hexPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        }
        break;

      case 'pentagon':
        const pentPoints = generatePentagon(x, y, radius, rotation);
        if (isFront) {
          shapes += `<polygon points="${pentPoints}" fill="${color}"/>`;
        } else {
          shapes += `<polygon points="${pentPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        }
        break;

      case 'square':
        const halfSize = size / 2;
        if (isFront) {
          shapes += `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size}" height="${size}"
            fill="${color}" transform="rotate(${rotation} ${x} ${y})"/>`;
        } else {
          shapes += `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size}" height="${size}"
            fill="none" stroke="${color}" stroke-width="${stroke}" transform="rotate(${rotation} ${x} ${y})"/>`;
        }
        break;
    }
  }

  return shapes;
}

function generateRadialShapes(random: () => number, color: string): string {
  // FRAMED: One large shape inside another (frame concept)
  const outerShape = pickFromArray(random, ['circle', 'square', 'pentagon', 'hexagon']);
  const innerShape = pickFromArray(random, ['circle', 'triangle', 'square', 'pentagon', 'hexagon']);

  const outerSize = 70 + random() * 10; // Very large outer frame
  const innerSize = outerSize / GOLDEN_RATIO; // Golden ratio for inner shape

  const stroke = selectHarmonicStroke(random);

  let shapes = '';

  // Outer shape (always stroke-only, acts as frame)
  const outerConstrained = constrainToViewbox(50, 50, outerSize);
  shapes += generateSingleShape(outerShape, outerConstrained.x, outerConstrained.y, outerConstrained.size, random, color, stroke).replace('fill="${color}"', `fill="none" stroke="${color}" stroke-width="${stroke}"`);

  // Inner shape (filled, centered)
  const innerConstrained = constrainToViewbox(50, 50, innerSize);
  shapes += generateSingleShape(innerShape, innerConstrained.x, innerConstrained.y, innerConstrained.size, random, color, stroke);

  return shapes;
}

function generateOrganicShapes(random: () => number, color: string): string {
  // Curved forms in harmony
  const blobCount = 1 + Math.floor(random() * 2);
  let shapes = '';

  for (let i = 0; i < blobCount; i++) {
    const blobSize = 25 + random() * 15;
    const angle = (i * 120 + random() * 60) * Math.PI / 180;
    const distance = blobSize * 0.7;
    const x = 50 + distance * Math.cos(angle);
    const y = 50 + distance * Math.sin(angle);
    const rotation = random() * 360;
    const complexity = 0.2 + random() * 0.3;

    const blobPath = generateOrganicShape(x, y, blobSize, complexity, random, rotation);
    const stroke = selectHarmonicStroke(random);

    if (random() > 0.5) {
      shapes += `<path d="${blobPath}" fill="${color}"/>`;
    } else {
      shapes += `<path d="${blobPath}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
    }
  }

  // Add flowing curves
  const waveCount = 1 + Math.floor(random() * 2);
  for (let i = 0; i < waveCount; i++) {
    const waveRotation = (i * 90 + random() * 45) * Math.PI / 180;
    const amplitude = 8 + random() * 6;
    const frequency = 1 + random();
    const stroke = selectHarmonicStroke(random);

    const wavePath = generateWave(20, 50, 80, amplitude, frequency);
    shapes += `<path d="${wavePath}" fill="none" stroke="${color}"
      stroke-width="${stroke}" stroke-linecap="round"
      transform="rotate(${waveRotation * 180 / Math.PI} 50 50)"/>`;
  }

  return shapes;
}

// ============================================================================
// PATTERN MODE - ADVANCED PATTERN GENERATOR
// ============================================================================

/**
 * Generate sophisticated pattern with rotation and complexity
 */
export function generatePatternSymbol(seed: string, color: string, letter?: string): SymbolSVGResult {
  const random = createSeededRandom(seed);
  const firstLetter = letter ? letter.charAt(0).toUpperCase() : 'A';

  // Determine pattern structure from seed
  const structure = selectPatternStructure(random);

  let shapes = '';

  switch (structure) {
    case 'radial':
      shapes = generateRadialPattern(random, color, firstLetter);
      break;

    case 'circular':
      shapes = generateCircularPattern(random, color);
      break;

    case 'square':
      shapes = generateSquarePattern(random, color);
      break;

    case 'hexagonal':
      shapes = generateHexagonalPattern(random, color);
      break;

    case 'triangular':
      shapes = generateTriangularPattern(random, color);
      break;

    case 'spiral':
      shapes = generateSpiralPattern(random, color, firstLetter);
      break;

    case 'scattered':
      shapes = generateScatteredPattern(random, color);
      break;

    case 'wave':
      shapes = generateWavePattern(random, color);
      break;

    case 'constellation':
      shapes = generateConstellationPattern(random, color);
      break;

    case 'mandala':
      shapes = generateMandalaPattern(random, color, firstLetter);
      break;
  }

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

function generateRadialPattern(random: () => number, color: string, letter: string): string {
  // Elements around center with rotation (fewer, bigger)
  const elementCount = 6 + Math.floor(random() * 6); // Max 11 instead of 14
  const radius = 30 + random() * 8;
  const elementSize = 8 + random() * 4; // Minimum 8 to ensure visibility
  const centerSize = elementSize * 1.5;
  const useLetter = random() > 0.5; // 50% chance to include letter

  // Individual or global rotation
  const rotationType = pickFromArray(random, ['individual', 'progressive', 'none']);

  let shapes = '';

  // Center element - either letter or shape
  if (useLetter && letter) {
    const letterSize = 20 + random() * 15; // 20-35
    shapes += `<text x="50" y="50" font-family="inherit" font-size="${letterSize}" font-weight="700"
      fill="${color}" text-anchor="middle" dominant-baseline="central">${letter.charAt(0).toUpperCase()}</text>`;
  } else {
    shapes += `<circle cx="50" cy="50" r="${centerSize}" fill="${color}"/>`;
  }

  const points = circularPoints(elementCount, 50, 50, radius);

  for (let i = 0; i < elementCount; i++) {
    const point = points[i];
    let rotation = 0;

    switch (rotationType) {
      case 'individual':
        rotation = random() * 360;
        break;
      case 'progressive':
        rotation = (i * 360 / elementCount);
        break;
    }

    // Mix element types
    const elementType = Math.floor(random() * 3);

    switch (elementType) {
      case 0: // Circle
        shapes += `<circle cx="${point.x}" cy="${point.y}" r="${elementSize}" fill="${color}"/>`;
        break;

      case 1: // Triangle
        const triPoints = generateTriangle(point.x, point.y, elementSize, rotation);
        shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
        break;

      case 2: // Square
        const halfSize = elementSize;
        shapes += `<rect x="${point.x - halfSize}" y="${point.y - halfSize}"
          width="${elementSize * 2}" height="${elementSize * 2}" fill="${color}"
          transform="rotate(${rotation} ${point.x} ${point.y})"/>`;
        break;
    }
  }

  return shapes;
}

function generateCircularPattern(random: () => number, color: string): string {
  // Concentric circles with variations (fewer, bigger)
  const ringCount = 3 + Math.floor(random() * 2); // Max 4 instead of 5
  const spacing = goldenSpacing(40, ringCount);
  const stroke = selectHarmonicStroke(random);
  const centerSize = 8 + random() * 4; // Increased from 6

  // Add variation: some rings filled, some dashed
  const useVariation = random() > 0.5;

  let shapes = '';

  for (let i = 0; i < ringCount; i++) {
    const radius = spacing[i];
    const strokeWidth = i === 0 ? stroke * 1.5 : stroke;

    if (useVariation && i % 2 === 0 && random() > 0.5) {
      // Alternate: dashed circles for variety
      shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="8,4"/>`;
    } else {
      shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
    }
  }

  shapes += `<circle cx="50" cy="50" r="${centerSize}" fill="${color}"/>`;

  return shapes;
}

function generateSquarePattern(random: () => number, color: string): string {
  // Grid with variations (bigger elements)
  const gridSize = 3 + Math.floor(random() * 2); // 3x3 or 4x4
  const elementSize = 8 + random() * 4; // Increased from 6
  const spacing = (VIEWBOX_SIZE - SAFE_MARGIN * 2 - elementSize * gridSize) / (gridSize - 1);
  const startPos = SAFE_MARGIN + elementSize / 2;

  // Add more element variety
  const elementTypes = ['circle', 'triangle', 'square', 'pentagon'];
  const useRotationVariation = random() > 0.5;

  let shapes = '';

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = startPos + j * (spacing + elementSize);
      const y = startPos + i * (spacing + elementSize);
      const isCenterish = (i === Math.floor(gridSize / 2) && j === Math.floor(gridSize / 2));
      const size = isCenterish ? elementSize * 1.5 : elementSize;
      const rotation = useRotationVariation ? (i + j) * 45 : random() * 360;

      // Vary element types with more options
      if (random() > 0.3) {
        const elementType = pickFromArray(random, elementTypes);

        switch (elementType) {
          case 'circle':
            shapes += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`;
            break;
          case 'triangle':
            const triPoints = generateTriangle(x, y, size, rotation);
            shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
            break;
          case 'square':
            const halfSize = size;
            shapes += `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size * 2}" height="${size * 2}"
              fill="${color}" transform="rotate(${rotation} ${x} ${y})"/>`;
            break;
          case 'pentagon':
            const pentPoints = generatePentagon(x, y, size, rotation);
            shapes += `<polygon points="${pentPoints}" fill="${color}"/>`;
            break;
        }
      }
    }
  }

  return shapes;
}

function generateHexagonalPattern(random: () => number, color: string): string {
  // Honeycomb-like structure (bigger hexagons)
  const gridSize = 3;
  const elementSize = 14 + random() * 6; // Increased from 12
  const spacing = elementSize * 1.8;
  const startX = 50 - ((gridSize - 1) * spacing) / 2;
  const startY = 50 - ((gridSize - 1) * spacing * 0.866) / 2;

  // Add rotation variation
  const useRotationVariation = random() > 0.5;
  const baseRotation = pickFromArray(random, [0, 15, 30]);

  let shapes = '';

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = startX + col * spacing + (row % 2) * (spacing / 2);
      const y = startY + row * spacing * 0.866;

      if (random() > 0.2) {
        const rotation = useRotationVariation ? baseRotation + (row + col) * 10 : random() * 30;
        const hexPoints = generateHexagon(x, y, elementSize, rotation);
        const stroke = selectHarmonicStroke(random);

        // More variation in fill vs stroke
        const styleType = Math.floor(random() * 3);
        if (styleType === 0) {
          shapes += `<polygon points="${hexPoints}" fill="${color}"/>`;
        } else if (styleType === 1) {
          shapes += `<polygon points="${hexPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        } else {
          // Half-stroke effect
          shapes += `<polygon points="${hexPoints}" fill="${color}" stroke="${color}" stroke-width="${stroke * 0.5}"/>`;
        }
      }
    }
  }

  return shapes;
}

function generateTriangularPattern(random: () => number, color: string): string {
  // Delta/tessellated pattern
  const rows = 4 + Math.floor(random() * 2);
  const baseSize = (VIEWBOX_SIZE - SAFE_MARGIN * 2) / rows;
  const startY = SAFE_MARGIN + baseSize / 2;

  let shapes = '';

  for (let row = 0; row < rows; row++) {
    const trianglesInRow = row + 2;
    const rowY = startY + row * baseSize * 0.866;

    for (let i = 0; i < trianglesInRow; i++) {
      const x = 50 - ((trianglesInRow - 1) * baseSize / 2) + i * baseSize;
      const rotation = (row + i) % 2 === 0 ? 0 : 180;
      const size = baseSize * 0.8;

      if (random() > 0.2) {
        const triPoints = generateTriangle(x, rowY, size, rotation);
        shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
      }
    }
  }

  return shapes;
}

function generateSpiralPattern(random: () => number, color: string, letter: string): string {
  // Golden spiral with elements (fewer, bigger)
  const elementCount = 8 + Math.floor(random() * 6); // Max 13 instead of 16
  const maxRadius = 35;
  const elementSize = 8 + random() * 4; // Minimum 8 to ensure visibility
  const useLetter = random() > 0.5; // 50% chance to include letter

  const spiralPoints = goldenSpiralPoints(elementCount, 50, 50, maxRadius);

  let shapes = '';

  for (let i = 0; i < spiralPoints.length; i++) {
    const point = spiralPoints[i];
    const size = elementSize * (1 + i / elementCount); // Growing size

    const elementType = Math.floor(random() * 2);

    switch (elementType) {
      case 0: // Circle
        shapes += `<circle cx="${point.x}" cy="${point.y}" r="${size}" fill="${color}"/>`;
        break;

      case 1: // Triangle pointing outward
        const triPoints = generateTriangle(point.x, point.y, size * 1.2, point.angle);
        shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
        break;
    }
  }

  // Center element - either letter or shape
  if (useLetter && letter) {
    const letterSize = 18 + random() * 12; // 18-30
    shapes += `<text x="50" y="50" font-family="inherit" font-size="${letterSize}" font-weight="700"
      fill="${color}" text-anchor="middle" dominant-baseline="central">${letter.charAt(0).toUpperCase()}</text>`;
  } else {
    shapes += `<circle cx="50" cy="50" r="${elementSize * 1.5}" fill="${color}"/>`;
  }

  return shapes;
}

function generateScatteredPattern(random: () => number, color: string): string {
  // Organic distribution with some order (fewer, bigger)
  const elementCount = 8 + Math.floor(random() * 6); // Max 13 instead of 17 (fewer elements)
  const scales = harmonicScale(12, elementCount, false); // Start at 12 instead of 10

  let shapes = '';

  for (let i = 0; i < elementCount; i++) {
    const x = SAFE_MARGIN + random() * (VIEWBOX_SIZE - SAFE_MARGIN * 2);
    const y = SAFE_MARGIN + random() * (VIEWBOX_SIZE - SAFE_MARGIN * 2);
    const rawSize = scales[Math.floor(random() * scales.length)];
    const size = Math.max(8, rawSize); // Ensure minimum size of 8
    const rotation = random() * 360;

    const elementType = Math.floor(random() * 3);

    switch (elementType) {
      case 0:
        shapes += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`;
        break;
      case 1:
        const triPoints = generateTriangle(x, y, size, rotation);
        shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
        break;
      case 2:
        const halfSize = size;
        shapes += `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size * 2}" height="${size * 2}"
          fill="${color}" transform="rotate(${rotation} ${x} ${y})"/>`;
        break;
    }
  }

  return shapes;
}

function generateWavePattern(random: () => number, color: string): string {
  // Flowing repetition
  const waveCount = 3 + Math.floor(random() * 3);
  const spacing = (VIEWBOX_SIZE - SAFE_MARGIN * 2) / waveCount;
  const startY = SAFE_MARGIN + spacing / 2;
  const amplitude = 6 + random() * 6;
  const frequency = 1 + random() * 2;
  const stroke = selectHarmonicStroke(random);
  const rotation = pickFromArray(random, [0, 45, 90]);

  let shapes = '';

  for (let i = 0; i < waveCount; i++) {
    const y = startY + i * spacing;
    const wavePath = generateWave(10, y, 90, amplitude, frequency);
    shapes += `<path d="${wavePath}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" transform="rotate(${rotation} 50 50)"/>`;
  }

  return shapes;
}

function generateConstellationPattern(random: () => number, color: string): string {
  // Connected nodes (fewer, bigger)
  const nodeCount = 6 + Math.floor(random() * 5); // Max 10 instead of 12
  const nodes: Array<{ x: number; y: number }> = [];
  const nodeSize = 8 + random() * 4; // Minimum 8 to ensure visibility
  const connectionStroke = selectHarmonicStroke(random); // Thicker connections

  // Generate node positions
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i * 360 / nodeCount + random() * 30) * Math.PI / 180;
    const radius = 20 + random() * 18;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    nodes.push({ x, y });
  }

  let shapes = '';

  // Draw connections
  for (let i = 0; i < nodeCount; i++) {
    const next = (i + 1) % nodeCount;
    if (random() > 0.3) { // Not all connections
      shapes += `<line x1="${nodes[i].x}" y1="${nodes[i].y}"
        x2="${nodes[next].x}" y2="${nodes[next].y}"
        stroke="${color}" stroke-width="${connectionStroke}"/>`;
    }
  }

  // Draw nodes
  for (const node of nodes) {
    shapes += `<circle cx="${node.x}" cy="${node.y}" r="${nodeSize}" fill="${color}"/>`;
  }

  // Center node
  shapes += `<circle cx="50" cy="50" r="${nodeSize * 1.3}" fill="${color}"/>`;

  return shapes;
}

function generateMandalaPattern(random: () => number, color: string, letter?: string): string {
  // Symmetrical complexity (fewer, bigger)
  const sectors = 6 + Math.floor(random() * 4); // Max 9 instead of 12
  const layers = 2 + Math.floor(random() * 2);
  const useLetter = random() > 0.5 && letter; // 50% chance to include letter

  let shapes = '';

  // Generate one sector, then repeat with rotation
  const sectorAngle = 360 / sectors;

  for (let sector = 0; sector < sectors; sector++) {
    const rotation = sector * sectorAngle;

    for (let layer = 0; layer < layers; layer++) {
      const radius = 18 + layer * 12; // Increased from 15
      const elementSize = 8 + random() * 4; // Minimum 8 to ensure visibility
      const elementsInLayer = 2 + layer;

      for (let i = 0; i < elementsInLayer; i++) {
        const angle = (rotation + (i * sectorAngle / elementsInLayer)) * Math.PI / 180;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        const elementType = Math.floor(random() * 2);

        switch (elementType) {
          case 0:
            shapes += `<circle cx="${x}" cy="${y}" r="${elementSize}" fill="${color}"/>`;
            break;
          case 1:
            const triPoints = generateTriangle(x, y, elementSize, angle * 180 / Math.PI);
            shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
            break;
        }
      }
    }
  }

  // Center element - either letter or circle
  if (useLetter) {
    const letterSize = 18 + random() * 10; // 18-28
    shapes += `<text x="50" y="50" font-family="inherit" font-size="${letterSize}" font-weight="700"
      fill="${color}" text-anchor="middle" dominant-baseline="central">${letter.charAt(0).toUpperCase()}</text>`;
  } else {
    shapes += `<circle cx="50" cy="50" r="12" fill="${color}"/>`;
  }

  return shapes;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Main function to generate a symbol based on mode
 */
export function generateSymbol(
  mode: 'letter' | 'shape' | 'pattern',
  seed: string,
  color: string,
  options?: {
    letter?: string;
    font?: string;
  }
): SymbolSVGResult {
  switch (mode) {
    case 'letter':
      return generateLetterSymbol(
        options?.letter || 'A',
        seed,
        color,
        options?.font
      );
    case 'shape':
      return generateShapeSymbol(seed, color);
    case 'pattern':
      return generatePatternSymbol(seed, color, options?.letter);
    default:
      throw new Error(`Unknown symbol mode: ${mode}`);
  }
}
