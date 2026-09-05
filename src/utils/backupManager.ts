import { db } from '../db/db';
import { Note, Folder } from '../types';

export interface BackupPayload {
  version: string;
  createdAt: number;
  appName: string;
  notes: Note[];
  folders: Folder[];
}

/**
 * Genera y descarga un archivo `.notesbackup` con toda la base de datos de notas, trazos y carpetas.
 */
export async function exportBackupFile(): Promise<void> {
  const notes = await db.notes.toArray();
  const folders = await db.folders.toArray();

  const backupData: BackupPayload = {
    version: '1.0.0',
    createdAt: Date.now(),
    appName: 'AppleNotesChromebook',
    notes,
    folders,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.download = `respaldo-notas-escolares-${dateStr}.notesbackup`;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Lee y restaura un archivo `.notesbackup` o `.json` en la base de datos IndexedDB local.
 */
export async function importBackupFile(
  file: File,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ notesCount: number; foldersCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data: BackupPayload = JSON.parse(text);

        if (!data || !Array.isArray(data.notes)) {
          throw new Error('El archivo de respaldo no tiene un formato válido.');
        }

        await db.transaction('rw', db.notes, db.folders, async () => {
          if (mode === 'replace') {
            await db.notes.clear();
            await db.folders.clear();
          }

          if (data.folders && Array.isArray(data.folders)) {
            await db.folders.bulkPut(data.folders);
          }

          if (data.notes && Array.isArray(data.notes)) {
            await db.notes.bulkPut(data.notes);
          }
        });

        resolve({
          notesCount: data.notes.length,
          foldersCount: data.folders ? data.folders.length : 0,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo de respaldo.'));
    reader.readAsText(file);
  });
}
