/**
 * High-fidelity pure vector PDF export and printing utility for Flight Cargo Manifest
 * Generates an exact 1:1 replica of the IATA Consolidation Manifest matching Manifest_077-59066906.pdf
 * Guarantees true A4 Landscape (297mm x 210mm / 841.89pt x 595.28pt) horizontal display
 */

import { FlightManifestItem, MawbItem } from "@/types/iata";

function formatManifestDate(dStr?: string) {
  if (!dStr) return "";
  const parts = dStr.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  }
  return dStr;
}

function findMawb(mawbs: MawbItem[], mawbRef?: string) {
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

function splitAddressLines(addr?: string, maxLen = 42): string[] {
  if (!addr) return [];
  const lines: string[] = [];
  const rawLines = addr.split(/\r?\n/);
  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.length <= maxLen) {
      lines.push(trimmed);
    } else {
      const words = trimmed.split(" ");
      let cur = "";
      for (const w of words) {
        if ((cur + " " + w).trim().length <= maxLen) {
          cur = (cur + " " + w).trim();
        } else {
          if (cur) lines.push(cur);
          cur = w;
        }
      }
      if (cur) lines.push(cur);
    }
  }
  return lines;
}

export async function createManifestJsPdf(
  manifest: FlightManifestItem,
  mawbs: MawbItem[]
) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [841.89, 595.28], // Exact A4 landscape in points (297mm x 210mm)
    compress: true,
  });

  const primaryMawbNum = manifest.mawbs?.[0] || "";
  const primaryMawb = findMawb(mawbs, primaryMawbNum);

  // Force PDF viewer preferences to preserve landscape paper and horizontal fit
  doc.internal.events.subscribe("putCatalog", () => {
    (doc.internal as any).write(
      "/ViewerPreferences << /PickTrayByPDFSize true /FitWindow true /CenterWindow true /Enforce [ /PrintScaling ] /PrintScaling /None >>"
    );
  });

  doc.setProperties({
    title: `Consolidation Manifest - ${primaryMawb?.mawbNumber || primaryMawbNum || manifest.manifestNumber}`,
    subject: "IATA Flight Manifest",
    author: primaryMawb?.shipperName || "SPREETRANS INTERNATIONAL",
    creator: "ITA Air Cargo Manifest System",
  });

  // Extract all rows (either HAWBs or MAWBs)
  const rows: {
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
  }[] = [];

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

  // Fallback row if no MAWBs found in state
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
        "L-8A, EAST WING, FIRST FLOOR, ANAND BHAWAN\nPT. JAGNATH COMPLEX, MAHIPALPUR\nNEW DELHI - 110037",
      consigneeName: primaryMawb?.consigneeName || "ANSHIKA INTERNATIONAL",
      consigneeAddress:
        primaryMawb?.consigneeAddress ||
        "OFFICE: 9, FALCON HOUSE, CENTRAL WAY\nFELTHAM MIDDLESEX TW14 0UQ\nPH: 02088937999",
      details: (primaryMawb?.natureOfGoods || "CONSOLIDATED CARGO").toUpperCase(),
    });
  }

  const totalPieces = manifest.totalPieces || rows.reduce((s, r) => s + r.pieces, 0);
  const totalWeight = manifest.totalGrossWeightKg || rows.reduce((s, r) => s + r.weight, 0);
  const totalHawbs = manifest.totalHawbs || rows.length;

  // --- HEADER TOP (Exact points matching sample PDF) ---
  doc.setFont("courier", "bold");
  doc.setFontSize(12);
  doc.text("Consolidation Manifest", 42.0, 67.0);
  doc.text(
    primaryMawb?.mawbNumber || primaryMawbNum || manifest.manifestNumber,
    368.0,
    67.0
  );

  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.text("Page 1 of 1", 694.0, 67.0);

  // --- INFO SECTION ---
  doc.text("Carrier", 42.0, 97.0);
  if (manifest.airline || primaryMawb?.carrierName) {
    doc.text(
      (manifest.airline || primaryMawb?.carrierName || "").toUpperCase(),
      112.9,
      97.0
    );
  }

  doc.text("Date", 368.0, 97.0);
  doc.text(formatManifestDate(manifest.flightDate), 438.9, 97.0);

  doc.text("Reference", 368.0, 107.0);

  doc.text("Shipper", 42.0, 117.0);
  doc.text(
    (primaryMawb?.shipperName || "SPREETRANS INTERNATIONAL").toUpperCase(),
    112.9,
    117.0
  );
  doc.text("Flight", 368.0, 117.0);
  doc.text(manifest.flightNumber || "MS", 438.9, 117.0);

  const shipperLines = splitAddressLines(
    primaryMawb?.shipperAddress ||
      "L-8A, EAST WING, FIRST FLOOR, ANAND BHAWAN\nPT. JAGNATH COMPLEX, PT. JAGANNATH COMPLEX\nMAHIPALPUR, NEW DELHI - 110037"
  );
  let sY = 127.0;
  shipperLines.slice(0, 4).forEach((line) => {
    doc.text(line.toUpperCase(), 112.9, sY);
    sY += 10.0;
  });

  doc.text("Origin", 368.0, 127.0);
  doc.text(manifest.origin || primaryMawb?.origin || "DEL", 438.9, 127.0);

  doc.text("Destination", 368.0, 137.0);
  doc.text(manifest.destination || primaryMawb?.destination || "LHR", 438.9, 137.0);

  doc.text("Pieces", 368.0, 147.0);
  doc.text(String(totalPieces), 438.9, 147.0);

  doc.text("Weight", 368.0, 157.0);
  doc.text(`${totalWeight}K`, 438.9, 157.0);

  doc.text("HAWBs", 368.0, 167.0);
  doc.text(String(totalHawbs), 438.9, 167.0);

  doc.text("Consignee", 42.0, 177.0);
  doc.text(
    (primaryMawb?.consigneeName || "ANSHIKA INTERNATIONAL").toUpperCase(),
    112.9,
    177.0
  );

  doc.text("Pages", 368.0, 177.0);
  doc.text("1", 438.9, 177.0);

  const consigneeLines = splitAddressLines(
    primaryMawb?.consigneeAddress ||
      "OFFICE: 9, FALCON HOUSE, CENTRAL WAY\nFELTHAM MIDDLESEX TW14 0UQ\nPH: 02088937999, 02034047999\nM: 07766414567"
  );
  let cY = 187.0;
  consigneeLines.slice(0, 4).forEach((line) => {
    doc.text(line.toUpperCase(), 112.9, cY);
    cY += 10.0;
  });

  // --- TABLE HEADER ---
  doc.setFont("courier", "bold");
  doc.setFontSize(9.2);
  doc.text("HAWB", 42.0, 237.0);
  doc.text("Pieces", 121.9, 237.0);
  doc.text("Weight", 178.6, 237.0);
  doc.text("Orig/Dest", 220.6, 237.0);
  doc.text("PPD/COLL", 277.3, 237.0);
  doc.text("Details", 625.9, 237.0);

  // Line 1
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(42.0, 238.7, 798.85, 238.7);

  // --- ROWS ---
  let curY = 255.0;
  rows.forEach((r) => {
    doc.setFont("courier", "normal");
    doc.setFontSize(9.7);
    doc.text(r.hawbNumber, 42.0, curY);
    doc.text(String(r.pieces), 135.5, curY);
    doc.text(`${r.weight} K`, 175.0, curY);
    doc.text(r.origDest, 220.6, curY);
    doc.text(r.ppdColl, 277.3, curY);

    // Shipper
    doc.setFont("courier", "bold");
    doc.setFontSize(9.2);
    doc.text("Shipper", 319.8, curY);

    doc.setFont("courier", "normal");
    doc.setFontSize(9.7);
    doc.text(r.shipperName.toUpperCase(), 373.6, curY);
    doc.text((r.details || "CONSOL CARGO").toUpperCase(), 620.3, curY);

    const rShipperLines = splitAddressLines(r.shipperAddress, 38);
    let rShipperY = curY + 10.0;
    rShipperLines.slice(0, 5).forEach((line) => {
      doc.text(line.toUpperCase(), 373.6, rShipperY);
      rShipperY += 10.0;
    });

    const consigneeStartY = Math.max(rShipperY + 2.0, curY + 40.0);
    doc.setFont("courier", "bold");
    doc.setFontSize(9.2);
    doc.text("Consignee", 319.8, consigneeStartY);

    doc.setFont("courier", "normal");
    doc.setFontSize(9.7);
    doc.text(r.consigneeName.toUpperCase(), 373.6, consigneeStartY);

    const rConsigneeLines = splitAddressLines(r.consigneeAddress, 38);
    let rConsigneeY = consigneeStartY + 10.0;
    rConsigneeLines.slice(0, 6).forEach((line) => {
      doc.text(line.toUpperCase(), 373.6, rConsigneeY);
      rConsigneeY += 10.0;
    });

    curY = Math.max(rConsigneeY + 12.0, curY + 95.0);
  });

  // Line 2
  const line2Y = Math.max(curY, 374.7);
  doc.line(42.0, line2Y, 798.85, line2Y);

  // Total
  const totalY = line2Y + 16.0;
  doc.setFont("courier", "bold");
  doc.setFontSize(9.2);
  doc.text("Total", 42.0, totalY);

  doc.setFont("courier", "normal");
  doc.setFontSize(9.7);
  doc.text(String(totalPieces), 135.5, totalY);
  doc.text(`${totalWeight}K`, 180.7, totalY);

  return doc;
}

