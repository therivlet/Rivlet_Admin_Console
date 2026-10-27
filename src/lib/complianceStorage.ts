import { supabase } from '@/lib/supabase';
import {
  ComplianceWorkflowItem,
  GstSettings,
  GstTaxCalculation,
  GstReconciliationInvoice,
  CustomsDeclaration,
  DscRegistryItem,
  CredentialVaultItem,
  AdvanceTaxRecord,
  TdsReturnRecord,
} from '@/lib/types';

export const STORAGE_KEY_WORKFLOWS = 'rivlet_compliance_workflows';
export const STORAGE_KEY_GST_SETTINGS = 'rivlet_gst_settings';
export const STORAGE_KEY_CUSTOMS = 'rivlet_customs_declarations';
export const STORAGE_KEY_DSC = 'rivlet_dsc_registry';
export const STORAGE_KEY_VAULT = 'rivlet_credential_vault';
export const STORAGE_KEY_RECON_INVOICES = 'rivlet_gst_recon_invoices';
export const STORAGE_KEY_ADVANCE_TAX = 'rivlet_advance_tax_records';
export const STORAGE_KEY_TDS_RECORDS = 'rivlet_tds_return_records';
export const STORAGE_KEY_GST_TAX_INPUTS = 'rivlet_gst_tax_inputs';

// --- Production Initial Statutory Datasets (Clean Indian Apparel Compliance) ---

export const INITIAL_GST_SETTINGS: GstSettings = {
  id: 'gst-settings-primary',
  gstin: '',
  legalName: 'My Enterprise',
  tradeName: '',
  pan: '',
  iec: '',
  filingFrequency: 'monthly',
  gstr1DueDay: 10,
  gstr3bDueDay: 20,
  reminderDays: [7, 3, 1, 0],
  isActive: true,
  stateCode: '33', // Default jurisdiction
};

