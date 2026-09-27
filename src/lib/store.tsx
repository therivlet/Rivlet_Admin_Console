'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ArtifactItem, CostingSheet, DocumentItem, KBArticle, ArtifactStatus } from './types';
import { initialArtifacts, initialCostingSheets, initialDocuments, initialKBArticles } from './initialData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  ARTIFACTS: 'rivlet_admin_artifacts',
  COSTING_SHEETS: 'rivlet_admin_costing_sheets',
  DOCUMENTS: 'rivlet_admin_documents',
  KB_ARTICLES: 'rivlet_admin_kb_articles',
};

interface AdminStoreContextType {
  isLoaded: boolean;
  isSyncing: boolean;
  artifacts: ArtifactItem[];
  costingSheets: CostingSheet[];
  documents: DocumentItem[];
  kbArticles: KBArticle[];
  syncWithSupabase: () => Promise<void>;
  addArtifact: (item: Omit<ArtifactItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ArtifactItem>;
  updateArtifact: (id: string, updates: Partial<ArtifactItem>) => Promise<void>;
  togglePromoteArtifact: (id: string) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  saveCostingSheet: (sheet: CostingSheet) => Promise<void>;
  deleteCostingSheet: (id: string) => Promise<void>;
  addDocument: (doc: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DocumentItem>;
  deleteDocument: (id: string) => Promise<void>;
  saveArticle: (article: KBArticle) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  resetToSeed: () => Promise<void>;
}

const AdminStoreContext = createContext<AdminStoreContextType | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [costingSheets, setCostingSheets] = useState<CostingSheet[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isSyncingRef = useRef(false);

  // Synchronize state with Supabase Cloud
  const syncWithSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    if (isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      setIsSyncing(true);

      const [artRes, costRes, docRes, kbRes] = await Promise.all([
        supabase.from('artifacts').select('*').order('created_at', { ascending: false }),
        supabase.from('costing_sheets').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('kb_articles').select('*').order('created_at', { ascending: false }),
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
    } catch (e) {
      setArtifacts(initialArtifacts);
      setCostingSheets(initialCostingSheets);
      setDocuments([]);
      setKbArticles(initialKBArticles);
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
    } catch (_) {}
  }, [artifacts, costingSheets, documents, kbArticles, isLoaded]);

  // Window Focus & Visibility Listener: Automatically syncs when switching between Laptop and Tab
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

    // Heartbeat background sync every 5 seconds for cross-device live consistency
    const interval = setInterval(() => {
      syncWithSupabase();
    }, 5000);

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
        console.error('Failed to insert artifact into Supabase:', e);
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

        await supabase.from('artifacts').update(payload).eq('id', id);
      } catch (e) {
        console.error('Failed to update artifact on Supabase:', e);
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
        console.error('Failed to delete artifact on Supabase:', e);
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
        console.error('Failed to save costing sheet to Supabase:', e);
      }
    }
  };

  const deleteCostingSheet = async (id: string) => {
    setCostingSheets((prev) => prev.filter((s) => s.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('costing_sheets').delete().eq('id', id);
      } catch (e) {
        console.error('Failed to delete costing sheet on Supabase:', e);
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
        console.error('Failed to insert document into Supabase:', e);
      }
    }

    return newDoc;
  };

  const deleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('documents').delete().eq('id', id);
      } catch (e) {
        console.error('Failed to delete document on Supabase:', e);
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
        console.error('Failed to save KB article to Supabase:', e);
      }
    }
  };

  const deleteArticle = async (id: string) => {
    setKbArticles((prev) => prev.filter((a) => a.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('kb_articles').delete().eq('id', id);
      } catch (e) {
        console.error('Failed to delete KB article on Supabase:', e);
      }
    }
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
        artifacts,
        costingSheets,
        documents,
        kbArticles,
        syncWithSupabase,
        addArtifact,
        updateArtifact,
        togglePromoteArtifact,
        deleteArtifact,
        saveCostingSheet,
        deleteCostingSheet,
        addDocument,
        deleteDocument,
        saveArticle,
        deleteArticle,
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
