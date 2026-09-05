import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase, createNewNote } from './db/db';
import { NotesDashboard } from './components/dashboard/NotesDashboard';
import { NoteEditor } from './components/canvas/NoteEditor';

export const App: React.FC = () => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  // Inicialización de la base de datos Dexie en el primer render
  useEffect(() => {
    initializeDatabase()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('Error inicializando Dexie IndexedDB:', err);
        setIsDbReady(true);
      });
  }, []);

  // Obtener la nota activa reactivamente con unwrap tipado de Dexie
  const activeNote = useLiveQuery(
    async () => {
      if (!activeNoteId) return undefined;
      return await db.notes.get(activeNoteId);
    },
    [activeNoteId]
  );

  const handleOpenNote = (noteId: string) => {
    setActiveNoteId(noteId);
  };

  const handleNewNote = async () => {
    const newNote = await createNewNote('quick', 'RULED');
    setActiveNoteId(newNote.id);
  };

  const handleBackToDashboard = () => {
    setActiveNoteId(null);
  };

  if (!isDbReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ios-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-ios-yellow border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-ios-textSecondary">
            Iniciando motor de notas...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-ios-bg text-ios-text overflow-hidden font-sans">
      {activeNoteId && activeNote ? (
        <NoteEditor
          key={activeNote.id}
          initialNote={activeNote}
          onBack={handleBackToDashboard}
        />
      ) : (
        <NotesDashboard
          onOpenNote={handleOpenNote}
          onNewNote={handleNewNote}
        />
      )}
    </div>
  );
};

export default App;
