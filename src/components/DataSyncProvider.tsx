'use client';

import { useEffect, useRef, useState } from 'react';
import { DATA_CHANGE_EVENT, readStoredSnapshot, replaceStoredSnapshot, StoredSnapshot } from '@/lib/client-storage';
import { useAuth } from '@/contexts/AuthContext';

function hasData(snapshot: StoredSnapshot) {
  return Object.keys(snapshot).length > 0;
}

export default function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const hydratedUserId = useRef<number | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) setIsDataReady(true);
  }, [isLoading, user]);

  useEffect(() => {
    if (!user || hydratedUserId.current === user.id) return;
    const userId = user.id;
    setIsDataReady(false);
    let cancelled = false;

    async function hydrate() {
      try {
        const localSnapshot = readStoredSnapshot();
        const response = await fetch('/api/data', { cache: 'no-store' });
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        const serverSnapshot = (payload.data ?? {}) as StoredSnapshot;

        if (hasData(serverSnapshot)) {
          replaceStoredSnapshot(serverSnapshot);
        } else if (hasData(localSnapshot)) {
          await fetch('/api/data', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: localSnapshot }),
          });
        }
        hydratedUserId.current = userId;
      } catch (error) {
        console.error('Không thể đồng bộ dữ liệu học tập:', error);
      } finally {
        if (!cancelled) setIsDataReady(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        void fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: readStoredSnapshot() }),
        });
      }, 400);
    };
    window.addEventListener(DATA_CHANGE_EVENT, sync);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener(DATA_CHANGE_EVENT, sync);
    };
  }, [user]);

  if (isLoading || !isDataReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 font-black text-slate-700">
        Đang tải dữ liệu học tập...
      </div>
    );
  }

  return children;
}
