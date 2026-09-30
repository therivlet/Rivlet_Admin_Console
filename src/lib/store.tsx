'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ArtifactItem, CostingSheet, DocumentItem, KBArticle, ArtifactStatus, VendorItem, PipelineItem, BudgetItem, Sprint, WorkItem } from './types';
import { initialArtifacts, initialCostingSheets, initialDocuments, initialKBArticles, initialVendors, initialPipelineItems, initialBudgetItems, initialSprints, initialWorkItems } from './initialData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  ARTIFACTS: 'rivlet_admin_artifacts',
  COSTING_SHEETS: 'rivlet_admin_costing_sheets',
  DOCUMENTS: 'rivlet_admin_documents',
  KB_ARTICLES: 'rivlet_admin_kb_articles',
  VENDORS: 'rivlet_admin_vendors',
  PIPELINE_ITEMS: 'rivlet_admin_pipeline_items',
  BUDGET_ITEMS: 'rivlet_admin_budget_items',
  SPRINTS: 'rivlet_admin_sprints',
  WORK_ITEMS: 'rivlet_admin_work_items',
};

interface AdminStoreContextType {
  isLoaded: boolean;
  isSyncing: boolean;
  lastWriteError: string | null;
  clearWriteError: () => void;
  artifacts: ArtifactItem[];
  costingSheets: CostingSheet[];
  documents: DocumentItem[];
  kbArticles: KBArticle[];
  vendors: VendorItem[];
  pipelineItems: PipelineItem[];
  budgetItems: BudgetItem[];
  sprints: Sprint[];
  workItems: WorkItem[];
  syncWithSupabase: () => Promise<void>;
  addArtifact: (item: Omit<ArtifactItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ArtifactItem>;
  updateArtifact: (id: string, updates: Partial<ArtifactItem>) => Promise<void>;
  togglePromoteArtifact: (id: string) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  saveCostingSheet: (sheet: CostingSheet) => Promise<void>;
  deleteCostingSheet: (id: string) => Promise<void>;
  addDocument: (doc: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DocumentItem>;
  updateDocument: (id: string, updates: Partial<DocumentItem>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  saveArticle: (article: KBArticle) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  saveVendor: (vendor: VendorItem) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  savePipelineItem: (item: PipelineItem) => Promise<void>;
  deletePipelineItem: (id: string) => Promise<void>;
  saveBudgetItem: (item: BudgetItem) => Promise<void>;
  deleteBudgetItem: (id: string) => Promise<void>;
  saveSprint: (sprint: Sprint) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  saveWorkItem: (item: WorkItem) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;
  addWorkItemComment: (id: string, text: string, author: string) => Promise<void>;
  resetToSeed: () => Promise<void>;
}

const AdminStoreContext = createContext<AdminStoreContextType | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [costingSheets, setCostingSheets] = useState<CostingSheet[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastWriteError, setLastWriteError] = useState<string | null>(null);

  const isSyncingRef = useRef(false);
  const clearWriteError = useCallback(() => setLastWriteError(null), []);

  // Wraps a Supabase write: reports the underlying error to the user
  // instead of silently swallowing it (an optimistic UI update already
  // happened, so at minimum the user needs to know it may not have saved).
  const reportWriteFailure = useCallback((action: string, err: unknown) => {
    console.error(`[Rivlet Store] ${action} failed:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    setLastWriteError(`${action} failed to save to the cloud: ${message}. It's kept locally — try again once you're back online.`);
  }, []);

  // Synchronize state with Supabase Cloud
  const syncWithSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    if (isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      setIsSyncing(true);

      // New-module tables (vendors/pipeline/budget) may not exist yet if
      // supabase_migration_v2.sql hasn't been run — fail soft per-table so
      // a missing table there never breaks sync for the original modules.
      const safeSelect = (table: string) =>
        Promise.resolve(supabase!.from(table).select('*').order('created_at', { ascending: false }))
          .catch(() => ({ data: null, error: null } as any));

      const [artRes, costRes, docRes, kbRes, venRes, pipeRes, budRes, sprRes, wiRes] = await Promise.all([
        supabase.from('artifacts').select('*').order('created_at', { ascending: false }),
        supabase.from('costing_sheets').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('kb_articles').select('*').order('created_at', { ascending: false }),
        safeSelect('vendors'),
        safeSelect('pipeline_items'),
        safeSelect('budget_items'),
        safeSelect('sprints'),
        safeSelect('work_items'),
      ]);

      // 1. Artifacts sync & auto-seed
      if (artRes.data && artRes.data.length > 0) {
        const formatted: ArtifactItem[] = artRes.data
          .filter((r: any) => r.id !== 'art-001' && r.id !== 'art-002')
          .map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description || '',
            category: r.category || 'General',
            tags: Array.isArray(r.tags) ? r.tags : [],
            htmlContent: r.html_content || '',
            source: r.source || 'Claude 3.7 Sonnet',
            version: r.version || '1.0',
            isPromoted: Boolean(r.is_promoted),
            routeSlug: r.route_slug || r.id,
            status: r.status || 'inbox',
            isFavorite: Boolean(r.is_favorite),
            expiryDate: r.expiry_date || undefined,
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || new Date().toISOString(),
          }));
        setArtifacts(formatted);
        try { localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(formatted)); } catch (_) {}
      } else if (artRes.data && artRes.data.length === 0) {
        // Auto-seed initial real Claude pricing artifact to Supabase
        for (const art of initialArtifacts) {
          await supabase.from('artifacts').upsert({
            id: art.id,
            title: art.title,
            description: art.description,
            category: art.category,
            tags: art.tags,
            html_content: art.htmlContent,
            source: art.source,
            version: art.version,
            is_promoted: art.isPromoted,
            route_slug: art.routeSlug,
            status: art.status,
            is_favorite: art.isFavorite,
            created_at: art.createdAt,
            updated_at: art.updatedAt,
          });
        }
        setArtifacts(initialArtifacts);
        try { localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(initialArtifacts)); } catch (_) {}
      }

      // 2. Costing Sheets sync & auto-seed
      if (costRes.data && costRes.data.length > 0) {
        const formatted: CostingSheet[] = costRes.data.map((r: any) => ({
          id: r.id,
          sku: r.sku,
          styleName: r.style_name,
          season: r.season || 'FW26',
          category: r.category || 'Hoodie',
          currency: r.currency || '₹',
          mrp: Number(r.mrp),
          expectedMargin: Number(r.expected_margin),
          inputs: typeof r.inputs === 'object' && r.inputs !== null ? r.inputs : {},
          notes: r.notes || '',
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }));
        setCostingSheets(formatted);
        try { localStorage.setItem(STORAGE_KEYS.COSTING_SHEETS, JSON.stringify(formatted)); } catch (_) {}
      } else if (costRes.data && costRes.data.length === 0) {
        // Auto-seed costing sheets to Supabase
        for (const sheet of initialCostingSheets) {
          await supabase.from('costing_sheets').upsert({
            id: sheet.id,
            sku: sheet.sku,
            style_name: sheet.styleName,
            season: sheet.season,
            category: sheet.category,
            currency: sheet.currency,
            mrp: sheet.mrp,
            expected_margin: sheet.expectedMargin,
            inputs: sheet.inputs,
            notes: sheet.notes,
            created_at: sheet.createdAt,
            updated_at: sheet.updatedAt,
          });
        }
        setCostingSheets(initialCostingSheets);
        try { localStorage.setItem(STORAGE_KEYS.COSTING_SHEETS, JSON.stringify(initialCostingSheets)); } catch (_) {}
      }

      // 3. Documents sync (vault files)
      if (docRes.data) {
        const formatted: DocumentItem[] = docRes.data
          .filter((r: any) => !r.file_url?.includes('/mock-docs/') && !r.id?.startsWith('doc-00'))
          .map((r: any) => ({
            id: r.id,
            title: r.title,
            documentType: r.document_type || 'Certificate',
            fileName: r.file_name,
            fileUrl: r.file_url,
            fileSizeBytes: Number(r.file_size_bytes || 0),
            fileFormat: r.file_format || 'pdf',
            expiryDate: r.expiry_date,
            status: r.status || 'Active',
            tags: Array.isArray(r.tags) ? r.tags : [],
            associatedVendor: r.associated_vendor,
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || new Date().toISOString(),
          }));
        setDocuments(formatted);
        try { localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(formatted)); } catch (_) {}
      }

      // 4. KB Articles sync & auto-seed
      if (kbRes.data && kbRes.data.length > 0) {
        const formatted: KBArticle[] = kbRes.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          category: r.category || 'Vendors & Mills',
          content: r.content || '',
          isConfidential: Boolean(r.is_confidential),
          author: r.author || 'Rivlet Sourcing Team',
          tags: Array.isArray(r.tags) ? r.tags : [],
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }));
        setKbArticles(formatted);
        try { localStorage.setItem(STORAGE_KEYS.KB_ARTICLES, JSON.stringify(formatted)); } catch (_) {}
      } else if (kbRes.data && kbRes.data.length === 0) {
        for (const kb of initialKBArticles) {
          await supabase.from('kb_articles').upsert({
            id: kb.id,
            title: kb.title,
            slug: kb.slug,
            category: kb.category,
            content: kb.content,
            is_confidential: kb.isConfidential,
            author: kb.author,
            tags: kb.tags,
            created_at: kb.createdAt,
            updated_at: kb.updatedAt,
          });
        }
        setKbArticles(initialKBArticles);
        try { localStorage.setItem(STORAGE_KEYS.KB_ARTICLES, JSON.stringify(initialKBArticles)); } catch (_) {}
      }

      // 5. Vendors sync & auto-seed
      if (venRes.data && venRes.data.length > 0) {
        const formatted: VendorItem[] = venRes.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          location: r.location || 'Tirupur, Tamil Nadu',
          contactName: r.contact_name || undefined,
          contactEmail: r.contact_email || undefined,
          contactPhone: r.contact_phone || undefined,
          isVerticallyIntegrated: r.is_vertically_integrated ?? null,
          specialty: r.specialty || undefined,
          stage: r.stage || 'Prospect',
          moqOffered: r.moq_offered !== null && r.moq_offered !== undefined ? Number(r.moq_offered) : undefined,
          moqTarget: r.moq_target !== null && r.moq_target !== undefined ? Number(r.moq_target) : undefined,
          paymentTermsOffered: r.payment_terms_offered || undefined,
          paymentTermsTarget: r.payment_terms_target || undefined,
          samplingFee: r.sampling_fee !== null && r.sampling_fee !== undefined ? Number(r.sampling_fee) : undefined,
          certifications: Array.isArray(r.certifications) ? r.certifications : [],
          lastContactedAt: r.last_contacted_at || undefined,
          nextFollowUpAt: r.next_follow_up_at || undefined,
          notes: r.notes || undefined,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }));
        setVendors(formatted);
        try { localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(formatted)); } catch (_) {}
      } else if (venRes.data && venRes.data.length === 0) {
        for (const v of initialVendors) {
          await Promise.resolve(supabase.from('vendors').upsert({
            id: v.id, name: v.name, location: v.location, contact_name: v.contactName,
            contact_email: v.contactEmail, contact_phone: v.contactPhone,
            is_vertically_integrated: v.isVerticallyIntegrated, specialty: v.specialty,
            stage: v.stage, moq_offered: v.moqOffered, moq_target: v.moqTarget,
            payment_terms_offered: v.paymentTermsOffered, payment_terms_target: v.paymentTermsTarget,
            sampling_fee: v.samplingFee, certifications: v.certifications,
            last_contacted_at: v.lastContactedAt, next_follow_up_at: v.nextFollowUpAt,
            notes: v.notes, created_at: v.createdAt, updated_at: v.updatedAt,
          })).catch(() => {});
        }
        setVendors(initialVendors);
        try { localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(initialVendors)); } catch (_) {}
      }

      // 6. Pipeline items sync & auto-seed
      if (pipeRes.data && pipeRes.data.length > 0) {
        const formatted: PipelineItem[] = pipeRes.data.map((r: any) => ({
          id: r.id,
          styleName: r.style_name,
          sku: r.sku || undefined,
          category: r.category || "Women's Activewear",
          colorway: r.colorway || undefined,
          drop: r.drop_name || 'Drop 1',
          vendorId: r.vendor_id || undefined,
          stage: r.stage || 'Design Finalized',
          targetQuantity: r.target_quantity !== null && r.target_quantity !== undefined ? Number(r.target_quantity) : undefined,
          targetDate: r.target_date || undefined,
          actualDate: r.actual_date || undefined,
          notes: r.notes || undefined,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }));
        setPipelineItems(formatted);
        try { localStorage.setItem(STORAGE_KEYS.PIPELINE_ITEMS, JSON.stringify(formatted)); } catch (_) {}
      } else if (pipeRes.data && pipeRes.data.length === 0) {
        for (const p of initialPipelineItems) {
          await Promise.resolve(supabase.from('pipeline_items').upsert({
            id: p.id, style_name: p.styleName, sku: p.sku, category: p.category,
            colorway: p.colorway, drop_name: p.drop, vendor_id: p.vendorId, stage: p.stage,
            target_quantity: p.targetQuantity, target_date: p.targetDate, actual_date: p.actualDate,
            notes: p.notes, created_at: p.createdAt, updated_at: p.updatedAt,
          })).catch(() => {});
        }
        setPipelineItems(initialPipelineItems);
        try { localStorage.setItem(STORAGE_KEYS.PIPELINE_ITEMS, JSON.stringify(initialPipelineItems)); } catch (_) {}
      }

      // 7. Budget items sync & auto-seed
      if (budRes.data && budRes.data.length > 0) {
        const formatted: BudgetItem[] = budRes.data.map((r: any) => ({
          id: r.id,
          category: r.category,
          plannedAmount: Number(r.planned_amount || 0),
          actualAmount: Number(r.actual_amount || 0),
          currency: r.currency || '₹',
          phase: r.phase || undefined,
          notes: r.notes || undefined,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }));
        setBudgetItems(formatted);
        try { localStorage.setItem(STORAGE_KEYS.BUDGET_ITEMS, JSON.stringify(formatted)); } catch (_) {}
      } else if (budRes.data && budRes.data.length === 0) {
        for (const b of initialBudgetItems) {
          await Promise.resolve(supabase.from('budget_items').upsert({
            id: b.id, category: b.category, planned_amount: b.plannedAmount,
            actual_amount: b.actualAmount, currency: b.currency, phase: b.phase,
            notes: b.notes, created_at: b.createdAt, updated_at: b.updatedAt,
          })).catch(() => {});
        }
        setBudgetItems(initialBudgetItems);
        try { localStorage.setItem(STORAGE_KEYS.BUDGET_ITEMS, JSON.stringify(initialBudgetItems)); } catch (_) {}
      }

      // 8. Sprints sync & auto-seed
      if (sprRes.data && sprRes.data.length > 0) {
        const formatted: Sprint[] = sprRes.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          goal: r.goal || undefined,
          startDate: r.start_date,
          endDate: r.end_date,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }));
        setSprints(formatted);
        try { localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(formatted)); } catch (_) {}
      } else if (sprRes.data && sprRes.data.length === 0) {
        for (const s of initialSprints) {
          await Promise.resolve(supabase.from('sprints').upsert({
            id: s.id, name: s.name, goal: s.goal, start_date: s.startDate, end_date: s.endDate,
            created_at: s.createdAt, updated_at: s.updatedAt,
          })).catch(() => {});
        }
        setSprints(initialSprints);
        try { localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(initialSprints)); } catch (_) {}
      }

      // 9. Work items sync & auto-seed
      if (wiRes.data && wiRes.data.length > 0) {
        const formatted: WorkItem[] = wiRes.data.map((r: any) => ({
          id: r.id,
          type: r.type || 'Task',
          title: r.title,
          description: r.description || undefined,
          acceptanceCriteria: r.acceptance_criteria || undefined,
          state: r.state || 'New',
          priority: (r.priority ?? 2) as any,
          storyPoints: r.story_points !== null && r.story_points !== undefined ? Number(r.story_points) : undefined,
          assignee: r.assignee || undefined,
          tags: Array.isArray(r.tags) ? r.tags : [],
          parentId: r.parent_id || undefined,
          sprintId: r.sprint_id || undefined,
          startDate: r.start_date || undefined,
          targetDate: r.target_date || undefined,
          completedDate: r.completed_date || undefined,
          comments: Array.isArray(r.comments) ? r.comments : [],
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }));
        setWorkItems(formatted);
        try { localStorage.setItem(STORAGE_KEYS.WORK_ITEMS, JSON.stringify(formatted)); } catch (_) {}
      } else if (wiRes.data && wiRes.data.length === 0) {
        for (const w of initialWorkItems) {
          await Promise.resolve(supabase.from('work_items').upsert({
            id: w.id, type: w.type, title: w.title, description: w.description,
            acceptance_criteria: w.acceptanceCriteria, state: w.state, priority: w.priority,
            story_points: w.storyPoints, assignee: w.assignee, tags: w.tags,
            parent_id: w.parentId, sprint_id: w.sprintId, start_date: w.startDate,
            target_date: w.targetDate, completed_date: w.completedDate, comments: w.comments,
            created_at: w.createdAt, updated_at: w.updatedAt,
          })).catch(() => {});
        }
        setWorkItems(initialWorkItems);
        try { localStorage.setItem(STORAGE_KEYS.WORK_ITEMS, JSON.stringify(initialWorkItems)); } catch (_) {}
      }
    } catch (err) {
      console.warn('[Rivlet Store] Supabase sync notice:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      setIsLoaded(true);
    }
  }, []);

  // Initial load: fast local cache first, then immediately pull live Supabase data
  useEffect(() => {
    try {
      const storedArtifacts = localStorage.getItem(STORAGE_KEYS.ARTIFACTS);
      const storedSheets = localStorage.getItem(STORAGE_KEYS.COSTING_SHEETS);
      const storedDocs = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      const storedArticles = localStorage.getItem(STORAGE_KEYS.KB_ARTICLES);
      const storedVendors = localStorage.getItem(STORAGE_KEYS.VENDORS);
      const storedPipeline = localStorage.getItem(STORAGE_KEYS.PIPELINE_ITEMS);
      const storedBudget = localStorage.getItem(STORAGE_KEYS.BUDGET_ITEMS);
      const storedSprints = localStorage.getItem(STORAGE_KEYS.SPRINTS);
      const storedWorkItems = localStorage.getItem(STORAGE_KEYS.WORK_ITEMS);

      if (storedArtifacts) {
        const parsed = JSON.parse(storedArtifacts).filter((a: any) => a.id !== 'art-001' && a.id !== 'art-002');
        setArtifacts(parsed.length > 0 ? parsed : initialArtifacts);
      } else {
        setArtifacts(initialArtifacts);
      }

      if (storedSheets) {
        setCostingSheets(JSON.parse(storedSheets));
      } else {
        setCostingSheets(initialCostingSheets);
      }

      if (storedDocs) {
        const parsedDocs = JSON.parse(storedDocs).filter((d: any) => !d.fileUrl?.includes('/mock-docs/') && !d.id?.startsWith('doc-00'));
        setDocuments(parsedDocs);
      } else {
        setDocuments([]);
      }

      if (storedArticles) {
        setKbArticles(JSON.parse(storedArticles));
      } else {
        setKbArticles(initialKBArticles);
      }

      setVendors(storedVendors ? JSON.parse(storedVendors) : initialVendors);
      setPipelineItems(storedPipeline ? JSON.parse(storedPipeline) : initialPipelineItems);
      setBudgetItems(storedBudget ? JSON.parse(storedBudget) : initialBudgetItems);
      setSprints(storedSprints ? JSON.parse(storedSprints) : initialSprints);
      setWorkItems(storedWorkItems ? JSON.parse(storedWorkItems) : initialWorkItems);
    } catch (e) {
      setArtifacts(initialArtifacts);
      setCostingSheets(initialCostingSheets);
      setDocuments([]);
      setKbArticles(initialKBArticles);
      setVendors(initialVendors);
      setPipelineItems(initialPipelineItems);
      setBudgetItems(initialBudgetItems);
      setSprints(initialSprints);
      setWorkItems(initialWorkItems);
    }

    // Immediately trigger cloud sync from Supabase
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Keep local cache synced for instant cold start and offline resiliency
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(artifacts));
      localStorage.setItem(STORAGE_KEYS.COSTING_SHEETS, JSON.stringify(costingSheets));
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
      localStorage.setItem(STORAGE_KEYS.KB_ARTICLES, JSON.stringify(kbArticles));
      localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
      localStorage.setItem(STORAGE_KEYS.PIPELINE_ITEMS, JSON.stringify(pipelineItems));
      localStorage.setItem(STORAGE_KEYS.BUDGET_ITEMS, JSON.stringify(budgetItems));
      localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
      localStorage.setItem(STORAGE_KEYS.WORK_ITEMS, JSON.stringify(workItems));
    } catch (_) {}
  }, [artifacts, costingSheets, documents, kbArticles, vendors, pipelineItems, budgetItems, sprints, workItems, isLoaded]);

  // Window Focus & Visibility Listener: Automatically syncs when switching between Laptop and Tab.
  // Realtime Postgres subscriptions (below) handle live cross-device pushes, so we don't also
  // need a fixed-interval poll on top of that — it was pure read amplification.
  useEffect(() => {
    const handleFocus = () => {
      syncWithSupabase();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithSupabase();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Slow fallback poll (2 min) in case a realtime connection silently drops.
    const interval = setInterval(() => {
      syncWithSupabase();
    }, 120000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [syncWithSupabase]);

  // Realtime Supabase Channel Listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('rivlet-live-cloud-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artifacts' }, () => {
        syncWithSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'costing_sheets' }, () => {
        syncWithSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        syncWithSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kb_articles' }, () => {
        syncWithSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => {
        syncWithSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_items' }, () => {
        syncWithSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_items' }, () => {
        syncWithSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprints' }, () => {
        syncWithSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_items' }, () => {
        syncWithSupabase();
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [syncWithSupabase]);

  // --- CRUD Actions Writing Directly to Supabase ---

  // 1. Artifact Actions
  const addArtifact = async (item: Omit<ArtifactItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: ArtifactItem = {
      ...item,
      id: `art-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic state update
    setArtifacts((prev) => [newItem, ...prev.filter((a) => a.id !== newItem.id)]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('artifacts').insert({
          id: newItem.id,
          title: newItem.title,
          description: newItem.description,
          category: newItem.category,
          tags: newItem.tags,
          html_content: newItem.htmlContent,
          source: newItem.source,
          version: newItem.version,
          is_promoted: newItem.isPromoted,
          route_slug: newItem.routeSlug,
          status: newItem.status,
          is_favorite: newItem.isFavorite || false,
          created_at: newItem.createdAt,
          updated_at: newItem.updatedAt,
        });
      } catch (e) {
        reportWriteFailure('Saving artifact', e);
      }
    }

    return newItem;
  };

  const updateArtifact = async (id: string, updates: Partial<ArtifactItem>) => {
    const now = new Date().toISOString();
    setArtifacts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: now } : item))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, any> = { updated_at: now };
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.tags !== undefined) payload.tags = updates.tags;
        if (updates.htmlContent !== undefined) payload.html_content = updates.htmlContent;
        if (updates.source !== undefined) payload.source = updates.source;
        if (updates.version !== undefined) payload.version = updates.version;
        if (updates.isPromoted !== undefined) payload.is_promoted = updates.isPromoted;
        if (updates.routeSlug !== undefined) payload.route_slug = updates.routeSlug;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite;
        if (updates.expiryDate !== undefined) payload.expiry_date = updates.expiryDate || null;

