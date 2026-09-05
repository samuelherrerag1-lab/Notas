import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  BookOpen,
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
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-ios-bg dark:bg-[#121214] text-ios-text dark:text-white font-sans transition-colors">
      {/* 1. Barra Superior del Dashboard */}
      <header className="sticky top-0 z-30 px-6 py-4 bg-ios-bg/85 dark:bg-[#121214]/85 backdrop-blur-xl border-b border-ios-border/60 dark:border-white/[0.08] flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ios-text dark:text-white">
            {activeFolderId === 'all'
              ? 'Todas las Notas'
              : activeFolderId === 'pinned'
              ? '📌 Fijadas'
              : activeFolder?.name || 'Notas'}
          </h1>
          <p className="text-xs text-ios-textTertiary dark:text-[#8E8E93] mt-0.5">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'nota' : 'notas'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-textTertiary dark:text-[#8E8E93]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar apuntes..."
              className="pl-8 pr-3 py-1.5 bg-ios-card dark:bg-[#1C1C1E] text-xs rounded-xl border border-ios-borderSubtle dark:border-white/10 outline-none focus:ring-2 focus:ring-ios-yellow/40 w-40 sm:w-60 text-ios-text dark:text-white placeholder-ios-textTertiary dark:placeholder-[#6E6E73] transition-all"
            />
          </div>

          {/* Botón Nueva Nota */}
          <button
            type="button"
            onClick={onCreateNote}
            className="flex items-center gap-1.5 px-4 py-2 bg-ios-yellow hover:bg-ios-yellowHover text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva Nota</span>
          </button>
        </div>
      </header>

      {/* 2. Cuadrícula de Notas */}
      <main className="flex-1 p-6">
        {filteredNotes.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center text-ios-textTertiary dark:text-[#6E6E73]">
            <div className="w-14 h-14 rounded-2xl bg-ios-card dark:bg-[#1C1C1E] border border-ios-border dark:border-white/10 flex items-center justify-center mb-3.5 shadow-sm">
              <BookOpen size={24} className="text-ios-yellow" />
            </div>
            <p className="text-sm font-bold text-ios-textSecondary dark:text-[#A1A1A6]">
              No hay notas en esta sección
            </p>
            <p className="text-xs text-ios-textTertiary dark:text-[#6E6E73] mt-1 max-w-xs">
              Pulsa en "Nueva Nota" para comenzar un apunte escolar con lápiz, texto o documentos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
