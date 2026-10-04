import React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'md' | 'sm';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'bg-card text-ink border border-line hover:bg-sunken',
  ghost: 'bg-transparent text-secondary hover:bg-sunken hover:text-ink',
  destructive: 'bg-danger text-ink hover:opacity-90',
};

const sizes: Record<Size, string> = {
  md: 'min-h-control px-4 py-2 text-sm',
  sm: 'min-h-control px-3 py-1.5 text-xs',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
