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
