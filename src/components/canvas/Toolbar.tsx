import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  PenTool,
  Pencil,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Grid,
  Download,
  Trash2,
  Check,
  Sparkles,
  Image as ImageIcon,
  Paperclip,
  ChevronRight as NextPageIcon,
  ChevronLeft as PrevPageIcon,
  FileText,
  FileCode,
  Type,
  ListTodo,
} from 'lucide-react';
import { ToolType, EraserMode, BackgroundTemplate, DocumentData } from '../../types';

interface ToolbarProps {
  noteTitle: string;
  onTitleChange: (newTitle: string) => void;
  onBack: () => void;
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  currentSize: number;
  onSizeChange: (size: number) => void;
  eraserMode: EraserMode;
  onEraserModeChange: (mode: EraserMode) => void;
  backgroundTemplate: BackgroundTemplate;
  onBackgroundChange: (template: BackgroundTemplate) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onInsertImage: (file: File) => void;
  onAttachDocument: (file: File) => void;
  onAddTextBlock: (type: 'text' | 'checklist') => void;
  documentData?: DocumentData;
  onPageChange?: (newPage: number) => void;
  onRemoveDocument?: () => void;
  isSaving?: boolean;
}

const IOS_COLORS = [
  { name: 'Tinta Negra', hex: '#1C1C1E' },
  { name: 'Azul Apple', hex: '#007AFF' },
  { name: 'Rojo Carmesí', hex: '#FF3B30' },
  { name: 'Verde Hoja', hex: '#34C759' },
  { name: 'Ámbar Notas', hex: '#E4A11B' },
  { name: 'Púrpura', hex: '#AF52DE' },
];

const STROKE_SIZES = [
  { label: 'Fino', size: 2 },
  { label: 'Medio', size: 4 },
  { label: 'Grueso', size: 8 },
  { label: 'Marcador', size: 16 },
];

