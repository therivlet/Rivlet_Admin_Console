export type ArtifactStatus = 'inbox' | 'approved' | 'promoted' | 'archived';

export interface ArtifactItem {
  id: string;
  title: string;
  description: string;
  category: 'Operations' | 'Calculators' | 'Visual Pitch' | 'Production' | 'Marketing' | 'Custom';
  tags: string[];
  htmlContent: string;
  source: string;
  version: string;
  isPromoted: boolean; // Pinned as a first-class portal page
  routeSlug?: string;  // e.g. "fabric-yield-estimator" -> /tools/fabric-yield-estimator
  status: ArtifactStatus;
  isFavorite?: boolean;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScenarioKey = 'low' | 'mid' | 'high';

export interface ScenarioRange {
  low: number;
  mid: number;
  high: number;
}

export interface PricingInputs {
  productName: string;
  productCode: string; // SKU
  mrp: number; // Listed MRP (GST included)
  currency: string; // '₹' | '$'
  targetMargin: number; // e.g. 25%

  // GST Configuration
  autoOutputTax: boolean; // true: <=2500 -> 5%, >2500 -> 18%
  manualOutputGst: number;
  autoFactoryTax: boolean;
  manualFactoryGst: number;
  factoryGstRecoverable: boolean;
  includeFactoryCash: boolean;

  // Forecast Ranges (Conservative, Expected, Upside)
  units: ScenarioRange;
  discount: ScenarioRange; // %
  cac: ScenarioRange;      // Customer Acquisition Cost
  returnProvision: ScenarioRange; // Return/RTO
  shippingSubsidy: ScenarioRange; // Outbound courier subsidy

  // Product & Inbound Costs (per unit)
  factory: number;
  development: number;
  inbound: number;
  qc: number;
  packaging: number;
  tags: number;
  branding: number;
  receiving: number;
  pickpack: number;
  inventory: number;

  // Import Customs
  importMode: 'domestic' | 'imported';
  intlFreight: number;
  insurance: number;
  bcd: number; // %
  sws: number; // % of BCD
  importIgst: number; // %
  importIgstRecoverable: boolean;
  clearance: number;

  // Sales Charges (Percentage of Net Sales before GST)
  gateway: number; // %
  shopifyFee: number; // %
  affiliate: number; // %
  promoter: number; // %
  marketplace: number; // %
  marketAds: number; // %

  // Sales Charges (Fixed per order)
  cod: number;
  reverse: number;
  exchange: number;

  // Annual Business Overheads
  salary: ScenarioRange;
  office: ScenarioRange;
  saas: ScenarioRange;
  professional: ScenarioRange;
  finance: ScenarioRange;
  brandAmort: ScenarioRange;

  // Technical Garment Bill of Materials (BOM)
  bom?: GarmentBOM;
}

export interface CalculatorDefaults {
  // Brand Commercial Policies
  currency: string;
  targetMargin: number;
  autoOutputTax: boolean;
  manualOutputGst: number;
  autoFactoryTax: boolean;
  manualFactoryGst: number;
  factoryGstRecoverable: boolean;
  includeFactoryCash: boolean;

  // Fixed Standard Production & Inbound Costs (per unit)
  development: number;
  inbound: number;
  qc: number;
  packaging: number;
  tags: number;
  branding: number;
  receiving: number;
  pickpack: number;
  inventory: number;

  // Fixed Sales Charges
  gateway: number;
  shopifyFee: number;
  affiliate: number;
  promoter: number;
  marketplace: number;
  marketAds: number;
  cod: number;
  reverse: number;
  exchange: number;

  // Fixed Annual Business Overheads
  salary: ScenarioRange;
  office: ScenarioRange;
  saas: ScenarioRange;
  professional: ScenarioRange;
  finance: ScenarioRange;
  brandAmort: ScenarioRange;

  // Default Forecast Ranges
  units: ScenarioRange;
  discount: ScenarioRange;
  cac: ScenarioRange;
  returnProvision: ScenarioRange;
  shippingSubsidy: ScenarioRange;

  // Import Customs Defaults
  importMode: 'domestic' | 'imported';
  intlFreight: number;
  insurance: number;
  bcd: number;
  sws: number;
  importIgst: number;
  importIgstRecoverable: boolean;
  clearance: number;

