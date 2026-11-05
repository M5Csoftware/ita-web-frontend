// IATA Standard Types and Resolution 600b specifications

export type AwbStatus =
  | "AVAILABLE"
  | "ALLOTTED"
  | "ISSUED"
  | "MANIFESTED"
  | "DEPARTED"
  | "ARRIVED"
  | "DELIVERED"
  | "CANCELLED"
  | "VOID";

export type SpecialHandlingCode =
  | "GEN"
  | "PER"
  | "DGR"
  | "VAL"
  | "COL"
  | "AVI"
  | "HUM";

export interface Airline {
  prefix: string; // 3-digit IATA code e.g. "098", "176", "020"
  code: string; // 2-letter code e.g. "AI", "EK", "LH"
  name: string;
  country: string;
}

export interface Airport {
  iataCode: string; // 3-letter IATA code e.g. "DEL", "DXB", "FRA", "LHR"
  name: string;
  city: string;
  country: string;
}

export interface ShipperConsignee {
  id: string;
  type: "SHIPPER" | "CONSIGNEE" | "BOTH";
  name: string;
  accountNumber?: string;
  address: string;
  city: string;
  country: string;
  contactPerson: string;
  phone: string;
  email: string;
  taxOrGstId: string;
}

export interface IssuingAgentProfile {
  name: string;
  iataNumericCode: string; // e.g. "14-3-9821/0014"
  cassAddress: string; // e.g. "CAS-IND-8820"
  headOfficeAddress: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  logoUrl?: string;
  bankDetails?: string;
  terms?: string;
}

export type NavPageId =
  | "dashboard"
  | "docket"
  | "stock"
  | "bookings"
  | "mawb"
  | "manifest"
  | "eawb"
  | "billing"
  | "invoice-generation"
  | "master"
  | "settings";

export const ALL_TAB_IDS: NavPageId[] = [
  "dashboard",
  "docket",
  "stock",
  "bookings",
  "mawb",
  "manifest",
  "eawb",
  "billing",
  "invoice-generation",
  "master",
  "settings",
];

export type UserRole = "admin" | "user";

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  email: string;
  stationCode: string;
  isActive: boolean;
  permissions: NavPageId[]; // Individual selective tab permissions for each user
  avatar?: string;
}

export function getUserEffectiveTabs(user: UserAccount | null): NavPageId[] {
  if (!user) return ALL_TAB_IDS;
  const role = (user.role || "").toLowerCase();
  const uname = (user.username || "").toLowerCase();
  // Admin strictly has complete access to all modules under any circumstances
  if (role === "admin" || role === "administrator" || uname === "admin") {
    return ALL_TAB_IDS;
  }
  if (
    user.permissions &&
    Array.isArray(user.permissions) &&
    user.permissions.length > 0
  ) {
    return user.permissions;
  }
  return ["dashboard"];
}

export type DocketServiceMode =
  | "EXPRESS_AIR"
  | "STANDARD_AIR"
  | "PRIORITY_AOG"
  | "COLD_CHAIN";
export type DocketPaymentMode = "PREPAID" | "TO_PAY" | "ON_ACCOUNT";
export type DocketStatus =
  | "BOOKED"
  | "AWB_ASSIGNED"
  | "MANIFESTED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export interface DocketItem {
  id: string;
  docketNumber: string; // e.g. "DKT-DEL-2026-10492"
  bookingDate: string;
  serviceMode: DocketServiceMode;
  paymentMode: DocketPaymentMode;
  origin: string; // IATA Airport code
  destination: string; // IATA Airport code
  consignorName: string;
  consignorAddress: string;
  consignorPhone: string;
  consignorGst: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneePhone: string;
  consigneeGst: string;
  pieces: number;
  packageType: string;
  actualWeightKg: number;
  dimensions: DimensionEntry[];
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  natureOfGoods: string;
  handlingCode: SpecialHandlingCode;
  declaredValue: number;
  ewayBillNumber?: string;
  ratePerKg: number;
  freightAmount: number;
  docketFee: number;
  fuelSurcharge: number;
  securitySurcharge: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  assignedAwb?: string;
  status: DocketStatus;
  createdAt: string;
}

