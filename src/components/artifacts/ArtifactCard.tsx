'use client';

import React from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Code, 
  Trash2, 
  ArrowUpRight, 
  Layers,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { ArtifactItem } from '@/lib/types';

interface ArtifactCardProps {
  artifact: ArtifactItem;
  onOpen: () => void;
  onEdit: () => void;
  onTogglePromote: () => void;
  onDelete: () => void;
}

export default function ArtifactCard({
  artifact,
  onOpen,
  onEdit,
  onTogglePromote,
  onDelete,
}: ArtifactCardProps) {
  return (
    <div className="group bg-[#11141e] border border-[#1f2537] hover:border-[#cda052]/50 rounded-xl overflow-hidden transition-all duration-200 flex flex-col shadow-lg hover:shadow-glow/20">
      {/* Top Banner / Preview Snapshot */}
      <div 
        onClick={onOpen}
        className="h-36 bg-[#090b10] border-b border-[#1b2132] relative overflow-hidden cursor-pointer group/preview"
      >
        {/* Scaled thumbnail preview */}
        <div className="absolute inset-0 pointer-events-none opacity-80 group-hover/preview:opacity-100 transition-opacity">
          <iframe
            srcDoc={artifact.htmlContent}
            title={artifact.title}
            className="w-[200%] h-[200%] transform scale-50 origin-top-left pointer-events-none border-none"
            tabIndex={-1}
          />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#cda052] text-black text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <ExternalLink className="w-3.5 h-3.5" />
            Launch Interactive View
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0d1017]/90 text-[#cda052] border border-[#2b3348] backdrop-blur-sm">
            {artifact.category}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {artifact.isPromoted ? (
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-400 border border-emerald-700/50 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Promoted Page
            </span>
          ) : (
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-[#161a26]/90 text-[#7d879d] border border-[#262c3e]">
              Staging / Inbox
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            onClick={onOpen}
            className="text-sm font-semibold text-white group-hover:text-[#cda052] transition-colors cursor-pointer truncate mb-1"
          >
            {artifact.title}
          </h3>
          <p className="text-[11px] text-[#788198] line-clamp-2 leading-relaxed mb-3">
            {artifact.description || 'Interactive Claude HTML artifact.'}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {artifact.tags.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="text-[9px] px-1.5 py-0.5 rounded bg-[#161924] text-[#8e97ae] border border-[#23293c]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#1a1f2e] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[10px] text-[#636c82]">
            <Calendar className="w-3 h-3 text-[#505769]" />
            <span>{new Date(artifact.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePromote}
              title={artifact.isPromoted ? 'Unpin from Sidebar Pages' : 'Promote to First-Class Sidebar Page'}
              className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                artifact.isPromoted
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/60'
                  : 'bg-[#161a26] text-[#cda052] border-[#293144] hover:border-[#cda052]/50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onEdit}
              title="Clean & Edit HTML"
              className="p-1.5 rounded-lg bg-[#161a26] border border-[#293144] text-[#8d96ad] hover:text-white hover:border-[#cda052]/50"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDelete}
              title="Delete Artifact"
              className="p-1.5 rounded-lg bg-[#161a26] border border-[#293144] text-[#8d96ad] hover:text-rose-400 hover:border-rose-900"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
