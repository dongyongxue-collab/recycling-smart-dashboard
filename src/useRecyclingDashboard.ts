import { useEffect, useMemo, useState } from 'react';
import type { RecyclingKnowledgeSnapshot } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function fetchDashboard(): Promise<RecyclingKnowledgeSnapshot> {
  const response = await fetch(`${API_BASE}/api/recycling-dashboard`);
  if (!response.ok) {
    throw new Error(`dashboard request failed: ${response.status}`);
  }
  return response.json();
}

export function useRecyclingDashboard() {
  const [snapshot, setSnapshot] = useState<RecyclingKnowledgeSnapshot | null>(null);
  const [connection, setConnection] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [error, setError] = useState<string | null>(null);

  const load = useMemo(
    () => async () => {
      try {
        const next = await fetchDashboard();
        setSnapshot(next);
        setConnection('online');
        setError(null);
      } catch (loadError) {
        setConnection('offline');
        setError(loadError instanceof Error ? loadError.message : '加载失败');
      }
    },
    [],
  );

  useEffect(() => {
    const bootstrap = window.setTimeout(() => {
      void load();
    }, 0);

    const timer = window.setInterval(() => {
      void load();
    }, 45_000);

    return () => {
      window.clearTimeout(bootstrap);
      window.clearInterval(timer);
    };
  }, [load]);

  return {
    snapshot,
    connection,
    error,
  };
}
