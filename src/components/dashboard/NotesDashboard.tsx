import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
} from 'lucide-react';
import { Folder, Note } from '../../types';
import { NoteCard } from './NoteCard';

interface NotesDashboardProps {
  notes: Note[];
  folders: Folder[];
  activeFolderId: string;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePinNote?: (id: string) => void;
}

export const NotesDashboard: React.FC<NotesDashboardProps> = ({
  notes,
  folders,
  activeFolderId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePinNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const activeFolder = folders.find((f) => f.id === activeFolderId);

  // Filtrar notas por carpeta y término de búsqueda
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => !note.isTrash)
      .filter((note) => {
        if (activeFolderId === 'all') return true;
        if (activeFolderId === 'pinned') return note.isPinned;
        return note.folderId === activeFolderId;
      })
      .filter((note) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesTitle = (note.title || '').toLowerCase().includes(q);
        const matchesText = (note.textBlocks || []).some(
          (b) =>
            (b.content || '').toLowerCase().includes(q) ||
            (b.items || []).some((i) => i.text.toLowerCase().includes(q))
        );
        return matchesTitle || matchesText;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
      });
  }, [notes, activeFolderId, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-ios-bg dark:bg-ios-darkBg text-ios-text dark:text-ios-darkText font-sans transition-colors">
      {/* 1. Barra Superior del Dashboard */}
      <header className="sticky top-0 z-30 px-6 py-4 bg-ios-bg/90 dark:bg-ios-darkBg/90 backdrop-blur-md border-b border-ios-border/60 dark:border-ios-darkBorder/60 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ios-text dark:text-ios-darkText">
            {activeFolderId === 'all'
              ? 'Todas las Notas'
              : activeFolderId === 'pinned'
              ? '📌 Fijadas'
              : activeFolder?.name || 'Notas'}
          </h1>
          <p className="text-xs text-ios-textTertiary dark:text-ios-darkTextTertiary mt-0.5">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'nota' : 'notas'} disponibles
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-textTertiary"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar apuntes..."
              className="pl-8 pr-3 py-1.5 bg-ios-card dark:bg-ios-darkCard text-xs rounded-xl border border-ios-borderSubtle dark:border-ios-darkBorderSubtle outline-none focus:ring-1 focus:ring-ios-yellow w-40 sm:w-60 text-ios-text dark:text-ios-darkText placeholder-ios-textTertiary"
            />
          </div>

          {/* Botón Nueva Nota */}
          <button
            type="button"
            onClick={onCreateNote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-ios-yellow hover:bg-ios-yellowHover text-white text-xs font-bold rounded-xl shadow-ios transition-all active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva Nota</span>
          </button>
        </div>
      </header>

      {/* 2. Cuadrícula de Notas */}
      <main className="flex-1 p-6">
        {filteredNotes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-ios-textTertiary dark:text-ios-darkTextTertiary">
            <div className="w-12 h-12 rounded-2xl bg-ios-card dark:bg-ios-darkCard border border-ios-border dark:border-ios-darkBorder flex items-center justify-center mb-3">
              <Plus size={20} className="text-ios-yellow" />
            </div>
            <p className="text-sm font-semibold text-ios-textSecondary dark:text-ios-darkTextSecondary">
              No hay notas en esta sección
            </p>
            <p className="text-xs mt-1">Pulsa en "Nueva Nota" para crear tu primer apunte escolar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                folders={folders}
                onClick={() => onSelectNote(note)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                }}
                onTogglePin={(e) => {
                  e.stopPropagation();
                  onTogglePinNote?.(note.id);
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
