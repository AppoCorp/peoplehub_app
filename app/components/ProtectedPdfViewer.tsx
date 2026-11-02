'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import ApiService, { UserSession } from '../services/api';

interface ProtectedPdfViewerProps {
  session: UserSession;
  policyId: number;
  title: string;
  onClose: () => void;
}

/**
 * Shows a policy PDF inside the app. The file is read through the app's own request and drawn page by page,
 * so there is no download, print or "open in another app". The document is hidden whenever the app leaves the
 * screen, and a faint watermark with the reader's name and the time sits over every page.
 */
export default function ProtectedPdfViewer({ session, policyId, title, onClose }: ProtectedPdfViewerProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [covered, setCovered] = useState(false);

  // Watermark: reader's name and the time the page was opened, tiled across the pages
  const watermark = useMemo(() => {
    const stamp = new Date().toLocaleString();
    const label = `${session.userName || 'PeopleHub'}  ${stamp}`.replace(/[<>&"']/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><text x="20" y="120" transform="rotate(-25 160 100)" font-family="Arial" font-size="15" fill="rgba(15,23,42,0.13)">${label}</text></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [session.userName]);

  // Cover the document whenever the app is not in front
  useEffect(() => {
    const hide = () => setCovered(true);
    const show = () => setCovered(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', show);
    window.addEventListener('pagehide', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    return () => {
      document.removeEventListener('visibilitychange', show);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
    };
  }, []);

  // Fetch the PDF and draw it
  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    const container = pagesRef.current;

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

        const bytes = await ApiService.getPolicyFile(session.baseUrl, session.token, policyId);
        if (cancelled) return;

        const loading = pdfjs.getDocument({ data: new Uint8Array(bytes) });
        task = loading;
        const pdf = await loading.promise;
        if (cancelled) return;

        if (!container) return;
        container.innerHTML = '';

        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = container.clientWidth || window.innerWidth;

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;

          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.marginBottom = '8px';
          canvas.style.background = '#fff';
          canvas.style.pointerEvents = 'none';
          container.appendChild(canvas);

          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
          if (n === 1) setStatus('ready');
        }
        setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setError((e as Error)?.message || 'This document could not be opened.');
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (container) container.innerHTML = '';
      task?.destroy().catch(() => undefined);
    };
  }, [policyId, session.baseUrl, session.token]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-100 dark:bg-slate-950 pdf-protected">
      <style>{`@media print { .pdf-protected { display: none !important; } }`}</style>

      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95 shrink-0"
          aria-label="Close document"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div
        className="relative flex-1 overflow-y-auto"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {status === 'error' && (
          <div className="p-6 flex flex-col items-center gap-2 text-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
          </div>
        )}

        <div ref={pagesRef} className="p-2" style={{ visibility: covered ? 'hidden' : 'visible' }} />

        {status !== 'error' && (
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: watermark, backgroundRepeat: 'repeat' }} />
        )}

        {covered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-slate-950 text-slate-500">
            <ShieldAlert className="w-7 h-7" />
            <p className="text-sm font-semibold">Protected document</p>
            <p className="text-xs">Come back to the app to continue reading.</p>
          </div>
        )}
      </div>
    </div>
  );
}
