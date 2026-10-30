'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sidebar, 
  NavPage 
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
  CreateDocketView 
} from '@/components/iata/CreateDocketView';
import { 
  SettingsPermissionsView 
} from '@/components/settings/SettingsPermissionsView';
import { 
  LoginView 
} from '@/components/auth/LoginView';
import { 
  AwbStockItem, 
  BookingItem, 
  DocketItem,
  MawbItem, 
  HawbItem, 
  FlightManifestItem, 
  EawbMessage, 
  CassInvoice, 
  Airline, 
  Airport, 
  ShipperConsignee, 
  IssuingAgentProfile,
  UserAccount,
  UserRole,
  NavPageId,
  ALL_TAB_IDS,
  getUserEffectiveTabs,
  calculateIataMod7CheckDigit
} from '@/types/iata';
import { 
  INITIAL_AWB_STOCK, 
  INITIAL_BOOKINGS, 
  INITIAL_DOCKETS,
  INITIAL_MAWBS, 
  INITIAL_MANIFESTS, 
  INITIAL_EAWB_MESSAGES, 
  INITIAL_CASS_INVOICES,
  IATA_AIRLINES,
  IATA_AIRPORTS,
  INITIAL_PARTNERS,
  ISSUING_AGENT_PROFILE,
  DEFAULT_USERS
} from '@/lib/iata-data';

