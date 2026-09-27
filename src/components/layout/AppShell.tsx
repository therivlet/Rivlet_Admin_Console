'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { RivletWatermark } from '@/components/brand/RivletLogo';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  // Close mobile drawer upon route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    return <main className="min-h-screen min-h-[100dvh] w-full bg-[#07090e] flex flex-col">{children}</main>;
  }

  // Authenticated admin layout
  return (
    <div className="flex w-full min-h-screen bg-[#07090e] text-[#e0e3eb] relative overflow-x-hidden">
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onCloseMobile={() => setMobileMenuOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Topbar 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />
        <main className="flex-1 relative z-10">{children}</main>
      </div>

      {/* Subtle luxury brand watermark in background */}
      <RivletWatermark />
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

