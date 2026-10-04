import React from 'react';
import { cn } from '@/lib/cn';

export default function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border border-line bg-card p-5 shadow-card', className)} {...props}>
      {children}
    </div>
  );
}
