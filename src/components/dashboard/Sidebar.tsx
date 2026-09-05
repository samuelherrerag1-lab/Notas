import React, { useState, useRef } from 'react';
import {
  Folder as FolderIcon,
  Zap,
  Pin,
  Trash,
  Plus,
  X,
  Download,
  Upload,
  BookOpen,
} from 'lucide-react';
import { Folder } from '../../types';
import { exportBackupFile, importBackupFile } from '../../utils/backupManager';
import { InstallPromptBanner } from '../common/InstallPromptBanner';

interface SidebarProps {
  folders: Folder[];
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  notesCountByCategory: Record<string, number>;
  onCreateFolder: (name: string, color?: string, icon?: string) => void;
  onDeleteFolder: (folderId: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  onBackupRestored?: () => void;
}

const SUBJECT_PRESETS = [
  { name: 'Matemáticas 📐', color: '#007AFF', icon: 'calculator' },
  { name: 'Lengua 📖', color: '#34C759', icon: 'book' },
  { name: 'Ciencias 🔬', color: '#AF52DE', icon: 'flask' },
  { name: 'Historia 🌍', color: '#FF9500', icon: 'globe' },
  { name: 'Arte 🎨', color: '#FF2D55', icon: 'palette' },
  { name: 'Tecnología 💻', color: '#5856D6', icon: 'laptop' },
];

const FOLDER_COLORS = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#AF52DE',
  '#FF2D55',
  '#5856D6',
  '#E4A11B',
  '#1C1C1E',
];

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  activeCategory,
  onSelectCategory,
  notesCountByCategory,
  onCreateFolder,
  onDeleteFolder,
  isOpen,
  onClose,
  onBackupRestored,
}) => {
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#007AFF');
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), selectedColor);
      setNewFolderName('');
      setShowNewFolderModal(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      await exportBackupFile();
    } catch (err) {
      alert('Error al exportar copia de seguridad.');
    }
  };

  const handleRestoreFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      window.confirm(
        '¿Deseas restaurar esta copia de seguridad? Las notas se integrarán en tu biblioteca.'
      )
    ) {
      try {
        const result = await importBackupFile(file, 'merge');
        alert(
          `¡Copia restaurada exitosamente!\nSe han cargado ${result.notesCount} notas y ${result.foldersCount} carpetas.`
        );
        onBackupRestored?.();
      } catch (err: unknown) {
        alert((err as Error).message || 'Error al restaurar archivo de respaldo.');
      }
    }
    e.target.value = '';
  };

  const systemCategories = [
    {
      id: 'all',
      name: 'Todas las notas',
      icon: FolderIcon,
      color: '#E4A11B',
      count: notesCountByCategory['all'] || 0,
    },
    {
      id: 'quick',
      name: 'Notas rápidas',
      icon: Zap,
      color: '#FF9500',
      count: notesCountByCategory['quick'] || 0,
    },
    {
      id: 'pinned',
      name: 'Fijadas',
      icon: Pin,
      color: '#FFCC00',
      count: notesCountByCategory['pinned'] || 0,
    },
  ];

  const customFolders = folders.filter((f) => !f.isSystem && f.id !== 'all' && f.id !== 'quick');
  const trashCount = notesCountByCategory['trash'] || 0;

  return (
    <>
      {/* Input oculto para restaurar respaldo */}
      <input
        ref={backupInputRef}
        type="file"
        accept=".notesbackup, .json"
        onChange={handleRestoreFileSelected}
        className="hidden"
      />

      {/* Overlay para móviles/tablets */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 sm:w-72 bg-ios-sidebar border-r border-ios-border flex flex-col transition-transform duration-200 ease-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header de la Sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-ios-borderSubtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-ios-yellow flex items-center justify-center text-white font-bold shadow-ios-sm">
              📝
            </div>
            <div>
              <h2 className="text-base font-bold text-ios-text tracking-tight leading-none">
                Apple Notes
              </h2>
              <span className="text-[11px] font-medium text-ios-yellow">Escolar & Táctil</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-ios-textSecondary hover:text-ios-text rounded-lg hover:bg-ios-gray5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de navegación */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Botón de instalación nativa en Chromebook */}
          <div className="px-1">
            <InstallPromptBanner variant="button" />
          </div>

          {/* Secciones de Sistema */}
          <div className="space-y-0.5">
            <div className="px-3 py-1 text-[11px] font-semibold text-ios-textTertiary uppercase tracking-wider">
              Principal
            </div>
            {systemCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onClose?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-ios text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-ios-yellow text-white shadow-ios-sm font-semibold'
                      : 'text-ios-text hover:bg-ios-gray5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} style={{ color: isActive ? '#FFFFFF' : cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'text-ios-textSecondary bg-ios-gray5'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Carpetas / Materias Escolares */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[11px] font-semibold text-ios-textTertiary uppercase tracking-wider">
                Cuadernos / Materias
              </span>
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="text-ios-yellow hover:text-ios-yellowHover p-1 rounded hover:bg-ios-yellowLight transition-colors"
                title="Nueva Materia / Carpeta"
              >
                <Plus size={15} />
              </button>
            </div>

            {customFolders.length === 0 ? (
              <div className="px-3 py-2 text-xs text-ios-textSecondary italic">
                Sin carpetas de materias
              </div>
            ) : (
              customFolders.map((folder) => {
                const isActive = activeCategory === folder.id;
                const count = notesCountByCategory[folder.id] || 0;
                return (
                  <div
                    key={folder.id}
                    className={`group/folder w-full flex items-center justify-between px-3 py-2 rounded-ios text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-ios-yellow text-white shadow-ios-sm font-semibold'
                        : 'text-ios-text hover:bg-ios-gray5'
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectCategory(folder.id);
                        onClose?.();
                      }}
                      className="flex items-center gap-2.5 truncate flex-1 text-left"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: folder.color || '#007AFF' }}
                      />
                      <span className="truncate">{folder.name}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white font-bold' : 'text-ios-textSecondary bg-ios-gray5'
                        }`}
                      >
                        {count}
                      </span>
                      {!folder.isSystem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Eliminar cuaderno "${folder.name}"?`)) {
                              onDeleteFolder(folder.id);
                            }
                          }}
                          className="opacity-0 group-hover/folder:opacity-100 p-0.5 hover:text-ios-red rounded transition-opacity"
                          title="Eliminar cuaderno"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Papelera */}
          <div className="pt-2 border-t border-ios-borderSubtle">
            <button
              onClick={() => {
                onSelectCategory('trash');
                onClose?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-ios text-sm font-medium transition-all ${
                activeCategory === 'trash'
                  ? 'bg-ios-red text-white shadow-ios-sm font-semibold'
                  : 'text-ios-textSecondary hover:text-ios-red hover:bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash size={18} />
                <span>Papelera</span>
              </div>
              <span className="text-xs">{trashCount}</span>
            </button>
          </div>

          {/* Respaldo y Migración Local */}
          <div className="pt-2 border-t border-ios-borderSubtle space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold text-ios-textTertiary uppercase tracking-wider">
              Respaldo Escolar
            </div>
            <button
              onClick={handleExportBackup}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-ios-text hover:bg-ios-gray5 transition-colors"
              title="Descargar copia de seguridad .notesbackup"
            >
              <Download size={14} className="text-ios-yellow" />
              <span>Hacer copia (.notesbackup)</span>
            </button>
            <button
              onClick={() => backupInputRef.current?.click()}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-ios-text hover:bg-ios-gray5 transition-colors"
              title="Restaurar notas desde un archivo de respaldo"
            >
              <Upload size={14} className="text-ios-blue" />
              <span>Restaurar copia</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-ios-borderSubtle bg-ios-gray6/50 flex items-center justify-between text-xs text-ios-textSecondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ios-green animate-pulse" />
            <span className="font-medium">IndexedDB Offline</span>
          </div>
          <span className="text-[11px] text-ios-textTertiary">Chromebook Ready</span>
        </div>

        {/* Modal para crear cuaderno */}
        {showNewFolderModal && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
            onClick={() => setShowNewFolderModal(false)}
          >
            <div
              className="bg-ios-card rounded-ios-lg shadow-ios-floating p-5 w-full max-w-sm border border-ios-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3 text-ios-text font-bold text-base">
                <BookOpen className="text-ios-yellow" size={20} />
                <h3>Nuevo Cuaderno / Materia</h3>
              </div>

              <div className="mb-3">
                <span className="text-[11px] font-semibold text-ios-textTertiary uppercase mb-1.5 block">
                  Materias sugeridas
                </span>
                <div className="flex flex-wrap gap-1">
                  {SUBJECT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setNewFolderName(preset.name);
                        setSelectedColor(preset.color);
                      }}
                      className="text-xs bg-ios-bg hover:bg-ios-gray5 px-2 py-1 rounded-md border border-ios-borderSubtle transition-colors flex items-center gap-1"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateFolderSubmit}>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nombre de la materia (ej. Física ⚡)..."
                  autoFocus
                  className="w-full px-3 py-2 text-sm bg-ios-bg border border-ios-border rounded-lg outline-none focus:border-ios-yellow mb-3"
                />

                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-ios-textTertiary uppercase mb-1.5 block">
                    Color del cuaderno
                  </span>
                  <div className="flex items-center gap-2">
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          selectedColor === c ? 'ring-2 ring-ios-yellow ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewFolderModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-ios-textSecondary hover:bg-ios-gray6"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-ios-yellow text-white hover:bg-ios-yellowHover disabled:opacity-50 shadow-sm"
                  >
                    Crear Cuaderno
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
