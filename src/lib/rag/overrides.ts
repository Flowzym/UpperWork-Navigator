export type SectionOverride = {
  programId: string;
  pageStart: number;
  pageEnd: number;
  sectionTitle: string;
  applyToPages?: number[]; // optional: einzelne Seiten statt Range
};

export type ProgramMetaOverride = {
  programId: string;
  pages?: { start: number; end: number };
  status?: string; // z.B. „ausgesetzt", „endet am <YYYY-MM-DD>"
  stand?: string;  // „Stand: 09/2025"
};

export type ChunkOverride = {
  // Keine Textänderung (PDF bleibt Quelle) → nur Flags/Meta:
  programId: string;
  page: number;
  section?: string | null;  // überschreibt Heuristik-Section
  muted?: boolean;          // vom Retriever ignorieren
  boost?: number;           // zusätzliche Gewichtung (−1…+1)
};

export type RagOverrides = {
  version: 1;
  sections?: SectionOverride[];
  programMeta?: ProgramMetaOverride[];
  chunks?: ChunkOverride[];
  synonyms?: Record<string, string[]>; // optional, vorbereitet für später
};

export type AdminHistoryEntry = {
  id: string;
  timestamp: number;
  action: 'section_add' | 'section_edit' | 'chunk_mute' | 'chunk_boost' | 'meta_edit' | 'import' | 'reset';
  description: string;
  data?: any;
};

// IndexedDB Storage
const DB_NAME = 'rag-admin';
const DB_VERSION = 1;
const STORE_OVERRIDES = 'overrides';
const STORE_HISTORY = 'history';

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_OVERRIDES)) {
        database.createObjectStore(STORE_OVERRIDES, { keyPath: 'id' });
      }
      
      if (!database.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = database.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export async function loadOverrides(): Promise<RagOverrides> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_OVERRIDES], 'readonly');
    const store = transaction.objectStore(STORE_OVERRIDES);
    
    return new Promise((resolve, reject) => {
      const request = store.get('current');
      request.onsuccess = () => {
        const result = request.result?.data || { version: 1 };
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to load overrides from IndexedDB:', error);
    return { version: 1 };
  }
}

export async function saveOverrides(overrides: RagOverrides): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_OVERRIDES], 'readwrite');
    const store = transaction.objectStore(STORE_OVERRIDES);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ id: 'current', data: overrides, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save overrides to IndexedDB:', error);
    throw error;
  }
}

export async function resetOverrides(): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_OVERRIDES, STORE_HISTORY], 'readwrite');
    
    transaction.objectStore(STORE_OVERRIDES).clear();
    transaction.objectStore(STORE_HISTORY).clear();
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to reset overrides:', error);
    throw error;
  }
}

export async function exportOverridesFile(): Promise<void> {
  const overrides = await loadOverrides();
  const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `rag-overrides-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importOverridesFile(file: File): Promise<RagOverrides> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const overrides = JSON.parse(content) as RagOverrides;
        
        // Basic validation
        if (!overrides.version || overrides.version !== 1) {
          reject(new Error('Invalid overrides format or version'));
          return;
        }
        
        resolve(overrides);
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new Error('Failed to parse overrides file'));
        } else {
          reject(error);
        }
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export async function addHistoryEntry(entry: Omit<AdminHistoryEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    
    const historyEntry: AdminHistoryEntry = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...entry
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(historyEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to add history entry:', error);
  }
}

export async function getHistory(limit: number = 20): Promise<AdminHistoryEntry[]> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results: AdminHistoryEntry[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to load history:', error);
    return [];
  }
}

// Merge-Funktionen
export function mergeOverrides<T extends { programId: string }>(
  base: T[], 
  overrides: RagOverrides,
  type: 'programMeta' | 'sections' | 'chunks'
): T[] {
  if (!overrides[type]) return base;
  
  const result = [...base];
  const overrideList = overrides[type] as any[];
  
  overrideList.forEach(override => {
    const index = result.findIndex(item => {
      if (type === 'chunks') {
        return item.programId === override.programId && 
               (item as any).page === override.page;
      }
      return item.programId === override.programId;
    });
    
    if (index >= 0) {
      // Merge existing
      result[index] = { ...result[index], ...override };
    } else if (type !== 'chunks') {
      // Add new (not for chunks - they come from PDF)
      result.push(override as T);
    }
  });
  
  return result;
}

export function applyChunkOverrides(chunks: any[], overrides: RagOverrides): any[] {
  if (!overrides.chunks) return chunks;
  
  return chunks.map(chunk => {
    const override = overrides.chunks!.find(o => 
      o.programId === chunk.programId && o.page === chunk.page
    );
    
    if (!override) {
      return {
        ...chunk,
        muted: chunk.muted || false,
        boost: chunk.boost || 0
      };
    }
    
    return {
      ...chunk,
      section: override.section !== undefined ? override.section : chunk.section,
      muted: override.muted !== undefined ? override.muted : (chunk.muted || false),
      boost: override.boost !== undefined ? override.boost : (chunk.boost || 0)
    };
  }).filter(chunk => !chunk.muted); // Remove muted chunks
}