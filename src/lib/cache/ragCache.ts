import { idbGet, idbSet, idbKeys, idbDel } from '../storage/idb';

export type RagStats = {
  buildId: string;
  lastModified?: string;
  totalChunks?: number;
  totalPages?: number;
  programsFound?: number;
};

export async function loadStats(): Promise<RagStats | undefined> {
  try {
    const r = await fetch('/rag/stats.json', { cache: 'no-store' });
    if (!r.ok) return;
    const s = await r.json();
    const buildId =
      s.buildId ??
      `${s.totalChunks ?? 0}-${s.totalPages ?? 0}-${s.programsFound ?? 0}`;
    return {
      buildId,
      lastModified: s.lastModified,
      totalChunks: s.totalChunks,
      totalPages: s.totalPages,
      programsFound: s.programsFound,
    };
  } catch {
    return;
  }
}

export async function loadChunksCached(stats: RagStats): Promise<{
  chunks: unknown[];
  source: 'network' | 'idb';
  key: string;
}> {
  const key = `rag:chunks:${stats.buildId}`;
  const hit = await idbGet<string>(key);
  if (hit) {
    return { chunks: JSON.parse(hit), source: 'idb', key };
  }
  const r = await fetch('/rag/chunks.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('chunks.json nicht verfügbar');
  const text = await r.text();
  await idbSet(key, text);
  // alte Versionen räumen
  for (const k of await idbKeys()) {
    if (k.startsWith('rag:chunks:') && k !== key) await idbDel(k);
  }
  return { chunks: JSON.parse(text), source: 'network', key };
}

export async function invalidateIfMismatch(newStats: RagStats): Promise<boolean> {
  // einfache Implementierung: nichts zu invalidieren, da loadChunksCached bereinigt
  return false;
}