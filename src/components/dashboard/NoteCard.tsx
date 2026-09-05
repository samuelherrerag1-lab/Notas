import React, { useState } from 'react';
import {
  Pin,
  MoreVertical,
  Copy,
  Trash2,
  RotateCcw,
  Grid,
  Edit3,
  FileText,
  Image as ImageIcon,
  FolderInput,
  ListTodo,
} from 'lucide-react';
import { Note, BackgroundTemplate, Folder } from '../../types';
import { formatTimestamp, truncateText } from '../../utils/formatters';

interface NoteCardProps {
  note: Note;
  folders?: Folder[];
  onOpen: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onDuplicate: (noteId: string) => void;
  onDelete: (noteId: string, permanent?: boolean) => void;
  onRestore?: (noteId: string) => void;
  onMoveFolder?: (noteId: string, folderId: string) => void;
  isTrashView?: boolean;
}

const TEMPLATE_NAMES: Record<BackgroundTemplate, string> = {
  BLANK: 'Blanco',
  RULED: 'Rayas',
  GRID: 'Cuadrícula',
  DOTS: 'Puntos',
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  folders = [],
  onOpen,
  onTogglePin,
  onDuplicate,
  onDelete,
  onRestore,
  onMoveFolder,
  isTrashView = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);

  const customFolders = folders.filter((f) => !f.isSystem && f.id !== 'all');

  return (
    <div
      onClick={() => onOpen(note.id)}
      className="group relative bg-ios-card rounded-ios-lg border border-ios-border overflow-hidden shadow-ios-card hover:shadow-ios-card-hover transition-all duration-200 cursor-pointer flex flex-col hover:-translate-y-0.5 active:scale-[0.99] select-none"
    >
      {/* Contenedor de Miniatura Visual del Lienzo */}
      <div className="relative w-full h-36 sm:h-40 bg-[#FCFCFD] border-b border-ios-borderSubtle overflow-hidden flex items-center justify-center">
        {note.thumbnail ? (
          <img
            src={note.thumbnail}
            alt={note.title}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ios-textTertiary gap-2 p-4 text-center">
            <Edit3 size={24} className="opacity-40" />
            <span className="text-xs font-medium opacity-60">Lienzo en blanco</span>
          </div>
        )}

        {/* Badges de Plantilla, Documento, Checklist e Imágenes */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 flex-wrap">
          <div className="px-2 py-0.5 rounded-md bg-white/85 backdrop-blur-xs border border-ios-borderSubtle text-[10px] font-medium text-ios-textSecondary flex items-center gap-1 shadow-2xs">
            <Grid size={10} />
            <span>{TEMPLATE_NAMES[note.backgroundTemplate] || 'Rayas'}</span>
          </div>

          {note.document && (
            <div className="px-2 py-0.5 rounded-md bg-ios-yellow text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs">
              <FileText size={10} />
              <span className="uppercase">{note.document.type}</span>
            </div>
          )}

          {note.textBlocks && note.textBlocks.some((b) => b.type === 'checklist') && (
            <div className="px-1.5 py-0.5 rounded-md bg-white/85 backdrop-blur-xs border border-ios-borderSubtle text-[10px] font-medium text-ios-textSecondary flex items-center gap-1 shadow-2xs">
              <ListTodo size={10} className="text-ios-yellow" />
              <span>Tareas</span>
            </div>
          )}

          {note.images && note.images.length > 0 && (
            <div className="px-1.5 py-0.5 rounded-md bg-white/85 backdrop-blur-xs border border-ios-borderSubtle text-[10px] font-medium text-ios-textSecondary flex items-center gap-1 shadow-2xs">
              <ImageIcon size={10} />
              <span>{note.images.length}</span>
            </div>
          )}
        </div>

        {/* Botón de Fijar Nota (Pin) */}
        {!isTrashView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all shadow-sm ${
              note.isPinned
                ? 'bg-ios-yellow text-white opacity-100 scale-100'
                : 'bg-white/80 backdrop-blur-xs text-ios-textSecondary opacity-0 group-hover:opacity-100 hover:text-ios-yellow hover:scale-110'
            }`}
            title={note.isPinned ? 'Desfijar nota' : 'Fijar al inicio'}
          >
            <Pin size={13} className={note.isPinned ? 'fill-current' : ''} />
          </button>
        )}
      </div>

      {/* Cuerpo y Metadatos de la Tarjeta */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="text-sm font-bold text-ios-text group-hover:text-ios-yellow transition-colors leading-snug truncate">
              {truncateText(note.title || 'Nueva Nota', 28)}
            </h3>

            {/* Menú contextual */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                  setShowFolderSubmenu(false);
                }}
                className="p-1 rounded-md text-ios-textSecondary hover:text-ios-text hover:bg-ios-gray6 transition-colors"
                title="Más opciones"
              >
                <MoreVertical size={15} />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 bg-ios-card rounded-ios shadow-ios-floating border border-ios-border p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isTrashView ? (
                    <>
                      <button
                        onClick={() => {
                          onRestore?.(note.id);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-ios-text hover:bg-ios-gray6"
                      >
                        <RotateCcw size={13} />
                        <span>Restaurar nota</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(note.id, true);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-ios-red hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar definitivo</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onTogglePin(note.id);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-ios-text hover:bg-ios-gray6"
                      >
                        <Pin size={13} />
                        <span>{note.isPinned ? 'Desfijar' : 'Fijar nota'}</span>
                      </button>

                      <button
                        onClick={() => {
                          onDuplicate(note.id);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-ios-text hover:bg-ios-gray6"
                      >
                        <Copy size={13} />
                        <span>Duplicar nota</span>
                      </button>

                      {/* Mover a Materia / Cuaderno */}
                      {onMoveFolder && customFolders.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={() => setShowFolderSubmenu(!showFolderSubmenu)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-ios-text hover:bg-ios-gray6"
                          >
                            <div className="flex items-center gap-2">
                              <FolderInput size={13} />
                              <span>Mover a materia</span>
                            </div>
                          </button>

                          {showFolderSubmenu && (
                            <div className="mt-1 pl-4 space-y-0.5 border-l border-ios-borderSubtle">
                              {customFolders.map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => {
                                    onMoveFolder(note.id, f.id);
                                    setShowMenu(false);
                                  }}
                                  className="w-full text-left text-[11px] py-1 px-1.5 rounded hover:bg-ios-gray6 truncate flex items-center gap-1.5"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                                  <span className="truncate">{f.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="h-[1px] bg-ios-borderSubtle my-1" />
                      <button
                        onClick={() => {
                          onDelete(note.id, false);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-ios-red hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        <span>Mover a papelera</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-ios-textSecondary mt-0.5 line-clamp-1">
            {note.document
              ? `Documento: ${note.document.fileName}`
              : note.strokes.length > 0
              ? `${note.strokes.length} ${note.strokes.length === 1 ? 'trazo' : 'trazos'}`
              : 'Nota vacía'}
          </p>
        </div>

        {/* Pie de tarjeta con fecha y materia */}
        <div className="flex items-center justify-between pt-2 border-t border-ios-borderSubtle text-[11px] text-ios-textTertiary">
          <span>{formatTimestamp(note.updatedAt)}</span>
          {note.folderId && note.folderId !== 'quick' && (
            <span className="bg-ios-gray5 text-ios-textSecondary px-1.5 py-0.5 rounded text-[10px] font-medium truncate max-w-[110px]">
              {folders.find((f) => f.id === note.folderId)?.name || 'Materia'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
