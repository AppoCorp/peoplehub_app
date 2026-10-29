'use client';

import React, { useState } from 'react';
import { Building, Home, Globe, Loader2, Pencil, Plus, X, ArrowRight, FileText } from 'lucide-react';
import ApiService, { AttendanceRegularisationRecord, UserSession } from '../services/api';

const MAX_RANGE_DAYS = 62;

const inputClass =
  'w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-200';
const labelClass = 'text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider';

const formatTime12 = (hhmm: string | null) => {
  if (!hhmm) return '--:--';
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${(h % 12 || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${suffix}`;
};

const statusMeta = (r: AttendanceRegularisationRecord) => {
  if (r.status === 'accept') {
    return { label: 'Accepted', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' };
  }
  if (r.status === 'reject') {
    return { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/40' };
  }
  return {
    label: r.current_approval_level > 1 ? `Pending (Level ${r.current_approval_level})` : 'Pending',
    cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
  };
};

const workIcon = (type: string) => {
  if (type === 'home') return <Home className="w-3 h-3 text-indigo-500" />;
  if (type === 'other') return <Globe className="w-3 h-3 text-cyan-500" />;
  return <Building className="w-3 h-3 text-primary" />;
};

// ---------------------------------------------------------------------------
// My requests list
// ---------------------------------------------------------------------------

interface ListProps {
  requests: AttendanceRegularisationRecord[];
  onEdit: (record: AttendanceRegularisationRecord) => void;
}

export function RegularisationList({ requests, onEdit }: ListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
        <FileText className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-700" />
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-3">No requests yet</h3>
        <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Tap + Regularization to apply for a missed day.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
        <span>My Requests</span>
        <span>{requests.length} Records</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {requests.map((r) => {
          const [y, mo, d] = r.date.split('-').map(Number);
          const dt = new Date(y, (mo || 1) - 1, d || 1);
          const status = statusMeta(r);

          return (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-sm flex items-center gap-4"
            >
              <div className="w-14 py-2 bg-primary-light/40 dark:bg-slate-800/80 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="text-base font-black text-primary dark:text-slate-200 leading-none">
                  {isNaN(dt.getTime()) ? '--' : dt.getDate().toString().padStart(2, '0')}
                </span>
                <span className="text-[9px] font-extrabold text-primary dark:text-slate-400 tracking-wider mt-1">
                  {isNaN(dt.getTime()) ? '---' : dt.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Clock In</span>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-100 mt-0.5">{formatTime12(r.clock_in_time)}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Clock Out</span>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-100 mt-0.5">{formatTime12(r.clock_out_time)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800/30 gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium capitalize min-w-0 truncate">
                    {workIcon(r.working_from)}
                    <span className="truncate">{r.working_from === 'other' && r.other_location ? r.other_location : r.working_from}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${status.cls}`}>
                      {status.label}
                    </span>
                    {r.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        title="Edit"
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Apply / edit form
// ---------------------------------------------------------------------------

type DateMode = 'single' | 'range' | 'multiple';

interface FormProps {
  session: UserSession;
  editing: AttendanceRegularisationRecord | null;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

const toISO = (d: Date) =>
  `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

const expandRange = (start: string, end: string): string[] => {
  const out: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last && out.length <= MAX_RANGE_DAYS) {
    out.push(toISO(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

export function RegularisationForm({ session, editing, onSaved, onError }: FormProps) {
  const [mode, setMode] = useState<DateMode>('single');
  const [singleDate, setSingleDate] = useState(editing?.date || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [multiDates, setMultiDates] = useState<string[]>([]);
  const [pendingPick, setPendingPick] = useState('');
  const [clockIn, setClockIn] = useState(editing?.clock_in_time || '09:00');
  const [clockOut, setClockOut] = useState(editing?.clock_out_time || '18:00');
  const [workFrom, setWorkFrom] = useState<'office' | 'home' | 'other'>(
    (editing?.working_from as 'office' | 'home' | 'other') || 'office'
  );
  const [otherLocation, setOtherLocation] = useState(editing?.other_location || '');
  const [reason, setReason] = useState(editing?.reason || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPickedDate = () => {
    if (pendingPick && !multiDates.includes(pendingPick)) {
      setMultiDates([...multiDates, pendingPick].sort());
    }
    setPendingPick('');
  };

  const resolveDates = (): string[] => {
    if (editing || mode === 'single') return singleDate ? [singleDate] : [];
    if (mode === 'range') return startDate && endDate ? expandRange(startDate, endDate) : [];
    return multiDates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dates = resolveDates();

    if (dates.length === 0) return onError('Please select at least one date.');
    if (mode === 'range' && !editing && startDate > endDate) return onError('Start date cannot be after end date.');
    if (dates.length > MAX_RANGE_DAYS) return onError(`Please select at most ${MAX_RANGE_DAYS} days at a time.`);
    if (workFrom === 'other' && !otherLocation.trim()) return onError('Please enter the location.');

    const payload = {
      clock_in_time: clockIn,
      clock_out_time: clockOut || undefined,
      work_from_type: workFrom,
      other_location: workFrom === 'other' ? otherLocation.trim() : undefined,
      reason: reason.trim(),
      description: description.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      if (editing) {
        await ApiService.updateAttendanceRegularisation(session.baseUrl, session.token, editing.id, dates[0], payload);
        onSaved('Regularisation request updated successfully');
      } else {
        await ApiService.createAttendanceRegularisation(session.baseUrl, session.token, dates, payload);
        onSaved('Regularisation request submitted successfully');
      }
    } catch (err: any) {
      onError(err.message || 'Failed to submit regularisation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateInput = (value: string, onChange: (v: string) => void, required = true) => (
    <input type="date" required={required} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-5"
    >
      {/* Date mode (new requests only) */}
      {!editing && (
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Dates</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
            {([['single', 'Single Day'], ['range', 'Range'], ['multiple', 'Multiple']] as const).map(([key, text]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`py-2 rounded-lg text-[10px] font-bold text-center transition-all ${
                  mode === key
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-100/50 dark:border-slate-800'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 cursor-pointer'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {editing || mode === 'single' ? (
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Select Date</label>
          {dateInput(singleDate, setSingleDate)}
        </div>
      ) : mode === 'range' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Start Date</label>
            {dateInput(startDate, setStartDate)}
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>End Date</label>
            {dateInput(endDate, setEndDate)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Pick Dates</label>
          <div className="flex gap-2">
            {dateInput(pendingPick, setPendingPick, false)}
            <button
              type="button"
              onClick={addPickedDate}
              disabled={!pendingPick}
              className="px-4 rounded-2xl bg-primary text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {multiDates.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {multiDates.map((d) => (
                <span
                  key={d}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-primary-light/40 dark:bg-slate-800 text-primary dark:text-slate-200 text-xs font-bold border border-slate-100 dark:border-slate-700"
                >
                  {d}
                  <button type="button" onClick={() => setMultiDates(multiDates.filter((x) => x !== d))} className="cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Clock In</label>
          <input type="time" required value={clockIn} onChange={(e) => setClockIn(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Clock Out (Optional)</label>
          <input type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Working from */}
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Working From</label>
        <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
          {(['office', 'home', 'other'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWorkFrom(opt)}
              className={`py-2 rounded-lg text-[10px] font-bold text-center capitalize transition-all ${
                workFrom === opt
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-100/50 dark:border-slate-800'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 cursor-pointer'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {workFrom === 'other' && (
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Location</label>
          <input
            type="text"
            required
            value={otherLocation}
            onChange={(e) => setOtherLocation(e.target.value)}
            placeholder="Where were you working from?"
            className={inputClass}
          />
        </div>
      )}

      {/* Reason + description */}
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Reason</label>
        <textarea
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why does this day need regularisation?"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Description (Optional)</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any extra details"
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-sm tracking-wider active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10 mt-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
            {editing ? 'UPDATING...' : 'SUBMITTING...'}
          </>
        ) : editing ? (
          'Update Request'
        ) : (
          'Submit Request'
        )}
      </button>
    </form>
  );
}