export default function HomePage() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_USERS);

  // Navigation & Role
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary IATA Domain State
  const [stock, setStock] = useState<AwbStockItem[]>(INITIAL_AWB_STOCK);
  const [dockets, setDockets] = useState<DocketItem[]>(INITIAL_DOCKETS);
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

  // Restore session & custom user accounts from localStorage with admin guarantee
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedUser = localStorage.getItem('iata_auth_user');
        if (storedUser) {
          const parsed: UserAccount = JSON.parse(storedUser);
          const isAdmin = parsed.username?.toLowerCase() === 'admin' || parsed.role?.toLowerCase() === 'admin';
          if (isAdmin) {
            parsed.role = 'admin';
            parsed.permissions = ALL_TAB_IDS;
          }
          setCurrentUser(parsed);
        }
        const storedUsers = localStorage.getItem('iata_users');
        if (storedUsers) {
          const parsedUsers: UserAccount[] = JSON.parse(storedUsers);
          const sanitized = parsedUsers.map((u) => {
            if (u.username?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'admin') {
              return { ...u, role: 'admin' as UserRole, permissions: ALL_TAB_IDS, isActive: true };
            }
            return u;
          });
          setUsers(sanitized);
        }
      } catch (err) {
        console.error('Session restore error', err);
      } finally {
        setIsAuthChecked(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Check if current user is admin
  const isCurrentUserAdmin = currentUser?.role?.toLowerCase() === 'admin' || 
                             currentUser?.role?.toLowerCase() === 'administrator' || 
                             currentUser?.username?.toLowerCase() === 'admin';

  // Compute allowed tabs for the current individual user (Admin strictly has all 10; User has custom permissions)
  const allowedTabs = useMemo(() => {
    if (!currentUser || isCurrentUserAdmin) return ALL_TAB_IDS as NavPage[];
    return getUserEffectiveTabs(currentUser) as NavPage[];
  }, [currentUser, isCurrentUserAdmin]);

  // Derive the effectively viewed page: if activePage is revoked, fallback to first permitted tab
  const effectiveActivePage = useMemo(() => {
    if (allowedTabs.length === 0) return activePage;
    return allowedTabs.includes(activePage) ? activePage : allowedTabs[0];
  }, [allowedTabs, activePage]);

  // --- AUTHENTICATION HANDLERS ---
  const handleLogin = (user: UserAccount) => {
    const isUserAdmin = user.username?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'admin';
    const baseUser = users.find((u) => u.id === user.id || u.username?.toLowerCase() === user.username?.toLowerCase()) || user;
    const freshUser: UserAccount = isUserAdmin
      ? { ...baseUser, role: 'admin', permissions: ALL_TAB_IDS, isActive: true }
      : baseUser;

    setCurrentUser(freshUser);
    try {
      localStorage.setItem('iata_auth_user', JSON.stringify(freshUser));
    } catch (err) {
      console.error(err);
    }
    showToast(`Welcome, ${freshUser.fullName} (${freshUser.role.toUpperCase()})!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('iata_auth_user');
    } catch (err) {
      console.error(err);
    }
    showToast('Signed out of station successfully.', 'info');
  };

  // --- INDIVIDUAL USER PERMISSIONS & MANAGEMENT HANDLERS ---
  const handleUpdateUserPermissions = (userId: string, newPermissions: NavPageId[]) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, permissions: newPermissions } : u));
    setUsers(updated);
    if (currentUser && currentUser.id === userId) {
      const updatedCurrent = { ...currentUser, permissions: newPermissions };
      setCurrentUser(updatedCurrent);
      try {
        localStorage.setItem('iata_auth_user', JSON.stringify(updatedCurrent));
      } catch (err) {
        console.error(err);
      }
    }
    try {
      localStorage.setItem('iata_users', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    showToast('User permissions updated successfully.');
  };

  const handleUpdateUserRole = (userId: string, newRole: 'admin' | 'user') => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
          permissions: newRole === 'admin' ? getUserEffectiveTabs({ ...u, role: 'admin' }) : u.permissions,
        };
      }
      return u;
    });
    setUsers(updated);
    if (currentUser && currentUser.id === userId) {
      const updatedCurrent = { 
        ...currentUser, 
        role: newRole,
        permissions: newRole === 'admin' ? getUserEffectiveTabs({ ...currentUser, role: 'admin' }) : currentUser.permissions,
      };
      setCurrentUser(updatedCurrent);
      try {
        localStorage.setItem('iata_auth_user', JSON.stringify(updatedCurrent));
      } catch (err) {
        console.error(err);
      }
    }
    try {
      localStorage.setItem('iata_users', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = (newUser: UserAccount) => {
    const updated = [...users, newUser];
    setUsers(updated);
    try {
      localStorage.setItem('iata_users', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u));
    setUsers(updated);
    try {
      localStorage.setItem('iata_users', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    try {
      localStorage.setItem('iata_users', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetUserPermissions = (userId: string) => {
    const defaultUser = DEFAULT_USERS.find((u) => u.id === userId);
    if (!defaultUser) return;
    handleUpdateUserPermissions(userId, defaultUser.permissions);
  };

  const handleSimulateUser = (simulatedUser: UserAccount) => {
    setCurrentUser(simulatedUser);
    showToast(`Now simulating interface as @${simulatedUser.username} (${simulatedUser.role.toUpperCase()})`);
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

  // --- 1.5 DOCKET / CONSIGNMENT NOTE HANDLERS ---
  const handleCreateDocket = (docketData: Omit<DocketItem, 'id' | 'createdAt' | 'status'>) => {
    const newDocket: DocketItem = {
      ...docketData,
      id: `dkt-${Date.now()}`,
      status: 'BOOKED',
      createdAt: new Date().toISOString(),
    };
    setDockets((prev) => [newDocket, ...prev]);
    showToast(`Docket ${newDocket.docketNumber} registered. Chargeable weight locked at ${newDocket.chargeableWeightKg} kg.`);
  };

  const handleAssignAwbToDocket = (docket: DocketItem) => {
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

    // Update docket status
    setDockets((prev) =>
      prev.map((d) =>
        d.id === docket.id ? { ...d, status: 'AWB_ASSIGNED', assignedAwb: availableItem.fullAwbNumber } : d
      )
    );

    // Create corresponding MAWB
    const newMawb: MawbItem = {
      id: `mawb-${Date.now()}`,
      mawbNumber: availableItem.fullAwbNumber,
      airlinePrefix: availableItem.airlinePrefix,
      serialNumber: availableItem.airlineNumber,
      shipperName: docket.consignorName,
      shipperAddress: docket.consignorAddress,
      consigneeName: docket.consigneeName,
      consigneeAddress: docket.consigneeAddress,
      issuingAgentName: agentProfile.name,
      issuingAgentIataCode: agentProfile.iataNumericCode,
      origin: docket.origin,
      destination: docket.destination,
      pieces: docket.pieces,
      grossWeightKg: docket.actualWeightKg,
      chargeableWeightKg: docket.chargeableWeightKg,
      rateClass: 'Q',
      ratePerKg: docket.ratePerKg,
      freightAmount: docket.freightAmount,
      fuelSurcharge: docket.fuelSurcharge,
      securitySurcharge: docket.securitySurcharge,
      totalCharges: docket.subtotal,
      natureOfGoods: docket.natureOfGoods,
      handlingCode: docket.handlingCode,
      flightNumber: 'AI-121',
      flightDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      hawbs: [],
      status: 'ISSUED',
      issuedAt: new Date().toISOString().split('T')[0],
      fwbSent: false,
    };
    setMawbs((prev) => [newMawb, ...prev]);

    // Create GST Invoice
    const newInvoice: CassInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      mawbNumber: newMawb.mawbNumber,
      customerName: docket.consignorName,
      date: new Date().toISOString().split('T')[0],
      freightCharges: docket.freightAmount,
      fuelSurcharge: docket.fuelSurcharge,
      securitySurcharge: docket.securitySurcharge,
      handlingCharges: docket.docketFee,
      subtotal: docket.subtotal,
      gstAmount: docket.gstAmount,
      totalAmount: docket.totalAmount,
      cassReconciliationStatus: 'PENDING_MATCH',
      paymentStatus: docket.paymentMode === 'PREPAID' ? 'PAID' : 'UNPAID',
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    showToast(`AWB ${newMawb.mawbNumber} allocated to Docket ${docket.docketNumber}!`);
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
    const availableItem = stock.find((s) => s.status === 'AVAILABLE');

    if (!availableItem) {
      showToast('No available AWB numbers in stock. Please generate a new stock series first.', 'error');
      setActivePage('stock');
      return;
    }

    setStock((prev) =>
      prev.map((s) =>
        s.id === availableItem.id
          ? { ...s, status: 'ISSUED', issuedAt: new Date().toISOString().split('T')[0] }
          : s
      )
    );

    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id ? { ...b, status: 'AWB_ISSUED' } : b
      )
    );

    const ratePerKg = booking.chargeableWeightKg > 300 ? 175 : booking.chargeableWeightKg > 100 ? 195 : 220;
    const freightAmount = booking.chargeableWeightKg * ratePerKg;
    const fuelSurcharge = parseFloat((booking.chargeableWeightKg * 22).toFixed(2));
    const securitySurcharge = parseFloat((booking.chargeableWeightKg * 8).toFixed(2));
    const totalCharges = freightAmount + fuelSurcharge + securitySurcharge;

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

  // If session is still verifying, show clean minimal background
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2C5EAD] animate-pulse" />
          <span className="text-xs font-mono text-slate-400">Loading IATA Station...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render Login Page (admin / admin)
  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

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
        activePage={effectiveActivePage}
        onPageChange={(page) => setActivePage(page)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        stockCount={availableStockCount}
        bookingsCount={pendingBookingsCount}
        docketCount={dockets.filter(d => d.status === 'BOOKED').length}
        mawbsCount={mawbs.length}
        currentRole={currentUser.role}
        allowedTabs={allowedTabs}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          activePage={effectiveActivePage}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          stationCode="DEL / BOM"
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Fluid, wide workspace content area */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-8 py-8">
          {effectiveActivePage === 'dashboard' && allowedTabs.includes('dashboard') && (
            <DashboardOverview
              mawbs={mawbs}
              stock={stock}
              bookings={bookings}
              onNavigate={(page) => setActivePage(page as NavPage)}
            />
          )}

          {effectiveActivePage === 'docket' && allowedTabs.includes('docket') && (
            <CreateDocketView
              dockets={dockets}
              airports={airports}
              partners={partners}
              availableAwbCount={availableStockCount}
              onCreateDocket={handleCreateDocket}
              onAssignAwbToDocket={handleAssignAwbToDocket}
            />
          )}

          {effectiveActivePage === 'stock' && allowedTabs.includes('stock') && (
            <AwbStockView
              stock={stock}
              onAddStockSeries={handleAddStockSeries}
              onVoidAwb={handleVoidStock}
            />
          )}

          {effectiveActivePage === 'bookings' && allowedTabs.includes('bookings') && (
            <BookingView
              bookings={bookings}
              onCreateBooking={handleCreateBooking}
              onAssignAwbToBooking={handleAssignAwbToBooking}
            />
          )}

          {effectiveActivePage === 'mawb' && allowedTabs.includes('mawb') && (
            <AwbConsolidationView
              mawbs={mawbs}
              onAddHawb={handleAddHawb}
              onVoidMawb={handleVoidMawb}
            />
          )}

          {effectiveActivePage === 'manifest' && allowedTabs.includes('manifest') && (
            <ManifestView
              manifests={manifests}
              mawbs={mawbs}
              onCreateManifest={handleCreateManifest}
              onFinalizeManifest={handleFinalizeManifest}
            />
          )}

          {effectiveActivePage === 'eawb' && allowedTabs.includes('eawb') && (
            <EawbMessagingView
              messages={eawbMessages}
              mawbs={mawbs}
              onDispatchFwb={handleDispatchFwb}
              onDispatchFhl={handleDispatchFhl}
            />
          )}

          {effectiveActivePage === 'billing' && allowedTabs.includes('billing') && (
            <BillingCassView
              invoices={invoices}
              onMarkInvoicePaid={handleMarkInvoicePaid}
              onReconcileCass={handleReconcileCass}
            />
          )}

          {effectiveActivePage === 'master' && allowedTabs.includes('master') && (
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

          {effectiveActivePage === 'settings' && allowedTabs.includes('settings') && (
            <SettingsPermissionsView
              currentUser={currentUser!}
              users={users}
              onUpdateUserPermissions={handleUpdateUserPermissions}
              onUpdateUserRole={handleUpdateUserRole}
              onAddUser={handleAddUser}
              onToggleUserStatus={handleToggleUserStatus}
              onDeleteUser={handleDeleteUser}
              onResetUserPermissions={handleResetUserPermissions}
              onSimulateUser={handleSimulateUser}
            />
          )}
        </main>
      </div>
    </div>
  );
}
