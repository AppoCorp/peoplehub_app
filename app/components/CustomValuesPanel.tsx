'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Paperclip } from 'lucide-react';
import ApiService, { FormFieldValue, UserSession } from '../services/api';

interface Props {
  session: UserSession;
  module: 'expense' | 'claim' | 'trip' | 'advance';
  id: number;
}

/** The custom field values saved on one expense, claim, trip or advance, shown under its card when it is opened */
export default function CustomValuesPanel({ session, module, id }: Props) {
  const [rows, setRows] = useState<FormFieldValue[] | null>(null);

  useEffect(() => {
    let alive = true;
    ApiService.getFormConfig(session.baseUrl, session.token, module, id)
      .then((r) => { if (alive) setRows(r.values || []); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [session, module, id]);

  if (rows === null) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className="px-4 py-3 text-xs text-slate-400">No additional details.</div>;
  }

  return (
    <div className="mx-2 -mt-1 mb-1 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-3 flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-start justify-between gap-4 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">{r.label}</span>
          {r.type === 'file' && r.url ? (
            <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-primary truncate">
              <Paperclip className="w-3.5 h-3.5 shrink-0" /> Open file
            </a>
          ) : (
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-right break-words">{String(r.value)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
