import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const {
      activeWorkItemsCount = 0,
      overdueTasksCount = 0,
      dueTodayTasksCount = 0,
      expiringDocsCount = 0,
      currentSprintName = '',
      inProductionCount = 0,
      budgetBurnPercent = 0,
      activeStyles = [],
    } = await req.json();

    const systemInstruction = `You are the Chief Operations Officer Co-pilot for "Rivlet", a high-growth activewear brand.
Provide a crisp, actionable, high-impact "Daily Operations Pulse" briefing for the brand founders and sourcing leaders.
Keep it between 2 to 3 sentences maximum. Tone: Confident, executive, urgent where needed, hyper-focused on delivery deadlines and production quality.`;

    const prompt = `Current Operational Telemetry:
- Active Sprints: "${currentSprintName || 'General Operations'}"
- Overdue Tasks: ${overdueTasksCount}
- Due Today Tasks: ${dueTodayTasksCount}
- Total Active Work Items: ${activeWorkItemsCount}
- Expiring Document Vault Items: ${expiringDocsCount}
- Styles Currently in Sampling/Production: ${inProductionCount} (${activeStyles.slice(0, 3).join(', ')})
- Launch Budget Burn: ${budgetBurnPercent}%

Generate a JSON object with:
{
  "headline": "Brief 4-6 word punchy status (e.g., 'Sprint 1 on Track with 2 Critical QA Gates')",
  "briefing": "2-3 sentence executive briefing analyzing risks, critical deliverables today, and budget posture."
}`;

    const briefing = await generateGeminiJSON<{ headline: string; briefing: string }>({
      prompt,
      systemInstruction,
      temperature: 0.3,
    });

    return NextResponse.json(briefing);
  } catch (error: any) {
    console.error('AI Briefing Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate briefing' }, { status: 500 });
  }
}
