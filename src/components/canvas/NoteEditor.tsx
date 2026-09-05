import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Note, ToolType, EraserMode, BackgroundTemplate, Stroke, NoteImage, DocumentData, NoteTextBlock } from '../../types';
import { Toolbar } from './Toolbar';
import { CanvasEngine, CanvasEngineHandle } from './CanvasEngine';
import { saveNote } from '../../db/db';
import { processDocumentFile } from './DocumentViewer';
import { processImageFile } from './ImageLayer';
import { exportNoteAsImage, exportNoteAsPdf } from '../../utils/exportEngine';

interface NoteEditorProps {
  initialNote: Note;
  onBack: () => void;
  onNoteUpdated?: (updatedNote: Note) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialNote,
  onBack,
  onNoteUpdated,
}) => {
  const [note, setNote] = useState<Note>(initialNote);
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#1C1C1E');
  const [currentSize, setCurrentSize] = useState<number>(4);
  const [eraserMode, setEraserMode] = useState<EraserMode>('stroke');
  const [isSaving, setIsSaving] = useState(false);

  // Historial de Undo / Redo
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

  const canvasRef = useRef<CanvasEngineHandle>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noteRef = useRef<Note>(note);

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  /**
   * Auto-guardado con debounce y generación de miniatura para el Dashboard
   */
  const triggerAutoSave = useCallback(
    (updatedNote: Note) => {
      setIsSaving(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const thumbnail = canvasRef.current?.generateThumbnail(320, 220);
          const noteToSave: Note = {
            ...updatedNote,
            thumbnail: thumbnail || updatedNote.thumbnail,
            updatedAt: Date.now(),
          };

          await saveNote(noteToSave);
          onNoteUpdated?.(noteToSave);
        } catch (err) {
          console.error('Error al autoguardar nota:', err);
        } finally {
          setIsSaving(false);
        }
      }, 400);
    },
    [onNoteUpdated]
  );

  /**
   * Manejo de cambio de trazos con historial
   */
  const handleStrokesChange = (newStrokes: Stroke[]) => {
    setUndoStack((prev) => [...prev, note.strokes]);
    setRedoStack([]);

    const currentPage = note.document?.currentPage || 1;
    const pageStrokes = {
      ...(note.pageStrokes || {}),
      [currentPage]: newStrokes,
    };

    const updatedNote: Note = {
      ...note,
      strokes: newStrokes,
      pageStrokes,
    };
    setNote(updatedNote);
    triggerAutoSave(updatedNote);
  };

  /**
   * Manejo de imágenes insertadas
   */
  const handleImagesChange = (newImages: NoteImage[]) => {
    const updatedNote: Note = {
      ...note,
      images: newImages,
    };
    setNote(updatedNote);
    triggerAutoSave(updatedNote);
  };

  /**
   * Manejo de bloques de texto y checklists
   */
  const handleTextBlocksChange = (newBlocks: NoteTextBlock[]) => {
    const updatedNote: Note = {
      ...note,
      textBlocks: newBlocks,
    };
    setNote(updatedNote);
    triggerAutoSave(updatedNote);
  };

  /**
   * Insertar bloque de texto desde la barra
   */
  const handleAddTextBlock = (type: 'text' | 'checklist') => {
    canvasRef.current?.addTextBlock(type);
  };

  /**
   * Insertar imagen desde archivo o portapapeles
   */
  const handleInsertImage = async (file: File) => {
    try {
      const newImg = await processImageFile(file, 120, 160);
      const updatedImages = [...(note.images || []), newImg];
      handleImagesChange(updatedImages);
    } catch (err) {
      console.error('Error al insertar imagen:', err);
    }
  };

  /**
   * Adjuntar documento PDF / DOCX / XLSX
   */
  const handleAttachDocument = async (file: File) => {
    try {
      const docData = await processDocumentFile(file);
      const updatedNote: Note = {
        ...note,
        document: docData,
        title: note.title === 'Nueva Nota' ? file.name.replace(/\.[^/.]+$/, '') : note.title,
      };
      setNote(updatedNote);
      triggerAutoSave(updatedNote);
    } catch (err: unknown) {
      alert((err as Error).message || 'Error al cargar el documento.');
    }
  };

  /**
   * Navegación entre páginas del documento anotado
   */
  const handlePageChange = (newPage: number) => {
    if (!note.document) return;

    const oldPage = note.document.currentPage;
    const updatedPageStrokes = {
      ...(note.pageStrokes || {}),
      [oldPage]: note.strokes,
    };

    const newPageStrokes = updatedPageStrokes[newPage] || [];

    const updatedDoc: DocumentData = {
      ...note.document,
      currentPage: newPage,
    };

    const updatedNote: Note = {
      ...note,
      document: updatedDoc,
      strokes: newPageStrokes,
      pageStrokes: updatedPageStrokes,
    };

    setNote(updatedNote);
    setUndoStack([]);
    setRedoStack([]);
    triggerAutoSave(updatedNote);
  };

  const handleNumPagesDiscovered = (numPages: number) => {
    if (note.document && note.document.numPages !== numPages) {
      const updatedDoc: DocumentData = {
        ...note.document,
        numPages,
      };
      const updatedNote = { ...note, document: updatedDoc };
      setNote(updatedNote);
      triggerAutoSave(updatedNote);
    }
  };

  const handleRemoveDocument = () => {
    if (window.confirm('¿Deseas desvincular el documento adjunto?')) {
      const updatedNote: Note = {
        ...note,
        document: undefined,
      };
      setNote(updatedNote);
      triggerAutoSave(updatedNote);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    const updatedNote = { ...note, title: newTitle };
    setNote(updatedNote);
    triggerAutoSave(updatedNote);
  };

  const handleBackgroundChange = (template: BackgroundTemplate) => {
    const updatedNote = { ...note, backgroundTemplate: template };
    setNote(updatedNote);
    triggerAutoSave(updatedNote);
  };

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousStrokes = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, note.strokes]);

    const currentPage = note.document?.currentPage || 1;
    const pageStrokes = {
      ...(note.pageStrokes || {}),
      [currentPage]: previousStrokes,
    };

    const updatedNote = {
      ...note,
      strokes: previousStrokes,
      pageStrokes,
    };
    setNote(updatedNote);
    triggerAutoSave(updatedNote);
  }, [undoStack, note, triggerAutoSave]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextStrokes = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, note.strokes]);

    const currentPage = note.document?.currentPage || 1;
    const pageStrokes = {
      ...(note.pageStrokes || {}),
      [currentPage]: nextStrokes,
    };

    const updatedNote = {
      ...note,
      strokes: nextStrokes,
      pageStrokes,
    };
    setNote(updatedNote);
    triggerAutoSave(updatedNote);
  }, [redoStack, note, triggerAutoSave]);

  const handleClear = () => {
    if (note.strokes.length === 0) return;
    if (window.confirm('¿Deseas borrar todos los trazos de esta página?')) {
      handleStrokesChange([]);
    }
  };

  const handleExportPng = async () => {
    const dims = canvasRef.current?.getDimensions() || { width: 900, height: 1200 };
    await exportNoteAsImage(note, dims.width, dims.height);
  };

  const handleExportPdf = async () => {
    const dims = canvasRef.current?.getDimensions() || { width: 900, height: 1200 };
    await exportNoteAsPdf(note, dims.width, dims.height);
  };

  const handleBack = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const thumbnail = canvasRef.current?.generateThumbnail(320, 220);
    const finalNote: Note = {
      ...noteRef.current,
      thumbnail: thumbnail || noteRef.current.thumbnail,
      updatedAt: Date.now(),
    };
    await saveNote(finalNote);
    onNoteUpdated?.(finalNote);
    onBack();
  };

  /**
   * Atajos de teclado y pegado
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            await handleInsertImage(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [note]);

  return (
    <div className="flex flex-col h-full w-full bg-ios-bg select-none overflow-hidden">
      <Toolbar
        noteTitle={note.title}
        onTitleChange={handleTitleChange}
        onBack={handleBack}
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        currentSize={currentSize}
        onSizeChange={setCurrentSize}
        eraserMode={eraserMode}
        onEraserModeChange={setEraserMode}
        backgroundTemplate={note.backgroundTemplate}
        onBackgroundChange={handleBackgroundChange}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
        onInsertImage={handleInsertImage}
        onAttachDocument={handleAttachDocument}
        onAddTextBlock={handleAddTextBlock}
        documentData={note.document}
        onPageChange={handlePageChange}
        onRemoveDocument={handleRemoveDocument}
        isSaving={isSaving}
      />

      <main className="flex-1 relative w-full h-full overflow-hidden">
        <CanvasEngine
          ref={canvasRef}
          strokes={note.strokes}
          onStrokesChange={handleStrokesChange}
          currentTool={currentTool}
          currentColor={currentColor}
          currentSize={currentSize}
          eraserMode={eraserMode}
          backgroundTemplate={note.backgroundTemplate}
          documentData={note.document}
          onPageChange={handlePageChange}
          onNumPagesDiscovered={handleNumPagesDiscovered}
          images={note.images || []}
          onImagesChange={handleImagesChange}
          textBlocks={note.textBlocks || []}
          onTextBlocksChange={handleTextBlocksChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </main>
    </div>
  );
};
