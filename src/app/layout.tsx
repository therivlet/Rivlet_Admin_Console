import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

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
        {/* Main Shell */}
        <div className="flex w-full min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Right Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Topbar */}
            <Topbar />

            {/* Page Viewport */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
