import { DocChunk, ProgramMeta, IngestionStats } from './schema';
import { programMeta } from '../data/programMeta';
import { showToast } from '../lib/ui/toast';
import { loadStats, loadChunksCached, getRagCacheInfo } from '../lib/cache/ragCache';

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
      // Status für UI markieren
      const cacheModule = await import('../lib/cache/ragCache');
      (cacheModule as any)._lastInfo = { ...(cacheModule as any)._lastInfo, source: 'simulation', chunks: 0 };
      return [];
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
    console.warn('[RAG] Simulationsdaten aktiv: <BASE_URL>/rag/{stats.json,chunks.json} nicht gefunden. ' +
    showToast('Broschürendaten fehlen: Lege stats.json & chunks.json unter public/rag/ ab.', 'error');
    showToast('Broschürendaten fehlen: Lege stats.json & chunks.json unter public/rag/ ab.', 'error');
    // Status für UI markieren
    const cacheModule = await import('../lib/cache/ragCache');
    (cacheModule as any)._lastInfo = { ...(cacheModule as any)._lastInfo, source: 'simulation', chunks: 0 };
    return [];
  }
}

// Simulierte Inhalte als Fallback (falls PDF nicht vorhanden)
function generateSimulatedContent(programMeta: Record<string, any>): { chunks: DocChunk[]; stats: IngestionStats } {
  const chunks: DocChunk[] = [];
  let chunkId = 0;
  
  Object.entries(programMeta).forEach(([programId, data]) => {
    const [startPage, endPage] = data.pages;
    
    for (let page = startPage; page <= endPage; page++) {
      const pageOffset = page - startPage;
      
      let content = `${data.name}\n\n`;
      let section = 'allgemein';
      
      switch (pageOffset) {
        case 0:
          content += `ÜBERBLICK\n${data.name} unterstützt die berufliche Weiterbildung.\n\nZIELGRUPPE\nBeschäftigte und Arbeitsuchende in Oberösterreich.`;
          section = 'zielgruppe';
          break;
        case 1:
          content += `FÖRDERHÖHE\nBis zu 75% der Kurskosten, maximal 5.000€ pro Jahr.\n\nVORAUSSETZUNGEN\nHauptwohnsitz in Oberösterreich, Mindestalter 18 Jahre.`;
          section = 'förderhöhe';
          break;
        case 2:
          content += `ANTRAGSWEG\nAntragstellung über das entsprechende Portal.\n\nFRIST\nLaufende Antragstellung möglich.`;
          section = 'antragsweg';
          break;
        default:
          content += `PASST WENN\nSie die Voraussetzungen erfüllen.\n\nPASST NICHT WENN\nVoraussetzungen nicht erfüllt sind.`;
          section = 'passt_wenn';
      }
      
      // Chunk erstellen
      chunks.push({
        id: `${programId}-chunk-${++chunkId}`,
        text: content,
        normalizedText: normalizeText(content),
        programId,
        programName: data.name,
        page,
        section,
        stand: data.stand,
        status: data.status,
        startChar: 0,
        endChar: content.length
      });
    }
  });
  
  const stats: IngestionStats = {
    totalPages: Math.max(...Object.values(programMeta).map((d: any) => d.pages[1])),
    totalChunks: chunks.length,
    programsFound: Object.keys(programMeta).length,
    processingTime: 0
  };
  
  return { chunks, stats };
}

// Hauptfunktion für Ingestion
export async function ingestBrochure(): Promise<{ chunks: DocChunk[]; stats: IngestionStats }> {
  const startTime = Date.now();
  
  try {
    // Lade Chunks aus Build-Time Ingestion
    const chunks = await loadChunksFromJSON();
    
    // Fallback auf simulierte Inhalte wenn keine Chunks geladen werden konnten
    if (chunks.length === 0) {
      console.log('Verwende simulierte Broschüren-Inhalte (chunks.json nicht verfügbar)');
      const { chunks: simChunks, stats: simStats } = generateSimulatedContent(programMeta);
      return { 
        chunks: simChunks, 
        stats: { 
          ...simStats, 
          processingTime: Date.now() - startTime 
        } 
      };
    }
    
    // Lade Statistiken (optional)
    let statsData;
    try {
      const statsResponse = await fetch('/rag/stats.json');
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
      }
    } catch (e) {
      // Statistiken sind optional
    }
    
    const stats: IngestionStats = {
      totalPages: statsData?.totalPages || 48,
      totalChunks: chunks.length,
      programsFound: statsData?.programsFound || 6,
      processingTime: Date.now() - startTime
    };
    
    return { chunks, stats };
    
  } catch (error) {
    console.error('Fehler bei PDF-Ingestion:', error);
    
    // Fallback auf simulierte Inhalte
    console.log('Verwende simulierte Broschüren-Inhalte als Fallback');
    const { chunks: simChunks, stats: simStats } = generateSimulatedContent(programMeta);
    return { 
      chunks: simChunks, 
      stats: { 
        ...simStats, 
        processingTime: Date.now() - startTime 
      } 
    };
  }
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