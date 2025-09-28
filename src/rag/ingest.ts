import { DocChunk, ProgramMeta, IngestionStats } from './schema';
import { programMeta } from '../data/programMeta';
import { showToast } from '../lib/ui/toast';
import { loadStats, loadChunksCached, getRagCacheInfo } from '../lib/cache/ragCache';

// URL-Helper: respektiert <base href> und import.meta.env.BASE_URL
const BASE = new URL(
  (document.querySelector('base')?.getAttribute('href') ?? import.meta.env.BASE_URL ?? '/'),
  location.href
);
const url = (p: string) => new URL(p.replace(/^\//, ''), BASE).toString();

// Normalisierung für Suche (wie in searchIndex.ts)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[àáâãäåæ]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .trim();
}

// Lade Chunks aus Build-Time Ingestion
async function loadChunksFromJSON(): Promise<DocChunk[]> {
  try {
    console.log('[RAG] Versuche Chunks zu laden...');
    // Try to load with cache
    const stats = await loadStats();
    if (!stats) {
      console.warn('[RAG] Stats nicht verfügbar – verwende Fallback-Simulation');
      showToast('Broschürendaten fehlen: Lege stats.json & chunks.json unter public/rag/ ab.', 'error');
      return [];
    }
    
    console.log('[RAG] Stats geladen:', stats);
    const { chunks, source } = await loadChunksCached(stats);
    if (!chunks.length) {
      console.warn('[RAG] Keine Chunks verfügbar – verwende Fallback-Simulation');
      showToast('Broschürendaten fehlen: Lege stats.json & chunks.json unter public/rag/ ab.', 'error');
      throw new Error('Keine RAG-Chunks verfügbar - public/rag/chunks.json fehlt');
    }
    
    console.log(`[RAG] ${chunks.length} Chunks erfolgreich geladen (Quelle: ${source})`);
    // Validate chunks before returning
    const { valid, invalid } = validateChunks(chunks as DocChunk[]);
    if (invalid.length > 0) {
      console.warn(`[RAG] ${invalid.length} ungültige Chunks gefiltert (fehlende normalizedText oder andere Probleme)`);
    }
    
    if (source === 'idb') {
      showToast(`Offline – verwende Cache (build ${stats.buildId})`, 'info');
    } else {
      showToast(`RAG-System geladen: ${valid.length} Chunks aus Broschüre`, 'success');
    }
    
    return valid;
  } catch (error) {
    console.error('[RAG] Fehler beim Laden der Chunks:', error);
    console.error('[RAG] Kritischer Fehler: RAG-Dateien nicht verfügbar');
    showToast('RAG-System nicht verfügbar: public/rag/*.json Dateien fehlen', 'error');
    throw error;
  }
}

// Hauptfunktion für Ingestion
export async function ingestBrochure(): Promise<{ chunks: DocChunk[]; stats: IngestionStats }> {
  const startTime = Date.now();
  
  // Lade Chunks aus Build-Time Ingestion (harte Abhängigkeit)
  const chunks = await loadChunksFromJSON();
  
  // Lade Statistiken
  const statsResponse = await fetch(url('rag/stats.json'));
  if (!statsResponse.ok) {
    throw new Error(`stats.json nicht verfügbar: ${statsResponse.status}`);
  }
  const statsData = await statsResponse.json();
  
  const stats: IngestionStats = {
    totalPages: statsData.totalPages,
    totalChunks: chunks.length,
    programsFound: statsData.programsFound,
    processingTime: Date.now() - startTime
  };
  
  return { chunks, stats };
}

// Hilfsfunktion: Chunk-Qualität prüfen
export function validateChunks(chunks: DocChunk[]): { valid: DocChunk[]; invalid: DocChunk[] } {
  const valid: DocChunk[] = [];
  const invalid: DocChunk[] = [];
  const invalidReasons: string[] = [];
  
  chunks.forEach(chunk => {
    // Qualitätskriterien
    const hasContent = chunk.text.length >= 50;
    const hasProgram = chunk.programId && chunk.programName;
    const hasPage = chunk.page > 0;
    const hasNormalizedText = chunk.normalizedText && typeof chunk.normalizedText === 'string' && chunk.normalizedText.length > 0;
    
    if (hasContent && hasProgram && hasPage && hasNormalizedText) {
      valid.push(chunk);
    } else {
      // Repariere fehlende normalizedText
      if (!hasNormalizedText && chunk.text) {
        chunk.normalizedText = normalizeText(chunk.text);
        // Prüfe erneut nach Reparatur
        if (chunk.normalizedText && chunk.normalizedText.length > 0 && hasContent && hasProgram && hasPage) {
          valid.push(chunk);
          console.log(`[RAG] Chunk repariert: ${chunk.id} (normalizedText ergänzt)`);
          return;
        }
      }
      
      // Detaillierte Fehleranalyse
      const reasons = [];
      if (!hasContent) reasons.push(`text zu kurz (${chunk.text?.length || 0} < 50)`);
      if (!hasProgram) reasons.push(`programId/Name fehlt (${chunk.programId}/${chunk.programName})`);
      if (!hasPage) reasons.push(`page ungültig (${chunk.page})`);
      if (!hasNormalizedText) reasons.push(`normalizedText fehlt/leer`);
      
      const reason = `Chunk ${chunk.id || 'unknown'}: ${reasons.join(', ')}`;
      invalidReasons.push(reason);
      console.warn(`[RAG] Ungültiger Chunk: ${reason}`);
      
      invalid.push(chunk);
    }
  });
  
  // Zusammenfassung der Validierung
  if (invalid.length > 0) {
    console.warn(`[RAG] Chunk-Validierung: ${valid.length} gültig, ${invalid.length} ungültig`);
    console.warn(`[RAG] Ungültige Chunks Gründe:`, invalidReasons);
  } else {
    console.log(`[RAG] Chunk-Validierung: Alle ${valid.length} Chunks sind gültig`);
  }
  
  return { valid, invalid };
}