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
  generateOctagon,
  generateOval,
  generateLine,
  generateBlock,
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
// LETTER MODE - TEMPLATE-BASED SYSTEM
// ============================================================================

type ShapeType = 'circle' | 'oval' | 'square' | 'roundedSquare' | 'triangle' | 'hexagon' | 'octagon' | 'star' | 'line' | 'block';
type FillStyle = 'outline' | 'filled' | 'inverted';
type PlacementOption = 'center' | 'top' | 'bottom' | 'left' | 'right';

/**
 * Generate letter-based symbol using template system
 */
export function generateLetterSymbol(
  letter: string,
  seed: string,
  color: string,
  font: string = 'Inter'
): SymbolSVGResult {
  const random = createSeededRandom(seed);
  const firstLetter = letter.charAt(0).toUpperCase();

  // Pick shape type
  const shapeTypes: ShapeType[] = ['circle', 'oval', 'square', 'roundedSquare', 'triangle', 'hexagon', 'octagon', 'star', 'line', 'block'];
  const shapeType = pickFromArray(random, shapeTypes);

  // Pick fill style
  const fillStyles: FillStyle[] = ['outline', 'filled', 'inverted'];
  const fillStyle = pickFromArray(random, fillStyles);

  // Pick placement
  const placements: PlacementOption[] = ['center', 'top', 'bottom', 'left', 'right'];
  const placement = pickFromArray(random, placements);

  // Variables
  const letterSize = 30 + random() * 20; // 30-50
  const letterRotation = pickFromArray(random, harmonicAngles());
  const shapeRotation = pickFromArray(random, harmonicAngles());
  const padding = 8 + random() * 10; // 8-18
  const strokeWidth = selectHarmonicStroke(random);
  const cornerRadius = 5 + random() * 15; // 5-20

  // Calculate placement position
  let letterX = 50;
  let letterY = 50;

  switch (placement) {
    case 'top':
      letterY = 25 + padding;
      break;
    case 'bottom':
      letterY = 75 - padding;
      break;
    case 'left':
      letterX = 25 + padding;
      break;
    case 'right':
      letterX = 75 - padding;
      break;
    // center is default (50, 50)
  }

  const shapes = generateLetterWithShape(
    random,
    firstLetter,
    letterX,
    letterY,
    letterSize,
    letterRotation,
    font,
    color,
    shapeType,
    fillStyle,
    shapeRotation,
    padding,
    strokeWidth,
    cornerRadius
  );

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

function generateLetterWithShape(
  random: () => number,
  letter: string,
  letterX: number,
  letterY: number,
  letterSize: number,
  letterRotation: number,
  font: string,
  color: string,
  shapeType: ShapeType,
  fillStyle: FillStyle,
  shapeRotation: number,
  padding: number,
  strokeWidth: number,
  cornerRadius: number
): string {
  // Reduced shape size to prevent cutoff - cap at 65 to ensure it fits
  const rawShapeSize = letterSize * 1.3 + padding;
  const shapeSize = Math.min(rawShapeSize, 65);
  const centerX = 50;
  const centerY = 50;

  let shape = '';
  let letterFill = color;
  let shapeFill = 'none';
  let shapeStroke = color;
  let shapeStrokeAttr = `stroke="${shapeStroke}" stroke-width="${strokeWidth}"`;

  // Determine fill style
  switch (fillStyle) {
    case 'outline':
      // Shape outlined, letter solid
      letterFill = color;
      shapeFill = 'none';
      shapeStrokeAttr = `stroke="${color}" stroke-width="${strokeWidth}"`;
      break;
    case 'filled':
      // Shape filled, letter transparent/excluded (use mask)
      letterFill = '#ffffff';
      shapeFill = color;
      shapeStrokeAttr = '';
      break;
    case 'inverted':
      // Shape outline + solid letter
      letterFill = color;
      shapeFill = 'none';
      shapeStrokeAttr = `stroke="${color}" stroke-width="${strokeWidth}"`;
      break;
  }

  // Generate shape
  switch (shapeType) {
    case 'circle': {
      const radius = constrainRadius(centerX, centerY, shapeSize / 2, strokeWidth);
      shape = `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${shapeFill}" ${shapeStrokeAttr}/>`;
      break;
    }
    case 'oval': {
      const radiusX = constrainRadius(centerX, centerY, shapeSize / 2, strokeWidth);
      const radiusY = radiusX / GOLDEN_RATIO;
      const ovalSvg = generateOval(centerX, centerY, radiusX, radiusY, shapeRotation);
      shape = ovalSvg.replace('"/>', `" fill="${shapeFill}" ${shapeStrokeAttr}/>`);
      break;
    }
    case 'square': {
      const size = shapeSize;
      const x = centerX - size / 2;
      const y = centerY - size / 2;
      shape = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${shapeFill}" ${shapeStrokeAttr} transform="rotate(${shapeRotation} ${centerX} ${centerY})"/>`;
      break;
    }
    case 'roundedSquare': {
      const size = shapeSize;
      const x = centerX - size / 2;
      const y = centerY - size / 2;
      const rect = generateRoundedRect(x, y, size, size, cornerRadius, shapeRotation);
      shape = `<path d="${rect.path}" fill="${shapeFill}" ${shapeStrokeAttr} transform="${rect.transform}"/>`;
      break;
    }
    case 'triangle': {
      const radius = constrainRadius(centerX, centerY, shapeSize / 2, strokeWidth);
      const points = generateTriangle(centerX, centerY, radius, shapeRotation);
      shape = `<polygon points="${points}" fill="${shapeFill}" ${shapeStrokeAttr}/>`;
      break;
    }
    case 'hexagon': {
      const radius = constrainRadius(centerX, centerY, shapeSize / 2, strokeWidth);
      const points = generateHexagon(centerX, centerY, radius, shapeRotation);
      shape = `<polygon points="${points}" fill="${shapeFill}" ${shapeStrokeAttr}/>`;
      break;
    }
    case 'octagon': {
      const radius = constrainRadius(centerX, centerY, shapeSize / 2, strokeWidth);
      const points = generateOctagon(centerX, centerY, radius, shapeRotation);
      shape = `<polygon points="${points}" fill="${shapeFill}" ${shapeStrokeAttr}/>`;
      break;
    }
    case 'star': {
      const outerRadius = constrainRadius(centerX, centerY, shapeSize / 2, strokeWidth);
      const innerRadius = outerRadius / GOLDEN_RATIO;
      const points = generateStar(5, centerX, centerY, outerRadius, innerRadius, shapeRotation);
      shape = `<polygon points="${points}" fill="${shapeFill}" ${shapeStrokeAttr}/>`;
      break;
    }
    case 'line': {
      const length = shapeSize * 0.8;
      const angle = shapeRotation * Math.PI / 180;
      const x1 = centerX - (length / 2) * Math.cos(angle);
      const y1 = centerY - (length / 2) * Math.sin(angle);
      const x2 = centerX + (length / 2) * Math.cos(angle);
      const y2 = centerY + (length / 2) * Math.sin(angle);
      const lineSvg = generateLine(x1, y1, x2, y2, strokeWidth * 2);
      shape = lineSvg.replace('stroke-linecap', `stroke="${color}" stroke-linecap`);
      break;
    }
    case 'block': {
      const width = shapeSize;
      const height = shapeSize / GOLDEN_RATIO;
      const x = centerX - width / 2;
      const y = centerY - height / 2;
      const blockSvg = generateBlock(x, y, width, height, shapeRotation);
      shape = blockSvg.replace('"/>', `" fill="${shapeFill}" ${shapeStrokeAttr}/>`);
      break;
    }
  }

  // Generate letter
  const letterElement = `<text x="${letterX}" y="${letterY}" font-family="${font}" font-size="${letterSize}" font-weight="700"
    fill="${letterFill}" text-anchor="middle" dominant-baseline="central"
    transform="rotate(${letterRotation} ${letterX} ${letterY})">${letter}</text>`;

  return `${shape}${letterElement}`;
}

// OLD COMPOSITION FUNCTIONS - TO BE REMOVED
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

type CombiningMethod = 'overlap' | 'stack' | 'exclude' | 'radial' | 'symmetrical' | 'golden' | 'framed';
type ShapeFillStyle = 'outline' | 'filled';

/**
 * Generate geometric composition by combining 2-5 shapes with structure
 */
export function generateShapeSymbol(seed: string, color: string): SymbolSVGResult {
  const random = createSeededRandom(seed);

  // Determine number of shapes (2-4 for more focus)
  const shapeCount = 2 + Math.floor(random() * 3);

  // Determine combining method - now with more structured options
  const combiningMethods: CombiningMethod[] = ['overlap', 'stack', 'exclude', 'radial', 'symmetrical', 'golden', 'framed'];
  const combiningMethod = pickFromArray(random, combiningMethods);

  let shapes = '';

  switch (combiningMethod) {
    case 'overlap':
      shapes = generateOverlappingShapes(random, color, shapeCount);
      break;

    case 'stack':
      shapes = generateStackedShapes(random, color, shapeCount);
      break;

    case 'exclude':
      shapes = generateExcludedShapes(random, color, shapeCount);
      break;

    case 'radial':
      shapes = generateRadialShapes(random, color, shapeCount);
      break;

    case 'symmetrical':
      shapes = generateSymmetricalShapes(random, color, shapeCount);
      break;

    case 'golden':
      shapes = generateGoldenRatioShapes(random, color, shapeCount);
      break;

    case 'framed':
      shapes = generateFramedShapes(random, color);
      break;
  }

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

function generateOverlappingShapes(random: () => number, color: string, shapeCount: number): string {
  // Generate shapes that overlap with clear boolean intersection operations
  const shapeTypes: ShapeType[] = ['circle', 'oval', 'square', 'roundedSquare', 'triangle', 'hexagon', 'octagon', 'star'];
  const useIntersection = Math.floor(random() * 2) === 0; // Deterministic choice

  if (!useIntersection) {
    // Simple overlapping without boolean operations - use SAME shape type for consistency
    const shapeType = pickFromArray(random, shapeTypes);
    const fillStyle: ShapeFillStyle = pickFromArray(random, ['outline', 'filled']);
    const strokeWidth = selectHarmonicStroke(random);
    const cornerRadius = 8;

    let shapes = '';
    for (let i = 0; i < shapeCount; i++) {
      const size = 30; // Fixed size for consistency
      const rotation = (i * 45) % 360; // Structured rotation

      // Position shapes closer together for clear overlap
      const angle = (i * 360 / shapeCount);
      const distance = 18; // Fixed distance for consistent overlap
      const x = 50 + distance * Math.cos(angle * Math.PI / 180);
      const y = 50 + distance * Math.sin(angle * Math.PI / 180);

      const constrained = constrainToViewbox(x, y, size);

      shapes += generateShapeWithStyle(
        shapeType,
        constrained.x,
        constrained.y,
        constrained.size,
        rotation,
        fillStyle,
        color,
        strokeWidth,
        cornerRadius,
        random
      );
    }
    return shapes;
  }

  // Use intersection boolean operations - improved for clarity
  const shapeType = pickFromArray(random, shapeTypes); // Use SAME shape for all
  const size = 35; // Fixed larger size for clearer intersections
  const cornerRadius = 8;

  let defs = '<defs>';
  let shapes = '';
  const shapeData: Array<{x: number, y: number, rotation: number}> = [];

  // Generate shape positions - ensure they overlap significantly
  for (let i = 0; i < shapeCount; i++) {
    const rotation = pickFromArray(random, harmonicAngles());

    // Position shapes very close together for clear intersection
    const angle = (i * 360 / shapeCount);
    const distance = 12; // Closer distance for better intersection
    const x = 50 + distance * Math.cos(angle * Math.PI / 180);
    const y = 50 + distance * Math.sin(angle * Math.PI / 180);

    shapeData.push({ x, y, rotation });
  }

  // Create clip paths - each shape clips the previous one
  for (let i = 1; i < shapeData.length; i++) {
    const shape = shapeData[i];
    defs += `<clipPath id="intersect-${i}">`;
    defs += generateShapeForClipPath(shapeType, shape.x, shape.y, size, shape.rotation, cornerRadius, random);
    defs += `</clipPath>`;
  }

  defs += '</defs>';

  // First shape - no clipping
  shapes += generateShapeWithStyle(
    shapeType,
    shapeData[0].x,
    shapeData[0].y,
    size,
    shapeData[0].rotation,
    'filled',
    color,
    3,
    cornerRadius,
    random
  );

  // Subsequent shapes - each is the intersection with previous shapes
  for (let i = 1; i < shapeData.length; i++) {
    const shape = shapeData[i];

    shapes += generateShapeWithStyle(
      shapeType,
      shape.x,
      shape.y,
      size,
      shape.rotation,
      'filled',
      color,
      3,
      cornerRadius,
      random,
      `intersect-${i}` // Apply intersection clipping
    );
  }

  return defs + shapes;
}

function generateStackedShapes(random: () => number, color: string, shapeCount: number): string {
  // Generate shapes with structured layering and depth
  const shapeTypes: ShapeType[] = ['circle', 'oval', 'square', 'roundedSquare', 'triangle', 'hexagon', 'octagon', 'star'];
  const shapeType = pickFromArray(random, shapeTypes); // Use SAME shape for all layers
  const strokeWidth = selectHarmonicStroke(random);
  const cornerRadius = 8;

  let shapes = '';

  // Stack from back to front with golden ratio sizing
  const baseSize = 50;
  for (let i = shapeCount - 1; i >= 0; i--) {
    const fillStyle: ShapeFillStyle = i === 0 ? 'filled' : 'outline'; // Front is filled, rest outlined
    const size = baseSize * Math.pow(GOLDEN_RATIO_INVERSE, shapeCount - 1 - i); // Golden ratio progression
    const rotation = (i * 15) % 360; // Structured rotation progression

    // Offset each layer using golden ratio
    const offset = (shapeCount - 1 - i) * 6;
    const offsetX = 50 + offset;
    const offsetY = 50 + offset;

    const constrained = constrainToViewbox(offsetX, offsetY, size);

    shapes += generateShapeWithStyle(
      shapeType,
      constrained.x,
      constrained.y,
      constrained.size,
      rotation,
      fillStyle,
      color,
      strokeWidth,
      cornerRadius,
      random
    );
  }

  return shapes;
}

function generateExcludedShapes(random: () => number, color: string, shapeCount: number): string {
  // Generate shapes with structured exclusion/difference operations
  let shapes = '';
  let defs = '<defs>';
  const shapeTypes: ShapeType[] = ['circle', 'oval', 'square', 'roundedSquare', 'triangle', 'hexagon', 'octagon', 'star'];
  const shapeType = pickFromArray(random, shapeTypes); // Use SAME shape for all
  const cornerRadius = 8;

  const clipShapes: Array<{x: number, y: number, size: number, rotation: number}> = [];

  // Generate clip shapes with structured positioning and sizing
  for (let i = 0; i < shapeCount; i++) {
    const size = 35 - (i * 8); // Progressively smaller shapes
    const rotation = pickFromArray(random, harmonicAngles());

    // Position shapes in structured circular pattern
    const angle = (i * 360 / shapeCount);
    const distance = 15; // Fixed distance
    const x = 50 + distance * Math.cos(angle * Math.PI / 180);
    const y = 50 + distance * Math.sin(angle * Math.PI / 180);

    const constrained = constrainToViewbox(x, y, size);
    clipShapes.push({
      x: constrained.x,
      y: constrained.y,
      size: constrained.size,
      rotation
    });
  }

  // Create clip paths for exclusion
  for (let i = 0; i < clipShapes.length; i++) {
    defs += `<clipPath id="clip-${i}">`;
    // The clip path includes everything EXCEPT the shapes after this one
    defs += `<rect x="0" y="0" width="100" height="100" fill="white"/>`;

    // Subtract subsequent shapes
    for (let j = i + 1; j < clipShapes.length; j++) {
      const clipShape = clipShapes[j];
      defs += generateShapeForClipPath(shapeType, clipShape.x, clipShape.y, clipShape.size, clipShape.rotation, cornerRadius, random);
    }

    defs += `</clipPath>`;
  }

  defs += '</defs>';

  // Generate the actual shapes with clip paths applied
  const strokeWidth = selectHarmonicStroke(random);
  for (let i = 0; i < clipShapes.length; i++) {
    const clipShape = clipShapes[i];

    shapes += generateShapeWithStyle(
      shapeType,
      clipShape.x,
      clipShape.y,
      clipShape.size,
      clipShape.rotation,
      'filled',
      color,
      strokeWidth,
      cornerRadius,
      random,
      i < clipShapes.length - 1 ? `clip-${i}` : undefined
    );
  }

  return defs + shapes;
}

/**
 * Generate shapes arranged in perfect radial pattern
 */
function generateRadialShapes(random: () => number, color: string, shapeCount: number): string {
  // Shapes arranged in perfect circle around center
  const shapeTypes: ShapeType[] = ['circle', 'oval', 'square', 'roundedSquare', 'triangle', 'hexagon', 'octagon', 'star'];
  const shapeType = pickFromArray(random, shapeTypes); // Use SAME shape for all
  const radius = 25; // Fixed radius from center
  const elementSize = 20; // Fixed size
  const strokeWidth = selectHarmonicStroke(random);
  const cornerRadius = 8;

  let shapes = '';

  // Center shape
  shapes += generateShapeWithStyle(
    shapeType,
    50,
    50,
    elementSize * 1.2,
    0,
    'filled',
    color,
    strokeWidth,
    cornerRadius,
    random
  );

  // Radial shapes
  const points = circularPoints(shapeCount, 50, 50, radius);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const rotation = (i * 360 / shapeCount); // Progressive rotation

    shapes += generateShapeWithStyle(
      shapeType,
      point.x,
      point.y,
      elementSize,
      rotation,
      'outline',
      color,
      strokeWidth,
      cornerRadius,
      random
    );
  }

  return shapes;
}

/**
 * Generate symmetrically mirrored shapes
 */
function generateSymmetricalShapes(random: () => number, color: string, shapeCount: number): string {
  // Shapes mirrored across center point
  const shapeTypes: ShapeType[] = ['circle', 'oval', 'square', 'roundedSquare', 'triangle', 'hexagon', 'octagon', 'star'];
  const shapeType = pickFromArray(random, shapeTypes);
  const size = 22;
  const strokeWidth = selectHarmonicStroke(random);
  const cornerRadius = 8;
  const fillStyle: ShapeFillStyle = pickFromArray(random, ['outline', 'filled']);

  let shapes = '';

  // Create pairs of mirrored shapes
  const pairsCount = Math.ceil(shapeCount / 2);

  for (let i = 0; i < pairsCount; i++) {
    const angle = (i * 180 / pairsCount) * Math.PI / 180;
    const distance = 20;

    // Shape on one side
    const x1 = 50 + distance * Math.cos(angle);
    const y1 = 50 + distance * Math.sin(angle);

    // Mirrored shape on opposite side
    const x2 = 50 - distance * Math.cos(angle);
    const y2 = 50 - distance * Math.sin(angle);

    const rotation = angle * 180 / Math.PI;

    shapes += generateShapeWithStyle(
      shapeType,
      x1,
      y1,
      size,
      rotation,
      fillStyle,
      color,
      strokeWidth,
      cornerRadius,
      random
    );

    shapes += generateShapeWithStyle(
      shapeType,
      x2,
      y2,
      size,
      rotation + 180, // Mirror rotation
      fillStyle,
      color,
      strokeWidth,
      cornerRadius,
      random
    );
  }

  // Center shape
  shapes += generateShapeWithStyle(
    shapeType,
    50,
    50,
    size * 0.7,
    0,
    'filled',
    color,
    strokeWidth,
    cornerRadius,
    random
  );

  return shapes;
}

/**
 * Generate shapes at golden ratio positions
 */
function generateGoldenRatioShapes(random: () => number, color: string, shapeCount: number): string {
  // Shapes positioned at golden ratio points (0.382, 0.5, 0.618)
  const shapeTypes: ShapeType[] = ['circle', 'oval', 'square', 'roundedSquare', 'triangle', 'hexagon', 'octagon', 'star'];
  const shapeType = pickFromArray(random, shapeTypes);
  const gPoints = goldenPoints();
  const strokeWidth = selectHarmonicStroke(random);
  const cornerRadius = 8;

  let shapes = '';

  // Use golden ratio positions
  const positions = [
    { x: gPoints.x[0] * 100, y: gPoints.y[0] * 100, size: 18 }, // near, near
    { x: gPoints.x[2] * 100, y: gPoints.y[0] * 100, size: 22 }, // far, near (larger)
    { x: gPoints.x[0] * 100, y: gPoints.y[2] * 100, size: 16 }, // near, far
    { x: gPoints.x[2] * 100, y: gPoints.y[2] * 100, size: 20 }, // far, far
  ];

  for (let i = 0; i < Math.min(shapeCount, positions.length); i++) {
    const pos = positions[i];
    const fillStyle: ShapeFillStyle = i === 1 ? 'filled' : 'outline'; // Largest is filled

    shapes += generateShapeWithStyle(
      shapeType,
      pos.x,
      pos.y,
      pos.size,
      (i * 45) % 360,
      fillStyle,
      color,
      strokeWidth,
      cornerRadius,
      random
    );
  }

  return shapes;
}

/**
 * Generate concentric framed shapes
 */
function generateFramedShapes(random: () => number, color: string): string {
  // One shape inside another (frame concept)
  const shapeTypes: ShapeType[] = ['circle', 'square', 'roundedSquare', 'hexagon', 'octagon'];
  const outerShape = pickFromArray(random, shapeTypes);
  const innerShape = pickFromArray(random, shapeTypes);

  const outerSize = 70;
  const innerSize = outerSize / GOLDEN_RATIO; // Golden ratio sizing

  const strokeWidth = selectHarmonicStroke(random);
  const cornerRadius = 10;

  let shapes = '';

  // Outer frame (always outline)
  shapes += generateShapeWithStyle(
    outerShape,
    50,
    50,
    outerSize,
    0,
    'outline',
    color,
    strokeWidth * 1.5,
    cornerRadius,
    random
  );

  // Inner shape (filled)
  shapes += generateShapeWithStyle(
    innerShape,
    50,
    50,
    innerSize,
    45, // Rotated for visual interest
    'filled',
    color,
    strokeWidth,
    cornerRadius,
    random
  );

  return shapes;
}

function generateShapeWithStyle(
  shapeType: ShapeType,
  x: number,
  y: number,
  size: number,
  rotation: number,
  fillStyle: ShapeFillStyle,
  color: string,
  strokeWidth: number,
  cornerRadius: number,
  random: () => number,
  clipPathId?: string
): string {
  let fillAttr = '';
  let strokeAttr = '';
  let clipAttr = clipPathId ? `clip-path="url(#${clipPathId})"` : '';

  // Determine fill and stroke based on style
  switch (fillStyle) {
    case 'filled':
      fillAttr = `fill="${color}"`;
      strokeAttr = '';
      break;
    case 'outline':
      fillAttr = 'fill="none"';
      strokeAttr = `stroke="${color}" stroke-width="${strokeWidth}"`;
      break;
  }

  // Generate shape based on type
  switch (shapeType) {
    case 'circle': {
      const radius = constrainRadius(x, y, size / 2, strokeWidth);
      return `<circle cx="${x}" cy="${y}" r="${radius}" ${fillAttr} ${strokeAttr} ${clipAttr}/>`;
    }
    case 'oval': {
      const radiusX = constrainRadius(x, y, size / 2, strokeWidth);
      const radiusY = radiusX / GOLDEN_RATIO;
      const ovalSvg = generateOval(x, y, radiusX, radiusY, rotation);
      return ovalSvg.replace('"/>', `" ${fillAttr} ${strokeAttr} ${clipAttr}/>`);
    }
    case 'square': {
      const halfSize = size / 2;
      return `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size}" height="${size}" ${fillAttr} ${strokeAttr} ${clipAttr} transform="rotate(${rotation} ${x} ${y})"/>`;
    }
    case 'roundedSquare': {
      const halfSize = size / 2;
      const rectX = x - halfSize;
      const rectY = y - halfSize;
      const rect = generateRoundedRect(rectX, rectY, size, size, cornerRadius, rotation);
      return `<path d="${rect.path}" ${fillAttr} ${strokeAttr} ${clipAttr} transform="${rect.transform}"/>`;
    }
    case 'triangle': {
      const radius = constrainRadius(x, y, size / 2, strokeWidth);
      const points = generateTriangle(x, y, radius, rotation);
      return `<polygon points="${points}" ${fillAttr} ${strokeAttr} ${clipAttr}/>`;
    }
    case 'hexagon': {
      const radius = constrainRadius(x, y, size / 2, strokeWidth);
      const points = generateHexagon(x, y, radius, rotation);
      return `<polygon points="${points}" ${fillAttr} ${strokeAttr} ${clipAttr}/>`;
    }
    case 'octagon': {
      const radius = constrainRadius(x, y, size / 2, strokeWidth);
      const points = generateOctagon(x, y, radius, rotation);
      return `<polygon points="${points}" ${fillAttr} ${strokeAttr} ${clipAttr}/>`;
    }
    case 'star': {
      const outerRadius = constrainRadius(x, y, size / 2, strokeWidth);
      const innerRadius = outerRadius / GOLDEN_RATIO;
      const points = generateStar(5, x, y, outerRadius, innerRadius, rotation);
      return `<polygon points="${points}" ${fillAttr} ${strokeAttr} ${clipAttr}/>`;
    }
    case 'line': {
      const length = size * 0.8;
      const angle = rotation * Math.PI / 180;
      const x1 = x - (length / 2) * Math.cos(angle);
      const y1 = y - (length / 2) * Math.sin(angle);
      const x2 = x + (length / 2) * Math.cos(angle);
      const y2 = y + (length / 2) * Math.sin(angle);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth * 2}" ${clipAttr} stroke-linecap="round"/>`;
    }
    case 'block': {
      const width = size;
      const height = size / GOLDEN_RATIO;
      const blockX = x - width / 2;
      const blockY = y - height / 2;
      const blockSvg = generateBlock(blockX, blockY, width, height, rotation);
      return blockSvg.replace('"/>', `" ${fillAttr} ${strokeAttr} ${clipAttr}/>`);
    }
    default:
      return '';
  }
}

