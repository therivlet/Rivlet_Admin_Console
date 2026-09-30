-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V7 — INTERLINK DOCUMENTS
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
--
-- Adds real foreign-key links from documents to vendors and pipeline
-- items (e.g. a tech pack document -> its manufacturer and its style),
-- instead of the free-text "associated vendor" field only.
-- ================================================================

do $$
begin
  begin
    alter table public.documents add column if not exists vendor_id text references public.vendors(id) on delete set null;
  exception when others then null;
  end;
  begin
    alter table public.documents add column if not exists pipeline_item_id text references public.pipeline_items(id) on delete set null;
  exception when others then null;
  end;
end $$;

create index if not exists documents_vendor_idx on public.documents(vendor_id);
create index if not exists documents_pipeline_item_idx on public.documents(pipeline_item_id);
