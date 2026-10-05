import { ArtifactItem, CostingSheet, DocumentItem, KBArticle, VendorItem, PipelineItem, BudgetItem, Sprint, WorkItem, TeamMember, WorkSettings, BudgetSettings, CashInflowEntry } from './types';
import { defaultPricingInputs } from './pricingEngine';
import { userPricingHtml } from './userPricingArtifact';

export const initialArtifacts: ArtifactItem[] = [
  {
    id: 'art-004',
    title: 'Rivlet Pricing & Unit Economics Planner',
    description: 'Original 5-step interactive pricing and forecast tool created by Claude with 3-scenario tables and Indian GST automatic rules.',
    category: 'Calculators',
    tags: ['Pricing', 'Unit Economics', 'GST', 'Scenarios', 'Forecast'],
    source: 'Claude 3.7 Sonnet',
    version: '2.0',
    isPromoted: true,
    routeSlug: 'pricing-planner',
    status: 'promoted',
    isFavorite: true,
    createdAt: '2026-09-27T12:00:00Z',
    updatedAt: '2026-09-27T12:00:00Z',
    htmlContent: userPricingHtml,
  }
];

export const initialCostingSheets: CostingSheet[] = [
  {
    id: 'cost-001',
    sku: 'RIV-FW26-HOOD-01',
    styleName: 'Oversized 480GSM French Terry Hoodie',
    season: 'FW26',
    category: 'Hoodie',
    currency: '₹',
    mrp: 4499,
    expectedMargin: 28.5,
    inputs: {
      ...defaultPricingInputs,
      productName: 'Oversized 480GSM French Terry Hoodie',
      productCode: 'RIV-FW26-HOOD-01',
      mrp: 4499,
      factory: 1280,
      packaging: 65,
      tags: 25,
      branding: 45,
    },
    notes: 'Flagship heavyweight luxury hoodie. Target MRP ₹4,499 with 15% promotional discount.',
    createdAt: '2026-09-12T14:00:00Z',
    updatedAt: '2026-09-25T16:20:00Z',
  },
  {
    id: 'cost-002',
    sku: 'RIV-SS26-TEE-02',
    styleName: 'Heavyweight 260GSM Vintage Wash Tee',
    season: 'SS26',
    category: 'T-Shirt',
    currency: '₹',
    mrp: 2199,
    expectedMargin: 32.0,
    inputs: {
      ...defaultPricingInputs,
      productName: 'Heavyweight 260GSM Vintage Wash Tee',
      productCode: 'RIV-SS26-TEE-02',
      mrp: 2199,
      factory: 520,
      packaging: 35,
      tags: 15,
      branding: 25,
      units: { low: 1000, mid: 2500, high: 5000 },
      discount: { low: 15, mid: 10, high: 5 },
      cac: { low: 250, mid: 180, high: 100 },
    },
    notes: 'High volume essential tee. Listed MRP ₹2,199 qualifies for 5% output GST automatically.',
    createdAt: '2026-09-14T09:30:00Z',
    updatedAt: '2026-09-21T18:10:00Z',
  },
];

export const initialDocuments: DocumentItem[] = [];

