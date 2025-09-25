import { DocChunk, Citation } from './schema';

// Einfacher BM25-Score
function calculateBM25Score(
  queryTerms: string[],
  chunkText: string,
  avgChunkLength: number,
  k1: number = 1.2,
  b: number = 0.75
): number {
  const chunkTerms = chunkText.toLowerCase().split(/\s+/);
  const chunkLength = chunkTerms.length;
  
  let score = 0;
  
  queryTerms.forEach(term => {
    const termFreq = chunkTerms.filter(t => t.includes(term)).length;
    if (termFreq > 0) {
      const idf = Math.log(1 + 1 / Math.max(1, termFreq)); // Vereinfachte IDF
      const tf = (termFreq * (k1 + 1)) / (termFreq + k1 * (1 - b + b * (chunkLength / avgChunkLength)));
      score += idf * tf;
    }
  });
  
  return score;
}

// Fuzzy-Match für Tippfehler
function fuzzyMatch(term: string, text: string, maxDistance: number = 2): boolean {
  if (text.includes(term)) return true;
  
  if (term.length < 4) return false;
  
  // Einfache Edit-Distance
  const words = text.split(/\s+/);
  return words.some(word => {
    if (Math.abs(word.length - term.length) > maxDistance) return false;
    
    let distance = 0;
    const maxLen = Math.max(word.length, term.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (word[i] !== term[i]) distance++;
      if (distance > maxDistance) return false;
    }
    
    return distance <= maxDistance;
  });
}

export class DocumentStore {
  private chunks: DocChunk[] = [];
  private avgChunkLength: number = 0;
  
  add(chunks: DocChunk[]): void {
    this.chunks = chunks;
    this.avgChunkLength = chunks.reduce((sum, chunk) => sum + chunk.normalizedText.split(/\s+/).length, 0) / chunks.length;
  }
  
  search(query: string, k: number = 6, filters?: { programId?: string; section?: string }): Citation[] {
    if (!query.trim() || this.chunks.length === 0) return [];
    
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
    if (queryTerms.length === 0) return [];
    
    // Filter chunks
    let searchChunks = this.chunks;
    
    if (filters?.programId) {
      searchChunks = searchChunks.filter(chunk => chunk.programId === filters.programId);
    }
    
    if (filters?.section) {
      searchChunks = searchChunks.filter(chunk => chunk.section === filters.section);
    }
    
    // Score chunks
    const scoredChunks = searchChunks.map(chunk => {
      let score = calculateBM25Score(queryTerms, chunk.normalizedText, this.avgChunkLength);
      
      // Boost für exakte Treffer
      queryTerms.forEach(term => {
        if (chunk.normalizedText.includes(term)) {
          score += 2;
        } else if (fuzzyMatch(term, chunk.normalizedText)) {
          score += 1;
        }
      });
      
      // Boost für Titel/Programm-Name
      if (queryTerms.some(term => chunk.programName.toLowerCase().includes(term))) {
        score += 3;
      }
      
      // Boost für wichtige Sektionen
      if (['förderhöhe', 'voraussetzungen', 'antragsweg'].includes(chunk.section)) {
        score += 1;
      }
      
      // Penalty für inaktive Programme
      if (chunk.status === 'ausgesetzt') {
        score -= 2;
      } else if (chunk.status === 'entfallen') {
        score -= 10;
      }
      
      return {
        chunk,
        score: Math.max(0, score)
      };
    });
    
    // Sortiere und limitiere
    const topChunks = scoredChunks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    
    // Konvertiere zu Citations
    return topChunks.map(item => ({
      text: item.chunk.text,
      programName: item.chunk.programName,
      page: item.chunk.page,
      stand: item.chunk.stand,
      section: item.chunk.section,
      score: item.score,
      status: item.chunk.status
    }));
  }
  
  getChunksByProgram(programId: string, section?: string): DocChunk[] {
    let chunks = this.chunks.filter(chunk => chunk.programId === programId);
    
    if (section) {
      chunks = chunks.filter(chunk => chunk.section === section);
    }
    
    return chunks.sort((a, b) => a.page - b.page);
  }
  
  getAllPrograms(): string[] {
    const programIds = new Set(this.chunks.map(chunk => chunk.programId));
    return Array.from(programIds);
  }
  
  getStats(): { totalChunks: number; programCount: number; avgChunkLength: number } {
    return {
      totalChunks: this.chunks.length,
      programCount: this.getAllPrograms().length,
      avgChunkLength: this.avgChunkLength
    };
  }
}

// Singleton-Instanz
export const documentStore = new DocumentStore();