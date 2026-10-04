import React from 'react';

export default function ChartFrame({
  title,
  summary,
  children,
  legend,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
  legend?: React.ReactNode;
}) {
  return (
    <figure className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{title}</span>
        {legend}
      </figcaption>
      <div className="w-full overflow-x-auto">{children}</div>
      <p className="sr-only">{summary}</p>
    </figure>
  );
}