export const INITIAL_COMPLIANCE_WORKFLOWS: ComplianceWorkflowItem[] = [
  {
    id: 'wf-gst-gstr1-current',
    title: 'GSTR-1 Monthly Return (Outward Supplies)',
    category: 'gst',
    entityName: 'Rivlet Apparel Private Limited',
    returnType: 'GSTR-1',
    taxPeriod: 'Current Month',
    dueDate: '2026-11-10',
    statutoryDeadline: '2026-11-11',
    status: 'in_progress',
    assignedTo: 'Chief Financial Officer',
    challanAmount: 0,
    itcClaimed: 0,
    notes: 'Verify e-Invoices and outward sales register before GSTN portal upload.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf-gst-gstr3b-current',
    title: 'GSTR-3B Monthly Summary & Net Tax Settlement',
    category: 'gst',
    entityName: 'Rivlet Apparel Private Limited',
    returnType: 'GSTR-3B',
    taxPeriod: 'Current Month',
    dueDate: '2026-11-20',
    statutoryDeadline: '2026-11-20',
    status: 'upcoming',
    assignedTo: 'Finance & Accounts Lead',
    challanAmount: 345200,
    itcClaimed: 520400,
    notes: 'Rule 88A tax offset sequence to be executed after GSTR-2B purchase reconciliation.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf-itr-adv-tax-q3',
    title: 'Advance Tax Installment Q3 (75% Cumulative)',
    category: 'itr',
    entityName: 'Rivlet Apparel Private Limited',
    returnType: 'Challan 280 (Advance Tax)',
    taxPeriod: 'FY 2026-27 (AY 2027-28)',
    dueDate: '2026-12-15',
    statutoryDeadline: '2026-12-15',
    status: 'upcoming',
    assignedTo: 'Statutory Auditor & Tax Lead',
    challanAmount: 750000,
    notes: 'Section 208/211 compliance. Net profit estimate review scheduled with external CA.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf-tds-26q-q2',
    title: 'Quarterly TDS Return - Non-Salary (Form 26Q)',
    category: 'tds',
    entityName: 'Rivlet Apparel Private Limited',
    returnType: 'Form 26Q',
    taxPeriod: 'Q2 (July - Sept)',
    dueDate: '2026-10-31',
    statutoryDeadline: '2026-10-31',
    status: 'in_progress',
    assignedTo: 'Compliance Officer',
    challanAmount: 185600,
    notes: 'Fabric mill job-work TDS (Section 194C) and professional charges (Section 194J) reconciliation.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf-icegate-boe-clearance',
    title: 'Customs Clearance: Egyptian Cotton Yarn Consignment',
    category: 'icegate',
    entityName: 'Rivlet Apparel Private Limited',
    returnType: 'Bill of Entry (Import BE)',
    taxPeriod: 'Consignment Oct-26',
    dueDate: '2026-11-05',
    statutoryDeadline: '2026-11-06',
    status: 'in_progress',
    assignedTo: 'Logistics & Customs Agent',
    challanAmount: 428000,
    itcClaimed: 245000,
    notes: 'BE No: 8492019 / Chennai Sea Port. e-Sanchit IRN generated. Awaiting duty payment receipt.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf-dsc-audit-renewal',
    title: 'Director Class 3 DSC Token Renewal',
    category: 'dsc',
    entityName: 'Managing Director Office',
    returnType: 'DSC Class 3 Combo (Signing & Enc)',
    taxPeriod: 'Biennial Renewal',
    dueDate: '2026-11-28',
    statutoryDeadline: '2026-12-05',
    status: 'upcoming',
    assignedTo: 'Secretarial & Legal Lead',
    notes: 'Hardware cryptographic token with eMudhra authority. Token serial: EM-9948271.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_CUSTOMS_DECLARATIONS: CustomsDeclaration[] = [
  {
    id: 'cust-boe-01',
    declarationType: 'import_boe',
    declarationNumber: 'BE-8492019',
    declarationDate: '2026-10-24',
    portCode: 'INMAA1',
    portName: 'Chennai Sea Port',
    hsnChapter: '52',
    goodsDescription: 'Premium Giza Long-Staple Combed Cotton Yarn (Counts 60s/80s)',
    invoiceValueInr: 2840000,
    customsDutyInr: 213000,
    igstPaidInr: 152650,
    drawbackClaimedInr: 0,
    rodtepClaimedInr: 0,
    chaName: 'Apex Trans-Maritime Customs Brokers',
    currentStage: 'duty_paid',
    esanchitIrnList: ['IRN-INMAA-2026-8841', 'IRN-INMAA-2026-8842'],
    shippingLineOrCarrier: 'Maersk Line India',
    containerOrAwbNumber: 'MSKU-9938471',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-sb-02',
    declarationType: 'export_sb',
    declarationNumber: 'SB-1948204',
    declarationDate: '2026-10-26',
    portCode: 'INBLR4',
    portName: 'Kempegowda Bangalore Air Cargo',
    hsnChapter: '62',
    goodsDescription: 'Tailored Ready-to-Wear Linen & Wool Overcoats (Autumn Collection)',
    invoiceValueInr: 4650000,
    customsDutyInr: 0,
    igstPaidInr: 0, // Zero-rated export under LUT
    drawbackClaimedInr: 186000, // All Industry Rate Drawback
    rodtepClaimedInr: 116250, // RoDTEP Scheme Credit
    chaName: 'FastForward Global Logistics',
    currentStage: 'rms_assessment',
    esanchitIrnList: ['IRN-INBLR-2026-1192'],
    shippingLineOrCarrier: 'Emirates SkyCargo',
    containerOrAwbNumber: 'AWB-176-8839201',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_DSC_REGISTRY: DscRegistryItem[] = [
  {
    id: 'dsc-01',
    tokenLabel: 'Director Primary Statutory DSC',
    holderName: 'K. R. Harichandru',
    designation: 'Managing Director',
    certAuthority: 'eMudhra Limited',
    serialNumber: '7B3A-4F91-C820-99E1',
    issuedDate: '2024-12-05',
    expiryDate: '2026-12-05',
    tokenLocation: 'Executive Fireproof Safe A-1 / USB Token Key 01',
    status: 'active',
    portalsBound: ['GSTN', 'ICEGATE', 'Income Tax E-Filing', 'MCA-21 V3'],
  },
  {
    id: 'dsc-02',
    tokenLabel: 'Finance Controller & Authorized Signatory DSC',
    holderName: 'V. S. Narayan',
    designation: 'Head of Finance & Operations',
    certAuthority: 'Vsign Technologies',
    serialNumber: '4C90-8812-E571-00B3',
    issuedDate: '2025-04-18',
    expiryDate: '2027-04-18',
    tokenLocation: 'Finance Vault Locker B-4',
    status: 'active',
    portalsBound: ['GSTN', 'TRACES TDS', 'DGFT Portal', 'Provident Fund Unified Portal'],
  },
];

export const INITIAL_CREDENTIAL_VAULT: CredentialVaultItem[] = [
  {
    id: 'vault-01',
    title: 'Goods & Services Tax Network (GSTN)',
    serviceType: 'gst',
    identifier: '33AABCR1234F1Z8',
    secret: 'Rivlet#Gstn@2026!Sec',
    portalUrl: 'https://services.gst.gov.in',
    notes: 'Principal place of business GSTIN. GSP API client access active.',
    lastVerifiedAt: '2026-10-25T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vault-02',
    title: 'ICEGATE Customs Electronic Gateway',
    serviceType: 'icegate',
    identifier: 'RIVLET_ICEGATE_ADM',
    secret: 'Icegate$Rivlet#Customs99',
    portalUrl: 'https://www.icegate.gov.in',
    notes: 'Mapped with Director Class 3 DSC. AD Code registered for Chennai & Bangalore ports.',
    lastVerifiedAt: '2026-10-22T14:30:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vault-03',
    title: 'DGFT (Directorate General of Foreign Trade)',
    serviceType: 'dgft',
    identifier: '0420088912', // IEC Code
    secret: 'Dgft!Export@LinenBrand2026',
    portalUrl: 'https://www.dgft.gov.in',
    notes: 'Import Export Code (IEC) holder login. RoDTEP / RoSCTL scrip issuance portal.',
    lastVerifiedAt: '2026-10-15T09:15:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vault-04',
    title: 'Income Tax E-Filing Portal',
    serviceType: 'incometax',
    identifier: 'AABCR1234F', // PAN
    secret: 'Rivlet#TaxAudit$2026',
    portalUrl: 'https://www.incometax.gov.in',
    notes: 'Corporate PAN login. Advance tax and ITR-6 assessment tracking.',
    lastVerifiedAt: '2026-10-20T11:45:00Z',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_RECON_INVOICES: GstReconciliationInvoice[] = [];

// --- Statutory Rule 88A Tax Calculation Engine ---

export function calculateStatutoryGst(
  taxPeriod: string,
  outputIgst: number,
  outputCgst: number,
  outputSgst: number,
  inputIgst: number,
  inputCgst: number,
  inputSgst: number,
  ineligibleItc: number = 0
): GstTaxCalculation {
  // Available eligible credit
  let remInputIgst = Math.max(0, inputIgst);
  let remInputCgst = Math.max(0, inputCgst);
  let remInputSgst = Math.max(0, inputSgst);

  let remOutputIgst = Math.max(0, outputIgst);
  let remOutputCgst = Math.max(0, outputCgst);
  let remOutputSgst = Math.max(0, outputSgst);

  // 1. Clear Output IGST using Input IGST first
  const igstSetAgainstIgst = Math.min(remOutputIgst, remInputIgst);
  remOutputIgst -= igstSetAgainstIgst;
  remInputIgst -= igstSetAgainstIgst;

  // 2. Clear remaining Output IGST with Input CGST, then Input SGST
  const cgstSetAgainstIgst = Math.min(remOutputIgst, remInputCgst);
  remOutputIgst -= cgstSetAgainstIgst;
  remInputCgst -= cgstSetAgainstIgst;

  const sgstSetAgainstIgst = Math.min(remOutputIgst, remInputSgst);
  remOutputIgst -= sgstSetAgainstIgst;
  remInputSgst -= sgstSetAgainstIgst;

  // 3. Clear Output CGST: First using remaining Input IGST, then Input CGST
  const igstSetAgainstCgst = Math.min(remOutputCgst, remInputIgst);
  remOutputCgst -= igstSetAgainstCgst;
  remInputIgst -= igstSetAgainstCgst;

  const cgstSetAgainstCgst = Math.min(remOutputCgst, remInputCgst);
  remOutputCgst -= cgstSetAgainstCgst;
  remInputCgst -= cgstSetAgainstCgst;

  // 4. Clear Output SGST: First using remaining Input IGST, then Input SGST
  const igstSetAgainstSgst = Math.min(remOutputSgst, remInputIgst);
  remOutputSgst -= igstSetAgainstSgst;
  remInputIgst -= igstSetAgainstSgst;

  const sgstSetAgainstSgst = Math.min(remOutputSgst, remInputSgst);
  remOutputSgst -= sgstSetAgainstSgst;
  remInputSgst -= sgstSetAgainstSgst;

  const netPayableIgst = remOutputIgst;
  const netPayableCgst = remOutputCgst;
  const netPayableSgst = remOutputSgst;
  const netTotalPayable = netPayableIgst + netPayableCgst + netPayableSgst;

  const totalInput = inputIgst + inputCgst + inputSgst;
  const eligibleItc = Math.max(0, totalInput - ineligibleItc);

  return {
    taxPeriod,
    outputIgst,
    outputCgst,
    outputSgst,
    inputIgst,
    inputCgst,
    inputSgst,
    eligibleItc,
    ineligibleItc,
    netPayableIgst,
    netPayableCgst,
    netPayableSgst,
    netTotalPayable,
    itcBalanceIgst: remInputIgst,
    itcBalanceCgst: remInputCgst,
    itcBalanceSgst: remInputSgst,
  };
}

// --- Persistence Helpers with Supabase + LocalStorage Fallback ---

export function getLocalComplianceWorkflows(): ComplianceWorkflowItem[] {
  if (typeof window === 'undefined') return INITIAL_COMPLIANCE_WORKFLOWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKFLOWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_WORKFLOWS, JSON.stringify(INITIAL_COMPLIANCE_WORKFLOWS));
      return INITIAL_COMPLIANCE_WORKFLOWS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading compliance workflows:', err);
    return INITIAL_COMPLIANCE_WORKFLOWS;
  }
}

export function saveLocalComplianceWorkflows(items: ComplianceWorkflowItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_WORKFLOWS, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving compliance workflows:', err);
  }
}

export async function loadMergedComplianceWorkflows(): Promise<ComplianceWorkflowItem[]> {
  const localList = getLocalComplianceWorkflows();
  if (!supabase) return localList;

  try {
    const { data, error } = await supabase
      .from('compliance_workflows')
      .select('*')
      .order('due_date', { ascending: true });

    if (error || !data || data.length === 0) return localList;

    const remoteItems: ComplianceWorkflowItem[] = data.map((d: any) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      entityName: d.entity_name,
      returnType: d.return_type,
      taxPeriod: d.tax_period,
      dueDate: d.due_date,
      statutoryDeadline: d.statutory_deadline,
      status: d.status,
      assignedTo: d.assigned_to,
      arnNumber: d.arn_number,
      challanAmount: Number(d.challan_amount || 0),
      itcClaimed: Number(d.itc_claimed || 0),
      attachmentUrl: d.attachment_url,
      notes: d.notes,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    return remoteItems;
  } catch (err) {
    console.warn('Notice loading compliance workflows from Supabase:', err);
    return localList;
  }
}

export function getLocalGstSettings(): GstSettings {
  if (typeof window === 'undefined') return INITIAL_GST_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GST_SETTINGS);
    if (!raw) {
      return INITIAL_GST_SETTINGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_GST_SETTINGS;
  }
}

export function saveLocalGstSettings(settings: GstSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_GST_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving GST settings locally:', err);
  }
}

export async function loadMergedGstSettings(): Promise<GstSettings> {
  const local = getLocalGstSettings();
  if (!supabase) return local;

  try {
    const { data, error } = await supabase
      .from('gst_settings')
      .select('*')
      .limit(1);

    if (error || !data || data.length === 0) return local;

    const row = data[0];
    const panFromGstin = row.gstin && row.gstin.length >= 12 ? row.gstin.slice(2, 12).toUpperCase() : '';
    const merged: GstSettings = {
      id: row.id,
      gstin: row.gstin || local.gstin || '',
      legalName: row.legal_name || local.legalName || 'My Enterprise',
      tradeName: row.trade_name || local.tradeName || '',
      pan: (row as any).pan || local.pan || panFromGstin || '',
      iec: (row as any).iec || local.iec || '',
      filingFrequency: row.filing_frequency || local.filingFrequency || 'monthly',
      gstr1DueDay: row.gstr1_due_day || 10,
      gstr3bDueDay: row.gstr3b_due_day || 20,
      reminderDays: row.reminder_days || [7, 3, 1, 0],
      isActive: row.is_active ?? true,
      stateCode: row.state_code || '33',
    };

    saveLocalGstSettings(merged);
    return merged;
  } catch (err) {
    console.warn('Notice loading gst_settings from Supabase:', err);
    return local;
  }
}

export async function saveMergedGstSettings(settings: GstSettings): Promise<void> {
  saveLocalGstSettings(settings);
  if (!supabase) return;

  try {
    const pan = settings.pan || (settings.gstin && settings.gstin.length >= 12 ? settings.gstin.slice(2, 12).toUpperCase() : '');
    const payload: any = {
      id: settings.id && settings.id.length === 36 ? settings.id : undefined,
      gstin: settings.gstin.trim().toUpperCase(),
      legal_name: settings.legalName.trim(),
      trade_name: settings.tradeName?.trim() || null,
      filing_frequency: settings.filingFrequency,
      gstr1_due_day: settings.gstr1DueDay,
      gstr3b_due_day: settings.gstr3bDueDay,
      reminder_days: settings.reminderDays,
      is_active: settings.isActive,
      state_code: settings.stateCode || '33',
      updated_at: new Date().toISOString(),
    };

    if (payload.id) {
      await supabase.from('gst_settings').upsert(payload);
    } else {
      // Check existing row
      const { data } = await supabase.from('gst_settings').select('id').limit(1);
      if (data && data.length > 0) {
        payload.id = data[0].id;
        await supabase.from('gst_settings').update(payload).eq('id', payload.id);
      } else {
        await supabase.from('gst_settings').insert(payload);
      }
    }

    // Also sync PAN to credential vault for direct tax access
    if (pan) {
      try {
        const { data: vaultRows } = await supabase
          .from('credential_vault')
          .select('id')
          .eq('service_type', 'incometax')
          .limit(1);

        if (vaultRows && vaultRows.length > 0) {
          await supabase.from('credential_vault').update({
            identifier: pan,
            updated_at: new Date().toISOString(),
          }).eq('id', vaultRows[0].id);
        }
      } catch (_) {}
    }
  } catch (err) {
    console.error('Notice persisting gst_settings to Supabase:', err);
  }
}

export function getLocalCustomsDeclarations(): CustomsDeclaration[] {
  if (typeof window === 'undefined') return INITIAL_CUSTOMS_DECLARATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CUSTOMS, JSON.stringify(INITIAL_CUSTOMS_DECLARATIONS));
      return INITIAL_CUSTOMS_DECLARATIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_CUSTOMS_DECLARATIONS;
  }
}

