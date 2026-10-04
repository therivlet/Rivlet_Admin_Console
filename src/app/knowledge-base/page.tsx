'use client';

import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Lock,
  ShieldCheck,
  Edit3,
  Trash2,
  Save,
  Tag,
  Calendar,
  User,
  FolderOpen,
  ChevronRight,
  AlertCircle,
  Eye,
  Code,
  Upload
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { KBArticle } from '@/lib/types';
import { renderMarkdown } from '@/lib/markdown';
import { useConfirm } from '@/lib/confirmContext';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function KnowledgeBaseContent() {
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const articleParam = searchParams.get('article') || searchParams.get('id');
  const { kbArticles, saveArticle, deleteArticle } = useAdminStore();
  const [selectedArticleId, setSelectedArticleId] = useState<string>(() => articleParam || kbArticles[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (articleParam && kbArticles.some(a => a.id === articleParam)) {
      setSelectedArticleId(articleParam);
    }
  }, [articleParam, kbArticles]);

  // Editor states
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<KBArticle['category']>('Vendors & Mills');
  const [editContent, setEditContent] = useState('');
  const [editIsConfidential, setEditIsConfidential] = useState(false);
  const [editTags, setEditTags] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadMdFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setEditContent(text);
      if (!editTitle || editTitle === 'New SOP / Operational Guide') {
        setEditTitle(file.name.replace(/\.mdx?$/i, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentArticle = kbArticles.find((a) => a.id === selectedArticleId) || kbArticles[0];

  const handleStartEdit = (article: KBArticle) => {
    setEditTitle(article.title);
    setEditCategory(article.category);
    setEditContent(article.content);
    setEditIsConfidential(article.isConfidential);
    setEditTags(article.tags.join(', '));
    setEditError(null);
    setIsEditing(true);
  };

  const handleNewArticle = () => {
    const newArt: KBArticle = {
      id: `kb-${Date.now()}`,
      title: 'New SOP / Operational Guide',
      slug: `new-guide-${Date.now()}`,
      category: 'Business Operations',
      content: '# New Operational Standard\n\nWrite standard operating procedures, supplier contracts, or specifications here...',
      isConfidential: true,
      author: 'Rivlet Executive',
      tags: ['SOP', 'Operations'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveArticle(newArt);
    setSelectedArticleId(newArt.id);
    handleStartEdit(newArt);
  };

  const handleSaveArticle = () => {
    if (!currentArticle) return;
    setEditError(null);

    if (!editTitle || editTitle.trim().length < 3) {
      setEditError('Article title is required (minimum 3 characters).');
      return;
    }

    if (!editContent || editContent.trim().length < 5) {
      setEditError('Article content is required (minimum 5 characters).');
      return;
    }

    saveArticle({
      ...currentArticle,
      title: editTitle.trim(),
      category: editCategory,
      content: editContent,
      isConfidential: editIsConfidential,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleDeleteArticle = async (article: KBArticle) => {
    const ok = await confirm({
      title: 'Delete SOP Article',
      message: `Are you sure you want to permanently delete "${article.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Article',
      danger: true,
    });
    if (!ok) return;
    deleteArticle(article.id);
  };

  const filteredArticles = kbArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2638] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-serif">
              Confidential Brand Knowledge Base & SOPs
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.35)] font-semibold">
              Master Wiki & Operations Manual
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94a3b8]">
            Secure centralized documentation for vendor mills, AQL 2.5 quality standards, and confidential business recipes.
          </p>
        </div>

        <button
          onClick={handleNewArticle}
          title="Create a new SOP or confidential operational guide"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow self-start sm:self-auto flex-shrink-0 transition-transform active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New SOP / Article</span>
        </button>
      </div>

      {/* Main Grid: Sidebar + Article View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Article Directory (4 columns) */}
        <div className="md:col-span-4 bg-[#0e121b] border border-[#1e2638] rounded-xl p-4 flex flex-col space-y-4 shadow-lg">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base & tags..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#07090e] border border-[#263147] text-xs text-white placeholder-[#64748b] outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
            />
          </div>

          {/* Article List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredArticles.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#94a3b8]">
                No articles found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredArticles.map((article) => {
                const isSelected = article.id === selectedArticleId;
                return (
                  <div
                    key={article.id}
                    onClick={() => {
                      setSelectedArticleId(article.id);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#141824] border-[#cda052]/60 shadow-md ring-1 ring-[#cda052]/30'
                        : 'bg-[#0a0d14] border-[#1e2638]/70 hover:bg-[#111622] hover:border-[#2a354c]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-[10px] font-bold text-[#cda052] uppercase tracking-wider">
                        {article.category}
                      </span>
                      {article.isConfidential && (
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-medium">
                          <Lock className="w-2.5 h-2.5" />
                          Confidential
                        </span>
                      )}
                    </div>
                    <h4 className={`text-xs font-semibold line-clamp-2 leading-snug ${isSelected ? 'text-white' : 'text-[#cbd5e1]'}`}>
                      {article.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2.5 text-[11px] text-[#94a3b8]">
                      <span className="font-medium truncate max-w-[120px]">{article.author}</span>
                      <span className="font-mono text-[10px]">{new Date(article.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Article Viewer / Editor (8 columns) */}
        <div className="md:col-span-8 bg-[#0e121b] border border-[#1e2638] rounded-xl p-5 sm:p-7 flex flex-col justify-between shadow-lg">
          {currentArticle ? (
            <div>
              {/* Header / Actions */}
              <div className="flex items-center justify-between border-b border-[#1e2638] pb-4 mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-[rgba(205,160,82,0.14)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] font-semibold">
                    {isEditing ? editCategory : currentArticle.category}
                  </span>
                  {(isEditing ? editIsConfidential : currentArticle.isConfidential) && (
                    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      Confidential SOP
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveArticle}
                      title="Save SOP revisions to database"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Article</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(currentArticle)}
                      title="Edit standard operating procedure content and metadata"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#141824] border border-[#263147] text-xs font-semibold text-[#cbd5e1] hover:text-white hover:border-[#cda052]/50 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit SOP</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteArticle(currentArticle)}
                    className="p-2 rounded-lg bg-[#141824] border border-[#263147] text-[#94a3b8] hover:text-rose-400 hover:border-rose-800/50 transition-colors"
                    title="Delete SOP article from database"
                    aria-label="Delete SOP article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewer or Editor Mode */}
              {isEditing ? (
                <div className="space-y-4 text-xs">
                  {editError && (
                    <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
                      Article Title

                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-sm text-white font-bold outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40"
                      >
                        <option value="Vendors & Mills">Vendors & Mills</option>
                        <option value="Quality & AQL">Quality & AQL</option>
                        <option value="Brand Guidelines">Brand Guidelines</option>
                        <option value="Garment Specs">Garment Specs</option>
                        <option value="Business Operations">Business Operations</option>
                        <option value="Finance & Unit Economics">Finance & Unit Economics</option>
                      </select>
                    </div>

                    <div className="flex items-center sm:pt-6">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsConfidential}
                          onChange={(e) => setEditIsConfidential(e.target.checked)}
                          className="w-4 h-4 rounded text-[#cda052] bg-[#07090e] border-[#263147] focus:ring-0"
                        />
                        <span className="font-semibold text-rose-300 text-xs">
                          Mark as Admin Confidential
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="e.g. GSM, Cotton, Mills, Dyeing"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-xs text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider">
                        Markdown Content & Operational Details
                      </label>
                      <div className="flex items-center gap-2">
                        <input ref={fileInputRef} type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={handleUploadMdFile} />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          title="Upload a .md file to replace this content"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141824] border border-[#263147] text-[#94a3b8] hover:text-white text-[11px] font-medium transition-colors"
                        >
                          <Upload className="w-3 h-3" /> Upload .md
                        </button>
                        <div className="flex items-center bg-[#07090e] p-0.5 rounded-lg border border-[#263147]">
                          <button
                            type="button"
                            onClick={() => setEditorMode('write')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${editorMode === 'write' ? 'bg-[#141824] text-[#e6c875]' : 'text-[#94a3b8] hover:text-white'}`}
                          >
                            <Code className="w-3 h-3" /> Write
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorMode('preview')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${editorMode === 'preview' ? 'bg-[#141824] text-[#e6c875]' : 'text-[#94a3b8] hover:text-white'}`}
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                        </div>
                      </div>
                    </div>
                    {editorMode === 'write' ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={16}
                        className="w-full bg-[#07090e] border border-[#263147] text-[#e2e8f0] font-mono text-xs p-4 rounded-lg outline-none leading-relaxed focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40"
                      />
                    ) : (
                      <div
                        className="w-full min-h-[26rem] max-h-[32rem] overflow-y-auto bg-[#07090e] border border-[#263147] rounded-lg p-4 kb-markdown"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) || '<p class="text-[#5f6c85] italic">Nothing to preview yet.</p>' }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-wide leading-tight">
                    {currentArticle.title}
                  </h2>

                  <div className="flex items-center gap-4 text-xs text-[#94a3b8] border-b border-[#1e2638] pb-3.5 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#cda052]" />
                      <strong className="text-[#cbd5e1] font-medium">{currentArticle.author}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#cda052]" />
                      <span>Updated: <strong className="text-[#cbd5e1] font-medium font-mono">{new Date(currentArticle.updatedAt).toLocaleDateString()}</strong></span>
                    </span>
                  </div>

                  {/* Rendered markdown content */}
                  <div
                    className="kb-markdown border-l-2 border-[#cda052]/40 pl-4 py-1"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(currentArticle.content) }}
                  />

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 pt-6 border-t border-[#1e2638]">
                    {currentArticle.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-[#141824] text-[#cbd5e1] border border-[#263147] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-[#94a3b8] text-xs">
              Select or create an article to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#94a3b8]">Loading Confidential Brand KB...</div>}>
      <KnowledgeBaseContent />
    </Suspense>
  );
}
