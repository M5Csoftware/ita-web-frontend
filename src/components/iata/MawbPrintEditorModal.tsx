"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Plane,
  Building2,
  User,
  Compass,
  Package,
  Calculator,
  FileCheck,
  Split,
  Eye,
  FileEdit,
  Loader2,
  Sparkles,
  Calendar,
  Box,
  Plus,
  Trash2,
} from "lucide-react";
import { MawbData, MawbItemLine, MawbRouteFlight } from "@/types/mawb";
import { Airline, DocketItem, DimensionEntry } from "@/types/iata";
import { IATA_AIRLINES } from "@/lib/iata-data";
import { API_BASE } from "@/lib/api";
import { MawbSheet } from "./MawbSheet";
import { downloadMawbPdf, printMawbPdf } from "@/lib/mawb-pdf-export";

interface MawbPrintEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mawbNumber: string;
  initialData: MawbData;
  copyType: "ORIGINAL_1" | "ORIGINAL_2" | "ORIGINAL_3" | "EXTRA";
  onCopyTypeChange: (
    type: "ORIGINAL_1" | "ORIGINAL_2" | "ORIGINAL_3" | "EXTRA",
  ) => void;
  initialViewMode?: "split" | "edit" | "preview";
}

const SECTION_CARD =
  "bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3";
const SECTION_TITLE =
  "text-xs font-bold font-heading text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-1.5 border-b border-slate-100";
const FIELD_LABEL = "block text-[11px] font-semibold text-slate-600 mb-1";
const INPUT_BASE =
  "w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/25 focus:border-[#2C5EAD] transition-all";
const TEXTAREA_BASE =
  "w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/25 focus:border-[#2C5EAD] transition-all resize-y";

type OtherChargeLine = {
  id: string;
  charge: string;
  basis: "Per kg" | "Per piece" | "Flat";
  rate: number | string;
  amount: number | string;
  dueTo: "Carrier" | "Agent";
  payAt: "Prepaid" | "Collect";
};

export interface DimensionRow {
  id: string;
  lengthCm: string | number;
  widthCm: string | number;
  heightCm: string | number;
  pieces: string | number;
}

/** Formats package dimension rows into standard IATA dimension text as requested */
function formatDimensionsText(rows: DimensionRow[]): string {
  const valid = rows.filter(
    (r) =>
      Number(r.lengthCm) > 0 &&
      Number(r.widthCm) > 0 &&
      Number(r.heightCm) > 0 &&
      Number(r.pieces) > 0,
  );
  if (valid.length === 0) return "";

  // Note: Identical box sizes remain distinct entries as required
  // e.g.: DIM:45X40X40/10 , 40X35X40/10 , 44X40X40/10 , 40X40X42/10, 60X55X50/10, 57X40X38/10, 57X40X38/6 CMT
  //       VOL WT: 902 KGS
  const boxParts = valid.map(
    (r) => `${r.lengthCm}X${r.widthCm}X${r.heightCm}/${r.pieces}`,
  );
  const totalVolWeight = valid.reduce((acc, r) => {
    return (
      acc +
      (Number(r.lengthCm) *
        Number(r.widthCm) *
        Number(r.heightCm) *
        Number(r.pieces)) /
        6000
    );
  }, 0);
  const roundedVol = Math.round(totalVolWeight);

  return `DIM:${boxParts.join(" , ")} CMT\nVOL WT: ${roundedVol} KGS`;
}

/** Parses individual dimension rows from existing raw text if present */
function parseDimensionRowsFromText(text: string): DimensionRow[] {
  if (!text) return [];
  const dimRegex =
    /(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)(?:\s*[\/xX]\s*(\d+))?/g;
  const rows: DimensionRow[] = [];
  let match: RegExpExecArray | null;
  let counter = 1;
  while ((match = dimRegex.exec(text)) !== null) {
    rows.push({
      id: `parsed-${counter++}-${Date.now()}`,
      lengthCm: match[1],
      widthCm: match[2],
      heightCm: match[3],
      pieces: match[4] || "1",
    });
  }
  return rows;
}

/** Extracts the goods description part prior to any DIM block */
function extractGoodsDescription(text: string): string {
  if (!text) return "";
  const dimIdx = text.search(/\bDIM\s*:/i);
  if (dimIdx === -1) return text.trim();
  return text.slice(0, dimIdx).trim();
}

/** Parses other charges breakdown string e.g. "UEC-1300.00, MMC-980.00, SSC-19500.00" into structured rows */
function parseOtherChargesFromBreakdown(
  breakdown?: string,
  carrierChargesPrepaid?: number | string,
): OtherChargeLine[] {
  if (!breakdown && !carrierChargesPrepaid) return [];
  const lines: OtherChargeLine[] = [];

  if (breakdown) {
    const parts = breakdown.split(/(?:\r?\n|;|\s{2,}|,)/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const colonMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*([0-9.,]+)/);
      if (colonMatch) {
        lines.push({
          id: `oc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          charge: colonMatch[1].toUpperCase(),
          basis: "Flat",
          rate: Number(colonMatch[2].replace(/,/g, "")),
          amount: Number(colonMatch[2].replace(/,/g, "")),
          dueTo: "Carrier",
          payAt: "Prepaid",
        });
        continue;
      }
      const hyphenMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*-\s*([0-9.,]+)/);
      if (hyphenMatch) {
        lines.push({
          id: `oc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          charge: hyphenMatch[1].toUpperCase(),
          basis: "Flat",
          rate: Number(hyphenMatch[2].replace(/,/g, "")),
          amount: Number(hyphenMatch[2].replace(/,/g, "")),
          dueTo: "Carrier",
          payAt: "Prepaid",
        });
        continue;
      }
    }
  }

  if (lines.length === 0 && Number(carrierChargesPrepaid) > 0) {
    lines.push({
      id: `oc_${Date.now()}_fallback`,
      charge: "FSC/SSC",
      basis: "Flat",
      rate: Number(carrierChargesPrepaid),
      amount: Number(carrierChargesPrepaid),
      dueTo: "Carrier",
      payAt: "Prepaid",
    });
  }

  return lines;
}

/** Normalizes diverse date formats (YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY, ISO) into YYYY-MM-DD for native HTML5 date input */
function toDateInputValue(val?: string): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const ymdMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

