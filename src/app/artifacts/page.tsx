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
  List
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { ArtifactItem, ArtifactStatus } from '@/lib/types';
import ArtifactCard from '@/components/artifacts/ArtifactCard';
import ArtifactSandbox from '@/components/artifacts/ArtifactSandbox';
import ArtifactEditorModal from '@/components/artifacts/ArtifactEditorModal';

export default function ArtifactsPage() {
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
  const [activeArtifact, setActiveArtifact] = useState<ArtifactItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<ArtifactItem | null>(null);

  // File upload handler for .html files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-wide font-serif">
              Claude HTML Artifact Vault
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold">
              Curate & Promote Pipeline
            </span>
          </div>
          <p className="text-xs text-[#7c859c]">
            Review, sanitize unwanted data, and promote high-value Claude artifacts into native admin portal pages.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* File Upload Hidden Input */}
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141824] border border-[#232a3d] text-xs font-semibold text-[#8f98af] hover:text-white hover:border-[#cda052]/50 transition-colors">
            <Upload className="w-3.5 h-3.5" />
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Paste / New Artifact</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#11141e] p-3 rounded-xl border border-[#1e2436]">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedStatus('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedStatus === 'All'
                ? 'bg-[#1e2436] text-[#cda052] font-semibold'
                : 'text-[#7e879e] hover:text-white'
            }`}
          >
            All Artifacts ({artifacts.length})
          </button>
          <button
            onClick={() => setSelectedStatus('promoted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'promoted'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold'
                : 'text-[#7e879e] hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Promoted Pages ({promotedCount})</span>
          </button>
          <button
            onClick={() => setSelectedStatus('inbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'inbox'
                ? 'bg-[#1e2436] text-white font-semibold'
                : 'text-[#7e879e] hover:text-white'
            }`}
          >
            <Inbox className="w-3 h-3 text-[#7e879e]" />
            <span>Staging / Review ({artifacts.length - promotedCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#687186]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, tag or category..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0c13] border border-[#212739] text-xs text-white placeholder-[#5c6478] outline-none focus:border-[#cda052]"
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
              onOpen={() => setActiveArtifact(item)}
              onEdit={() => {
                setEditingArtifact(item);
                setIsEditorOpen(true);
              }}
              onTogglePromote={() => togglePromoteArtifact(item.id)}
              onDelete={() => {
                if (confirm(`Are you sure you want to remove "${item.title}"?`)) {
                  deleteArtifact(item.id);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Interactive Modal Viewer */}
      {activeArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-7xl h-[90vh] bg-[#0c0f17] border border-[#22283a] rounded-xl flex flex-col shadow-2xl overflow-hidden relative">
            <ArtifactSandbox
              artifact={activeArtifact}
              onEdit={() => {
                setEditingArtifact(activeArtifact);
                setIsEditorOpen(true);
              }}
              onTogglePromote={() => togglePromoteArtifact(activeArtifact.id)}
            />
            {/* Close button */}
            <button
              onClick={() => setActiveArtifact(null)}
              className="absolute top-2.5 right-2.5 z-10 px-2 py-1 bg-black/60 hover:bg-black/90 text-white rounded text-xs border border-white/10"
            >
              Close ✕
            </button>
          </div>
        </div>
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
