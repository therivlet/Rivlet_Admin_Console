import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Rivlet | Admin Operations & Artifact Knowledge Hub',
  description: 'Centralized admin platform for Rivlet clothing brand: Claude HTML artifact sandbox, apparel costing calculator, compliance document vault, and confidential SOPs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090a0f] text-[#f4f6fa] flex min-h-screen antialiased selection:bg-[#cda052]/30 selection:text-white">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
