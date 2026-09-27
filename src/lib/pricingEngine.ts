import { PricingInputs, CalculationResult, ScenarioKey } from './types';

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
