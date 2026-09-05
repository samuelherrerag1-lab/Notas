import React, { useState, useRef } from 'react';
import { Trash2, Move, Maximize2 } from 'lucide-react';
import { NoteImage } from '../../types';

interface ImageLayerProps {
  images: NoteImage[];
  onImagesChange: (images: NoteImage[]) => void;
  isDrawing: boolean;
}

export const ImageLayer: React.FC<ImageLayerProps> = ({
  images,
  onImagesChange,
  isDrawing,
}) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const dragInfoRef = useRef<{
    imageId: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    img: NoteImage,
    mode: 'move' | 'resize'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setSelectedImageId(img.id);
    dragInfoRef.current = {
      imageId: img.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initialX: img.x,
      initialY: img.y,
      initialW: img.width,
      initialH: img.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfoRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const { imageId, mode, startX, startY, initialX, initialY, initialW, initialH } =
      dragInfoRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const updated = images.map((img) => {
      if (img.id !== imageId) return img;

      if (mode === 'move') {
        return {
          ...img,
          x: Math.max(0, initialX + deltaX),
          y: Math.max(0, initialY + deltaY),
        };
      } else {
        // Redimensionar manteniendo proporción mínima
        const newW = Math.max(60, initialW + deltaX);
        const ratio = initialH / initialW;
        const newH = Math.max(60, newW * ratio);
        return {
          ...img,
          width: Math.round(newW),
          height: Math.round(newH),
        };
      }
    });

    onImagesChange(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragInfoRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si el puntero ya no está capturado
    }
    dragInfoRef.current = null;
  };

  const handleDeleteImage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onImagesChange(images.filter((img) => img.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  };

  if (!images || images.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 z-15 ${
        isDrawing ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      onClick={() => setSelectedImageId(null)}
    >
      {images.map((img) => {
        const isSelected = selectedImageId === img.id && !isDrawing;
        return (
          <div
            key={img.id}
            style={{
              position: 'absolute',
              left: `${img.x}px`,
              top: `${img.y}px`,
              width: `${img.width}px`,
              height: `${img.height}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageId(img.id);
            }}
            className={`group select-none touch-none ${
              isSelected ? 'ring-2 ring-ios-yellow shadow-ios-card-hover' : 'hover:ring-1 hover:ring-ios-yellow/50'
            } rounded-lg`}
          >
            <img
              src={img.dataUrl}
              alt=""
              className="w-full h-full object-contain rounded-lg pointer-events-none"
              draggable={false}
            />

            {/* Controles cuando la imagen está seleccionada */}
            {isSelected && (
              <>
                {/* Botón Mover (Arrastre central) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, img, 'move')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute inset-0 bg-ios-yellow/5 cursor-move flex items-center justify-center rounded-lg"
                >
                  <div className="bg-white/80 backdrop-blur-xs p-1 rounded-full shadow-sm text-ios-yellow opacity-0 group-hover:opacity-100 transition-opacity">
                    <Move size={16} />
                  </div>
                </div>

                {/* Botón Eliminar Imagen (Esquina superior derecha) */}
                <button
                  onClick={(e) => handleDeleteImage(e, img.id)}
                  className="absolute -top-3 -right-3 w-7 h-7 bg-ios-red text-white rounded-full flex items-center justify-center shadow-ios-sm hover:scale-110 active:scale-95 transition-transform z-20"
                  title="Eliminar imagen"
                >
                  <Trash2 size={13} />
                </button>

                {/* Controlador de Redimensionamiento (Esquina inferior derecha) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, img, 'resize')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute -bottom-3 -right-3 w-7 h-7 bg-ios-yellow text-white rounded-full flex items-center justify-center shadow-ios-sm cursor-nwse-resize hover:scale-110 active:scale-95 transition-transform z-20"
                  title="Arrastrar para redimensionar"
                >
                  <Maximize2 size={13} className="rotate-90" />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Procesa un archivo de imagen o blob y lo convierte en un NoteImage posicionado
 */
export async function processImageFile(
  file: File | Blob,
  initialX = 100,
  initialY = 150
): Promise<NoteImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Ajustar ancho inicial manteniendo aspecto
        const maxWidth = 320;
        const width = Math.min(img.width, maxWidth);
        const height = (img.height / img.width) * width;

        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          dataUrl,
          x: initialX,
          y: initialY,
          width: Math.round(width),
          height: Math.round(height),
          aspectRatio: img.width / img.height,
        });
      };
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
