// src/components/MawbSheet.tsx
"use client";

import React from "react";
import { MawbData } from "@/types/mawb";
import { IATA_AIRLINES } from "@/lib/iata-data";

interface MawbSheetProps {
  data: MawbData;
  scale?: number;
  activePage?: "face" | "conditions" | "both";
}

/** Diagonal slash line for empty AWB accounting boxes */
function DiagonalSlash() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <line
        x1="0"
        y1="100"
        x2="100"
        y2="0"
        stroke="#000000"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/** Authentic IATA upside-down (inverted) trapezoid header */
interface TrapezoidHeaderProps {
  label: React.ReactNode;
  height?: number;
  slant?: number;
  leftLine?: boolean;
  rightLine?: boolean;
  className?: string;
  textClassName?: string;
  width?: string | number;
}

function TrapezoidHeader({
  label,
  height = 11,
  slant = 8,
  leftLine = true,
  rightLine = true,
  className = "",
  textClassName = "text-[6.5px] leading-none font-normal text-black text-center whitespace-nowrap",
  width,
}: TrapezoidHeaderProps) {
  return (
    <div
      className={`flex items-start w-full relative ${className}`}
      style={width ? { width } : undefined}
    >
      {leftLine && <div className="border-t border-black flex-1 min-w-[2px]" />}
      <div className="flex items-stretch shrink-0">
        <svg
          width={slant}
          height={height}
          viewBox={`0 0 ${slant} ${height}`}
          className="shrink-0 block"
        >
          <line
            x1="0"
            y1="0"
            x2={slant}
            y2={height}
            stroke="#000000"
            strokeWidth="0.9"
          />
        </svg>

        <div
          className="border-b border-black flex items-center justify-center px-1.5 bg-white whitespace-nowrap"
          style={{ height }}
        >
          <span className={textClassName}>{label}</span>
        </div>

        <svg
          width={slant}
          height={height}
          viewBox={`0 0 ${slant} ${height}`}
          className="shrink-0 block"
        >
          <line
            x1="0"
            y1={height}
            x2={slant}
            y2="0"
            stroke="#000000"
            strokeWidth="0.9"
          />
        </svg>
      </div>
      {rightLine && (
        <div className="border-t border-black flex-1 min-w-[2px]" />
      )}
    </div>
  );
}

