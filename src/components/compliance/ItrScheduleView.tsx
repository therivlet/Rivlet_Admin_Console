'use client';

import React from 'react';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BellRing,
  ExternalLink,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { addDurableNotification } from '@/lib/notificationStorage';

export default function ItrScheduleView() {
  const handleTriggerReminder = async (title: string, date: string, desc: string) => {
    try {
      await addDurableNotification({
        title: `Direct Tax Alert: ${title}`,
        message: `${desc} Statutory deadline: ${date}. Settle via Challan 280 on Income Tax portal.`,
        link: '/compliance?tab=itr',
        type: 'reminder',
        priority: 'high',
        module: 'compliance',
      });
      alert(`Reminder dispatched for ${title}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const advanceTaxTranches = [
    {
      quarter: 'Installment 1 (15%)',
      dueDate: '15 June',
      statutoryDate: '2026-06-15',
      estimatedAmount: '₹3,75,000',
      status: 'filed',
      challanNo: 'BSR-0021940-280',
    },
    {
      quarter: 'Installment 2 (45% Cumulative)',
      dueDate: '15 September',
      statutoryDate: '2026-09-15',
      estimatedAmount: '₹7,50,000',
      status: 'filed',
      challanNo: 'BSR-0099412-280',
    },
    {
      quarter: 'Installment 3 (75% Cumulative)',
      dueDate: '15 December',
      statutoryDate: '2026-12-15',
      estimatedAmount: '₹7,50,000',
      status: 'upcoming',
      challanNo: 'Pending Challan 280',
    },
    {
      quarter: 'Installment 4 (100% Final)',
      dueDate: '15 March',
      statutoryDate: '2027-03-15',
      estimatedAmount: '₹6,25,000',
      status: 'upcoming',
      challanNo: 'Pending Challan 280',
    },
  ];

  const tdsReturns = [
    {
      form: 'Form 24Q (Salary TDS)',
      period: 'Q2 (Jul - Sep)',
      dueDate: '31 October 2026',
      status: 'in_progress',
      lead: 'Finance Lead',
    },
    {
      form: 'Form 26Q (Vendor / Job-work TDS)',
      period: 'Q2 (Jul - Sep)',
      dueDate: '31 October 2026',
      status: 'in_progress',
      lead: 'Tax Consultant',
    },
    {
      form: 'Form 26Q (Vendor / Job-work TDS)',
      period: 'Q3 (Oct - Dec)',
      dueDate: '31 January 2027',
      status: 'upcoming',
      lead: 'Tax Consultant',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1e140e] dark:bg-[#0c101a] p-4 sm:p-5 rounded-2xl border border-[#3d2b20] dark:border-[#1a2233]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#cda052]" />
              <span>Direct Tax, Advance Tax & Corporate ITR Schedule</span>
            </h3>
            <p className="text-xs text-[#a99a8b]">
              PAN: <span className="text-[#f7d88c] font-mono font-semibold">AABCR1234F</span> • Section 208/211 Advance Tax & TDS Compliance
            </p>
          </div>
          <a
            href="https://www.incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors"
          >
            <span>Income Tax Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#cda052]" />
          </a>
        </div>
      </div>

      {/* Advance Tax 4-Tranche Tracker */}
      <div className="bg-[#18100b] dark:bg-[#090c14] rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] p-5 shadow-sm">
        <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#cda052]" />
          <span>Advance Tax Statutory Schedule (Section 208 / 211)</span>
        </h4>
        <p className="text-xs text-[#a99a8b] mb-4">
          Corporate entities must pay 100% of assessed income tax liability across four statutory quarters
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {advanceTaxTranches.map((t, idx) => (
            <div
              key={t.quarter}
              className={`p-4 rounded-xl border relative overflow-hidden ${
                t.status === 'filed'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-black/40 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-white">{t.dueDate}</span>
                {t.status === 'filed' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#f7d88c] font-semibold">
                    <Clock className="w-3 h-3" />
                    Upcoming
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-[#cbd5e1]">{t.quarter}</div>
              <div className="text-lg font-bold text-white font-mono mt-1">{t.estimatedAmount}</div>
              <div className="text-[11px] text-[#8895ad] font-mono mt-0.5">{t.challanNo}</div>

              {t.status !== 'filed' && (
                <button
                  onClick={() =>
                    handleTriggerReminder(
                      `Advance Tax ${t.quarter}`,
                      t.statutoryDate,
                      `Advance tax installment of ${t.estimatedAmount} due`
                    )
                  }
                  className="mt-3 w-full py-1.5 rounded-lg bg-black/60 hover:bg-white/10 text-xs font-semibold text-[#f7d88c] border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BellRing className="w-3 h-3" />
                  <span>Set Reminder</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TDS Quarterly Returns Matrix */}
      <div className="bg-[#18100b] dark:bg-[#090c14] rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] p-5 shadow-sm">
        <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#cda052]" />
          <span>Quarterly TDS Returns & Annual Tax Audit (Form 24Q, 26Q, ITR-6)</span>
        </h4>
        <p className="text-xs text-[#a99a8b] mb-4">
          Tracks withholding taxes on fabric mill contractors, job-workers, and annual statutory audit
        </p>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-black/40 text-[#a99a8b] uppercase text-[10px] border-b border-white/5">
                <th className="py-2.5 px-3 font-semibold">Form / Statutory Return</th>
                <th className="py-2.5 px-3 font-semibold">Tax Period</th>
                <th className="py-2.5 px-3 font-semibold">Statutory Due Date</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Lead Signatory</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tdsReturns.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{item.form}</td>
                  <td className="py-2.5 px-3 text-[#cbd5e1]">{item.period}</td>
                  <td className="py-2.5 px-3 font-mono text-[#f7d88c]">{item.dueDate}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#cbd5e1]">{item.lead}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() =>
                        handleTriggerReminder(
                          item.form,
                          item.dueDate,
                          `Quarterly TDS return filing for ${item.period}`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/10 text-[11px] font-semibold text-[#cbd5e1] border border-white/10"
                    >
                      Remind
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
