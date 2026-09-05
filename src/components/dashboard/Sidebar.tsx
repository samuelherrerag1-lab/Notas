import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Sun,
  Moon,
  BookOpen,
  Pin,
} from 'lucide-react';
import { Folder } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { exportBackupFile, importBackupFile } from '../../utils/backupManager';

interface SidebarProps {
  folders: Folder[];
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
  onCreateFolder: (name: string, icon?: string) => void;
  onDeleteFolder?: (id: string) => void;
  onDataImported?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  onDataImported,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importBackupFile(file);
      onDataImported?.();
    } catch (err) {
      console.error('Error importando datos:', err);
    }
    e.target.value = '';
  };

  return (
    <aside className="w-64 shrink-0 h-screen flex flex-col bg-ios-sidebar dark:bg-[#18181B] border-r border-ios-border/80 dark:border-white/[0.08] text-ios-text dark:text-white font-sans select-none transition-colors">
      {/* Cabecera Sidebar */}
      <div className="p-4 flex items-center justify-between border-b border-ios-border/50 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-ios-yellow flex items-center justify-center text-white font-bold text-sm shadow-sm">
            
          </div>
          <span className="font-bold text-sm tracking-tight text-ios-text dark:text-white">
            Notas Escolares
          </span>
        </div>
      </div>

      {/* Lista de Carpetas / Materias */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="text-[10px] font-bold text-ios-textTertiary dark:text-[#6E6E73] uppercase tracking-wider px-2.5 py-1">
          Vistas
        </div>

        {/* Todas las Notas */}
        <button
          type="button"
          onClick={() => onSelectFolder('all')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeFolderId === 'all'
              ? 'bg-ios-yellow text-white shadow-sm'
              : 'text-ios-textSecondary dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-ios-text dark:hover:text-white'
          }`}
        >
          <BookOpen size={16} />
          <span>Todas las notas</span>
        </button>

        {/* Notas Fijadas */}
        <button
          type="button"
          onClick={() => onSelectFolder('pinned')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeFolderId === 'pinned'
              ? 'bg-ios-yellow text-white shadow-sm'
              : 'text-ios-textSecondary dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-ios-text dark:hover:text-white'
          }`}
        >
          <Pin size={16} />
          <span>Fijadas</span>
        </button>

        <div className="pt-3 pb-1 flex items-center justify-between px-2.5">
          <span className="text-[10px] font-bold text-ios-textTertiary dark:text-[#6E6E73] uppercase tracking-wider">
            Materias
          </span>
          <button
            type="button"
            onClick={() => setIsCreatingFolder(true)}
            className="text-ios-yellow hover:text-ios-yellowHover p-0.5 rounded transition-colors"
            title="Añadir materia"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Formulario para crear carpeta */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateSubmit} className="px-1 py-1">
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nombre de materia..."
              className="w-full text-xs px-2.5 py-1.5 bg-ios-card dark:bg-[#1C1C1E] rounded-xl border border-ios-yellow outline-none text-ios-text dark:text-white"
              onBlur={() => {
                if (!newFolderName.trim()) setIsCreatingFolder(false);
              }}
            />
          </form>
        )}

        {/* Carpetas personalizadas */}
        {folders.map((f) => {
          const isSelected = activeFolderId === f.id;
          return (
            <div
              key={f.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                isSelected
                  ? 'bg-ios-yellow text-white shadow-sm'
                  : 'text-ios-textSecondary dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-ios-text dark:hover:text-white'
              }`}
              onClick={() => onSelectFolder(f.id)}
            >
              <div className="flex items-center gap-2 truncate">
                <span>{f.icon || '📁'}</span>
                <span className="truncate">{f.name}</span>
              </div>

              {onDeleteFolder && !f.isSystem && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(f.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-ios-red transition-opacity ${
                    isSelected ? 'text-white/80' : 'text-ios-textTertiary dark:text-[#6E6E73]'
                  }`}
                  title="Eliminar carpeta"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pie con Copia de Seguridad & Tema */}
      <div className="p-3 border-t border-ios-border/50 dark:border-white/[0.06] space-y-1">
        <button
          type="button"
          onClick={exportBackupFile}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-ios-textSecondary dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-ios-text dark:hover:text-white transition-colors"
        >
          <Download size={14} />
          <span>Copia de seguridad</span>
        </button>

        <label className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-ios-textSecondary dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-ios-text dark:hover:text-white cursor-pointer transition-colors">
          <Upload size={14} />
          <span>Restaurar datos</span>
          <input
            type="file"
            accept=".notesbackup,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-ios-textSecondary dark:text-[#A1A1A6] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-ios-text dark:hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Sun size={14} className="text-ios-yellow" /> : <Moon size={14} />}
            <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </span>
          <span className="text-[9px] uppercase font-bold text-ios-yellow">
            {isDark ? 'OSCURO' : 'CLARO'}
          </span>
        </button>
      </div>
    </aside>
  );
};
