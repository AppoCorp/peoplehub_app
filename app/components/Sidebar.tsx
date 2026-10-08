'use client';

import React from 'react';
import { 
  Home, 
  CalendarRange, 
  Palmtree, 
  CalendarMinus, 
  Receipt, 
  User, 
  LogOut,
  Building2,
  Sun,
  Moon
} from 'lucide-react';
import { UserSession } from '../services/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  session: UserSession;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  session, 
  onLogout,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Home', icon: Home },
    { id: 'attendance', name: 'Attendance Log', icon: CalendarRange },
    { id: 'holidays', name: 'Holiday List', icon: Palmtree },
    { id: 'leaves', name: 'Leaves', icon: CalendarMinus },
    ...(session.mobileExpenseEnabled !== false ? [{ id: 'expenses', name: 'Expenses', icon: Receipt }] : []),
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/60 hidden md:flex flex-col justify-between py-6 px-4 transition-all duration-300">
      
      {/* Header section with Company Details */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-full flex items-center justify-start shrink-0 overflow-hidden">
            {session.companyLogo ? (
              <img 
                src={session.companyLogo} 
                alt="Logo" 
                className="max-w-full max-h-full object-contain object-left"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary-light dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800/80 mx-2" />

        {/* Navigation Menu Links */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Section: Dark Mode Toggle & Logout */}
      <div className="flex flex-col gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
            {session.userImage ? (
              <img src={session.userImage} alt={session.userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold uppercase">
                {session.userName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {session.userName}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {session.userEmail}
            </span>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800/80 mx-2" />


        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 rounded-2xl text-sm font-semibold transition-all duration-200 group cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:translate-x-0.5 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
