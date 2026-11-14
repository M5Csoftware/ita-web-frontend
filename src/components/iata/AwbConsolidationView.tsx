"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  Ban,
  Loader2,
  RefreshCw,
  AlertCircle,
  Pencil,
  ArrowLeft,
  Building2,
  Plane,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { IssuingAgentProfile, MawbItem, HawbItem } from "@/types/iata";
import { IATA_AIRLINES } from "@/lib/iata-data";
import { MawbSheet } from "./MawbSheet";
import { MawbPrintEditorModal } from "./MawbPrintEditorModal";
import { MawbData } from "@/types/mawb";
import { downloadMawbPdf, printMawbPdf } from "@/lib/mawb-pdf-export";

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

type HawbDetails = HawbItem & {
  handlingInfo?: string;
  shipperAddress?: string;
  shipperPhone?: string;
  shipperGst?: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  consigneeGst?: string;
};

interface EditForm {
  hawbNumber: string;
  origin: string;
  destination: string;
  shipperName: string;
  shipperAddress: string;
  shipperPhone: string;
  shipperGst: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneePhone: string;
  consigneeGst: string;
  pieces: number;
  grossWeightKg: number;
  chargeableWeightKg: number;
  natureOfGoods: string;
  handlingInfo: string;
}

const EMPTY_EDIT_FORM: EditForm = {
  hawbNumber: "",
  origin: "",
  destination: "",
  shipperName: "",
  shipperAddress: "",
  shipperPhone: "",
  shipperGst: "",
  consigneeName: "",
  consigneeAddress: "",
  consigneePhone: "",
  consigneeGst: "",
  pieces: 1,
  grossWeightKg: 0,
  chargeableWeightKg: 0,
  natureOfGoods: "",
  handlingInfo: "",
};

const EDIT_INPUT =
  "w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/30 focus:border-[#2C5EAD]";

interface AwbConsolidationViewProps {
  mawbs?: MawbItem[];
  agentProfile?: IssuingAgentProfile;
  onAddHawb?: (
    mawbId: string,
    hawb: Omit<HawbItem, "id" | "mawbNumber" | "status">,
  ) => void;
  onVoidMawb?: (mawbId: string) => void;
}

/**
 * Map a DB MAWB (MawbItem) into the printable MawbSheet data shape (MawbData).
 */
