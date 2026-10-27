import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const {
      question = '',
      context = {},
    } = await req.json();

    const {
      activeTab = 'overview',
      outwardTax = { igst: 1850000, cgst: 420000, sgst: 420000 },
      inputTaxCredit = { igst: 1420000, cgst: 380000, sgst: 380000 },
      netCashPayable = 510000,
      invoicesSummary = { total: 4, matched: 2, mismatched: 1, pending: 1 },
      mismatchedVendors = [],
      consignmentsSummary = { total: 4, pendingCustomsDuty: 186000, activePorts: ['INMAA1 (Chennai)', 'INNSA1 (Nhava Sheva)'] },
      advanceTaxSummary = { currentFiscalYear: 'FY 2026-27', totalPaid: 1650000, installmentsComplete: 2, totalEstimated: 3300000 },
      dscTokensSummary = { active: 3, expiringSoon: 1 },
      upcomingDeadlines = ['GSTR-1 (10th Monthly)', 'GSTR-3B (20th Monthly)', 'Advance Tax Q3 (Dec 15)'],
    } = context;

    const systemInstruction = `You are the Principal Statutory Compliance & Tax Strategy AI Co-Pilot for "Rivlet", an Indian apparel manufacturing brand with domestic sales and international export/import operations.
You specialize in:
1. Indian Goods and Services Tax (GST) Act: Rule 88A set-off sequencing (IGST credit must be completely exhausted before CGST/SGST), GSTR-1 (outward supplies), GSTR-3B (monthly summary & cash settlement via PMT-06 challan), and GSTR-2B Input Tax Credit (ITC) reconciliation.
2. ICEGATE Customs: Bills of Entry (BOE), Basic Customs Duty (BCD), IGST on imports, SWRC, e-Sanchit, port gate-in, CHA coordination, and avoiding demurrage/detention at Chennai and Nhava Sheva ports.
3. Income Tax & Direct Tax: Corporate Advance Tax under Sections 208/211 (15% by Jun 15, 45% by Sep 15, 75% by Dec 15, 100% by Mar 15), interest avoidance under Sections 234B and 234C, and quarterly TDS returns (24Q, 26Q).
4. Digital Signature Certificates (DSC Class 3): Preventing token expiry locks during portal upload.

Tone: Authoritative, executive, precise, zero-fluff, and hyper-vigilant about penalties and cash flow efficiency.`;

    let prompt = '';

    if (question && question.trim().length > 0) {
      // Interactive Statutory Q&A Mode
      prompt = `The user asked the following question regarding Rivlet's statutory compliance:
"${question.trim()}"

Current Brand Telemetry:
- Active Tab: ${activeTab}
- Outward GST Liability: IGST ₹${outwardTax.igst?.toLocaleString('en-IN')}, CGST ₹${outwardTax.cgst?.toLocaleString('en-IN')}, SGST ₹${outwardTax.sgst?.toLocaleString('en-IN')}
- Available Input Tax Credit (ITC): IGST ₹${inputTaxCredit.igst?.toLocaleString('en-IN')}, CGST ₹${inputTaxCredit.cgst?.toLocaleString('en-IN')}, SGST ₹${inputTaxCredit.sgst?.toLocaleString('en-IN')}
- Net Cash Payable via PMT-06: ₹${netCashPayable?.toLocaleString('en-IN')}
- GSTR-2B Invoices: ${invoicesSummary.matched} Matched, ${invoicesSummary.mismatched} Mismatched, ${invoicesSummary.pending} Pending
- Pending Customs Duty on Inbound Fabric: ₹${consignmentsSummary.pendingCustomsDuty?.toLocaleString('en-IN')}
- Advance Tax: Paid ₹${advanceTaxSummary.totalPaid?.toLocaleString('en-IN')} of ₹${advanceTaxSummary.totalEstimated?.toLocaleString('en-IN')} estimate
- Upcoming Deadlines: ${upcomingDeadlines.join(', ')}

Generate a structured JSON response answering the question directly with statutory citations and actionable advice for Rivlet:
{
  "complianceHealthScore": 92,
  "statusBadge": "Statutory Query Answered",
  "executiveSummary": "Direct 2-3 sentence answer with specific statutory rule, deadline, or calculation.",
  "keyActionItems": ["Specific action 1", "Specific action 2"],
  "gstInsight": "Relevant GST rule, liability, or 2B reconciliation advice if applicable.",
  "customsInsight": "Relevant customs or port clearance advice if applicable.",
  "calendarInsight": "Immediate date or cutoff to mark on the calendar."
}`;
    } else {
      // Full Autonomous Compliance Health Audit
      prompt = `Perform a comprehensive Statutory Compliance Health Audit for Rivlet:

Telemetry:
- Active Focus Area: ${activeTab.toUpperCase()}
- Outward GST Liability: IGST ₹${outwardTax.igst?.toLocaleString('en-IN')}, CGST ₹${outwardTax.cgst?.toLocaleString('en-IN')}, SGST ₹${outwardTax.sgst?.toLocaleString('en-IN')}
- Input Tax Credit (ITC): IGST ₹${inputTaxCredit.igst?.toLocaleString('en-IN')}, CGST ₹${inputTaxCredit.cgst?.toLocaleString('en-IN')}, SGST ₹${inputTaxCredit.sgst?.toLocaleString('en-IN')}
- Net Cash Payable via PMT-06 Challan: ₹${netCashPayable?.toLocaleString('en-IN')}
- GSTR-2B Invoices Status: ${invoicesSummary.total} total (${invoicesSummary.matched} matched, ${invoicesSummary.mismatched} mismatched, ${invoicesSummary.pending} pending)
- Mismatched Invoices / Discrepancies: ${JSON.stringify(mismatchedVendors)}
- ICEGATE Customs Consignments: ${consignmentsSummary.total} shipments, ₹${consignmentsSummary.pendingCustomsDuty?.toLocaleString('en-IN')} pending duty across ${consignmentsSummary.activePorts.join(', ')}
- Direct Tax / Advance Tax: Paid ₹${advanceTaxSummary.totalPaid?.toLocaleString('en-IN')} of ₹${advanceTaxSummary.totalEstimated?.toLocaleString('en-IN')} (${advanceTaxSummary.installmentsComplete}/4 tranches)
- DSC Tokens: ${dscTokensSummary.active} active, ${dscTokensSummary.expiringSoon} token expiring soon
- Immediate Statutory Deadlines: ${upcomingDeadlines.join(', ')}

Analyze the telemetry and return a structured JSON object:
{
  "complianceHealthScore": 95,
  "statusBadge": "Optimal Statutory Posture | ITC Risk Detected | Customs Duty Gate Due | Advance Tax Tranche Approaching",
  "executiveSummary": "2-3 concise, high-impact sentences summarizing current filing readiness, cash outflow, and statutory risks.",
  "keyActionItems": [
    "Prioritized actionable task 1",
    "Prioritized actionable task 2",
    "Prioritized actionable task 3"
  ],
  "gstInsight": "1-2 sentence analysis on Rule 88A set-off, cash outflow via PMT-06, and GSTR-2B vendor mismatches blocking ITC.",
  "customsInsight": "1-2 sentence recommendation for customs duty payments and CHA clearance to avoid port demurrage.",
  "calendarInsight": "1-2 sentence guidance on chronological filing cutoffs for GSTR-1, GSTR-3B, and Advance Tax."
}`;
    }

    const audit = await generateGeminiJSON<{
      complianceHealthScore: number;
      statusBadge: string;
      executiveSummary: string;
      keyActionItems: string[];
      gstInsight: string;
      customsInsight: string;
      calendarInsight: string;
    }>({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    return NextResponse.json(audit);
  } catch (error: any) {
    console.error('Compliance AI Advisor Error:', error);
    return NextResponse.json(
      {
        complianceHealthScore: 88,
        statusBadge: 'Offline Fallback Active',
        executiveSummary: 'Statutory telemetry indicates active operations. Ensure Rule 88A IGST set-off is fully utilized prior to GSTR-3B cash challan generation.',
        keyActionItems: [
          'Verify GSTR-2B reconciliation before filing GSTR-3B by the 20th',
          'Settle pending ICEGATE customs duties to prevent port demurrage charges',
          'Review Class 3 DSC token validity for designated signatories',
        ],
        gstInsight: 'Review GSTR-2B supplier uploads to claim full eligible Input Tax Credit against outward liabilities.',
        customsInsight: 'Ensure Bill of Entry assessable value matches CHA documentation prior to duty payment.',
        calendarInsight: 'Maintain filing buffers: GSTR-1 by 10th and GSTR-3B by 20th of the month.',
        error: error.message,
      },
      { status: 200 }
    );
  }
}
