'use client';

import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { KBArticle } from '@/lib/types';

export default function KnowledgeBasePage() {
  const { kbArticles, saveArticle, deleteArticle } = useAdminStore();
  const [selectedArticleId, setSelectedArticleId] = useState<string>(kbArticles[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Editor states
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<KBArticle['category']>('Vendors & Mills');
  const [editContent, setEditContent] = useState('');
  const [editIsConfidential, setEditIsConfidential] = useState(false);
  const [editTags, setEditTags] = useState('');

  const currentArticle = kbArticles.find((a) => a.id === selectedArticleId) || kbArticles[0];

  const handleStartEdit = (article: KBArticle) => {
    setEditTitle(article.title);
    setEditCategory(article.category);
    setEditContent(article.content);
    setEditIsConfidential(article.isConfidential);
    setEditTags(article.tags.join(', '));
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
    saveArticle({
      ...currentArticle,
      title: editTitle,
      category: editCategory,
      content: editContent,
      isConfidential: editIsConfidential,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const filteredArticles = kbArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-wide font-serif">
              Confidential Brand Knowledge Base & SOPs
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold">
              Master Wiki & Operations Manual
            </span>
          </div>
          <p className="text-xs text-[#7c859c]">
            Secure centralized documentation for vendor mills, AQL 2.5 quality standards, and confidential business recipes.
          </p>
        </div>

        <button
          onClick={handleNewArticle}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow self-start sm:self-auto flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New SOP / Article</span>
        </button>
      </div>

      {/* Main Grid: Sidebar + Article View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Article Directory (4 columns) */}
        <div className="md:col-span-4 bg-[#111420] border border-[#1e2436] rounded-xl p-4 flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#687186]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0c13] border border-[#212739] text-xs text-white placeholder-[#5c6478] outline-none focus:border-[#cda052]"
            />
          </div>

          {/* Article List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredArticles.map((article) => {
              const isSelected = article.id === selectedArticleId;
              return (
                <div
                  key={article.id}
                  onClick={() => {
                    setSelectedArticleId(article.id);
                    setIsEditing(false);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#181d2c] border-[#cda052]/50 shadow-sm'
                      : 'bg-[#0d1017] border-transparent hover:bg-[#141824]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-[#cda052] uppercase tracking-wide">
                      {article.category}
                    </span>
                    {article.isConfidential && (
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-400 border border-rose-800/40">
                        <Lock className="w-2.5 h-2.5" />
                        Confidential
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-semibold line-clamp-2 ${isSelected ? 'text-white' : 'text-[#a2aabf]'}`}>
                    {article.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-[#636c82]">
                    <span>{article.author}</span>
                    <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Article Viewer / Editor (8 columns) */}
        <div className="md:col-span-8 bg-[#111420] border border-[#1e2436] rounded-xl p-6 flex flex-col justify-between">
          {currentArticle ? (
            <div>
              {/* Header / Actions */}
              <div className="flex items-center justify-between border-b border-[#1b2132] pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-[rgba(205,160,82,0.12)] text-[#cda052] font-semibold">
                    {isEditing ? editCategory : currentArticle.category}
                  </span>
                  {(isEditing ? editIsConfidential : currentArticle.isConfidential) && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-rose-950/70 text-rose-400 border border-rose-800/40 font-semibold">
                      <Lock className="w-3 h-3" />
                      Confidential SOP
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveArticle}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Article</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(currentArticle)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#161a26] border border-[#262c3e] text-xs font-semibold text-[#8e97ae] hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${currentArticle.title}"?`)) {
                        deleteArticle(currentArticle.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-[#161a26] border border-[#262c3e] text-[#8e97ae] hover:text-rose-400"
                    title="Delete Article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewer or Editor Mode */}
              {isEditing ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1">
                      Article Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283b] text-sm text-white font-bold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded bg-[#090b12] border border-[#22283b] text-white outline-none"
                      >
                        <option value="Vendors & Mills">Vendors & Mills</option>
                        <option value="Quality & AQL">Quality & AQL</option>
                        <option value="Brand Guidelines">Brand Guidelines</option>
                        <option value="Garment Specs">Garment Specs</option>
                        <option value="Business Operations">Business Operations</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsConfidential}
                          onChange={(e) => setEditIsConfidential(e.target.checked)}
                          className="w-4 h-4 rounded text-[#cda052] bg-[#090b12] border-[#22283b]"
                        />
                        <span className="font-semibold text-rose-400">
                          Mark as Admin Confidential
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1">
                      Markdown Content
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={16}
                      className="w-full bg-[#080a10] border border-[#22283a] text-[#cfd5e4] font-mono text-xs p-4 rounded-lg outline-none leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white font-serif tracking-wide">
                    {currentArticle.title}
                  </h2>

                  <div className="flex items-center gap-4 text-xs text-[#717a90] border-b border-[#181d2a] pb-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#555d72]" />
                      {currentArticle.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#555d72]" />
                      Updated: {new Date(currentArticle.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Rendered content */}
                  <div className="prose prose-invert max-w-none text-xs text-[#cbd5e1] leading-relaxed space-y-3 whitespace-pre-line font-sans">
                    {currentArticle.content}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-6 border-t border-[#181d2a]">
                    {currentArticle.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#161926] text-[#8e97ae] border border-[#232a3f]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-[#687084] text-xs">
              Select or create an article to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
