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
  freightType?: 'percent' | 'fixed';
  freightValue?: number;
  insuranceType?: 'percent' | 'fixed';
  insuranceValue?: number;
  intlFreight: number;
  insurance: number;
  bcd: number; // %
  sws: number; // %
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

  // Overhead Allocation Mode
  overheadAllocationMode?: 'brand_volume' | 'sku_volume';
  brandAnnualUnits?: ScenarioRange; // Total annual unit sales comprising all SKUs in the year

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

  // Overhead Allocation Mode Defaults
  overheadAllocationMode?: 'brand_volume' | 'sku_volume';
  brandAnnualUnits?: ScenarioRange; // Total annual unit sales comprising all SKUs in the year

  // Default Forecast Ranges
  units: ScenarioRange;
  discount: ScenarioRange;
  cac: ScenarioRange;
  returnProvision: ScenarioRange;
  shippingSubsidy: ScenarioRange;

  // Import Customs Defaults
  importMode: 'domestic' | 'imported';
  freightType?: 'percent' | 'fixed';
  freightValue?: number;
  insuranceType?: 'percent' | 'fixed';
  insuranceValue?: number;
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
  overheadAllocationUnits?: number;
  overheadAllocationMode?: 'brand_volume' | 'sku_volume';
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
  associatedVendor?: string; // free-text fallback; kept for documents predating vendorId
  vendorId?: string; // real link to VendorItem
  pipelineItemId?: string; // real link to a PipelineItem (e.g. a tech pack's style)
  createdAt: string;
  updatedAt: string;
}

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  category: 'Vendors & Mills' | 'Quality & AQL' | 'Brand Guidelines' | 'Garment Specs' | 'Business Operations' | 'Finance & Unit Economics';
  content: string; // Markdown formatted
  isConfidential: boolean;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Vendor & Manufacturer Ecosystem Platform ---

export type VendorCategory =
  | 'Manufacturer'
  | 'Logistics'
  | 'PaymentGateway'
  | 'Packaging'
  | 'Collaboration'
  | 'FinancialLegal'
  | 'SoftwareTech'
  | 'General';

export type VendorHealthStatus = 'Excellent' | 'Good' | 'At Risk' | 'Under Review';

export interface VendorContact {
  id: string;
  name: string;
  role: string; // e.g. "Primary Key Account Manager", "Merchandising Lead", "Partner Counsel"
  email: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface VendorCommunicationEntry {
  id: string;
  date: string;
  channel: 'WhatsApp' | 'Email' | 'Phone Call' | 'In-Person Meeting' | 'Portal' | 'Note';
  summary: string;
  outcome?: string;
  nextFollowUpDate?: string;
  loggedBy: string;
}

export interface VendorCommercials {
  currency?: string; // '₹', '$', '€'
  paymentTerms?: string; // e.g. "Net 30", "30% Adv / 70% Pre-dispatch", "Monthly Retainer"
  creditLimit?: number;
  creditDays?: number;
  taxId?: string; // GSTIN / PAN / VAT
  bankDetails?: string;
  ratesSummary?: string; // e.g. "2% + GST TDR", "₹48/500g Air Metro"
  slaCommitment?: string; // e.g. "99.2% uptime", "48h metro delivery", "AQL 2.5"
}

export interface VendorDocumentLink {
  id: string;
  title: string;
  type: 'Contract / NDA' | 'Rate Card' | 'SLA' | 'Invoice' | 'Compliance / Cert' | 'Spec Sheet' | 'Other';
  urlOrVaultId?: string;
  validUntil?: string;
}

export type VendorOutreachStage =
  | 'Prospect'
  | 'Proposed'
  | 'Email Sent'
  | 'WhatsApp Follow-up'
  | 'Second Email'
  | 'Call Attempted'
  | 'Call Attended'
  | 'LinkedIn Referral'
  | 'Factory Visit Scheduled'
  | 'Sampling'
  | 'Negotiating'
  | 'Approved Partner'
  | 'Rejected / Stalled';

export interface VendorItem {
  id: string;
  name: string; // e.g. "Layo Group", "Razorpay", "Blue Dart"
  category?: VendorCategory; // defaults to 'Manufacturer'
  subcategory?: string; // e.g. "Yarn & Knit Mill", "3PL Air Courier", "Payment Gateway"
  location: string; // e.g. "Tirupur, Tamil Nadu", "Bengaluru", "Mumbai"
  website?: string;
  healthStatus?: VendorHealthStatus;
  rating?: number; // 1-5 stars

  // Contacts
  contactName?: string; // legacy fallback
  contactEmail?: string; // legacy fallback
  contactPhone?: string; // legacy fallback
  contacts?: VendorContact[];

  // Dynamic Workflow State (supports category-specific stages or legacy VendorOutreachStage)
  stage: string;
  stageProgressPercent?: number; // 0 to 100

  // Manufacturer-specific specifications
  isVerticallyIntegrated?: boolean | null; // yarn -> knit -> dye -> stitch in-house, null = unknown/unasked
  specialty?: string; // e.g. "78/22 Nylon-Lycra compression knits"
  moqOffered?: number;
  moqTarget?: number; // Rivlet's ask, e.g. 175
  paymentTermsOffered?: string;
  paymentTermsTarget?: string; // e.g. "30% advance / 50% pre-shipment / 20% on delivery"
  samplingFee?: number;
  certifications?: string[]; // e.g. ['GOTS', 'OEKO-TEX Standard 100']

  // Category Specs & Commercials
  commercials?: VendorCommercials;
  communicationLogs?: VendorCommunicationEntry[];
  documents?: VendorDocumentLink[];
  categorySpecs?: Record<string, any>;

  lastContactedAt?: string;
  nextFollowUpAt?: string;
  notes?: string;
  totalSpendToDate?: number;
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
  accessionCode?: string; // unique style accession/archive code, e.g. "ACC-FW26-001"
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

export interface BudgetSpendEntry {
  id: string;
  amount: number;
  date: string; // ISO date the spend happened
  note?: string;
}

export interface BudgetItem {
  id: string;
  category: string; // e.g. "First production (1,580 pieces)"
  plannedAmount: number;
  actualAmount: number; // maintained as the sum of spendLog entries
  spendLog: BudgetSpendEntry[];
  currency: string; // '₹'
  phase?: string; // e.g. "Phase 3: Manufacturing"
  notes?: string;
  order?: number; // Sorting/display order in budget ledger
  createdAt: string;
  updatedAt: string;
}

export interface CashInflowEntry {
  id: string;
  amount: number;
  date: string; // ISO date (YYYY-MM-DD) when funds are injected / scheduled
  source: string; // e.g. "Founder Investment", "Working Capital", "Angel Partner"
  note?: string;
  createdAt?: string;
}

export interface BudgetSettings {
  id: string; // singleton row, always 'default'
  totalPlannedOverride?: number; // fixed ceiling independent of the sum of line items
  inflows?: CashInflowEntry[]; // Capital injections / funds added
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
  linkedPipelineItemId?: string; // cross-link to a single Sampling & Production style (legacy/compatibility)
  linkedPipelineItemIds?: string[]; // cross-link to multiple Sampling & Production styles (or ['all'])
  operationCategory?: string; // e.g. "Operations", "Sourcing & Fabrics", "Sampling & Fit", "Production QC", etc.
  order?: number; // Sorting/display order within sprint or board
  taskNumber?: number; // Persistent task sequence number within parent story / workflow
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
