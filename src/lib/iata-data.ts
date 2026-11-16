import { Airline, Airport, IssuingAgentProfile } from '@/types/iata';

export const ISSUING_AGENT_PROFILE: IssuingAgentProfile = {
  name: '',
  iataNumericCode: '',
  cassAddress: '',
  headOfficeAddress: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  gstNumber: '',
  panNumber: '',
};

export const IATA_AIRLINES: Airline[] = [
  { prefix: '077', code: 'MS', name: 'EgyptAir', country: 'Egypt' },
  { prefix: '098', code: 'AI', name: 'Air India Cargo', country: 'India' },
  { prefix: '176', code: 'EK', name: 'Emirates SkyCargo', country: 'United Arab Emirates' },
  { prefix: '020', code: 'LH', name: 'Lufthansa Cargo', country: 'Germany' },
  { prefix: '006', code: 'DL', name: 'Delta Cargo', country: 'United States' },
  { prefix: '618', code: 'SQ', name: 'Singapore Airlines Cargo', country: 'Singapore' },
  { prefix: '157', code: 'QR', name: 'Qatar Airways Cargo', country: 'Qatar' },
  { prefix: '125', code: 'BA', name: 'British Airways World Cargo', country: 'United Kingdom' },
  { prefix: '057', code: 'AF', name: 'Air France Cargo', country: 'France' },
  { prefix: '074', code: 'KL', name: 'KLM Cargo', country: 'Netherlands' },
  { prefix: '160', code: 'CX', name: 'Cathay Pacific Cargo', country: 'Hong Kong' },
  { prefix: '607', code: 'EY', name: 'Etihad Cargo', country: 'United Arab Emirates' },
  { prefix: '235', code: 'TK', name: 'Turkish Airlines Cargo', country: 'Turkey' },
  { prefix: '065', code: 'SV', name: 'Saudia Cargo', country: 'Saudi Arabia' },
  { prefix: '217', code: 'TG', name: 'Thai Airways Cargo', country: 'Thailand' },
  { prefix: '312', code: '6E', name: 'IndiGo CarGo', country: 'India' },
  { prefix: '589', code: 'SG', name: 'SpiceXpress', country: 'India' },
  { prefix: '775', code: 'FZ', name: 'flydubai Cargo', country: 'United Arab Emirates' },
  { prefix: '724', code: 'LX', name: 'Swiss WorldCargo', country: 'Switzerland' },
  { prefix: '016', code: 'UA', name: 'United Airlines Cargo', country: 'United States' },
  { prefix: '001', code: 'AA', name: 'American Airlines Cargo', country: 'United States' },
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
