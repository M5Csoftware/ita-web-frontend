'use client';

import React, { useState } from 'react';
import { 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  Search, 
  Calculator,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { AwbStockItem, calculateIataMod7CheckDigit, validateIataAwbNumber } from '@/types/iata';
import { IATA_AIRLINES } from '@/lib/iata-data';

interface AwbStockViewProps {
  stock: AwbStockItem[];
  onAddStockSeries: (airlinePrefix: string, fromSerial7: number, toSerial7: number) => void;
  onVoidAwb: (id: string, reason: string) => void;
}

export const AwbStockView: React.FC<AwbStockViewProps> = ({
  stock,
  onAddStockSeries,
  onVoidAwb,
}) => {
  const [selectedAirline, setSelectedAirline] = useState('098');
  const [fromSerial, setFromSerial] = useState('7241890');
  const [toSerial, setToSerial] = useState('7241899');
  const [testSerial, setTestSerial] = useState('72418935');
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('Physical foil cancelled / damaged');
  const [successMsg, setSuccessMsg] = useState('');

  const handleTestMod7 = () => {
    const isValid = validateIataAwbNumber(testSerial);
    setTestResult(isValid);
  };

  const handleGenerateStock = (e: React.FormEvent) => {
    e.preventDefault();
    const fromNum = parseInt(fromSerial, 10);
    const toNum = parseInt(toSerial, 10);

    if (isNaN(fromNum) || isNaN(toNum) || fromNum > toNum) {
      alert('Please enter a valid 7-digit numerical range.');
      return;
    }

    if (toNum - fromNum > 100) {
      alert('Maximum 100 serials can be added per batch.');
      return;
    }

    onAddStockSeries(selectedAirline, fromNum, toNum);
    setSuccessMsg(`Successfully generated IATA Mod-7 verified AWB stock series for airline ${selectedAirline}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredStock = stock.filter((s) => {
    const matchesSearch = s.fullAwbNumber.includes(search) || s.airlinePrefix.includes(search);
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      
      {/* Header Description */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD]">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900">
              IATA Resolution 600b AWB Stock Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Airline-wise AWB serial entry with automated Modulo-7 check-digit validation. Voided serials are permanently locked.
            </p>
          </div>
        </div>

        {/* IATA Modulo 7 Rule Explainer Box */}
        <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#2C5EAD] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>IATA Modulo-7 Standard Algorithm:</strong> An official IATA Air Waybill number contains an 11-digit structure (3-digit airline prefix + 8-digit serial). The 8th digit is an algorithmic check-digit calculated as: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-[#2C5EAD]">Check Digit = First 7 Digits mod 7</code>.
          </div>
        </div>
      </div>

      {/* Generator & Interactive Check-Digit Tester Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form: Add AWB Stock Series */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
          <h3 className="text-base font-bold font-heading text-slate-900 mb-2">
            Register Airline Stock Series
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-5 font-normal">
            Input the 7-digit starting and ending series provided by the airline. The system calculates and affixes the 8th Mod-7 check digit automatically.
          </p>

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleGenerateStock} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  Airline (3-digit Prefix)
                </label>
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                >
                  {IATA_AIRLINES.map((a) => (
                    <option key={a.prefix} value={a.prefix}>
                      {a.prefix} - {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  From 7-Digit Serial
                </label>
                <input
                  type="text"
                  maxLength={7}
                  required
                  value={fromSerial}
                  onChange={(e) => setFromSerial(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-mono text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                  placeholder="e.g. 7241890"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5">
                  To 7-Digit Serial
                </label>
                <input
                  type="text"
                  maxLength={7}
                  required
                  value={toSerial}
                  onChange={(e) => setToSerial(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-mono text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
                  placeholder="e.g. 7241899"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:opacity-95 text-white font-bold font-heading rounded-xl text-xs sm:text-sm shadow-md shadow-[#2C5EAD]/20 transition-all"
              >
                Validate &amp; Ingest Series to Stock
              </button>
            </div>
          </form>
        </div>

        {/* Interactive Mod-7 Verifier Scratchpad */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-[#2C5EAD]" />
              <h3 className="text-base font-bold font-heading text-slate-900">
                Live Mod-7 Tester
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal mb-4">
              Enter any 8-digit serial number to test whether the check digit complies with IATA Resolution 600b.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  8-Digit AWB Serial Number
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={testSerial}
                  onChange={(e) => {
                    setTestSerial(e.target.value);
                    setTestResult(null);
                  }}
                  className="w-full px-3.5 py-2 font-mono text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#2C5EAD]"
                  placeholder="e.g. 72418935"
                />
              </div>

              <button
                type="button"
                onClick={handleTestMod7}
                className="w-full py-2 bg-slate-100 hover:bg-[#2C5EAD]/10 text-slate-800 hover:text-[#2C5EAD] border border-slate-200 font-bold font-heading rounded-xl text-xs transition-colors"
              >
                Verify Modulo-7 Digit
              </button>

              {testResult !== null && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    testResult
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Valid IATA Check Digit ({testSerial.slice(0, 7)} % 7 = {testSerial.slice(7)})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        Invalid! Expected check digit is {calculateIataMod7CheckDigit(testSerial.slice(0, 7))}, got {testSerial.slice(7)}.
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Stock Inventory Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900">
              AWB Stock Inventory Ledger ({filteredStock.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Airline-wise tracking of AWB serials with active allocation states and void locks
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Status filters */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['ALL', 'AVAILABLE', 'ALLOTTED', 'ISSUED', 'VOID'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    filterStatus === st
                      ? 'bg-[#2C5EAD] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search AWB..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2C5EAD]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Full AWB Number</th>
                <th className="py-3.5 px-6">Airline Prefix</th>
                <th className="py-3.5 px-6">Serial Number</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Allocation / Note</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-[#2C5EAD]">
                    {item.fullAwbNumber}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-semibold text-slate-700">
                    {item.airlinePrefix}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-700">
                    {item.airlineNumber}
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-heading ${
                        item.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'ALLOTTED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.status === 'ISSUED'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-500 font-medium">
                    {item.voidReason ? (
                      <span className="text-rose-600 font-semibold">Void: {item.voidReason}</span>
                    ) : item.allocatedTo ? (
                      <span>Allotted: {item.allocatedTo}</span>
                    ) : item.issuedAt ? (
                      <span>Issued: {item.issuedAt}</span>
                    ) : (
                      'In stock pool'
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {item.status === 'AVAILABLE' || item.status === 'ALLOTTED' ? (
                      <button
                        onClick={() => {
                          setVoidingId(item.id);
                        }}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        title="Void AWB number (permanent)"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Void</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Confirmation Dialog */}
      {voidingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-900">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold font-heading">Confirm Void AWB Number</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed font-normal">
              <strong>IATA Strict Rule:</strong> Once voided, an AWB number must never be reused under any circumstances. This action will be recorded in the permanent audit ledger.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Voiding
              </label>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setVoidingId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onVoidAwb(voidingId, voidReason);
                  setVoidingId(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Permanently Void AWB
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

