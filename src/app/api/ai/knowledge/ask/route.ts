import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { query, articles = [] } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const systemInstruction = `You are the Rivlet Operational Standards and Brand Guidelines AI Copilot.
You answer questions for founders, sourcing managers, and QA teams using Rivlet's confidential standard operating procedures (SOPs) and knowledge base.

Rules:
1. Ground your answers strictly in the provided articles.
2. Quote relevant standards (e.g. AQL 2.5 sample sizes, washing instructions, vendor compliance).
3. If the knowledge base does not cover the answer, state that clearly and provide industry-standard activewear best practices.`;

    const contextText = articles
      .map((a: any) => `### Title: ${a.title} (${a.category})\n${(a.content || '').slice(0, 3000)}`)
      .join('\n\n---\n\n')
      .slice(0, 35000);

    const prompt = `Rivlet Knowledge Base Context:
"""
${contextText}
"""

User Question: "${query}"

Return JSON in this format:
{
  "answer": "Clear, formatted markdown response answering the question directly.",
  "referencedArticles": ["List of relevant article titles referenced"],
  "confidence": "High | Medium | Low"
}`;

    const response = await generateGeminiJSON<{
      answer: string;
      referencedArticles: string[];
      confidence: string;
    }>({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('AI Knowledge Base Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search knowledge base' }, { status: 500 });
  }
}
