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
  NavPageId,
} from '@/types/iata';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('iata_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP error ${res.status}`);
  }

  return data;
}

// Health Check
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// Auth
export async function loginApi(username: string, password: string): Promise<{ user: UserAccount; token: string }> {
  const res = await request<{ user: UserAccount; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.token && typeof window !== 'undefined') {
    localStorage.setItem('iata_auth_token', res.token);
  }
  return res;
}

export async function getCurrentUserApi(): Promise<UserAccount> {
  const res = await request<{ user: UserAccount }>('/auth/me');
  return res.user;
}

// Users
export async function getUsersApi(): Promise<UserAccount[]> {
  const res = await request<{ users: UserAccount[] }>('/users');
  return res.users;
}

export async function createUserApi(user: Partial<UserAccount>): Promise<UserAccount> {
  const res = await request<{ user: UserAccount }>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  return res.user;
}

export async function updateUserPermissionsApi(id: string, permissions: NavPageId[]): Promise<UserAccount> {
  const res = await request<{ user: UserAccount }>(`/users/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
  return res.user;
}

export async function updateUserRoleApi(id: string, role: 'admin' | 'user'): Promise<UserAccount> {
  const res = await request<{ user: UserAccount }>(`/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
  return res.user;
}

export async function toggleUserStatusApi(id: string): Promise<UserAccount> {
  const res = await request<{ user: UserAccount }>(`/users/${id}/status`, {
    method: 'PATCH',
  });
  return res.user;
}

export async function deleteUserApi(id: string): Promise<void> {
  await request(`/users/${id}`, { method: 'DELETE' });
}

// Stock
export async function getStockApi(filters?: { airlinePrefix?: string; status?: string; search?: string }): Promise<AwbStockItem[]> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await request<{ stock: AwbStockItem[] }>(`/stock${query ? `?${query}` : ''}`);
  return res.stock;
}

export async function generateStockSeriesApi(airlinePrefix: string, fromSerial7: number, toSerial7: number) {
  return request<{ addedCount: number; alreadyExistedCount: number; message: string }>('/stock/series', {
    method: 'POST',
    body: JSON.stringify({ airlinePrefix, fromSerial7, toSerial7 }),
  });
}

export async function validateAwbSerialApi(eightDigitSerial: string) {
  return request<{ isValid: boolean; expectedCheckDigit: number; actualCheckDigit: number }>('/stock/validate', {
    method: 'POST',
    body: JSON.stringify({ eightDigitSerial }),
  });
}

export async function voidStockApi(id: string, reason: string): Promise<AwbStockItem> {
  const res = await request<{ stock: AwbStockItem }>(`/stock/${id}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.stock;
}

// Dockets
export async function getDocketsApi(filters?: { status?: string; search?: string }): Promise<DocketItem[]> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await request<{ dockets: DocketItem[] }>(`/dockets${query ? `?${query}` : ''}`);
  return res.dockets;
}

export async function createDocketApi(docket: Partial<DocketItem>): Promise<DocketItem> {
  const res = await request<{ docket: DocketItem }>('/dockets', {
    method: 'POST',
    body: JSON.stringify(docket),
  });
  return res.docket;
}

export async function assignAwbToDocketApi(id: string, airlinePrefix?: string): Promise<{ docket: DocketItem; mawb: MawbItem; invoice: CassInvoice }> {
  return request<{ docket: DocketItem; mawb: MawbItem; invoice: CassInvoice }>(`/dockets/${id}/assign-awb`, {
    method: 'POST',
    body: JSON.stringify({ airlinePrefix }),
  });
}

// Bookings
export async function getBookingsApi(filters?: { status?: string; search?: string }): Promise<BookingItem[]> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await request<{ bookings: BookingItem[] }>(`/bookings${query ? `?${query}` : ''}`);
  return res.bookings;
}

export async function createBookingApi(booking: Partial<BookingItem>): Promise<BookingItem> {
  const res = await request<{ booking: BookingItem }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(booking),
  });
  return res.booking;
}

export async function assignAwbToBookingApi(id: string, airlinePrefix?: string): Promise<{ booking: BookingItem; mawb: MawbItem; invoice: CassInvoice }> {
  return request<{ booking: BookingItem; mawb: MawbItem; invoice: CassInvoice }>(`/bookings/${id}/assign-awb`, {
    method: 'POST',
    body: JSON.stringify({ airlinePrefix }),
  });
}

// MAWB & HAWB
export async function getMawbsApi(filters?: { status?: string; search?: string }): Promise<MawbItem[]> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await request<{ mawbs: MawbItem[] }>(`/mawbs${query ? `?${query}` : ''}`);
  return res.mawbs;
}

export async function addHawbApi(mawbId: string, hawb: Partial<HawbItem>): Promise<{ hawb: HawbItem; mawb: MawbItem; parityWarning?: string }> {
  return request<{ hawb: HawbItem; mawb: MawbItem; parityWarning?: string }>(`/mawbs/${mawbId}/hawbs`, {
    method: 'POST',
    body: JSON.stringify(hawb),
  });
}

export async function voidMawbApi(id: string, reason?: string): Promise<MawbItem> {
  const res = await request<{ mawb: MawbItem }>(`/mawbs/${id}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.mawb;
}

// Flight Manifest
export async function getManifestsApi(filters?: { flightNumber?: string; status?: string }): Promise<FlightManifestItem[]> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await request<{ manifests: FlightManifestItem[] }>(`/manifests${query ? `?${query}` : ''}`);
  return res.manifests;
}

