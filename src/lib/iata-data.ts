import { 
  Airline, 
  Airport, 
  AwbStockItem, 
  BookingItem, 
  MawbItem, 
  FlightManifestItem, 
  EawbMessage, 
  CassInvoice,
  ShipperConsignee,
  IssuingAgentProfile
} from '@/types/iata';

export const ISSUING_AGENT_PROFILE: IssuingAgentProfile = {
  name: 'Apex Global Logistics Pvt. Ltd.',
  iataNumericCode: '14-3-9821/0014',
  cassAddress: 'CAS-IND-DEL-0941',
  headOfficeAddress: 'Cargo Complex Terminal 3, Indira Gandhi International Airport',
  city: 'New Delhi - 110037',
  country: 'India',
  phone: '+91-11-2565-9800',
  email: 'airfreight@apexlogistics.iata.org',
  gstNumber: '07AAACA9921D1Z8',
  panNumber: 'AAACA9921D'
};

export const INITIAL_PARTNERS: ShipperConsignee[] = [
  {
    id: 'prt-1',
    type: 'SHIPPER',
    name: 'AeroTech Precision Parts Ltd (DEL)',
    accountNumber: 'SH-DEL-1049',
    address: 'Plot 45, Phase 2, Udyog Vihar, Gurugram, Haryana',
    city: 'New Delhi / NCR',
    country: 'India',
    contactPerson: 'Rajiv Malhotra',
    phone: '+91-98110-44921',
    email: 'aerotech.logistics@precisionparts.in',
    taxOrGstId: '06AAACP4920B1Z4'
  },
  {
    id: 'prt-2',
    type: 'CONSIGNEE',
    name: 'Global Turbine Overhaul GmbH (FRA)',
    accountNumber: 'CN-FRA-8821',
    address: 'Tor 26, CargoCity Sued, Gebaeude 554, 60549 Frankfurt am Main',
    city: 'Frankfurt',
    country: 'Germany',
    contactPerson: 'Klaus Schmidt',
    phone: '+49-69-690-34900',
    email: 'imports@turbine-overhaul.de',
    taxOrGstId: 'DE814920491'
  },
  {
    id: 'prt-3',
    type: 'SHIPPER',
    name: 'PharmaCore Biologics India Pvt Ltd',
    accountNumber: 'SH-BOM-7712',
    address: 'Genome Valley SEZ, Unit 9B, Turakapally, Medchal',
    city: 'Mumbai / Hyderabad',
    country: 'India',
    contactPerson: 'Dr. Sunita Rao',
    phone: '+91-99401-22830',
    email: 'coldchain@pharmacorebio.com',
    taxOrGstId: '36AABCP9912A1Z1'
  },
  {
    id: 'prt-4',
    type: 'CONSIGNEE',
    name: 'Nordic Health Logistics A/S (LHR)',
    accountNumber: 'CN-LHR-3011',
    address: 'Unit 4, Heathrow Cargo Centre, Scylla Road, Hounslow',
    city: 'London Heathrow',
    country: 'United Kingdom',
    contactPerson: 'Alistair Campbell',
    phone: '+44-20-8759-4411',
    email: 'inbound@nordichealth.co.uk',
    taxOrGstId: 'GB982144801'
  },
  {
    id: 'prt-5',
    type: 'BOTH',
    name: 'Trans-Arabian Air Express LLC',
    accountNumber: 'TX-DXB-5502',
    address: 'Cargo Village Gate 2, Dubai International Airport Freezone (DAFZA)',
    city: 'Dubai',
    country: 'United Arab Emirates',
    contactPerson: 'Tariq Mansoor',
    phone: '+971-4-282-9011',
    email: 'cargoops@transarabianair.ae',
    taxOrGstId: 'TRN-100294819900003'
  }
];

export const IATA_AIRLINES: Airline[] = [
  { prefix: '098', code: 'AI', name: 'Air India Cargo', country: 'India' },
  { prefix: '176', code: 'EK', name: 'Emirates SkyCargo', country: 'United Arab Emirates' },
  { prefix: '020', code: 'LH', name: 'Lufthansa Cargo', country: 'Germany' },
  { prefix: '006', code: 'DL', name: 'Delta Cargo', country: 'United States' },
  { prefix: '618', code: 'SQ', name: 'Singapore Airlines Cargo', country: 'Singapore' },
  { prefix: '157', code: 'QR', name: 'Qatar Airways Cargo', country: 'Qatar' },
];

