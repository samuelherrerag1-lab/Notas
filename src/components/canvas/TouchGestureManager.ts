import { ViewportTransform } from '../../types';

export interface GestureCallbacks {
  onUndo: () => void;
  onRedo: () => void;
  onTransformChange: (transform: ViewportTransform) => void;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  time: number;
}

/**
 * Gestor avanzado de rechazo de palma (Palm Rejection) y gestos táctiles multitouch
 * diseñado para Chromebooks escolares y tablets táctiles.
 */
export class TouchGestureManager {
  private activeTouches = new Map<number, TouchPoint>();
  private lastPenActiveTime = 0;
  private isGesturing = false;
  private initialPinchDistance = 0;
  private initialTransform: ViewportTransform = { scale: 1, x: 0, y: 0 };
  private currentTransform: ViewportTransform = { scale: 1, x: 0, y: 0 };

  private callbacks: GestureCallbacks;

  constructor(callbacks: GestureCallbacks) {
    this.callbacks = callbacks;
  }

  public setTransform(transform: ViewportTransform) {
    this.currentTransform = { ...transform };
  }

  public getTransform(): ViewportTransform {
    return { ...this.currentTransform };
  }

  /**
   * Determina si un evento de puntero debe ser descartado como palma accidental.
   */
  public shouldRejectPalm(e: React.PointerEvent | PointerEvent): boolean {
    // 1. Si es Stylus, actualizar marca de tiempo de uso activo
    if (e.pointerType === 'pen') {
      this.lastPenActiveTime = performance.now();
      return false;
    }

    // 2. Si el usuario está usando o acaba de usar stylus hace menos de 1000ms,
    // descartar toques con el dedo/mano que intenten dibujar
    const timeSincePen = performance.now() - this.lastPenActiveTime;
    if (timeSincePen < 1000 && e.pointerType === 'touch') {
      return true;
    }

    // 3. Filtrar por área de contacto (la palma de la mano tiene una huella grande > 25px)
    if (e.width > 26 || e.height > 26) {
      return true;
    }

    // 4. Filtrar eventos de baja presión o contacto plano si están disponibles
    if (e.pointerType === 'touch' && e.pressure > 0.95 && (e.width > 20 || e.height > 20)) {
      return true;
    }

    return false;
  }

  /**
   * Registra el inicio de un punto táctil para gestos
   */
  public handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>): boolean {
    if (e.pointerType !== 'touch') return false;

    const touch: TouchPoint = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      time: performance.now(),
    };

    this.activeTouches.set(e.pointerId, touch);

    if (this.activeTouches.size === 2) {
      this.isGesturing = true;
      const [t1, t2] = Array.from(this.activeTouches.values());
      this.initialPinchDistance = Math.hypot(t2.x - t1.x, t2.y - t1.y);
      this.initialTransform = { ...this.currentTransform };
      return true;
    }

    return this.activeTouches.size > 1;
  }

  /**
   * Procesa movimiento multitáctil (Pinch to Zoom y Pan con 2 dedos)
   */
  public handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>): boolean {
    if (e.pointerType !== 'touch' || !this.activeTouches.has(e.pointerId)) {
      return false;
    }

    const touch = this.activeTouches.get(e.pointerId)!;
    touch.x = e.clientX;
    touch.y = e.clientY;

    if (this.activeTouches.size === 2) {
      const [t1, t2] = Array.from(this.activeTouches.values());
      const currentDistance = Math.hypot(t2.x - t1.x, t2.y - t1.y);

      // Calcular Zoom
      if (this.initialPinchDistance > 10) {
        const scaleFactor = currentDistance / this.initialPinchDistance;
        const newScale = Math.min(5.0, Math.max(0.2, this.initialTransform.scale * scaleFactor));

        // Calcular Paneo
        const currentMidX = (t1.x + t2.x) / 2;
        const currentMidY = (t1.y + t2.y) / 2;
        const initialMidX = (t1.startX + t2.startX) / 2;
        const initialMidY = (t1.startY + t2.startY) / 2;

        const deltaX = currentMidX - initialMidX;
        const deltaY = currentMidY - initialMidY;

        this.currentTransform = {
          scale: Number(newScale.toFixed(3)),
          x: Math.round(this.initialTransform.x + deltaX),
          y: Math.round(this.initialTransform.y + deltaY),
        };

        this.callbacks.onTransformChange(this.currentTransform);
      }
      return true;
    }

    return this.isGesturing;
  }

  /**
   * Finaliza el gesto y detecta taps rápidos de 2 dedos (Undo) y 3 dedos (Redo)
   */
  public handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>): boolean {
    if (e.pointerType !== 'touch') return false;

    const touch = this.activeTouches.get(e.pointerId);
    const touchCount = this.activeTouches.size;

    if (touch) {
      const duration = performance.now() - touch.time;
      const distance = Math.hypot(touch.x - touch.startX, touch.y - touch.startY);

      // Si fue un tap rápido de 2 dedos sin desplazamiento apreciable
      if (touchCount === 2 && duration < 300 && distance < 20) {
        this.callbacks.onUndo();
      } else if (touchCount === 3 && duration < 350 && distance < 25) {
        // Tap de 3 dedos -> Redo
        this.callbacks.onRedo();
      }
    }

    this.activeTouches.delete(e.pointerId);

    if (this.activeTouches.size === 0) {
      this.isGesturing = false;
    }

    return this.isGesturing;
  }

  public reset(): void {
    this.activeTouches.clear();
    this.isGesturing = false;
  }
}
