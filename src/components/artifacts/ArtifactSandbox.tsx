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
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-[#090b10]' : 'h-full w-full'}`}>
      {/* Sandbox Control Bar */}
      <div className="flex-shrink-0 min-h-[52px] px-3 sm:px-4 py-2 bg-[#0f121a] border-b border-[#1e2332] flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-[rgba(205,160,82,0.12)] text-[#cda052] flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs font-semibold text-white truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">{artifact.title}</h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e2434] text-[#8e97ae] font-mono flex-shrink-0">
                v{artifact.version}
              </span>
              {artifact.isPromoted && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 hidden sm:inline flex-shrink-0">
                  Promoted Page
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Viewport switchers (hidden in mobile) */}
        <div className="hidden lg:flex items-center gap-1 bg-[#141722] p-1 rounded-lg border border-[#212638] flex-shrink-0">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === 'desktop' ? 'bg-[#22283a] text-[#cda052]' : 'text-[#747c91] hover:text-white'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('laptop')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === 'laptop' ? 'bg-[#22283a] text-[#cda052]' : 'text-[#747c91] hover:text-white'
            }`}
            title="Laptop View (1280px)"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === 'tablet' ? 'bg-[#22283a] text-[#cda052]' : 'text-[#747c91] hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === 'mobile' ? 'bg-[#22283a] text-[#cda052]' : 'text-[#747c91] hover:text-white'
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
              className={`text-xs px-2 sm:px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                artifact.isPromoted
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/50'
                  : 'bg-[rgba(205,160,82,0.12)] text-[#e8ca78] border-[#cda052]/40 hover:bg-[rgba(205,160,82,0.2)]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{artifact.isPromoted ? 'Unpin Page' : 'Promote to Page'}</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg bg-[#171b26] border border-[#262c3e] text-[#9fa7ba] hover:text-white hover:border-[#cda052]/50 text-xs flex items-center gap-1"
              title="Edit / Clean Artifact Code"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clean & Edit</span>
            </button>
          )}

          <button
            onClick={reloadIframe}
            className="p-1.5 rounded-lg bg-[#171b26] border border-[#262c3e] text-[#9fa7ba] hover:text-white"
            title="Reload Sandbox"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-[#171b26] border border-[#262c3e] text-[#9fa7ba] hover:text-white hidden xs:flex"
            title="Download HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-[#171b26] border border-[#262c3e] text-[#9fa7ba] hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#1f2537] hover:bg-rose-950/70 border border-[#2e374e] hover:border-rose-700/60 text-[#a2adbf] hover:text-rose-300 transition-colors ml-0.5"
              title="Close Sandbox"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-[#07080c] overflow-auto flex items-center justify-center p-2 relative">
        <div
          style={{ width: getViewportWidth(), height: '100%' }}
          className="transition-all duration-300 relative shadow-2xl bg-white rounded-md overflow-hidden border border-[#242b3d]"
        >
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={artifact.htmlContent}
            title={artifact.title}
            className="w-full h-full border-none block"
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
