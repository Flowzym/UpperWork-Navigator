import { idbGet, idbSet, idbKeys, idbDel } from '../storage/idb';

// Subpfad-sicherer Basis-Pfad (Vite BASE_URL)
const URL_BASE = import.meta.env.BASE_URL || '/';
const u = (p: string) => {
  // Einfache URL-Konstruktion ohne doppelte Slashes
  const base = URL_BASE.endsWith('/') ? URL_BASE.slice(0, -1) : URL_BASE;
  const path = p.startsWith('/') ? p : `/${p}`;
  const fullUrl = `${base}${path}`;
  console.log(`[ragCache] URL konstruiert: ${fullUrl}`);
  return fullUrl;
};

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
    const url = u('/rag/stats.json');
    console.log(`[ragCache] Lade Stats von: ${url}`);
    const r = await fetch(url, { cache: 'no-store' });
    console.log(`[ragCache] Stats Response: ${r.status} ${r.statusText}`);
    if (!r.ok) return;
    const s = await r.json();
    console.log(`[ragCache] Stats geladen:`, s);
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
    console.log(`[ragCache] Stats erfolgreich verarbeitet:`, out);
    return out;
  } catch {
    console.warn(`[ragCache] Stats laden fehlgeschlagen`);
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
    console.log(`[ragCache] Chunks aus Cache geladen (${key})`);
    const parsed = JSON.parse(hit);
    _lastInfo = { ..._lastInfo, source: 'idb', chunks: Array.isArray(parsed) ? parsed.length : 0 };
    return { chunks: parsed, source: 'idb', key };
  }
  const url = u('/rag/chunks.json');
  console.log(`[ragCache] Lade Chunks von: ${url}`);
  const r = await fetch(url, { cache: 'no-store' });
  console.log(`[ragCache] Chunks Response: ${r.status} ${r.statusText}`);
  if (!r.ok) throw new Error('chunks.json nicht verfügbar');
  const text = await r.text();
  console.log(`[ragCache] Chunks Text-Länge: ${text.length} Zeichen`);
  await idbSet(key, text);
  // alte Versionen räumen
  for (const k of await idbKeys()) {
    if (k.startsWith('rag:chunks:') && k !== key) await idbDel(k);
  }
  const parsed = JSON.parse(text);
  console.log(`[ragCache] Chunks geparst: ${Array.isArray(parsed) ? parsed.length : 'nicht Array'} Items`);
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