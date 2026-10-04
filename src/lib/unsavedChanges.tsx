'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/lib/confirmContext';

interface UnsavedContextType {
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  confirmLeave: () => Promise<boolean>;
}

const UnsavedContext = createContext<UnsavedContextType>({
  dirty: false,
  setDirty: () => {},
  confirmLeave: async () => true,
});

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [dirty, setDirtyState] = useState(false);
  const dirtyRef = useRef(false);
  const confirmAction = useConfirm();
  const router = useRouter();

  const setDirty = useCallback((next: boolean) => {
    dirtyRef.current = next;
    setDirtyState(next);
  }, []);

  const confirmLeave = useCallback(async () => {
    if (!dirtyRef.current) return true;
    const ok = await confirmAction({
      title: 'Leave without saving?',
      message: 'You have unsaved changes. If you leave now, they will be discarded.',
      confirmLabel: 'Leave',
      cancelLabel: 'Stay',
      danger: true,
    });
    if (ok) setDirty(false);
    return ok;
  }, [confirmAction, setDirty]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const sentinel = { rivletUnsaved: true };
    window.history.pushState(sentinel, '');
    const onPop = () => {
      confirmLeave().then((ok) => {
        if (ok) {
          window.history.back();
        } else {
          window.history.pushState(sentinel, '');
        }
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [dirty, confirmLeave]);

  useEffect(() => {
    if (!dirty) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const next = new URL(href, window.location.href);
      if (next.origin !== window.location.origin) return;
      if (next.pathname === window.location.pathname && next.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      confirmLeave().then((ok) => {
        if (ok) router.push(`${next.pathname}${next.search}${next.hash}`);
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [dirty, confirmLeave, router]);

  return (
    <UnsavedContext.Provider value={{ dirty, setDirty, confirmLeave }}>
      {children}
    </UnsavedContext.Provider>
  );
}

export function useUnsavedChanges(dirty: boolean) {
  const { setDirty } = useContext(UnsavedContext);
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
}

export function useLeaveGuard() {
  return useContext(UnsavedContext).confirmLeave;
}
