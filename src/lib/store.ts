'use client';

import { useState, useEffect } from 'react';
import { ArtifactItem, CostingSheet, DocumentItem, KBArticle, ArtifactStatus } from './types';
import { initialArtifacts, initialCostingSheets, initialDocuments, initialKBArticles } from './initialData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  ARTIFACTS: 'rivlet_admin_artifacts',
  COSTING_SHEETS: 'rivlet_admin_costing_sheets',
  DOCUMENTS: 'rivlet_admin_documents',
  KB_ARTICLES: 'rivlet_admin_kb_articles',
};

export function useAdminStore() {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [costingSheets, setCostingSheets] = useState<CostingSheet[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage or seed data, then sync with Supabase if configured
  useEffect(() => {
    try {
      const storedArtifacts = localStorage.getItem(STORAGE_KEYS.ARTIFACTS);
      const storedSheets = localStorage.getItem(STORAGE_KEYS.COSTING_SHEETS);
      const storedDocs = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      const storedArticles = localStorage.getItem(STORAGE_KEYS.KB_ARTICLES);

      // Load and sanitize artifacts (remove any prototyping test dummy artifacts)
      let parsedArtifacts: ArtifactItem[] = storedArtifacts ? JSON.parse(storedArtifacts) : initialArtifacts;
      parsedArtifacts = parsedArtifacts.filter(a => a.id !== 'art-001' && a.id !== 'art-002');
      if (parsedArtifacts.length === 0) {
        parsedArtifacts = initialArtifacts;
      }
      localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(parsedArtifacts));
      setArtifacts(parsedArtifacts);

      // Load costing sheets
      const parsedSheets = storedSheets ? JSON.parse(storedSheets) : initialCostingSheets;
      setCostingSheets(parsedSheets);

      // Load and sanitize documents (purge mock testing files)
      let parsedDocs: DocumentItem[] = storedDocs ? JSON.parse(storedDocs) : initialDocuments;
      parsedDocs = parsedDocs.filter(d => !d.fileUrl?.includes('/mock-docs/') && !d.id?.startsWith('doc-00'));
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(parsedDocs));
      setDocuments(parsedDocs);

      // Load KB articles
      const parsedArticles = storedArticles ? JSON.parse(storedArticles) : initialKBArticles;
      setKbArticles(parsedArticles);
    } catch (e) {
      console.error('Error loading admin store from localStorage:', e);
      setArtifacts(initialArtifacts);
      setCostingSheets(initialCostingSheets);
      setDocuments([]);
      setKbArticles(initialKBArticles);
    } finally {
      setIsLoaded(true);
    }

    // Background sync with Supabase if credentials are provided
    if (isSupabaseConfigured && supabase) {
      syncWithSupabase();
    }
  }, []);

  const syncWithSupabase = async () => {
    if (!supabase) return;
    try {
      const [artRes, costRes, docRes, kbRes] = await Promise.all([
        supabase.from('artifacts').select('*'),
        supabase.from('costing_sheets').select('*'),
        supabase.from('documents').select('*'),
        supabase.from('kb_articles').select('*'),
      ]);

      if (artRes.data && artRes.data.length > 0) {
        const formatted = artRes.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          tags: r.tags || [],
          htmlContent: r.html_content,
          source: r.source,
          version: r.version,
          isPromoted: r.is_promoted,
          routeSlug: r.route_slug,
          status: r.status,
          isFavorite: r.is_favorite,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        setArtifacts(formatted);
        localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(formatted));
      }

      if (costRes.data && costRes.data.length > 0) {
        const formatted = costRes.data.map((r: any) => ({
          id: r.id,
          sku: r.sku,
          styleName: r.style_name,
          season: r.season,
          category: r.category,
          currency: r.currency,
          mrp: Number(r.mrp),
          expectedMargin: Number(r.expected_margin),
          inputs: r.inputs,
          notes: r.notes,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        setCostingSheets(formatted);
        localStorage.setItem(STORAGE_KEYS.COSTING_SHEETS, JSON.stringify(formatted));
      }

      if (docRes.data && docRes.data.length > 0) {
        const formatted = docRes.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          documentType: r.document_type,
          fileName: r.file_name,
          fileUrl: r.file_url,
          fileSizeBytes: r.file_size_bytes,
          fileFormat: r.file_format,
          expiryDate: r.expiry_date,
          status: r.status,
          tags: r.tags || [],
          associatedVendor: r.associated_vendor,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        setDocuments(formatted);
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(formatted));
      }

      if (kbRes.data && kbRes.data.length > 0) {
        const formatted = kbRes.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          category: r.category,
          content: r.content,
          isConfidential: r.is_confidential,
          author: r.author,
          tags: r.tags || [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        setKbArticles(formatted);
        localStorage.setItem(STORAGE_KEYS.KB_ARTICLES, JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn('Supabase sync skipped / table pending creation:', err);
    }
  };

  // Save changes to localStorage & Supabase
  const saveArtifacts = (updated: ArtifactItem[]) => {
    setArtifacts(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save artifacts locally', e);
    }
  };

  const saveCostingSheets = (updated: CostingSheet[]) => {
    setCostingSheets(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.COSTING_SHEETS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save costing sheets locally', e);
    }
  };

  const saveDocuments = (updated: DocumentItem[]) => {
    setDocuments(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save documents locally', e);
    }
  };

  const saveArticles = (updated: KBArticle[]) => {
    setKbArticles(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.KB_ARTICLES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save KB articles locally', e);
    }
  };

  // --- Artifact Actions ---
  const addArtifact = async (item: Omit<ArtifactItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: ArtifactItem = {
      ...item,
      id: `art-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...artifacts];
    saveArtifacts(updated);

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
        });
      } catch (e) {
        console.error('Failed to push artifact to Supabase:', e);
      }
    }

    return newItem;
  };

  const updateArtifact = async (id: string, updates: Partial<ArtifactItem>) => {
    const updated = artifacts.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
    );
    saveArtifacts(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        const item = updated.find((i) => i.id === id);
        if (item) {
          await supabase.from('artifacts').upsert({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            tags: item.tags,
            html_content: item.htmlContent,
            source: item.source,
            version: item.version,
            is_promoted: item.isPromoted,
            route_slug: item.routeSlug,
            status: item.status,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error('Failed to update artifact on Supabase:', e);
      }
    }
  };

  const togglePromoteArtifact = async (id: string) => {
    const updated = artifacts.map((item) => {
      if (item.id === id) {
        const nextPromoted = !item.isPromoted;
        return {
          ...item,
          isPromoted: nextPromoted,
          status: nextPromoted ? ('promoted' as ArtifactStatus) : ('approved' as ArtifactStatus),
          routeSlug: item.routeSlug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    saveArtifacts(updated);

    if (isSupabaseConfigured && supabase) {
      const item = updated.find((i) => i.id === id);
      if (item) {
        await supabase.from('artifacts').update({
          is_promoted: item.isPromoted,
          status: item.status,
          route_slug: item.routeSlug,
        }).eq('id', id);
      }
    }
  };

  const deleteArtifact = async (id: string) => {
    const updated = artifacts.filter((item) => item.id !== id);
    saveArtifacts(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('artifacts').delete().eq('id', id);
    }
  };

  // --- Costing Sheet Actions ---
  const saveCostingSheet = async (sheet: CostingSheet) => {
    const existingIndex = costingSheets.findIndex((s) => s.id === sheet.id);
    let updated: CostingSheet[];
    if (existingIndex >= 0) {
      updated = [...costingSheets];
      updated[existingIndex] = { ...sheet, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...sheet, updatedAt: new Date().toISOString() }, ...costingSheets];
    }
    saveCostingSheets(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('costing_sheets').upsert({
          id: sheet.id,
          sku: sheet.sku,
          style_name: sheet.styleName,
          season: sheet.season || 'FW26',
          category: sheet.category || 'Hoodie',
          currency: sheet.currency,
          mrp: sheet.mrp,
          expected_margin: sheet.expectedMargin,
          inputs: sheet.inputs,
          notes: sheet.notes,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to sync costing sheet to Supabase:', e);
      }
    }
  };

  const deleteCostingSheet = async (id: string) => {
    const updated = costingSheets.filter((s) => s.id !== id);
    saveCostingSheets(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('costing_sheets').delete().eq('id', id);
    }
  };

  // --- Document Actions ---
  const addDocument = async (doc: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newDoc, ...documents];
    saveDocuments(updated);

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
          expiry_date: newDoc.expiryDate,
          status: newDoc.status,
          tags: newDoc.tags,
          associated_vendor: newDoc.associatedVendor,
        });
      } catch (e) {
        console.error('Failed to insert doc to Supabase:', e);
      }
    }

    return newDoc;
  };

  const deleteDocument = async (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    saveDocuments(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('documents').delete().eq('id', id);
    }
  };

  // --- KB Article Actions ---
  const saveArticle = async (article: KBArticle) => {
    const existingIndex = kbArticles.findIndex((a) => a.id === article.id);
    let updated: KBArticle[];
    if (existingIndex >= 0) {
      updated = [...kbArticles];
      updated[existingIndex] = { ...article, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...article, updatedAt: new Date().toISOString() }, ...kbArticles];
    }
    saveArticles(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('kb_articles').upsert({
          id: article.id,
          title: article.title,
          slug: article.slug,
          category: article.category,
          content: article.content,
          is_confidential: article.isConfidential,
          author: article.author,
          tags: article.tags,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to save article to Supabase:', e);
      }
    }
  };

  const deleteArticle = async (id: string) => {
    const updated = kbArticles.filter((a) => a.id !== id);
    saveArticles(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('kb_articles').delete().eq('id', id);
    }
  };

  const resetToSeed = () => {
    saveArtifacts(initialArtifacts);
    saveCostingSheets(initialCostingSheets);
    saveDocuments(initialDocuments);
    saveArticles(initialKBArticles);
  };

  return {
    isLoaded,
    artifacts,
    costingSheets,
    documents,
    kbArticles,
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
  };
}
