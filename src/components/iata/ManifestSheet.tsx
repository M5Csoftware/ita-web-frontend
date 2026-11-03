"use client";

import React from "react";
import { FlightManifestItem, MawbItem } from "@/types/iata";

interface ManifestSheetProps {
  manifest: FlightManifestItem;
  mawbs: MawbItem[];
  scale?: number;
}

function formatManifestDate(dStr?: string) {
  if (!dStr) return "";
  const parts = dStr.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  }
  return dStr;
}

interface ManifestRowItem {
  hawbNumber: string;
  pieces: number;
  weight: number;
  origDest: string;
  ppdColl: string;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  details: string;
}

export const ManifestSheet: React.FC<ManifestSheetProps> = ({
  manifest,
  mawbs,
  scale = 1,
}) => {
  // Find primary MAWB associated with this manifest
  const primaryMawbNum = manifest.mawbs?.[0];
  const primaryMawb = mawbs.find((m) => m.mawbNumber === primaryMawbNum);

  // Extract all rows (either HAWBs or MAWBs)
  const rows: ManifestRowItem[] = [];

  manifest.mawbs.forEach((mawbNum) => {
    const mawb = mawbs.find((m) => m.mawbNumber === mawbNum);
    if (!mawb) return;

    if (mawb.hawbs && mawb.hawbs.length > 0) {
      mawb.hawbs.forEach((h) => {
        // Strip long auto prefixes like HAWB-DEL-6545-01 -> 01 or raw number if short
        let cleanHawb = h.hawbNumber || "";
        const mPrefix = cleanHawb.match(/^HAWB-[A-Z]+-\d+-(.+)$/);
        if (mPrefix && mPrefix[1]) {
          cleanHawb = mPrefix[1];
        } else {
          cleanHawb = cleanHawb.replace(/^HAWB-/, "");
        }

        rows.push({
          hawbNumber: cleanHawb || h.hawbNumber,
          pieces: h.pieces,
          weight: h.grossWeightKg,
          origDest: `${h.origin || mawb.origin}/${h.destination || mawb.destination}`,
          ppdColl: "COLL",
          shipperName: h.shipperName || mawb.shipperName || "",
          shipperAddress: h.shipperAddress || mawb.shipperAddress || "",
          consigneeName: h.consigneeName || mawb.consigneeName || "",
          consigneeAddress: h.consigneeAddress || mawb.consigneeAddress || "",
          details: (h.natureOfGoods || mawb.natureOfGoods || "").toUpperCase(),
        });
      });
    } else {
      rows.push({
        hawbNumber: mawb.mawbNumber,
        pieces: mawb.pieces,
        weight: mawb.grossWeightKg,
        origDest: `${mawb.origin}/${mawb.destination}`,
        ppdColl: "COLL",
        shipperName: mawb.shipperName || "",
        shipperAddress: mawb.shipperAddress || "",
        consigneeName: mawb.consigneeName || "",
        consigneeAddress: mawb.consigneeAddress || "",
        details: (mawb.natureOfGoods || "").toUpperCase(),
      });
    }
  });

  const totalPieces =
    manifest.totalPieces || rows.reduce((s, r) => s + r.pieces, 0);
  const totalWeight =
    manifest.totalGrossWeightKg || rows.reduce((s, r) => s + r.weight, 0);
  const totalHawbs = manifest.totalHawbs || rows.length;

  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top center",
      }}
      className="manifest-scale-wrapper transition-transform duration-200 print:transform-none flex justify-center"
    >
      <div
        id="manifest-sheet-target"
        className="manifest-sheet bg-white text-black print:shadow-none print:m-0"
        style={{
          width: "297mm",
          minHeight: "210mm",
          padding: "18mm 15mm 15mm 15mm",
          boxSizing: "border-box",
          fontFamily: "'Courier New', Courier, 'Nimbus Mono L', monospace",
          fontSize: "12.5px",
          lineHeight: "1.25",
          color: "#000000",
          backgroundColor: "#ffffff",
          letterSpacing: "0.01em",
          margin: "0 auto",
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* ================= HEADER TOP ROW ================= */}
        <div className="flex justify-between items-start font-bold text-[15px] mb-5">
          <div className="w-[300px]">Consolidation Manifest</div>
          <div className="text-center font-bold text-[15px]">
            {primaryMawb?.mawbNumber || manifest.manifestNumber}
          </div>
          <div className="w-[120px] text-right font-normal text-[13px]">
            Page 1 of 1
          </div>
        </div>

        {/* ================= TOP INFO SECTION ================= */}
        <div className="grid grid-cols-[1fr_270px] gap-8 mb-6 text-[12.5px] leading-[1.25]">
          {/* Left Column: Carrier, Shipper, Consignee */}
          <div className="space-y-4">
            {/* Carrier */}
            <div className="grid grid-cols-[85px_1fr]">
              <span className="font-normal">Carrier</span>
              <span className="font-normal">
                {manifest.airline || primaryMawb?.carrierName || ""}
              </span>
            </div>

            {/* Shipper */}
            <div className="grid grid-cols-[85px_1fr]">
              <span className="font-normal">Shipper</span>
              <div className="font-normal uppercase leading-[1.25]">
                <div className="font-normal">
                  {primaryMawb?.shipperName || "SPREETRANS INTERNATIONAL"}
                </div>
                {primaryMawb?.shipperAddress ? (
                  <div className="whitespace-pre-line mt-0.5 text-slate-900">
                    {primaryMawb.shipperAddress}
                  </div>
                ) : (
                  <div className="text-slate-700 whitespace-pre-line mt-0.5">
                    L-8A, EAST WING, FIRST FLOOR, ANAND
                    {"\n"}BHAWAN, PT. JAGNATH COMPLEX, PT. JAGANNATH COMPLEX,
                    {"\n"}MAHIPALPUR, NEW DELHI - 110037
                  </div>
                )}
              </div>
            </div>

            {/* Consignee */}
            <div className="grid grid-cols-[85px_1fr]">
              <span className="font-normal">Consignee</span>
              <div className="font-normal uppercase leading-[1.25]">
                <div className="font-normal">
                  {primaryMawb?.consigneeName || "ANSHIKA INTERNATIONAL"}
                </div>
                {primaryMawb?.consigneeAddress ? (
                  <div className="whitespace-pre-line mt-0.5 text-slate-900">
                    {primaryMawb.consigneeAddress}
                  </div>
                ) : (
                  <div className="text-slate-700 whitespace-pre-line mt-0.5">
                    OFFICE: 9, FALCON HOUSE, CENTRAL WAY,
                    {"\n"}FELTHAM MIDDLESEX TW14 0UQ
                    {"\n"}PH: 02088937999, 02034047999
                    {"\n"}M: 07766414567
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Key-Values */}
          <div className="text-[12.5px] leading-[1.25] space-y-1">
            <div className="grid grid-cols-[115px_1fr]">
              <span>Date</span>
              <span>{formatManifestDate(manifest.flightDate)}</span>
            </div>
            <div className="grid grid-cols-[115px_1fr]">
              <span>Reference</span>
              <span></span>
            </div>
            <div className="grid grid-cols-[115px_1fr]">
              <span>Flight</span>
              <span>{manifest.flightNumber || "MS"}</span>
            </div>
            <div className="grid grid-cols-[115px_1fr]">
              <span>Origin</span>
              <span>{manifest.origin || primaryMawb?.origin || "DEL"}</span>
            </div>
            <div className="grid grid-cols-[115px_1fr]">
              <span>Destination</span>
              <span>{manifest.destination || primaryMawb?.destination || "LHR"}</span>
            </div>
            <div className="grid grid-cols-[115px_1fr]">
              <span>Pieces</span>
              <span>{totalPieces}</span>
            </div>
            <div className="grid grid-cols-[115px_1fr]">
              <span>Weight</span>
              <span>{totalWeight}K</span>
            </div>
            <div className="grid grid-cols-[115px_1fr]">
              <span>HAWBs</span>
              <span>{totalHawbs}</span>
            </div>
            <div className="grid grid-cols-[115px_1fr]">
              <span>Pages</span>
              <span>1</span>
            </div>
          </div>
        </div>

        {/* ================= TABLE HEADER ================= */}
        <div className="grid grid-cols-[90px_60px_60px_85px_70px_1fr_210px] gap-2 font-bold text-[12px] pb-1">
          <div>HAWB</div>
          <div className="text-right pr-2">Pieces</div>
          <div className="text-right pr-2">Weight</div>
          <div className="text-center">Orig/Dest</div>
          <div className="text-center">PPD/COLL</div>
          <div className="pl-4"></div>
          <div>Details</div>
        </div>

        {/* Horizontal Divider Line 1 (0.5pt black) */}
        <div className="w-full border-t border-black mb-3.5" style={{ borderWidth: "0.75px" }} />

        {/* ================= TABLE ROWS ================= */}
        <div className="space-y-4 mb-4">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[90px_60px_60px_85px_70px_1fr_210px] gap-2 text-[12px] leading-[1.25] items-start"
            >
              {/* HAWB Number */}
              <div className="font-normal">{row.hawbNumber}</div>

              {/* Pieces */}
              <div className="text-right pr-2 font-normal">{row.pieces}</div>

              {/* Weight */}
              <div className="text-right pr-2 font-normal">{row.weight} K</div>

              {/* Orig/Dest */}
              <div className="text-center font-normal">{row.origDest}</div>

              {/* PPD/COLL */}
              <div className="text-center font-normal">{row.ppdColl}</div>

              {/* Shipper & Consignee Sub-block */}
              <div className="space-y-3 pl-2">
                {/* Shipper */}
                <div className="grid grid-cols-[70px_1fr]">
                  <span className="font-bold">Shipper</span>
                  <div className="uppercase whitespace-pre-line leading-[1.25]">
                    <div>{row.shipperName}</div>
                    {row.shipperAddress && (
                      <div className="mt-0.5">{row.shipperAddress}</div>
                    )}
                  </div>
                </div>

                {/* Consignee */}
                <div className="grid grid-cols-[70px_1fr]">
                  <span className="font-bold">Consignee</span>
                  <div className="uppercase whitespace-pre-line leading-[1.25]">
                    <div>{row.consigneeName}</div>
                    {row.consigneeAddress && (
                      <div className="mt-0.5">{row.consigneeAddress}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details / Commodity Column */}
              <div className="font-normal uppercase leading-[1.25]">
                {row.details || "CONSOL CARGO"}
              </div>
            </div>
          ))}
        </div>

        {/* Horizontal Divider Line 2 (0.5pt black) */}
        <div className="w-full border-t border-black my-2" style={{ borderWidth: "0.75px" }} />

        {/* ================= TOTAL ROW ================= */}
        <div className="grid grid-cols-[90px_60px_60px_85px_70px_1fr_210px] gap-2 text-[12px] leading-[1.25] font-normal pt-1">
          <div className="font-bold">Total</div>
          <div className="text-right pr-2">{totalPieces}</div>
          <div className="text-right pr-2">{totalWeight}K</div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};

