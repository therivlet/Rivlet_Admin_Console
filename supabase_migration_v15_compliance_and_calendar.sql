-- ==============================================================================
-- RIVLET ENTERPRISE MIGRATION V15: STATUTORY COMPLIANCE & UNIFIED CALENDAR
-- Production database tables for GST, ICEGATE Customs, DSC, ITR, Credential Vault, and Calendar Events
-- ==============================================================================

-- 1. Statutory Compliance Workflows
CREATE TABLE IF NOT EXISTS public.compliance_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('gst', 'icegate', 'itr', 'dsc', 'tds', 'other')),
    entity_name TEXT NOT NULL,
    return_type TEXT NOT NULL,
    tax_period TEXT NOT NULL,
    due_date DATE NOT NULL,
    statutory_deadline DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'filed', 'pending_review', 'overdue')),
    assigned_to TEXT,
    arn_number TEXT,
    challan_amount NUMERIC(14, 2) DEFAULT 0,
    itc_claimed NUMERIC(14, 2) DEFAULT 0,
    attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GST Configuration & Settings
CREATE TABLE IF NOT EXISTS public.gst_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gstin TEXT UNIQUE NOT NULL,
    legal_name TEXT NOT NULL,
    trade_name TEXT,
    filing_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (filing_frequency IN ('monthly', 'quarterly')),
    gstr1_due_day INT DEFAULT 10,
    gstr3b_due_day INT DEFAULT 20,
    reminder_days INT[] DEFAULT '{7, 3, 1, 0}',
    is_active BOOLEAN DEFAULT true,
    state_code TEXT DEFAULT '33',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ICEGATE Customs Declarations (Apparel Imports & Exports)
CREATE TABLE IF NOT EXISTS public.customs_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaration_type TEXT NOT NULL CHECK (declaration_type IN ('import_boe', 'export_sb')),
    declaration_number TEXT NOT NULL,
    declaration_date DATE NOT NULL,
    port_code TEXT NOT NULL,
    port_name TEXT NOT NULL,
    hsn_chapter TEXT NOT NULL,
    goods_description TEXT NOT NULL,
    invoice_value_inr NUMERIC(14, 2) NOT NULL DEFAULT 0,
    customs_duty_inr NUMERIC(14, 2) DEFAULT 0,
    igst_paid_inr NUMERIC(14, 2) DEFAULT 0,
    drawback_claimed_inr NUMERIC(14, 2) DEFAULT 0,
    rodtep_claimed_inr NUMERIC(14, 2) DEFAULT 0,
    cha_name TEXT,
    current_stage TEXT NOT NULL DEFAULT 'draft' CHECK (current_stage IN ('draft', 'filed', 'rms_assessment', 'duty_paid', 'under_examination', 'cleared_ooc_leo', 'rejected')),
    esanchit_irn_list TEXT[] DEFAULT '{}',
    shipping_line_or_carrier TEXT,
    container_or_awb_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Digital Signature Certificate (DSC) Registry
CREATE TABLE IF NOT EXISTS public.dsc_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_label TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    cert_authority TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    token_location TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'revoked')),
    portals_bound TEXT[] DEFAULT '{"GSTN", "ICEGATE", "Income Tax", "MCA"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Secure Credential & Password Vault
CREATE TABLE IF NOT EXISTS public.credential_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('gst', 'icegate', 'dgft', 'incometax', 'traces', 'bank_ad', 'other')),
    identifier TEXT NOT NULL,
    secret TEXT NOT NULL,
    portal_url TEXT,
    notes TEXT,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Operations & Compliance Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT true,
    event_category TEXT NOT NULL CHECK (event_category IN ('gst', 'customs', 'itr', 'dsc', 'sprint', 'vendor', 'general')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    related_entity_id UUID,
    related_link TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.compliance_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customs_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsc_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Production Policies for Authenticated Operations
CREATE POLICY "Allow authenticated read on compliance_workflows" ON public.compliance_workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on compliance_workflows" ON public.compliance_workflows FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on compliance_workflows" ON public.compliance_workflows FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on compliance_workflows" ON public.compliance_workflows FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on gst_settings" ON public.gst_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write on gst_settings" ON public.gst_settings FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on customs_declarations" ON public.customs_declarations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write on customs_declarations" ON public.customs_declarations FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on dsc_registry" ON public.dsc_registry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write on dsc_registry" ON public.dsc_registry FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on credential_vault" ON public.credential_vault FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write on credential_vault" ON public.credential_vault FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on calendar_events" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write on calendar_events" ON public.calendar_events FOR ALL TO authenticated USING (true);

-- Anonymous Fallback for local operations
CREATE POLICY "Anon read compliance_workflows" ON public.compliance_workflows FOR SELECT TO anon USING (true);
CREATE POLICY "Anon write compliance_workflows" ON public.compliance_workflows FOR ALL TO anon USING (true);

CREATE POLICY "Anon read gst_settings" ON public.gst_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Anon write gst_settings" ON public.gst_settings FOR ALL TO anon USING (true);

CREATE POLICY "Anon read customs_declarations" ON public.customs_declarations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon write customs_declarations" ON public.customs_declarations FOR ALL TO anon USING (true);

CREATE POLICY "Anon read dsc_registry" ON public.dsc_registry FOR SELECT TO anon USING (true);
CREATE POLICY "Anon write dsc_registry" ON public.dsc_registry FOR ALL TO anon USING (true);

CREATE POLICY "Anon read credential_vault" ON public.credential_vault FOR SELECT TO anon USING (true);
CREATE POLICY "Anon write credential_vault" ON public.credential_vault FOR ALL TO anon USING (true);

CREATE POLICY "Anon read calendar_events" ON public.calendar_events FOR SELECT TO anon USING (true);
CREATE POLICY "Anon write calendar_events" ON public.calendar_events FOR ALL TO anon USING (true);
