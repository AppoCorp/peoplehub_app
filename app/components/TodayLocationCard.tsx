'use client';

import React from 'react';
import { CalendarDays, ExternalLink, MapPin } from 'lucide-react';
import { AttendanceRecord, UserSession } from '../services/api';

interface TodayLocationCardProps {
  session: UserSession;
  record: AttendanceRecord | null;
  clockInLabel: string; // already formatted, e.g. "09:42 AM"
}

const ZOOM = 16;
const TILE = 256;

// Standard slippy-map maths: which OpenStreetMap tile holds this point, and where inside it
function tileFor(lat: number, lng: number) {
  const n = 2 ** ZOOM;
  const x = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { tx: Math.floor(x), ty: Math.floor(y), fx: x - Math.floor(x), fy: y - Math.floor(y), n };
}

function parseCoord(value: unknown, limit: number): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(num) && Math.abs(num) <= limit && num !== 0 ? num : null;
}

// Left third: today's date. Right two thirds: where you clocked in (only ever your own record).
export default function TodayLocationCard({ session, record, clockInLabel }: TodayLocationCardProps) {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });
  const month = now.toLocaleDateString('en-US', { month: 'short' });

  const lat = parseCoord(record?.latitude, 90);
  const lng = parseCoord(record?.longitude, 180);
  const hasPoint = lat !== null && lng !== null;

  const hasCustomPhoto = !!session.userImage && !session.userImage.includes('img/gravatar.png') && !session.userImage.includes('default-avatar');

  const chip = record ? `In ${clockInLabel}${record.working_from ? ` · ${record.working_from}` : ''}` : 'Not clocked in';

  const pin = (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[78%] flex flex-col items-center">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-white shadow-lg">
        <img
          src={session.userImage || '/default-avatar-round.png'}
          alt="You"
          className={`w-full h-full object-cover ${hasCustomPhoto ? '' : 'scale-[1.5]'}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default-avatar-round.png';
          }}
        />
      </div>
      <div className="w-2 h-2 -mt-1 rotate-45 bg-white shadow" />
    </div>
  );

  const chipEl = (
    <span className="absolute left-2 bottom-2 max-w-[75%] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 shadow-md text-[11px] font-bold text-slate-700 dark:text-slate-200">
      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="truncate">{chip}</span>
    </span>
  );

  let mapBody: React.ReactNode;
  if (hasPoint) {
    const { tx, ty, fx, fy, n } = tileFor(lat!, lng!);
    const tiles: React.ReactNode[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = (((tx + dx) % n) + n) % n;
        const y = ty + dy;
        if (y < 0 || y >= n) continue;
        tiles.push(
          <img
            key={`${dx}:${dy}`}
            src={`https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`}
            alt=""
            draggable={false}
            width={TILE}
            height={TILE}
            className="absolute max-w-none select-none"
            style={{ left: (dx + 1) * TILE, top: (dy + 1) * TILE }}
          />
        );
      }
    }
    mapBody = (
      <>
        {/* 3x3 tiles, shifted so the clock-in point sits in the middle of the card */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{ width: TILE * 3, height: TILE * 3, transform: `translate(${-(TILE + fx * TILE)}px, ${-(TILE + fy * TILE)}px)` }}
        >
          {tiles}
        </div>
        {pin}
        {chipEl}
        <span className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-500">
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
        <span className="absolute right-1.5 bottom-0.5 text-[8px] text-slate-500/80">© OpenStreetMap</span>
      </>
    );
  } else {
    // No coordinates recorded: a calm drawn map so the card still looks finished
    mapBody = (
      <>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="240" height="112" fill="#f1f4f9" />
          <path d="M-10 78 C40 60 70 96 120 74 S200 40 250 58" stroke="#cfe6f7" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M30 -5 L70 120 M120 -5 L150 120 M200 -5 L215 120" stroke="#e2e8f0" strokeWidth="5" fill="none" />
          <path d="M-5 30 L250 18 M-5 100 L250 96" stroke="#e2e8f0" strokeWidth="5" fill="none" />
        </svg>
        {pin}
        {chipEl}
      </>
    );
  }

  const mapClasses = 'relative col-span-2 h-28 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm bg-slate-100 block';

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="relative h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3f51b5] text-white shadow-sm px-3.5 py-3 flex flex-col justify-between">
        {/* Soft shapes for depth */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 120 112" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="112" cy="18" r="34" fill="#ffffff" fillOpacity="0.07" />
          <path d="M0 84 C26 70 48 96 76 84 S112 70 120 76 V112 H0 Z" fill="#ffffff" fillOpacity="0.1" />
          <path d="M0 98 C30 88 52 108 84 96 S112 92 120 94 V112 H0 Z" fill="#ffffff" fillOpacity="0.08" />
        </svg>
        <div className="relative flex items-start justify-between">
          <span className="text-sm font-semibold opacity-90">{weekday}</span>
          <CalendarDays className="w-4.5 h-4.5 opacity-80" />
        </div>
        <span className="relative text-5xl font-extrabold leading-none tracking-tight">{now.getDate()}</span>
        <span className="relative self-start px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">{month}</span>
      </div>

      {hasPoint ? (
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open clock-in location in Google Maps"
          className={`${mapClasses} active:scale-[0.99] transition-transform`}
        >
          {mapBody}
        </a>
      ) : (
        <div className={mapClasses}>{mapBody}</div>
      )}
    </div>
  );
}