/**
 * A single AWB stock entry (Res 600b Mod-7).
 *
 * NEW: `airlineCode` + `airlineName` are persisted so the ledger table can
 * show the airline's 2-letter IATA code and human-readable name without a
 * join against the airline master every time the table renders.
 *
 * `fullAwbNumber` follows the canonical DISPLAY format:
 *   "<3-digit prefix>-<8-digit serial>", e.g. "098-72418992"
 */
export interface AwbStockItem {
  id: string;
  airlinePrefix: string; // "098"
  airlineCode?: string; // "AI"
  airlineName?: string; // "Air India"
  airlineNumber: string; // 8-digit serial with Mod-7 check digit, e.g. "72418992"
  fullAwbNumber: string; // e.g. "098-72418992"
  status: "AVAILABLE" | "ALLOTTED" | "ISSUED" | "VOID";
  allocatedTo?: string;
  issuedAt?: string;
  voidReason?: string;
}

export interface DimensionEntry {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  pieces: number;
}

export interface BookingItem {
  id: string;
  bookingRef: string;
  shipperName: string;
  consigneeName: string;
  origin: string; // IATA airport
  destination: string; // IATA airport
  pieces: number;
  actualWeightKg: number;
  dimensions: DimensionEntry[];
  volumetricWeightKg: number; // L x W x H / 6000
  chargeableWeightKg: number; // max(actual, volumetric)
  natureOfGoods: string;
  handlingCode: SpecialHandlingCode;
  createdAt: string;
  status: "PENDING_AWB" | "AWB_ISSUED" | "CANCELLED";
}

/**
 * House Air Waybill.
 *
 * Optional per-house shipper/consignee address + tax fields so that a
 * consolidated HAWB can have its own address block distinct from the Master.
 * Populated by the "Edit HAWB" form in AwbConsolidationView and used to fill
 * the printed MAWB "Nature & Quantity" block + HAWB sub-table.
 */
export interface HawbItem {
  id: string;
  hawbNumber: string;
  mawbNumber: string;
  shipperName: string;
  consigneeName: string;
  origin: string;
  destination: string;
  pieces: number;
  grossWeightKg: number;
  chargeableWeightKg: number;
  handlingInfo?: string;
  natureOfGoods: string;
  status: AwbStatus;

  // Optional house-specific address/tax fields
  shipperAddress?: string;
  shipperPhone?: string;
  shipperGst?: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  consigneeGst?: string;
}

/**
 * Master Air Waybill.
 *
 * Optional fields consumed by the printable MawbSheet:
 *  - carrierName            -> printed next to "AIR WAYBILL"
 *  - issuingAgentAccountNo  -> printed in the "Account No." box below IATA Code
 *  - copiesNotice           -> overrides the default copies-validity text
 *  - contractNotice         -> overrides the default conditions-of-contract paragraph
 *  - accountingInfo         -> overrides the "FREIGHT PREPAID" box
 */
export interface MawbItem {
  id: string;
  mawbNumber: string; // "098-72418992"
  airlinePrefix: string;
  serialNumber: string;
  bookingId?: string;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  issuingAgentName: string;
  issuingAgentIataCode: string;
  origin: string;
  destination: string;
  pieces: number;
  grossWeightKg: number;
  chargeableWeightKg: number;
  rateClass: "M" | "N" | "Q" | "C"; // Minimum, Normal, Quantity slab
  ratePerKg: number;
  freightAmount: number;
  fuelSurcharge: number;
  securitySurcharge: number;
  totalCharges: number;
  natureOfGoods: string;
  handlingCode: SpecialHandlingCode;
  flightNumber?: string;
  flightDate?: string;
  hawbs: HawbItem[];
  status: AwbStatus;
  issuedAt: string;
  fwbSent: boolean;

