import { ArtifactItem, CostingSheet, DocumentItem, KBArticle, VendorItem, PipelineItem, BudgetItem, Sprint, WorkItem, TeamMember, WorkSettings, BudgetSettings } from './types';
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

### 1. Southern Eco Mills (Tirupur, India)
- **Specialty**: Heavyweight French Terry (400–520 GSM), Combed Organic Cotton Jersey (220–300 GSM).
- **Certifications**: GOTS Scope Certificate, OEKO-TEX Standard 100 Class I.
- **Minimum Order Quantity (MOQ)**:
  - Custom Lab Dip Color: 300 kg / color
  - Running Greige stock: 150 kg
- **Payment Terms**: 30% Advance at PO, 70% against Bill of Lading (BL) copy.
- **Key Contact**: Rajesh Kumar (Head of Exports) — \`rajesh@southerneco.in\` / +91 98420 XXXXX

---

### 2. Apex Specialty Dyeing & Wash House (Surat / Tirupur)
- **Specialty**: Pigment dyeing, Mineral vintage acid wash, Enzyme bio-polishing.
- **Capacity**: 15,000 pcs / month.
- **Lead Time**: 12 days from greige fabric receipt.
- **Key Contact**: Meera Nair — \`meera.nair@apexdyeing.com\`
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
  }
];

export const initialVendors: VendorItem[] = [
  {
    id: 'ven-001',
    name: 'Techno Sportswear',
    location: 'Tirupur, Tamil Nadu',
    specialty: 'Vertically integrated activewear (yarn to stitching)',
    isVerticallyIntegrated: null,
    stage: 'Prospect',
    moqTarget: 175,
    paymentTermsTarget: '30% advance / 50% pre-shipment / 20% on delivery',
    certifications: [],
    notes: 'Top outreach target. Ask the qualifying question: fully vertical (yarn, knitting, dyeing, stitching all in-house)?',
    createdAt: '2026-09-20T09:00:00Z',
    updatedAt: '2026-09-20T09:00:00Z',
  },
  {
    id: 'ven-002',
    name: 'Wings2Fashion',
    location: 'Tirupur, Tamil Nadu',
    specialty: 'Vertically integrated activewear (yarn to stitching)',
    isVerticallyIntegrated: null,
    stage: 'Prospect',
    moqTarget: 175,
    paymentTermsTarget: '30% advance / 50% pre-shipment / 20% on delivery',
    certifications: [],
    notes: 'Second outreach target from the manufacturer playbook.',
    createdAt: '2026-09-20T09:00:00Z',
    updatedAt: '2026-09-20T09:00:00Z',
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
  { id: 'bud-001', category: 'Legal / Registration', plannedAmount: 35000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 1', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-002', category: 'Brand Identity + Photography', plannedAmount: 85000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 4', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-003', category: 'Manufacturer Approach + Sampling', plannedAmount: 95000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 3', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-004', category: 'First Production (1,580 pieces)', plannedAmount: 738900, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 3', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-005', category: 'E-commerce + Packaging + Logistics', plannedAmount: 125000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 4', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-006', category: 'Digital Marketing (3 months)', plannedAmount: 180000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 5', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-007', category: 'Offline Activation (Gyms, Trainers, Events)', plannedAmount: 75000, actualAmount: 0, spendLog: [], currency: '₹', phase: 'Phase 5', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-008', category: 'Operations Buffer', plannedAmount: 66100, actualAmount: 0, spendLog: [], currency: '₹', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
  { id: 'bud-009', category: 'Emergency Buffer (Untouched)', plannedAmount: 200000, actualAmount: 0, spendLog: [], currency: '₹', notes: 'Do not draw down except for true emergencies.', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z' },
];

export const initialBudgetSettings: BudgetSettings = {
  id: 'default',
  totalPlannedOverride: 1500000,
  updatedAt: '2026-09-01T09:00:00Z',
};

export const initialSprints: Sprint[] = [
  {
    id: 'spr-001',
    name: 'Sprint 1 — Manufacturer Outreach',
    goal: 'Days 1–21: contact and qualify Tirupur manufacturers via the 5-touch sequence.',
    startDate: '2026-09-29',
    endDate: '2026-10-12',
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'spr-002',
    name: 'Sprint 2 — Factory Visits & Sampling Kickoff',
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
    title: 'Drop 1 Launch — 6 Styles',
    description: 'End-to-end launch of the first 1,580-piece production run across Leggings, Sports Bra, Training Tee, Co-ord Set, Joggers, and Slip Dress.',
    acceptanceCriteria: 'All 6 styles are in-stock and live on the D2C store; production QC passed AQL 2.5.',
    state: 'Active',
    priority: 1,
    tags: ['Drop 1', 'Launch'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-feat-001',
    type: 'Feature',
    title: 'Manufacturer Selection & Onboarding',
    description: 'Identify and finalize a vertically integrated Tirupur manufacturer for Drop 1 production.',
    acceptanceCriteria: 'A manufacturer is under signed PO with agreed MOQ (175 pcs) and payment terms (30/50/20).',
    state: 'Active',
    priority: 1,
    parentId: 'wi-epic-001',
    tags: ['Manufacturing'],
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-story-001',
    type: 'User Story',
    title: 'As founder, I want to contact Techno Sportswear so I can assess fit as a manufacturing partner',
    description: 'Run the 5-touch outreach sequence: Tuesday email, WhatsApp at 48h, second email Day 5, phone Day 8, LinkedIn referral Day 10.',
    acceptanceCriteria: 'Vendor record updated with response, vertical-integration answer, and next steps.',
    state: 'Active',
    priority: 1,
    storyPoints: 3,
    parentId: 'wi-feat-001',
    sprintId: 'spr-001',
    assignee: 'Harichandru',
    tags: ['Outreach', 'Techno Sportswear'],
    targetDate: '2026-10-09',
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-task-001',
    type: 'Task',
    title: 'Send initial outreach email to Techno Sportswear',
    state: 'Resolved',
    priority: 1,
    storyPoints: 1,
    parentId: 'wi-story-001',
    sprintId: 'spr-001',
    assignee: 'Harichandru',
    tags: ['Outreach'],
    targetDate: '2026-09-30',
    completedDate: '2026-09-29',
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-task-002',
    type: 'Task',
    title: 'WhatsApp follow-up (48h after email)',
    state: 'Active',
    priority: 2,
    storyPoints: 1,
    parentId: 'wi-story-001',
    sprintId: 'spr-001',
    assignee: 'Harichandru',
    tags: ['Outreach'],
    targetDate: '2026-10-01',
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-story-002',
    type: 'User Story',
    title: 'As founder, I want to contact Wings2Fashion so I can compare it against Techno Sportswear',
    state: 'New',
    priority: 2,
    storyPoints: 3,
    parentId: 'wi-feat-001',
    sprintId: 'spr-001',
    assignee: 'Harichandru',
    tags: ['Outreach', 'Wings2Fashion'],
    targetDate: '2026-10-09',
    comments: [],
    createdAt: '2026-09-29T09:00:00Z',
    updatedAt: '2026-09-29T09:00:00Z',
  },
  {
    id: 'wi-feat-002',
    type: 'Feature',
    title: 'Sampling Rounds (Proto → Fit → Pre-Production)',
    description: 'Run all 6 Drop 1 styles through proto, fit, and pre-production sampling with the selected manufacturer.',
    state: 'New',
    priority: 2,
    parentId: 'wi-epic-001',
    sprintId: 'spr-002',
    tags: ['Sampling'],
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
];

export const initialWorkSettings: WorkSettings = {
  id: 'default',
  defaultSprintLengthDays: 14,
  updatedAt: '2026-09-29T09:00:00Z',
};
