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
  id: 'gst-settings-rivlet-primary',
  gstin: '33AABCR1234F1Z8',
  legalName: 'Rivlet Apparel Private Limited',
  tradeName: 'Rivlet Studios',
  filingFrequency: 'monthly',
  gstr1DueDay: 10,
  gstr3bDueDay: 20,
  reminderDays: [7, 3, 1, 0],
  isActive: true,
  stateCode: '33', // Tamil Nadu
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

export const INITIAL_RECON_INVOICES: GstReconciliationInvoice[] = [
  {
    id: 'inv-recon-01',
    vendorName: 'Coimbatore Heritage Spinners Ltd',
    vendorGstin: '33AAACH1094J1Z2',
    invoiceNumber: 'CHS-26-8819',
    invoiceDate: '2026-10-04',
    invoiceValue: 472000,
    taxableValue: 400000,
    taxAmount: 72000,
    inBooks: true,
    inGstr2b: true,
    matchStatus: 'matched',
    itcEligibility: 'eligible',
  },
  {
    id: 'inv-recon-02',
    vendorName: 'Surat Luxe Trims & Zippers Pvt Ltd',
    vendorGstin: '24AABCS8891F1Z4',
    invoiceNumber: 'SLT/OCT/104',
    invoiceDate: '2026-10-08',
    invoiceValue: 212400,
    taxableValue: 180000,
    taxAmount: 32400,
    inBooks: true,
    inGstr2b: false,
    matchStatus: 'missing_in_2b',
    itcEligibility: 'pending',
  },
  {
    id: 'inv-recon-03',
    vendorName: 'Tirupur Precision Dyeing & Processing',
    vendorGstin: '33AABCT9981K1Z9',
    invoiceNumber: 'TPD-2026-90',
    invoiceDate: '2026-10-12',
    invoiceValue: 354000,
    taxableValue: 300000,
    taxAmount: 54000,
    inBooks: true,
    inGstr2b: true,
    matchStatus: 'matched',
    itcEligibility: 'eligible',
  },
  {
    id: 'inv-recon-04',
    vendorName: 'Bangalore Executive Fleet & Transport',
    vendorGstin: '29AABCE1123D1ZX',
    invoiceNumber: 'BEF-9941',
    invoiceDate: '2026-10-15',
    invoiceValue: 59000,
    taxableValue: 50000,
    taxAmount: 9000,
    inBooks: true,
    inGstr2b: true,
    matchStatus: 'matched',
    itcEligibility: 'ineligible_17_5',
  },
];

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
      localStorage.setItem(STORAGE_KEY_GST_SETTINGS, JSON.stringify(INITIAL_GST_SETTINGS));
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
    console.error('Error saving GST settings:', err);
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
      localStorage.setItem(STORAGE_KEY_RECON_INVOICES, JSON.stringify(INITIAL_RECON_INVOICES));
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
    console.error('Error saving recon invoices:', err);
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
  outputIgst: number;
  outputCgst: number;
  outputSgst: number;
  inputIgst: number;
  inputCgst: number;
  inputSgst: number;
  ineligibleItc: number;
}

export const DEFAULT_GST_TAX_INPUTS: GstTaxInputs = {
  taxPeriod: 'October 2026',
  outputIgst: 420000,
  outputCgst: 180000,
  outputSgst: 180000,
  inputIgst: 380000,
  inputCgst: 140000,
  inputSgst: 140000,
  ineligibleItc: 9000,
};

export function getLocalGstTaxInputs(): GstTaxInputs {
  if (typeof window === 'undefined') return DEFAULT_GST_TAX_INPUTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GST_TAX_INPUTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GST_TAX_INPUTS, JSON.stringify(DEFAULT_GST_TAX_INPUTS));
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
    console.error('Error saving GST tax inputs:', err);
  }
}
