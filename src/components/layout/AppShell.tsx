'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import CommandPalette from '@/components/layout/CommandPalette';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { AdminStoreProvider } from '@/lib/store';
import { ConfirmProvider } from '@/lib/confirmContext';
import { RivletWatermark } from '@/components/brand/RivletLogo';
import RivletLoader from '@/components/brand/RivletLoader';
import WriteErrorToast from '@/components/ui/WriteErrorToast';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  // Close mobile drawer upon route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Global Cmd+K / Ctrl+K keyboard shortcut and custom event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    const handleOpenCommand = () => setCommandPaletteOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenCommand);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenCommand);
    };
  }, []);

  // Register PWA Service Worker for Chrome Desktop & Mobile installation
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Service worker active
        })
        .catch((err) => {
          console.warn('[Rivlet PWA] SW registration notice:', err);
        });
    }

    // Capture Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__rivletInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('rivlet-installable'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

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
    <div className="flex w-full h-screen h-[100dvh] bg-[#07090e] text-[#f1f5f9] overflow-hidden relative">
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onCloseMobile={() => setMobileMenuOpen(false)} 
      />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Topbar 
          onOpenCommand={() => setCommandPaletteOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth">
          {children}
        </main>
      </div>

      {/* Global Command Palette search modal */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Subtle luxury brand watermark in background */}
      <RivletWatermark />

      {/* Surfaces failed cloud writes instead of silently swallowing them */}
      <WriteErrorToast />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminStoreProvider>
        <ConfirmProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </ConfirmProvider>
      </AdminStoreProvider>
    </AuthProvider>
  );
}

