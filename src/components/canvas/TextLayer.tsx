import React, { useState, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Trash2,
  Move,
  Plus,
} from 'lucide-react';
import { ChecklistItem, NoteTextBlock } from '../../types';

interface TextLayerProps {
  textBlocks: NoteTextBlock[];
  onTextBlocksChange: (blocks: NoteTextBlock[]) => void;
  isDrawing: boolean;
}

export const TextLayer: React.FC<TextLayerProps> = ({
  textBlocks,
  onTextBlocksChange,
  isDrawing,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const dragRef = useRef<{
    blockId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Arrastre de bloque de texto
  const handleDragStart = (e: React.PointerEvent, block: NoteTextBlock) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setSelectedBlockId(block.id);
    dragRef.current = {
      blockId: block.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: block.x,
      initialY: block.y,
    };
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const { blockId, startX, startY, initialX, initialY } = dragRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const updated = textBlocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        x: Math.max(0, initialX + deltaX),
        y: Math.max(0, initialY + deltaY),
      };
    });

    onTextBlocksChange(updated);
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si se perdió captura
    }
    dragRef.current = null;
  };

  // Modificar contenido de texto estándar
  const handleContentChange = (id: string, newContent: string) => {
    onTextBlocksChange(
      textBlocks.map((b) => (b.id === id ? { ...b, content: newContent } : b))
    );
  };

  // Checklist: Toggle estado de un ítem
  const handleToggleCheckItem = (blockId: string, itemId: string) => {
    onTextBlocksChange(
      textBlocks.map((b) => {
        if (b.id !== blockId) return b;
        const updatedItems = (b.items || []).map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        return { ...b, items: updatedItems };
      })
    );
  };

  // Checklist: Modificar texto de un ítem
  const handleCheckItemTextChange = (
    blockId: string,
    itemId: string,
    newText: string
  ) => {
    onTextBlocksChange(
      textBlocks.map((b) => {
        if (b.id !== blockId) return b;
        const updatedItems = (b.items || []).map((item) =>
          item.id === itemId ? { ...item, text: newText } : item
        );
        return { ...b, items: updatedItems };
      })
    );
  };

  // Checklist: Agregar nuevo ítem
  const handleAddCheckItem = (blockId: string) => {
    onTextBlocksChange(
      textBlocks.map((b) => {
        if (b.id !== blockId) return b;
        const newItem: ChecklistItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          text: '',
          completed: false,
        };
        return { ...b, items: [...(b.items || []), newItem] };
      })
    );
  };

  // Checklist: Eliminar un ítem
  const handleDeleteCheckItem = (blockId: string, itemId: string) => {
    onTextBlocksChange(
      textBlocks.map((b) => {
        if (b.id !== blockId) return b;
        const updatedItems = (b.items || []).filter((item) => item.id !== itemId);
        return { ...b, items: updatedItems };
      })
    );
  };

  // Eliminar bloque completo
  const handleDeleteBlock = (blockId: string) => {
    onTextBlocksChange(textBlocks.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  if (!textBlocks || textBlocks.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 z-18 ${
        isDrawing ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      onClick={() => setSelectedBlockId(null)}
    >
      {textBlocks.map((block) => {
        const isSelected = selectedBlockId === block.id && !isDrawing;

        return (
          <div
            key={block.id}
            style={{
              position: 'absolute',
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBlockId(block.id);
            }}
            className={`group rounded-xl p-3 select-none backdrop-blur-xs transition-all ${
              isSelected
                ? 'bg-white/95 shadow-ios-floating ring-2 ring-ios-yellow border border-ios-border'
                : 'bg-white/70 hover:bg-white/90 shadow-ios-sm border border-ios-borderSubtle'
            }`}
          >
            {/* Barra superior de control del bloque */}
            <div className="flex items-center justify-between gap-1 mb-2">
              <div
                onPointerDown={(e) => handleDragStart(e, block)}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                className="flex items-center gap-1.5 cursor-move text-ios-textSecondary hover:text-ios-yellow p-1 rounded-md hover:bg-ios-gray6"
                title="Arrastrar bloque"
              >
                <Move size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {block.type === 'checklist' ? 'Lista de Tareas' : 'Nota de Texto'}
                </span>
              </div>

              {isSelected && (
                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  className="p-1 text-ios-textSecondary hover:text-ios-red hover:bg-red-50 rounded transition-colors"
                  title="Eliminar bloque"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Contenido: Texto libre */}
            {block.type === 'text' && (
              <textarea
                value={block.content || ''}
                onChange={(e) => handleContentChange(block.id, e.target.value)}
                placeholder="Escribe aquí tus notas..."
                rows={3}
                className="w-full bg-transparent text-sm text-ios-text outline-none resize-none font-sans placeholder-ios-textTertiary leading-relaxed"
              />
            )}

            {/* Contenido: Checklist escolar interactiva */}
            {block.type === 'checklist' && (
              <div className="space-y-1.5">
                {(block.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 group/item"
                  >
                    <button
                      onClick={() => handleToggleCheckItem(block.id, item.id)}
                      className={`p-0.5 rounded transition-transform active:scale-90 ${
                        item.completed ? 'text-ios-yellow' : 'text-ios-textSecondary hover:text-ios-yellow'
                      }`}
                    >
                      {item.completed ? (
                        <CheckSquare size={16} className="fill-ios-yellow/20" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>

                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) =>
                        handleCheckItemTextChange(block.id, item.id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCheckItem(block.id);
                        }
                      }}
                      placeholder="Tarea o apunte..."
                      className={`flex-1 text-xs sm:text-sm bg-transparent outline-none border-b border-transparent focus:border-ios-yellow transition-all ${
                        item.completed
                          ? 'line-through text-ios-textTertiary'
                          : 'text-ios-text'
                      }`}
                    />

                    {isSelected && (
                      <button
                        onClick={() => handleDeleteCheckItem(block.id, item.id)}
                        className="opacity-0 group-hover/item:opacity-100 text-ios-textTertiary hover:text-ios-red p-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => handleAddCheckItem(block.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ios-yellow hover:text-ios-yellowHover pt-1 transition-colors"
                >
                  <Plus size={13} />
                  <span>Añadir ítem</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export function createTextBlock(x = 100, y = 100, width = 280): NoteTextBlock {
  return {
    id: `tb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: 'text',
    x,
    y,
    width,
    content: '',
  };
}

export function createChecklistBlock(x = 100, y = 100, width = 300): NoteTextBlock {
  return {
    id: `tb-cl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: 'checklist',
    x,
    y,
    width,
    items: [
      {
        id: `item-${Date.now()}-1`,
        text: '',
        completed: false,
      },
    ],
  };
}
