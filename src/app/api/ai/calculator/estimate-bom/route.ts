import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';
import { GarmentBOM } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { garmentDescription, currency = '₹' } = await req.json();

    if (!garmentDescription || typeof garmentDescription !== 'string') {
      return NextResponse.json({ error: 'Garment description is required' }, { status: 400 });
    }

    const systemInstruction = `You are a Senior Apparel Merchandiser and Technical Costing Specialist for "Rivlet", a high-end activewear and premium casual brand based in India.
Your task is to take a garment concept/description and generate a highly accurate, realistic Technical Garment Bill of Materials (BOM) in Indian Rupees (₹).

Garment Costing Norms:
- Fabrics:
  - Specify primary fabric (e.g. 480 GSM French Terry 100% Combed Compact Cotton, or 78/22 Nylon-Spandex Interlock).
  - Consumption is in kg (e.g. 0.70-0.90 kg for hoodies, 0.22-0.30 kg for t-shirts, 0.25-0.35 kg for leggings).
  - Rate per unit in INR (e.g. ₹580-₹780/kg for premium compact cotton; ₹850-₹1200/kg for performance technical poly/nylon lycra).
  - Include rib knit for cuffs/collars if applicable.
- Trims:
  - Drawcords with custom branded metal/silicone aglets.
  - High-density silicone or woven neck labels, care labels, wash care labels.
  - Taping, zippers (YKK metal/waterproof), eyelets if applicable.
- Labor & Finishing:
  - Stitching labor: ₹80-₹220 depending on garment complexity.
  - Washing & Finishing: ₹30-₹65 (Bio-wash, silicone softener, vintage enzyme wash).`;

    const prompt = `Garment Description: "${garmentDescription}"
Currency: "${currency}"

Generate a complete GarmentBOM matching this JSON structure:
{
  "garmentType": "Clean title e.g. 480GSM Heavyweight French Terry Hoodie",
  "fabricItems": [
    {
      "id": "fab-1",
      "name": "Main Body French Terry",
      "material": "100% Combed Compact Cotton",
      "weightGsm": 480,
      "consumption": 0.82,
      "unit": "kg",
      "ratePerUnit": 680,
      "totalCost": 557.6
    }
  ],
  "trimItems": [
    {
      "id": "trim-1",
      "name": "Custom Laser-Engraved Matte Black Aglets",
      "category": "Trims & Hardware",
      "specification": "Zinc alloy matte finish with debossed logo",
      "quantity": 2,
      "ratePerUnit": 18,
      "totalCost": 36
    }
  ],
  "stitchingLabor": 160,
  "washFinishCost": 45,
  "totalBOMCost": 0,
  "notes": "Costing notes on yield efficiency, fabric shrinkage allowance (3%), and trim MOQs."
}`;

    const bom = await generateGeminiJSON<GarmentBOM>({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    // Ensure total costs are computed correctly
    const fabricTotal = (bom.fabricItems || []).reduce((sum, f) => {
      f.totalCost = Math.round(Number(f.consumption) * Number(f.ratePerUnit) * 10) / 10;
      return sum + f.totalCost;
    }, 0);

    const trimTotal = (bom.trimItems || []).reduce((sum, t) => {
      t.totalCost = Math.round(Number(t.quantity) * Number(t.ratePerUnit) * 10) / 10;
      return sum + t.totalCost;
    }, 0);

    bom.totalBOMCost = Math.round(fabricTotal + trimTotal + Number(bom.stitchingLabor || 0) + Number(bom.washFinishCost || 0));

    return NextResponse.json({ bom });
  } catch (error: any) {
    console.error('AI BOM Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to estimate BOM' }, { status: 500 });
  }
}
