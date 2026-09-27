'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { AuthProvider } from '@/lib/authContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <AuthProvider>
      {isLoginPage ? (
        <main className="min-h-screen bg-[#07080c]">{children}</main>
      ) : (
        <div className="flex w-full min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Right Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      )}
    </AuthProvider>
  );
}
