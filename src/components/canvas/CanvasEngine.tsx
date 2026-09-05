import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { BackgroundTemplate, DocumentData, EraserMode, NoteImage, NoteTextBlock, Point, Stroke, ToolType, ViewportTransform } from '../../types';
import { BackgroundRenderer } from './BackgroundRenderer';
import { doesEraserHitStroke } from '../../utils/bezier';
import { renderStrokeToContext } from '../../utils/inkEngine';
import { DocumentViewer } from './DocumentViewer';
import { ImageLayer } from './ImageLayer';
import { TextLayer, createTextBlock, createChecklistBlock } from './TextLayer';
import { TouchGestureManager } from './TouchGestureManager';

export interface CanvasEngineHandle {
  exportImage: (format?: 'image/png' | 'image/jpeg') => string;
  generateThumbnail: (width?: number, height?: number) => string;
  redrawAll: () => void;
  getDimensions: () => { width: number; height: number };
  addTextBlock: (type?: 'text' | 'checklist') => void;
  resetZoom: () => void;
  getZoom: () => number;
}

interface CanvasEngineProps {
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  currentTool: ToolType;
  currentColor: string;
  currentSize: number;
  eraserMode: EraserMode;
  backgroundTemplate: BackgroundTemplate;
  documentData?: DocumentData;
  onPageChange?: (newPage: number) => void;
  onNumPagesDiscovered?: (numPages: number) => void;
  images?: NoteImage[];
  onImagesChange?: (images: NoteImage[]) => void;
  textBlocks?: NoteTextBlock[];
  onTextBlocksChange?: (blocks: NoteTextBlock[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const CanvasEngine = forwardRef<CanvasEngineHandle, CanvasEngineProps>(
  (
    {
      strokes,
      onStrokesChange,
      currentTool,
      currentColor,
      currentSize,
      eraserMode,
      backgroundTemplate,
      documentData,
      onPageChange,
      onNumPagesDiscovered,
      images = [],
      onImagesChange,
      textBlocks = [],
      onTextBlocksChange,
      onUndo,
      onRedo,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const activeCanvasRef = useRef<HTMLCanvasElement>(null);

    // Estado mutable en refs para 60-120Hz
    const isDrawingRef = useRef(false);
    const activePointsRef = useRef<Point[]>([]);
    const currentStrokeRef = useRef<Stroke | null>(null);
    const strokesRef = useRef<Stroke[]>(strokes);

    // Transformación de Viewport (Zoom y Paneo)
    const [transform, setTransform] = useState<ViewportTransform>({ scale: 1, x: 0, y: 0 });
    const transformRef = useRef<ViewportTransform>(transform);
    transformRef.current = transform;

    // Gestor de gestos multitáctiles y rechazo de palma
    const gestureManagerRef = useRef<TouchGestureManager | null>(null);

    useEffect(() => {
      gestureManagerRef.current = new TouchGestureManager({
        onUndo: () => onUndo?.(),
        onRedo: () => onRedo?.(),
        onTransformChange: (newTransform) => {
          setTransform(newTransform);
        },
      });
    }, [onUndo, onRedo]);

    useEffect(() => {
      strokesRef.current = strokes;
    }, [strokes]);

    /**
     * Redibuja la capa principal de trazos
     */
    const redrawMainCanvas = useCallback(() => {
      const mainCanvas = mainCanvasRef.current;
      if (!mainCanvas) return;

      const ctx = mainCanvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = mainCanvas.width / dpr;
      const height = mainCanvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      for (const stroke of strokesRef.current) {
        renderStrokeToContext(ctx, stroke);
      }
    }, []);

    /**
     * Redibuja el fondo
     */
    const redrawBackground = useCallback(() => {
      const bgCanvas = bgCanvasRef.current;
      if (!bgCanvas) return;

      const ctx = bgCanvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = bgCanvas.width / dpr;
      const height = bgCanvas.height / dpr;

      BackgroundRenderer.render(ctx, width, height, backgroundTemplate);
    }, [backgroundTemplate]);

    /**
     * Ajuste de resolución
     */
    const setupCanvasResolutions = useCallback(() => {
      const container = containerRef.current;
      const bgCanvas = bgCanvasRef.current;
      const mainCanvas = mainCanvasRef.current;
      const activeCanvas = activeCanvasRef.current;

      if (!container || !bgCanvas || !mainCanvas || !activeCanvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width === 0 || height === 0) return;

      const canvases = [
        { canvas: bgCanvas, alpha: false },
        { canvas: mainCanvas, alpha: true },
        { canvas: activeCanvas, alpha: true },
      ];

      canvases.forEach(({ canvas, alpha }) => {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d', {
          alpha,
          desynchronized: true,
        });

        if (ctx) {
          ctx.resetTransform();
          ctx.scale(dpr, dpr);
        }
      });

      redrawBackground();
      redrawMainCanvas();
    }, [redrawBackground, redrawMainCanvas]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver(() => {
        setupCanvasResolutions();
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, [setupCanvasResolutions]);

    useEffect(() => {
      redrawBackground();
    }, [backgroundTemplate, redrawBackground]);

    useEffect(() => {
      redrawMainCanvas();
    }, [strokes, redrawMainCanvas]);

    /**
     * Doble clic / tap para crear bloque de texto rápido
     */
    const handleDoubleClick = (e: React.MouseEvent) => {
      if (!onTextBlocksChange) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = (e.clientX - rect.left - transform.x) / transform.scale;
      const clientY = (e.clientY - rect.top - transform.y) / transform.scale;

      const newBlock = createTextBlock(Math.round(clientX), Math.round(clientY), 280);
      onTextBlocksChange([...textBlocks, newBlock]);
    };

    /**
     * Métodos expuestos
     */
    useImperativeHandle(
      ref,
      () => ({
        getDimensions: () => {
          const container = containerRef.current;
          return {
            width: container ? container.clientWidth : 800,
            height: container ? container.clientHeight : 1000,
          };
        },
        getZoom: () => transform.scale,
        resetZoom: () => {
          const resetTrans = { scale: 1, x: 0, y: 0 };
          setTransform(resetTrans);
          gestureManagerRef.current?.setTransform(resetTrans);
        },
        addTextBlock: (type = 'text') => {
          if (!onTextBlocksChange) return;
          const container = containerRef.current;
          const w = container ? container.clientWidth / 2 - 140 : 150;
          const h = container ? container.clientHeight / 3 : 150;

          const block = type === 'checklist' ? createChecklistBlock(w, h) : createTextBlock(w, h);
          onTextBlocksChange([...textBlocks, block]);
        },
        exportImage: (format = 'image/png') => {
          const bgCanvas = bgCanvasRef.current;
          const mainCanvas = mainCanvasRef.current;
          if (!bgCanvas || !mainCanvas) return '';

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = mainCanvas.width;
          tempCanvas.height = mainCanvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return '';

          tempCtx.drawImage(bgCanvas, 0, 0);
          tempCtx.drawImage(mainCanvas, 0, 0);

          return tempCanvas.toDataURL(format, 0.95);
        },
        generateThumbnail: (thumbWidth = 320, thumbHeight = 220) => {
          const bgCanvas = bgCanvasRef.current;
          const mainCanvas = mainCanvasRef.current;
          if (!bgCanvas || !mainCanvas) return '';

          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbWidth;
          thumbCanvas.height = thumbHeight;
          const ctx = thumbCanvas.getContext('2d');
          if (!ctx) return '';

          ctx.fillStyle = '#FCFCFD';
          ctx.fillRect(0, 0, thumbWidth, thumbHeight);

          ctx.drawImage(bgCanvas, 0, 0, thumbWidth, thumbHeight);
          ctx.drawImage(mainCanvas, 0, 0, thumbWidth, thumbHeight);

          return thumbCanvas.toDataURL('image/jpeg', 0.75);
        },
        redrawAll: () => {
          redrawBackground();
          redrawMainCanvas();
        },
      }),
      [redrawBackground, redrawMainCanvas, textBlocks, onTextBlocksChange, transform]
    );

    /**
     * MANEJO DE EVENTOS TÁCTILES (Con Palm Rejection & Gestos)
     */
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // 1. Filtrar Palm Rejection
      if (gestureManagerRef.current?.shouldRejectPalm(e)) {
        return;
      }

      // 2. Comprobar si es un gesto multitáctil (2 o más dedos)
      const isMultiTouch = gestureManagerRef.current?.handlePointerDown(e);
      if (isMultiTouch) {
        return;
      }

      e.preventDefault();
      const canvas = activeCanvasRef.current;
      if (!canvas) return;

      canvas.setPointerCapture(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      // Ajustar coordenadas teniendo en cuenta el zoom y paneo
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;
      const pressure = e.pressure > 0 ? e.pressure : 0.5;
      const time = performance.now();

      isDrawingRef.current = true;
      const firstPoint: Point = { x, y, pressure, time };

      if (currentTool === 'eraser') {
        if (eraserMode === 'stroke') {
          const hitIdx = strokesRef.current.findIndex((s) =>
            doesEraserHitStroke({ x, y }, currentSize * 2.5, s)
          );
          if (hitIdx !== -1) {
            const updated = [...strokesRef.current];
            updated.splice(hitIdx, 1);
            strokesRef.current = updated;
            onStrokesChange(updated);
            redrawMainCanvas();
          }
        } else {
          activePointsRef.current = [firstPoint];
        }
        return;
      }

      const newStroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tool: currentTool,
        color: currentColor,
        size: currentSize,
        points: [firstPoint],
      };

      currentStrokeRef.current = newStroke;
      activePointsRef.current = [firstPoint];

      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderStrokeToContext(ctx, newStroke);
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // 1. Gestos multitáctiles (Pan & Pinch Zoom)
      const handledGesture = gestureManagerRef.current?.handlePointerMove(e);
      if (handledGesture) return;

      if (!isDrawingRef.current) return;
      if (gestureManagerRef.current?.shouldRejectPalm(e)) return;

      e.preventDefault();
      const canvas = activeCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // @ts-expect-error - getCoalescedEvents
      const rawEvents: PointerEvent[] = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e.nativeEvent];

      for (const ev of rawEvents) {
        const x = (ev.clientX - rect.left - transform.x) / transform.scale;
        const y = (ev.clientY - rect.top - transform.y) / transform.scale;
        const pressure = ev.pressure > 0 ? ev.pressure : 0.5;
        const time = performance.now();
        const newPoint: Point = { x, y, pressure, time };

        if (currentTool === 'eraser') {
          if (eraserMode === 'stroke') {
            const hitIdx = strokesRef.current.findIndex((s) =>
              doesEraserHitStroke({ x, y }, currentSize * 2.5, s)
            );
            if (hitIdx !== -1) {
              const updated = [...strokesRef.current];
              updated.splice(hitIdx, 1);
              strokesRef.current = updated;
              onStrokesChange(updated);
              redrawMainCanvas();
            }
          } else {
            const mainCtx = mainCanvasRef.current?.getContext('2d');
            if (mainCtx) {
              mainCtx.save();
              mainCtx.globalCompositeOperation = 'destination-out';
              mainCtx.beginPath();
              mainCtx.arc(x, y, currentSize * 2.5, 0, Math.PI * 2);
              mainCtx.fillStyle = 'rgba(0,0,0,1)';
              mainCtx.fill();
              mainCtx.restore();
            }
          }
          continue;
        }

        activePointsRef.current.push(newPoint);

        const currentActiveStroke: Stroke = {
          ...currentStrokeRef.current!,
          points: activePointsRef.current,
        };

        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        renderStrokeToContext(ctx, currentActiveStroke);
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      gestureManagerRef.current?.handlePointerUp(e);

      if (!isDrawingRef.current) return;
      e.preventDefault();

      const canvas = activeCanvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // Ignorar
        }
      }

      isDrawingRef.current = false;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        ctx?.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }

      if (currentTool !== 'eraser' && currentStrokeRef.current) {
        const completedStroke: Stroke = {
          ...currentStrokeRef.current,
          points: activePointsRef.current,
        };

        if (completedStroke.points.length > 0) {
          const updated = [...strokesRef.current, completedStroke];
          strokesRef.current = updated;
          onStrokesChange(updated);
          redrawMainCanvas();
        }
      }

      activePointsRef.current = [];
      currentStrokeRef.current = null;
    };

    return (
      <div
        ref={containerRef}
        onDoubleClick={handleDoubleClick}
        className="relative w-full h-full flex-1 overflow-hidden bg-[#FCFCFD] touch-canvas-area cursor-crosshair select-none"
      >
        {/* Contenedor transformable para Zoom y Paneo */}
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
          }}
        >
          {/* Capa 0: Fondo procedural estático */}
          <canvas
            ref={bgCanvasRef}
            className="absolute inset-0 pointer-events-none z-0"
          />

