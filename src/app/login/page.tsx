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
import RivletLogo, { RivletWatermark } from '@/components/brand/RivletLogo';

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

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === 'forgot') {
      if (!emailTrimmed) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      if (!emailRegex.test(emailTrimmed)) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      setIsSubmitting(true);
      const res = await resetPassword(emailTrimmed);
      setIsSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(res.message || 'Password reset email sent! Check your inbox.');
      }
      return;
    }

    if (!emailTrimmed || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address (e.g. admin@therivlet.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && (!name.trim() || name.trim().length < 2)) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'signin') {
      const res = await signIn(emailTrimmed, password);
      setIsSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        router.push('/');
      }
    } else {
      // Sign Up
      const res = await signUp(emailTrimmed, password, name.trim());
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
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#07090e] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[rgba(205,160,82,0.07)] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-96 h-96 bg-[rgba(16,185,129,0.04)] rounded-full blur-[130px] pointer-events-none" />
      <RivletWatermark />

      {/* Login Card (perfectly centered vertically & horizontally with my-auto) */}
      <div className="w-full max-w-md bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <RivletLogo variant="gold" size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            {mode === 'signin' && 'Rivlet Executive Sign In'}
            {mode === 'signup' && 'Create Admin Account'}
            {mode === 'forgot' && 'Reset Console Password'}
          </h1>
          <p className="text-xs text-[#94a3b8] max-w-xs mx-auto leading-relaxed">
            {mode === 'signin' && 'Secure administrative access to costing sheets, SOPs & brand vault.'}
            {mode === 'signup' && 'Register your administrative credentials protected by Supabase.'}
            {mode === 'forgot' && 'Enter your registered email address to receive password recovery instructions.'}
          </p>
        </div>

        {/* Mode Switcher */}
        {mode !== 'forgot' && (
          <div className="flex bg-[#07090e] p-1 rounded-xl border border-[#1e2638]">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
                mode === 'signin'
                  ? 'bg-[#141824] text-[#e6c875] border border-[#cda052]/50 shadow-sm ring-1 ring-[#cda052]/20'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
                mode === 'signup'
                  ? 'bg-[#141824] text-[#e6c875] border border-[#cda052]/50 shadow-sm ring-1 ring-[#cda052]/20'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Harichandru"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-white placeholder-[#64748b] text-xs outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@therivlet.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-white placeholder-[#64748b] text-xs outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
                    className="text-[11px] text-[#e6c875] hover:text-white hover:underline transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-white placeholder-[#64748b] text-xs outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94a3b8] hover:text-white transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
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
              className="w-full py-2 text-xs text-[#94a3b8] hover:text-white flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          )}
        </form>

        {/* Footer Security Badge */}
        <div className="pt-3 text-center text-[11px] text-[#94a3b8] flex items-center justify-center gap-1.5 border-t border-[#1e2638]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Real Supabase Cloud Authentication Active</span>
        </div>
      </div>
    </div>
  );
}
