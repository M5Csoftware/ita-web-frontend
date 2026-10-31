'use client';

import React, { useState } from 'react';
import { 
  Plane, 
  Printer, 
  Lock, 
  Plus, 
  X
} from 'lucide-react';
import { FlightManifestItem, MawbItem } from '@/types/iata';
import { IATA_AIRLINES, IATA_AIRPORTS } from '@/lib/iata-data';

interface ManifestViewProps {
  manifests: FlightManifestItem[];
  mawbs: MawbItem[];
  onCreateManifest: (manifest: Omit<FlightManifestItem, 'id' | 'status'>) => void;
  onFinalizeManifest: (id: string) => void;
}

export const ManifestView: React.FC<ManifestViewProps> = ({
  manifests,
  mawbs,
  onCreateManifest,
  onFinalizeManifest,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFlightNumber, setSelectedFlightNumber] = useState('');
  const [selectedAirline, setSelectedAirline] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedMawbNumbers, setSelectedMawbNumbers] = useState<string[]>([]);
  const [viewingManifest, setViewingManifest] = useState<FlightManifestItem | null>(null);

  // Available MAWBs that are not yet manifested
  const unmanifestedMawbs = mawbs.filter((m) => m.status === 'ISSUED');

  const handleToggleMawbSelect = (mawbNum: string) => {
    if (selectedMawbNumbers.includes(mawbNum)) {
      setSelectedMawbNumbers(selectedMawbNumbers.filter((m) => m !== mawbNum));
    } else {
      setSelectedMawbNumbers([...selectedMawbNumbers, mawbNum]);
    }
  };

  const handleCreateManifest = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMawbNumbers.length === 0) {
      alert('Please select at least one issued MAWB to include in the flight manifest.');
      return;
    }

    const selectedMawbObjects = mawbs.filter((m) => selectedMawbNumbers.includes(m.mawbNumber));
    const totalPieces = selectedMawbObjects.reduce((acc, m) => acc + m.pieces, 0);
    const totalGrossWeight = selectedMawbObjects.reduce((acc, m) => acc + m.grossWeightKg, 0);
    const totalHawbs = selectedMawbObjects.reduce((acc, m) => acc + m.hawbs.length, 0);

    onCreateManifest({
      manifestNumber: `MNF-${selectedFlightNumber}-${flightDate.replace(/-/g, '').slice(2)}`,
      flightNumber: selectedFlightNumber,
      airline: selectedAirline,
      flightDate,
      origin,
      destination,
      mawbs: selectedMawbNumbers,
      totalMawbs: selectedMawbNumbers.length,
      totalHawbs,
      totalPieces,
      totalGrossWeightKg: totalGrossWeight,
    });

    setIsCreateModalOpen(false);
    setSelectedMawbNumbers([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
            Flight Manifests (FFM)
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-sans">
            Flight allocation, cargo manifest generation, gross weight reconciliation, and departure lock
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-bold font-heading flex items-center gap-2 transition-all shadow-md shadow-[#2C5EAD]/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Assemble Flight Manifest</span>
        </button>
      </div>

      {/* Flight Manifests Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <h3 className="text-base font-bold font-heading text-slate-900 mb-2">
          Cargo Flight Manifests ({manifests.length})
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
          Official airline flight manifests showing total weight, consolidated pieces, and customs clearance readiness
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Manifest No.</th>
                <th className="py-3.5 px-6">Flight &amp; Airline</th>
                <th className="py-3.5 px-6">Routing</th>
                <th className="py-3.5 px-6">Flight Date</th>
                <th className="py-3.5 px-6">MAWB / HAWB Count</th>
                <th className="py-3.5 px-6">Pieces &amp; Weight</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manifests.map((mnf) => (
                <tr key={mnf.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#2C5EAD]">
                    {mnf.manifestNumber}
                  </td>
                  <td className="py-4 px-6">
                    <strong className="text-slate-900 block font-heading">{mnf.flightNumber}</strong>
                    <span className="text-xs text-slate-500 font-medium">{mnf.airline}</span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {mnf.origin} → {mnf.destination}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700">
                    {mnf.flightDate}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs">
                    <span className="font-bold text-[#2C5EAD]">{mnf.totalMawbs} MAWBs</span> / <span>{mnf.totalHawbs} HAWBs</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs">
                    <strong className="text-slate-900">{mnf.totalPieces} pkgs</strong> · <span>{mnf.totalGrossWeightKg} kg</span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-heading ${
                        mnf.status === 'FINALIZED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : mnf.status === 'DEPARTED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {mnf.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingManifest(mnf)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Inspect
                      </button>

                      {mnf.status === 'DRAFT' && (
                        <button
                          onClick={() => onFinalizeManifest(mnf.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Finalize &amp; Lock</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Manifest Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold font-heading">
                  Assemble Flight Cargo Manifest
                </h3>
                <p className="text-xs text-slate-500 font-medium">Link issued MAWBs to a specific carrier flight departure</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManifest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Airline Carrier</label>
                  <select
                    value={selectedAirline}
                    onChange={(e) => setSelectedAirline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  >
                    {IATA_AIRLINES.map((a) => (
                      <option key={a.code} value={a.name}>
                        {a.name} ({a.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Flight Number *</label>
                  <input
                    type="text"
                    required
                    value={selectedFlightNumber}
                    onChange={(e) => setSelectedFlightNumber(e.target.value)}
                    placeholder="Enter flight number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Origin Airport</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  >
                    {IATA_AIRPORTS.map((a) => (
                      <option key={a.iataCode} value={a.iataCode}>{a.iataCode} - {a.city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination Airport</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  >
                    {IATA_AIRPORTS.map((a) => (
                      <option key={a.iataCode} value={a.iataCode}>{a.iataCode} - {a.city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MAWB Selector */}
              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select MAWBs for this Flight Manifest ({unmanifestedMawbs.length} available)
                </label>
                {unmanifestedMawbs.length === 0 ? (
                  <p className="p-3 rounded-xl bg-slate-50 text-slate-500 italic">
                    All current MAWBs are already manifested.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {unmanifestedMawbs.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-[#2C5EAD]"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedMawbNumbers.includes(m.mawbNumber)}
                            onChange={() => handleToggleMawbSelect(m.mawbNumber)}
                            className="rounded text-[#2C5EAD]"
                          />
                          <span className="font-mono font-bold text-[#2C5EAD]">{m.mawbNumber}</span>
                          <span className="text-slate-600">({m.origin} → {m.destination})</span>
                        </div>
                        <div className="font-mono text-slate-700 font-medium">
                          {m.pieces} pkgs · {m.grossWeightKg} kg
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#234c8d] text-white font-bold rounded-xl shadow-sm"
                >
                  Generate Manifest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Manifest Drawer */}
      {viewingManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold font-heading">
                  Manifest: {viewingManifest.manifestNumber}
                </h3>
                <p className="text-xs text-slate-500">Flight {viewingManifest.flightNumber} ({viewingManifest.origin} → {viewingManifest.destination})</p>
              </div>
              <button
                onClick={() => setViewingManifest(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <div className="flex justify-between">
                  <span>Airline:</span>
                  <strong>{viewingManifest.airline}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Departure Date:</span>
                  <strong>{viewingManifest.flightDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Master AWBs:</span>
                  <strong>{viewingManifest.totalMawbs}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total House AWBs (Consol):</span>
                  <strong>{viewingManifest.totalHawbs}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Cargo Pieces:</span>
                  <strong>{viewingManifest.totalPieces} pkgs</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Gross Weight:</span>
                  <strong className="text-[#2C5EAD]">{viewingManifest.totalGrossWeightKg} kg</strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Manifested MAWB Serials:</span>
                <div className="flex flex-wrap gap-2">
                  {viewingManifest.mawbs.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded bg-[#2C5EAD]/10 text-[#2C5EAD] font-bold border border-[#2C5EAD]/20">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 flex justify-between items-center border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Cargo Manifest</span>
              </button>
              <button
                onClick={() => setViewingManifest(null)}
                className="px-4 py-2 bg-[#2C5EAD] text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
