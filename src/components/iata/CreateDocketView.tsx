'use client';

import React, { useState } from 'react';
import { 
  DocketItem, 
  DocketServiceMode, 
  DocketPaymentMode, 
  SpecialHandlingCode, 
  DimensionEntry, 
  Airport, 
  ShipperConsignee, 
  calculateVolumetricWeight 
} from '@/types/iata';
import { 
  FileText, 
  Plus, 
  Printer, 
  Trash2, 
  Calculator, 
  Search, 
  CheckCircle2, 
  Layers, 
  Plane, 
  Building2, 
  Clock, 
  AlertCircle,
  X
} from 'lucide-react';

interface CreateDocketViewProps {
  dockets: DocketItem[];
  airports: Airport[];
  partners: ShipperConsignee[];
  availableAwbCount: number;
  onCreateDocket: (docket: Omit<DocketItem, 'id' | 'createdAt' | 'status'>) => void;
  onAssignAwbToDocket: (docket: DocketItem) => void;
}

export const CreateDocketView: React.FC<CreateDocketViewProps> = ({
  dockets,
  airports,
  partners,
  availableAwbCount,
  onCreateDocket,
  onAssignAwbToDocket,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'registry'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [origin, setOrigin] = useState('DEL');
  const [destination, setDestination] = useState('FRA');
  const [serviceMode, setServiceMode] = useState<DocketServiceMode>('EXPRESS_AIR');
  const [paymentMode, setPaymentMode] = useState<DocketPaymentMode>('ON_ACCOUNT');
  
  // Consignor & Consignee
  const [consignorName, setConsignorName] = useState('');
  const [consignorAddress, setConsignorAddress] = useState('');
  const [consignorPhone, setConsignorPhone] = useState('');
  const [consignorGst, setConsignorGst] = useState('');

  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [consigneeGst, setConsigneeGst] = useState('');

  // Package & Commodities
  const [packageType, setPackageType] = useState('Carton / Box');
  const [natureOfGoods, setNatureOfGoods] = useState('Industrial High-Precision Equipment');
  const [handlingCode, setHandlingCode] = useState<SpecialHandlingCode>('GEN');
  const [declaredValue, setDeclaredValue] = useState(250000);
  const [ewayBillNumber, setEwayBillNumber] = useState('');
  const [ratePerKg, setRatePerKg] = useState(195);
  const [docketFee, setDocketFee] = useState(250);

  // Dimensions & Weight
  const [actualWeightKg, setActualWeightKg] = useState(120);
  const [dimensions, setDimensions] = useState<DimensionEntry[]>([
    { lengthCm: 80, widthCm: 60, heightCm: 50, pieces: 2 },
  ]);

  // Modals
  const [selectedDocketForPrint, setSelectedDocketForPrint] = useState<DocketItem | null>(null);
  const [printCopyType, setPrintCopyType] = useState<'CONSIGNOR' | 'CONSIGNEE' | 'OFFICE'>('CONSIGNOR');

  // Calculations
  const volumetricWeightKg = calculateVolumetricWeight(dimensions);
  const totalPieces = dimensions.reduce((acc, dim) => acc + (Number(dim.pieces) || 0), 0);
  const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeightKg);
  
  const freightAmount = Math.round(chargeableWeightKg * ratePerKg);
  const fuelSurcharge = Math.round(freightAmount * 0.11); // 11% fuel surcharge
  const securitySurcharge = Math.round(freightAmount * 0.04); // 4% security surcharge
  const subtotal = freightAmount + docketFee + fuelSurcharge + securitySurcharge;
  const gstAmount = Math.round(subtotal * 0.18); // 18% GST
  const totalAmount = subtotal + gstAmount;

  // Handlers for quick auto-fill from trading partners
  const handleSelectConsignor = (partnerId: string) => {
    const p = partners.find(item => item.id === partnerId);
    if (p) {
      setConsignorName(p.name);
      setConsignorAddress(`${p.address}, ${p.city}`);
      setConsignorPhone(p.phone);
      setConsignorGst(p.taxOrGstId);
    }
  };

  const handleSelectConsignee = (partnerId: string) => {
    const p = partners.find(item => item.id === partnerId);
    if (p) {
      setConsigneeName(p.name);
      setConsigneeAddress(`${p.address}, ${p.city}`);
      setConsigneePhone(p.phone);
      setConsigneeGst(p.taxOrGstId);
    }
  };

  const handleAddDimensionRow = () => {
    setDimensions([...dimensions, { lengthCm: 50, widthCm: 50, heightCm: 50, pieces: 1 }]);
  };

  const handleRemoveDimensionRow = (index: number) => {
    if (dimensions.length <= 1) return;
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const handleUpdateDimension = (index: number, field: keyof DimensionEntry, value: number) => {
    const updated = [...dimensions];
    updated[index] = { ...updated[index], [field]: value };
    setDimensions(updated);
  };

  const handleSubmitDocket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consignorName || !consigneeName) return;

    // Deterministic docket sequence
    const generatedDocketNumber = `DKT-${origin}-${destination}-${Math.floor(100000 + Math.random() * 900000)}`;

    onCreateDocket({
      docketNumber: generatedDocketNumber,
      bookingDate: new Date().toISOString().split('T')[0],
      serviceMode,
      paymentMode,
      origin,
      destination,
      consignorName,
      consignorAddress,
      consignorPhone,
      consignorGst,
      consigneeName,
      consigneeAddress,
      consigneePhone,
      consigneeGst,
      pieces: totalPieces || 1,
      packageType,
      actualWeightKg,
      dimensions,
      volumetricWeightKg,
      chargeableWeightKg,
      natureOfGoods,
      handlingCode,
      declaredValue,
      ewayBillNumber: ewayBillNumber.trim() || undefined,
      ratePerKg,
      freightAmount,
      docketFee,
      fuelSurcharge,
      securitySurcharge,
      subtotal,
      gstAmount,
      totalAmount,
    });

    // Reset Form or Switch to registry
    setActiveTab('registry');
  };

  const filteredDockets = dockets.filter(docket => {
    const matchesSearch = 
      docket.docketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docket.consignorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docket.consigneeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (docket.assignedAwb && docket.assignedAwb.includes(searchQuery));

    const matchesStatus = statusFilter === 'ALL' || docket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-heading">
            Cargo Docket & Consignment Note
          </h1>
          <p className="text-base text-slate-500 mt-2 font-sans">
            Counter shipment intake, dimensional volumetric cubing (L×W×H÷6000), statutory E-Way bill mapping, and AWB allocation.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-white text-[#2C5EAD] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4 text-[#1591DC]" />
            New Docket Entry
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'registry'
                ? 'bg-white text-[#2C5EAD] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-[#1591DC]" />
            Docket Registry ({dockets.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CREATE NEW DOCKET */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmitDocket} className="space-y-8">
          {/* Section 1: General & Route Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD] flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">Route & Service Configuration</h2>
                  <p className="text-xs text-slate-500 font-sans">Specify transit corridor, priority classification, and freight payment term.</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{availableAwbCount} AWB Numbers in Stock</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Origin Station (Port) *
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-[#2C5EAD] focus:ring-2 focus:ring-[#2C5EAD] focus:outline-none"
                >
                  {airports.map((port) => (
                    <option key={port.iataCode} value={port.iataCode}>
                      {port.iataCode} - {port.city} ({port.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Destination Station *
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-[#1591DC] focus:ring-2 focus:ring-[#1591DC] focus:outline-none"
                >
                  {airports.map((port) => (
                    <option key={port.iataCode} value={port.iataCode}>
                      {port.iataCode} - {port.city} ({port.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Service Speed / Mode *
                </label>
                <select
                  value={serviceMode}
                  onChange={(e) => setServiceMode(e.target.value as DocketServiceMode)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#2C5EAD] focus:outline-none"
                >
                  <option value="EXPRESS_AIR">Air Express (Next Day Uplift)</option>
                  <option value="STANDARD_AIR">Standard Air Cargo</option>
                  <option value="PRIORITY_AOG">Aircraft On Ground (AOG Critical)</option>
                  <option value="COLD_CHAIN">Cold Chain Temperature Controlled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as DocketPaymentMode)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#2C5EAD] focus:outline-none"
                >
                  <option value="ON_ACCOUNT">On Account (Monthly Billing)</option>
                  <option value="PREPAID">Prepaid (Paid by Shipper)</option>
                  <option value="TO_PAY">To-Pay (Collect at Destination)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Consignor & Consignee */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Consignor (Shipper) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 font-heading text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2C5EAD]" />
                  Consignor (Shipper) Details
                </h3>
                <select
                  onChange={(e) => handleSelectConsignor(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-slate-700"
                >
                  <option value="">Quick Pick Shipper...</option>
                  {partners.filter(p => p.type === 'SHIPPER' || p.type === 'BOTH').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Consignor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AeroTech Precision Parts Ltd"
                    value={consignorName}
                    onChange={(e) => setConsignorName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address & City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot 45, Phase 2, Udyog Vihar, Gurugram"
                    value={consignorAddress}
                    onChange={(e) => setConsignorAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91-98110-44921"
                      value={consignorPhone}
                      onChange={(e) => setConsignorPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      placeholder="06AAACP4920B1Z4"
                      value={consignorGst}
                      onChange={(e) => setConsignorGst(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consignee */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 font-heading text-base flex items-center gap-2">
                  <Plane className="w-4 h-4 text-[#1591DC]" />
                  Consignee (Receiver) Details
                </h3>
                <select
                  onChange={(e) => handleSelectConsignee(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-slate-700"
                >
                  <option value="">Quick Pick Consignee...</option>
                  {partners.filter(p => p.type === 'CONSIGNEE' || p.type === 'BOTH').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Consignee Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Global Turbine Overhaul GmbH"
                    value={consigneeName}
                    onChange={(e) => setConsigneeName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Address & Destination City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tor 26, CargoCity Sued, 60549 Frankfurt"
                    value={consigneeAddress}
                    onChange={(e) => setConsigneeAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+49-69-690-34900"
                      value={consigneePhone}
                      onChange={(e) => setConsigneePhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tax ID / VAT No</label>
                    <input
                      type="text"
                      placeholder="DE814920491"
                      value={consigneeGst}
                      onChange={(e) => setConsigneeGst(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Package Dimensions & IATA Volumetric Calculator */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD] flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">
                    Dimensions, Volumetric Weight &amp; Commodity
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Standard IATA volumetric weight formula: (L × W × H in cm × Pieces) ÷ 6000
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddDimensionRow}
                className="px-3.5 py-1.5 bg-[#1591DC]/10 hover:bg-[#1591DC]/20 text-[#2C5EAD] border border-[#1591DC]/30 rounded-xl text-xs font-bold font-heading flex items-center gap-1.5 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add Dimension Row
              </button>
            </div>

            {/* Dimension Entries Table */}
            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-12 gap-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span className="col-span-3">Length (cm)</span>
                <span className="col-span-3">Width (cm)</span>
                <span className="col-span-3">Height (cm)</span>
                <span className="col-span-2">Pieces</span>
                <span className="col-span-1 text-center">Action</span>
              </div>

              {dimensions.map((dim, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 items-center">
                  <div className="md:col-span-3">
                    <label className="block md:hidden text-xs font-semibold text-slate-600 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={dim.lengthCm}
                      onChange={(e) => handleUpdateDimension(idx, 'lengthCm', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-semibold"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block md:hidden text-xs font-semibold text-slate-600 mb-1">Width (cm)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={dim.widthCm}
                      onChange={(e) => handleUpdateDimension(idx, 'widthCm', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-semibold"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block md:hidden text-xs font-semibold text-slate-600 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={dim.heightCm}
                      onChange={(e) => handleUpdateDimension(idx, 'heightCm', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-semibold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block md:hidden text-xs font-semibold text-slate-600 mb-1">Pieces</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={dim.pieces}
                      onChange={(e) => handleUpdateDimension(idx, 'pieces', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-semibold"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      disabled={dimensions.length <= 1}
                      onClick={() => handleRemoveDimensionRow(idx)}
                      className={`p-2 rounded-lg transition-colors ${
                        dimensions.length <= 1
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-rose-500 hover:bg-rose-50'
                      }`}
                      title="Remove dimension line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Weight Slabs & Calculation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gradient-to-r from-blue-50/60 to-sky-50/60 rounded-2xl border border-blue-200">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Pieces</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">{totalPieces} Pcs</span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Actual Gross Weight</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={1}
                    required
                    value={actualWeightKg}
                    onChange={(e) => setActualWeightKg(Number(e.target.value))}
                    className="w-24 px-2.5 py-1 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white text-base"
                  />
                  <span className="text-sm font-semibold text-slate-600">kg</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Volumetric (L×W×H÷6000)</span>
                <span className="text-xl font-bold font-mono text-[#1591DC] mt-1 block">
                  {volumetricWeightKg} kg
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chargeable Weight (Locked)</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-2xl font-bold font-mono text-[#2C5EAD]">
                    {chargeableWeightKg} kg
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2C5EAD] text-white font-bold">
                    {chargeableWeightKg === volumetricWeightKg ? 'VOL' : 'ACT'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commodity, Package Type & E-Way Bill */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Packaging Type *</label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="Carton / Box">Carton / Corrugated Box</option>
                  <option value="Wooden Crate">Reinforced Wooden Crate</option>
                  <option value="Pallet">Standard Euro / Cargo Pallet</option>
                  <option value="Insulated Envirotainer">Insulated Cold-Chain Envirotainer</option>
                  <option value="Steel Drum">Industrial Steel Drum</option>
                  <option value="Loose / Gunny Bag">Loose / Gunny Bags</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Handling Code</label>
                <select
                  value={handlingCode}
                  onChange={(e) => setHandlingCode(e.target.value as SpecialHandlingCode)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold text-[#2C5EAD]"
                >
                  <option value="GEN">GEN - General Cargo</option>
                  <option value="PER">PER - Perishable Goods</option>
                  <option value="DGR">DGR - Dangerous Goods (IATA DGR)</option>
                  <option value="VAL">VAL - Valuable / High Value Cargo</option>
                  <option value="AVI">AVI - Live Animals</option>
                  <option value="COL">COL - Cold Storage (+2°C to +8°C)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Declared Value for Carriage (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GST E-Way Bill Number</label>
                <input
                  type="text"
                  placeholder="e.g. 281940182901"
                  value={ewayBillNumber}
                  onChange={(e) => setEwayBillNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nature and Quantity of Goods *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aircraft Engine Replacement Blades & High Tension Sensors"
                  value={natureOfGoods}
                  onChange={(e) => setNatureOfGoods(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Freight Tariff & Grand Total Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD] flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-heading">Freight Charges, GST &amp; Grand Total</h2>
                <p className="text-xs text-slate-500 font-sans">Automated statutory calculation with 18% GST and fuel surcharges.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rate per Kg (₹) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-[#2C5EAD] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Docket / Stationery Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={docketFee}
                  onChange={(e) => setDocketFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Surcharge (11%)</label>
                <div className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-700 text-sm">
                  ₹ {fuelSurcharge.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Security Surcharge (4%)</label>
                <div className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-700 text-sm">
                  ₹ {securitySurcharge.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Total Billing Ribbon */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-medium text-slate-400">Total Payable Amount (incl. 18% GST)</span>
                <div className="text-3xl font-extrabold font-mono text-[#1591DC]">
                  ₹ {totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">
                  Subtotal: ₹{subtotal.toLocaleString()} + CGST/SGST (18%): ₹{gstAmount.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:from-[#204580] hover:to-[#0f7ab9] text-white font-bold font-heading text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Generate &amp; Save Docket
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: DOCKET REGISTRY & CONSIGNMENT NOTE TABLE */}
      {activeTab === 'registry' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search docket #, consignor, consignee, or AWB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-sans"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="BOOKED">Booked (Ready for AWB)</option>
                <option value="AWB_ASSIGNED">AWB Assigned</option>
                <option value="MANIFESTED">Manifested</option>
                <option value="IN_TRANSIT">In-Transit</option>
                <option value="DELIVERED">Delivered</option>
              </select>

              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Docket
              </button>
            </div>
          </div>

          {/* Dockets Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Docket Number</th>
                  <th className="py-3.5 px-6">Route</th>
                  <th className="py-3.5 px-6">Shipper / Consignee</th>
                  <th className="py-3.5 px-6">Pieces &amp; Weight</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status / AWB Link</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDockets.map((docket) => (
                  <tr key={docket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-[#2C5EAD]">
                        {docket.docketNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {docket.bookingDate} • {docket.serviceMode.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{docket.origin}</span>
                        <span className="text-slate-400">→</span>
                        <span>{docket.destination}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-sans">{docket.paymentMode}</span>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{docket.consignorName}</div>
                      <div className="text-xs text-slate-500 truncate">To: {docket.consigneeName}</div>
                    </td>

                    <td className="py-4 px-6 font-mono">
                      <div className="text-slate-900 font-bold">{docket.pieces} pcs • {docket.chargeableWeightKg} kg</div>
                      <div className="text-[11px] text-slate-400">Act: {docket.actualWeightKg}kg / Vol: {docket.volumetricWeightKg}kg</div>
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      ₹ {docket.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-4 px-6">
                      {docket.assignedAwb ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#2C5EAD] border border-blue-200">
                            AWB: {docket.assignedAwb}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {docket.status}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!docket.assignedAwb && (
                          <button
                            onClick={() => onAssignAwbToDocket(docket)}
                            className="px-3 py-1.5 rounded-lg bg-[#2C5EAD]/10 hover:bg-[#2C5EAD]/20 text-[#2C5EAD] text-xs font-bold transition-all flex items-center gap-1"
                            title="Assign Air Waybill Number from available stock"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            Assign AWB
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDocketForPrint(docket)}
                          className="px-3 py-1.5 rounded-lg bg-[#2C5EAD] hover:bg-[#204580] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                          title="Print 3-Ply Consignment Docket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: 3-PLY PRINT DOCKET & CONSIGNMENT NOTE */}
      {selectedDocketForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <Printer className="w-6 h-6 text-[#2C5EAD]" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-heading">
                    Air Cargo Consignment Docket Note
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Docket ID: {selectedDocketForPrint.docketNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Copy selector */}
                <select
                  value={printCopyType}
                  onChange={(e) => setPrintCopyType(e.target.value as 'CONSIGNOR' | 'CONSIGNEE' | 'OFFICE')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold font-heading bg-white text-slate-800"
                >
                  <option value="CONSIGNOR">Consignor Copy (Shipper)</option>
                  <option value="CONSIGNEE">Consignee Copy (POD Delivery)</option>
                  <option value="OFFICE">Station / Office Copy</option>
                </select>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#2C5EAD] hover:bg-[#204580] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Note
                </button>

                <button
                  onClick={() => setSelectedDocketForPrint(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Docket Foil Document */}
            <div className="p-8 border-2 border-slate-800 rounded-xl bg-white space-y-6 font-sans text-slate-900 print:border-black">
              {/* Top Banner */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-2xl font-heading text-[#2C5EAD] tracking-tight">
                      APEX GLOBAL CARGO LOGISTICS
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 font-bold border border-slate-300">
                      IATA 14-3-9821
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Air Cargo Terminal, Indira Gandhi International Airport, New Delhi - 110037
                  </p>
                  <p className="text-xs text-slate-500 font-mono">GSTIN: 07AAACA9921D1Z8 • Phone: +91-11-2565-9800</p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-heading px-2.5 py-1 rounded bg-slate-900 text-white inline-block mb-1">
                    {printCopyType === 'CONSIGNOR' ? 'ORIGINAL - CONSIGNOR COPY' : printCopyType === 'CONSIGNEE' ? 'ORIGINAL - PROOF OF DELIVERY' : 'STATION / AUDIT COPY'}
                  </div>
                  <div className="font-mono text-xl font-bold text-slate-900 tracking-wider">
                    {selectedDocketForPrint.docketNumber}
                  </div>
                  <div className="text-xs font-mono text-slate-500">Date: {selectedDocketForPrint.bookingDate}</div>
                </div>
              </div>

              {/* Route & AWB link */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Origin Airport</span>
                  <strong className="text-base text-[#2C5EAD]">{selectedDocketForPrint.origin}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Destination Airport</span>
                  <strong className="text-base text-[#1591DC]">{selectedDocketForPrint.destination}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Assigned MAWB</span>
                  <strong className="text-sm text-slate-900">{selectedDocketForPrint.assignedAwb || 'Pending Assignment'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Mode</span>
                  <strong className="text-sm text-slate-900">{selectedDocketForPrint.paymentMode}</strong>
                </div>
              </div>

              {/* Consignor & Consignee boxes */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="p-4 border border-slate-300 rounded-lg space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Consignor (Shipper)</span>
                  <div className="font-bold text-sm text-slate-900">{selectedDocketForPrint.consignorName}</div>
                  <p className="text-slate-600">{selectedDocketForPrint.consignorAddress}</p>
                  <p className="font-mono text-slate-700">Phone: {selectedDocketForPrint.consignorPhone}</p>
                  <p className="font-mono text-slate-700 font-semibold">GSTIN: {selectedDocketForPrint.consignorGst}</p>
                </div>

                <div className="p-4 border border-slate-300 rounded-lg space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Consignee (Delivery Party)</span>
                  <div className="font-bold text-sm text-slate-900">{selectedDocketForPrint.consigneeName}</div>
                  <p className="text-slate-600">{selectedDocketForPrint.consigneeAddress}</p>
                  <p className="font-mono text-slate-700">Phone: {selectedDocketForPrint.consigneePhone}</p>
                  <p className="font-mono text-slate-700 font-semibold">GST/Tax ID: {selectedDocketForPrint.consigneeGst}</p>
                </div>
              </div>

              {/* Goods & Dimensions */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Commodity Description</th>
                      <th className="p-2.5">Packaging</th>
                      <th className="p-2.5 text-center">Pieces</th>
                      <th className="p-2.5 text-right">Actual Wt</th>
                      <th className="p-2.5 text-right">Volumetric Wt</th>
                      <th className="p-2.5 text-right">Chargeable Wt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200">
                      <td className="p-2.5 font-semibold text-slate-900">
                        {selectedDocketForPrint.natureOfGoods}
                        <span className="block text-[11px] text-slate-500 font-mono">Special Handling: {selectedDocketForPrint.handlingCode}</span>
                      </td>
                      <td className="p-2.5 text-slate-700">{selectedDocketForPrint.packageType}</td>
                      <td className="p-2.5 font-mono text-center font-bold text-base">{selectedDocketForPrint.pieces}</td>
                      <td className="p-2.5 font-mono text-right">{selectedDocketForPrint.actualWeightKg} kg</td>
                      <td className="p-2.5 font-mono text-right text-slate-500">{selectedDocketForPrint.volumetricWeightKg} kg</td>
                      <td className="p-2.5 font-mono text-right font-bold text-base text-[#2C5EAD]">{selectedDocketForPrint.chargeableWeightKg} kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Commercials Summary */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="text-xs space-y-1.5 text-slate-600 font-mono">
                  {selectedDocketForPrint.ewayBillNumber && (
                    <div>E-Way Bill: <strong>{selectedDocketForPrint.ewayBillNumber}</strong></div>
                  )}
                  <div>Declared Value for Carriage: <strong>₹{selectedDocketForPrint.declaredValue.toLocaleString()}</strong></div>
                  <div className="pt-2 text-[10px] text-slate-500 font-sans leading-relaxed">
                    Subject to standard conditions of air carriage. The carrier certifies that the goods described above have been received in apparent good order and condition.
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Freight Charge ({selectedDocketForPrint.chargeableWeightKg} kg @ ₹{selectedDocketForPrint.ratePerKg}):</span>
                    <span>₹{selectedDocketForPrint.freightAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Docket / Stationery Fee:</span>
                    <span>₹{selectedDocketForPrint.docketFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fuel Surcharge (11%):</span>
                    <span>₹{selectedDocketForPrint.fuelSurcharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Security Surcharge (4%):</span>
                    <span>₹{selectedDocketForPrint.securitySurcharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-slate-200 pt-1">
                    <span>Taxable Value:</span>
                    <span>₹{selectedDocketForPrint.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST @ 18%:</span>
                    <span>₹{selectedDocketForPrint.gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#2C5EAD] border-t-2 border-slate-800 pt-1">
                    <span>Grand Total:</span>
                    <span>₹{selectedDocketForPrint.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-xs text-center font-sans">
                <div className="space-y-8">
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <span className="text-slate-600">Consignor / Shipper Signature</span>
                </div>
                <div className="space-y-8">
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <span className="text-slate-600">Driver / Pick-up Executive</span>
                </div>
                <div className="space-y-8">
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <span className="text-slate-600">Authorized Cargo Receiving Officer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
