'use client';

import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Plane, 
  ShieldCheck, 
  Radio,
  LogOut
} from 'lucide-react';
import { NavPage } from './Sidebar';
import { UserAccount } from '@/types/iata';

interface NavbarProps {
  activePage?: NavPage;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  stationCode?: string;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  isBackendConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  stationCode = 'DEL / BOM',
  currentUser,
  onLogout,
  isBackendConnected = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="w-full px-6 sm:px-8 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          
          {/* Left: Mobile hamburger + Hub & Station Indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Station / Hub pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <Plane className="w-3.5 h-3.5 text-[#2C5EAD]" />
              <span className="hidden sm:inline text-slate-500 font-medium">Station Hub:</span>
              <span className="font-mono text-[#2C5EAD] font-bold">{stationCode}</span>
            </div>

            {isBackendConnected ? (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Fastify Server Connected</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#2C5EAD] text-xs font-semibold border border-blue-100">
                <Radio className="w-3 h-3 text-[#1591DC] animate-pulse" />
                <span>Live Operations</span>
              </div>
            )}
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Global search AWB, Docket #, HAWB, Booking, Flight, or Shipper..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD] transition-all font-sans"
              />
            </div>
          </div>

          {/* Right: EDI Gateway Status, User & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* EDI Gateway Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>e-AWB EDI Active</span>
            </div>

            {/* Notifications button */}
            <button
              title="System Alerts & EDI Acknowledgements"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1591DC]"></span>
            </button>

            {/* Current User Pill & Quick Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#2C5EAD] to-[#1591DC] text-white flex items-center justify-center font-bold text-[10px] uppercase">
                    {currentUser.username.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-slate-900 block leading-tight">{currentUser.fullName.split(' ')[0]}</span>
                    <span className="text-[10px] text-[#2C5EAD] font-semibold font-mono block leading-none">{currentUser.role}</span>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Sign Out of Station"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
