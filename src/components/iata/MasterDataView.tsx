"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Airline,
  Airport,
  ShipperConsignee,
  IssuingAgentProfile,
} from "@/types/iata";
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
  AlertCircle,
  Pencil,
  Loader2,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

// Helper for API calls
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.message || data.error || `Request failed: ${res.status}`,
    );
  return data as T;
}

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "agent" | "airlines" | "airports" | "partners" | "handling"
  >("agent");
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [partners, setPartners] = useState<ShipperConsignee[]>([]);
  const [agentProfile, setAgentProfile] = useState<IssuingAgentProfile | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [showAirportModal, setShowAirportModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Edit Tracking
  const [editingAirlineId, setEditingAirlineId] = useState<string | null>(null);
  const [editingAirportId, setEditingAirportId] = useState<string | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  // Form states (used for both create and edit)
  const [newAirline, setNewAirline] = useState<Partial<Airline>>({
    prefix: "",
    code: "",
    name: "",
    country: "",
  });
  const [newAirport, setNewAirport] = useState<Partial<Airport>>({
    iataCode: "",
    name: "",
    city: "",
    country: "",
  });
  const [newPartner, setNewPartner] = useState<Partial<ShipperConsignee>>({
    type: "SHIPPER",
    name: "",
    accountNumber: "",
    address: "",
    city: "",
    country: "",
    contactPerson: "",
    phone: "",
    email: "",
    taxOrGstId: "",
  });

  const [agentForm, setAgentForm] = useState<IssuingAgentProfile | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [airlinesRes, airportsRes, partnersRes, agentRes] =
        await Promise.all([
          apiFetch<{ airlines: Airline[] }>("/api/master/airlines"),
          apiFetch<{ airports: Airport[] }>("/api/master/airports"),
          apiFetch<{ partners: ShipperConsignee[] }>("/api/master/partners"),
          apiFetch<{ profile: IssuingAgentProfile }>(
            "/api/master/agent-profile",
          ),
        ]);
      setAirlines(airlinesRes.airlines || []);
      setAirports(airportsRes.airports || []);
      setPartners(partnersRes.partners || []);
      setAgentProfile(agentRes.profile);
      setAgentForm(agentRes.profile);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load master data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // --- Handlers: Agent Profile ---
  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentForm) return;
    try {
      await apiFetch("/api/master/agent-profile", {
        method: "PUT",
        body: JSON.stringify(agentForm),
      });
      flash("Agent profile updated successfully.");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- Handlers: Airlines ---
  const openAirlineModal = (airline?: Airline) => {
    if (airline) {
      setEditingAirlineId(airline.prefix); // Using prefix as identifier for reference
      setNewAirline(airline);
    } else {
      setEditingAirlineId(null);
      setNewAirline({ prefix: "", code: "", name: "", country: "" });
    }
    setShowAirlineModal(true);
  };

  const handleSaveAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAirline.prefix || !newAirline.code || !newAirline.name) return;
    try {
      if (editingAirlineId) {
        await apiFetch(`/api/master/airlines/${editingAirlineId}`, {
          method: "PUT",
          body: JSON.stringify(newAirline),
        });
        flash(`Airline ${newAirline.name} updated.`);
      } else {
        await apiFetch("/api/master/airlines", {
          method: "POST",
          body: JSON.stringify(newAirline),
        });
        flash(`Airline ${newAirline.name} added.`);
      }
      setShowAirlineModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- Handlers: Airports ---
  const openAirportModal = (airport?: Airport) => {
    if (airport) {
      setEditingAirportId(airport.iataCode);
      setNewAirport(airport);
    } else {
      setEditingAirportId(null);
      setNewAirport({ iataCode: "", name: "", city: "", country: "" });
    }
    setShowAirportModal(true);
  };

  const handleSaveAirport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAirport.iataCode || !newAirport.name) return;
    try {
      if (editingAirportId) {
        await apiFetch(`/api/master/airports/${editingAirportId}`, {
          method: "PUT",
          body: JSON.stringify(newAirport),
        });
        flash(`Airport ${newAirport.iataCode} updated.`);
      } else {
        await apiFetch("/api/master/airports", {
          method: "POST",
          body: JSON.stringify(newAirport),
        });
        flash(`Airport ${newAirport.iataCode} added.`);
      }
      setShowAirportModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- Handlers: Partners ---
  const openPartnerModal = (partner?: ShipperConsignee) => {
    if (partner) {
      setEditingPartnerId(partner.id);
      setNewPartner(partner);
    } else {
      setEditingPartnerId(null);
      setNewPartner({
        type: "SHIPPER",
        name: "",
        accountNumber: "",
        address: "",
        city: "",
        country: "",
        contactPerson: "",
        phone: "",
        email: "",
        taxOrGstId: "",
      });
    }
    setShowPartnerModal(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.address) return;
    try {
      if (editingPartnerId) {
        await apiFetch(`/api/master/partners/${editingPartnerId}`, {
          method: "PUT",
          body: JSON.stringify(newPartner),
        });
        flash(`Partner ${newPartner.name} updated.`);
      } else {
        await apiFetch("/api/master/partners", {
          method: "POST",
          body: JSON.stringify(newPartner),
        });
        flash(`Partner ${newPartner.name} added.`);
      }
      setShowPartnerModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Filtering
  const filteredAirlines = airlines.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.prefix.includes(searchQuery) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredAirports = airports.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.iataCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.city.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.taxOrGstId?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const specialHandlingCodes = [
    {
      code: "GEN",
      name: "General Cargo",
      desc: "Standard consolidated freight without special temperature or security restrictions.",
    },
    {
      code: "PER",
      name: "Perishable Goods",
      desc: "Temperature-sensitive pharmaceuticals, fresh food, or live flora requiring cold chain.",
    },
    {
      code: "DGR",
      name: "Dangerous Goods",
      desc: "IATA DGR Regulated hazardous chemicals, lithium batteries, and flammable cargo.",
    },
    {
      code: "VAL",
      name: "Valuable Cargo",
      desc: "Secured vault transport, banknotes, precious metals, and high-value microchips.",
    },
    {
      code: "AVI",
      name: "Live Animals",
      desc: "Transport subject to IATA Live Animals Regulations (LAR) with veterinary verification.",
    },
    {
      code: "HUM",
      name: "Human Remains",
      desc: "Special packaging regulations under international health sanitary clearance.",
    },
    {
      code: "COL",
      name: "Cool Storage (+2°C to +8°C)",
      desc: "Refrigerated pharma vaccines and laboratory biological cultures.",
    },
  ];

  if (isLoading && !agentProfile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2C5EAD]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
            IATA Master Data &amp; Agent Profile
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-sans">
            Airline prefixes, airports, trading partners, and accredited agent
            profile
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setActiveTab("agent");
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "agent" ? "bg-white text-[#2C5EAD] shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
          >
            <ShieldCheck className="w-4 h-4 text-[#1591DC]" /> Agent Profile
          </button>
          <button
            onClick={() => {
              setActiveTab("airlines");
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "airlines" ? "bg-white text-[#2C5EAD] shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Plane className="w-4 h-4 text-[#1591DC]" /> Airlines (
            {airlines.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("airports");
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "airports" ? "bg-white text-[#2C5EAD] shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
          >
            <MapPin className="w-4 h-4 text-[#1591DC]" /> Airports (
            {airports.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("partners");
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "partners" ? "bg-white text-[#2C5EAD] shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Users className="w-4 h-4 text-[#1591DC]" /> Partners (
            {partners.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("handling");
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "handling" ? "bg-white text-[#2C5EAD] shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Package className="w-4 h-4 text-[#1591DC]" /> Special Handling
            Codes
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      {/* TAB 1: AGENT PROFILE */}
      {activeTab === "agent" && agentForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-heading">
                  Agent Profile
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Printed on Box 6 of Res 600b AWBs.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Issuing Agent Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.name}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD] text-sm"
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
                    onChange={(e) =>
                      setAgentForm({
                        ...agentForm,
                        iataNumericCode: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    CASS Participant Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.cassAddress}
                    onChange={(e) =>
                      setAgentForm({
                        ...agentForm,
                        cassAddress: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD] text-sm font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Head Office Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.headOfficeAddress}
                    onChange={(e) =>
                      setAgentForm({
                        ...agentForm,
                        headOfficeAddress: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.city}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, city: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.country}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, country: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    GSTIN *
                  </label>
                  <input
                    type="text"
                    required
                    value={agentForm.gstNumber}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, gstNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    PAN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={agentForm.panNumber}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, panNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD] text-sm font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#2C5EAD] hover:bg-[#204580] text-white font-semibold text-sm transition-all shadow-md"
                >
                  Update Agent Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: AIRLINES */}
      {activeTab === "airlines" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search airline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD]"
              />
            </div>
            <button
              onClick={() => openAirlineModal()}
              className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Airline
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-6">Prefix</th>
                  <th className="py-3 px-6">Code</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Country</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAirlines.map((airline) => (
                  <tr key={airline.prefix} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#2C5EAD] text-base">
                      {airline.prefix}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-50 text-[#2C5EAD]">
                        {airline.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold">
                      {airline.name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {airline.country}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => openAirlineModal(airline)}
                        className="p-2 text-slate-400 hover:text-[#2C5EAD] transition-colors rounded-lg hover:bg-slate-100"
                        title="Edit Airline"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AIRPORTS */}
      {activeTab === "airports" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search airport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD]"
              />
            </div>
            <button
              onClick={() => openAirportModal()}
              className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Airport
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-6">IATA Code</th>
                  <th className="py-3 px-6">Airport Name</th>
                  <th className="py-3 px-6">City</th>
                  <th className="py-3 px-6">Country</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAirports.map((airport) => (
                  <tr key={airport.iataCode} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#1591DC] text-base">
                      {airport.iataCode}
                    </td>
                    <td className="py-3.5 px-6 font-semibold">
                      {airport.name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700">
                      {airport.city}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {airport.country}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => openAirportModal(airport)}
                        className="p-2 text-slate-400 hover:text-[#2C5EAD] transition-colors rounded-lg hover:bg-slate-100"
                        title="Edit Airport"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PARTNERS */}
      {activeTab === "partners" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#2C5EAD]"
              />
            </div>
            <button
              onClick={() => openPartnerModal()}
              className="px-4 py-2 bg-[#2C5EAD] hover:bg-[#204580] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-[#1591DC] transition-all bg-white shadow-xs relative group"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openPartnerModal(partner)}
                    className="p-1.5 text-slate-400 hover:text-[#2C5EAD] bg-white rounded-md shadow-sm border border-slate-200"
                    title="Edit Partner"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${partner.type === "SHIPPER" ? "bg-amber-50 text-amber-700 border border-amber-200" : partner.type === "CONSIGNEE" ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}
                  >
                    {partner.type}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 font-heading text-base leading-tight pr-8">
                  {partner.name}
                </h3>
                <p className="text-xs text-slate-500 font-sans line-clamp-2 mt-1">
                  {partner.address}, {partner.city}, {partner.country}
                </p>
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-sans mt-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{partner.contactPerson || "N/A"}</span>
                  </div>
                  {partner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                  {partner.taxOrGstId && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>GST: {partner.taxOrGstId}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SPECIAL HANDLING CODES */}
      {activeTab === "handling" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            IATA Special Handling Codes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialHandlingCodes.map((item) => (
              <div
                key={item.code}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg bg-[#2C5EAD] text-white font-mono font-bold text-sm shadow-xs">
                    {item.code}
                  </span>
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

      {/* MODALS (Airline, Airport, Partner) */}
      {showAirlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              {editingAirlineId ? "Edit Airline" : "Add Airline"}
            </h3>
            <form onSubmit={handleSaveAirline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3-Digit Prefix *
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={newAirline.prefix || ""}
                  onChange={(e) =>
                    setNewAirline({ ...newAirline, prefix: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2-Letter Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={newAirline.code || ""}
                  onChange={(e) =>
                    setNewAirline({ ...newAirline, code: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Airline Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAirline.name || ""}
                  onChange={(e) =>
                    setNewAirline({ ...newAirline, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={newAirline.country || ""}
                  onChange={(e) =>
                    setNewAirline({ ...newAirline, country: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAirlineModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C5EAD] text-white text-sm font-semibold rounded-xl hover:bg-[#204580]"
                >
                  {editingAirlineId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAirportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              {editingAirportId ? "Edit Airport" : "Add Airport"}
            </h3>
            <form onSubmit={handleSaveAirport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3-Letter IATA Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={newAirport.iataCode || ""}
                  onChange={(e) =>
                    setNewAirport({ ...newAirport, iataCode: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Airport Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAirport.name || ""}
                  onChange={(e) =>
                    setNewAirport({ ...newAirport, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={newAirport.city || ""}
                  onChange={(e) =>
                    setNewAirport({ ...newAirport, city: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={newAirport.country || ""}
                  onChange={(e) =>
                    setNewAirport({ ...newAirport, country: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAirportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C5EAD] text-white text-sm font-semibold rounded-xl hover:bg-[#204580]"
                >
                  {editingAirportId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              {editingPartnerId ? "Edit Partner" : "Add Partner"}
            </h3>
            <form onSubmit={handleSavePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  value={newPartner.type}
                  onChange={(e) =>
                    setNewPartner({
                      ...newPartner,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="SHIPPER">Shipper</option>
                  <option value="CONSIGNEE">Consignee</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Person Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPartner.name || ""}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={newPartner.address || ""}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, address: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newPartner.city || ""}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, city: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={newPartner.country || ""}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, country: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newPartner.contactPerson || ""}
                    onChange={(e) =>
                      setNewPartner({
                        ...newPartner,
                        contactPerson: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newPartner.phone || ""}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  value={newPartner.taxOrGstId || ""}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, taxOrGstId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C5EAD] text-white text-sm font-semibold rounded-xl hover:bg-[#204580]"
                >
                  {editingPartnerId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
