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

function findMawb(mawbs: MawbItem[], mawbRef: string) {
  if (!mawbRef) return undefined;
  const cleanRef = mawbRef.trim();
  const digitsRef = cleanRef.replace(/[^0-9]/g, "");
  return mawbs.find(
    (m) =>
      m.mawbNumber === cleanRef ||
      m.id === cleanRef ||
      m.serialNumber === cleanRef ||
      (digitsRef && (m.mawbNumber || "").replace(/[^0-9]/g, "") === digitsRef)
  );
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
  const primaryMawbNum = manifest.mawbs?.[0] || "";
  const primaryMawb = findMawb(mawbs, primaryMawbNum);

  // Extract all rows (either HAWBs or MAWBs)
  const rows: ManifestRowItem[] = [];

  if (manifest.mawbs && manifest.mawbs.length > 0) {
    manifest.mawbs.forEach((mawbNum) => {
      const mawb = findMawb(mawbs, mawbNum);
      if (mawb && mawb.hawbs && mawb.hawbs.length > 0) {
        mawb.hawbs.forEach((h) => {
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
            origDest: `${h.origin || mawb.origin || manifest.origin}/${h.destination || mawb.destination || manifest.destination}`,
            ppdColl: "COLL",
            shipperName: h.shipperName || mawb.shipperName || "",
            shipperAddress: h.shipperAddress || mawb.shipperAddress || "",
            consigneeName: h.consigneeName || mawb.consigneeName || "",
            consigneeAddress: h.consigneeAddress || mawb.consigneeAddress || "",
            details: (h.natureOfGoods || mawb.natureOfGoods || "CONSOLIDATED CARGO").toUpperCase(),
          });
        });
      } else if (mawb) {
        rows.push({
          hawbNumber: mawb.mawbNumber,
          pieces: mawb.pieces,
          weight: mawb.grossWeightKg,
          origDest: `${mawb.origin || manifest.origin}/${mawb.destination || manifest.destination}`,
          ppdColl: "COLL",
          shipperName: mawb.shipperName || "",
          shipperAddress: mawb.shipperAddress || "",
          consigneeName: mawb.consigneeName || "",
          consigneeAddress: mawb.consigneeAddress || "",
          details: (mawb.natureOfGoods || "CONSOLIDATED CARGO").toUpperCase(),
        });
      }
    });
  }

  // Fallback row if no MAWBs were found in state to prevent an empty document
  if (rows.length === 0) {
    rows.push({
      hawbNumber: primaryMawbNum || manifest.manifestNumber.replace(/^MNF-/, "") || "1",
      pieces: manifest.totalPieces || 1,
      weight: manifest.totalGrossWeightKg || 0,
      origDest: `${manifest.origin}/${manifest.destination}`,
      ppdColl: "COLL",
      shipperName: primaryMawb?.shipperName || "SPREETRANS INTERNATIONAL",
      shipperAddress:
        primaryMawb?.shipperAddress ||
        "L-8A, EAST WING, FIRST FLOOR, ANAND BHAWAN\nPT. JAGNATH COMPLEX, PT. JAGANNATH COMPLEX\nMAHIPALPUR, NEW DELHI - 110037",
      consigneeName: primaryMawb?.consigneeName || "ANSHIKA INTERNATIONAL",
      consigneeAddress:
        primaryMawb?.consigneeAddress ||
        "OFFICE: 9, FALCON HOUSE, CENTRAL WAY\nFELTHAM MIDDLESEX TW14 0UQ\nPH: 02088937999, 02034047999\nM: 07766414567",
      details: (primaryMawb?.natureOfGoods || "CONSOLIDATED CARGO").toUpperCase(),
    });
  }

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
          fontSize: "12px",
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            fontWeight: "bold",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          <div style={{ width: "300px" }}>Consolidation Manifest</div>
          <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>
            {primaryMawb?.mawbNumber || primaryMawbNum || manifest.manifestNumber}
          </div>
          <div style={{ width: "120px", textAlign: "right", fontWeight: "normal", fontSize: "12px" }}>
            Page 1 of 1
          </div>
        </div>

        {/* ================= TOP INFO SECTION ================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 270px",
            columnGap: "32px",
            marginBottom: "24px",
            fontSize: "12px",
            lineHeight: "1.25",
          }}
        >
          {/* Left Column: Carrier, Shipper, Consignee */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Carrier */}
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr" }}>
              <span style={{ fontWeight: "normal" }}>Carrier</span>
              <span style={{ fontWeight: "normal" }}>
                {manifest.airline || primaryMawb?.carrierName || ""}
              </span>
            </div>

            {/* Shipper */}
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr" }}>
              <span style={{ fontWeight: "normal" }}>Shipper</span>
              <div style={{ textTransform: "uppercase", lineHeight: "1.25" }}>
                <div style={{ fontWeight: "normal" }}>
                  {primaryMawb?.shipperName || "SPREETRANS INTERNATIONAL"}
                </div>
                {primaryMawb?.shipperAddress ? (
                  <div style={{ whiteSpace: "pre-line", marginTop: "2px" }}>
                    {primaryMawb.shipperAddress}
                  </div>
                ) : (
                  <div style={{ whiteSpace: "pre-line", marginTop: "2px" }}>
                    L-8A, EAST WING, FIRST FLOOR, ANAND BHAWAN{"\n"}
                    PT. JAGNATH COMPLEX, PT. JAGANNATH COMPLEX{"\n"}
                    MAHIPALPUR, NEW DELHI - 110037
                  </div>
                )}
              </div>
            </div>

            {/* Consignee */}
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr" }}>
              <span style={{ fontWeight: "normal" }}>Consignee</span>
              <div style={{ textTransform: "uppercase", lineHeight: "1.25" }}>
                <div style={{ fontWeight: "normal" }}>
                  {primaryMawb?.consigneeName || "ANSHIKA INTERNATIONAL"}
                </div>
                {primaryMawb?.consigneeAddress ? (
                  <div style={{ whiteSpace: "pre-line", marginTop: "2px" }}>
                    {primaryMawb.consigneeAddress}
                  </div>
                ) : (
                  <div style={{ whiteSpace: "pre-line", marginTop: "2px" }}>
                    OFFICE: 9, FALCON HOUSE, CENTRAL WAY{"\n"}
                    FELTHAM MIDDLESEX TW14 0UQ{"\n"}
                    PH: 02088937999, 02034047999{"\n"}
                    M: 07766414567
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Key-Values */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", lineHeight: "1.25" }}>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>Date</span>
              <span>{formatManifestDate(manifest.flightDate)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>Reference</span>
              <span></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>Flight</span>
              <span>{manifest.flightNumber || "MS"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>Origin</span>
              <span>{manifest.origin || primaryMawb?.origin || "DEL"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>Destination</span>
              <span>{manifest.destination || primaryMawb?.destination || "LHR"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>Pieces</span>
              <span>{totalPieces}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>Weight</span>
              <span>{totalWeight}K</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>HAWBs</span>
              <span>{totalHawbs}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr" }}>
              <span>Pages</span>
              <span>1</span>
            </div>
          </div>
        </div>

        {/* ================= TABLE HEADER ================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 60px 60px 85px 70px 1fr 220px",
            columnGap: "8px",
            fontWeight: "bold",
            fontSize: "12px",
            paddingBottom: "4px",
          }}
        >
          <div>HAWB</div>
          <div style={{ textAlign: "right", paddingRight: "8px" }}>Pieces</div>
          <div style={{ textAlign: "right", paddingRight: "8px" }}>Weight</div>
          <div style={{ textAlign: "center" }}>Orig/Dest</div>
          <div style={{ textAlign: "center" }}>PPD/COLL</div>
          <div style={{ paddingLeft: "16px" }}></div>
          <div>Details</div>
        </div>

        {/* Horizontal Divider Line 1 (0.5pt solid black) */}
        <div
          style={{
            width: "100%",
            borderTop: "0.75px solid #000000",
            marginBottom: "14px",
          }}
        />

        {/* ================= TABLE ROWS ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
          {rows.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "90px 60px 60px 85px 70px 1fr 220px",
                columnGap: "8px",
                fontSize: "12px",
                lineHeight: "1.25",
                alignItems: "flex-start",
              }}
            >
              {/* HAWB Number */}
              <div style={{ fontWeight: "normal" }}>{row.hawbNumber}</div>

              {/* Pieces */}
              <div style={{ textAlign: "right", paddingRight: "8px", fontWeight: "normal" }}>
                {row.pieces}
              </div>

              {/* Weight */}
              <div style={{ textAlign: "right", paddingRight: "8px", fontWeight: "normal" }}>
                {row.weight} K
              </div>

              {/* Orig/Dest */}
              <div style={{ textAlign: "center", fontWeight: "normal" }}>{row.origDest}</div>

              {/* PPD/COLL */}
              <div style={{ textAlign: "center", fontWeight: "normal" }}>{row.ppdColl}</div>

              {/* Shipper & Consignee Sub-block */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "8px" }}>
                {/* Shipper */}
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr" }}>
                  <span style={{ fontWeight: "bold" }}>Shipper</span>
                  <div style={{ textTransform: "uppercase", whiteSpace: "pre-line", lineHeight: "1.25" }}>
                    <div>{row.shipperName}</div>
                    {row.shipperAddress && (
                      <div style={{ marginTop: "2px" }}>{row.shipperAddress}</div>
                    )}
                  </div>
                </div>

                {/* Consignee */}
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr" }}>
                  <span style={{ fontWeight: "bold" }}>Consignee</span>
                  <div style={{ textTransform: "uppercase", whiteSpace: "pre-line", lineHeight: "1.25" }}>
                    <div>{row.consigneeName}</div>
                    {row.consigneeAddress && (
                      <div style={{ marginTop: "2px" }}>{row.consigneeAddress}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details / Commodity Column */}
              <div style={{ textTransform: "uppercase", lineHeight: "1.25", fontWeight: "normal" }}>
                {row.details || "CONSOL CARGO"}
              </div>
            </div>
          ))}
        </div>

        {/* Horizontal Divider Line 2 (0.5pt solid black) */}
        <div
          style={{
            width: "100%",
            borderTop: "0.75px solid #000000",
            margin: "8px 0",
          }}
        />

        {/* ================= TOTAL ROW ================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 60px 60px 85px 70px 1fr 220px",
            columnGap: "8px",
            fontSize: "12px",
            lineHeight: "1.25",
            fontWeight: "normal",
            paddingTop: "4px",
          }}
        >
          <div style={{ fontWeight: "bold" }}>Total</div>
          <div style={{ textAlign: "right", paddingRight: "8px" }}>{totalPieces}</div>
          <div style={{ textAlign: "right", paddingRight: "8px" }}>{totalWeight}K</div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};