export function saveLocalCustomsDeclarations(items: CustomsDeclaration[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMS, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving customs declarations:', err);
  }
}

export function getLocalDscRegistry(): DscRegistryItem[] {
  if (typeof window === 'undefined') return INITIAL_DSC_REGISTRY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DSC);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DSC, JSON.stringify(INITIAL_DSC_REGISTRY));
      return INITIAL_DSC_REGISTRY;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_DSC_REGISTRY;
  }
}

export function saveLocalDscRegistry(items: DscRegistryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DSC, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving DSC registry:', err);
  }
}

export function getLocalCredentialVault(): CredentialVaultItem[] {
  if (typeof window === 'undefined') return INITIAL_CREDENTIAL_VAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VAULT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(INITIAL_CREDENTIAL_VAULT));
      return INITIAL_CREDENTIAL_VAULT;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_CREDENTIAL_VAULT;
  }
}

export function saveLocalCredentialVault(items: CredentialVaultItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving credential vault:', err);
  }
}

export function getLocalReconInvoices(): GstReconciliationInvoice[] {
  if (typeof window === 'undefined') return INITIAL_RECON_INVOICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECON_INVOICES);
    if (!raw) {
      return INITIAL_RECON_INVOICES;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_RECON_INVOICES;
  }
}

