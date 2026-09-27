'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  User,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'forgot') {
      if (!email) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      setIsSubmitting(true);
      const res = await resetPassword(email);
      setIsSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(res.message || 'Password reset email sent! Check your inbox.');
      }
      return;
    }

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'signin') {
      const res = await signIn(email, password);
      setIsSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        router.push('/');
      }
    } else {
      // Sign Up
      const res = await signUp(email, password, name);
      setIsSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.confirmationRequired) {
        setSuccessMessage(
          'Admin account created in Supabase! If your Supabase project requires email confirmation, please check your inbox before signing in.'
        );
        setMode('signin');
      } else {
        router.push('/');
      }
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
        {mode !== 'forgot' && (
          <div className="flex bg-[#090b12] p-1 rounded-xl border border-[#1d2334]">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
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
              onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-[#1b2030] text-[#cda052] shadow-sm'
                  : 'text-[#7e879f] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#666f85] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687287]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Harichandru"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#090b12] border border-[#21273a] text-white placeholder-[#555d72] outline-none focus:border-[#cda052] transition-colors"
                />
              </div>
            </div>
          )}

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
                placeholder="your-email@therivlet.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#090b12] border border-[#21273a] text-white placeholder-[#555d72] outline-none focus:border-[#cda052] transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-semibold text-[#666f85]">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
                    className="text-[10px] text-[#cda052] hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
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
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
          >
            <span>
              {isSubmitting
                ? 'Processing with Supabase...'
                : mode === 'signin'
                ? 'Sign In to Rivlet Console'
                : mode === 'signup'
                ? 'Create Supabase Admin Account'
                : 'Send Password Reset Email'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
              className="w-full py-2 text-xs text-[#8e97ae] hover:text-white flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          )}
        </form>

        {/* Footer Security Badge */}
        <div className="pt-2 text-center text-[10px] text-[#5f677c] flex items-center justify-center gap-1.5 border-t border-[#1a1f2e]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real Supabase Cloud Authentication Active</span>
        </div>
      </div>
    </div>
  );
}
