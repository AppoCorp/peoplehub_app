'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Globe, 
  Phone, 
  Building, 
  LogOut, 
  Trash2,
  X,
  Briefcase
} from 'lucide-react';
import ApiService, { UserSession } from '../services/api';

interface ProfileViewProps {
  session: UserSession;
  onLogout: () => void;
}

export default function ProfileView({ session, onLogout }: ProfileViewProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userMobile, setUserMobile] = useState(session.userMobile || '');
  const [userEmail, setUserEmail] = useState(session.userEmail || '');
  const [userName, setUserName] = useState(session.userName || 'User');
  const [userImage, setUserImage] = useState(session.userImage || '');
  const [designation, setDesignation] = useState<string>('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const meRes = await ApiService.getMe(session.baseUrl, session.token);
        const meData = meRes?.data || meRes;
        if (meData) {
          const mobile = meData.mobile_with_phonecode || meData.mobile || meData.phone || '';
          if (mobile) {
            setUserMobile(mobile);
            session.userMobile = mobile;
          }
          if (meData.name) {
            setUserName(meData.name);
            session.userName = meData.name;
          }
          if (meData.email) {
            setUserEmail(meData.email);
            session.userEmail = meData.email;
          }
          if (meData.image_url || meData.image) {
            const img = meData.image_url || meData.image;
            setUserImage(img);
            session.userImage = img;
          }
          if (meData.employee_detail?.designation?.name || meData.designation_name) {
            setDesignation(meData.employee_detail?.designation?.name || meData.designation_name);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user profile details:', err);
      }
    };

    fetchUserProfile();
  }, [session]);

  const cleanPortalUrl = (url: string) => {
    return url.replace('https://', '').replace('http://', '').replace(/\/+$/, '');
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col pt-5 sm:pt-7 pb-8 font-sans px-2 gap-5">
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          My Profile
        </h2>
      </div>

      {/* Profile Header Card */}
      <div className="flex flex-col items-center py-7 px-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-md overflow-hidden relative flex items-center justify-center shrink-0 mb-3.5 ring-2 ring-primary/20">
          {userImage ? (
            <img 
              src={userImage} 
              alt={userName} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <User className="w-12 h-12 text-primary" />
          )}
        </div>

        {/* Name and Contact info */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center">
          {userName}
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-0.5">
          {userEmail}
        </span>
        {designation && (
          <span className="mt-2.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
            <Briefcase className="w-3 h-3 text-slate-400" />
            {designation}
          </span>
        )}
      </div>

      {/* Workspace & Contact Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3">
        <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
          Account & Workspace
        </h4>

        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
          
          {/* Row: Phone Number */}
          <div className="flex items-center gap-3.5 py-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-100 dark:border-slate-800">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                PHONE NUMBER
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {userMobile || '--'}
              </span>
            </div>
          </div>

          {/* Row: Email Address */}
          <div className="flex items-center gap-3.5 py-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-100 dark:border-slate-800">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                EMAIL ADDRESS
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {userEmail || '--'}
              </span>
            </div>
          </div>

          {/* Row: Portal URL */}
          <div className="flex items-center gap-3.5 py-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-100 dark:border-slate-800">
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

          {/* Row: Organization Name */}
          <div className="flex items-center gap-3.5 py-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-100 dark:border-slate-800">
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

      {/* Logout Button & Version Info */}
      <div className="pt-2 flex flex-col items-center gap-3">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full sm:w-auto px-10 py-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-2xl text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
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