export function saveLocalReconInvoices(invoices: GstReconciliationInvoice[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_RECON_INVOICES, JSON.stringify(invoices));
  } catch (err) {
    console.error('Error saving recon invoices locally:', err);
  }
}

export async function loadMergedReconInvoices(): Promise<GstReconciliationInvoice[]> {
  const localList = getLocalReconInvoices();
  if (!supabase) return localList;

  try {
    // 1. Try dedicated table first
    const { data: dedicatedData, error: dedicatedErr } = await supabase
      .from('gst_reconciliation_invoices')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (!dedicatedErr && dedicatedData && dedicatedData.length > 0) {
      const items: GstReconciliationInvoice[] = dedicatedData.map((d: any) => ({
        id: d.id,
        vendorName: d.vendor_name,
        vendorGstin: d.vendor_gstin,
        invoiceNumber: d.invoice_number,
        invoiceDate: d.invoice_date,
        invoiceValue: Number(d.invoice_value || 0),
        taxableValue: Number(d.taxable_value || 0),
        taxAmount: Number(d.tax_amount || 0),
        igstAmount: Number(d.igst_amount || 0),
        cgstAmount: Number(d.cgst_amount || 0),
        sgstAmount: Number(d.sgst_amount || 0),
        inBooks: d.in_books ?? true,
        inGstr2b: d.in_gstr2b ?? true,
        matchStatus: d.match_status || 'matched',
        itcEligibility: d.itc_eligibility || 'eligible',
        invoiceType: d.invoice_type || 'purchase_inward',
        source: d.source || 'manual',
        notes: d.notes,
      }));
      saveLocalReconInvoices(items);
      return items;
    }

    // 2. Fallback to compliance_workflows where return_type = 'GST-RECON-INVOICE'
    const { data: wfData, error: wfErr } = await supabase
      .from('compliance_workflows')
      .select('*')
      .eq('return_type', 'GST-RECON-INVOICE');

    if (!wfErr && wfData && wfData.length > 0) {
      const parsedItems: GstReconciliationInvoice[] = wfData.map((d: any) => {
        try {
          if (d.notes && d.notes.startsWith('{')) {
            const parsed = JSON.parse(d.notes);
            return {
              ...parsed,
              id: d.id,
            };
          }
        } catch (_) {}

        return {
          id: d.id,
          vendorName: d.title,
          vendorGstin: d.entity_name,
          invoiceNumber: d.arn_number || 'INV',
          invoiceDate: d.due_date,
          taxableValue: Number(d.challan_amount || 0),
          taxAmount: Number(d.itc_claimed || 0),
          invoiceValue: Number(d.challan_amount || 0) + Number(d.itc_claimed || 0),
          inBooks: true,
          inGstr2b: true,
          matchStatus: d.status === 'filed' ? 'matched' : 'missing_in_2b',
          itcEligibility: 'eligible',
          invoiceType: 'purchase_inward',
          notes: d.notes,
        };
      });

      saveLocalReconInvoices(parsedItems);
      return parsedItems;
    }

    return localList;
  } catch (err) {
    console.warn('Notice loading recon invoices from Supabase:', err);
    return localList;
  }
}

