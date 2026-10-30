'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Ban
} from 'lucide-react';
import { MawbItem, HawbItem } from '@/types/iata';

interface AwbConsolidationViewProps {
  mawbs: MawbItem[];
  onAddHawb: (mawbId: string, hawb: Omit<HawbItem, 'id' | 'mawbNumber' | 'status'>) => void;
  onVoidMawb: (mawbId: string) => void;
}

export const AwbConsolidationView: React.FC<AwbConsolidationViewProps> = ({
  mawbs,
  onAddHawb,
  onVoidMawb,
}) => {
  const [selectedMawb, setSelectedMawb] = useState<MawbItem | null>(mawbs[0] || null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAddHawbModalOpen, setIsAddHawbModalOpen] = useState(false);
  const [printCopyType, setPrintCopyType] = useState<'ORIGINAL_1' | 'ORIGINAL_2' | 'ORIGINAL_3' | 'EXTRA'>('ORIGINAL_1');

  // Form for new HAWB
  const [hawbNumber, setHawbNumber] = useState('');
  const [hawbShipper, setHawbShipper] = useState('');
  const [hawbConsignee, setHawbConsignee] = useState('');
  const [hawbPieces, setHawbPieces] = useState(1);
  const [hawbGrossWeight, setHawbGrossWeight] = useState(50);
  const [hawbChargeableWeight, setHawbChargeableWeight] = useState(50);
  const [hawbCommodity, setHawbCommodity] = useState('Consolidated General Merchandise');

  const handleOpenPrint = (mawb: MawbItem) => {
    setSelectedMawb(mawb);
    setIsPrintModalOpen(true);
  };

  const handleOpenAddHawb = (mawb: MawbItem) => {
    setSelectedMawb(mawb);
    const suffix = (mawb.hawbs.length + 1).toString().padStart(2, '0');
    setHawbNumber(`HAWB-${mawb.origin}-${mawb.serialNumber.slice(-4)}-${suffix}`);
    setHawbShipper(mawb.shipperName);
    setHawbConsignee(mawb.consigneeName);
    setIsAddHawbModalOpen(true);
  };

  const handleSaveHawb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMawb) return;

    onAddHawb(selectedMawb.id, {
      hawbNumber,
      shipperName: hawbShipper,
      consigneeName: hawbConsignee,
      origin: selectedMawb.origin,
      destination: selectedMawb.destination,
      pieces: hawbPieces,
      grossWeightKg: hawbGrossWeight,
      chargeableWeightKg: hawbChargeableWeight,
      natureOfGoods: hawbCommodity,
    });

    setIsAddHawbModalOpen(false);
  };

  // Parity calculation for consolidated MAWB vs sum of HAWBs
  const getParityInfo = (mawb: MawbItem) => {
    if (mawb.hawbs.length === 0) return null;
    const sumPieces = mawb.hawbs.reduce((acc, h) => acc + h.pieces, 0);
    const sumWeight = mawb.hawbs.reduce((acc, h) => acc + h.grossWeightKg, 0);
    const isPiecesMatch = sumPieces === mawb.pieces;
    const isWeightMatch = Math.abs(sumWeight - mawb.grossWeightKg) < 0.1;
    return {
      sumPieces,
      sumWeight,
      isMatch: isPiecesMatch && isWeightMatch,
      piecesDiff: mawb.pieces - sumPieces,
      weightDiff: parseFloat((mawb.grossWeightKg - sumWeight).toFixed(1)),
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
            MAWB &amp; HAWB Consolidation
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-sans">
            Master AWB issuing, House AWB groupage consolidation, weight parity checks, and Original 1/2/3 multi-copy print
          </p>
        </div>
      </div>

      {/* MAWBs List with HAWB Accordion / Cards */}
      <div className="space-y-6">
        {mawbs.map((mawb) => {
          const parity = getParityInfo(mawb);

          return (
            <div
              key={mawb.id}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:border-[#1591DC]/60 transition-all"
            >
              {/* MAWB Top Banner */}
              <div className="p-6 bg-slate-50/70 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-lg font-bold font-heading text-[#2C5EAD] bg-white px-3 py-1 rounded-xl border border-slate-200">
                    MAWB: {mawb.mawbNumber}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full font-bold font-heading bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {mawb.status}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    FLT: {mawb.flightNumber || 'Unassigned'} ({mawb.origin} → {mawb.destination})
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {mawb.status !== 'MANIFESTED' && mawb.status !== 'DEPARTED' && mawb.status !== 'VOID' && (
                    <button
                      onClick={() => handleOpenAddHawb(mawb)}
                      className="px-3.5 py-1.5 bg-[#2C5EAD]/10 hover:bg-[#2C5EAD]/20 text-[#2C5EAD] border border-[#2C5EAD]/30 font-bold font-heading rounded-xl text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add HAWB (Consol)</span>
                    </button>
                  )}

                  {mawb.status === 'ISSUED' && (
                    <button
                      onClick={() => onVoidMawb(mawb.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold font-heading rounded-xl text-xs flex items-center gap-1.5 transition-all"
                      title="Void AWB prior to flight manifest"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Void</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenPrint(mawb)}
                    className="px-4 py-1.5 bg-[#2C5EAD] hover:bg-[#234c8d] text-white font-bold font-heading rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print IATA AWB</span>
                  </button>
                </div>
              </div>

              {/* MAWB Core Data Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Shipper</span>
                  <strong className="text-slate-900 block truncate font-heading">{mawb.shipperName}</strong>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{mawb.shipperAddress}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Consignee</span>
                  <strong className="text-slate-900 block truncate font-heading">{mawb.consigneeName}</strong>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{mawb.consigneeAddress}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Cargo Volume</span>
                  <strong className="text-slate-900 block font-heading">{mawb.pieces} pkgs · {mawb.grossWeightKg} kg Gross</strong>
                  <p className="text-xs text-[#2C5EAD] font-bold mt-0.5">Chargeable: {mawb.chargeableWeightKg} kg</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Charges</span>
                  <strong className="text-slate-900 block font-heading font-mono">${mawb.totalCharges.toFixed(2)}</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Freight: ${mawb.freightAmount.toFixed(2)} + FSC/SSC</p>
                </div>
              </div>

              {/* Consolidation Warning / Parity Banner */}
              {parity && (
                <div className={`mx-6 mb-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                  parity.isMatch
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {parity.isMatch ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>
                      {parity.isMatch
                        ? 'HAWB Consolidation Parity Verified: Total pieces and weight match Master AWB exactly.'
                        : `Warning: Consolidation mismatch! MAWB has ${mawb.pieces} pcs / ${mawb.grossWeightKg} kg, but sum of HAWBs is ${parity.sumPieces} pcs / ${parity.sumWeight} kg.`}
                    </span>
                  </div>
                  {!parity.isMatch && (
                    <span className="font-mono text-xs font-bold">
                      Diff: {parity.piecesDiff} pcs / {parity.weightDiff} kg
                    </span>
                  )}
                </div>
              )}

              {/* Linked HAWB Sub-table */}
              {mawb.hawbs.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold font-heading text-slate-700 uppercase tracking-wider">
                      House Air Waybills (HAWBs) Under This Master ({mawb.hawbs.length})
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Groupage Consignments</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs bg-white rounded-xl overflow-hidden border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">HAWB Number</th>
                          <th className="py-2.5 px-4">House Shipper</th>
                          <th className="py-2.5 px-4">House Consignee</th>
                          <th className="py-2.5 px-4">Pieces</th>
                          <th className="py-2.5 px-4">Gross Weight</th>
                          <th className="py-2.5 px-4">Chargeable</th>
                          <th className="py-2.5 px-4">Nature of Goods</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mawb.hawbs.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono font-bold text-[#2C5EAD]">{h.hawbNumber}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">{h.shipperName}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">{h.consigneeName}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{h.pieces} pkgs</td>
                            <td className="py-2.5 px-4 font-mono font-semibold">{h.grossWeightKg} kg</td>
                            <td className="py-2.5 px-4 font-mono font-bold text-[#2C5EAD]">{h.chargeableWeightKg} kg</td>
                            <td className="py-2.5 px-4 text-slate-600">{h.natureOfGoods}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* IATA Resolution 600b Print / PDF Preview Modal */}
      {isPrintModalOpen && selectedMawb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-slate-900">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-[#2C5EAD]" />
                <div>
                  <h3 className="text-base font-bold font-heading">
                    IATA Standard Air Waybill (Res 600b Format)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">AWB: {selectedMawb.mawbNumber}</p>
                </div>
              </div>

              {/* Copy Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={printCopyType}
                  onChange={(e) => setPrintCopyType(e.target.value as 'ORIGINAL_1' | 'ORIGINAL_2' | 'ORIGINAL_3' | 'EXTRA')}
                  className="px-3 py-1.5 text-xs font-bold font-heading bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="ORIGINAL_1">Original 1 (For Issuing Carrier - Green)</option>
                  <option value="ORIGINAL_2">Original 2 (For Consignee - Pink)</option>
                  <option value="ORIGINAL_3">Original 3 (For Shipper - Blue)</option>
                  <option value="EXTRA">Copy 4 (Delivery Receipt / Extra)</option>
                </select>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#2C5EAD] hover:bg-[#234c8d] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Simulated IATA AWB Document Layout */}
            <div className="p-8 font-mono text-xs space-y-4">
              <div className="border-2 border-slate-900 p-6 space-y-6 bg-white">
                
                {/* AWB Top Bar */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Shipper&apos;s Name and Address</span>
                    <strong className="text-sm font-bold block">{selectedMawb.shipperName}</strong>
                    <p className="text-xs text-slate-700">{selectedMawb.shipperAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Air Waybill Number</span>
                    <span className="text-xl font-bold font-heading text-slate-900 tracking-wider">
                      {selectedMawb.mawbNumber}
                    </span>
                    <span className="text-[11px] font-bold block text-blue-800 mt-1 uppercase">
                      {printCopyType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Consignee & Issuing Agent */}
                <div className="grid grid-cols-2 gap-6 border-b-2 border-slate-900 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Consignee&apos;s Name and Address</span>
                    <strong className="text-sm font-bold block">{selectedMawb.consigneeName}</strong>
                    <p className="text-xs text-slate-700">{selectedMawb.consigneeAddress}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Issuing Carrier&apos;s Agent Name &amp; City</span>
                    <strong className="text-sm font-bold block">{selectedMawb.issuingAgentName}</strong>
                    <p className="text-xs text-slate-700">IATA Cargo Agent Code: {selectedMawb.issuingAgentIataCode}</p>
                  </div>
                </div>

                {/* Routing & Flight Details */}
                <div className="grid grid-cols-4 gap-4 border-b-2 border-slate-900 pb-4 text-center">
                  <div className="border-r border-slate-300 pr-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Airport of Departure</span>
                    <strong className="text-sm font-bold">{selectedMawb.origin}</strong>
                  </div>
                  <div className="border-r border-slate-300 pr-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Airport of Destination</span>
                    <strong className="text-sm font-bold">{selectedMawb.destination}</strong>
                  </div>
                  <div className="border-r border-slate-300 pr-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Flight / Date</span>
                    <strong className="text-sm font-bold">{selectedMawb.flightNumber || 'AI-121'} / {selectedMawb.flightDate || '30-OCT'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Currency</span>
                    <strong className="text-sm font-bold">USD</strong>
                  </div>
                </div>

                {/* Cargo Details Table */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-900 text-[11px] font-bold uppercase">
                        <th className="py-1">No. of Pieces</th>
                        <th className="py-1">Gross Weight</th>
                        <th className="py-1">Kg / Lb</th>
                        <th className="py-1">Rate Class</th>
                        <th className="py-1">Chargeable Wt</th>
                        <th className="py-1">Rate / Charge</th>
                        <th className="py-1">Total Freight</th>
                        <th className="py-1">Nature of Goods</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-xs">
                        <td className="py-2 font-bold">{selectedMawb.pieces}</td>
                        <td className="py-2">{selectedMawb.grossWeightKg}</td>
                        <td className="py-2">K</td>
                        <td className="py-2">{selectedMawb.rateClass}</td>
                        <td className="py-2 font-bold">{selectedMawb.chargeableWeightKg}</td>
                        <td className="py-2">${selectedMawb.ratePerKg.toFixed(2)}</td>
                        <td className="py-2 font-bold">${selectedMawb.freightAmount.toFixed(2)}</td>
                        <td className="py-2 font-bold">{selectedMawb.natureOfGoods}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Charges Summary */}
                <div className="flex justify-between items-end pt-2">
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p>Handling Info: Special Code <strong>{selectedMawb.handlingCode}</strong></p>
                    <p>e-AWB EDI Message: FWB transmission compliant with Cargo-IMP v17</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p>Weight Charge: <strong>${selectedMawb.freightAmount.toFixed(2)}</strong></p>
                    <p>Fuel Surcharge (FSC): <strong>${selectedMawb.fuelSurcharge.toFixed(2)}</strong></p>
                    <p>Security Surcharge (SSC): <strong>${selectedMawb.securitySurcharge.toFixed(2)}</strong></p>
                    <p className="text-sm font-bold border-t border-slate-900 pt-1">
                      Total Prepaid Charges: ${selectedMawb.totalCharges.toFixed(2)}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add HAWB Modal */}
      {isAddHawbModalOpen && selectedMawb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold font-heading">
                  Create House Air Waybill (HAWB)
                </h3>
                <p className="text-xs text-slate-500 font-mono">Under Master: {selectedMawb.mawbNumber}</p>
              </div>
              <button
                onClick={() => setIsAddHawbModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHawb} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">HAWB Serial Number *</label>
                <input
                  type="text"
                  required
                  value={hawbNumber}
                  onChange={(e) => setHawbNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">House Shipper *</label>
                  <input
                    type="text"
                    required
                    value={hawbShipper}
                    onChange={(e) => setHawbShipper(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">House Consignee *</label>
                  <input
                    type="text"
                    required
                    value={hawbConsignee}
                    onChange={(e) => setHawbConsignee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pieces</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={hawbPieces}
                    onChange={(e) => setHawbPieces(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gross Wt (kg)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={hawbGrossWeight}
                    onChange={(e) => setHawbGrossWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chargeable (kg)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={hawbChargeableWeight}
                    onChange={(e) => setHawbChargeableWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nature of Goods</label>
                <input
                  type="text"
                  value={hawbCommodity}
                  onChange={(e) => setHawbCommodity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddHawbModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#234c8d] text-white font-bold rounded-xl shadow-sm"
                >
                  Create &amp; Link HAWB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
