'use client';

import React, { useState, useRef } from 'react';
import { 
  Monitor, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  Download, 
  Code, 
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  X
} from 'lucide-react';
import { ArtifactItem } from '@/lib/types';

interface ArtifactSandboxProps {
  artifact: ArtifactItem;
  onEdit?: () => void;
  onTogglePromote?: () => void;
  seamlessMode?: boolean; // When true, fits seamlessly inside a dedicated page view without extra chrome
  onClose?: () => void;
}

export default function ArtifactSandbox({ 
  artifact, 
  onEdit, 
  onTogglePromote,
  seamlessMode = false,
  onClose,
}: ArtifactSandboxProps) {
  const [viewport, setViewport] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0); // For reloading iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'laptop': return '1280px';
      case 'desktop': default: return '100%';
    }
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reloadIframe = () => setKey(prev => prev + 1);

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-[#07090e]' : 'h-full w-full'}`}>
      {/* Sandbox Control Bar */}
      <div className="flex-shrink-0 min-h-[52px] px-3 sm:px-4 py-2 bg-[#0e121b] border-b border-[#1e2638] flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">{artifact.title}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#141824] text-[#cbd5e1] border border-[#263147] font-mono flex-shrink-0 font-medium">
                v{artifact.version}
              </span>
              {artifact.isPromoted && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hidden sm:inline flex-shrink-0 font-medium">
                  Promoted Page
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Viewport switchers (hidden in mobile) */}
        <div className="hidden lg:flex items-center gap-1 bg-[#141824] p-1 rounded-lg border border-[#263147] flex-shrink-0">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === 'desktop' ? 'bg-[#222a3d] text-[#e6c875] shadow-sm' : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('laptop')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === 'laptop' ? 'bg-[#222a3d] text-[#e6c875] shadow-sm' : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Laptop View (1280px)"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === 'tablet' ? 'bg-[#222a3d] text-[#e6c875] shadow-sm' : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === 'mobile' ? 'bg-[#222a3d] text-[#e6c875] shadow-sm' : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {onTogglePromote && (
            <button
              onClick={onTogglePromote}
              className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1 sm:gap-1.5 ${
                artifact.isPromoted
                  ? 'bg-amber-950/60 text-amber-200 border-amber-800/60 hover:bg-amber-900/60'
                  : 'bg-[rgba(205,160,82,0.15)] text-[#e6c875] border-[#cda052]/50 hover:bg-[rgba(205,160,82,0.25)]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{artifact.isPromoted ? 'Unpin Page' : 'Promote to Page'}</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 px-2.5 rounded-lg bg-[#141824] border border-[#263147] text-[#cbd5e1] hover:text-white hover:border-[#cda052]/50 text-xs flex items-center gap-1.5 transition-colors font-medium"
              title="Edit / Clean Artifact Code"
            >
              <Code className="w-3.5 h-3.5 text-[#cda052]" />
              <span className="hidden md:inline">Clean & Edit</span>
            </button>
          )}

          <button
            onClick={reloadIframe}
            className="p-1.5 rounded-lg bg-[#141824] border border-[#263147] text-[#94a3b8] hover:text-white transition-colors"
            title="Reload Sandbox"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-[#141824] border border-[#263147] text-[#94a3b8] hover:text-white transition-colors hidden xs:flex"
            title="Download HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-[#141824] border border-[#263147] text-[#94a3b8] hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#141824] hover:bg-rose-950/70 border border-[#263147] hover:border-rose-700/60 text-[#cbd5e1] hover:text-rose-200 transition-colors ml-0.5"
              title="Close Sandbox"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 !bg-[#07080c] overflow-auto flex items-center justify-center p-2 relative">
        <div
          style={{ width: getViewportWidth(), height: '100%' }}
          className="transition-all duration-300 relative shadow-2xl bg-white rounded-md overflow-hidden border border-[#242b3d]"
        >
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={artifact.htmlContent}
            title={artifact.title}
            className="w-full h-full border-none block opacity-100"
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
