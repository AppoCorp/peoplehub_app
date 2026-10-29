'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Globe, 
  Phone, 
  Building, 
  LogOut, 
  Trash2,
  X,
  Briefcase,
  Camera,
  ImagePlus,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2
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
  const [userImage, setUserImage] = useState(session.userImage || '/default-avatar.avif');
  const [designation, setDesignation] = useState<string>('');
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  // The server returns its default avatar when no photo is set
  const hasCustomPhoto = !!userImage && !userImage.includes('img/gravatar.png') && !userImage.includes('default-avatar');

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3000);
  };

  const applyImage = (url: string) => {
    setUserImage(url);
    session.userImage = url;
  };

  // Phone photos are several MB; shrink to 512px JPEG before upload
  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, 512 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })) : reject(new Error('Could not process image'))),
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Please choose a valid image'));
      };
      img.src = objectUrl;
    });

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const url = await ApiService.updateProfileImage(session.baseUrl, session.token, await compressImage(file));
      applyImage(url);
      showNotice('success', 'Profile photo updated');
    } catch (err) {
      showNotice('error', (err as Error).message || 'Failed to update photo');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoMenu(false);
    setPhotoBusy(true);
    try {
      applyImage(await ApiService.removeProfileImage(session.baseUrl, session.token));
      showNotice('success', 'Profile photo removed');
    } catch (err) {
      showNotice('error', (err as Error).message || 'Failed to remove photo');
    } finally {
      setPhotoBusy(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswords(false);
    setPasswordError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordBusy(true);
    setPasswordError('');
    try {
      await ApiService.changePassword(session.baseUrl, session.token, currentPassword, newPassword);
      closePasswordModal();
      showNotice('success', 'Password updated');
    } catch (err) {
      setPasswordError((err as Error).message || 'Failed to reset password');
    } finally {
      setPasswordBusy(false);
    }
  };

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
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col pt-0 pb-1 font-sans px-2 gap-[clamp(6px,1.4vh,20px)]">
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          My Profile
        </h2>
      </div>

      {/* Profile Header Card */}
      <div className="grow-[2] flex flex-col items-center justify-center py-2 px-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Avatar */}
        <div className="relative shrink-0 mb-[clamp(4px,1vh,14px)]">
          <div className="w-[clamp(4rem,10vh,7.5rem)] h-[clamp(4rem,10vh,7.5rem)] rounded-full bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-md overflow-hidden relative flex items-center justify-center ring-2 ring-primary/20">
            <img 
              src={userImage || '/default-avatar.avif'} 
              alt={userName} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar.avif';
              }}
            />
            {photoBusy && (
              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Edit profile photo"
            disabled={photoBusy}
            onClick={() => setShowPhotoMenu(true)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-transform disabled:opacity-60"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelected}
          />
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm grow-[3] flex flex-col gap-1.5">
        <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
          Account & Workspace
        </h4>

        <div className="flex-1 flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
          
          {/* Row: Phone Number */}
          <div className="flex-1 flex items-center gap-3.5 py-1">
            <div className="w-9 h-9 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-100 dark:border-slate-800">
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
          <div className="flex-1 flex items-center gap-3.5 py-1">
            <div className="w-9 h-9 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-100 dark:border-slate-800">
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
          <div className="flex-1 flex items-center gap-3.5 py-1">
            <div className="w-9 h-9 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-100 dark:border-slate-800">
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
          <div className="flex-1 flex items-center gap-3.5 py-1">
            <div className="w-9 h-9 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-100 dark:border-slate-800">
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
      <div className="grow flex flex-col items-center justify-end gap-[clamp(6px,1.2vh,14px)]">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full sm:w-auto px-10 py-[clamp(8px,1.5vh,16px)] bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <KeyRound className="w-4 h-4" />
          <span>RESET PASSWORD</span>
        </button>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full sm:w-auto px-10 py-[clamp(8px,1.5vh,16px)] bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-2xl text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>

        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Version 1.0.0
        </div>
      </div>

      {/* Toast */}
      {notice && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 ${notice.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {notice.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {notice.text}
        </div>
      )}

      {/* Photo Menu */}
      {showPhotoMenu && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPhotoMenu(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Profile Photo</h3>
            <button
              type="button"
              onClick={() => { setShowPhotoMenu(false); fileInputRef.current?.click(); }}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{hasCustomPhoto ? 'CHANGE PHOTO' : 'UPLOAD PHOTO'}</span>
            </button>
            {hasCustomPhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="w-full py-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>REMOVE PHOTO</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPhotoMenu(false)}
              className="w-full py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleResetPassword} className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <button type="button" onClick={closePasswordModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Reset Password</h3>

            {([
              ['Current Password', currentPassword, setCurrentPassword, 'current-password'],
              ['New Password', newPassword, setNewPassword, 'new-password'],
              ['Confirm New Password', confirmPassword, setConfirmPassword, 'new-password'],
            ] as const).map(([label, value, setValue, autoComplete]) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{label}</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                    onClick={() => setShowPasswords((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showPasswords ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            ))}

            {passwordError && <p className="text-xs font-semibold text-rose-500">{passwordError}</p>}

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={closePasswordModal}
                className="py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={passwordBusy}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {passwordBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                RESET
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
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
