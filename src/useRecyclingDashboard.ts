import { useEffect, useMemo, useState } from 'react';
import type { RecyclingKnowledgeSnapshot } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const FALLBACK_SNAPSHOT_PATH = '/bootstrap-snapshot.json';

async function fetchSnapshot(url: string): Promise<RecyclingKnowledgeSnapshot> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`dashboard request failed: ${response.status}`);
  }
  return response.json();
}

async function fetchDashboard(): Promise<RecyclingKnowledgeSnapshot> {
  return fetchSnapshot(`${API_BASE}/api/recycling-dashboard`);
}

async function fetchFallbackSnapshot(): Promise<RecyclingKnowledgeSnapshot> {
  return fetchSnapshot(FALLBACK_SNAPSHOT_PATH);
}

export function useRecyclingDashboard() {
  const [snapshot, setSnapshot] = useState<RecyclingKnowledgeSnapshot | null>(null);
  const [connection, setConnection] = useState<'connecting' | 'online' | 'snapshot' | 'offline'>('connecting');
  const [error, setError] = useState<string | null>(null);

  const load = useMemo(
    () => async () => {
      try {
        const next = await fetchDashboard();
        setSnapshot(next);
        setConnection('online');
        setError(null);
      } catch (loadError) {
        try {
          const fallback = await fetchFallbackSnapshot();
          setSnapshot(fallback);
          setConnection('snapshot');
          setError('实时接口暂不可用，已切换为最近静态快照。');
        } catch {
          setConnection('offline');
          setError(loadError instanceof Error ? loadError.message : '加载失败');
        }
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
