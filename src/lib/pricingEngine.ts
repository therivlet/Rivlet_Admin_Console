import { PricingInputs, CalculationResult, ScenarioKey, CalculatorDefaults } from './types';

export const defaultCalculatorDefaults: CalculatorDefaults = {
  currency: '₹',
  targetMargin: 25,
  autoOutputTax: true,
  manualOutputGst: 18,
  autoFactoryTax: true,
  manualFactoryGst: 5,
  factoryGstRecoverable: true,
  includeFactoryCash: false,

  development: 40,
  inbound: 35,
  qc: 10,
  packaging: 55,
  tags: 18,
  branding: 30,
  receiving: 10,
  pickpack: 35,
  inventory: 15,

  gateway: 2,
  shopifyFee: 0,
  affiliate: 0,
  promoter: 0,
  marketplace: 0,
  marketAds: 0,
  cod: 0,
  reverse: 0,
  exchange: 0,

  salary: { low: 720000, mid: 600000, high: 500000 },
  office: { low: 180000, mid: 120000, high: 90000 },
  saas: { low: 180000, mid: 120000, high: 90000 },
  professional: { low: 120000, mid: 80000, high: 60000 },
  finance: { low: 60000, mid: 30000, high: 10000 },
  brandAmort: { low: 180000, mid: 120000, high: 90000 },

  units: { low: 600, mid: 1200, high: 2000 },
  discount: { low: 20, mid: 15, high: 8 },
  cac: { low: 350, mid: 250, high: 150 },
  returnProvision: { low: 150, mid: 115, high: 75 },
  shippingSubsidy: { low: 95, mid: 70, high: 55 },

  importMode: 'domestic',
  intlFreight: 0,
  insurance: 0,
  bcd: 0,
  sws: 10,
  importIgst: 5,
  importIgstRecoverable: true,
  clearance: 0,

  lockedOverheads: false,
  lockedInbound: false,
  lockedSalesRates: false,
};

export const defaultPricingInputs: PricingInputs = {
  productName: 'Oversized French Terry Hoodie',
  productCode: 'RIV-FW26-HOOD-01',
  mrp: 4499,
  currency: '₹',
  targetMargin: 25,

  autoOutputTax: true,
  manualOutputGst: 18,
  autoFactoryTax: true,
  manualFactoryGst: 5,
  factoryGstRecoverable: true,
  includeFactoryCash: false,

  units: { low: 600, mid: 1200, high: 2000 },
  discount: { low: 20, mid: 15, high: 8 },
  cac: { low: 350, mid: 250, high: 150 },
  returnProvision: { low: 150, mid: 115, high: 75 },
  shippingSubsidy: { low: 95, mid: 70, high: 55 },

  factory: 1200,
  development: 40,
  inbound: 35,
  qc: 10,
  packaging: 55,
  tags: 18,
  branding: 30,
  receiving: 10,
  pickpack: 35,
  inventory: 15,

  importMode: 'domestic',
  intlFreight: 0,
  insurance: 0,
  bcd: 0,
  sws: 10,
  importIgst: 5,
  importIgstRecoverable: true,
  clearance: 0,

  gateway: 2,
  shopifyFee: 0,
  affiliate: 0,
  promoter: 0,
  marketplace: 0,
  marketAds: 0,

  cod: 0,
  reverse: 0,
  exchange: 0,

  salary: { low: 720000, mid: 600000, high: 500000 },
  office: { low: 180000, mid: 120000, high: 90000 },
  saas: { low: 180000, mid: 120000, high: 90000 },
  professional: { low: 120000, mid: 80000, high: 60000 },
  finance: { low: 60000, mid: 30000, high: 10000 },
  brandAmort: { low: 180000, mid: 120000, high: 90000 },
};

export function factoryGstRate(inputs: PricingInputs): number {
  if (inputs.autoFactoryTax) {
    return inputs.factory <= 2500 ? 5 : 18;
  }
  return inputs.manualFactoryGst;
}

export function outputGstRate(inputs: PricingInputs, actualCustomerPrice: number): number {
  if (inputs.autoOutputTax) {
    return actualCustomerPrice <= 2500 ? 5 : 18;
  }
  return inputs.manualOutputGst;
}

