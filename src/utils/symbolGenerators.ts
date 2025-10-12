/**
 * Symbol generation utilities for creating abstract logo marks
 */

import type { SymbolSVGResult } from '../types/symbol';
import { createSeededRandom, randomInt } from './seedUtils';

const VIEWBOX_SIZE = 100;

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

  let shapes = '';

  switch (variation) {
    case 0: // Letter in circle
      shapes = `
        <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="50" y="50" font-family="${font}" font-size="50" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 1: // Letter in rounded square
      shapes = `
        <rect x="8" y="8" width="84" height="84" rx="12" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 2: // Letter with arc behind
      const arcRotation = randomInt(random, 0, 360);
      shapes = `
        <path d="M 50 10 A 40 40 0 0 1 90 50" fill="none" stroke="${color}"
              stroke-width="8" stroke-linecap="round" transform="rotate(${arcRotation} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="52" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 3: // Letter with geometric accent
      const accentSize = randomInt(random, 15, 25);
      const accentX = randomInt(random, 20, 80);
      const accentY = randomInt(random, 20, 35);
      shapes = `
        <circle cx="${accentX}" cy="${accentY}" r="${accentSize}" fill="${color}" opacity="0.3"/>
        <text x="50" y="55" font-family="${font}" font-size="55" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 4: // Letter overlapping with shape
      shapes = `
        <rect x="60" y="35" width="30" height="30" rx="4" fill="${color}" opacity="0.25"/>
        <text x="45" y="50" font-family="${font}" font-size="50" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 5: // Letter with corner triangles
      shapes = `
        <path d="M 10 10 L 25 10 L 10 25 Z" fill="${color}" opacity="0.3"/>
        <path d="M 90 90 L 90 75 L 75 90 Z" fill="${color}" opacity="0.3"/>
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 6: // Letter in hexagon
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const x = 50 + 42 * Math.cos(angle);
        const y = 50 + 42 * Math.sin(angle);
        hexPoints.push(`${x},${y}`);
      }
      shapes = `
        <polygon points="${hexPoints.join(' ')}" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="50" y="50" font-family="${font}" font-size="46" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 7: // Letter with double circles
      shapes = `
        <circle cx="50" cy="50" r="42" fill="none" stroke="${color}" stroke-width="2"/>
        <circle cx="50" cy="50" r="35" fill="none" stroke="${color}" stroke-width="2"/>
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 8: // Letter with diagonal line
      const diagonalAngle = randomInt(random, 0, 1) === 0 ? 45 : -45;
      shapes = `
        <line x1="15" y1="50" x2="85" y2="50" stroke="${color}" stroke-width="6"
              transform="rotate(${diagonalAngle} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="52" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 9: // Letter with quarter circles
      const quarterRotation = randomInt(random, 0, 3) * 90;
      shapes = `
        <path d="M 10 10 Q 10 50 50 50" fill="none" stroke="${color}"
              stroke-width="5" transform="rotate(${quarterRotation} 50 50)"/>
        <path d="M 90 10 Q 90 50 50 50" fill="none" stroke="${color}"
              stroke-width="5" transform="rotate(${quarterRotation} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="50" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 10: // Letter in diamond
      shapes = `
        <path d="M 50 8 L 92 50 L 50 92 L 8 50 Z" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="50" y="50" font-family="${font}" font-size="46" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 11: // Letter with side bars
      shapes = `
        <rect x="10" y="25" width="8" height="50" fill="${color}" opacity="0.4"/>
        <rect x="82" y="25" width="8" height="50" fill="${color}" opacity="0.4"/>
        <text x="50" y="50" font-family="${font}" font-size="52" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 12: // Letter in filled circle
      shapes = `
        <circle cx="50" cy="50" r="45" fill="${color}" opacity="0.15"/>
        <text x="50" y="50" font-family="${font}" font-size="52" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 13: // Letter with corner brackets
      shapes = `
        <path d="M 10 10 L 10 25 M 10 10 L 25 10" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
        <path d="M 90 10 L 90 25 M 90 10 L 75 10" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
        <path d="M 10 90 L 10 75 M 10 90 L 25 90" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
        <path d="M 90 90 L 90 75 M 90 90 L 75 90" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
        <text x="50" y="50" font-family="${font}" font-size="50" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 14: // Letter with orbiting circle
      const orbitAngle = randomInt(random, 0, 360);
      const orbitX = 50 + 35 * Math.cos(orbitAngle * Math.PI / 180);
      const orbitY = 50 + 35 * Math.sin(orbitAngle * Math.PI / 180);
      shapes = `
        <circle cx="${orbitX}" cy="${orbitY}" r="8" fill="${color}" opacity="0.4"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5 5" opacity="0.3"/>
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 15: // Letter with triangular frame
      shapes = `
        <path d="M 50 10 L 85 80 L 15 80 Z" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="50" y="55" font-family="${font}" font-size="50" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 16: // Letter with starburst lines
      const lineCount = 8;
      for (let i = 0; i < lineCount; i++) {
        const angle = (i * 45) * Math.PI / 180;
        const x1 = 50 + 25 * Math.cos(angle);
        const y1 = 50 + 25 * Math.sin(angle);
        const x2 = 50 + 42 * Math.cos(angle);
        const y2 = 50 + 42 * Math.sin(angle);
        shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" opacity="0.4"/>`;
      }
      shapes += `<text x="50" y="50" font-family="${font}" font-size="44" font-weight="700"
            fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>`;
      break;

    case 17: // Letter in octagon frame
      const octPoints = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45 + 22.5) * Math.PI / 180;
        const x = 50 + 42 * Math.cos(angle);
        const y = 50 + 42 * Math.sin(angle);
        octPoints.push(`${x},${y}`);
      }
      shapes = `
        <polygon points="${octPoints.join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>
        <text x="50" y="50" font-family="${font}" font-size="44" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 18: // Letter with curved swoosh
      const swooshRotation = randomInt(random, 0, 3) * 90;
      shapes = `
        <path d="M 20 50 Q 30 20 50 20 Q 70 20 80 50" fill="none" stroke="${color}"
              stroke-width="6" stroke-linecap="round" transform="rotate(${swooshRotation} 50 50)"/>
        <text x="50" y="50" font-family="${font}" font-size="48" font-weight="700"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
      `;
      break;

    case 19: // Letter with pentagon frame
      const pentagonPoints = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const x = 50 + 42 * Math.cos(angle);
        const y = 50 + 42 * Math.sin(angle);
        pentagonPoints.push(`${x},${y}`);
      }
      shapes = `
        <polygon points="${pentagonPoints.join(' ')}" fill="none" stroke="${color}" stroke-width="4"/>
        <text x="50" y="52" font-family="${font}" font-size="46" font-weight="600"
              fill="${color}" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
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
      const t1Rotation = randomInt(random, 0, 360);
      shapes = `
        <path d="M 50 15 L 75 70 L 25 70 Z" fill="${color}" opacity="0.8" transform="rotate(${t1Rotation} 50 50)"/>
        <path d="M 50 30 L 65 55 L 35 55 Z" fill="${color}" opacity="0.4" transform="rotate(${t1Rotation + 180} 50 50)"/>
      `;
      break;

    case 1: // Overlapping circles
      const c1x = randomInt(random, 35, 45);
      const c2x = randomInt(random, 55, 65);
      shapes = `
        <circle cx="${c1x}" cy="50" r="30" fill="${color}" opacity="0.6"/>
        <circle cx="${c2x}" cy="50" r="30" fill="${color}" opacity="0.6"/>
      `;
      break;

    case 2: // Split circle with geometric element
      shapes = `
        <circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="125 125"/>
        <rect x="42" y="42" width="16" height="16" fill="${color}"/>
      `;
      break;

    case 3: // Rounded pentagon
      const pentagonPoints = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);
        pentagonPoints.push(`${x},${y}`);
      }
      shapes = `<polygon points="${pentagonPoints.join(' ')}" fill="${color}"/>`;
      break;

    case 4: // Arc composition
      const arc1Rotation = randomInt(random, 0, 90);
      const arc2Rotation = arc1Rotation + 90;
      shapes = `
        <path d="M 30 50 A 20 20 0 0 1 50 30" fill="none" stroke="${color}"
              stroke-width="8" stroke-linecap="round" transform="rotate(${arc1Rotation} 50 50)"/>
        <path d="M 30 50 A 20 20 0 0 1 50 30" fill="none" stroke="${color}"
              stroke-width="8" stroke-linecap="round" transform="rotate(${arc2Rotation} 50 50)"/>
      `;
      break;

    case 5: // Rounded hexagon
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const x = 50 + 38 * Math.cos(angle);
        const y = 50 + 38 * Math.sin(angle);
        hexPoints.push(`${x},${y}`);
      }
      shapes = `<polygon points="${hexPoints.join(' ')}" fill="${color}"/>`;
      break;

    case 6: // Intersecting rectangles
      const rectRotation = randomInt(random, 15, 45);
      shapes = `
        <rect x="20" y="40" width="60" height="20" fill="${color}" opacity="0.7"/>
        <rect x="40" y="20" width="20" height="60" fill="${color}" opacity="0.7" transform="rotate(${rectRotation} 50 50)"/>
      `;
      break;

    case 7: // Wave-like curves
      shapes = `
        <path d="M 20 50 Q 35 20, 50 50 T 80 50" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
        <path d="M 20 60 Q 35 30, 50 60 T 80 60" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
      `;
      break;

    case 8: // Geometric letter-like form
      shapes = `
        <path d="M 25 20 L 25 80 L 40 80 L 40 55 L 60 55 L 75 80 L 90 80 L 70 50 L 85 20 L 70 20 L 55 45 L 40 45 L 40 20 Z" fill="${color}"/>
      `;
      break;

    case 9: // Diamond composition
      shapes = `
        <path d="M 50 15 L 75 50 L 50 85 L 25 50 Z" fill="${color}" opacity="0.8"/>
        <path d="M 50 30 L 65 50 L 50 70 L 35 50 Z" fill="${color}" opacity="0.4"/>
      `;
      break;

    case 10: // Spiral
      shapes = `
        <path d="M 50 50 Q 70 50 70 30 Q 70 10 50 10 Q 20 10 20 40 Q 20 80 60 80"
              fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
      `;
      break;

    case 11: // Octagon
      const octPoints = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180;
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);
        octPoints.push(`${x},${y}`);
      }
      shapes = `<polygon points="${octPoints.join(' ')}" fill="${color}"/>`;
      break;

    case 12: // Cross/Plus
      shapes = `
        <rect x="42" y="10" width="16" height="80" fill="${color}"/>
        <rect x="10" y="42" width="80" height="16" fill="${color}"/>
      `;
      break;

    case 13: // Curved triangles
      const curveRotation = randomInt(random, 0, 120) * 3;
      shapes = `
        <path d="M 50 20 Q 70 35 60 50 Q 50 65 40 50 Q 30 35 50 20"
              fill="${color}" opacity="0.7" transform="rotate(${curveRotation} 50 50)"/>
      `;
      break;

    case 14: // Nested squares
      shapes = `
        <rect x="15" y="15" width="70" height="70" fill="none" stroke="${color}" stroke-width="4"/>
        <rect x="28" y="28" width="44" height="44" fill="none" stroke="${color}" stroke-width="3"/>
        <rect x="40" y="40" width="20" height="20" fill="${color}"/>
      `;
      break;

    case 15: // Infinity symbol
      shapes = `
        <path d="M 20 50 Q 30 30, 40 50 Q 50 70, 60 50 Q 70 30, 80 50 Q 70 70, 60 50 Q 50 30, 40 50 Q 30 70, 20 50"
              fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
      `;
      break;

    case 16: // Droplet shape
      shapes = `
        <path d="M 50 10 Q 70 30 70 50 Q 70 75 50 85 Q 30 75 30 50 Q 30 30 50 10"
              fill="${color}" opacity="0.8"/>
      `;
      break;

    case 17: // Split diamond
      const splitRotation = randomInt(random, 0, 3) * 90;
      shapes = `
        <path d="M 50 15 L 75 50 L 50 50 Z" fill="${color}" opacity="0.7" transform="rotate(${splitRotation} 50 50)"/>
        <path d="M 50 50 L 75 50 L 50 85 Z" fill="${color}" opacity="0.7" transform="rotate(${splitRotation} 50 50)"/>
      `;
      break;

    case 18: // Y-shape
      shapes = `
        <path d="M 50 10 L 50 40 M 50 40 L 30 60 M 50 40 L 70 60 M 30 60 L 30 85 M 70 60 L 70 85"
              stroke="${color}" stroke-width="8" stroke-linecap="round" fill="none"/>
      `;
      break;

    case 19: // Rounded triangles arrangement
      shapes = `
        <circle cx="50" cy="30" r="12" fill="${color}" opacity="0.7"/>
        <circle cx="35" cy="55" r="12" fill="${color}" opacity="0.7"/>
        <circle cx="65" cy="55" r="12" fill="${color}" opacity="0.7"/>
      `;
      break;

    case 20: // Yin-yang inspired
      shapes = `
        <circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="6"/>
        <path d="M 50 10 Q 70 30 70 50 Q 70 70 50 90"
              fill="${color}" opacity="0.3"/>
        <circle cx="50" cy="70" r="10" fill="${color}"/>
      `;
      break;

    case 21: // Rounded hexagon with center
      const hexPoints2 = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const x = 50 + 38 * Math.cos(angle);
        const y = 50 + 38 * Math.sin(angle);
        hexPoints2.push(`${x},${y}`);
      }
      shapes = `
        <polygon points="${hexPoints2.join(' ')}" fill="none" stroke="${color}" stroke-width="4"/>
        <circle cx="50" cy="50" r="12" fill="${color}"/>
      `;
      break;

    case 22: // Mountain peaks
      shapes = `
        <path d="M 10 70 L 30 30 L 50 55 L 70 20 L 90 70"
              fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      `;
      break;

    case 23: // Concentric pentagons
      const pent1Points = [];
      const pent2Points = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        const x1 = 50 + 40 * Math.cos(angle);
        const y1 = 50 + 40 * Math.sin(angle);
        const x2 = 50 + 25 * Math.cos(angle);
        const y2 = 50 + 25 * Math.sin(angle);
        pent1Points.push(`${x1},${y1}`);
        pent2Points.push(`${x2},${y2}`);
      }
      shapes = `
        <polygon points="${pent1Points.join(' ')}" fill="none" stroke="${color}" stroke-width="4"/>
        <polygon points="${pent2Points.join(' ')}" fill="${color}" opacity="0.6"/>
      `;
      break;

    case 24: // Crescent moon
      const crescentRotation = randomInt(random, 0, 3) * 90;
      shapes = `
        <circle cx="50" cy="50" r="35" fill="${color}"/>
        <circle cx="60" cy="50" r="30" fill="#ffffff"/>
        <g transform="rotate(${crescentRotation} 50 50)">
          <circle cx="50" cy="50" r="35" fill="${color}"/>
          <circle cx="60" cy="50" r="30" fill="none"/>
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
export function generatePatternSymbol(seed: string, color: string): SymbolSVGResult {
  const random = createSeededRandom(seed);
  const variation = randomInt(random, 0, 19);

  let shapes = '';

  switch (variation) {
    case 0: // Radial dots
      const dotCount = randomInt(random, 6, 8);
      const dotRadius = randomInt(random, 4, 6);
      for (let i = 0; i < dotCount; i++) {
        const angle = (i * 360 / dotCount) * Math.PI / 180;
        const x = 50 + 35 * Math.cos(angle);
        const y = 50 + 35 * Math.sin(angle);
        shapes += `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${color}"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="8" fill="${color}"/>`;
      break;

    case 1: // Radial lines
      const lineCount = randomInt(random, 6, 8);
      for (let i = 0; i < lineCount; i++) {
        const angle = (i * 360 / lineCount) * Math.PI / 180;
        const x1 = 50 + 15 * Math.cos(angle);
        const y1 = 50 + 15 * Math.sin(angle);
        const x2 = 50 + 40 * Math.cos(angle);
        const y2 = 50 + 40 * Math.sin(angle);
        shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
      }
      break;

    case 2: // Grid of small circles
      const gridSize = 3;
      const spacing = 25;
      const startX = 50 - (gridSize - 1) * spacing / 2;
      const startY = 50 - (gridSize - 1) * spacing / 2;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = startX + j * spacing;
          const y = startY + i * spacing;
          const radius = (i === 1 && j === 1) ? 6 : 4;
          shapes += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`;
        }
      }
      break;

    case 3: // Radial triangles
      const triangleCount = randomInt(random, 5, 7);
      for (let i = 0; i < triangleCount; i++) {
        const angle = (i * 360 / triangleCount - 90) * Math.PI / 180;
        const x = 50 + 30 * Math.cos(angle);
        const y = 50 + 30 * Math.sin(angle);
        const size = 8;
        shapes += `<path d="M ${x} ${y - size} L ${x - size * 0.866} ${y + size * 0.5} L ${x + size * 0.866} ${y + size * 0.5} Z" fill="${color}"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="10" fill="${color}"/>`;
      break;

    case 4: // Concentric circles with gaps
      shapes = `
        <circle cx="50" cy="50" r="38" fill="none" stroke="${color}" stroke-width="4"/>
        <circle cx="50" cy="50" r="28" fill="none" stroke="${color}" stroke-width="4"/>
        <circle cx="50" cy="50" r="18" fill="none" stroke="${color}" stroke-width="4"/>
        <circle cx="50" cy="50" r="8" fill="${color}"/>
      `;
      break;

    case 5: // Radial squares
      const squareCount = randomInt(random, 4, 6);
      for (let i = 0; i < squareCount; i++) {
        const angle = (i * 360 / squareCount) * Math.PI / 180;
        const x = 50 + 30 * Math.cos(angle) - 5;
        const y = 50 + 30 * Math.sin(angle) - 5;
        shapes += `<rect x="${x}" y="${y}" width="10" height="10" fill="${color}" rx="2"/>`;
      }
      shapes += `<rect x="45" y="45" width="10" height="10" fill="${color}" rx="2"/>`;
      break;

    case 6: // Star pattern
      const starPoints = randomInt(random, 5, 7);
      const outerRadius = 40;
      const innerRadius = 18;
      let starPath = 'M ';
      for (let i = 0; i < starPoints * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
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
      const petalCount = randomInt(random, 6, 8);
      for (let i = 0; i < petalCount; i++) {
        const angle = (i * 360 / petalCount) * Math.PI / 180;
        const x = 50 + 25 * Math.cos(angle);
        const y = 50 + 25 * Math.sin(angle);
        shapes += `<circle cx="${x}" cy="${y}" r="12" fill="${color}" opacity="0.6"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="12" fill="${color}"/>`;
      break;

    case 8: // Diamond grid
      const diamondSpacing = 30;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const x = 20 + j * diamondSpacing;
          const y = 20 + i * diamondSpacing;
          const size = (i === 1 && j === 1) ? 10 : 7;
          shapes += `<path d="M ${x} ${y - size} L ${x + size} ${y} L ${x} ${y + size} L ${x - size} ${y} Z" fill="${color}" opacity="${(i === 1 && j === 1) ? '1' : '0.6'}"/>`;
        }
      }
      break;

    case 9: // Cross hatch pattern
      const hatchCount = randomInt(random, 3, 4);
      for (let i = 0; i < hatchCount; i++) {
        const offset = 15 + i * 20;
        shapes += `<line x1="${offset}" y1="15" x2="${offset}" y2="85" stroke="${color}" stroke-width="2"/>`;
        shapes += `<line x1="15" y1="${offset}" x2="85" y2="${offset}" stroke="${color}" stroke-width="2"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="15" fill="${color}"/>`;
      break;

    case 10: // Hexagonal grid
      const hexGridSize = 3;
      for (let row = 0; row < hexGridSize; row++) {
        for (let col = 0; col < hexGridSize; col++) {
          const x = 30 + col * 20 + (row % 2) * 10;
          const y = 30 + row * 17;
          shapes += `<circle cx="${x}" cy="${y}" r="5" fill="${color}" opacity="0.7"/>`;
        }
      }
      break;

    case 11: // Radiating arcs
      const arcCount = randomInt(random, 4, 6);
      for (let i = 0; i < arcCount; i++) {
        const radius = 15 + i * 8;
        shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="2" opacity="${0.8 - i * 0.15}"/>`;
      }
      break;

    case 12: // Zigzag pattern
      shapes = `
        <path d="M 15 30 L 30 15 L 45 30 L 60 15 L 75 30 L 90 15"
              fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 15 50 L 30 35 L 45 50 L 60 35 L 75 50 L 90 35"
              fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 15 70 L 30 55 L 45 70 L 60 55 L 75 70 L 90 55"
              fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      `;
      break;

    case 13: // Corner dots pattern
      const cornerDotCount = 4;
      for (let i = 0; i < cornerDotCount; i++) {
        for (let j = 0; j < cornerDotCount; j++) {
          if ((i === 0 || i === cornerDotCount - 1) && (j === 0 || j === cornerDotCount - 1)) {
            const x = 20 + j * 20;
            const y = 20 + i * 20;
            shapes += `<circle cx="${x}" cy="${y}" r="6" fill="${color}"/>`;
          }
        }
      }
      shapes += `<circle cx="50" cy="50" r="15" fill="${color}" opacity="0.4"/>`;
      break;

    case 14: // Orbital rings
      const ringCount = randomInt(random, 3, 4);
      for (let i = 0; i < ringCount; i++) {
        const radius = 12 + i * 12;
        const angle = (i * 120) * Math.PI / 180;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        shapes += `<circle cx="${x}" cy="${y}" r="6" fill="${color}" opacity="0.7"/>`;
        shapes += `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="3 3" opacity="0.3"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="8" fill="${color}"/>`;
      break;

    case 15: // Radial dashes
      const dashRayCount = randomInt(random, 8, 12);
      for (let i = 0; i < dashRayCount; i++) {
        const angle = (i * 360 / dashRayCount) * Math.PI / 180;
        const x1 = 50 + 20 * Math.cos(angle);
        const y1 = 50 + 20 * Math.sin(angle);
        const x2 = 50 + 40 * Math.cos(angle);
        const y2 = 50 + 40 * Math.sin(angle);
        shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="15" fill="${color}"/>`;
      break;

    case 16: // Layered squares
      for (let i = 0; i < 4; i++) {
        const size = 70 - i * 15;
        const offset = (100 - size) / 2;
        shapes += `<rect x="${offset}" y="${offset}" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" opacity="${0.8 - i * 0.15}"/>`;
      }
      break;

    case 17: // Diagonal stripes
      const stripeCount = randomInt(random, 5, 7);
      for (let i = 0; i < stripeCount; i++) {
        const x = 10 + i * 15;
        shapes += `<line x1="${x}" y1="10" x2="${x + 50}" y2="90" stroke="${color}" stroke-width="3" opacity="0.6"/>`;
      }
      break;

    case 18: // Constellation pattern
      const starCount2 = randomInt(random, 6, 9);
      const constellation = [];
      for (let i = 0; i < starCount2; i++) {
        const angle = (i * 360 / starCount2) * Math.PI / 180;
        const radius = randomInt(random, 20, 35);
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        constellation.push({ x, y });
        shapes += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
      }
      // Connect some stars with lines
      for (let i = 0; i < starCount2; i++) {
        const next = (i + 1) % starCount2;
        if (i % 2 === 0) {
          shapes += `<line x1="${constellation[i].x}" y1="${constellation[i].y}" x2="${constellation[next].x}" y2="${constellation[next].y}" stroke="${color}" stroke-width="1" opacity="0.4"/>`;
        }
      }
      shapes += `<circle cx="50" cy="50" r="4" fill="${color}"/>`;
      break;

    case 19: // Petal burst
      const petalBurstCount = randomInt(random, 8, 12);
      for (let i = 0; i < petalBurstCount; i++) {
        const angle = (i * 360 / petalBurstCount) * Math.PI / 180;
        const x = 50 + 30 * Math.cos(angle);
        const y = 50 + 30 * Math.sin(angle);
        shapes += `<ellipse cx="${x}" cy="${y}" rx="8" ry="15" fill="${color}" opacity="0.6" transform="rotate(${i * 360 / petalBurstCount} ${x} ${y})"/>`;
      }
      shapes += `<circle cx="50" cy="50" r="10" fill="${color}"/>`;
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
      return generatePatternSymbol(seed, color);
    default:
      throw new Error(`Unknown symbol mode: ${mode}`);
  }
}
