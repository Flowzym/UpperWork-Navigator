export interface DocChunk {
  id: string;
  text: string;
  normalizedText: string;
  programId: string;
  programName: string;
  page: number;
  section: string;
  stand: string;
  status: 'aktiv' | 'ausgesetzt' | 'endet_am' | 'entfallen';
  startChar: number;
  endChar: number;
}

export interface ProgramMeta {
  id: string;
  name: string;
  startPage: number;
  endPage: number;
  stand: string;
  status: 'aktiv' | 'ausgesetzt' | 'endet_am' | 'entfallen';
  sections: {
    [key: string]: {
      startPage: number;
      endPage: number;
      keywords: string[];
    };
  };
}

export interface Citation {
  text: string;
  programName: string;
  page: number;
  stand: string;
  section: string;
  score: number;
  status: 'aktiv' | 'ausgesetzt' | 'endet_am' | 'entfallen';
}

export interface RetrievalResult {
  chunks: Citation[];
  totalFound: number;
  query: string;
  filters?: {
    programId?: string;
    section?: string;
  };
}

export interface IngestionStats {
  totalPages: number;
  totalChunks: number;
  programsFound: number;
  processingTime: number;
}

export type RagStats = {
  buildId: string;
  builtAt: string;
  pages: number;
  programs: number;
  chunks: number;
  sectionsCount: Record<string, number>;
  facets?: Record<string, any>;
  source?: string;
};

export type RagMeta = Array<{
  id: string;
  title: string;
  programId?: string;
  startPage?: number;
  endPage?: number;
  pages?: [number, number];
  provider?: string;
  group?: string;
  container?: boolean;
}>;

export type RagChunk = {
  id: string;
  programId: string;
  section: string;
  page?: number;
  seite?: number;
  text: string;
};

// -- Utilities ---------------------------------------------------------------
const mapKeys = (obj: any, map: Record<string, string>) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return (obj as any[]).map(v => mapKeys(v, map));
  }
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    const nk = map[k] ?? k;
    out[nk] = typeof v === 'object' && v !== null ? mapKeys(v, map) : v;
  }
  return out;
};

export function migrateStats(input: any): RagStats {
  const mapped = mapKeys(input, {
    build_id: 'buildId',
    built_at: 'builtAt',
    sections_count: 'sectionsCount'
  });
  const stats = {
    buildId: mapped.buildId ?? String(mapped.build_id ?? ''),
    builtAt: mapped.builtAt ?? mapped.built_at ?? '',
    pages: Number(mapped.pages ?? mapped.totalPages ?? 0) || 0,
    programs: Number(mapped.programs ?? mapped.programsFound ?? mapped.program_count ?? 0) || 0,
    chunks: Number(mapped.chunks ?? mapped.totalChunks ?? mapped.chunk_count ?? 0) || 0,
    sectionsCount: mapped.sectionsCount ?? {},
    facets: mapped.facets,
    source: mapped.source
  } satisfies RagStats;
  return stats;
}

export function migrateProgramMeta(input: any): RagMeta {
  const arr = Array.isArray(input) ? input : [];
  const mapped = mapKeys(arr, {
    start_page: 'startPage',
    end_page: 'endPage',
    program_id: 'programId',
    gruppe: 'group'
  }) as any[];
  return mapped.map(m => {
    if (!m.pages && (m.startPage != null || m.endPage != null)) {
      m.pages = [m.startPage ?? null, m.endPage ?? null];
    }
    if (!m.programId && m.id) {
      m.programId = m.id;
    }
    return m;
  }) as RagMeta;
}

export function migrateChunks(input: any): RagChunk[] {
  const arr = Array.isArray(input) ? input : [];
  const mapped = mapKeys(arr, {
    program_id: 'programId'
  }) as any[];
  return mapped.map(c => {
    if (c.seite && !c.page) c.page = c.seite;
    return c;
  }) as RagChunk[];
}

export function validateStats(s: RagStats | undefined | null): string[] {
  const errs: string[] = [];
  if (!s || typeof s !== 'object') return ['stats: not an object'];
  if (!s.buildId) errs.push('stats.buildId missing');
  if (typeof s.programs !== 'number' || Number.isNaN(s.programs)) errs.push('stats.programs missing/NaN');
  if (typeof s.chunks !== 'number' || Number.isNaN(s.chunks)) errs.push('stats.chunks missing/NaN');
  if (!s.sectionsCount || typeof s.sectionsCount !== 'object') errs.push('stats.sectionsCount missing');
  return errs;
}

export function validateMeta(meta: RagMeta | undefined | null): string[] {
  const errs: string[] = [];
  if (!Array.isArray(meta)) return ['programMeta: not an array'];
  const bad = meta.find(m => ((!m.id && !m.programId) || !m.title));
  if (bad) errs.push('programMeta: entry without id/programId/title');
  return errs;
}

export function validateChunks(ch: RagChunk[] | undefined | null): string[] {
  const errs: string[] = [];
  if (!Array.isArray(ch)) return ['chunks: not an array'];
  const bad = ch.find(c => !c.id || !c.programId || !c.section || !c.text);
  if (bad) errs.push('chunks: entry missing id/programId/section/text');
  return errs;
}
