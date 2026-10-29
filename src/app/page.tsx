'use client';

import React, { useState } from 'react';
import { 
  Sidebar, 
  NavPage, 
  UserRole 
} from '@/components/layout/Sidebar';
import { 
  Navbar 
} from '@/components/layout/Navbar';
import { 
  DashboardOverview 
} from '@/components/iata/DashboardOverview';
import { 
  AwbStockView 
} from '@/components/iata/AwbStockView';
import { 
  BookingView 
} from '@/components/iata/BookingView';
import { 
  AwbConsolidationView 
} from '@/components/iata/AwbConsolidationView';
import { 
  ManifestView 
} from '@/components/iata/ManifestView';
import { 
  EawbMessagingView 
} from '@/components/iata/EawbMessagingView';
import { 
  BillingCassView 
} from '@/components/iata/BillingCassView';
import { 
  MasterDataView 
} from '@/components/iata/MasterDataView';
import { 
  AwbStockItem, 
  BookingItem, 
  MawbItem, 
  HawbItem, 
  FlightManifestItem, 
  EawbMessage, 
  CassInvoice, 
  Airline, 
  Airport, 
  ShipperConsignee, 
  IssuingAgentProfile,
  calculateIataMod7CheckDigit
} from '@/types/iata';
import { 
  INITIAL_AWB_STOCK, 
  INITIAL_BOOKINGS, 
  INITIAL_MAWBS, 
  INITIAL_MANIFESTS, 
  INITIAL_EAWB_MESSAGES, 
  INITIAL_CASS_INVOICES,
  IATA_AIRLINES,
  IATA_AIRPORTS,
  INITIAL_PARTNERS,
  ISSUING_AGENT_PROFILE
} from '@/lib/iata-data';

