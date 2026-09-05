import React from 'react';
import { Pin, Trash2, Calendar } from 'lucide-react';
import { Folder, Note } from '../../types';

interface NoteCardProps {
  note: Note;
  folders: Folder[];
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin?: (e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  folders,
  onClick,
  onDelete,
  onTogglePin,
}) => {
  const folder = folders.find((f) => f.id === note.folderId);
  const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col bg-ios-card dark:bg-ios-darkCard border border-ios-border/90 dark:border-ios-darkBorder/90 rounded-2xl p-4 shadow-ios-card hover:shadow-ios hover:border-ios-yellow/50 transition-all cursor-pointer select-none min-h-[160px] text-ios-text dark:text-ios-darkText"
    >
      {/* Cabecera con Título y Pin */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-base text-ios-text dark:text-ios-darkText group-hover:text-ios-yellow transition-colors line-clamp-1">
          {note.title || 'Nota sin título'}
        </h3>

        <div className="flex items-center gap-1 shrink-0">
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              className={`p-1 rounded-lg transition-colors ${
                note.isPinned
                  ? 'text-ios-yellow'
                  : 'opacity-0 group-hover:opacity-60 hover:opacity-100 text-ios-textTertiary'
              }`}
              title={note.isPinned ? 'Desfijar' : 'Fijar nota'}
            >
              <Pin size={14} className={note.isPinned ? 'fill-ios-yellow' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-60 hover:opacity-100 hover:text-ios-red p-1 rounded-lg transition-all text-ios-textTertiary"
            title="Eliminar nota"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Resumen o Miniatura */}
      <div className="flex-1 text-xs text-ios-textSecondary dark:text-ios-darkTextSecondary line-clamp-3 mb-3 font-normal leading-relaxed">
        {note.textBlocks && note.textBlocks.length > 0
          ? note.textBlocks
              .map((b) => b.content || (b.items || []).map((i) => i.text).join(', '))
              .filter(Boolean)
              .join(' · ')
          : note.strokes && note.strokes.length > 0
          ? `✏️ Apunte manuscrito (${note.strokes.length} trazos)`
          : note.document && note.document.type !== 'none'
          ? `📄 Documento ${note.document.fileName}`
          : 'Nota vacía'}
      </div>

      {/* Pie con Materia / Carpeta y Fecha */}
      <div className="flex items-center justify-between text-[11px] text-ios-textTertiary dark:text-ios-darkTextTertiary pt-2 border-t border-ios-borderSubtle dark:border-ios-darkBorderSubtle mt-auto">
        <span className="flex items-center gap-1 font-medium truncate max-w-[120px]">
          {folder ? (
            <>
              <span>{folder.icon || '📁'}</span>
              <span className="truncate">{folder.name}</span>
            </>
          ) : (
            '📁 General'
          )}
        </span>

        <span className="flex items-center gap-1 shrink-0 font-semibold">
          <Calendar size={11} />
          {formattedDate}
        </span>
      </div>
    </div>
  );
};