export const initialKBArticles: KBArticle[] = [
  {
    id: 'kb-001',
    title: 'Master Mill & Dye House Directory (Primary Partners)',
    slug: 'mill-and-dyehouse-directory',
    category: 'Vendors & Mills',
    isConfidential: true,
    author: 'Rivlet Sourcing Team',
    tags: ['Suppliers', 'Mills', 'MOQ', 'Payment Terms'],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-18T14:00:00Z',
    content: `# Master Mill & Dye House Directory (Rivlet Sourcing)

> **CONFIDENTIAL**: Strictly for Rivlet internal operations & executive team.

---

### 1. Southern Eco Mills (Fabric Production Facility)
- **Specialty**: Heavyweight French Terry (400–520 GSM), Combed Organic Cotton Jersey (220–300 GSM).
- **Certifications**: GOTS Scope Certificate, OEKO-TEX Standard 100 Class I.
- **Minimum Order Quantity (MOQ)**:
  - Custom Lab Dip Color: 300 kg / color
  - Running Greige stock: 150 kg
- **Payment Terms**: 30% Advance at PO, 70% against Bill of Lading (BL) copy.
- **Key Contact**: Rajesh Kumar (Head of Exports) - \`rajesh@southerneco.in\` / +91 98420 XXXXX

---

### 2. Apex Specialty Dyeing & Wash House (Dyeing & Wash Facility)
- **Specialty**: Pigment dyeing, Mineral vintage acid wash, Enzyme bio-polishing.
- **Capacity**: 15,000 pcs / month.
- **Lead Time**: 12 days from greige fabric receipt.
- **Key Contact**: Meera Nair - \`meera.nair@apexdyeing.com\`
`
  },
  {
    id: 'kb-002',
    title: 'Garment Quality Control SOP: AQL 2.5 Major / 4.0 Minor Standards',
    slug: 'quality-control-sop-aql-2-5',
    category: 'Quality & AQL',
    isConfidential: false,
    author: 'Head of Quality',
    tags: ['AQL', 'Inspection', 'Defects', 'Tolerances'],
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
    content: `# Garment Quality Control SOP: AQL 2.5 / 4.0 Standards

This Standard Operating Procedure defines the mandatory inspection criteria for all Rivlet bulk production before factory sign-off and dispatch.

---

### 1. Sampling Size Table (Single Sampling Plan - Normal Inspection Level II)
- **Batch Size 501 – 1,200 pcs**: Sample 80 pcs | Accept Major ≤ 5, Reject ≥ 6.
- **Batch Size 1,201 – 3,200 pcs**: Sample 125 pcs | Accept Major ≤ 7, Reject ≥ 8.

---

### 2. Defect Classifications

#### Critical Defects (Zero Tolerance - Batch Fails Instantly)
- Broken needles, sharp metal or loose pins left in garments.
- Fabric rot, mold, or chemical odor.
- Incorrect brand logo spelling or missing mandatory care/fiber legal label.

#### Major Defects (AQL 2.5)
- Measurement out of tolerance (Chest > ±1.0 cm, Length > ±1.5 cm).
- Fabric holes, laddering, or color shading across body panels.
- Open seams or broken stitching.
- Prominent stains or oil marks.

#### Minor Defects (AQL 4.0)
- Removable loose threads longer than 1 cm.
- Slight skewing of hangtag attachment.
- Slight crease marks removable with light ironing.
`
  },
  {
    id: 'kb-003',
    title: 'Brand Tone, Typography & Packaging Experience Guidelines',
    slug: 'brand-tone-and-packaging-guidelines',
    category: 'Brand Guidelines',
    isConfidential: false,
    author: 'Creative Director',
    tags: ['Branding', 'Packaging', 'Typography', 'Tone'],
    createdAt: '2026-09-02T13:30:00Z',
    updatedAt: '2026-09-20T16:00:00Z',
    content: `# Brand Tone & Packaging Unboxing Experience

Rivlet is built on understated luxury, structural silhouettes, and uncompromising heavyweight textiles.

---

### 1. Brand Pillars
- **Sculptural Minimalism**: Garments that hold their structure without synthetic stiffeners.
- **Tactile Weight**: Every textile must communicate durability and warmth the second it is touched.
- **Quiet Authority**: No loud billboards. Subtle tone-on-tone embroidery, micro-engraved hardware.

---

### 2. Packaging Specs & Assembly
1. Garment folded with 1 layer of acid-free parchment tissue paper.
2. Scent: Rivlet Signature Cedar & Amber linen mist (1 light press at 30cm distance).
3. Frosted matte biodegradable 80-micron polybag with gold foil logo.
4. Sealed with embossed metallic wafer sticker.
`
  },
  {
    id: 'kb-004',
    title: 'Master Financial Blueprint: Garment Costing, Indian GST Step Taxation & Unit Economics Methodology',
    slug: 'garment-costing-and-unit-economics-methodology',
    category: 'Finance & Unit Economics',
    isConfidential: true,
    author: 'Rivlet Financial Engineering & Merchandising Team',
    tags: ['Pricing', 'Unit Economics', 'GST', 'BOM', 'Overheads', 'Financial Blueprint'],
    createdAt: '2026-10-04T10:00:00Z',
    updatedAt: '2026-10-04T10:00:00Z',
    content: `# Master Financial Blueprint: Garment Costing, Indian GST Step Taxation & Unit Economics

> **CONFIDENTIAL: RIVLET INTERNAL OPERATIONS & MERCHANDISING ONLY**  
> *Author: Rivlet Financial Engineering & Merchandising Team*  
> *Effective Season: FW26 / SS27 & Beyond*

---

## 1. Executive Summary & Purpose

The **Rivlet Garment Cost Calculator** is an institutional-grade financial engine designed to protect brand gross margins and EBITDA profitability. Premium garment direct-to-consumer (D2C) brands fail not from lack of demand, but from hidden variable leakages:
1. Underestimating **shrinkage and cutting wastage** on heavyweight textiles.
2. Inaccurate **Indian GST step-function liability** (5% vs 18%) and mishandling **Factory Input Tax Credit (ITC)**.
3. Distorting per-unit economics by dividing total corporate fixed overheads by single-SKU volumes instead of **brand-wide catalog volume**.
4. Disregarding **reverse logistics, payment gateway surcharges, and customer return buffers**.
5. Relying on single-point optimistic forecasts rather than **3-scenario stress testing** (Conservative, Expected, Optimistic).

This document serves as the permanent institutional reference for every formula, field dependency, tax regulation, and margin threshold applied in the Rivlet Pricing Suite.

---

## 2. Core Economic Equation & Profit Flow

Every garment calculation progresses through a strict sequential waterfall:

\`\`\`
[1. Customer Invoice (MRP / Selling Price)]
       │
       ▼ (Less Indian Output GST: 5% if ≤₹2,500; 18% if >₹2,500)
[2. Net Realized Sales Revenue]
       │
       ▼ (Less Landed Production Cost / COGS)
          • Raw Fabric (Body + Rib + Trims) + Shrinkage + Cutting Wastage
          • Cut, Make & Trim (CMT), Washing, Printing & Embroidery
          • Packaging, Tags, Woven Labels & Polybags
          • Less Factory Input Tax Credit (ITC Claimable)
[3. Factory Gross Profit]
       │
       ▼ (Less Variable Commercial Direct Costs)
          • Outbound Courier Shipping & Packaging Assembly
          • Payment Gateway Fee (Razorpay/Stripe ~2.0% + GST)
          • Expected Return Logistics Loss Reserve
          • Blended Customer Acquisition Cost (Meta/Google Ad Spend)
          • Influencer / Affiliate Commission
[4. Contribution Margin (CM2)]
       │
       ▼ (Less Allocated Fixed Brand Overheads)
          • Annual SG&A + Salaries + Tools ÷ Total Brand Annual Unit Sales
[5. Net Contribution / EBITDA Profit Per Garment]
\`\`\`

---

## 3. Bill of Materials (BOM) & Factory Production Cost Breakdown

### A. Fabric Consumption, Shrinkage & Cutting Wastage
Textiles are priced either by kilogram (\`₹/kg\`) or by linear meter (\`₹/m\`). Heavyweight knits (e.g., 450 GSM French Terry) require precise wastage accounting:
- **Net Consumption**: Actual square meter fabric required for panels.
- **Shrinkage Allowance (typically 3%–7%)**: Natural cotton shrinks during pre-wash and heat curing.
- **Cutting Table Wastage (typically 5%–10%)**: Irregular pattern nesting, selvedge loss, and end-of-roll cut-offs.

**Mathematical Formula:**
$$\\text{Effective Fabric Cost} = \\text{Base Fabric Price} \\times \\text{Consumption} \\times \\left(1 + \\frac{\\text{Shrinkage \\%}}{100}\\right) \\times \\left(1 + \\frac{\\text{Wastage \\%}}{100}\\right)$$

### B. Secondary Fabric & Ribbing
Heavyweight crewnecks and hoodies require 2x2 heavy cotton/elastane ribbing at the neck, cuffs, and hem. This is tracked independently as:
$$\\text{Rib Cost} = \\text{Rib Consumption (kg)} \\times \\text{Rib Rate (₹/kg)}$$

### C. Trims, Hardware & Branding Accoutrements
- **Woven Neck Label**: Micro-damask high-density thread (~₹6–12/pc).
- **Satin Care & Composition Label**: Mandatory legal label (~₹3–6/pc).
- **Embossed Hangtag & Waxed Cord**: 400 GSM soft-touch card with safety pin (~₹10–20/pc).
- **Zippers & Metal Aglets**: Custom engraved brass/matte black hardware (~₹25–65/pc).

### D. CMT, Dyeing, Washing & Embellishment
- **Cut, Make & Trim (CMT)**: Machine operator assembly cost per garment.
- **Specialty Wash**: Pigment dyeing, silicone wash, or vintage enzyme wash.
- **Screenprint / Embroidery**: High-density screenprint or chain-stitch embroidery.

### E. Total Landed Production Cost (COGS)
$$\\text{COGS} = \\sum(\\text{Fabric}) + \\sum(\\text{Trims}) + \\text{CMT} + \\text{Washing} + \\text{Embellishment} + \\text{Factory QC/Handling}$$

---

## 4. Indian GST Step-Function Taxation & Factory Input Tax Credit (ITC)

India enforces a dual-tier step GST system for apparel under HSN Chapter 61 & 62.

### Step Function Threshold Rule:
- **MRP / Selling Price $\\le$ ₹2,500**: Taxed at **5% GST** (HSN standard concessional rate).
- **MRP / Selling Price $>$ ₹2,500**: Taxed at **18% GST** (luxury & high-value apparel bracket).

### Net Realized Revenue Calculation (Reverse Tax Extraction):
Because the consumer price (MRP) is inclusive of taxes, the output GST must be extracted:
$$\\text{Net Realized Sales} = \\frac{\\text{Customer MRP}}{1 + \\text{Tax Rate}}$$
$$\\text{Output GST Collected} = \\text{Customer MRP} - \\text{Net Realized Sales}$$

*Example A (MRP = ₹1,999):*  
Tax Rate = 5% ($0.05$)  
$\\text{Net Sales} = \\frac{1999}{1.05} = ₹1,903.81$  
$\\text{Output GST} = ₹95.19$

*Example B (MRP = ₹4,999):*  
Tax Rate = 18% ($0.18$)  
$\\text{Net Sales} = \\frac{4999}{1.18} = ₹4,236.44$  
$\\text{Output GST} = ₹762.56$

### Factory Input Tax Credit (ITC) Mechanism:
When our garment factory bills us for fabrication (CMT + fabric), they levy GST (typically 5% on textile job work or 12%/18% on finished garments). Under the Indian GST regime, **this input GST is not an expense** - it is a tax credit asset that offsets the Output GST owed to the government.

- **Net Tax Remitted to Govt**: $\\text{Output GST} - \\text{Eligible Factory ITC}$
- In the Rivlet Calculator, if factory invoices include claimable ITC, it reduces the net effective tax cash drain.

---

## 5. Fixed Annual Overhead Absorption (The Universal Catalog Rule)

### The Classic Mistake:
Dividing the entire company's annual overheads (rent, salaries, SaaS tools, Shopify Plus, photoshoot amortizations) by a single product's projected sales. This artificially inflates the per-unit cost of a new SKU to absurd levels and distorts pricing.

### The Institutional Methodology:
Fixed corporate overheads must be absorbed across the **Total Brand Catalog Projected Unit Volume** across all running SKUs in that fiscal year:

$$\\text{Overhead Burden Per Unit} = \\frac{\\text{Total Annual Company Fixed Overheads (₹)}}{\\text{Total Projected Brand Catalog Unit Sales (All SKUs)}}$$

### Three Tier Sensitivity:
1. **Conservative Overhead**: Total Overheads $\\div$ Conservative Total Brand Volume (e.g., ₹10,70,000 $\\div$ 12,000 units = ₹89.17/pc).
2. **Expected Overhead**: Total Overheads $\\div$ Expected Total Brand Volume (e.g., ₹10,70,000 $\\div$ 20,000 units = ₹53.50/pc).
3. **Optimistic Overhead**: Total Overheads $\\div$ Upside Total Brand Volume (e.g., ₹10,70,000 $\\div$ 32,000 units = ₹33.44/pc).

Every single SKU produced absorbs this standard baseline overhead rate, allowing fair, standardized margin comparisons across hoodies, tees, caps, and trousers.

---

## 6. Commercial Direct Variable Costs (E-Commerce Operations)

### A. Fulfillment & Outbound Logistics
- Air express courier (BlueDart / Delhivery Surface) based on volumetric deadweight (e.g. 800g hoodie = ~₹120–₹160 across India).

### B. Payment Gateway (PG) Processing
- Razorpay / Cashfree / Stripe average 2.0% + 18% GST on the fee (~2.36% effective of transaction value).
- Calculated directly on customer checkout value.

### C. Return / RTO Reserve (Reverse Logistics & Inspection)
E-commerce fashion in India experiences a 10%–20% return rate on online orders, and up to 35% on COD.
$$\\text{Return Cost Allowance} = \\text{Expected Return Rate (\\%)} \\times (\\text{Forward Shipping} + \\text{Reverse Shipping} + \\text{Refurbishing/Inspection Fee})$$

### D. Customer Acquisition Cost (Blended CAC)
- Paid media ad spend (Meta Advantage+, Google Shopping).
- Target CAC is benchmarked between 15% and 25% of selling price for healthy D2C operations.

### E. Creator / Influencer Commission
- Tracked affiliate links / creator discounts (typically 8%–12% of Net Sales).

---

## 7. Multi-Scenario Stress Testing: Conservative vs. Expected vs. Optimistic

The calculator runs three parallel balance sheets simultaneously to ensure viability under adverse market conditions:

| Economic Driver | Conservative Scenario (Stress Test) | Expected Scenario (Baseline Plan) | Optimistic Scenario (Best Case) |
| :--- | :--- | :--- | :--- |
| **Return & RTO Rate** | 22.0% (High return friction) | 12.0% (Standard premium D2C) | 6.0% (Loyal returning buyers) |
| **Paid Ad CAC** | ₹1,100 / garment (Ad saturation) | ₹750 / garment (Optimized ROAS) | ₹450 / garment (Organic viral lift) |
| **Payment Gateway** | 2.5% (High COD + dispute mix) | 2.0% (Standard prepaid gateway) | 1.8% (UPI direct dominance) |
| **Overhead Burden** | ₹89.17 / unit (Low catalog sales) | ₹53.50 / unit (Target catalog sales) | ₹33.44 / unit (Scale catalog sales) |
| **Target Net Margin** | **$\ge$ 15%** minimum survival floor | **$\ge$ 28% – 35%** target health | **$\ge$ 45%** hyper-profitable |

> **Decision Rule**: If an SKU cannot achieve at least **15% Net Margin in the Conservative Scenario**, the product is rejected at the prototyping stage.

---

## 8. Real-World Worked Walkthrough: Rivlet Heavyweight Boxy Hoodie

- **Target MRP**: ₹4,999 (Inclusive of tax)
- **HSN Category**: Above ₹2,500 $\\implies$ 18% GST applies.

### Step 1: Net Revenue
$$\\text{Net Sales} = \\frac{4,999}{1.18} = ₹4,236.44$$
$$\\text{Output GST} = ₹762.56$$

### Step 2: Bill of Materials & Landed COGS
- 450 GSM French Terry (0.85 kg @ ₹650/kg with 5% shrinkage & 6% cut loss): **₹615.00**
- 2x2 Cotton Ribbing (0.12 kg @ ₹580/kg): **₹69.60**
- Labels, Tags, Parchment & Matte Polybag: **₹48.00**
- Heavyweight CMT Stitching: **₹180.00**
- Pigment Wash & Hand Distressing: **₹95.00**
- Embroidered Tone-on-Tone Logo: **₹45.00**
- Less Factory ITC Credit: **-₹42.00**
- **Total Net Landed COGS**: **₹1,010.60** (23.8% of Net Sales)

### Step 3: Factory Gross Profit
$$\\text{Factory Gross Profit} = ₹4,236.44 - ₹1,010.60 = ₹3,225.84 \\quad (76.1\\% \\text{ Gross Margin})$$

### Step 4: Variable Commercial Costs (Expected Scenario)
- Outbound Courier Shipping: **₹145.00**
- Payment Gateway (2.0% of ₹4,999): **₹99.98**
- Return Reserve (12% return rate $\\times$ ₹260 reverse cost): **₹31.20**
- Performance CAC: **₹850.00**
- Influencer Affiliate (10% of Net Sales): **₹423.64**
- **Total Commercial Operating Expenses**: **₹1,549.82**

### Step 5: Fixed Overheads
- Brand Annual Overhead Share: **₹53.50**

### Step 6: Final Net Contribution / EBITDA
$$\\text{Net Profit Per Unit} = ₹3,225.84 - ₹1,549.82 - ₹53.50 = ₹1,622.52$$
$$\\text{Net Profit Margin} = \\frac{₹1,622.52}{₹4,236.44} = \\mathbf{38.3\\%}$$
*Status: Highly Viable. Approved for commercial manufacturing run.*

---

## 9. Comprehensive Field Dictionary & Variable Matrix

| Input Field Name | Calculation / Source | Economic Impact | Optimal Target Range |
| :--- | :--- | :--- | :--- |
| **Retail MRP (₹)** | Master consumer selling price | Defines output tax bracket (5% vs 18%) & revenue top line | Determined by competitive luxury benchmark |
| **Fabric GSM & Consumption** | Weight in grams/m² & consumption in kg/m | Direct BOM cost; heavyweight textiles demand higher allowances | Tees: 220–280 GSM; Hoodies: 400–520 GSM |
| **Shrinkage Allowance (%)** | Natural dimensional change post wash | Underestimating leads to undersized garments or fabric shortfall | Standard 4% – 7% for premium cotton |
| **Cutting Wastage (%)** | Marker efficiency & end-loss | Direct fabric cost multiplier | Standard 5% – 8% |
| **CMT Cost (₹)** | Sewing, thread, labor per unit | Fixed assembly fee charged by primary vendor | Shirts: ₹120–160; Hoodies: ₹170–240 |
| **Claimable Factory ITC (₹)** | Input tax credit on vendor manufacturing bill | Directly offsets output GST liability | Equals 5%–12% of vendor taxable invoice |
| **Outbound Courier (₹)** | 3PL shipping rate per package weight | Direct deduction from gross profit | ₹70 (Tee) to ₹150 (Heavy Hoodie) |
| **PG Rate (%)** | Payment gateway merchant discount rate | Percentage deduction from checkout transaction | 1.8% – 2.2% |
| **Return Rate (%)** | Projected rate of customer returns/RTO | Dictates reverse logistics reserve cost | $\\le 12\\%$ target for D2C apparel |
| **Target CAC (₹)** | Blended media spend to acquire 1 purchase | Largest variable expense in D2C | $\\le 20\\%$ of net realized price |
| **Catalog Annual Volume** | Total units sold across all brand SKUs | Denominator for overhead absorption | 15,000 – 40,000 units/year |

---

## 10. Conclusion & Merchandising Governance

All Rivlet merchandisers and product developers must evaluate new style proposals through this financial framework before issuing Purchase Orders. Any style failing to achieve a **30% Expected Net Margin** or a **15% Conservative Net Margin** must be re-engineered (by optimizing fabric consumption, negotiating bulk mill discounts, or re-evaluating retail pricing).
`
  }
];

