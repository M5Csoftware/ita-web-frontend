'use client';

import React from 'react';
import { 
  Menu, 
  Search, 
  Bell,
  Plane,
  ShieldCheck
} from 'lucide-react';
import { NavPage } from './Sidebar';

interface NavbarProps {
  activePage: NavPage;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  stationCode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  stationCode = 'DEL / BOM',
}) => {
  const getPageTitle = (page: NavPage) => {
    switch (page) {
      case 'dashboard':
        return 'AWB Operations & Lifecycle';
      case 'docket':
        return 'Create Cargo Docket & Consignment Note';
      case 'stock':
        return 'AWB Stock Management (Res 600b)';
      case 'bookings':
        return 'Shipment Bookings & Dimensions';
      case 'mawb':
        return 'MAWB & HAWB Consolidation';
      case 'manifest':
        return 'Flight Manifests (FFM)';
      case 'eawb':
        return 'e-AWB EDI Messaging Center';
      case 'billing':
        return 'Rates Engine, GST & CASS Settlement';
      case 'master':
        return 'IATA Master Data & Agent Profile';
      default:
        return 'IATA Air Cargo Operations';
    }
  };

  const getPageSubtitle = (page: NavPage) => {
    switch (page) {
      case 'dashboard':
        return 'Real-time AWB stage pipeline, capacity tracking, and operational action queue';
      case 'docket':
        return 'Shipment counter intake, dimensional cubing (L×W×H÷6000), E-Way bill mapping, and AWB link';
      case 'stock':
        return 'IATA Resolution 600b Mod-7 check digit generator, airline stock series, and audit-locked void control';
      case 'bookings':
        return 'Multi-piece dimensional cubing (L×W×H÷6000), chargeable weight calculation, and booking queue';
      case 'mawb':
        return 'Master AWB issuing, House AWB groupage consolidation, weight parity checks, and Original 1/2/3 multi-copy print';
      case 'manifest':
        return 'Flight allocation, cargo manifest generation, gross weight reconciliation, and departure lock';
      case 'eawb':
        return 'Direct airline EDI teletype feed, Cargo-IMP FWB/FHL dispatch, and FSU status updates';
      case 'billing':
        return 'Quantity weight slab tariffs (+45 to +1000kg), statutory 18% GST invoicing, and IATA CASS reconciliation';
      case 'master':
        return 'Airline 3-digit prefixes, airport codes, shippers, consignees, and accredited issuing agent profile';
      default:
        return 'End-to-end Air Waybill operations following IATA standards';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="w-full px-6 sm:px-8 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          
          {/* Left: Mobile hamburger + Page Title & Subtitle */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
                {getPageTitle(activePage)}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5 hidden sm:block">
                {getPageSubtitle(activePage)}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Global search AWB, HAWB, Booking, Flight, or Shipper..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD] transition-all font-sans"
              />
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            {/* Station Hub Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <Plane className="w-3.5 h-3.5 text-[#2C5EAD]" />
              <span>Hub: <span className="font-mono text-[#2C5EAD] font-bold">{stationCode}</span></span>
            </div>

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
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1591DC]"></span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
