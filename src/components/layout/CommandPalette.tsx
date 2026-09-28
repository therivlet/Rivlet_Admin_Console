'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Layers, 
  Calculator, 
  FileText, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import ModalPortal from '@/components/ui/ModalPortal';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { artifacts, costingSheets, documents, kbArticles } = useAdminStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredArtifacts = artifacts.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.category.toLowerCase().includes(q)
  );

  const filteredCosting = costingSheets.filter(
    (c) =>
      c.sku.toLowerCase().includes(q) ||
      c.styleName.toLowerCase().includes(q) ||
      (c.category && c.category.toLowerCase().includes(q))
  );

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.fileName.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q))
  );

  const filteredArticles = kbArticles.filter(
    (k) =>
      k.title.toLowerCase().includes(q) ||
      k.tags.some((t) => t.toLowerCase().includes(q)) ||
      k.category.toLowerCase().includes(q)
  );

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-2xl bg-[#0e121b] border border-[#263147] rounded-2xl shadow-2xl overflow-hidden ring-1 ring-[#cda052]/20"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Search Input Bar */}
        <div className="relative border-b border-[#1e2638] p-4 flex items-center gap-3 bg-[#0a0d14]">
          <Search className="w-5 h-5 text-[#cda052] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search artifacts, costing sheets, documents, SOPs..."
            className="w-full bg-transparent text-sm text-white placeholder-[#64748b] outline-none font-medium"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#141824] text-[#94a3b8] hover:text-white transition-colors"
            title="Close Search (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Promoted / Artifacts */}
          {filteredArtifacts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-[#666f85] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#cda052]" />
                HTML Artifacts ({filteredArtifacts.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredArtifacts.slice(0, 4).map((art) => (
                  <div
                    key={art.id}
                    onClick={() => navigateTo(art.isPromoted ? `/tools/${art.routeSlug || art.id}` : `/artifacts?id=${art.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#181d2a] cursor-pointer group text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-[rgba(205,160,82,0.1)] text-[#cda052]">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-white font-medium group-hover:text-[#cda052] transition-colors">
                          {art.title}
                        </div>
                        <div className="text-[10px] text-[#747c91]">
                          {art.category} • {art.source}
                        </div>
                      </div>
                    </div>
                    {art.isPromoted && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                        Promoted Page
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Costing Sheets */}
          {filteredCosting.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-[#666f85] uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3 h-3 text-emerald-400" />
                Garment Costing Sheets ({filteredCosting.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredCosting.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigateTo(`/calculator?sku=${c.sku}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#181d2a] cursor-pointer group text-xs"
                  >
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        <span>{c.styleName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202636] text-[#cda052]">
                          {c.sku}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#747c91]">
                        Factory: {c.currency}{c.inputs?.factory || 0} • MRP: {c.currency}{c.mrp} • Margin: {(c.expectedMargin || 0).toFixed(1)}%
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#555d71] group-hover:text-white" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {filteredDocs.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-[#666f85] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-cyan-400" />
                Document Vault ({filteredDocs.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredDocs.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => navigateTo(`/documents?id=${d.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#181d2a] cursor-pointer group text-xs"
                  >
                    <div>
                      <div className="text-white font-medium group-hover:text-cyan-300">
                        {d.title}
                      </div>
                      <div className="text-[10px] text-[#747c91]">
                        {d.documentType} • {d.fileFormat.toUpperCase()}
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2332] text-[#8e97af]">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Articles */}
          {filteredArticles.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-[#666f85] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-purple-400" />
                Knowledge Base & SOPs ({filteredArticles.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredArticles.map((k) => (
                  <div
                    key={k.id}
                    onClick={() => navigateTo(`/knowledge-base?slug=${k.slug}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#181d2a] cursor-pointer group text-xs"
                  >
                    <div>
                      <div className="text-white font-medium group-hover:text-purple-300">
                        {k.title}
                      </div>
                      <div className="text-[10px] text-[#747c91]">
                        {k.category} {k.isConfidential && '• [Confidential]'}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#555d71] group-hover:text-white" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredArtifacts.length === 0 &&
            filteredCosting.length === 0 &&
            filteredDocs.length === 0 &&
            filteredArticles.length === 0 && (
              <div className="p-8 text-center text-[#687084] text-xs">
                No matching records found for "{query}".
              </div>
            )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-[#0a0c12] border-t border-[#1e2434] flex items-center justify-between text-[10px] text-[#636b80]">
          <span>Navigate with mouse or arrow keys</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
