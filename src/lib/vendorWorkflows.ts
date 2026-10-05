import {
  Factory,
  Truck,
  CreditCard,
  Package,
  Sparkles,
  Scale,
  Cpu,
  Building2,
  LucideIcon,
} from 'lucide-react';
import { VendorCategory, VendorItem, VendorOutreachStage } from './types';

export interface WorkflowStageConfig {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  progressPercent: number;
  isTerminalSuccess?: boolean;
  isTerminalFailure?: boolean;
}

export interface CategoryConfig {
  id: VendorCategory;
  label: string;
  pluralLabel: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  stages: WorkflowStageConfig[];
}

export const VENDOR_CATEGORIES: Record<VendorCategory, CategoryConfig> = {
  Manufacturer: {
    id: 'Manufacturer',
    label: 'Garment Manufacturer & Mill',
    pluralLabel: 'Manufacturers & Mills',
    shortLabel: 'Manufacturers',
    description: 'Cut & sew apparel factories, knitting mills, dye houses, and fabric weavers.',
    icon: Factory,
    badgeBg: 'bg-[#181512]',
    badgeText: 'text-[#e6c875]',
    badgeBorder: 'border-[#3a2e1d]',
    accentColor: '#cda052',
    stages: [
      { id: 'm-prospect', name: 'Prospect / Discovery', shortLabel: '1. Discovery', description: 'Factory identified; initial capability check and intro email/call.', progressPercent: 10 },
      { id: 'm-swatches', name: 'Capabilities & Swatches', shortLabel: '2. Swatches', description: 'Reviewing fabric swatches, GSM quality, machinery specs.', progressPercent: 25 },
      { id: 'm-sampling', name: 'Proto & Fit Sampling', shortLabel: '3. Sampling', description: 'Active sampling round (Proto, Fit, or Pre-Production sample).', progressPercent: 45 },
      { id: 'm-audit', name: 'Factory Audit & AQL', shortLabel: '4. Audit', description: 'Physical or virtual compliance audit, ethical check, OEKO-TEX/GOTS.', progressPercent: 65 },
      { id: 'm-negotiation', name: 'Commercials & MOQ Terms', shortLabel: '5. Terms', description: 'Finalizing target MOQ vs offered, payment terms, and delivery timeline.', progressPercent: 80 },
      { id: 'm-approved', name: 'Approved Partner', shortLabel: '6. Approved', description: 'Vetted partner ready for active Purchase Orders.', progressPercent: 95, isTerminalSuccess: true },
      { id: 'm-production', name: 'Active PO Production', shortLabel: '7. Live PO', description: 'Bulk production orders currently in execution on the factory floor.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'm-stalled', name: 'On Hold / Stalled', shortLabel: 'Hold', description: 'Outreach paused or negotiations stalled.', progressPercent: 0, isTerminalFailure: true },
    ],
  },
  Logistics: {
    id: 'Logistics',
    label: 'Courier & 3PL Logistics',
    pluralLabel: 'Couriers & 3PL Logistics',
    shortLabel: 'Logistics / 3PL',
    description: 'Domestic air couriers, surface logistics, cross-border shipping, and 3PL fulfillment.',
    icon: Truck,
    badgeBg: 'bg-[#101724]',
    badgeText: 'text-[#93c5fd]',
    badgeBorder: 'border-[#1e2f4a]',
    accentColor: '#38bdf8',
    stages: [
      { id: 'l-rfq', name: 'RFQ & Evaluation', shortLabel: '1. RFQ', description: 'Rate card comparisons, serviceable pincodes, and transit time benchmarks.', progressPercent: 15 },
      { id: 'l-ratecard', name: 'Rate Card & Service Zones', shortLabel: '2. Rate Card', description: 'Agreement on per-500g air/surface rates, COD fees, and RTO charges.', progressPercent: 35 },
      { id: 'l-integration', name: 'API & Tech Integration', shortLabel: '3. API Sync', description: 'Webhook setup, tracking API integration, and automated AWB generation.', progressPercent: 60 },
      { id: 'l-pilot', name: 'Pilot Test Shipments', shortLabel: '4. Pilot Runs', description: 'Trial dispatches (20-50 parcels) testing pickup reliability and SLA.', progressPercent: 80 },
      { id: 'l-active', name: 'Active Dispatch Partner', shortLabel: '5. Live Courier', description: 'Primary or secondary shipping provider for customer orders.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'l-audit', name: 'Quarterly SLA Audit', shortLabel: '6. SLA Audit', description: 'Ongoing performance review of transit compliance and NDR conversion.', progressPercent: 95 },
      { id: 'l-stalled', name: 'Suspended / Stalled', shortLabel: 'Suspended', description: 'Temporarily deactivated due to SLA breaches or billing review.', progressPercent: 0, isTerminalFailure: true },
    ],
  },
  PaymentGateway: {
    id: 'PaymentGateway',
    label: 'Payment Gateway & FinTech',
    pluralLabel: 'Payment Gateways',
    shortLabel: 'Payment Gateways',
    description: 'Online checkout payment processors, UPI aggregators, BNPL, and cross-border gateways.',
    icon: CreditCard,
    badgeBg: 'bg-[#0e1c18]',
    badgeText: 'text-[#6ee7b7]',
    badgeBorder: 'border-[#1b3a2e]',
    accentColor: '#34d399',
    stages: [
      { id: 'pg-discovery', name: 'Gateway Discovery', shortLabel: '1. Discovery', description: 'Evaluating success rates, checkout conversion, UPI Intent support.', progressPercent: 15 },
      { id: 'pg-kyc', name: 'KYC & Merchant Onboarding', shortLabel: '2. KYC Docs', description: 'Submitting business registration, bank account, and GST documentation.', progressPercent: 35 },
      { id: 'pg-tdr', name: 'TDR & Commercial Terms', shortLabel: '3. TDR Terms', description: 'Negotiating MDR/TDR rates for UPI, Cards, NetBanking, and T+1/T+2 settlement.', progressPercent: 55 },
      { id: 'pg-sandbox', name: 'Sandbox API Testing', shortLabel: '4. Sandbox', description: 'Testing webhooks, refund cycles, and checkout widgets in staging.', progressPercent: 75 },
      { id: 'pg-live', name: 'Production Live', shortLabel: '5. Live PG', description: 'Actively processing customer payments on the Rivlet web store.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'pg-audit', name: 'Annual Security & Review', shortLabel: '6. Annual Audit', description: 'PCI-DSS compliance review, dispute rates, and fee reconciliation.', progressPercent: 95 },
      { id: 'pg-stalled', name: 'Deprecated / Offline', shortLabel: 'Offline', description: 'Gateway decommissioned or backup status.', progressPercent: 0, isTerminalFailure: true },
    ],
  },
  Packaging: {
    id: 'Packaging',
    label: 'Packaging & Trims',
    pluralLabel: 'Packaging & Trims',
    shortLabel: 'Packaging',
    description: 'Luxury rigid magnetic boxes, polybags, woven brand labels, hangtags, and custom tissue.',
    icon: Package,
    badgeBg: 'bg-[#171324]',
    badgeText: 'text-[#d8b4fe]',
    badgeBorder: 'border-[#33254c]',
    accentColor: '#c084fc',
    stages: [
      { id: 'pk-dieline', name: 'Dielines & Design Specs', shortLabel: '1. Dielines', description: 'Sharing box CAD dielines, foil stamping vector specs, and GSM weights.', progressPercent: 15 },
      { id: 'pk-proto', name: 'Sampling & Physical Mockups', shortLabel: '2. Prototyping', description: 'Producing physical dummy boxes and printed sample labels.', progressPercent: 40 },
      { id: 'pk-approval', name: 'Color & Finish Approval', shortLabel: '3. Approval', description: 'Verifying matte lamination, hot-foil registration, and paper handfeel.', progressPercent: 65 },
      { id: 'pk-bulk', name: 'Bulk Order Placed', shortLabel: '4. Bulk Order', description: 'PO released for bulk packaging run (e.g. 2,000 boxes + 5,000 tags).', progressPercent: 80 },
      { id: 'pk-delivered', name: 'Delivered & Stocked', shortLabel: '5. Stocked', description: 'Received at fulfillment warehouse, quality checked, and inventory logged.', progressPercent: 95, isTerminalSuccess: true },
      { id: 'pk-replenish', name: 'Active Replenishment', shortLabel: '6. Replenishing', description: 'Ongoing automated reordering based on packaging threshold inventory.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'pk-stalled', name: 'Archived / On Hold', shortLabel: 'Archived', description: 'Packaging design retired or vendor paused.', progressPercent: 0, isTerminalFailure: true },
    ],
  },
  Collaboration: {
    id: 'Collaboration',
    label: 'Collaborations & Creative PR',
    pluralLabel: 'Collaborations & PR',
    shortLabel: 'Collaborations',
    description: 'Campaign photographers, stylists, models, creative agencies, and influencer ambassadors.',
    icon: Sparkles,
    badgeBg: 'bg-[#1c131a]',
    badgeText: 'text-[#f472b6]',
    badgeBorder: 'border-[#3d2034]',
    accentColor: '#f472b6',
    stages: [
      { id: 'c-sourcing', name: 'Talent Sourcing & Pitch', shortLabel: '1. Sourcing', description: 'Curating moodboard, identifying creators/stylists matching brand identity.', progressPercent: 15 },
      { id: 'c-brief', name: 'Creative Brief & Deliverables', shortLabel: '2. Briefing', description: 'Agreeing on shot count, hero Reels, styling looks, and usage rights window.', progressPercent: 35 },
      { id: 'c-contract', name: 'Contract Signed & Advance', shortLabel: '3. Contract & Adv', description: 'Signed collaboration agreement and booking deposit paid.', progressPercent: 55 },
      { id: 'c-production', name: 'Shoot & Content Production', shortLabel: '4. Production', description: 'Studio/location shoot underway or samples delivered for creator creation.', progressPercent: 75 },
      { id: 'c-review', name: 'Asset Review & Approval', shortLabel: '5. Review', description: 'Editorial color-grade review, revisions, and Rivlet final brand sign-off.', progressPercent: 90 },
      { id: 'c-live', name: 'Live Campaign & Settlement', shortLabel: '6. Live & Settled', description: 'Content live on social/site, engagement tracking, final milestone paid.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'c-stalled', name: 'Declined / Archived', shortLabel: 'Declined', description: 'Opportunity passed or talent unavailable.', progressPercent: 0, isTerminalFailure: true },
    ],
  },
  FinancialLegal: {
    id: 'FinancialLegal',
    label: 'Financial, Legal & Compliance',
    pluralLabel: 'Financial & Legal',
    shortLabel: 'Finance & Legal',
    description: 'Chartered Accountants, corporate attorneys, trademark attorneys, and compliance auditors.',
    icon: Scale,
    badgeBg: 'bg-[#101b22]',
    badgeText: 'text-[#67e8f9]',
    badgeBorder: 'border-[#1b3340]',
    accentColor: '#22d3ee',
    stages: [
      { id: 'fl-scope', name: 'Scope of Work Definition', shortLabel: '1. Scope', description: 'Defining project parameters (trademark filing, GST audit, corporate docs).', progressPercent: 20 },
      { id: 'fl-retainer', name: 'Quote & Retainer Agreed', shortLabel: '2. Terms', description: 'Agreed fee structure (monthly retainer or fixed engagement fee).', progressPercent: 40 },
      { id: 'fl-onboarding', name: 'NDA & KYC Onboarding', shortLabel: '3. Onboarding', description: 'Executing confidentiality agreement, power of attorney, and bank mandates.', progressPercent: 60 },
      { id: 'fl-active', name: 'Active Engagement / Filings', shortLabel: '4. Active Work', description: 'Filing submissions, tax filings, or drafting legal agreements.', progressPercent: 80 },
      { id: 'fl-retainer-active', name: 'Ongoing Retainer', shortLabel: '5. Retainer Live', description: 'Permanent partner handling routine monthly tax & regulatory compliance.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'fl-stalled', name: 'Concluded / Closed', shortLabel: 'Concluded', description: 'Specific project mandate completed or engagement ended.', progressPercent: 0, isTerminalFailure: true },
    ],
  },
  SoftwareTech: {
    id: 'SoftwareTech',
    label: 'Software, SaaS & Tech Tools',
    pluralLabel: 'Software & Tech',
    shortLabel: 'Software & Tech',
    description: 'E-commerce stack, CRM/email tools, analytics, hosting infrastructure, and inventory ERP.',
    icon: Cpu,
    badgeBg: 'bg-[#131526]',
    badgeText: 'text-[#a5b4fc]',
    badgeBorder: 'border-[#262a4a]',
    accentColor: '#818cf8',
    stages: [
      { id: 'st-evaluation', name: 'Tool Discovery & Evaluation', shortLabel: '1. Discovery', description: 'Benchmarking SaaS features, APIs, and business tier plans.', progressPercent: 20 },
      { id: 'st-poc', name: 'Trial & Sandbox PoC', shortLabel: '2. Trial PoC', description: 'Running trial environment testing integrations with Rivlet systems.', progressPercent: 45 },
      { id: 'st-contract', name: 'Tier Selection & Contract', shortLabel: '3. Contract', description: 'Selecting annual/monthly seat licenses and payment method.', progressPercent: 70 },
      { id: 'st-live', name: 'Production Deployed', shortLabel: '4. Deployed', description: 'Live in Rivlet production workflow and connected to company operations.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'st-active', name: 'Active & Monitored', shortLabel: '5. Monitored', description: 'Routine utilization, seat management, and quarterly performance reviews.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'st-stalled', name: 'Sunset / Cancelled', shortLabel: 'Cancelled', description: 'Subscription cancelled or replaced by another system.', progressPercent: 0, isTerminalFailure: true },
    ],
  },
  General: {
    id: 'General',
    label: 'General & Office Supplies',
    pluralLabel: 'General Vendors',
    shortLabel: 'General',
    description: 'Studio equipment, print consumables, office fixtures, and miscellaneous business vendors.',
    icon: Building2,
    badgeBg: 'bg-slate-900 dark:bg-slate-950',
    badgeText: 'text-slate-300 dark:text-slate-200',
    badgeBorder: 'border-slate-700 dark:border-slate-800',
    accentColor: '#94a3b8',
    stages: [
      { id: 'g-prospect', name: 'Prospect / Inquiry', shortLabel: '1. Inquiry', description: 'Initial quote inquiry or catalog review.', progressPercent: 25 },
      { id: 'g-pricing', name: 'Pricing & Credit Terms', shortLabel: '2. Pricing', description: 'Reviewing price list, volume discounts, and payment terms.', progressPercent: 50 },
      { id: 'g-active', name: 'Active Supplier', shortLabel: '3. Active', description: 'Approved supplier with regular procurement orders.', progressPercent: 100, isTerminalSuccess: true },
      { id: 'g-stalled', name: 'Inactive', shortLabel: 'Inactive', description: 'No active orders or vendor replaced.', progressPercent: 0, isTerminalFailure: true },
    ],
  },
};

export const ALL_VENDOR_CATEGORIES: VendorCategory[] = [
  'Manufacturer',
  'Logistics',
  'PaymentGateway',
  'Packaging',
  'Collaboration',
  'FinancialLegal',
  'SoftwareTech',
  'General',
];

/**
 * Returns configuration for a specific vendor category, falling back to Manufacturer.
 */
export function getCategoryConfig(category?: VendorCategory): CategoryConfig {
  if (!category || !VENDOR_CATEGORIES[category]) {
    return VENDOR_CATEGORIES.Manufacturer;
  }
  return VENDOR_CATEGORIES[category];
}

/**
 * Normalizes vendor category (handling legacy records without category).
 */
export function getVendorCategory(vendor: Partial<VendorItem>): VendorCategory {
  if (vendor.category && VENDOR_CATEGORIES[vendor.category]) {
    return vendor.category;
  }
  // Guess based on specialty or name if category missing
  const text = `${vendor.name || ''} ${vendor.specialty || ''} ${vendor.notes || ''}`.toLowerCase();
  if (text.includes('courier') || text.includes('logistics') || text.includes('3pl') || text.includes('shipping') || text.includes('dart') || text.includes('shiprocket')) {
    return 'Logistics';
  }
  if (text.includes('payment') || text.includes('gateway') || text.includes('razorpay') || text.includes('stripe') || text.includes('upi')) {
    return 'PaymentGateway';
  }
  if (text.includes('packaging') || text.includes('box') || text.includes('polybag') || text.includes('hangtag') || text.includes('labels')) {
    return 'Packaging';
  }
  if (text.includes('creative') || text.includes('collab') || text.includes('influencer') || text.includes('model') || text.includes('photo')) {
    return 'Collaboration';
  }
  if (text.includes('legal') || text.includes('tax') || text.includes('ca ') || text.includes('chartered') || text.includes('attorney')) {
    return 'FinancialLegal';
  }
  if (text.includes('software') || text.includes('saas') || text.includes('shopify') || text.includes('cloud')) {
    return 'SoftwareTech';
  }
  return 'Manufacturer';
}

/**
 * Returns stage progress percent for any vendor based on their current stage.
 */
export function getStageProgress(vendor: Partial<VendorItem>): number {
  const category = getVendorCategory(vendor);
  const config = getCategoryConfig(category);
  const stage = vendor.stage || '';
  
  // Exact match
  const match = config.stages.find((s) => s.name.toLowerCase() === stage.toLowerCase() || s.id.toLowerCase() === stage.toLowerCase());
  if (match) return match.progressPercent;

  // Fuzzy match on keyword
  const fuzzy = config.stages.find((s) => stage.toLowerCase().includes(s.shortLabel.toLowerCase()) || s.name.toLowerCase().includes(stage.toLowerCase()));
  if (fuzzy) return fuzzy.progressPercent;

  if (typeof vendor.stageProgressPercent === 'number' && vendor.stageProgressPercent >= 0) {
    return vendor.stageProgressPercent;
  }

  // Fallback for legacy outreach stages
  if (stage === 'Approved Partner' || stage.includes('Approved') || stage.includes('Live')) return 95;
  if (stage === 'Negotiating' || stage.includes('Negotiat')) return 80;
  if (stage === 'Sampling') return 50;
  if (stage.includes('Call') || stage.includes('Email')) return 30;
  if (stage.includes('Prospect') || stage.includes('Proposed')) return 15;

  return 25;
}

/**
 * Returns the next logical stage for 1-click stage advancement.
 */
export function getNextStage(vendor: Partial<VendorItem>): WorkflowStageConfig | null {
  const category = getVendorCategory(vendor);
  const config = getCategoryConfig(category);
  const currentStage = vendor.stage || '';

  const activeStages = config.stages.filter((s) => !s.isTerminalFailure);
  const currentIndex = activeStages.findIndex(
    (s) => s.name.toLowerCase() === currentStage.toLowerCase() || s.id.toLowerCase() === currentStage.toLowerCase()
  );

  if (currentIndex >= 0 && currentIndex < activeStages.length - 1) {
    return activeStages[currentIndex + 1];
  }
  // If not matched or at start, offer step 2
  if (currentIndex === -1 && activeStages.length > 1) {
    return activeStages[1];
  }
  return null;
}
