/**
 * Shape primitive generators for creating professional geometric forms
 * All shapes designed to work within a 100x100 viewbox with safe margins
 */

import { constrain } from './designPrinciples';

const VIEWBOX_SIZE = 100;
const SAFE_MARGIN = 7; // Increased to prevent cutoff with rotation

/**
 * Generate a regular polygon
 */
export function generatePolygon(
  sides: number,
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number = 0
): string {
  const points: string[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = ((i * 360 / sides) + rotation - 90) * Math.PI / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return points.join(' ');
}

/**
 * Generate a star shape
 */
export function generateStar(
  points: number,
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number = 0
): string {
  const vertices: string[] = [];

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = ((i * 180 / points) + rotation - 90) * Math.PI / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    vertices.push(`${x},${y}`);
  }

  return vertices.join(' ');
}

/**
 * Generate an organic blob shape using bezier curves
 */
export function generateOrganicShape(
  centerX: number,
  centerY: number,
  baseRadius: number,
  complexity: number,
  random: () => number,
  rotation: number = 0
): string {
  // Number of points for the organic shape
  const pointCount = Math.floor(4 + complexity * 4); // 4-8 points
  const points: Array<{ x: number; y: number }> = [];

  // Generate points with some randomness
  for (let i = 0; i < pointCount; i++) {
    const angle = ((i * 360 / pointCount) + rotation) * Math.PI / 180;
    const radiusVariation = 1 + (random() - 0.5) * complexity * 0.4;
    const radius = baseRadius * radiusVariation;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y });
  }

  // Create smooth bezier path
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < pointCount; i++) {
    const current = points[i];
    const next = points[(i + 1) % pointCount];

    // Control points for smooth curves
    const cp1x = current.x + (next.x - current.x) * 0.5;
    const cp1y = current.y;
    const cp2x = current.x + (next.x - current.x) * 0.5;
    const cp2y = next.y;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  return path;
}

/**
 * Generate a smooth arc path
 */
export function generateArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  clockwise: boolean = true
): string {
  const start = startAngle * Math.PI / 180;
  const end = endAngle * Math.PI / 180;

  const x1 = centerX + radius * Math.cos(start);
  const y1 = centerY + radius * Math.sin(start);
  const x2 = centerX + radius * Math.cos(end);
  const y2 = centerY + radius * Math.sin(end);

  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweep = clockwise ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

/**
 * Generate a wave path
 */
export function generateWave(
  startX: number,
  startY: number,
  endX: number,
  amplitude: number,
  frequency: number,
  segments: number = 20
): string {
  const points: Array<{ x: number; y: number }> = [];
  const length = endX - startX;
  const segmentLength = length / segments;

  for (let i = 0; i <= segments; i++) {
    const x = startX + i * segmentLength;
    const progress = i / segments;
    const y = startY + Math.sin(progress * frequency * Math.PI * 2) * amplitude;
    points.push({ x, y });
  }

  // Create smooth path through points
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const cpx = prev.x + (current.x - prev.x) / 2;
    path += ` Q ${cpx} ${prev.y}, ${current.x} ${current.y}`;
  }

  return path;
}

/**
 * Generate a rounded rectangle
 */
export function generateRoundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number,
  rotation: number = 0
): { path: string; transform: string } {
  const r = Math.min(cornerRadius, width / 2, height / 2);

  const path = `
    M ${x + r} ${y}
    L ${x + width - r} ${y}
    Q ${x + width} ${y}, ${x + width} ${y + r}
    L ${x + width} ${y + height - r}
    Q ${x + width} ${y + height}, ${x + width - r} ${y + height}
    L ${x + r} ${y + height}
    Q ${x} ${y + height}, ${x} ${y + height - r}
    L ${x} ${y + r}
    Q ${x} ${y}, ${x + r} ${y}
    Z
  `.trim().replace(/\s+/g, ' ');

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const transform = rotation !== 0 ? `rotate(${rotation} ${centerX} ${centerY})` : '';

  return { path, transform };
}

/**
 * Generate a teardrop/droplet shape
 */
export function generateTeardrop(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotation: number = 0
): string {
  const topY = centerY - height / 2;
  const bottomY = centerY + height / 2;
  const leftX = centerX - width / 2;
  const rightX = centerX + width / 2;

  // SVG path for teardrop: rounded bottom, pointed top
  const path = `
    M ${centerX} ${topY}
    Q ${rightX} ${centerY - height/4}, ${rightX} ${centerY}
    Q ${rightX} ${bottomY - height/4}, ${centerX} ${bottomY}
    Q ${leftX} ${bottomY - height/4}, ${leftX} ${centerY}
    Q ${leftX} ${centerY - height/4}, ${centerX} ${topY}
    Z
  `.trim().replace(/\s+/g, ' ');

  if (rotation !== 0) {
    return `<path d="${path}" transform="rotate(${rotation} ${centerX} ${centerY})"/>`;
  }

  return path;
}

