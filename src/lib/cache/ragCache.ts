import { idbGet, idbSet, idbKeys, idbDel } from '../storage/idb';

// Subpfad-sicherer Basis-Pfad (Vite BASE_URL)
const URL_BASE = (import.meta.env.BASE_URL ?? '').replace(/\/$/, '');
const u = (p: string) => `${URL_BASE}${p.startsWith('/') ? '' : '/'}${p}`;

export type RagStats = {
  buildId: string;
  lastModified?: string;
  totalChunks?: number;
  totalPages?: number;
  programsFound?: number;
};

export type RagCacheInfo = {
  source: 'network' | 'idb' | 'simulation';
  buildId?: string;
  chunks: number;
  urlBase: string;
};

let _lastInfo: RagCacheInfo = { source: 'network', buildId: undefined, chunks: 0, urlBase: URL_BASE };
export function getRagCacheInfo(): RagCacheInfo { return _lastInfo; }

export async function loadStats(): Promise<RagStats | undefined> {
  try {
    const r = await fetch(u('/rag/stats.json'), { cache: 'no-store' });
    if (!r.ok) return;
    const s = await r.json();
    const buildId =
      s.buildId ??
      `${s.totalChunks ?? 0}-${s.totalPages ?? 0}-${s.programsFound ?? 0}`;
    const out = {
      buildId,
      lastModified: s.lastModified,
      totalChunks: s.totalChunks,
      totalPages: s.totalPages,
      programsFound: s.programsFound,
    };
    _lastInfo = { ..._lastInfo, buildId };
    return out;
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
    const parsed = JSON.parse(hit);
    _lastInfo = { ..._lastInfo, source: 'idb', chunks: Array.isArray(parsed) ? parsed.length : 0 };
    return { chunks: parsed, source: 'idb', key };
  }
  const r = await fetch(u('/rag/chunks.json'), { cache: 'no-store' });
  if (!r.ok) throw new Error('chunks.json nicht verfügbar');
  const text = await r.text();
  await idbSet(key, text);
  // alte Versionen räumen
  for (const k of await idbKeys()) {
    if (k.startsWith('rag:chunks:') && k !== key) await idbDel(k);
  }
  const parsed = JSON.parse(text);
  _lastInfo = { ..._lastInfo, source: 'network', chunks: Array.isArray(parsed) ? parsed.length : 0 };
  return { chunks: parsed, source: 'network', key };
}

export async function clearRagCache(): Promise<void> {
  try {
    // Lösche alle RAG-bezogenen Keys
    const keys = await idbKeys();
    const ragKeys = keys.filter(k => k.startsWith('rag:'));
    await Promise.all(ragKeys.map(k => idbDel(k)));
    _lastInfo = { source: 'network', buildId: undefined, chunks: 0, urlBase: URL_BASE };
  } catch (error) {
    console.error('Cache-Reset fehlgeschlagen:', error);
    throw error;
  }
}
export async function invalidateIfMismatch(newStats: RagStats): Promise<boolean> {
  // einfache Implementierung: nichts zu invalidieren, da loadChunksCached bereinigt
  return false;
}