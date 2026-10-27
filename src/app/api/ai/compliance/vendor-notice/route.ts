import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiJSON } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const {
      supplierName = 'Vendor Mills Ltd',
      gstin = '33AAAAA0000A1Z5',
      invoiceNumber = 'INV-2026-001',
      invoiceDate = '2026-10-15',
      taxableValue = 150000,
      igst = 27000,
      cgst = 0,
      sgst = 0,
      discrepancyType = 'Not uploaded in GSTR-1 by vendor',
    } = await req.json();

    const totalTax = igst + cgst + sgst;

    const systemInstruction = `You are the Commercial & Legal Accounts Officer for "Rivlet", an Indian apparel manufacturing brand.
You write professional, polite, but firm statutory compliance communications to suppliers and textile mills regarding missing or mismatched invoices under the GST Act.
Under Section 16(2)(aa) of the CGST Act, 2017, a buyer cannot claim Input Tax Credit (ITC) unless the supplier has filed GSTR-1 and the invoice is reflected in GSTR-2B.
Your goal is to prompt the vendor's accounting team to immediately upload or amend the invoice in their GSTR-1 before the 11th of the month so Rivlet's ITC is unblocked.`;

    const prompt = `Supplier Details:
- Name: ${supplierName}
- GSTIN: ${gstin}
- Invoice Number: ${invoiceNumber}
- Invoice Date: ${invoiceDate}
- Taxable Value: ₹${taxableValue.toLocaleString('en-IN')}
- GST Amount at Risk: ₹${totalTax.toLocaleString('en-IN')} (IGST: ₹${igst}, CGST: ₹${cgst}, SGST: ₹${sgst})
- Issue Encountered: ${discrepancyType}

Generate a JSON object with:
{
  "emailSubject": "Urgent: GSTR-2B ITC Reconciliation Discrepancy - ${invoiceNumber} - Rivlet Sourcing",
  "emailBody": "Formal professional email body addressed to the accounts manager detailing the missing/mismatched invoice, citing Section 16(2)(aa), explaining the financial block on Rivlet, and requesting filing before the upcoming GSTR-1 cutoff.",
  "whatsappText": "A crisp 3-4 line professional WhatsApp message containing invoice number, GST amount, and immediate call to action.",
  "statutoryWarning": "Brief 1-sentence reminder of statutory consequence if left unrectified."
}`;

    const notice = await generateGeminiJSON<{
      emailSubject: string;
      emailBody: string;
      whatsappText: string;
      statutoryWarning: string;
    }>({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    return NextResponse.json(notice);
  } catch (error: any) {
    console.error('Vendor Notice AI Error:', error);
    return NextResponse.json(
      {
        emailSubject: `Urgent: Input Tax Credit Discrepancy - Invoice Ref`,
        emailBody: `Dear Accounts Team,\n\nDuring our monthly GSTR-2B reconciliation, we noticed that your invoice has not yet been reflected in our auto-populated return. Under Section 16(2)(aa) of the CGST Act, we cannot claim eligible Input Tax Credit until this is uploaded in your GSTR-1.\n\nKindly ensure this invoice is uploaded before the statutory cutoff.\n\nWarm regards,\nAccounts & Compliance Team\nRivlet Apparel Corp`,
        whatsappText: `Hi Team, please ensure invoice is uploaded in your GSTR-1 to unblock our Input Tax Credit before the monthly cutoff. Thank you! - Rivlet Accounts`,
        statutoryWarning: `ITC claim is contingent upon supplier GSTR-1 return submission under Section 16(2)(aa).`,
        error: error.message,
      },
      { status: 200 }
    );
  }
}