export async function saveMergedReconInvoices(invoices: GstReconciliationInvoice[]): Promise<void> {
  saveLocalReconInvoices(invoices);
  if (!supabase) return;

  try {
    // 1. Try dedicated table first
    const dedicatedPayload = invoices.map((inv) => ({
      id: inv.id,
      vendor_name: inv.vendorName,
      vendor_gstin: inv.vendorGstin,
      invoice_number: inv.invoiceNumber,
      invoice_date: inv.invoiceDate,
      taxable_value: inv.taxableValue,
      tax_amount: inv.taxAmount,
      invoice_value: inv.invoiceValue,
      igst_amount: inv.igstAmount || 0,
      cgst_amount: inv.cgstAmount || 0,
      sgst_amount: inv.sgstAmount || 0,
      in_books: inv.inBooks,
      in_gstr2b: inv.inGstr2b,
      match_status: inv.matchStatus,
      itc_eligibility: inv.itcEligibility,
      invoice_type: inv.invoiceType || 'purchase_inward',
      source: inv.source || 'manual',
      notes: inv.notes,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('gst_reconciliation_invoices').upsert(dedicatedPayload);
    if (!error) return;

    // 2. Seamless fallback: sync with compliance_workflows
    for (const inv of invoices) {
      const payload: any = {
        title: inv.vendorName,
        category: 'gst',
        entity_name: inv.vendorGstin,
        return_type: 'GST-RECON-INVOICE',
        tax_period: inv.invoiceDate,
        due_date: inv.invoiceDate,
        statutory_deadline: inv.invoiceDate,
        arn_number: inv.invoiceNumber,
        challan_amount: inv.taxableValue,
        itc_claimed: inv.taxAmount,
        status: inv.matchStatus === 'matched' ? 'filed' : 'in_progress',
        notes: JSON.stringify(inv),
        updated_at: new Date().toISOString(),
      };

      if (inv.id && inv.id.length === 36 && inv.id.includes('-')) {
        payload.id = inv.id;
        await supabase.from('compliance_workflows').upsert(payload);
      } else {
        await supabase.from('compliance_workflows').insert(payload);
      }
    }
  } catch (err) {
    console.error('Notice persisting recon invoices to Supabase:', err);
  }
}

export async function deleteMergedReconInvoice(id: string): Promise<void> {
  const localList = getLocalReconInvoices().filter((i) => i.id !== id);
  saveLocalReconInvoices(localList);

  if (!supabase) return;
  try {
    await supabase.from('gst_reconciliation_invoices').delete().eq('id', id);
    if (id.length === 36 && id.includes('-')) {
      await supabase.from('compliance_workflows').delete().eq('id', id);
    }
  } catch (err) {
    console.error('Notice deleting recon invoice from Supabase:', err);
  }
}

export const INITIAL_ADVANCE_TAX_RECORDS: AdvanceTaxRecord[] = [
  {
    id: 'adv-tax-q1',
    quarter: 'Installment 1 (15%)',
    dueDate: '15 June',
    statutoryDate: '2026-06-15',
    estimatedAmount: 375000,
    status: 'filed',
    challanNo: 'BSR-0021940-280',
    notes: 'Q1 Advance Tax payment settled on time via Challan 280.',
  },
  {
    id: 'adv-tax-q2',
    quarter: 'Installment 2 (45% Cumulative)',
    dueDate: '15 September',
    statutoryDate: '2026-09-15',
    estimatedAmount: 750000,
    status: 'filed',
    challanNo: 'BSR-0099412-280',
    notes: 'Q2 45% cumulative threshold settled.',
  },
  {
    id: 'adv-tax-q3',
    quarter: 'Installment 3 (75% Cumulative)',
    dueDate: '15 December',
    statutoryDate: '2026-12-15',
    estimatedAmount: 750000,
    status: 'upcoming',
    challanNo: 'Pending Challan 280',
    notes: 'Due by 15 December. Section 208/211 corporate assessment.',
  },
  {
    id: 'adv-tax-q4',
    quarter: 'Installment 4 (100% Final)',
    dueDate: '15 March',
    statutoryDate: '2027-03-15',
    estimatedAmount: 625000,
    status: 'upcoming',
    challanNo: 'Pending Challan 280',
    notes: 'Final fiscal year corporate tax balance settlement.',
  },
];

export function getLocalAdvanceTaxRecords(): AdvanceTaxRecord[] {
  if (typeof window === 'undefined') return INITIAL_ADVANCE_TAX_RECORDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADVANCE_TAX);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ADVANCE_TAX, JSON.stringify(INITIAL_ADVANCE_TAX_RECORDS));
      return INITIAL_ADVANCE_TAX_RECORDS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_ADVANCE_TAX_RECORDS;
  }
}

