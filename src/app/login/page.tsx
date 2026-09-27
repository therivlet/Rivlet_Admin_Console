'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, loginAsDemoAdmin, user } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = mode === 'signin' 
      ? await signIn(email, password)
      : await signUp(email, password);

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#07080c] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[rgba(205,160,82,0.06)] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[rgba(14,128,108,0.04)] rounded-full blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#0f121b] border border-[#23293d] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#cda052] to-[#8c672b] flex items-center justify-center shadow-glow font-serif font-bold text-black text-2xl mx-auto tracking-wider mb-3">
            R
          </div>
          <h1 className="text-xl font-bold text-white tracking-[0.2em] font-serif uppercase">
            RIVLET
          </h1>
          <p className="text-xs text-[#808a9f]">
            Operations Console & Confidential Brand Vault
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-[#090b12] p-1 rounded-xl border border-[#1d2334]">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'signin'
                ? 'bg-[#1b2030] text-[#cda052] shadow-sm'
                : 'text-[#7e879f] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'signup'
                ? 'bg-[#1b2030] text-[#cda052] shadow-sm'
                : 'text-[#7e879f] hover:text-white'
            }`}
          >
            Create Admin
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687287]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@therivlet.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#090b12] border border-[#21273a] text-white placeholder-[#555d72] outline-none focus:border-[#cda052] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687287]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-[#090b12] border border-[#21273a] text-white placeholder-[#555d72] outline-none focus:border-[#cda052] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687287] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Rivlet Console' : 'Register Admin Account'}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#1d2334]" />
          <span className="flex-shrink mx-3 text-[10px] text-[#555d72] uppercase font-medium">
            or Quick Access
          </span>
          <div className="flex-grow border-t border-[#1d2334]" />
        </div>

        {/* Quick Demo Access Button */}
        <button
          type="button"
          onClick={loginAsDemoAdmin}
          className="w-full py-2 rounded-lg bg-[#141724] border border-[#262d42] hover:border-[#cda052]/50 text-xs font-semibold text-[#8f98af] hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#cda052]" />
          <span>Enter as Rivlet Founder (Demo Mode)</span>
        </button>

        {/* Footer Security Badge */}
        <div className="pt-2 text-center text-[10px] text-[#5f677c] flex items-center justify-center gap-1.5 border-t border-[#1a1f2e]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protected with Supabase Auth & Row Level Security</span>
        </div>
      </div>
    </div>
  );
}
