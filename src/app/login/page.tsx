'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  KeyRound,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import RivletLogo, { RivletWatermark } from '@/components/brand/RivletLogo';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, resetPassword, updateUserPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'forgot' | 'set_password'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check URL parameters and hash fragment for invite/recovery flow
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    const search = window.location.search;
    const urlParams = new URLSearchParams(search);

    // 1. Detect Supabase Auth errors in hash (e.g. expired link)
    if (hash.includes('error=')) {
      try {
        const hashParams = new URLSearchParams(hash.substring(1));
        const errorDesc = hashParams.get('error_description') || hashParams.get('error');
        if (errorDesc) {
          setErrorMessage(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        }
      } catch {
        setErrorMessage('Authentication link has expired or is invalid. Please request a new invitation or reset link.');
      }
    }

    // 2. Detect invitation or password recovery
    const isSetPasswordMode = 
      urlParams.get('mode') === 'set_password' ||
      urlParams.get('type') === 'recovery' ||
      urlParams.get('type') === 'invite' ||
      hash.includes('type=recovery') ||
      hash.includes('type=invite') ||
      hash.includes('access_token=');

    if (isSetPasswordMode) {
      setMode('set_password');
      if (!hash.includes('error=')) {
        setSuccessMessage('Secure link authenticated. Please set your new password below.');
      }
    }
  }, []);

  // Listen for Supabase password recovery event
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('set_password');
        setSuccessMessage('Password recovery authorized. Enter your new password below.');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // --- MODE 1: SET / UPDATE PASSWORD (Invite or Reset) ---
    if (mode === 'set_password') {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please retype carefully.');
        return;
      }

      setIsSubmitting(true);
      const res = await updateUserPassword(password);
      setIsSubmitting(false);

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Password configured successfully! Redirecting to your Rivlet Console...');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
      return;
    }

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // --- MODE 2: FORGOT PASSWORD REQUEST ---
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

    // --- MODE 3: SIGN IN ---
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

    setIsSubmitting(true);
    const res = await signIn(emailTrimmed, password);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#07090e] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[rgba(205,160,82,0.07)] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-96 h-96 bg-[rgba(16,185,129,0.04)] rounded-full blur-[130px] pointer-events-none" />
      <RivletWatermark />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <RivletLogo variant="gold" size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            {mode === 'signin' 
              ? 'Rivlet Executive Sign In' 
              : mode === 'set_password'
              ? 'Set Console Password'
              : 'Reset Console Password'}
          </h1>
          <p className="text-xs text-[#94a3b8] max-w-xs mx-auto leading-relaxed">
            {mode === 'signin'
              ? 'Secure administrative access to costing sheets, SOPs & brand vault.'
              : mode === 'set_password'
              ? 'Choose a secure password for your verified Rivlet account to proceed.'
              : 'Enter your registered email address to receive password setup instructions.'}
          </p>
        </div>

        {/* Security Access Notice (Zero Public Signup) */}
        {mode !== 'set_password' && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#121623] border border-[#1e2638] text-[11px] text-[#94a3b8]">
            <ShieldAlert className="w-4 h-4 text-[#cda052] flex-shrink-0" />
            <span>
              Access is restricted to invited team members. Public registration is permanently disabled.
            </span>
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
          {mode !== 'set_password' && (
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
                Email Address
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
          )}

          {mode === 'signin' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-[11px] text-[#e6c875] hover:text-white hover:underline transition-colors font-medium"
                >
                  Forgot Password?
                </button>
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

          {mode === 'set_password' && (
            <>
              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-white placeholder-[#64748b] text-xs outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94a3b8] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retype your new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-white placeholder-[#64748b] text-xs outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94a3b8] hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
          >
            <span>
              {isSubmitting
                ? 'Processing...'
                : mode === 'signin'
                ? 'Sign In to Rivlet Console'
                : mode === 'set_password'
                ? 'Save Password & Enter Console'
                : 'Send Password Reset Email'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {(mode === 'forgot' || mode === 'set_password') && (
            <button
              type="button"
              onClick={() => { 
                setMode('signin'); 
                setErrorMessage(''); 
                setSuccessMessage(''); 
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full py-2 text-xs text-[#94a3b8] hover:text-white flex items-center justify-center gap-1.5 transition-colors font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          )}
        </form>

        {/* Footer Security Badge */}
        <div className="pt-3 text-center text-[11px] text-[#94a3b8] flex items-center justify-center gap-1.5 border-t border-[#1e2638]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Supabase RBAC & Session Security Active</span>
        </div>
      </div>
    </div>
  );
}