  // User-defined locked fixed fields
  lockedOverheads?: boolean;
  lockedInbound?: boolean;
  lockedSalesRates?: boolean;
}


export interface FabricBOMItem {
  id: string;
  name: string; // e.g. "Main Body French Terry", "2x2 Rib Knit"
  material: string; // e.g. "100% Combed Compact Cotton"
  weightGsm: number; // e.g. 450
  consumption: number; // e.g. 0.85
  unit: 'kg' | 'meters' | 'pieces';
  ratePerUnit: number; // e.g. 680
  totalCost: number;
}

export interface TrimBOMItem {
  id: string;
  name: string; // e.g. "Custom Laser Engraved Aglets", "High-Density Neck Label"
  category: 'Trims & Hardware' | 'Labels & Packaging' | 'Labor & Finishing';
  specification: string;
  quantity: number;
  ratePerUnit: number;
  totalCost: number;
}

export interface GarmentBOM {
  garmentType: string;
  fabricItems: FabricBOMItem[];
  trimItems: TrimBOMItem[];
  stitchingLabor: number;
  washFinishCost: number;
  totalBOMCost: number;
  notes?: string;
}


export interface CalculationResult {
  scenario: ScenarioKey;
  units: number;
  discount: number;
  customerPrice: number;
  outputRate: number;
  outputGst: number;
  netSales: number;
  baseProductCost: number;
  overheadAnnual: number;
  overheadPerUnit: number;
  fixedOrder: number;
  salesRates: number;
  salesRateCost: number;
  contributionProfit: number;
  contributionMargin: number;
  grossProfit: number;
  grossMargin: number;
  totalCosts: number;
  breakEvenMrp: number;
  targetMrp: number;
  maximumFactoryCost: number;
  factoryRate: number;
  factoryGst: number;
  inputTaxCash: number;
  factoryCashOutlay: number;
  annualRevenue: number;
  annualContribution: number;
  status: 'On / above target' | 'Profitable but below target' | 'Below break-even';
  customsNote: string;
  customsRows: [string, string, number][];
}

export interface CostingSheet {
  id: string;
  sku: string;
  styleName: string;
  season?: string;
  category?: string;
  currency: string;
  mrp: number;
  expectedMargin: number;
  inputs: PricingInputs;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  documentType: 'Certificate' | 'Tech Pack' | 'Audit Report' | 'Legal & Contract' | 'Specification';
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  fileFormat: 'pdf' | 'docx' | 'xlsx' | 'html' | 'image';
  expiryDate?: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Draft';
  tags: string[];
  associatedVendor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  category: 'Vendors & Mills' | 'Quality & AQL' | 'Brand Guidelines' | 'Garment Specs' | 'Business Operations';
  content: string; // Markdown formatted
  isConfidential: boolean;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Vendor / Manufacturer Outreach CRM ---

export type VendorOutreachStage =
  | 'Prospect'
  | 'Email Sent'
  | 'WhatsApp Follow-up'
  | 'Second Email'
  | 'Call Attempted'
  | 'LinkedIn Referral'
  | 'Factory Visit Scheduled'
  | 'Sampling'
  | 'Negotiating'
  | 'Approved Partner'
  | 'Rejected / Stalled';

export interface VendorItem {
  id: string;
  name: string; // e.g. "Techno Sportswear"
  location: string; // e.g. "Tirupur, Tamil Nadu"
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isVerticallyIntegrated?: boolean | null; // yarn -> knit -> dye -> stitch in-house, null = unknown/unasked
  specialty?: string; // e.g. "78/22 Nylon-Lycra compression knits"
  stage: VendorOutreachStage;
  moqOffered?: number;
  moqTarget?: number; // Rivlet's ask, e.g. 175
  paymentTermsOffered?: string;
  paymentTermsTarget?: string; // e.g. "30% advance / 50% pre-shipment / 20% on delivery"
  samplingFee?: number;
  certifications?: string[]; // e.g. ['GOTS', 'OEKO-TEX Standard 100']
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Sampling & Production Pipeline ---

export type PipelineStage =
  | 'Design Finalized'
  | 'Proto Sample'
  | 'Fit Sample'
  | 'Pre-Production Sample'
  | 'Approved'
  | 'PO Issued'
  | 'In Production'
  | 'QC Inspection'
  | 'Shipped'
  | 'Delivered'
  | 'On Hold';

export interface PipelineItem {
  id: string;
  styleName: string; // e.g. "Leggings"
  sku?: string; // links to a CostingSheet.sku if priced
  category: 'Women\'s Activewear' | 'Men\'s Activewear' | 'Athleisure' | 'Easy/Casual Wear';
  colorway?: string; // 'Midnight' | 'Cardamom' | etc.
  drop: string; // e.g. "Drop 1"
  vendorId?: string; // links to VendorItem
  stage: PipelineStage;
  targetQuantity?: number;
  targetDate?: string;
  actualDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Launch Budget Tracker ---

export interface BudgetItem {
  id: string;
  category: string; // e.g. "First production (1,580 pieces)"
  plannedAmount: number;
  actualAmount: number;
  currency: string; // '₹'
  phase?: string; // e.g. "Phase 3: Manufacturing"
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- ADO-style Work Tracking: Sprints & Work Items ---

export type WorkItemType = 'Epic' | 'Feature' | 'User Story' | 'Task' | 'Bug';
export type WorkItemState = 'New' | 'Active' | 'In Review' | 'Resolved' | 'Closed';
export type WorkItemPriority = 1 | 2 | 3 | 4; // 1 = highest, matches ADO convention

export interface WorkItemComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  state: WorkItemState;
  priority: WorkItemPriority;
  storyPoints?: number;
  assignee?: string;
  tags: string[];
  parentId?: string; // Epic -> Feature -> User Story -> Task/Bug
  sprintId?: string; // links to Sprint.id ("Unscheduled" if omitted / backlog)
  linkedVendorId?: string; // cross-link to a Manufacturer/Vendor record
  linkedPipelineItemId?: string; // cross-link to a Sampling & Production style
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  comments: WorkItemComment[];
  createdAt: string;
  updatedAt: string;
}

export type SprintStatus = 'future' | 'current' | 'past';

export interface Sprint {
  id: string;
  name: string; // e.g. "Sprint 1 - Manufacturer Outreach"
  goal?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// --- Team Roster & Work Tracking Settings ---

export interface TeamMember {
  id: string;
  name: string;
  role?: string; // e.g. "Founder", "Sourcing Manager", "Sample Coordinator"
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSettings {
  id: string; // singleton row, always 'default'
  defaultSprintLengthDays: number; // e.g. 7, 14, 21, 28
  updatedAt: string;
}