/**
 * Generate a crescent/moon shape
 */
export function generateCrescent(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  _rotation: number = 0
): string {
  // Outer circle center
  const outerCX = centerX;
  const outerCY = centerY;

  // Inner circle offset to create crescent
  const innerCX = centerX + outerRadius * 0.3;
  const innerCY = centerY;

  // This creates the crescent by subtracting one circle from another
  // In SVG, we'll use two circles and mask (but for simplicity, just visual description)
  return `
    <defs>
      <mask id="crescent-mask-${Math.random()}">
        <circle cx="${outerCX}" cy="${outerCY}" r="${outerRadius}" fill="white"/>
        <circle cx="${innerCX}" cy="${innerCY}" r="${innerRadius}" fill="black"/>
      </mask>
    </defs>
  `;
}

/**
 * Generate a diamond shape
 */
export function generateDiamond(
  centerX: number,
  centerY: number,
  size: number,
  _rotation: number = 0
): string {
  const halfSize = size / 2;
  const points = [
    `${centerX},${centerY - halfSize}`,  // top
    `${centerX + halfSize},${centerY}`,  // right
    `${centerX},${centerY + halfSize}`,  // bottom
    `${centerX - halfSize},${centerY}`   // left
  ];

  return points.join(' ');
}

/**
 * Generate a cross/plus shape
 */
export function generateCross(
  centerX: number,
  centerY: number,
  size: number,
  thickness: number,
  rotation: number = 0
): string {
  const halfSize = size / 2;
  const halfThick = thickness / 2;

  // Two rectangles forming a cross
  const rect1 = `M ${centerX - halfThick} ${centerY - halfSize} L ${centerX + halfThick} ${centerY - halfSize} L ${centerX + halfThick} ${centerY + halfSize} L ${centerX - halfThick} ${centerY + halfSize} Z`;
  const rect2 = `M ${centerX - halfSize} ${centerY - halfThick} L ${centerX + halfSize} ${centerY - halfThick} L ${centerX + halfSize} ${centerY + halfThick} L ${centerX - halfSize} ${centerY + halfThick} Z`;

  if (rotation !== 0) {
    return `<g transform="rotate(${rotation} ${centerX} ${centerY})">\n<path d="${rect1}"/>\n<path d="${rect2}"/>\n</g>`;
  }

  return `${rect1} ${rect2}`;
}

/**
 * Generate a hexagon (convenience function for 6-sided polygon)
 */
export function generateHexagon(
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number = 0
): string {
  return generatePolygon(6, centerX, centerY, radius, rotation);
}

/**
 * Generate a triangle (convenience function for 3-sided polygon)
 */
export function generateTriangle(
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number = 0
): string {
  return generatePolygon(3, centerX, centerY, radius, rotation);
}

/**
 * Generate a pentagon (convenience function for 5-sided polygon)
 */
export function generatePentagon(
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number = 0
): string {
  return generatePolygon(5, centerX, centerY, radius, rotation);
}

/**
 * Constrain radius to fit within viewbox with safe margins
 */
export function constrainRadius(
  centerX: number,
  centerY: number,
  radius: number,
  strokeWidth: number = 0
): number {
  const maxRadius = Math.min(
    centerX - SAFE_MARGIN,
    centerY - SAFE_MARGIN,
    VIEWBOX_SIZE - centerX - SAFE_MARGIN,
    VIEWBOX_SIZE - centerY - SAFE_MARGIN
  ) - strokeWidth / 2;

  return Math.min(radius, Math.max(maxRadius, 1));
}

/**
 * Ensure a shape fits within the viewbox
 */
export function constrainToViewbox(x: number, y: number, size: number): { x: number; y: number; size: number } {
  const minPos = SAFE_MARGIN;
  const maxPos = VIEWBOX_SIZE - SAFE_MARGIN;

  // Constrain size first
  const constrainedSize = Math.min(size, (maxPos - minPos));

  // Then constrain position
  const halfSize = constrainedSize / 2;
  const constrainedX = constrain(x, minPos + halfSize, maxPos - halfSize);
  const constrainedY = constrain(y, minPos + halfSize, maxPos - halfSize);

  return { x: constrainedX, y: constrainedY, size: constrainedSize };
}
