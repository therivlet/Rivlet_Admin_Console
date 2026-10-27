'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Filter, 
  Upload, 
  ArrowUpRight, 
  FileCode,
  CheckCircle2,
  Inbox,
  LayoutGrid,
  List,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { ArtifactItem, ArtifactStatus } from '@/lib/types';
import ArtifactCard from '@/components/artifacts/ArtifactCard';
import ArtifactSandbox from '@/components/artifacts/ArtifactSandbox';
import ArtifactEditorModal from '@/components/artifacts/ArtifactEditorModal';
import ModalPortal from '@/components/ui/ModalPortal';
import { useConfirm } from '@/lib/confirmContext';

export default function ArtifactsPage() {
  const confirm = useConfirm();
  const { 
    artifacts, 
    addArtifact, 
    updateArtifact, 
    togglePromoteArtifact, 
    deleteArtifact 
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<ArtifactItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Gemini AI Tool Generator State
  const [showAIToolModal, setShowAIToolModal] = useState(false);
  const [aiToolPrompt, setAiToolPrompt] = useState('');
  const [aiToolCategory, setAiToolCategory] = useState<ArtifactItem['category']>('Operations');
  const [isGeneratingTool, setIsGeneratingTool] = useState(false);
  const [generateToolError, setGenerateToolError] = useState<string | null>(null);

  const handleGenerateAITool = async (promptOverride?: string) => {
    const text = (promptOverride || aiToolPrompt).trim();
    if (!text) return;
    setIsGeneratingTool(true);
    setGenerateToolError(null);
    try {
      const res = await fetch('/api/ai/artifacts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          category: aiToolCategory,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate tool');
      }

      const data = await res.json();
      if (!data.html) {
        throw new Error('No HTML code returned from Gemini');
      }

      const title = text.length > 35 ? text.slice(0, 35) + '...' : text;
      const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 25);
      const newId = `art-${Date.now()}`;

      addArtifact({
        title,
        description: `Generated with Google Gemini: "${text}"`,
        category: aiToolCategory,
        tags: ['Gemini', 'Interactive Tool', aiToolCategory],
        htmlContent: data.html,
        source: 'Google Gemini',
        version: '1.0',
        isPromoted: false,
        routeSlug: slug,
        status: 'inbox',
      });

      setShowAIToolModal(false);
      setAiToolPrompt('');
      setActiveArtifactId(newId);
    } catch (err: any) {
      setGenerateToolError(err.message || 'Error generating tool');
    } finally {
      setIsGeneratingTool(false);
    }
  };

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) || null;

  // File upload handler for .html files with validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. File extension validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'html' && ext !== 'htm') {
      setUploadError('Invalid file type: Only .html and .htm files are supported for artifact import.');
      e.target.value = '';
      return;
    }

    // 2. File size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10MB limit for HTML artifacts.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content || content.trim().length < 10) {
        setUploadError('The selected HTML file is empty or does not contain valid markup.');
        return;
      }

      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      addArtifact({
        title,
        description: `Imported from ${file.name}`,
        category: 'Custom',
        tags: ['Uploaded', 'Claude'],
        htmlContent: content,
        source: 'Claude HTML Upload',
        version: '1.0',
        isPromoted: false,
        status: 'inbox',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteArtifact = async (item: ArtifactItem) => {
    const ok = await confirm({
      title: 'Delete Claude Artifact',
      message: `Are you sure you want to permanently delete "${item.title}"?${
        item.isPromoted
          ? ` Warning: This tool is currently promoted to the navigation sidebar at /tools/${item.routeSlug || item.id}.`
          : ' Its HTML code and metadata will be permanently removed.'
      }`,
      confirmLabel: 'Delete Artifact',
      danger: true,
    });
    if (!ok) return;
    deleteArtifact(item.id);
  };

  // Filter artifacts
  const filtered = artifacts.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'promoted' && item.isPromoted) ||
      (selectedStatus === 'inbox' && !item.isPromoted);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const promotedCount = artifacts.filter((a) => a.isPromoted).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif">
              Claude HTML Artifact Vault
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold font-mono">
              Curate & Promote Pipeline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed max-w-2xl">
            Review, sanitize boilerplate, and promote high-value Claude artifacts into native admin portal pages with dedicated URLs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAIToolModal(true)}
            title="Generate a new interactive HTML tool with Google Gemini"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] hover:bg-[rgba(205,160,82,0.25)] text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#cda052]" />
            <span>✨ Generate Tool (Gemini)</span>
          </button>

          {/* File Upload Hidden Input */}
          <label 
            title="Import a raw HTML artifact file downloaded from Claude"
            className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121623] border border-[#232d42] text-xs font-semibold text-[#cbd5e1] hover:text-white hover:border-[#cda052]/60 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-[#cda052]" />
            <span>Upload .html File</span>
            <input
              type="file"
              accept=".html,.htm"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              setEditingArtifact(null);
              setIsEditorOpen(true);
            }}
            title="Create a new artifact by pasting HTML code"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Paste / New Artifact</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center justify-between gap-2 animate-fade-in font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-300 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0e121b] p-3 rounded-xl border border-[#1e2638] shadow-md">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedStatus('All')}
            title="Show all Claude artifacts in vault"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedStatus === 'All'
                ? 'bg-[#1b2234] text-[#cda052] font-semibold border border-[#2e3b56]'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            All Artifacts ({artifacts.length})
          </button>
          <button
            onClick={() => setSelectedStatus('promoted')}
            title="Filter by artifacts promoted as first-class portal pages"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedStatus === 'promoted'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 font-semibold'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Promoted Pages ({promotedCount})</span>
          </button>
          <button
            onClick={() => setSelectedStatus('inbox')}
            title="Filter by artifacts in staging inbox"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedStatus === 'inbox'
                ? 'bg-[#1b2234] text-white font-semibold border border-[#2e3b56]'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Inbox className="w-3 h-3 text-[#94a3b8]" />
            <span>Staging ({artifacts.length - promotedCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, tag, or category..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#080b12] border border-[#222b3e] text-xs text-white placeholder-[#94a3b8] outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
          />
        </div>
      </div>

      {/* Artifacts Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#1f2638] rounded-xl bg-[#0d1017]">
          <FileCode className="w-8 h-8 text-[#4a5266] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white mb-1">No artifacts found</h3>
          <p className="text-xs text-[#717a90] max-w-sm mx-auto mb-4">
            Upload an existing Claude .html file or click "Paste / New Artifact" to add your first interactive tool.
          </p>
          <button
            onClick={() => {
              setEditingArtifact(null);
              setIsEditorOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#161a26] border border-[#262c3e] text-xs font-semibold text-[#cda052] hover:bg-[#1f2536]"
          >
            Create First Artifact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <ArtifactCard
              key={item.id}
              artifact={item}
              onOpen={() => setActiveArtifactId(item.id)}
              onEdit={() => {
                setEditingArtifact(item);
                setIsEditorOpen(true);
              }}
              onTogglePromote={() => togglePromoteArtifact(item.id)}
              onDelete={() => handleDeleteArtifact(item)}
            />
          ))}
        </div>
      )}

      {/* Interactive Modal Viewer */}
      {activeArtifact && (
        <ModalPortal isOpen={Boolean(activeArtifact)}>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-1.5 sm:p-3 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setActiveArtifactId(null)}
          >
            {/* Sized near full-viewport so artifacts with responsive JS/CSS tied to their
                rendered width lay out the same way here as they do on the standalone
                /tools/[slug] page, which renders at true viewport width. */}
            <div
              className="w-full max-w-[98vw] h-[97vh] !bg-[#0c0f17] border border-[#22283a] rounded-xl flex flex-col shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <ArtifactSandbox
                artifact={activeArtifact}
                onClose={() => setActiveArtifactId(null)}
                onEdit={() => {
                  const target = activeArtifact;
                  setActiveArtifactId(null);
                  setEditingArtifact(target);
                  setIsEditorOpen(true);
                }}
                onTogglePromote={() => togglePromoteArtifact(activeArtifact.id)}
              />
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Gemini AI Tool Generator Modal */}
      {showAIToolModal && (
        <ModalPortal isOpen={true}>
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAIToolModal(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-[#cda052]/40 bg-[#0c1018] p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#1c2436] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(205,160,82,0.15)] border border-[rgba(205,160,82,0.3)] flex items-center justify-center text-[#cda052]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Generate Tool with Gemini</h3>
                    <p className="text-xs text-[#8c9bb5] mt-0.5">
                      Describe an operational tool. Gemini writes complete, sandboxed HTML/CSS/JS ready to run.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIToolModal(false)}
                  className="p-1 rounded-lg text-[#64748b] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white block mb-1">Tool Category</label>
                  <select
                    value={aiToolCategory}
                    onChange={(e) => setAiToolCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#07090e] border border-[#222c42] text-xs text-white outline-none focus:border-[#cda052]"
                  >
                    {['Operations', 'Calculators', 'Visual Pitch', 'Production', 'Marketing', 'Custom'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">What should this tool do?</label>
                  <textarea
                    rows={4}
                    value={aiToolPrompt}
                    onChange={(e) => setAiToolPrompt(e.target.value)}
                    placeholder="e.g. Create an interactive Fabric Yield & Cutting Waste Estimator where I input marker width, fabric roll length, and marker yield % to see cut piece count and waste kg."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#07090e] border border-[#222c42] text-xs text-white placeholder:text-[#52607a] outline-none focus:border-[#cda052] leading-relaxed"
                  />
                </div>

                {/* Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-[#64748b]">Try a popular apparel tool:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Fabric Yield & Cutting Waste Estimator',
                      'Garment Shrinkage & Wash Variance Analyzer',
                      'Apparel Customs Duty & Tariff Cost Breakdown',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={isGeneratingTool}
                        onClick={() => {
                          setAiToolPrompt(preset);
                          handleGenerateAITool(preset);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-[#141b2a] text-[#cbd5e1] hover:text-[#cda052] hover:bg-[#1a2438] transition-colors border border-[#222d42] cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {generateToolError && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-xl">
                    {generateToolError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c2436]">
                <button
                  type="button"
                  onClick={() => setShowAIToolModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8c9bb5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateAITool()}
                  disabled={isGeneratingTool || !aiToolPrompt.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b0883d] text-black text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-glow"
                >
                  {isGeneratingTool ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing Standalone HTML...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-black" />
                      <span>Generate & Open Tool</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Editor & Data Scrubber Modal */}
      <ArtifactEditorModal
        artifact={editingArtifact}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingArtifact(null);
        }}
        onSave={(data) => {
          if (editingArtifact) {
            updateArtifact(editingArtifact.id, data);
          } else {
            addArtifact(data as any);
          }
        }}
      />
    </div>
  );
}
