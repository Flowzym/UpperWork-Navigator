export type AdminIssue = { 
  level: "error" | "warn"; 
  code: string; 
  msg: string; 
  ref?: any 
};

export function validateDataset(chunks: any[], overrides: any): AdminIssue[] {
  const issues: AdminIssue[] = [];
  
  // Get all program IDs from chunks
  const validProgramIds = new Set(chunks.map(c => c.programId));
  
  // Check ProgramMeta overrides
  if (overrides.programMeta) {
    overrides.programMeta.forEach((meta: any) => {
      if (!validProgramIds.has(meta.programId)) {
        issues.push({
          level: 'error',
          code: 'UNKNOWN_PROGRAM_ID',
          msg: `Unknown program ID: ${meta.programId}`,
          ref: meta
        });
      }
      
      if (meta.pages) {
        if (meta.pages.start > meta.pages.end) {
          issues.push({
            level: 'error',
            code: 'INVALID_PAGE_RANGE',
            msg: `Invalid page range: ${meta.pages.start} > ${meta.pages.end}`,
            ref: meta
          });
        }
        
        if (meta.pages.start < 1 || meta.pages.end > 100) {
          issues.push({
            level: 'warn',
            code: 'PAGE_OUT_OF_RANGE',
            msg: `Page range outside typical bounds: ${meta.pages.start}-${meta.pages.end}`,
            ref: meta
          });
        }
      }
    });
  }
  
  // Check Section overrides
  if (overrides.sections) {
    const sectionRanges = new Map<string, Array<{start: number, end: number, title: string}>>();
    
    overrides.sections.forEach((section: any) => {
      if (!validProgramIds.has(section.programId)) {
        issues.push({
          level: 'error',
          code: 'UNKNOWN_PROGRAM_ID',
          msg: `Unknown program ID in section: ${section.programId}`,
          ref: section
        });
        return;
      }
      
      if (section.pageStart > section.pageEnd) {
        issues.push({
          level: 'error',
          code: 'INVALID_SECTION_RANGE',
          msg: `Invalid section range: ${section.pageStart} > ${section.pageEnd}`,
          ref: section
        });
        return;
      }
      
      // Check for overlapping sections
      const programRanges = sectionRanges.get(section.programId) || [];
      const hasOverlap = programRanges.some(existing => 
        !(section.pageEnd < existing.start || section.pageStart > existing.end)
      );
      
      if (hasOverlap) {
        issues.push({
          level: 'error',
          code: 'OVERLAPPING_SECTIONS',
          msg: `Section "${section.sectionTitle}" overlaps with existing sections`,
          ref: section
        });
      }
      
      programRanges.push({
        start: section.pageStart,
        end: section.pageEnd,
        title: section.sectionTitle
      });
      sectionRanges.set(section.programId, programRanges);
    });
  }
  
  // Check Chunk overrides
  if (overrides.chunks) {
    const mutedCount = overrides.chunks.filter((c: any) => c.muted).length;
    const totalChunks = chunks.length;
    
    if (mutedCount > totalChunks * 0.3) {
      issues.push({
        level: 'warn',
        code: 'HIGH_MUTED_RATE',
        msg: `High muted rate: ${mutedCount}/${totalChunks} (${Math.round(mutedCount/totalChunks*100)}%)`,
        ref: { mutedCount, totalChunks }
      });
    }
    
    overrides.chunks.forEach((chunkOverride: any) => {
      if (!validProgramIds.has(chunkOverride.programId)) {
        issues.push({
          level: 'error',
          code: 'UNKNOWN_PROGRAM_ID',
          msg: `Unknown program ID in chunk override: ${chunkOverride.programId}`,
          ref: chunkOverride
        });
      }
      
      if (chunkOverride.boost && (chunkOverride.boost < -1 || chunkOverride.boost > 1)) {
        issues.push({
          level: 'warn',
          code: 'EXTREME_BOOST',
          msg: `Extreme boost value: ${chunkOverride.boost} (should be -1 to 1)`,
          ref: chunkOverride
        });
      }
      
      // Check if chunk actually exists
      const chunkExists = chunks.some(c => 
        c.programId === chunkOverride.programId && c.page === chunkOverride.page
      );
      
      if (!chunkExists) {
        issues.push({
          level: 'warn',
          code: 'CHUNK_NOT_FOUND',
          msg: `Chunk override targets non-existent chunk: ${chunkOverride.programId} page ${chunkOverride.page}`,
          ref: chunkOverride
        });
      }
    });
  }
  
  // Check chunk quality
  chunks.forEach(chunk => {
    if (chunk.text.length < 50) {
      issues.push({
        level: 'warn',
        code: 'SHORT_CHUNK',
        msg: `Very short chunk: ${chunk.text.length} chars`,
        ref: { programId: chunk.programId, page: chunk.page }
      });
    }
    
    if (chunk.text.length > 2000) {
      issues.push({
        level: 'warn',
        code: 'LONG_CHUNK',
        msg: `Very long chunk: ${chunk.text.length} chars`,
        ref: { programId: chunk.programId, page: chunk.page }
      });
    }
  });
  
  return issues;
}

export function getIssuesByLevel(issues: AdminIssue[]): { errors: AdminIssue[]; warnings: AdminIssue[] } {
  return {
    errors: issues.filter(i => i.level === 'error'),
    warnings: issues.filter(i => i.level === 'warn')
  };
}