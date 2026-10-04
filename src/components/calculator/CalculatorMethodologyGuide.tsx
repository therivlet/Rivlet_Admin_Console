'use client';

import React, { useState } from 'react';
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Truck,
  DollarSign,
  FileText,
  Sliders,
  ChevronDown,
  BookOpen,
  Scissors
} from 'lucide-react';
import Link from 'next/link';

interface CalculatorMethodologyGuideProps {
  onBackToCalculator?: () => void;
  onStartNewCalculation?: () => void;
}

export default function CalculatorMethodologyGuide({
  onBackToCalculator,
  onStartNewCalculation,
}: CalculatorMethodologyGuideProps) {
  const [activeSection, setActiveSection] = useState<string>('all');

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in text-slate-200">
      {/* 1. Header & Hero */}
      <div className="rounded-2xl border border-[#232d44] bg-gradient-to-r from-[#0c101a] via-[#101626] to-[#0c101a] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#cda052]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-3 relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cda052]/10 border border-[#cda052]/30 text-[#e6c875] text-xs font-semibold font-mono">
            <BookOpen className="w-3.5 h-3.5 text-[#cda052]" />
            <span>Master Financial Blueprint • Complete Methodology</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
            Garment Costing, Indian GST Step Taxation & Unit Economics Guide
          </h1>

          <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
            The definitive technical and theoretical blueprint for Rivlet pricing. Understand every field, formula, tax rule, fixed overhead absorption mechanism, and multi-scenario forecast.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            {onBackToCalculator && (
              <button
                onClick={onBackToCalculator}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Open Interactive Calculator</span>
              </button>
            )}
            <Link
              href="/knowledge-base"
              className="px-4 py-2 rounded-xl bg-[#141926] border border-[#232d44] text-[#cbd5e1] hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#cda052]" />
              <span>View in Confidential Brand KB</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Executive Master Formula Waterfall Diagram */}
      <div className="bg-[#0b0e17] border border-[#1d253a] rounded-2xl p-5 sm:p-7 shadow-lg space-y-4">
        <div className="border-b border-[#1a2336] pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#cda052]" />
            <span>The Master Unit Economics Waterfall</span>
          </h2>
          <p className="text-xs text-[#717a90]">
            How customer checkout cash translates into net business contribution margin:
          </p>
        </div>

        {/* Visual Waterfall Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-2 text-xs">
          <div className="p-3 bg-[#0f1422] rounded-xl border border-[#212b42] space-y-1">
            <span className="text-[10px] text-[#cda052] uppercase font-mono block font-bold">1. Listed MRP Tag</span>
            <div className="text-base font-bold text-white font-mono">₹4,499</div>
            <p className="text-[10px] text-[#717a90]">Catalog tag price displayed to customer.</p>
          </div>

          <div className="p-3 bg-[#0f1422] rounded-xl border border-[#212b42] space-y-1">
            <span className="text-[10px] text-amber-400 uppercase font-mono block font-bold">2. Customer Price</span>
            <div className="text-base font-bold text-white font-mono">₹3,824</div>
            <p className="text-[10px] text-[#717a90]">After 15% discount. Customer checkout cash.</p>
          </div>

          <div className="p-3 bg-[#0f1422] rounded-xl border border-[#212b42] space-y-1">
            <span className="text-[10px] text-sky-400 uppercase font-mono block font-bold">3. Net Sales (Ex-GST)</span>
            <div className="text-base font-bold text-white font-mono">₹3,241</div>
            <p className="text-[10px] text-[#717a90]">After ₹583 Output GST (18% &gt; ₹2,500).</p>
          </div>

          <div className="p-3 bg-[#0f1422] rounded-xl border border-[#212b42] space-y-1">
            <span className="text-[10px] text-rose-400 uppercase font-mono block font-bold">4. Total Unit Costs</span>
            <div className="text-base font-bold text-rose-300 font-mono">−₹2,229</div>
            <p className="text-[10px] text-[#717a90]">Landed + Overhead + Variable Sales.</p>
          </div>

          <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-700/50 space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase font-mono block font-bold">5. Contribution Profit</span>
            <div className="text-base font-bold text-emerald-300 font-mono">+₹1,012 (31.2%)</div>
            <p className="text-[10px] text-emerald-400/80">Net cash margin retained by brand.</p>
          </div>
        </div>
      </div>

      {/* 3. Deep-Dive Category Explanations */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-[#1e273c] pb-2 font-serif">
          Detailed Category & Field Breakdown
        </h2>

        {/* SECTION 1: IDENTITY & STRATEGIC PRICING */}
        <div className="bg-[#0b0e17] border border-[#1d253a] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#cda052]/10 border border-[#cda052]/30 flex items-center justify-center text-[#cda052] font-bold text-xs font-mono">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pricing Identity & Strategic Hurdle</h3>
              <p className="text-[11px] text-[#717a90]">Core product identifiers, tag price, and target contribution margin.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1">
              <strong className="text-white block">Listed MRP Tag (Maximum Retail Price)</strong>
              <p className="text-[#94a3b8] text-[11px]">
                The legally mandated printed maximum retail price tag in India. It anchors customer perception of garment luxury and sets the ceiling for retail markup.
              </p>
              <span className="text-[10px] text-[#cda052] font-mono block">Field: inputs.mrp</span>
            </div>

            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1">
              <strong className="text-white block">Target Contribution Margin Goal (%)</strong>
              <p className="text-[#94a3b8] text-[11px]">
                The brand hurdle margin rate (typically 25% to 35%). The calculator uses this target to automatically reverse-engineer your required Target MRP and Maximum Factory Cost.
              </p>
              <span className="text-[10px] text-[#cda052] font-mono block">Field: inputs.targetMargin (default: 25%)</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: INDIAN GST STEP TAXATION */}
        <div className="bg-[#0b0e17] border border-[#1d253a] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs font-mono">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Indian GST Step-Function Taxation System</h3>
              <p className="text-[11px] text-[#717a90]">The ₹2,500 threshold rule, tax extraction, and Factory ITC treatment.</p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-950/40 via-[#0e121e] to-blue-950/40 border border-blue-800/40 rounded-xl space-y-2 text-xs">
            <strong className="text-blue-300 block text-xs">The Official Indian Retail Apparel GST Rule:</strong>
            <ul className="list-disc list-inside space-y-1 text-[#cbd5e1] text-[11px]">
              <li>If the actual customer checkout price is <strong>≤ ₹2,500</strong>, the statutory GST rate is <strong>5%</strong>.</li>
              <li>If the actual customer checkout price is <strong>&gt; ₹2,500</strong>, the statutory GST rate jumps to <strong>18%</strong>.</li>
            </ul>
            <p className="text-[11px] text-[#94a3b8] pt-1">
              <strong>Crucial Takeaway:</strong> Output GST in India is tax-inclusive. When a customer pays ₹3,824 for a hoodie, the ex-GST net sales is computed as:
              <br />
              <code className="text-[#e6c875] font-mono text-[10px] block mt-1">
                Net Sales = Customer Price ÷ (1 + GST Rate / 100) = ₹3,824 ÷ 1.18 = ₹3,240.68
              </code>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1">
              <strong className="text-white block">Factory GST & Input Tax Credit (ITC)</strong>
              <p className="text-[#94a3b8] text-[11px]">
                Under Indian GST law, GST billed by your manufacturing factory (5% or 18%) is an Input Tax Credit (ITC). It can be directly offset against the Output GST you collect from customers. When &quot;Factory GST is Recoverable ITC&quot; is ON, it does NOT increase unit cost; it is treated as a balance sheet tax credit!
              </p>
              <span className="text-[10px] text-emerald-400 font-mono block">factoryGstRecoverable: true</span>
            </div>

            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1">
              <strong className="text-white block">Cash Outlay vs Landed P&amp;L</strong>
              <p className="text-[#94a3b8] text-[11px]">
                While factory GST is recoverable later upon tax filing, you must disburse cash upfront when paying the factory invoice. The calculator tracks both: the Unit P&amp;L landed cost AND the gross factory cash outlay.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: LANDED PRODUCT COSTS & BOM */}
        <div className="bg-[#0b0e17] border border-[#1d253a] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs font-mono">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Landed Manufacturing Cost & Bill of Materials (BOM)</h3>
              <p className="text-[11px] text-[#717a90]">Fabric consumption, trims, stitching CMT, finishing, packaging, and import customs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1">
              <span className="text-[10px] text-purple-400 uppercase font-mono font-bold block">1. Technical Garment BOM</span>
              <p className="text-[#94a3b8] text-[11px]">
                • Main Body &amp; Rib Fabric (GSM weight, consumption rate/kg)<br />
                • Trims &amp; Hardware (YKK zipper, aglets, metal eyelets)<br />
                • Woven Neck Labels &amp; QR Care Instructions<br />
                • Stitching Labor / CMT assembly<br />
                • Enzyme bio-wash &amp; mineral vintage wash
              </p>
            </div>

            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1">
              <span className="text-[10px] text-purple-400 uppercase font-mono font-bold block">2. Inbound &amp; Packaging</span>
              <p className="text-[#94a3b8] text-[11px]">
                • Tech sampling &amp; pattern prototyping<br />
                • Factory-to-warehouse inbound logistics<br />
                • AQL 2.5 quality control inspection<br />
                • Luxury rigid gift box &amp; zip polybag<br />
                • Receiving, barcoding, pick/pack fulfillment, and inventory storage reserve
              </p>
            </div>

            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1">
              <span className="text-[10px] text-purple-400 uppercase font-mono font-bold block">3. Import Customs to India</span>
              <p className="text-[#94a3b8] text-[11px]">
                If garments are imported into India:<br />
                • International air/ocean freight + marine insurance<br />
                • Assessable CIF Value = FOB + Freight + Insurance<br />
                • Basic Customs Duty (BCD) (20%)<br />
                • Social Welfare Surcharge (SWS) (10% of BCD)<br />
                • Import IGST (claimable as ITC) + CHA clearance
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: ANNUAL OVERHEADS & BRAND ALLOCATION */}
        <div className="bg-[#0b0e17] border border-[#cda052]/40 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#cda052]/10 border border-[#cda052]/30 flex items-center justify-center text-[#cda052] font-bold text-xs font-mono">
              4
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Annual Business Overheads &amp; Catalog Volume Absorption</h3>
              <p className="text-[11px] text-[#717a90]">Spreading company run-rate across all catalog SKUs rather than burdening a single style.</p>
            </div>
          </div>

          <div className="p-4 bg-[#0e121e] rounded-xl border border-[#232d44] space-y-2 text-xs">
            <strong className="text-white block text-xs">Why Catalog Volume Allocation is Mandatory:</strong>
            <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
              If Rivlet incurs ₹10,70,000 in annual company expenses (executive salaries, studio lease, Shopify Plus, legal audit, capex amortization), loading 100% of that run-rate onto a single 1,200-piece hoodie run would add <span className="text-rose-400 font-mono font-bold">₹891.67 overhead per garment</span>, artificially making the hoodie look unprofitable!
            </p>
            <p className="text-[11px] text-[#94a3b8]">
              <strong>The Solution:</strong> In Brand Settings, configure the <strong>Total Brand Annual Sales Volume across all catalog SKUs</strong> (e.g. 20,000 units). The financial engine then divides company expenses proportionally:
              <br />
              <code className="text-[#e6c875] font-mono text-[10px] block mt-1">
                Overhead / Garment = Total Annual Company Overheads ÷ Total Brand Annual Sales Units = ₹10,70,000 ÷ 20,000 = ₹53.50 / garment
              </code>
            </p>
          </div>
        </div>

        {/* SECTION 5: VARIABLE ORDER COSTS & COMMISSIONS */}
        <div className="bg-[#0b0e17] border border-[#1d253a] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
              5
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Variable Order Costs &amp; Channel Take-Rates</h3>
              <p className="text-[11px] text-[#717a90]">CAC, shipping subsidies, returns, gateway charges, and affiliate commissions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1.5">
              <strong className="text-white block font-semibold">Fixed Order Fulfillment Charges (₹/order)</strong>
              <ul className="space-y-1 text-[#94a3b8] text-[11px]">
                <li>• <strong>CAC (Customer Acquisition Cost)</strong>: Blended Meta/Google ad spend per order (e.g. ₹250).</li>
                <li>• <strong>Outbound Shipping Subsidy</strong>: Free express courier subsidy offered to buyer (e.g. ₹70).</li>
                <li>• <strong>Return / RTO Provision</strong>: Actuarial reserve for non-delivery and returns (e.g. ₹115).</li>
                <li>• <strong>COD Handling &amp; Exchange Fee</strong>: Courier cash collection and size exchange reserve.</li>
              </ul>
            </div>

            <div className="p-3 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1.5">
              <strong className="text-white block font-semibold">Percentage Sales Rates (% of Net Sales)</strong>
              <ul className="space-y-1 text-[#94a3b8] text-[11px]">
                <li>• <strong>Payment Gateway Fee</strong>: Razorpay/Cashfree transaction fee (2.0%).</li>
                <li>• <strong>Shopify Platform Fee</strong>: External transaction charge (0% on Plus).</li>
                <li>• <strong>Influencer &amp; Affiliate Commission</strong>: Performance revenue share (e.g. 5–10%).</li>
                <li>• <strong>Marketplace Commission &amp; Ads</strong>: Channel take-rate (Amazon, Myntra, Ajio).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 6: 3 FORECAST SCENARIOS */}
        <div className="bg-[#0b0e17] border border-[#1d253a] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs font-mono">
              6
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">The 3-Scenario Stress-Test Engine</h3>
              <p className="text-[11px] text-[#717a90]">Conservative, Expected Baseline, and Upside Scale models.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1.5">
              <span className="text-[10px] text-[#94a3b8] uppercase font-mono font-bold block">Conservative (Downside)</span>
              <p className="text-[#94a3b8] text-[11px]">
                Stress-tests the garment under challenging headwinds: lower production volume (600 units), deeper discounts (20%), elevated CAC (₹350), and higher return rates (₹150). Confirms whether the style still breaks even.
              </p>
            </div>

            <div className="p-3.5 bg-[#0e121e] rounded-xl border border-[#cda052]/40 space-y-1.5">
              <span className="text-[10px] text-[#cda052] uppercase font-mono font-bold block">Expected (Base Budget)</span>
              <p className="text-[#cbd5e1] text-[11px]">
                The standard operating plan: planned batch units (1,200 pcs), standard 15% promotional discount, baseline CAC (₹250), and standard company run-rate. The core target for seasonal commercial budgeting.
              </p>
            </div>

            <div className="p-3.5 bg-[#0e121e] rounded-xl border border-[#1f283e] space-y-1.5">
              <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold block">Upside (Scale Efficiency)</span>
              <p className="text-[#94a3b8] text-[11px]">
                High product-market fit scenario: large batch volume (2,000+ units), minimal discount (8%), strong organic viral word-of-mouth (CAC drops to ₹150), and peak margin expansion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Fields Reference Table */}
      <div className="bg-[#0b0e17] border border-[#1d253a] rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="border-b border-[#1a2336] pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#cda052]" />
            <span>Master Field &amp; Factor Reference Table</span>
          </h2>
          <p className="text-xs text-[#717a90]">
            Complete dictionary of inputs, formulas, and margin impact across the financial engine:
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1a2336] custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#080b12] text-[#64748b] text-[10px] uppercase font-mono tracking-wider border-b border-[#1b2234]">
              <tr>
                <th className="py-2.5 px-3">Field Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Default Value</th>
                <th className="py-2.5 px-3">Calculation / Logic</th>
                <th className="py-2.5 px-3">Impact on Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151c2c] bg-[#090d16] text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Listed MRP</td>
                <td className="py-2.5 px-3 text-[#94a3b8]">Product Identity</td>
                <td className="py-2.5 px-3 font-mono text-[#cda052]">₹2,999</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">Tag price ceiling</td>
                <td className="py-2.5 px-3 text-emerald-400">+ Higher = higher revenue</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Customer Discount</td>
                <td className="py-2.5 px-3 text-[#94a3b8]">Forecast Scenario</td>
                <td className="py-2.5 px-3 font-mono">15% (mid)</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">MRP × (1 − Discount%)</td>
                <td className="py-2.5 px-3 text-rose-400">− Reduces top-line sales</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Output GST Rate</td>
                <td className="py-2.5 px-3 text-[#94a3b8]">Tax Policy</td>
                <td className="py-2.5 px-3 font-mono">Step (5% / 18%)</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">CustomerPrice &gt; ₹2500 ? 18% : 5%</td>
                <td className="py-2.5 px-3 text-amber-400">18% removes 15.25% of price</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Factory FOB Cost</td>
                <td className="py-2.5 px-3 text-[#94a3b8]">Manufacturing</td>
                <td className="py-2.5 px-3 font-mono">₹1,200</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">Direct supplier invoice price</td>
                <td className="py-2.5 px-3 text-rose-400">− Direct base landed cost</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Inbound Surcharges</td>
                <td className="py-2.5 px-3 text-[#94a3b8]">Logistics & Packaging</td>
                <td className="py-2.5 px-3 font-mono">₹218 / unit</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">Packaging, tags, branding, QC, pickpack</td>
                <td className="py-2.5 px-3 text-rose-400">− Fixed per unit cost</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Overhead Allocation</td>
                <td className="py-2.5 px-3 text-[#94a3b8]">Brand Run-Rate</td>
                <td className="py-2.5 px-3 font-mono">₹53.50 / unit</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">₹10.7L expenses ÷ 20,000 brand units</td>
                <td className="py-2.5 px-3 text-amber-400">Absorbs company operations</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Customer Acquisition (CAC)</td>
                <td className="py-2.5 px-3 text-[#94a3b8]">Marketing & Ads</td>
                <td className="py-2.5 px-3 font-mono">₹250 (mid)</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">Paid ad spend per conversion</td>
                <td className="py-2.5 px-3 text-rose-400">− Variable order charge</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Payment Gateway Fee</td>
                <td className="py-2.5 px-3 text-[#94a3b8]">Commercial Channel</td>
                <td className="py-2.5 px-3 font-mono">2.0%</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">Net Sales × 2.0%</td>
                <td className="py-2.5 px-3 text-rose-400">− Payment processing cut</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Contribution Profit</td>
                <td className="py-2.5 px-3 text-emerald-400">Final Outcome</td>
                <td className="py-2.5 px-3 font-mono text-emerald-400">₹800–₹1,200</td>
                <td className="py-2.5 px-3 text-[#cbd5e1]">Net Sales − Landed − Overhead − Sales Costs</td>
                <td className="py-2.5 px-3 text-emerald-400">★ True net cash profitability</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