export const IATA_AIRPORTS: Airport[] = [
  { iataCode: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
  { iataCode: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India' },
  { iataCode: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  { iataCode: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { iataCode: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { iataCode: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
  { iataCode: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { iataCode: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States' },
];

export const INITIAL_AWB_STOCK: AwbStockItem[] = [
  { id: 'stk-1', airlinePrefix: '098', airlineNumber: '72418935', fullAwbNumber: '098-72418935', status: 'ISSUED', issuedAt: '2026-10-29' },
  { id: 'stk-2', airlinePrefix: '098', airlineNumber: '72418946', fullAwbNumber: '098-72418946', status: 'ISSUED', issuedAt: '2026-10-29' },
  { id: 'stk-3', airlinePrefix: '098', airlineNumber: '72418950', fullAwbNumber: '098-72418950', status: 'AVAILABLE' },
  { id: 'stk-4', airlinePrefix: '098', airlineNumber: '72418961', fullAwbNumber: '098-72418961', status: 'AVAILABLE' },
  { id: 'stk-5', airlinePrefix: '098', airlineNumber: '72418972', fullAwbNumber: '098-72418972', status: 'ALLOTTED', allocatedTo: 'Express Freight Desk' },
  { id: 'stk-6', airlinePrefix: '098', airlineNumber: '72418983', fullAwbNumber: '098-72418983', status: 'VOID', voidReason: 'Damaged physical form foil' },
  { id: 'stk-7', airlinePrefix: '176', airlineNumber: '51829042', fullAwbNumber: '176-51829042', status: 'ISSUED', issuedAt: '2026-10-29' },
  { id: 'stk-8', airlinePrefix: '176', airlineNumber: '51829053', fullAwbNumber: '176-51829053', status: 'AVAILABLE' },
  { id: 'stk-9', airlinePrefix: '020', airlineNumber: '99104825', fullAwbNumber: '020-99104825', status: 'ISSUED', issuedAt: '2026-10-28' },
  { id: 'stk-10', airlinePrefix: '020', airlineNumber: '99104836', fullAwbNumber: '020-99104836', status: 'AVAILABLE' },
];

export const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: 'bkg-101',
    bookingRef: 'BKG-2026-0921',
    shipperName: 'AeroTech Precision Parts Ltd (DEL)',
    consigneeName: 'Global Turbine Overhaul GmbH (FRA)',
    origin: 'DEL',
    destination: 'FRA',
    pieces: 4,
    actualWeightKg: 180,
    dimensions: [
      { lengthCm: 120, widthCm: 80, heightCm: 60, pieces: 2 }, // 2x (576,000 / 6000) = 192 kg
      { lengthCm: 80, widthCm: 60, heightCm: 40, pieces: 2 },  // 2x (192,000 / 6000) = 64 kg
    ],
    volumetricWeightKg: 256,
    chargeableWeightKg: 256, // Higher of 180 and 256
    natureOfGoods: 'Aircraft Replacement Spare Components (AOG)',
    handlingCode: 'GEN',
    createdAt: '2026-10-29T10:30:00Z',
    status: 'AWB_ISSUED',
  },
  {
    id: 'bkg-102',
    bookingRef: 'BKG-2026-0922',
    shipperName: 'PharmaCore Biologics India Pvt Ltd',
    consigneeName: 'Nordic Health Logistics A/S (LHR)',
    origin: 'BOM',
    destination: 'LHR',
    pieces: 12,
    actualWeightKg: 420,
    dimensions: [
      { lengthCm: 60, widthCm: 50, heightCm: 50, pieces: 12 }, // 12x (150,000 / 6000) = 300 kg
    ],
    volumetricWeightKg: 300,
    chargeableWeightKg: 420, // Higher of 420 and 300
    natureOfGoods: 'Temperature-Controlled Vaccines (+2°C to +8°C)',
    handlingCode: 'COL',
    createdAt: '2026-10-29T11:45:00Z',
    status: 'AWB_ISSUED',
  },
  {
    id: 'bkg-103',
    bookingRef: 'BKG-2026-0923',
    shipperName: 'SilkRoute Textiles Exports',
    consigneeName: 'Emirates Fashion Trading LLC',
    origin: 'DEL',
    destination: 'DXB',
    pieces: 25,
    actualWeightKg: 620,
    dimensions: [
      { lengthCm: 70, widthCm: 60, heightCm: 50, pieces: 25 }, // 25x (210,000 / 6000) = 875 kg
    ],
    volumetricWeightKg: 875,
    chargeableWeightKg: 875,
    natureOfGoods: 'Ready-Made Garments & Fabrics',
    handlingCode: 'GEN',
    createdAt: '2026-10-29T14:15:00Z',
    status: 'PENDING_AWB',
  },
];

export const INITIAL_MAWBS: MawbItem[] = [
  {
    id: 'mawb-1',
    mawbNumber: '098-72418935',
    airlinePrefix: '098',
    serialNumber: '72418935',
    bookingId: 'bkg-101',
    shipperName: 'AeroTech Precision Parts Ltd',
    shipperAddress: 'Plot 44, Cargo Terminal 3, IGI Airport, New Delhi 110037, India',
    consigneeName: 'Global Turbine Overhaul GmbH',
    consigneeAddress: 'CargoCity Süd, Geb. 552, 60549 Frankfurt am Main, Germany',
    issuingAgentName: 'ITA Global Cargo Logistics (IATA 14-3-9821)',
    issuingAgentIataCode: '14-3-9821/0014',
    origin: 'DEL',
    destination: 'FRA',
    pieces: 4,
    grossWeightKg: 180,
    chargeableWeightKg: 256,
    rateClass: 'Q',
    ratePerKg: 3.85,
    freightAmount: 985.60,
    fuelSurcharge: 184.32,
    securitySurcharge: 51.20,
    totalCharges: 1221.12,
    natureOfGoods: 'Aircraft Spare Parts AOG',
    handlingCode: 'GEN',
    flightNumber: 'AI-121',
    flightDate: '2026-10-30',
    status: 'MANIFESTED',
    issuedAt: '2026-10-29T11:00:00Z',
    fwbSent: true,
    hawbs: [
      {
        id: 'hawb-101',
        hawbNumber: 'ITA-DEL-901',
        mawbNumber: '098-72418935',
        shipperName: 'Turbine Blades Div',
        consigneeName: 'Lufthansa Technik MRO',
        origin: 'DEL',
        destination: 'FRA',
        pieces: 2,
        grossWeightKg: 95,
        chargeableWeightKg: 135,
        natureOfGoods: 'Titanium Rotor Blades',
        status: 'MANIFESTED',
      },
      {
        id: 'hawb-102',
        hawbNumber: 'ITA-DEL-902',
        mawbNumber: '098-72418935',
        shipperName: 'Avionics Sensors Labs',
        consigneeName: 'Airbus Repair Facility',
        origin: 'DEL',
        destination: 'FRA',
        pieces: 2,
        grossWeightKg: 85,
        chargeableWeightKg: 121,
        natureOfGoods: 'Pitot Static Probe Assys',
        status: 'MANIFESTED',
      },
    ],
  },
  {
    id: 'mawb-2',
    mawbNumber: '176-51829042',
    airlinePrefix: '176',
    serialNumber: '51829042',
    bookingId: 'bkg-102',
    shipperName: 'PharmaCore Biologics India Pvt Ltd',
    shipperAddress: 'Bhiwandi Pharma Zone, Mumbai 421302, India',
    consigneeName: 'Nordic Health Logistics A/S',
    consigneeAddress: 'Heathrow Cargo Point, Hounslow TW6 3SQ, UK',
    issuingAgentName: 'ITA Global Cargo Logistics (IATA 14-3-9821)',
    issuingAgentIataCode: '14-3-9821/0014',
    origin: 'BOM',
    destination: 'LHR',
    pieces: 12,
    grossWeightKg: 420,
    chargeableWeightKg: 420,
    rateClass: 'Q',
    ratePerKg: 4.20,
    freightAmount: 1764.00,
    fuelSurcharge: 315.00,
    securitySurcharge: 84.00,
    totalCharges: 2163.00,
    natureOfGoods: 'Temperature-Controlled Biologics',
    handlingCode: 'COL',
    flightNumber: 'EK-501',
    flightDate: '2026-10-30',
    status: 'ISSUED',
    issuedAt: '2026-10-29T13:20:00Z',
    fwbSent: true,
    hawbs: [],
  },
  {
    id: 'mawb-3',
    mawbNumber: '020-99104825',
    airlinePrefix: '020',
    serialNumber: '99104825',
    shipperName: 'Siemens Healthineers India',
    shipperAddress: 'Electronics City, Bangalore 560100',
    consigneeName: 'Klinikum Frankfurt Höchst',
    consigneeAddress: 'Gotenstraße 6-8, Frankfurt',
    issuingAgentName: 'ITA Global Cargo Logistics',
    issuingAgentIataCode: '14-3-9821/0014',
    origin: 'DEL',
    destination: 'FRA',
    pieces: 6,
    grossWeightKg: 850,
    chargeableWeightKg: 850,
    rateClass: 'Q',
    ratePerKg: 2.90,
    freightAmount: 2465.00,
    fuelSurcharge: 637.50,
    securitySurcharge: 170.00,
    totalCharges: 3272.50,
    natureOfGoods: 'Diagnostic Imaging Sub-assemblies',
    handlingCode: 'VAL',
    flightNumber: 'LH-761',
    flightDate: '2026-10-28',
    status: 'DEPARTED',
    issuedAt: '2026-10-28T09:00:00Z',
    fwbSent: true,
    hawbs: [],
  },
];

export const INITIAL_MANIFESTS: FlightManifestItem[] = [
  {
    id: 'mnf-1',
    manifestNumber: 'MNF-AI121-261030',
    flightNumber: 'AI-121',
    airline: 'Air India',
    flightDate: '2026-10-30',
    origin: 'DEL',
    destination: 'FRA',
    mawbs: ['098-72418935'],
    totalMawbs: 1,
    totalHawbs: 2,
    totalPieces: 4,
    totalGrossWeightKg: 180,
    status: 'FINALIZED',
    finalizedAt: '2026-10-29T16:00:00Z',
  },
];

export const INITIAL_EAWB_MESSAGES: EawbMessage[] = [
  {
    id: 'msg-001',
    messageType: 'FWB',
    awbNumber: '098-72418935',
    airline: 'Air India',
    flightNumber: 'AI-121',
    direction: 'OUTBOUND',
    status: 'ACKNOWLEDGED',
    timestamp: '2026-10-29T11:05:00Z',
    rawCargoImp: `FWB/17
098-72418935DELFRA/T4K180MC256.0
FLT/AI121/30
RTG/DELAI
SHP
/AEROTECH PRECISION PARTS LTD
/PLOT 44 CARGO TERMINAL 3
/DELHI/IN
CNE
/GLOBAL TURBINE OVERHAUL GMBH
/CARGOCITY SUED GEB 552
/FRANKFURT/DE
CVD/USD/PP/NVD/NCV/XXX
RTD/1/P4/K180/CQ/W256.0/R3.85/T985.60
/W/AIRCRAFT SPARE PARTS AOG
OTH/P/FSC184.32/SSC51.20`,
  },
  {
    id: 'msg-002',
    messageType: 'FHL',
    awbNumber: '098-72418935',
    airline: 'Air India',
    direction: 'OUTBOUND',
    status: 'ACKNOWLEDGED',
    timestamp: '2026-10-29T11:07:00Z',
    rawCargoImp: `FHL/4
MBI/098-72418935DELFRA/T4K180
HBS/ITA-DEL-901/DELFRA/2/K95/TITANIUM ROTOR BLADES
SHP/TURBINE BLADES DIV
CNE/LUFTHANSA TECHNIK MRO
HBS/ITA-DEL-902/DELFRA/2/K85/PITOT STATIC PROBE ASSYS
SHP/AVIONICS SENSORS LABS
CNE/AIRBUS REPAIR FACILITY`,
  },
  {
    id: 'msg-003',
    messageType: 'FSU',
    awbNumber: '020-99104825',
    airline: 'Lufthansa Cargo',
    flightNumber: 'LH-761',
    direction: 'INBOUND',
    status: 'ACKNOWLEDGED',
    timestamp: '2026-10-28T22:30:00Z',
    rawCargoImp: `FSU/15
020-99104825DELFRA/T6K850
DEP/LH0761/28OCT/DEL/2215/FRA
ARR/29OCT/0545`,
  },
];

export const INITIAL_CASS_INVOICES: CassInvoice[] = [
  {
    id: 'inv-881',
    invoiceNumber: 'INV-ITA-2026-0044',
    mawbNumber: '098-72418935',
    customerName: 'AeroTech Precision Parts Ltd',
    date: '2026-10-29',
    freightCharges: 985.60,
    fuelSurcharge: 184.32,
    securitySurcharge: 51.20,
    handlingCharges: 45.00,
    subtotal: 1266.12,
    gstAmount: 227.90, // 18% GST
    totalAmount: 1494.02,
    cassReconciliationStatus: 'RECONCILED',
    paymentStatus: 'PAID',
  },
  {
    id: 'inv-882',
    invoiceNumber: 'INV-ITA-2026-0045',
    mawbNumber: '176-51829042',
    customerName: 'PharmaCore Biologics India Pvt Ltd',
    date: '2026-10-29',
    freightCharges: 1764.00,
    fuelSurcharge: 315.00,
    securitySurcharge: 84.00,
    handlingCharges: 60.00,
    subtotal: 2223.00,
    gstAmount: 400.14,
    totalAmount: 2623.14,
    cassReconciliationStatus: 'PENDING_MATCH',
    paymentStatus: 'UNPAID',
  },
];

