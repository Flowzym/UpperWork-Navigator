import { useState, useEffect } from 'react';
import { Citation, RetrievalResult, IngestionStats } from '../rag/schema';
import { ingestBrochure } from '../rag/ingest';
import { documentStore } from '../rag/store';
import { documentRetriever } from '../rag/retriever';

export function useRag() {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<IngestionStats | null>(null);

  // Index beim ersten Laden aufbauen
  const buildIndex = async (): Promise<void> => {
    if (isReady) return; // Bereits aufgebaut
    
    console.log('[useRag] Starte Index-Aufbau...');
    setLoading(true);
    setError(null);
    
    try {
      const { chunks, stats: ingestionStats } = await ingestBrochure();
      
      console.log(`[useRag] Ingestion abgeschlossen: ${chunks.length} Chunks`);
      // Chunks in Store laden
      documentStore.add(chunks);
      
      setStats(ingestionStats);
      setIsReady(true);
      
      console.log('RAG-Index aufgebaut:', ingestionStats);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Unbekannter Fehler beim Index-Aufbau';
      setError(errorMessage);
      console.error('[useRag] RAG-Index Fehler:', err);
    } finally {
      setLoading(false);
    }
  };

  // Query-basierte Suche
  const retrieveForQuery = async (query: string, k: number = 6): Promise<RetrievalResult> => {
    if (!isReady) {
      return {
        chunks: [],
        totalFound: 0,
        query
      };
    }
    
    return await documentRetriever.retrieveForQuery(query, k);
  };

  // Programm-spezifische Suche
  const retrieveForPrograms = async (
    programIds: string[], 
    topic?: 'checkliste' | 'vergleich' | null, 
    k: number = 8
  ): Promise<RetrievalResult> => {
    if (!isReady) {
      return {
        chunks: [],
        totalFound: 0,
        query: `Programme: ${programIds.join(', ')}`
      };
    }
    
    return await documentRetriever.retrieveForPrograms(programIds, topic, k);
  };

  // Kontext für KI-Prompts
  const buildContextForQuery = async (query: string, maxLength: number = 2000): Promise<string> => {
    if (!isReady) return '';
    
    const result = await retrieveForQuery(query, 6);
    return documentRetriever.buildContext(result.chunks, maxLength);
  };

  const buildContextForPrograms = async (
    programIds: string[], 
    topic?: 'checkliste' | 'vergleich' | null,
    maxLength: number = 2000
  ): Promise<string> => {
    if (!isReady) return '';
    
    const result = await retrieveForPrograms(programIds, topic, 8);
    return documentRetriever.buildContext(result.chunks, maxLength);
  };

  // Warnungen extrahieren
  const getWarningsForQuery = async (query: string): Promise<string[]> => {
    if (!isReady) return [];
    
    const result = await retrieveForQuery(query, 6);
    return documentRetriever.getWarnings(result.chunks);
  };

  const getWarningsForPrograms = async (programIds: string[]): Promise<string[]> => {
    if (!isReady) return [];
    
    const result = await retrieveForPrograms(programIds);
    return documentRetriever.getWarnings(result.chunks);
  };

  // Index-Statistiken
  const getIndexStats = () => {
    if (!isReady) return null;
    return documentStore.getStats();
  };

  return {
    isReady,
    loading,
    error,
    stats,
    buildIndex,
    retrieveForQuery,
    retrieveForPrograms,
    buildContextForQuery,
    buildContextForPrograms,
    getWarningsForQuery,
    getWarningsForPrograms,
    getIndexStats
  };
}