export const initialVendors: VendorItem[] = [
  {
    id: 'ven-001',
    name: 'Layo Group',
    category: 'Manufacturer',
    subcategory: 'Cut & Sew Apparel Factory',
    location: 'Tirupur, Tamil Nadu',
    website: 'https://layogroup.example.com',
    healthStatus: 'Good',
    rating: 5,
    specialty: '78/22 Nylon-Lycra compression knits & flatlock stitching',
    isVerticallyIntegrated: true,
    stage: 'Proto & Fit Sampling',
    stageProgressPercent: 45,
    moqTarget: 175,
    moqOffered: 250,
    paymentTermsTarget: '30% advance / 50% pre-shipment / 20% on delivery',
    samplingFee: 15000,
    certifications: ['OEKO-TEX Standard 100', 'GOTS Organic Certified'],
    contacts: [
      { id: 'c-101', name: 'R. Rajesh Kumar', role: 'Managing Director & Key Account', email: 'rajesh@layogroup.com', phone: '+91 98422 11029', isPrimary: true },
      { id: 'c-102', name: 'Deepa Natarajan', role: 'Merchandising & Sampling Lead', email: 'deepa.n@layogroup.com', phone: '+91 98422 11030', isPrimary: false },
    ],
    commercials: {
      currency: '₹',
      paymentTerms: '30% Advance / 50% Pre-dispatch / 20% Post-QC',
      creditDays: 30,
      taxId: '33AABCL1290K1ZX',
      ratesSummary: '₹480 - ₹720 / unit CMT depending on stitch complexity',
      slaCommitment: 'AQL 2.5 Major / 4.0 Minor; 45 days ex-factory timeline',
    },
    communicationLogs: [
      { id: 'log-001', date: '2026-09-22', channel: 'In-Person Meeting', summary: 'Facility tour in Tirupur. Inspected circular knitting floor and 4-needle 6-thread flatlock machines.', outcome: 'Factory capable of bonded hems and active compression.', loggedBy: 'Hari' },
      { id: 'log-002', date: '2026-09-29', channel: 'WhatsApp', summary: 'Confirmed fabric swatch dispatch (Charcoal Espresso & Deep Olive 280 GSM).', outcome: 'Tracking AWB received.', nextFollowUpDate: '2026-10-10', loggedBy: 'Hari' },
    ],
    documents: [
      { id: 'doc-v1', title: 'Mutual Non-Disclosure Agreement (NDA)', type: 'Contract / NDA', validUntil: '2028-09-20' },
      { id: 'doc-v2', title: 'OEKO-TEX Standard 100 Certificate', type: 'Compliance / Cert', validUntil: '2027-05-15' },
    ],
    lastContactedAt: '2026-09-29',
    nextFollowUpAt: '2026-10-10',
    notes: 'Top manufacturing partner. High technical proficiency with activewear bonding.',
    createdAt: '2026-09-20T09:00:00Z',
    updatedAt: '2026-09-29T14:30:00Z',
  },
  {
    id: 'ven-002',
    name: 'Wings2Fashion',
    category: 'Manufacturer',
    subcategory: 'Woven & Activewear Mills',
    location: 'Noida, Delhi NCR',
    healthStatus: 'Good',
    rating: 4,
    specialty: 'Seamless bonded activewear & modal loungewear blends',
    isVerticallyIntegrated: null,
    stage: 'Capabilities & Swatches',
    stageProgressPercent: 25,
    moqTarget: 175,
    moqOffered: 300,
    paymentTermsTarget: '30% advance / 50% pre-shipment / 20% on delivery',
    contacts: [
      { id: 'c-201', name: 'Vikram Sethi', role: 'Head of Business Development', email: 'vikram@wings2fashion.in', phone: '+91 98110 44321', isPrimary: true },
    ],
    commercials: {
      currency: '₹',
      paymentTerms: '40% Advance / 60% Against BL Copy',
      taxId: '07AAACW8891J1ZT',
      ratesSummary: '₹550 / unit baseline for seamless leggings',
    },
    communicationLogs: [
      { id: 'log-201', date: '2026-09-21', channel: 'Email', summary: 'Sent Rivlet Drop 1 tech pack overview and requested quote for 175 pcs MOQ.', outcome: 'Awaiting revised MOQ concession from production director.', nextFollowUpDate: '2026-10-08', loggedBy: 'Hari' },
    ],
    lastContactedAt: '2026-09-21',
    nextFollowUpAt: '2026-10-08',
    notes: 'Secondary manufacturer target. Strong in North India logistics and modal blends.',
    createdAt: '2026-09-20T09:00:00Z',
    updatedAt: '2026-09-21T11:00:00Z',
  },
  {
    id: 'ven-003',
    name: 'Razorpay Payments',
    category: 'PaymentGateway',
    subcategory: 'Domestic & UPI Payments',
    location: 'Bengaluru, Karnataka',
    website: 'https://razorpay.com',
    healthStatus: 'Excellent',
    rating: 5,
    specialty: 'Full-stack payment gateway, UPI Intent, Flash Checkout & Instant Refunds',
    stage: 'Production Live',
    stageProgressPercent: 100,
    contacts: [
      { id: 'c-301', name: 'Siddharth Rao', role: 'D2C Key Account Manager', email: 'siddharth.rao@razorpay.com', phone: '+91 80493 22000', isPrimary: true },
    ],
    commercials: {
      currency: '₹',
      paymentTerms: 'T+2 Rolling Settlement',
      ratesSummary: 'UPI: 0%, Domestic Debit Cards: 0.9%, Credit Cards: 1.85% + GST',
      slaCommitment: '99.98% Gateway API Uptime SLA; 24/7 priority support',
      taxId: '29AABCR8109P1ZU',
    },
    communicationLogs: [
      { id: 'log-301', date: '2026-09-15', channel: 'Portal', summary: 'Completed merchant KYC verification and linked Rivlet corporate current account.', outcome: 'Production API keys generated and activated.', loggedBy: 'Hari' },
    ],
    documents: [
      { id: 'doc-v3', title: 'Merchant Service Agreement & TDR Schedule', type: 'Contract / NDA', validUntil: '2027-09-15' },
    ],
    lastContactedAt: '2026-09-15',
    notes: 'Primary checkout gateway for Rivlet domestic web store transactions.',
    createdAt: '2026-09-10T09:00:00Z',
    updatedAt: '2026-09-15T16:00:00Z',
  },
  {
    id: 'ven-004',
    name: 'Stripe Payments',
    category: 'PaymentGateway',
    subcategory: 'Global & Cross-Border Cards',
    location: 'Singapore / Global',
    website: 'https://stripe.com',
    healthStatus: 'Good',
    rating: 5,
    specialty: 'International credit card processing, Apple Pay, Radar fraud detection',
    stage: 'Sandbox API Testing',
    stageProgressPercent: 75,
    contacts: [
      { id: 'c-401', name: 'Elena Vance', role: 'APAC Fintech Partnerships', email: 'elena@stripe.com', isPrimary: true },
    ],
    commercials: {
      currency: '$',
      paymentTerms: 'T+5 Cross-Border Settlement',
      ratesSummary: '3.5% + $0.30 per international transaction + 2% FX conversion',
      slaCommitment: '99.99% Global Uptime SLA',
    },
    communicationLogs: [
      { id: 'log-401', date: '2026-09-24', channel: 'Portal', summary: 'Configured webhook endpoints in staging environment. Verified Apple Pay domain association.', outcome: 'Sandbox test charges passing.', nextFollowUpDate: '2026-10-12', loggedBy: 'Hari' },
    ],
    lastContactedAt: '2026-09-24',
    nextFollowUpAt: '2026-10-12',
    notes: 'Required for Phase 2 international customer checkouts and multi-currency orders.',
    createdAt: '2026-09-12T09:00:00Z',
    updatedAt: '2026-09-24T18:00:00Z',
  },
  {
    id: 'ven-005',
    name: 'Blue Dart Express',
    category: 'Logistics',
    subcategory: 'Domestic Air Express & 3PL',
    location: 'Mumbai, Maharashtra',
    website: 'https://bluedart.com',
    healthStatus: 'Excellent',
    rating: 4,
    specialty: 'Priority air express courier with guaranteed 24-48h metro delivery',
    stage: 'Active Dispatch Partner',
    stageProgressPercent: 100,
    contacts: [
      { id: 'c-501', name: 'Arun Varma', role: 'Commercial Logistics Manager', email: 'arun.varma@bluedart.com', phone: '+91 22283 96000', isPrimary: true },
    ],
    commercials: {
      currency: '₹',
      paymentTerms: 'Fortnightly Billing (Net 15)',
      creditLimit: 100000,
      ratesSummary: '₹55 / 500g Air Metro, ₹18 per additional 500g, COD fee 1.5% or ₹35 min',
      slaCommitment: '98.5% on-time delivery within 48h metro; real-time GPS tracking',
      taxId: '27AAACB0345Q1ZP',
    },
    communicationLogs: [
      { id: 'log-501', date: '2026-09-18', channel: 'Phone Call', summary: 'Finalized enterprise rate card agreement and daily pickup window (5:30 PM).', outcome: 'Pickup depot assigned.', loggedBy: 'Hari' },
    ],
    documents: [
      { id: 'doc-v5', title: 'Corporate Logistics Service Level Agreement', type: 'SLA', validUntil: '2027-09-01' },
      { id: 'doc-v6', title: 'Domestic Air Rate Card Schedule 2026-27', type: 'Rate Card', validUntil: '2027-03-31' },
    ],
    lastContactedAt: '2026-09-18',
    notes: 'Premium air carrier for standard retail client deliveries across Tier 1 & 2 cities.',
    createdAt: '2026-09-14T09:00:00Z',
    updatedAt: '2026-09-18T17:00:00Z',
  },
  {
    id: 'ven-006',
    name: 'Shiprocket Fulfillment',
    category: 'Logistics',
    subcategory: 'Multi-Courier Aggregator & Warehousing',
    location: 'Gurugram, Haryana',
    website: 'https://shiprocket.in',
    healthStatus: 'Good',
    rating: 4,
    specialty: 'Multi-carrier routing (Delhivery, Xpressbees, Shadowfax) + COD remittance',
    stage: 'Rate Card & Service Zones',
    stageProgressPercent: 35,
    contacts: [
      { id: 'c-601', name: 'Pooja Aggarwal', role: 'Enterprise Sales Lead', email: 'pooja.a@shiprocket.com', phone: '+91 99100 88219', isPrimary: true },
    ],
    commercials: {
      currency: '₹',
      paymentTerms: 'Prepaid Wallet / Early COD Remittance (T+2)',
      ratesSummary: '₹42 / 500g Surface, ₹62 / 500g Air fallback',
      slaCommitment: 'Early COD remittance within 48 hours of delivery',
    },
    communicationLogs: [
      { id: 'log-601', date: '2026-09-26', channel: 'Email', summary: 'Requested custom rate slab based on projected 300 parcels/month for Drop 1.', outcome: 'Awaiting account executive review.', nextFollowUpDate: '2026-10-09', loggedBy: 'Hari' },
    ],
    lastContactedAt: '2026-09-26',
    nextFollowUpAt: '2026-10-09',
    notes: 'Backup aggregator for remote pincodes and heavy surface parcels.',
    createdAt: '2026-09-16T09:00:00Z',
    updatedAt: '2026-09-26T12:00:00Z',
  },
  {
    id: 'ven-007',
    name: 'Prestige Craft Packaging',
    category: 'Packaging',
    subcategory: 'Luxury Rigid Boxes & Polybags',
    location: 'Mumbai, Maharashtra',
    healthStatus: 'Good',
    rating: 5,
    specialty: 'FSC-certified 1200 GSM matte rigid magnetic boxes & debossed gold foil',
    stage: 'Color & Finish Approval',
    stageProgressPercent: 65,
    contacts: [
      { id: 'c-701', name: 'Manish Choksi', role: 'Production Director', email: 'manish@prestigecraft.in', phone: '+91 98200 55102', isPrimary: true },
    ],
    commercials: {
      currency: '₹',
      paymentTerms: '50% Advance / 50% Pre-Dispatch',
      ratesSummary: '₹68 / rigid box at 1,000 pcs MOQ; ₹4.20 per custom polybag',
      slaCommitment: '14-day production cycle post sample proof sign-off',
      taxId: '27AALCP1099N1ZQ',
    },
    communicationLogs: [
      { id: 'log-701', date: '2026-09-28', channel: 'In-Person Meeting', summary: 'Reviewed physical sample dummy box. Gold foil embossing alignment approved; requested warmer matte black lamination.', outcome: 'Revised physical proof arriving on Oct 11.', nextFollowUpDate: '2026-10-11', loggedBy: 'Hari' },
    ],
    documents: [
      { id: 'doc-v7', title: 'Box CAD Dieline & Foil Stamping Vector Spec', type: 'Spec Sheet', validUntil: '2027-12-31' },
    ],
    lastContactedAt: '2026-09-28',
    nextFollowUpAt: '2026-10-11',
    notes: 'Essential for luxury unboxing experience. High quality paper stock.',
    createdAt: '2026-09-15T09:00:00Z',
    updatedAt: '2026-09-28T15:00:00Z',
  },
  {
    id: 'ven-008',
    name: 'Studio Anya Creative PR',
    category: 'Collaboration',
    subcategory: 'Fashion Styling & Influencer Seeding',
    location: 'Bandra West, Mumbai',
    website: 'https://studioanya.agency',
    healthStatus: 'Excellent',
    rating: 5,
    specialty: 'Editorial lookbook photography, creative direction & VIP micro-influencer seeding',
    stage: 'Contract Signed & Advance',
    stageProgressPercent: 55,
    contacts: [
      { id: 'c-801', name: 'Anya Sen', role: 'Founder & Creative Lead', email: 'anya@studioanya.agency', phone: '+91 98201 99403', isPrimary: true },
    ],
    commercials: {
      currency: '₹',
      paymentTerms: '40% Booking Deposit / 30% Shoot Day / 30% Final Grades',
      ratesSummary: '₹1,25,000 package (Studio lookbook, 12 hero styling looks, 6 Reels)',
      slaCommitment: 'Raw selects in 48 hours; final master grades in 7 business days',
    },
    communicationLogs: [
      { id: 'log-801', date: '2026-09-30', channel: 'WhatsApp', summary: 'Moodboard finalized. Confirmed model lineup and studio date for Drop 1 campaign.', outcome: 'Booking advance of ₹50,000 paid.', nextFollowUpDate: '2026-10-14', loggedBy: 'Hari' },
    ],
    documents: [
      { id: 'doc-v8', title: 'Collaboration Agreement & Digital Rights License', type: 'Contract / NDA', validUntil: '2027-03-31' },
    ],
    lastContactedAt: '2026-09-30',
    nextFollowUpAt: '2026-10-14',
    notes: 'Leading creative partner for Rivlet Drop 1 launch visual assets and creator gifting.',
    createdAt: '2026-09-18T09:00:00Z',
    updatedAt: '2026-09-30T17:00:00Z',
  },
  {
    id: 'ven-009',
    name: 'K.R. & Associates Chartered Accountants',
    category: 'FinancialLegal',
    subcategory: 'Statutory Audit & Tax Compliance',
    location: 'Alwarpet, Chennai',
    healthStatus: 'Excellent',
    rating: 5,
    specialty: 'E-commerce GST filings, transfer pricing, annual statutory audit & TDS compliance',
    stage: 'Ongoing Retainer',
    stageProgressPercent: 100,
    contacts: [
      { id: 'c-901', name: 'K. Ramanathan, FCA', role: 'Senior Managing Partner', email: 'kr@krassociates.in', phone: '+91 44249 98820', isPrimary: true },
    ],
    commercials: {
      currency: '₹',
      paymentTerms: 'Monthly Retainer (Net 15)',
      ratesSummary: '₹22,000 / month retainer fee',
      slaCommitment: 'All statutory GSTR-1 / GSTR-3B filings completed 3 days prior to due dates',
      taxId: '33AAGFK3321R1ZW',
    },
    communicationLogs: [
      { id: 'log-901', date: '2026-09-25', channel: 'Email', summary: 'Filed quarterly corporate advance tax and reconciled input tax credit ledger.', outcome: 'Challan copies received and filed in Vault.', loggedBy: 'Hari' },
    ],
    documents: [
      { id: 'doc-v9', title: 'Annual Retainer Agreement 2026-27', type: 'Contract / NDA', validUntil: '2027-03-31' },
    ],
    lastContactedAt: '2026-09-25',
    notes: 'Primary accounting and tax compliance firm for Rivlet operations.',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-25T11:00:00Z',
  },
  {
    id: 'ven-010',
    name: 'Shopify Plus & Klaviyo Suite',
    category: 'SoftwareTech',
    subcategory: 'E-Commerce Platform & CRM',
    location: 'Cloud SaaS',
    website: 'https://shopify.com',
    healthStatus: 'Excellent',
    rating: 5,
    specialty: 'Enterprise headless storefront hosting, custom checkout and email flow automation',
    stage: 'Active & Monitored',
    stageProgressPercent: 100,
    contacts: [
      { id: 'c-1001', name: 'Priority Partner Support', role: 'Technical Account Specialist', email: 'merchant-support@shopify.com', isPrimary: true },
    ],
    commercials: {
      currency: '$',
      paymentTerms: 'Annual Subscription Auto-Debit',
      ratesSummary: '$2,000 / year base platform + Klaviyo subscriber tiers',
      slaCommitment: '99.99% Storefront Uptime SLA',
    },
    communicationLogs: [
      { id: 'log-1001', date: '2026-09-10', channel: 'Portal', summary: 'Setup webhook endpoints for order dispatch notifications and customer welcome journey.', outcome: 'Flows active.', loggedBy: 'Hari' },
    ],
    lastContactedAt: '2026-09-10',
    notes: 'Core e-commerce and customer retention infrastructure.',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-10T12:00:00Z',
  },
];

