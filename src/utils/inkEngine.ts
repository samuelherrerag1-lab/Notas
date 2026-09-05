import { getStroke, StrokeOptions } from 'perfect-freehand';
import { Stroke, ToolType } from '../types';

/**
 * Configuraciones de trazo personalizadas por herramienta para perfect-freehand.
 * Recrea la física y respuesta táctil del Apple Pencil en iPadOS.
 */
export function getStrokeOptionsForTool(tool: ToolType, size: number): StrokeOptions {
  switch (tool) {
    case 'pen':
      return {
        size: Math.max(2, size),
        thinning: 0.55,
        smoothing: 0.55,
        streamline: 0.5,
        easing: (t) => Math.sin((t * Math.PI) / 2),
        start: {
          taper: Math.max(2, size * 0.6),
          cap: true,
        },
        end: {
          taper: Math.max(2, size * 0.8),
          cap: true,
        },
      };

    case 'pencil':
      return {
        size: Math.max(1.5, size * 0.85),
        thinning: 0.35,
        smoothing: 0.45,
        streamline: 0.4,
        start: {
          taper: Math.max(1, size * 0.3),
          cap: true,
        },
        end: {
          taper: Math.max(1, size * 0.4),
          cap: true,
        },
      };

    case 'highlighter':
      return {
        size: Math.max(12, size * 3.2),
        thinning: 0, // Ancho constante tipo marcador biselado
        smoothing: 0.75,
        streamline: 0.6,
        start: { cap: true },
        end: { cap: true },
      };

    case 'eraser':
    default:
      return {
        size: Math.max(10, size * 2.5),
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.5,
        start: { cap: true },
        end: { cap: true },
      };
  }
}

/**
 * Renderiza un trazo vectorial calculado con perfect-freehand sobre el contexto Canvas 2D.
 */
export function renderStrokeToContext(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  isDark = false
): void {
  const { points, tool, size } = stroke;
  let color = stroke.color;

  // Inversión cromática inteligente en Modo Oscuro:
  // Tinta negra/oscura original -> Blanco perla legible en fondo oscuro
  if (isDark) {
    const lowerColor = (color || '').toLowerCase();
    if (lowerColor === '#1c1c1e' || lowerColor === '#000000' || lowerColor === 'black' || lowerColor === '#000') {
      color = '#F2F2F7';
    }
  }

  if (!points || points.length === 0) return;

  // Formatear puntos para perfect-freehand: [x, y, pressure]
  const inputPoints = points.map((p) => [p.x, p.y, Math.max(0.1, p.pressure || 0.5)]);

  // Si solo hay un punto (un toque / tap aislado)
  if (inputPoints.length === 1) {
    ctx.save();
    ctx.fillStyle = color;
    if (tool === 'highlighter') {
      ctx.globalCompositeOperation = isDark ? 'source-over' : 'multiply';
      ctx.globalAlpha = isDark ? 0.35 : 0.4;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, (size * 3.2) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = isDark ? 0.85 : 0.75;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, (size * 0.85) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, (size * 2.5) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  const options = getStrokeOptionsForTool(tool, size);
  const outline = getStroke(inputPoints, options);

  if (outline.length === 0) return;

  ctx.save();

  // Configurar modos de composición y opacidad según la herramienta y tema
  if (tool === 'highlighter') {
    ctx.globalCompositeOperation = isDark ? 'source-over' : 'multiply';
    ctx.globalAlpha = isDark ? 0.35 : 0.4;
    ctx.fillStyle = color;
  } else if (tool === 'pencil') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = isDark ? 0.85 : 0.78;
    ctx.fillStyle = color;
  } else if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = color;
  }

  // Dibujar polígono vectorial cerrado
  ctx.beginPath();
  ctx.moveTo(outline[0][0], outline[0][1]);

  for (let i = 1; i < outline.length; i++) {
    ctx.lineTo(outline[i][0], outline[i][1]);
  }

  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Genera un SVG path string a partir de los puntos del trazo con perfect-freehand.
 */
export function getSvgPathFromStroke(stroke: Stroke): string {
  if (!stroke.points || stroke.points.length === 0) return '';
  const inputPoints = stroke.points.map((p) => [p.x, p.y, p.pressure || 0.5]);
  const options = getStrokeOptionsForTool(stroke.tool, stroke.size);
  const strokeOutline = getStroke(inputPoints, options);

  if (strokeOutline.length === 0) return '';

  const d = strokeOutline.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...strokeOutline[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}
