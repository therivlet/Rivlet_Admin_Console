import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const {
      productName = 'Active Garment',
      mrp = 2999,
      targetMargin = 25,
      actualMargin = 0,
      breakEvenMrp = 0,
      factoryCost = 0,
      totalCosts = 0,
      gstRate = 18,
      currency = '₹',
      scenarios = {},
    } = await req.json();

    const systemInstruction = `You are a Principal Apparel Unit Economics & Commercial Strategy Advisor for "Rivlet", an Indian direct-to-consumer and export activewear brand.
Given a garment's costing breakdown, pricing, Indian GST slab (<=2500 -> 5%, >2500 -> 18%), and scenario forecasts (Conservative, Expected, Upside), you generate 3 sharp strategic commercial insights:
1. Pricing & GST Optimization (e.g. evaluating if pricing near ₹2,499 saves 13% tax compared to ₹2,699).
2. Factory Cost & Margin Target (how to hit or exceed the brand's ${targetMargin}% target margin).
3. Customer Acquisition Cost (CAC) & Discount Sensitivity (how much discount/CAC room exists before falling below break-even).`;

    const prompt = `Product: "${productName}"
Retail MRP: ${currency}${mrp}
Target Margin: ${targetMargin}%
Current Expected Margin: ${actualMargin.toFixed(1)}%
Break-Even MRP: ${currency}${breakEvenMrp}
Factory & Inbound Cost: ${currency}${factoryCost}
Total Unit Cost: ${currency}${totalCosts}
Applicable GST Slab: ${gstRate}%

Generate JSON with:
{
  "statusBadge": "On Target | Margin Pressure | Sub-Break-Even",
  "gstInsight": "1-2 sentence analysis on GST slab impact and pricing threshold opportunities",
  "marginAdvice": "1-2 sentence recommendation on factory target cost or retail pricing to hit ${targetMargin}%",
  "discountRisk": "1-2 sentence guidance on max discount and promotional allowance"
}`;

    const advice = await generateGeminiJSON<{
      statusBadge: string;
      gstInsight: string;
      marginAdvice: string;
      discountRisk: string;
    }>({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    return NextResponse.json(advice);
  } catch (error: any) {
    console.error('AI Advisor Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate pricing advice' }, { status: 500 });
  }
}