function generateShapeForClipPath(
  shapeType: ShapeType,
  x: number,
  y: number,
  size: number,
  rotation: number,
  cornerRadius: number,
  random: () => number
): string {
  // Generate shapes for use in clipPath (always filled black to subtract)
  switch (shapeType) {
    case 'circle': {
      const radius = constrainRadius(x, y, size / 2);
      return `<circle cx="${x}" cy="${y}" r="${radius}" fill="black"/>`;
    }
    case 'oval': {
      const radiusX = constrainRadius(x, y, size / 2);
      const radiusY = radiusX / GOLDEN_RATIO;
      return `<ellipse cx="${x}" cy="${y}" rx="${radiusX}" ry="${radiusY}" fill="black" transform="rotate(${rotation} ${x} ${y})"/>`;
    }
    case 'square': {
      const halfSize = size / 2;
      return `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size}" height="${size}" fill="black" transform="rotate(${rotation} ${x} ${y})"/>`;
    }
    case 'roundedSquare': {
      const halfSize = size / 2;
      const rectX = x - halfSize;
      const rectY = y - halfSize;
      const rect = generateRoundedRect(rectX, rectY, size, size, cornerRadius, rotation);
      return `<path d="${rect.path}" fill="black" transform="${rect.transform}"/>`;
    }
    case 'triangle': {
      const radius = constrainRadius(x, y, size / 2);
      const points = generateTriangle(x, y, radius, rotation);
      return `<polygon points="${points}" fill="black"/>`;
    }
    case 'hexagon': {
      const radius = constrainRadius(x, y, size / 2);
      const points = generateHexagon(x, y, radius, rotation);
      return `<polygon points="${points}" fill="black"/>`;
    }
    case 'octagon': {
      const radius = constrainRadius(x, y, size / 2);
      const points = generateOctagon(x, y, radius, rotation);
      return `<polygon points="${points}" fill="black"/>`;
    }
    case 'star': {
      const outerRadius = constrainRadius(x, y, size / 2);
      const innerRadius = outerRadius / GOLDEN_RATIO;
      const points = generateStar(5, x, y, outerRadius, innerRadius, rotation);
      return `<polygon points="${points}" fill="black"/>`;
    }
    case 'line': {
      const length = size * 0.8;
      const angle = rotation * Math.PI / 180;
      const x1 = x - (length / 2) * Math.cos(angle);
      const y1 = y - (length / 2) * Math.sin(angle);
      const x2 = x + (length / 2) * Math.cos(angle);
      const y2 = y + (length / 2) * Math.sin(angle);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="3" stroke-linecap="round"/>`;
    }
    case 'block': {
      const width = size;
      const height = size / GOLDEN_RATIO;
      const blockX = x - width / 2;
      const blockY = y - height / 2;
      return `<rect x="${blockX}" y="${blockY}" width="${width}" height="${height}" fill="black" transform="rotate(${rotation} ${x} ${y})"/>`;
    }
    default:
      return '';
  }
}

// OLD SHAPE COMPOSITION FUNCTIONS - NO LONGER USED
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
export function generatePatternSymbol(seed: string, color: string, letter?: string, font: string = 'Inter'): SymbolSVGResult {
  const random = createSeededRandom(seed);
  const firstLetter = letter ? letter.charAt(0).toUpperCase() : 'A';

  // Determine pattern structure from seed
  const structure = selectPatternStructure(random);

  let shapes = '';

  switch (structure) {
    case 'radial':
      shapes = generateRadialPattern(random, color, firstLetter, font);
      break;

    case 'circular':
      shapes = generateCircularPattern(random, color);
      break;

    case 'square':
      shapes = generateSquarePattern(random, color, firstLetter, font);
      break;

    case 'hexagonal':
      shapes = generateHexagonalPattern(random, color, firstLetter, font);
      break;

    case 'triangular':
      shapes = generateTriangularPattern(random, color, firstLetter, font);
      break;

    case 'spiral':
      shapes = generateSpiralPattern(random, color, firstLetter, font);
      break;

    case 'scattered':
      shapes = generateScatteredPattern(random, color, firstLetter, font);
      break;

    case 'wave':
      shapes = generateWavePattern(random, color);
      break;

    case 'constellation':
      shapes = generateConstellationPattern(random, color);
      break;

    case 'mandala':
      shapes = generateMandalaPattern(random, color, firstLetter, font);
      break;
  }

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

function generateRadialPattern(random: () => number, color: string, letter: string, font: string): string {
  // Elements around center with structured rotation - can repeat letters OR shapes
  const elementCount = 8; // Fixed count for consistency
  const radius = 32; // Fixed radius
  const elementSize = 10; // Fixed size
  const centerSize = elementSize * 1.5;

  // Decide: repeat LETTER throughout entire pattern, or use shapes?
  const repeatLetter = letter && Math.floor(random() * 2) === 0;

  // Pick ONE element type for the entire pattern (used only if not repeating letter)
  const elementType = Math.floor(random() * 3);

  let shapes = '';

  // Center element
  if (repeatLetter) {
    const letterSize = 24; // Fixed letter size
    shapes += `<text x="50" y="50" font-family="${font}" font-size="${letterSize}" font-weight="700"
      fill="${color}" text-anchor="middle" dominant-baseline="central">${letter.charAt(0).toUpperCase()}</text>`;
  } else {
    // Use same shape type as the pattern for center
    if (elementType === 0) {
      shapes += `<circle cx="50" cy="50" r="${centerSize}" fill="${color}"/>`;
    } else if (elementType === 1) {
      const triPoints = generateTriangle(50, 50, centerSize, 0);
      shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
    } else {
      shapes += `<rect x="${50 - centerSize}" y="${50 - centerSize}"
        width="${centerSize * 2}" height="${centerSize * 2}" fill="${color}"/>`;
    }
  }

  const points = circularPoints(elementCount, 50, 50, radius);

  for (let i = 0; i < elementCount; i++) {
    const point = points[i];
    const rotation = (i * 360 / elementCount); // Always progressive

    if (repeatLetter) {
      // REPEAT THE LETTER at each position
      const letterSize = 16; // Smaller for radial positions
      shapes += `<text x="${point.x}" y="${point.y}" font-family="${font}" font-size="${letterSize}" font-weight="700"
        fill="${color}" text-anchor="middle" dominant-baseline="central"
        transform="rotate(${rotation} ${point.x} ${point.y})">${letter.charAt(0).toUpperCase()}</text>`;
    } else {
      // Use the SAME shape type for all elements
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
  }

  return shapes;
}

function generateCircularPattern(random: () => number, color: string): string {
  // Concentric circles with consistent style
  const ringCount = 4; // Fixed count
  const spacing = goldenSpacing(40, ringCount);
  const stroke = selectHarmonicStroke(random);
  const centerSize = 10; // Fixed size

  // Pick ONE style for all rings (deterministic from seed)
  const useDashed = Math.floor(random() * 2) === 0;

  let shapes = '';

  for (let i = 0; i < ringCount; i++) {
    const radius = spacing[i];
    const strokeWidth = i === 0 ? stroke * 1.5 : stroke;

    // Use the SAME style for all rings
    if (useDashed) {
      shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="8,4"/>`;
    } else {
      shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
    }
  }

  shapes += `<circle cx="50" cy="50" r="${centerSize}" fill="${color}"/>`;

  return shapes;
}

