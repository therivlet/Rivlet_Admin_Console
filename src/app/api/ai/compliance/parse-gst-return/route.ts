import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiMultimodalJSON, generateGeminiJSON } from '@/lib/gemini';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let base64Data = '';
    let mimeType = 'application/pdf';
    let fileName = '';
    let rawTextContent = '';
    let excelRows: any[] = [];
    let detectedReturnType = 'unknown';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No return file uploaded' }, { status: 400 });
      }

      fileName = file.name;
      mimeType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 1. JSON portal export
      if (fileName.endsWith('.json') || mimeType.includes('json')) {
        try {
          rawTextContent = buffer.toString('utf-8');
          const parsedJson = JSON.parse(rawTextContent);
          if (parsedJson.itc_elg || parsedJson.sup_details) {
            detectedReturnType = 'GSTR-3B';
          } else if (parsedJson.b2b || parsedJson.hsn || parsedJson.b2cs) {
            detectedReturnType = 'GSTR-1';
          } else if (parsedJson.data?.b2b || parsedJson.docdata) {
            detectedReturnType = 'GSTR-2B';
          }
        } catch (_) {}
      }

      // 2. Excel portal export
      if (
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        fileName.endsWith('.csv') ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('csv')
      ) {
        try {
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheetsSummary: Record<string, any[]> = {};
          workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            sheetsSummary[sheetName] = rows.slice(0, 50);
            excelRows.push(...rows.slice(0, 30));
          });
          rawTextContent = JSON.stringify(sheetsSummary, null, 2);

          const sheetNamesLower = workbook.SheetNames.map((s) => s.toLowerCase());
          if (sheetNamesLower.some((s) => s.includes('3b') || s.includes('eligible itc') || s.includes('table 4'))) {
            detectedReturnType = 'GSTR-3B';
          } else if (sheetNamesLower.some((s) => s.includes('b2b') || s.includes('gstr1') || s.includes('outward'))) {
            detectedReturnType = 'GSTR-1';
          } else if (sheetNamesLower.some((s) => s.includes('2b') || s.includes('gstr-2b'))) {
            detectedReturnType = 'GSTR-2B';
          }
        } catch (excelErr: any) {
          console.warn('Notice parsing Excel return file:', excelErr);
        }
      }

      // 3. PDF / Scanned return
      if (!rawTextContent) {
        base64Data = buffer.toString('base64');
      }
    } else {
      const body = await req.json();
      base64Data = body.fileBase64 || '';
      mimeType = body.mimeType || 'application/pdf';
      fileName = body.fileName || 'gst_return.pdf';
      rawTextContent = body.rawTextContent || '';
    }

    if (!base64Data && !rawTextContent) {
      return NextResponse.json({ success: false, error: 'No return file content received' }, { status: 400 });
    }

    const systemInstruction = `You are the Lead GST Statutory Return Ingestion Agent for Indian tax compliance (GSTN).
You parse official GST portal downloads for:
1. GSTR-3B: Monthly Summary Return (Table 3.1 Outward supplies, Table 4 Available & Ineligible Input Tax Credit, Table 5.1 Late fee, Table 6.1 Payment of Tax).
2. GSTR-1: Monthly Outward Supplies (Turnover, Taxable Value, IGST, CGST, SGST, B2B sales invoices).
3. GSTR-2B / 2A: Auto-drafted ITC Statement (All inward supplier invoices, eligible ITC, blocked credit under Section 17(5)).

Rules:
- Gross Outward Turnover: The total invoice/turnover value of all outward supplies (including zero-rated, SEZ, exempt, and taxable).
- Taxable Value: The tax base on outward supplies.
- Output Tax: Integrated Tax (IGST), Central Tax (CGST), State Tax (SGST).
- Input Tax Credit (ITC): Total eligible ITC breakdown (IGST, CGST, SGST) and Ineligible ITC under Sec 17(5).
- If individual supplier/customer invoices are visible, extract up to 50 individual invoices into the 'invoices' array.
- Always output clean numbers (0 if not present).`;

    const prompt = `Analyze this GST return file (${fileName}) and output a single JSON object in this exact schema:
{
  "detectedReturnType": "GSTR-3B" | "GSTR-1" | "GSTR-2B",
  "taxPeriod": "Month Year (e.g. October 2026)",
  "legalName": "Business legal entity name if stated",
  "tradeName": "Trade name if stated",
  "gstin": "15-character GSTIN",
  "pan": "10-character PAN",
  "grossOutwardTurnover": 0.00,
  "outwardTaxableValue": 0.00,
  "outputIgst": 0.00,
  "outputCgst": 0.00,
  "outputSgst": 0.00,
  "totalOutputTax": 0.00,
  "inputIgst": 0.00,
  "inputCgst": 0.00,
  "inputSgst": 0.00,
  "totalEligibleItc": 0.00,
  "ineligibleItc": 0.00,
  "netPayable": 0.00,
  "invoices": [
    {
      "vendorName": "Supplier Name",
      "vendorGstin": "15-character GSTIN",
      "invoiceNumber": "INV-1234",
      "invoiceDate": "YYYY-MM-DD",
      "taxableValue": 0.00,
      "taxAmount": 0.00,
      "igstAmount": 0.00,
      "cgstAmount": 0.00,
      "sgstAmount": 0.00,
      "invoiceValue": 0.00,
      "matchStatus": "matched",
      "itcEligibility": "eligible",
      "invoiceType": "purchase_inward"
    }
  ],
  "summaryNotes": "Brief concise description of return values extracted"
}`;

    let parsedResult: any;

    if (rawTextContent) {
      parsedResult = await generateGeminiJSON<any>({
        prompt: `${prompt}\n\nGST Portal Raw Return Data:\n${rawTextContent.slice(0, 15000)}`,
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

    const returnType = parsedResult.detectedReturnType || (detectedReturnType !== 'unknown' ? detectedReturnType : 'GSTR-3B');
    const grossOutwardTurnover = Number(parsedResult.grossOutwardTurnover) || Number(parsedResult.outwardTaxableValue) || 0;
    const outputIgst = Number(parsedResult.outputIgst) || 0;
    const outputCgst = Number(parsedResult.outputCgst) || 0;
    const outputSgst = Number(parsedResult.outputSgst) || 0;
    const inputIgst = Number(parsedResult.inputIgst) || 0;
    const inputCgst = Number(parsedResult.inputCgst) || 0;
    const inputSgst = Number(parsedResult.inputSgst) || 0;
    const ineligibleItc = Number(parsedResult.ineligibleItc) || 0;

    const invoicesList = Array.isArray(parsedResult.invoices)
      ? parsedResult.invoices.map((inv: any, idx: number) => {
          const tVal = Number(inv.taxableValue) || 0;
          const tAmt = Number(inv.taxAmount) || (Number(inv.igstAmount || 0) + Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0));
          return {
            id: `inv-recon-portal-${Date.now()}-${idx}`,
            vendorName: inv.vendorName || `Vendor ${idx + 1}`,
            vendorGstin: (inv.vendorGstin || '').trim().toUpperCase(),
            invoiceNumber: inv.invoiceNumber || `PORTAL-${idx + 1}`,
            invoiceDate: inv.invoiceDate || new Date().toISOString().split('T')[0],
            taxableValue: tVal,
            taxAmount: tAmt,
            igstAmount: Number(inv.igstAmount) || 0,
            cgstAmount: Number(inv.cgstAmount) || 0,
            sgstAmount: Number(inv.sgstAmount) || 0,
            invoiceValue: Number(inv.invoiceValue) || (tVal + tAmt),
            inBooks: true,
            inGstr2b: true,
            matchStatus: inv.matchStatus || 'matched',
            itcEligibility: inv.itcEligibility || 'eligible',
            invoiceType: inv.invoiceType || (returnType === 'GSTR-1' ? 'sales_outward' : 'purchase_inward'),
            source: returnType === 'GSTR-1' ? 'gstr1_portal' : returnType === 'GSTR-2B' ? 'gstr2b_portal' : 'gstr3b_portal',
          };
        })
      : [];

    return NextResponse.json({
      success: true,
      data: {
        returnType,
        taxPeriod: parsedResult.taxPeriod || 'Current Period',
        legalName: parsedResult.legalName || undefined,
        tradeName: parsedResult.tradeName || undefined,
        gstin: (parsedResult.gstin || '').trim().toUpperCase() || undefined,
        pan: (parsedResult.pan || '').trim().toUpperCase() || undefined,
        grossOutwardTurnover,
        outputIgst,
        outputCgst,
        outputSgst,
        inputIgst,
        inputCgst,
        inputSgst,
        ineligibleItc,
        invoices: invoicesList,
        summaryNotes: parsedResult.summaryNotes || `Successfully ingested ${returnType} return (${fileName})`,
      },
    });
  } catch (error: any) {
    console.error('Error in parse-gst-return API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse GST return statement using AI.',
      },
      { status: 500 }
    );
  }
}