function buildMawbData(
  m: MawbItem,
  copyDesignation: string,
  agentProfile?: IssuingAgentProfile,
): MawbData {
  const raw = (m.mawbNumber || "").trim();
  const dashIdx = raw.indexOf("-");
  let prefix = (m.airlinePrefix || "").trim() || "077";
  let serial = raw;
  if (dashIdx > 0) {
    prefix = raw.slice(0, dashIdx).trim() || prefix;
    serial = raw.slice(dashIdx + 1).trim();
  }
  const cleanPrefix = prefix.replace(/\D/g, "");
  const matchedAirline = IATA_AIRLINES.find(
    (a) =>
      a.prefix === cleanPrefix ||
      a.prefix.padStart(3, "0") === cleanPrefix.padStart(3, "0"),
  );
  const resolvedCarrier =
    m.carrierName &&
    m.carrierName.trim() &&
    (m.carrierName.trim().toUpperCase() !== "EGYPT AIR" ||
      cleanPrefix === "077")
      ? m.carrierName.trim().toUpperCase()
      : matchedAirline
      ? matchedAirline.name.toUpperCase()
      : m.carrierName || "AIRLINE CARRIER";

  const digits = serial.replace(/\s+/g, "");
  if (/^\d{8}$/.test(digits)) {
    serial = `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  const gross = Number(m.grossWeightKg) || 0;
  const chargeable = Number(m.chargeableWeightKg) || 0;
  const ratePerKg = Number(m.ratePerKg) || 0;
  const freight = Number(m.freightAmount) || 0;
  const fsc = Number(m.fuelSurcharge) || 0;
  const ssc = Number(m.securitySurcharge) || 0;
  const total = Number(m.totalCharges) || freight + fsc + ssc;
  const issuingAgentName =
    agentProfile?.name?.trim() || "M5 Continent Logistics Solution Pvt Ltd";
  const issuingAgentIataCode =
    agentProfile?.iataNumericCode?.trim() || "14026840004";

  const otherChargesParts: string[] = [];
  if (fsc > 0) otherChargesParts.push(`FSC: ${fsc.toFixed(2)}`);
  if (ssc > 0) otherChargesParts.push(`SSC: ${ssc.toFixed(2)}`);
  const otherCharges = otherChargesParts.join("  ");

  const hawbs = (m.hawbs || []) as HawbDetails[];
  const goodsText = [
    m.natureOfGoods || "",
    hawbs.length > 0
      ? `CONSOL OF ${hawbs.length} HAWB(S): ${hawbs
          .map((h) => h.hawbNumber)
          .join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const handlingBits = [
    m.handlingCode ? `CODE ${m.handlingCode}` : "",
    ...hawbs.map((h) => h.handlingInfo || "").filter(Boolean),
  ].filter(Boolean);

  return {
    awbPrefix: prefix,
    awbSerial: serial,
    departureAirportCode: m.origin || "DEL",
    carrierName: resolvedCarrier,
    shipper: {
      nameAndAddress: [m.shipperName, m.shipperAddress]
        .filter(Boolean)
        .join("\n"),
      accountNumber: "",
    },
    consignee: {
      nameAndAddress: [m.consigneeName, m.consigneeAddress]
        .filter(Boolean)
        .join("\n"),
      accountNumber: "",
    },
    issuingAgent: {
      nameAndCity: issuingAgentName,
      iataCode: issuingAgentIataCode,
      accountNo: m.issuingAgentIataCode || "",
    },
    accountingInfo: "FREIGHT PREPAID",
    routing: {
      departureAirport: m.origin || "DELHI",
      to1: m.destination || "",
      byFirstCarrier: m.flightNumber || "",
      currency: "INR",
      chgsCode: "PP",
      destinationAirport: m.destination || "LONDON",
      flights: m.flightNumber
        ? [{ flightNo: m.flightNumber, date: m.flightDate || "" }]
        : [],
      handlingInfo: handlingBits.join(" / "),
      sci: "SCI",
    },
    items: [
      {
        pieces: String(m.pieces ?? ""),
        grossWeight: gross,
        weightUnit: "K",
        rateClass: m.rateClass || "Q",
        chargeableWeight: chargeable,
        rate: ratePerKg,
        total: freight,
        natureAndQuantity: goodsText,
      },
    ],
    charges: {
      prepaidWeightCharge: freight,
      collectWeightCharge: 0,
      carrierChargesPrepaid: fsc + ssc,
      carrierChargesCollect: 0,
      totalPrepaid: total,
      totalCollect: 0,
      otherChargesBreakdown: otherCharges,
    },
    execution: {
      shipperCertSignatory: issuingAgentName,
      executedDate: m.flightDate || new Date().toISOString().slice(0, 10),
      executedPlace: m.origin || "",
      carrierAgentSignature: issuingAgentName,
      copyDesignation,
    },
  };
}

function copyDesignationFor(
  copy: "ORIGINAL_1" | "ORIGINAL_2" | "ORIGINAL_3" | "EXTRA",
) {
  switch (copy) {
    case "ORIGINAL_1":
      return "ORIGINAL 1 (FOR ISSUING CARRIER)";
    case "ORIGINAL_2":
      return "ORIGINAL 2 (FOR CONSIGNEE)";
    case "ORIGINAL_3":
      return "ORIGINAL 3 (FOR SHIPPER)";
    case "EXTRA":
      return "COPY 4 (DELIVERY RECEIPT / EXTRA)";
  }
}

export const AwbConsolidationView: React.FC<AwbConsolidationViewProps> = ({
  agentProfile,
}) => {
  const [mawbs, setMawbs] = useState<MawbItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSavingHawb, setIsSavingHawb] = useState(false);
  const [voidingMawbId, setVoidingMawbId] = useState<string | null>(null);

  const [selectedMawb, setSelectedMawb] = useState<MawbItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [printActivePage, setPrintActivePage] = useState<"both" | "face" | "conditions">("both");
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [isAddHawbModalOpen, setIsAddHawbModalOpen] = useState(false);
  const [printCopyType, setPrintCopyType] = useState<
    "ORIGINAL_1" | "ORIGINAL_2" | "ORIGINAL_3" | "EXTRA"
  >("ORIGINAL_1");

  const [hawbNumber, setHawbNumber] = useState("");
  const [hawbShipper, setHawbShipper] = useState("");
  const [hawbConsignee, setHawbConsignee] = useState("");
  const [hawbPieces, setHawbPieces] = useState(0);
  const [hawbGrossWeight, setHawbGrossWeight] = useState(0);
  const [hawbChargeableWeight, setHawbChargeableWeight] = useState(0);
  const [hawbCommodity, setHawbCommodity] = useState("");
  const [hawbHandlingInfo, setHawbHandlingInfo] = useState("");

  const [editTarget, setEditTarget] = useState<{
    mawb: MawbItem;
    hawb: HawbDetails;
  } | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT_FORM);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  const loadMawbs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        count: number;
        mawbs: MawbItem[];
      }>("/api/mawbs");
      setMawbs((data.mawbs || []).map((m) => ({ ...m, hawbs: m.hawbs || [] })));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load MAWBs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMawbs();
  }, [loadMawbs]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const [editorInitialViewMode, setEditorInitialViewMode] = useState<"split" | "edit" | "preview">("split");

  const handleOpenPrint = (mawb: MawbItem) => {
    setSelectedMawb(mawb);
    setEditorInitialViewMode("split");
    setIsPrintModalOpen(true);
  };

  const handleOpenQuickPrint = (mawb: MawbItem) => {
    setSelectedMawb(mawb);
    setEditorInitialViewMode("preview");
    setIsPrintModalOpen(true);
  };

  const handlePrintPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await printMawbPdf(printActivePage);
    } catch (err) {
      console.error("Print PDF failed, falling back to window.print():", err);
      const prev = document.body.dataset.printMode;
      document.body.dataset.printMode = "mawb";
      window.print();
      if (prev) document.body.dataset.printMode = prev;
      else delete document.body.dataset.printMode;
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedMawb || isExporting) return;
    setIsExporting(true);
    try {
      const cleanPrefix = (selectedMawb.mawbNumber || "077").split("-")[0].replace(/[^a-zA-Z0-9]/g, "") || "077";
      const cleanSerial = (selectedMawb.mawbNumber || "AWB").replace(/[^a-zA-Z0-9]/g, "_");
      const pageSuffix = printActivePage === "both" ? "" : `_${printActivePage.toUpperCase()}`;
      const fileName = `MAWB_${cleanPrefix}-${cleanSerial}${pageSuffix}.pdf`;
      await downloadMawbPdf(fileName, printActivePage);
    } catch (err) {
      console.error("Download PDF error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenAddHawb = (mawb: MawbItem) => {
    setSelectedMawb(mawb);
    const suffix = (mawb.hawbs.length + 1).toString().padStart(2, "0");
    setHawbNumber(
      `HAWB-${mawb.origin}-${String(mawb.serialNumber || mawb.mawbNumber).slice(-4)}-${suffix}`,
    );
    setHawbShipper(mawb.shipperName);
    setHawbConsignee(mawb.consigneeName);
    setHawbPieces(0);
    setHawbGrossWeight(0);
    setHawbChargeableWeight(0);
    setHawbCommodity("");
    setHawbHandlingInfo("");
    setIsAddHawbModalOpen(true);
  };

  const handleSaveHawb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMawb) return;
    setErrorMsg("");
    setIsSavingHawb(true);
    try {
      const result = await apiFetch<{
        success: boolean;
        parityWarning: string | null;
      }>(`/api/mawbs/${selectedMawb.id}/hawbs`, {
        method: "POST",
        body: JSON.stringify({
          hawbNumber,
          shipperName: hawbShipper,
          consigneeName: hawbConsignee,
          origin: selectedMawb.origin,
          destination: selectedMawb.destination,
          pieces: hawbPieces,
          grossWeightKg: hawbGrossWeight,
          chargeableWeightKg: hawbChargeableWeight,
          natureOfGoods: hawbCommodity,
          handlingInfo: hawbHandlingInfo.trim(),
        }),
      });

      await loadMawbs();
      setIsAddHawbModalOpen(false);
      flash(
        result.parityWarning ||
          `HAWB ${hawbNumber} created and linked to MAWB ${selectedMawb.mawbNumber}.`,
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save HAWB.");
    } finally {
      setIsSavingHawb(false);
    }
  };

  const handleOpenEditHawb = (mawb: MawbItem, hawb: HawbDetails) => {
    setEditError("");
    setEditForm({
      hawbNumber: hawb.hawbNumber,
      origin: hawb.origin,
      destination: hawb.destination,
      shipperName: hawb.shipperName,
      shipperAddress: hawb.shipperAddress || mawb.shipperAddress || "",
      shipperPhone: hawb.shipperPhone || "",
      shipperGst: hawb.shipperGst || "",
      consigneeName: hawb.consigneeName,
      consigneeAddress: hawb.consigneeAddress || mawb.consigneeAddress || "",
      consigneePhone: hawb.consigneePhone || "",
      consigneeGst: hawb.consigneeGst || "",
      pieces: hawb.pieces,
      grossWeightKg: hawb.grossWeightKg,
      chargeableWeightKg: hawb.chargeableWeightKg,
      natureOfGoods: hawb.natureOfGoods || "",
      handlingInfo: hawb.handlingInfo || "",
    });
    setEditTarget({ mawb, hawb });
  };

  const setEditField = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setEditForm((prev) => ({ ...prev, [key]: value }));

  const handleUpdateHawb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError("");
    setIsUpdating(true);
    try {
      const result = await apiFetch<{
        success: boolean;
        message?: string;
        parityWarning: string | null;
      }>(`/api/mawbs/${editTarget.mawb.id}/hawbs/${editTarget.hawb.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      await loadMawbs();
      setEditTarget(null);
      flash(
        result.parityWarning ||
          result.message ||
          `HAWB ${editForm.hawbNumber} updated successfully.`,
      );
    } catch (err: any) {
      setEditError(err.message || "Failed to update HAWB.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getEditParity = () => {
    if (!editTarget) return null;
    const others = (editTarget.mawb.hawbs as HawbDetails[]).filter(
      (x) => x.id !== editTarget.hawb.id,
    );
    const sumPieces =
      others.reduce((acc, h) => acc + h.pieces, 0) + (editForm.pieces || 0);
    const sumWeight =
      others.reduce((acc, h) => acc + h.grossWeightKg, 0) +
      (editForm.grossWeightKg || 0);
    const isMatch =
      sumPieces === editTarget.mawb.pieces &&
      Math.abs(sumWeight - editTarget.mawb.grossWeightKg) < 0.1;
    return { sumPieces, sumWeight, isMatch };
  };

  const handleVoidMawb = async (mawb: MawbItem) => {
    const reason = window.prompt(
      `Void MAWB ${mawb.mawbNumber}? This is permanent and the AWB number can never be reused.\n\nReason for voiding:`,
      "Cancelled by operator",
    );
    if (reason === null) return;

    setErrorMsg("");
    setVoidingMawbId(mawb.id);
    try {
      await apiFetch(`/api/mawbs/${mawb.id}/void`, {
        method: "POST",
        body: JSON.stringify({
          reason: reason.trim() || "Cancelled by operator",
        }),
      });
      await loadMawbs();
      flash(`MAWB ${mawb.mawbNumber} permanently voided.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to void MAWB.");
    } finally {
      setVoidingMawbId(null);
    }
  };

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

  /* =========================== EDIT HAWB PAGE =========================== */
  if (editTarget) {
    const editParity = getEditParity();

    return (
      <div className="w-full space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              disabled={isUpdating}
              className="p-2.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:text-[#2C5EAD] hover:bg-slate-50 disabled:opacity-50"
              title="Back to consolidation"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
                Edit House Air Waybill (HAWB)
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-1 font-sans">
                Update house shipper / consignee details, addresses and cargo
                data. Changes are saved to the database.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="font-mono text-sm font-bold text-[#2C5EAD] bg-white px-3 py-1 rounded-xl border border-slate-200">
              MAWB: {editTarget.mawb.mawbNumber}
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {editTarget.mawb.status}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateHawb} className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD] flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-heading">
                  Reference &amp; Route
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  House waybill number and the house shipment routing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  HAWB Number *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.hawbNumber}
                  onChange={(e) => setEditField("hawbNumber", e.target.value)}
                  className={`${EDIT_INPUT} font-mono font-bold text-[#2C5EAD]`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Origin (IATA) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={editForm.origin}
                  onChange={(e) =>
                    setEditField("origin", e.target.value.toUpperCase())
                  }
                  className={`${EDIT_INPUT} font-mono font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Destination (IATA) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={editForm.destination}
                  onChange={(e) =>
                    setEditField("destination", e.target.value.toUpperCase())
                  }
                  className={`${EDIT_INPUT} font-mono font-bold`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-slate-900 font-heading text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-[#2C5EAD]" />
                House Shipper Details
              </h3>

              <div className="space-y-3 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    House Shipper Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.shipperName}
                    onChange={(e) =>
                      setEditField("shipperName", e.target.value)
                    }
                    className={EDIT_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Street Address &amp; City
                  </label>
                  <input
                    type="text"
                    value={editForm.shipperAddress}
                    onChange={(e) =>
                      setEditField("shipperAddress", e.target.value)
                    }
                    placeholder="Address of this house shipper"
                    className={EDIT_INPUT}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.shipperPhone}
                      onChange={(e) =>
                        setEditField("shipperPhone", e.target.value)
                      }
                      className={EDIT_INPUT}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      value={editForm.shipperGst}
                      onChange={(e) =>
                        setEditField("shipperGst", e.target.value)
                      }
                      className={`${EDIT_INPUT} font-mono`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-slate-900 font-heading text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                <Plane className="w-4 h-4 text-[#1591DC]" />
                House Consignee Details
              </h3>

              <div className="space-y-3 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    House Consignee Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.consigneeName}
                    onChange={(e) =>
                      setEditField("consigneeName", e.target.value)
                    }
                    className={EDIT_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Delivery Address &amp; City
                  </label>
                  <input
                    type="text"
                    value={editForm.consigneeAddress}
                    onChange={(e) =>
                      setEditField("consigneeAddress", e.target.value)
                    }
                    placeholder="Delivery address of this house consignee"
                    className={EDIT_INPUT}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.consigneePhone}
                      onChange={(e) =>
                        setEditField("consigneePhone", e.target.value)
                      }
                      className={EDIT_INPUT}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tax ID / VAT No
                    </label>
                    <input
                      type="text"
                      value={editForm.consigneeGst}
                      onChange={(e) =>
                        setEditField("consigneeGst", e.target.value)
                      }
                      className={`${EDIT_INPUT} font-mono`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 -mt-4">
            Addresses start from the Master AWB&apos;s addresses. Change them if
            this house shipment has a different shipper or delivery address.
          </p>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD] flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-heading">
                  Cargo, Weight &amp; Handling
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Pieces, weights, commodity and special handling instructions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pieces *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editForm.pieces}
                  onChange={(e) =>
                    setEditField("pieces", parseInt(e.target.value, 10) || 0)
                  }
                  className={`${EDIT_INPUT} font-mono font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gross Weight (kg) *
                </label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  required
                  value={editForm.grossWeightKg}
                  onChange={(e) =>
                    setEditField(
                      "grossWeightKg",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className={`${EDIT_INPUT} font-mono font-bold`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chargeable Weight (kg) *
                </label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  required
                  value={editForm.chargeableWeightKg}
                  onChange={(e) =>
                    setEditField(
                      "chargeableWeightKg",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className={`${EDIT_INPUT} font-mono font-bold text-[#2C5EAD]`}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nature of Goods
                </label>
                <input
                  type="text"
                  value={editForm.natureOfGoods}
                  onChange={(e) =>
                    setEditField("natureOfGoods", e.target.value)
                  }
                  className={EDIT_INPUT}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handling Info
                </label>
                <input
                  type="text"
                  value={editForm.handlingInfo}
                  onChange={(e) => setEditField("handlingInfo", e.target.value)}
                  placeholder="e.g. Keep upright, fragile, keep dry"
                  className={EDIT_INPUT}
                />
              </div>
            </div>

            {editParity && (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  editParity.isMatch
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                {editParity.isMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  {editParity.isMatch
                    ? "Parity OK: all HAWBs together match the Master AWB pieces and weight."
                    : `Master AWB has ${editTarget.mawb.pieces} pcs / ${editTarget.mawb.grossWeightKg} kg. All HAWBs together (with your changes) = ${editParity.sumPieces} pcs / ${editParity.sumWeight} kg. You can still save.`}
                </span>
              </div>
            )}
          </div>

          {editError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => setEditTarget(null)}
              className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:from-[#204580] hover:to-[#0f7ab9] text-white font-bold font-heading text-sm shadow-md transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUpdating ? "Updating…" : "Update HAWB"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* =========================== MAIN LIST VIEW =========================== */
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
            MAWB &amp; HAWB Consolidation
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-sans">
            Master AWB issuing, House AWB groupage consolidation, weight parity
            checks, and Original 1/2/3 multi-copy print
          </p>
        </div>

        <button
          onClick={loadMawbs}
          disabled={isLoading}
          title="Refresh MAWBs"
          className="p-2.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:text-[#2C5EAD] hover:bg-slate-50 disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading && mawbs.length === 0 && (
        <div className="py-10 text-center text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
          Loading Master AWBs…
        </div>
      )}

      {!isLoading && mawbs.length === 0 && (
        <div className="py-10 text-center text-slate-400 text-sm italic bg-white border border-slate-200/90 rounded-2xl">
          No Master AWBs found. Create a docket with an AWB to issue one.
        </div>
      )}

      <div className="space-y-6">
        {mawbs.map((mawb) => {
          const parity = getParityInfo(mawb);
          const isLocked =
            mawb.status === "MANIFESTED" ||
            mawb.status === "DEPARTED" ||
            mawb.status === "VOID";

          return (
            <div
              key={mawb.id}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:border-[#1591DC]/60 transition-all"
            >
              <div className="p-6 bg-slate-50/70 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-lg font-bold font-heading text-[#2C5EAD] bg-white px-3 py-1 rounded-xl border border-slate-200">
                    MAWB: {mawb.mawbNumber}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full font-bold font-heading bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {mawb.status}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    FLT: {mawb.flightNumber || "Unassigned"} ({mawb.origin} →{" "}
                    {mawb.destination})
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {mawb.status !== "MANIFESTED" &&
                    mawb.status !== "DEPARTED" &&
                    mawb.status !== "VOID" && (
                      <button
                        onClick={() => handleOpenAddHawb(mawb)}
                        className="px-3.5 py-1.5 bg-[#2C5EAD]/10 hover:bg-[#2C5EAD]/20 text-[#2C5EAD] border border-[#2C5EAD]/30 font-bold font-heading rounded-xl text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add HAWB (Consol)</span>
                      </button>
                    )}

                  {mawb.status === "ISSUED" && (
                    <button
                      onClick={() => handleVoidMawb(mawb)}
                      disabled={voidingMawbId === mawb.id}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold font-heading rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                      title="Void AWB prior to flight manifest"
                    >
                      {voidingMawbId === mawb.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                      <span>Void</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenPrint(mawb)}
                    className="px-3.5 py-1.5 bg-[#2C5EAD] hover:bg-[#204580] text-white font-bold font-heading rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-[#2C5EAD]/20 cursor-pointer"
                    title="Open interface with input boxes for all PDF values to edit and print"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit &amp; Print IATA AWB</span>
                  </button>

                  <button
                    onClick={() => handleOpenQuickPrint(mawb)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold font-heading rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Directly view and print without editing"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Quick Print</span>
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Shipper
                  </span>
                  <strong className="text-slate-900 block truncate font-heading">
                    {mawb.shipperName}
                  </strong>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {mawb.shipperAddress}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Consignee
                  </span>
                  <strong className="text-slate-900 block truncate font-heading">
                    {mawb.consigneeName}
                  </strong>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {mawb.consigneeAddress}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cargo Volume
                  </span>
                  <strong className="text-slate-900 block font-heading">
                    {mawb.pieces} pkgs · {mawb.grossWeightKg} kg Gross
                  </strong>
                  <p className="text-xs text-[#2C5EAD] font-bold mt-0.5">
                    Chargeable: {mawb.chargeableWeightKg} kg
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Total Charges
                  </span>
                  <strong className="text-slate-900 block font-heading font-mono">
                    Rs.{(mawb.totalCharges || 0).toFixed(2)}
                  </strong>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Freight: Rs.{(mawb.freightAmount || 0).toFixed(2)} + FSC/SSC
                  </p>
                </div>
              </div>

              {parity && (
                <div
                  className={`mx-6 mb-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    parity.isMatch
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {parity.isMatch ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>
                      {parity.isMatch
                        ? "HAWB Consolidation Parity Verified: Total pieces and weight match Master AWB exactly."
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

              {mawb.hawbs.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold font-heading text-slate-700 uppercase tracking-wider">
                      House Air Waybills (HAWBs) Under This Master (
                      {mawb.hawbs.length})
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Groupage Consignments
                    </span>
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
                          <th className="py-2.5 px-4">Handling Info</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(mawb.hawbs as HawbDetails[]).map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono font-bold text-[#2C5EAD]">
                              {h.hawbNumber}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">
                              {h.shipperName}
                              {h.shipperAddress && (
                                <span className="block text-[11px] font-normal text-slate-500 truncate max-w-[180px]">
                                  {h.shipperAddress}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">
                              {h.consigneeName}
                              {h.consigneeAddress && (
                                <span className="block text-[11px] font-normal text-slate-500 truncate max-w-[180px]">
                                  {h.consigneeAddress}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900">
                              {h.pieces} pkgs
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold">
                              {h.grossWeightKg} kg
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-[#2C5EAD]">
                              {h.chargeableWeightKg} kg
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {h.natureOfGoods}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {h.handlingInfo || "—"}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {isLocked ? (
                                <span className="text-xs text-slate-400 italic">
                                  Locked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleOpenEditHawb(mawb, h)}
                                  className="px-3 py-1 bg-[#2C5EAD]/10 hover:bg-[#2C5EAD]/20 text-[#2C5EAD] border border-[#2C5EAD]/30 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                  title="Edit HAWB details"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </td>
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

      {/* Editable Print Modal */}
      {selectedMawb && (
        <MawbPrintEditorModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          mawbNumber={selectedMawb.mawbNumber}
          initialData={buildMawbData(
            selectedMawb,
            copyDesignationFor(printCopyType),
            agentProfile,
          )}
          copyType={printCopyType}
          onCopyTypeChange={setPrintCopyType}
          initialViewMode={editorInitialViewMode}
        />
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
                <p className="text-xs text-slate-500 font-mono">
                  Under Master: {selectedMawb.mawbNumber}
                </p>
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
                <label className="block font-bold text-slate-700 mb-1">
                  HAWB Serial Number *
                </label>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    House Shipper *
                  </label>
                  <input
                    type="text"
                    required
                    value={hawbShipper}
                    onChange={(e) => setHawbShipper(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    House Consignee *
                  </label>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Pieces
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={hawbPieces}
                    onChange={(e) =>
                      setHawbPieces(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gross Wt (kg)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={hawbGrossWeight}
                    onChange={(e) =>
                      setHawbGrossWeight(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chargeable (kg)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={hawbChargeableWeight}
                    onChange={(e) =>
                      setHawbChargeableWeight(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nature of Goods
                </label>
                <input
                  type="text"
                  value={hawbCommodity}
                  onChange={(e) => setHawbCommodity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Handling Info
                </label>
                <input
                  type="text"
                  value={hawbHandlingInfo}
                  onChange={(e) => setHawbHandlingInfo(e.target.value)}
                  placeholder="e.g. Keep upright, fragile, keep dry"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isSavingHawb}
                  onClick={() => setIsAddHawbModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 font-bold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingHawb}
                  className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#234c8d] text-white font-bold rounded-xl shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSavingHawb && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {isSavingHawb ? "Saving…" : "Create & Link HAWB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};