import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON, generateGeminiText } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { documentTitle, documentType, textContent, question } = await req.json();

    if (!textContent || typeof textContent !== 'string') {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    // Limit text to 40,000 characters to stay well within token limits and maintain low latency
    const truncatedText = textContent.slice(0, 40000);

    const systemInstruction = `You are a Senior Compliance, Legal, and Technical Apparel Document Auditor for "Rivlet".
Your job is to inspect apparel certificates (OEKO-TEX, GOTS, ISO), tech pack specs, test reports, and vendor contracts.
Be concise, highly accurate, and highlight critical operational clauses:
- Compliance status and validity / expiration dates
- Quality standards (AQL, shrinkage tolerances, colorfastness)
- Commercial terms, penalty clauses, and delivery milestones.`;

    if (question && typeof question === 'string' && question.trim()) {
      const prompt = `Document Title: "${documentTitle || 'Apparel Document'}"
Document Type: "${documentType || 'General'}"
Document Content:
"""
${truncatedText}
"""

User Question: "${question}"

Provide a direct, concise, factual answer based strictly on the document text.`;

      const answer = await generateGeminiText({
        prompt,
        systemInstruction,
        temperature: 0.1,
      });

      return NextResponse.json({ answer });
    } else {
      const prompt = `Document Title: "${documentTitle || 'Apparel Document'}"
Document Type: "${documentType || 'General'}"
Document Content:
"""
${truncatedText}
"""

Generate a structured JSON executive summary:
{
  "executiveSummary": "2-3 sentence high-level overview of this document.",
  "keyClauses": [
    "Bullet point 1: specific standard, tolerance, or term",
    "Bullet point 2: expiration or critical date",
    "Bullet point 3: testing result or compliance rating"
  ],
  "auditStatus": "Verified / Compliant | Action Required | Review Needed"
}`;

      const summary = await generateGeminiJSON<{
        executiveSummary: string;
        keyClauses: string[];
        auditStatus: string;
      }>({
        prompt,
        systemInstruction,
        temperature: 0.1,
      });

      return NextResponse.json(summary);
    }
  } catch (error: any) {
    console.error('AI Document Summary Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to inspect document' }, { status: 500 });
  }
}
