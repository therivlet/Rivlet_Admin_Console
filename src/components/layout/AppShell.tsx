'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { RivletWatermark } from '@/components/brand/RivletLogo';
import RivletLoader from '@/components/brand/RivletLoader';

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

  // Loading Splash Screen (renders centered on refresh, initial load, and auth sync)
  if (isLoading) {
    return (
      <RivletLoader 
        fullscreen={true}
        message="Authenticating with Supabase Cloud..."
        subMessage="Master Operations Console • Tirupur Production Hub"
      />
    );
  }

  // Not logged in and not on login page: show brief redirect screen
  if (!user && !isLoginPage) {
    return (
      <RivletLoader 
        fullscreen={true}
        message="Redirecting to secure login..."
        subMessage="Rivlet Brand Operations & Vault Access"
      />
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