  // Optional, used by the printed IATA AWB (MawbSheet)
  carrierName?: string;
  issuingAgentAccountNo?: string;
  copiesNotice?: string;
  contractNotice?: string;
  accountingInfo?: string;
}

export interface FlightManifestItem {
  id: string;
  manifestNumber: string;
  flightNumber: string;
  airline: string;
  flightDate: string;
  origin: string;
  destination: string;
  mawbs: string[]; // Mawb numbers
  totalMawbs: number;
  totalHawbs: number;
  totalPieces: number;
  totalGrossWeightKg: number;
  status: "DRAFT" | "FINALIZED" | "DEPARTED";
  finalizedAt?: string;
}

export interface EawbMessage {
  id: string;
  messageType: "FWB" | "FHL" | "FFM" | "FSU";
  awbNumber: string;
  airline: string;
  flightNumber?: string;
  direction: "OUTBOUND" | "INBOUND";
  status: "ACKNOWLEDGED" | "SENT" | "FAILED" | "RETRYING";
  timestamp: string;
  rawCargoImp: string;
}

export interface CassInvoice {
  id: string;
  invoiceNumber: string;
  mawbNumber: string;
  customerName: string;
  date: string;
  freightCharges: number;
  fuelSurcharge: number;
  securitySurcharge: number;
  handlingCharges: number;
  subtotal: number;
  gstAmount: number; // 18% GST
  totalAmount: number;
  cassReconciliationStatus: "RECONCILED" | "PENDING_MATCH" | "DISCREPANCY";
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  invoiceStatus?: InvoiceStatus;
  shipmentDetails?: InvoiceShipmentReference[];
  billToParty?: "SHIPPER" | "CONSIGNEE" | "AGENT";
  customerAddress?: string;
  customerGstId?: string;
  sacCode?: string;
  dueDate?: string;
  chargeLines?: InvoiceChargeLine[];
  discountAmount?: number;
  gstRate?: number;
  gstType?: "CGST_SGST" | "IGST" | "ZERO_RATED" | "UNREGISTERED";
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  remarks?: string;
  balanceDue?: number;
  payments?: InvoicePayment[];
  corrections?: InvoiceCorrection[];
  cancellationReason?: string;
  auditLog?: InvoiceAuditEntry[];
  companyName?: string;
  companyLogoUrl?: string;
  companyBankDetails?: string;
  companyTerms?: string;
}

export type InvoiceStatus =
  | "DRAFT"
  | "APPROVED"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";
export type InvoiceBillingTrigger = "ISSUED" | "MANIFESTED" | "DEPARTED";

export interface InvoiceShipmentReference {
  reference: string;
  mawbNumber: string;
  hawbNumber?: string;
  flightNumber?: string;
  flightDate?: string;
  origin: string;
  destination: string;
  pieces: number;
  grossWeightKg: number;
  chargeableWeightKg: number;
  buyingAmount?: number;
  sellingAmount?: number;
}

export interface InvoiceChargeLine {
  id: string;
  description: string;
  amount: number;
  overrideReason?: string;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  mode: "CASH" | "CHEQUE" | "BANK_TRANSFER" | "UPI";
  tdsAmount: number;
  reference?: string;
}

export interface InvoiceCorrection {
  id: string;
  type: "CREDIT_NOTE" | "DEBIT_NOTE";
  number: string;
  amount: number;
  reason: string;
  date: string;
}

