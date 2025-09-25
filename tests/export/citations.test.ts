import { describe, it, expect } from 'vitest';
import { extractCitations } from '../../src/features/export/hooks/useCitations';

describe('citations', () => {
  it('extracts and dedupes citations', () => {
    const text = 'Text [#P12 S.5] und nochmal [#P12 S.5] plus [#P13 S.7].';
    const { cleanedHtml, notes } = extractCitations(text);
    
    expect(cleanedHtml).toMatch(/<sup class="cite"/);
    expect(notes).toHaveLength(2); // P12 S.5 deduplicated, P13 S.7 separate
    expect(notes[0]).toMatchObject({ programId:'P12', page:5 });
    expect(notes[1]).toMatchObject({ programId:'P13', page:7 });
  });

  it('handles text without citations', () => {
    const text = 'Normal text without any citations.';
    const { cleanedHtml, notes } = extractCitations(text);
    
    expect(cleanedHtml).toBe(text);
    expect(notes).toHaveLength(0);
  });

  it('handles complex program IDs', () => {
    const text = 'Reference [#bildungskonto_ooe S.12] and [#qbn-2025 S.8].';
    const { cleanedHtml, notes } = extractCitations(text);
    
    expect(notes).toHaveLength(2);
    expect(notes[0]).toMatchObject({ programId:'bildungskonto_ooe', page:12 });
    expect(notes[1]).toMatchObject({ programId:'qbn-2025', page:8 });
  });

  it('preserves original text structure', () => {
    const text = 'Start [#P1 S.1] middle [#P2 S.2] end.';
    const { cleanedHtml, notes } = extractCitations(text);
    
    expect(cleanedHtml).toMatch(/^Start <sup.*middle <sup.*end\.$/);
    expect(notes).toHaveLength(2);
  });
});