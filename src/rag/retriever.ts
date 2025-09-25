import { Citation, RetrievalResult } from './schema';
import { documentStore } from './store';
import { loadOverrides, applyChunkOverrides } from '../lib/rag/overrides';

export type RetrievalTopic = 'checkliste' | 'vergleich' | null;

class DocumentRetriever {
  private tracker?: (event: any) => void;

  setTracker(trackFn: (event: any) => void) {
    this.tracker = trackFn;
  }

  async retrieveForQuery(query: string, k: number = 6): Promise<RetrievalResult> {
    const citations = documentStore.search(query, k);
    
    // Track RAG retrieval
    if (this.tracker) {
      this.tracker({
        t: 'rag.retrieve',
        at: Date.now(),
        q: 'frei',
        hits: citations.length
      });
    }

    return {
      chunks: citations,
      totalFound: citations.length,
      query
    };
  }

  async retrieveForPrograms(
    programIds: string[], 
    topic: RetrievalTopic = null, 
    k: number = 8
  ): Promise<RetrievalResult> {
    let allCitations: Citation[] = [];
    
    for (const programId of programIds) {
      let sectionFilter: string | undefined;
      
      // Topic-spezifische Section-Filter
      if (topic === 'checkliste') {
        sectionFilter = 'voraussetzungen'; // Fokus auf Voraussetzungen für Checkliste
      } else if (topic === 'vergleich') {
        sectionFilter = 'förderhöhe'; // Fokus auf Förderhöhe für Vergleich
      }
      
      const chunks = documentStore.getChunksByProgram(programId, sectionFilter);
      const citations = chunks.slice(0, Math.ceil(k / programIds.length)).map(chunk => ({
        text: chunk.text,
        programName: chunk.programName,
        page: chunk.page,
        stand: chunk.stand,
        section: chunk.section,
        score: 1.0, // Default score for program-specific retrieval
        status: chunk.status
      }));
      
      allCitations.push(...citations);
    }

    // Track RAG retrieval
    if (this.tracker) {
      this.tracker({
        t: 'rag.retrieve',
        at: Date.now(),
        q: topic === 'checkliste' ? 'karte' : topic === 'vergleich' ? 'vergleich' : 'frei',
        hits: allCitations.length
      });
    }

    return {
      chunks: allCitations.slice(0, k),
      totalFound: allCitations.length,
      query: `Programme: ${programIds.join(', ')}`,
      filters: { section: topic || undefined }
    };
  }

  buildContext(citations: Citation[], maxLength: number = 2000): string {
    if (citations.length === 0) return '';
    
    let context = 'BROSCHÜREN-KONTEXT:\n\n';
    let currentLength = context.length;
    
    for (const citation of citations) {
      const snippet = `[${citation.programName}, S. ${citation.page}, ${citation.section}]\n${citation.text}\n\n`;
      
      if (currentLength + snippet.length > maxLength) {
        break;
      }
      
      context += snippet;
      currentLength += snippet.length;
    }
    
    return context.trim();
  }

  getWarnings(citations: Citation[]): string[] {
    const warnings: string[] = [];
    
    // Prüfe auf problematische Programme
    const problemPrograms = citations.filter(c => 
      c.status === 'ausgesetzt' || c.status === 'endet_am'
    );
    
    if (problemPrograms.length > 0) {
      const ausgesetzt = problemPrograms.filter(c => c.status === 'ausgesetzt');
      const endet = problemPrograms.filter(c => c.status === 'endet_am');
      
      if (ausgesetzt.length > 0) {
        warnings.push('Programm derzeit ausgesetzt – keine Anträge möglich');
      }
      
      if (endet.length > 0) {
        warnings.push('Programm endet am 31.12.2025 – begrenzte Laufzeit');
      }
    }
    
    return warnings;
  }

  async buildIndex(): Promise<void> {
    // Load and apply overrides
    try {
      const overrides = await loadOverrides();
      
      // Get base chunks
      const baseChunks = documentStore.getChunksByProgram('');
      
      // Apply chunk overrides (muting, boosting, section changes)
      const processedChunks = applyChunkOverrides(baseChunks, overrides);
      
      // Rebuild store with processed chunks
      documentStore.add(processedChunks);
      
      console.log('RAG Index rebuilt with overrides:', {
        originalChunks: baseChunks.length,
        processedChunks: processedChunks.length,
        mutedChunks: baseChunks.length - processedChunks.length
      });
      
    } catch (error) {
      console.warn('Failed to apply overrides, using base chunks:', error);
    }
  }
}

export const documentRetriever = new DocumentRetriever();