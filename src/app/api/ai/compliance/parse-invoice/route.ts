import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiMultimodalJSON, generateGeminiJSON } from '@/lib/gemini';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let base64Data = '';
    let mimeType = 'application/pdf';
    let fileName = '';
    let extractedText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
      }

      fileName = file.name;
      mimeType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // If Excel or CSV, parse table rows directly
      if (
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        fileName.endsWith('.csv') ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('csv')
      ) {
        try {
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          extractedText = JSON.stringify(rows.slice(0, 50), null, 2);
        } catch (excelErr: any) {
          console.warn('Notice parsing Excel buffer:', excelErr);
        }
      } else {
        base64Data = buffer.toString('base64');
      }
    } else {
      // JSON payload
      const body = await req.json();
      base64Data = body.fileBase64 || '';
      mimeType = body.mimeType || 'application/pdf';
      fileName = body.fileName || 'invoice.pdf';
      extractedText = body.extractedText || '';
    }

    if (!base64Data && !extractedText) {
      return NextResponse.json({ success: false, error: 'File content or base64 data required' }, { status: 400 });
    }

    const systemInstruction = `You are a specialist Indian GST & Tax Invoice Intelligence Agent for an enterprise apparel manufacturer.
Your task is to analyze the provided invoice (PDF, image, or tabular data) and extract structured GST reconciliation fields.
Indian GST Rule Rules:
- GSTIN is a 15-character alphanumeric string (e.g. 33AABCR1234F1Z8). Chars 3-12 is the PAN (e.g. AABCR1234F).
- Taxable Value is the base amount before GST.
- Total Invoice Value = Taxable Value + CGST + SGST + IGST.
- Determine ITC Eligibility:
  - 'ineligible_17_5' if food/beverage, personal conveyance/motor vehicles, corporate gifts, employee life insurance.
  - 'eligible' for raw materials (fabric, yarn, trims, zippers, packaging), job-work, factory machinery, logistics, audit/legal fees.
  - 'pending' if details are ambiguous.
- Determine Invoice Type: 'purchase_inward' (vendor/supplier bill to us) or 'sales_outward' (our bill to a customer).`;

    const prompt = `Carefully extract all invoice statutory data into this exact JSON format:
{
  "vendorName": "Exact supplier or customer legal entity name",
  "vendorGstin": "15-character GSTIN (uppercase, or clean default if absent)",
  "pan": "10-character PAN extracted from GSTIN",
  "invoiceNumber": "Invoice number / bill reference",
  "invoiceDate": "YYYY-MM-DD",
  "taxableValue": 0.00,
  "taxAmount": 0.00,
  "igstAmount": 0.00,
  "cgstAmount": 0.00,
  "sgstAmount": 0.00,
  "invoiceValue": 0.00,
  "itcEligibility": "eligible",
  "matchStatus": "matched",
  "invoiceType": "purchase_inward",
  "confidenceScore": 0.95,
  "notes": "Brief summary of line items (e.g., Combed cotton yarn, trims, dyeing job-work)"
}`;

    let parsedResult: any;

    if (extractedText) {
      parsedResult = await generateGeminiJSON<any>({
        prompt: `${prompt}\n\nInvoice Data:\n${extractedText}`,
        systemInstruction,
        temperature: 0.1,
      });
    } else {
      parsedResult = await generateGeminiMultimodalJSON<any>({
        prompt,
        systemInstruction,
        temperature: 0.1,
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    // Sanitize and ensure numeric fallbacks
    const taxableValue = Number(parsedResult.taxableValue) || 0;
    const igstAmount = Number(parsedResult.igstAmount) || 0;
    const cgstAmount = Number(parsedResult.cgstAmount) || 0;
    const sgstAmount = Number(parsedResult.sgstAmount) || 0;
    const taxAmount = Number(parsedResult.taxAmount) || (igstAmount + cgstAmount + sgstAmount);
    const invoiceValue = Number(parsedResult.invoiceValue) || (taxableValue + taxAmount);

    const sanitizedData = {
      vendorName: parsedResult.vendorName?.trim() || 'Vendor ' + (fileName.replace(/\.[^/.]+$/, '') || 'Invoice'),
      vendorGstin: (parsedResult.vendorGstin || '').trim().toUpperCase(),
      invoiceNumber: parsedResult.invoiceNumber?.trim() || `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: parsedResult.invoiceDate || new Date().toISOString().split('T')[0],
      taxableValue,
      taxAmount,
      igstAmount,
      cgstAmount,
      sgstAmount,
      invoiceValue,
      inBooks: true,
      inGstr2b: true,
      matchStatus: parsedResult.matchStatus || 'matched',
      itcEligibility: parsedResult.itcEligibility || 'eligible',
      invoiceType: parsedResult.invoiceType || 'purchase_inward',
      confidenceScore: parsedResult.confidenceScore || 0.95,
      notes: parsedResult.notes || `Extracted via AI from ${fileName}`,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedData,
    });
  } catch (error: any) {
    console.error('Error in parse-invoice API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse invoice using AI.',
      },
      { status: 500 }
    );
  }
}
