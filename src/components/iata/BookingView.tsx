'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calculator, 
  Check
} from 'lucide-react';
import { BookingItem, DimensionEntry, SpecialHandlingCode, calculateVolumetricWeight } from '@/types/iata';
import { IATA_AIRPORTS } from '@/lib/iata-data';

interface BookingViewProps {
  bookings: BookingItem[];
  onCreateBooking: (booking: Omit<BookingItem, 'id' | 'createdAt' | 'status'>) => void;
  onAssignAwbToBooking: (booking: BookingItem) => void;
}

export const BookingView: React.FC<BookingViewProps> = ({
  bookings,
  onCreateBooking,
  onAssignAwbToBooking,
}) => {
  const [shipper, setShipper] = useState('');
  const [consignee, setConsignee] = useState('');
  const [origin, setOrigin] = useState('DEL');
  const [destination, setDestination] = useState('FRA');
  const [actualWeight, setActualWeight] = useState(150);
  const [natureOfGoods, setNatureOfGoods] = useState('Electronic Telecommunication Equipment');
  const [handlingCode, setHandlingCode] = useState<SpecialHandlingCode>('GEN');
  const [dimensions, setDimensions] = useState<DimensionEntry[]>([
    { lengthCm: 100, widthCm: 80, heightCm: 60, pieces: 2 },
  ]);
  const [successNotice, setSuccessNotice] = useState('');

  // Calculate live volumetric weight: (L x W x H * pieces) / 6000
  const volumetricWeight = calculateVolumetricWeight(dimensions);
  const totalPieces = dimensions.reduce((acc, d) => acc + d.pieces, 0);
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  const handleAddDimensionRow = () => {
    setDimensions([...dimensions, { lengthCm: 50, widthCm: 50, heightCm: 50, pieces: 1 }]);
  };

  const handleRemoveDimensionRow = (index: number) => {
    if (dimensions.length === 1) return;
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const handleDimensionChange = (index: number, field: keyof DimensionEntry, value: number) => {
    const updated = [...dimensions];
    updated[index] = { ...updated[index], [field]: value };
    setDimensions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipper.trim() || !consignee.trim()) {
      alert('Shipper and Consignee names are required.');
      return;
    }

    onCreateBooking({
      bookingRef: `BKG-${Date.now().toString().slice(-6)}`,
      shipperName: shipper,
      consigneeName: consignee,
      origin,
      destination,
      pieces: totalPieces,
      actualWeightKg: actualWeight,
      dimensions,
      volumetricWeightKg: volumetricWeight,
      chargeableWeightKg: chargeableWeight,
      natureOfGoods,
      handlingCode,
    });

    setSuccessNotice('Cargo Booking successfully created! Chargeable weight locked at ' + chargeableWeight + ' kg.');
    setShipper('');
    setConsignee('');
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Cargo Booking &amp; IATA Volumetric Calculator
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Shipment details, multi-package dimensions, and automated chargeable weight determination using the IATA 1:6000 ratio.
            </p>
          </div>
        </div>
      </div>

      {/* Main Booking Form & Real-time Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Booking Details & Dimension Inputs */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
          <h3 className="text-base font-bold font-heading text-slate-900 mb-2">
            Create Air Cargo Booking
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 font-normal">
            Enter shipper, consignee, route, and package dimensions to compute official chargeable weight.
          </p>

          {successNotice && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Shipper & Consignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  Shipper / Exporter Name *
                </label>
                <input
                  type="text"
                  required
                  value={shipper}
                  onChange={(e) => setShipper(e.target.value)}
                  placeholder="e.g. Apex Precision Motors Pvt Ltd"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  Consignee / Importer Name *
                </label>
                <input
                  type="text"
                  required
                  value={consignee}
                  onChange={(e) => setConsignee(e.target.value)}
                  placeholder="e.g. EuroAero Technologies GmbH"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                />
              </div>
            </div>

            {/* Routing: Origin, Destination, Handling */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  Origin Airport (IATA)
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                >
                  {IATA_AIRPORTS.map((a) => (
                    <option key={a.iataCode} value={a.iataCode}>
                      {a.iataCode} - {a.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  Destination Airport (IATA)
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                >
                  {IATA_AIRPORTS.map((a) => (
                    <option key={a.iataCode} value={a.iataCode}>
                      {a.iataCode} - {a.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  Special Handling Code
                </label>
                <select
                  value={handlingCode}
                  onChange={(e) => setHandlingCode(e.target.value as SpecialHandlingCode)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                >
                  <option value="GEN">GEN - General Cargo</option>
                  <option value="PER">PER - Perishable Cargo</option>
                  <option value="DGR">DGR - Dangerous Goods</option>
                  <option value="COL">COL - Cold Chain (+2 to +8°C)</option>
                  <option value="VAL">VAL - Valuable Cargo</option>
                  <option value="AVI">AVI - Live Animals</option>
                </select>
              </div>
            </div>

            {/* Nature of Goods & Actual Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  Nature &amp; Quantity of Goods
                </label>
                <input
                  type="text"
                  value={natureOfGoods}
                  onChange={(e) => setNatureOfGoods(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  Total Actual Weight (kg)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={actualWeight}
                  onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 font-mono text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                />
              </div>
            </div>

            {/* Dimensions Section (Multi-piece entry) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-heading text-slate-700 uppercase tracking-wider">
                  Package Dimensions (Length × Width × Height in cm)
                </span>
                <button
                  type="button"
                  onClick={handleAddDimensionRow}
                  className="text-xs font-bold text-[#2C5EAD] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Package Size</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {dimensions.map((dim, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="w-20">
                      <label className="block text-[11px] text-slate-500 font-bold mb-0.5">Pieces</label>
                      <input
                        type="number"
                        min="1"
                        value={dim.pieces}
                        onChange={(e) => handleDimensionChange(idx, 'pieces', parseInt(e.target.value, 10) || 1)}
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 font-bold mb-0.5">L (cm)</label>
                        <input
                          type="number"
                          min="1"
                          value={dim.lengthCm}
                          onChange={(e) => handleDimensionChange(idx, 'lengthCm', parseFloat(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 font-bold mb-0.5">W (cm)</label>
                        <input
                          type="number"
                          min="1"
                          value={dim.widthCm}
                          onChange={(e) => handleDimensionChange(idx, 'widthCm', parseFloat(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 font-bold mb-0.5">H (cm)</label>
                        <input
                          type="number"
                          min="1"
                          value={dim.heightCm}
                          onChange={(e) => handleDimensionChange(idx, 'heightCm', parseFloat(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDimensionRow(idx)}
                      disabled={dimensions.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg disabled:opacity-30 mt-3.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:opacity-95 text-white font-bold font-heading rounded-xl text-sm shadow-md shadow-[#2C5EAD]/20 transition-all"
              >
                Create Booking &amp; Lock Weight
              </button>
            </div>
          </form>
        </div>

        {/* Right Card: Live IATA Chargeable Weight Summary */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-[#2C5EAD]" />
              <h3 className="text-base font-bold font-heading text-slate-900">
                IATA Weight Breakdown
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-normal leading-relaxed mb-5">
              IATA Resolution stipulates air freight must be charged at the higher value between actual physical weight and volumetric weight (divided by 6,000 cm³/kg).
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Total Pieces</span>
                <span className="text-2xl font-bold font-heading text-slate-900">{totalPieces} pkgs</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Actual Gross Weight</span>
                <span className="text-2xl font-bold font-heading text-slate-900">{actualWeight} kg</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Volumetric Weight (L×W×H ÷ 6000)</span>
                <span className="text-2xl font-bold font-heading text-[#1591DC]">{volumetricWeight} kg</span>
              </div>

              <div className="p-5 rounded-xl bg-blue-50 border-2 border-[#2C5EAD]/40">
                <span className="text-xs font-bold text-[#2C5EAD] uppercase tracking-wider block mb-1">
                  Official Chargeable Weight
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-heading text-[#2C5EAD]">
                    {chargeableWeight} kg
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">
                    ({chargeableWeight === volumetricWeight ? 'Volumetric dominant' : 'Actual weight dominant'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bookings Ledger */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <h3 className="text-base font-bold font-heading text-slate-900 mb-2">
          Air Cargo Bookings Ledger ({bookings.length})
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
          Pending and confirmed shipments awaiting AWB stock issuance or flight manifest assignment
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Booking Ref</th>
                <th className="py-3.5 px-6">Route</th>
                <th className="py-3.5 px-6">Shipper → Consignee</th>
                <th className="py-3.5 px-6">Pieces</th>
                <th className="py-3.5 px-6">Actual / Vol / Chargeable</th>
                <th className="py-3.5 px-6">Nature of Goods</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#2C5EAD]">
                    {b.bookingRef}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {b.origin} → {b.destination}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-900 block truncate max-w-xs">{b.shipperName}</span>
                    <span className="text-xs text-slate-500 truncate max-w-xs block">To: {b.consigneeName}</span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {b.pieces} pkgs
                  </td>
                  <td className="py-4 px-6 font-mono text-xs">
                    <span className="text-slate-600">{b.actualWeightKg}k</span> / <span className="text-slate-600">{b.volumetricWeightKg}k</span> → <strong className="text-[#2C5EAD] font-bold">{b.chargeableWeightKg} kg</strong>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-slate-800 block text-xs truncate max-w-xs">{b.natureOfGoods}</span>
                    <span className="text-[11px] font-bold font-mono text-[#2C5EAD] bg-[#2C5EAD]/10 px-1.5 py-0.5 rounded">
                      {b.handlingCode}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {b.status === 'PENDING_AWB' ? (
                      <button
                        onClick={() => onAssignAwbToBooking(b)}
                        className="px-3.5 py-1.5 bg-[#2C5EAD] hover:bg-[#234c8d] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Assign AWB
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        AWB Issued
                      </span>
                    )}
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
