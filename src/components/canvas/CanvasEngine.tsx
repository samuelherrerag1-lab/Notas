import React, { useRef, useEffect, useState } from 'react';
import {
  BackgroundTemplate,
  DocumentData,
  NoteImage,
  NoteTextBlock,
  Point,
  Stroke,
  ToolType,
  ViewportTransform,
} from '../../types';
import { BackgroundRenderer } from './BackgroundRenderer';
import { DocumentViewer } from './DocumentViewer';
import { ImageLayer } from './ImageLayer';
import { TextLayer, createTextBlock } from './TextLayer';
import { TouchGestureManager } from './TouchGestureManager';
import { renderStrokeToContext } from '../../utils/inkEngine';
import { useTheme } from '../../context/ThemeContext';

interface CanvasEngineProps {
  currentTool: ToolType;
  currentColor: string;
  currentSize: number;
  backgroundTemplate: BackgroundTemplate;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  images?: NoteImage[];
  onImagesChange?: (images: NoteImage[]) => void;
  textBlocks?: NoteTextBlock[];
  onTextBlocksChange?: (blocks: NoteTextBlock[]) => void;
  document?: DocumentData;
  onDocumentChange?: (doc: DocumentData) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  viewportTransform?: ViewportTransform;
  onViewportTransformChange?: (transform: ViewportTransform) => void;
}