export function saveLocalAdvanceTaxRecords(records: AdvanceTaxRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ADVANCE_TAX, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving advance tax records:', err);
  }
}

export const INITIAL_TDS_RECORDS: TdsReturnRecord[] = [
  {
    id: 'tds-24q-q2',
    form: 'Form 24Q (Salary TDS)',
    period: 'Q2 (Jul - Sep)',
    dueDate: '2026-10-31',
    status: 'in_progress',
    lead: 'Finance Lead',
    deductionAmount: 142000,
    tokenNumber: 'ACK-24Q-OCT26-01',
    notes: 'Payroll TDS deduction under section 192.',
  },
  {
    id: 'tds-26q-q2',
    form: 'Form 26Q (Vendor / Job-work TDS)',
    period: 'Q2 (Jul - Sep)',
    dueDate: '2026-10-31',
    status: 'in_progress',
    lead: 'Tax Consultant',
    deductionAmount: 185600,
    tokenNumber: 'ACK-26Q-OCT26-89',
    notes: 'Fabric mill job-work (194C) and contractual fees.',
  },
  {
    id: 'tds-26q-q3',
    form: 'Form 26Q (Vendor / Job-work TDS)',
    period: 'Q3 (Oct - Dec)',
    dueDate: '2027-01-31',
    status: 'upcoming',
    lead: 'Tax Consultant',
    deductionAmount: 210000,
    notes: 'Winter manufacturing & processing TDS returns.',
  },
];

