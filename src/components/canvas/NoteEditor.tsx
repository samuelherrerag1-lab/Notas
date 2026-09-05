import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  Trash2,
  Check,
} from 'lucide-react';
import {
  CanvasState,
  DocumentData,
  Folder,
  Note,
  NoteImage,
  NoteTextBlock,
  Stroke,
  ViewportTransform,
} from '../../types';
import { CanvasEngine } from './CanvasEngine';
import { Toolbar } from './Toolbar';
import { createTextBlock, createChecklistBlock } from './TextLayer';
import { exportNoteAsImage, exportNoteAsPdf } from '../../utils/exportEngine';
import { useTheme } from '../../context/ThemeContext';

interface NoteEditorProps {
  note: Note;
  folders: Folder[];
  onSave: (updatedNote: Note) => void;
  onBack: () => void;
  onDelete?: (id: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  onSave,
  onBack,
  onDelete,
}) => {
  const { isDark } = useTheme();

  const [title, setTitle] = useState(note.title || 'Nota sin título');
  const [folderId, setFolderId] = useState(note.folderId || 'all');
  const [strokes, setStrokes] = useState<Stroke[]>(note.strokes || []);
  const [images, setImages] = useState<NoteImage[]>(note.images || []);
  const [textBlocks, setTextBlocks] = useState<NoteTextBlock[]>(note.textBlocks || []);
  const [document, setDocument] = useState<DocumentData | undefined>(note.document);
  const [backgroundTemplate, setBackgroundTemplate] = useState(note.backgroundTemplate || 'RULED');

  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    currentTool: 'pen',
    currentColor: '#1C1C1E',
    currentSize: 3,
    eraserMode: 'pixel',
    backgroundTemplate: note.backgroundTemplate || 'RULED',
    canUndo: false,
    canRedo: false,
  });

  const [viewportTransform, setViewportTransform] = useState<ViewportTransform>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Guardado reactivo automático hacia IndexedDB
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      onSave({
        ...note,
        title,
        folderId,
        strokes,
        images,
        textBlocks,
        document,
        backgroundTemplate,
        updatedAt: Date.now(),
      });
      setSaveStatus('saved');
    }, 600);

    return () => clearTimeout(timer);
  }, [title, folderId, strokes, images, textBlocks, document, backgroundTemplate]);

  // Manejadores de Trazos y Deshacer / Rehacer
  const handleStrokesChange = (newStrokes: Stroke[]) => {
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    setStrokes(newStrokes);
  };

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, strokes]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setStrokes(previous);
  }, [undoStack, strokes]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setStrokes(next);
  }, [redoStack, strokes]);

  const handleInsertImage = (dataUrl: string) => {
    const newImage: NoteImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dataUrl,
      x: Math.round(-viewportTransform.x + 120),
      y: Math.round(-viewportTransform.y + 120),
      width: 320,
      height: 240,
      rotation: 0,
      aspectRatio: 320 / 240,
    };
    setImages((prev) => [...prev, newImage]);
  };

  const handleAddTextBlock = () => {
    const newBlock = createTextBlock(
      Math.round(-viewportTransform.x + 120),
      Math.round(-viewportTransform.y + 120)
    );
    setTextBlocks((prev) => [...prev, newBlock]);
  };

  const handleAddChecklist = () => {
    const newBlock = createChecklistBlock(
      Math.round(-viewportTransform.x + 120),
      Math.round(-viewportTransform.y + 120)
    );
    setTextBlocks((prev) => [...prev, newBlock]);
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    const exportData = {
      ...note,
      title,
      strokes,
      images,
      textBlocks,
      document,
      backgroundTemplate,
    };

    if (format === 'png') {
      await exportNoteAsImage(exportData, isDark);
    } else {
      await exportNoteAsPdf(exportData, isDark);
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-ios-paper dark:bg-[#121214] text-ios-text dark:text-white overflow-hidden select-none font-sans">
      {/* 1. Barra Superior Minimalista Estilo Apple Notes */}
      <header className="h-14 shrink-0 px-4 flex items-center justify-between bg-ios-card/85 dark:bg-[#1C1C1E]/85 backdrop-blur-xl border-b border-ios-border/80 dark:border-white/[0.08] z-40 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-ios-yellow hover:text-ios-yellowHover font-semibold text-sm transition-colors py-1.5 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Notas</span>
          </button>

          <div className="h-5 w-[1px] bg-ios-border dark:bg-white/10" />

          {/* Título de la nota integrado */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la nota..."
            className="text-base font-bold bg-transparent outline-none border-none focus:ring-0 text-ios-text dark:text-white placeholder-ios-textTertiary/50 dark:placeholder-[#6E6E73] truncate max-w-sm sm:max-w-md"
          />

          {/* Estado de guardado */}
          <div className="hidden md:flex items-center gap-1 text-xs text-ios-textTertiary dark:text-[#8E8E93]">
            {saveStatus === 'saving' ? (
              <span className="animate-pulse">Guardando...</span>
            ) : (
              <span className="flex items-center gap-0.5 text-ios-green font-medium">
                <Check size={12} /> Guardado
              </span>
            )}
          </div>
        </div>

        {/* Acciones de Carpeta y Exportación */}
        <div className="flex items-center gap-2">
          {/* Selector de Materia / Carpeta */}
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="bg-ios-gray6 dark:bg-[#2C2C2E] text-xs font-semibold text-ios-textSecondary dark:text-[#A1A1A6] border border-ios-borderSubtle dark:border-white/10 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="all">📁 Sin clasificar</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.icon || '📁'} {f.name}
              </option>
            ))}
          </select>

          {/* Botones de Exportar */}
          <div className="flex items-center bg-ios-gray6 dark:bg-[#2C2C2E] rounded-xl p-0.5 border border-ios-borderSubtle dark:border-white/10">
            <button
              type="button"
              onClick={() => handleExport('png')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-ios-textSecondary dark:text-[#A1A1A6] hover:text-ios-text dark:hover:text-white hover:bg-ios-card dark:hover:bg-[#3A3A3C] transition-all"
              title="Exportar imagen PNG"
            >
              PNG
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-ios-textSecondary dark:text-[#A1A1A6] hover:text-ios-text dark:hover:text-white hover:bg-ios-card dark:hover:bg-[#3A3A3C] transition-all"
              title="Exportar documento PDF"
            >
              PDF
            </button>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="p-1.5 text-ios-textTertiary dark:text-[#8E8E93] hover:text-ios-red dark:hover:text-ios-red rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Eliminar nota"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {/* 2. Motor de Lienzo Infinito */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        <CanvasEngine
          currentTool={canvasState.currentTool}
          currentColor={canvasState.currentColor}
          currentSize={canvasState.currentSize}
          backgroundTemplate={backgroundTemplate}
          strokes={strokes}
          onStrokesChange={handleStrokesChange}
          images={images}
          onImagesChange={setImages}
          textBlocks={textBlocks}
          onTextBlocksChange={setTextBlocks}
          document={document}
          onDocumentChange={setDocument}
          onUndo={handleUndo}
          onRedo={handleRedo}
          viewportTransform={viewportTransform}
          onViewportTransformChange={setViewportTransform}
        />
      </main>

      {/* 3. Barra Flotante de Herramientas Estilo iPadOS */}
      <Toolbar
        currentTool={canvasState.currentTool}
        onToolChange={(tool) => setCanvasState((prev) => ({ ...prev, currentTool: tool }))}
        currentColor={canvasState.currentColor}
        onColorChange={(color) => setCanvasState((prev) => ({ ...prev, currentColor: color }))}
        currentSize={canvasState.currentSize}
        onSizeChange={(size) => setCanvasState((prev) => ({ ...prev, currentSize: size }))}
        backgroundTemplate={backgroundTemplate}
        onBackgroundChange={setBackgroundTemplate}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onInsertImage={handleInsertImage}
        onAddTextBlock={handleAddTextBlock}
        onAddChecklist={handleAddChecklist}
        viewportTransform={viewportTransform}
        onResetZoom={() => setViewportTransform({ scale: 1, x: 0, y: 0 })}
      />
    </div>
  );
};
