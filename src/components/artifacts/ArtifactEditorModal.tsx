'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Eye, 
  Code, 
  Save, 
  CheckCircle, 
  ArrowUpRight,
  Eraser,
  Tag,
  AlertCircle
} from 'lucide-react';
import { ArtifactItem, ArtifactStatus } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';

interface ArtifactEditorModalProps {
  artifact?: ArtifactItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (artifact: Partial<ArtifactItem>) => void;
}

export default function ArtifactEditorModal({
  artifact,
  isOpen,
  onClose,
  onSave,
}: ArtifactEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ArtifactItem['category']>('Operations');
  const [tags, setTags] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [source, setSource] = useState('Claude 3.7 Sonnet');
  const [version, setVersion] = useState('1.0');
  const [isPromoted, setIsPromoted] = useState(false);
  const [status, setStatus] = useState<ArtifactStatus>('inbox');
  const [routeSlug, setRouteSlug] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [activeTab, setActiveTab] = useState<'split' | 'code' | 'preview'>('split');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (artifact) {
      setTitle(artifact.title);
      setDescription(artifact.description);
      setCategory(artifact.category);
      setTags(artifact.tags.join(', '));
      setHtmlContent(artifact.htmlContent);
      setSource(artifact.source);
      setVersion(artifact.version);
      setIsPromoted(artifact.isPromoted);
      setStatus(artifact.status);
      setRouteSlug(artifact.routeSlug || '');
      setExpiryDate(artifact.expiryDate || '');
    } else {
      // Default blank for new artifact
      setTitle('');
      setDescription('');
      setCategory('Calculators');
      setTags('Claude, Custom Tool');
      setHtmlContent(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0c0e14; color: #fff; font-family: sans-serif; padding: 24px; }
    h1 { color: #cda052; font-size: 1.5rem; }
  </style>
</head>
<body>
  <h1>New Claude Artifact</h1>
  <p>Paste your HTML artifact code here...</p>
</body>
</html>`);
      setSource('Claude 3.7 Sonnet');
      setVersion('1.0');
      setIsPromoted(false);
      setStatus('inbox');
      setRouteSlug('');
      setExpiryDate('');
    }
  }, [artifact, isOpen]);

  if (!isOpen) return null;

  // Auto-generate slug when title changes if slug is empty
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!artifact) {
      setRouteSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  // Quick cleaner to strip common Claude intro conversational lines
  const handleCleanBoilerplate = () => {
    let cleaned = htmlContent;
    // Strip common Markdown wrappers if user pasted raw markdown codeblock
    cleaned = cleaned.replace(/^```html\s*/i, '').replace(/```\s*$/i, '');
    // Clean leading explanatory text before <!DOCTYPE or <html>
    const docTypeIdx = cleaned.indexOf('<!DOCTYPE');
    const htmlIdx = cleaned.indexOf('<html');
    const startIdx = docTypeIdx !== -1 ? docTypeIdx : htmlIdx;
    if (startIdx > 0) {
      cleaned = cleaned.slice(startIdx);
    }
    setHtmlContent(cleaned);
  };

  const handleSave = () => {
    setValidationError(null);

    if (!title || title.trim().length < 2) {
      setValidationError('Artifact title is required (minimum 2 characters).');
      return;
    }

    const generatedSlug = routeSlug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(generatedSlug)) {
      setValidationError('Slug must contain only lowercase letters, numbers, and hyphens (e.g. "fabric-yield-calc").');
      return;
    }

    if (!htmlContent || htmlContent.trim().length < 10) {
      setValidationError('HTML content is required (minimum 10 characters).');
      return;
    }

    if (expiryDate) {
      const year = new Date(expiryDate).getFullYear();
      if (isNaN(year) || year < 2000 || year > 2100) {
        setValidationError('Please enter a valid expiration date (between 2000 and 2100).');
        return;
      }
    }

    const formattedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description,
      category,
      tags: formattedTags,
      htmlContent,
      source,
      version,
      isPromoted,
      status: isPromoted ? 'promoted' : status,
      routeSlug: generatedSlug,
      expiryDate: expiryDate || undefined,
    });
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-6xl h-[94vh] sm:h-[90vh] bg-[#0c0f17] border border-[#22283a] rounded-xl flex flex-col shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#1e2638] bg-[#0e121b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide truncate">
                {artifact ? 'Curate & Clean Artifact' : 'Add New Claude Artifact'}
              </h3>
              <p className="text-xs text-[#94a3b8] truncate">
                Review code, remove unwanted text, and promote to a dedicated page
              </p>
            </div>
          </div>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end w-full sm:w-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#141824] p-0.5 rounded-lg border border-[#263147]">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'code' ? 'bg-[#222a3d] text-white font-medium shadow-sm' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden md:inline-block px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'split' ? 'bg-[#222a3d] text-[#e6c875] font-medium shadow-sm' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'preview' ? 'bg-[#222a3d] text-white font-medium shadow-sm' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Preview
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow active:scale-[0.98] transition-transform"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#94a3b8] hover:text-white rounded-lg hover:bg-[#1a2030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {validationError && (
          <div className="p-3 mx-4 sm:mx-6 mt-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-2 animate-fade-in font-medium flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Metadata Configuration Bar */}

        <div className="px-4 sm:px-6 py-3.5 border-b border-[#1e2638] bg-[#090c13] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
              Artifact Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Fabric Yield Estimator"
              className="w-full px-3 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
            >
              <option value="Calculators">Calculators</option>
              <option value="Operations">Operations</option>
              <option value="Visual Pitch">Visual Pitch</option>
              <option value="Production">Production</option>
              <option value="Marketing">Marketing</option>
              <option value="Custom">Custom Tool</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
              URL Route Slug
            </label>
            <div className="flex items-center rounded-lg bg-[#07090e] border border-[#263147] px-2.5 focus-within:border-[#cda052] focus-within:ring-1 focus-within:ring-[#cda052]/40">
              <span className="text-xs text-[#94a3b8] font-mono">/tools/</span>
              <input
                type="text"
                value={routeSlug}
                onChange={(e) => setRouteSlug(e.target.value)}
                placeholder="slug"
                className="w-full py-1.5 bg-transparent text-white outline-none text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
              Review / Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors text-xs font-mono"
            />
          </div>

          {/* Promotion & Status Toggle */}
          <div className="flex items-center justify-between sm:pt-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPromoted}
                onChange={(e) => setIsPromoted(e.target.checked)}
                className="w-4 h-4 rounded text-[#cda052] focus:ring-0 bg-[#07090e] border-[#263147]"
              />
              <div>
                <span className="text-xs font-semibold text-[#e6c875] block">
                  Promote to App Page
                </span>
                <span className="text-[10px] text-[#94a3b8] block">
                  Pins to sidebar under &quot;Custom Tools&quot;
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Editor Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Code Editor Pane */}
          {(activeTab === 'split' || activeTab === 'code') && (
            <div className={`flex flex-col border-b md:border-b-0 md:border-r border-[#1e2638] ${activeTab === 'split' ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full h-full'}`}>
              <div className="px-4 py-2.5 bg-[#0a0d14] border-b border-[#1e2638] flex items-center justify-between text-xs text-[#94a3b8]">
                <span className="flex items-center gap-1.5 font-mono">
                  <Code className="w-3.5 h-3.5 text-[#cda052]" /> HTML / CSS / JS Source
                </span>
                <button
                  type="button"
                  onClick={handleCleanBoilerplate}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141824] border border-[#263147] text-[#e6c875] hover:bg-[#1c2234] hover:text-white transition-colors"
                  title="Strip Markdown ticks and leading Claude chat text"
                >
                  <Eraser className="w-3 h-3" />
                  <span className="hidden sm:inline">Auto-Clean Boilerplate</span>
                  <span className="sm:hidden">Clean</span>
                </button>
              </div>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="flex-1 w-full bg-[#07090e] text-[#f1f5f9] font-mono text-xs p-4 outline-none resize-none leading-relaxed selection:bg-[#cda052]/30 focus:ring-1 focus:ring-[#cda052]/20"
                spellCheck={false}
              />
            </div>
          )}

          {/* Live Preview Pane */}
          {(activeTab === 'split' || activeTab === 'preview') && (
            <div className={`flex flex-col bg-[#07090e] ${activeTab === 'split' ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full h-full'}`}>
              <div className="px-4 py-2.5 bg-[#0a0d14] border-b border-[#1e2638] text-xs text-[#94a3b8] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> Live Rendered Sandbox Preview
                </span>
                <span className="text-[11px] text-[#94a3b8]/80 font-mono">Updates live as you type</span>
              </div>
              <div className="flex-1 p-3">
                <div className="w-full h-full bg-white rounded-lg overflow-hidden border border-[#263147] shadow-inner">
                  <iframe
                    srcDoc={
                      (htmlContent || '').includes('<head>')
                        ? htmlContent.replace(
                            '<head>',
                            `<head><meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob:; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'none';">`
                          )
                        : `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob:; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'none';">${htmlContent || ''}`
                    }
                    title="Live Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-forms allow-modals"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
