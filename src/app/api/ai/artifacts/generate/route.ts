import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiText } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { prompt, category = 'Operations' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemInstruction = `You are an elite Senior UI/UX Engineer and Frontend Developer specializing in creating standalone, single-file interactive tools and calculators for luxury brands like "Rivlet".

Aesthetic & Engineering Requirements:
1. Return a single complete, valid, self-contained HTML document with embedded CSS (<style>) and JavaScript (<script>).
2. Design language: Dark luxury aesthetic. Background: #0a0c13, card borders: #222c42, primary accents: gold (#cda052), teal (#2dd4bf), text: #f8fafc and muted #8c9bb5.
3. Clean modern typography (sans-serif / Inter / system font). Smooth micro-interactions, responsive inputs, and instant live recalculations.
4. DO NOT use external network dependencies (no external CDNs, Google Fonts, or external scripts). All styling and logic must work offline in an isolated sandboxed iframe.
5. Provide helpful sample values and reset buttons so the tool is immediately useful.
6. Return ONLY the raw HTML code. Do NOT wrap in markdown \`\`\`html code blocks. Output starts with <!DOCTYPE html>.`;

    const userPrompt = `Create a complete, fully functional, standalone interactive web tool for Rivlet:
Tool Concept: "${prompt}"
Category: "${category}"`;

    let html = await generateGeminiText({
      prompt: userPrompt,
      systemInstruction,
      temperature: 0.3,
    });

    // Clean any markdown formatting if present
    html = html.trim();
    if (html.startsWith('```')) {
      html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error('AI Artifact Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate artifact' }, { status: 500 });
  }
}