        await supabase.from('artifacts').update(payload).eq('id', id);
      } catch (e) {
        reportWriteFailure('Updating artifact', e);
      }
    }
  };

  const togglePromoteArtifact = async (id: string) => {
    const target = artifacts.find((a) => a.id === id);
    if (!target) return;

    const nextPromoted = !target.isPromoted;
    const nextStatus: ArtifactStatus = nextPromoted ? 'promoted' : 'approved';
    const nextSlug = target.routeSlug || target.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await updateArtifact(id, {
      isPromoted: nextPromoted,
      status: nextStatus,
      routeSlug: nextSlug,
    });
  };

  const deleteArtifact = async (id: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('artifacts').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting artifact', e);
      }
    }
  };

  // 2. Costing Sheet Actions
  const saveCostingSheet = async (sheet: CostingSheet) => {
    const now = new Date().toISOString();
    const updatedSheet: CostingSheet = { ...sheet, updatedAt: now };

    setCostingSheets((prev) => {
      const idx = prev.findIndex((s) => s.id === sheet.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSheet;
        return copy;
      }
      return [updatedSheet, ...prev];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('costing_sheets').upsert({
          id: updatedSheet.id,
          sku: updatedSheet.sku,
          style_name: updatedSheet.styleName,
          season: updatedSheet.season || 'FW26',
          category: updatedSheet.category || 'Hoodie',
          currency: updatedSheet.currency,
          mrp: updatedSheet.mrp,
          expected_margin: updatedSheet.expectedMargin,
          inputs: updatedSheet.inputs,
          notes: updatedSheet.notes,
          created_at: updatedSheet.createdAt || now,
          updated_at: now,
        });
      } catch (e) {
        reportWriteFailure('Saving costing sheet', e);
      }
    }
  };

  const deleteCostingSheet = async (id: string) => {
    setCostingSheets((prev) => prev.filter((s) => s.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('costing_sheets').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting costing sheet', e);
      }
    }
  };

  // 3. Document Actions
  const addDocument = async (doc: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    setDocuments((prev) => [newDoc, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('documents').insert({
          id: newDoc.id,
          title: newDoc.title,
          document_type: newDoc.documentType,
          file_name: newDoc.fileName,
          file_url: newDoc.fileUrl,
          file_size_bytes: newDoc.fileSizeBytes,
          file_format: newDoc.fileFormat,
          expiry_date: newDoc.expiryDate || null,
          status: newDoc.status,
          tags: newDoc.tags,
          associated_vendor: newDoc.associatedVendor || null,
          created_at: now,
          updated_at: now,
        });
      } catch (e) {
        reportWriteFailure('Saving document', e);
      }
    }

    return newDoc;
  };

  const updateDocument = async (id: string, updates: Partial<DocumentItem>) => {
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...updates, updatedAt: now } : doc))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, any> = { updated_at: now };
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.documentType !== undefined) payload.document_type = updates.documentType;
        if (updates.fileName !== undefined) payload.file_name = updates.fileName;
        if (updates.fileUrl !== undefined) payload.file_url = updates.fileUrl;
        if (updates.fileFormat !== undefined) payload.file_format = updates.fileFormat;
        if (updates.expiryDate !== undefined) payload.expiry_date = updates.expiryDate || null;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.tags !== undefined) payload.tags = updates.tags;
        if (updates.associatedVendor !== undefined) payload.associated_vendor = updates.associatedVendor || null;

        await supabase.from('documents').update(payload).eq('id', id);
      } catch (e) {
        reportWriteFailure('Updating document', e);
      }
    }
  };

  const deleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('documents').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting document', e);
      }
    }
  };

  // 4. Knowledge Base Article Actions
  const saveArticle = async (article: KBArticle) => {
    const now = new Date().toISOString();
    const updatedArticle: KBArticle = { ...article, updatedAt: now };

    setKbArticles((prev) => {
      const idx = prev.findIndex((a) => a.id === article.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedArticle;
        return copy;
      }
      return [updatedArticle, ...prev];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('kb_articles').upsert({
          id: updatedArticle.id,
          title: updatedArticle.title,
          slug: updatedArticle.slug,
          category: updatedArticle.category,
          content: updatedArticle.content,
          is_confidential: updatedArticle.isConfidential,
          author: updatedArticle.author,
          tags: updatedArticle.tags,
          created_at: updatedArticle.createdAt || now,
          updated_at: now,
        });
      } catch (e) {
        reportWriteFailure('Saving knowledge base article', e);
      }
    }
  };

  const deleteArticle = async (id: string) => {
    setKbArticles((prev) => prev.filter((a) => a.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('kb_articles').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting knowledge base article', e);
      }
    }
  };

  // 5. Vendor CRM Actions
  const saveVendor = async (vendor: VendorItem) => {
    const now = new Date().toISOString();
    const updated: VendorItem = { ...vendor, updatedAt: now };

    setVendors((prev) => {
      const idx = prev.findIndex((v) => v.id === vendor.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('vendors').upsert({
          id: updated.id,
          name: updated.name,
          location: updated.location,
          contact_name: updated.contactName || null,
          contact_email: updated.contactEmail || null,
          contact_phone: updated.contactPhone || null,
          is_vertically_integrated: updated.isVerticallyIntegrated ?? null,
          specialty: updated.specialty || null,
          stage: updated.stage,
          moq_offered: updated.moqOffered ?? null,
          moq_target: updated.moqTarget ?? null,
          payment_terms_offered: updated.paymentTermsOffered || null,
          payment_terms_target: updated.paymentTermsTarget || null,
          sampling_fee: updated.samplingFee ?? null,
          certifications: updated.certifications || [],
          last_contacted_at: updated.lastContactedAt || null,
          next_follow_up_at: updated.nextFollowUpAt || null,
          notes: updated.notes || null,
          created_at: updated.createdAt || now,
          updated_at: now,
        });
      } catch (e) {
        reportWriteFailure('Saving vendor', e);
      }
    }
  };

  const deleteVendor = async (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('vendors').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting vendor', e);
      }
    }
  };

  // 6. Sampling & Production Pipeline Actions
  const savePipelineItem = async (item: PipelineItem) => {
    const now = new Date().toISOString();
    const updated: PipelineItem = { ...item, updatedAt: now };

    setPipelineItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('pipeline_items').upsert({
          id: updated.id,
          style_name: updated.styleName,
          sku: updated.sku || null,
          category: updated.category,
          colorway: updated.colorway || null,
          drop_name: updated.drop,
          vendor_id: updated.vendorId || null,
          stage: updated.stage,
          target_quantity: updated.targetQuantity ?? null,
          target_date: updated.targetDate || null,
          actual_date: updated.actualDate || null,
          notes: updated.notes || null,
          created_at: updated.createdAt || now,
          updated_at: now,
        });
      } catch (e) {
        reportWriteFailure('Saving pipeline item', e);
      }
    }
  };

  const deletePipelineItem = async (id: string) => {
    setPipelineItems((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('pipeline_items').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting pipeline item', e);
      }
    }
  };

  // 7. Launch Budget Tracker Actions
  const saveBudgetItem = async (item: BudgetItem) => {
    const now = new Date().toISOString();
    const updated: BudgetItem = { ...item, updatedAt: now };

    setBudgetItems((prev) => {
      const idx = prev.findIndex((b) => b.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('budget_items').upsert({
          id: updated.id,
          category: updated.category,
          planned_amount: updated.plannedAmount,
          actual_amount: updated.actualAmount,
          currency: updated.currency,
          phase: updated.phase || null,
          notes: updated.notes || null,
          created_at: updated.createdAt || now,
          updated_at: now,
        });
      } catch (e) {
        reportWriteFailure('Saving budget item', e);
      }
    }
  };

  const deleteBudgetItem = async (id: string) => {
    setBudgetItems((prev) => prev.filter((b) => b.id !== id));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('budget_items').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting budget item', e);
      }
    }
  };

  // 8. Sprint Actions
  const saveSprint = async (sprint: Sprint) => {
    const now = new Date().toISOString();
    const updated: Sprint = { ...sprint, updatedAt: now };

    setSprints((prev) => {
      const idx = prev.findIndex((s) => s.id === sprint.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sprints').upsert({
          id: updated.id,
          name: updated.name,
          goal: updated.goal || null,
          start_date: updated.startDate,
          end_date: updated.endDate,
          created_at: updated.createdAt || now,
          updated_at: now,
        });
      } catch (e) {
        reportWriteFailure('Saving sprint', e);
      }
    }
  };

  const deleteSprint = async (id: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
    // Unschedule any work items that pointed at this sprint back to the backlog
    setWorkItems((prev) => prev.map((w) => (w.sprintId === id ? { ...w, sprintId: undefined } : w)));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sprints').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting sprint', e);
      }
    }
  };

  // 9. Work Item Actions
  const saveWorkItem = async (item: WorkItem) => {
    const now = new Date().toISOString();
    const updated: WorkItem = { ...item, updatedAt: now };

    setWorkItems((prev) => {
      const idx = prev.findIndex((w) => w.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('work_items').upsert({
          id: updated.id,
          type: updated.type,
          title: updated.title,
          description: updated.description || null,
          acceptance_criteria: updated.acceptanceCriteria || null,
          state: updated.state,
          priority: updated.priority,
          story_points: updated.storyPoints ?? null,
          assignee: updated.assignee || null,
          tags: updated.tags || [],
          parent_id: updated.parentId || null,
          sprint_id: updated.sprintId || null,
          start_date: updated.startDate || null,
          target_date: updated.targetDate || null,
          completed_date: updated.completedDate || null,
          comments: updated.comments || [],
          created_at: updated.createdAt || now,
          updated_at: now,
        });
      } catch (e) {
        reportWriteFailure('Saving work item', e);
      }
    }
  };

  const deleteWorkItem = async (id: string) => {
    setWorkItems((prev) => prev.filter((w) => w.id !== id && w.parentId !== id));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('work_items').delete().eq('id', id);
      } catch (e) {
        reportWriteFailure('Deleting work item', e);
      }
    }
  };

  const addWorkItemComment = async (id: string, text: string, author: string) => {
    const target = workItems.find((w) => w.id === id);
    if (!target || !text.trim()) return;
    const comment = { id: `cm-${Date.now()}`, author, text: text.trim(), createdAt: new Date().toISOString() };
    await saveWorkItem({ ...target, comments: [...target.comments, comment] });
  };

  const resetToSeed = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('artifacts').delete().neq('id', 'keep-all'),
          supabase.from('costing_sheets').delete().neq('id', 'keep-all'),
          supabase.from('documents').delete().neq('id', 'keep-all'),
          supabase.from('kb_articles').delete().neq('id', 'keep-all'),
        ]);
      } catch (_) {}
    }
    await syncWithSupabase();
  };

  return (
    <AdminStoreContext.Provider
      value={{
        isLoaded,
        isSyncing,
        lastWriteError,
        clearWriteError,
        artifacts,
        costingSheets,
        documents,
        kbArticles,
        vendors,
        pipelineItems,
        budgetItems,
        sprints,
        workItems,
        syncWithSupabase,
        addArtifact,
        updateArtifact,
        togglePromoteArtifact,
        deleteArtifact,
        saveCostingSheet,
        deleteCostingSheet,
        addDocument,
        updateDocument,
        deleteDocument,
        saveArticle,
        deleteArticle,
        saveVendor,
        deleteVendor,
        savePipelineItem,
        deletePipelineItem,
        saveBudgetItem,
        deleteBudgetItem,
        saveSprint,
        deleteSprint,
        saveWorkItem,
        deleteWorkItem,
        addWorkItemComment,
        resetToSeed,
      }}
    >
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore() {
  const context = useContext(AdminStoreContext);
  if (!context) {
    throw new Error('useAdminStore must be used within an AdminStoreProvider');
  }
  return context;
}
