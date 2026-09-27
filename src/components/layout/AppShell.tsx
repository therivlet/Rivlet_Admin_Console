'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { AuthProvider, useAuth } from '@/lib/authContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isLoginPage) {
        router.replace('/login');
      } else if (user && isLoginPage) {
        router.replace('/');
      }
    }
  }, [user, isLoading, isLoginPage, router]);

  // Loading Splash Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080c] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#cda052] to-[#8c672b] flex items-center justify-center shadow-glow font-serif font-bold text-black text-2xl tracking-wider animate-pulse">
          R
        </div>
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-white tracking-[0.2em] font-serif uppercase">
            RIVLET
          </div>
          <div className="text-[10px] text-[#717a8f]">
            Authenticating with Supabase Cloud...
          </div>
        </div>
      </div>
    );
  }

  // Not logged in and not on login page: show brief redirect screen
  if (!user && !isLoginPage) {
    return (
      <div className="min-h-screen bg-[#07080c] flex items-center justify-center">
        <div className="text-xs text-[#717a8f] animate-pulse">
          Redirecting to secure login...
        </div>
      </div>
    );
  }

  // Login page layout
  if (isLoginPage) {
    return <main className="min-h-screen bg-[#07080c]">{children}</main>;
  }

  // Authenticated admin layout
  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthProvider>
  );
}
