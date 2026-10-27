import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';
import { CalendarEventItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const {
      events = [],
      viewMonth = '',
    } = await req.json();

    const systemInstruction = `You are the Lead Operations & Compliance Cadence Planner for "Rivlet", an activewear brand.
You review calendar schedules containing statutory deadlines (GSTR-1, GSTR-3B, Advance Tax, ICEGATE duty gates, DSC expiry) and team sprint milestones.
You detect:
1. Pressure peaks (multiple critical events due within 48 hours).
2. Late filing risks (no prep time allocated before statutory cutoffs).
3. Recommended proactive review milestones (e.g., locking purchase registers 3 days before GSTR-1, CHA customs assessment checks 2 days before container gate-in).`;

    const serializedEvents = (events as CalendarEventItem[]).slice(0, 15).map(e => ({
      title: e.title,
      category: e.category,
      priority: e.priority,
      startTime: e.startTime,
      status: e.status,
    }));

    const prompt = `Calendar Period: ${viewMonth || 'Current Operational Window'}
Scheduled Events (${serializedEvents.length} items):
${JSON.stringify(serializedEvents, null, 2)}

Analyze this schedule and return a JSON object:
{
  "workloadRating": "Balanced | Heavy Statutory Load | Critical Pressure Peak",
  "scheduleSummary": "2-sentence executive summary of the month's operational and filing tempo.",
  "riskBottlenecks": [
    "Identified risk or bottleneck 1",
    "Identified risk or bottleneck 2"
  ],
  "proactiveRecommendations": [
    "Specific recommendation 1 with suggested preparation buffer",
    "Specific recommendation 2"
  ]
}`;

    const advice = await generateGeminiJSON<{
      workloadRating: string;
      scheduleSummary: string;
      riskBottlenecks: string[];
      proactiveRecommendations: string[];
    }>({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    return NextResponse.json(advice);
  } catch (error: any) {
    console.error('Calendar AI Advisor Error:', error);
    return NextResponse.json(
      {
        workloadRating: 'Balanced',
        scheduleSummary: 'Statutory deadlines are distributed throughout the month. Ensure accounting ledgers are reconciled ahead of GSTR-1 and GSTR-3B cutoff dates.',
        riskBottlenecks: [
          'Concentration of tax verification between the 10th and 20th of the month.',
        ],
        proactiveRecommendations: [
          'Pre-reconcile vendor GSTR-2B by the 8th to avoid filing delays.',
          'Verify CHA duty payment vouchers at least 24 hours prior to container gate-in.',
        ],
        error: error.message,
      },
      { status: 200 }
    );
  }
}
