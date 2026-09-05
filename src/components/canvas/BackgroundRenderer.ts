import { BackgroundTemplate, ViewportTransform } from '../../types';

export interface BackgroundRenderOptions {
  transform?: ViewportTransform;
  isDark?: boolean;
  lineColor?: string;
  marginColor?: string;
  dotColor?: string;
  spacing?: number;
  marginTop?: number;
  marginLeft?: number;
}

/**
 * Generador procedural de fondos de alta fidelidad para el lienzo táctil infinito.
 * Utiliza matemáticas continuas con offset modular O(1) para 60 FPS sin consumo de memoria adicional.
 */
export class BackgroundRenderer {
  /**
   * Renderiza el fondo infinito sobre el contexto 2D proporcionado.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    template: BackgroundTemplate,
    options: BackgroundRenderOptions = {}
  ): void {
    const {
      transform = { scale: 1, x: 0, y: 0 },
      isDark = false,
      spacing = 32,
      marginTop = 60,
      marginLeft = 64,
    } = options;

    const lineColor = options.lineColor || (isDark ? '#2C2C2E' : '#E5E5EA');
    const marginColor = options.marginColor || (isDark ? 'rgba(255, 69, 58, 0.45)' : 'rgba(255, 105, 97, 0.35)');
    const dotColor = options.dotColor || (isDark ? '#3A3A3C' : '#C7C7CC');

    ctx.save();

    // 1. Fondo base: Blanco papel cálido en Modo Claro (#FCFCFD), Espacial profundo en Modo Oscuro (#121214)
    ctx.fillStyle = isDark ? '#121214' : '#FCFCFD';
    ctx.fillRect(0, 0, width, height);

    // 2. Renderizado procedural infinito según la plantilla
    switch (template) {
      case 'BLANK':
        // Fondo liso
        break;

      case 'RULED':
        this.renderRuledLines(ctx, width, height, spacing, marginTop, marginLeft, lineColor, marginColor, transform);
        break;

      case 'GRID':
        this.renderGrid(ctx, width, height, spacing, lineColor, transform);
        break;

      case 'DOTS':
        this.renderDots(ctx, width, height, spacing, dotColor, transform);
        break;
    }

    ctx.restore();
  }

  /**
   * Renderiza líneas horizontales tipo cuaderno escolar con offset modular infinito.
   */
  private static renderRuledLines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    _marginTop: number,
    marginLeft: number,
    lineColor: string,
    marginColor: string,
    transform: ViewportTransform
  ): void {
    const scale = transform.scale || 1;
    const panX = transform.x || 0;
    const panY = transform.y || 0;

    const lineSpacing = Math.max(16, spacing * scale);
    const startY = ((panY % lineSpacing) + lineSpacing) % lineSpacing;

    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    for (let y = startY; y <= height; y += lineSpacing) {
      const snapY = Math.floor(y) + 0.5;
      ctx.moveTo(0, snapY);
      ctx.lineTo(width, snapY);
    }
    ctx.stroke();

    // Línea de margen vertical roja (estilo cuaderno escolar)
    if (marginLeft > 0) {
      const marginScreenX = panX + marginLeft * scale;
      if (marginScreenX >= 0 && marginScreenX <= width) {
        ctx.beginPath();
        ctx.strokeStyle = marginColor;
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        const snapX = Math.floor(marginScreenX) + 0.5;
        ctx.moveTo(snapX, 0);
        ctx.lineTo(snapX, height);
        ctx.stroke();
      }
    }
  }

  /**
   * Renderiza una cuadrícula continua infinita de precisión matemática.
   */
  private static renderGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    lineColor: string,
    transform: ViewportTransform
  ): void {
    const scale = transform.scale || 1;
    const panX = transform.x || 0;
    const panY = transform.y || 0;

    const baseGridSize = Math.max(20, spacing * 0.75);
    const gridSpacing = Math.max(12, baseGridSize * scale);

    const startX = ((panX % gridSpacing) + gridSpacing) % gridSpacing;
    const startY = ((panY % gridSpacing) + gridSpacing) % gridSpacing;

    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    // Líneas verticales
    for (let x = startX; x <= width; x += gridSpacing) {
      const snapX = Math.floor(x) + 0.5;
      ctx.moveTo(snapX, 0);
      ctx.lineTo(snapX, height);
    }

    // Líneas horizontales
    for (let y = startY; y <= height; y += gridSpacing) {
      const snapY = Math.floor(y) + 0.5;
      ctx.moveTo(0, snapY);
      ctx.lineTo(width, snapY);
    }

    ctx.stroke();
  }

  /**
   * Renderiza una matriz de puntos infinita con offset modular (Bullet Journal).
   */
  private static renderDots(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    dotColor: string,
    transform: ViewportTransform
  ): void {
    const scale = transform.scale || 1;
    const panX = transform.x || 0;
    const panY = transform.y || 0;

    const baseDotSize = Math.max(20, spacing * 0.75);
    const dotSpacing = Math.max(12, baseDotSize * scale);

    const startX = ((panX % dotSpacing) + dotSpacing) % dotSpacing;
    const startY = ((panY % dotSpacing) + dotSpacing) % dotSpacing;

    ctx.fillStyle = dotColor;
    const dotRadius = Math.max(0.8, 1.2 * Math.min(1.5, Math.max(0.6, scale)));

    for (let x = startX; x <= width; x += dotSpacing) {
      for (let y = startY; y <= height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(Math.floor(x) + 0.5, Math.floor(y) + 0.5, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
