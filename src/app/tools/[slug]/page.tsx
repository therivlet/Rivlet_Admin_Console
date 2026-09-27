'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminStore } from '@/lib/store';
import ArtifactSandbox from '@/components/artifacts/ArtifactSandbox';
import ArtifactEditorModal from '@/components/artifacts/ArtifactEditorModal';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PromotedToolPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { artifacts, updateArtifact, togglePromoteArtifact } = useAdminStore();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Find artifact by routeSlug or id
  const artifact = artifacts.find(
    (a) => a.routeSlug === slug || a.id === slug
  );

  if (!artifact) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Promoted Page Not Found</h2>
        <p className="text-sm text-[#747c91] mb-6">
          The requested Claude tool or artifact with slug "<span className="text-[#cda052]">{slug}</span>" was not found or has been unpromoted.
        </p>
        <Link
          href="/artifacts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181d2a] border border-[#273044] text-xs font-semibold text-white hover:border-[#cda052]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Artifact Vault
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Seamless Artifact Sandbox */}
      <ArtifactSandbox
        artifact={artifact}
        onEdit={() => setIsEditorOpen(true)}
        onTogglePromote={() => togglePromoteArtifact(artifact.id)}
        seamlessMode={true}
      />

      {/* In-app editor for quick adjustments */}
      <ArtifactEditorModal
        artifact={artifact}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={(updates) => updateArtifact(artifact.id, updates)}
      />
    </div>
  );
}
