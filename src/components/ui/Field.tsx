import React from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full min-h-control rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-sm font-medium text-ink">{label}</span>}
      {children}
      {error ? <span className="block text-xs text-danger">{error}</span> : hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, 'min-h-28', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(control, props.className)} />;
}