export interface InvoiceAuditEntry {
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export type InvoiceDraftData = Omit<CassInvoice, "id" | "invoiceNumber">;

export type InvoiceDraftUpdate = Partial<
  Pick<
    CassInvoice,
    | "chargeLines"
    | "discountAmount"
    | "gstRate"
    | "gstType"
    | "subtotal"
    | "gstAmount"
    | "cgstAmount"
    | "sgstAmount"
    | "igstAmount"
    | "totalAmount"
    | "freightCharges"
    | "fuelSurcharge"
    | "securitySurcharge"
    | "handlingCharges"
    | "remarks"
    | "dueDate"
  >
>;

export function calculateInvoiceAmounts(
  lines: InvoiceChargeLine[],
  discountAmount: number,
  gstRate: number,
  gstType: NonNullable<CassInvoice["gstType"]>,
) {
  const subtotal = lines.reduce(
    (sum, line) => sum + Math.max(0, Number(line.amount) || 0),
    0,
  );
  const taxableAmount = Math.max(0, subtotal - Math.max(0, discountAmount));
  const effectiveRate = gstType === "ZERO_RATED" ? 0 : Math.max(0, gstRate);
  const gstAmount = Number(((taxableAmount * effectiveRate) / 100).toFixed(2));
  const cgstAmount =
    gstType === "CGST_SGST" ? Number((gstAmount / 2).toFixed(2)) : 0;
  const sgstAmount =
    gstType === "CGST_SGST" ? Number((gstAmount - cgstAmount).toFixed(2)) : 0;
  const igstAmount =
    gstType === "IGST" || gstType === "UNREGISTERED" ? gstAmount : 0;
  return {
    subtotal,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount: Number((taxableAmount + gstAmount).toFixed(2)),
  };
}

/* -------------------------------------------------------------------------- */
/*  IATA Resolution 600b — Modulo-7 Check Digit                               */
/* -------------------------------------------------------------------------- */

/**
 * Structured result from `validateIataAwbNumber`.
 * Shared with `utils/iataMod7.ts` so both files agree on the shape.
 */
export interface IataAwbValidation {
  isValid: boolean;
  expectedCheckDigit: number;
  actualCheckDigit: number;
}

/**
 * Compute the IATA Resolution 600b Mod-7 check digit.
 *
 * Formula: Check Digit = (first 7 digits of the serial) mod 7
 * Range:   0..6
 * Example: "7241899" → 7241899 % 7 = 2 → check digit "2"
 */
export function calculateIataMod7CheckDigit(
  sevenDigits: string | number,
): number {
  const clean = String(sevenDigits).replace(/[^0-9]/g, "");
  if (clean.length === 0) return 0;
  const num = parseInt(clean.slice(0, 7), 10);
  if (isNaN(num)) return 0;
  return num % 7;
}

/**
 * Validate an 8-digit AWB serial (7 data digits + 1 Mod-7 check digit).
 *
 * Accepts input with or without separators (e.g. "72418992", "724-18992",
 * "724 18992"). Non-digit characters are stripped before validation.
 */
export function validateIataAwbNumber(
  eightDigitSerial: string,
): IataAwbValidation {
  const clean = String(eightDigitSerial).replace(/[^0-9]/g, "");
  if (clean.length !== 8) {
    return { isValid: false, expectedCheckDigit: -1, actualCheckDigit: -1 };
  }
  const firstSeven = clean.slice(0, 7);
  const actualCheckDigit = parseInt(clean.slice(7), 10);
  const expectedCheckDigit = calculateIataMod7CheckDigit(firstSeven);
  return {
    isValid: expectedCheckDigit === actualCheckDigit,
    expectedCheckDigit,
    actualCheckDigit,
  };
}

/* -------------------------------------------------------------------------- */
/*  Weight calculation                                                        */
/* -------------------------------------------------------------------------- */

/**
 * IATA Volumetric calculation formula: (L x W x H in cm) / 6000
 */
export function calculateVolumetricWeight(
  dimensions: DimensionEntry[],
): number {
  const totalCm3 = dimensions.reduce(
    (acc, dim) => acc + dim.lengthCm * dim.widthCm * dim.heightCm * dim.pieces,
    0,
  );
  return parseFloat((totalCm3 / 6000).toFixed(2));
}
