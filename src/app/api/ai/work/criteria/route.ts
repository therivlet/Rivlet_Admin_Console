import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { title, type = 'Task', styleName = '', category = '', vendorName = '', existingDescription = '' } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const systemInstruction = `You are the Lead Apparel Quality & Technical Standards Director at "Rivlet", a high-end luxury activewear brand.
Given an operational work item, you generate rigorous, measurable, garment-grade acceptance criteria and a technical description.
Use realistic apparel standards:
- Physical tolerances (e.g. +/- 0.5 cm POM deviation)
- Tensile / elastic recovery (% after N cycles)
- Fabric colorfastness (Grade 4.5+ under D65 lighting, Delta-E < 0.8)
- Seam integrity (flatlock seam tension, 4-needle 6-thread stitch count, zero puckering)
- Fabric shrinkage (< 3% after 30°C home wash)`;

    const prompt = `Work Item Details:
- Title: "${title}"
- Type: "${type}"
- Style: "${styleName || 'General Style'}"
- Category: "${category || 'Activewear'}"
- Vendor: "${vendorName || 'Partner Mill'}"
- Existing Description: "${existingDescription || 'None'}"

Generate clean JSON with:
{
  "acceptanceCriteria": "Clear, bulleted or concise measurable conditions of satisfaction required to close this item.",
  "suggestedDescription": "Comprehensive technical description explaining why this is required and how to verify."
}`;

    const result = await generateGeminiJSON<{ acceptanceCriteria: string; suggestedDescription: string }>({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Criteria Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate criteria' }, { status: 500 });
  }
}