export function getLocalTdsRecords(): TdsReturnRecord[] {
  if (typeof window === 'undefined') return INITIAL_TDS_RECORDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TDS_RECORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TDS_RECORDS, JSON.stringify(INITIAL_TDS_RECORDS));
      return INITIAL_TDS_RECORDS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_TDS_RECORDS;
  }
}

export function saveLocalTdsRecords(records: TdsReturnRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TDS_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving TDS records:', err);
  }
}

export interface GstTaxInputs {
  taxPeriod: string;
  grossOutwardTurnover: number;
  outputIgst: number;
  outputCgst: number;
  outputSgst: number;
  inputIgst: number;
  inputCgst: number;
  inputSgst: number;
  ineligibleItc: number;
}

export const DEFAULT_GST_TAX_INPUTS: GstTaxInputs = {
  taxPeriod: 'Current Month',
  grossOutwardTurnover: 0,
  outputIgst: 0,
  outputCgst: 0,
  outputSgst: 0,
  inputIgst: 0,
  inputCgst: 0,
  inputSgst: 0,
  ineligibleItc: 0,
};

export function getLocalGstTaxInputs(): GstTaxInputs {
  if (typeof window === 'undefined') return DEFAULT_GST_TAX_INPUTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GST_TAX_INPUTS);
    if (!raw) {
      return DEFAULT_GST_TAX_INPUTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_GST_TAX_INPUTS;
  }
}

export function saveLocalGstTaxInputs(inputs: GstTaxInputs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_GST_TAX_INPUTS, JSON.stringify(inputs));
  } catch (err) {
    console.error('Error saving GST tax inputs locally:', err);
  }
}

