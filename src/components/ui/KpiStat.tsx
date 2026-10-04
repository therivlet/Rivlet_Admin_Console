import React from 'react';
import Link from 'next/link';
import CountUp from '@/components/ui/CountUp';
import { cn } from '@/lib/cn';

export default function KpiStat({
  label,
  value,
  hint,
  href,
  format,
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  format?: (value: number) => string;
}) {
  const body = (
    <>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-ink">
        <CountUp value={value} format={format} />
      </div>
      {hint && <div className="mt-2 text-sm text-secondary">{hint}</div>}
    </>
  );
  const className = 'block rounded-2xl border border-line bg-card p-5 shadow-card hover:border-accent/40 transition-colors';
  if (href) return <Link href={href} className={className}>{body}</Link>;
  return <div className={cn(className)}>{body}</div>;
}