/**
 * Directly downloads the high-fidelity pure vector A4 Landscape PDF.
 * Opens horizontally in any PDF viewer.
 */
export async function downloadManifestPdf(
  manifest: FlightManifestItem,
  mawbs: MawbItem[],
  fileName?: string
) {
  try {
    const doc = await createManifestJsPdf(manifest, mawbs);
    const cleanNum = (
      manifest.manifestNumber ||
      manifest.mawbs?.[0] ||
      "Manifest"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");
    const name = fileName || `Manifest_${cleanNum}.pdf`;
    doc.save(name.endsWith(".pdf") ? name : `${name}.pdf`);
    return true;
  } catch (error) {
    console.error("Failed to download Manifest PDF:", error);
    throw error;
  }
}

/**
 * Triggers landscape browser printing for the Flight Manifest.
 * Forces @page { size: A4 landscape !important; } so browser print preview
 * renders horizontally without portrait-mode squishing or 90-degree rotation.
 */
export async function printManifestPdf(
  manifest?: FlightManifestItem,
  mawbs?: MawbItem[]
) {
  try {
    // 1. Inject forced landscape @page style for the browser print engine
    let styleEl = document.getElementById(
      "manifest-landscape-print-style"
    ) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "manifest-landscape-print-style";
      styleEl.innerHTML = `@page { size: A4 landscape !important; margin: 0 !important; }`;
      document.head.appendChild(styleEl);
    }

    // 2. Set body data-print-mode to activate manifest print styles
    const prevPrintMode = document.body.dataset.printMode;
    document.body.dataset.printMode = "manifest";

    const cleanup = () => {
      if (prevPrintMode) {
        document.body.dataset.printMode = prevPrintMode;
      } else {
        delete document.body.dataset.printMode;
      }
      if (styleEl && document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    // Give DOM a tick to layout before opening the print preview dialog
    setTimeout(() => {
      window.print();
    }, 50);

    setTimeout(cleanup, 4000);
    return true;
  } catch (error) {
    console.error("Failed to print Manifest PDF:", error);
    throw error;
  }
}