export const initialPipelineItems: PipelineItem[] = [
  { id: 'pip-001', styleName: 'Leggings', category: "Women's Activewear", drop: 'Drop 1', stage: 'Design Finalized', targetQuantity: 400, createdAt: '2026-09-20T09:00:00Z', updatedAt: '2026-09-20T09:00:00Z' },
  { id: 'pip-002', styleName: 'Sports Bra', category: "Women's Activewear", drop: 'Drop 1', stage: 'Design Finalized', targetQuantity: 280, createdAt: '2026-09-20T09:00:00Z', updatedAt: '2026-09-20T09:00:00Z' },
  { id: 'pip-003', styleName: 'Training Tee', category: 'Athleisure', drop: 'Drop 1', stage: 'Design Finalized', targetQuantity: 300, createdAt: '2026-09-20T09:00:00Z', updatedAt: '2026-09-20T09:00:00Z' },
  { id: 'pip-004', styleName: 'Co-ord Set', category: 'Athleisure', drop: 'Drop 1', stage: 'Design Finalized', targetQuantity: 250, createdAt: '2026-09-20T09:00:00Z', updatedAt: '2026-09-20T09:00:00Z' },
  { id: 'pip-005', styleName: 'Joggers', category: "Men's Activewear", drop: 'Drop 1', stage: 'Design Finalized', targetQuantity: 220, createdAt: '2026-09-20T09:00:00Z', updatedAt: '2026-09-20T09:00:00Z' },
  { id: 'pip-006', styleName: 'Slip Dress', category: 'Easy/Casual Wear', drop: 'Drop 1', stage: 'Design Finalized', targetQuantity: 130, createdAt: '2026-09-20T09:00:00Z', updatedAt: '2026-09-20T09:00:00Z' },
];