export function importMath(inputs: PricingInputs) {
  if (inputs.importMode !== 'imported') {
    return {
      cost: 0,
      assess: 0,
      bcd: 0,
      sws: 0,
      igst: 0,
      igstCost: 0,
      rows: [] as [string, string, number][],
      note: 'Domestic supply selected: international freight, duty and import taxes are excluded.',
    };
  }

  const assess = inputs.factory + inputs.intlFreight + inputs.insurance;
  const bcd = (assess * inputs.bcd) / 100;
  const sws = (bcd * inputs.sws) / 100;
  const importBase = assess + bcd + sws;
  const igst = (importBase * inputs.importIgst) / 100;
  const igstCost = inputs.importIgstRecoverable ? 0 : igst;
  const cost = inputs.intlFreight + inputs.insurance + bcd + sws + igstCost + inputs.clearance;

  const rows: [string, string, number][] = [
    ['International freight', 'per unit', inputs.intlFreight],
    ['Transit insurance', 'per unit', inputs.insurance],
    ['Basic Customs Duty', 'BCD on assessable value', bcd],
    ['Social Welfare Surcharge', 'SWS on BCD', sws],
    ['Import IGST', inputs.importIgstRecoverable ? 'Recoverable ITC (excluded from P&L)' : 'Non-recoverable (in P&L)', igstCost],
    ['Clearance / port charges', 'per unit', inputs.clearance],
  ];

  return {
    cost,
    assess,
    bcd,
    sws,
    igst,
    igstCost,
    rows,
    note: `Assessable value ₹${assess.toFixed(2)} = factory + freight + insurance. BCD ₹${bcd.toFixed(2)}; SWS ₹${sws.toFixed(2)}; import IGST ₹${igst.toFixed(2)} ${inputs.importIgstRecoverable ? '(recoverable, excluded from P&L)' : '(included in P&L)'}.`,
  };
}

export function annualOverhead(inputs: PricingInputs, scenario: ScenarioKey): number {
  return (
    inputs.salary[scenario] +
    inputs.office[scenario] +
    inputs.saas[scenario] +
    inputs.professional[scenario] +
    inputs.finance[scenario] +
    inputs.brandAmort[scenario]
  );
}

export function percentageRate(inputs: PricingInputs): number {
  return (
    (inputs.gateway +
      inputs.shopifyFee +
      inputs.affiliate +
      inputs.promoter +
      inputs.marketplace +
      inputs.marketAds) /
    100
  );
}

export function fixedSalesCost(inputs: PricingInputs, scenario: ScenarioKey): number {
  const rangeCost =
    inputs.cac[scenario] +
    inputs.returnProvision[scenario] +
    inputs.shippingSubsidy[scenario];
  const fixedOther = inputs.cod + inputs.reverse + inputs.exchange;
  return rangeCost + fixedOther;
}

export function productCost(inputs: PricingInputs): number {
  const fRate = factoryGstRate(inputs);
  const factoryTax = inputs.factoryGstRecoverable ? 0 : (inputs.factory * fRate) / 100;
  return (
    inputs.factory +
    inputs.development +
    inputs.inbound +
    inputs.qc +
    inputs.packaging +
    inputs.tags +
    inputs.branding +
    inputs.receiving +
    inputs.pickpack +
    inputs.inventory +
    factoryTax
  );
}

export function candidatePrice(
  totalCosts: number,
  salesRates: number,
  discount: number,
  target: number,
  rate: number
): number {
  const denominator = 1 - salesRates - target;
  if (denominator <= 0) return NaN;
  const requiredNet = totalCosts / denominator;
  return (requiredNet * (1 + rate / 100)) / (1 - discount);
}

export function requiredMrp(
  inputs: PricingInputs,
  totalCosts: number,
  salesRates: number,
  discount: number,
  target: number
): number {
  const candidates = [5, 18]
    .map((rate) => candidatePrice(totalCosts, salesRates, discount, target, rate))
    .filter(Number.isFinite)
    .filter((price) => {
      const discounted = price * (1 - discount);
      return outputGstRate(inputs, discounted) === (inputs.autoOutputTax ? (discounted <= 2500 ? 5 : 18) : inputs.manualOutputGst);
    });

  return candidates.length ? Math.min(...candidates) : NaN;
}