function generateSquarePattern(random: () => number, color: string, letter?: string, font: string = 'Inter'): string {
  // Grid with structured variations - can repeat letters OR shapes
  const gridSize = 4; // Fixed 4x4 grid
  const elementSize = 10; // Fixed size
  const spacing = (VIEWBOX_SIZE - SAFE_MARGIN * 2 - elementSize * gridSize) / (gridSize - 1);
  const startPos = SAFE_MARGIN + elementSize / 2;

  // Decide: repeat LETTER throughout grid, or use shapes?
  const repeatLetter = letter && Math.floor(random() * 2) === 0;

  // Pick ONE element type for entire pattern (used only if not repeating letter)
  const elementTypes = ['circle', 'triangle', 'square', 'pentagon'];
  const elementType = pickFromArray(random, elementTypes);
  const useRotationVariation = Math.floor(random() * 2) === 0; // Deterministic

  let shapes = '';

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = startPos + j * (spacing + elementSize);
      const y = startPos + i * (spacing + elementSize);
      const isCenterish = (i === Math.floor(gridSize / 2) && j === Math.floor(gridSize / 2));
      const size = isCenterish ? elementSize * 1.5 : elementSize;
      const rotation = useRotationVariation ? (i + j) * 45 : 0; // Progressive or no rotation

      if (repeatLetter) {
        // REPEAT THE LETTER at each grid position
        const letterSize = isCenterish ? 20 : 14;
        shapes += `<text x="${x}" y="${y}" font-family="${font}" font-size="${letterSize}" font-weight="700"
          fill="${color}" text-anchor="middle" dominant-baseline="central"
          transform="rotate(${rotation} ${x} ${y})">${letter!.charAt(0).toUpperCase()}</text>`;
      } else {
        // Always render all elements (no random skipping)
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

function generateHexagonalPattern(random: () => number, color: string, letter?: string, font: string = 'Inter'): string {
  // Honeycomb-like structure - can repeat letters OR hexagons
  const gridSize = 3;
  const elementSize = 16; // Fixed size
  const spacing = elementSize * 1.8;
  const startX = 50 - ((gridSize - 1) * spacing) / 2;
  const startY = 50 - ((gridSize - 1) * spacing * 0.866) / 2;

  // Decide: repeat LETTER in honeycomb pattern, or use hexagons?
  const repeatLetter = letter && Math.floor(random() * 2) === 0;

  // Structured rotation
  const useRotationVariation = Math.floor(random() * 2) === 0;
  const baseRotation = pickFromArray(random, [0, 15, 30]);

  // Pick ONE style for all hexagons (used only if not repeating letter)
  const styleType = Math.floor(random() * 2); // 0 = filled, 1 = outline
  const stroke = selectHarmonicStroke(random);

  let shapes = '';

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = startX + col * spacing + (row % 2) * (spacing / 2);
      const y = startY + row * spacing * 0.866;

      const rotation = useRotationVariation ? baseRotation + (row + col) * 10 : baseRotation;

      if (repeatLetter) {
        // REPEAT THE LETTER at each hexagon position
        const letterSize = 14;
        shapes += `<text x="${x}" y="${y}" font-family="${font}" font-size="${letterSize}" font-weight="700"
          fill="${color}" text-anchor="middle" dominant-baseline="central"
          transform="rotate(${rotation} ${x} ${y})">${letter!.charAt(0).toUpperCase()}</text>`;
      } else {
        // Always render all hexagons (no random skipping)
        const hexPoints = generateHexagon(x, y, elementSize, rotation);

        // Use the SAME style for all hexagons
        if (styleType === 0) {
          shapes += `<polygon points="${hexPoints}" fill="${color}"/>`;
        } else {
          shapes += `<polygon points="${hexPoints}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
        }
      }
    }
  }

  return shapes;
}

function generateTriangularPattern(random: () => number, color: string, letter?: string, font: string = 'Inter'): string {
  // Delta/tessellated pattern - can repeat letters OR triangles
  const rows = 5; // Fixed rows
  const baseSize = (VIEWBOX_SIZE - SAFE_MARGIN * 2) / rows;
  const startY = SAFE_MARGIN + baseSize / 2;

  // Decide: repeat LETTER in triangle grid, or use triangles?
  const repeatLetter = letter && Math.floor(random() * 2) === 0;

  let shapes = '';

  for (let row = 0; row < rows; row++) {
    const trianglesInRow = row + 2;
    const rowY = startY + row * baseSize * 0.866;

    for (let i = 0; i < trianglesInRow; i++) {
      const x = 50 - ((trianglesInRow - 1) * baseSize / 2) + i * baseSize;
      const rotation = (row + i) % 2 === 0 ? 0 : 180;
      const size = baseSize * 0.8;

      if (repeatLetter) {
        // REPEAT THE LETTER at each triangle position
        const letterSize = Math.min(14, size * 0.6);
        shapes += `<text x="${x}" y="${rowY}" font-family="${font}" font-size="${letterSize}" font-weight="700"
          fill="${color}" text-anchor="middle" dominant-baseline="central"
          transform="rotate(${rotation} ${x} ${rowY})">${letter!.charAt(0).toUpperCase()}</text>`;
      } else {
        // Always render all triangles (no random skipping)
        const triPoints = generateTriangle(x, rowY, size, rotation);
        shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
      }
    }
  }

  return shapes;
}

function generateSpiralPattern(random: () => number, color: string, letter: string, font: string): string {
  // Golden spiral with elements
  const elementCount = 10; // Fixed count
  const maxRadius = 35;
  const elementSize = 10; // Fixed size
  const useLetter = Math.floor(random() * 2) === 0; // Deterministic

  // Pick ONE element type for entire pattern
  const elementType = Math.floor(random() * 2);

  const spiralPoints = goldenSpiralPoints(elementCount, 50, 50, maxRadius);

  let shapes = '';

  for (let i = 0; i < spiralPoints.length; i++) {
    const point = spiralPoints[i];
    const size = elementSize * (1 + i / elementCount); // Growing size

    // Use the SAME element type for all elements
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

  // Center element - either letter or same shape
  if (useLetter && letter) {
    const letterSize = 24; // Fixed size
    shapes += `<text x="50" y="50" font-family="${font}" font-size="${letterSize}" font-weight="700"
      fill="${color}" text-anchor="middle" dominant-baseline="central">${letter.charAt(0).toUpperCase()}</text>`;
  } else {
    const centerSize = elementSize * 1.5;
    if (elementType === 0) {
      shapes += `<circle cx="50" cy="50" r="${centerSize}" fill="${color}"/>`;
    } else {
      const triPoints = generateTriangle(50, 50, centerSize * 1.2, 0);
      shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
    }
  }

  return shapes;
}

function generateScatteredPattern(random: () => number, color: string, letter?: string, font: string = 'Inter'): string {
  // Structured grid with size variations - can repeat letters OR shapes
  const elementCount = 12; // Fixed count
  const scales = harmonicScale(12, elementCount, false);

  // Decide: repeat LETTER in scattered grid, or use shapes?
  const repeatLetter = letter && Math.floor(random() * 2) === 0;

  // Pick ONE element type for entire pattern (used only if not repeating letter)
  const elementType = Math.floor(random() * 3);

  // Create a structured grid layout
  const gridSize = 4; // 4x4 grid but only use some positions
  const spacing = (VIEWBOX_SIZE - SAFE_MARGIN * 2) / gridSize;
  const startPos = SAFE_MARGIN + spacing / 2;

  let shapes = '';

  // Use golden ratio positions instead of random
  const positions = [
    { row: 0, col: 1 }, { row: 0, col: 3 },
    { row: 1, col: 0 }, { row: 1, col: 2 },
    { row: 2, col: 1 }, { row: 2, col: 3 },
    { row: 3, col: 0 }, { row: 3, col: 2 },
    { row: 0, col: 0 }, { row: 1, col: 3 },
    { row: 2, col: 0 }, { row: 3, col: 3 }
  ];

  for (let i = 0; i < Math.min(elementCount, positions.length); i++) {
    const pos = positions[i];
    const x = startPos + pos.col * spacing;
    const y = startPos + pos.row * spacing;
    const size = scales[i % scales.length];
    const rotation = (i * 30) % 360; // Structured rotation

    if (repeatLetter) {
      // REPEAT THE LETTER at each position with size variation
      const letterSize = Math.max(10, Math.min(20, size * 1.5));
      shapes += `<text x="${x}" y="${y}" font-family="${font}" font-size="${letterSize}" font-weight="700"
        fill="${color}" text-anchor="middle" dominant-baseline="central"
        transform="rotate(${rotation} ${x} ${y})">${letter!.charAt(0).toUpperCase()}</text>`;
    } else {
      // Use the SAME element type for all elements
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
  }

  return shapes;
}

function generateWavePattern(random: () => number, color: string): string {
  // Flowing repetition
  const waveCount = 5; // Fixed count
  const spacing = (VIEWBOX_SIZE - SAFE_MARGIN * 2) / waveCount;
  const startY = SAFE_MARGIN + spacing / 2;
  const amplitude = 10; // Fixed amplitude
  const frequency = 2; // Fixed frequency
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
  // Connected nodes in structured arrangement
  const nodeCount = 8; // Fixed count
  const nodes: Array<{ x: number; y: number }> = [];
  const nodeSize = 10; // Fixed size
  const connectionStroke = selectHarmonicStroke(random);

  // Generate node positions in perfect circle
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i * 360 / nodeCount) * Math.PI / 180;
    const radius = 30; // Fixed radius
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    nodes.push({ x, y });
  }

  let shapes = '';

  // Draw connections - connect every other node for star pattern
  const skipPattern = Math.floor(random() * 2) + 1; // Skip 1 or 2 nodes for different patterns
  for (let i = 0; i < nodeCount; i++) {
    const next = (i + skipPattern) % nodeCount;
    shapes += `<line x1="${nodes[i].x}" y1="${nodes[i].y}"
      x2="${nodes[next].x}" y2="${nodes[next].y}"
      stroke="${color}" stroke-width="${connectionStroke}"/>`;
  }

  // Draw nodes
  for (const node of nodes) {
    shapes += `<circle cx="${node.x}" cy="${node.y}" r="${nodeSize}" fill="${color}"/>`;
  }

  // Center node
  shapes += `<circle cx="50" cy="50" r="${nodeSize * 1.3}" fill="${color}"/>`;

  return shapes;
}

function generateMandalaPattern(random: () => number, color: string, letter: string, font: string): string {
  // Symmetrical complexity
  const sectors = 8; // Fixed count
  const layers = 3; // Fixed layers
  const useLetter = Math.floor(random() * 2) === 0 && letter; // Deterministic

  // Pick ONE element type for entire pattern
  const elementType = Math.floor(random() * 2);

  let shapes = '';

  // Generate one sector, then repeat with rotation
  const sectorAngle = 360 / sectors;

  for (let sector = 0; sector < sectors; sector++) {
    const rotation = sector * sectorAngle;

    for (let layer = 0; layer < layers; layer++) {
      const radius = 18 + layer * 12;
      const elementSize = 10; // Fixed size
      const elementsInLayer = 2 + layer;

      for (let i = 0; i < elementsInLayer; i++) {
        const angle = (rotation + (i * sectorAngle / elementsInLayer)) * Math.PI / 180;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        // Use the SAME element type for all elements
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

  // Center element - either letter or same shape as pattern
  if (useLetter) {
    const letterSize = 24; // Fixed size
    shapes += `<text x="50" y="50" font-family="${font}" font-size="${letterSize}" font-weight="700"
      fill="${color}" text-anchor="middle" dominant-baseline="central">${letter.charAt(0).toUpperCase()}</text>`;
  } else {
    // Use same shape type for center
    const centerSize = 12;
    if (elementType === 0) {
      shapes += `<circle cx="50" cy="50" r="${centerSize}" fill="${color}"/>`;
    } else {
      const triPoints = generateTriangle(50, 50, centerSize, 0);
      shapes += `<polygon points="${triPoints}" fill="${color}"/>`;
    }
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
      return generatePatternSymbol(seed, color, options?.letter, options?.font);
    default:
      throw new Error(`Unknown symbol mode: ${mode}`);
  }
}
