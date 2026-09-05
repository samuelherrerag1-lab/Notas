import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as docx from 'docx-preview';
import * as XLSX from 'xlsx';
import { DocumentData } from '../../types';

// Configuración de Worker local para PDF.js sin depender de CDNs externos (100% Offline)
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface DocumentViewerProps {
  documentData?: DocumentData;
  onPageChange?: (newPage: number) => void;
  onNumPagesDiscovered?: (numPages: number) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentData,
  onNumPagesDiscovered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [xlsxTableData, setXlsxTableData] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Renderizar PDF
  useEffect(() => {
    if (!documentData || documentData.type !== 'pdf') return;

    let isCancelled = false;
    setIsLoading(true);
    setErrorMsg(null);

    const renderPdfPage = async () => {
      try {
        // Decodificar Base64
        const base64Data = documentData.fileData.split(',')[1] || documentData.fileData;
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        if (isCancelled) return;

        if (onNumPagesDiscovered && pdf.numPages !== documentData.numPages) {
          onNumPagesDiscovered(pdf.numPages);
        }

        const pageNum = Math.max(1, Math.min(documentData.currentPage, pdf.numPages));
        const page = await pdf.getPage(pageNum);

        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        const containerWidth = container ? container.clientWidth : 800;
        const containerHeight = container ? container.clientHeight : 1000;

        // Calcular escala para ajustar al ancho del visor manteniendo aspecto nítido
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scaleX = (containerWidth - 32) / unscaledViewport.width;
        const scaleY = (containerHeight - 32) / unscaledViewport.height;
        const optimalScale = Math.min(Math.max(scaleX, 0.8), Math.max(scaleY, 1.5), 2.0);

        const viewport = page.getViewport({ scale: optimalScale });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.resetTransform();
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error('Error renderizando PDF:', err);
          setErrorMsg('No se pudo cargar la página del PDF.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    renderPdfPage();

    return () => {
      isCancelled = true;
    };
  }, [documentData, onNumPagesDiscovered]);

  // Renderizar DOCX
  useEffect(() => {
    if (!documentData || documentData.type !== 'docx' || !docxContainerRef.current) return;

    let isCancelled = false;
    setIsLoading(true);
    setErrorMsg(null);

    const renderDocx = async () => {
      try {
        const base64Data = documentData.fileData.split(',')[1] || documentData.fileData;
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = '';
          await docx.renderAsync(bytes.buffer, docxContainerRef.current, undefined, {
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
          });
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error al renderizar DOCX:', err);
          setErrorMsg('No se pudo previsualizar el archivo DOCX.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    renderDocx();

    return () => {
      isCancelled = true;
    };
  }, [documentData]);

  // Renderizar XLSX / CSV
  useEffect(() => {
    if (!documentData || (documentData.type !== 'xlsx' && documentData.type !== 'csv')) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const base64Data = documentData.fileData.split(',')[1] || documentData.fileData;
      const workbook = XLSX.read(base64Data, { type: 'base64' });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
      });

      const formatted: string[][] = rawData.slice(0, 100).map((row) =>
        row.map((cell) => (cell !== undefined && cell !== null ? String(cell) : ''))
      );

      setXlsxTableData(formatted);
    } catch (err) {
      console.error('Error al procesar hoja de cálculo:', err);
      setErrorMsg('No se pudo procesar la hoja de cálculo XLSX/CSV.');
    } finally {
      setIsLoading(false);
    }
  }, [documentData]);

  if (!documentData || documentData.type === 'none') {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-start justify-center overflow-auto pointer-events-none z-5 p-4">
      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute top-12 bg-ios-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-ios-border text-xs font-semibold text-ios-yellow flex items-center gap-2 shadow-ios-sm">
          <span className="w-3 h-3 border-2 border-ios-yellow border-t-transparent rounded-full animate-spin" />
          <span>Cargando documento...</span>
        </div>
      )}

      {/* Mensaje de error */}
      {errorMsg && (
        <div className="bg-red-50 text-ios-red text-xs px-3 py-2 rounded-lg border border-red-200 shadow-sm mt-8">
          {errorMsg}
        </div>
      )}

      {/* Renderizado de PDF */}
      {documentData.type === 'pdf' && (
        <div className="bg-white shadow-ios-card rounded-md border border-ios-borderSubtle overflow-hidden">
          <canvas ref={canvasRef} className="block" />
        </div>
      )}

      {/* Renderizado de DOCX */}
      {documentData.type === 'docx' && (
        <div
          ref={docxContainerRef}
          className="bg-white p-8 max-w-3xl w-full shadow-ios-card rounded-md border border-ios-borderSubtle text-ios-text text-sm leading-relaxed docx-preview-root"
        />
      )}

      {/* Renderizado de XLSX / CSV en tabla Apple limpia */}
      {(documentData.type === 'xlsx' || documentData.type === 'csv') && xlsxTableData.length > 0 && (
        <div className="bg-white max-w-4xl w-full shadow-ios-card rounded-ios border border-ios-border overflow-x-auto p-4">
          <div className="text-xs font-bold text-ios-textSecondary mb-2 flex items-center gap-2">
            <span>📊 {documentData.fileName}</span>
            <span className="text-[10px] bg-ios-gray5 px-1.5 py-0.5 rounded">
              {xlsxTableData.length} filas
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-ios-gray6 text-ios-text font-semibold border-b border-ios-border">
                {xlsxTableData[0]?.map((header, idx) => (
                  <th key={idx} className="p-2 border-r border-ios-borderSubtle last:border-r-0">
                    {header || `Col ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ios-borderSubtle">
              {xlsxTableData.slice(1).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-ios-yellowLight/30">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="p-2 text-ios-text border-r border-ios-borderSubtle last:border-r-0"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export async function processDocumentFile(file: File): Promise<DocumentData> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  let docType: DocumentData['type'] = 'none';

  if (extension === 'pdf') {
    docType = 'pdf';
  } else if (extension === 'docx') {
    docType = 'docx';
  } else if (extension === 'xlsx' || extension === 'xls') {
    docType = 'xlsx';
  } else if (extension === 'csv') {
    docType = 'csv';
  } else {
    throw new Error('Formato no soportado. Sube un archivo PDF, DOCX, XLSX o CSV.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      let numPages = 1;
      if (docType === 'pdf') {
        try {
          const base64Data = dataUrl.split(',')[1] || dataUrl;
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
          numPages = pdf.numPages;
        } catch (e) {
          console.warn('No se pudo extraer número inicial de páginas del PDF', e);
        }
      }

      resolve({
        type: docType,
        fileName: file.name,
        fileData: dataUrl,
        numPages,
        currentPage: 1,
        scale: 1,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
