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
  Maximize2,
  Pencil,
  Edit3,
  Save,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertCircle,
  Factory,
  Shirt
} from 'lucide-react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import { DocumentItem } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ModalPortal from '@/components/ui/ModalPortal';
import UniversalDocumentViewer from '@/components/documents/UniversalDocumentViewer';
import { useConfirm } from '@/lib/confirmContext';

export default function DocumentsPage() {
  const confirm = useConfirm();
  const { documents, addDocument, updateDocument, deleteDocument, vendors, pipelineItems } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewMode, setPreviewMode] = useState<'preview' | 'metadata'>('preview');

  // Edit Document Modal State
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDocType, setEditDocType] = useState<DocumentItem['documentType']>('Certificate');
  const [editVendorId, setEditVendorId] = useState('');
  const [editPipelineItemId, setEditPipelineItemId] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editStatus, setEditStatus] = useState<DocumentItem['status']>('Active');
  const [editTags, setEditTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSavedAlert, setEditSavedAlert] = useState(false);

  // New Document Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentItem['documentType']>('Certificate');
  const [newVendorId, setNewVendorId] = useState('');
  const [newPipelineItemId, setNewPipelineItemId] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.associatedVendor && doc.associatedVendor.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'All' || doc.documentType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleOpenEdit = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditDocType(doc.documentType);
    setEditVendorId(doc.vendorId || '');
    setEditPipelineItemId(doc.pipelineItemId || '');
    setEditExpiry(doc.expiryDate || '');
    setEditStatus(doc.status);
    setEditTags(doc.tags.join(', '));
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    setEditError(null);

    if (!editTitle || editTitle.trim().length < 2) {
      setEditError('Document title is required (minimum 2 characters).');
      return;
    }

    if (editExpiry) {
      const year = new Date(editExpiry).getFullYear();
      if (isNaN(year) || year < 2000 || year > 2100) {
        setEditError('Please enter a valid expiration date (between 2000 and 2100).');
        return;
      }
    }

    const linkedVendorName = vendors.find((v) => v.id === editVendorId)?.name;

    setIsSavingEdit(true);
    const patch = {
      title: editTitle.trim(),
      documentType: editDocType,
      vendorId: editVendorId || undefined,
      associatedVendor: linkedVendorName,
      pipelineItemId: editPipelineItemId || undefined,
      expiryDate: editExpiry || undefined,
      status: editStatus,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    await updateDocument(editingDoc.id, patch);
    setIsSavingEdit(false);
    setEditSavedAlert(true);
    if (previewDoc && previewDoc.id === editingDoc.id) {
      setPreviewDoc({ ...previewDoc, ...patch });
    }
    setTimeout(() => {
      setEditSavedAlert(false);
      setEditingDoc(null);
    }, 1200);
  };

  // Handle file selection from local device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (file) {
      // 1. File size validation (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('File size exceeds the 50MB maximum upload limit.');
        return;
      }

      // 2. Extension validation
      const ext = file.name.split('.').pop()?.toLowerCase();
      const allowedExts = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'png', 'jpg', 'jpeg'];
      if (!ext || !allowedExts.includes(ext)) {
        setUploadError(`Unsupported format (.${ext}). Accepted: PDF, Word (DOCX), Excel (XLSX), and Images (PNG/JPG).`);
        return;
      }

      setSelectedFile(file);
      if (!newTitle) {
        // Auto-generate title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewTitle(cleanName);
      }
    }
  };

  const handleCreateDocument = async () => {
    setUploadError(null);

    if (!newTitle || newTitle.trim().length < 2) {
      setUploadError('Document title is required (minimum 2 characters).');
      return;
    }

    if (newExpiry) {
      const year = new Date(newExpiry).getFullYear();
      if (isNaN(year) || year < 2000 || year > 2100) {
        setUploadError('Please specify a valid expiration date (between 2000 and 2100).');
        return;
      }
    }


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

      // 1. Upload to Supabase Storage if configured.
      // A blob: URL only exists in this tab's memory for this session - it can
      // never be opened later, on another device, or after a reload. Previously
      // a failed cloud upload silently fell back to one anyway, so the document
      // record looked saved but its preview/download was permanently broken.
      // Now a real upload failure aborts the save and tells the user to retry.
      if (isSupabaseConfigured && supabase) {
        setUploadStatusMsg('Uploading file to Supabase Cloud Storage...');
        const safeName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = `documents/${safeName}`;

        try {
          const { data, error } = await supabase.storage
            .from('vault-files')
            .upload(filePath, selectedFile, {
              cacheControl: '3600',
              upsert: true,
            });

          if (error || !data) {
            throw error || new Error('Upload returned no data.');
          }

          const { data: urlData } = supabase.storage
            .from('vault-files')
            .getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
        } catch (err: any) {
          console.error('Upload error:', err);
          setUploadError(`Cloud upload failed: ${err?.message || 'unknown error'}. The document was not saved - please try again.`);
          setIsUploading(false);
          return;
        }
      } else {
        fileUrl = URL.createObjectURL(selectedFile);
      }
    }

    setUploadStatusMsg('Saving metadata to database...');

    const linkedVendorName = vendors.find((v) => v.id === newVendorId)?.name;

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
      vendorId: newVendorId || undefined,
      associatedVendor: linkedVendorName,
      pipelineItemId: newPipelineItemId || undefined,
    });

    setIsUploading(false);
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setNewTitle('');
    setNewVendorId('');
    setNewPipelineItemId('');
    setNewExpiry('');
    setNewTags('');
  };

  const handleDelete = async (doc: DocumentItem) => {
    const ok = await confirm({
      title: 'Remove Document Record',
      message: `Are you sure you want to remove "${doc.title}" (${doc.fileName}) from the document vault? This cannot be undone.`,
      confirmLabel: 'Remove Document',
      danger: true,
    });
    if (!ok) return;
    deleteDocument(doc.id);
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

      {/* Documents Rows View */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#1f2638] rounded-2xl bg-[#080b12]">
          <FileText className="w-8 h-8 text-[#4a5266] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white mb-1">No documents found</h3>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto mb-4">
            Upload your GOTS organic certificates, OEKO-TEX compliance reports, or vendor contracts to store them in your Supabase vault.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload GOTS, OEKO-TEX, or contract to vault"
            className="px-4 py-2 rounded-xl bg-[#151a28] border border-[#263148] text-xs font-semibold text-[#cda052] hover:bg-[#1a2236] transition-colors cursor-pointer"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="bg-[#0e121b] border border-[#1b2234] rounded-2xl shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-[#080a10] border-b border-[#1b2234] text-[11px] font-semibold text-[#828ea6] uppercase tracking-wider">
            <div className="col-span-4">Document Title & File</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Linked Partner / Style</div>
            <div className="col-span-2">Validity & Expiry</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#161c2a]">
            {filtered.map((doc) => {
              const linkedVendor = doc.vendorId ? vendors.find((v) => v.id === doc.vendorId) : null;
              const linkedStyle = doc.pipelineItemId ? pipelineItems.find((p) => p.id === doc.pipelineItemId) : null;
              const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();

              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-5 sm:py-3.5 flex flex-col lg:grid lg:grid-cols-12 gap-3 items-start lg:items-center hover:bg-[#121624] transition-colors"
                >
                  {/* Col 1: Document Title, Format & Filename (col-span-4) */}
                  <div className="lg:col-span-4 min-w-0 flex items-start sm:items-center gap-3 w-full">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold flex-shrink-0 ${getFormatBadge(doc.fileFormat)}`}>
                      {doc.fileFormat.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        onClick={() => {
                          setPreviewDoc(doc);
                          setPreviewMode('preview');
                        }}
                        className="text-xs font-semibold text-white hover:text-[#cda052] cursor-pointer truncate transition-colors"
                        title={doc.title}
                      >
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-[#7c869d] truncate flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{doc.fileName}</span>
                        {doc.fileSizeBytes ? (
                          <>
                            <span>•</span>
                            <span className="font-mono flex-shrink-0">{(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Category & Tags (col-span-2) */}
                  <div className="lg:col-span-2 min-w-0 w-full">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white/[0.04] text-[#cbd5e1] border border-white/[0.08] font-medium">
                      {doc.documentType}
                    </span>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="text-[10px] text-[#7c869d] font-mono">
                            #{t}
                          </span>
                        ))}
                        {doc.tags.length > 2 && (
                          <span className="text-[10px] text-[#556075]">+{doc.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Col 3: Linked Partner / Style (col-span-2) */}
                  <div className="lg:col-span-2 min-w-0 w-full text-xs">
                    {linkedVendor || doc.associatedVendor ? (
                      <Link
                        href="/vendors"
                        title="Open manufacturer details"
                        className="flex items-center gap-1.5 text-amber-300 hover:underline truncate"
                      >
                        <Factory className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{linkedVendor?.name || doc.associatedVendor}</span>
                      </Link>
                    ) : linkedStyle ? (
                      <Link
                        href="/pipeline"
                        title="Open style pipeline"
                        className="flex items-center gap-1.5 text-sky-300 hover:underline truncate"
                      >
                        <Shirt className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{linkedStyle.styleName}</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-[#64748b]">Global Brand Asset</span>
                    )}
                  </div>

                  {/* Col 4: Validity & Expiry (col-span-2) */}
                  <div className="lg:col-span-2 min-w-0 w-full flex items-center gap-2 text-xs">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        isExpired
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          : doc.status === 'Active'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          : 'bg-[#182030] text-[#94a3b8] border border-[#263148]'
                      }`}
                    >
                      {doc.status}
                    </span>
                    <span className="text-[11px] text-[#8895ad] font-mono truncate">
                      {doc.expiryDate ? doc.expiryDate : 'Permanent'}
                    </span>
                  </div>

                  {/* Col 5: Actions (col-span-2) */}
                  <div className="lg:col-span-2 w-full flex items-center justify-end gap-1.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.04]">
                    <button
                      onClick={() => {
                        setPreviewDoc(doc);
                        setPreviewMode('preview');
                      }}
                      className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2133] border border-[#242e44] text-[#cbd5e1] hover:text-[#cda052] transition-colors cursor-pointer"
                      title="Preview Document in Universal Viewer"
                      aria-label="Preview document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(doc)}
                      className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2133] border border-[#242e44] text-[#cbd5e1] hover:text-[#cda052] transition-colors cursor-pointer"
                      title="Edit metadata & expiry date"
                      aria-label="Edit document metadata"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 rounded-lg bg-[#141824] hover:bg-rose-950/30 border border-[#242e44] text-[#cbd5e1] hover:text-rose-400 hover:border-rose-900/50 transition-colors cursor-pointer"
                      title="Delete document"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In-App Document Preview & Read View Modal (Universal Viewer) */}
      {previewDoc && (
        <ModalPortal isOpen={Boolean(previewDoc)}>
          <UniversalDocumentViewer
            doc={previewDoc}
            onClose={() => setPreviewDoc(null)}
            onEditExpiry={(doc) => {
              handleOpenEdit(doc);
            }}
          />
        </ModalPortal>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <ModalPortal isOpen={isUploadModalOpen}>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsUploadModalOpen(false)}
          >
            <div 
              className="w-full max-w-lg bg-[#0e111a] border border-[#242b3d] rounded-xl p-6 shadow-2xl relative space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
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
                    placeholder="e.g. Fabric Mill GOTS Scope Certificate 2026"
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
                    <select
                      value={newVendorId}
                      onChange={(e) => setNewVendorId(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                    >
                      <option value="">None</option>
                      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#7b859b] font-medium mb-1">Related Style</label>
                    <select
                      value={newPipelineItemId}
                      onChange={(e) => setNewPipelineItemId(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                    >
                      <option value="">None</option>
                      {pipelineItems.map((p) => <option key={p.id} value={p.id}>{p.styleName}{p.hsnCode ? ` (HSN: ${p.hsnCode})` : ''}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#7b859b] font-medium mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={newExpiry}
                      onChange={(e) => setNewExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283a] text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
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

              {uploadError && (
                <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

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
                  className="px-4 py-2 rounded-lg bg-[#141824] border border-[#22283a] text-xs text-[#cbd5e1] hover:text-white transition-colors"
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
        </ModalPortal>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <ModalPortal isOpen={Boolean(editingDoc)}>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setEditingDoc(null)}
          >
            <div 
              className="w-full max-w-lg bg-[#0e111a] border border-[#242b3d] rounded-2xl p-6 shadow-2xl relative space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setEditingDoc(null)}
                className="absolute top-4 right-4 text-[#94a3b8] hover:text-white p-1 rounded-lg hover:bg-[#182030] transition-colors"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#cda052]">
                    <Pencil className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">Edit Document & Compliance Expiry</h3>
                </div>
                <p className="text-xs text-[#94a3b8]">
                  Update compliance expiration deadlines, vendor associations, and certification statuses.
                </p>
              </div>

              {editError && (
                <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editSavedAlert && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Document updated and synced to Supabase!</span>
                </div>
              )}


              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Document Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#080b12] border border-[#242d40] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-1">Document Type</label>
                    <select
                      value={editDocType}
                      onChange={(e) => setEditDocType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-[#080b12] border border-[#242d40] text-white outline-none focus:border-[#cda052] transition-colors"
                    >
                      <option value="Certificate">Certificate</option>
                      <option value="Tech Pack">Tech Pack</option>
                      <option value="Legal & Contract">Legal & Contract</option>
                      <option value="Audit Report">Audit Report</option>
                      <option value="Specification">Specification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-1">Compliance Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-[#080b12] border border-[#242d40] text-white outline-none focus:border-[#cda052] transition-colors"
                    >
                      <option value="Active">Active</option>
                      <option value="Expiring Soon">Expiring Soon</option>
                      <option value="Expired">Expired</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-1">
                      Compliance Expiry Date
                    </label>
                    <input
                      type="date"
                      value={editExpiry}
                      onChange={(e) => setEditExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#080b12] border border-[#242d40] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 font-mono transition-colors"
                    />
                    <span className="text-[10px] text-[#94a3b8] mt-0.5 block">Leave empty for Permanent</span>
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-1">Associated Mill / Vendor</label>
                    <select
                      value={editVendorId}
                      onChange={(e) => setEditVendorId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#080b12] border border-[#242d40] text-white outline-none focus:border-[#cda052] transition-colors"
                    >
                      <option value="">None</option>
                      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-1">Related Style</label>
                    <select
                      value={editPipelineItemId}
                      onChange={(e) => setEditPipelineItemId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#080b12] border border-[#242d40] text-white outline-none focus:border-[#cda052] transition-colors"
                    >
                      <option value="">None</option>
                      {pipelineItems.map((p) => <option key={p.id} value={p.id}>{p.styleName}{p.hsnCode ? ` (HSN: ${p.hsnCode})` : ''}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="GOTS, Organic, Cotton, FW26"
                    className="w-full px-3 py-2 rounded-lg bg-[#080b12] border border-[#242d40] text-white outline-none focus:border-[#cda052] transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1f273a] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-lg bg-[#141824] border border-[#242e44] text-[#cbd5e1] hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black text-xs font-bold hover:brightness-110 shadow-glow flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Saving to Cloud...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
