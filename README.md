# IATA Air Waybill (AWB) Management Platform

A web-based air cargo management platform compliant with the **International Air Transport Association (IATA) Resolution 600b standard**, e-AWB Cargo-IMP/XML messaging protocols, and CASS settlement clearing, designed according to the `AWB Software – Phase-wise Flow` blueprint.

---

## ⚡ Tech Stack & UI Specifications

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Palette**: Clean White Canvas (`#FFFFFF` & `#F8FAFC`) with **Primary Royal Blue** (`#2C5EAD`) and **Electric Cyan** (`#1591DC`)
- **Typography**: 
  - **Headings & Subheadings**: [Poppins](https://fonts.google.com/specimen/Poppins)
  - **Body, Ledger & Tables**: [Lato](https://fonts.google.com/specimen/Lato)
- **Layout**: Fluid, wide content canvas (`w-full px-6 sm:px-8 lg:px-8`) with generous whitespacing and zero vertical crowding
- **Dev & Build Engine**: [Turbopack](https://turbo.build/pack) (Ultra-fast Next.js native bundler)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🛫 Standard IATA AWB Lifecycle

```
Available → Allotted → Issued → Manifested → Departed → Arrived → Delivered
   │
   └───► Void / Cancelled (Allowed from any stage before departure; number never reused)
```

---

## 📋 Implemented Core Modules

### 1. Operations Overview & Lifecycle Dashboard
- End-to-end visual stage pipeline covering stock availability, booked cubing, issued MAWBs, manifested flights, departed cargo, and delivered PODs.
- Operational KPIs: Total live gross tonnage, active consolidations, e-AWB EDI dispatch success rate, and pending CASS reconciliations.
- Action center with one-click shortcuts to key workflows.

### 2. AWB Stock Management (Resolution 600b Modulo-7)
- **IATA Resolution 600b Check Digit Validation**:
  - The 8th digit of the serial number is strictly verified as the remainder of the first 7 digits divided by 7:
    $$\text{Check Digit} = \text{Serial}_{1..7} \pmod 7$$
- **Airline Stock Series Generator**: Bulk allocation by airline prefix (e.g. `098` Air India, `176` Emirates, `020` Lufthansa) with automatic Mod-7 generation and duplicate blocking.
- **Interactive Mod-7 Calculator**: Instant verification tool for entering any 8-digit serial to validate check-digit accuracy.
- **Audit-Locked Void Control**: Serial numbers can be permanently retired with mandatory operator audit justification. Voided numbers are irreversibly blocked from ever being re-issued.

### 3. Bookings & Volumetric Weight Calculator
- **Multi-Piece Dimension Cubing**: Dynamic dimension input (Length × Width × Height in cm × Pieces).
- **IATA Standard Volumetric Formula**:
  $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)} \times \text{Pieces}}{6000}$$
- **Chargeable Weight Rule**: Automatically locks chargeable weight to the greater of Gross Actual Weight and Volumetric Weight ($\max(\text{Actual}, \text{Volumetric})$).
- **One-Click AWB Issuance**: Automatically allocates the next verified number from available stock, transitions the booking to issued, and populates Resolution 600b standard fields.

### 4. MAWB & HAWB Consolidation
- **House AWB (HAWB) Linking**: Groupage consolidation allowing multiple house waybills under a single Master AWB.
- **Piece & Weight Parity Validation**: Real-time validation comparing the sum of HAWB pieces and gross weights against the MAWB totals. Visual alerts trigger if there is any mismatch.
- **IATA Standard Print / PDF Preview**:
  - High-fidelity Resolution 600b layout complete with airline 3-digit prefix, routing, flight allocation, rate class, and box-by-box breakdown.
  - Multi-copy color standard support:
    - **Original 1** (For Issuing Carrier — Green)
    - **Original 2** (For Consignee — Pink)
    - **Original 3** (For Shipper — Blue)
    - **Copy 4** (Delivery Receipt / Extra Copy)

