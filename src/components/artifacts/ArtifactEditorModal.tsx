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
  Tag
} from 'lucide-react';
import { ArtifactItem, ArtifactStatus } from '@/lib/types';

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
  const [activeTab, setActiveTab] = useState<'split' | 'code' | 'preview'>('split');

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
    const formattedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const generatedSlug = routeSlug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    onSave({
      title: title || 'Untitled Artifact',
      description,
      category,
      tags: formattedTags,
      htmlContent,
      source,
      version,
      isPromoted,
      status: isPromoted ? 'promoted' : status,
      routeSlug: generatedSlug,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-6xl h-[94vh] sm:h-[90vh] bg-[#0c0f17] border border-[#22283a] rounded-xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#1c2233] bg-[#0f121d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#cda052] flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {artifact ? 'Curate & Clean Artifact' : 'Add New Claude Artifact'}
              </h3>
              <p className="text-[11px] text-[#717a8f] truncate">
                Review code, remove unwanted text, and promote to a dedicated page
              </p>
            </div>
          </div>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end w-full sm:w-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#171b28] p-0.5 rounded-lg border border-[#252c40]">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  activeTab === 'code' ? 'bg-[#252c40] text-white font-medium' : 'text-[#7d879e]'
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden md:inline-block px-2.5 py-1 text-xs rounded transition-colors ${
                  activeTab === 'split' ? 'bg-[#252c40] text-[#cda052] font-medium' : 'text-[#7d879e]'
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  activeTab === 'preview' ? 'bg-[#252c40] text-white font-medium' : 'text-[#7d879e]'
                }`}
              >
                Preview
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#6c7489] hover:text-white rounded-lg hover:bg-[#1a1f2f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Metadata Configuration Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#1c2233] bg-[#121522] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1">
              Artifact Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Fabric Yield Estimator"
              className="w-full px-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white outline-none focus:border-[#cda052]"
            />
          </div>


          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white outline-none focus:border-[#cda052]"
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
            <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1">
              URL Route Slug
            </label>
            <div className="flex items-center rounded bg-[#090b12] border border-[#22283b] px-2">
              <span className="text-[10px] text-[#555d72]">/tools/</span>
              <input
                type="text"
                value={routeSlug}
                onChange={(e) => setRouteSlug(e.target.value)}
                placeholder="slug"
                className="w-full py-1.5 bg-transparent text-white outline-none text-xs"
              />
            </div>
          </div>

          {/* Promotion & Status Toggle */}
          <div className="flex items-center justify-between pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPromoted}
                onChange={(e) => setIsPromoted(e.target.checked)}
                className="w-4 h-4 rounded text-[#cda052] focus:ring-0 bg-[#090b12] border-[#22283b]"
              />
              <div>
                <span className="text-xs font-semibold text-[#e6c875] block">
                  Promote to App Page
                </span>
                <span className="text-[10px] text-[#6d7589] block">
                  Pins to sidebar under "Custom Tools"
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Editor Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Code Editor Pane */}
          {(activeTab === 'split' || activeTab === 'code') && (
            <div className={`flex flex-col border-b md:border-b-0 md:border-r border-[#1c2233] ${activeTab === 'split' ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full h-full'}`}>
              <div className="px-4 py-2 bg-[#0d1018] border-b border-[#1a1f2e] flex items-center justify-between text-[11px] text-[#747d92]">
                <span className="flex items-center gap-1.5 font-mono">
                  <Code className="w-3.5 h-3.5 text-[#cda052]" /> HTML / CSS / JS Source
                </span>
                <button
                  type="button"
                  onClick={handleCleanBoilerplate}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#171c2a] border border-[#262f46] text-[#cda052] hover:bg-[#20273a]"
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
                className="flex-1 w-full bg-[#080a10] text-[#cfd5e4] font-mono text-xs p-4 outline-none resize-none leading-relaxed selection:bg-[#cda052]/30"
                spellCheck={false}
              />
            </div>
          )}

          {/* Live Preview Pane */}
          {(activeTab === 'split' || activeTab === 'preview') && (
            <div className={`flex flex-col bg-[#07080c] ${activeTab === 'split' ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full h-full'}`}>
              <div className="px-4 py-2 bg-[#0d1018] border-b border-[#1a1f2e] text-[11px] text-[#747d92] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> Live Rendered Sandbox Preview
                </span>
                <span className="text-[10px] text-[#555d72]">Updates live as you type</span>
              </div>
              <div className="flex-1 p-3">
                <div className="w-full h-full bg-white rounded-lg overflow-hidden border border-[#202638] shadow-inner">
                  <iframe
                    srcDoc={htmlContent}
                    title="Live Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
