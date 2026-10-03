import { PricingInputs, CalculatorDefaults } from './types';
import { DiffItem } from '@/components/calculator/DefaultsDiffModal';

export function getDifferencesFromDefaults(
  inputs: PricingInputs,
  defaults: CalculatorDefaults
): DiffItem[] {
  const diffs: DiffItem[] = [];

  // Target Margin
  if (inputs.targetMargin !== defaults.targetMargin) {
    diffs.push({
      key: 'targetMargin',
      label: 'Target Contribution Margin Goal',
      category: 'Commercial Strategy',
      currentValue: `${inputs.targetMargin}%`,
      defaultValue: `${defaults.targetMargin}%`,
    });
  }

  // Technical Inbound & Packaging (per unit)
  const inboundFields: Array<{ key: keyof CalculatorDefaults & keyof PricingInputs; label: string }> = [
    { key: 'development', label: 'Tech Sampling & Prototyping' },
    { key: 'inbound', label: 'Inbound Logistics' },
    { key: 'qc', label: 'Quality Control (AQL 2.5)' },
    { key: 'packaging', label: 'Garment Polybag & Protection' },
    { key: 'tags', label: 'Hangtags & Security Barcodes' },
    { key: 'branding', label: 'Woven Labels & Custom Trims' },
    { key: 'receiving', label: 'Warehouse Receiving' },
    { key: 'pickpack', label: 'Pick & Pack Fulfillment' },
    { key: 'inventory', label: 'Inventory Holding & Shrinkage' },
  ];

  for (const f of inboundFields) {
    if (Number(inputs[f.key]) !== Number(defaults[f.key])) {
      diffs.push({
        key: f.key,
        label: f.label,
        category: 'Inbound & Packaging (₹/unit)',
        currentValue: `₹${inputs[f.key]}`,
        defaultValue: `₹${defaults[f.key]}`,
      });
    }
  }

  // Sales Rates (%)
  const salesPercentFields: Array<{ key: keyof CalculatorDefaults & keyof PricingInputs; label: string }> = [
    { key: 'gateway', label: 'Payment Gateway Fee' },
    { key: 'shopifyFee', label: 'Shopify Platform Fee' },
    { key: 'affiliate', label: 'Influencer / Affiliate Commission' },
    { key: 'promoter', label: 'Brand Promoter Commission' },
    { key: 'marketplace', label: 'Marketplace Commission' },
    { key: 'marketAds', label: 'Marketplace Ads Provision' },
  ];

  for (const f of salesPercentFields) {
    if (Number(inputs[f.key]) !== Number(defaults[f.key])) {
      diffs.push({
        key: f.key,
        label: f.label,
        category: 'Sales Rates (%)',
        currentValue: `${inputs[f.key]}%`,
        defaultValue: `${defaults[f.key]}%`,
      });
    }
  }

  // Fixed Sales Charges (₹/order)
  const salesFixedFields: Array<{ key: keyof CalculatorDefaults & keyof PricingInputs; label: string }> = [
    { key: 'cod', label: 'Cash on Delivery (COD) Handling' },
    { key: 'reverse', label: 'Reverse Logistics Provision' },
    { key: 'exchange', label: 'Exchange Processing Fee' },
  ];

  for (const f of salesFixedFields) {
    if (Number(inputs[f.key]) !== Number(defaults[f.key])) {
      diffs.push({
        key: f.key,
        label: f.label,
        category: 'Order Charges (₹/order)',
        currentValue: `₹${inputs[f.key]}`,
        defaultValue: `₹${defaults[f.key]}`,
      });
    }
  }

  // Supply Origin & Import Customs
  if (inputs.importMode !== defaults.importMode) {
    diffs.push({
      key: 'importMode',
      label: 'Supply Origin Mode',
      category: 'Import to India',
      currentValue: inputs.importMode === 'imported' ? 'Imported into India' : 'Domestic Supply',
      defaultValue: defaults.importMode === 'imported' ? 'Imported into India' : 'Domestic Supply',
    });
  }

  if (inputs.importMode === 'imported') {
    const freightCur = (inputs.freightType || 'percent') === 'percent'
      ? `${inputs.freightValue ?? 1.5}% of FOB`
      : `₹${inputs.freightValue ?? 0}`;
    const freightDef = (defaults.freightType || 'percent') === 'percent'
      ? `${defaults.freightValue ?? 1.5}% of FOB`
      : `₹${defaults.freightValue ?? 0}`;
    if (freightCur !== freightDef) {
      diffs.push({
        key: 'freight',
        label: 'International Freight Rate',
        category: 'Import to India',
        currentValue: freightCur,
        defaultValue: freightDef,
      });
    }

    const insCur = (inputs.insuranceType || 'percent') === 'percent'
      ? `${inputs.insuranceValue ?? 0.5}% of FOB`
      : `₹${inputs.insuranceValue ?? 0}`;
    const insDef = (defaults.insuranceType || 'percent') === 'percent'
      ? `${defaults.insuranceValue ?? 0.5}% of FOB`
      : `₹${defaults.insuranceValue ?? 0}`;
    if (insCur !== insDef) {
      diffs.push({
        key: 'insurance',
        label: 'Transit Marine Insurance',
        category: 'Import to India',
        currentValue: insCur,
        defaultValue: insDef,
      });
    }

    if (Number(inputs.bcd ?? 20) !== Number(defaults.bcd ?? 20)) {
      diffs.push({
        key: 'bcd',
        label: 'Basic Customs Duty (BCD)',
        category: 'Import to India',
        currentValue: `${inputs.bcd ?? 20}%`,
        defaultValue: `${defaults.bcd ?? 20}%`,
      });
    }

    if (Number(inputs.sws ?? 6) !== Number(defaults.sws ?? 6)) {
      diffs.push({
        key: 'sws',
        label: 'Social Welfare Surcharge (SWS)',
        category: 'Import to India',
        currentValue: `${inputs.sws ?? 6}%`,
        defaultValue: `${defaults.sws ?? 6}%`,
      });
    }

    if (Number(inputs.importIgst ?? 5) !== Number(defaults.importIgst ?? 5)) {
      diffs.push({
        key: 'importIgst',
        label: 'Import IGST Rate',
        category: 'Import to India',
        currentValue: `${inputs.importIgst ?? 5}%`,
        defaultValue: `${defaults.importIgst ?? 5}%`,
      });
    }

    if (Boolean(inputs.importIgstRecoverable ?? true) !== Boolean(defaults.importIgstRecoverable ?? true)) {
      diffs.push({
        key: 'importIgstRecoverable',
        label: 'Import IGST ITC Treatment',
        category: 'Import to India',
        currentValue: inputs.importIgstRecoverable ? 'Claimable ITC Credit' : 'Expensed in Landed Cost',
        defaultValue: defaults.importIgstRecoverable ? 'Claimable ITC Credit' : 'Expensed in Landed Cost',
      });
    }

    if (Number(inputs.clearance ?? 0) !== Number(defaults.clearance ?? 0)) {
      diffs.push({
        key: 'clearance',
        label: 'Port & CHA Customs Clearance',
        category: 'Import to India',
        currentValue: `₹${inputs.clearance ?? 0}`,
        defaultValue: `₹${defaults.clearance ?? 0}`,
      });
    }
  }

  // Forecast Assumptions (Mid baseline)
  if (Number(inputs.units?.mid) !== Number(defaults.units?.mid)) {
    diffs.push({
      key: 'units',
      label: 'Production Batch Units (Expected)',
      category: 'Forecast Planning',
      currentValue: `${inputs.units?.mid?.toLocaleString() || 0}`,
      defaultValue: `${defaults.units?.mid?.toLocaleString() || 0}`,
    });
  }

  if (Number(inputs.discount?.mid) !== Number(defaults.discount?.mid)) {
    diffs.push({
      key: 'discount',
      label: 'Customer Discount % (Expected)',
      category: 'Forecast Planning',
      currentValue: `${inputs.discount?.mid || 0}%`,
      defaultValue: `${defaults.discount?.mid || 0}%`,
    });
  }

  if (Number(inputs.cac?.mid) !== Number(defaults.cac?.mid)) {
    diffs.push({
      key: 'cac',
      label: 'CAC per Customer (Expected)',
      category: 'Forecast Planning',
      currentValue: `₹${inputs.cac?.mid || 0}`,
      defaultValue: `₹${defaults.cac?.mid || 0}`,
    });
  }

  if (Number(inputs.returnProvision?.mid) !== Number(defaults.returnProvision?.mid)) {
    diffs.push({
      key: 'returnProvision',
      label: 'Return / RTO Provision (Expected)',
      category: 'Forecast Planning',
      currentValue: `₹${inputs.returnProvision?.mid || 0}`,
      defaultValue: `₹${defaults.returnProvision?.mid || 0}`,
    });
  }

  if (Number(inputs.shippingSubsidy?.mid) !== Number(defaults.shippingSubsidy?.mid)) {
    diffs.push({
      key: 'shippingSubsidy',
      label: 'Outbound Courier Subsidy (Expected)',
      category: 'Forecast Planning',
      currentValue: `₹${inputs.shippingSubsidy?.mid || 0}`,
      defaultValue: `₹${defaults.shippingSubsidy?.mid || 0}`,
    });
  }

  return diffs;
}
