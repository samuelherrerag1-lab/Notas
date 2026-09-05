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
    <article
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col bg-ios-card dark:bg-[#1C1C1E] border border-ios-border/80 dark:border-white/[0.08] hover:border-ios-yellow/60 dark:hover:border-ios-yellow/60 hover:bg-white dark:hover:bg-[#232326] rounded-2xl p-4 shadow-ios-card hover:shadow-ios-card-hover transition-all duration-200 cursor-pointer select-none min-h-[165px] text-ios-text dark:text-white"
    >
      {/* Cabecera con Título y Pin */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-[15px] text-ios-text dark:text-white group-hover:text-ios-yellow dark:group-hover:text-ios-yellow transition-colors line-clamp-1">
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
                  : 'opacity-0 group-hover:opacity-60 hover:opacity-100 text-ios-textTertiary dark:text-[#6E6E73]'
              }`}
              title={note.isPinned ? 'Desfijar' : 'Fijar nota'}
            >
              <Pin size={14} className={note.isPinned ? 'fill-ios-yellow' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-60 hover:opacity-100 hover:text-ios-red dark:hover:text-ios-red p-1 rounded-lg transition-all text-ios-textTertiary dark:text-[#6E6E73]"
            title="Eliminar nota"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Resumen o Miniatura */}
      <div className="flex-1 text-xs text-ios-textSecondary dark:text-[#A1A1A6] line-clamp-3 mb-3 font-normal leading-relaxed">
        {note.textBlocks && note.textBlocks.length > 0
          ? note.textBlocks
              .map((b) => b.content || (b.items || []).map((i) => i.text).join(', '))
              .filter(Boolean)
              .join(' · ')
          : note.strokes && note.strokes.length > 0
          ? `✏️ Manuscrito (${note.strokes.length} trazos)`
          : note.document && note.document.type !== 'none'
          ? `📄 ${note.document.fileName}`
          : 'Nota vacía'}
      </div>

      {/* Pie con Materia / Carpeta y Fecha */}
      <div className="flex items-center justify-between text-[11px] text-ios-textTertiary dark:text-[#6E6E73] pt-2.5 border-t border-ios-borderSubtle dark:border-white/[0.06] mt-auto">
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

        <span className="flex items-center gap-1 shrink-0 font-medium">
          <Calendar size={11} />
          {formattedDate}
        </span>
      </div>
    </article>
  );
};
