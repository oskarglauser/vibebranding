/**
 * Symbol generation utilities for creating abstract logo marks
 */

import type { SymbolSVGResult } from '../types/symbol';
import { createSeededRandom, randomInt } from './seedUtils';

const VIEWBOX_SIZE = 100;
const SAFE_MARGIN = 3; // Margin to prevent cutoff at edges

/**
 * Helper functions for shape randomization
 */
function randomSize(random: () => number, base: number, variance: number): number {
  const min = base * (1 - variance);
  const max = base * (1 + variance);
  return random() * (max - min) + min;
}

function randomPosition(random: () => number, min: number, max: number): number {
  return random() * (max - min) + min;
}

function randomAngle(random: () => number): number {
  return random() * 360;
}

function randomCount(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Constrain a circle's radius to fit within bounds
 */
function constrainCircleRadius(cx: number, cy: number, radius: number, strokeWidth: number = 0): number {
  const maxRadius = Math.min(
    cx - SAFE_MARGIN,
    cy - SAFE_MARGIN,
    VIEWBOX_SIZE - cx - SAFE_MARGIN,
    VIEWBOX_SIZE - cy - SAFE_MARGIN
  ) - strokeWidth / 2;
  return Math.min(radius, Math.max(maxRadius, 1)); // Ensure at least radius of 1
}

/**
 * Constrain polygon radius to fit within bounds (accounts for rotation)
 */
function constrainPolygonRadius(radius: number): number {
  // For rotated polygons, use conservative constraint
  return Math.min(radius, (VIEWBOX_SIZE / 2) - SAFE_MARGIN - 2);
}

/**
 * Generate stroke width with minimum thickness
 */
function randomStrokeWidth(random: () => number, base: number = 3, variance: number = 0.3): number {
  const minStroke = 2; // Minimum stroke width to ensure visibility
  return Math.max(minStroke, randomSize(random, base, variance));
}

/**
 * Constrain radial distance for elements placed around center
 * Accounts for element size and stroke width
 */
function constrainRadialDistance(elementSize: number, strokeWidth: number = 0): number {
  const maxDistance = (VIEWBOX_SIZE / 2) - SAFE_MARGIN - elementSize - (strokeWidth / 2);
  return Math.max(maxDistance, 5); // Ensure at least some minimum distance
}

/**
 * Generate a letter-based symbol combining typography with geometric shapes
 */
export function generateLetterSymbol(
  letter: string,
  seed: string,
  color: string,
  font: string = 'Inter'
): SymbolSVGResult {
  const random = createSeededRandom(seed);
  const variation = randomInt(random, 0, 19);
  const firstLetter = letter.charAt(0).toUpperCase();

  // Random rotation/tilt for letter (subtle tilt between -20 and 20 degrees)
  const letterTilt = randomPosition(random, -20, 20);

  // Determine if this design should be inverted (transparent letter on filled background)
  const shouldInvert = random() > 0.5;

  let shapes = '';

  switch (variation) {
    case 0: // Letter in circle
      const circleRadius = randomSize(random, 42, 0.15);
      const circleStroke = randomSize(random, 4, 0.4);
      const constrainedCircleRadius = constrainCircleRadius(50, 50, circleRadius, circleStroke);
      const letterFill = shouldInvert ? '#ffffff' : color;
      const circleFill = shouldInvert ? color : 'none';
      const circleStrokeAttr = shouldInvert ? '' : `stroke="${color}" stroke-width="${circleStroke}"`;
      shapes = `
        <circle cx="50" cy="50" r="${constrainedCircleRadius}" fill="${circleFill}" ${circleStrokeAttr}/>
        <text x="50" y="50" font-family="${font}" font-size="50" font-weight="600"
              fill="${letterFill}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 1: // Letter in rounded square
      const rectSize = randomSize(random, 84, 0.15);
      const rectOffset = (100 - rectSize) / 2;
      const rectRadius = randomSize(random, 12, 0.5);
      const rectStroke = randomSize(random, 4, 0.4);
      const rectLetterFill = shouldInvert ? '#ffffff' : color;
      const rectFill = shouldInvert ? color : 'none';
      const rectStrokeAttr = shouldInvert ? '' : `stroke="${color}" stroke-width="${rectStroke}"`;
      shapes = `
        <rect x="${rectOffset}" y="${rectOffset}" width="${rectSize}" height="${rectSize}" rx="${rectRadius}" fill="${rectFill}" ${rectStrokeAttr}/>
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="600"
              fill="${rectLetterFill}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 2: // Letter with arc behind
      const arcRotation = randomAngle(random);
      const arcRadius = randomSize(random, 40, 0.25);
      const arcStroke = randomSize(random, 8, 0.3);
      shapes = `
        <path d="M 50 ${10} A ${arcRadius} ${arcRadius} 0 0 1 ${50 + arcRadius} 50" fill="none" stroke="${color}"
              stroke-width="${arcStroke}" stroke-linecap="round" transform="rotate(${arcRotation} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="52" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 3: // Letter with geometric accent circles
      const accentCount = randomCount(random, 2, 4);
      for (let i = 0; i < accentCount; i++) {
        const accentSize = randomSize(random, 15, 0.4);
        const accentX = randomPosition(random, 20, 80);
        const accentY = randomPosition(random, 20, 40);
        shapes += `<circle cx="${accentX}" cy="${accentY}" r="${accentSize}" fill="${color}"/>`;
      }
      shapes += `
        <text x="50" y="55" font-family="${font}" font-size="55" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 55)">${firstLetter}</text>
      `;
      break;

    case 4: // Letter with geometric shape
      const shapeSize = randomSize(random, 30, 0.3);
      const shapeX = randomPosition(random, 55, 70);
      const shapeY = randomPosition(random, 30, 45);
      const shapeRadius = randomSize(random, 4, 0.5);
      const shapeRotation = randomAngle(random);
      shapes = `
        <rect x="${shapeX}" y="${shapeY}" width="${shapeSize}" height="${shapeSize}" rx="${shapeRadius}" fill="${color}" transform="rotate(${shapeRotation} ${shapeX + shapeSize/2} ${shapeY + shapeSize/2})"/>
        <text x="45" y="50" font-family="${font}" font-size="50" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 45 50)">${firstLetter}</text>
      `;
      break;

    case 5: // Letter with corner triangles
      const triangleCount = randomCount(random, 2, 4);
      const triangleSize = randomSize(random, 15, 0.3);
      const corners = [{x: 10, y: 10}, {x: 90, y: 10}, {x: 10, y: 90}, {x: 90, y: 90}];
      for (let i = 0; i < triangleCount; i++) {
        const corner = corners[i];
        const xDir = corner.x === 10 ? 1 : -1;
        const yDir = corner.y === 10 ? 1 : -1;
        shapes += `<path d="M ${corner.x} ${corner.y} L ${corner.x + xDir * triangleSize} ${corner.y} L ${corner.x} ${corner.y + yDir * triangleSize} Z" fill="${color}"/>`;
      }
      shapes += `
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 6: // Letter in polygon
      const polyCount = randomCount(random, 5, 8);
      const polyRadius = randomSize(random, 40, 0.12);
      const polyStroke = randomSize(random, 4, 0.3);
      const polyRotation = randomAngle(random);
      const constrainedPolyRadius = constrainPolygonRadius(polyRadius);
      const hexPoints = [];
      for (let i = 0; i < polyCount; i++) {
        const angle = (i * 360 / polyCount) * Math.PI / 180;
        const x = 50 + constrainedPolyRadius * Math.cos(angle);
        const y = 50 + constrainedPolyRadius * Math.sin(angle);
        hexPoints.push(`${x},${y}`);
      }
      const polyLetterFill = shouldInvert ? '#ffffff' : color;
      const polyFill = shouldInvert ? color : 'none';
      const polyStrokeAttr = shouldInvert ? '' : `stroke="${color}" stroke-width="${polyStroke}"`;
      shapes = `
        <polygon points="${hexPoints.join(' ')}" fill="${polyFill}" ${polyStrokeAttr} transform="rotate(${polyRotation} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="46" font-weight="600"
              fill="${polyLetterFill}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 7: // Letter with concentric circles
      const circleCount = randomCount(random, 2, 4);
      const maxRadius = randomSize(random, 40, 0.12);
      const maxStroke = randomStrokeWidth(random, 3);
      const constrainedMaxRadius = constrainCircleRadius(50, 50, maxRadius, maxStroke);
      for (let i = 0; i < circleCount; i++) {
        const radius = constrainedMaxRadius - (i * constrainedMaxRadius / circleCount);
        const stroke = randomStrokeWidth(random, 3);
        shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`;
      }
      shapes += `
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 8: // Letter with diagonal lines
      const diagonalAngle = randomAngle(random);
      const lineCount = randomCount(random, 1, 3);
      const lineStroke = randomSize(random, 6, 0.3);
      for (let i = 0; i < lineCount; i++) {
        const offset = (i - lineCount / 2) * 8;
        shapes += `<line x1="15" y1="${50 + offset}" x2="85" y2="${50 + offset}" stroke="${color}" stroke-width="${lineStroke}"
              transform="rotate(${diagonalAngle} 50 50)"/>`;
      }
      shapes += `
        <text x="50" y="50" font-family="${font}" font-size="52" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 9: // Letter with curved paths
      const quarterRotation = randomAngle(random);
      const curveCount = randomCount(random, 2, 4);
      const curveStroke = randomSize(random, 5, 0.3);
      for (let i = 0; i < curveCount; i++) {
        const angle = (i * 360 / curveCount);
        shapes += `<path d="M 10 10 Q 10 50 50 50" fill="none" stroke="${color}"
              stroke-width="${curveStroke}" transform="rotate(${quarterRotation + angle} 50 50)"/>`;
      }
      shapes += `
        <text x="50" y="50" font-family="${font}" font-size="50" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 10: // Letter in diamond
      const diamondSize = randomSize(random, 42, 0.2);
      const diamondStroke = randomSize(random, 4, 0.3);
      const diamondRotation = randomAngle(random);
      const diamondLetterFill = shouldInvert ? '#ffffff' : color;
      const diamondFill = shouldInvert ? color : 'none';
      const diamondStrokeAttr = shouldInvert ? '' : `stroke="${color}" stroke-width="${diamondStroke}"`;
      shapes = `
        <path d="M 50 ${50-diamondSize} L ${50+diamondSize} 50 L 50 ${50+diamondSize} L ${50-diamondSize} 50 Z" fill="${diamondFill}" ${diamondStrokeAttr} transform="rotate(${diamondRotation} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="46" font-weight="600"
              fill="${diamondLetterFill}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 11: // Letter with side bars
      const barCount = randomCount(random, 2, 4);
      const barWidth = randomSize(random, 8, 0.4);
      const barHeight = randomSize(random, 50, 0.3);
      const barY = 50 - barHeight / 2;
      for (let i = 0; i < barCount; i++) {
        const barX = i < barCount / 2 ? randomPosition(random, 8, 15) : randomPosition(random, 77, 85);
        shapes += `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${color}"/>`;
      }
      shapes += `
        <text x="50" y="50" font-family="${font}" font-size="52" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 12: // Letter in ring
      const ringRadius = randomSize(random, 45, 0.15);
      const ringStroke = randomSize(random, 8, 0.5);
      const ringLetterFill = shouldInvert ? '#ffffff' : color;
      const ringFill = shouldInvert ? color : 'none';
      const ringStrokeAttr = shouldInvert ? '' : `stroke="${color}" stroke-width="${ringStroke}"`;
      shapes = `
        <circle cx="50" cy="50" r="${ringRadius}" fill="${ringFill}" ${ringStrokeAttr}/>
        <text x="50" y="50" font-family="${font}" font-size="52" font-weight="700"
              fill="${ringLetterFill}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 13: // Letter with corner brackets
      const bracketSize = randomSize(random, 15, 0.3);
      const bracketStroke = randomSize(random, 4, 0.3);
      const bracketCorners = [
        {x: 10, y: 10, dx: 1, dy: 1},
        {x: 90, y: 10, dx: -1, dy: 1},
        {x: 10, y: 90, dx: 1, dy: -1},
        {x: 90, y: 90, dx: -1, dy: -1}
      ];
      for (const corner of bracketCorners) {
        shapes += `<path d="M ${corner.x} ${corner.y} L ${corner.x} ${corner.y + corner.dy * bracketSize} M ${corner.x} ${corner.y} L ${corner.x + corner.dx * bracketSize} ${corner.y}" stroke="${color}" stroke-width="${bracketStroke}" stroke-linecap="round"/>`;
      }
      shapes += `
        <text x="50" y="50" font-family="${font}" font-size="50" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 14: // Letter with orbiting elements
      const orbitCount = randomCount(random, 2, 5);
      const orbitRadius = randomSize(random, 35, 0.2);
      const orbitSize = randomSize(random, 8, 0.3);
      for (let i = 0; i < orbitCount; i++) {
        const orbitAngle = (i * 360 / orbitCount + randomAngle(random)) * Math.PI / 180;
        const orbitX = 50 + orbitRadius * Math.cos(orbitAngle);
        const orbitY = 50 + orbitRadius * Math.sin(orbitAngle);
        shapes += `<circle cx="${orbitX}" cy="${orbitY}" r="${orbitSize}" fill="${color}"/>`;
      }
      shapes += `
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 15: // Letter with triangular frame
      const triSize = randomSize(random, 35, 0.3);
      const triStroke = randomSize(random, 4, 0.3);
      const triRotation = randomAngle(random);
      const triLetterFill = shouldInvert ? '#ffffff' : color;
      const triFill = shouldInvert ? color : 'none';
      const triStrokeAttr = shouldInvert ? '' : `stroke="${color}" stroke-width="${triStroke}"`;
      shapes = `
        <path d="M 50 ${50-triSize} L ${50+triSize*0.866} ${50+triSize*0.5} L ${50-triSize*0.866} ${50+triSize*0.5} Z" fill="${triFill}" ${triStrokeAttr} transform="rotate(${triRotation} 50 50)"/>
        <text x="50" y="55" font-family="${font}" font-size="50" font-weight="600"
              fill="${triLetterFill}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 55)">${firstLetter}</text>
      `;
      break;

    case 16: // Letter with starburst lines
      const burstLineCount = randomCount(random, 6, 12);
      const innerBurstRadius = randomSize(random, 25, 0.2);
      const outerBurstRadius = randomSize(random, 42, 0.15);
      const burstStroke = randomStrokeWidth(random, 3);
      for (let i = 0; i < burstLineCount; i++) {
        const angle = (i * 360 / burstLineCount) * Math.PI / 180;
        const x1 = 50 + innerBurstRadius * Math.cos(angle);
        const y1 = 50 + innerBurstRadius * Math.sin(angle);
        const x2 = 50 + outerBurstRadius * Math.cos(angle);
        const y2 = 50 + outerBurstRadius * Math.sin(angle);
        shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${burstStroke}"/>`;
      }
      shapes += `<text x="50" y="50" font-family="${font}" font-size="44" font-weight="700"
            fill="${color}" text-anchor="middle" dominant-baseline="central"
            transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>`;
      break;

    case 17: // Letter in polygon frame
      const octCount = randomCount(random, 6, 9);
      const octRadius = randomSize(random, 42, 0.15);
      const octStroke = randomStrokeWidth(random, 3);
      const octRotation = randomAngle(random);
      const octPoints = [];
      for (let i = 0; i < octCount; i++) {
        const angle = (i * 360 / octCount) * Math.PI / 180;
        const x = 50 + octRadius * Math.cos(angle);
        const y = 50 + octRadius * Math.sin(angle);
        octPoints.push(`${x},${y}`);
      }
      const octLetterFill = shouldInvert ? '#ffffff' : color;
      const octFill = shouldInvert ? color : 'none';
      const octStrokeAttr = shouldInvert ? '' : `stroke="${color}" stroke-width="${octStroke}"`;
      shapes = `
        <polygon points="${octPoints.join(' ')}" fill="${octFill}" ${octStrokeAttr} transform="rotate(${octRotation} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="44" font-weight="600"
              fill="${octLetterFill}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 18: // Letter with curved swoosh
      const swooshRotation = randomAngle(random);
      const swooshStroke = randomSize(random, 6, 0.3);
      const swooshCurve = randomSize(random, 30, 0.3);
      shapes = `
        <path d="M 20 50 Q ${swooshCurve} 20 50 20 Q ${70} 20 80 50" fill="none" stroke="${color}"
              stroke-width="${swooshStroke}" stroke-linecap="round" transform="rotate(${swooshRotation} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 50)">${firstLetter}</text>
      `;
      break;

    case 19: // Letter with star frame
      const starPointCount = randomCount(random, 4, 7);
      const starOuterRadius = randomSize(random, 42, 0.15);
      const starInnerRadius = randomSize(random, 22, 0.2);
      const starStroke = randomSize(random, 4, 0.3);
      const starRotation = randomAngle(random);
      const pentagonPoints = [];
      for (let i = 0; i < starPointCount * 2; i++) {
        const radius = i % 2 === 0 ? starOuterRadius : starInnerRadius;
        const angle = (i * 180 / starPointCount - 90) * Math.PI / 180;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        pentagonPoints.push(`${x},${y}`);
      }
      const starLetterFill = shouldInvert ? '#ffffff' : color;
      const starFill = shouldInvert ? color : 'none';
      const starStrokeAttr = shouldInvert ? '' : `stroke="${color}" stroke-width="${starStroke}"`;
      shapes = `
        <polygon points="${pentagonPoints.join(' ')}" fill="${starFill}" ${starStrokeAttr} transform="rotate(${starRotation} 50 50)"/>
        <text x="50" y="52" font-family="${font}" font-size="46" font-weight="600"
              fill="${starLetterFill}" text-anchor="middle" dominant-baseline="central"
              transform="rotate(${letterTilt} 50 52)">${firstLetter}</text>
      `;
      break;
  }

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

/**
 * Generate a geometric shape-based symbol
 */
export function generateShapeSymbol(seed: string, color: string): SymbolSVGResult {
  const random = createSeededRandom(seed);
  const variation = randomInt(random, 0, 24);

  let shapes = '';

  switch (variation) {
    case 0: // Abstract triangle composition
      const t1Rotation = randomAngle(random);
      const t1Size = randomSize(random, 55, 0.3);
      const t2Size = randomSize(random, 25, 0.3);
      const t2Rotation = t1Rotation + randomPosition(random, 160, 200);
      shapes = `
        <path d="M 50 ${50-t1Size/2} L ${50+t1Size/2.3} ${50+t1Size/2} L ${50-t1Size/2.3} ${50+t1Size/2} Z" fill="${color}" transform="rotate(${t1Rotation} 50 50)"/>
        <path d="M 50 ${50-t2Size/2} L ${50+t2Size/2.3} ${50+t2Size/2} L ${50-t2Size/2.3} ${50+t2Size/2} Z" fill="${color}" transform="rotate(${t2Rotation} 50 50)"/>
      `;
      break;

    case 1: // Overlapping circles
      const c1x = randomPosition(random, 30, 45);
      const c2x = randomPosition(random, 55, 70);
      const c1r = randomSize(random, 30, 0.2);
      const c2r = randomSize(random, 30, 0.2);
      const c1y = randomPosition(random, 45, 55);
      const c2y = randomPosition(random, 45, 55);
      shapes = `
        <circle cx="${c1x}" cy="${c1y}" r="${c1r}" fill="none" stroke="${color}" stroke-width="${randomSize(random, 6, 0.3)}"/>
        <circle cx="${c2x}" cy="${c2y}" r="${c2r}" fill="none" stroke="${color}" stroke-width="${randomSize(random, 6, 0.3)}"/>
      `;
      break;

    case 2: // Split circle with geometric element
      const splitRadius = randomSize(random, 40, 0.2);
      const splitStroke = randomSize(random, 8, 0.3);
      const splitRotation = randomAngle(random);
      const splitDash = splitRadius * Math.PI;
      const innerSize = randomSize(random, 16, 0.3);
      shapes = `
        <circle cx="50" cy="50" r="${splitRadius}" fill="none" stroke="${color}" stroke-width="${splitStroke}" stroke-dasharray="${splitDash} ${splitDash}" transform="rotate(${splitRotation} 50 50)"/>
        <rect x="${50-innerSize/2}" y="${50-innerSize/2}" width="${innerSize}" height="${innerSize}" fill="${color}" transform="rotate(${randomAngle(random)} 50 50)"/>
      `;
      break;

    case 3: // Polygon
      const shapePolyCount = randomCount(random, 5, 8);
      const shapePolyRadius = randomSize(random, 40, 0.2);
      const shapePolyRotation = randomAngle(random);
      const pentagonPoints = [];
      for (let i = 0; i < shapePolyCount; i++) {
        const angle = (i * 360 / shapePolyCount - 90) * Math.PI / 180;
        const x = 50 + shapePolyRadius * Math.cos(angle);
        const y = 50 + shapePolyRadius * Math.sin(angle);
        pentagonPoints.push(`${x},${y}`);
      }
      shapes = `<polygon points="${pentagonPoints.join(' ')}" fill="${color}" transform="rotate(${shapePolyRotation} 50 50)"/>`;
      break;

    case 4: // Arc composition
      const arcCount = randomCount(random, 2, 4);
      const arcRadius = randomSize(random, 20, 0.3);
      const arcStroke = randomSize(random, 8, 0.3);
      const baseArcRotation = randomAngle(random);
      for (let i = 0; i < arcCount; i++) {
        const arcRotation = baseArcRotation + (i * 360 / arcCount);
        shapes += `
          <path d="M ${50-arcRadius} 50 A ${arcRadius} ${arcRadius} 0 0 1 50 ${50-arcRadius}" fill="none" stroke="${color}"
                stroke-width="${arcStroke}" stroke-linecap="round" transform="rotate(${arcRotation} 50 50)"/>
        `;
      }
      break;

    case 5: // Polygon
      const hex2Count = randomCount(random, 5, 8);
      const hex2Radius = randomSize(random, 38, 0.2);
      const hex2Rotation = randomAngle(random);
      const hexPoints = [];
      for (let i = 0; i < hex2Count; i++) {
        const angle = (i * 360 / hex2Count) * Math.PI / 180;
        const x = 50 + hex2Radius * Math.cos(angle);
        const y = 50 + hex2Radius * Math.sin(angle);
        hexPoints.push(`${x},${y}`);
      }
      shapes = `<polygon points="${hexPoints.join(' ')}" fill="${color}" transform="rotate(${hex2Rotation} 50 50)"/>`;
      break;

    case 6: // Intersecting rectangles
      const rect1Width = randomSize(random, 60, 0.2);
      const rect1Height = randomSize(random, 20, 0.3);
      const rect2Width = randomSize(random, 20, 0.3);
      const rect2Height = randomSize(random, 60, 0.2);
      const rect1Rotation = randomAngle(random);
      const rect2Rotation = rect1Rotation + randomPosition(random, 80, 100);
      shapes = `
        <rect x="${50-rect1Width/2}" y="${50-rect1Height/2}" width="${rect1Width}" height="${rect1Height}" fill="${color}" transform="rotate(${rect1Rotation} 50 50)"/>
        <rect x="${50-rect2Width/2}" y="${50-rect2Height/2}" width="${rect2Width}" height="${rect2Height}" fill="${color}" transform="rotate(${rect2Rotation} 50 50)"/>
      `;
      break;

    case 7: // Wave-like curves
      const waveStroke1 = randomSize(random, 8, 0.3);
      const waveStroke2 = randomSize(random, 6, 0.3);
      const waveOffset = randomSize(random, 10, 0.4);
      const waveRotation = randomAngle(random);
      shapes = `
        <g transform="rotate(${waveRotation} 50 50)">
          <path d="M 20 50 Q 35 ${30-waveOffset}, 50 50 T 80 50" fill="none" stroke="${color}" stroke-width="${waveStroke1}" stroke-linecap="round"/>
          <path d="M 20 ${50+waveOffset} Q 35 ${30}, 50 ${50+waveOffset} T 80 ${50+waveOffset}" fill="none" stroke="${color}" stroke-width="${waveStroke2}" stroke-linecap="round"/>
        </g>
      `;
      break;

    case 8: // Geometric abstract form
      const formRotation = randomAngle(random);
      const formScale = randomSize(random, 1, 0.15);
      shapes = `
        <g transform="rotate(${formRotation} 50 50) scale(${formScale} ${formScale}) translate(${50*(1-formScale)} ${50*(1-formScale)})">
          <path d="M 25 20 L 25 80 L 40 80 L 40 55 L 60 55 L 75 80 L 90 80 L 70 50 L 85 20 L 70 20 L 55 45 L 40 45 L 40 20 Z" fill="${color}"/>
        </g>
      `;
      break;

    case 9: // Diamond composition
      const diamond1Size = randomSize(random, 35, 0.3);
      const diamond2Size = randomSize(random, 20, 0.3);
      const diamondRotation9 = randomAngle(random);
      shapes = `
        <path d="M 50 ${50-diamond1Size} L ${50+diamond1Size} 50 L 50 ${50+diamond1Size} L ${50-diamond1Size} 50 Z" fill="${color}" transform="rotate(${diamondRotation9} 50 50)"/>
        <path d="M 50 ${50-diamond2Size} L ${50+diamond2Size} 50 L 50 ${50+diamond2Size} L ${50-diamond2Size} 50 Z" fill="${color}" transform="rotate(${diamondRotation9 + 45} 50 50)"/>
      `;
      break;

    case 10: // Spiral
      const spiralStroke = randomSize(random, 6, 0.3);
      const spiralRotation = randomAngle(random);
      const spiralSize = randomSize(random, 1, 0.2);
      shapes = `
        <g transform="rotate(${spiralRotation} 50 50) scale(${spiralSize} ${spiralSize}) translate(${50*(1-spiralSize)} ${50*(1-spiralSize)})">
          <path d="M 50 50 Q 70 50 70 30 Q 70 10 50 10 Q 20 10 20 40 Q 20 80 60 80"
                fill="none" stroke="${color}" stroke-width="${spiralStroke}" stroke-linecap="round"/>
        </g>
      `;
      break;

    case 11: // Polygon
      const oct2Count = randomCount(random, 6, 9);
      const oct2Radius = randomSize(random, 40, 0.2);
      const oct2Rotation = randomAngle(random);
      const octPoints = [];
      for (let i = 0; i < oct2Count; i++) {
        const angle = (i * 360 / oct2Count) * Math.PI / 180;
        const x = 50 + oct2Radius * Math.cos(angle);
        const y = 50 + oct2Radius * Math.sin(angle);
        octPoints.push(`${x},${y}`);
      }
      shapes = `<polygon points="${octPoints.join(' ')}" fill="${color}" transform="rotate(${oct2Rotation} 50 50)"/>`;
      break;

    case 12: // Cross/Plus
      const crossWidth = randomSize(random, 16, 0.3);
      const crossLength = randomSize(random, 80, 0.15);
      const crossRotation = randomAngle(random);
      shapes = `
        <g transform="rotate(${crossRotation} 50 50)">
          <rect x="${50-crossWidth/2}" y="${50-crossLength/2}" width="${crossWidth}" height="${crossLength}" fill="${color}"/>
          <rect x="${50-crossLength/2}" y="${50-crossWidth/2}" width="${crossLength}" height="${crossWidth}" fill="${color}"/>
        </g>
      `;
      break;

    case 13: // Curved organic shape
      const curveRotation = randomAngle(random);
      const curveSize = randomSize(random, 30, 0.3);
      const curveVar = randomSize(random, 15, 0.4);
      shapes = `
        <path d="M 50 ${50-curveSize} Q ${50+curveSize+curveVar} ${50-curveVar} ${50+curveVar} 50 Q ${50+curveVar} ${50+curveSize+curveVar} 50 ${50+curveVar} Q ${50-curveSize-curveVar} ${50+curveVar} ${50-curveVar} 50 Q ${50-curveVar} ${50-curveSize-curveVar} 50 ${50-curveSize}"
              fill="${color}" transform="rotate(${curveRotation} 50 50)"/>
      `;
      break;

    case 14: // Nested squares
      const nestedCount = randomCount(random, 2, 4);
      const maxSquareSize = randomSize(random, 70, 0.15);
      const nestedRotation = randomAngle(random);
      for (let i = 0; i < nestedCount; i++) {
        const size = maxSquareSize - (i * maxSquareSize / nestedCount);
        const offset = (100 - size) / 2;
        const stroke = randomStrokeWidth(random, 3);
        if (i === nestedCount - 1) {
          shapes += `<rect x="${offset}" y="${offset}" width="${size}" height="${size}" fill="${color}" transform="rotate(${nestedRotation} 50 50)"/>`;
        } else {
          shapes += `<rect x="${offset}" y="${offset}" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${stroke}" transform="rotate(${nestedRotation} 50 50)"/>`;
        }
      }
      break;

    case 15: // Infinity symbol
      const infStroke = randomSize(random, 6, 0.3);
      const infRotation = randomAngle(random);
      const infScale = randomSize(random, 1, 0.15);
      shapes = `
        <g transform="rotate(${infRotation} 50 50) scale(${infScale} ${infScale}) translate(${50*(1-infScale)} ${50*(1-infScale)})">
          <path d="M 20 50 Q 30 30, 40 50 Q 50 70, 60 50 Q 70 30, 80 50 Q 70 70, 60 50 Q 50 30, 40 50 Q 30 70, 20 50"
                fill="none" stroke="${color}" stroke-width="${infStroke}" stroke-linecap="round"/>
        </g>
      `;
      break;

    case 16: // Droplet/organic shape
      const dropRotation = randomAngle(random);
      const dropWidth = randomSize(random, 40, 0.25);
      const dropHeight = randomSize(random, 75, 0.2);
      shapes = `
        <path d="M 50 ${50-dropHeight/2} Q ${50+dropWidth/2} ${50-dropHeight/4} ${50+dropWidth/2} 50 Q ${50+dropWidth/2} ${50+dropHeight/3} 50 ${50+dropHeight/2} Q ${50-dropWidth/2} ${50+dropHeight/3} ${50-dropWidth/2} 50 Q ${50-dropWidth/2} ${50-dropHeight/4} 50 ${50-dropHeight/2}"
              fill="${color}" transform="rotate(${dropRotation} 50 50)"/>
      `;
      break;

    case 17: // Split diamond
      const split17Rotation = randomAngle(random);
      const split17Size = randomSize(random, 35, 0.3);
      shapes = `
        <path d="M 50 ${50-split17Size} L ${50+split17Size} 50 L 50 50 Z" fill="${color}" transform="rotate(${split17Rotation} 50 50)"/>
        <path d="M 50 50 L ${50+split17Size} 50 L 50 ${50+split17Size} Z" fill="${color}" transform="rotate(${split17Rotation} 50 50)"/>
        <path d="M 50 50 L ${50-split17Size} 50 L 50 ${50-split17Size} Z" fill="${color}" transform="rotate(${split17Rotation} 50 50)"/>
        <path d="M 50 50 L ${50-split17Size} 50 L 50 ${50+split17Size} Z" fill="${color}" transform="rotate(${split17Rotation} 50 50)"/>
      `;
      break;

    case 18: // Y-shape / Branch
      const yStroke = randomSize(random, 8, 0.3);
      const yRotation = randomAngle(random);
      const yAngle = randomSize(random, 30, 0.3);
      shapes = `
        <g transform="rotate(${yRotation} 50 50)">
          <path d="M 50 10 L 50 40 M 50 40 L ${50-yAngle} 60 M 50 40 L ${50+yAngle} 60 M ${50-yAngle} 60 L ${50-yAngle} 85 M ${50+yAngle} 60 L ${50+yAngle} 85"
                stroke="${color}" stroke-width="${yStroke}" stroke-linecap="round" fill="none"/>
        </g>
      `;
      break;

    case 19: // Circle cluster
      const clusterCount = randomCount(random, 3, 5);
      const clusterRadius = randomSize(random, 25, 0.2);
      const circleSize = randomSize(random, 12, 0.25);
      for (let i = 0; i < clusterCount; i++) {
        const angle = (i * 360 / clusterCount - 90) * Math.PI / 180;
        const x = 50 + clusterRadius * Math.cos(angle);
        const y = 50 + clusterRadius * Math.sin(angle);
        shapes += `<circle cx="${x}" cy="${y}" r="${circleSize}" fill="${color}"/>`;
      }
      break;

    case 20: // Circular composition
      const yy20Radius = randomSize(random, 40, 0.15);
      const yy20Stroke = randomSize(random, 6, 0.3);
      const yy20Rotation = randomAngle(random);
      const yy20Fill = randomSize(random, 30, 0.3);
      const yy20Circle = randomSize(random, 10, 0.3);
      shapes = `
        <g transform="rotate(${yy20Rotation} 50 50)">
          <circle cx="50" cy="50" r="${yy20Radius}" fill="none" stroke="${color}" stroke-width="${yy20Stroke}"/>
          <path d="M 50 ${50-yy20Radius} Q ${50+yy20Fill} ${50-yy20Fill} ${50+yy20Fill} 50 Q ${50+yy20Fill} ${50+yy20Fill} 50 ${50+yy20Radius}"
                fill="${color}"/>
          <circle cx="50" cy="${50+yy20Radius/2}" r="${yy20Circle}" fill="${color}"/>
        </g>
      `;
      break;

    case 21: // Polygon with center
      const hex3Count = randomCount(random, 5, 8);
      const hex3Radius = randomSize(random, 38, 0.2);
      const hex3Stroke = randomSize(random, 4, 0.3);
      const hex3Rotation = randomAngle(random);
      const centerCircleSize = randomSize(random, 12, 0.3);
      const hexPoints2 = [];
      for (let i = 0; i < hex3Count; i++) {
        const angle = (i * 360 / hex3Count) * Math.PI / 180;
        const x = 50 + hex3Radius * Math.cos(angle);
        const y = 50 + hex3Radius * Math.sin(angle);
        hexPoints2.push(`${x},${y}`);
      }
      shapes = `
        <polygon points="${hexPoints2.join(' ')}" fill="none" stroke="${color}" stroke-width="${hex3Stroke}" transform="rotate(${hex3Rotation} 50 50)"/>
        <circle cx="50" cy="50" r="${centerCircleSize}" fill="${color}"/>
      `;
      break;

    case 22: // Mountain peaks / zigzag
      const peakStroke = randomSize(random, 6, 0.3);
      const peakCount = randomCount(random, 3, 5);
      const peakRotation = randomAngle(random);
      let peakPath = 'M 10 70';
      for (let i = 0; i < peakCount; i++) {
        const x = 10 + (i + 1) * (80 / (peakCount + 1));
        const y = randomPosition(random, 20, 40);
        peakPath += ` L ${x} ${y}`;
        if (i < peakCount - 1) {
          const valleyX = x + (80 / (peakCount + 1)) / 2;
          const valleyY = randomPosition(random, 50, 65);
          peakPath += ` L ${valleyX} ${valleyY}`;
        }
      }
      peakPath += ' L 90 70';
      shapes = `
        <g transform="rotate(${peakRotation} 50 50)">
          <path d="${peakPath}" fill="none" stroke="${color}" stroke-width="${peakStroke}" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
      break;

    case 23: // Concentric polygons
      const pent23Count = randomCount(random, 4, 7);
      const pent23Outer = randomSize(random, 40, 0.15);
      const pent23Inner = randomSize(random, 25, 0.2);
      const pent23Stroke = randomSize(random, 4, 0.3);
      const pent23Rotation = randomAngle(random);
      const pent1Points = [];
      const pent2Points = [];
      for (let i = 0; i < pent23Count; i++) {
        const angle = (i * 360 / pent23Count - 90) * Math.PI / 180;
        const x1 = 50 + pent23Outer * Math.cos(angle);
        const y1 = 50 + pent23Outer * Math.sin(angle);
        const x2 = 50 + pent23Inner * Math.cos(angle);
        const y2 = 50 + pent23Inner * Math.sin(angle);
        pent1Points.push(`${x1},${y1}`);
        pent2Points.push(`${x2},${y2}`);
      }
      shapes = `
        <polygon points="${pent1Points.join(' ')}" fill="none" stroke="${color}" stroke-width="${pent23Stroke}" transform="rotate(${pent23Rotation} 50 50)"/>
        <polygon points="${pent2Points.join(' ')}" fill="${color}" transform="rotate(${pent23Rotation} 50 50)"/>
      `;
      break;

    case 24: // Crescent
      const crescentRotation = randomAngle(random);
      const crescentOuter = randomSize(random, 35, 0.15);
      const crescentInnerX = randomPosition(random, 55, 65);
      const crescentInner = randomSize(random, 30, 0.15);
      shapes = `
        <g transform="rotate(${crescentRotation} 50 50)">
          <circle cx="50" cy="50" r="${crescentOuter}" fill="${color}"/>
          <circle cx="${crescentInnerX}" cy="50" r="${crescentInner}" fill="#ffffff"/>
        </g>
      `;
      break;
  }

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

/**
 * Generate a pattern-based symbol
 */
export function generatePatternSymbol(seed: string, color: string, letter?: string): SymbolSVGResult {
  const random = createSeededRandom(seed);
  const variation = randomInt(random, 0, 26);
  const firstLetter = letter ? letter.charAt(0).toUpperCase() : 'A';

  let shapes = '';

  switch (variation) {
    case 0: // Radial dots
      const dotCount = randomInt(random, 6, 8);
      const dotRadius = randomInt(random, 4, 6);
      const center0Size = randomSize(random, 8, 0.3);
      const dotDistance = constrainRadialDistance(dotRadius);
      for (let i = 0; i < dotCount; i++) {
        const angle = (i * 360 / dotCount) * Math.PI / 180;
        const x = 50 + dotDistance * Math.cos(angle);
        const y = 50 + dotDistance * Math.sin(angle);
        shapes += `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${color}"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="${center0Size}" fill="${color}"/>`;
      break;

    case 1: // Radial lines
      const lineCount = randomInt(random, 6, 8);
      const line1Stroke = randomStrokeWidth(random, 3);
      const line1Outer = constrainRadialDistance(0, line1Stroke);
      for (let i = 0; i < lineCount; i++) {
        const angle = (i * 360 / lineCount) * Math.PI / 180;
        const x1 = 50 + 15 * Math.cos(angle);
        const y1 = 50 + 15 * Math.sin(angle);
        const x2 = 50 + line1Outer * Math.cos(angle);
        const y2 = 50 + line1Outer * Math.sin(angle);
        shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${line1Stroke}" stroke-linecap="round"/>`;
      }
      break;

    case 2: // Grid of small circles
      const gridSize = 3;
      const spacing = 25;
      const startX = 50 - (gridSize - 1) * spacing / 2;
      const startY = 50 - (gridSize - 1) * spacing / 2;
      const grid2SmallSize = randomSize(random, 5, 0.3);
      const grid2CenterSize = randomSize(random, 7, 0.3);
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = startX + j * spacing;
          const y = startY + i * spacing;
          const radius = (i === 1 && j === 1) ? grid2CenterSize : grid2SmallSize;
          shapes += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`;
        }
      }
      break;

    case 3: // Radial triangles
      const triangleCount = randomInt(random, 5, 7);
      const center3Size = randomSize(random, 12, 0.3);
      const triangle3Size = 8;
      const triangle3Distance = constrainRadialDistance(triangle3Size * 1.5); // Triangle height is ~1.5x size
      for (let i = 0; i < triangleCount; i++) {
        const angle = (i * 360 / triangleCount - 90) * Math.PI / 180;
        const x = 50 + triangle3Distance * Math.cos(angle);
        const y = 50 + triangle3Distance * Math.sin(angle);
        shapes += `<path d="M ${x} ${y - triangle3Size} L ${x - triangle3Size * 0.866} ${y + triangle3Size * 0.5} L ${x + triangle3Size * 0.866} ${y + triangle3Size * 0.5} Z" fill="${color}"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="${center3Size}" fill="${color}"/>`;
      break;

    case 4: // Concentric circles with gaps
      const circle4Stroke = randomStrokeWidth(random, 4);
      const center4Size = randomSize(random, 10, 0.3);
      shapes = `
        <circle cx="50" cy="50" r="38" fill="none" stroke="${color}" stroke-width="${circle4Stroke}"/>
        <circle cx="50" cy="50" r="28" fill="none" stroke="${color}" stroke-width="${circle4Stroke}"/>
        <circle cx="50" cy="50" r="18" fill="none" stroke="${color}" stroke-width="${circle4Stroke}"/>
        <circle cx="50" cy="50" r="${center4Size}" fill="${color}"/>
      `;
      break;

    case 5: // Radial squares
      const squareCount = randomInt(random, 4, 6);
      const square5Size = randomSize(random, 12, 0.3);
      const center5Size = randomSize(random, 12, 0.3);
      const square5Distance = constrainRadialDistance(square5Size * 0.707); // Diagonal of square / 2
      for (let i = 0; i < squareCount; i++) {
        const angle = (i * 360 / squareCount) * Math.PI / 180;
        const x = 50 + square5Distance * Math.cos(angle) - square5Size / 2;
        const y = 50 + square5Distance * Math.sin(angle) - square5Size / 2;
        shapes += `<rect x="${x}" y="${y}" width="${square5Size}" height="${square5Size}" fill="${color}" rx="2"/>`;
      }
      shapes += `<rect x="${50 - center5Size / 2}" y="${50 - center5Size / 2}" width="${center5Size}" height="${center5Size}" fill="${color}" rx="2"/>`;
      break;

    case 6: // Star pattern
      const starPoints = randomInt(random, 5, 7);
      const star6OuterRadius = constrainPolygonRadius(40);
      const innerRadius = 18;
      let starPath = 'M ';
      for (let i = 0; i < starPoints * 2; i++) {
        const radius = i % 2 === 0 ? star6OuterRadius : innerRadius;
        const angle = (i * 180 / starPoints - 90) * Math.PI / 180;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        starPath += `${x} ${y} `;
        if (i < starPoints * 2 - 1) starPath += 'L ';
      }
      starPath += 'Z';
      shapes = `<path d="${starPath}" fill="${color}"/>`;
      break;

    case 7: // Flower pattern
      const petalCount = randomCount(random, 6, 10);
      const petal7Size = randomSize(random, 12, 0.3);
      const petal7Distance = constrainRadialDistance(petal7Size);
      const center7Size = randomSize(random, 12, 0.3);
      for (let i = 0; i < petalCount; i++) {
        const angle = (i * 360 / petalCount) * Math.PI / 180;
        const x = 50 + petal7Distance * Math.cos(angle);
        const y = 50 + petal7Distance * Math.sin(angle);
        shapes += `<circle cx="${x}" cy="${y}" r="${petal7Size}" fill="${color}"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="${center7Size}" fill="${color}"/>`;
      break;

    case 8: // Diamond grid
      const diamond8Spacing = randomSize(random, 30, 0.2);
      const diamond8Size = randomSize(random, 8, 0.3);
      const diamond8Rows = randomCount(random, 3, 4);
      for (let i = 0; i < diamond8Rows; i++) {
        for (let j = 0; j < diamond8Rows; j++) {
          const x = (100 - (diamond8Rows - 1) * diamond8Spacing) / 2 + j * diamond8Spacing;
          const y = (100 - (diamond8Rows - 1) * diamond8Spacing) / 2 + i * diamond8Spacing;
          const size = (i === Math.floor(diamond8Rows/2) && j === Math.floor(diamond8Rows/2)) ? diamond8Size * 1.4 : diamond8Size;
          shapes += `<path d="M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z" fill="${color}"/>`;
        }
      }
      break;

    case 9: // Cross hatch pattern
      const hatchCount = randomCount(random, 3, 5);
      const hatchStroke = randomStrokeWidth(random, 3);
      const center9Size = randomSize(random, 15, 0.3);
      const hatchSpacing = 70 / (hatchCount - 1);
      for (let i = 0; i < hatchCount; i++) {
        const offset = 15 + i * hatchSpacing;
        shapes += `<line x1="${offset}" y1="15" x2="${offset}" y2="85" stroke="${color}" stroke-width="${hatchStroke}"/>`;
        shapes += `<line x1="15" y1="${offset}" x2="85" y2="${offset}" stroke="${color}" stroke-width="${hatchStroke}"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="${center9Size}" fill="${color}"/>`;
      break;

    case 10: // Hexagonal grid
      const hexGridSize = randomCount(random, 3, 4);
      const hexSpacing = randomSize(random, 20, 0.15);
      const hexDotSize = randomSize(random, 5, 0.3);
      for (let row = 0; row < hexGridSize; row++) {
        for (let col = 0; col < hexGridSize; col++) {
          const x = (100 - (hexGridSize - 1) * hexSpacing) / 2 + col * hexSpacing + (row % 2) * (hexSpacing / 2);
          const y = (100 - (hexGridSize - 1) * hexSpacing * 0.85) / 2 + row * hexSpacing * 0.85;
          shapes += `<circle cx="${x}" cy="${y}" r="${hexDotSize}" fill="${color}"/>`;
        }
      }
      break;

    case 11: // Radiating arcs
      const arc11Count = randomCount(random, 3, 6);
      const arc11Stroke = randomStrokeWidth(random, 3);
      const arc11Start = randomSize(random, 15, 0.2);
      const arc11Spacing = randomSize(random, 8, 0.3);
      for (let i = 0; i < arc11Count; i++) {
        const radius = arc11Start + i * arc11Spacing;
        shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="${arc11Stroke}"/>`;
      }
      break;

    case 12: // Zigzag pattern
      const zigzagStroke = randomStrokeWidth(random, 4);
      shapes = `
        <path d="M 15 30 L 30 15 L 45 30 L 60 15 L 75 30 L 90 15"
              fill="none" stroke="${color}" stroke-width="${zigzagStroke}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 15 50 L 30 35 L 45 50 L 60 35 L 75 50 L 90 35"
              fill="none" stroke="${color}" stroke-width="${zigzagStroke}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 15 70 L 30 55 L 45 70 L 60 55 L 75 70 L 90 55"
              fill="none" stroke="${color}" stroke-width="${zigzagStroke}" stroke-linecap="round" stroke-linejoin="round"/>
      `;
      break;

    case 13: // Corner dots pattern
      const cornerDotCount = randomCount(random, 3, 5);
      const cornerDotSize = randomSize(random, 6, 0.3);
      const center13Size = randomSize(random, 15, 0.3);
      const cornerSpacing = 60 / (cornerDotCount - 1);
      for (let i = 0; i < cornerDotCount; i++) {
        for (let j = 0; j < cornerDotCount; j++) {
          if ((i === 0 || i === cornerDotCount - 1) && (j === 0 || j === cornerDotCount - 1)) {
            const x = 20 + j * cornerSpacing;
            const y = 20 + i * cornerSpacing;
            shapes += `<circle cx="${x}" cy="${y}" r="${cornerDotSize}" fill="${color}"/>`;
          }
        }
      }
      shapes += `<circle cx="50" cy="50" r="${center13Size}" fill="${color}"/>`;
      break;

    case 14: // Orbital rings
      const ringCount = randomCount(random, 3, 5);
      const orbitSize = randomSize(random, 6, 0.3);
      const ringStroke = randomStrokeWidth(random, 2);
      const center14Size = randomSize(random, 8, 0.3);
      for (let i = 0; i < ringCount; i++) {
        const radius = 12 + i * 12;
        const angle = (i * (360 / ringCount)) * Math.PI / 180;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        shapes += `<circle cx="${x}" cy="${y}" r="${orbitSize}" fill="${color}"/>`;
        shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="${ringStroke}" stroke-dasharray="3 3"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="${center14Size}" fill="${color}"/>`;
      break;

    case 15: // Radial dashes
      const dashRayCount = randomCount(random, 8, 14);
      const dashInner = randomSize(random, 20, 0.2);
      const dashStroke = randomSize(random, 4, 0.3);
      const dash15Outer = constrainRadialDistance(0, dashStroke);
      const center15Size = randomSize(random, 15, 0.3);
      for (let i = 0; i < dashRayCount; i++) {
        const angle = (i * 360 / dashRayCount) * Math.PI / 180;
        const x1 = 50 + dashInner * Math.cos(angle);
        const y1 = 50 + dashInner * Math.sin(angle);
        const x2 = 50 + dash15Outer * Math.cos(angle);
        const y2 = 50 + dash15Outer * Math.sin(angle);
        shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${dashStroke}" stroke-linecap="round"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="${center15Size}" fill="${color}"/>`;
      break;

    case 16: // Layered squares
      const squareLayerCount = randomCount(random, 3, 5);
      const maxSquare16Size = randomSize(random, 70, 0.15);
      const square16Stroke = randomStrokeWidth(random, 3);
      const square16Rotation = randomAngle(random);
      for (let i = 0; i < squareLayerCount; i++) {
        const size = maxSquare16Size - (i * maxSquare16Size / squareLayerCount);
        const offset = (100 - size) / 2;
        shapes += `<rect x="${offset}" y="${offset}" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${square16Stroke}" transform="rotate(${square16Rotation} 50 50)"/>`;
      }
      break;

    case 17: // Diagonal stripes
      const stripeCount = randomCount(random, 5, 8);
      const stripeStroke = randomStrokeWidth(random, 3);
      const stripeAngle = randomAngle(random);
      const stripeSpacing = 80 / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        const x = 10 + i * stripeSpacing;
        shapes += `<line x1="${x}" y1="10" x2="${x + 50}" y2="90" stroke="${color}" stroke-width="${stripeStroke}" transform="rotate(${stripeAngle} 50 50)"/>`;
      }
      break;

    case 18: // Constellation pattern
      const starCount2 = randomCount(random, 6, 10);
      const constellation = [];
      const star18Size = randomSize(random, 3, 0.3);
      const center18Size = randomSize(random, 4, 0.3);
      const lineStroke = randomStrokeWidth(random, 2);
      const constellationRadius = randomSize(random, 28, 0.25);
      for (let i = 0; i < starCount2; i++) {
        const angle = (i * 360 / starCount2) * Math.PI / 180;
        const radiusVar = constellationRadius + randomSize(random, 0, 0.3);
        const x = 50 + radiusVar * Math.cos(angle);
        const y = 50 + radiusVar * Math.sin(angle);
        constellation.push({ x, y });
        shapes += `<circle cx="${x}" cy="${y}" r="${star18Size}" fill="${color}"/>`;
      }
      // Connect some stars with lines
      for (let i = 0; i < starCount2; i++) {
        const next = (i + 1) % starCount2;
        if (i % 2 === 0) {
          shapes += `<line x1="${constellation[i].x}" y1="${constellation[i].y}" x2="${constellation[next].x}" y2="${constellation[next].y}" stroke="${color}" stroke-width="${lineStroke}"/>`;
        }
      }
      shapes += `<circle cx="50" cy="50" r="${center18Size}" fill="${color}"/>`;
      break;

    case 19: // Petal burst
      const petalBurstCount = randomCount(random, 8, 14);
      const petal19Rx = randomSize(random, 8, 0.3);
      const petal19Ry = randomSize(random, 15, 0.3);
      const petal19Distance = constrainRadialDistance(petal19Ry); // Use longer axis for constraint
      const center19Size = randomSize(random, 10, 0.3);
      for (let i = 0; i < petalBurstCount; i++) {
        const angle = (i * 360 / petalBurstCount) * Math.PI / 180;
        const x = 50 + petal19Distance * Math.cos(angle);
        const y = 50 + petal19Distance * Math.sin(angle);
        shapes += `<ellipse cx="${x}" cy="${y}" rx="${petal19Rx}" ry="${petal19Ry}" fill="${color}" transform="rotate(${i * 360 / petalBurstCount} ${x} ${y})"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="${center19Size}" fill="${color}"/>`;
      break;

    case 20: // Radial circle of letters
      const radialLetterCount = randomCount(random, 6, 10);
      const radialLetterRadius = randomSize(random, 35, 0.15);
      const radialLetterSize = randomSize(random, 16, 0.2);
      for (let i = 0; i < radialLetterCount; i++) {
        const angle = (i * 360 / radialLetterCount - 90) * Math.PI / 180;
        const x = 50 + radialLetterRadius * Math.cos(angle);
        const y = 50 + radialLetterRadius * Math.sin(angle);
        const rotation = (i * 360 / radialLetterCount);
        shapes += `<text x="${x}" y="${y}" font-size="${radialLetterSize}" font-weight="600" fill="${color}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rotation} ${x} ${y})">${firstLetter}</text>`;
      }
      shapes += `<text x="50" y="50" font-size="${radialLetterSize * 1.5}" font-weight="700" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
      break;

    case 21: // Grid of repeating letters
      const gridLetterSize = randomCount(random, 3, 4);
      const gridSpacing = 80 / (gridLetterSize - 1);
      const letterGridSize = randomSize(random, 18, 0.2);
      for (let i = 0; i < gridLetterSize; i++) {
        for (let j = 0; j < gridLetterSize; j++) {
          const x = 10 + j * gridSpacing;
          const y = 10 + i * gridSpacing;
          const isCenterish = (i === Math.floor(gridLetterSize/2) && j === Math.floor(gridLetterSize/2));
          const size = isCenterish ? letterGridSize * 1.4 : letterGridSize;
          const weight = isCenterish ? "700" : "600";
          shapes += `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
        }
      }
      break;

    case 22: // Spiral of letters
      const spiralLetterCount = randomCount(random, 6, 10);
      const spiralTightness = randomSize(random, 3, 0.3);
      const spiralStart = randomSize(random, 12, 0.3);
      const spiralLetterSize = randomSize(random, 14, 0.2);
      for (let i = 0; i < spiralLetterCount; i++) {
        const angle = (i * 70) * Math.PI / 180;
        const radius = spiralStart + i * spiralTightness;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        shapes += `<text x="${x}" y="${y}" font-size="${spiralLetterSize}" font-weight="600" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
      }
      break;

    case 23: // Arc of letters
      const arcLetterCount = randomCount(random, 5, 8);
      const arcRadius = randomSize(random, 35, 0.15);
      const arcLetterSize = randomSize(random, 18, 0.2);
      const arcSpan = randomSize(random, 180, 0.3);
      const arcStart = (180 - arcSpan) / 2;
      const arc23Stroke = randomStrokeWidth(random, 2);
      for (let i = 0; i < arcLetterCount; i++) {
        const angle = (arcStart + (i * arcSpan / (arcLetterCount - 1)) - 90) * Math.PI / 180;
        const x = 50 + arcRadius * Math.cos(angle);
        const y = 50 + arcRadius * Math.sin(angle);
        shapes += `<text x="${x}" y="${y}" font-size="${arcLetterSize}" font-weight="600" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
      }
      shapes += `<path d="M ${50 + arcRadius * Math.cos((arcStart - 90) * Math.PI / 180)} ${50 + arcRadius * Math.sin((arcStart - 90) * Math.PI / 180)} A ${arcRadius} ${arcRadius} 0 0 1 ${50 + arcRadius * Math.cos((arcStart + arcSpan - 90) * Math.PI / 180)} ${50 + arcRadius * Math.sin((arcStart + arcSpan - 90) * Math.PI / 180)}" fill="none" stroke="${color}" stroke-width="${arc23Stroke}"/>`;
      break;

    case 24: // Letters forming radial burst
      const burstLetterCount = randomCount(random, 8, 12);
      const burstInner = randomSize(random, 18, 0.2);
      const burstOuter = randomSize(random, 38, 0.15);
      const burstLetterSize = randomSize(random, 14, 0.2);
      const burst24Stroke = randomStrokeWidth(random, 2);
      for (let i = 0; i < burstLetterCount; i++) {
        const angle = (i * 360 / burstLetterCount) * Math.PI / 180;
        const x1 = 50 + burstInner * Math.cos(angle);
        const y1 = 50 + burstInner * Math.sin(angle);
        const x2 = 50 + burstOuter * Math.cos(angle);
        const y2 = 50 + burstOuter * Math.sin(angle);
        shapes += `<text x="${x2}" y="${y2}" font-size="${burstLetterSize}" font-weight="600" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
        shapes += `<line x1="${x1}" y1="${y1}" x2="${x2 - burstLetterSize/3 * Math.cos(angle)}" y2="${y2 - burstLetterSize/3 * Math.sin(angle)}" stroke="${color}" stroke-width="${burst24Stroke}"/>`;
      }
      break;

    case 25: // Concentric rings of letters
      const ringLetterCount = randomCount(random, 2, 3);
      const baseRingRadius = randomSize(random, 28, 0.15);
      const ringSpacing = randomSize(random, 15, 0.2);
      const ringLetterSize = randomSize(random, 14, 0.2);
      const baseLetterCount = randomCount(random, 8, 12);
      for (let ring = 0; ring < ringLetterCount; ring++) {
        const radius = baseRingRadius - ring * ringSpacing;
        const lettersInRing = Math.max(4, Math.floor(baseLetterCount - ring * 2));
        for (let i = 0; i < lettersInRing; i++) {
          const angle = (i * 360 / lettersInRing) * Math.PI / 180;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          shapes += `<text x="${x}" y="${y}" font-size="${ringLetterSize}" font-weight="600" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
        }
      }
      shapes += `<text x="50" y="50" font-size="${ringLetterSize * 1.5}" font-weight="700" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
      break;

    case 26: // Letters arranged in star/polygon
      const polyLetterCount = randomCount(random, 5, 8);
      const polyLetterRadius = randomSize(random, 38, 0.15);
      const polyLetterSize = randomSize(random, 18, 0.2);
      const polyRotation = randomAngle(random);
      const poly26Stroke = randomStrokeWidth(random, 2);
      const polyPoints = [];
      for (let i = 0; i < polyLetterCount; i++) {
        const angle = (i * 360 / polyLetterCount + polyRotation) * Math.PI / 180;
        const x = 50 + polyLetterRadius * Math.cos(angle);
        const y = 50 + polyLetterRadius * Math.sin(angle);
        polyPoints.push(`${x},${y}`);
        shapes += `<text x="${x}" y="${y}" font-size="${polyLetterSize}" font-weight="600" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
      }
      shapes += `<polygon points="${polyPoints.join(' ')}" fill="none" stroke="${color}" stroke-width="${poly26Stroke}"/>`;
      shapes += `<text x="50" y="50" font-size="${polyLetterSize * 1.3}" font-weight="700" fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
      break;
  }

  return {
    svg: `<svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${shapes}
    </svg>`,
    viewBox: { width: VIEWBOX_SIZE, height: VIEWBOX_SIZE }
  };
}

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