          {/* Capa 1: Capa de Documento */}
          <DocumentViewer
            documentData={documentData}
            onPageChange={onPageChange}
            onNumPagesDiscovered={onNumPagesDiscovered}
          />

          {/* Capa 2: Imágenes y Stickers */}
          {onImagesChange && (
            <ImageLayer
              images={images}
              onImagesChange={onImagesChange}
              isDrawing={isDrawingRef.current}
            />
          )}

          {/* Capa 3: Bloques de Texto y Checklists escolares */}
          {onTextBlocksChange && (
            <TextLayer
              textBlocks={textBlocks}
              onTextBlocksChange={onTextBlocksChange}
              isDrawing={isDrawingRef.current}
            />
          )}

          {/* Capa 4: Trazos confirmados */}
          <canvas
            ref={mainCanvasRef}
            className="absolute inset-0 pointer-events-none z-20"
          />

          {/* Capa 5: Trazo interactivo en tiempo real a 60 FPS */}
          <canvas
            ref={activeCanvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="absolute inset-0 z-25 touch-none"
          />
        </div>

        {/* Indicador de Zoom cuando es diferente de 1x */}
        {transform.scale !== 1 && (
          <div className="absolute bottom-4 left-4 bg-ios-card/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-ios-border text-xs font-semibold text-ios-text flex items-center gap-2 shadow-ios-sm z-30">
            <span>Zoom: {Math.round(transform.scale * 100)}%</span>
            <button
              onClick={() => {
                const resetTrans = { scale: 1, x: 0, y: 0 };
                setTransform(resetTrans);
                gestureManagerRef.current?.setTransform(resetTrans);
              }}
              className="text-[10px] text-ios-yellow hover:underline"
            >
              Reajustar
            </button>
          </div>
        )}
      </div>
    );
  }
);
