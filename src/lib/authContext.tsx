'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useRouter } from 'next/navigation';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'owner';
}

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loginAsDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  loginAsDemoAdmin: () => {},
});

const AUTH_STORAGE_KEY = 'rivlet_admin_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check local session cache first
    try {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
      } else {
        // Default to demo admin session on first boot so navigation isn't blocked
        const defaultAdmin: AdminUser = {
          id: 'admin-master',
          email: 'admin@therivlet.com',
          name: 'Rivlet Founder',
          role: 'owner',
        };
        setUser(defaultAdmin);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultAdmin));
      }
    } catch (e) {
      console.error('Error loading session cache', e);
    } finally {
      setIsLoading(false);
    }

    // 2. Supabase auth listener if configured
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser: AdminUser = {
            id: session.user.id,
            email: session.user.email || 'admin@therivlet.com',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Rivlet Admin',
            role: 'owner',
          };
          setUser(authUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser: AdminUser = {
            id: session.user.id,
            email: session.user.email || 'admin@therivlet.com',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Rivlet Admin',
            role: 'owner',
          };
          setUser(authUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        } else {
          // Keep current user or null
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        const authUser: AdminUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          role: 'owner',
        };
        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        setIsLoading(false);
        return {};
      }
    }

    // Local admin credentials fallback
    const localUser: AdminUser = {
      id: `admin-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'admin',
    };
    setUser(localUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(localUser));
    setIsLoading(false);
    return {};
  };

  const signUp = async (email: string, pass: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
      });
      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }
    }
    return signIn(email, pass);
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
  };

  const loginAsDemoAdmin = () => {
    const demo: AdminUser = {
      id: 'demo-master',
      email: 'admin@therivlet.com',
      name: 'Rivlet Founder',
      role: 'owner',
    };
    setUser(demo);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demo));
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, loginAsDemoAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
