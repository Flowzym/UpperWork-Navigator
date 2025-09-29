// src/data/usePrograms.ts
import { useEffect, useState } from 'react';
import { buildProgramsFromRag, Program, RagMeta as DerivedRagMeta, RagChunk as DerivedRagChunk } from './programs.fromRag';
import { loadRagFiles } from '../rag/ingest';
import type { RagStats, RagMeta, RagChunk } from '../rag/schema';

export function usePrograms() {
  const [state, set] = useState<{
    programs: Program[];
    source: 'rag' | 'empty';
    loading: boolean;
    error?: string;
    stats: RagStats | null;
    warnings: string[];
  }>({
    programs: [],
    source: 'rag',
    loading: true,
    stats: null,
    warnings: []
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { stats, meta, chunks, warnings } = await loadRagFiles();

        if (cancelled) return;

        const normalizedMeta: DerivedRagMeta[] = (meta as RagMeta)
          .map(item => {
            const programId = item.programId ?? item.id;
            const title = item.title ?? '';
            const pagesRaw = Array.isArray(item.pages) ? item.pages : [item.startPage, item.endPage];
            const start = Number(pagesRaw?.[0] ?? item.startPage ?? 0) || 0;
            const end = Number(pagesRaw?.[1] ?? item.endPage ?? pagesRaw?.[0] ?? item.startPage ?? start) || start;
            if (!programId || !title) return null;
            return {
              programId,
              title,
              pages: [start, end] as [number, number],
              stand: (item as any).stand ?? null,
              status: (item as any).status ?? null
            } satisfies DerivedRagMeta;
          })
          .filter((m): m is DerivedRagMeta => !!m);

        const normalizedChunks: DerivedRagChunk[] = (chunks as RagChunk[])
          .map(chunk => {
            const page = Number(chunk.page ?? chunk.seite ?? 0) || 0;
            const section = typeof chunk.section === 'string' ? chunk.section : '';
            const text = typeof chunk.text === 'string' ? chunk.text : '';
            if (!text) return null;
            return {
              page,
              section,
              text,
              status: (chunk as any).status ?? null,
              stand: (chunk as any).stand ?? null
            } satisfies DerivedRagChunk;
          })
          .filter((c): c is DerivedRagChunk => !!c);

        if (normalizedMeta.length && normalizedChunks.length) {
          const progs = buildProgramsFromRag(normalizedMeta, normalizedChunks);
          const derivedStats = stats ? { ...stats } : null;
          const derivedWarnings = [...warnings];

          if (derivedStats) {
            if (!derivedStats.programs && normalizedMeta.length) {
              derivedStats.programs = normalizedMeta.length;
              derivedWarnings.push('stats.programs missing - derived from meta length');
            }
            if (!derivedStats.chunks && normalizedChunks.length) {
              derivedStats.chunks = normalizedChunks.length;
              derivedWarnings.push('stats.chunks missing - derived from chunk length');
            }
          }

          set({ programs: progs, source: 'rag', loading: false, stats: derivedStats, warnings: derivedWarnings });
          return;
        }

        if (!cancelled) {
          console.warn('[RAG] Dateien fehlen', {
            meta: normalizedMeta.length > 0,
            chunks: normalizedChunks.length > 0
          });
        }
      } catch (e) {
        console.warn('[Programs] rag load failed', e);
      }

      if (!cancelled) {
        set({
          programs: [],
          source: 'empty',
          loading: false,
          error: 'Keine Broschürendaten gefunden',
          stats: null,
          warnings: []
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}