import React, { useState, useRef, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Trash2,
  Move,
  Plus,
  Bold,
  Italic,
  ListTodo,
  AlignLeft,
  X,
} from 'lucide-react';
import { ChecklistItem, NoteTextBlock, TextHierarchy } from '../../types';

interface TextLayerProps {
  textBlocks: NoteTextBlock[];
  onTextBlocksChange: (blocks: NoteTextBlock[]) => void;
  scale?: number;
  isDrawing: boolean;
  onEditingStateChange?: (isEditing: boolean) => void;
}

const TEXT_COLORS = [
  { name: 'Tinta Negra', hex: '#1C1C1E' },
  { name: 'Azul Apple', hex: '#007AFF' },
  { name: 'Rojo', hex: '#FF3B30' },
  { name: 'Verde', hex: '#34C759' },
  { name: 'Ámbar Notas', hex: '#E4A11B' },
];

export const TextLayer: React.FC<TextLayerProps> = ({
  textBlocks,
  onTextBlocksChange,
  scale = 1,
  isDrawing,
  onEditingStateChange,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const dragRef = useRef<{
    blockId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Notificar al motor de canvas si hay una caja en edición activa para deshabilitar trazos
  useEffect(() => {
    onEditingStateChange?.(selectedBlockId !== null);
  }, [selectedBlockId, onEditingStateChange]);

  // Auto-ajustar altura de textareas controlados
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(48, textarea.scrollHeight)}px`;
  };

  // 1. Arrastre táctil consciente del Zoom (Spatial Transformation)
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
    // Ajustar desplazamiento con el factor de escala (zoom)
    const deltaX = (e.clientX - startX) / (scale || 1);
    const deltaY = (e.clientY - startY) / (scale || 1);

    const updated = textBlocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        x: Math.max(0, Math.round(initialX + deltaX)),
        y: Math.max(0, Math.round(initialY + deltaY)),
      };
    });

    onTextBlocksChange(updated);
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si se liberó el puntero
    }
    dragRef.current = null;
  };

  // 2. Modificaciones de Contenido y Formato
  const handleContentChange = (id: string, newContent: string) => {
    const updated = textBlocks.map((b) =>
      b.id === id ? { ...b, content: newContent } : b
    );
    onTextBlocksChange(updated);
  };

  const handleHierarchyChange = (id: string, hierarchy: TextHierarchy) => {
    let fontSize = 15;
    let isBold = false;

    if (hierarchy === 'title') {
      fontSize = 22;
      isBold = true;
    } else if (hierarchy === 'subtitle') {
      fontSize = 18;
      isBold = true;
    } else {
      fontSize = 15;
      isBold = false;
    }

    const updated = textBlocks.map((b) =>
      b.id === id ? { ...b, hierarchy, fontSize, isBold } : b
    );
    onTextBlocksChange(updated);
  };

  const handleToggleBold = (id: string) => {
    const updated = textBlocks.map((b) =>
      b.id === id ? { ...b, isBold: !b.isBold } : b
    );
    onTextBlocksChange(updated);
  };

  const handleToggleItalic = (id: string) => {
    const updated = textBlocks.map((b) =>
      b.id === id ? { ...b, isItalic: !b.isItalic } : b
    );
    onTextBlocksChange(updated);
  };

  const handleColorChange = (id: string, color: string) => {
    const updated = textBlocks.map((b) =>
      b.id === id ? { ...b, color } : b
    );
    onTextBlocksChange(updated);
  };

  const handleConvertType = (id: string, newType: 'text' | 'checklist') => {
    const updated = textBlocks.map((b) => {
      if (b.id !== id) return b;

      if (newType === 'checklist') {
        const lines = (b.content || '').split('\n').filter((l) => l.trim().length > 0);
        const items: ChecklistItem[] =
          lines.length > 0
            ? lines.map((text, idx) => ({
                id: `item-${Date.now()}-${idx}`,
                text,
                completed: false,
              }))
            : [{ id: `item-${Date.now()}-0`, text: '', completed: false }];

        return {
          ...b,
          type: 'checklist' as const,
          items,
          content: undefined,
        };
      } else {
        const content = (b.items || []).map((i) => i.text).join('\n');
        return {
          ...b,
          type: 'text' as const,
          content,
          items: undefined,
        };
      }
    });

    onTextBlocksChange(updated);
  };

  // 3. Manejo de Checklists con adición por 'Enter'
  const handleToggleCheckItem = (blockId: string, itemId: string) => {
    const updated = textBlocks.map((b) => {
      if (b.id !== blockId) return b;
      const items = (b.items || []).map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      return { ...b, items };
    });
    onTextBlocksChange(updated);
  };

  const handleCheckItemTextChange = (
    blockId: string,
    itemId: string,
    newText: string
  ) => {
    const updated = textBlocks.map((b) => {
      if (b.id !== blockId) return b;
      const items = (b.items || []).map((item) =>
        item.id === itemId ? { ...item, text: newText } : item
      );
      return { ...b, items };
    });
    onTextBlocksChange(updated);
  };

  const handleCheckItemKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    blockId: string,
    itemIndex: number
  ) => {
    const block = textBlocks.find((b) => b.id === blockId);
    if (!block || !block.items) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const newItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newItem: ChecklistItem = {
        id: newItemId,
        text: '',
        completed: false,
      };

      const newItems = [...block.items];
      newItems.splice(itemIndex + 1, 0, newItem);

      onTextBlocksChange(
        textBlocks.map((b) => (b.id === blockId ? { ...b, items: newItems } : b))
      );

      // Enfocar automáticamente el nuevo ítem creado
      setTimeout(() => {
        const inputEl = inputRefs.current.get(newItemId);
        inputEl?.focus();
      }, 30);
    } else if (e.key === 'Backspace' && block.items[itemIndex]?.text === '' && block.items.length > 1) {
      e.preventDefault();
      const prevItem = block.items[itemIndex - 1];
      const newItems = block.items.filter((_, idx) => idx !== itemIndex);

      onTextBlocksChange(
        textBlocks.map((b) => (b.id === blockId ? { ...b, items: newItems } : b))
      );

      if (prevItem) {
        setTimeout(() => {
          const inputEl = inputRefs.current.get(prevItem.id);
          inputEl?.focus();
        }, 30);
      }
    }
  };

  const handleAddCheckItem = (blockId: string) => {
    const newItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newItem: ChecklistItem = {
      id: newItemId,
      text: '',
      completed: false,
    };

    const updated = textBlocks.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, items: [...(b.items || []), newItem] };
    });

    onTextBlocksChange(updated);

    setTimeout(() => {
      const inputEl = inputRefs.current.get(newItemId);
      inputEl?.focus();
    }, 30);
  };

  const handleDeleteCheckItem = (blockId: string, itemId: string) => {
    const updated = textBlocks.map((b) => {
      if (b.id !== blockId) return b;
      const items = (b.items || []).filter((item) => item.id !== itemId);
      return { ...b, items: items.length > 0 ? items : [{ id: `item-${Date.now()}`, text: '', completed: false }] };
    });
    onTextBlocksChange(updated);
  };

  const handleDeleteBlock = (blockId: string) => {
    onTextBlocksChange(textBlocks.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // 4. Limpieza Automática de Bloques Huérfanos al perder el foco
  const handleBlockBlur = (blockId: string, e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const blockEl = blockRefs.current.get(blockId);

    // Si el foco se mueve a otro elemento dentro del mismo bloque (ej. botón o toolbar), no limpiar
    if (blockEl && relatedTarget && blockEl.contains(relatedTarget)) {
      return;
    }

    const block = textBlocks.find((b) => b.id === blockId);
    if (!block) return;

    // Si el bloque está completamente vacío, eliminarlo automáticamente
    if (block.type === 'text') {
      if (!block.content || block.content.trim().length === 0) {
        onTextBlocksChange(textBlocks.filter((b) => b.id !== blockId));
      }
    } else if (block.type === 'checklist') {
      const hasAnyText = (block.items || []).some((item) => item.text.trim().length > 0);
      if (!hasAnyText) {
        onTextBlocksChange(textBlocks.filter((b) => b.id !== blockId));
      }
    }

    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  if (!textBlocks || textBlocks.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 z-30 pointer-events-none select-none`}
      style={{ touchAction: 'manipulation' }}
    >
      {textBlocks.map((block) => {
        const isSelected = selectedBlockId === block.id && !isDrawing;
        const fontSize = block.fontSize || (block.hierarchy === 'title' ? 22 : block.hierarchy === 'subtitle' ? 18 : 15);
        const textColor = block.color || '#1C1C1E';

        return (
          <div
            key={block.id}
            ref={(el) => {
              if (el) blockRefs.current.set(block.id, el);
              else blockRefs.current.delete(block.id);
            }}
            style={{
              position: 'absolute',
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
              touchAction: 'manipulation',
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelectedBlockId(block.id);
            }}
            onBlur={(e) => handleBlockBlur(block.id, e)}
            className={`pointer-events-auto rounded-xl p-3 transition-shadow backdrop-blur-xs ${
              isSelected
                ? 'bg-white/95 shadow-ios-floating ring-2 ring-ios-yellow border border-ios-yellow/40 z-40'
                : 'bg-white/80 hover:bg-white/95 shadow-ios-sm border border-ios-borderSubtle z-30'
            }`}
          >
            {/* 5. Mini-Barra Flotante de Formato (Estilo Apple Notes iOS) */}
            {isSelected && (
              <div
                className="absolute -top-12 left-0 bg-ios-card/95 backdrop-blur-md rounded-xl shadow-ios-floating border border-ios-border px-2 py-1.5 flex items-center gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 select-none whitespace-nowrap"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Jerarquía tipográfica */}
                <div className="flex items-center bg-ios-gray6 rounded-lg p-0.5 border border-ios-borderSubtle">
                  <button
                    type="button"
                    onClick={() => handleHierarchyChange(block.id, 'title')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                      block.hierarchy === 'title' ? 'bg-ios-card text-ios-text shadow-2xs' : 'text-ios-textSecondary'
                    }`}
                    title="Título grande"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHierarchyChange(block.id, 'subtitle')}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      block.hierarchy === 'subtitle' ? 'bg-ios-card text-ios-text shadow-2xs' : 'text-ios-textSecondary'
                    }`}
                    title="Subtítulo"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHierarchyChange(block.id, 'body')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      !block.hierarchy || block.hierarchy === 'body' ? 'bg-ios-card text-ios-text shadow-2xs' : 'text-ios-textSecondary'
                    }`}
                    title="Cuerpo de texto"
                  >
                    Aa
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-ios-border" />

                {/* Negrita y Cursiva */}
                <div className="flex items-center bg-ios-gray6 rounded-lg p-0.5 border border-ios-borderSubtle">
                  <button
                    type="button"
                    onClick={() => handleToggleBold(block.id)}
                    className={`p-1 rounded text-xs transition-colors ${
                      block.isBold ? 'bg-ios-card text-ios-yellow shadow-2xs' : 'text-ios-textSecondary'
                    }`}
                    title="Negrita"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleItalic(block.id)}
                    className={`p-1 rounded text-xs transition-colors ${
                      block.isItalic ? 'bg-ios-card text-ios-yellow shadow-2xs' : 'text-ios-textSecondary'
                    }`}
                    title="Cursiva"
                  >
                    <Italic size={13} />
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-ios-border" />

                {/* Alternar Texto / Checklist */}
                <div className="flex items-center bg-ios-gray6 rounded-lg p-0.5 border border-ios-borderSubtle">
                  <button
                    type="button"
                    onClick={() => handleConvertType(block.id, 'text')}
                    className={`p-1 rounded text-xs transition-colors ${
                      block.type === 'text' ? 'bg-ios-card text-ios-yellow shadow-2xs' : 'text-ios-textSecondary'
                    }`}
                    title="Texto estándar"
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConvertType(block.id, 'checklist')}
                    className={`p-1 rounded text-xs transition-colors ${
                      block.type === 'checklist' ? 'bg-ios-card text-ios-yellow shadow-2xs' : 'text-ios-textSecondary'
                    }`}
                    title="Lista de tareas (Checklist)"
                  >
                    <ListTodo size={13} />
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-ios-border" />

                {/* Colores de texto */}
                <div className="flex items-center gap-1">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleColorChange(block.id, c.hex)}
                      className={`w-4 h-4 rounded-full transition-transform ${
                        textColor === c.hex ? 'ring-1 ring-ios-yellow ring-offset-1 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>

                <div className="h-4 w-[1px] bg-ios-border" />

                {/* Botón Eliminar Bloque */}
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(block.id)}
                  className="p-1 text-ios-textTertiary hover:text-ios-red rounded transition-colors"
                  title="Eliminar bloque de texto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Cabecera del bloque con tirador de arrastre */}
            <div className="flex items-center justify-between gap-1 mb-1.5 select-none">
              <div
                onPointerDown={(e) => handleDragStart(e, block)}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                className="flex items-center gap-1.5 cursor-move text-ios-textSecondary hover:text-ios-yellow p-0.5 rounded hover:bg-ios-gray6 transition-colors"
                title="Arrastrar bloque en el lienzo"
              >
                <Move size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-ios-textTertiary">
                  {block.type === 'checklist' ? 'Lista de Tareas' : 'Texto'}
                </span>
              </div>

              {isSelected && (
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(null)}
                  className="p-0.5 text-ios-textTertiary hover:text-ios-text rounded"
                  title="Cerrar edición"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Contenido: Textarea Controlado con Auto-Resize */}
            {block.type === 'text' && (
              <textarea
                ref={(el) => {
                  if (el) {
                    textareaRefs.current.set(block.id, el);
                    adjustTextareaHeight(el);
                  } else {
                    textareaRefs.current.delete(block.id);
                  }
                }}
                value={block.content || ''}
                onChange={(e) => {
                  handleContentChange(block.id, e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                onFocus={(e) => {
                  setSelectedBlockId(block.id);
                  adjustTextareaHeight(e.target);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="Escribe aquí tus notas..."
                style={{
                  fontSize: `${fontSize}px`,
                  fontWeight: block.isBold ? 700 : 400,
                  fontStyle: block.isItalic ? 'italic' : 'normal',
                  color: textColor,
                  touchAction: 'manipulation',
                  userSelect: 'text',
                }}
                rows={1}
                className="w-full bg-transparent outline-none resize-none font-sans placeholder-ios-textTertiary leading-relaxed select-text"
              />
            )}

            {/* Contenido: Checklist Interactiva */}
            {block.type === 'checklist' && (
              <div
                className="space-y-1.5"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {(block.items || []).map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 group/item"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCheckItem(block.id, item.id)}
                      className={`p-0.5 rounded transition-transform active:scale-90 shrink-0 ${
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
                      ref={(el) => {
                        if (el) inputRefs.current.set(item.id, el);
                        else inputRefs.current.delete(item.id);
                      }}
                      type="text"
                      value={item.text}
                      onChange={(e) =>
                        handleCheckItemTextChange(block.id, item.id, e.target.value)
                      }
                      onFocus={() => {
                        setSelectedBlockId(block.id);
                      }}
                      onKeyDown={(e) => handleCheckItemKeyDown(e, block.id, idx)}
                      placeholder="Tarea o apunte escolar (Enter para nueva línea)..."
                      style={{
                        fontSize: `${fontSize}px`,
                        fontWeight: block.isBold ? 700 : 400,
                        fontStyle: block.isItalic ? 'italic' : 'normal',
                        color: item.completed ? '#AEAEB2' : textColor,
                        touchAction: 'manipulation',
                        userSelect: 'text',
                      }}
                      className={`flex-1 bg-transparent outline-none border-b border-transparent focus:border-ios-yellow transition-all select-text ${
                        item.completed ? 'line-through' : ''
                      }`}
                    />

                    {isSelected && (block.items?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCheckItem(block.id, item.id)}
                        className="opacity-0 group-hover/item:opacity-100 text-ios-textTertiary hover:text-ios-red p-0.5 rounded transition-opacity"
                        title="Eliminar tarea"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Botón para añadir nuevo ítem */}
                <button
                  type="button"
                  onClick={() => handleAddCheckItem(block.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ios-yellow hover:text-ios-yellowHover pt-1 transition-colors select-none"
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

export function createTextBlock(x = 100, y = 100, width = 280, hierarchy: TextHierarchy = 'body'): NoteTextBlock {
  return {
    id: `tb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: 'text',
    x,
    y,
    width,
    content: '',
    hierarchy,
    fontSize: hierarchy === 'title' ? 22 : hierarchy === 'subtitle' ? 18 : 15,
    isBold: hierarchy === 'title' || hierarchy === 'subtitle',
    isItalic: false,
    color: '#1C1C1E',
  };
}

export function createChecklistBlock(x = 100, y = 100, width = 300): NoteTextBlock {
  return {
    id: `tb-cl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: 'checklist',
    x,
    y,
    width,
    hierarchy: 'body',
    fontSize: 15,
    isBold: false,
    isItalic: false,
    color: '#1C1C1E',
    items: [
      {
        id: `item-${Date.now()}-1`,
        text: '',
        completed: false,
      },
    ],
  };
}
