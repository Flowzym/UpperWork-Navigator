import { DocChunk, ProgramMeta, IngestionStats } from './schema';
import { programMeta } from '../data/programMeta';

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
    const response = await fetch('/rag/chunks.json');
    if (!response.ok) {
      console.warn('chunks.json nicht gefunden, verwende Fallback-Simulation');
      return [];
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('chunks.json nicht verfügbar (HTML-Response), verwende Fallback-Simulation');
      return [];
    }
    
    const text = await response.text();
    
    // Check if response is HTML (404 page)
    if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<!DOCTYPE')) {
      console.warn('chunks.json nicht verfügbar (404 HTML-Response), verwende Fallback-Simulation');
      return [];
    }
    
    const chunks = JSON.parse(text);
    return chunks as DocChunk[];
  } catch (error) {
    console.warn('Fehler beim Laden der Chunks, verwende Fallback-Simulation:', error);
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
  
  chunks.forEach(chunk => {
    // Qualitätskriterien
    const hasContent = chunk.text.length >= 50;
    const hasProgram = chunk.programId && chunk.programName;
    const hasPage = chunk.page > 0;
    
    if (hasContent && hasProgram && hasPage) {
      valid.push(chunk);
    } else {
      invalid.push(chunk);
    }
  });
  
  return { valid, invalid };
}