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
import { useTheme } from '../../context/ThemeContext';

interface TextLayerProps {
  textBlocks: NoteTextBlock[];
  onTextBlocksChange: (blocks: NoteTextBlock[]) => void;
  scale?: number;
  isDrawing: boolean;
  onEditingStateChange?: (isEditing: boolean) => void;
}

const TEXT_COLORS = [
  { name: 'Tinta Estándar', hex: 'DEFAULT' },
  { name: 'Azul Apple', hex: '#007AFF' },
  { name: 'Rojo', hex: '#FF3B30' },
  { name: 'Verde', hex: '#34C759' },
  { name: 'Ámbar Notas', hex: '#E4A11B' },
  { name: 'Púrpura', hex: '#AF52DE' },
];

export const TextLayer: React.FC<TextLayerProps> = ({
  textBlocks,
  onTextBlocksChange,
  scale = 1,
  isDrawing,
  onEditingStateChange,
}) => {
  const { isDark } = useTheme();
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

  // Notificar al motor de canvas si hay una caja en edición activa para deshabilitar trazos accidentales
  useEffect(() => {
    onEditingStateChange?.(selectedBlockId !== null);
  }, [selectedBlockId, onEditingStateChange]);

  // Auto-ajustar altura de textareas controlados
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(36, textarea.scrollHeight)}px`;
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
    const deltaX = (e.clientX - startX) / (scale || 1);
    const deltaY = (e.clientY - startY) / (scale || 1);

    const updated = textBlocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        x: Math.round(initialX + deltaX),
        y: Math.round(initialY + deltaY),
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
    let fontSize = 16;
    let isBold = false;

    if (hierarchy === 'title') {
      fontSize = 24;
      isBold = true;
    } else if (hierarchy === 'subtitle') {
      fontSize = 19;
      isBold = true;
    } else {
      fontSize = 16;
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
      b.id === id ? { ...b, color: color === 'DEFAULT' ? undefined : color } : b
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

    if (blockEl && relatedTarget && blockEl.contains(relatedTarget)) {
      return;
    }

    const block = textBlocks.find((b) => b.id === blockId);
    if (!block) return;

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
      className="absolute inset-0 z-30 pointer-events-none select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {textBlocks.map((block) => {
        const isSelected = selectedBlockId === block.id && !isDrawing;
        const fontSize = block.fontSize || (block.hierarchy === 'title' ? 24 : block.hierarchy === 'subtitle' ? 19 : 16);
        
        // Color adaptativo: Si no hay color personalizado o es color tinta base, adaptar a Modo Oscuro/Claro
        const defaultColor = isDark ? '#F2F2F7' : '#1C1C1E';
        const rawColor = block.color;
        const textColor = !rawColor || rawColor.toLowerCase() === '#1c1c1e' || rawColor.toLowerCase() === '#000000'
          ? defaultColor
          : rawColor;

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
            className={`group/block pointer-events-auto transition-all ${
              isSelected
                ? 'bg-ios-yellow/[0.03] dark:bg-ios-yellow/[0.06] border-l-2 border-ios-yellow/80 pl-2.5 pr-1 py-1 rounded-r-md z-40'
                : 'bg-transparent border-l-2 border-transparent pl-2.5 pr-1 py-1 hover:border-ios-yellow/30 z-30'
            }`}
          >
            {/* 5. Mini-Barra Flotante de Formato (Estilo Apple Notes iOS) */}
            {isSelected && (
              <div
                className="absolute -top-12 left-0 bg-ios-card/95 dark:bg-ios-darkCard/95 backdrop-blur-md rounded-xl shadow-ios-floating border border-ios-border dark:border-ios-darkBorder px-2 py-1.5 flex items-center gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 select-none whitespace-nowrap text-ios-text dark:text-ios-darkText"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Jerarquía tipográfica */}
                <div className="flex items-center bg-ios-gray6 dark:bg-ios-darkBg rounded-lg p-0.5 border border-ios-borderSubtle dark:border-ios-darkBorderSubtle">
                  <button
                    type="button"
                    onClick={() => handleHierarchyChange(block.id, 'title')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                      block.hierarchy === 'title' ? 'bg-ios-card dark:bg-ios-darkCard text-ios-text dark:text-ios-darkText shadow-2xs' : 'text-ios-textSecondary dark:text-ios-darkTextSecondary'
                    }`}
                    title="Título grande"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHierarchyChange(block.id, 'subtitle')}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      block.hierarchy === 'subtitle' ? 'bg-ios-card dark:bg-ios-darkCard text-ios-text dark:text-ios-darkText shadow-2xs' : 'text-ios-textSecondary dark:text-ios-darkTextSecondary'
                    }`}
                    title="Subtítulo"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHierarchyChange(block.id, 'body')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      !block.hierarchy || block.hierarchy === 'body' ? 'bg-ios-card dark:bg-ios-darkCard text-ios-text dark:text-ios-darkText shadow-2xs' : 'text-ios-textSecondary dark:text-ios-darkTextSecondary'
                    }`}
                    title="Cuerpo de texto"
                  >
                    Aa
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-ios-border dark:bg-ios-darkBorder" />

                {/* Negrita y Cursiva */}
                <div className="flex items-center bg-ios-gray6 dark:bg-ios-darkBg rounded-lg p-0.5 border border-ios-borderSubtle dark:border-ios-darkBorderSubtle">
                  <button
                    type="button"
                    onClick={() => handleToggleBold(block.id)}
                    className={`p-1 rounded text-xs transition-colors ${
                      block.isBold ? 'bg-ios-card dark:bg-ios-darkCard text-ios-yellow shadow-2xs' : 'text-ios-textSecondary dark:text-ios-darkTextSecondary'
                    }`}
                    title="Negrita"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleItalic(block.id)}
                    className={`p-1 rounded text-xs transition-colors ${
                      block.isItalic ? 'bg-ios-card dark:bg-ios-darkCard text-ios-yellow shadow-2xs' : 'text-ios-textSecondary dark:text-ios-darkTextSecondary'
                    }`}
                    title="Cursiva"
                  >
                    <Italic size={13} />
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-ios-border dark:bg-ios-darkBorder" />

                {/* Alternar Texto / Checklist */}
                <div className="flex items-center bg-ios-gray6 dark:bg-ios-darkBg rounded-lg p-0.5 border border-ios-borderSubtle dark:border-ios-darkBorderSubtle">
                  <button
                    type="button"
                    onClick={() => handleConvertType(block.id, 'text')}
                    className={`p-1 rounded text-xs transition-colors ${
                      block.type === 'text' ? 'bg-ios-card dark:bg-ios-darkCard text-ios-yellow shadow-2xs' : 'text-ios-textSecondary dark:text-ios-darkTextSecondary'
                    }`}
                    title="Texto estándar"
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConvertType(block.id, 'checklist')}
                    className={`p-1 rounded text-xs transition-colors ${
                      block.type === 'checklist' ? 'bg-ios-card dark:bg-ios-darkCard text-ios-yellow shadow-2xs' : 'text-ios-textSecondary dark:text-ios-darkTextSecondary'
                    }`}
                    title="Lista de tareas (Checklist)"
                  >
                    <ListTodo size={13} />
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-ios-border dark:bg-ios-darkBorder" />

                {/* Colores de texto */}
                <div className="flex items-center gap-1">
                  {TEXT_COLORS.map((c) => {
                    const isSelectedColor = c.hex === 'DEFAULT' ? !block.color : block.color === c.hex;
                    const bgCircle = c.hex === 'DEFAULT' ? (isDark ? '#F2F2F7' : '#1C1C1E') : c.hex;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleColorChange(block.id, c.hex)}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          isSelectedColor ? 'ring-1 ring-ios-yellow ring-offset-1 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: bgCircle }}
                        title={c.name}
                      />
                    );
                  })}
                </div>

                <div className="h-4 w-[1px] bg-ios-border dark:bg-ios-darkBorder" />

                {/* Botón Eliminar Bloque */}
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(block.id)}
                  className="p-1 text-ios-textTertiary hover:text-ios-red rounded transition-colors"
                  title="Eliminar bloque"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Tirador sutil de arrastre espacial (aparece en hover o selección) */}
            <div
              className={`flex items-center justify-between gap-1 mb-0.5 select-none transition-opacity ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-70'
              }`}
            >
              <div
                onPointerDown={(e) => handleDragStart(e, block)}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                className="flex items-center gap-1 cursor-move text-ios-textTertiary dark:text-ios-darkTextTertiary hover:text-ios-yellow py-0.5 rounded transition-colors"
                title="Arrastrar bloque"
              >
                <Move size={11} />
                <span className="text-[9px] font-semibold uppercase tracking-wider">
                  {block.type === 'checklist' ? 'Lista' : 'Texto'}
                </span>
              </div>

              {isSelected && (
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(null)}
                  className="p-0.5 text-ios-textTertiary hover:text-ios-text dark:hover:text-ios-darkText rounded"
                  title="Cerrar edición"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Contenido: Textarea Controlado integrado sin bordes ni fondo */}
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
                placeholder="Escribe directamente en el lienzo..."
                style={{
                  fontSize: `${fontSize}px`,
                  fontWeight: block.isBold ? 700 : 400,
                  fontStyle: block.isItalic ? 'italic' : 'normal',
                  color: textColor,
                  touchAction: 'manipulation',
                  userSelect: 'text',
                }}
                rows={1}
                className="w-full bg-transparent outline-none resize-none font-sans placeholder-ios-textTertiary/50 dark:placeholder-ios-darkTextTertiary/50 leading-relaxed select-text border-none p-0 focus:ring-0 shadow-none"
              />
            )}

            {/* Contenido: Checklist Interactiva integrada directamente en la hoja */}
            {block.type === 'checklist' && (
              <div
                className="space-y-1"
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
                        item.completed ? 'text-ios-yellow' : 'text-ios-textTertiary dark:text-ios-darkTextTertiary hover:text-ios-yellow'
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
                      placeholder="Tarea o apunte escolar..."
                      style={{
                        fontSize: `${fontSize}px`,
                        fontWeight: block.isBold ? 700 : 400,
                        fontStyle: block.isItalic ? 'italic' : 'normal',
                        color: item.completed ? (isDark ? '#636366' : '#AEAEB2') : textColor,
                        touchAction: 'manipulation',
                        userSelect: 'text',
                      }}
                      className={`flex-1 bg-transparent outline-none border-none p-0 focus:ring-0 transition-all select-text ${
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
                  className="flex items-center gap-1 text-xs font-semibold text-ios-yellow hover:text-ios-yellowHover pt-0.5 transition-colors select-none"
                >
                  <Plus size={12} />
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
    fontSize: hierarchy === 'title' ? 24 : hierarchy === 'subtitle' ? 19 : 16,
    isBold: hierarchy === 'title' || hierarchy === 'subtitle',
    isItalic: false,
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
    fontSize: 16,
    isBold: false,
    isItalic: false,
    items: [
      {
        id: `item-${Date.now()}-1`,
        text: '',
        completed: false,
      },
    ],
  };
}