const BG_TEMPLATES: { id: BackgroundTemplate; label: string; desc: string }[] = [
  { id: 'BLANK', label: 'Blanco', desc: 'Lienzo libre limpio' },
  { id: 'RULED', label: 'Rayas', desc: 'Líneas guía tipo cuaderno' },
  { id: 'GRID', label: 'Cuadrícula', desc: 'Malla milimétrica precisa' },
  { id: 'DOTS', label: 'Puntos', desc: 'Matriz bullet journal' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  noteTitle,
  onTitleChange,
  onBack,
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  currentSize,
  onSizeChange,
  eraserMode,
  onEraserModeChange,
  backgroundTemplate,
  onBackgroundChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onExportPng,
  onExportPdf,
  onInsertImage,
  onAttachDocument,
  onAddTextBlock,
  documentData,
  onPageChange,
  onRemoveDocument,
  isSaving = false,
}) => {
  const [showBgDropdown, setShowBgDropdown] = useState(false);
  const [showEraserOptions, setShowEraserOptions] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onInsertImage(file);
      e.target.value = '';
    }
  };

  const handleDocFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachDocument(file);
      e.target.value = '';
    }
  };

  return (
    <header className="w-full bg-ios-card/95 backdrop-blur-md border-b border-ios-border px-3 py-2 flex flex-col gap-2 z-30 shadow-ios-sm select-none">
      {/* Inputs ocultos para carga de archivos */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        onChange={handleImageFileSelected}
        className="hidden"
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf, .docx, .xlsx, .xls, .csv"
        onChange={handleDocFileSelected}
        className="hidden"
      />

      {/* Fila 1: Navegación, Título, Paginación de PDF y Acciones Principales */}
      <div className="flex items-center justify-between gap-2">
        {/* Lado izquierdo: Botón volver + Título editable */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-ios-yellow hover:text-ios-yellowHover font-medium px-2 py-1.5 rounded-lg hover:bg-ios-yellowLight/50 transition-colors active:scale-95"
            title="Volver a todas las notas"
          >
            <ChevronLeft size={20} className="stroke-[2.5]" />
            <span className="text-sm font-semibold hidden sm:inline">Notas</span>
          </button>

          <div className="h-5 w-[1px] bg-ios-border" />

          {isEditingTitle ? (
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              className="text-base font-semibold text-ios-text bg-ios-bg px-2 py-0.5 rounded-md border border-ios-yellow outline-none max-w-[160px] sm:max-w-[280px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-left font-semibold text-ios-text hover:text-ios-yellow truncate max-w-[150px] sm:max-w-[280px] px-1.5 py-0.5 rounded hover:bg-ios-gray6 transition-colors"
              title="Haz clic para renombrar"
            >
              <span className="truncate">{noteTitle || 'Sin título'}</span>
            </button>
          )}

          <span className="text-xs text-ios-textSecondary ml-1 hidden md:flex items-center gap-1">
            {isSaving ? (
              <span className="inline-block w-2 h-2 rounded-full bg-ios-yellow animate-pulse" />
            ) : (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-ios-green" />
            )}
            {isSaving ? 'Guardando...' : 'Guardado'}
          </span>
        </div>

        {/* Paginación de documento */}
        {documentData && documentData.type === 'pdf' && documentData.numPages > 1 && (
          <div className="flex items-center bg-ios-gray6 px-2 py-1 rounded-xl border border-ios-borderSubtle gap-1.5 shadow-2xs">
            <button
              onClick={() => onPageChange?.(Math.max(1, documentData.currentPage - 1))}
              disabled={documentData.currentPage <= 1}
              className="p-1 rounded text-ios-text hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="Página anterior"
            >
              <PrevPageIcon size={14} />
            </button>
            <span className="text-xs font-semibold text-ios-text">
              Pág. {documentData.currentPage} de {documentData.numPages}
            </span>
            <button
              onClick={() => onPageChange?.(Math.min(documentData.numPages, documentData.currentPage + 1))}
              disabled={documentData.currentPage >= documentData.numPages}
              className="p-1 rounded text-ios-text hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
              title="Página siguiente"
            >
              <NextPageIcon size={14} />
            </button>
            {onRemoveDocument && (
              <button
                onClick={onRemoveDocument}
                className="text-[10px] text-ios-red hover:underline ml-1"
                title="Quitar PDF"
              >
                Quitar
              </button>
            )}
          </div>
        )}

        {/* Lado derecho: Deshacer/Rehacer, Fondos, Texto, Checklist, Adjuntos y Exportar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Deshacer / Rehacer */}
          <div className="flex items-center bg-ios-gray6 rounded-lg p-0.5 border border-ios-borderSubtle">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-all ${
                canUndo
                  ? 'text-ios-text hover:bg-ios-card hover:shadow-xs active:scale-90'
                  : 'text-ios-gray3 cursor-not-allowed'
              }`}
              title="Deshacer trazo (Ctrl+Z o Tap con 2 dedos)"
            >
              <Undo2 size={17} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-all ${
                canRedo
                  ? 'text-ios-text hover:bg-ios-card hover:shadow-xs active:scale-90'
                  : 'text-ios-gray3 cursor-not-allowed'
              }`}
              title="Rehacer trazo (Ctrl+Y o Tap con 3 dedos)"
            >
              <Redo2 size={17} />
            </button>
          </div>

          {/* Selector de Plantilla de Fondo */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBgDropdown(!showBgDropdown);
                setShowEraserOptions(false);
                setShowExportMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                showBgDropdown
                  ? 'bg-ios-yellow text-white border-ios-yellow shadow-sm'
                  : 'bg-ios-gray6 text-ios-text hover:bg-ios-gray5 border-ios-borderSubtle'
              }`}
              title="Cambiar plantilla de fondo"
            >
              <Grid size={15} />
              <span className="hidden sm:inline capitalize">
                {BG_TEMPLATES.find((t) => t.id === backgroundTemplate)?.label}
              </span>
            </button>

            {showBgDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 bg-ios-card rounded-ios-lg shadow-ios-floating border border-ios-border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ios-textTertiary">
                  Plantilla de Fondo
                </div>
                <div className="flex flex-col gap-1">
                  {BG_TEMPLATES.map((item) => {
                    const isSelected = backgroundTemplate === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onBackgroundChange(item.id);
                          setShowBgDropdown(false);
                        }}
                        className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-ios-yellowLight text-ios-yellow font-semibold'
                            : 'hover:bg-ios-gray6 text-ios-text'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-ios-text">{item.label}</div>
                          <div className="text-[11px] text-ios-textSecondary">{item.desc}</div>
                        </div>
                        {isSelected && <Check size={14} className="text-ios-yellow" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botones de Bloques: Texto y Checklist */}
          <div className="hidden sm:flex items-center bg-ios-gray6 p-0.5 rounded-lg border border-ios-borderSubtle gap-0.5">
            <button
              onClick={() => onAddTextBlock('text')}
              className="p-1.5 text-ios-text hover:text-ios-yellow hover:bg-ios-card rounded-md transition-all"
              title="Añadir bloque de texto"
            >
              <Type size={16} />
            </button>
            <button
              onClick={() => onAddTextBlock('checklist')}
              className="p-1.5 text-ios-text hover:text-ios-yellow hover:bg-ios-card rounded-md transition-all"
              title="Añadir lista de tareas escolar"
            >
              <ListTodo size={16} />
            </button>
          </div>

          {/* Botón Insertar Imagen */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-1.5 text-ios-text hover:text-ios-yellow bg-ios-gray6 hover:bg-ios-gray5 rounded-lg border border-ios-borderSubtle transition-all active:scale-95"
            title="Insertar imagen / sticker"
          >
            <ImageIcon size={17} />
          </button>

          {/* Botón Adjuntar / Anotar Documento */}
          <button
            onClick={() => docInputRef.current?.click()}
            className={`p-1.5 rounded-lg border border-ios-borderSubtle transition-all active:scale-95 ${
              documentData && documentData.type !== 'none'
                ? 'bg-ios-yellow text-white shadow-sm'
                : 'text-ios-text hover:text-ios-yellow bg-ios-gray6 hover:bg-ios-gray5'
            }`}
            title="Adjuntar y Anotar Documento (PDF, DOCX, XLSX, CSV)"
          >
            <Paperclip size={17} />
          </button>

          {/* Menú de Exportación */}
          <div className="relative">
            <button
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowBgDropdown(false);
                setShowEraserOptions(false);
              }}
              className="flex items-center gap-1 p-1.5 text-ios-text hover:text-ios-yellow bg-ios-gray6 hover:bg-ios-gray5 rounded-lg border border-ios-borderSubtle transition-all active:scale-95"
              title="Exportar Nota"
            >
              <Download size={17} />
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-ios-card rounded-ios shadow-ios-floating border border-ios-border p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[11px] font-semibold text-ios-textTertiary uppercase">
                  Opciones de Exportación
                </div>
                <button
                  onClick={() => {
                    onExportPng();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-ios-text hover:bg-ios-gray6"
                >
                  <FileCode size={15} className="text-ios-yellow" />
                  <span>Exportar como Imagen PNG</span>
                </button>
                <button
                  onClick={() => {
                    onExportPdf();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-ios-text hover:bg-ios-gray6"
                >
                  <FileText size={15} className="text-ios-red" />
                  <span>Exportar como PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Limpiar lienzo */}
          <button
            onClick={onClear}
            className="p-1.5 text-ios-textSecondary hover:text-ios-red bg-ios-gray6 hover:bg-red-50 rounded-lg border border-ios-borderSubtle transition-all active:scale-95"
            title="Borrar todos los trazos"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* Fila 2: Paleta de Herramientas de Tinta Vectorial */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
        <div className="flex items-center bg-ios-gray6 p-1 rounded-xl border border-ios-borderSubtle gap-1 shrink-0">
          <button
            onClick={() => {
              onToolChange('pen');
              setShowEraserOptions(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'pen'
                ? 'bg-ios-card text-ios-text shadow-ios-sm font-semibold'
                : 'text-ios-textSecondary hover:text-ios-text'
            }`}
            title="Bolígrafo de tinta estilizada"
          >
            <PenTool size={15} style={{ color: currentTool === 'pen' ? currentColor : undefined }} />
            <span>Tinta</span>
          </button>

          <button
            onClick={() => {
              onToolChange('pencil');
              setShowEraserOptions(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'pencil'
                ? 'bg-ios-card text-ios-text shadow-ios-sm font-semibold'
                : 'text-ios-textSecondary hover:text-ios-text'
            }`}
            title="Lápiz de grafito texturizado"
          >
            <Pencil size={15} style={{ color: currentTool === 'pencil' ? currentColor : undefined }} />
            <span>Lápiz</span>
          </button>

          <button
            onClick={() => {
              onToolChange('highlighter');
              setShowEraserOptions(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTool === 'highlighter'
                ? 'bg-ios-card text-ios-text shadow-ios-sm font-semibold'
                : 'text-ios-textSecondary hover:text-ios-text'
            }`}
            title="Resaltador / Subrayador"
          >
            <Highlighter size={15} className="text-yellow-500" />
            <span>Subrayador</span>
          </button>

          <div className="relative">
            <button
              onClick={() => {
                if (currentTool === 'eraser') {
                  setShowEraserOptions(!showEraserOptions);
                } else {
                  onToolChange('eraser');
                  setShowEraserOptions(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTool === 'eraser'
                  ? 'bg-ios-card text-ios-text shadow-ios-sm font-semibold'
                  : 'text-ios-textSecondary hover:text-ios-text'
              }`}
            >
              <Eraser size={15} className="text-red-400" />
              <span>Borrador</span>
              <span className="text-[10px] bg-ios-gray5 text-ios-textSecondary px-1 rounded uppercase">
                {eraserMode === 'stroke' ? 'Trazo' : 'Píxel'}
              </span>
            </button>

            {showEraserOptions && (
              <div
                className="absolute left-0 mt-2 w-48 bg-ios-card rounded-ios shadow-ios-floating border border-ios-border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[11px] font-semibold text-ios-textTertiary uppercase">
                  Modo de Borrado
                </div>
                <button
                  onClick={() => {
                    onEraserModeChange('stroke');
                    setShowEraserOptions(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                    eraserMode === 'stroke' ? 'bg-ios-yellowLight text-ios-yellow font-semibold' : 'hover:bg-ios-gray6'
                  }`}
                >
                  <span>Borrador de Trazo Completo</span>
                  {eraserMode === 'stroke' && <Check size={13} />}
                </button>
                <button
                  onClick={() => {
                    onEraserModeChange('pixel');
                    setShowEraserOptions(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                    eraserMode === 'pixel' ? 'bg-ios-yellowLight text-ios-yellow font-semibold' : 'hover:bg-ios-gray6'
                  }`}
                >
                  <span>Borrador de Píxel</span>
                  {eraserMode === 'pixel' && <Check size={13} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Paleta de Colores iOS */}
        {currentTool !== 'eraser' && (
          <div className="flex items-center gap-1.5 bg-ios-gray6 p-1 rounded-xl border border-ios-borderSubtle shrink-0">
            {IOS_COLORS.map((c) => {
              const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  onClick={() => onColorChange(c.hex)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-ios-yellow ring-offset-2 scale-110' : 'hover:scale-105 active:scale-95'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && (
                    <span className={`w-1.5 h-1.5 rounded-full ${c.hex === '#1C1C1E' ? 'bg-white' : 'bg-black/40'}`} />
                  )}
                </button>
              );
            })}

            <label
              className="w-6 h-6 rounded-full border border-ios-gray4 bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 cursor-pointer flex items-center justify-center hover:scale-105 transition-transform"
              title="Elegir color personalizado"
            >
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="opacity-0 w-0 h-0 absolute"
              />
              <Sparkles size={11} className="text-white drop-shadow-sm" />
            </label>
          </div>
        )}

        {/* Selector de Grosor */}
        <div className="flex items-center gap-1 bg-ios-gray6 p-1 rounded-xl border border-ios-borderSubtle shrink-0">
          {STROKE_SIZES.map((s) => {
            const isSelected = currentSize === s.size;
            return (
              <button
                key={s.size}
                onClick={() => onSizeChange(s.size)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                  isSelected
                    ? 'bg-ios-card text-ios-text shadow-ios-sm font-semibold'
                    : 'text-ios-textSecondary hover:text-ios-text'
                }`}
                title={`Grosor: ${s.label} (${s.size}px)`}
              >
                <span
                  className="rounded-full bg-ios-text inline-block"
                  style={{
                    width: `${Math.min(12, Math.max(3, s.size * 0.9))}px`,
                    height: `${Math.min(12, Math.max(3, s.size * 0.9))}px`,
                  }}
                />
                <span className="hidden sm:inline text-[11px]">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
