'use client';

import React from 'react';
import { X, TrendingDown, Target, TrendingUp, HelpCircle } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';

interface ScenarioHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_GUIDANCE: { field: string; conservative: string; expected: string; upside: string }[] = [
  {
    field: 'Units Sold',
    conservative: 'Your worst-realistic sell-through - a slow launch, weak marketing response, or a new/untested SKU.',
    expected: 'Your genuine best estimate based on comparable SKUs, wishlist/pre-order signals, or planned ad spend.',
    upside: 'A strong but plausible outcome - a viral moment, influencer push, or repeat-customer surge working in your favor.',
  },
  {
    field: 'Discount %',
    conservative: 'Highest discount you might be forced into - clearance pressure, aggressive competitor pricing, or slow sell-through.',
    expected: 'Your planned, budgeted promotional discount (e.g. a standard festive sale cadence).',
    upside: 'Little to no discounting needed - full-price sell-through because demand is strong.',
  },
  {
    field: 'CAC (Customer Acquisition Cost)',
    conservative: 'Highest cost per order if ad platforms get more expensive or conversion rates dip.',
    expected: 'Your current blended CAC across paid + organic channels, based on live campaign data.',
    upside: 'Lower CAC from improving organic reach, referrals, or ad efficiency gains.',
  },
  {
    field: 'Return / RTO Provision',
    conservative: 'Highest return/RTO rate you have seen for this category (activewear fit issues, COD refusals).',
    expected: 'Your typical historical return rate for similar products.',
    upside: 'Best-case low return rate - accurate sizing, engaged repeat customers, low COD share.',
  },
  {
    field: 'Shipping Subsidy',
    conservative: 'Highest outbound courier cost you might absorb (remote pincodes, heavier packaging, no free-shipping threshold met).',
    expected: 'Your average shipping subsidy per order today.',
    upside: 'Lowest cost - more orders clearing the free-shipping threshold, better courier rates at volume.',
  },
  {
    field: 'Annual Overheads (Salary, Office, SaaS, etc.)',
    conservative: 'Highest plausible fixed cost - hiring sooner than planned, unexpected tooling costs.',
    expected: 'Your current run-rate budget for this line item.',
    upside: 'Leanest realistic operation - deferred hires, annual-billing discounts, shared/remote setup.',
  },
];

export default function ScenarioHelpModal({ isOpen, onClose }: ScenarioHelpModalProps) {
  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose}>
        <div
          className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Scenario planning guide"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-[#cda052]" />
              Scenario Planning Guide
            </h2>
            <button onClick={onClose} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-[#94a3b8] mb-6">
            Every forecast field asks for three numbers - Conservative, Expected, and Upside. Together they show how your
            margins hold up across a realistic range of outcomes, instead of betting everything on one guess.
          </p>

          {/* Three scenario definitions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-[#1f2638] bg-[#0e121b] p-4">
              <div className="flex items-center gap-2 mb-2 text-rose-300">
                <TrendingDown className="w-4 h-4" />
                <h3 className="text-sm font-semibold">Conservative</h3>
              </div>
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                Your <strong>worst realistic case</strong> - not a doomsday number, but what happens if things go
                mildly wrong (slower sales, higher costs, more returns). If you're still profitable here, the SKU is safe.
              </p>
            </div>
            <div className="rounded-xl border border-[#cda052]/40 bg-[#141019]/40 p-4">
              <div className="flex items-center gap-2 mb-2 text-[#e6c875]">
                <Target className="w-4 h-4" />
                <h3 className="text-sm font-semibold">Expected</h3>
              </div>
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                Your <strong>genuine best estimate</strong> based on real data - comparable SKUs, current ad
                performance, historical return rates. This is the number you'd actually bet the business plan on.
              </p>
            </div>
            <div className="rounded-xl border border-[#1f2638] bg-[#0e121b] p-4">
              <div className="flex items-center gap-2 mb-2 text-emerald-300">
                <TrendingUp className="w-4 h-4" />
                <h3 className="text-sm font-semibold">Upside</h3>
              </div>
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                A <strong>strong but plausible</strong> outcome if things go your way - not a fantasy number, but
                what a successful launch realistically looks like.
              </p>
            </div>
          </div>

          {/* Field-by-field guidance */}
          <h3 className="text-sm font-semibold text-white mb-3">How to fill each field</h3>
          <div className="space-y-3">
            {FIELD_GUIDANCE.map((f) => (
              <div key={f.field} className="rounded-xl border border-[#1c2438] bg-[#0e121b] p-4">
                <p className="text-sm font-semibold text-[#e6c875] mb-2">{f.field}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-rose-300 font-semibold block mb-0.5">Conservative</span>
                    <span className="text-[#94a3b8] leading-relaxed">{f.conservative}</span>
                  </div>
                  <div>
                    <span className="text-[#e6c875] font-semibold block mb-0.5">Expected</span>
                    <span className="text-[#94a3b8] leading-relaxed">{f.expected}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 font-semibold block mb-0.5">Upside</span>
                    <span className="text-[#94a3b8] leading-relaxed">{f.upside}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200">
            <strong>Rule of thumb:</strong> if your Conservative scenario still breaks even or turns a profit, the SKU is
            low-risk to launch. If only the Upside scenario is profitable, you're depending on everything going right  - 
            worth re-costing before committing to production.
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