### 5. Flight Allocation & Cargo Manifest (FFM)
- Flight-wise consolidation manifest linking MAWBs and HAWBs to designated flight numbers and schedules.
- Automatic aggregation of total pieces, MAWB count, HAWB count, and gross weight.
- **Manifest Finalization Lock**: Locks manifest once cleared, preventing unauthorized alterations prior to ramp handover.
- Searchable manifest inspector and printable flight manifest summary.

### 6. e-AWB EDI Messaging Center
- **Cargo-IMP & XML Teletype Console**: Direct inspection and live simulation of standard IATA teletype messages:
  - **FWB**: Freight Waybill message transmitting complete MAWB electronic data to airline host systems.
  - **FHL**: Freight House List transmitting consolidated HAWB records linked to the master shipment.
  - **FFM**: Flight Forward Manifest message sent to destination and transit stations.
  - **FSU**: Flight Status Updates (`RCS` cargo received, `MAN` manifested, `DEP` departed, `ARR` arrived, `DLV` delivered).
- One-click clipboard copy and transmission log with airline acknowledgement status tracking.

### 7. Rates Engine, GST & CASS Settlement
- **Quantity Slabs Rate Engine**: Standard tariff structures (`-45kg`, `+45kg`, `+100kg`, `+300kg`, `+500kg`, `+1000kg`).
- Automated freight charges, fuel surcharges, security surcharges, and terminal handling charges.
- **GST Invoicing**: 18% statutory Goods & Services Tax calculation.
- **IATA CASS Reconciliation**: Airline Cargo Accounts Settlement System (CASS) status tracking (`RECONCILED`, `PENDING_MATCH`, `DISCREPANCY`).

### 8. IATA Master Data & Accredited Agent Profile
- **Accredited Issuing Agent Profile**: Configurable agent legal name, IATA 7-digit numeric code (`14-3-9821/0014`), CASS participant address, registered office, PAN, and GSTIN.
- **Carrier Registry**: Airline 3-digit prefix database (e.g. `098`, `176`, `020`, `157`, `618`, `006`).
- **Airport / Station Directory**: 3-letter IATA airport codes (e.g. `DEL`, `BOM`, `DXB`, `FRA`, `LHR`, `JFK`, `SIN`).
- **Shippers & Consignees**: Directory with contact information, addresses, and tax identifiers.
- **Special Handling Codes**: Standard IATA handling codes (`GEN`, `PER`, `DGR`, `VAL`, `AVI`, `HUM`, `COL`).

---

## 📁 Project Architecture

```
ita-web-frontend/
├── src/
│   ├── app/
│   │   ├── globals.css                       # Colors, typography, and styling variables
│   │   ├── layout.tsx                        # Poppins & Lato fonts, HTML root
│   │   └── page.tsx                          # Core IATA Orchestration & reactive state
│   ├── components/
│   │   ├── iata/
│   │   │   ├── DashboardOverview.tsx         # AWB pipeline, stage cards & active MAWBs
│   │   │   ├── AwbStockView.tsx              # Mod-7 generator, series allocator & void control
│   │   │   ├── BookingView.tsx               # Dimensional cubing & L×W×H÷6000 calculation
│   │   │   ├── AwbConsolidationView.tsx      # MAWB/HAWB consol, parity checks & print preview
│   │   │   ├── ManifestView.tsx              # Flight manifest (FFM) creator & lock
│   │   │   ├── EawbMessagingView.tsx         # Cargo-IMP FWB/FHL/FFM/FSU teletype console
│   │   │   ├── BillingCassView.tsx           # Rate slabs, 18% GST & CASS reconciliation
│   │   │   └── MasterDataView.tsx            # IATA airlines, airports, agent profile & partners
│   │   └── layout/
│   │       ├── Navbar.tsx                    # Station hub badge, e-AWB pulse, global search
│   │       └── Sidebar.tsx                   # IATA operational navigation rail & role switcher
│   ├── lib/
│   │   └── iata-data.ts                      # Resolution 600b seed data & Cargo-IMP messages
│   └── types/
│       └── iata.ts                           # Mod-7 check digit, volumetric weight & IATA types
├── package.json
└── README.md
```

---

## 🛠️ Verification & Run Commands

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Run ESLint validation
npm run lint

# Compile production build
npm run build
```