export function calculateScenario(inputs: PricingInputs, scenario: ScenarioKey): CalculationResult {
  const units = Math.max(1, inputs.units[scenario]);
  const discountRate = Math.min(inputs.discount[scenario] / 100, 0.9999);
  const customerPrice = inputs.mrp * (1 - discountRate);

  const outRate = outputGstRate(inputs, customerPrice);
  const outputGst = customerPrice - customerPrice / (1 + outRate / 100);
  const netSales = customerPrice - outputGst;

  const customs = importMath(inputs);
  const baseProductCost = productCost(inputs) + customs.cost;

  const overheadTotal = annualOverhead(inputs, scenario);
  const overheadPerUnit = overheadTotal / units;

  const fixedOrder = fixedSalesCost(inputs, scenario);
  const salesRates = percentageRate(inputs);
  const salesRateCost = netSales * salesRates;

  const contributionProfit = netSales - baseProductCost - overheadPerUnit - fixedOrder - salesRateCost;
  const contributionMargin = netSales ? contributionProfit / netSales : 0;

  const grossProfit = netSales - baseProductCost;
  const grossMargin = netSales ? grossProfit / netSales : 0;

  const totalCosts = baseProductCost + overheadPerUnit + fixedOrder;
  const breakEvenMrp = requiredMrp(inputs, totalCosts, salesRates, discountRate, 0);
  const targetMrp = requiredMrp(inputs, totalCosts, salesRates, discountRate, inputs.targetMargin / 100);

  const maximumFactoryCost =
    netSales * (1 - salesRates - inputs.targetMargin / 100) - (totalCosts - inputs.factory);

  const fRate = factoryGstRate(inputs);
  const factoryGst = (inputs.factory * fRate) / 100;
  const inputTaxCash = factoryGst + (customs.igst || 0);
  const factoryCashOutlay = inputs.factory + (inputs.factoryGstRecoverable && !inputs.includeFactoryCash ? 0 : factoryGst);

  const annualRevenue = customerPrice * units;
  const annualContribution = contributionProfit * units;

  const targetMarginRatio = inputs.targetMargin / 100;
  const status: CalculationResult['status'] =
    contributionMargin >= targetMarginRatio
      ? 'On / above target'
      : contributionMargin >= 0
      ? 'Profitable but below target'
      : 'Below break-even';

  return {
    scenario,
    units,
    discount: discountRate,
    customerPrice,
    outputRate: outRate,
    outputGst,
    netSales,
    baseProductCost,
    overheadAnnual: overheadTotal,
    overheadPerUnit,
    fixedOrder,
    salesRates,
    salesRateCost,
    contributionProfit,
    contributionMargin,
    grossProfit,
    grossMargin,
    totalCosts,
    breakEvenMrp,
    targetMrp,
    maximumFactoryCost,
    factoryRate: fRate,
    factoryGst,
    inputTaxCash,
    factoryCashOutlay,
    annualRevenue,
    annualContribution,
    status,
    customsNote: customs.note,
    customsRows: customs.rows,
  };
}

export function formatMoney(val: number, currency = '₹'): string {
  if (!Number.isFinite(val)) return 'N/A';
  return `${currency}${Math.round(val).toLocaleString('en-IN')}`;
}

export function formatPercent(val: number): string {
  if (!Number.isFinite(val)) return '0.0%';
  return `${val.toFixed(1)}%`;
}

export function calculateAllScenarios(inputs: PricingInputs): Record<ScenarioKey, CalculationResult> {
  return {
    low: calculateScenario(inputs, 'low'),
    mid: calculateScenario(inputs, 'mid'),
    high: calculateScenario(inputs, 'high'),
  };
}

const STORAGE_KEY_CALCULATOR_DEFAULTS = 'rivlet_calculator_defaults';

export function getStoredCalculatorDefaults(): CalculatorDefaults {
  if (typeof window === 'undefined') return defaultCalculatorDefaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALCULATOR_DEFAULTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultCalculatorDefaults, ...parsed };
    }
  } catch (e) {
    console.error('Failed to read calculator defaults from localStorage:', e);
  }
  return defaultCalculatorDefaults;
}

export function saveStoredCalculatorDefaults(defaults: CalculatorDefaults) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CALCULATOR_DEFAULTS, JSON.stringify(defaults));
  } catch (e) {
    console.error('Failed to save calculator defaults to localStorage:', e);
  }
}

