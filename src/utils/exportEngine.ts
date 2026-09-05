import jsPDF from 'jspdf';
import { BackgroundTemplate, Note, Stroke } from '../types';
import { BackgroundRenderer } from '../components/canvas/BackgroundRenderer';
import { renderStrokeToContext } from './inkEngine';
import * as pdfjsLib from 'pdfjs-dist';
import { exportBackupFile, importBackupFile } from './backupManager';

export const exportAllDataAsJson = exportBackupFile;
export const importDataFromJson = async (file: File) => {
  try {
    await importBackupFile(file);
    return true;
  } catch {
    return false;
  }
};

/**
 * Renderiza una capa combinada de alta fidelidad (Fondo + Documento + Imágenes + Bloques de Texto + Trazos)
 */
export async function renderCompositeCanvas(
  width: number,
  height: number,
  template: BackgroundTemplate,
  strokes: Stroke[],
  images: Note['images'] = [],
  textBlocks: Note['textBlocks'] = [],
  pdfPageDoc?: pdfjsLib.PDFPageProxy,
  isDark = false
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const dpr = 2;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el contexto de exportación.');

  ctx.scale(dpr, dpr);

  // 1. Renderizar Fondo
  BackgroundRenderer.render(ctx, width, height, template, { isDark });

  // 2. Renderizar Documento PDF si existe
  if (pdfPageDoc) {
    const unscaledViewport = pdfPageDoc.getViewport({ scale: 1 });
    const scaleX = (width - 32) / unscaledViewport.width;
    const scaleY = (height - 32) / unscaledViewport.height;
    const optimalScale = Math.min(Math.max(scaleX, 0.8), Math.max(scaleY, 1.5), 2.0);
    const viewport = pdfPageDoc.getViewport({ scale: optimalScale });

    const pdfCanvas = document.createElement('canvas');
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    const pdfCtx = pdfCanvas.getContext('2d');

    if (pdfCtx) {
      await pdfPageDoc.render({ canvasContext: pdfCtx, viewport }).promise;
      const offsetX = (width - viewport.width) / 2;
      const offsetY = 16;
      ctx.drawImage(pdfCanvas, offsetX, offsetY);
    }
  }

  // 3. Renderizar Imágenes / Stickers con soporte de rotación angular
  if (images && images.length > 0) {
    for (const imgItem of images) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          const cx = imgItem.x + imgItem.width / 2;
          const cy = imgItem.y + imgItem.height / 2;
          ctx.translate(cx, cy);
          if (imgItem.rotation) {
            ctx.rotate((imgItem.rotation * Math.PI) / 180);
          }
          ctx.drawImage(img, -imgItem.width / 2, -imgItem.height / 2, imgItem.width, imgItem.height);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imgItem.dataUrl;
      });
    }
  }

  // 4. Renderizar Bloques de Texto y Checklists
  if (textBlocks && textBlocks.length > 0) {
    for (const block of textBlocks) {
      ctx.save();
      const defaultTextColor = isDark ? '#F2F2F7' : '#1C1C1E';
      const rawColor = block.color;
      const textColor = !rawColor || rawColor.toLowerCase() === '#1c1c1e' || rawColor.toLowerCase() === '#000000'
        ? defaultTextColor
        : rawColor;

      const pad = 12;
      const fontSize = block.fontSize || (block.hierarchy === 'title' ? 22 : block.hierarchy === 'subtitle' ? 18 : 15);
      const lines = block.type === 'text' ? (block.content || '').split('\n') : [];
      const lineHeight = Math.round(fontSize * 1.35);

      const fontStyle = block.isItalic ? 'italic ' : '';
      const fontWeight = block.isBold || block.hierarchy === 'title' || block.hierarchy === 'subtitle' ? 'bold ' : '';

      if (block.type === 'text') {
        ctx.fillStyle = textColor;
        ctx.font = `${fontStyle}${fontWeight}${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        lines.forEach((line, idx) => {
          ctx.fillText(line, block.x + pad, block.y + pad + fontSize + idx * lineHeight);
        });
      } else if (block.type === 'checklist' && block.items) {
        ctx.font = `${fontStyle}${fontWeight}${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        block.items.forEach((item, idx) => {
          const itemY = block.y + pad + 16 + idx * 24;

          ctx.strokeStyle = item.completed ? '#E4A11B' : (isDark ? '#636366' : '#8E8E93');
          ctx.fillStyle = item.completed ? '#E4A11B' : 'transparent';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(block.x + pad, itemY - 12, 14, 14);
          if (item.completed) {
            ctx.fillRect(block.x + pad + 2, itemY - 10, 10, 10);
          }

          ctx.fillStyle = item.completed ? (isDark ? '#636366' : '#AEAEB2') : textColor;
          ctx.fillText(item.text || '...', block.x + pad + 22, itemY);

          if (item.completed && item.text) {
            const textWidth = ctx.measureText(item.text).width;
            ctx.beginPath();
            ctx.moveTo(block.x + pad + 22, itemY - 4);
            ctx.lineTo(block.x + pad + 22 + textWidth, itemY - 4);
            ctx.strokeStyle = isDark ? '#636366' : '#AEAEB2';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }

      ctx.restore();
    }
  }

  // 5. Renderizar Trazos vectoriales con perfect-freehand
  for (const stroke of strokes) {
    renderStrokeToContext(ctx, stroke, isDark);
  }

  return canvas;
}

/**
 * Exporta la nota actual como imagen PNG de alta resolución
 */
export async function exportNoteAsImage(
  note: Note,
  isDark = false,
  width = 1920,
  height = 1080
): Promise<void> {
  const currentStrokes = note.strokes || [];
  const canvas = await renderCompositeCanvas(
    width,
    height,
    note.backgroundTemplate,
    currentStrokes,
    note.images,
    note.textBlocks,
    undefined,
    isDark
  );

  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const link = document.createElement('a');
  const cleanTitle = (note.title || 'nota').toLowerCase().replace(/\s+/g, '-');
  link.download = `${cleanTitle}-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Exporta la nota a un archivo PDF completo
 */
export async function exportNoteAsPdf(
  note: Note,
  isDark = false,
  width = 1920,
  height = 1080
): Promise<void> {
  const orientation = width > height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [width, height],
  });

  if (note.document && note.document.type === 'pdf') {
    try {
      const base64Data = note.document.fileData.split(',')[1] || note.document.fileData;
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const totalPages = pdfDoc.numPages;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const pageStrokes =
          (note.pageStrokes && note.pageStrokes[pageNum]) ||
          (pageNum === note.document.currentPage ? note.strokes : []);

        const pageCanvas = await renderCompositeCanvas(
          width,
          height,
          note.backgroundTemplate,
          pageStrokes,
          note.images,
          note.textBlocks,
          page,
          isDark
        );

        const imgData = pageCanvas.toDataURL('image/jpeg', 0.9);

        if (pageNum > 1) {
          pdf.addPage([width, height], orientation);
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
      }
    } catch (err) {
      console.error('Error al generar PDF multipágina:', err);
    }
  } else {
    const currentStrokes = note.strokes || [];
    const canvas = await renderCompositeCanvas(
      width,
      height,
      note.backgroundTemplate,
      currentStrokes,
      note.images,
      note.textBlocks,
      undefined,
      isDark
    );

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
  }

  const cleanTitle = (note.title || 'nota').toLowerCase().replace(/\s+/g, '-');
  pdf.save(`${cleanTitle}-anotada.pdf`);
}
