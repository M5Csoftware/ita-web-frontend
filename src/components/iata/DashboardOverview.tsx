'use client';

import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Boxes,
  Send
} from 'lucide-react';
import { MawbItem, AwbStockItem, BookingItem } from '@/types/iata';

interface DashboardOverviewProps {
  mawbs: MawbItem[];
  stock: AwbStockItem[];
  bookings: BookingItem[];
  onNavigate: (page: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  mawbs,
  stock,
  bookings,
  onNavigate,
}) => {
  const availableStock = stock.filter((s) => s.status === 'AVAILABLE').length;
  const issuedAwbs = mawbs.length;
  const manifestedAwbs = mawbs.filter((m) => m.status === 'MANIFESTED' || m.status === 'DEPARTED' || m.status === 'ARRIVED').length;
  const totalWeightKg = mawbs.reduce((acc, curr) => acc + curr.grossWeightKg, 0);

  const statusSteps = [
    { label: 'Available Stock', count: availableStock, desc: 'Verified Mod-7 stock' },
    { label: 'Allotted / Booked', count: bookings.length, desc: 'Dimensional shipments' },
    { label: 'Issued (MAWB)', count: issuedAwbs, desc: 'IATA Res 600b standard' },
    { label: 'Manifested (FFM)', count: manifestedAwbs, desc: 'Flight assigned' },
    { label: 'Departed / In-Transit', count: mawbs.filter((m) => m.status === 'DEPARTED').length, desc: 'Carrier uplifted' },
    { label: 'Arrived / Delivered', count: mawbs.filter((m) => m.status === 'ARRIVED' || m.status === 'DELIVERED').length, desc: 'Final consignee POD' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
            AWB Operations &amp; Lifecycle
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-sans">
            Real-time AWB stage pipeline, capacity tracking, and operational action queue
          </p>
        </div>
      </div>

      {/* Hero Banner: IATA Compliance & Live Pipeline */}
      <div className="bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] rounded-2xl p-7 text-white shadow-md shadow-[#2C5EAD]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white font-mono text-xs font-bold tracking-wider uppercase">
              IATA Resolution 600b Compliant
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-400/25 text-emerald-100 text-xs font-semibold">
              e-AWB FWB / FHL Active
            </span>
          </div>
          <h2 className="text-2xl font-bold font-heading">
            International Air Waybill (AWB) Operations
          </h2>
          <p className="text-sm text-blue-100 mt-1 max-w-2xl font-normal leading-relaxed">
            Consolidated air cargo lifecycle management from Mod-7 airline serial allocation, volumetric chargeable weight calculations, house consolidations, to flight manifests and CASS billing reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('docket')}
            className="px-4 py-2.5 bg-white text-[#2C5EAD] hover:bg-blue-50 font-bold font-heading rounded-xl text-xs transition-all shadow-sm"
          >
            + Create Docket
          </button>
          <button
            onClick={() => onNavigate('stock')}
            className="px-4 py-2.5 bg-blue-900/40 hover:bg-blue-900/60 border border-white/20 text-white font-bold font-heading rounded-xl text-xs transition-all"
          >
            Manage AWB Stock
          </button>
          <button
            onClick={() => onNavigate('mawb')}
            className="px-4 py-2.5 bg-blue-900/40 hover:bg-blue-900/60 border border-white/20 text-white font-bold font-heading rounded-xl text-xs transition-all"
          >
            View Master AWBs
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-[#1591DC]/60 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">Available Stock</span>
            <div className="p-2.5 bg-[#2C5EAD]/10 text-[#2C5EAD] rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900">{availableStock}</span>
            <span className="text-xs text-slate-500 font-medium">AWB serials</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Active airline stocks: <strong className="text-slate-800">098 (AI), 176 (EK), 020 (LH)</strong>
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-[#1591DC]/60 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">Active Bookings</span>
            <div className="p-2.5 bg-[#1591DC]/10 text-[#1591DC] rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900">{bookings.length}</span>
            <span className="text-xs text-slate-500 font-medium">shipments</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Pending AWB assignment: <strong className="text-amber-600">{bookings.filter((b) => b.status === 'PENDING_AWB').length} bookings</strong>
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-[#1591DC]/60 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">Cargo Weight Uplifted</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900">{totalWeightKg.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-medium">kg gross</span>
          </div>
          <p className="mt-2 text-xs text-emerald-700 font-semibold">
            Chargeable weight ratio: 1.28x
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-[#1591DC]/60 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">e-AWB FWB Transmissions</span>
            <div className="p-2.5 bg-[#2C5EAD]/10 text-[#2C5EAD] rounded-xl">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900">99.8%</span>
            <span className="text-xs text-emerald-600 font-bold">ACK</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Direct EDI connection via Cargo-IMP & XML
          </p>
        </div>
      </div>

      {/* AWB Lifecycle Step Flow */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <h3 className="text-base font-bold font-heading text-slate-900 mb-2">
          End-to-End AWB Status Lifecycle Pipeline
        </h3>
        <p className="text-sm text-slate-500 mb-6 font-normal">
          Formal IATA cargo progression stages from stock allotment to final airside delivery
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statusSteps.map((step, idx) => (
            <div 
              key={step.label}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-[#1591DC]/60 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-[#2C5EAD] text-white text-xs font-bold font-heading flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold font-heading text-[#2C5EAD] bg-[#2C5EAD]/10 px-2 py-0.5 rounded-md">
                    {step.count}
                  </span>
                </div>
                <h4 className="text-sm font-bold font-heading text-slate-900 mt-2">{step.label}</h4>
                <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent MAWBs & Consolidation Status */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900">Active Master Air Waybills (MAWB)</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Current consignments in preparation, flight allocation, or en-route</p>
          </div>
          <button
            onClick={() => onNavigate('mawb')}
            className="text-xs font-bold text-[#2C5EAD] hover:underline flex items-center gap-1"
          >
            <span>View All MAWBs & HAWBs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">MAWB Number</th>
                <th className="py-3 px-4">Flight / Routing</th>
                <th className="py-3 px-4">Shipper & Consignee</th>
                <th className="py-3 px-4">Consol (HAWB)</th>
                <th className="py-3 px-4">Weight (Gr / Ch)</th>
                <th className="py-3 px-4">e-AWB FWB</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mawbs.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#2C5EAD]">
                    {m.mawbNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block">{m.flightNumber || 'Unassigned'}</span>
                    <span className="text-xs text-slate-500 font-bold">{m.origin} → {m.destination}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block truncate max-w-xs">{m.shipperName}</span>
                    <span className="text-xs text-slate-500 truncate max-w-xs block">To: {m.consigneeName}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {m.hawbs.length > 0 ? (
                      <span className="px-2.5 py-1 rounded-md bg-[#1591DC]/10 text-[#2C5EAD] border border-[#1591DC]/30 text-xs font-bold font-mono">
                        {m.hawbs.length} HAWBs
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Direct MAWB</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <span className="font-bold text-slate-800">{m.grossWeightKg} kg</span> / <span className="text-[#2C5EAD] font-bold">{m.chargeableWeightKg} kg</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {m.fwbSent ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sent &amp; ACK
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2C5EAD]/10 text-[#2C5EAD] border border-[#2C5EAD]/20">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
