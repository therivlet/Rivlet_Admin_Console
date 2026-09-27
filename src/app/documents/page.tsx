'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  ShieldCheck, 
  Calendar, 
  Download, 
  Eye, 
  Trash2, 
  Plus, 
  AlertTriangle,
  FileCheck,
  Building,
  X
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { DocumentItem } from '@/lib/types';

export default function DocumentsPage() {
  const { documents, addDocument, deleteDocument } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // New Document Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentItem['documentType']>('Certificate');
  const [newVendor, setNewVendor] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newFormat, setNewFormat] = useState<DocumentItem['fileFormat']>('pdf');
  const [newTags, setNewTags] = useState('');
  const [newFileName, setNewFileName] = useState('');

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.associatedVendor && doc.associatedVendor.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'All' || doc.documentType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreateDocument = () => {
    if (!newTitle.trim()) return;

    addDocument({
      title: newTitle,
      documentType: newDocType,
      fileName: newFileName || `${newTitle.replace(/[^a-z0-9]/gi, '_')}.${newFormat}`,
      fileUrl: '#',
      fileSizeBytes: 2100000,
      fileFormat: newFormat,
      expiryDate: newExpiry || undefined,
      status: 'Active',
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      associatedVendor: newVendor || undefined,
    });

    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewVendor('');
    setNewExpiry('');
    setNewTags('');
    setNewFileName('');
  };

  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case 'pdf': return 'bg-rose-950/70 text-rose-400 border-rose-800/40';
      case 'docx': return 'bg-blue-950/70 text-blue-400 border-blue-800/40';
      case 'xlsx': return 'bg-emerald-950/70 text-emerald-400 border-emerald-800/40';
      default: return 'bg-[#1b202e] text-[#8e97ae] border-[#262c3e]';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-wide font-serif">
              Document & Certificate Vault
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold">
              PDF, Word & Compliance Hub
            </span>
          </div>
          <p className="text-xs text-[#7c859c]">
            Secure repository for GOTS/OEKO-TEX certificates, factory audit reports, vendor contracts, and tech packs.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow"
        >
          <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#11141e] p-3 rounded-xl border border-[#1e2436]">
        {/* Type Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Certificate', 'Tech Pack', 'Legal & Contract', 'Audit Report'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedType === type
                  ? 'bg-[#1e2436] text-[#cda052] font-semibold'
                  : 'text-[#7e879e] hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#687186]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents, mills, certs..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0c13] border border-[#212739] text-xs text-white placeholder-[#5c6478] outline-none focus:border-[#cda052]"
          />
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-[#111420] border border-[#1e2436] rounded-xl p-4 hover:border-[#cda052]/50 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header tags */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${getFormatBadge(doc.fileFormat)}`}>
                  {doc.fileFormat.toUpperCase()}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                  {doc.status}
                </span>
              </div>

              {/* Title & Vendor */}
              <h3 
                onClick={() => setPreviewDoc(doc)}
                className="text-sm font-semibold text-white hover:text-[#cda052] cursor-pointer mb-1 line-clamp-2"
              >
                {doc.title}
              </h3>

              {doc.associatedVendor && (
                <div className="flex items-center gap-1.5 text-xs text-[#8c94a9] mb-2">
                  <Building className="w-3 h-3 text-[#555d72]" />
                  <span>{doc.associatedVendor}</span>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1 my-3">
                {doc.tags.map((tag, idx) => (
                  <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-[#161a26] text-[#8e97af] border border-[#23293c]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#1a1f2e] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-[10px] text-[#6b7489]">
                <Calendar className="w-3 h-3 text-[#555d72]" />
                <span>Expires: {doc.expiryDate || 'Perpetual'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 rounded-lg bg-[#161a26] border border-[#262c3e] text-[#8e97ae] hover:text-[#cda052]"
                  title="Preview Document Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove document record "${doc.title}"?`)) {
                      deleteDocument(doc.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-[#161a26] border border-[#262c3e] text-[#8e97ae] hover:text-rose-400"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0e111a] border border-[#242b3d] rounded-xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 text-[#697288] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#cda052]">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{previewDoc.title}</h3>
                <span className="text-xs text-[#7d879d]">{previewDoc.fileName} • {(previewDoc.fileSizeBytes / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>

            <div className="bg-[#090b12] p-4 rounded-lg border border-[#1e2436] space-y-2 text-xs">
              <div className="flex justify-between text-[#858d9f]">
                <span>Document Type:</span>
                <span className="text-white font-medium">{previewDoc.documentType}</span>
              </div>
              <div className="flex justify-between text-[#858d9f]">
                <span>Associated Mill / Vendor:</span>
                <span className="text-white font-medium">{previewDoc.associatedVendor || 'Internal Rivlet HQ'}</span>
              </div>
              <div className="flex justify-between text-[#858d9f]">
                <span>Validity / Expiration:</span>
                <span className="text-[#cda052] font-medium">{previewDoc.expiryDate || 'No Expiry (Permanent Record)'}</span>
              </div>
              <div className="flex justify-between text-[#858d9f]">
                <span>Status:</span>
                <span className="text-emerald-400 font-semibold">{previewDoc.status}</span>
              </div>
            </div>

            <div className="p-4 bg-[#141824] rounded-lg border border-[#22293d] text-center text-xs text-[#7e889f]">
              <p className="mb-3">
                This document is indexed in the Rivlet Document Vault. In production with Supabase Storage connected, full PDF rendering and direct downloading are streamed from your secure bucket.
              </p>
              <button
                onClick={() => alert(`Simulated downloading: ${previewDoc.fileName}`)}
                className="px-4 py-2 rounded-lg bg-[#cda052] text-black font-semibold text-xs inline-flex items-center gap-2 hover:brightness-110"
              >
                <Download className="w-4 h-4" /> Download File Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0e111a] border border-[#242b3d] rounded-xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-[#697288] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white">Upload New Document to Vault</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#7b859b] font-medium mb-1">Document Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Tirupur Fabric Mill Scope Certificate 2026"
                  className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#7b859b] font-medium mb-1">Document Type</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                  >
                    <option value="Certificate">Certificate</option>
                    <option value="Tech Pack">Tech Pack</option>
                    <option value="Legal & Contract">Legal & Contract</option>
                    <option value="Audit Report">Audit Report</option>
                    <option value="Specification">Specification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#7b859b] font-medium mb-1">File Format</label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="image">Image (.png/.jpg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#7b859b] font-medium mb-1">Associated Vendor / Mill</label>
                <input
                  type="text"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  placeholder="e.g. Southern Eco Mills Ltd"
                  className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#7b859b] font-medium mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-[#7b859b] font-medium mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="GOTS, Organic, Cotton"
                    className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1c2233] flex justify-end gap-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#141824] border border-[#22283a] text-xs text-[#8e97ae]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow"
              >
                Save to Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
