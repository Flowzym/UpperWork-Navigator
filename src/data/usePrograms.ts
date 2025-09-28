// src/data/usePrograms.ts
import { useEffect, useState } from 'react';
import { buildProgramsFromRag, Program, RagMeta, RagChunk } from './programs.fromRag';

export function usePrograms() {
  const [state, set] = useState<{ programs: Program[]; source: 'rag' | 'empty'; loading: boolean; error?: string }>({
    programs: [],
    source: 'rag',
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
    const j = (p: string) => fetch(`${BASE}${p}`, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null));

    (async () => {
      try {
        const [meta, chunks] = await Promise.all<[RagMeta[] | null, RagChunk[] | null]>([
          j('/rag/programMeta.json'),
          j('/rag/chunks.json'),
        ]);

        if (!cancelled && Array.isArray(meta) && meta.length && Array.isArray(chunks) && chunks.length) {
          const progs = buildProgramsFromRag(meta, chunks);
          set({ programs: progs, source: 'rag', loading: false });
          return;
        }
        
        if (!cancelled) {
          console.warn('[RAG] Dateien fehlen', { 
            meta: Array.isArray(meta) && meta.length > 0, 
            chunks: Array.isArray(chunks) && chunks.length > 0 
          });
        }
      } catch (e) {
        console.warn('[Programs] rag load failed', e);
      }

      if (!cancelled) set({ programs: [], source: 'empty', loading: false, error: 'Keine Broschürendaten gefunden' });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}