export const CanvasEngine: React.FC<CanvasEngineProps> = ({
  currentTool,
  currentColor,
  currentSize,
  backgroundTemplate,
  strokes,
  onStrokesChange,
  images = [],
  onImagesChange,
  textBlocks = [],
  onTextBlocksChange,
  document: noteDoc,
  onDocumentChange,
  onUndo,
  onRedo,
  viewportTransform = { scale: 1, x: 0, y: 0 },
  onViewportTransformChange,
}) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 1920, height: 1080 });

  const currentStrokePoints = useRef<Point[]>([]);
  const gestureManagerRef = useRef<TouchGestureManager | null>(null);

  // Inicializar Gestor Táctil
  useEffect(() => {
    gestureManagerRef.current = new TouchGestureManager({
      onUndo: () => onUndo?.(),
      onRedo: () => onRedo?.(),
      onTransformChange: (t) => onViewportTransformChange?.(t),
    });
  }, [onUndo, onRedo, onViewportTransformChange]);

  useEffect(() => {
    if (gestureManagerRef.current) {
      gestureManagerRef.current.setTransform(viewportTransform);
    }
  }, [viewportTransform]);

  // Redimensionar canvases según el contenedor
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      setContainerSize({
        width: Math.max(800, clientWidth),
        height: Math.max(600, clientHeight),
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 1. Renderizar Fondo Infinito nítido con Modulo Offset
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;

    const ctx = bgCanvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    bgCanvas.width = containerSize.width * dpr;
    bgCanvas.height = containerSize.height * dpr;
    ctx.scale(dpr, dpr);

    BackgroundRenderer.render(ctx, containerSize.width, containerSize.height, backgroundTemplate, {
      transform: viewportTransform,
      isDark,
    });
  }, [containerSize, backgroundTemplate, viewportTransform, isDark]);

  // 2. Renderizar trazos persistentes sobre el canvas principal
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const virtualWidth = 4000;
    const virtualHeight = 4000;

    if (canvas.width !== virtualWidth || canvas.height !== virtualHeight) {
      canvas.width = virtualWidth;
      canvas.height = virtualHeight;
    }

    ctx.clearRect(0, 0, virtualWidth, virtualHeight);

    strokes.forEach((stroke) => {
      renderStrokeToContext(ctx, stroke, isDark);
    });
  }, [strokes, isDark]);

  // 3. Manejo de rueda / trackpad para Zoom & Paneo Infinito fluido
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newScale = Math.min(5.0, Math.max(0.2, viewportTransform.scale * zoomFactor));

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = mouseX - (mouseX - viewportTransform.x) * (newScale / viewportTransform.scale);
        const newY = mouseY - (mouseY - viewportTransform.y) * (newScale / viewportTransform.scale);

        onViewportTransformChange?.({
          scale: Number(newScale.toFixed(3)),
          x: Math.round(newX),
          y: Math.round(newY),
        });
      } else {
        onViewportTransformChange?.({
          ...viewportTransform,
          x: Math.round(viewportTransform.x - e.deltaX),
          y: Math.round(viewportTransform.y - e.deltaY),
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [viewportTransform, onViewportTransformChange]);

  // 4. Doble clic para crear texto directamente en el lienzo infinito
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isDrawing || isEditingText) return;
    if (!containerRef.current || !onTextBlocksChange) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = Math.round((e.clientX - rect.left - viewportTransform.x) / viewportTransform.scale);
    const canvasY = Math.round((e.clientY - rect.top - viewportTransform.y) / viewportTransform.scale);

    const newBlock = createTextBlock(canvasX, canvasY);
    onTextBlocksChange([...textBlocks, newBlock]);
  };

  // 5. Interacción de Dibujo con Puntero / Stylus
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isEditingText) return;

    if (gestureManagerRef.current?.shouldRejectPalm(e)) {
      return;
    }

    if (gestureManagerRef.current?.handlePointerDown(e)) {
      return;
    }

    if (currentTool === 'text' || currentTool === 'checklist') {
      return;
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const canvasX = (e.clientX - rect.left - viewportTransform.x) / viewportTransform.scale;
    const canvasY = (e.clientY - rect.top - viewportTransform.y) / viewportTransform.scale;

    const pressure = e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5;
    currentStrokePoints.current = [
      {
        x: canvasX,
        y: canvasY,
        pressure,
        time: performance.now(),
      },
    ];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gestureManagerRef.current?.handlePointerMove(e)) {
      return;
    }

    if (!isDrawing || currentStrokePoints.current.length === 0) return;

    const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const canvasX = (e.clientX - rect.left - viewportTransform.x) / viewportTransform.scale;
    const canvasY = (e.clientY - rect.top - viewportTransform.y) / viewportTransform.scale;
    const pressure = e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5;

    const point: Point = {
      x: canvasX,
      y: canvasY,
      pressure,
      time: performance.now(),
    };

    currentStrokePoints.current.push(point);

    const activeCanvas = activeCanvasRef.current;
    if (activeCanvas) {
      const ctx = activeCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
        const tempStroke: Stroke = {
          id: 'temp',
          tool: currentTool,
          color: currentColor,
          size: currentSize,
          points: currentStrokePoints.current,
        };
        renderStrokeToContext(ctx, tempStroke, isDark);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gestureManagerRef.current?.handlePointerUp(e)) {
      setIsDrawing(false);
      return;
    }

    if (!isDrawing) return;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    setIsDrawing(false);

    const activeCanvas = activeCanvasRef.current;
    if (activeCanvas) {
      const ctx = activeCanvas.getContext('2d');
      ctx?.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    }

    if (currentStrokePoints.current.length > 0) {
      const newStroke: Stroke = {
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tool: currentTool,
        color: currentColor,
        size: currentSize,
        points: [...currentStrokePoints.current],
      };

      onStrokesChange([...strokes, newStroke]);
      currentStrokePoints.current = [];
    }
  };

  return (
    <div
      ref={containerRef}
      onDoubleClick={handleDoubleClick}
      className="relative w-full h-full overflow-hidden select-none bg-ios-paper dark:bg-ios-darkBg cursor-crosshair touch-none"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {/* 1. Fondo Procedural Infinito */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
        }}
      />

      {/* 2. Capas Espaciales con Transformación Infinito de Paneo & Zoom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `matrix(${viewportTransform.scale}, 0, 0, ${viewportTransform.scale}, ${viewportTransform.x}, ${viewportTransform.y})`,
          transformOrigin: '0 0',
          width: '4000px',
          height: '4000px',
        }}
      >
        {/* Capa de Documentos (PDF, DOCX, XLSX) */}
        {noteDoc && noteDoc.type !== 'none' && (
          <div className="absolute inset-0 z-10 pointer-events-auto">
            <DocumentViewer
              documentData={noteDoc}
              onPageChange={(p) => {
                if (onDocumentChange) {
                  onDocumentChange({ ...noteDoc, currentPage: p });
                }
              }}
              onNumPagesDiscovered={(n) => {
                if (onDocumentChange) {
                  onDocumentChange({ ...noteDoc, numPages: n });
                }
              }}
            />
          </div>
        )}

        {/* Capa de Imágenes con Gizmo de Transformación */}
        {onImagesChange && (
          <ImageLayer
            images={images}
            onImagesChange={onImagesChange}
            scale={viewportTransform.scale}
            isDrawing={isDrawing}
          />
        )}

        {/* Capa de Texto y Checklists Mecanografiadas Integradas */}
        {onTextBlocksChange && (
          <TextLayer
            textBlocks={textBlocks}
            onTextBlocksChange={onTextBlocksChange}
            scale={viewportTransform.scale}
            isDrawing={isDrawing}
            onEditingStateChange={setIsEditingText}
          />
        )}

        {/* Canvas de Trazos Persistentes */}
        <canvas
          ref={mainCanvasRef}
          width={4000}
          height={4000}
          className="absolute inset-0 pointer-events-none z-15"
        />

        {/* Canvas de Trazo Activo (Baja Latencia 60 FPS) */}
        <canvas
          ref={activeCanvasRef}
          width={4000}
          height={4000}
          className="absolute inset-0 pointer-events-none z-25"
        />
      </div>

      {/* Capa invisible receptora de eventos táctiles y de ratón */}
      <canvas
        className="absolute inset-0 z-20 touch-none pointer-events-auto cursor-crosshair opacity-0"
        width={containerSize.width}
        height={containerSize.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
};
