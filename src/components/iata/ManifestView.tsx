"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plane,
  Printer,
  Lock,
  Plus,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { FlightManifestItem, MawbItem } from "@/types/iata";
import { IATA_AIRLINES, IATA_AIRPORTS } from "@/lib/iata-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data && (data.message || data.error)) ||
        `Request failed with status ${res.status}`,
    );
  }
  return data as T;
}

interface ManifestViewProps {
  manifests?: FlightManifestItem[];
  mawbs?: MawbItem[];
  onCreateManifest?: (
    manifest: Omit<FlightManifestItem, "id" | "status">,
  ) => void | Promise<void>;
  onFinalizeManifest?: (id: string) => void | Promise<void>;
}

export const ManifestView: React.FC<ManifestViewProps> = () => {
  const [manifests, setManifests] = useState<FlightManifestItem[]>([]);
  const [mawbs, setMawbs] = useState<MawbItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFlightNumber, setSelectedFlightNumber] = useState("");
  const [selectedAirline, setSelectedAirline] = useState(
    IATA_AIRLINES[0]?.name || "",
  );
  const [flightDate, setFlightDate] = useState("");
  const [origin, setOrigin] = useState(IATA_AIRPORTS[0]?.iataCode || "");
  const [destination, setDestination] = useState(
    IATA_AIRPORTS[0]?.iataCode || "",
  );
  const [selectedMawbNumbers, setSelectedMawbNumbers] = useState<string[]>([]);

  const [viewingManifest, setViewingManifest] =
    useState<FlightManifestItem | null>(null);

  // New state for the Print Preview Modal
  const [printManifest, setPrintManifest] = useState<FlightManifestItem | null>(
    null,
  );

  /* ---------- Load MAWBs (with HAWBs) + manifests from DB ---------- */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mawbRes, manifestRes] = await Promise.all([
        apiFetch<{ success: boolean; mawbs: MawbItem[] }>("/api/mawbs"),
        apiFetch<{ success: boolean; manifests: FlightManifestItem[] }>(
          "/api/manifests",
        ),
      ]);
      setMawbs(
        (mawbRes.mawbs || []).map((m) => ({ ...m, hawbs: m.hawbs || [] })),
      );
      setManifests(manifestRes.manifests || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load manifest data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unmanifestedMawbs = mawbs.filter((m) => m.status === "ISSUED");

  const prefillFromMawb = (m: MawbItem) => {
    if (!selectedFlightNumber && m.flightNumber)
      setSelectedFlightNumber(m.flightNumber);
    if (!flightDate && m.flightDate) setFlightDate(m.flightDate);
    if (m.origin) setOrigin(m.origin);
    if (m.destination) setDestination(m.destination);

    const prefix = m.airlinePrefix;
    if (prefix) {
      const airline = IATA_AIRLINES.find((a) => a.prefix === prefix);
      if (airline) setSelectedAirline(airline.name);
    }
  };

  const handleToggleMawbSelect = (mawbNum: string) => {
    if (selectedMawbNumbers.includes(mawbNum)) {
      setSelectedMawbNumbers(selectedMawbNumbers.filter((m) => m !== mawbNum));
    } else {
      if (selectedMawbNumbers.length === 0) {
        const m = mawbs.find((x) => x.mawbNumber === mawbNum);
        if (m) prefillFromMawb(m);
      }
      setSelectedMawbNumbers([...selectedMawbNumbers, mawbNum]);
    }
  };

  const handleCreateManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (selectedMawbNumbers.length === 0) {
      alert(
        "Please select at least one issued MAWB to include in the flight manifest.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch("/api/manifests", {
        method: "POST",
        body: JSON.stringify({
          manifestNumber: `MNF-${selectedFlightNumber}-${flightDate.replace(/-/g, "").slice(2)}`,
          flightNumber: selectedFlightNumber,
          airline: selectedAirline,
          flightDate,
          origin,
          destination,
          mawbs: selectedMawbNumbers,
        }),
      });

      setIsCreateModalOpen(false);
      setSelectedMawbNumbers([]);
      setSelectedFlightNumber("");
      setFlightDate("");

      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create manifest.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async (id: string) => {
    setErrorMsg("");
    setFinalizingId(id);
    try {
      await apiFetch(`/api/manifests/${id}/finalize`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to finalize manifest.");
    } finally {
      setFinalizingId(null);
    }
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
            Flight allocation, cargo manifest generation, gross weight
            reconciliation, and departure lock
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

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Flight Manifests Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <h3 className="text-base font-bold font-heading text-slate-900 mb-2">
          Cargo Flight Manifests ({manifests.length})
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
          Official airline flight manifests showing total weight, consolidated
          pieces, and customs clearance readiness
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
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-slate-500 text-sm"
                  >
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading manifests…
                  </td>
                </tr>
              )}

              {!isLoading && manifests.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-slate-400 text-sm italic"
                  >
                    No flight manifests found.
                  </td>
                </tr>
              )}

              {manifests.map((mnf) => (
                <tr
                  key={mnf.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-4 px-6 font-mono font-bold text-[#2C5EAD]">
                    {mnf.manifestNumber}
                  </td>
                  <td className="py-4 px-6">
                    <strong className="text-slate-900 block font-heading">
                      {mnf.flightNumber}
                    </strong>
                    <span className="text-xs text-slate-500 font-medium">
                      {mnf.airline}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {mnf.origin} → {mnf.destination}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700">
                    {mnf.flightDate}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs">
                    <span className="font-bold text-[#2C5EAD]">
                      {mnf.totalMawbs} MAWBs
                    </span>{" "}
                    / <span>{mnf.totalHawbs} HAWBs</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs">
                    <strong className="text-slate-900">
                      {mnf.totalPieces} pkgs
                    </strong>{" "}
                    · <span>{mnf.totalGrossWeightKg} kg</span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-heading ${
                        mnf.status === "FINALIZED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : mnf.status === "DEPARTED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
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

                      {mnf.status === "DRAFT" && (
                        <button
                          onClick={() => handleFinalize(mnf.id)}
                          disabled={finalizingId === mnf.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          {finalizingId === mnf.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
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
                <p className="text-xs text-slate-500 font-medium">
                  Link issued MAWBs to a specific carrier flight departure
                </p>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Airline Carrier
                  </label>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Flight Number *
                  </label>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    required
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Origin Airport
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  >
                    {IATA_AIRPORTS.map((a) => (
                      <option key={a.iataCode} value={a.iataCode}>
                        {a.iataCode} - {a.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Destination Airport
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  >
                    {IATA_AIRPORTS.map((a) => (
                      <option key={a.iataCode} value={a.iataCode}>
                        {a.iataCode} - {a.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MAWB Selector */}
              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select MAWBs for this Flight Manifest (
                  {unmanifestedMawbs.length} available)
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
                            onChange={() =>
                              handleToggleMawbSelect(m.mawbNumber)
                            }
                            className="rounded text-[#2C5EAD]"
                          />
                          <span className="font-mono font-bold text-[#2C5EAD]">
                            {m.mawbNumber}
                          </span>
                          <span className="text-slate-600">
                            ({m.origin} → {m.destination})
                          </span>
                          {m.hawbs.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1591DC]/10 text-[#2C5EAD] font-bold">
                              {m.hawbs.length} HAWBs
                            </span>
                          )}
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
                  disabled={isSaving}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#234c8d] text-white font-bold rounded-xl shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSaving ? "Saving…" : "Generate Manifest"}
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
                <p className="text-xs text-slate-500">
                  Flight {viewingManifest.flightNumber} (
                  {viewingManifest.origin} → {viewingManifest.destination})
                </p>
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
                  <strong className="text-[#2C5EAD]">
                    {viewingManifest.totalGrossWeightKg} kg
                  </strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  Manifested MAWB Serials:
                </span>
                <div className="flex flex-wrap gap-2">
                  {viewingManifest.mawbs.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 rounded bg-[#2C5EAD]/10 text-[#2C5EAD] font-bold border border-[#2C5EAD]/20"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 flex justify-between items-center border-t border-slate-200">
              <button
                onClick={() => setPrintManifest(viewingManifest)}
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

      {/* =========================================================
          PRINT MANIFEST MODAL
          Matches the PDF layout: 077- 59066906
      ========================================================= */}
      {printManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-[210mm] h-[92vh] flex flex-col shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none">
            {/* Modal Header (Hidden in Print) */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 print:hidden">
              <div className="font-bold text-slate-800 font-heading">
                Manifest Print Preview
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Triggers the global @media print
                    document.body.setAttribute("data-print-mode", "manifest");
                    window.print();
                    document.body.removeAttribute("data-print-mode");
                  }}
                  className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#234c8d] text-white font-bold rounded-lg text-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print / PDF
                </button>
                <button
                  onClick={() => setPrintManifest(null)}
                  className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="manifest-print-target flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible bg-white text-black">
              <div className="max-w-full">
                {/* Header Info */}
                <div className="text-xl font-bold mb-6 tracking-wide">
                  {printManifest.mawbs?.[0] || "MANIFEST"}-{" "}
                  {printManifest.flightDate.replace(/-/g, "").slice(2)}
                </div>

                <div className="grid grid-cols-[80px_1fr] gap-y-3 gap-x-4 text-[11px] mb-4">
                  {/* Carrier */}
                  <div className="font-bold text-slate-800">Carrier</div>
                  <div className="font-bold text-slate-800 uppercase">
                    {printManifest.airline}
                  </div>

                  {/* Shipper */}
                  <div className="font-bold text-slate-800">Shipper</div>
                  <div className="text-slate-800 leading-[1.3]">
                    {mawbs.find((m) => m.mawbNumber === printManifest.mawbs[0])
                      ?.shipperName || "N/A"}
                    <br />
                    {mawbs.find((m) => m.mawbNumber === printManifest.mawbs[0])
                      ?.shipperAddress || ""}
                  </div>

                  {/* Consignee */}
                  <div className="font-bold text-slate-800">Consignee</div>
                  <div className="text-slate-800 leading-[1.3]">
                    {mawbs.find((m) => m.mawbNumber === printManifest.mawbs[0])
                      ?.consigneeName || "N/A"}
                    <br />
                    {mawbs.find((m) => m.mawbNumber === printManifest.mawbs[0])
                      ?.consigneeAddress || ""}
                  </div>
                </div>

                {/* Flight Info Bar */}
                <div className="flex flex-wrap gap-6 text-[10px] font-bold border-y border-black py-2 mb-6">
                  <div>
                    Date{" "}
                    <span className="font-normal ml-1">
                      {printManifest.flightDate}
                    </span>
                  </div>
                  <div>
                    Reference{" "}
                    <span className="font-normal ml-1">
                      {printManifest.manifestNumber}
                    </span>
                  </div>
                  <div>
                    Flight{" "}
                    <span className="font-normal ml-1">
                      {printManifest.flightNumber}
                    </span>
                  </div>
                  <div>
                    MS <span className="font-normal ml-1">AD</span>
                  </div>
                  <div>
                    Origin{" "}
                    <span className="font-normal ml-1">
                      {printManifest.origin}
                    </span>
                  </div>
                  <div>
                    Destination{" "}
                    <span className="font-normal ml-1">
                      {printManifest.destination}
                    </span>
                  </div>
                  <div>
                    Pieces{" "}
                    <span className="font-normal ml-1">
                      {printManifest.totalPieces}
                    </span>
                  </div>
                  <div>
                    Weight{" "}
                    <span className="font-normal ml-1">
                      {printManifest.totalGrossWeightKg}K
                    </span>
                  </div>
                  <div>
                    HAWBs{" "}
                    <span className="font-normal ml-1">
                      {printManifest.totalHawbs}
                    </span>
                  </div>
                  <div>
                    Pages <span className="font-normal ml-1">1</span>
                  </div>
                </div>

                {/* HAWB Table */}
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black font-bold">
                      <th className="py-2 w-12">HAWB</th>
                      <th className="py-2 w-20 text-right">Pieces</th>
                      <th className="py-2 w-24 text-right">Weight</th>
                      <th className="py-2 w-24 text-center">Orig/Dest</th>
                      <th className="py-2 w-20 text-center">PPD/COLL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printManifest.mawbs.map((mawbNum) => {
                      const mawb = mawbs.find((m) => m.mawbNumber === mawbNum);
                      if (!mawb) return null;

                      // If the MAWB has HAWBs, print each one
                      if (mawb.hawbs && mawb.hawbs.length > 0) {
                        return mawb.hawbs.map((hawb) => (
                          <React.Fragment key={hawb.hawbNumber}>
                            <tr className="border-b border-slate-300">
                              <td className="py-2 align-top font-bold">
                                {hawb.hawbNumber.replace(/^HAWB-/, "")}
                              </td>
                              <td className="py-2 align-top text-right">
                                {hawb.pieces}
                              </td>
                              <td className="py-2 align-top text-right">
                                {hawb.grossWeightKg} K
                              </td>
                              <td className="py-2 align-top text-center">
                                {mawb.origin}/{mawb.destination}
                              </td>
                              <td className="py-2 align-top text-center">
                                COLL
                              </td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="py-2 align-top font-bold">
                                Shipper
                              </td>
                              <td colSpan={4} className="py-2 align-top">
                                {hawb.shipperName} <br />
                                {hawb.shipperAddress || mawb.shipperAddress}
                              </td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="py-2 align-top font-bold">
                                Consignee
                              </td>
                              <td colSpan={4} className="py-2 align-top">
                                {hawb.consigneeName} <br />
                                {hawb.consigneeAddress || mawb.consigneeAddress}
                              </td>
                            </tr>
                          </React.Fragment>
                        ));
                      }

                      // If no HAWBs, just print the MAWB as a line
                      return (
                        <React.Fragment key={mawb.mawbNumber}>
                          <tr className="border-b border-slate-300">
                            <td className="py-2 align-top font-bold">
                              {mawb.mawbNumber}
                            </td>
                            <td className="py-2 align-top text-right">
                              {mawb.pieces}
                            </td>
                            <td className="py-2 align-top text-right">
                              {mawb.grossWeightKg} K
                            </td>
                            <td className="py-2 align-top text-center">
                              {mawb.origin}/{mawb.destination}
                            </td>
                            <td className="py-2 align-top text-center">COLL</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-2 align-top font-bold">
                              Shipper
                            </td>
                            <td colSpan={4} className="py-2 align-top">
                              {mawb.shipperName} <br />
                              {mawb.shipperAddress}
                            </td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="py-2 align-top font-bold">
                              Consignee
                            </td>
                            <td colSpan={4} className="py-2 align-top">
                              {mawb.consigneeName} <br />
                              {mawb.consigneeAddress}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {/* Total */}
                <div className="flex justify-between font-bold text-[11px] mt-4 pt-4 border-t border-black">
                  <div className="w-12">Total</div>
                  <div className="flex-1 text-right pr-16">
                    {printManifest.totalPieces}
                  </div>
                  <div className="w-24 text-right">
                    {printManifest.totalGrossWeightKg}K
                  </div>
                  <div className="w-24 text-center"></div>
                  <div className="w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
