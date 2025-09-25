import { idbGet, idbSet, idbKeys, idbDel } from '../storage/idb';

export type RagStats = { 
  buildId: string; 
  lastModified?: string;
  totalChunks: number;
  totalPages: number;
  programsFound: number;
};

export async function loadStats(): Promise<RagStats|undefined>{
  try{ 
    const r=await fetch('/rag/stats.json',{cache:'no-store'}); 
    if(!r.ok) return; 
    const stats = await r.json();
    // Generate buildId from stats if not present
    if (!stats.buildId) {
      stats.buildId = `${stats.totalChunks}-${stats.totalPages}-${stats.programsFound}`;
    }
    return stats;
  }catch{ 
    return; 
  }
}

export async function loadChunksCached(stats: RagStats){
  const key = `rag:chunks:${stats.buildId}`;
  const hit = await idbGet<string>(key);
  
  if (hit) {
    return { 
      chunks: JSON.parse(hit), 
      source:'idb' as const, 
      key 
    };
  }
  
  const r = await fetch('/rag/chunks.json',{cache:'no-store'}); 
  const text = await r.text();
  await idbSet(key, text); // als String speichern
  
  // alte Versionen aufräumen
  for (const k of await idbKeys()) {
    if (k.startsWith('rag:chunks:') && k!==key) {
      await idbDel(k);
    }
  }
  
  return { 
    chunks: JSON.parse(text), 
    source:'network' as const, 
    key 
  };
}