'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  FileSpreadsheet, 
  Boxes, 
  PlaneTakeoff, 
  Send, 
  Receipt, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export type NavPage = 
  | 'dashboard' 
  | 'stock' 
  | 'bookings' 
  | 'mawb' 
  | 'manifest' 
  | 'eawb' 
  | 'billing' 
  | 'master';

export type UserRole = 'Operations' | 'Admin' | 'Accounts';

interface SidebarProps {
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  stockCount?: number;
  bookingsCount?: number;
  mawbsCount?: number;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onPageChange,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  stockCount = 4,
  bookingsCount = 3,
  mawbsCount = 3,
  currentRole = 'Operations',
  onRoleChange,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavPage,
      label: 'AWB Lifecycle Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'stock' as NavPage,
      label: 'AWB Stock (Mod-7)',
      icon: Layers,
      badge: stockCount > 0 ? `${stockCount} avail` : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'bookings' as NavPage,
      label: 'Bookings & Dimensions',
      icon: Boxes,
      badge: bookingsCount > 0 ? `${bookingsCount} open` : undefined,
      badgeColor: 'bg-blue-50 text-[#2C5EAD] border-blue-200',
    },
    {
      id: 'mawb' as NavPage,
      label: 'MAWB & HAWB Consol',
      icon: FileSpreadsheet,
      badge: mawbsCount > 0 ? `${mawbsCount} mawb` : undefined,
      badgeColor: 'bg-sky-50 text-[#1591DC] border-sky-200',
    },
    {
      id: 'manifest' as NavPage,
      label: 'Flight Manifests (FFM)',
      icon: PlaneTakeoff,
    },
    {
      id: 'eawb' as NavPage,
      label: 'e-AWB EDI Messaging',
      icon: Send,
      badge: 'Cargo-IMP',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'billing' as NavPage,
      label: 'Rates, GST & CASS',
      icon: Receipt,
    },
    {
      id: 'master' as NavPage,
      label: 'Master Data Setup',
      icon: Building2,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200 shadow-sm transition-all duration-300 flex flex-col justify-between ${
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header & Nav */}
        <div className="overflow-y-auto overflow-x-hidden flex-1">
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200">
            <div className={`flex items-center gap-3.5 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2C5EAD] to-[#1591DC] flex items-center justify-center text-white shadow-md shadow-[#2C5EAD]/25 shrink-0">
                <PlaneTakeoff className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-heading text-lg text-slate-900 tracking-tight">IATA AWB</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1591DC]/10 text-[#2C5EAD] font-bold border border-[#1591DC]/30">
                      Res 600b
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate font-sans">Air Cargo Core System</p>
                </div>
              )}
            </div>

            {/* Close button for mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className={`px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
              Air Cargo Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group relative font-sans ${
                    isActive
                      ? 'bg-[#2C5EAD]/10 text-[#2C5EAD] font-bold shadow-xs'
                      : 'text-slate-600 hover:text-[#2C5EAD] hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'text-[#2C5EAD]' : 'text-slate-400 group-hover:text-[#2C5EAD] group-hover:scale-105'}`} />
                  
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#2C5EAD] rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User Role & Collapse Button */}
        <div className="p-4 border-t border-slate-200 space-y-3.5 shrink-0 bg-white">
          
          {/* User Role Selector (Section 2.1: Login & Roles) */}
          {!isCollapsed ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-[#1591DC]" />
                  Active Station Role
                </span>
                <span className="capitalize font-mono font-bold text-[#2C5EAD]">{currentRole}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {(['Operations', 'Admin', 'Accounts'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => onRoleChange?.(role)}
                    className={`py-1 rounded-md font-semibold capitalize transition-all text-center text-[11px] ${
                      currentRole === role
                        ? 'bg-[#2C5EAD] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="flex justify-center p-2.5 rounded-xl bg-slate-100 text-[#2C5EAD] text-xs font-mono font-bold"
              title={`Role: ${currentRole}`}
            >
              {currentRole.slice(0, 3)}
            </div>
          )}

          {/* IATA accreditation info */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-2 text-[11px] text-slate-400 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>IATA CASS Agent 14-3-9821</span>
            </div>
          )}

          {/* Collapse / Expand toggle button (desktop only) */}
          <div className="hidden lg:flex items-center justify-between pt-1">
            {!isCollapsed && (
              <span className="text-xs text-slate-400 font-medium">Collapse menu</span>
            )}
            <button
              onClick={onToggleCollapse}
              className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};
