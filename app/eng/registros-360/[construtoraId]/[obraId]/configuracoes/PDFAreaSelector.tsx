'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

type PDFAreaSelectorProps = {
  pdfFile?: File | null;
  pdfUrl?: string | null;
  onSelect: (imageDataUrl: string) => void;
  onCancel: () => void;
};

const PDFJS_VERSION = '3.11.174';
const CDNS: { script: string; worker: string }[] = [
  {
    script: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`,
    worker: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`,
  },
  {
    script: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
    worker: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
  },
];

declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (src: string | { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> };
      GlobalWorkerOptions: { workerSrc: string };
    };
  }
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (n: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar script'));
    document.head.appendChild(script);
  });
}

function waitForPdfLib(maxAttempts = 20, intervalMs = 150): Promise<typeof window.pdfjsLib> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      if (typeof window !== 'undefined' && window.pdfjsLib?.getDocument) {
        resolve(window.pdfjsLib);
        return;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        reject(new Error('PDF.js não foi carregado. Verifique sua conexão ou desative bloqueadores.'));
        return;
      }
      setTimeout(check, intervalMs);
    };
    setTimeout(check, 50);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export default function PDFAreaSelector({ pdfFile, pdfUrl, onSelect, onCancel }: PDFAreaSelectorProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState<number | null>(null); // Inicialmente null para calcular auto-fit
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Carregando biblioteca de PDF...');
  const [error, setError] = useState<string | null>(null);
  const [pdfLib, setPdfLib] = useState<typeof window.pdfjsLib | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCanvas, setPageCanvas] = useState<HTMLCanvasElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Carregar biblioteca PDF.js (uma vez)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingMessage('Carregando biblioteca de PDF...');
        setError(null);
        let lib: typeof window.pdfjsLib | null = null;
        let workerSrc = '';

        for (let i = 0; i < CDNS.length; i++) {
          if (cancelled) return;
          const { script: scriptUrl, worker } = CDNS[i];
          try {
            await loadScript(scriptUrl);
            if (cancelled) return;
            lib = await waitForPdfLib();
            workerSrc = worker;
            break;
          } catch {
            continue;
          }
        }

        if (cancelled || !lib) {
          throw new Error('PDF.js não foi carregado. Verifique sua conexão ou desative bloqueadores.');
        }

        lib.GlobalWorkerOptions.workerSrc = workerSrc;
        if (cancelled) return;
        setPdfLib(lib);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar biblioteca de PDF.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Reset scale ao mudar de página para recalcular auto-fit
  useEffect(() => {
    if (pdfDoc) {
      setScale(null); // Reset scale para recalcular auto-fit na nova página
    }
  }, [pageNumber, pdfDoc]);

  // 2. Carregar documento PDF (prioriza ArrayBuffer do File – evita blob + worker)
  useEffect(() => {
    if (!pdfLib || (!pdfFile && !pdfUrl)) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setLoadingMessage('Carregando arquivo PDF...');
        setError(null);
        setPdfDoc(null);
        setNumPages(0);
        setScale(null); // Reset scale para recalcular auto-fit

        let source: string | { data: ArrayBuffer };

        if (pdfFile) {
          const buf = await pdfFile.arrayBuffer();
          source = { data: buf };
        } else if (pdfUrl) {
          source = pdfUrl;
        } else {
          throw new Error('Nenhum PDF fornecido.');
        }

        if (cancelled) return;
        setLoadingMessage('Processando PDF...');

        const task = pdfLib.getDocument(source);
        const pdf = await withTimeout(
          task.promise,
          30000,
          'O PDF demorou muito para carregar. Tente um arquivo menor ou recarregue.'
        );

        if (cancelled) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar o PDF.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfLib, pdfFile, pdfUrl]);

  // 3. Renderizar página no canvas (mount exclusivo – sem filhos React)
  useEffect(() => {
    if (!pdfDoc || !pdfLib) return;
    const mount = canvasMountRef.current;
    const wrapper = wrapperRef.current;
    if (!mount || !wrapper) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setLoadingMessage('Renderizando página...');

        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        // Calcular escala inicial (auto-fit) na primeira renderização ou ao mudar de página
        let finalScale = scale;
        if (scale === null) {
          // Aguardar um frame para garantir que o container tenha dimensões
          await new Promise(resolve => setTimeout(resolve, 0));
          
          if (cancelled) return;
          
          // Obter dimensões do container (usar getBoundingClientRect para maior precisão)
          const containerRect = wrapper.getBoundingClientRect();
          const containerWidth = containerRect.width || wrapper.clientWidth || 800;
          const containerHeight = containerRect.height || wrapper.clientHeight || 600;
          
          // Obter dimensões naturais da página do PDF (scale 1.0)
          const naturalViewport = page.getViewport({ scale: 1.0 });
          const pdfWidth = naturalViewport.width;
          const pdfHeight = naturalViewport.height;
          
          // Calcular escala necessária para caber no container
          const scaleX = containerWidth / pdfWidth;
          const scaleY = containerHeight / pdfHeight;
          const fitScale = Math.min(scaleX, scaleY);
          
          // Aplicar margem de segurança (10%)
          finalScale = fitScale * 0.9;
          
          // Garantir que não seja menor que o mínimo do slider (0.1)
          finalScale = Math.max(0.1, finalScale);
          
          if (!cancelled) {
            setScale(finalScale);
          }
        }

        const viewport = page.getViewport({ scale: finalScale || 1.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setLoading(false);
          return;
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        if (cancelled) return;

        while (mount.firstChild) {
          mount.removeChild(mount.firstChild);
        }
        mount.appendChild(canvas);
        setPageCanvas(canvas);
        setLoading(false);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao renderizar página.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pdfLib, pageNumber, scale]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!wrapperRef.current || loading) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsSelecting(true);
      setStartPos({ x, y });
      setSelection({ x, y, width: 0, height: 0 });
    },
    [loading]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelecting || !startPos || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setSelection({
        x: Math.min(startPos.x, cx),
        y: Math.min(startPos.y, cy),
        width: Math.abs(cx - startPos.x),
        height: Math.abs(cy - startPos.y),
      });
    },
    [isSelecting, startPos]
  );

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selection || !pdfDoc || !pdfLib || !wrapperRef.current || !canvasRef.current || !pageCanvas) return;
    if (selection.width < 50 || selection.height < 50) return;

    const HIGH_RES_SCALE = 3.0;
    setExporting(true);
    try {
      const page = await pdfDoc.getPage(pageNumber);
      
      // Criar canvas temporário em memória com alta resolução
      const hiResViewport = page.getViewport({ scale: HIGH_RES_SCALE });
      const hiWidth = hiResViewport.width;
      const hiHeight = hiResViewport.height;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = hiWidth;
      tempCanvas.height = hiHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        setExporting(false);
        return;
      }
      
      // Renderizar página completa em alta resolução no canvas temporário
      await page.render({
        canvasContext: tempCtx,
        viewport: hiResViewport,
      }).promise;

      // Obter dimensões do canvas visível (já renderizado com scale atual)
      const visibleCanvasWidth = pageCanvas.width;
      const visibleCanvasHeight = pageCanvas.height;
      
      // Calcular proporção entre canvas visível e canvas de alta resolução
      const scaleRatioX = hiWidth / visibleCanvasWidth;
      const scaleRatioY = hiHeight / visibleCanvasHeight;
      
      // Converter coordenadas da seleção (relativas ao wrapper) para coordenadas do canvas visível
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const canvasRect = pageCanvas.getBoundingClientRect();
      
      // Calcular offset da seleção relativo ao canvas visível
      const selectionXOnCanvas = selection.x - (canvasRect.left - wrapperRect.left);
      const selectionYOnCanvas = selection.y - (canvasRect.top - wrapperRect.top);
      
      // Converter para coordenadas no canvas de alta resolução
      const cropX = Math.max(0, Math.min(hiWidth, selectionXOnCanvas * scaleRatioX));
      const cropY = Math.max(0, Math.min(hiHeight, selectionYOnCanvas * scaleRatioY));
      const cropW = Math.max(1, Math.min(hiWidth - cropX, selection.width * scaleRatioX));
      const cropH = Math.max(1, Math.min(hiHeight - cropY, selection.height * scaleRatioY));

      // Extrair a área recortada do canvas de alta resolução
      const out = canvasRef.current;
      out.width = Math.round(cropW);
      out.height = Math.round(cropH);
      const ctx = out.getContext('2d');
      if (!ctx) {
        setExporting(false);
        return;
      }
      
      // Desenhar apenas a área selecionada do canvas de alta resolução
      ctx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, out.width, out.height);
      onSelect(out.toDataURL('image/png'));
    } finally {
      setExporting(false);
    }
  }, [selection, pdfDoc, pdfLib, pageNumber, pageCanvas, onSelect]);

  const showLibraryLoading = loading && !pdfLib;

  if (showLibraryLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-white">{loadingMessage}</p>
          <p className="text-sm text-slate-400 mt-2">Isso pode levar alguns segundos</p>
          {error && (
            <div className="mt-4">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Recarregar página
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Selecione a Área da Planta</h2>
            <p className="text-sm text-slate-400 mt-1">
              Clique e arraste para selecionar a área do PDF que será usada como imagem da planta
            </p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm flex items-center justify-between gap-2">
            <span>{error}</span>
            <button onClick={() => window.location.reload()} className="text-xs underline hover:text-red-300 shrink-0">
              Recarregar
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Página:</label>
            <select
              value={pageNumber}
              onChange={(e) => setPageNumber(Number(e.target.value))}
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
              disabled={loading || numPages === 0}
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} / {numPages}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Zoom:</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={scale || 1.0}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-32"
              disabled={loading || scale === null}
            />
            <span className="text-sm text-white w-12">{scale ? Math.round(scale * 100) : 0}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-950 rounded-lg p-4 flex items-center justify-center min-h-[280px]">
          <div
            ref={wrapperRef}
            className="relative flex items-center justify-center cursor-crosshair min-w-[200px] min-h-[200px] w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div ref={canvasMountRef} className="min-w-[200px] min-h-[200px]" />
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 rounded z-10 pointer-events-none">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className="text-slate-400 text-sm">{loadingMessage}</p>
              </div>
            )}
            {selection && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none z-20"
                style={{
                  left: selection.x,
                  top: selection.y,
                  width: selection.width,
                  height: selection.height,
                }}
              >
                <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {Math.round(selection.width)} × {Math.round(selection.height)}px
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleConfirm()}
            disabled={!selection || !pdfDoc || exporting || selection.width < 50 || selection.height < 50}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exportando em alta resolução...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar Seleção
              </>
            )}
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
