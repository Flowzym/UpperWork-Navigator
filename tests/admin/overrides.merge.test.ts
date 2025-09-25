import { describe, it, expect } from 'vitest';
import { mergeOverrides, applyChunkOverrides, RagOverrides } from '../../src/lib/rag/overrides';

describe('overrides merge', () => {
  const baseProgramMeta = [
    { programId: 'prog1', name: 'Program 1', pages: [1, 5] },
    { programId: 'prog2', name: 'Program 2', pages: [6, 10] }
  ];

  const baseChunks = [
    { programId: 'prog1', page: 1, section: 'intro', text: 'Chunk 1' },
    { programId: 'prog1', page: 2, section: 'details', text: 'Chunk 2' },
    { programId: 'prog2', page: 6, section: 'intro', text: 'Chunk 3' }
  ];

  it('should merge program meta overrides', () => {
    const overrides: RagOverrides = {
      version: 1,
      programMeta: [
        { programId: 'prog1', status: 'ausgesetzt' },
        { programId: 'prog3', status: 'aktiv' } // New program
      ]
    };

    const result = mergeOverrides(baseProgramMeta, overrides, 'programMeta');
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ 
      programId: 'prog1', 
      name: 'Program 1', 
      pages: [1, 5], 
      status: 'ausgesetzt' 
    });
    expect(result[2]).toEqual({ programId: 'prog3', status: 'aktiv' });
  });

  it('should apply chunk overrides correctly', () => {
    const overrides: RagOverrides = {
      version: 1,
      chunks: [
        { programId: 'prog1', page: 1, muted: true },
        { programId: 'prog1', page: 2, section: 'new-section', boost: 0.5 }
      ]
    };

    const result = applyChunkOverrides(baseChunks, overrides);
    
    // Muted chunk should be filtered out
    expect(result).toHaveLength(2);
    expect(result.find(c => c.page === 1)).toBeUndefined();
    
    // Modified chunk should have new properties
    const modifiedChunk = result.find(c => c.page === 2);
    expect(modifiedChunk).toBeDefined();
    expect(modifiedChunk?.section).toBe('new-section');
    expect(modifiedChunk?.boost).toBe(0.5);
  });

  it('should handle empty overrides', () => {
    const emptyOverrides: RagOverrides = { version: 1 };
    
    const metaResult = mergeOverrides(baseProgramMeta, emptyOverrides, 'programMeta');
    const chunkResult = applyChunkOverrides(baseChunks, emptyOverrides);
    
    expect(metaResult).toEqual(baseProgramMeta);
    expect(chunkResult).toEqual(baseChunks);
  });

  it('should prioritize overrides over base values', () => {
    const overrides: RagOverrides = {
      version: 1,
      programMeta: [
        { programId: 'prog1', name: 'Overridden Name', pages: { start: 10, end: 20 } }
      ]
    };

    const result = mergeOverrides(baseProgramMeta, overrides, 'programMeta');
    const prog1 = result.find(p => p.programId === 'prog1');
    
    expect(prog1?.name).toBe('Overridden Name');
    expect(prog1?.pages).toEqual({ start: 10, end: 20 });
  });
});