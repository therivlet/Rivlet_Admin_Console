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
  X,
  ExternalLink,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { DocumentItem } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function DocumentsPage() {
  const { documents, addDocument, deleteDocument } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // New Document Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentItem['documentType']>('Certificate');
  const [newVendor, setNewVendor] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.associatedVendor && doc.associatedVendor.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'All' || doc.documentType === selectedType;
    return matchesSearch && matchesType;
  });

  // Handle file selection from local device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newTitle) {
        // Auto-generate title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewTitle(cleanName);
      }
    }
  };

  const handleCreateDocument = async () => {
    if (!newTitle.trim()) return;

    setIsUploading(true);
    setUploadStatusMsg('Preparing document...');

    let fileUrl = '#';
    let fileSizeBytes = selectedFile ? selectedFile.size : 1500000;
    let fileFormat: DocumentItem['fileFormat'] = 'pdf';

    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'docx' || ext === 'doc') fileFormat = 'docx';
      else if (ext === 'xlsx' || ext === 'xls') fileFormat = 'xlsx';
      else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') fileFormat = 'image';
      else fileFormat = 'pdf';

      // 1. Upload to Supabase Storage if configured
      if (isSupabaseConfigured && supabase) {
        try {
          setUploadStatusMsg('Uploading file to Supabase Cloud Storage...');
          const safeName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const filePath = `documents/${safeName}`;

          const { data, error } = await supabase.storage
            .from('vault-files')
            .upload(filePath, selectedFile, {
              cacheControl: '3600',
              upsert: true,
            });

          if (!error && data) {
            const { data: urlData } = supabase.storage
              .from('vault-files')
              .getPublicUrl(filePath);
            fileUrl = urlData.publicUrl;
          } else {
            console.warn('Storage upload notice (using fallback URL):', error?.message);
            fileUrl = URL.createObjectURL(selectedFile);
          }
        } catch (err) {
          console.error('Upload error:', err);
          fileUrl = URL.createObjectURL(selectedFile);
        }
      } else {
        fileUrl = URL.createObjectURL(selectedFile);
      }
    }

    setUploadStatusMsg('Saving metadata to database...');

    await addDocument({
      title: newTitle,
      documentType: newDocType,
      fileName: selectedFile ? selectedFile.name : `${newTitle.replace(/[^a-z0-9]/gi, '_')}.${fileFormat}`,
      fileUrl,
      fileSizeBytes,
      fileFormat,
      expiryDate: newExpiry || undefined,
      status: 'Active',
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      associatedVendor: newVendor || undefined,
    });

    setIsUploading(false);
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setNewTitle('');
    setNewVendor('');
    setNewExpiry('');
    setNewTags('');
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (confirm(`Remove document record "${doc.title}"?`)) {
      deleteDocument(doc.id);
    }
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif">
              Document & Certificate Vault
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold font-mono">
              Cloud Storage & Compliance Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed max-w-2xl">
            Secure cloud repository for GOTS/OEKO-TEX certificates, factory audit reports, vendor agreements, and apparel tech packs.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          title="Upload GOTS, OEKO-TEX, or contract to vault"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
        >
          <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload Document to Cloud</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0e121b] p-3 rounded-xl border border-[#1e2638] shadow-md">
        {/* Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Certificate', 'Tech Pack', 'Legal & Contract', 'Audit Report', 'Specification'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              title={`Filter documents by ${type}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedType === type
                  ? 'bg-[#1b2234] text-[#cda052] font-semibold border border-[#2e3b56]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search certificates, mills, tech packs..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#080b12] border border-[#222b3e] text-xs text-white placeholder-[#94a3b8] outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#1f2638] rounded-xl bg-[#080b12]">
          <FileText className="w-8 h-8 text-[#4a5266] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white mb-1">No documents found</h3>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto mb-4">
            Upload your GOTS organic certificates, OEKO-TEX compliance reports, or vendor contracts to store them in your Supabase vault.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload GOTS, OEKO-TEX, or contract to vault"
            className="px-4 py-2 rounded-lg bg-[#151a28] border border-[#263148] text-xs font-semibold text-[#cda052] hover:bg-[#1a2236] transition-colors"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#0e121b] border border-[#1e2638] rounded-xl p-4 sm:p-5 hover:border-[#cda052]/50 transition-all flex flex-col justify-between shadow-md"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${getFormatBadge(doc.fileFormat)}`}>
                    {doc.fileFormat.toUpperCase()}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 font-mono font-medium">
                    {doc.status}
                  </span>
                </div>

                {/* Title & Vendor */}
                <h3 
                  onClick={() => setPreviewDoc(doc)}
                  className="text-sm font-semibold text-white hover:text-[#cda052] cursor-pointer mb-1.5 line-clamp-2 transition-colors"
                >
                  {doc.title}
                </h3>

                {doc.associatedVendor && (
                  <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] mb-2.5">
                    <Building className="w-3.5 h-3.5 text-[#64748b]" />
                    <span>{doc.associatedVendor}</span>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {doc.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-[#131722] text-[#cbd5e1] font-medium border border-[#222b3e]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3.5 border-t border-[#1a2133] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>Expires: {doc.expiryDate || 'Permanent'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 rounded-lg bg-[#151a28] border border-[#263148] text-[#cbd5e1] hover:text-[#cda052] hover:bg-[#1a2236] transition-colors"
                    title="Preview document in browser"
                    aria-label="Preview document in browser"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-1.5 rounded-lg bg-[#151a28] border border-[#263148] text-[#cbd5e1] hover:text-rose-400 hover:border-rose-900/60 hover:bg-rose-950/30 transition-colors"
                    title="Delete document from vault"
                    aria-label="Delete document from vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-App Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl h-[92vh] sm:h-[85vh] bg-[#0e111a] border border-[#242b3d] rounded-xl flex flex-col shadow-2xl relative overflow-hidden">
            {/* Modal Topbar */}
            <div className="px-4 sm:px-5 py-3 bg-[#121622] border-b border-[#1f2638] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#cda052] flex-shrink-0">
                  <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate max-w-[160px] sm:max-w-md">{previewDoc.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-[#717a90] truncate">
                    <span className="truncate">{previewDoc.fileName}</span>
                    <span>•</span>
                    <span className="flex-shrink-0">{(previewDoc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span className="text-[#cda052] uppercase font-mono flex-shrink-0">{previewDoc.fileFormat}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && previewDoc.fileUrl !== '#' && (
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={previewDoc.fileName}
                    className="px-3 py-1.5 rounded-lg bg-[#cda052] text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  title="Close Preview"
                  aria-label="Close Preview"
                  className="p-1.5 text-[#717a90] hover:text-white rounded-lg hover:bg-[#1a1f2e] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 bg-[#090b12] p-4 flex flex-col overflow-hidden">
              {previewDoc.fileFormat === 'pdf' && previewDoc.fileUrl && previewDoc.fileUrl !== '#' ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-full rounded-lg border border-[#1f2638] bg-white"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#141824] border border-[#242c40] flex items-center justify-center text-[#cda052] shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">{previewDoc.title}</h4>
                    <p className="text-xs text-[#717a90]">
                      {previewDoc.documentType} • Associated with {previewDoc.associatedVendor || 'Rivlet HQ'}
                    </p>
                  </div>

                  <div className="bg-[#121622] p-4 rounded-xl border border-[#1f2638] max-w-md w-full space-y-2 text-xs">
                    <div className="flex justify-between text-[#858d9f]">
                      <span>Document Status:</span>
                      <span className="text-emerald-400 font-semibold">{previewDoc.status}</span>
                    </div>
                    <div className="flex justify-between text-[#858d9f]">
                      <span>Compliance Expiry:</span>
                      <span className="text-[#cda052] font-mono">{previewDoc.expiryDate || 'Permanent Scope'}</span>
                    </div>
                    <div className="flex justify-between text-[#858d9f]">
                      <span>Cloud Bucket:</span>
                      <span className="text-white font-mono">vault-files</span>
                    </div>
                  </div>

                  {previewDoc.fileUrl && previewDoc.fileUrl !== '#' ? (
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-lg bg-[#cda052] text-black font-semibold text-xs inline-flex items-center gap-1.5 hover:brightness-110"
                    >
                      <Download className="w-4 h-4" /> Download / Open Document
                    </a>
                  ) : (
                    <div className="text-[11px] text-[#636c82]">
                      Sample document metadata record. Upload your actual file using "Upload Document to Cloud".
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0e111a] border border-[#242b3d] rounded-xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-[#697288] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white">Upload Document to Supabase Vault</h3>
              <p className="text-xs text-[#717a90]">
                Files are stored securely in your Supabase Storage bucket and indexed in PostgreSQL.
              </p>
            </div>

            {/* Drag & Drop / File Input Box */}
            <label className="border-2 border-dashed border-[#242c40] hover:border-[#cda052]/50 bg-[#090b12] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors block">
              <Upload className="w-8 h-8 text-[#cda052] mb-2" />
              <span className="text-xs font-semibold text-white">
                {selectedFile ? selectedFile.name : 'Click to select a file from your computer'}
              </span>
              <span className="text-[10px] text-[#636c82] mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload`
                  : 'Supports PDF (.pdf), Word (.docx), Excel (.xlsx), and Images'}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#7b859b] font-medium mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Tirupur Fabric Mill GOTS Scope Certificate 2026"
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
                  <label className="block text-[#7b859b] font-medium mb-1">Associated Vendor / Mill</label>
                  <input
                    type="text"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    placeholder="e.g. Southern Eco Mills Ltd"
                    className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#7b859b] font-medium mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                  />
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

            {uploadStatusMsg && (
              <div className="text-[11px] text-[#cda052] animate-pulse">
                {uploadStatusMsg}
              </div>
            )}

            <div className="pt-3 border-t border-[#1c2233] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                title="Discard and close upload dialog"
                className="px-4 py-2 rounded-lg bg-[#141824] border border-[#22283a] text-xs text-[#8e97ae] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploading || !newTitle}
                onClick={handleCreateDocument}
                title="Save and upload document to vault"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow disabled:opacity-50 transition-all"
              >
                {isUploading ? 'Uploading to Supabase...' : 'Save to Vault'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