export async function loadMergedGstTaxInputs(): Promise<GstTaxInputs> {
  const local = getLocalGstTaxInputs();
  if (!supabase) return local;

  try {
    // 1. Try dedicated table first
    const { data: dedicatedData, error: dedicatedErr } = await supabase
      .from('gst_tax_inputs')
      .select('*')
      .eq('id', 'default')
      .limit(1);

    if (!dedicatedErr && dedicatedData && dedicatedData.length > 0) {
      const row = dedicatedData[0];
      const merged: GstTaxInputs = {
        taxPeriod: row.tax_period || local.taxPeriod || 'Current Month',
        grossOutwardTurnover: Number(row.gross_outward_turnover || 0),
        outputIgst: Number(row.output_igst || 0),
        outputCgst: Number(row.output_cgst || 0),
        outputSgst: Number(row.output_sgst || 0),
        inputIgst: Number(row.input_igst || 0),
        inputCgst: Number(row.input_cgst || 0),
        inputSgst: Number(row.input_sgst || 0),
        ineligibleItc: Number(row.ineligible_itc || 0),
      };
      saveLocalGstTaxInputs(merged);
      return merged;
    }

    // 2. Fallback to compliance_workflows where return_type = 'GST-TAX-INPUTS'
    const { data: wfData, error: wfErr } = await supabase
      .from('compliance_workflows')
      .select('*')
      .eq('return_type', 'GST-TAX-INPUTS')
      .limit(1);

    if (!wfErr && wfData && wfData.length > 0) {
      const row = wfData[0];
      if (row.notes && row.notes.startsWith('{')) {
        const parsed = JSON.parse(row.notes);
        saveLocalGstTaxInputs(parsed);
        return parsed;
      }
    }

    return local;
  } catch (err) {
    console.warn('Notice loading GST tax inputs from Supabase:', err);
    return local;
  }
}

export async function saveMergedGstTaxInputs(inputs: GstTaxInputs): Promise<void> {
  saveLocalGstTaxInputs(inputs);
  if (!supabase) return;

  try {
    // 1. Try dedicated table first
    const payload = {
      id: 'default',
      tax_period: inputs.taxPeriod,
      gross_outward_turnover: inputs.grossOutwardTurnover,
      output_igst: inputs.outputIgst,
      output_cgst: inputs.outputCgst,
      output_sgst: inputs.outputSgst,
      input_igst: inputs.inputIgst,
      input_cgst: inputs.inputCgst,
      input_sgst: inputs.inputSgst,
      ineligible_itc: inputs.ineligibleItc,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('gst_tax_inputs').upsert(payload);
    if (!error) return;

    // 2. Seamless fallback: sync with compliance_workflows
    const wfPayload: any = {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Statutory GST Tax Inputs & Turnover State',
      category: 'gst',
      entity_name: 'GST Engine & ITC',
      return_type: 'GST-TAX-INPUTS',
      tax_period: inputs.taxPeriod,
      due_date: '2099-12-31',
      statutory_deadline: '2099-12-31',
      status: 'filed',
      challan_amount: inputs.grossOutwardTurnover,
      itc_claimed: inputs.inputIgst + inputs.inputCgst + inputs.inputSgst,
      notes: JSON.stringify(inputs),
      updated_at: new Date().toISOString(),
    };

    await supabase.from('compliance_workflows').upsert(wfPayload);
  } catch (err) {
    console.error('Notice persisting GST tax inputs to Supabase:', err);
  }
}

export async function saveMergedComplianceWorkflows(items: ComplianceWorkflowItem[]): Promise<void> {
  saveLocalComplianceWorkflows(items);
  if (!supabase) return;

  try {
    const records = items.map((w) => ({
      id: w.id && w.id.length === 36 && w.id.includes('-') ? w.id : undefined,
      title: w.title,
      category: w.category,
      entity_name: w.entityName,
      return_type: w.returnType,
      tax_period: w.taxPeriod,
      due_date: w.dueDate,
      statutory_deadline: w.statutoryDeadline,
      status: w.status,
      assigned_to: w.assignedTo || null,
      arn_number: w.arnNumber || null,
      challan_amount: w.challanAmount || 0,
      itc_claimed: w.itcClaimed || 0,
      attachment_url: w.attachmentUrl || null,
      notes: w.notes || null,
      updated_at: new Date().toISOString(),
    }));

    for (const r of records) {
      if (r.id) {
        await supabase.from('compliance_workflows').upsert(r);
      } else {
        await supabase.from('compliance_workflows').insert(r);
      }
    }
  } catch (err) {
    console.error('Notice persisting compliance workflows to Supabase:', err);
  }
}
