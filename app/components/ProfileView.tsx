'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Globe, 
  Phone, 
  Building, 
  LogOut, 
  ChevronRight,
  Shield,
  Trash2,
  X
} from 'lucide-react';
import { UserSession } from '../services/api';

interface ProfileViewProps {
  session: UserSession;
  onLogout: () => void;
}

export default function ProfileView({ session, onLogout }: ProfileViewProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const cleanPortalUrl = (url: string) => {
    return url.replace('https://', '').replace('http://', '').replace(/\/+$/, '');
  };

  return (
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between pt-1 pb-4 font-sans px-1">
      
      {/* Top and Middle Content */}
      <div className="flex flex-col gap-4">
        {/* Header View */}
        <div className="pb-1 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            My Profile
          </h2>
        </div>

        {/* Profile Header Avatar */}
        <div className="flex flex-col items-center py-6 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm gap-3">
          
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-primary/10 dark:bg-slate-800 border-2 border-primary/20 dark:border-slate-700 overflow-hidden relative shadow-sm flex items-center justify-center shrink-0">
            {session.userImage ? (
              <img 
                src={session.userImage} 
                alt={session.userName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User className="w-12 h-12 text-primary" />
            )}
          </div>

          {/* User basic details */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {session.userName}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {session.userEmail}
            </span>
          </div>
        </div>

        {/* Info Cards details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Appo Workspace
          </h4>

          <div className="flex flex-col divide-y divide-slate-50 dark:divide-slate-800/50">
            
            {/* Row: Portal URL */}
            <div className="flex items-center gap-3.5 py-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  PORTAL URL
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {cleanPortalUrl(session.baseUrl)}
                </span>
              </div>
            </div>

            {/* Row: Mobile Number */}
            {session.userMobile && (
              <div className="flex items-center gap-3.5 py-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    MOBILE NUMBER
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {session.userMobile}
                  </span>
                </div>
              </div>
            )}

            {/* Row: Organization Name */}
            <div className="flex items-center gap-3.5 py-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                <Building className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  ORGANIZATION NAME
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {session.companyName}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Section: Logout button + Version indicator */}
      <div className="mt-auto pt-6 flex flex-col items-center gap-3">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="px-10 py-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-2xl text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>

        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Version 1.0.0
        </div>
      </div>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Confirm Logout
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Are you sure you want to log out from this HR workspace? You will need to log in again to access details.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-rose-200 dark:shadow-none"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