export function mergeDefaultsIntoInputs(
  base: Partial<PricingInputs>,
  defaults: CalculatorDefaults
): PricingInputs {
  return {
    productName: base.productName || '',
    productCode: base.productCode || `RIV-${Math.floor(1000 + Math.random() * 9000)}`,
    mrp: base.mrp !== undefined && base.mrp > 0 ? base.mrp : 2999,
    currency: defaults.currency || '₹',
    targetMargin: defaults.targetMargin ?? 25,

    autoOutputTax: defaults.autoOutputTax ?? true,
    manualOutputGst: defaults.manualOutputGst ?? 18,
    autoFactoryTax: defaults.autoFactoryTax ?? true,
    manualFactoryGst: defaults.manualFactoryGst ?? 5,
    factoryGstRecoverable: defaults.factoryGstRecoverable ?? true,
    includeFactoryCash: defaults.includeFactoryCash ?? false,

    units: { ...(defaults.units || defaultCalculatorDefaults.units), ...(base.units || {}) },
    discount: { ...(defaults.discount || defaultCalculatorDefaults.discount), ...(base.discount || {}) },
    cac: { ...(defaults.cac || defaultCalculatorDefaults.cac), ...(base.cac || {}) },
    returnProvision: { ...(defaults.returnProvision || defaultCalculatorDefaults.returnProvision), ...(base.returnProvision || {}) },
    shippingSubsidy: { ...(defaults.shippingSubsidy || defaultCalculatorDefaults.shippingSubsidy), ...(base.shippingSubsidy || {}) },

    factory: base.factory !== undefined ? base.factory : 1200,
    development: defaults.development ?? 40,
    inbound: defaults.inbound ?? 35,
    qc: defaults.qc ?? 10,
    packaging: defaults.packaging ?? 55,
    tags: defaults.tags ?? 18,
    branding: defaults.branding ?? 30,
    receiving: defaults.receiving ?? 10,
    pickpack: defaults.pickpack ?? 35,
    inventory: defaults.inventory ?? 15,

    importMode: defaults.importMode || 'domestic',
    intlFreight: defaults.intlFreight ?? 0,
    insurance: defaults.insurance ?? 0,
    bcd: defaults.bcd ?? 0,
    sws: defaults.sws ?? 10,
    importIgst: defaults.importIgst ?? 5,
    importIgstRecoverable: defaults.importIgstRecoverable ?? true,
    clearance: defaults.clearance ?? 0,

    gateway: defaults.gateway ?? 2,
    shopifyFee: defaults.shopifyFee ?? 0,
    affiliate: defaults.affiliate ?? 0,
    promoter: defaults.promoter ?? 0,
    marketplace: defaults.marketplace ?? 0,
    marketAds: defaults.marketAds ?? 0,

    cod: defaults.cod ?? 0,
    reverse: defaults.reverse ?? 0,
    exchange: defaults.exchange ?? 0,

    salary: { ...(defaults.salary || defaultCalculatorDefaults.salary), ...(base.salary || {}) },
    office: { ...(defaults.office || defaultCalculatorDefaults.office), ...(base.office || {}) },
    saas: { ...(defaults.saas || defaultCalculatorDefaults.saas), ...(base.saas || {}) },
    professional: { ...(defaults.professional || defaultCalculatorDefaults.professional), ...(base.professional || {}) },
    finance: { ...(defaults.finance || defaultCalculatorDefaults.finance), ...(base.finance || {}) },
    brandAmort: { ...(defaults.brandAmort || defaultCalculatorDefaults.brandAmort), ...(base.brandAmort || {}) },

    bom: base.bom,
  };
}

