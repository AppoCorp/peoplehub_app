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
  Camera,
  ImagePlus,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  UserCheck
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
  const [userImage, setUserImage] = useState(session.userImage || '/default-avatar-round.png');
  const [designation, setDesignation] = useState<string>('');
  const [reportingManager, setReportingManager] = useState<string>('');
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
    window.dispatchEvent(new Event('ph-avatar-changed'));
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
          if (meData.reporting_manager_name) {
            setReportingManager(meData.reporting_manager_name);
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
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col pt-0 pb-4 font-sans px-2 gap-4">
      
      {/* Avatar, name and designation */}
      <div className="flex flex-col items-center pt-2 pb-1">
        <div className="relative shrink-0">
          <div className="w-28 h-28 rounded-full bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-md overflow-hidden relative flex items-center justify-center">
            <img
              src={userImage || '/default-avatar-round.png'}
              alt={userName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar-round.png';
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

        <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100 text-center leading-tight">
          {userName}
        </h3>
        {designation && (
          <span className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
            {designation}
          </span>
        )}
      </div>

      {/* Details as a plain list: soft icon tile, label, value */}
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
        {([
          [Mail, 'Email', userEmail],
          [Phone, 'Phone number', userMobile],
          [Building, 'Organization', session.companyName],
          [Globe, 'Portal URL', cleanPortalUrl(session.baseUrl)],
          [UserCheck, 'Reporting manager', reportingManager],
        ] as const).map(([Icon, label, value]) => (
          <div key={label} className="flex items-center gap-3.5 py-3 px-1">
            <div className="w-10 h-10 rounded-2xl bg-primary-light dark:bg-slate-800/80 text-primary flex items-center justify-center shrink-0">
              <Icon className="w-[18px] h-[18px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{label}</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{value || '--'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reset password, logout and version */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl text-xs tracking-wider transition-all flex items-center gap-3 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <span className="w-8 h-8 rounded-xl bg-white/80 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </span>
          <span className="flex-1 text-center pr-8">RESET PASSWORD</span>
        </button>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full px-4 py-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-2xl text-xs tracking-wider transition-all flex items-center gap-3 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <span className="w-8 h-8 rounded-xl bg-white/80 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4" />
          </span>
          <span className="flex-1 text-center pr-8">LOGOUT</span>
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
