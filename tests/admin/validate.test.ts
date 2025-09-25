import { describe, it, expect } from 'vitest';
import { validateDataset, getIssuesByLevel, AdminIssue } from '../../src/lib/rag/validate';

describe('validate dataset', () => {
  const validChunks = [
    { programId: 'prog1', page: 1, section: 'intro', text: 'Valid chunk with sufficient length for testing purposes' },
    { programId: 'prog1', page: 2, section: 'details', text: 'Another valid chunk with good length' },
    { programId: 'prog2', page: 5, section: 'intro', text: 'Third valid chunk for program 2' }
  ];

  it('should detect unknown program IDs in overrides', () => {
    const overrides = {
      version: 1,
      programMeta: [
        { programId: 'unknown-prog', status: 'aktiv' }
      ],
      chunks: [
        { programId: 'another-unknown', page: 1, muted: true }
      ]
    };

    const issues = validateDataset(validChunks, overrides);
    const errors = issues.filter(i => i.level === 'error');
    
    expect(errors).toHaveLength(2);
    expect(errors[0].code).toBe('UNKNOWN_PROGRAM_ID');
    expect(errors[1].code).toBe('UNKNOWN_PROGRAM_ID');
  });

  it('should detect invalid page ranges', () => {
    const overrides = {
      version: 1,
      programMeta: [
        { programId: 'prog1', pages: { start: 10, end: 5 } } // Invalid: start > end
      ],
      sections: [
        { programId: 'prog1', pageStart: 8, pageEnd: 3, sectionTitle: 'Invalid' }
      ]
    };

    const issues = validateDataset(validChunks, overrides);
    const errors = issues.filter(i => i.level === 'error');
    
    expect(errors.some(e => e.code === 'INVALID_PAGE_RANGE')).toBe(true);
    expect(errors.some(e => e.code === 'INVALID_SECTION_RANGE')).toBe(true);
  });

  it('should detect overlapping sections', () => {
    const overrides = {
      version: 1,
      sections: [
        { programId: 'prog1', pageStart: 1, pageEnd: 5, sectionTitle: 'Section A' },
        { programId: 'prog1', pageStart: 3, pageEnd: 7, sectionTitle: 'Section B' } // Overlaps with A
      ]
    };

    const issues = validateDataset(validChunks, overrides);
    const errors = issues.filter(i => i.level === 'error');
    
    expect(errors.some(e => e.code === 'OVERLAPPING_SECTIONS')).toBe(true);
  });

  it('should warn about high muted rate', () => {
    const overrides = {
      version: 1,
      chunks: [
        { programId: 'prog1', page: 1, muted: true },
        { programId: 'prog1', page: 2, muted: true },
        { programId: 'prog2', page: 5, muted: true } // 100% muted
      ]
    };

    const issues = validateDataset(validChunks, overrides);
    const warnings = issues.filter(i => i.level === 'warn');
    
    expect(warnings.some(w => w.code === 'HIGH_MUTED_RATE')).toBe(true);
  });

  it('should warn about extreme boost values', () => {
    const overrides = {
      version: 1,
      chunks: [
        { programId: 'prog1', page: 1, boost: 2.5 }, // Too high
        { programId: 'prog1', page: 2, boost: -1.8 } // Too low
      ]
    };

    const issues = validateDataset(validChunks, overrides);
    const warnings = issues.filter(i => i.level === 'warn');
    
    expect(warnings.filter(w => w.code === 'EXTREME_BOOST')).toHaveLength(2);
  });

  it('should detect short and long chunks', () => {
    const chunksWithIssues = [
      { programId: 'prog1', page: 1, section: 'intro', text: 'Short' }, // Too short
      { programId: 'prog1', page: 2, section: 'details', text: 'A'.repeat(2500) }, // Too long
      { programId: 'prog2', page: 5, section: 'intro', text: 'Good length chunk for testing' }
    ];

    const issues = validateDataset(chunksWithIssues, { version: 1 });
    const warnings = issues.filter(i => i.level === 'warn');
    
    expect(warnings.some(w => w.code === 'SHORT_CHUNK')).toBe(true);
    expect(warnings.some(w => w.code === 'LONG_CHUNK')).toBe(true);
  });

  it('should group issues by level correctly', () => {
    const issues: AdminIssue[] = [
      { level: 'error', code: 'ERROR1', msg: 'Error 1' },
      { level: 'warn', code: 'WARN1', msg: 'Warning 1' },
      { level: 'error', code: 'ERROR2', msg: 'Error 2' },
      { level: 'warn', code: 'WARN2', msg: 'Warning 2' }
    ];

    const { errors, warnings } = getIssuesByLevel(issues);
    
    expect(errors).toHaveLength(2);
    expect(warnings).toHaveLength(2);
    expect(errors.every(e => e.level === 'error')).toBe(true);
    expect(warnings.every(w => w.level === 'warn')).toBe(true);
  });

  it('should return empty issues for valid dataset', () => {
    const validOverrides = {
      version: 1,
      programMeta: [
        { programId: 'prog1', status: 'aktiv' }
      ],
      sections: [
        { programId: 'prog1', pageStart: 1, pageEnd: 2, sectionTitle: 'Valid Section' }
      ],
      chunks: [
        { programId: 'prog1', page: 1, boost: 0.3 }
      ]
    };

    const issues = validateDataset(validChunks, validOverrides);
    const errors = issues.filter(i => i.level === 'error');
    
    expect(errors).toHaveLength(0);
  });
});