import Dexie, { Table } from 'dexie';
import { Note, Folder, BackgroundTemplate } from '../types';

export class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  folders!: Table<Folder, string>;

  constructor() {
    super('AppleNotesChromebookDB');
    
    // Esquema de base de datos con índices optimizados
    this.version(1).stores({
      notes: 'id, title, folderId, backgroundTemplate, createdAt, updatedAt, isPinned, isTrash',
      folders: 'id, name, createdAt',
    });
  }
}

export const db = new NotesDatabase();

/**
 * Carpetas iniciales del sistema y materias escolares
 */
export const DEFAULT_FOLDERS: Folder[] = [
  {
    id: 'all',
    name: 'Todas las notas',
    icon: 'folder',
    color: '#E4A11B',
    isSystem: true,
    createdAt: Date.now(),
  },
  {
    id: 'quick',
    name: 'Notas rápidas',
    icon: 'zap',
    color: '#FF9500',
    isSystem: true,
    createdAt: Date.now(),
  },
  {
    id: 'folder-math',
    name: 'Matemáticas 📐',
    icon: 'calculator',
    color: '#007AFF',
    isSystem: false,
    createdAt: Date.now() + 1,
  },
  {
    id: 'folder-lang',
    name: 'Lengua y Literatura 📖',
    icon: 'book',
    color: '#34C759',
    isSystem: false,
    createdAt: Date.now() + 2,
  },
  {
    id: 'folder-science',
    name: 'Ciencias Naturales 🔬',
    icon: 'flask',
    color: '#AF52DE',
    isSystem: false,
    createdAt: Date.now() + 3,
  },
  {
    id: 'folder-history',
    name: 'Historia y Geografía 🌍',
    icon: 'globe',
    color: '#FF9500',
    isSystem: false,
    createdAt: Date.now() + 4,
  },
];

/**
 * Nota de bienvenida inicial
 */
function createWelcomeNote(): Note {
  const now = Date.now();
  return {
    id: 'welcome-note-01',
    title: '¡Bienvenido a Notas Escolares!',
    folderId: 'quick',
    backgroundTemplate: 'RULED',
    createdAt: now,
    updatedAt: now,
    isPinned: true,
    isTrash: false,
    tags: ['Bienvenida', 'Stylus', 'PWA'],
    textBlocks: [
      {
        id: 'tb-welcome-1',
        type: 'checklist',
        x: 100,
        y: 80,
        width: 320,
        items: [
          { id: 'c-1', text: 'Probar rechazo de palma con stylus', completed: true },
          { id: 'c-2', text: 'Anotar un PDF o documento Word', completed: false },
          { id: 'c-3', text: 'Hacer doble clic para añadir notas escritas', completed: false },
        ],
      },
    ],
    strokes: [
      {
        id: 'stroke-1',
        tool: 'pen',
        color: '#E4A11B',
        size: 5,
        points: [
          { x: 120, y: 260, pressure: 0.7, time: 100 },
          { x: 160, y: 255, pressure: 0.8, time: 150 },
          { x: 220, y: 270, pressure: 0.9, time: 200 },
          { x: 280, y: 250, pressure: 0.7, time: 250 },
          { x: 340, y: 265, pressure: 0.6, time: 300 },
        ],
      },
      {
        id: 'stroke-2',
        tool: 'highlighter',
        color: '#FFCC00',
        size: 14,
        points: [
          { x: 100, y: 260, pressure: 0.5, time: 320 },
          { x: 360, y: 260, pressure: 0.5, time: 400 },
        ],
      },
    ],
  };
}

/**
 * Inicialización de la base de datos
 */
export async function initializeDatabase(): Promise<void> {
  const folderCount = await db.folders.count();
  if (folderCount === 0) {
    await db.folders.bulkAdd(DEFAULT_FOLDERS);
  }

  const notesCount = await db.notes.count();
  if (notesCount === 0) {
    const welcome = createWelcomeNote();
    await db.notes.add(welcome);
  }
}

/**
 * Operaciones CRUD de Notas
 */
export async function getNoteById(id: string): Promise<Note | undefined> {
  return await db.notes.get(id);
}

export async function saveNote(note: Note): Promise<string> {
  const updatedNote = {
    ...note,
    updatedAt: Date.now(),
  };
  await db.notes.put(updatedNote);
  return note.id;
}

export async function createNewNote(
  folderId: string = 'quick',
  backgroundTemplate: BackgroundTemplate = 'RULED'
): Promise<Note> {
  const now = Date.now();
  const newNote: Note = {
    id: `note-${now}-${Math.random().toString(36).substr(2, 6)}`,
    title: 'Nueva Nota',
    folderId: folderId === 'all' || folderId === 'trash' || folderId === 'pinned' ? 'quick' : folderId,
    backgroundTemplate,
    strokes: [],
    textBlocks: [],
    images: [],
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    isTrash: false,
    tags: [],
  };

  await db.notes.add(newNote);
  return newNote;
}

export async function deleteNote(id: string, permanent: boolean = false): Promise<void> {
  if (permanent) {
    await db.notes.delete(id);
  } else {
    const note = await db.notes.get(id);
    if (note) {
      if (note.isTrash) {
        await db.notes.delete(id);
      } else {
        await db.notes.update(id, { isTrash: true, isPinned: false, updatedAt: Date.now() });
      }
    }
  }
}

export async function restoreNote(id: string): Promise<void> {
  await db.notes.update(id, { isTrash: false, updatedAt: Date.now() });
}

export async function togglePinNote(id: string): Promise<void> {
  const note = await db.notes.get(id);
  if (note) {
    await db.notes.update(id, { isPinned: !note.isPinned, updatedAt: Date.now() });
  }
}

export async function duplicateNote(id: string): Promise<Note | undefined> {
  const note = await db.notes.get(id);
  if (!note) return undefined;

  const now = Date.now();
  const cloned: Note = {
    ...note,
    id: `note-${now}-${Math.random().toString(36).substr(2, 6)}`,
    title: `${note.title} (Copia)`,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
  };

  await db.notes.add(cloned);
  return cloned;
}

export async function updateNoteFolder(noteId: string, folderId: string): Promise<void> {
  await db.notes.update(noteId, { folderId, updatedAt: Date.now() });
}

export async function createFolder(
  name: string,
  color: string = '#007AFF',
  icon: string = 'folder'
): Promise<Folder> {
  const newFolder: Folder = {
    id: `folder-${Date.now()}`,
    name,
    icon,
    color,
    isSystem: false,
    createdAt: Date.now(),
  };
  await db.folders.add(newFolder);
  return newFolder;
}

export async function deleteFolder(folderId: string): Promise<void> {
  await db.folders.delete(folderId);
  const notes = await db.notes.where('folderId').equals(folderId).toArray();
  for (const n of notes) {
    await db.notes.update(n.id, { folderId: 'quick' });
  }
}
