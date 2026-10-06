'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { AppRole, AppModule, PermissionAction, UserPermissionMap } from './types';
import { getRoleTemplateDefaults } from './permissions';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  status: 'active' | 'deactivated';
  permissions: UserPermissionMap;
  metadata?: Record<string, any>;
}

interface AuthContextType {
  user: AdminUser | null;
  session: Session | null;
  isLoading: boolean;
  can: (module: AppModule, action: PermissionAction) => boolean;
  canView: (module: AppModule) => boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name?: string) => Promise<{ error?: string; confirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updateUserPassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (metadata: Record<string, any>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  can: () => false,
  canView: () => false,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  resetPassword: async () => ({}),
  updateUserPassword: async () => ({}),
  updateProfile: async () => ({}),
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper to load profile and permissions for a given user session
  const loadUserProfile = useCallback(async (sessionUser: any): Promise<AdminUser | null> => {
    if (!supabase || !sessionUser) return null;

    try {
      // 1. Fetch user profile from database
      let { data: profile, error: profError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      // If user profile does not exist yet (e.g. migration v12 just applied),
      // call the bootstrap function to preserve this user as Owner
      if (profError || !profile) {
        try {
          const { data: bootResult } = await supabase.rpc('claim_or_bootstrap_owner');
          if (bootResult?.success) {
            const { data: recheck } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', sessionUser.id)
              .single();
            if (recheck) profile = recheck;
          }
        } catch {
          // fallback if RPC not yet created in remote database
        }
      }

      // Default fallback if table not yet migrated: Treat the single admin user as Owner
      const role: AppRole = (profile?.role as AppRole) || 'owner';
      const status = (profile?.status as 'active' | 'deactivated') || 'active';
      const name = profile?.name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Rivlet Executive';

      // 2. Fetch custom module permissions
      const { data: permsData } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', sessionUser.id);

      const userPermissions: UserPermissionMap = getRoleTemplateDefaults(role);
      (permsData || []).forEach((p: any) => {
        if (p.module && userPermissions[p.module as AppModule]) {
          userPermissions[p.module as AppModule] = {
            view: Boolean(p.can_view),
            create: Boolean(p.can_create),
            edit: Boolean(p.can_edit),
            delete: Boolean(p.can_delete),
            export: Boolean(p.can_export),
            approve: Boolean(p.can_approve),
            manage_access: Boolean(p.can_manage_access),
          };
        }
      });

      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name,
        role,
        status,
        permissions: userPermissions,
        metadata: sessionUser.user_metadata || {},
      };
    } catch (err) {
      console.error('Error hydrating user profile & permissions:', err);
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Rivlet Executive',
        role: 'owner',
        status: 'active',
        permissions: getRoleTemplateDefaults('owner'),
        metadata: sessionUser.user_metadata || {},
      };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const updated = await loadUserProfile(session.user);
      if (updated) setUser(updated);
    }
  }, [session, loadUserProfile]);

  useEffect(() => {
    const startTime = Date.now();
    const MIN_LOAD_DELAY = 850;

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        const adminUser = await loadUserProfile(session.user);
        setUser(adminUser);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        const adminUser = await loadUserProfile(newSession.user);
        setUser(adminUser);
      } else {
        setSession(null);
        setUser(null);
      }
      completeLoading();
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  // Typed Permission Helpers
  const can = useCallback((module: AppModule, action: PermissionAction): boolean => {
    if (!user || user.status !== 'active') return false;
    if (user.role === 'owner') return true;
    return Boolean(user.permissions?.[module]?.[action]);
  }, [user]);

  const canView = useCallback((module: AppModule): boolean => {
    if (!user || user.status !== 'active') return false;
    if (user.role === 'owner') return true;
    return Boolean(user.permissions?.[module]?.view);
  }, [user]);

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
        // Also update name in public.user_profiles if full_name changed
        if (metadata.full_name) {
          await supabase
            .from('user_profiles')
            .update({ name: metadata.full_name, updated_at: new Date().toISOString() })
            .eq('id', data.user.id);
        }
        await refreshProfile();
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
      const adminUser = await loadUserProfile(data.user);
      if (adminUser?.status === 'deactivated') {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { error: 'Your account has been deactivated. Please contact the Rivlet Owner.' };
      }
      setUser(adminUser);
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
      return {};
    }

    setIsLoading(false);
    return { error: 'Failed to establish session. Please verify your credentials.' };
  };

  // Public Sign-Up is disabled by security policy
  const signUp = async () => {
    return {
      error: 'Public registration is disabled. Accounts must be provisioned by the Rivlet Owner in Access Management.',
    };
  };

  // Real Supabase Sign-Out with clean cache purge
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && user?.id) {
        // Broadcast auth change event to purge user-scoped local cache
        window.dispatchEvent(new CustomEvent('rivlet-auth-signout', { detail: { userId: user.id } }));
      }
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      setUser(null);
      setSession(null);
      setTimeout(() => {
        setIsLoading(false);
        router.push('/login');
      }, 500);
    }
  };

  // Real Password Reset
  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase is not configured.' };
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTo = origin ? `${origin}/login?mode=set_password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) return { error: error.message };
    return { message: 'Password reset link sent to your email.' };
  };

  // Set / Update Password for Invited or Password Recovery users
  const updateUserPassword = async (newPassword: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase backend is not configured in .env.local.' };
    }
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { error: error.message };
      }
      if (data?.user) {
        await refreshProfile();
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to update password.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      can,
      canView,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateUserPassword,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