export default function HomePage() {
  // Navigation & Role
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('Operations');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary IATA Domain State
  const [stock, setStock] = useState<AwbStockItem[]>(INITIAL_AWB_STOCK);
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [mawbs, setMawbs] = useState<MawbItem[]>(INITIAL_MAWBS);
  const [manifests, setManifests] = useState<FlightManifestItem[]>(INITIAL_MANIFESTS);
  const [eawbMessages, setEawbMessages] = useState<EawbMessage[]>(INITIAL_EAWB_MESSAGES);
  const [invoices, setInvoices] = useState<CassInvoice[]>(INITIAL_CASS_INVOICES);

  // Master Data State
  const [airlines, setAirlines] = useState<Airline[]>(IATA_AIRLINES);
  const [airports, setAirports] = useState<Airport[]>(IATA_AIRPORTS);
  const [partners, setPartners] = useState<ShipperConsignee[]>(INITIAL_PARTNERS);
  const [agentProfile, setAgentProfile] = useState<IssuingAgentProfile>(ISSUING_AGENT_PROFILE);

  // Toast / System Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- 1. AWB STOCK HANDLERS ---
  const handleAddStockSeries = (airlinePrefix: string, fromSerial7: number, toSerial7: number) => {
    const newItems: AwbStockItem[] = [];
    let count = 0;

    for (let s = fromSerial7; s <= toSerial7; s++) {
      const serial7Str = s.toString().padStart(7, '0');
      const checkDigit = calculateIataMod7CheckDigit(serial7Str);
      const eightDigit = `${serial7Str}${checkDigit}`;
      const fullAwb = `${airlinePrefix}-${eightDigit}`;

      // Check if already in stock
      const exists = stock.some((item) => item.fullAwbNumber === fullAwb);
      if (!exists) {
        newItems.push({
          id: `stk-${Date.now()}-${s}`,
          airlinePrefix,
          airlineNumber: eightDigit,
          fullAwbNumber: fullAwb,
          status: 'AVAILABLE',
        });
        count++;
      }
    }

    if (newItems.length > 0) {
      setStock((prev) => [...prev, ...newItems]);
      showToast(`Successfully added ${count} verified Resolution 600b AWB numbers to ${airlinePrefix} stock.`);
    } else {
      showToast(`All AWB numbers in series ${fromSerial7}-${toSerial7} already exist in inventory.`, 'info');
    }
  };

  const handleVoidStock = (id: string, reason: string) => {
    setStock((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'VOID', voidReason: reason } : item
      )
    );
    showToast(`AWB marked as VOID. Serial is permanently locked from future issuance per IATA rules.`, 'info');
  };

  // --- 2. BOOKINGS HANDLERS ---
  const handleCreateBooking = (bookingData: Omit<BookingItem, 'id' | 'createdAt' | 'status'>) => {
    const newBooking: BookingItem = {
      ...bookingData,
      id: `bkg-${Date.now()}`,
      bookingRef: `BKG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'PENDING_AWB',
    };
    setBookings((prev) => [newBooking, ...prev]);
    showToast(`Booking ${newBooking.bookingRef} registered. Chargeable weight locked at ${newBooking.chargeableWeightKg} kg.`);
  };

  const handleAssignAwbToBooking = (booking: BookingItem) => {
    // Find next available stock item
    const availableItem = stock.find((s) => s.status === 'AVAILABLE');

    if (!availableItem) {
      showToast('No available AWB numbers in stock. Please generate a new stock series first.', 'error');
      setActivePage('stock');
      return;
    }

    // Mark stock as ISSUED
    setStock((prev) =>
      prev.map((s) =>
        s.id === availableItem.id
          ? { ...s, status: 'ISSUED', issuedAt: new Date().toISOString().split('T')[0] }
          : s
      )
    );

    // Update booking status
    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id ? { ...b, status: 'AWB_ISSUED' } : b
      )
    );

    // Calculate standard charges based on weight
    const ratePerKg = booking.chargeableWeightKg > 300 ? 175 : booking.chargeableWeightKg > 100 ? 195 : 220;
    const freightAmount = booking.chargeableWeightKg * ratePerKg;
    const fuelSurcharge = parseFloat((booking.chargeableWeightKg * 22).toFixed(2));
    const securitySurcharge = parseFloat((booking.chargeableWeightKg * 8).toFixed(2));
    const totalCharges = freightAmount + fuelSurcharge + securitySurcharge;

    // Create new MAWB
    const newMawb: MawbItem = {
      id: `mawb-${Date.now()}`,
      mawbNumber: availableItem.fullAwbNumber,
      airlinePrefix: availableItem.airlinePrefix,
      serialNumber: availableItem.airlineNumber,
      bookingId: booking.id,
      shipperName: booking.shipperName,
      shipperAddress: `${booking.origin} Air Cargo SEZ`,
      consigneeName: booking.consigneeName,
      consigneeAddress: `${booking.destination} Free Trade Zone Terminal`,
      issuingAgentName: agentProfile.name,
      issuingAgentIataCode: agentProfile.iataNumericCode,
      origin: booking.origin,
      destination: booking.destination,
      pieces: booking.pieces,
      grossWeightKg: booking.actualWeightKg,
      chargeableWeightKg: booking.chargeableWeightKg,
      rateClass: 'Q',
      ratePerKg,
      freightAmount,
      fuelSurcharge,
      securitySurcharge,
      totalCharges,
      natureOfGoods: booking.natureOfGoods,
      handlingCode: booking.handlingCode,
      flightNumber: 'AI-121',
      flightDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      hawbs: [],
      status: 'ISSUED',
      issuedAt: new Date().toISOString().split('T')[0],
      fwbSent: false,
    };

    setMawbs((prev) => [newMawb, ...prev]);

    // Generate corresponding GST invoice
    const gstAmount = parseFloat((totalCharges * 0.18).toFixed(2));
    const newInvoice: CassInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      mawbNumber: newMawb.mawbNumber,
      customerName: booking.shipperName,
      date: new Date().toISOString().split('T')[0],
      freightCharges: freightAmount,
      fuelSurcharge,
      securitySurcharge,
      handlingCharges: 1200,
      subtotal: totalCharges + 1200,
      gstAmount,
      totalAmount: totalCharges + 1200 + gstAmount,
      cassReconciliationStatus: 'PENDING_MATCH',
      paymentStatus: 'UNPAID',
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    showToast(`MAWB ${newMawb.mawbNumber} successfully issued for Booking ${booking.bookingRef}!`);
    setActivePage('mawb');
  };

  // --- 3. CONSOLIDATION / HAWB HANDLERS ---
  const handleAddHawb = (mawbId: string, hawbData: Omit<HawbItem, 'id' | 'mawbNumber' | 'status'>) => {
    const targetMawb = mawbs.find((m) => m.id === mawbId);
    if (!targetMawb) return;

    if (targetMawb.status === 'MANIFESTED' || targetMawb.status === 'DEPARTED') {
      showToast('Cannot add HAWBs to a manifested or departed MAWB. Cargo is flight-locked.', 'error');
      return;
    }

    const newHawb: HawbItem = {
      ...hawbData,
      id: `hawb-${Date.now()}`,
      mawbNumber: targetMawb.mawbNumber,
      status: 'ISSUED',
    };

    setMawbs((prev) =>
      prev.map((m) =>
        m.id === mawbId ? { ...m, hawbs: [...m.hawbs, newHawb] } : m
      )
    );

    showToast(`HAWB ${newHawb.hawbNumber} linked under MAWB ${targetMawb.mawbNumber}.`);
  };

  const handleVoidMawb = (mawbId: string) => {
    const targetMawb = mawbs.find((m) => m.id === mawbId);
    if (!targetMawb) return;

    if (targetMawb.status === 'DEPARTED' || targetMawb.status === 'ARRIVED') {
      showToast('Cannot void an in-flight or delivered Air Waybill.', 'error');
      return;
    }

    setMawbs((prev) =>
      prev.map((m) => (m.id === mawbId ? { ...m, status: 'VOID' } : m))
    );

    // Also lock stock as VOID
    setStock((prev) =>
      prev.map((s) =>
        s.fullAwbNumber === targetMawb.mawbNumber
          ? { ...s, status: 'VOID', voidReason: 'Cancelled by operator before flight departure' }
          : s
      )
    );

    showToast(`MAWB ${targetMawb.mawbNumber} voided. Serial number permanently retired.`);
  };

  // --- 4. FLIGHT MANIFEST HANDLERS ---
  const handleCreateManifest = (manifestData: Omit<FlightManifestItem, 'id' | 'status'>) => {
    const newManifest: FlightManifestItem = {
      ...manifestData,
      id: `mnf-${Date.now()}`,
      status: 'DRAFT',
    };

    setManifests((prev) => [newManifest, ...prev]);

    // Update status of included MAWBs to MANIFESTED
    setMawbs((prev) =>
      prev.map((m) =>
        manifestData.mawbs.includes(m.mawbNumber)
          ? { ...m, status: 'MANIFESTED', flightNumber: manifestData.flightNumber, flightDate: manifestData.flightDate }
          : m
      )
    );

    showToast(`Flight Manifest ${newManifest.manifestNumber} created for flight ${newManifest.flightNumber}.`);
  };

  const handleFinalizeManifest = (id: string) => {
    setManifests((prev) =>
      prev.map((mnf) =>
        mnf.id === id
          ? { ...mnf, status: 'FINALIZED', finalizedAt: new Date().toISOString() }
          : mnf
      )
    );
    showToast(`Manifest finalized and locked. Ready for carrier ramp handover and customs clearance.`);
  };

  // --- 5. e-AWB EDI MESSAGING HANDLERS ---
  const handleDispatchFwb = (mawbNumber: string) => {
    const mawb = mawbs.find((m) => m.mawbNumber === mawbNumber);
    if (!mawb) return;

    const rawImp = `FWB/16
${mawb.mawbNumber.replace('-', '')}${mawb.origin}${mawb.destination}/T${mawb.pieces}K${mawb.grossWeightKg}
FLT/${mawb.flightNumber || 'AI121'}/${mawb.flightDate || '30OCT'}
RTD/1/P${mawb.pieces}/K${mawb.grossWeightKg}/CQ/W${mawb.chargeableWeightKg}/R${mawb.ratePerKg}/T${mawb.freightAmount}
/NG/${mawb.natureOfGoods.toUpperCase().slice(0, 30)}
SHP
/${mawb.shipperName.toUpperCase().slice(0, 35)}
/${mawb.shipperAddress.toUpperCase().slice(0, 35)}
CNE
/${mawb.consigneeName.toUpperCase().slice(0, 35)}
/${mawb.consigneeAddress.toUpperCase().slice(0, 35)}
AGT//${mawb.issuingAgentIataCode.replace(/[^0-9]/g, '').slice(0, 7)}
/${mawb.issuingAgentName.toUpperCase().slice(0, 35)}
SPH/${mawb.handlingCode}`;

    const newMsg: EawbMessage = {
      id: `msg-${Date.now()}`,
      messageType: 'FWB',
      awbNumber: mawb.mawbNumber,
      airline: mawb.airlinePrefix === '098' ? 'Air India' : mawb.airlinePrefix === '176' ? 'Emirates' : 'Lufthansa',
      flightNumber: mawb.flightNumber,
      direction: 'OUTBOUND',
      status: 'ACKNOWLEDGED',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      rawCargoImp: rawImp,
    };

    setEawbMessages((prev) => [newMsg, ...prev]);

    setMawbs((prev) =>
      prev.map((m) => (m.mawbNumber === mawbNumber ? { ...m, fwbSent: true } : m))
    );

    showToast(`Cargo-IMP FWB message transmitted to airline host for ${mawbNumber}. SLA ACK received.`);
  };

  const handleDispatchFhl = (mawbNumber: string) => {
    const mawb = mawbs.find((m) => m.mawbNumber === mawbNumber);
    if (!mawb || mawb.hawbs.length === 0) {
      showToast('Cannot dispatch FHL: No House AWBs consolidated under this MAWB.', 'error');
      return;
    }

    const hawbLines = mawb.hawbs
      .map(
        (h) => `HBS/${h.hawbNumber}/${h.origin}${h.destination}/${h.pieces}/K${h.grossWeightKg}/${h.natureOfGoods.slice(0, 15)}`
      )
      .join('\n');

    const rawImp = `FHL/4
MBI/${mawb.mawbNumber.replace('-', '')}${mawb.origin}${mawb.destination}/T${mawb.pieces}K${mawb.grossWeightKg}
${hawbLines}`;

    const newMsg: EawbMessage = {
      id: `msg-${Date.now()}`,
      messageType: 'FHL',
      awbNumber: mawb.mawbNumber,
      airline: mawb.airlinePrefix === '098' ? 'Air India' : 'Emirates SkyCargo',
      flightNumber: mawb.flightNumber,
      direction: 'OUTBOUND',
      status: 'ACKNOWLEDGED',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      rawCargoImp: rawImp,
    };

    setEawbMessages((prev) => [newMsg, ...prev]);
    showToast(`Cargo-IMP FHL consolidation house manifest transmitted for ${mawbNumber}.`);
  };

  // --- 6. BILLING & CASS RECONCILIATION HANDLERS ---
  const handleMarkInvoicePaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, paymentStatus: 'PAID' } : inv))
    );
    showToast(`Invoice payment reconciled.`);
  };

  const handleReconcileCass = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, cassReconciliationStatus: 'RECONCILED' } : inv
      )
    );
    showToast(`CASS airline clearing match verified.`);
  };

  // --- 7. MASTER DATA HANDLERS ---
  const handleAddAirline = (airline: Airline) => {
    setAirlines((prev) => [...prev, airline]);
    showToast(`Carrier ${airline.name} (${airline.prefix} / ${airline.code}) added.`);
  };

  const handleAddAirport = (airport: Airport) => {
    setAirports((prev) => [...prev, airport]);
    showToast(`Airport ${airport.name} (${airport.iataCode}) added.`);
  };

  const handleAddPartner = (partner: ShipperConsignee) => {
    setPartners((prev) => [...prev, partner]);
    showToast(`Trading partner ${partner.name} registered.`);
  };

  const handleUpdateAgentProfile = (profile: IssuingAgentProfile) => {
    setAgentProfile(profile);
    showToast(`IATA issuing agent profile updated successfully.`);
  };

  // Available stock count for badge
  const availableStockCount = stock.filter((s) => s.status === 'AVAILABLE').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'PENDING_AWB').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            notification.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-[#2C5EAD] text-white border-[#1591DC]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#1591DC] shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={(page) => setActivePage(page)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        stockCount={availableStockCount}
        bookingsCount={pendingBookingsCount}
        mawbsCount={mawbs.length}
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          showToast(`Active profile role switched to ${role}.`);
        }}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          activePage={activePage}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          stationCode="DEL / BOM"
        />

        {/* Fluid, wide workspace content area */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-8 py-8">
          {activePage === 'dashboard' && (
            <DashboardOverview
              mawbs={mawbs}
              stock={stock}
              bookings={bookings}
              onNavigate={(page) => setActivePage(page as NavPage)}
            />
          )}

          {activePage === 'stock' && (
            <AwbStockView
              stock={stock}
              onAddStockSeries={handleAddStockSeries}
              onVoidAwb={handleVoidStock}
            />
          )}

          {activePage === 'bookings' && (
            <BookingView
              bookings={bookings}
              onCreateBooking={handleCreateBooking}
              onAssignAwbToBooking={handleAssignAwbToBooking}
            />
          )}

          {activePage === 'mawb' && (
            <AwbConsolidationView
              mawbs={mawbs}
              onAddHawb={handleAddHawb}
              onVoidMawb={handleVoidMawb}
            />
          )}

          {activePage === 'manifest' && (
            <ManifestView
              manifests={manifests}
              mawbs={mawbs}
              onCreateManifest={handleCreateManifest}
              onFinalizeManifest={handleFinalizeManifest}
            />
          )}

          {activePage === 'eawb' && (
            <EawbMessagingView
              messages={eawbMessages}
              mawbs={mawbs}
              onDispatchFwb={handleDispatchFwb}
              onDispatchFhl={handleDispatchFhl}
            />
          )}

          {activePage === 'billing' && (
            <BillingCassView
              invoices={invoices}
              onMarkInvoicePaid={handleMarkInvoicePaid}
              onReconcileCass={handleReconcileCass}
            />
          )}

          {activePage === 'master' && (
            <MasterDataView
              airlines={airlines}
              airports={airports}
              partners={partners}
              agentProfile={agentProfile}
              onAddAirline={handleAddAirline}
              onAddAirport={handleAddAirport}
              onAddPartner={handleAddPartner}
              onUpdateAgentProfile={handleUpdateAgentProfile}
            />
          )}
        </main>
      </div>
    </div>
  );
}
