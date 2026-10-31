'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  PenLine,
} from 'lucide-react';
import ApiService, { UserSession, PolicyRecord } from '../services/api';

interface PoliciesViewProps {
  session: UserSession;
}

const CACHE_KEY = 'ph_cache_policies';

export default function PoliciesView({ session }: PoliciesViewProps) {
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Acknowledge flow
  const [signing, setSigning] = useState(false);
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const selected = policies.find((p) => p.id === selectedId) || null;

  const fetchPolicies = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const list = await ApiService.getPolicies(session.baseUrl, session.token);
      setPolicies(list);
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch policies');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setPolicies(JSON.parse(cached));
        setIsLoading(false);
      } catch (e) {
        console.error('Failed to parse cached policies', e);
      }
    }
    fetchPolicies(!!cached);
  }, [session]);

  // Hardware/browser back closes the open policy
  useEffect(() => {
    const onPop = () => {
      setSelectedId(null);
      setSigning(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openPolicy = (id: number) => {
    setSelectedId(id);
    window.history.pushState({ tab: 'policies', form: 'policy' }, '', '#policies');
  };

  const closePolicy = () => {
    if (window.history.state?.form) {
      window.history.back();
    } else {
      setSelectedId(null);
      setSigning(false);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '--';
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filtered = policies.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || p.title.toLowerCase().includes(query);
  });

  // ---- signature pad ----
  const startSigning = () => {
    setSignMode('draw');
    setTypedName('');
    setHasDrawn(false);
    setSigning(true);
  };

  const pointFor = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = pointFor(e);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pointFor(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const onPointerUp = () => {
    drawingRef.current = false;
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // A typed name is turned into a signature image, so the server gets the same kind of PNG either way
  const typedSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.font = "italic 56px 'Brush Script MT', 'Segoe Script', cursive";
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), 24, 100, 552);
    return canvas.toDataURL('image/png');
  };

  const submitAcknowledge = async () => {
    if (!selected) return;

    let signature: string | undefined;
    if (selected.signature_required) {
      if (signMode === 'draw') {
        if (!hasDrawn || !canvasRef.current) {
          setErrorMsg('Please sign in the box before submitting.');
          return;
        }
        signature = canvasRef.current.toDataURL('image/png');
      } else {
        if (!typedName.trim()) {
          setErrorMsg('Please type your name before submitting.');
          return;
        }
        signature = typedSignature();
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await ApiService.acknowledgePolicy(session.baseUrl, session.token, selected.id, signature);
      const today = new Date().toISOString().slice(0, 10);
      const updated = policies.map((p) => (p.id === selected.id ? { ...p, acknowledged: true, acknowledged_on: today } : p));
      setPolicies(updated);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      setSigning(false);
      fetchPolicies(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not acknowledge this policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorBox = errorMsg && (
    <div className="flex items-start justify-between gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs border border-rose-100 dark:border-rose-900/50">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
        <span className="leading-snug break-words">{errorMsg}</span>
      </div>
      <button type="button" onClick={() => setErrorMsg(null)} className="p-1 -mr-1 -mt-1 rounded-lg text-rose-600 hover:bg-rose-100/50 cursor-pointer shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // ---------------- one policy ----------------
  if (selected) {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 pt-2 md:pt-4 pb-24 md:pb-6 font-sans">
        <div className="flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <button
            type="button"
            onClick={closePolicy}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 break-words min-w-0">{selected.title}</h2>
        </div>

        {errorBox}

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Published</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(selected.publish_date)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>
            {selected.acknowledged ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">Acknowledged {selected.acknowledged_on ? 'on ' + formatDate(selected.acknowledged_on) : ''}</span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">Pending</span>
            )}
          </div>
          {selected.signature_required && !selected.acknowledged && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <PenLine className="w-3.5 h-3.5" /> This policy needs your signature.
            </div>
          )}

          {selected.file_url ? (
            <a
              href={selected.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4" /> {selected.is_link ? 'Open link' : 'Open document'}
            </a>
          ) : (
            <p className="text-xs text-slate-400">No document is attached to this policy.</p>
          )}
        </div>

        {!selected.acknowledged && !signing && (
          <button
            type="button"
            onClick={() => (selected.signature_required ? startSigning() : submitAcknowledge())}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-sm tracking-wider active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
          >
            {isSubmitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <CheckCircle2 className="w-4.5 h-4.5" />}
            {isSubmitting ? 'SUBMITTING...' : selected.signature_required ? 'Sign and Acknowledge' : 'Acknowledge'}
          </button>
        )}

        {signing && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
              {([['draw', 'Draw'], ['type', 'Type']] as const).map(([key, text]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSignMode(key)}
                  className={`py-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                    signMode === key ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>

            {signMode === 'draw' ? (
              <div className="flex flex-col gap-2">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={220}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className="w-full h-44 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 touch-none"
                />
                <button type="button" onClick={clearPad} className="self-end text-[11px] font-bold text-slate-500 cursor-pointer">Clear</button>
              </div>
            ) : (
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-base text-slate-800 dark:text-slate-100 outline-none focus:border-primary"
              />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSigning(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAcknowledge}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- the list ----------------
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pt-2 md:pt-4 pb-24 md:pb-6 font-sans">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">Policies</h2>

        <button
          type="button"
          onClick={() => fetchPolicies(true)}
          disabled={isLoading || isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm hover:shadow"
        >
          {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>{isRefreshing ? 'REFRESHING...' : 'REFRESH'}</span>
        </button>
      </div>

      {errorBox}

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search policies"
          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-primary"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col gap-2">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
          <FileText className="w-10 h-10 mb-3 stroke-[1.5]" />
          <p className="text-sm font-semibold">{policies.length === 0 ? 'No policies have been added yet.' : 'No policies match your search.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openPolicy(p.id)}
              className="w-full text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex items-start gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 break-words">{p.title}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">Published {formatDate(p.publish_date)}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.acknowledged ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Acknowledged</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">Pending</span>
                  )}
                  {p.signature_required && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">Signature required</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
