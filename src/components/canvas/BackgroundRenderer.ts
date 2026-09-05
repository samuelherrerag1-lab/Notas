import { BackgroundTemplate } from '../../types';

export interface BackgroundRenderOptions {
  lineColor?: string;
  marginColor?: string;
  dotColor?: string;
  spacing?: number;
  marginTop?: number;
  marginLeft?: number;
}

/**
 * Generador procedural de fondos de alta fidelidad para el lienzo táctil.
 * Diseñado para renderizado a 60 FPS sin consumo innecesario de memoria.
 */
export class BackgroundRenderer {
  /**
   * Renderiza el fondo seleccionado sobre el contexto 2D proporcionado.
   * Se asegura de respetar la escala de píxeles del dispositivo (DPR) para nitidez absoluta.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    template: BackgroundTemplate,
    options: BackgroundRenderOptions = {}
  ): void {
    const {
      lineColor = '#E5E5EA',
      marginColor = 'rgba(255, 105, 97, 0.35)', // Línea de margen roja tenue tipo cuaderno
      dotColor = '#C7C7CC',
      spacing = 32,
      marginTop = 60,
      marginLeft = 64,
    } = options;

    ctx.save();

    // 1. Fondo base blanco papel limpio con tinte cálido sutil tipo Apple Notes
    ctx.fillStyle = '#FCFCFD';
    ctx.fillRect(0, 0, width, height);

    // 2. Renderizado procedural según la plantilla
    switch (template) {
      case 'BLANK':
        // Fondo liso completado
        break;

      case 'RULED':
        this.renderRuledLines(ctx, width, height, spacing, marginTop, marginLeft, lineColor, marginColor);
        break;

      case 'GRID':
        this.renderGrid(ctx, width, height, spacing, lineColor);
        break;

      case 'DOTS':
        this.renderDots(ctx, width, height, spacing, dotColor);
        break;
    }

    ctx.restore();
  }

  /**
   * Renderiza líneas horizontales tipo cuaderno escolar / moleskine.
   */
  private static renderRuledLines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    marginTop: number,
    marginLeft: number,
    lineColor: string,
    marginColor: string
  ): void {
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    // Dibujar líneas horizontales con snap de píxel (0.5) para nitidez en pantallas de cualquier densidad
    for (let y = marginTop; y < height; y += spacing) {
      const snapY = Math.floor(y) + 0.5;
      ctx.moveTo(0, snapY);
      ctx.lineTo(width, snapY);
    }
    ctx.stroke();

    // Línea de margen vertical izquierda sutil (estilo cuaderno)
    if (marginLeft > 0 && width > 300) {
      ctx.beginPath();
      ctx.strokeStyle = marginColor;
      ctx.lineWidth = 1.5;
      const snapX = Math.floor(marginLeft) + 0.5;
      ctx.moveTo(snapX, 0);
      ctx.lineTo(snapX, height);
      ctx.stroke();
    }
  }

  /**
   * Renderiza una cuadrícula de precisión sutil.
   */
  private static renderGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    lineColor: string
  ): void {
    const gridSpacing = Math.max(20, spacing * 0.75); // Cuadrícula de 24px
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;

    // Líneas verticales
    for (let x = gridSpacing; x < width; x += gridSpacing) {
      const snapX = Math.floor(x) + 0.5;
      ctx.moveTo(snapX, 0);
      ctx.lineTo(snapX, height);
    }

    // Líneas horizontales
    for (let y = gridSpacing; y < height; y += gridSpacing) {
      const snapY = Math.floor(y) + 0.5;
      ctx.moveTo(0, snapY);
      ctx.lineTo(width, snapY);
    }

    ctx.stroke();
  }

  /**
   * Renderiza una matriz de puntos uniformemente espaciados (Bullet Journal).
   */
  private static renderDots(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    dotColor: string
  ): void {
    const dotSpacing = Math.max(20, spacing * 0.75);
    ctx.fillStyle = dotColor;

    const dotRadius = 1.2;
    const startOffset = dotSpacing;

    for (let x = startOffset; x < width; x += dotSpacing) {
      for (let y = startOffset; y < height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(Math.floor(x) + 0.5, Math.floor(y) + 0.5, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
