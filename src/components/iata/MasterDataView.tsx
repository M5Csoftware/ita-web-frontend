'use client';

import React, { useState } from 'react';
import { 
  Airline, 
  Airport, 
  ShipperConsignee, 
  IssuingAgentProfile 
} from '@/types/iata';
import { 
  Building2, 
  Plane, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  Package, 
  Phone, 
  Mail, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface MasterDataViewProps {
  airlines: Airline[];
  airports: Airport[];
  partners: ShipperConsignee[];
  agentProfile: IssuingAgentProfile;
  onAddAirline: (airline: Airline) => void;
  onAddAirport: (airport: Airport) => void;
  onAddPartner: (partner: ShipperConsignee) => void;
  onUpdateAgentProfile: (profile: IssuingAgentProfile) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  airlines,
  airports,
  partners,
  agentProfile,
  onAddAirline,
  onAddAirport,
  onAddPartner,
  onUpdateAgentProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'agent' | 'airlines' | 'airports' | 'partners' | 'handling'>('agent');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [showAirportModal, setShowAirportModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Form states
  const [newAirline, setNewAirline] = useState<Partial<Airline>>({ prefix: '', code: '', name: '', country: '' });
  const [newAirport, setNewAirport] = useState<Partial<Airport>>({ iataCode: '', name: '', city: '', country: '' });
  const [newPartner, setNewPartner] = useState<Partial<ShipperConsignee>>({
    type: 'SHIPPER',
    name: '',
    accountNumber: '',
    address: '',
    city: '',
    country: '',
    contactPerson: '',
    phone: '',
    email: '',
    taxOrGstId: ''
  });

  const [agentForm, setAgentForm] = useState<IssuingAgentProfile>(agentProfile);
  const [agentSavedNotification, setAgentSavedNotification] = useState(false);

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAgentProfile(agentForm);
    setAgentSavedNotification(true);
    setTimeout(() => setAgentSavedNotification(false), 3000);
  };

  const handleCreateAirline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAirline.prefix || !newAirline.code || !newAirline.name) return;
    onAddAirline({
      prefix: newAirline.prefix.trim().padStart(3, '0'),
      code: newAirline.code.trim().toUpperCase(),
      name: newAirline.name.trim(),
      country: newAirline.country?.trim() || 'Global'
    });
    setNewAirline({ prefix: '', code: '', name: '', country: '' });
    setShowAirlineModal(false);
  };

  const handleCreateAirport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAirport.iataCode || !newAirport.name) return;
    onAddAirport({
      iataCode: newAirport.iataCode.trim().toUpperCase(),
      name: newAirport.name.trim(),
      city: newAirport.city?.trim() || '',
      country: newAirport.country?.trim() || ''
    });
    setNewAirport({ iataCode: '', name: '', city: '', country: '' });
    setShowAirportModal(false);
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.address) return;
    onAddPartner({
      id: `prt-${Date.now()}`,
      type: newPartner.type || 'SHIPPER',
      name: newPartner.name.trim(),
      accountNumber: newPartner.accountNumber?.trim() || `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
      address: newPartner.address.trim(),
      city: newPartner.city?.trim() || '',
      country: newPartner.country?.trim() || '',
      contactPerson: newPartner.contactPerson?.trim() || '',
      phone: newPartner.phone?.trim() || '',
      email: newPartner.email?.trim() || '',
      taxOrGstId: newPartner.taxOrGstId?.trim() || ''
    });
    setNewPartner({
      type: 'SHIPPER',
      name: '',
      accountNumber: '',
      address: '',
      city: '',
      country: '',
      contactPerson: '',
      phone: '',
      email: '',
      taxOrGstId: ''
    });
    setShowPartnerModal(false);
  };

  const filteredAirlines = airlines.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.prefix.includes(searchQuery) || 
    a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAirports = airports.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.iataCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.taxOrGstId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const specialHandlingCodes = [
    { code: 'GEN', name: 'General Cargo', desc: 'Standard consolidated freight without special temperature or security restrictions.' },
    { code: 'PER', name: 'Perishable Goods', desc: 'Temperature-sensitive pharmaceuticals, fresh food, or live flora requiring cold chain.' },
    { code: 'DGR', name: 'Dangerous Goods', desc: 'IATA DGR Regulated hazardous chemicals, lithium batteries, and flammable cargo.' },
    { code: 'VAL', name: 'Valuable Cargo', desc: 'Secured vault transport, banknotes, precious metals, and high-value microchips.' },
    { code: 'AVI', name: 'Live Animals', desc: 'Transport subject to IATA Live Animals Regulations (LAR) with veterinary verification.' },
    { code: 'HUM', name: 'Human Remains', desc: 'Special packaging regulations under international health sanitary clearance.' },
    { code: 'COL', name: 'Cool Storage (+2°C to +8°C)', desc: 'Refrigerated pharma vaccines and laboratory biological cultures.' },
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-heading">
            Master Data & Agent Setup
          </h1>
          <p className="text-base text-slate-500 mt-2 font-sans">
            Configure IATA registered issuing agent details, airline prefixes, airport IATA 3-letter codes, and trading partners.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => { setActiveTab('agent'); setSearchQuery(''); }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'agent'
                ? 'bg-white text-[#2C5EAD] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#1591DC]" />
            Agent Profile
          </button>
          <button
            onClick={() => { setActiveTab('airlines'); setSearchQuery(''); }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'airlines'
                ? 'bg-white text-[#2C5EAD] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plane className="w-4 h-4 text-[#1591DC]" />
            Airlines ({airlines.length})
          </button>
          <button
            onClick={() => { setActiveTab('airports'); setSearchQuery(''); }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'airports'
                ? 'bg-white text-[#2C5EAD] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#1591DC]" />
            Airports ({airports.length})
          </button>
          <button
            onClick={() => { setActiveTab('partners'); setSearchQuery(''); }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'partners'
                ? 'bg-white text-[#2C5EAD] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-[#1591DC]" />
            Shippers & Consignees ({partners.length})
          </button>
          <button
            onClick={() => { setActiveTab('handling'); setSearchQuery(''); }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'handling'
                ? 'bg-white text-[#2C5EAD] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-[#1591DC]" />
            Special Handling Codes
          </button>
        </div>
      </div>

      {/* TAB 1: ISSUING AGENT PROFILE */}
      {activeTab === 'agent' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-heading">
                  IATA Registered Cargo Agent Profile
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-sans">
                  Mandatory issuing information printed on Box 6 of Resolution 600b standard AWBs and used in CASS messaging.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                IATA Accredited
              </span>
            </div>

            {agentSavedNotification && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium">Agent details updated successfully. Changes reflect across all new AWBs.</p>
              </div>
            )}

            <form onSubmit={handleSaveAgent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Issuing Agent Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.name}
                    onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    IATA Numeric Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.iataNumericCode}
                    onChange={(e) => setAgentForm({ ...agentForm, iataNumericCode: e.target.value })}
                    placeholder="e.g. 14-3-9821/0014"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    CASS Participant Address Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.cassAddress}
                    onChange={(e) => setAgentForm({ ...agentForm, cassAddress: e.target.value })}
                    placeholder="e.g. CAS-IND-DEL-0941"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={agentForm.phone}
                    onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-sans"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Registered Office & Airport Terminal Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.headOfficeAddress}
                    onChange={(e) => setAgentForm({ ...agentForm, headOfficeAddress: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    City & Postal Code
                  </label>
                  <input
                    type="text"
                    value={agentForm.city}
                    onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={agentForm.country}
                    onChange={(e) => setAgentForm({ ...agentForm, country: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    GSTIN / VAT Identification No.
                  </label>
                  <input
                    type="text"
                    value={agentForm.gstNumber}
                    onChange={(e) => setAgentForm({ ...agentForm, gstNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Corporate PAN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={agentForm.panNumber}
                    onChange={(e) => setAgentForm({ ...agentForm, panNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent text-slate-900 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#2C5EAD] hover:bg-[#204580] text-white font-semibold text-sm transition-all shadow-md shadow-[#2C5EAD]/20"
                >
                  Save Agent Master Record
                </button>
              </div>
            </form>
          </div>

          {/* Right Card: Agent Verification Badge */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#2C5EAD] to-[#1591DC] text-white rounded-2xl p-6 shadow-md shadow-[#2C5EAD]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-heading leading-tight">{agentProfile.name}</h3>
                  <p className="text-xs text-white/80 font-mono">IATA: {agentProfile.iataNumericCode}</p>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4 space-y-2.5 text-xs border border-white/10 font-sans">
                <div className="flex justify-between">
                  <span className="text-white/70">CASS Code:</span>
                  <span className="font-mono font-semibold">{agentProfile.cassAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">GSTIN:</span>
                  <span className="font-mono font-semibold">{agentProfile.gstNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Origin Hub:</span>
                  <span className="font-bold">DEL (Indira Gandhi T3)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">EDI Status:</span>
                  <span className="text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cargo-IMP Active
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-sm font-heading flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#2C5EAD]" />
                IATA Compliance Guidelines
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Under IATA Resolution 600b, the issuing agent&apos;s name and city must appear verbatim on every Air Waybill. CASS invoices will be billed to the exact IATA Numeric Code and CASS participant address registered above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AIRLINES */}
      {activeTab === 'airlines' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by prefix (e.g. 098), 2-letter code (AI), or airline name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-sans"
              />
            </div>
            <button
              onClick={() => setShowAirlineModal(true)}
              className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add IATA Airline
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-6">3-Digit Prefix</th>
                  <th className="py-3 px-6">2-Letter Code</th>
                  <th className="py-3 px-6">Airline Name</th>
                  <th className="py-3 px-6">Country</th>
                  <th className="py-3 px-6">EDI Protocol</th>
                  <th className="py-3 px-6">Mod-7 Stock Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAirlines.map((airline) => (
                  <tr key={airline.prefix} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#2C5EAD] text-base">
                      {airline.prefix}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#2C5EAD] font-mono font-bold text-xs border border-blue-200">
                        {airline.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {airline.name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {airline.country}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        FWB/FHL (v16.0)
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-emerald-600 font-semibold text-xs flex items-center gap-1.5 pt-4">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolution 600b Active
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AIRPORTS */}
      {activeTab === 'airports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by 3-letter IATA airport code (e.g. DEL, FRA, DXB) or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-sans"
              />
            </div>
            <button
              onClick={() => setShowAirportModal(true)}
              className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add IATA Airport
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-6">IATA Code</th>
                  <th className="py-3 px-6">Airport Name</th>
                  <th className="py-3 px-6">City</th>
                  <th className="py-3 px-6">Country</th>
                  <th className="py-3 px-6">Customs Port Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAirports.map((airport) => (
                  <tr key={airport.iataCode} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#1591DC] text-base">
                      {airport.iataCode}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {airport.name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700">
                      {airport.city}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {airport.country}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2C5EAD] border border-blue-200">
                        International Customs EDI
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SHIPPERS & CONSIGNEES */}
      {activeTab === 'partners' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search shippers, consignees, GSTIN or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-sans"
              />
            </div>
            <button
              onClick={() => setShowPartnerModal(true)}
              className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Shipper / Consignee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <div 
                key={partner.id} 
                className="p-5 rounded-2xl border border-slate-200 hover:border-[#1591DC] transition-all bg-white shadow-xs hover:shadow-md space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    partner.type === 'SHIPPER' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : partner.type === 'CONSIGNEE'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {partner.type}
                  </span>
                  <span className="font-mono text-xs text-slate-400 font-medium">{partner.accountNumber}</span>
                </div>

                <h3 className="font-bold text-slate-900 font-heading text-base leading-tight">
                  {partner.name}
                </h3>

                <p className="text-xs text-slate-500 font-sans line-clamp-2">
                  {partner.address}, {partner.city}, {partner.country}
                </p>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-sans">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{partner.contactPerson || 'Logistics Incharge'}</span>
                  </div>
                  {partner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                  {partner.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{partner.email}</span>
                    </div>
                  )}
                  {partner.taxOrGstId && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700 pt-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>GST/Tax: {partner.taxOrGstId}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SPECIAL HANDLING CODES */}
      {activeTab === 'handling' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              IATA Special Handling & Commodity Codes
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-sans">
              Standard 3-letter IATA codes mapped to cargo manifests, booking volumetric calculations, and e-AWB messages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialHandlingCodes.map((item) => (
              <div key={item.code} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg bg-[#2C5EAD] text-white font-mono font-bold text-sm shadow-xs">
                    {item.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">IATA Res 600b</span>
                </div>
                <h3 className="font-bold text-slate-900 font-heading text-base pt-1">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD AIRLINE */}
      {showAirlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 font-heading">Add IATA Carrier / Airline</h3>
            <form onSubmit={handleCreateAirline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3-Digit IATA Prefix (e.g. 098, 176, 020) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  pattern="\d{3}"
                  placeholder="098"
                  value={newAirline.prefix || ''}
                  onChange={(e) => setNewAirline({ ...newAirline, prefix: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2-Letter Carrier Code (e.g. AI, EK, LH) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="AI"
                  value={newAirline.code || ''}
                  onChange={(e) => setNewAirline({ ...newAirline, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Airline Official Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Air India Cargo"
                  value={newAirline.name || ''}
                  onChange={(e) => setNewAirline({ ...newAirline, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country of Registration
                </label>
                <input
                  type="text"
                  placeholder="India"
                  value={newAirline.country || ''}
                  onChange={(e) => setNewAirline({ ...newAirline, country: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAirlineModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C5EAD] text-white text-sm font-semibold rounded-xl hover:bg-[#204580]"
                >
                  Save Airline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD AIRPORT */}
      {showAirportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 font-heading">Add IATA Airport / Station</h3>
            <form onSubmit={handleCreateAirport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3-Letter IATA Airport Code (e.g. DEL, BOM, FRA) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  pattern="[A-Za-z]{3}"
                  placeholder="DEL"
                  value={newAirport.iataCode || ''}
                  onChange={(e) => setNewAirport({ ...newAirport, iataCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Airport Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Indira Gandhi International Airport"
                  value={newAirport.name || ''}
                  onChange={(e) => setNewAirport({ ...newAirport, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City Name
                </label>
                <input
                  type="text"
                  placeholder="New Delhi"
                  value={newAirport.city || ''}
                  onChange={(e) => setNewAirport({ ...newAirport, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  placeholder="India"
                  value={newAirport.country || ''}
                  onChange={(e) => setNewAirport({ ...newAirport, country: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAirportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C5EAD] text-white text-sm font-semibold rounded-xl hover:bg-[#204580]"
                >
                  Save Airport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PARTNER */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 font-heading">Add Shipper / Consignee</h3>
            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Type *</label>
                <select
                  value={newPartner.type}
                  onChange={(e) => setNewPartner({ ...newPartner, type: e.target.value as 'SHIPPER' | 'CONSIGNEE' | 'BOTH' })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="SHIPPER">Shipper (Consignor)</option>
                  <option value="CONSIGNEE">Consignee</option>
                  <option value="BOTH">Both (Forwarder / Shipper)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Company / Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AeroTech Precision Parts Ltd"
                  value={newPartner.name || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Plot 45, Phase 2, Udyog Vihar"
                  value={newPartner.address || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="New Delhi"
                    value={newPartner.city || ''}
                    onChange={(e) => setNewPartner({ ...newPartner, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="India"
                    value={newPartner.country || ''}
                    onChange={(e) => setNewPartner({ ...newPartner, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Rajiv Malhotra"
                    value={newPartner.contactPerson || ''}
                    onChange={(e) => setNewPartner({ ...newPartner, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91-98110-44921"
                    value={newPartner.phone || ''}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  placeholder="06AAACP4920B1Z4"
                  value={newPartner.taxOrGstId || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, taxOrGstId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C5EAD] text-white text-sm font-semibold rounded-xl hover:bg-[#204580]"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

