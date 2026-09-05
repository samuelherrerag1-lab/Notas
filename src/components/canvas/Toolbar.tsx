import React from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Type,
  ListTodo,
  Image as ImageIcon,
  FileText,
  RotateCcw,
  RotateCw,
  Sun,
  Moon,
} from 'lucide-react';
import { BackgroundTemplate, ToolType, ViewportTransform } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  currentSize: number;
  onSizeChange: (size: number) => void;
  backgroundTemplate: BackgroundTemplate;
  onBackgroundChange: (template: BackgroundTemplate) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onInsertImage?: (dataUrl: string) => void;
  onInsertDocument?: () => void;
  onAddTextBlock?: () => void;
  onAddChecklist?: () => void;
  viewportTransform?: ViewportTransform;
  onResetZoom?: () => void;
}

const PALETTE_COLORS = [
  '#1C1C1E', // Tinta negra estándar
  '#007AFF', // Azul Apple
  '#34C759', // Verde
  '#FF3B30', // Rojo
  '#E4A11B', // Ámbar Notas
  '#AF52DE', // Púrpura
  '#FF9500', // Naranja
  '#5856D6', // Índigo
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  currentSize,
  onSizeChange,
  backgroundTemplate,
  onBackgroundChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onInsertImage,
  onInsertDocument,
  onAddTextBlock,
  onAddChecklist,
  viewportTransform = { scale: 1, x: 0, y: 0 },
  onResetZoom,
}) => {
  const { toggleTheme, isDark } = useTheme();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onInsertImage) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onInsertImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 bg-ios-card/90 dark:bg-ios-darkCard/90 backdrop-blur-xl border border-ios-border/80 dark:border-ios-darkBorder/80 rounded-2xl shadow-ios-floating select-none text-ios-text dark:text-ios-darkText animate-in slide-in-from-bottom-4 duration-200">
      {/* 1. Herramientas de Dibujo */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToolChange('pen')}
          className={`p-2 rounded-xl transition-all ${
            currentTool === 'pen'
              ? 'bg-ios-yellow text-white shadow-ios'
              : 'hover:bg-ios-gray6 dark:hover:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary'
          }`}
          title="Bolígrafo fino"
        >
          <Pen size={18} />
        </button>

        <button
          type="button"
          onClick={() => onToolChange('highlighter')}
          className={`p-2 rounded-xl transition-all ${
            currentTool === 'highlighter'
              ? 'bg-ios-yellow text-white shadow-ios'
              : 'hover:bg-ios-gray6 dark:hover:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary'
          }`}
          title="Subrayador"
        >
          <Highlighter size={18} />
        </button>

        <button
          type="button"
          onClick={() => onToolChange('eraser')}
          className={`p-2 rounded-xl transition-all ${
            currentTool === 'eraser'
              ? 'bg-ios-yellow text-white shadow-ios'
              : 'hover:bg-ios-gray6 dark:hover:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary'
          }`}
          title="Borrador"
        >
          <Eraser size={18} />
        </button>
      </div>

      <div className="h-6 w-[1px] bg-ios-border dark:bg-ios-darkBorder mx-1" />

      {/* 2. Herramientas de Texto y Tareas */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onAddTextBlock?.()}
          className="p-2 rounded-xl hover:bg-ios-gray6 dark:hover:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary transition-all"
          title="Añadir texto mecanografiado"
        >
          <Type size={18} />
        </button>

        <button
          type="button"
          onClick={() => onAddChecklist?.()}
          className="p-2 rounded-xl hover:bg-ios-gray6 dark:hover:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary transition-all"
          title="Añadir lista de tareas"
        >
          <ListTodo size={18} />
        </button>
      </div>

      <div className="h-6 w-[1px] bg-ios-border dark:bg-ios-darkBorder mx-1" />

      {/* 3. Inserción de Medios (Imágenes y Documentos) */}
      <div className="flex items-center gap-1">
        <label
          className="p-2 rounded-xl hover:bg-ios-gray6 dark:hover:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary cursor-pointer transition-all"
          title="Insertar imagen"
        >
          <ImageIcon size={18} />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        {onInsertDocument && (
          <button
            type="button"
            onClick={onInsertDocument}
            className="p-2 rounded-xl hover:bg-ios-gray6 dark:hover:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary transition-all"
            title="Importar documento (PDF, DOCX, XLSX)"
          >
            <FileText size={18} />
          </button>
        )}
      </div>

      <div className="h-6 w-[1px] bg-ios-border dark:bg-ios-darkBorder mx-1" />

      {/* 4. Selector de Plantilla de Fondo */}
      <div className="flex items-center gap-1">
        <select
          value={backgroundTemplate}
          onChange={(e) => onBackgroundChange(e.target.value as BackgroundTemplate)}
          className="bg-ios-gray6 dark:bg-ios-darkBg text-xs font-medium text-ios-text dark:text-ios-darkText border border-ios-borderSubtle dark:border-ios-darkBorderSubtle rounded-xl px-2 py-1.5 outline-none cursor-pointer"
          title="Plantilla de fondo"
        >
          <option value="BLANK">Liso</option>
          <option value="RULED">Cuaderno</option>
          <option value="GRID">Cuadrícula</option>
          <option value="DOTS">Puntos</option>
        </select>
      </div>

      <div className="h-6 w-[1px] bg-ios-border dark:bg-ios-darkBorder mx-1" />

      {/* 5. Selector de Color y Grosor */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1">
          {PALETTE_COLORS.slice(0, 5).map((color) => {
            const isSelected = currentColor === color;
            const displayColor = color === '#1C1C1E' && isDark ? '#F2F2F7' : color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  isSelected ? 'ring-2 ring-ios-yellow scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: displayColor }}
              />
            );
          })}
        </div>

        {/* Selector de grosor */}
        <input
          type="range"
          min="2"
          max="24"
          value={currentSize}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-16 accent-ios-yellow cursor-pointer"
          title={`Grosor: ${currentSize}px`}
        />
      </div>

      <div className="h-6 w-[1px] bg-ios-border dark:bg-ios-darkBorder mx-1" />

      {/* 6. Deshacer / Rehacer */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl hover:bg-ios-gray6 dark:hover:bg-ios-darkBg disabled:opacity-30 text-ios-textSecondary dark:text-ios-darkTextSecondary transition-all"
          title="Deshacer (2 dedos tap)"
        >
          <RotateCcw size={16} />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl hover:bg-ios-gray6 dark:hover:bg-ios-darkBg disabled:opacity-30 text-ios-textSecondary dark:text-ios-darkTextSecondary transition-all"
          title="Rehacer (3 dedos tap)"
        >
          <RotateCw size={16} />
        </button>
      </div>

      <div className="h-6 w-[1px] bg-ios-border dark:bg-ios-darkBorder mx-1" />

      {/* 7. Zoom Reset & Toggle Modo Oscuro / Claro */}
      <div className="flex items-center gap-1">
        {onResetZoom && (
          <button
            type="button"
            onClick={onResetZoom}
            className="px-2 py-1 rounded-lg text-xs font-semibold bg-ios-gray6 dark:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary hover:text-ios-text dark:hover:text-ios-darkText transition-colors"
            title="Restablecer zoom a 100%"
          >
            {Math.round(viewportTransform.scale * 100)}%
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-ios-gray6 dark:hover:bg-ios-darkBg text-ios-textSecondary dark:text-ios-darkTextSecondary transition-all"
          title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {isDark ? <Sun size={17} className="text-ios-yellow" /> : <Moon size={17} />}
        </button>
      </div>
    </div>
  );
};
