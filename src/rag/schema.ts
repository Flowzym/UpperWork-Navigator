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