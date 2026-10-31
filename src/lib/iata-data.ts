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
