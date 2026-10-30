'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  LockKeyhole,
  Plus,
  Printer,
  ReceiptText,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  CassInvoice,
  calculateInvoiceAmounts,
  InvoiceChargeLine,
  InvoiceCorrection,
  InvoiceBillingTrigger,
  InvoiceDraftData,
  InvoiceDraftUpdate,
  InvoicePayment,
  InvoiceShipmentReference,
  InvoiceStatus,
  IssuingAgentProfile,
  MawbItem,
  ShipperConsignee,
} from '@/types/iata';

type BillToParty = 'SHIPPER' | 'CONSIGNEE' | 'AGENT';
type InvoiceReport = 'INVOICE_REGISTER' | 'GST_SALES' | 'CUSTOMER_LEDGER' | 'OUTSTANDING' | 'SHIPMENT_MARGIN';
type InvoiceOption = {
  reference: string;
  label: string;
  customerName: string;
  mawb: MawbItem;
  hawbNumber?: string;
  pieces: number;
  grossWeightKg: number;
  chargeableWeightKg: number;
  origin: string;
  destination: string;
  flightNumber?: string;
  flightDate?: string;
  freight: number;
  fuel: number;
  security: number;
};

interface InvoiceGenerationViewProps {
  invoices: CassInvoice[];
  mawbs: MawbItem[];
  partners: ShipperConsignee[];
  agentProfile: IssuingAgentProfile;
  canCreateDraft: boolean;
  canApproveInvoices: boolean;
  canManageBillingSettings: boolean;
  actor: string;
  defaultGstRate: number;
  sacCode: string;
  billingTrigger: InvoiceBillingTrigger;
  onCreateDraft: (invoice: InvoiceDraftData) => void;
  onUpdateDraft: (id: string, updates: InvoiceDraftUpdate) => void;
  onApproveInvoice: (id: string) => void;
  onSendInvoice: (id: string) => void;
  onRegisterPayment: (id: string, payment: Omit<InvoicePayment, 'id' | 'date'>) => void;
  onCancelInvoice: (id: string, reason: string) => void;
  onAddCorrection: (id: string, correction: Omit<InvoiceCorrection, 'id' | 'number' | 'date'>) => void;
  onBillingTriggerChange: (trigger: InvoiceBillingTrigger) => void;
  onGstRateChange: (rate: number) => void;
  onSacCodeChange: (code: string) => void;
}

const invoiceSteps = [
  'Billing trigger',
  'Select customer & shipments',
  'Pull shipment charges',
  'Calculate GST',
  'Review draft',
  'Accounts approval',
  'Assign invoice number',
  'Print / email',
  'Post receivable',
  'Allocate payment',
  'Issue correction',
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount || 0);

const amountInWords = (amount: number) => {
  const oneToNineteen = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tensWords = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const belowThousand = (value: number): string => {
    const parts: string[] = [];
    if (value >= 100) parts.push(`${oneToNineteen[Math.floor(value / 100)]} Hundred`);
    const remainder = value % 100;
    if (remainder >= 20) parts.push(`${tensWords[Math.floor(remainder / 10)]}${remainder % 10 ? ` ${oneToNineteen[remainder % 10]}` : ''}`);
    else if (remainder > 0) parts.push(oneToNineteen[remainder]);
    return parts.join(' ');
  };
  let rupees = Math.floor(Math.max(0, amount));
  let paise = Math.round((Math.max(0, amount) - rupees) * 100);
  if (paise === 100) {
    rupees += 1;
    paise = 0;
  }
  const parts: string[] = [];
  for (const [value, label] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']] as const) {
    const group = Math.floor(rupees / value);
    if (group > 0) {
      parts.push(`${belowThousand(group)} ${label}`);
      rupees %= value;
    }
  }
  if (rupees > 0) parts.push(belowThousand(rupees));
  const rupeeWords = parts.join(' ') || 'Zero';
  return `Dollars ${rupeeWords}${paise > 0 ? ` and ${belowThousand(paise)} Cents` : ''} Only`;
};

const getInvoiceStatus = (invoice: CassInvoice): InvoiceStatus => {
  if (invoice.invoiceStatus) return invoice.invoiceStatus;
  return invoice.paymentStatus === 'PAID' ? 'PAID' : 'SENT';
};

const getStatusLabel = (status: InvoiceStatus) =>
  status === 'PARTIALLY_PAID' ? 'Partially Paid' : status.charAt(0) + status.slice(1).toLowerCase();

const today = () => new Date().toISOString().slice(0, 10);

const getCustomerName = (mawb: MawbItem, hawbNumber: string | undefined, party: BillToParty, agentName: string) => {
  if (party === 'AGENT') return agentName;
  const hawb = mawb.hawbs.find((item) => item.hawbNumber === hawbNumber);
  return party === 'SHIPPER' ? hawb?.shipperName ?? mawb.shipperName : hawb?.consigneeName ?? mawb.consigneeName;
};

const getCustomerAddress = (mawb: MawbItem, party: BillToParty, agentProfile: IssuingAgentProfile) =>
  party === 'AGENT'
    ? `${agentProfile.headOfficeAddress}, ${agentProfile.city}, ${agentProfile.country}`
    : party === 'SHIPPER'
      ? mawb.shipperAddress
      : mawb.consigneeAddress;

const getPartner = (partners: ShipperConsignee[], customerName: string) => {
  const normalizedName = customerName.toLowerCase();
  return partners.find((partner) => partner.name.toLowerCase() === normalizedName)
    ?? partners.find((partner) => normalizedName.includes(partner.name.toLowerCase()) || partner.name.toLowerCase().includes(normalizedName));
};

const inferGstType = (customerGstId: string, companyGstId: string): NonNullable<CassInvoice['gstType']> => {
  if (!customerGstId) return 'UNREGISTERED';
  const customerStateCode = customerGstId.match(/^\d{2}/)?.[0];
  const companyStateCode = companyGstId.match(/^\d{2}/)?.[0];
  return customerStateCode && companyStateCode && customerStateCode === companyStateCode ? 'CGST_SGST' : 'IGST';
};

const isEligibleStatus = (status: MawbItem['status'], trigger: InvoiceBillingTrigger) => {
  if (trigger === 'DEPARTED') return status === 'DEPARTED';
  if (trigger === 'MANIFESTED') return status === 'MANIFESTED' || status === 'DEPARTED';
  return status === 'ISSUED' || status === 'MANIFESTED' || status === 'DEPARTED';
};

