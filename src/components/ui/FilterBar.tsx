import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function FilterBar({
  query,
  onQuery,
  placeholder = 'Search',
  children,
  className,
}: {
  query?: string;
  onQuery?: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
      {onQuery && (
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={placeholder}
            className="min-h-control w-full rounded-lg border border-line bg-card pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </label>
      )}
      {children}
    </div>
  );
}
