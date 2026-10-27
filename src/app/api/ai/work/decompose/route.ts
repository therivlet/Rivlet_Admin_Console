import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { prompt, styles = [], vendors = [], sprintName = '' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const availableStylesText = styles.map((s: any) => s.styleName || s).join(', ');
    const availableVendorsText = vendors.map((v: any) => v.name || v).join(', ');

    const systemInstruction = `You are the Lead Apparel Technical Program Manager for "Rivlet", a high-end activewear brand.
Your job is to decompose high-level manufacturing or operational sprint goals into structured, Azure DevOps (ADO) style Agile work items.

Follow these strict garment engineering rules:
1. Prioritize precision: User Stories must have clear apparel objectives (e.g., proto sample fit testing, lab dip D65 verification, AQL 2.5 inline QC).
2. Stories should have 2-4 granular child tasks with measurable points of measure (POM) or physical testing steps.
3. Priority MUST be one of: 1, 2, 3, 4 (1 = highest / P1, 2 = P2, etc.).
4. Story Points should be realistic Fibonacci numbers (1, 2, 3, 5, 8).
5. Link relevant styles from available styles: [${availableStylesText}].
6. Link relevant vendor from available vendors: [${availableVendorsText}].
7. Assignee should be "Unassigned" unless specified.
8. sprintName should match "${sprintName || 'Current Sprint'}" or "Backlog".`;

    const userPrompt = `Decompose the following apparel operational goal into a JSON array of User Stories with child tasks:
Goal: "${prompt}"

Return a JSON array where each object has this EXACT schema:
[
  {
    "title": "string (Concise user story title)",
    "type": "User Story",
    "priority": 1,
    "points": 5,
    "assignee": "Unassigned",
    "sprintName": "${sprintName || 'Sprint 1'}",
    "vendorName": "string or undefined",
    "stylesText": "string (comma-separated relevant styles)",
    "operationCategory": "Sampling & Fit | Sourcing & Fabrics | Production QC | Logistics | Marketing",
    "description": "string (Technical operational context)",
    "acceptanceCriteria": "string (Measurable criteria like tolerance +/- 0.5cm, zero puckering, etc.)",
    "tasks": [
      {
        "title": "string (Specific task name)",
        "priority": 1,
        "points": 2,
        "assignee": "Unassigned",
        "description": "string",
        "acceptanceCriteria": "string"
      }
    ]
  }
]`;

    const parsedStories = await generateGeminiJSON<any[]>({
      prompt: userPrompt,
      systemInstruction,
      temperature: 0.2,
    });

    return NextResponse.json({ stories: parsedStories });
  } catch (error: any) {
    console.error('AI Decompose Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to decompose sprint items' }, { status: 500 });
  }
}
