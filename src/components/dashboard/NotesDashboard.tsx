import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Search,
  Plus,
  Menu,
  LayoutGrid,
  List as ListIcon,
  FileEdit,
  Trash2,
} from 'lucide-react';
import {
  db,
  createNewNote,
  togglePinNote,
  duplicateNote,
  deleteNote,
  restoreNote,
  createFolder,
  deleteFolder,
  updateNoteFolder,
} from '../../db/db';
import { Sidebar } from './Sidebar';
import { NoteCard } from './NoteCard';
import { InstallPromptBanner } from '../common/InstallPromptBanner';
import { SortOption, ViewMode } from '../../types';
import { formatTimestamp, truncateText } from '../../utils/formatters';

interface NotesDashboardProps {
  onOpenNote: (noteId: string) => void;
  onNewNote?: () => void;
}

export const NotesDashboard: React.FC<NotesDashboardProps> = ({
  onOpenNote,
  onNewNote,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Consultas reactivas a IndexedDB con Dexie Live Query
  const allNotes = useLiveQuery(() => db.notes.toArray(), []) || [];
  const folders = useLiveQuery(() => db.folders.toArray(), []) || [];

  // Conteo de notas por categoría
  const notesCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      quick: 0,
      pinned: 0,
      trash: 0,
    };

    allNotes.forEach((n) => {
      if (n.isTrash) {
        counts['trash'] = (counts['trash'] || 0) + 1;
        return;
      }
      counts['all'] = (counts['all'] || 0) + 1;
      if (n.folderId === 'quick') {
        counts['quick'] = (counts['quick'] || 0) + 1;
      }
      if (n.isPinned) {
        counts['pinned'] = (counts['pinned'] || 0) + 1;
      }
      if (n.folderId) {
        counts[n.folderId] = (counts[n.folderId] || 0) + 1;
      }
    });

    return counts;
  }, [allNotes]);

  // Filtrado y ordenamiento de notas
  const filteredNotes = useMemo(() => {
    let result = allNotes.filter((note) => {
      if (activeCategory === 'trash') {
        return note.isTrash;
      }
      if (note.isTrash) {
        return false;
      }

      if (activeCategory === 'all') {
        return true;
      }
      if (activeCategory === 'quick') {
        return note.folderId === 'quick';
      }
      if (activeCategory === 'pinned') {
        return note.isPinned;
      }
      return note.folderId === activeCategory;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortOption === 'updatedAt') {
        return b.updatedAt - a.updatedAt;
      }
      if (sortOption === 'createdAt') {
        return b.createdAt - a.createdAt;
      }
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [allNotes, activeCategory, searchQuery, sortOption]);

  const { pinnedNotes, regularNotes } = useMemo(() => {
    if (activeCategory === 'trash' || activeCategory === 'pinned') {
      return { pinnedNotes: [], regularNotes: filteredNotes };
    }
    return {
      pinnedNotes: filteredNotes.filter((n) => n.isPinned),
      regularNotes: filteredNotes.filter((n) => !n.isPinned),
    };
  }, [filteredNotes, activeCategory]);

  const handleCreateNewNote = async () => {
    if (onNewNote) {
      onNewNote();
      return;
    }
    const targetFolder = activeCategory === 'trash' ? 'quick' : activeCategory;
    const newNote = await createNewNote(targetFolder, 'RULED');
    onOpenNote(newNote.id);
  };

  const handleEmptyTrash = async () => {
    if (window.confirm('¿Deseas vaciar la papelera permanentemente?')) {
      const trashNotes = allNotes.filter((n) => n.isTrash);
      for (const n of trashNotes) {
        await deleteNote(n.id, true);
      }
    }
  };

  const getCategoryTitle = () => {
    if (activeCategory === 'all') return 'Todas las Notas';
    if (activeCategory === 'quick') return 'Notas Rápidas';
    if (activeCategory === 'pinned') return 'Notas Fijadas';
    if (activeCategory === 'trash') return 'Papelera de Reciclaje';
    const folder = folders.find((f) => f.id === activeCategory);
    return folder ? folder.name : 'Notas';
  };

  return (
    <div className="flex h-full w-full bg-ios-bg overflow-hidden select-none">
      {/* Barra lateral */}
      <Sidebar
        folders={folders}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        notesCountByCategory={notesCountByCategory}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Contenido principal del Dashboard */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Barra superior de navegación y búsqueda */}
        <header className="bg-ios-card/90 backdrop-blur-md border-b border-ios-border px-4 py-3 flex items-center justify-between gap-3 shadow-ios-sm z-10">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-ios-textSecondary hover:text-ios-text rounded-lg hover:bg-ios-gray6"
              title="Abrir menú"
            >
              <Menu size={20} />
            </button>

            {/* Input de Búsqueda estilo iOS */}
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-textTertiary pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar notas, asignaturas o etiquetas..."
                className="w-full bg-ios-bg pl-9 pr-4 py-1.5 rounded-xl text-sm text-ios-text placeholder-ios-textTertiary border border-transparent focus:border-ios-yellow focus:bg-white transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ios-textTertiary hover:text-ios-text"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Acciones principales y botón Crear */}
          <div className="flex items-center gap-2">
            {/* Toggle de Vista */}
            <div className="hidden sm:flex items-center bg-ios-gray6 rounded-lg p-0.5 border border-ios-borderSubtle">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-ios-card text-ios-text shadow-2xs font-semibold' : 'text-ios-textSecondary'
                }`}
                title="Vista en cuadrícula"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-ios-card text-ios-text shadow-2xs font-semibold' : 'text-ios-textSecondary'
                }`}
                title="Vista en lista"
              >
                <ListIcon size={15} />
              </button>
            </div>

            {/* Selector de ordenamiento */}
            <div className="hidden sm:flex items-center bg-ios-gray6 rounded-lg p-0.5 border border-ios-borderSubtle">
              <button
                onClick={() => setSortOption('updatedAt')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  sortOption === 'updatedAt' ? 'bg-ios-card text-ios-text shadow-2xs font-semibold' : 'text-ios-textSecondary'
                }`}
                title="Ordenar por última modificación"
              >
                Recientes
              </button>
              <button
                onClick={() => setSortOption('title')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  sortOption === 'title' ? 'bg-ios-card text-ios-text shadow-2xs font-semibold' : 'text-ios-textSecondary'
                }`}
                title="Ordenar por título"
              >
                A-Z
              </button>
            </div>

            {/* Botón Nueva Nota Destacado */}
            <button
              onClick={handleCreateNewNote}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ios-yellow hover:bg-ios-yellowHover text-white text-sm font-semibold shadow-ios-sm transition-all active:scale-95 shrink-0"
              title="Crear una nueva nota manuscrita"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Nueva Nota</span>
            </button>
          </div>
        </header>

        {/* Área de Notas con Scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Banner de Instalación en Chromebook */}
          <InstallPromptBanner variant="banner" />

          {/* Cabecera de la sección actual */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ios-text tracking-tight flex items-center gap-2">
                {getCategoryTitle()}
              </h1>
              <p className="text-xs text-ios-textSecondary mt-0.5">
                {filteredNotes.length}{' '}
                {filteredNotes.length === 1 ? 'nota disponible' : 'notas disponibles'}
              </p>
            </div>

            {activeCategory === 'trash' && filteredNotes.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-ios-red hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                <span>Vaciar Papelera</span>
              </button>
            )}
          </div>

          {/* Estado vacío si no hay notas */}
          {filteredNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-ios-yellowLight flex items-center justify-center text-ios-yellow mb-4 shadow-ios-card">
                <FileEdit size={32} />
              </div>
              <h3 className="text-lg font-bold text-ios-text mb-1">
                {searchQuery ? 'No se encontraron notas' : 'No hay notas en este cuaderno'}
              </h3>
              <p className="text-xs text-ios-textSecondary max-w-sm mb-6">
                {searchQuery
                  ? 'Intenta buscar con otros términos o limpia el filtro de búsqueda.'
                  : 'Crea tu primera nota o lista de tareas en esta sección.'}
              </p>
              {!searchQuery && activeCategory !== 'trash' && (
                <button
                  onClick={handleCreateNewNote}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ios-yellow hover:bg-ios-yellowHover text-white text-sm font-semibold shadow-ios-sm transition-all active:scale-95"
                >
                  <Plus size={18} />
                  <span>Empezar a Escribir</span>
                </button>
              )}
            </div>
          )}

          {/* Renderizado de Notas en modo Lista o Cuadrícula */}
          {viewMode === 'list' && filteredNotes.length > 0 ? (
            <div className="bg-ios-card rounded-ios-lg border border-ios-border divide-y divide-ios-borderSubtle overflow-hidden shadow-ios-card">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onOpenNote(note.id)}
                  className="p-3 sm:px-4 flex items-center justify-between hover:bg-ios-gray6 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#FCFCFD] border border-ios-borderSubtle overflow-hidden shrink-0 flex items-center justify-center">
                      {note.thumbnail ? (
                        <img src={note.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileEdit size={16} className="text-ios-textTertiary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-ios-text truncate">
                        {truncateText(note.title, 36)}
                      </h4>
                      <p className="text-xs text-ios-textSecondary">
                        {formatTimestamp(note.updatedAt)} · {note.strokes.length} trazos
                        {note.textBlocks && note.textBlocks.length > 0
                          ? ` · ${note.textBlocks.length} bloques`
                          : ''}
                      </p>
                    </div>
                  </div>
                  {note.isPinned && (
                    <span className="text-xs font-semibold text-ios-yellow bg-ios-yellowLight px-2 py-0.5 rounded-md">
                      Fijada
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Sección de Notas Fijadas (Grid) */}
              {pinnedNotes.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ios-textTertiary flex items-center gap-1.5">
                    <span>Fijadas</span>
                    <span className="text-[10px] bg-ios-gray5 text-ios-textSecondary px-1.5 py-0.2 rounded-full">
                      {pinnedNotes.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        folders={folders}
                        onOpen={onOpenNote}
                        onTogglePin={togglePinNote}
                        onDuplicate={duplicateNote}
                        onDelete={deleteNote}
                        onRestore={restoreNote}
                        onMoveFolder={updateNoteFolder}
                        isTrashView={activeCategory === 'trash'}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sección de Otras Notas (Grid) */}
              {regularNotes.length > 0 && (
                <div className="space-y-3">
                  {pinnedNotes.length > 0 && (
                    <h2 className="text-xs font-bold uppercase tracking-wider text-ios-textTertiary flex items-center gap-1.5">
                      <span>Otras Notas</span>
                      <span className="text-[10px] bg-ios-gray5 text-ios-textSecondary px-1.5 py-0.2 rounded-full">
                        {regularNotes.length}
                      </span>
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {regularNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        folders={folders}
                        onOpen={onOpenNote}
                        onTogglePin={togglePinNote}
                        onDuplicate={duplicateNote}
                        onDelete={deleteNote}
                        onRestore={restoreNote}
                        onMoveFolder={updateNoteFolder}
                        isTrashView={activeCategory === 'trash'}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Botón Flotante Acción Rápida (FAB) */}
        <button
          onClick={handleCreateNewNote}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-ios-yellow text-white flex items-center justify-center shadow-ios-floating active:scale-95 transition-transform z-30"
          title="Nueva Nota"
        >
          <Plus size={28} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