export interface PricingValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export function validatePricingInputs(inputs: PricingInputs): PricingValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Product metadata
  if (!inputs.productName || inputs.productName.trim().length < 2) {
    errors.productName = 'Product style name is required (at least 2 characters).';
  }
  if (!inputs.productCode || inputs.productCode.trim().length < 2) {
    errors.productCode = 'SKU / Product Code is required.';
  }

  // MRP
  if (typeof inputs.mrp !== 'number' || isNaN(inputs.mrp) || inputs.mrp <= 0) {
    errors.mrp = 'Listed MRP must be greater than 0.';
  }

  // Target Margin
  if (typeof inputs.targetMargin !== 'number' || isNaN(inputs.targetMargin) || inputs.targetMargin < 0 || inputs.targetMargin > 95) {
    errors.targetMargin = 'Target margin must be between 0% and 95%.';
  }

  // Forecast Scenarios units
  const scenarios: ScenarioKey[] = ['low', 'mid', 'high'];
  scenarios.forEach((sc) => {
    if (!inputs.units || typeof inputs.units[sc] !== 'number' || isNaN(inputs.units[sc]) || inputs.units[sc] < 1) {
      errors[`units_${sc}`] = `Production units for ${sc} scenario must be at least 1.`;
    }
    if (!inputs.discount || typeof inputs.discount[sc] !== 'number' || isNaN(inputs.discount[sc]) || inputs.discount[sc] < 0 || inputs.discount[sc] > 90) {
      errors[`discount_${sc}`] = `Discount % for ${sc} scenario must be between 0% and 90%.`;
    }
    if (!inputs.cac || typeof inputs.cac[sc] !== 'number' || isNaN(inputs.cac[sc]) || inputs.cac[sc] < 0) {
      errors[`cac_${sc}`] = `CAC for ${sc} scenario cannot be negative.`;
    }
    if (!inputs.returnProvision || typeof inputs.returnProvision[sc] !== 'number' || isNaN(inputs.returnProvision[sc]) || inputs.returnProvision[sc] < 0) {
      errors[`returnProvision_${sc}`] = `Return provision for ${sc} scenario cannot be negative.`;
    }
    if (!inputs.shippingSubsidy || typeof inputs.shippingSubsidy[sc] !== 'number' || isNaN(inputs.shippingSubsidy[sc]) || inputs.shippingSubsidy[sc] < 0) {
      errors[`shippingSubsidy_${sc}`] = `Shipping subsidy for ${sc} scenario cannot be negative.`;
    }
  });

  // Product and inbound costs
  const costFields: (keyof PricingInputs)[] = [
    'factory', 'development', 'inbound', 'qc', 'packaging', 'tags', 'branding', 'receiving', 'pickpack', 'inventory'
  ];
  costFields.forEach((f) => {
    const val = Number(inputs[f]);
    if (isNaN(val) || val < 0) {
      errors[f] = `${String(f)} cost cannot be negative.`;
    }
  });

  // Annual Overheads
  const overheadFields: ('salary' | 'office' | 'saas' | 'professional' | 'finance' | 'brandAmort')[] = [
    'salary', 'office', 'saas', 'professional', 'finance', 'brandAmort'
  ];
  overheadFields.forEach((f) => {
    scenarios.forEach((sc) => {
      const val = inputs[f]?.[sc];
      if (typeof val !== 'number' || isNaN(val) || val < 0) {
        errors[`${f}_${sc}`] = `Annual ${f} overhead (${sc}) cannot be negative.`;
      }
    });
  });

  // Percentage sales rates
  const pctFields: (keyof PricingInputs)[] = [
    'gateway', 'shopifyFee', 'affiliate', 'promoter', 'marketplace', 'marketAds'
  ];
  let totalPct = 0;
  pctFields.forEach((f) => {
    const val = Number(inputs[f]);
    if (isNaN(val) || val < 0) {
      errors[f] = `${String(f)} percentage rate cannot be negative.`;
    } else {
      totalPct += val;
    }
  });
  if (totalPct > 90) {
    errors.gateway = `Total sales percentage charges (${totalPct.toFixed(1)}%) cannot exceed 90%.`;
  }

  // Fixed order fees
  ['cod', 'reverse', 'exchange'].forEach((f) => {
    const val = Number((inputs as any)[f]);
    if (isNaN(val) || val < 0) {
      errors[f] = `${f.toUpperCase()} charge cannot be negative.`;
    }
  });

  // Customs if imported
  if (inputs.importMode === 'imported') {
    ['intlFreight', 'insurance', 'bcd', 'sws', 'importIgst', 'clearance'].forEach((f) => {
      const val = Number((inputs as any)[f]);
      if (isNaN(val) || val < 0) {
        errors[f] = `${f} cannot be negative.`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}


