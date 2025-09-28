import { useState, useEffect } from 'react';
import { Program } from '../types';
import { buildProgramsFromRag, RagProgramMeta, RagChunk } from './programs.fromRag';
import { samplePrograms } from './samplePrograms';

export type ProgramSource = 'rag' | 'samples' | 'simulation';

export interface UseProgramsResult {
  programs: Program[];
  source: ProgramSource;
  loading: boolean;
  error: string | null;
  stats: {
    totalPrograms: number;
    totalChunks: number;
    buildId?: string;
  };
}

// BASE_URL-sichere URL-Konstruktion
const URL_BASE = import.meta.env.BASE_URL || '/';
const buildUrl = (path: string) => {
  const base = URL_BASE.endsWith('/') ? URL_BASE.slice(0, -1) : URL_BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export function usePrograms(): UseProgramsResult {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [source, setSource] = useState<ProgramSource>('samples');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalChunks: 0,
    buildId: undefined as string | undefined
  });

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Versuche RAG-Daten zu laden
      const ragResult = await loadFromRag();
      if (ragResult.success) {
        setPrograms(ragResult.programs);
        setSource('rag');
        setStats({
          totalPrograms: ragResult.programs.length,
          totalChunks: ragResult.totalChunks,
          buildId: ragResult.buildId
        });
        console.log(`[usePrograms] RAG-Daten geladen: ${ragResult.programs.length} Programme`);
        return;
      }
      
      // Fallback auf Sample-Daten
      console.log('[usePrograms] Fallback auf Sample-Daten');
      setPrograms(samplePrograms);
      setSource('samples');
      setStats({
        totalPrograms: samplePrograms.length,
        totalChunks: 0,
        buildId: undefined
      });
      
    } catch (err: any) {
      console.error('[usePrograms] Fehler beim Laden:', err);
      setError(err.message);
      
      // Fallback auf Sample-Daten bei Fehler
      setPrograms(samplePrograms);
      setSource('simulation');
      setStats({
        totalPrograms: samplePrograms.length,
        totalChunks: 0,
        buildId: undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFromRag = async (): Promise<{
    success: boolean;
    programs: Program[];
    totalChunks: number;
    buildId?: string;
  }> => {
    try {
      // Debug-Logging für URLs
      const statsUrl = buildUrl('/rag/stats.json');
      const chunksUrl = buildUrl('/rag/chunks.json');
      const metaUrl = buildUrl('/rag/programMeta.json');
      
      console.log('[usePrograms] Lade RAG-Daten von:', { statsUrl, chunksUrl, metaUrl });
      
      // Lade Stats
      const statsResponse = await fetch(statsUrl, { cache: 'no-store' });
      if (!statsResponse.ok) {
        console.log(`[usePrograms] Stats nicht verfügbar: ${statsResponse.status}`);
        return { success: false, programs: [], totalChunks: 0 };
      }
      const stats = await statsResponse.json();
      
      // Lade Chunks
      const chunksResponse = await fetch(chunksUrl, { cache: 'no-store' });
      if (!chunksResponse.ok) {
        console.log(`[usePrograms] Chunks nicht verfügbar: ${chunksResponse.status}`);
        return { success: false, programs: [], totalChunks: 0 };
      }
      const chunks: RagChunk[] = await chunksResponse.json();
      
      // Lade ProgramMeta
      const metaResponse = await fetch(metaUrl, { cache: 'no-store' });
      if (!metaResponse.ok) {
        console.log(`[usePrograms] ProgramMeta nicht verfügbar: ${metaResponse.status}`);
        return { success: false, programs: [], totalChunks: 0 };
      }
      const programMeta: RagProgramMeta[] = await metaResponse.json();
      
      // Baue Programme aus RAG-Daten
      const programs = buildProgramsFromRag(programMeta, chunks);
      
      console.log(`[usePrograms] RAG-Programme erstellt: ${programs.length} aus ${chunks.length} Chunks`);
      
      return {
        success: true,
        programs,
        totalChunks: chunks.length,
        buildId: stats.buildId
      };
      
    } catch (error) {
      console.error('[usePrograms] RAG-Laden fehlgeschlagen:', error);
      return { success: false, programs: [], totalChunks: 0 };
    }
  };

  return {
    programs,
    source,
    loading,
    error,
    stats
  };
}