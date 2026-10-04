import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export default function EmptyState({
  title,
  description,
  actionLabel,
  href,
  onAction,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-line bg-card px-6 py-14 text-center', className)}>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-secondary">{description}</p>}
      {actionLabel && href && (
        <Link href={href} className="mt-4 inline-flex min-h-control items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !href && (
        <button type="button" onClick={onAction} className="mt-4 inline-flex min-h-control items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