export async function createManifestApi(manifest: Partial<FlightManifestItem>): Promise<FlightManifestItem> {
  const res = await request<{ manifest: FlightManifestItem }>('/manifests', {
    method: 'POST',
    body: JSON.stringify(manifest),
  });
  return res.manifest;
}

export async function finalizeManifestApi(id: string): Promise<FlightManifestItem> {
  const res = await request<{ manifest: FlightManifestItem }>(`/manifests/${id}/finalize`, {
    method: 'POST',
  });
  return res.manifest;
}

// e-AWB Messaging
export async function getEawbMessagesApi(filters?: { messageType?: string; awbNumber?: string }): Promise<EawbMessage[]> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await request<{ messages: EawbMessage[] }>(`/eawb${query ? `?${query}` : ''}`);
  return res.messages;
}

export async function dispatchFwbApi(mawbNumber: string): Promise<EawbMessage> {
  const res = await request<{ eawbMessage: EawbMessage }>('/eawb/dispatch-fwb', {
    method: 'POST',
    body: JSON.stringify({ mawbNumber }),
  });
  return res.eawbMessage;
}

export async function dispatchFhlApi(mawbNumber: string): Promise<EawbMessage> {
  const res = await request<{ eawbMessage: EawbMessage }>('/eawb/dispatch-fhl', {
    method: 'POST',
    body: JSON.stringify({ mawbNumber }),
  });
  return res.eawbMessage;
}

export async function dispatchFfmApi(manifestNumber: string): Promise<EawbMessage> {
  const res = await request<{ eawbMessage: EawbMessage }>('/eawb/dispatch-ffm', {
    method: 'POST',
    body: JSON.stringify({ manifestNumber }),
  });
  return res.eawbMessage;
}

// Billing & CASS
export async function getInvoicesApi(filters?: { paymentStatus?: string; cassStatus?: string; search?: string }): Promise<CassInvoice[]> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await request<{ invoices: CassInvoice[] }>(`/invoices${query ? `?${query}` : ''}`);
  return res.invoices;
}

export async function updateInvoicePaymentApi(id: string, paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL'): Promise<CassInvoice> {
  const res = await request<{ invoice: CassInvoice }>(`/invoices/${id}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus }),
  });
  return res.invoice;
}

export async function reconcileCassApi(id: string, cassStatus: 'RECONCILED' | 'PENDING_MATCH' | 'DISCREPANCY'): Promise<CassInvoice> {
  const res = await request<{ invoice: CassInvoice }>(`/invoices/${id}/cass-reconcile`, {
    method: 'PATCH',
    body: JSON.stringify({ cassStatus }),
  });
  return res.invoice;
}

// Master Data
export async function getAirlinesApi(): Promise<Airline[]> {
  const res = await request<{ airlines: Airline[] }>('/master/airlines');
  return res.airlines;
}

export async function getAirportsApi(): Promise<Airport[]> {
  const res = await request<{ airports: Airport[] }>('/master/airports');
  return res.airports;
}

export async function getPartnersApi(type?: string): Promise<ShipperConsignee[]> {
  const res = await request<{ partners: ShipperConsignee[] }>(`/master/partners${type ? `?type=${type}` : ''}`);
  return res.partners;
}

export async function getAgentProfileApi(): Promise<IssuingAgentProfile> {
  const res = await request<{ profile: IssuingAgentProfile }>('/master/agent-profile');
  return res.profile;
}

export async function updateAgentProfileApi(profile: Partial<IssuingAgentProfile>): Promise<IssuingAgentProfile> {
  const res = await request<{ profile: IssuingAgentProfile }>('/master/agent-profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
  return res.profile;
}

// Dashboard
export async function getDashboardStatsApi() {
  return request<any>('/dashboard/stats');
}

