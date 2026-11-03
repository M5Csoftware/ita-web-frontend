// src/types/mawb.ts

export interface MawbItemLine {
  pieces: string | number;
  grossWeight: string | number;
  weightUnit?: string;            // "K" or "L"
  rateClass?: string;             // "Q", "M", "N", "C", etc.
  commodityItemNo?: string;
  chargeableWeight?: string | number;
  rate?: string | number;
  total?: string | number;
  natureAndQuantity?: string;
}

export interface MawbRouteFlight {
  flightNo: string;
  date: string;
}

export interface MawbData {
  awbPrefix: string;              // "077"
  awbSerial: string;              // "5906 6545"
  departureAirportCode: string;   // "DEL"
  carrierName?: string;           // "EGYPT AIR"
  copiesNotice?: string;
  contractNotice?: string;

  shipper: {
    nameAndAddress: string;
    accountNumber?: string;
  };
  consignee: {
    nameAndAddress: string;
    accountNumber?: string;
  };
  issuingAgent: {
    nameAndCity: string;
    iataCode?: string;
    accountNo?: string;
  };

  accountingInfo?: string;        // "FREIGHT PREPAID"

  routing: {
    departureAirport?: string;
    to1?: string;
    byFirstCarrier?: string;
    to2?: string;
    by2?: string;
    to3?: string;
    by3?: string;
    currency?: string;
    chgsCode?: string;
    wtValPpd?: string;
    wtValColl?: string;
    otherPpd?: string;
    otherColl?: string;
    declaredValueCarriage?: string;
    declaredValueCustoms?: string;
    destinationAirport?: string;
    flights?: MawbRouteFlight[];
    amountOfInsurance?: string;
    insuranceNotice?: string;
    handlingInfo?: string;
    sci?: string;
  };

  items: MawbItemLine[];

  charges: {
    prepaidWeightCharge?: number | string;
    collectWeightCharge?: number | string;
    valuationChargePrepaid?: number | string;
    valuationChargeCollect?: number | string;
    taxPrepaid?: number | string;
    taxCollect?: number | string;
    agentChargesPrepaid?: number | string;
    agentChargesCollect?: number | string;
    carrierChargesPrepaid?: number | string;
    carrierChargesCollect?: number | string;
    totalPrepaid?: number | string;
    totalCollect?: number | string;
    otherChargesBreakdown?: string;
  };

  execution: {
    shipperCertSignatory?: string;
    executedDate?: string;
    executedPlace?: string;
    carrierAgentSignature?: string;
    copyDesignation?: string;
  };
}