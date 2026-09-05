import { Point, Stroke } from '../types';

/**
 * Calcula la distancia euclidiana entre dos puntos.
 */
export function distanceBetween(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula el punto medio entre dos coordenadas.
 */
export function getMidPoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    pressure: (p1.pressure + p2.pressure) / 2,
    time: (p1.time + p2.time) / 2,
  };
}

/**
 * Calcula el ancho dinámico del trazo modulado por presión y velocidad.
 * Proporciona el "feeling" orgánico característico de la pluma de Apple Notes.
 */
export function calculateDynamicLineWidth(
  p1: Point,
  p2: Point,
  baseSize: number,
  tool: 'pen' | 'highlighter' | 'eraser'
): number {
  if (tool === 'eraser') return baseSize;
  if (tool === 'highlighter') return baseSize * 2.5;

  const dist = distanceBetween(p1, p2);
  const timeDiff = Math.max(1, p2.time - p1.time);
  const velocity = dist / timeDiff; // px / ms

  // Si hay presión de stylus activa (valor entre 0.01 y 1)
  const hasPressure = p2.pressure > 0.05 && p2.pressure < 0.99;
  const pressureFactor = hasPressure ? Math.max(0.3, p2.pressure * 1.5) : 1;

  // Factor de velocidad: trazos más rápidos son ligeramente más delgados
  // trazos lentos y deliberados son ligeramente más gruesos
  const velocityClamp = Math.min(Math.max(velocity, 0.1), 3.0);
  const velocityFactor = 1.25 - (velocityClamp * 0.2);

  const dynamicWidth = baseSize * pressureFactor * velocityFactor;
  // Limitar para evitar saltos bruscos
  return Math.max(baseSize * 0.4, Math.min(baseSize * 2.2, dynamicWidth));
}

/**
 * Verifica si un punto está dentro del radio de influencia de un segmento de línea.
 * Usado para el modo de borrado de trazo completo (Stroke Eraser).
 */
export function isPointNearSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return distanceBetween({ x: px, y: py }, { x: x1, y: y1 }) <= threshold;
  }

  // Proyección escalar sobre el segmento
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return distanceBetween({ x: px, y: py }, { x: projX, y: projY }) <= threshold;
}

/**
 * Determina si el borrador intersecta con algún punto de un trazo existente.
 */
export function doesEraserHitStroke(
  eraserPoint: { x: number; y: number },
  eraserRadius: number,
  stroke: Stroke
): boolean {
  if (stroke.points.length === 0) return false;
  if (stroke.points.length === 1) {
    return distanceBetween(eraserPoint, stroke.points[0]) <= (eraserRadius + stroke.size / 2);
  }

  const threshold = eraserRadius + (stroke.size / 2);

  for (let i = 0; i < stroke.points.length - 1; i++) {
    const p1 = stroke.points[i];
    const p2 = stroke.points[i + 1];
    if (isPointNearSegment(eraserPoint.x, eraserPoint.y, p1.x, p1.y, p2.x, p2.y, threshold)) {
      return true;
    }
  }

  return false;
}