export function MawbSheet({
  data,
  scale = 1,
  activePage = "both",
}: MawbSheetProps) {
  const fmt = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === "") return "";
    const clean = String(val).replace(/,/g, "");
    const num = Number(clean);
    if (!isNaN(num) && clean.trim() !== "") {
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return String(val);
  };

  const totalPieces = data.items.reduce(
    (sum, it) => sum + (Number(it.pieces) || 0),
    0,
  );
  const totalGrossWeight = data.items.reduce((sum, it) => {
    const clean = String(it.grossWeight).replace(/,/g, "");
    return sum + (Number(clean) || 0);
  }, 0);

  const fullAwbNo = `${data.awbPrefix}-${data.awbSerial}`;

  const showPage1 = activePage === "both" || activePage === "face";
  const showPage2 = activePage === "both" || activePage === "conditions";

  const displayCarrierName = (() => {
    const rawPrefix = (data.awbPrefix || "").includes("-")
      ? (data.awbPrefix || "").split("-")[0].trim()
      : (data.awbPrefix || "").trim();
    const cleanPrefix = rawPrefix.replace(/\D/g, "");
    const matched = IATA_AIRLINES.find(
      (a) =>
        a.prefix === cleanPrefix ||
        a.prefix === rawPrefix ||
        a.prefix.padStart(3, "0") === cleanPrefix.padStart(3, "0"),
    );
    if (
      data.carrierName &&
      data.carrierName.trim() &&
      (data.carrierName.trim().toUpperCase() !== "EGYPT AIR" ||
        cleanPrefix === "077")
    ) {
      return data.carrierName.trim().toUpperCase();
    }
    if (matched) return matched.name.toUpperCase();
    return data.carrierName?.trim().toUpperCase() || "";
  })();

  const item = data.items[0] || {
    pieces: "",
    grossWeight: "",
    weightUnit: "K",
    rateClass: "Q",
    commodityItemNo: "",
    chargeableWeight: "",
    rate: "",
    total: "",
    natureAndQuantity: "",
  };

  const otherChargesFormattedText: string = (() => {
    // 1. First extract from structured otherCharges if present
    const structured = (data as any).otherCharges;
    if (Array.isArray(structured) && structured.length > 0) {
      const valid = structured
        .filter((line: any) => {
          if (!line) return false;
          const charge = String(line.charge || "").trim();
          const amt = Number(line.amount);
          const isAgreed =
            String(line.amount || "").trim().toLowerCase() === "as agreed" ||
            String(line.rate || "").trim().toLowerCase() === "as agreed";
          return (
            isAgreed ||
            (charge !== "" && charge !== "—") ||
            (!isNaN(amt) && amt > 0)
          );
        })
        .map((line: any) => {
          const code = String(line.charge || "CHG").trim().toUpperCase();
          const isAgreed =
            String(line.amount || "").trim().toLowerCase() === "as agreed" ||
            String(line.rate || "").trim().toLowerCase() === "as agreed";
          if (isAgreed) {
            return `${code}-AS AGREED`;
          }
          const num = Number(line.amount);
          const amtStr =
            !isNaN(num) && line.amount !== "" && line.amount !== null
              ? num.toFixed(2)
              : String(line.amount || "0.00").trim();
          return `${code}-${amtStr}`;
        });
      if (valid.length > 0) {
        return valid.join(", ");
      }
    }

    // 2. Fallback to otherChargesBreakdown string e.g. "UEC-1300.00, MMC-980.00, SSC-19500.00" or "FSC: 29076.00  SSC: 10573.00"
    const rawBreakdown = data.charges.otherChargesBreakdown?.trim();
    if (rawBreakdown) {
      if (rawBreakdown.includes(":")) {
        const parts = rawBreakdown.split(/(?:\r?\n|;|\s{2,}|,)/);
        const converted: string[] = [];
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          const colonIdx = trimmed.indexOf(":");
          if (colonIdx !== -1) {
            const label = trimmed.slice(0, colonIdx).trim().toUpperCase();
            const rawAmt = trimmed.slice(colonIdx + 1).trim().replace(/,/g, "");
            const num = Number(rawAmt);
            const amtStr = !isNaN(num) ? num.toFixed(2) : rawAmt;
            converted.push(`${label}-${amtStr}`);
          } else {
            converted.push(trimmed.toUpperCase());
          }
        }
        if (converted.length > 0) {
          return converted.join(", ");
        }
      }
      return rawBreakdown.toUpperCase();
    }

    // 3. Fallback to carrier / agent charges prepaid
    const fallbacks: string[] = [];
    if (
      data.charges.carrierChargesPrepaid &&
      Number(data.charges.carrierChargesPrepaid) > 0
    ) {
      fallbacks.push(
        `CARRIER-${Number(data.charges.carrierChargesPrepaid).toFixed(2)}`,
      );
    }
    if (
      data.charges.agentChargesPrepaid &&
      Number(data.charges.agentChargesPrepaid) > 0
    ) {
      fallbacks.push(
        `AGENT-${Number(data.charges.agentChargesPrepaid).toFixed(2)}`,
      );
    }
    if (fallbacks.length > 0) {
      return fallbacks.join(", ");
    }

    return "";
  })();

  const displayCarrierChargesPrepaid = (() => {
    const direct = data.charges.carrierChargesPrepaid;
    if (
      direct !== undefined &&
      direct !== null &&
      direct !== "" &&
      Number(direct) > 0
    ) {
      return direct;
    }
    const structured = (data as any).otherCharges;
    if (Array.isArray(structured) && structured.length > 0) {
      const sum = structured
        .filter((l: any) => l.dueTo === "Carrier" && l.payAt === "Prepaid")
        .reduce((acc: number, l: any) => acc + (Number(l.amount) || 0), 0);
      if (sum > 0) return sum;
    }
    return direct;
  })();

  const displayAgentChargesPrepaid = (() => {
    const direct = data.charges.agentChargesPrepaid;
    if (
      direct !== undefined &&
      direct !== null &&
      direct !== "" &&
      Number(direct) > 0
    ) {
      return direct;
    }
    const structured = (data as any).otherCharges;
    if (Array.isArray(structured) && structured.length > 0) {
      const sum = structured
        .filter((l: any) => l.dueTo === "Agent" && l.payAt === "Prepaid")
        .reduce((acc: number, l: any) => acc + (Number(l.amount) || 0), 0);
      if (sum > 0) return sum;
    }
    return direct;
  })();

  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top center",
      }}
      className="mawb-scale-wrapper transition-transform duration-200 print:transform-none flex flex-col items-center gap-8 print:gap-0"
    >
      {/* ================= PAGE 1: MAWB FACE ================= */}
      {showPage1 && (
        <div
          id="mawb-page-1"
          className="mawb-page-sheet bg-white text-black font-sans mx-auto shadow-2xl print:shadow-none print:m-0 print:p-0 flex flex-col justify-between"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "7mm 8mm 6mm 8mm",
            boxSizing: "border-box",
            fontSize: "9px",
            lineHeight: "1.2",
            color: "#000000",
            backgroundColor: "#ffffff",
          }}
        >
          <div>
            {/* Top Bar: 3-Box Prefix/Airport/Serial on Left, Full AWB No on Right */}
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <div className="flex items-stretch border border-black font-bold text-[13px] tracking-wide">
                <div className="px-2.5 py-0.5 border-r border-black min-w-[36px] text-center">
                  {data.awbPrefix || "077"}
                </div>
                <div className="px-2.5 py-0.5 border-r border-black min-w-[42px] text-center">
                  {data.departureAirportCode || "DEL"}
                </div>
                <div className="px-3 py-0.5 min-w-[85px] text-center">
                  {data.awbSerial || "5906 6545"}
                </div>
              </div>

              <div className="font-bold text-[16px] tracking-wider text-right">
                {fullAwbNo}
              </div>
            </div>

            {/* MAIN OUTER FRAME */}
            <div className="border border-black flex flex-col">
              {/* SECTION: SHIPPER & CONSIGNEE WITH SIDE NOTICES */}
              <div className="flex border-b border-black">
                <div className="w-[45.2%] border-r border-black flex flex-col justify-between p-1.5 min-h-[92px] relative">
                  <div className="flex justify-between items-start -mt-1.5 -mx-1.5">
                    <span className="text-[7px] text-neutral-800 pt-1 pl-1.5">
                      Shipper&apos;s Name and Address
                    </span>
                    <div className="border-b border-l border-black pl-1.5 pr-2 py-0.5 text-[6.5px] text-neutral-800 bg-white">
                      Shipper&apos;s Account Number
                    </div>
                  </div>

                  <div className="font-bold text-[8.5px] uppercase whitespace-pre-line leading-[1.3] mt-1 pl-0.5">
                    {data.shipper.nameAndAddress}
                  </div>

                  {data.shipper.accountNumber && (
                    <div className="text-[8px] font-mono text-right pr-1">
                      {data.shipper.accountNumber}
                    </div>
                  )}
                </div>

                <div className="w-[54.8%] flex flex-col justify-between">
                  <div className="p-1.5 pb-2 border-b border-black">
                    <div className="text-[7.5px] leading-tight text-neutral-800">
                      Not negotiable
                    </div>
                    <div className="flex items-center gap-6 mt-0.5">
                      <span className="font-bold text-[11px] tracking-wider leading-none">
                        AIR WAYBILL
                      </span>
                      <span className="font-bold text-[12px] tracking-wider uppercase leading-none">
                        {displayCarrierName || "AIRLINE CARRIER"}
                      </span>
                    </div>
                    <div className="text-[7.5px] leading-tight text-neutral-800 mt-0.5">
                      issued by
                    </div>
                  </div>

                  <div className="p-1.5 text-[6.5px] text-neutral-800 leading-tight">
                    {data.copiesNotice ||
                      "Copies 1,2 and 3 of this House Air Waybill are originals and have the same validity"}
                  </div>
                </div>
              </div>

              {/* ROW 2: Consignee */}
              <div className="flex border-b border-black">
                <div className="w-[45.2%] border-r border-black flex flex-col justify-between p-1.5 min-h-[92px] relative">
                  <div className="flex justify-between items-start -mt-1.5 -mx-1.5">
                    <span className="text-[7px] text-neutral-800 pt-1 pl-1.5">
                      Consignee&apos;s Name and Address
                    </span>
                    <div className="border-b border-l border-black pl-1.5 pr-2 py-0.5 text-[6.5px] text-neutral-800 bg-white">
                      Consignee&apos;s Account Number
                    </div>
                  </div>

                  <div className="font-bold text-[8.5px] uppercase whitespace-pre-line leading-[1.3] mt-1 pl-0.5">
                    {data.consignee.nameAndAddress}
                  </div>

                  {data.consignee.accountNumber && (
                    <div className="text-[8px] font-mono text-right pr-1">
                      {data.consignee.accountNumber}
                    </div>
                  )}
                </div>

                <div className="w-[54.8%] p-1.5 flex items-center">
                  <p className="text-[6px] text-neutral-900 leading-[1.2] text-justify">
                    {data.contractNotice ||
                      "It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. All goods may be carried by any other means including road or any other carrier unless specific contrary instructions are given herein by the shipper and shipper agrees that the shipment may be carried via intermediate stopping places which the carrier deems appropriate."}
                  </p>
                </div>
              </div>

              {/* ROW 3 & 4: Agent + Freight Prepaid */}
              <div className="flex border-b border-black">
                <div className="w-[45.2%] border-r border-black flex flex-col">
                  <div className="p-1.5 border-b border-black min-h-[44px]">
                    <div className="text-[7px] text-neutral-800 leading-none">
                      Issuing Carrier&apos;s Agent Name and City
                    </div>
                    <div className="font-bold text-[8.5px] uppercase whitespace-pre-line leading-tight mt-1 pl-0.5">
                      {data.issuingAgent.nameAndCity}
                    </div>
                  </div>

                  <div className="flex min-h-[30px]">
                    <div className="w-1/2 border-r border-black p-1.5">
                      <div className="text-[7px] text-neutral-800 leading-none">
                        Agent&apos;s IATA Code
                      </div>
                      <div className="font-bold text-[8.5px] tracking-wider mt-1 pl-0.5">
                        {data.issuingAgent.iataCode || "14026840004"}
                      </div>
                    </div>
                    <div className="w-1/2 p-1.5">
                      <div className="text-[7px] text-neutral-800 leading-none">
                        Account No.
                      </div>
                      <div className="font-bold text-[8.5px] tracking-wider mt-1 pl-0.5">
                        {data.issuingAgent.accountNo}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-[54.8%] p-2 flex flex-col justify-start">
                  <div className="font-bold text-[10px] tracking-wider uppercase text-neutral-900 pl-0.5 pt-0.5">
                    {data.accountingInfo || "FREIGHT PREPAID"}
                  </div>
                </div>
              </div>

              {/* ROW 5: Airport of Departure */}
              <div className="flex border-b border-black p-1.5 min-h-[30px]">
                <div className="flex flex-col">
                  <div className="text-[7px] text-neutral-800 leading-none">
                    Airport of Departure (Addr. Of First Carrier) and requested
                    Routing
                  </div>
                  <div className="font-bold text-[9px] uppercase tracking-wide mt-1 pl-0.5">
                    {data.routing.departureAirport || "DELHI"}
                  </div>
                </div>
              </div>

              {/* ROW 6: ROUTING */}
              <div className="flex border-b border-black text-[7px] leading-tight min-h-[34px]">
                <div className="w-[4.25%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">To</span>
                  <span className="font-bold text-[9px] uppercase">
                    {data.routing.to1}
                  </span>
                </div>

                <div className="w-[24.71%] border-r border-black flex flex-col justify-between">
                  <div className="flex items-start w-full">
                    <span className="text-[6.5px] text-neutral-700 pl-1 pt-0.5 whitespace-nowrap shrink-0 pr-1">
                      By First Carrier
                    </span>
                    <div className="flex-1 flex items-stretch">
                      <svg
                        width="6"
                        height="11"
                        viewBox="0 0 6 11"
                        className="shrink-0 block"
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="6"
                          y2="11"
                          stroke="#000000"
                          strokeWidth="0.9"
                        />
                      </svg>
                      <div className="flex-1 border-b border-black flex items-center justify-center px-0.5 bg-white h-[11px] whitespace-nowrap">
                        <span className="text-[6px] font-normal text-black">
                          Routing and Destination
                        </span>
                      </div>
                      <svg
                        width="6"
                        height="11"
                        viewBox="0 0 6 11"
                        className="shrink-0 block"
                      >
                        <line
                          x1="0"
                          y1="11"
                          x2="6"
                          y2="0"
                          stroke="#000000"
                          strokeWidth="0.9"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="pl-1 pb-0.5 font-bold text-[9px] uppercase">
                    {data.routing.byFirstCarrier}
                  </div>
                </div>

                <div className="w-[4.41%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">To</span>
                  <span className="font-bold text-[8.5px] uppercase">
                    {data.routing.to2}
                  </span>
                </div>

                <div className="w-[3.70%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">by</span>
                  <span className="font-bold text-[8.5px] uppercase">
                    {data.routing.by2}
                  </span>
                </div>

                <div className="w-[4.25%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">To</span>
                  <span className="font-bold text-[8.5px] uppercase">
                    {data.routing.to3}
                  </span>
                </div>

                <div className="w-[3.86%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">by</span>
                  <span className="font-bold text-[8.5px] uppercase">
                    {data.routing.by3}
                  </span>
                </div>

                <div className="w-[5.41%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700 text-[6.5px]">
                    Currency
                  </span>
                  <span className="font-bold text-[8.5px] uppercase">
                    {data.routing.currency || "INR"}
                  </span>
                </div>

                <div className="w-[3.47%] border-r border-black p-0.5 flex flex-col justify-between text-center">
                  <div className="text-[5.5px] text-neutral-700 leading-none">
                    CHGS
                    <br />
                    Code
                  </div>
                  <span className="font-bold text-[7.5px] uppercase">
                    {data.routing.chgsCode}
                  </span>
                </div>

                <div className="w-[5.79%] border-r border-black flex flex-col">
                  <div className="text-center text-[6px] border-b border-black py-0.5 text-neutral-700">
                    WT/VAL
                  </div>
                  <div className="flex flex-1">
                    <div className="w-1/2 border-r border-black text-center text-[5px] p-0.5 flex flex-col justify-between">
                      <span>PPD</span>
                      <span className="font-bold text-[7px]">
                        {data.routing.wtValPpd}
                      </span>
                    </div>
                    <div className="w-1/2 text-center text-[5px] p-0.5 flex flex-col justify-between">
                      <span>COLL</span>
                      <span className="font-bold text-[7px]">
                        {data.routing.wtValColl}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-[5.41%] border-r border-black flex flex-col">
                  <div className="text-center text-[6px] border-b border-black py-0.5 text-neutral-700">
                    Other
                  </div>
                  <div className="flex flex-1">
                    <div className="w-1/2 border-r border-black text-center text-[5px] p-0.5 flex flex-col justify-between">
                      <span>PPD</span>
                      <span className="font-bold text-[7px]">
                        {data.routing.otherPpd}
                      </span>
                    </div>
                    <div className="w-1/2 text-center text-[5px] p-0.5 flex flex-col justify-between">
                      <span>COLL</span>
                      <span className="font-bold text-[7px]">
                        {data.routing.otherColl}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-[16.60%] border-r border-black p-1 flex flex-col justify-between">
                  <div className="text-[6px] text-neutral-700 leading-none">
                    Declared Value for
                    <br />
                    Carriage
                  </div>
                  <span className="font-bold text-[8px] uppercase text-center">
                    {data.routing.declaredValueCarriage}
                  </span>
                </div>

                <div className="w-[18.15%] p-1 flex flex-col justify-between">
                  <div className="text-[6px] text-neutral-700 leading-none">
                    Declared Value for
                    <br />
                    Customs
                  </div>
                  <span className="font-bold text-[8px] uppercase text-center">
                    {data.routing.declaredValueCustoms}
                  </span>
                </div>
              </div>

              {/* ROW 7: DESTINATION & FLIGHTS */}
              <div className="flex border-b border-black text-[7px] leading-tight min-h-[34px]">
                <div className="w-[20.08%] border-r border-black p-1.5 flex flex-col justify-between">
                  <span className="text-neutral-700 text-[6.5px]">
                    Airport of Destination
                  </span>
                  <span className="font-bold text-[10px] uppercase">
                    {data.routing.destinationAirport || "LONDON"}
                  </span>
                </div>

                <div className="w-[25.10%] border-r border-black flex flex-col justify-between">
                  <TrapezoidHeader
                    label="Requested Flight No/Date"
                    height={10}
                    slant={7}
                    className="w-full"
                    textClassName="text-[6px] font-semibold text-black px-1"
                  />
                  <div className="font-bold text-[8.5px] flex flex-col gap-0.5 p-1 pl-2">
                    {data.routing.flights?.map((f, i) => (
                      <div key={i} className="flex justify-between pr-4">
                        <span>{f.flightNo}</span>
                        <span>{f.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-[15.83%] border-r border-black p-1.5 flex flex-col justify-between">
                  <span className="text-[6.5px] text-neutral-700 leading-none">
                    Amount of Insurance
                  </span>
                  <span className="font-bold text-[8px] uppercase text-center">
                    {data.routing.amountOfInsurance}
                  </span>
                </div>

                <div className="w-[38.99%] p-1.5 text-[5.5px] leading-[1.18] text-neutral-800 flex items-center">
                  {data.routing.insuranceNotice ||
                    "INSURANCE- - if carrier offers insurance and such insurance is requested in accordance with conditions on reverse hereof indicate amount to be insured in figures in box marked Amount of Insurance."}
                </div>
              </div>

              {/* ROW 8: Handling Information & SCI */}
              <div className="flex border-b border-black h-[68px] relative bg-white">
                <div className="flex-1 pt-1.5 px-2 flex flex-col justify-start">
                  <div className="text-[6.5px] font-normal text-black leading-none">
                    Handling Information
                  </div>
                  <div className="font-bold text-[7.5px] uppercase tracking-normal mt-1 leading-snug text-black">
                    {data.routing.handlingInfo}
                  </div>
                </div>

                <div className="absolute bottom-0 right-0 border-t border-l border-black w-[60px] h-[18px] flex items-center justify-center bg-white text-[7px] font-normal text-black">
                  {data.routing.sci || "SCI"}
                </div>
              </div>

              {/* ROW 9: RATING / GOODS TABLE */}
              <div className="flex flex-col border-b border-black">
                <div className="flex h-[218px]">
                  <div className="w-[5.41%] border-r border-black flex flex-col justify-between">
                    <div>
                      <div className="h-[35px] border-b border-black flex flex-col justify-center items-center text-[6px] font-normal leading-[1.1]">
                        <span>No.of</span>
                        <span>Pieces</span>
                        <span>RCP</span>
                      </div>
                      <div className="pt-2 text-center font-bold text-[9.5px]">
                        {item.pieces}
                      </div>
                    </div>
                    <div className="h-[24px] border-t border-black flex items-center justify-center font-bold text-[9.5px] bg-white">
                      {totalPieces || ""}
                    </div>
                  </div>

                  <div className="w-[8.49%] border-r border-black flex flex-col justify-between">
                    <div>
                      <div className="h-[35px] border-b border-black flex flex-col justify-center items-center text-[6.5px] font-normal leading-[1.1]">
                        <span>Gross</span>
                        <span>Weight</span>
                      </div>
                      <div className="pt-2 pr-1.5 text-right font-bold text-[9.5px]">
                        {fmt(item.grossWeight)}
                      </div>
                    </div>
                    <div className="h-[24px] border-t border-black flex items-center justify-end pr-1.5 font-bold text-[9.5px] bg-white">
                      {totalGrossWeight ? fmt(totalGrossWeight) : ""}
                    </div>
                  </div>

                  <div className="w-[1.93%] border-r border-black flex flex-col justify-between">
                    <div>
                      <div className="h-[35px] border-b border-black flex flex-col justify-center items-center text-[5.5px] font-normal leading-[1.1]">
                        <span>kg</span>
                        <span>lb</span>
                      </div>
                      <div className="pt-2 text-center font-bold text-[9px]">
                        {item.weightUnit || "K"}
                      </div>
                    </div>
                    <div className="h-[24px] border-t border-black bg-white" />
                  </div>

                  <div className="w-[1.16%] bg-[#c0c0c0] border-r border-black shrink-0" />

                  <div className="w-[10.04%] border-r border-black flex flex-col">
                    <div className="h-[35px] flex flex-col">
                      <div className="h-[17px] border-b border-black text-center text-[5.5px] font-normal leading-none flex items-center justify-center">
                        Rate Class
                      </div>
                      <div className="h-[18px] flex">
                        <div className="w-[19.23%] border-r border-black" />
                        <div className="w-[80.77%] border-b border-black flex flex-col justify-center items-center text-[5px] font-normal leading-[1.05]">
                          <span>Commodity</span>
                          <span>Item No</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1">
                      <div className="w-[19.23%] border-r border-black text-center pt-2 font-bold text-[9.5px]">
                        {item.rateClass}
                      </div>
                      <div className="w-[80.77%]" />
                    </div>
                  </div>

                  <div className="w-[1.54%] bg-[#c0c0c0] border-r border-black shrink-0" />

                  <div className="w-[8.49%] border-r border-black flex flex-col">
                    <div className="h-[35px] border-b border-black flex flex-col justify-center items-center text-[6px] font-normal leading-[1.1]">
                      <span>Chargeable</span>
                      <span>Weight</span>
                    </div>
                    <div className="pt-2 pr-1.5 text-right font-bold text-[9.5px]">
                      {fmt(item.chargeableWeight)}
                    </div>
                  </div>

                  <div className="w-[1.54%] bg-[#c0c0c0] border-r border-black shrink-0" />

                  <div className="w-[8.88%] border-r border-black flex flex-col">
                    <div className="h-[35px] border-b border-black relative bg-white overflow-hidden">
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="18%"
                          y1="80%"
                          x2="82%"
                          y2="20%"
                          stroke="#000000"
                          strokeWidth="0.8"
                        />
                      </svg>
                      <span className="absolute top-1 left-2 text-[6.5px] leading-none font-normal">
                        Rate
                      </span>
                      <span className="absolute bottom-1 right-2 text-[6.5px] leading-none font-normal">
                        Class
                      </span>
                    </div>
                    <div className="pt-2 pr-2 text-right font-bold text-[9.5px]">
                      {fmt(item.rate)}
                    </div>
                  </div>

                  <div className="w-[1.54%] bg-[#c0c0c0] border-r border-black shrink-0" />

                  <div className="w-[20.08%] border-r border-black flex flex-col justify-between">
                    <div>
                      <div className="h-[35px] border-b border-black flex items-center justify-center text-[6.5px] font-normal">
                        Total
                      </div>
                      <div className="pt-2 pr-2.5 text-right font-bold text-[10px]">
                        {fmt(item.total)}
                      </div>
                    </div>
                    <div className="h-[24px] border-t border-black flex items-center justify-end pr-2.5 font-bold text-[10px] bg-white">
                      {data.charges.prepaidWeightCharge
                        ? fmt(data.charges.prepaidWeightCharge)
                        : ""}
                    </div>
                  </div>

                  <div className="w-[1.54%] bg-[#c0c0c0] border-r border-black shrink-0" />

                  <div className="w-[29.34%] flex flex-col">
                    <div className="h-[35px] border-b border-black flex flex-col justify-center pl-2 text-[6px] font-normal leading-[1.1]">
                      <span>Nature and Quantity of Goods</span>
                      <span className="text-[5px] text-neutral-800">
                        (incl. Dimensions or Volume)
                      </span>
                    </div>
                    <div className="pt-2 pl-2 pr-1 text-[6.5px] font-bold leading-[1.28] whitespace-pre-line uppercase text-black">
                      {(() => {
                        const raw = item.natureAndQuantity || "";
                        if (/\bDIM\s*:/i.test(raw)) {
                          return raw;
                        }
                        if (item.dimensions && item.dimensions.length > 0) {
                          const valid = item.dimensions.filter(
                            (d) =>
                              Number(d.lengthCm) > 0 &&
                              Number(d.widthCm) > 0 &&
                              Number(d.heightCm) > 0 &&
                              Number(d.pieces) > 0,
                          );
                          if (valid.length > 0) {
                            const parts = valid.map(
                              (d) =>
                                `${d.lengthCm}X${d.widthCm}X${d.heightCm}/${d.pieces}`,
                            );
                            const totalVol = valid.reduce(
                              (acc, d) =>
                                acc +
                                (Number(d.lengthCm) *
                                  Number(d.widthCm) *
                                  Number(d.heightCm) *
                                  Number(d.pieces)) /
                                  6000,
                              0,
                            );
                            const roundedVol = item.volumetricWeightKg
                              ? Math.round(Number(item.volumetricWeightKg))
                              : Math.round(totalVol);
                            const dimBlock = `DIM:${parts.join(" , ")} CMT\nVOL WT: ${roundedVol} KGS`;
                            return raw.trim()
                              ? `${raw.trim()}\n\n${dimBlock}`
                              : dimBlock;
                          }
                        }
                        return raw;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 10: CHARGES / CERTIFICATION */}
              <div className="flex">
                <div className="w-[38%] border-r border-black flex flex-col text-[7px]">
                  <div className="flex flex-col border-b border-black">
                    <div className="flex items-start w-full">
                      <div className="w-[6px] border-t border-black shrink-0" />

                      <div className="flex items-stretch flex-1">
                        <svg
                          width="8"
                          height="12"
                          viewBox="0 0 8 12"
                          className="shrink-0 block"
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2="8"
                            y2="12"
                            stroke="#000000"
                            strokeWidth="0.9"
                          />
                        </svg>
                        <div className="flex-1 border-b border-black flex items-center justify-center px-1 bg-white">
                          <span className="text-[6.5px] font-normal">
                            Prepaid
                          </span>
                        </div>
                        <svg
                          width="8"
                          height="12"
                          viewBox="0 0 8 12"
                          className="shrink-0 block"
                        >
                          <line
                            x1="0"
                            y1="12"
                            x2="8"
                            y2="0"
                            stroke="#000000"
                            strokeWidth="0.9"
                          />
                        </svg>
                      </div>

                      <div className="flex items-stretch flex-[1.4]">
                        <svg
                          width="8"
                          height="12"
                          viewBox="0 0 8 12"
                          className="shrink-0 block"
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2="8"
                            y2="12"
                            stroke="#000000"
                            strokeWidth="0.9"
                          />
                        </svg>
                        <div className="flex-1 border-b border-black flex items-center justify-center px-1 bg-white">
                          <span className="text-[6.5px] font-normal">
                            Weight Charge
                          </span>
                        </div>
                        <svg
                          width="8"
                          height="12"
                          viewBox="0 0 8 12"
                          className="shrink-0 block"
                        >
                          <line
                            x1="0"
                            y1="12"
                            x2="8"
                            y2="0"
                            stroke="#000000"
                            strokeWidth="0.9"
                          />
                        </svg>
                      </div>

                      <div className="flex items-stretch flex-1">
                        <svg
                          width="8"
                          height="12"
                          viewBox="0 0 8 12"
                          className="shrink-0 block"
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2="8"
                            y2="12"
                            stroke="#000000"
                            strokeWidth="0.9"
                          />
                        </svg>
                        <div className="flex-1 border-b border-black flex items-center justify-center px-1 bg-white">
                          <span className="text-[6.5px] font-normal">
                            Collect
                          </span>
                        </div>
                        <svg
                          width="8"
                          height="12"
                          viewBox="0 0 8 12"
                          className="shrink-0 block"
                        >
                          <line
                            x1="0"
                            y1="12"
                            x2="8"
                            y2="0"
                            stroke="#000000"
                            strokeWidth="0.9"
                          />
                        </svg>
                      </div>

                      <div className="w-[6px] border-t border-black shrink-0" />
                    </div>

                    <div className="flex min-h-[16px]">
                      <div className="w-1/2 border-r border-black p-1 flex items-end justify-end">
                        <span className="font-bold text-[8.5px]">
                          {fmt(data.charges.prepaidWeightCharge)}
                        </span>
                      </div>
                      <div className="w-1/2 p-1 flex items-end justify-end">
                        <span className="font-bold text-[8.5px]">
                          {fmt(data.charges.collectWeightCharge)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col border-b border-black relative">
                    <TrapezoidHeader
                      label="Valuation Charge"
                      height={12}
                      slant={9}
                    />
                    <div className="flex min-h-[14px]">
                      <div className="w-1/2 border-r border-black p-1 flex items-end justify-end relative">
                        <span className="font-bold text-[8px]">
                          {fmt(data.charges.valuationChargePrepaid)}
                        </span>
                        {!data.charges.valuationChargePrepaid && (
                          <DiagonalSlash />
                        )}
                      </div>
                      <div className="w-1/2 p-1 flex items-end justify-end relative">
                        <span className="font-bold text-[8px]">
                          {fmt(data.charges.valuationChargeCollect)}
                        </span>
                        {!data.charges.valuationChargeCollect && (
                          <DiagonalSlash />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col border-b border-black relative">
                    <TrapezoidHeader label="Tax" height={12} slant={8} />
                    <div className="flex min-h-[14px]">
                      <div className="w-1/2 border-r border-black p-1 flex items-end justify-end relative">
                        <span className="font-bold text-[8px]">
                          {fmt(data.charges.taxPrepaid)}
                        </span>
                        {!data.charges.taxPrepaid && <DiagonalSlash />}
                      </div>
                      <div className="w-1/2 p-1 flex items-end justify-end relative">
                        <span className="font-bold text-[8px]">
                          {fmt(data.charges.taxCollect)}
                        </span>
                        {!data.charges.taxCollect && <DiagonalSlash />}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col border-b border-black relative">
                    <TrapezoidHeader
                      label="Total other Charges Due Agent"
                      height={12}
                      slant={9}
                    />
                    <div className="flex min-h-[14px]">
                      <div className="w-1/2 border-r border-black p-1 flex items-end justify-end relative">
                        <span className="font-bold text-[8px]">
                          {fmt(displayAgentChargesPrepaid)}
                        </span>
                        {!displayAgentChargesPrepaid && <DiagonalSlash />}
                      </div>
                      <div className="w-1/2 p-1 flex items-end justify-end relative">
                        <span className="font-bold text-[8px]">
                          {fmt(data.charges.agentChargesCollect)}
                        </span>
                        {!data.charges.agentChargesCollect && <DiagonalSlash />}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col border-b border-black relative">
                    <TrapezoidHeader
                      label="Total other Charges Due Carrier"
                      height={12}
                      slant={9}
                    />
                    <div className="flex min-h-[16px]">
                      <div className="w-1/2 border-r border-black p-1 flex items-end justify-end relative">
                        <span className="font-bold text-[8.5px]">
                          {fmt(displayCarrierChargesPrepaid)}
                        </span>
                      </div>
                      <div className="w-1/2 p-1 flex items-end justify-end relative">
                        <span className="font-bold text-[8px]">
                          {fmt(data.charges.carrierChargesCollect)}
                        </span>
                        {!data.charges.carrierChargesCollect && (
                          <DiagonalSlash />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex border-b border-black min-h-[22px] bg-[#bfbfbf] relative">
                    <div className="w-1/2 border-r border-black relative">
                      <DiagonalSlash />
                    </div>
                    <div className="w-1/2 relative">
                      <DiagonalSlash />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-start w-full">
                      <div className="w-1/2 border-r border-black flex">
                        <TrapezoidHeader
                          label="Total prepaid"
                          height={11}
                          slant={8}
                        />
                      </div>
                      <div className="w-1/2 flex">
                        <TrapezoidHeader
                          label="Total collect"
                          height={11}
                          slant={8}
                        />
                      </div>
                    </div>

                    <div className="flex min-h-[16px]">
                      <div className="w-1/2 border-r border-black p-1 flex items-end justify-end">
                        <span className="font-bold text-[9px]">
                          {fmt(data.charges.totalPrepaid)}
                        </span>
                      </div>
                      <div className="w-1/2 p-1 flex items-end justify-end">
                        <span className="font-bold text-[9px]">
                          {fmt(data.charges.totalCollect)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-[62%] flex flex-col justify-between">
                  <div className="border-b border-black min-h-[46px] p-1.5 flex flex-col justify-start">
                    <div className="text-[7px] text-neutral-800 leading-none font-bold uppercase tracking-wider mb-1">
                      Other Charges
                    </div>

                    {otherChargesFormattedText ? (
                      <div className="text-[8.5px] font-bold text-black uppercase tracking-tight leading-normal px-0.5 pt-0.5">
                        {otherChargesFormattedText}
                      </div>
                    ) : (
                      <div className="text-[7.5px] font-mono text-neutral-400 italic px-0.5">
                        NIL
                      </div>
                    )}
                  </div>

                  <div className="p-1.5 flex flex-col justify-between min-h-[64px]">
                    <p className="text-[5.8px] leading-[1.16] text-neutral-900 text-justify">
                      Shipper certifies that the particulars on the face hereof
                      are correct and that insofar as any part of the
                      consignment contains dangerous goods such part is properly
                      described by name and is in proper condition for carriage
                      by air according to the applicable Dangerous Goods
                      Regulations
                    </p>

                    <div className="mt-2 text-center">
                      <div className="font-bold text-[8.5px] uppercase tracking-wide">
                        {data.execution.shipperCertSignatory ||
                          "M5 CONTINENT LOGISTICS SOLUTION PVT LTD"}
                      </div>
                      <div className="w-4/5 mx-auto border-b border-dotted border-black mt-1" />
                      <div className="text-[6.5px] text-neutral-800 mt-0.5">
                        Signature of Shipper or his Agent
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 11: DESTINATION & EXECUTION */}
              <div className="flex border-t border-black">
                <div className="w-[38%] border-r border-black flex flex-col text-[6.5px]">
                  <div className="flex border-b border-black min-h-[20px]">
                    <div className="w-1/2 border-r border-black flex flex-col relative">
                      <TrapezoidHeader
                        label="Currency Conversion Rates"
                        height={10}
                        slant={6}
                        textClassName="text-[5.5px] text-black whitespace-nowrap"
                      />
                      <div className="flex-1 relative min-h-[10px]">
                        <DiagonalSlash />
                      </div>
                    </div>
                    <div className="w-1/2 flex flex-col relative">
                      <TrapezoidHeader
                        label="cc charges in Dest.Currency"
                        height={10}
                        slant={6}
                        textClassName="text-[5.5px] text-black whitespace-nowrap"
                      />
                      <div className="flex-1 relative min-h-[10px]">
                        <DiagonalSlash />
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-[22px]">
                    <div className="w-2/5 border-r border-black p-0.5 text-[5.5px] leading-tight flex items-center">
                      For Carrier&apos;s use only at Destination
                    </div>
                    <div className="w-3/5 flex flex-col">
                      <div className="border-b border-black relative flex-1 flex flex-col">
                        <TrapezoidHeader
                          label="Charges at Destination"
                          height={10}
                          slant={6}
                          textClassName="text-[5.5px] text-black whitespace-nowrap"
                        />
                        <div className="flex-1 relative min-h-[8px]">
                          <DiagonalSlash />
                        </div>
                      </div>
                      <div className="relative flex-1 flex flex-col">
                        <TrapezoidHeader
                          label="Total collect Charges"
                          height={10}
                          slant={6}
                          textClassName="text-[5.5px] text-black whitespace-nowrap"
                        />
                        <div className="flex-1 relative min-h-[8px]">
                          <DiagonalSlash />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-[62%] p-1.5 flex flex-col justify-between">
                  <div className="flex items-start justify-between text-[7px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-700">Executed on</span>
                      <span className="font-bold text-[8px]">
                        {data.execution.executedDate}
                      </span>
                      <span className="text-[6.5px] text-neutral-500">
                        (Date)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-700">at</span>
                      <span className="font-bold text-[8px] uppercase">
                        {data.execution.executedPlace}
                      </span>
                      <span className="text-[6.5px] text-neutral-500">
                        (Place)
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-[6.5px] text-neutral-700">
                        Signature of issuing carrier or Agent
                      </div>
                      <div className="font-bold text-[8px] uppercase whitespace-pre-line leading-tight mt-0.5">
                        {data.execution.carrierAgentSignature}
                      </div>
                      <div className="border-b border-dotted border-black mt-1 w-32 ml-auto" />
                    </div>
                  </div>

                  <div className="font-bold text-[12px] tracking-wider text-right mt-1 pr-1">
                    {fullAwbNo}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 text-right pr-2">
            <span className="font-bold text-[8px] tracking-wider uppercase">
              {data.execution.copyDesignation ||
                "ORIGINAL 1 (FOR ISSUING CARRIER)"}
            </span>
          </div>
        </div>
      )}

      {/* ================= PAGE 2: CONDITIONS OF CONTRACT ================= */}
      {showPage2 && (
        <div
          id="mawb-page-2"
          className="mawb-page-sheet bg-white text-black font-sans mx-auto shadow-2xl print:shadow-none print:m-0 print:p-0 flex flex-col justify-between"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "12mm 12mm 10mm 12mm",
            boxSizing: "border-box",
            fontSize: "6.5px",
            lineHeight: "1.25",
            color: "#000000",
            backgroundColor: "#ffffff",
          }}
        >
          <div>
            <div className="text-center font-bold text-[9.5px] tracking-wide mb-1 uppercase">
              NOTICE CONCERNING CARRIERS&apos; LIMITATION OF LIABILITY
            </div>

            <p className="text-justify leading-[1.28] mb-3 text-[6.5px] text-neutral-900">
              If the carriage involves an ultimate destination or stop in a
              country other than the country of departure, the Montreal
              Convention or the Warsaw Convention may be applicable to the
              liability of the Carrier in respect of loss of, damage or delay to
              cargo. Carrier&apos;s limitation of liability in accordance with
              those Conventions shall be as set forth in subparagraph 4 unless a
              higher value is declared.
            </p>

            <div className="text-center font-bold text-[9px] tracking-wide mb-2 uppercase">
              CONDITIONS OF CONTRACT
            </div>

            <div className="grid grid-cols-2 gap-4 text-justify text-[6px] leading-[1.28]">
              <div className="space-y-1.5">
                <div>
                  <span className="font-bold">
                    1. In this contract and the Notices appearing hereon:
                  </span>
                  <p className="mt-0.5">
                    <span className="font-bold">CARRIER</span> includes the air
                    carrier issuing this air waybill and all carriers that carry
                    or undertake to carry the cargo or perform any other
                    services related to such carriage.
                  </p>
                  <p className="mt-0.5">
                    <span className="font-bold">
                      SPECIAL DRAWING RIGHT (SDR)
                    </span>{" "}
                    is a Special Drawing Right as defined by the International
                    Monetary Fund.
                  </p>
                  <p className="mt-0.5">
                    <span className="font-bold">WARSAW CONVENTION</span> means
                    whichever of the following instruments is applicable to the
                    contract of carriage:
                  </p>
                  <p className="pl-1">
                    the Convention for the Unification of Certain Rules Relating
                    to International Carriage by Air, signed at Warsaw, 12
                    October 1929;
                  </p>
                  <p className="pl-1">
                    that Convention as amended at The Hague on 28 September
                    1955;
                  </p>
                  <p className="pl-1">
                    that Convention as amended at The Hague 1955 and by Montreal
                    Protocol No.1, 2, or 4 (1975) as the case may be.
                  </p>
                  <p className="mt-0.5">
                    <span className="font-bold">MONTREAL CONVENTION</span> means
                    the Convention for the Unification of Certain Rules for
                    International Carriage by Air, done at Montreal on 28 May
                    1999.
                  </p>
                </div>

                <div>
                  <span className="font-bold">2./2.1</span> Carriage is subject
                  to the rules relating to liability established by the Warsaw
                  Convention or the Montreal Convention unless such carriage is
                  not &quot;international carriage&quot; as defined by the
                  applicable Conventions.
                </div>

                <div>
                  <span className="font-bold">2.2</span> To the extent not in
                  conflict with the foregoing, carriage and other related
                  services performed by each Carrier are subject to:
                  <p className="pl-1 mt-0.5">
                    2.2.1 applicable laws and government regulations;
                  </p>
                  <p className="pl-1 mt-0.5">
                    2.2.2 provisions contained in the air waybill,
                    Carrier&apos;s conditions of carriage and related rules,
                    regulations, and timetables (but not the times of departure
                    and arrival stated therein) and applicable tariffs of such
                    Carrier, which are made part hereof, and which may be
                    inspected at any airports or other cargo sales offices from
                    which it operates regular services. When carriage is to/from
                    the USA, the shipper and the consignee are entitled, upon
                    request, to receive a free copy of the Carrier&apos;s
                    conditions of carriage. The Carrier&apos;s conditions of
                    carriage include, but are not limited to:
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.1 limits on the Carrier&apos;s liability for loss,
                    damage or delay of goods, including fragile or perishable
                    goods;
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.2 claims restrictions, including time periods within
                    which shippers or consignees must file a claim or bring an
                    action against the Carrier for its acts or omissions, or
                    those of its agents;
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.3 rights, if any, of the Carrier to change the terms
                    of the contract;
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.4 rules about Carrier&apos;s right to refuse to carry;
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.5 Rights of the Carrier and limitations concerning
                    delay or failure to perform service, including schedule
                    changes, substitution of alternate Carrier or aircraft and
                    rerouting.
                  </p>
                </div>

                <div>
                  <span className="font-bold">3.</span> The agreed stopping
                  places (which may be altered by Carrier in case of necessity)
                  are those places, except the place of departure and place of
                  destination, set forth on the face hereof or shown in
                  Carrier&apos;s timetables as scheduled stopping places for the
                  route. Carriage to be performed hereunder by several
                  successive Carriers is regarded as a single operation.
                </div>

                <div>
                  <span className="font-bold">4.</span> For carriage to which
                  the Montreal Convention does not apply, Carrier&apos;s
                  liability limitation for cargo lost, damaged or delayed shall
                  be 26 SDRs per kilogram unless a greater per kilogram monetary
                  limit is provided in any applicable Convention or in
                  Carrier&apos;s tariffs or general conditions of carriage.
                </div>

                <div>
                  <span className="font-bold">5./5.1</span> Except when the
                  Carrier has extended credit to the consignee without the
                  written consent of the shipper, the shipper guarantees payment
                  of all charges for the carriage due in accordance with
                  Carrier&apos;s tariff, conditions of carriage and related
                  regulations, applicable laws (including national laws
                  implementing the Warsaw Convention and the Montreal
                  Convention), government regulations, orders and requirements.
                </div>

                <div>
                  <span className="font-bold">5.2</span> When no part of the
                  consignment is delivered, a claim with respect to such
                  consignment will be considered even though transportation
                  charges thereon are unpaid.
                </div>
              </div>

              <div className="space-y-1.5">
                <div>
                  <span className="font-bold">6./6.1</span> For cargo accepted
                  for carriage, the Warsaw Convention and the Montreal
                  Convention permit shipper to increase the limitation of
                  liability by declaring a higher value for carriage and paying
                  a supplemental charge if required.
                </div>

                <div>
                  <span className="font-bold">6.2</span> In carriage to which
                  neither the Warsaw Convention nor the Montreal Convention
                  applies Carrier shall, in accordance with the procedures set
                  forth in its general condition of carriage and applicable
                  tariffs, permit shipper to increase the limitation of
                  liability by declaring a higher value for carriage and paying
                  a supplemental charge if so required.
                </div>

                <div>
                  <span className="font-bold">7/7.1</span> In cases of loss of,
                  damage or delay to part of the cargo, the weight to be taken
                  in account in determining Carrier&apos;s limit of liability
                  shall be only the weight of the package or packages concerned.
                </div>

                <div>
                  <span className="font-bold">7.2</span> Notwithstanding any
                  other provisions, for &quot;foreign air transportation&quot;
                  as defined by the U.S. Transportation Code:
                  <p className="pl-1 mt-0.5">
                    7.2.1 in the case of loss of, damage or delay to a shipment,
                    the weight to be used in determining Carrier&apos;s limit of
                    liability shall be the weight which is used to determine the
                    charge for carriage of such shipment; and
                  </p>
                  <p className="pl-1 mt-0.5">
                    7.2.2 in the case of loss of, damage or delay to a part of a
                    shipment, the shipment weight in 7.2.1 shall be prorated to
                    the packages covered by the same air waybill whose value is
                    affected by the loss, damage or delay. The weight applicable
                    in the case of loss or damage to one or more articles in a
                    package shall be the weight of the entire package.
                  </p>
                </div>

                <div>
                  <span className="font-bold">8.</span> Any exclusion or
                  limitation of liability applicable to Carrier shall apply to
                  Carrier&apos;s agents, employees, and representatives and to
                  any person whose aircraft or equipment used by Carrier for
                  carriage and such person&apos;s agents, employees and
                  representatives.
                </div>

                <div>
                  <span className="font-bold">9.</span> Carrier undertakes to
                  complete the carriage with reasonable dispatch. Where
                  permitted by applicable laws, tariffs and government
                  regulations, Carrier may use alternative carriers, aircraft or
                  modes of transport without notice but with due regard to the
                  interests of the shipper. Carrier is authorized by the shipper
                  to select the routing and all intermediate stopping places
                  that it deems appropriate or to change or deviate from the
                  routing shown on the face hereof.
                </div>

                <div>
                  <span className="font-bold">10.</span> Receipt by the person
                  entitled to delivery of the cargo without complaint shall be
                  prima facie evidence that the cargo has been delivered in good
                  condition and in accordance with the contract of carriage.
                  <p className="pl-1 mt-0.5">
                    10.1 In the case of loss of, damage or delay to cargo a
                    written complaint must be made to Carrier by the person
                    entitled to delivery. Such complaint must be made:
                  </p>
                  <p className="pl-2 mt-0.5">
                    10.1.1 in the case of damage to the cargo, immediately after
                    discovery of the damage and at the latest within 14 days
                    from the date of receipt of the cargo;
                  </p>
                  <p className="pl-2 mt-0.5">
                    10.1.2 in the case of delay, within 21 days from the date on
                    which the cargo was placed at the disposal of the person
                    entitled to delivery.
                  </p>
                  <p className="pl-2 mt-0.5">
                    10.1.3 in the case of non-delivery of the cargo, within 120
                    days from the date of issue of the air waybill, or if an air
                    waybill has not been issued, within 120 days from the date
                    of receipt of the cargo for transportation by the Carrier.
                  </p>
                  <p className="pl-1 mt-0.5">
                    10.2 Such complaint may be made to the Carrier whose air
                    waybill was used, or to the first Carrier or to the last
                    Carrier or to the Carrier, which performed the carriage
                    during which the loss, damage or delay took place.
                  </p>
                  <p className="pl-1 mt-0.5">
                    10.3 Unless a written complaint is made within the time
                    limits specified in 10.1 no action may be brought against
                    Carrier.
                  </p>
                  <p className="pl-1 mt-0.5">
                    10.4 Any rights to damages against Carrier shall be
                    extinguished unless an action is brought within two years
                    from the date of arrival at the destination, or from the
                    date on which the aircraft ought to have arrived, or from
                    the date on which the carriage stopped.
                  </p>
                </div>

                <div>
                  <span className="font-bold">11.</span> Shipper shall comply
                  with all applicable laws and government regulations of any
                  country to or from which the cargo may be carried, including
                  those relating to the packing, carriage or delivery of the
                  cargo, and shall furnish such information and attach such
                  documents to the air waybill as may be necessary to comply
                  with such laws and regulations. Carrier is not liable to
                  shipper and shipper shall indemnify Carrier for loss or
                  expense due to shipper&apos;s failure to comply with this
                  provision.
                </div>

                <div>
                  <span className="font-bold">12.</span> No agent, employee or
                  representative of Carrier has authority to alter, modify or
                  waive any provisions of this contract.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-neutral-300 flex justify-between text-[6px] text-neutral-500">
            <span>IATA MASTER AIR WAYBILL CONDITIONS OF CONTRACT</span>
            <span>PAGE 2 OF 2</span>
          </div>
        </div>
      )}
    </div>
  );
}
