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
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ManifestSheet } from "./ManifestSheet";
import { downloadManifestPdf, printManifestPdf } from "@/lib/manifest-pdf-export";
import { FlightManifestItem, MawbItem } from "@/types/iata";
import { IATA_AIRLINES, IATA_AIRPORTS } from "@/lib/iata-data";

import { API_BASE } from "@/lib/api";

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

  // State for Print / PDF Export Modal
  const [printManifest, setPrintManifest] = useState<FlightManifestItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [modalZoom, setModalZoom] = useState<number>(1);

  const handlePrintPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await printManifestPdf();
    } catch (err) {
      console.error("Print Manifest PDF failed, falling back to window.print():", err);
      const prev = document.body.dataset.printMode;
      document.body.dataset.printMode = "manifest";
      window.print();
      if (prev) document.body.dataset.printMode = prev;
      else delete document.body.dataset.printMode;
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printManifest || isExporting) return;
    setIsExporting(true);
    try {
      const cleanNum = (printManifest.manifestNumber || printManifest.mawbs?.[0] || "Manifest").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `Manifest_${cleanNum}.pdf`;
      await downloadManifestPdf(fileName);
    } catch (err) {
      console.error("Download Manifest PDF error:", err);
    } finally {
      setIsExporting(false);
    }
  };

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

                      <button
                        type="button"
                        onClick={() => {
                          setPrintManifest(mnf);
                          setModalZoom(1);
                        }}
                        className="px-3 py-1.5 bg-[#2C5EAD]/10 hover:bg-[#2C5EAD]/20 text-[#2C5EAD] border border-[#2C5EAD]/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Generate and print / download manifest PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / PDF</span>
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
                onClick={() => {
                  setPrintManifest(viewingManifest);
                  setModalZoom(1);
                }}
                className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Generate Manifest PDF</span>
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
          Matches the exact PDF layout of Manifest_077-59066906.pdf
      ========================================================= */}
      {printManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-2.5 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-[98vw] max-w-[1700px] h-[96vh] max-h-[96vh] flex flex-col shadow-2xl text-slate-900 print:m-0 print:max-h-none print:max-w-none print:w-full print:rounded-none print:border-0 print:shadow-none overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap xl:flex-nowrap items-center justify-between gap-3 bg-white sticky top-0 z-20 print:hidden shrink-0 shadow-xs">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD] flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-heading text-slate-900">
                      Consolidation Flight Manifest (FFM)
                    </h3>
                    <span className="hidden sm:inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-[#2C5EAD] border border-blue-500/20">
                      A4 Landscape
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Manifest: <span className="font-semibold text-slate-700">{printManifest.manifestNumber}</span> · AWB: <span className="font-semibold text-slate-700">{printManifest.mawbs?.[0] || "N/A"}</span>
                  </p>
                </div>
              </div>

              {/* Action Toolbar with generous spacing */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalZoom((z) => Math.max(0.6, parseFloat((z - 0.1).toFixed(2))))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalZoom(1)}
                    className="px-2 py-1 text-[11px] font-mono font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    title="Reset zoom to 100%"
                  >
                    {Math.round(modalZoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalZoom((z) => Math.min(1.5, parseFloat((z + 0.1).toFixed(2))))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all cursor-pointer"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  disabled={isExporting}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print / Save PDF</span>
                </button>

                {/* Download PDF Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="px-3.5 py-1.5 bg-[#2C5EAD] hover:bg-[#234c8d] disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isExporting ? "Generating..." : "Download PDF"}</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPrintManifest(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Preview Canvas with sleek desk contrast */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-6 sm:p-10 bg-slate-200/60 print:bg-white print:p-0">
              <div className="flex justify-center min-w-max mx-auto py-4">
                <ManifestSheet
                  manifest={printManifest}
                  mawbs={mawbs}
                  scale={modalZoom}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