export const initialBudgetItems: BudgetItem[] = [
  {
    id: 'bud-001',
    category: 'Legal / Registration',
    plannedAmount: 35000,
    actualAmount: 25000,
    spendLog: [
      { id: 'spend-001', amount: 25000, date: '2026-09-05', note: 'LLC incorporation & trademark filing' }
    ],
    currency: '₹',
    phase: 'Phase 1',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-05T10:00:00Z'
  },
  {
    id: 'bud-002',
    category: 'Brand Identity + Photography',
    plannedAmount: 85000,
    actualAmount: 40000,
    spendLog: [
      { id: 'spend-002', amount: 40000, date: '2026-09-15', note: 'Visual pitch deck & packaging design deposit' }
    ],
    currency: '₹',
    phase: 'Phase 4',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-15T11:00:00Z'
  },
  {
    id: 'bud-003',
    category: 'Manufacturer Approach + Sampling',
    plannedAmount: 95000,
    actualAmount: 30000,
    spendLog: [
      { id: 'spend-003', amount: 30000, date: '2026-09-22', note: 'Manufacturer mill courier, lab dips & proto fabric' }
    ],
    currency: '₹',
    phase: 'Phase 3',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-22T14:00:00Z'
  },
  { id: 'bud-004', category: 'First Production (1,580 pieces)', plannedAmount: 738900, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 3', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-005', category: 'E-commerce + Packaging + Logistics', plannedAmount: 125000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 4', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-006', category: 'Digital Marketing (3 months)', plannedAmount: 180000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 5', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-007', category: 'Offline Activation (Gyms, Trainers, Events)', plannedAmount: 75000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 5', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-008', category: 'Operations Buffer', plannedAmount: 66100, actualAmount: 0, spendLog: [], currency: '₹', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-009', category: 'Emergency Buffer (Untouched)', plannedAmount: 200000, actualAmount: 0, spendLog: [], currency: '₹', notes: 'Do not draw down except for true emergencies.', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
];

export const initialCashInflows: CashInflowEntry[] = [
  {
    id: 'inf-001',
    amount: 350000,
    date: '2026-09-01',
    source: 'Founder Investment (Tranche 1)',
    note: 'Initial capital injection for legal, registration, brand setup and tech packs',
    createdAt: '2026-09-01T09:00:00Z'
  },
  {
    id: 'inf-002',
    amount: 250000,
    date: '2026-09-20',
    source: 'Founder Investment (Tranche 2)',
    note: 'Sampling tranche & mill visit commitments',
    createdAt: '2026-09-20T09:00:00Z'
  },
  {
    id: 'inf-003',
    amount: 400000,
    date: '2026-10-10',
    source: 'Scheduled Partner Capital',
    note: 'Advance tranche for bulk fabric procurement & factory PO deposit',
    createdAt: '2026-09-25T09:00:00Z'
  }
];

export const initialBudgetSettings: BudgetSettings = {
  id: 'default',
  totalPlannedOverride: 1500000,
  inflows: initialCashInflows,
  updatedAt: '2026-09-01T09:00:00Z',
};

export const initialSprints: Sprint[] = [
  {
    id: 'spr-001',
    name: 'Sprint 1: Manufacturer Outreach',
    goal: 'Days 1–21: contact and qualify candidate manufacturers via the 5-touch sequence.',
    startDate: '2026-09-29',
    endDate: '2026-10-12',
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'spr-002',
    name: 'Sprint 2: Factory Visits & Sampling Kickoff',
    goal: 'Days 22–35: shortlist visits, confirm vertical integration, start proto sampling.',
    startDate: '2026-10-13',
    endDate: '2026-10-26',
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
];

export const initialWorkItems: WorkItem[] = [
  {
    id: 'wi-epic-001',
    type: 'Epic',
    title: 'Drop 1 Launch: 6 Styles',
    description: 'End-to-end launch of the first 1,580-piece production run across Leggings, Sports Bra, Training Tee, Co-ord Set, Joggers, and Slip Dress.',
    acceptanceCriteria: 'All 6 styles are in-stock and live on the D2C store; production QC passed AQL 2.5 standard.',
    state: 'Active',
    priority: 1,
    order: 1,
    tags: ['Drop 1', 'Launch'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-feat-001',
    type: 'Feature',
    title: 'Manufacturer Selection & Onboarding',
    description: 'Identify, audit, and finalize a vertically integrated manufacturer for Drop 1 production run.',
    acceptanceCriteria: 'A manufacturer is under signed PO with agreed MOQ (175 pcs/style) and payment terms (30/50/20).',
    state: 'Active',
    priority: 1,
    order: 1,
    parentId: 'wi-epic-001',
    tags: ['Manufacturing', 'Operations'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-story-001',
    type: 'User Story',
    title: 'Lead manufacturer qualification & outreach for Layo Group',
    description: 'Execute and oversee the 5-touch qualification sequence with Layo Group: initial spec email, 48h WhatsApp follow-up, tech-pack sharing on Day 5, phone call on Day 8, and factory visit scheduling.',
    acceptanceCriteria: 'Layo Group vertical integration confirmed (yarn to stitching); MOQ confirmed at 175 pcs; initial payment terms agreed at 30/50/20.',
    state: 'Active',
    priority: 1,
    order: 1,
    storyPoints: 5,
    parentId: 'wi-feat-001',
    sprintId: 'spr-001',
    linkedVendorId: 'ven-001',
    linkedPipelineItemId: 'pip-001',
    linkedPipelineItemIds: ['all'],
    operationCategory: 'Operations & Sourcing',
    tags: ['Outreach', 'Layo Group'],
    comments: [
      {
        id: 'cm-001',
        author: 'Rivlet Admin',
        text: 'Initial outreach sent with tech specs. Layo Group confirmed receipt and is reviewing fabric MOQ.',
        createdAt: '2026-09-29T11:30:00Z',
      },
    ],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-task-001',
    type: 'Task',
    title: 'Send initial outreach email & Drop 1 specs to Layo Group',
    description: 'Send formal introduction, product line overview, and target quantities (1,580 total pcs across 6 styles).',
    acceptanceCriteria: 'Email dispatched with read confirmation; logged in Vendor CRM.',
    state: 'Resolved',
    priority: 1,
    order: 1,
    storyPoints: 1,
    parentId: 'wi-story-001',
    sprintId: 'spr-001',
    linkedVendorId: 'ven-001',
    linkedPipelineItemIds: ['all'],
    operationCategory: 'Operations & Sourcing',
    tags: ['Outreach'],
    completedDate: '2026-09-29',
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-task-002',
    type: 'Task',
    title: 'WhatsApp follow-up & confirm sample room capacity (48h)',
    description: 'Follow up via WhatsApp to verify Layo Group received the line sheet and has open capacity for proto sampling.',
    acceptanceCriteria: 'Sample room manager responds with confirmed proto sampling turn-around time (target: 10 days).',
    state: 'Active',
    priority: 2,
    order: 2,
    storyPoints: 1,
    parentId: 'wi-story-001',
    sprintId: 'spr-001',
    linkedVendorId: 'ven-001',
    operationCategory: 'Operations & Sourcing',
    tags: ['Outreach'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-task-003',
    type: 'Task',
    title: 'Validate 4-way stretch fabric GSM & lab-dip timeline with Layo Group',
    description: 'Verify 240 GSM nylon-spandex blend swatches in Midnight and Cardamom colorways for Leggings and Sports Bra.',
    acceptanceCriteria: 'Fabric spec sheet and lab-dip delivery date locked in calendar.',
    state: 'In Review',
    priority: 1,
    order: 3,
    storyPoints: 2,
    parentId: 'wi-story-001',
    sprintId: 'spr-001',
    linkedVendorId: 'ven-001',
    linkedPipelineItemIds: ['pip-001', 'pip-002'],
    operationCategory: 'Sampling & Fit',
    tags: ['Fabric'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-story-002',
    type: 'User Story',
    title: 'Assess Wings2Fashion as secondary vertically integrated manufacturer',
    description: 'Benchmark Wings2Fashion against Layo Group for seamless and cut-and-sew activewear. Compare costing sheets, sample lead times, and GOTS/OEKO-TEX certifications.',
    acceptanceCriteria: 'Side-by-side cost breakdown completed; proto sample quote received under ₹650 per piece target.',
    state: 'Active',
    priority: 2,
    order: 2,
    storyPoints: 3,
    parentId: 'wi-feat-001',
    sprintId: 'spr-001',
    linkedVendorId: 'ven-002',
    linkedPipelineItemIds: ['pip-001', 'pip-002'],
    operationCategory: 'Operations & Sourcing',
    tags: ['Outreach', 'Wings2Fashion'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-task-004',
    type: 'Task',
    title: 'Request fabric swatches & OEKO-TEX certification from Wings2Fashion',
    description: 'Obtain physical fabric swatches and verify test certificates for poly-spandex and cotton-modal blends.',
    acceptanceCriteria: 'Courier tracking received for swatch book; certificate validity verified.',
    state: 'New',
    priority: 2,
    order: 1,
    storyPoints: 1,
    parentId: 'wi-story-002',
    sprintId: 'spr-001',
    linkedVendorId: 'ven-002',
    operationCategory: 'Operations & Sourcing',
    tags: ['Swatches'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-task-005',
    type: 'Task',
    title: 'Audit factory compliance checklist & MOQ flexibility',
    description: 'Check worker safety, machinery modernness, and confirm willingness to accept 175 pcs MOQ per style for Drop 1.',
    acceptanceCriteria: 'Factory audit questionnaire completed with yes/no compliance scores.',
    state: 'New',
    priority: 2,
    order: 2,
    storyPoints: 1,
    parentId: 'wi-story-002',
    sprintId: 'spr-001',
    linkedVendorId: 'ven-002',
    operationCategory: 'Operations & Sourcing',
    tags: ['Audit'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-story-003',
    type: 'User Story',
    title: 'Drop 1 Master Tech Pack & Grading Approval across All Styles',
    description: 'Verify all measurement charts, stitch tolerances (flatlock seams, bar tacks), and care label artworks for all 6 launch styles before proto cutting begins.',
    acceptanceCriteria: 'Tech packs finalized for Leggings, Sports Bra, Training Tee, Co-ord Set, Joggers, and Slip Dress. Signed off by Lead & Founder.',
    state: 'New',
    priority: 1,
    order: 3,
    storyPoints: 5,
    parentId: 'wi-feat-001',
    sprintId: 'spr-001',
    linkedPipelineItemIds: ['all'],
    operationCategory: 'Sampling & Fit',
    tags: ['TechPack', 'AllStyles'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-task-006',
    type: 'Task',
    title: 'Review graded specs (XS to XL) for Leggings and Sports Bra',
    description: 'Confirm inseam, waistband tension, and cup seam curvature across all 5 sizes.',
    acceptanceCriteria: 'Grading spec sheet signed off and sent to sample master cutter.',
    state: 'New',
    priority: 1,
    order: 1,
    storyPoints: 2,
    parentId: 'wi-story-003',
    sprintId: 'spr-001',
    linkedPipelineItemIds: ['pip-001', 'pip-002'],
    operationCategory: 'Sampling & Fit',
    tags: ['Specs'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-feat-002',
    type: 'Feature',
    title: 'Sampling Rounds (Proto → Fit → Pre-Production)',
    description: 'Run all 6 Drop 1 styles through proto, fit, and pre-production sampling with the selected manufacturer.',
    acceptanceCriteria: 'Proto and Fit samples approved; pre-production gold seal samples signed off for bulk production.',
    state: 'New',
    priority: 2,
    order: 2,
    parentId: 'wi-epic-001',
    sprintId: 'spr-002',
    tags: ['Sampling', 'Quality'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
];

export const initialTeamMembers: TeamMember[] = [
  {
    id: 'tm-001',
    name: 'Harichandru',
    role: 'Founder',
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'tm-002',
    name: 'Dasani',
    role: 'Operations & Sourcing Lead',
    email: 'dasani@rivlet.com',
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
];

export const initialWorkSettings: WorkSettings = {
  id: 'default',
  defaultSprintLengthDays: 14,
  updatedAt: '2026-09-29T09:00:00Z',
};
