'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Building2 } from 'lucide-react';
import { UserSession } from '../services/api';

interface MobileTopBarProps {
  session: UserSession;
  profileActive: boolean;
  onOpenProfile: () => void;
}

// Logo on the left; bell and the person's own avatar (opens Profile) on the right. Phones only.
export default function MobileTopBar({ session, profileActive, onOpenProfile }: MobileTopBarProps) {
  const [, refresh] = useState(0);

  // ProfileView updates session.userImage in place, so redraw when the photo changes
  useEffect(() => {
    const onChange = () => refresh((n) => n + 1);
    window.addEventListener('ph-avatar-changed', onChange);
    return () => window.removeEventListener('ph-avatar-changed', onChange);
  }, []);

  return (
    <header className="md:hidden flex items-center justify-between pb-2 mb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="h-10 flex items-center justify-start shrink-0 overflow-hidden">
        {session.companyLogo ? (
          <img src={session.companyLogo} alt="Logo" className="max-w-[150px] max-h-full object-contain object-left" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary-light dark:bg-slate-900 flex items-center justify-center border border-slate-200/40 dark:border-slate-800 shadow-sm">
            <Building2 className="w-4.5 h-4.5 text-primary" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-350 cursor-pointer active:scale-95 transition-transform"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button
          type="button"
          aria-label="Open profile"
          onClick={onOpenProfile}
          className={`w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer active:scale-95 transition-transform border-2 ${
            profileActive ? 'border-primary' : 'border-white dark:border-slate-800 shadow-sm'
          }`}
        >
          <img
            src={session.userImage || '/default-avatar-round.png'}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-avatar-round.png';
            }}
          />
        </button>
      </div>
    </header>
  );
}
