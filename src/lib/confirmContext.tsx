'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import ConfirmDialog, { ConfirmOptions } from '@/components/ui/ConfirmDialog';

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * App-wide two-step confirmation: any component calls `await confirmAction({...})`
 * and gets `true`/`false` back once the user picks Cancel or Confirm in a real
 * modal — replacing scattered native `window.confirm()` popups (easy to
 * reflexively click through) with one consistent, styled, keyboard-focusable
 * dialog for every destructive/high-impact action in the app.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (result: boolean) => void } | null>(null);

  const confirmAction = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const settle = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirmAction}>
      {children}
      {pending && (
        <ConfirmDialog
          {...pending.options}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
}