const isInvoiceClaimingOption = (invoice: CassInvoice, option: InvoiceOption) => {
  const refs = invoice.shipmentDetails;
  if (!refs?.length) return invoice.mawbNumber === option.mawb.mawbNumber;
  return refs.some((item) =>
    item.mawbNumber === option.mawb.mawbNumber &&
    (item.reference === option.reference || item.reference === `MAWB:${option.mawb.mawbNumber}`)
  );
};

export const InvoiceGenerationView: React.FC<InvoiceGenerationViewProps> = ({
  invoices,
  mawbs,
  partners,
  agentProfile,
  canCreateDraft,
  canApproveInvoices,
  canManageBillingSettings,
  actor,
  onCreateDraft,
  onUpdateDraft,
  onApproveInvoice,
  onSendInvoice,
  onRegisterPayment,
  onCancelInvoice,
  onAddCorrection,
  onBillingTriggerChange,
  onGstRateChange,
  onSacCodeChange,
  billingTrigger,
  defaultGstRate,
  sacCode,
}) => {
  const [billToParty, setBillToParty] = useState<BillToParty>('SHIPPER');
  const [customerName, setCustomerName] = useState('');
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [buyingAmounts, setBuyingAmounts] = useState<Record<string, string>>({});
  const [discountInput, setDiscountInput] = useState('0');
  const [gstType, setGstType] = useState<NonNullable<CassInvoice['gstType']>>('IGST');
  const [remarksInput, setRemarksInput] = useState('');
  const [showNewDraft, setShowNewDraft] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [draftEdit, setDraftEdit] = useState<InvoiceDraftUpdate | null>(null);
  const [formError, setFormError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [tdsAmount, setTdsAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState<InvoicePayment['mode']>('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [correctionType, setCorrectionType] = useState<InvoiceCorrection['type']>('CREDIT_NOTE');
  const [correctionAmount, setCorrectionAmount] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedReport, setSelectedReport] = useState<InvoiceReport>('INVOICE_REGISTER');

  const gstRateInput = String(gstType === 'ZERO_RATED' ? 0 : defaultGstRate);
  const shipmentOptions = useMemo(() => {
    const options: InvoiceOption[] = [];
    for (const mawb of mawbs) {
      if (!isEligibleStatus(mawb.status, billingTrigger)) continue;
      const mawbOption: InvoiceOption = {
        reference: `MAWB:${mawb.mawbNumber}`,
        label: mawb.mawbNumber,
        customerName: getCustomerName(mawb, undefined, billToParty, agentProfile.name),
        mawb,
        pieces: mawb.pieces,
        grossWeightKg: mawb.grossWeightKg,
        chargeableWeightKg: mawb.chargeableWeightKg,
        origin: mawb.origin,
        destination: mawb.destination,
        flightNumber: mawb.flightNumber,
        flightDate: mawb.flightDate,
        freight: mawb.freightAmount,
        fuel: mawb.fuelSurcharge,
        security: mawb.securitySurcharge,
      };
      if (!invoices.some((invoice) => isInvoiceClaimingOption(invoice, mawbOption))) options.push(mawbOption);

      for (const hawb of mawb.hawbs) {
        if (!isEligibleStatus(hawb.status, billingTrigger)) continue;
        const ratio = mawb.chargeableWeightKg > 0 ? hawb.chargeableWeightKg / mawb.chargeableWeightKg : 0;
        const hawbOption: InvoiceOption = {
          reference: `HAWB:${hawb.hawbNumber}`,
          label: `${hawb.hawbNumber} · ${mawb.mawbNumber}`,
          customerName: getCustomerName(mawb, hawb.hawbNumber, billToParty, agentProfile.name),
          mawb,
          hawbNumber: hawb.hawbNumber,
          pieces: hawb.pieces,
          grossWeightKg: hawb.grossWeightKg,
          chargeableWeightKg: hawb.chargeableWeightKg,
          origin: hawb.origin,
          destination: hawb.destination,
          flightNumber: mawb.flightNumber,
          flightDate: mawb.flightDate,
          freight: Number((mawb.freightAmount * ratio).toFixed(2)),
          fuel: Number((mawb.fuelSurcharge * ratio).toFixed(2)),
          security: Number((mawb.securitySurcharge * ratio).toFixed(2)),
        };
        if (!invoices.some((invoice) => isInvoiceClaimingOption(invoice, hawbOption))) options.push(hawbOption);
      }
    }
    return options;
  }, [mawbs, billingTrigger, billToParty, agentProfile.name, invoices]);

  const customerOptions = Array.from(new Set(shipmentOptions.map((option) => option.customerName)));
  const currentCustomer = customerOptions.includes(customerName) ? customerName : '';
  const filteredOptions = shipmentOptions.filter((option) => !currentCustomer || option.customerName === currentCustomer);
  const selectedOptions = filteredOptions.filter((option) => selectedReferences.includes(option.reference));
  const selectedPartner = getPartner(partners, currentCustomer);
  const selectedGstId = billToParty === 'AGENT' ? agentProfile.gstNumber : selectedPartner?.taxOrGstId ?? '';
  const dateFilteredInvoices = invoices.filter((invoice) =>
    (!dateFrom || invoice.date >= dateFrom) && (!dateTo || invoice.date <= dateTo)
  );
  const visibleInvoices = dateFilteredInvoices.filter((invoice) =>
    invoiceFilter === 'ALL' || getInvoiceStatus(invoice) === invoiceFilter
  );
  const totalInvoiced = invoices
    .filter((invoice) => getInvoiceStatus(invoice) !== 'DRAFT' && getInvoiceStatus(invoice) !== 'CANCELLED')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const outstanding = invoices
    .filter((invoice) => !['DRAFT', 'CANCELLED', 'PAID'].includes(getInvoiceStatus(invoice)))
    .reduce((sum, invoice) => sum + (invoice.balanceDue ?? (invoice.paymentStatus === 'PAID' ? 0 : invoice.totalAmount)), 0);

  const changeBillingTrigger = (trigger: InvoiceBillingTrigger) => {
    setSelectedReferences([]);
    setBuyingAmounts({});
    setCustomerName('');
    onBillingTriggerChange(trigger);
  };

  const changeParty = (party: BillToParty) => {
    setBillToParty(party);
    setSelectedReferences([]);
    setCustomerName('');
    setGstType(party === 'AGENT' ? 'CGST_SGST' : 'IGST');
  };

  const changeCustomer = (name: string) => {
    setCustomerName(name);
    setSelectedReferences([]);
    const customerGstId = billToParty === 'AGENT'
      ? agentProfile.gstNumber
      : getPartner(partners, name)?.taxOrGstId ?? '';
    setGstType(inferGstType(customerGstId, agentProfile.gstNumber));
  };

  const toggleShipment = (option: InvoiceOption) => {
    setFormError('');
    setSelectedReferences((current) => {
      if (current.includes(option.reference)) return current.filter((reference) => reference !== option.reference);
      const conflictingRefs = option.hawbNumber
        ? [`MAWB:${option.mawb.mawbNumber}`]
        : option.mawb.hawbs.map((hawb) => `HAWB:${hawb.hawbNumber}`);
      return [...current.filter((reference) => !conflictingRefs.includes(reference)), option.reference];
    });
  };

  const createDraft = () => {
    if (!currentCustomer || selectedOptions.length === 0) {
      setFormError('Choose a bill-to customer and at least one eligible shipment.');
      return;
    }
    if (selectedOptions.some((option) => option.customerName !== currentCustomer)) {
      setFormError('A consolidated invoice can only include shipments for the same customer.');
      return;
    }
    const lines: InvoiceChargeLine[] = [
      { id: 'freight', description: 'Freight', amount: Number(selectedOptions.reduce((sum, option) => sum + option.freight, 0).toFixed(2)) },
      { id: 'fuel', description: 'Fuel surcharge', amount: Number(selectedOptions.reduce((sum, option) => sum + option.fuel, 0).toFixed(2)) },
      { id: 'security', description: 'Security surcharge', amount: Number(selectedOptions.reduce((sum, option) => sum + option.security, 0).toFixed(2)) },
      { id: 'awb-fee', description: 'AWB fee', amount: 0 },
      { id: 'handling', description: 'Handling', amount: selectedOptions.length * 45 },
      { id: 'documentation', description: 'Documentation', amount: 0 },
      { id: 'pickup-delivery', description: 'Pickup / delivery', amount: 0 },
      { id: 'other', description: 'Other charges', amount: 0 },
    ];
    const discountAmount = Math.max(0, Number(discountInput) || 0);
    const gstRate = Math.max(0, Number(gstRateInput) || 0);
    const amounts = calculateInvoiceAmounts(lines, discountAmount, gstRate, gstType);
    const date = today();
    const due = new Date(`${date}T12:00:00`);
    due.setDate(due.getDate() + 30);
    const shipmentDetails: InvoiceShipmentReference[] = selectedOptions.map((option) => ({
      reference: option.reference,
      mawbNumber: option.mawb.mawbNumber,
      hawbNumber: option.hawbNumber,
      flightNumber: option.flightNumber,
      flightDate: option.flightDate,
      origin: option.origin,
      destination: option.destination,
      pieces: option.pieces,
      grossWeightKg: option.grossWeightKg,
      chargeableWeightKg: option.chargeableWeightKg,
      buyingAmount: buyingAmounts[option.reference] === '' || buyingAmounts[option.reference] === undefined
        ? undefined
        : Math.max(0, Number(buyingAmounts[option.reference]) || 0),
      sellingAmount: Number((option.freight + option.fuel + option.security + 45).toFixed(2)),
    }));
    const invoice: InvoiceDraftData = {
      mawbNumber: selectedOptions[0].mawb.mawbNumber,
      customerName: currentCustomer,
      customerAddress: getCustomerAddress(selectedOptions[0].mawb, billToParty, agentProfile),
      customerGstId: selectedGstId,
      sacCode,
      billToParty,
      date,
      dueDate: due.toISOString().slice(0, 10),
      freightCharges: lines[0].amount,
      fuelSurcharge: lines[1].amount,
      securitySurcharge: lines[2].amount,
      handlingCharges: lines[4].amount,
      subtotal: amounts.subtotal,
      discountAmount,
      gstRate,
      gstType,
      gstAmount: amounts.gstAmount,
      cgstAmount: amounts.cgstAmount,
      sgstAmount: amounts.sgstAmount,
      igstAmount: amounts.igstAmount,
      totalAmount: amounts.totalAmount,
      balanceDue: 0,
      chargeLines: lines,
      shipmentDetails,
      remarks: remarksInput.trim(),
      invoiceStatus: 'DRAFT',
      cassReconciliationStatus: 'PENDING_MATCH',
      paymentStatus: 'UNPAID',
      payments: [],
      corrections: [],
      auditLog: [],
    };
    onCreateDraft(invoice);
    setShowNewDraft(false);
    setSelectedReferences([]);
    setCustomerName('');
    setDiscountInput('0');
    setRemarksInput('');
    setFormError('');
  };

  const openInvoice = (invoice: CassInvoice) => {
    setActiveInvoiceId((current) => current === invoice.id ? null : invoice.id);
    setDraftEdit(null);
    setFormError('');
    setPaymentAmount('');
    setTdsAmount('0');
    setCancelReason('');
    setShowCancelForm(false);
    setCorrectionAmount('');
    setCorrectionReason('');
  };

  const startEditingDraft = (invoice: CassInvoice) => {
    setDraftEdit({
      chargeLines: (invoice.chargeLines ?? []).map((line) => ({ ...line })),
      discountAmount: invoice.discountAmount ?? 0,
      gstRate: invoice.gstRate ?? 18,
      gstType: invoice.gstType ?? 'IGST',
      remarks: invoice.remarks ?? '',
      dueDate: invoice.dueDate ?? '',
    });
    setFormError('');
  };

  const saveDraft = (invoice: CassInvoice) => {
    if (!draftEdit) return;
    const lines = draftEdit.chargeLines ?? [];
    const originalLines = invoice.chargeLines ?? [];
    const missingReasons = lines.some((line) => {
      const original = originalLines.find((item) => item.id === line.id);
      const changed = original ? Number(original.amount) !== Number(line.amount) : Number(line.amount) > 0;
      return changed && !line.overrideReason?.trim();
    });
    if (missingReasons) {
      setFormError('Add a reason for every manually overridden charge.');
      return;
    }
    const discountAmount = Math.max(0, Number(draftEdit.discountAmount) || 0);
    const gstRate = Math.max(0, Number(draftEdit.gstRate) || 0);
    const gstType = draftEdit.gstType ?? 'IGST';
    const amounts = calculateInvoiceAmounts(lines, discountAmount, gstRate, gstType);
    const chargeAmount = (id: string) => lines.find((line) => line.id === id)?.amount ?? 0;
    onUpdateDraft(invoice.id, {
      ...draftEdit,
      chargeLines: lines,
      discountAmount,
      gstRate,
      gstType,
      freightCharges: chargeAmount('freight'),
      fuelSurcharge: chargeAmount('fuel'),
      securitySurcharge: chargeAmount('security'),
      handlingCharges: chargeAmount('handling'),
      ...amounts,
    });
    setDraftEdit(null);
    setFormError('');
  };

  const recordPayment = (invoice: CassInvoice) => {
    const amount = Number(paymentAmount);
    const tds = Number(tdsAmount) || 0;
    const balance = invoice.balanceDue ?? invoice.totalAmount;
    if (!Number.isFinite(amount) || amount <= 0 || tds < 0 || amount + tds > balance) {
      setFormError(`Enter a valid payment and TDS amount not exceeding the outstanding ${formatCurrency(balance)}.`);
      return;
    }
    onRegisterPayment(invoice.id, {
      amount,
      tdsAmount: tds,
      mode: paymentMode,
      reference: paymentReference.trim() || undefined,
    });
    setPaymentAmount('');
    setTdsAmount('0');
    setPaymentReference('');
    setFormError('');
  };

  const recordCorrection = (invoice: CassInvoice) => {
    const amount = Number(correctionAmount);
    if (!correctionReason.trim() || !Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter a correction amount and a reason.');
      return;
    }
    onAddCorrection(invoice.id, { type: correctionType, amount, reason: correctionReason.trim() });
    setCorrectionAmount('');
    setCorrectionReason('');
    setFormError('');
  };

  const downloadRegister = () => {
    const reportInvoices = selectedReport === 'INVOICE_REGISTER'
      ? dateFilteredInvoices
      : dateFilteredInvoices.filter((invoice) => !['DRAFT', 'CANCELLED'].includes(getInvoiceStatus(invoice)));
    let rows: (string | number)[][];
    if (selectedReport === 'GST_SALES') {
      rows = [
        ['Invoice Number', 'Invoice Date', 'Customer', 'GSTIN', 'SAC', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total'],
        ...reportInvoices.map((invoice) => [
          invoice.invoiceNumber, invoice.date, invoice.customerName, invoice.customerGstId ?? '',
          invoice.sacCode ?? '996531', invoice.subtotal - (invoice.discountAmount ?? 0),
          invoice.cgstAmount ?? 0, invoice.sgstAmount ?? 0, invoice.igstAmount ?? invoice.gstAmount,
          invoice.totalAmount,
        ]),
      ];
    } else if (selectedReport === 'CUSTOMER_LEDGER') {
      rows = [
        ['Invoice Date', 'Invoice Number', 'Customer', 'Debit', 'Receipts', 'TDS', 'Balance Due'],
        ...reportInvoices.map((invoice) => [
          invoice.date, invoice.invoiceNumber, invoice.customerName, invoice.totalAmount,
          invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) ?? 0,
          invoice.payments?.reduce((sum, payment) => sum + payment.tdsAmount, 0) ?? 0,
          invoice.balanceDue ?? (invoice.paymentStatus === 'PAID' ? 0 : invoice.totalAmount),
        ]),
      ];
    } else if (selectedReport === 'OUTSTANDING') {
      const currentDate = new Date(`${today()}T12:00:00`);
      rows = [
        ['Invoice Number', 'Customer', 'Due Date', 'Balance Due', 'Days Overdue', 'Ageing Bucket'],
        ...reportInvoices.filter((invoice) => getInvoiceStatus(invoice) !== 'PAID').map((invoice) => {
          const dueDate = invoice.dueDate ? new Date(`${invoice.dueDate}T12:00:00`) : currentDate;
          const daysOverdue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / 86400000));
          const bucket = daysOverdue <= 30 ? '0-30' : daysOverdue <= 60 ? '31-60' : daysOverdue <= 90 ? '61-90' : '90+';
          return [
            invoice.invoiceNumber, invoice.customerName, invoice.dueDate ?? '',
            invoice.balanceDue ?? invoice.totalAmount, daysOverdue, bucket,
          ];
        }),
      ];
    } else if (selectedReport === 'SHIPMENT_MARGIN') {
      rows = [
        ['Invoice Number', 'Customer', 'Shipment', 'Selling Amount', 'Buying Amount', 'Indicative Margin'],
        ...reportInvoices.flatMap((invoice) =>
          (invoice.shipmentDetails ?? [])
            .filter((shipment) => shipment.buyingAmount !== undefined)
            .map((shipment) => [
              invoice.invoiceNumber, invoice.customerName, shipment.hawbNumber ?? shipment.mawbNumber,
              shipment.sellingAmount ?? 0, shipment.buyingAmount ?? 0,
              (shipment.sellingAmount ?? 0) - (shipment.buyingAmount ?? 0),
            ])
        ),
      ];
    } else {
      rows = [
        ['Invoice Number', 'Status', 'Customer', 'Shipment', 'Date', 'Due Date', 'Taxable Value', 'GST', 'Total', 'Balance Due'],
        ...reportInvoices.map((invoice) => [
          invoice.invoiceNumber || 'DRAFT',
          getStatusLabel(getInvoiceStatus(invoice)),
          invoice.customerName,
          invoice.shipmentDetails?.map((shipment) => shipment.hawbNumber ?? shipment.mawbNumber).join('; ') ?? invoice.mawbNumber,
          invoice.date,
          invoice.dueDate ?? '',
          invoice.subtotal - (invoice.discountAmount ?? 0),
          invoice.gstAmount,
          invoice.totalAmount,
          invoice.balanceDue ?? (invoice.paymentStatus === 'PAID' ? 0 : invoice.totalAmount),
        ]),
      ];
    }
    const csv = rows.map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReport.toLowerCase().replaceAll('_', '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
            Invoice Generation &amp; Receivables
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create shipment invoices, obtain approval, issue receivables and record settlements.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadRegister} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export report
          </button>
          {canCreateDraft && (
            <button onClick={() => setShowNewDraft((visible) => !visible)} className="inline-flex items-center gap-2 rounded-xl bg-[#2C5EAD] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#234c8d]">
              {showNewDraft ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showNewDraft ? 'Close draft' : 'Create draft'}
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={<ReceiptText className="h-4 w-4 text-[#2C5EAD]" />} title="Invoice register" value={String(invoices.length)} footnote="Includes unnumbered drafts" />
        <SummaryCard icon={<Banknote className="h-4 w-4 text-emerald-600" />} title="Approved & sent" value={formatCurrency(totalInvoiced)} footnote="Excludes drafts and cancelled invoices" />
        <SummaryCard icon={<Scale className="h-4 w-4 text-amber-600" />} title="Outstanding" value={formatCurrency(outstanding)} footnote="Receivables not fully settled" />
      </section>

      {showNewDraft && canCreateDraft && (
        <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create invoice draft</h2>
              <p className="mt-1 text-sm text-slate-500">A draft has no invoice number. Select eligible, not-yet-billed shipments for one customer.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">DRAFT</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="text-xs font-bold text-slate-600">
              Bill-to party
              <select value={billToParty} onChange={(event) => changeParty(event.target.value as BillToParty)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800">
                <option value="SHIPPER">Shipper</option>
                <option value="CONSIGNEE">Consignee</option>
                <option value="AGENT">Issuing agent</option>
              </select>
            </label>
            <label className="text-xs font-bold text-slate-600">
              Customer
              <select value={currentCustomer} onChange={(event) => changeCustomer(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800">
                <option value="">Select a customer</option>
                {customerOptions.map((customer) => <option key={customer} value={customer}>{customer}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-600">
              Place-of-supply GST treatment
              <select value={gstType} onChange={(event) => {
                setGstType(event.target.value as NonNullable<CassInvoice['gstType']>);
              }} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800">
                <option value="CGST_SGST">CGST + SGST</option>
                <option value="IGST">IGST</option>
                <option value="UNREGISTERED">Unregistered customer</option>
                <option value="ZERO_RATED">Zero-rated export / LUT</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-800">Eligible shipments</h3>
                <span className="text-xs text-slate-500">{filteredOptions.length} available</span>
              </div>
              {filteredOptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                  No unbilled shipments match this customer and billing trigger.
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {filteredOptions.map((option) => (
                    <label key={option.reference} className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 hover:bg-slate-50">
                      <input type="checkbox" checked={selectedReferences.includes(option.reference)} onChange={() => toggleShipment(option)} className="mt-1 rounded border-slate-300 text-[#2C5EAD] focus:ring-[#2C5EAD]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-800">{option.label}</span>
                        <span className="block text-xs text-slate-500">{option.origin} → {option.destination} · {option.pieces} pcs · {option.chargeableWeightKg} kg</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-600">{formatCurrency(option.freight + option.fuel + option.security)}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedOptions.length > 0 && (
                <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-600">Airline buying cost (optional, for margin reporting)</p>
                  {selectedOptions.map((option) => (
                    <label key={option.reference} className="flex items-center justify-between gap-3 text-xs text-slate-600">
                      <span className="truncate">{option.label}</span>
                      <input type="number" min="0" step="0.01" value={buyingAmounts[option.reference] ?? ''} onChange={(event) => setBuyingAmounts((current) => ({ ...current, [option.reference]: event.target.value }))} placeholder="Not recorded" className="w-36 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm" aria-label={`${option.label} airline buying cost`} />
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-600">
                  Discount
                  <input type="number" min="0" value={discountInput} onChange={(event) => setDiscountInput(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-600">
                  GST rate %
                  <input type="number" min="0" max="100" value={gstRateInput} readOnly className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </label>
              </div>
              <label className="block text-xs font-bold text-slate-600">
                SAC code
                <input value={sacCode} readOnly className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600" />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Remarks
                <textarea value={remarksInput} onChange={(event) => setRemarksInput(event.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" placeholder="Optional invoice notes" />
              </label>
              {currentCustomer && (
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  GSTIN: {selectedGstId || 'Not provided (unregistered)'} · {selectedOptions.length} shipment(s) selected
                </p>
              )}
            </div>
          </div>
          {formError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{formError}</p>}
          <div className="mt-5 flex justify-end">
            <button onClick={createDraft} disabled={!canCreateDraft || !currentCustomer || selectedOptions.length === 0} className="rounded-xl bg-[#2C5EAD] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              Create unnumbered draft
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Invoice register &amp; receivable ledger</h2>
            <p className="mt-1 text-sm text-slate-500">Review drafts, approve and number invoices, record delivery and allocate receipts.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold text-slate-600">
              From
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs" />
            </label>
            <label className="text-xs font-bold text-slate-600">
              To
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs" />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Status
              <select value={invoiceFilter} onChange={(event) => setInvoiceFilter(event.target.value as typeof invoiceFilter)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs">
              <option value="ALL">All</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="SENT">Sent</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
            <label className="text-xs font-bold text-slate-600">
              Export
              <select value={selectedReport} onChange={(event) => setSelectedReport(event.target.value as InvoiceReport)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs">
                <option value="INVOICE_REGISTER">Invoice register</option>
                <option value="GST_SALES">GST sales register</option>
                <option value="CUSTOMER_LEDGER">Customer ledger</option>
                <option value="OUTSTANDING">Outstanding ageing</option>
                <option value="SHIPMENT_MARGIN">Shipment margin</option>
              </select>
            </label>
          </div>
        </div>

        {visibleInvoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            No invoices in this view. Create a draft from an eligible, unbilled shipment.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleInvoices.map((invoice) => {
              const status = getInvoiceStatus(invoice);
              const opened = activeInvoiceId === invoice.id;
              const isDraft = status === 'DRAFT';
              const invoicePartner = getPartner(partners, invoice.customerName);
              const remaining = invoice.balanceDue ?? (invoice.paymentStatus === 'PAID' ? 0 : invoice.totalAmount);
              const references = invoice.shipmentDetails?.map((shipment) => shipment.hawbNumber ?? shipment.mawbNumber) ?? [invoice.mawbNumber];
              return (
                <article key={invoice.id} data-print-active={opened} className="invoice-print-target overflow-hidden rounded-xl border border-slate-200">
                  <button onClick={() => openInvoice(invoice)} className="grid w-full grid-cols-1 gap-2 p-4 text-left hover:bg-slate-50 sm:grid-cols-[1.4fr_1.2fr_1fr_1fr_auto] sm:items-center">
                    <span>
                      <span className="block font-mono text-sm font-bold text-[#2C5EAD]">{invoice.invoiceNumber || 'Draft · no number'}</span>
                      <span className="mt-1 block text-xs text-slate-500">{invoice.date}</span>
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-800">{invoice.customerName}</span>
                    <span className="truncate text-xs text-slate-500">{references.join(', ')}</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{formatCurrency(invoice.totalAmount)}</span>
                    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      status === 'PAID' ? 'bg-emerald-50 text-emerald-700'
                        : status === 'DRAFT' ? 'bg-amber-50 text-amber-700'
                          : status === 'CANCELLED' ? 'bg-rose-50 text-rose-700'
                            : 'bg-blue-50 text-blue-700'
                    }`}>{getStatusLabel(status)}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${opened ? 'rotate-180' : ''}`} /></span>
                  </button>

                  {opened && (
                    <div className="space-y-5 border-t border-slate-200 bg-slate-50/60 p-4 sm:p-6">
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row">
                          <div>
                            <h2 className="text-lg font-extrabold text-slate-900">{agentProfile.name}</h2>
                            <p className="text-xs text-slate-600">{agentProfile.headOfficeAddress}, {agentProfile.city}, {agentProfile.country}</p>
                            <p className="text-xs text-slate-600">GSTIN {agentProfile.gstNumber} · IATA {agentProfile.iataNumericCode}</p>
                          </div>
                          <div className="sm:text-right">
                            <h3 className="text-lg font-bold uppercase tracking-wider text-[#2C5EAD]">Tax Invoice</h3>
                            <p className="font-mono text-sm font-bold text-slate-800">{invoice.invoiceNumber || 'DRAFT — NO NUMBER'}</p>
                            <p className="text-xs text-slate-600">Invoice date {invoice.date} · Due {invoice.dueDate ?? 'Not set'}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div><p className="text-xs font-bold uppercase text-slate-500">Bill to</p><p className="mt-1 text-sm font-bold text-slate-900">{invoice.customerName}</p><p className="text-xs text-slate-600">{invoice.customerAddress}</p><p className="text-xs text-slate-600">GSTIN {invoice.customerGstId || 'Unregistered'}</p></div>
                          <div><p className="text-xs font-bold uppercase text-slate-500">Invoice total</p><p className="mt-1 text-xl font-extrabold text-slate-900">{formatCurrency(invoice.totalAmount)}</p><p className="text-xs text-slate-600">Taxable {formatCurrency(invoice.subtotal - (invoice.discountAmount ?? 0))} · {invoice.gstType ?? 'GST'} {invoice.gstRate ?? 18}%</p><p className="mt-1 text-xs text-slate-600">{amountInWords(invoice.totalAmount)}</p></div>
                        </div>
                        <table className="mt-5 w-full border-collapse text-sm">
                          <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500"><th className="py-2">Charge description</th><th className="py-2 text-right">Amount</th></tr></thead>
                          <tbody>
                            {(invoice.chargeLines ?? []).map((line) => <tr key={line.id} className="border-b border-slate-100"><td className="py-2">{line.description}</td><td className="py-2 text-right font-mono">{formatCurrency(line.amount)}</td></tr>)}
                            <tr><td className="py-2">Discount</td><td className="py-2 text-right font-mono">−{formatCurrency(invoice.discountAmount ?? 0)}</td></tr>
                            <tr><td className="py-2">Taxable value</td><td className="py-2 text-right font-mono">{formatCurrency(invoice.subtotal - (invoice.discountAmount ?? 0))}</td></tr>
                            <tr><td className="py-2">{invoice.gstType === 'CGST_SGST' ? 'CGST + SGST' : 'IGST'} ({invoice.gstRate ?? 18}%)</td><td className="py-2 text-right font-mono">{formatCurrency(invoice.gstAmount)}</td></tr>
                            <tr className="border-t border-slate-300 font-bold"><td className="py-2">Total amount</td><td className="py-2 text-right font-mono">{formatCurrency(invoice.totalAmount)}</td></tr>
                          </tbody>
                        </table>
                        <p className="mt-4 text-xs text-slate-500">Terms: Payment due by the due date shown above. Drafts are not tax invoices until approved and numbered.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Bill-to</h3>
                          <p className="mt-1 text-sm font-bold text-slate-900">{invoice.customerName}</p>
                          <p className="text-xs text-slate-600">{invoice.customerAddress || 'Address not on record'}</p>
                          <p className="mt-1 text-xs text-slate-600">GSTIN: {invoice.customerGstId || 'Unregistered / not recorded'}</p>
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Shipment details</h3>
                          {(invoice.shipmentDetails ?? []).map((shipment) => (
                            <p key={shipment.reference} className="mt-1 text-xs text-slate-700">
                              <span className="font-bold">{shipment.hawbNumber ?? shipment.mawbNumber}</span> · {shipment.flightNumber ?? 'Flight pending'} · {shipment.origin} → {shipment.destination} · {shipment.pieces} pcs · {shipment.grossWeightKg} kg / {shipment.chargeableWeightKg} kg · buying {shipment.buyingAmount === undefined ? 'not recorded' : formatCurrency(shipment.buyingAmount)}
                            </p>
                          ))}
                          {!invoice.shipmentDetails?.length && <p className="mt-1 text-xs text-slate-700">{invoice.mawbNumber}</p>}
                          {invoice.shipmentDetails?.every((shipment) => shipment.buyingAmount !== undefined) && (
                            <p className="mt-2 text-xs font-bold text-slate-700">
                              Indicative shipment margin before discount / GST: {formatCurrency(invoice.shipmentDetails.reduce((sum, shipment) => sum + (shipment.sellingAmount ?? 0) - (shipment.buyingAmount ?? 0), 0))}
                            </p>
                          )}
                          {invoice.shipmentDetails?.some((shipment) => shipment.buyingAmount !== undefined) && !invoice.shipmentDetails.every((shipment) => shipment.buyingAmount !== undefined) && (
                            <p className="mt-2 text-xs text-amber-700">Complete all airline buying costs to calculate shipment margin.</p>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Tax &amp; due</h3>
                          <p className="mt-1 text-xs text-slate-700">SAC {invoice.sacCode ?? '996531'} · {invoice.gstType ?? 'GST'} {invoice.gstRate ?? 18}%</p>
                          <p className="text-xs text-slate-700">Taxable value: {formatCurrency(invoice.subtotal - (invoice.discountAmount ?? 0))}</p>
                          <p className="text-xs text-slate-700">CGST {formatCurrency(invoice.cgstAmount ?? 0)} · SGST {formatCurrency(invoice.sgstAmount ?? 0)} · IGST {formatCurrency(invoice.igstAmount ?? invoice.gstAmount)}</p>
                          <p className="text-xs text-slate-700">Due: {invoice.dueDate ?? 'Not set'} · Outstanding: {formatCurrency(remaining)}</p>
                        </div>
                      </div>

                      {invoice.remarks && <p className="rounded-lg bg-white p-3 text-sm text-slate-600"><strong>Remarks:</strong> {invoice.remarks}</p>}
                      {invoice.cancellationReason && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"><strong>Cancellation reason:</strong> {invoice.cancellationReason}</p>}
                      {invoice.auditLog && invoice.auditLog.length > 0 && (
                        <details className="rounded-lg border border-slate-200 bg-white p-3">
                          <summary className="cursor-pointer text-xs font-bold text-slate-700">Audit history ({invoice.auditLog.length})</summary>
                          <ul className="mt-2 space-y-1">
                            {invoice.auditLog.map((entry, index) => <li key={`${entry.timestamp}-${index}`} className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()} · {entry.actor} · {entry.action}{entry.details ? ` · ${entry.details}` : ''}</li>)}
                          </ul>
                        </details>
                      )}

                      {isDraft && canCreateDraft && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold text-slate-800">Draft charges</h3>
                            {!draftEdit && <button onClick={() => startEditingDraft(invoice)} className="text-xs font-bold text-[#2C5EAD] hover:underline">Edit draft</button>}
                          </div>
                          {draftEdit ? (
                            <div className="space-y-3">
                              <button onClick={() => setDraftEdit((current) => current ? { ...current, chargeLines: [...(current.chargeLines ?? []), { id: `custom-${Date.now()}`, description: 'Additional charge', amount: 0 }] } : current)} className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-[#2C5EAD]"><Plus className="h-3.5 w-3.5" />Add charge</button>
                              {(draftEdit.chargeLines ?? []).map((line) => {
                                const original = invoice.chargeLines?.find((item) => item.id === line.id);
                                const changed = Boolean(original && Number(line.amount) !== Number(original.amount));
                                return (
                                  <div key={line.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_10rem_1.5fr_auto]">
                                    <input value={line.description} onChange={(event) => setDraftEdit((current) => current ? { ...current, chargeLines: current.chargeLines?.map((item) => item.id === line.id ? { ...item, description: event.target.value } : item) } : current)} aria-label={`${line.description} description`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                                    <input type="number" min="0" value={line.amount} onChange={(event) => setDraftEdit((current) => current ? { ...current, chargeLines: current.chargeLines?.map((item) => item.id === line.id ? { ...item, amount: Number(event.target.value) } : item) } : current)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label={`${line.description} amount`} />
                                    {changed && <input value={line.overrideReason ?? ''} onChange={(event) => setDraftEdit((current) => current ? { ...current, chargeLines: current.chargeLines?.map((item) => item.id === line.id ? { ...item, overrideReason: event.target.value } : item) } : current)} placeholder="Reason required for override" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label={`${line.description} override reason`} />}
                                    <button onClick={() => setDraftEdit((current) => current ? { ...current, chargeLines: current.chargeLines?.filter((item) => item.id !== line.id) } : current)} aria-label={`Remove ${line.description}`} className="rounded-lg border border-slate-200 px-2 text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" /></button>
                                  </div>
                                );
                              })}
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                <label className="text-xs font-bold text-slate-600">Discount<input type="number" min="0" value={draftEdit.discountAmount ?? 0} onChange={(event) => setDraftEdit((current) => current ? { ...current, discountAmount: Number(event.target.value) } : current)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                                <label className="text-xs font-bold text-slate-600">GST %<input type="number" min="0" max="100" disabled={!canManageBillingSettings} value={draftEdit.gstRate ?? 18} onChange={(event) => setDraftEdit((current) => current ? { ...current, gstRate: Number(event.target.value) } : current)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" /></label>
                                <label className="text-xs font-bold text-slate-600">GST treatment<select value={draftEdit.gstType ?? 'IGST'} onChange={(event) => setDraftEdit((current) => current ? { ...current, gstType: event.target.value as NonNullable<CassInvoice['gstType']> } : current)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="CGST_SGST">CGST + SGST</option><option value="IGST">IGST</option><option value="UNREGISTERED">Unregistered</option><option value="ZERO_RATED">Zero-rated / LUT</option></select></label>
                                <label className="text-xs font-bold text-slate-600">Due date<input type="date" value={draftEdit.dueDate ?? ''} onChange={(event) => setDraftEdit((current) => current ? { ...current, dueDate: event.target.value } : current)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                              </div>
                              <label className="block text-xs font-bold text-slate-600">Remarks<textarea rows={2} value={draftEdit.remarks ?? ''} onChange={(event) => setDraftEdit((current) => current ? { ...current, remarks: event.target.value } : current)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setDraftEdit(null); setFormError(''); }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600">Discard edits</button>
                                <button onClick={() => saveDraft(invoice)} className="rounded-lg bg-[#2C5EAD] px-3 py-2 text-xs font-bold text-white">Save draft</button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {(invoice.chargeLines ?? []).map((line) => <div key={line.id} className="flex justify-between gap-4 text-sm text-slate-600"><span>{line.description}</span><span className="font-mono">{formatCurrency(line.amount)}</span></div>)}
                              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-900"><span>Total incl. GST</span><span>{formatCurrency(invoice.totalAmount)}</span></div>
                            </div>
                          )}
                        </div>
                      )}

                      {formError && activeInvoiceId === invoice.id && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{formError}</p>}

                      <div className="flex flex-wrap gap-2">
                        {status === 'DRAFT' && canApproveInvoices && (
                          <button onClick={() => onApproveInvoice(invoice.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" />Approve &amp; number</button>
                        )}
                        {status === 'APPROVED' && canApproveInvoices && (
                          <button onClick={() => onSendInvoice(invoice.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">Record as sent</button>
                        )}
                        {!isDraft && status !== 'CANCELLED' && invoice.invoiceNumber && (
                          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Printer className="h-3.5 w-3.5" />Print / Save PDF</button>
                        )}
                        {['APPROVED', 'SENT', 'PARTIALLY_PAID'].includes(status) && remaining > 0 && (
                          invoicePartner?.email
                            ? <a href={`mailto:${invoicePartner.email}?subject=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Email customer</a>
                            : <span className="self-center text-xs text-slate-500">No customer email on file</span>
                        )}
                        {canApproveInvoices && status !== 'CANCELLED' && (
                          <button onClick={() => { setCancelReason(''); setShowCancelForm(true); setFormError(''); }} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">Cancel invoice</button>
                        )}
                      </div>

                      {status !== 'CANCELLED' && status !== 'DRAFT' && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {canApproveInvoices && remaining > 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <h3 className="mb-3 text-sm font-bold text-slate-800">Record receipt / allocate payment</h3>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-xs font-semibold text-slate-600">Received<input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm" /></label>
                                <label className="text-xs font-semibold text-slate-600">TDS deducted<input type="number" min="0" step="0.01" value={tdsAmount} onChange={(event) => setTdsAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm" /></label>
                                <label className="text-xs font-semibold text-slate-600">Payment mode<select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as InvoicePayment['mode'])} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option><option value="BANK_TRANSFER">Bank transfer</option><option value="UPI">UPI</option></select></label>
                                <label className="text-xs font-semibold text-slate-600">Reference<input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm" /></label>
                              </div>
                              <button onClick={() => recordPayment(invoice)} className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Allocate receipt</button>
                            </div>
                          ) : null}
                          {canApproveInvoices && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <h3 className="mb-3 text-sm font-bold text-slate-800">Credit / debit note</h3>
                              <div className="grid grid-cols-2 gap-2">
                                <select value={correctionType} onChange={(event) => setCorrectionType(event.target.value as InvoiceCorrection['type'])} className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm"><option value="CREDIT_NOTE">Credit note</option><option value="DEBIT_NOTE">Debit note</option></select>
                                <input aria-label="Correction amount" type="number" min="0.01" step="0.01" value={correctionAmount} onChange={(event) => setCorrectionAmount(event.target.value)} placeholder="Amount" className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm" />
                              </div>
                              <input value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} placeholder="Reason required" className="mt-2 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm" />
                              <button onClick={() => recordCorrection(invoice)} className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Issue correction</button>
                              {(invoice.corrections ?? []).map((correction) => <p key={correction.id} className="mt-2 text-xs text-slate-500">{correction.number} · {correction.type.replace('_', ' ')} · {formatCurrency(correction.amount)} · {correction.reason}</p>)}
                            </div>
                          )}
                          {invoice.payments && invoice.payments.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <h3 className="text-sm font-bold text-slate-800">Receipt allocation history</h3>
                              {invoice.payments.map((payment) => <p key={payment.id} className="mt-2 text-xs text-slate-500">{payment.date} · {payment.mode.replace('_', ' ')} · {formatCurrency(payment.amount)} received · TDS {formatCurrency(payment.tdsAmount)}{payment.reference ? ` · ${payment.reference}` : ''}</p>)}
                            </div>
                          )}
                        </div>
                      )}

                      {canApproveInvoices && status !== 'CANCELLED' && showCancelForm && (
                        <label className="block max-w-2xl text-xs font-bold text-slate-600">
                          Cancellation reason (required)
                          <div className="mt-1 flex gap-2">
                            <input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Enter reason before cancelling" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" />
                            <button onClick={() => cancelReason.trim() && onCancelInvoice(invoice.id, cancelReason.trim())} disabled={!cancelReason.trim()} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">Confirm cancellation</button>
                          </div>
                        </label>
                      )}
                      {canManageBillingSettings && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          Billing trigger is managed by Admin.
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-3 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-[#2C5EAD]" /><h2 className="font-bold text-slate-900">Workflow &amp; access</h2></div>
          <p className="text-sm leading-6 text-slate-600">Only unbilled AWBs are selectable. Operations prepares editable, unnumbered drafts; Accounts / Admin approves and controls issue, cancellation and credit / debit notes. Approval locks the invoice and posts the receivable. Every action is audit logged.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {invoiceSteps.map((step, index) => <React.Fragment key={step}><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{index + 1}. {step}</span>{index < invoiceSteps.length - 1 && <ArrowRight className="h-3 w-3 text-slate-300" />}</React.Fragment>)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-slate-900">Billing settings &amp; reports</h2></div>
          <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            Billing trigger
            <select disabled={!canManageBillingSettings} value={billingTrigger} onChange={(event) => changeBillingTrigger(event.target.value as InvoiceBillingTrigger)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:bg-slate-100">
              <option value="ISSUED">On AWB issue</option><option value="MANIFESTED">On manifest</option><option value="DEPARTED">On flight departure</option>
            </select>
          </label>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600">
              Default GST rate (%)
              <input key={defaultGstRate} type="number" min="0" max="100" disabled={!canManageBillingSettings} defaultValue={String(defaultGstRate)} onBlur={(event) => {
                const value = event.currentTarget.value;
                const rate = Number(value);
                if (value !== '' && Number.isFinite(rate) && rate >= 0 && rate <= 100) onGstRateChange(rate);
                else event.currentTarget.value = String(defaultGstRate);
              }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Default SAC code
              <input key={sacCode} disabled={!canManageBillingSettings} defaultValue={sacCode} onBlur={(event) => {
                const value = event.currentTarget.value.trim();
                if (/^[A-Za-z0-9-]{2,20}$/.test(value)) onSacCodeChange(value);
                else event.currentTarget.value = sacCode;
              }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" />
            </label>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">Export the GST sales register, customer ledger, outstanding ageing (0–30 / 31–60 / 61–90 / 90+ days), and shipment margin reports using the date range above. Buying rates are not estimated when they are absent from shipment data.</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="h-4 w-4 shrink-0" />Financial-year numbering is sequential; cancelled invoice numbers remain reserved.</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><FileCheck2 className="h-4 w-4 shrink-0" />CSV register export opens in Excel; use Print / Save PDF for invoice output.</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><FileText className="h-4 w-4 shrink-0" />{actor} · front-end audit history recorded with invoice actions</div>
        </div>
      </section>
    </div>
  );
};

const SummaryCard: React.FC<{ icon: React.ReactNode; title: string; value: string; footnote: string }> = ({ icon, title, value, footnote }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">{icon}{title}</div>
    <p className="mt-3 text-2xl font-extrabold font-mono text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{footnote}</p>
  </div>
);