export const MawbPrintEditorModal: React.FC<MawbPrintEditorModalProps> = ({
  isOpen,
  onClose,
  mawbNumber,
  initialData,
  copyType,
  onCopyTypeChange,
  initialViewMode = "split",
}) => {
  const [data, setData] = useState<MawbData>(initialData);
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">(
    initialViewMode,
  );
  const [printActivePage, setPrintActivePage] = useState<
    "both" | "face" | "conditions"
  >("both");
  const [modalZoom, setModalZoom] = useState<number>(0.9);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [airlines, setAirlines] = useState<Airline[]>(IATA_AIRLINES);
  const [dockets, setDockets] = useState<DocketItem[]>([]);
  const [goodsDescription, setGoodsDescription] = useState<string>(() => {
    return extractGoodsDescription(
      initialData.items?.[0]?.natureAndQuantity || "",
    );
  });
  const [dimensionRows, setDimensionRows] = useState<DimensionRow[]>(() => {
    const initDims = initialData.items?.[0]?.dimensions;
    if (initDims && initDims.length > 0) {
      return initDims.map((d, i) => ({
        id: `init-${i}`,
        lengthCm: d.lengthCm ?? "",
        widthCm: d.widthCm ?? "",
        heightCm: d.heightCm ?? "",
        pieces: d.pieces ?? 1,
      }));
    }
    const rawNature = initialData.items?.[0]?.natureAndQuantity || "";
    const parsed = parseDimensionRowsFromText(rawNature);
    if (parsed.length > 0) {
      return parsed;
    }
    return [
      { id: "dim-1", lengthCm: "", widthCm: "", heightCm: "", pieces: 1 },
    ];
  });
  const [fetchedFromDocketNo, setFetchedFromDocketNo] = useState<string | null>(
    null,
  );

  // Load dockets to fetch cargo dimensions by AWB serial number
  useEffect(() => {
    let isMounted = true;
    async function loadDockets() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") || ""
            : "";
        const res = await fetch(`${API_BASE}/api/dockets`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const json = await res.json();
          const list: DocketItem[] = Array.isArray(json?.dockets)
            ? json.dockets
            : [];
          if (isMounted && list.length > 0) {
            setDockets(list);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadDockets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch dimensions from matching docket by AWB serial / number
  useEffect(() => {
    const cleanSerial = (data.awbSerial || "").replace(/\D/g, "");
    const cleanMawb = (mawbNumber || "").replace(/\D/g, "");

    // 1. Try to find matching docket by assigned AWB
    if (dockets.length > 0) {
      const match = dockets.find((d) => {
        if (!d.assignedAwb) return false;
        const dDigits = d.assignedAwb.replace(/\D/g, "");
        if (
          cleanSerial &&
          cleanSerial.length >= 6 &&
          dDigits.includes(cleanSerial)
        ) {
          return true;
        }
        if (
          cleanMawb &&
          cleanMawb.length >= 6 &&
          (dDigits.includes(cleanMawb) || cleanMawb.includes(dDigits))
        ) {
          return true;
        }
        return false;
      });

      if (match) {
        setFetchedFromDocketNo(match.docketNumber);
        if (match.dimensions && match.dimensions.length > 0) {
          // Map all box entries without aggregating to keep identical sizes separate
          const rows: DimensionRow[] = match.dimensions.map((dim, idx) => ({
            id: `docket-${match.docketNumber}-${idx}`,
            lengthCm: dim.lengthCm ?? "",
            widthCm: dim.widthCm ?? "",
            heightCm: dim.heightCm ?? "",
            pieces: dim.pieces ?? 1,
          }));
          setDimensionRows(rows);

          const desc =
            goodsDescription ||
            extractGoodsDescription(data.items[0]?.natureAndQuantity || "") ||
            match.natureOfGoods ||
            "";
          if (!goodsDescription && desc) {
            setGoodsDescription(desc);
          }

          const dimStr = formatDimensionsText(rows);
          const combined =
            desc.trim() && dimStr
              ? `${desc.trim()}\n\n${dimStr}`
              : desc.trim() || dimStr;

          setData((prev) => {
            const items = [...prev.items];
            const first = { ...(items[0] || {}) };
            first.natureAndQuantity = combined;
            first.dimensions = match.dimensions;
            if (match.volumetricWeightKg) {
              first.volumetricWeightKg = match.volumetricWeightKg;
            }
            items[0] = first as MawbItemLine;
            return { ...prev, items };
          });
        }
        return;
      }
    }
  }, [dockets, data.awbSerial, mawbNumber]);

  // Load dynamic airlines from master data
  useEffect(() => {
    let isMounted = true;
    async function loadMasterAirlines() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") || ""
            : "";
        const res = await fetch(`${API_BASE}/api/master/airlines`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const json = await res.json();
          const masterList: Airline[] = Array.isArray(json?.airlines)
            ? json.airlines
            : [];
          if (masterList.length > 0 && isMounted) {
            const masterPrefixes = new Set(masterList.map((a) => a.prefix));
            const merged = [
              ...masterList,
              ...IATA_AIRLINES.filter((a) => !masterPrefixes.has(a.prefix)),
            ];
            setAirlines(merged);
          }
        }
      } catch {
        // Fallback to static IATA_AIRLINES
      }
    }
    loadMasterAirlines();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to match an airline from master data or IATA presets by 3-digit prefix
  const findAirlineByPrefix = (prefix: string) => {
    const clean = prefix.replace(/\D/g, "");
    if (!clean) return null;
    return (
      airlines.find(
        (a) =>
          a.prefix === clean ||
          a.prefix === prefix.trim() ||
          a.prefix.padStart(3, "0") === clean.padStart(3, "0")
      ) ||
      IATA_AIRLINES.find(
        (a) =>
          a.prefix === clean ||
          a.prefix === prefix.trim() ||
          a.prefix.padStart(3, "0") === clean.padStart(3, "0")
      ) ||
      null
    );
  };

  // Sync when initialData or initialViewMode changes
  useEffect(() => {
    const cloned = JSON.parse(JSON.stringify(initialData)) as MawbData;
    if (!cloned.carrierName && cloned.awbPrefix) {
      const matched = findAirlineByPrefix(cloned.awbPrefix);
      if (matched) {
        cloned.carrierName = matched.name.toUpperCase();
      }
    }
    // If otherCharges array is missing or empty, parse from breakdown or carrierChargesPrepaid
    if (
      !(cloned as any).otherCharges ||
      (cloned as any).otherCharges.length === 0
    ) {
      const parsed = parseOtherChargesFromBreakdown(
        cloned.charges?.otherChargesBreakdown,
        cloned.charges?.carrierChargesPrepaid,
      );
      if (parsed.length > 0) {
        (cloned as any).otherCharges = parsed;
      }
    }
    setData(cloned);
  }, [initialData]);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode, isOpen]);

  if (!isOpen) return null;

  // Generic updater
  const updateData = (updater: (prev: MawbData) => MawbData) => {
    setData((prev) => updater(JSON.parse(JSON.stringify(prev))));
  };

  // Specific helpers
  const setTopLevel = <K extends keyof MawbData>(key: K, val: MawbData[K]) => {
    updateData((prev) => ({ ...prev, [key]: val }));
  };

  // Automatically fetch & fill carrier name when AWB prefix changes
  const handlePrefixChange = (rawVal: string) => {
    // If full AWB e.g. "077-59066545" was pasted
    if (rawVal.includes("-")) {
      const [p, ...rest] = rawVal.split("-");
      const serial = rest.join("-").trim();
      const cleanPrefix = p.trim();
      const matched = findAirlineByPrefix(cleanPrefix);
      updateData((prev) => ({
        ...prev,
        awbPrefix: cleanPrefix,
        ...(serial ? { awbSerial: serial } : {}),
        ...(matched ? { carrierName: matched.name.toUpperCase() } : {}),
      }));
      return;
    }

    const cleanPrefix = rawVal.trim();
    const matched = findAirlineByPrefix(cleanPrefix);
    updateData((prev) => ({
      ...prev,
      awbPrefix: rawVal,
      ...(matched ? { carrierName: matched.name.toUpperCase() } : {}),
    }));
  };

  const setShipper = (
    field: "nameAndAddress" | "accountNumber",
    val: string,
  ) => {
    updateData((prev) => ({
      ...prev,
      shipper: { ...prev.shipper, [field]: val },
    }));
  };

  const setConsignee = (
    field: "nameAndAddress" | "accountNumber",
    val: string,
  ) => {
    updateData((prev) => ({
      ...prev,
      consignee: { ...prev.consignee, [field]: val },
    }));
  };

  const setAgent = (
    field: "nameAndCity" | "iataCode" | "accountNo",
    val: string,
  ) => {
    updateData((prev) => ({
      ...prev,
      issuingAgent: { ...prev.issuingAgent, [field]: val },
    }));
  };

  const setRouting = (field: keyof MawbData["routing"], val: any) => {
    updateData((prev) => ({
      ...prev,
      routing: { ...prev.routing, [field]: val },
    }));
  };

  const setFlight = (
    idx: number,
    field: keyof MawbRouteFlight,
    val: string,
  ) => {
    updateData((prev) => {
      const flights = [...(prev.routing.flights || [])];
      while (flights.length <= idx) {
        flights.push({ flightNo: "", date: "" });
      }
      flights[idx] = { ...flights[idx], [field]: val };
      return {
        ...prev,
        routing: { ...prev.routing, flights },
      };
    });
  };

  const setItem = (idx: number, field: keyof MawbItemLine, val: any) => {
    updateData((prev) => {
      const items = [...prev.items];
      if (!items[idx]) {
        items[idx] = {
          pieces: 1,
          grossWeight: 0,
          weightUnit: "K",
          rateClass: "Q",
          chargeableWeight: 0,
          rate: 0,
          total: 0,
          natureAndQuantity: "",
        };
      }
      items[idx] = { ...items[idx], [field]: val };
      return { ...prev, items };
    });
  };

  const setCharges = (field: keyof MawbData["charges"], val: any) => {
    updateData((prev) => ({
      ...prev,
      charges: { ...prev.charges, [field]: val },
    }));
  };

  const setExecution = (field: keyof MawbData["execution"], val: any) => {
    updateData((prev) => ({
      ...prev,
      execution: { ...prev.execution, [field]: val },
    }));
  };

  // ---- Other Charges (line items) helpers ----
  const addOtherCharge = () => {
    updateData((prev: any) => ({
      ...prev,
      otherCharges: [
        ...(prev.otherCharges || []),
        {
          id: `oc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          charge: "",
          basis: "Per kg",
          rate: "",
          amount: "",
          dueTo: "Carrier",
          payAt: "Prepaid",
        },
      ],
    }));
  };

  const setOtherCharge = (
    idx: number,
    field: keyof OtherChargeLine,
    val: any,
  ) => {
    updateData((prev: any) => {
      const arr = [...(prev.otherCharges || [])];
      if (!arr[idx]) return prev;
      arr[idx] = { ...arr[idx], [field]: val };

      // Auto-calc amount when basis/rate changes
      const line = arr[idx];
      const chgWt =
        Number(prev.items?.[0]?.chargeableWeight) ||
        Number(prev.items?.[0]?.grossWeight) ||
        0;
      const rate = Number(line.rate) || 0;
      if (line.basis === "Per kg")
        line.amount = Number((rate * chgWt).toFixed(2));
      if (line.basis === "Per piece")
        line.amount = Number(
          (rate * (Number(prev.items?.[0]?.pieces) || 0)).toFixed(2),
        );
      if (line.basis === "Flat") line.amount = rate;

      const carrierFromOther = arr
        .filter((l: any) => l.dueTo === "Carrier" && l.payAt === "Prepaid")
        .reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);

      const agentFromOther = arr
        .filter((l: any) => l.dueTo === "Agent" && l.payAt === "Prepaid")
        .reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);

      const carrierChargesPrepaid = Number(carrierFromOther.toFixed(2));
      const agentChargesPrepaid = Number(agentFromOther.toFixed(2));

      const breakdown = arr
        .filter((l: any) => Number(l.amount) > 0 && l.charge)
        .map(
          (l: any) =>
            `${String(l.charge).trim().toUpperCase()}-${Number(l.amount).toFixed(2)}`,
        )
        .join(", ");

      const it = prev.items?.[0] || {};
      const isAsDiscussed =
        String(it.rate || "").trim().toLowerCase() === "as per discussed";
      const isAsAgreed =
        String(it.rate || "").trim().toLowerCase() === "as agreed";
      const weightCharge =
        isAsDiscussed || isAsAgreed
          ? 0
          : Number(prev.charges?.prepaidWeightCharge) || 0;
      const tax = Number(prev.charges?.taxPrepaid) || 0;
      const valuation = Number(prev.charges?.valuationChargePrepaid) || 0;

      const otherPrepaidTotal = Number(
        (carrierChargesPrepaid + agentChargesPrepaid + tax + valuation).toFixed(
          2,
        ),
      );

      const totalPrepaid =
        isAsDiscussed || isAsAgreed
          ? otherPrepaidTotal > 0
            ? otherPrepaidTotal
            : isAsDiscussed
            ? "As per discussed"
            : "as agreed"
          : Number((weightCharge + otherPrepaidTotal).toFixed(2));

      return {
        ...prev,
        otherCharges: arr,
        charges: {
          ...prev.charges,
          carrierChargesPrepaid,
          agentChargesPrepaid,
          totalPrepaid,
          otherChargesBreakdown: breakdown,
        },
      };
    });
  };

  const removeOtherCharge = (idx: number) => {
    updateData((prev: any) => {
      const remaining = (prev.otherCharges || []).filter(
        (_: any, i: number) => i !== idx,
      );

      const carrierFromOther = remaining
        .filter((l: any) => l.dueTo === "Carrier" && l.payAt === "Prepaid")
        .reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);

      const agentFromOther = remaining
        .filter((l: any) => l.dueTo === "Agent" && l.payAt === "Prepaid")
        .reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);

      const carrierChargesPrepaid = Number(carrierFromOther.toFixed(2));
      const agentChargesPrepaid = Number(agentFromOther.toFixed(2));

      const breakdown = remaining
        .filter((l: any) => Number(l.amount) > 0 && l.charge)
        .map(
          (l: any) =>
            `${String(l.charge).trim().toUpperCase()}-${Number(l.amount).toFixed(2)}`,
        )
        .join(", ");

      const it = prev.items?.[0] || {};
      const isAsDiscussed =
        String(it.rate || "").trim().toLowerCase() === "as per discussed";
      const isAsAgreed =
        String(it.rate || "").trim().toLowerCase() === "as agreed";
      const weightCharge =
        isAsDiscussed || isAsAgreed
          ? 0
          : Number(prev.charges?.prepaidWeightCharge) || 0;
      const tax = Number(prev.charges?.taxPrepaid) || 0;
      const valuation = Number(prev.charges?.valuationChargePrepaid) || 0;

      const otherPrepaidTotal = Number(
        (carrierChargesPrepaid + agentChargesPrepaid + tax + valuation).toFixed(
          2,
        ),
      );

      const totalPrepaid =
        isAsDiscussed || isAsAgreed
          ? otherPrepaidTotal > 0
            ? otherPrepaidTotal
            : isAsDiscussed
            ? "As per discussed"
            : "as agreed"
          : Number((weightCharge + otherPrepaidTotal).toFixed(2));

      return {
        ...prev,
        otherCharges: remaining,
        charges: {
          ...prev.charges,
          carrierChargesPrepaid,
          agentChargesPrepaid,
          totalPrepaid,
          otherChargesBreakdown: breakdown,
        },
      };
    });
  };

  // Toggle "As per discussed" for weight rate
  const handleToggleAsPerDiscussed = (checked: boolean) => {
    if (checked) {
      updateData((prev: any) => {
        const items = [...prev.items];
        if (items[0]) {
          items[0] = {
            ...items[0],
            rate: "As per discussed",
            total: "As per discussed",
          };
        }
        return {
          ...prev,
          items,
          charges: {
            ...prev.charges,
            prepaidWeightCharge: "As per discussed",
          },
        };
      });
    } else {
      updateData((prev: any) => {
        const items = [...prev.items];
        if (items[0]) {
          items[0] = {
            ...items[0],
            rate: "",
            total: 0,
          };
        }
        return {
          ...prev,
          items,
          charges: {
            ...prev.charges,
            prepaidWeightCharge: 0,
          },
        };
      });
    }
  };

  // Toggle "as agreed" for rate / charge in step 7
  const handleToggleAsAgreed = (checked: boolean) => {
    if (checked) {
      updateData((prev: any) => {
        const items = [...prev.items];
        if (items[0]) {
          items[0] = {
            ...items[0],
            rate: "as agreed",
            total: "as agreed",
          };
        }
        return {
          ...prev,
          items,
          charges: {
            ...prev.charges,
            prepaidWeightCharge: "as agreed",
          },
        };
      });
    } else {
      updateData((prev: any) => {
        const items = [...prev.items];
        if (items[0]) {
          items[0] = {
            ...items[0],
            rate: "",
            total: 0,
          };
        }
        return {
          ...prev,
          items,
          charges: {
            ...prev.charges,
            prepaidWeightCharge: 0,
          },
        };
      });
    }
  };

  // Auto-calculate charges helper
  const handleAutoCalculate = () => {
    updateData((prev: any) => {
      const it = prev.items[0] || {};
      const isAsDiscussed =
        String(it.rate || "").trim().toLowerCase() === "as per discussed";
      const isAsAgreed =
        String(it.rate || "").trim().toLowerCase() === "as agreed";
      const chgWt = Number(it.chargeableWeight) || Number(it.grossWeight) || 0;
      const rate = Number(it.rate) || 0;
      const freightTotal = isAsDiscussed
        ? "As per discussed"
        : isAsAgreed
        ? "as agreed"
        : Number((chgWt * rate).toFixed(2));

      const updatedItems = [...prev.items];
      if (updatedItems[0]) {
        updatedItems[0] = { ...updatedItems[0], total: freightTotal };
      }

      // Recalc every other-charge line
      const otherCharges = (prev.otherCharges || []).map((l: any) => {
        const r = Number(l.rate) || 0;
        let amt = 0;
        if (l.basis === "Per kg") amt = r * chgWt;
        else if (l.basis === "Per piece") amt = r * (Number(it.pieces) || 0);
        else amt = r;
        return { ...l, amount: Number(amt.toFixed(2)) };
      });

      const carrierFromOther = otherCharges
        .filter((l: any) => l.dueTo === "Carrier" && l.payAt === "Prepaid")
        .reduce((s: number, l: any) => s + Number(l.amount || 0), 0);

      const agentFromOther = otherCharges
        .filter((l: any) => l.dueTo === "Agent" && l.payAt === "Prepaid")
        .reduce((s: number, l: any) => s + Number(l.amount || 0), 0);

      // Carrier charges prepaid is from otherCharges if present, otherwise fallback to existing
      const carrierChargesPrepaid =
        otherCharges.length > 0
          ? Number(carrierFromOther.toFixed(2))
          : Number(prev.charges.carrierChargesPrepaid) || 0;

      const agentChargesPrepaid =
        otherCharges.length > 0
          ? Number(agentFromOther.toFixed(2))
          : Number(prev.charges.agentChargesPrepaid) || 0;

      const taxPrepaid = Number(prev.charges.taxPrepaid) || 0;
      const valPrepaid = Number(prev.charges.valuationChargePrepaid) || 0;

      const otherPrepaidTotal = Number(
        (
          carrierChargesPrepaid +
          agentChargesPrepaid +
          taxPrepaid +
          valPrepaid
        ).toFixed(2),
      );

      const weightChargeNum =
        isAsDiscussed || isAsAgreed ? 0 : Number(freightTotal) || 0;

      const totalPrepaid =
        isAsDiscussed || isAsAgreed
          ? otherPrepaidTotal > 0
            ? otherPrepaidTotal
            : isAsDiscussed
            ? "As per discussed"
            : "as agreed"
          : Number((weightChargeNum + otherPrepaidTotal).toFixed(2));

      // Auto-generated breakdown string: e.g. "UEC-1300.00, MMC-980.00, SSC-19500.00"
      const breakdown = otherCharges
        .filter((l: any) => Number(l.amount) > 0 && l.charge)
        .map(
          (l: any) =>
            `${String(l.charge).trim().toUpperCase()}-${Number(l.amount).toFixed(2)}`,
        )
        .join(", ");

      return {
        ...prev,
        items: updatedItems,
        otherCharges,
        charges: {
          ...prev.charges,
          prepaidWeightCharge: freightTotal,
          carrierChargesPrepaid,
          agentChargesPrepaid,
          totalPrepaid,
          otherChargesBreakdown:
            breakdown || prev.charges.otherChargesBreakdown,
        },
      };
    });
  };

  // Reset to original data
  const handleReset = () => {
    setData(JSON.parse(JSON.stringify(initialData)));
  };

  // Print handler
  const handlePrint = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await printMawbPdf(printActivePage);
    } catch (err) {
      console.error("Print AWB error:", err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // Download handler
  const handleDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const prefix = (data.awbPrefix || "077").replace(/[^a-zA-Z0-9]/g, "");
      const serial = (data.awbSerial || "AWB").replace(/[^a-zA-Z0-9]/g, "_");
      const pageSuffix =
        printActivePage === "both" ? "" : `_${printActivePage.toUpperCase()}`;
      const fileName = `MAWB_${prefix}-${serial}${pageSuffix}.pdf`;
      await downloadMawbPdf(fileName, printActivePage);
    } catch (err) {
      console.error("Download AWB PDF error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const primaryItem = data.items[0] || ({} as MawbItemLine);
  const flight1 = data.routing.flights?.[0] || { flightNo: "", date: "" };
  const flight2 = data.routing.flights?.[1] || { flightNo: "", date: "" };
  const otherCharges: OtherChargeLine[] = (data as any).otherCharges || [];

  const isRateAsPerDiscussed =
    String(primaryItem.rate || "").trim().toLowerCase() === "as per discussed";

  const isRateAsAgreed =
    String(primaryItem.rate || "").trim().toLowerCase() === "as agreed";

  const computedWeightCharge = (() => {
    if (isRateAsPerDiscussed) return "As per discussed";
    if (isRateAsAgreed) return "as agreed";
    const w =
      Number(primaryItem.chargeableWeight) ||
      Number(primaryItem.grossWeight) ||
      0;
    const r = Number(primaryItem.rate) || 0;
    return w && r ? Number((w * r).toFixed(2)) : 0;
  })();

  const matchedAirline = findAirlineByPrefix(data.awbPrefix || "");

  const totalDimensionPieces = dimensionRows.reduce((acc, r) => {
    const p = Number(r.pieces);
    return acc + (isNaN(p) || p <= 0 ? 0 : p);
  }, 0);

  const totalCalculatedVolWeight = dimensionRows.reduce((acc, r) => {
    const l = Number(r.lengthCm);
    const w = Number(r.widthCm);
    const h = Number(r.heightCm);
    const p = Number(r.pieces);
    if (l > 0 && w > 0 && h > 0 && p > 0) {
      return acc + (l * w * h * p) / 6000;
    }
    return acc;
  }, 0);

  const calculatedVolWeight =
    totalCalculatedVolWeight > 0 ? totalCalculatedVolWeight : null;

  const handleUpdateDimensionRow = (
    index: number,
    field: keyof Omit<DimensionRow, "id">,
    value: string | number,
  ) => {
    const updated = [...dimensionRows];
    updated[index] = { ...updated[index], [field]: value };
    setDimensionRows(updated);

    const dimStr = formatDimensionsText(updated);
    const combined =
      goodsDescription.trim() && dimStr
        ? `${goodsDescription.trim()}\n\n${dimStr}`
        : goodsDescription.trim() || dimStr || "";

    const totalVolWeight = updated.reduce((acc, r) => {
      const l = Number(r.lengthCm);
      const w = Number(r.widthCm);
      const h = Number(r.heightCm);
      const p = Number(r.pieces);
      if (l > 0 && w > 0 && h > 0 && p > 0) {
        return acc + (l * w * h * p) / 6000;
      }
      return acc;
    }, 0);

    const validEntries: DimensionEntry[] = updated
      .filter(
        (r) =>
          Number(r.lengthCm) > 0 &&
          Number(r.widthCm) > 0 &&
          Number(r.heightCm) > 0,
      )
      .map((r) => ({
        lengthCm: Number(r.lengthCm) || 0,
        widthCm: Number(r.widthCm) || 0,
        heightCm: Number(r.heightCm) || 0,
        pieces: Number(r.pieces) || 1,
      }));

    setData((prev) => {
      const items = [...prev.items];
      const first = { ...(items[0] || {}) };
      first.natureAndQuantity = combined;
      first.dimensions = validEntries;
      first.volumetricWeightKg = Math.round(totalVolWeight);
      items[0] = first as MawbItemLine;
      return { ...prev, items };
    });
  };

  const handleAddDimensionRow = () => {
    const newRow: DimensionRow = {
      id: `dim-${Date.now()}-${dimensionRows.length + 1}`,
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      pieces: 1,
    };
    const updated = [...dimensionRows, newRow];
    setDimensionRows(updated);
  };

  const handleRemoveDimensionRow = (index: number) => {
    let updated: DimensionRow[];
    if (dimensionRows.length <= 1) {
      updated = [
        { id: `dim-1`, lengthCm: "", widthCm: "", heightCm: "", pieces: 1 },
      ];
    } else {
      updated = dimensionRows.filter((_, i) => i !== index);
    }
    setDimensionRows(updated);

    const dimStr = formatDimensionsText(updated);
    const combined =
      goodsDescription.trim() && dimStr
        ? `${goodsDescription.trim()}\n\n${dimStr}`
        : goodsDescription.trim() || dimStr || "";

    const totalVolWeight = updated.reduce((acc, r) => {
      const l = Number(r.lengthCm);
      const w = Number(r.widthCm);
      const h = Number(r.heightCm);
      const p = Number(r.pieces);
      if (l > 0 && w > 0 && h > 0 && p > 0) {
        return acc + (l * w * h * p) / 6000;
      }
      return acc;
    }, 0);

    const validEntries: DimensionEntry[] = updated
      .filter(
        (r) =>
          Number(r.lengthCm) > 0 &&
          Number(r.widthCm) > 0 &&
          Number(r.heightCm) > 0,
      )
      .map((r) => ({
        lengthCm: Number(r.lengthCm) || 0,
        widthCm: Number(r.widthCm) || 0,
        heightCm: Number(r.heightCm) || 0,
        pieces: Number(r.pieces) || 1,
      }));

    setData((prev) => {
      const items = [...prev.items];
      const first = { ...(items[0] || {}) };
      first.natureAndQuantity = combined;
      first.dimensions = validEntries;
      first.volumetricWeightKg = Math.round(totalVolWeight);
      items[0] = first as MawbItemLine;
      return { ...prev, items };
    });
  };

  const handleGoodsDescriptionChange = (newDesc: string) => {
    setGoodsDescription(newDesc);
    const dimStr = formatDimensionsText(dimensionRows);
    const combined =
      newDesc.trim() && dimStr
        ? `${newDesc.trim()}\n\n${dimStr}`
        : newDesc.trim() || dimStr || "";
    setData((prev) => {
      const items = [...prev.items];
      const first = { ...(items[0] || {}) };
      first.natureAndQuantity = combined;
      items[0] = first as MawbItemLine;
      return { ...prev, items };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-2.5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-[98vw] max-w-[1720px] h-[96vh] max-h-[96vh] flex flex-col shadow-2xl text-slate-900 print:m-0 print:max-h-none print:max-w-none print:w-full print:rounded-none print:border-0 print:shadow-none overflow-hidden">
        {/* ================= MODAL HEADER & TOOLBAR ================= */}
        <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap xl:flex-nowrap items-center justify-between gap-3 bg-white sticky top-0 z-20 print:hidden shrink-0 shadow-xs">
          {/* Left: Title & MAWB info */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD] flex items-center justify-center shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-heading text-slate-900">
                  IATA Air Waybill Editor &amp; Print Interface
                </h3>
                <span className="hidden sm:inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-[#2C5EAD] border border-blue-500/20">
                  Res 600b Editable
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                MAWB:{" "}
                <span className="font-semibold text-slate-800">
                  {mawbNumber}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* View Mode Switcher (Split / Edit / Preview) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "split"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Form on left, Live Sheet on right"
              >
                <Split className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "edit"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Full-width editable fields"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Details</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "preview"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Full-width PDF sheet preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sheet Preview</span>
              </button>
            </div>

            {/* Page Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setPrintActivePage("both")}
                className={`px-2 py-1.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  printActivePage === "both"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setPrintActivePage("face")}
                className={`px-2 py-1.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  printActivePage === "face"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                P1 Face
              </button>
              <button
                type="button"
                onClick={() => setPrintActivePage("conditions")}
                className={`px-2 py-1.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  printActivePage === "conditions"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                P2 Terms
              </button>
            </div>

            {/* Copy Type Dropdown */}
            <select
              value={copyType}
              onChange={(e) =>
                onCopyTypeChange(
                  e.target.value as
                    | "ORIGINAL_1"
                    | "ORIGINAL_2"
                    | "ORIGINAL_3"
                    | "EXTRA",
                )
              }
              className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 shadow-xs focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD] shrink-0"
            >
              <option value="ORIGINAL_1">Original 1 (Carrier - Green)</option>
              <option value="ORIGINAL_2">Original 2 (Consignee - Pink)</option>
              <option value="ORIGINAL_3">Original 3 (Shipper - Blue)</option>
              <option value="EXTRA">Copy 4 (Delivery Receipt)</option>
            </select>

            {/* Zoom Controls (Active in preview / split) */}
            {viewMode !== "edit" && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setModalZoom((z) =>
                      Math.max(0.5, parseFloat((z - 0.1).toFixed(2))),
                    )
                  }
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-all cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setModalZoom(0.9)}
                  className="px-1.5 py-1 text-[11px] font-mono font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                  title="Reset zoom"
                >
                  {Math.round(modalZoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setModalZoom((z) =>
                      Math.min(1.5, parseFloat((z + 0.1).toFixed(2))),
                    )
                  }
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-all cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Reset to Original Button */}
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer"
              title="Reset all inputs back to original database values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-[#2C5EAD] hover:bg-[#204580] disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
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
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-hidden flex flex-row">
          {/* LEFT: EDITABLE INPUTS PANEL */}
          <div
            className={`overflow-y-auto p-4 sm:p-6 bg-slate-50 border-r border-slate-200 transition-all duration-200 ${
              viewMode === "split"
                ? "w-full md:w-[48%] xl:w-[45%]"
                : viewMode === "edit"
                  ? "w-full"
                  : "hidden"
            }`}
          >
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Header Quick Banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2C5EAD] shrink-0" />
                  <span>
                    Any changes made here update the AWB Sheet in real-time
                    before printing.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoCalculate}
                  className="px-2.5 py-1 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors shadow-2xs"
                  title="Recalculate freight total and prepaid charges"
                >
                  Recalculate Totals
                </button>
              </div>

              {/* 1. AWB Header & Carrier */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <Plane className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>1. AWB Header &amp; Carrier Identity</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={FIELD_LABEL}>AWB Prefix</label>
                    <input
                      type="text"
                      maxLength={7}
                      value={data.awbPrefix || ""}
                      onChange={(e) => handlePrefixChange(e.target.value)}
                      placeholder="077"
                      className={INPUT_BASE}
                      list="airline-prefix-options"
                      autoComplete="off"
                    />
                    <datalist id="airline-prefix-options">
                      {airlines.map((a) => (
                        <option key={a.prefix} value={a.prefix}>
                          {a.prefix} - {a.name} ({a.code})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={FIELD_LABEL}>AWB Serial / Number</label>
                    <input
                      type="text"
                      value={data.awbSerial || ""}
                      onChange={(e) => setTopLevel("awbSerial", e.target.value)}
                      placeholder="5906 6545"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Origin Code</label>
                    <input
                      type="text"
                      value={data.departureAirportCode || ""}
                      onChange={(e) =>
                        setTopLevel("departureAirportCode", e.target.value)
                      }
                      placeholder="DEL"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Carrier Name
                      </label>
                      {matchedAirline && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Auto-fetched: {matchedAirline.name}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={data.carrierName || ""}
                      onChange={(e) =>
                        setTopLevel("carrierName", e.target.value)
                      }
                      placeholder="EGYPT AIR"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Accounting Info</label>
                    <input
                      type="text"
                      value={data.accountingInfo || ""}
                      onChange={(e) =>
                        setTopLevel("accountingInfo", e.target.value)
                      }
                      placeholder="FREIGHT PREPAID"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Shipper Details */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <Building2 className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>2. Shipper&apos;s Name and Address</span>
                </h4>
                <div>
                  <label className={FIELD_LABEL}>
                    Shipper Name &amp; Full Address
                  </label>
                  <textarea
                    rows={3}
                    value={data.shipper.nameAndAddress || ""}
                    onChange={(e) =>
                      setShipper("nameAndAddress", e.target.value)
                    }
                    placeholder="Shipper company name&#10;Street address, complex&#10;City, State, PIN"
                    className={TEXTAREA_BASE}
                  />
                </div>
                <div>
                  <label className={FIELD_LABEL}>Shipper Account Number</label>
                  <input
                    type="text"
                    value={data.shipper.accountNumber || ""}
                    onChange={(e) =>
                      setShipper("accountNumber", e.target.value)
                    }
                    placeholder="Optional account number"
                    className={INPUT_BASE}
                  />
                </div>
              </div>

              {/* 3. Consignee Details */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <User className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>3. Consignee&apos;s Name and Address</span>
                </h4>
                <div>
                  <label className={FIELD_LABEL}>
                    Consignee Name &amp; Full Address
                  </label>
                  <textarea
                    rows={3}
                    value={data.consignee.nameAndAddress || ""}
                    onChange={(e) =>
                      setConsignee("nameAndAddress", e.target.value)
                    }
                    placeholder="Consignee company name&#10;Street address&#10;City, Country, Phone"
                    className={TEXTAREA_BASE}
                  />
                </div>
                <div>
                  <label className={FIELD_LABEL}>
                    Consignee Account Number
                  </label>
                  <input
                    type="text"
                    value={data.consignee.accountNumber || ""}
                    onChange={(e) =>
                      setConsignee("accountNumber", e.target.value)
                    }
                    placeholder="Optional account number"
                    className={INPUT_BASE}
                  />
                </div>
              </div>

              {/* 4. Issuing Agent Details */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <Building2 className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>4. Issuing Carrier&apos;s Agent</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className={FIELD_LABEL}>Agent Name and City</label>
                    <input
                      type="text"
                      value={data.issuingAgent.nameAndCity || ""}
                      onChange={(e) => setAgent("nameAndCity", e.target.value)}
                      placeholder="Agent name & city"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>IATA Cargo Agent Code</label>
                    <input
                      type="text"
                      value={data.issuingAgent.iataCode || ""}
                      onChange={(e) => setAgent("iataCode", e.target.value)}
                      placeholder="14026840004"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Agent Account No</label>
                  <input
                    type="text"
                    value={data.issuingAgent.accountNo || ""}
                    onChange={(e) => setAgent("accountNo", e.target.value)}
                    placeholder="Agent account / CASS ID"
                    className={INPUT_BASE}
                  />
                </div>
              </div>

              {/* 5. Routing, Flight Schedule & Destination */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <Compass className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>5. Routing &amp; Flight Schedule</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={FIELD_LABEL}>Departure Airport</label>
                    <input
                      type="text"
                      value={data.routing.departureAirport || ""}
                      onChange={(e) =>
                        setRouting("departureAirport", e.target.value)
                      }
                      placeholder="DELHI"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>To (Airport 1)</label>
                    <input
                      type="text"
                      value={data.routing.to1 || ""}
                      onChange={(e) => setRouting("to1", e.target.value)}
                      placeholder="LHR"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>First Carrier</label>
                    <input
                      type="text"
                      value={data.routing.byFirstCarrier || ""}
                      onChange={(e) =>
                        setRouting("byFirstCarrier", e.target.value)
                      }
                      placeholder="MS"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Destination Airport</label>
                    <input
                      type="text"
                      value={data.routing.destinationAirport || ""}
                      onChange={(e) =>
                        setRouting("destinationAirport", e.target.value)
                      }
                      placeholder="LONDON"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>

                {/* Flights & Dates */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className={FIELD_LABEL}>Flight 1 Number</label>
                    <input
                      type="text"
                      value={flight1.flightNo || ""}
                      onChange={(e) => setFlight(0, "flightNo", e.target.value)}
                      placeholder="MS 965"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#2C5EAD]" />
                        Flight 1 Date
                      </span>
                    </label>
                    <input
                      type="date"
                      value={toDateInputValue(flight1.date)}
                      onChange={(e) => setFlight(0, "date", e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className={`${INPUT_BASE} cursor-pointer`}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Flight 2 Number (Opt)</label>
                    <input
                      type="text"
                      value={flight2.flightNo || ""}
                      onChange={(e) => setFlight(1, "flightNo", e.target.value)}
                      placeholder="MS 777"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#2C5EAD]" />
                        Flight 2 Date (Opt)
                      </span>
                    </label>
                    <input
                      type="date"
                      value={toDateInputValue(flight2.date)}
                      onChange={(e) => setFlight(1, "date", e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className={`${INPUT_BASE} cursor-pointer`}
                    />
                  </div>
                </div>

                {/* Currency, Payment Codes, Values */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className={FIELD_LABEL}>Currency</label>
                    <input
                      type="text"
                      value={data.routing.currency || "INR"}
                      onChange={(e) => setRouting("currency", e.target.value)}
                      placeholder="INR"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>CHGS Code</label>
                    <input
                      type="text"
                      value={data.routing.chgsCode || "PP"}
                      onChange={(e) => setRouting("chgsCode", e.target.value)}
                      placeholder="PP"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>WT/VAL (PPD / COLL)</label>
                    <input
                      type="text"
                      value={data.routing.wtValPpd || "P"}
                      onChange={(e) => setRouting("wtValPpd", e.target.value)}
                      placeholder="P"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Other (PPD / COLL)</label>
                    <input
                      type="text"
                      value={data.routing.otherPpd || "P"}
                      onChange={(e) => setRouting("otherPpd", e.target.value)}
                      placeholder="P"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className={FIELD_LABEL}>Declared Carriage</label>
                    <input
                      type="text"
                      value={data.routing.declaredValueCarriage || "N.V.D."}
                      onChange={(e) =>
                        setRouting("declaredValueCarriage", e.target.value)
                      }
                      placeholder="N.V.D."
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Declared Customs</label>
                    <input
                      type="text"
                      value={data.routing.declaredValueCustoms || "N.C.V."}
                      onChange={(e) =>
                        setRouting("declaredValueCustoms", e.target.value)
                      }
                      placeholder="N.C.V."
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Insurance Amount</label>
                    <input
                      type="text"
                      value={data.routing.amountOfInsurance || "NIL"}
                      onChange={(e) =>
                        setRouting("amountOfInsurance", e.target.value)
                      }
                      placeholder="NIL"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
              </div>

              {/* 6. Handling Information & Special Customs */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <Compass className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>6. Handling Information &amp; Customs (SCI)</span>
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className={FIELD_LABEL}>Handling Information</label>
                    <textarea
                      rows={2}
                      value={data.routing.handlingInfo || ""}
                      onChange={(e) =>
                        setRouting("handlingInfo", e.target.value)
                      }
                      placeholder="CODE GEN / CONSOL OF 1 HAWB..."
                      className={TEXTAREA_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>
                      SCI (Special Customs Info)
                    </label>
                    <input
                      type="text"
                      value={data.routing.sci || "SCI"}
                      onChange={(e) => setRouting("sci", e.target.value)}
                      placeholder="SCI"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
              </div>

              {/* 7. Cargo Details & Rating */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <Package className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>7. Cargo Details &amp; Line Items</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={FIELD_LABEL}>Pieces (RCP)</label>
                    <input
                      type="text"
                      value={primaryItem.pieces ?? ""}
                      onChange={(e) => setItem(0, "pieces", e.target.value)}
                      placeholder="1"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Gross Weight (kg)</label>
                    <input
                      type="number"
                      step="any"
                      value={primaryItem.grossWeight ?? ""}
                      onChange={(e) =>
                        setItem(0, "grossWeight", e.target.value)
                      }
                      placeholder="230.0"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Weight Unit</label>
                    <select
                      value={primaryItem.weightUnit || "K"}
                      onChange={(e) => setItem(0, "weightUnit", e.target.value)}
                      className={INPUT_BASE}
                    >
                      <option value="K">K (Kilograms)</option>
                      <option value="L">L (Pounds)</option>
                    </select>
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Rate Class</label>
                    <input
                      type="text"
                      value={primaryItem.rateClass || "Q"}
                      onChange={(e) => setItem(0, "rateClass", e.target.value)}
                      placeholder="Q"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className={FIELD_LABEL}>Chargeable Weight (kg)</label>
                    <input
                      type="number"
                      step="any"
                      value={primaryItem.chargeableWeight ?? ""}
                      onChange={(e) =>
                        setItem(0, "chargeableWeight", e.target.value)
                      }
                      placeholder="230.0"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Rate / Charge</label>
                    <input
                      type="text"
                      value={primaryItem.rate ?? ""}
                      onChange={(e) => setItem(0, "rate", e.target.value)}
                      placeholder={isRateAsAgreed ? "as agreed" : "120.00"}
                      className={`${INPUT_BASE} ${
                        isRateAsAgreed
                          ? "bg-blue-50/60 font-semibold text-[#2C5EAD]"
                          : ""
                      }`}
                    />
                    <label className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isRateAsAgreed}
                        onChange={(e) => handleToggleAsAgreed(e.target.checked)}
                        className="w-3.5 h-3.5 text-[#2C5EAD] rounded border-slate-300 focus:ring-[#2C5EAD]/25 cursor-pointer"
                      />
                      <span>as agreed</span>
                    </label>
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Total Weight Charge</label>
                    <input
                      type="text"
                      value={primaryItem.total ?? ""}
                      onChange={(e) => setItem(0, "total", e.target.value)}
                      placeholder="27600.00"
                      className={`${INPUT_BASE} ${
                        isRateAsAgreed || isRateAsPerDiscussed
                          ? "bg-blue-50/60 font-semibold text-[#2C5EAD]"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className={FIELD_LABEL}>
                    Nature and Quantity of Goods (Goods Description, HS Codes, Invoice DT)
                  </label>
                  <textarea
                    rows={4}
                    value={goodsDescription}
                    onChange={(e) =>
                      handleGoodsDescriptionChange(e.target.value)
                    }
                    placeholder="SAID TO CONTAIN&#10;ARTIFICIAL JEWELLERY, BAG, CERAMIC UTENSILS...&#10;HS CODE: 71171100, 63053300&#10;INVOICE NO - CR050 DT. 29/10/2026"
                    className={TEXTAREA_BASE}
                  />
                </div>

                {/* Cargo Dimensions & Volumetric Weight (Calculated / Fetched from Docket) */}
                <div className="pt-3 mt-1 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-[#2C5EAD]" />
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        Package Dimensions (Boxes) &amp; Volumetric Weight
                      </span>
                      {fetchedFromDocketNo && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Fetched from Docket {fetchedFromDocketNo}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDimensionRow}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#2C5EAD] border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Box Row</span>
                    </button>
                  </div>

                  {/* Multi-Row Dimension Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="py-2 px-2.5 w-10 text-center">#</th>
                          <th className="py-2 px-2.5">Length (cm)</th>
                          <th className="py-2 px-2.5">Breadth / Width (cm)</th>
                          <th className="py-2 px-2.5">Height (cm)</th>
                          <th className="py-2 px-2.5 w-24">Pieces</th>
                          <th className="py-2 px-2.5 w-28 text-right">
                            Vol. Wt (kg)
                          </th>
                          <th className="py-2 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {dimensionRows.map((row, idx) => {
                          const l = Number(row.lengthCm) || 0;
                          const w = Number(row.widthCm) || 0;
                          const h = Number(row.heightCm) || 0;
                          const p = Number(row.pieces) || 0;
                          const rowVol =
                            l > 0 && w > 0 && h > 0 && p > 0
                              ? ((l * w * h * p) / 6000).toFixed(2)
                              : "0.00";

                          return (
                            <tr
                              key={row.id || idx}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="py-2 px-2.5 text-center font-mono text-[11px] font-semibold text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={row.lengthCm}
                                  onChange={(e) =>
                                    handleUpdateDimensionRow(
                                      idx,
                                      "lengthCm",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="45"
                                  className={`${INPUT_BASE} font-mono`}
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={row.widthCm}
                                  onChange={(e) =>
                                    handleUpdateDimensionRow(
                                      idx,
                                      "widthCm",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="40"
                                  className={`${INPUT_BASE} font-mono`}
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={row.heightCm}
                                  onChange={(e) =>
                                    handleUpdateDimensionRow(
                                      idx,
                                      "heightCm",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="40"
                                  className={`${INPUT_BASE} font-mono`}
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={row.pieces}
                                  onChange={(e) =>
                                    handleUpdateDimensionRow(
                                      idx,
                                      "pieces",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="10"
                                  className={`${INPUT_BASE} font-mono font-semibold`}
                                />
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono text-xs font-semibold text-slate-700">
                                {rowVol}
                              </td>
                              <td className="py-1.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDimensionRow(idx)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete dimension row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-600">
                          Total Boxes:
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {totalDimensionPieces} pcs
                        </span>
                        {totalDimensionPieces > 0 &&
                          String(primaryItem.pieces) !==
                            String(totalDimensionPieces) && (
                            <button
                              type="button"
                              onClick={() =>
                                setItem(
                                  0,
                                  "pieces",
                                  String(totalDimensionPieces),
                                )
                              }
                              className="ml-1 text-[10px] text-[#2C5EAD] underline hover:text-[#204580] font-semibold cursor-pointer"
                              title="Set RCP Pieces to total boxes count"
                            >
                              (Set as Pieces)
                            </button>
                          )}
                      </div>

                      <div className="flex items-center gap-1.5 border-l border-blue-200/60 pl-3">
                        <span className="text-[11px] text-slate-600">
                          Volumetric Weight:
                        </span>
                        <span className="font-bold text-[#2C5EAD] font-mono text-sm">
                          {Math.round(totalCalculatedVolWeight)} KGS
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({totalCalculatedVolWeight.toFixed(2)} kg)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const rounded = Math.round(totalCalculatedVolWeight);
                          if (rounded > 0) {
                            setItem(0, "chargeableWeight", String(rounded));
                          }
                        }}
                        className="px-2.5 py-1 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        title="Set Chargeable Weight to calculated Volumetric Weight"
                      >
                        Apply as Chargeable Wt (
                        {Math.round(totalCalculatedVolWeight)} kg)
                      </button>
                    </div>
                  </div>

                  {/* Live Sheet Preview Display */}
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-1 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                      <span>Preview on MAWB Right Side Box</span>
                      <span className="text-emerald-400">
                        Identical box sizes kept separate
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-amber-200">
                      {formatDimensionsText(dimensionRows) ||
                        "DIM: (Enter dimensions above) CMT\nVOL WT: 0 KGS"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. Other Charges & Summary Totals */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <Calculator className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>8. Other Charges &amp; Summary Totals</span>
                </h4>

                {/* Weight summary row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <label className={FIELD_LABEL}>Actual Weight (kg)</label>
                    <input
                      type="number"
                      step="any"
                      value={primaryItem.grossWeight ?? ""}
                      onChange={(e) =>
                        setItem(0, "grossWeight", e.target.value)
                      }
                      className={`${INPUT_BASE} text-center`}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>
                      Chargeable Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={primaryItem.chargeableWeight ?? ""}
                      onChange={(e) =>
                        setItem(0, "chargeableWeight", e.target.value)
                      }
                      className={`${INPUT_BASE} text-center`}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Weight Rate per kg</label>
                    <input
                      type="text"
                      value={primaryItem.rate ?? ""}
                      onChange={(e) => setItem(0, "rate", e.target.value)}
                      placeholder={
                        isRateAsPerDiscussed
                          ? "As per discussed"
                          : isRateAsAgreed
                          ? "as agreed"
                          : "0.00"
                      }
                      className={`${INPUT_BASE} text-center ${
                        isRateAsPerDiscussed || isRateAsAgreed
                          ? "bg-blue-50/60 font-semibold text-[#2C5EAD]"
                          : ""
                      }`}
                    />
                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[10.5px] text-slate-600 hover:text-[#2C5EAD] font-medium mt-1.5">
                      <input
                        type="checkbox"
                        checked={isRateAsPerDiscussed}
                        onChange={(e) =>
                          handleToggleAsPerDiscussed(e.target.checked)
                        }
                        className="w-3.5 h-3.5 text-[#2C5EAD] rounded border-slate-300 focus:ring-[#2C5EAD]/25 cursor-pointer"
                      />
                      <span>As per discussed</span>
                    </label>
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>
                      Wt. Charge (Rate × Wt)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={
                        isRateAsPerDiscussed
                          ? "As per discussed"
                          : isRateAsAgreed
                          ? "as agreed"
                          : typeof computedWeightCharge === "number" &&
                            computedWeightCharge > 0
                          ? computedWeightCharge.toFixed(2)
                          : primaryItem.total || ""
                      }
                      className={`${INPUT_BASE} text-center font-bold text-[#2C5EAD] bg-slate-50`}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Weight Charge Pay at</label>
                    <select
                      value={(data as any).weightChargePayAt || "Prepaid"}
                      onChange={(e) =>
                        setTopLevel("weightChargePayAt" as any, e.target.value)
                      }
                      className={INPUT_BASE}
                    >
                      <option value="Prepaid">Prepaid</option>
                      <option value="Collect">Collect</option>
                    </select>
                  </div>
                </div>

                {/* Other Charges table header */}
                <div className="text-[11px] font-bold text-slate-700 pt-1">
                  Other Charges (amount = rate × chargeable weight for &quot;Per
                  kg&quot;)
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Header row */}
                  <div className="grid grid-cols-[28px_1.6fr_0.9fr_0.8fr_1fr_0.9fr_0.9fr_28px] gap-1 bg-slate-100 px-2 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide items-center">
                    <span>#</span>
                    <span>Charge</span>
                    <span>Basis</span>
                    <span>Rate</span>
                    <span>Amount</span>
                    <span>Due to</span>
                    <span>Pay at</span>
                    <span />
                  </div>

                  {/* Rows */}
                  {otherCharges.length > 0 ? (
                    otherCharges.map((line, idx) => (
                      <div
                        key={line.id || idx}
                        className="grid grid-cols-[28px_1.6fr_0.9fr_0.8fr_1fr_0.9fr_0.9fr_28px] gap-1 px-2 py-1 items-center border-t border-slate-100"
                      >
                        <span className="text-[11px] text-slate-500 font-mono">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={line.charge}
                          onChange={(e) =>
                            setOtherCharge(idx, "charge", e.target.value)
                          }
                          placeholder="Fuel Surcharge (FSC)"
                          className={`${INPUT_BASE} !py-1`}
                        />
                        <select
                          value={line.basis}
                          onChange={(e) =>
                            setOtherCharge(idx, "basis", e.target.value)
                          }
                          className={`${INPUT_BASE} !py-1`}
                        >
                          <option value="Per kg">Per kg</option>
                          <option value="Per piece">Per piece</option>
                          <option value="Flat">Flat</option>
                        </select>
                        <input
                          type="number"
                          step="any"
                          value={line.rate}
                          onChange={(e) =>
                            setOtherCharge(idx, "rate", e.target.value)
                          }
                          placeholder="0.00"
                          className={`${INPUT_BASE} !py-1 text-right`}
                        />
                        <input
                          type="text"
                          readOnly
                          value={
                            Number(line.amount)
                              ? Number(line.amount).toFixed(2)
                              : ""
                          }
                          className={`${INPUT_BASE} !py-1 text-right font-semibold bg-slate-50`}
                        />
                        <select
                          value={line.dueTo}
                          onChange={(e) =>
                            setOtherCharge(idx, "dueTo", e.target.value)
                          }
                          className={`${INPUT_BASE} !py-1`}
                        >
                          <option value="Carrier">Carrier</option>
                          <option value="Agent">Agent</option>
                        </select>
                        <select
                          value={line.payAt}
                          onChange={(e) =>
                            setOtherCharge(idx, "payAt", e.target.value)
                          }
                          className={`${INPUT_BASE} !py-1`}
                        >
                          <option value="Prepaid">Prepaid</option>
                          <option value="Collect">Collect</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeOtherCharge(idx)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors cursor-pointer"
                          title="Remove charge"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-center text-[11px] text-slate-400 border-t border-slate-100">
                      No other charges added yet.
                    </div>
                  )}

                  {/* + Add Charge */}
                  <button
                    type="button"
                    onClick={addOtherCharge}
                    className="w-full py-1.5 text-[11px] font-bold text-[#2C5EAD] hover:bg-blue-50 border-t border-slate-200 transition-colors cursor-pointer"
                  >
                    + Add Charge
                  </button>
                </div>

                {/* Totals row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className={FIELD_LABEL}>Weight Charge Prepaid</label>
                    <input
                      type="text"
                      value={data.charges.prepaidWeightCharge ?? ""}
                      onChange={(e) =>
                        setCharges("prepaidWeightCharge", e.target.value)
                      }
                      placeholder="27600.00"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>
                      Carrier Charges Prepaid
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={data.charges.carrierChargesPrepaid ?? ""}
                      onChange={(e) =>
                        setCharges("carrierChargesPrepaid", e.target.value)
                      }
                      placeholder="570.00"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Agent Charges Prepaid</label>
                    <input
                      type="number"
                      step="any"
                      value={data.charges.agentChargesPrepaid ?? ""}
                      onChange={(e) =>
                        setCharges("agentChargesPrepaid", e.target.value)
                      }
                      placeholder="0.00"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className={FIELD_LABEL}>Total Prepaid Amount</label>
                    <input
                      type="number"
                      step="any"
                      value={data.charges.totalPrepaid ?? ""}
                      onChange={(e) =>
                        setCharges("totalPrepaid", e.target.value)
                      }
                      placeholder="28170.00"
                      className={`${INPUT_BASE} font-bold text-[#2C5EAD]`}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Total Collect Amount</label>
                    <input
                      type="number"
                      step="any"
                      value={data.charges.totalCollect ?? ""}
                      onChange={(e) =>
                        setCharges("totalCollect", e.target.value)
                      }
                      placeholder="0.00"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className={FIELD_LABEL}>
                    Other Charges Breakdown (auto-generated)
                  </label>
                  <input
                    type="text"
                    value={data.charges.otherChargesBreakdown || ""}
                    onChange={(e) =>
                      setCharges("otherChargesBreakdown", e.target.value)
                    }
                    placeholder="UEC-1300.00, MMC-980.00, SSC-19500.00"
                    className={INPUT_BASE}
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Printed on MAWB sheet under &quot;Other Charges&quot; (format: UEC-1300.00, MMC-980.00, SSC-19500.00)
                  </p>
                </div>
              </div>

              {/* 9. Execution, Signatures & Dates */}
              <div className={SECTION_CARD}>
                <h4 className={SECTION_TITLE}>
                  <FileCheck className="w-3.5 h-3.5 text-[#2C5EAD]" />
                  <span>9. Execution &amp; Certification</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={FIELD_LABEL}>
                      Shipper / Agent Certification Signatory
                    </label>
                    <input
                      type="text"
                      value={data.execution.shipperCertSignatory || ""}
                      onChange={(e) =>
                        setExecution("shipperCertSignatory", e.target.value)
                      }
                      placeholder="SPREETRANS INTERNATIONAL"
                      className={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>
                      Issuing Carrier Agent Signature
                    </label>
                    <input
                      type="text"
                      value={data.execution.carrierAgentSignature || ""}
                      onChange={(e) =>
                        setExecution("carrierAgentSignature", e.target.value)
                      }
                      placeholder="SPREETRANS INTERNATIONAL"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className={FIELD_LABEL}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#2C5EAD]" />
                        Executed on (Date)
                      </span>
                    </label>
                    <input
                      type="date"
                      value={toDateInputValue(data.execution.executedDate)}
                      onChange={(e) => setExecution("executedDate", e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className={`${INPUT_BASE} cursor-pointer`}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Executed at (Place)</label>
                    <input
                      type="text"
                      value={data.execution.executedPlace || ""}
                      onChange={(e) =>
                        setExecution("executedPlace", e.target.value)
                      }
                      placeholder="DELHI"
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE INTERACTIVE AWB PREVIEW */}
          <div
            className={`flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 bg-slate-200/60 print:bg-white print:p-0 transition-all duration-200 ${
              viewMode === "edit"
                ? "fixed -left-[99999px] top-0 opacity-0 pointer-events-none"
                : "block"
            }`}
          >
            <div className="flex justify-center min-w-max mx-auto py-4">
              <MawbSheet
                data={data}
                activePage={printActivePage}
                scale={modalZoom}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
