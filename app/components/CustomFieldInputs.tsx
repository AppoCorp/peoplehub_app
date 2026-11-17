'use client';

import React from 'react';
import { Upload, X } from 'lucide-react';
import { FormFieldConfig } from '../services/api';

const INPUT = 'w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200';
const LABEL = 'text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider';

const toISODate = (val: string): string => {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface Props {
  fields: FormFieldConfig[];
  values: Record<string, any>;
  setValues: (v: Record<string, any>) => void;
  /** Resize / compress a picked image before it is kept for upload */
  processFile?: (file: File) => Promise<File>;
}

/** The custom fields an admin added to a form (text, number, date, dropdown, radio, checkbox and file), drawn from the form settings */
export default function CustomFieldInputs({ fields, values, setValues, processFile }: Props) {
  const custom = fields.filter((f) => f.custom);
  const set = (key: string, v: any) => setValues({ ...values, [key]: v });

  return (
    <>
      {custom.map((field) => {
        const key = field.key;
        const options = field.options || [];
        const required = field.mandatory;
        const fileId = `cf-file-${key}`;

        return (
          <div key={key} className="flex flex-col gap-2">
            <label className={LABEL}>
              {field.label} {required && <span className="text-red-500">*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea value={values[key] || ''} onChange={(e) => set(key, e.target.value)} className={INPUT} rows={3} />
            ) : field.type === 'select' ? (
              <select value={values[key] || ''} onChange={(e) => set(key, e.target.value)} className={INPUT}>
                <option value="">Select {field.label.toLowerCase()}</option>
                {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
              </select>
            ) : field.type === 'radio' ? (
              <div className="flex flex-wrap gap-4 mt-1">
                {options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input type="radio" name={key} checked={values[key] === opt} onChange={() => set(key, opt)} className="text-primary focus:ring-primary focus:ring-2 border-slate-300" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : field.type === 'checkbox' ? (
              <div className="flex flex-wrap gap-4 mt-1">
                {options.map((opt, i) => {
                  const current: string[] = Array.isArray(values[key]) ? values[key] : [];
                  return (
                    <label key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={current.includes(opt)}
                        onChange={(e) => set(key, e.target.checked ? [...current, opt] : current.filter((v) => v !== opt))}
                        className="text-primary focus:ring-primary focus:ring-2 border-slate-300 rounded"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            ) : field.type === 'date' ? (
              <input type="date" value={toISODate(values[key] || '')} onChange={(e) => set(key, e.target.value)} className={INPUT} />
            ) : field.type === 'number' ? (
              <input type="number" inputMode="decimal" value={values[key] || ''} onChange={(e) => set(key, e.target.value)} className={INPUT} />
            ) : field.type === 'file' ? (
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id={fileId}
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) set(key, processFile ? await processFile(file) : file);
                  }}
                />
                <div
                  onClick={() => document.getElementById(fileId)?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 hover:border-primary/50 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-slate-800 flex items-center justify-center text-primary">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{values[key] ? 'Change File' : 'Attach File'}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{values[key] ? values[key].name : 'Upload JPEG, PNG or PDF (Max 5MB)'}</span>
                </div>
                {values[key] && (
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="truncate max-w-[85%]">{values[key].name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = { ...values };
                        delete next[key];
                        setValues(next);
                        const input = document.getElementById(fileId) as HTMLInputElement | null;
                        if (input) input.value = '';
                      }}
                      className="text-red-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <input type="text" value={values[key] || ''} onChange={(e) => set(key, e.target.value)} className={INPUT} />
            )}
          </div>
        );
      })}
    </>
  );
}
