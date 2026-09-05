export type BackgroundTemplate = 'BLANK' | 'RULED' | 'GRID' | 'DOTS';

export type ToolType = 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'text' | 'checklist';

export type EraserMode = 'pixel' | 'stroke';

export type DocumentType = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'none';

export type TextHierarchy = 'title' | 'subtitle' | 'body';

export interface Point {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

export interface Stroke {
  id: string;
  tool: ToolType;
  color: string;
  size: number;
  points: Point[];
  opacity?: number;
}

export interface NoteImage {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteTextBlock {
  id: string;
  type: 'text' | 'checklist';
  x: number;
  y: number;
  width: number;
  content?: string;
  items?: ChecklistItem[];
  fontSize?: number;
  hierarchy?: TextHierarchy;
  isBold?: boolean;
  isItalic?: boolean;
  color?: string;
}

export interface DocumentData {
  type: DocumentType;
  fileName: string;
  fileData: string;
  numPages: number;
  currentPage: number;
  scale?: number;
}

export interface Note {
  id: string;
  title: string;
  folderId: string;
  backgroundTemplate: BackgroundTemplate;
  strokes: Stroke[];
  pageStrokes?: Record<number, Stroke[]>;
  images?: NoteImage[];
  textBlocks?: NoteTextBlock[];
  document?: DocumentData;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isTrash: boolean;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isSystem?: boolean;
  createdAt: number;
}

export interface ViewportTransform {
  scale: number;
  x: number;
  y: number;
}

export interface CanvasState {
  currentTool: ToolType;
  currentColor: string;
  currentSize: number;
  eraserMode: EraserMode;
  backgroundTemplate: BackgroundTemplate;
  canUndo: boolean;
  canRedo: boolean;
}

export type ViewMode = 'grid' | 'list';

export type SortOption = 'updatedAt' | 'createdAt' | 'title';
