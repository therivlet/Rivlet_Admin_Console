import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rivlet Executive Console',
    short_name: 'Rivlet Admin',
    description: 'Confidential Brand Operations, Garment Costing & Luxury Vault Console',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#07090e',
    theme_color: '#07090e',
    icons: [
      {
        src: '/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['business', 'finance', 'productivity'],
    shortcuts: [
      {
        name: 'Costing Calculator',
        url: '/calculator',
        description: '5-step luxury garment costing & GST engine',
      },
      {
        name: 'Artifact Hub',
        url: '/artifacts',
        description: 'Claude tools & interactive web apps',
      },
      {
        name: 'Document Vault',
        url: '/documents',
        description: 'Secure GOTS certificates & tech packs',
      },
    ],
  };
}
