-- ==============================================================================
-- RIVLET ENTERPRISE MIGRATION V16: GST INVOICES, ITC RECONCILIATION & STATUTORY TAX
-- Production database tables for GST Invoices, ITC Reconciliation & Live Tax Calculations
-- ==============================================================================

-- 1. GST Reconciliation Invoices (Inward Purchase ITC & Outward Sales)
CREATE TABLE IF NOT EXISTS public.gst_reconciliation_invoices (
    id TEXT PRIMARY KEY DEFAULT ('inv-recon-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    vendor_name TEXT NOT NULL,
    vendor_gstin TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    taxable_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    invoice_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    igst_amount NUMERIC(14, 2) DEFAULT 0,
    cgst_amount NUMERIC(14, 2) DEFAULT 0,
    sgst_amount NUMERIC(14, 2) DEFAULT 0,
    in_books BOOLEAN DEFAULT true,
    in_gstr2b BOOLEAN DEFAULT true,
    match_status TEXT NOT NULL DEFAULT 'matched' CHECK (match_status IN ('matched', 'missing_in_2b', 'tax_mismatch', 'manual_override')),
    itc_eligibility TEXT NOT NULL DEFAULT 'eligible' CHECK (itc_eligibility IN ('eligible', 'ineligible_17_5', 'pending', 'claimed')),
    invoice_type TEXT DEFAULT 'purchase_inward' CHECK (invoice_type IN ('purchase_inward', 'sales_outward')),
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_upload', 'gstr2b_portal', 'gstr1_portal', 'gstr3b_portal')),
    attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GST Statutory Tax Inputs & Turnover Snapshots
CREATE TABLE IF NOT EXISTS public.gst_tax_inputs (
    id TEXT PRIMARY KEY DEFAULT 'default',
    tax_period TEXT NOT NULL DEFAULT 'Current Period',
    gross_outward_turnover NUMERIC(14, 2) NOT NULL DEFAULT 0,
    output_igst NUMERIC(14, 2) NOT NULL DEFAULT 0,
    output_cgst NUMERIC(14, 2) NOT NULL DEFAULT 0,
    output_sgst NUMERIC(14, 2) NOT NULL DEFAULT 0,
    input_igst NUMERIC(14, 2) NOT NULL DEFAULT 0,
    input_cgst NUMERIC(14, 2) NOT NULL DEFAULT 0,
    input_sgst NUMERIC(14, 2) NOT NULL DEFAULT 0,
    ineligible_itc NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance GST Settings with PAN & IEC if not present
DO $$
BEGIN
    IF to_regclass('public.gst_settings') IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gst_settings' AND column_name = 'pan') THEN
            ALTER TABLE public.gst_settings ADD COLUMN pan TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gst_settings' AND column_name = 'iec') THEN
            ALTER TABLE public.gst_settings ADD COLUMN iec TEXT;
        END IF;
    END IF;
END $$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.gst_reconciliation_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_tax_inputs ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Authenticated & Anon Access
CREATE POLICY "Allow all authenticated on gst_reconciliation_invoices" ON public.gst_reconciliation_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon on gst_reconciliation_invoices" ON public.gst_reconciliation_invoices FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated on gst_tax_inputs" ON public.gst_tax_inputs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon on gst_tax_inputs" ON public.gst_tax_inputs FOR ALL TO anon USING (true) WITH CHECK (true);
