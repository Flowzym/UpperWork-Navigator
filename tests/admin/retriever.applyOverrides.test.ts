import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentStore } from '../../src/rag/store';
import { applyChunkOverrides } from '../../src/lib/rag/overrides';

describe('retriever apply overrides', () => {
  let store: DocumentStore;
  
  beforeEach(() => {
    store = new DocumentStore();
  });

  const sampleChunks = [
    {
      id: 'chunk1',
      programId: 'prog1',
      page: 1,
      section: 'intro',
      text: 'Introduction text',
      normalizedText: 'introduction text',
      programName: 'Program 1',
      stand: '09/2025',
      status: 'aktiv' as const,
      startChar: 0,
      endChar: 100
    },
    {
      id: 'chunk2',
      programId: 'prog1',
      page: 2,
      section: 'details',
      text: 'Details text',
      normalizedText: 'details text',
      programName: 'Program 1',
      stand: '09/2025',
      status: 'aktiv' as const,
      startChar: 100,
      endChar: 200
    },
    {
      id: 'chunk3',
      programId: 'prog2',
      page: 5,
      section: 'intro',
      text: 'Another intro',
      normalizedText: 'another intro',
      programName: 'Program 2',
      stand: '09/2025',
      status: 'aktiv' as const,
      startChar: 0,
      endChar: 100
    }
  ];

  it('should remove muted chunks from index', () => {
    const overrides = {
      version: 1,
      chunks: [
        { programId: 'prog1', page: 1, muted: true }
      ]
    };

    const processedChunks = applyChunkOverrides(sampleChunks, overrides);
    store.add(processedChunks);
    
    const searchResults = store.search('introduction', 10);
    
    // Muted chunk should not appear in search results
    expect(searchResults).toHaveLength(0);
    
    // Other chunks should still be available
    const detailsResults = store.search('details', 10);
    expect(detailsResults).toHaveLength(1);
  });

  it('should apply section overrides', () => {
    const overrides = {
      version: 1,
      chunks: [
        { programId: 'prog1', page: 2, section: 'new-section' }
      ]
    };

    const processedChunks = applyChunkOverrides(sampleChunks, overrides);
    
    const modifiedChunk = processedChunks.find(c => c.programId === 'prog1' && c.page === 2);
    expect(modifiedChunk?.section).toBe('new-section');
  });

  it('should apply boost values', () => {
    const overrides = {
      version: 1,
      chunks: [
        { programId: 'prog1', page: 1, boost: 0.5 },
        { programId: 'prog2', page: 5, boost: -0.3 }
      ]
    };

    const processedChunks = applyChunkOverrides(sampleChunks, overrides);
    
    const boostedChunk = processedChunks.find(c => c.programId === 'prog1' && c.page === 1);
    const penalizedChunk = processedChunks.find(c => c.programId === 'prog2' && c.page === 5);
    
    expect(boostedChunk?.boost).toBe(0.5);
    expect(penalizedChunk?.boost).toBe(-0.3);
  });

  it('should handle null section override', () => {
    const overrides = {
      version: 1,
      chunks: [
        { programId: 'prog1', page: 1, section: null }
      ]
    };

    const processedChunks = applyChunkOverrides(sampleChunks, overrides);
    
    const modifiedChunk = processedChunks.find(c => c.programId === 'prog1' && c.page === 1);
    expect(modifiedChunk?.section).toBeNull();
  });

  it('should preserve original chunks when no overrides match', () => {
    const overrides = {
      version: 1,
      chunks: [
        { programId: 'nonexistent', page: 999, muted: true }
      ]
    };

    const processedChunks = applyChunkOverrides(sampleChunks, overrides);
    
    expect(processedChunks).toHaveLength(3);
    expect(processedChunks).toEqual(sampleChunks.map(c => ({ ...c, muted: false, boost: 0 })));
  });

  it('should combine multiple overrides for same chunk', () => {
    const overrides = {
      version: 1,
      chunks: [
        { programId: 'prog1', page: 1, section: 'combined-section', boost: 0.2, muted: false }
      ]
    };

    const processedChunks = applyChunkOverrides(sampleChunks, overrides);
    
    const combinedChunk = processedChunks.find(c => c.programId === 'prog1' && c.page === 1);
    expect(combinedChunk?.section).toBe('combined-section');
    expect(combinedChunk?.boost).toBe(0.2);
    expect(combinedChunk?.muted).toBe(false);
  });
});