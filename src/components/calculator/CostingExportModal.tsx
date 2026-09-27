'use client';

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Briefcase, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { PricingInputs, CalculationResult, ScenarioKey } from '@/lib/types';
import { formatMoney, formatPercent } from '@/lib/pricingEngine';

interface CostingExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: PricingInputs;
  activeScenario: ScenarioKey;
  allScenarios: Record<ScenarioKey, CalculationResult>;
}

export default function CostingExportModal({
  isOpen,
  onClose,
  inputs,
  activeScenario,
  allScenarios,
}: CostingExportModalProps) {
  const [exportMode, setExportMode] = useState<'commercial' | 'vendor'>('commercial');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const curr = inputs.currency || '₹';
  const currentResult = allScenarios[activeScenario];
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // 1. Download Comprehensive Multi-Scenario CSV
  const handleDownloadCsv = () => {
    const sc = allScenarios;
    const lines: string[][] = [
      ['RIVLET LUXURY APPAREL - COMMERCIAL COSTING & UNIT ECONOMICS DOSSIER'],
      ['Generated On', currentDate],
      ['Style Name', inputs.productName],
      ['SKU / Product Code', inputs.productCode],
      ['Currency', curr],
      ['Target Margin Goal', `${inputs.targetMargin}%`],
      ['Import Mode', inputs.importMode.toUpperCase()],
      [],
      ['1. THREE-SCENARIO UNIT ECONOMICS COMPARISON'],
      ['Metric', 'Conservative (Low)', 'Expected (Mid)', 'Upside (High)'],
      ['Batch Volume (Units)', `${sc.low.units}`, `${sc.mid.units}`, `${sc.high.units}`],
      ['Target MRP (Listed)', `${curr}${inputs.mrp}`, `${curr}${inputs.mrp}`, `${curr}${inputs.mrp}`],
      ['Customer Discount %', `${(sc.low.discount * 100).toFixed(1)}%`, `${(sc.mid.discount * 100).toFixed(1)}%`, `${(sc.high.discount * 100).toFixed(1)}%`],
      ['Actual Realized Price (Incl. GST)', `${curr}${sc.low.customerPrice.toFixed(2)}`, `${curr}${sc.mid.customerPrice.toFixed(2)}`, `${curr}${sc.high.customerPrice.toFixed(2)}`],
      ['Output GST Rate (Step Rule: <=2500 @ 5%, >2500 @ 18%)', `${sc.low.outputRate}%`, `${sc.mid.outputRate}%`, `${sc.high.outputRate}%`],
      ['Output GST Amount per Unit', `${curr}${sc.low.outputGst.toFixed(2)}`, `${curr}${sc.mid.outputGst.toFixed(2)}`, `${curr}${sc.high.outputGst.toFixed(2)}`],
      ['Net Revenue (Excl. GST)', `${curr}${sc.low.netSales.toFixed(2)}`, `${curr}${sc.mid.netSales.toFixed(2)}`, `${curr}${sc.high.netSales.toFixed(2)}`],
      ['Landed Product & Inbound Cost', `${curr}${sc.low.baseProductCost.toFixed(2)}`, `${curr}${sc.mid.baseProductCost.toFixed(2)}`, `${curr}${sc.high.baseProductCost.toFixed(2)}`],
      ['Gross Profit per Unit', `${curr}${sc.low.grossProfit.toFixed(2)}`, `${curr}${sc.mid.grossProfit.toFixed(2)}`, `${curr}${sc.high.grossProfit.toFixed(2)}`],
      ['Gross Margin %', `${(sc.low.grossMargin * 100).toFixed(1)}%`, `${(sc.mid.grossMargin * 100).toFixed(1)}%`, `${(sc.high.grossMargin * 100).toFixed(1)}%`],
      ['Fulfillment & Channel Fees', `${curr}${(sc.low.fixedOrder + sc.low.salesRateCost).toFixed(2)}`, `${curr}${(sc.mid.fixedOrder + sc.mid.salesRateCost).toFixed(2)}`, `${curr}${(sc.high.fixedOrder + sc.high.salesRateCost).toFixed(2)}`],
      ['Marketing CAC per Unit', `${curr}${inputs.cac.low}`, `${curr}${inputs.cac.mid}`, `${curr}${inputs.cac.high}`],
      ['Fixed Overhead Allocated per Unit', `${curr}${sc.low.overheadPerUnit.toFixed(2)}`, `${curr}${sc.mid.overheadPerUnit.toFixed(2)}`, `${curr}${sc.high.overheadPerUnit.toFixed(2)}`],
      ['Net Contribution Profit per Unit', `${curr}${sc.low.contributionProfit.toFixed(2)}`, `${curr}${sc.mid.contributionProfit.toFixed(2)}`, `${curr}${sc.high.contributionProfit.toFixed(2)}`],
      ['Net Contribution Margin %', `${(sc.low.contributionMargin * 100).toFixed(1)}%`, `${(sc.mid.contributionMargin * 100).toFixed(1)}%`, `${(sc.high.contributionMargin * 100).toFixed(1)}%`],
      ['Total Annual Gross Sales', `${curr}${sc.low.annualRevenue.toFixed(0)}`, `${curr}${sc.mid.annualRevenue.toFixed(0)}`, `${curr}${sc.high.annualRevenue.toFixed(0)}`],
      ['Total Annual Net Profit', `${curr}${sc.low.annualContribution.toFixed(0)}`, `${curr}${sc.mid.annualContribution.toFixed(0)}`, `${curr}${sc.high.annualContribution.toFixed(0)}`],
      ['Viability Status', sc.low.status, sc.mid.status, sc.high.status],
      [],
      ['2. BREAK-EVEN & PRICING SOLVERS'],
      ['Solver Metric', 'Conservative (Low)', 'Expected (Mid)', 'Upside (High)'],
      ['Break-Even MRP (Zero Profit)', Number.isFinite(sc.low.breakEvenMrp) ? `${curr}${sc.low.breakEvenMrp.toFixed(2)}` : 'N/A', Number.isFinite(sc.mid.breakEvenMrp) ? `${curr}${sc.mid.breakEvenMrp.toFixed(2)}` : 'N/A', Number.isFinite(sc.high.breakEvenMrp) ? `${curr}${sc.high.breakEvenMrp.toFixed(2)}` : 'N/A'],
      [`Target MRP (at ${inputs.targetMargin}% Net Margin)`, Number.isFinite(sc.low.targetMrp) ? `${curr}${sc.low.targetMrp.toFixed(2)}` : 'N/A', Number.isFinite(sc.mid.targetMrp) ? `${curr}${sc.mid.targetMrp.toFixed(2)}` : 'N/A', Number.isFinite(sc.high.targetMrp) ? `${curr}${sc.high.targetMrp.toFixed(2)}` : 'N/A'],
      ['Max Factory Cost Allowed', `${curr}${sc.low.maximumFactoryCost.toFixed(2)}`, `${curr}${sc.mid.maximumFactoryCost.toFixed(2)}`, `${curr}${sc.high.maximumFactoryCost.toFixed(2)}`],
      [],
      ['3. STEP 1 - INBOUND & PRODUCT COST ITEMIZED BOM'],
      ['Component', 'Unit Cost', 'Notes'],
      ['Factory CMT / Base Garment', `${curr}${inputs.factory}`, 'Base cut, make & fabric cost'],
      ['Tech Development & Sampling', `${curr}${inputs.development}`, 'Pattern grading & prototype'],
      ['Inbound Freight to Hub', `${curr}${inputs.inbound}`, 'Bulk domestic logistics'],
      ['Quality Control (AQL 2.5)', `${curr}${inputs.qc}`, 'On-site mill inspection'],
      ['Protective Polybag Packaging', `${curr}${inputs.packaging}`, 'Custom matte frosted polybag'],
      ['Branded Hangtags & Barcodes', `${curr}${inputs.tags}`, 'FSC cardstock & security loop'],
      ['Rivlet Woven Labels & Aglets', `${curr}${inputs.branding}`, 'Custom metallic trims & neck label'],
      ['Receiving & Warehouse Palletizing', `${curr}${inputs.receiving}`, 'Inward verification'],
      ['Pick, Pack & Fulfillment Handling', `${curr}${inputs.pickpack}`, 'Individual unit boxing'],
      ['Inventory Storage & Shrinkage', `${curr}${inputs.inventory}`, 'Holding reserve'],
      ['Total Landed Inbound Cost', `${curr}${currentResult.baseProductCost.toFixed(2)}`, 'All 10 manufacturing steps'],
      [],
      ['4. TAXATION & GST INPUT TAX CREDIT (ITC)'],
      ['Factory Inbound GST Rate', `${currentResult.factoryRate}%`, currentResult.factoryRate === 5 ? 'Tier 1 Garment (<= 2500)' : 'Tier 2 Garment (> 2500)'],
      ['Factory GST Paid in Cash', `${curr}${currentResult.factoryGst.toFixed(2)}`, inputs.factoryGstRecoverable ? '100% Eligible as ITC Offset' : 'Non-recoverable cost'],
      ['Net Working Capital Outlay', `${curr}${currentResult.factoryCashOutlay.toFixed(2)}`, 'Immediate cash required at mill'],
    ];

    const csvContent = '\uFEFF' + lines.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inputs.productCode || 'Rivlet'}_Commercial_Financial_Dossier.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 2. Trigger Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // 3. Copy Summary to Clipboard
  const handleCopySummary = () => {
    const text = exportMode === 'commercial' 
      ? `=== RIVLET COMMERCIAL COSTING DOSSIER ===
Style: ${inputs.productName} (${inputs.productCode})
Target MRP: ${curr}${inputs.mrp}
Target Margin: ${inputs.targetMargin}%

[Expected Scenario (Mid)]
• Realized Price (Incl GST): ${curr}${allScenarios.mid.customerPrice.toFixed(0)} (${(allScenarios.mid.discount * 100).toFixed(0)}% off)
• Output GST: ${allScenarios.mid.outputRate}% (${curr}${allScenarios.mid.outputGst.toFixed(0)})
• Net Revenue: ${curr}${allScenarios.mid.netSales.toFixed(0)}
• Landed Product Cost: ${curr}${allScenarios.mid.baseProductCost.toFixed(0)}
• Gross Margin: ${(allScenarios.mid.grossMargin * 100).toFixed(1)}%
• Fulfillment & CAC: ${curr}${(allScenarios.mid.fixedOrder + allScenarios.mid.salesRateCost).toFixed(0)}
• Allocated Overhead: ${curr}${allScenarios.mid.overheadPerUnit.toFixed(0)}
• Net Profit / Unit: ${curr}${allScenarios.mid.contributionProfit.toFixed(0)} (${(allScenarios.mid.contributionMargin * 100).toFixed(1)}%)
• Break-Even MRP: ${curr}${allScenarios.mid.breakEvenMrp.toFixed(0)}
• Target Margin MRP: ${curr}${allScenarios.mid.targetMrp.toFixed(0)}
• Annual Expected Profit: ${curr}${allScenarios.mid.annualContribution.toLocaleString('en-IN')}`
      : `=== RIVLET VENDOR SPECIFICATION & RFQ ===
Date: ${currentDate}
Style: ${inputs.productName}
Style Code: ${inputs.productCode}
Season: FW26
Target Batch Quantity: ${allScenarios.mid.units} Units

Itemized Inbound Budget (Target FOB):
1. Cut, Make & Fabric: ${curr}${inputs.factory}
2. Development & Patterns: ${curr}${inputs.development}
3. Trims, Labels & Aglets: ${curr}${inputs.branding}
4. Hangtags & Security Barcode: ${curr}${inputs.tags}
5. Custom Frosted Polybag: ${curr}${inputs.packaging}
6. Domestic Freight to Central Hub: ${curr}${inputs.inbound}
Total Landed Target: ${curr}${currentResult.baseProductCost.toFixed(2)}

Quality Standard: AQL 2.5 Major / 4.0 Minor
GST Invoice: Applicable HSN Code with GST Tax Invoice.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0a0d14] border border-[#20273c] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1c2336] bg-[#0e121d] flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#cda052] to-[#8a6828] flex items-center justify-center text-black shadow-glow">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-serif tracking-wide">
                  Costing Export & Spec Sheet Suite
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold">
                  Print & CSV v2.0
                </span>
              </div>
              <p className="text-xs text-[#7d869d]">
                {inputs.productName} ({inputs.productCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#858e9f] hover:text-white hover:bg-[#181d2a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Mode Selection & Action Buttons */}
        <div className="p-3 sm:p-4 bg-[#090b12] border-b border-[#191f30] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#131724] p-1 rounded-xl border border-[#22293d]">
            <button
              onClick={() => setExportMode('commercial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                exportMode === 'commercial'
                  ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold shadow-glow'
                  : 'text-[#848d9f] hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Full Commercial Dossier (Internal)</span>
            </button>

            <button
              onClick={() => setExportMode('vendor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                exportMode === 'vendor'
                  ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold shadow-glow'
                  : 'text-[#848d9f] hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Vendor Spec / RFQ Sheet (Factory)</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2233] border border-[#22293d] text-xs text-[#a3adbf] hover:text-white flex items-center gap-1.5 transition-colors"
              title="Copy Summary to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2233] border border-[#22293d] text-xs text-[#cda052] hover:brightness-110 flex items-center gap-1.5 transition-colors"
              title="Download Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV / Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="px-4 py-2 bg-[#0d111b] border-b border-[#181f30] text-[11px] text-[#717b92] flex items-center gap-2 flex-shrink-0">
          <Info className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />
          <span>
            {exportMode === 'commercial'
              ? 'Commercial Dossier contains sensitive margins, CAC, overhead, and break-even solver formulas. Keep internal.'
              : 'Vendor RFQ Sheet omits confidential profit margins, marketing spend, and customer prices. Safe to share with factories.'}
          </span>
        </div>

        {/* Printable & Interactive Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#07090e]">
          {/* Printable Container with pure clean A4 styling */}
          <div 
            id="rivlet-printable-spec"
            className="w-full bg-[#0c0f18] text-[#e0e3ec] border border-[#1f2638] rounded-xl p-6 sm:p-8 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Document Header */}
            <div className="border-b border-[#1c2336] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-gray-300">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold tracking-widest text-[#cda052] font-serif print:text-[#92400e]">
                    R I V L E T
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#6c768c] font-mono print:text-gray-500">
                    • Luxury Apparel Studio
                  </span>
                </div>
                <h1 className="text-lg font-bold text-white font-serif print:text-black">
                  {exportMode === 'commercial' 
                    ? 'Commercial Costing & Unit Economics Dossier' 
                    : 'Garment Manufacturing Specification & RFQ Spec Sheet'}
                </h1>
                <p className="text-xs text-[#7e879f] print:text-gray-600">
                  Document Ref: {inputs.productCode || 'RIV-2026'}-EXP • Issued: {currentDate}
                </p>
              </div>

              <div className="text-right">
                <span className={`inline-block text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded border ${
                  exportMode === 'commercial'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/50 print:bg-gray-100 print:text-red-700 print:border-red-300'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 print:bg-gray-100 print:text-emerald-700 print:border-emerald-300'
                }`}>
                  {exportMode === 'commercial' ? 'CONFIDENTIAL • INTERNAL AUDIT' : 'EXTERNAL VENDOR SPEC • RFQ APPROVED'}
                </span>
                <p className="text-[11px] text-[#6b758b] mt-1 print:text-gray-500">
                  Target Batch Season: FW26
                </p>
              </div>
            </div>

            {/* Product Metadata Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#080a11] border border-[#1b2234] rounded-lg text-xs print:bg-gray-50 print:border-gray-200">
              <div>
                <span className="text-[#6d778d] block text-[10px] print:text-gray-500">STYLE / PRODUCT NAME</span>
                <span className="font-semibold text-white print:text-black">{inputs.productName}</span>
              </div>
              <div>
                <span className="text-[#6d778d] block text-[10px] print:text-gray-500">SKU / STYLE CODE</span>
                <span className="font-mono text-[#cda052] font-semibold print:text-amber-800">{inputs.productCode}</span>
              </div>
              <div>
                <span className="text-[#6d778d] block text-[10px] print:text-gray-500">BATCH VOLUME (EXP)</span>
                <span className="font-semibold text-white print:text-black">{allScenarios.mid.units.toLocaleString()} Units</span>
              </div>
              <div>
                <span className="text-[#6d778d] block text-[10px] print:text-gray-500">TARGET DELIVERY</span>
                <span className="font-semibold text-white print:text-black">45-60 Days Post-PO</span>
              </div>
            </div>

            {/* MODE 1: COMMERCIAL DOSSIER (Internal View) */}
            {exportMode === 'commercial' && (
              <div className="space-y-6">
                {/* 3-Scenario Comparison Table */}
                <div>
                  <h4 className="text-xs uppercase font-mono tracking-wider text-[#cda052] font-semibold mb-2 print:text-amber-800">
                    1. 3-Scenario Range Matrix (Unit-Level Unit Economics)
                  </h4>
                  <div className="border border-[#1d2437] rounded-lg overflow-x-auto print:border-gray-300">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#121623] border-b border-[#1d2437] text-[#8690a6] print:bg-gray-100 print:text-black print:border-gray-300">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Financial Metric</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Conservative (Low)</th>
                          <th className="py-2.5 px-3 text-right font-semibold text-[#cda052] print:text-amber-800">Expected (Mid)</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Upside (High)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#171d2c] print:divide-gray-200">
                        <tr>
                          <td className="py-2 px-3 text-[#b0b8cb] print:text-black">Forecasted Batch Volume</td>
                          <td className="py-2 px-3 text-right font-mono">{allScenarios.low.units} pcs</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#cda052] print:text-amber-800">{allScenarios.mid.units} pcs</td>
                          <td className="py-2 px-3 text-right font-mono">{allScenarios.high.units} pcs</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-[#b0b8cb] print:text-black">Customer Discount %</td>
                          <td className="py-2 px-3 text-right font-mono">{(allScenarios.low.discount * 100).toFixed(0)}%</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#cda052] print:text-amber-800">{(allScenarios.mid.discount * 100).toFixed(0)}%</td>
                          <td className="py-2 px-3 text-right font-mono">{(allScenarios.high.discount * 100).toFixed(0)}%</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-[#b0b8cb] print:text-black">Actual Customer Price (Incl. GST)</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{allScenarios.low.customerPrice.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white print:text-black">{curr}{allScenarios.mid.customerPrice.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{allScenarios.high.customerPrice.toFixed(0)}</td>
                        </tr>
                        <tr className="bg-[#0e121d] print:bg-gray-50">
                          <td className="py-2 px-3 text-[#b0b8cb] font-semibold print:text-black">
                            Output GST (Indian Step Rule: {allScenarios.mid.outputRate}%)
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-400 print:text-rose-700">-{curr}{allScenarios.low.outputGst.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-400 print:text-rose-700">-{curr}{allScenarios.mid.outputGst.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono text-rose-400 print:text-rose-700">-{curr}{allScenarios.high.outputGst.toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-[#b0b8cb] print:text-black">Net Revenue per Unit (Ex GST)</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{allScenarios.low.netSales.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white print:text-black">{curr}{allScenarios.mid.netSales.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{allScenarios.high.netSales.toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-[#b0b8cb] print:text-black">Landed Inbound Product Cost</td>
                          <td className="py-2 px-3 text-right font-mono">-{curr}{allScenarios.low.baseProductCost.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white print:text-black">-{curr}{allScenarios.mid.baseProductCost.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono">-{curr}{allScenarios.high.baseProductCost.toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-[#b0b8cb] print:text-black">Fulfillment & Sales Commissions</td>
                          <td className="py-2 px-3 text-right font-mono">-{curr}{(allScenarios.low.fixedOrder + allScenarios.low.salesRateCost).toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white print:text-black">-{curr}{(allScenarios.mid.fixedOrder + allScenarios.mid.salesRateCost).toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono">-{curr}{(allScenarios.high.fixedOrder + allScenarios.high.salesRateCost).toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-[#b0b8cb] print:text-black">Marketing CAC per Unit</td>
                          <td className="py-2 px-3 text-right font-mono">-{curr}{inputs.cac.low}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white print:text-black">-{curr}{inputs.cac.mid}</td>
                          <td className="py-2 px-3 text-right font-mono">-{curr}{inputs.cac.high}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-[#b0b8cb] print:text-black">Overhead Allocation per Unit</td>
                          <td className="py-2 px-3 text-right font-mono">-{curr}{allScenarios.low.overheadPerUnit.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white print:text-black">-{curr}{allScenarios.mid.overheadPerUnit.toFixed(0)}</td>
                          <td className="py-2 px-3 text-right font-mono">-{curr}{allScenarios.high.overheadPerUnit.toFixed(0)}</td>
                        </tr>
                        <tr className="bg-[#141a27] font-bold text-white border-t-2 border-[#2b354d] print:bg-gray-100 print:text-black print:border-gray-400">
                          <td className="py-2.5 px-3">Net Contribution Profit / Unit</td>
                          <td className={`py-2.5 px-3 text-right font-mono ${allScenarios.low.contributionProfit >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                            {curr}{allScenarios.low.contributionProfit.toFixed(0)} ({formatPercent(allScenarios.low.contributionMargin * 100)})
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono text-sm ${allScenarios.mid.contributionProfit >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                            {curr}{allScenarios.mid.contributionProfit.toFixed(0)} ({formatPercent(allScenarios.mid.contributionMargin * 100)})
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono ${allScenarios.high.contributionProfit >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                            {curr}{allScenarios.high.contributionProfit.toFixed(0)} ({formatPercent(allScenarios.high.contributionMargin * 100)})
                          </td>
                        </tr>
                        <tr className="bg-[#0c101a] font-bold text-white print:bg-white print:text-black">
                          <td className="py-2.5 px-3 text-[#cda052] print:text-amber-800">Total Batch Annual Net Profit</td>
                          <td className="py-2.5 px-3 text-right font-mono">{curr}{allScenarios.low.annualContribution.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#cda052] print:text-amber-800">{curr}{allScenarios.mid.annualContribution.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{curr}{allScenarios.high.annualContribution.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Solvers & Viability Benchmarks */}
                <div>
                  <h4 className="text-xs uppercase font-mono tracking-wider text-[#cda052] font-semibold mb-2 print:text-amber-800">
                    2. Commercial Viability Benchmarks & Solvers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#0a0d16] border border-[#1c2438] rounded-lg print:border-gray-300 print:bg-gray-50">
                      <span className="text-[10px] text-[#717a90] block uppercase font-mono print:text-gray-500">BREAK-EVEN MRP</span>
                      <span className="text-sm font-bold font-mono text-white print:text-black">
                        {Number.isFinite(allScenarios.mid.breakEvenMrp) ? `${curr}${allScenarios.mid.breakEvenMrp.toFixed(0)}` : 'N/A'}
                      </span>
                      <p className="text-[10px] text-[#636c80] mt-0.5 print:text-gray-500">Lowest retail price before losses occur.</p>
                    </div>

                    <div className="p-3 bg-[#0a0d16] border border-[#1c2438] rounded-lg print:border-gray-300 print:bg-gray-50">
                      <span className="text-[10px] text-[#717a90] block uppercase font-mono print:text-gray-500">TARGET MRP ({inputs.targetMargin}%)</span>
                      <span className="text-sm font-bold font-mono text-[#cda052] print:text-amber-800">
                        {Number.isFinite(allScenarios.mid.targetMrp) ? `${curr}${allScenarios.mid.targetMrp.toFixed(0)}` : 'N/A'}
                      </span>
                      <p className="text-[10px] text-[#636c80] mt-0.5 print:text-gray-500">Listed MRP to achieve {inputs.targetMargin}% margin.</p>
                    </div>

                    <div className="p-3 bg-[#0a0d16] border border-[#1c2438] rounded-lg print:border-gray-300 print:bg-gray-50">
                      <span className="text-[10px] text-[#717a90] block uppercase font-mono print:text-gray-500">MAX FACTORY COST</span>
                      <span className="text-sm font-bold font-mono text-white print:text-black">
                        {curr}{allScenarios.mid.maximumFactoryCost.toFixed(0)}
                      </span>
                      <p className="text-[10px] text-[#636c80] mt-0.5 print:text-gray-500">Maximum vendor CMT allowed.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2: VENDOR SPEC SHEET (Factory View) */}
            {exportMode === 'vendor' && (
              <div className="space-y-6">
                {/* Vendor Notice Banner */}
                <div className="p-3 bg-[rgba(205,160,82,0.08)] border border-[rgba(205,160,82,0.25)] rounded-lg text-xs flex items-center justify-between gap-3 print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#cda052] print:text-amber-800 flex-shrink-0" />
                    <span className="text-[#d8dede] print:text-black">
                      This technical cost spec sheet outlines Rivlet target BOM, trims, and quality standards for vendor quotation.
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#cda052] font-semibold print:text-amber-800">AQL 2.5 INSPECTION MANDATE</span>
                </div>

                {/* Technical Itemized Bill of Materials (BOM) */}
                <div>
                  <h4 className="text-xs uppercase font-mono tracking-wider text-[#cda052] font-semibold mb-2 print:text-amber-800">
                    Manufacturing Cost Breakdown (Target Unit FOB)
                  </h4>
                  <div className="border border-[#1d2437] rounded-lg overflow-hidden print:border-gray-300">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#121623] border-b border-[#1d2437] text-[#8690a6] print:bg-gray-100 print:text-black print:border-gray-300">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Component / Specification</th>
                          <th className="py-2.5 px-3 font-semibold">Technical Standard</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Target Allowance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#171d2c] print:divide-gray-200">
                        <tr>
                          <td className="py-2 px-3 text-white font-medium print:text-black">Cut, Make & Main Fabric (CMT)</td>
                          <td className="py-2 px-3 text-[#798399] print:text-gray-600">450 GSM French Terry Cotton, preshrunk, bio-wash</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-white print:text-black">{curr}{inputs.factory.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-medium print:text-black">Pattern & Technical Sampling</td>
                          <td className="py-2 px-3 text-[#798399] print:text-gray-600">Fit sample, grading S-XXL, shrinkage sign-off</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{inputs.development.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-medium print:text-black">Rivlet Branding Trims & Aglets</td>
                          <td className="py-2 px-3 text-[#798399] print:text-gray-600">Laser-engraved metal aglets, high-density neck label</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{inputs.branding.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-medium print:text-black">Hangtags & Security Barcode Seals</td>
                          <td className="py-2 px-3 text-[#798399] print:text-gray-600">600 GSM FSC certified matte card, wax seal cord</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{inputs.tags.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-medium print:text-black">Individual Protective Packaging</td>
                          <td className="py-2 px-3 text-[#798399] print:text-gray-600">Frosted zip-lock polybag with Rivlet insignia & ventilation</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{inputs.packaging.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-medium print:text-black">Quality Assurance & AQL 2.5 Audit</td>
                          <td className="py-2 px-3 text-[#798399] print:text-gray-600">Independent inline inspection & final random audit</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{inputs.qc.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-medium print:text-black">Inbound Logistics to Hub</td>
                          <td className="py-2 px-3 text-[#798399] print:text-gray-600">Palletized shipment to Rivlet Central Hub</td>
                          <td className="py-2 px-3 text-right font-mono">{curr}{inputs.inbound.toFixed(2)}</td>
                        </tr>
                        <tr className="bg-[#121624] font-bold text-white border-t-2 border-[#232b3e] print:bg-gray-100 print:text-black print:border-gray-400">
                          <td className="py-2.5 px-3 text-[#cda052] print:text-amber-800" colSpan={2}>
                            Total Target Inbound Landed Cost per Garment
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-sm text-[#cda052] print:text-amber-800">
                            {curr}{currentResult.baseProductCost.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vendor Compliance & Terms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-[#0a0d16] border border-[#1b2234] rounded-lg space-y-2 print:border-gray-300 print:bg-gray-50">
                    <h5 className="font-semibold text-white print:text-black flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#cda052] print:text-amber-800" />
                      Quality & Testing Acceptance
                    </h5>
                    <ul className="list-disc list-inside text-[#7c869e] space-y-1 text-[11px] print:text-gray-600">
                      <li>AQL 2.5 Major / 4.0 Minor Visual & Stitching Acceptance.</li>
                      <li>Colorfastness to washing: Minimum Grade 4.0.</li>
                      <li>Dimensional stability: Maximum 3% shrinkage lengthwise.</li>
                      <li>Zero tolerance for needle punctures or skipped seam stitches.</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-[#0a0d16] border border-[#1b2234] rounded-lg space-y-2 print:border-gray-300 print:bg-gray-50">
                    <h5 className="font-semibold text-white print:text-black flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#cda052] print:text-amber-800" />
                      Invoicing & GST Specifications
                    </h5>
                    <ul className="list-disc list-inside text-[#7c869e] space-y-1 text-[11px] print:text-gray-600">
                      <li>Applicable GST Tax Invoice with corresponding HSN Code.</li>
                      <li>Inbound GST rate: {currentResult.factoryRate}% applied on factory taxable value.</li>
                      <li>Inspection certificate attached to the final delivery challan.</li>
                      <li>Payment terms: 30% advance on sample sign-off, 70% post-QC dispatch.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="pt-4 border-t border-[#1a2133] flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#636c82] print:border-gray-300 print:text-gray-500">
              <span>Rivlet Admin & Merchandising Console • Confidential</span>
              <span>Authorized Signatory: _________________________</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#0a0d16] border-t border-[#1a2133] flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-[#666f84]">
            Tip: Press <kbd className="px-1 py-0.5 bg-[#171b28] border border-[#232a3e] rounded font-mono text-[10px] text-white">⌘P</kbd> or click Print / PDF to generate an executive paper report.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-xs text-[#8c95ab] hover:text-white border border-[#20273a] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
