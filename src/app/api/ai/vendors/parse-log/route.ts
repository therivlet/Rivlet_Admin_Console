import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { rawText, vendorName = '', todayDate = new Date().toISOString().split('T')[0] } = await req.json();

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'Raw text is required' }, { status: 400 });
    }

    const systemInstruction = `You are an Executive Sourcing & Vendor Relationship Assistant for "Rivlet".
You receive raw, messy communication logs (WhatsApp messages, forwarded emails, call transcripts, meeting notes) between Rivlet and a partner manufacturer/supplier.
Today's date is: ${todayDate}.

Your job is to parse this into a professional, concise communication journal entry:
1. Detect communication channel: 'WhatsApp' | 'Email' | 'Phone Call' | 'In-Person Meeting' | 'Portal' | 'Note'.
2. Extract an executive Summary (1-2 clear sentences of what happened).
3. Extract the Outcome & Commitments (what was agreed, pending deliverables, pricing or MOQ changes).
4. Extract or recommend a realistic Next Follow-Up Date in YYYY-MM-DD format (e.g. if they say "we will update Thursday", calculate Thursday relative to ${todayDate}).`;

    const prompt = `Vendor: "${vendorName}"
Raw Communication:
"""
${rawText}
"""

Return JSON in this EXACT format:
{
  "channel": "WhatsApp | Email | Phone Call | In-Person Meeting | Portal | Note",
  "summary": "1-2 sentence professional summary of discussion",
  "outcome": "Specific outcomes, deliverables, sample approvals or revisions agreed",
  "nextFollowUpDate": "YYYY-MM-DD"
}`;

    const parsed = await generateGeminiJSON<{
      channel: string;
      summary: string;
      outcome: string;
      nextFollowUpDate: string;
    }>({
      prompt,
      systemInstruction,
      temperature: 0.1,
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('AI Vendor Parse Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse vendor log' }, { status: 500 });
  }
}
