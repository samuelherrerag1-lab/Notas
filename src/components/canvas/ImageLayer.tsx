import React, { useState, useRef } from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  Move,
  RotateCcw,
} from 'lucide-react';
import { NoteImage } from '../../types';

interface ImageLayerProps {
  images: NoteImage[];
  onImagesChange: (images: NoteImage[]) => void;
  scale?: number;
  isDrawing: boolean;
}

type HandleType = 'nw' | 'ne' | 'se' | 'sw' | 'rotate' | 'move';

export const ImageLayer: React.FC<ImageLayerProps> = ({
  images,
  onImagesChange,
  scale = 1,
  isDrawing,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dragRef = useRef<{
    imageId: string;
    handle: HandleType;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  if (!images || images.length === 0) return null;

  const handlePointerDown = (
    e: React.PointerEvent,
    image: NoteImage,
    handle: HandleType
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setSelectedId(image.id);

    dragRef.current = {
      imageId: image.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: image.x,
      initialY: image.y,
      initialWidth: image.width,
      initialHeight: image.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const {
      imageId,
      handle,
      startX,
      startY,
      initialX,
      initialY,
      initialWidth,
      initialHeight,
    } = dragRef.current;

    const currentImage = images.find((img) => img.id === imageId);
    if (!currentImage) return;

    const deltaX = (e.clientX - startX) / (scale || 1);
    const deltaY = (e.clientY - startY) / (scale || 1);

    if (handle === 'move') {
      const updated = images.map((img) => {
        if (img.id !== imageId) return img;
        return {
          ...img,
          x: Math.round(initialX + deltaX),
          y: Math.round(initialY + deltaY),
        };
      });
      onImagesChange(updated);
      return;
    }

    if (handle === 'rotate') {
      const mouseScreenX = e.clientX;
      const mouseScreenY = e.clientY;
      const angleRad = Math.atan2(
        mouseScreenY - (startY - 40 * (scale || 1) + 40),
        mouseScreenX - startX
      );
      const angleDeg = Math.round(angleRad * (180 / Math.PI) + 90);
      const normalizedAngle = ((angleDeg % 360) + 360) % 360;

      const updated = images.map((img) => {
        if (img.id !== imageId) return img;
        return {
          ...img,
          rotation: normalizedAngle,
        };
      });
      onImagesChange(updated);
      return;
    }

    // Handles de cambio de tamaño (esquinas)
    const aspectRatio = currentImage.aspectRatio || (initialWidth / initialHeight);
    let newWidth = initialWidth;
    let newHeight = initialHeight;
    let newX = initialX;
    let newY = initialY;

    if (handle === 'se') {
      newWidth = Math.max(60, initialWidth + deltaX);
      newHeight = Math.max(60, newWidth / aspectRatio);
    } else if (handle === 'sw') {
      newWidth = Math.max(60, initialWidth - deltaX);
      newHeight = Math.max(60, newWidth / aspectRatio);
      newX = initialX + (initialWidth - newWidth);
    } else if (handle === 'ne') {
      newWidth = Math.max(60, initialWidth + deltaX);
      newHeight = Math.max(60, newWidth / aspectRatio);
      newY = initialY + (initialHeight - newHeight);
    } else if (handle === 'nw') {
      newWidth = Math.max(60, initialWidth - deltaX);
      newHeight = Math.max(60, newWidth / aspectRatio);
      newX = initialX + (initialWidth - newWidth);
      newY = initialY + (initialHeight - newHeight);
    }

    const updated = images.map((img) => {
      if (img.id !== imageId) return img;
      return {
        ...img,
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      };
    });
    onImagesChange(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragRef.current = null;
  };

  const handleRotate90 = (imageId: string) => {
    const updated = images.map((img) => {
      if (img.id !== imageId) return img;
      return {
        ...img,
        rotation: (((img.rotation || 0) + 90) % 360),
      };
    });
    onImagesChange(updated);
  };

  const handleResetTransform = (imageId: string) => {
    const updated = images.map((img) => {
      if (img.id !== imageId) return img;
      return {
        ...img,
        width: 320,
        height: Math.round(320 / (img.aspectRatio || 1)),
        rotation: 0,
      };
    });
    onImagesChange(updated);
  };

  const handleDuplicate = (image: NoteImage) => {
    const newImage: NoteImage = {
      ...image,
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      x: image.x + 30,
      y: image.y + 30,
    };
    onImagesChange([...images, newImage]);
    setSelectedId(newImage.id);
  };

  const handleDelete = (imageId: string) => {
    onImagesChange(images.filter((img) => img.id !== imageId));
    if (selectedId === imageId) {
      setSelectedId(null);
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none select-none"
      onPointerDown={() => {
        if (!isDrawing) setSelectedId(null);
      }}
    >
      {images.map((img) => {
        const isSelected = selectedId === img.id && !isDrawing;
        const rotation = img.rotation || 0;

        return (
          <div
            key={img.id}
            style={{
              position: 'absolute',
              left: `${img.x}px`,
              top: `${img.y}px`,
              width: `${img.width}px`,
              height: `${img.height}px`,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              touchAction: 'none',
            }}
            className={`group/img pointer-events-auto transition-shadow ${
              isSelected
                ? 'ring-2 ring-ios-yellow ring-offset-2 ring-offset-transparent shadow-ios-floating z-30'
                : 'hover:ring-1 hover:ring-ios-yellow/40 z-20'
            }`}
            onPointerDown={(e) => {
              if (isDrawing) return;
              e.stopPropagation();
              setSelectedId(img.id);
            }}
          >
            {/* Imagen renderizada */}
            <img
              src={img.dataUrl}
              alt="Elemento de nota"
              draggable={false}
              className="w-full h-full object-contain pointer-events-none rounded-lg"
            />

            {/* Arrastrador central (Área de movimiento) */}
            {isSelected && (
              <div
                onPointerDown={(e) => handlePointerDown(e, img, 'move')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="absolute inset-0 cursor-move bg-ios-yellow/5 flex items-center justify-center"
              >
                <div className="bg-ios-card/80 dark:bg-ios-darkCard/80 backdrop-blur-xs p-1.5 rounded-full shadow-2xs text-ios-textSecondary dark:text-ios-darkTextSecondary">
                  <Move size={14} />
                </div>
              </div>
            )}

            {/* Gizmo de Transformación: Tiradores y Barra de Acciones */}
            {isSelected && (
              <>
                {/* 1. Barra Flotante de Acciones Rápidas */}
                <div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-ios-card/95 dark:bg-ios-darkCard/95 backdrop-blur-md rounded-xl shadow-ios-floating border border-ios-border dark:border-ios-darkBorder px-2 py-1 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 select-none whitespace-nowrap text-ios-text dark:text-ios-darkText"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleRotate90(img.id)}
                    className="p-1 hover:bg-ios-gray6 dark:hover:bg-ios-darkBg rounded-lg transition-colors"
                    title="Rotar 90°"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetTransform(img.id)}
                    className="p-1 hover:bg-ios-gray6 dark:hover:bg-ios-darkBg rounded-lg transition-colors"
                    title="Restablecer tamaño y orientación"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(img)}
                    className="p-1 hover:bg-ios-gray6 dark:hover:bg-ios-darkBg rounded-lg transition-colors"
                    title="Duplicar imagen"
                  >
                    <Copy size={14} />
                  </button>
                  <div className="h-4 w-[1px] bg-ios-border dark:bg-ios-darkBorder mx-0.5" />
                  <button
                    type="button"
                    onClick={() => handleDelete(img.id)}
                    className="p-1 text-ios-textTertiary hover:text-ios-red rounded-lg transition-colors"
                    title="Eliminar imagen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 2. Vástago y Manecilla de Rotación (Arriba Centro) */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
                  <div
                    onPointerDown={(e) => handlePointerDown(e, img, 'rotate')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="w-5 h-5 rounded-full bg-ios-yellow border-2 border-white dark:border-ios-darkCard shadow-ios cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-110 transition-transform"
                    title="Girar libremente"
                  >
                    <RotateCw size={10} className="text-white" />
                  </div>
                  <div className="w-[2px] h-2 bg-ios-yellow" />
                </div>

                {/* 3. Manecillas de Redimensión en las 4 Esquinas */}
                {/* NW (Superior Izquierda) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, img, 'nw')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-white dark:bg-ios-darkCard border-2 border-ios-yellow shadow-ios cursor-nwse-resize hover:scale-125 transition-transform"
                />

                {/* NE (Superior Derecha) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, img, 'ne')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white dark:bg-ios-darkCard border-2 border-ios-yellow shadow-ios cursor-nesw-resize hover:scale-125 transition-transform"
                />

                {/* SE (Inferior Derecha) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, img, 'se')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-white dark:bg-ios-darkCard border-2 border-ios-yellow shadow-ios cursor-nwse-resize hover:scale-125 transition-transform"
                />

                {/* SW (Inferior Izquierda) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, img, 'sw')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-white dark:bg-ios-darkCard border-2 border-ios-yellow shadow-ios cursor-nesw-resize hover:scale-125 transition-transform"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
