import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { Folder, Note } from './types';
import { Sidebar } from './components/dashboard/Sidebar';
import { NotesDashboard } from './components/dashboard/NotesDashboard';
import { NoteEditor } from './components/canvas/NoteEditor';
import { InstallPromptBanner } from './components/common/InstallPromptBanner';
import { ThemeProvider } from './context/ThemeContext';

export const AppContent: React.FC = () => {
  const notes = (useLiveQuery(() => db.notes.toArray(), []) as Note[] | undefined) || [];
  const folders = (useLiveQuery(() => db.folders.toArray(), []) as Folder[] | undefined) || [];

  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

  // Inicializar materias escolares predeterminadas si la base de datos está vacía
  useEffect(() => {
    const initDefaults = async () => {
      const folderCount = await db.folders.count();
      if (folderCount === 0) {
        await db.folders.bulkAdd([
          { id: 'matematicas', name: 'Matemáticas', icon: '📐', createdAt: Date.now() },
          { id: 'ciencias', name: 'Ciencias', icon: '🔬', createdAt: Date.now() },
          { id: 'historia', name: 'Historia', icon: '🏛️', createdAt: Date.now() },
          { id: 'idiomas', name: 'Idiomas', icon: '📖', createdAt: Date.now() },
        ]);
      }
    };
    initDefaults();
  }, []);

  const handleCreateNote = async () => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: 'Nota sin título',
      folderId: activeFolderId === 'pinned' || activeFolderId === 'all' ? 'all' : activeFolderId,
      backgroundTemplate: 'RULED',
      strokes: [],
      images: [],
      textBlocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: activeFolderId === 'pinned',
      isTrash: false,
    };

    await db.notes.add(newNote);
    setCurrentNoteId(newNote.id);
  };

  const handleSaveNote = async (updatedNote: Note) => {
    await db.notes.put(updatedNote);
  };

  const handleDeleteNote = async (id: string) => {
    await db.notes.delete(id);
    if (currentNoteId === id) {
      setCurrentNoteId(null);
    }
  };

  const handleTogglePinNote = async (id: string) => {
    const note = await db.notes.get(id);
    if (note) {
      await db.notes.update(id, { isPinned: !note.isPinned });
    }
  };

  const handleCreateFolder = async (name: string, icon = '📁') => {
    const newFolder: Folder = {
      id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      icon,
      createdAt: Date.now(),
    };
    await db.folders.add(newFolder);
  };

  const handleDeleteFolder = async (id: string) => {
    await db.folders.delete(id);
    if (activeFolderId === id) {
      setActiveFolderId('all');
    }
  };

  const activeNote = notes.find((n: Note) => n.id === currentNoteId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ios-bg dark:bg-[#121214] text-ios-text dark:text-white font-sans select-none">
      {activeNote ? (
        <NoteEditor
          note={activeNote}
          folders={folders}
          onSave={handleSaveNote}
          onBack={() => setCurrentNoteId(null)}
          onDelete={handleDeleteNote}
        />
      ) : (
        <>
          <Sidebar
            folders={folders}
            activeFolderId={activeFolderId}
            onSelectFolder={setActiveFolderId}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
          />
          <NotesDashboard
            notes={notes}
            folders={folders}
            activeFolderId={activeFolderId}
            onSelectNote={(note) => setCurrentNoteId(note.id)}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            onTogglePinNote={handleTogglePinNote}
          />
        </>
      )}

      {/* Banner flotante de instalación nativa PWA (no afecta la estructura de pantalla) */}
      <InstallPromptBanner variant="floating" />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
