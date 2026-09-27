'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  metadata?: Record<string, any>;
}

interface AuthContextType {
  user: AdminUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name?: string) => Promise<{ error?: string; confirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updateProfile: (metadata: Record<string, any>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  resetPassword: async () => ({}),
  updateProfile: async () => ({}),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const startTime = Date.now();
    const MIN_LOAD_DELAY = 850; // 850ms allows the luxury logo & shimmer beam to be smoothly appreciated

    const completeLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_LOAD_DELAY - elapsed);
      setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    };

    if (!isSupabaseConfigured || !supabase) {
      completeLoading();
      return;
    }

    // 1. Fetch current active session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Admin',
          role: 'owner',
          metadata: session.user.user_metadata || {},
        });
      } else {
        setSession(null);
        setUser(null);
      }
      completeLoading();
    }).catch(err => {
      console.error('Error fetching Supabase auth session:', err);
      completeLoading();
    });

    // 2. Real-time auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setUser({
          id: newSession.user.id,
          email: newSession.user.email || '',
          name: newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'Admin',
          role: 'owner',
          metadata: newSession.user.user_metadata || {},
        });
      } else {
        setSession(null);
        setUser(null);
      }
      completeLoading();
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (metadata: Record<string, any>) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase backend is not configured in .env.local.' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Admin',
          role: 'owner',
          metadata: data.user.user_metadata || {},
        });
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile on Supabase.' };
    }
  };

  // Real Supabase Sign-In
  const signIn = async (email: string, pass: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase backend is not configured in .env.local.' };
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }

    if (data.session && data.user) {
      setSession(data.session);
      setUser({
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'owner',
        metadata: data.user.user_metadata || {},
      });
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
      return {};
    }

    setIsLoading(false);
    return { error: 'Failed to establish session. Please verify your credentials.' };
  };

  // Real Supabase Sign-Up
  const signUp = async (email: string, pass: string, name?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase backend is not configured in .env.local.' };
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name || email.split('@')[0],
        },
      },
    });

    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }

    // Check if email confirmation is required by Supabase
    if (data.user && !data.session) {
      setIsLoading(false);
      return { 
        confirmationRequired: true,
        message: 'Account created! Please check your email to confirm registration before logging in.',
      };
    }

    if (data.session && data.user) {
      setSession(data.session);
      setUser({
        id: data.user.id,
        email: data.user.email || email,
        name: name || data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'owner',
        metadata: data.user.user_metadata || {},
      });
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return {};
  };

  // Real Supabase Sign-Out
  const signOut = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/login');
    }, 600);
  };

  // Real Password Reset
  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase is not configured.' };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { error: error.message };
    return { message: 'Password reset link sent to your email.' };
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
