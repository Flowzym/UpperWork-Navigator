import React, { useState, useEffect } from 'react';
import { Search, Filter, Volume2, VolumeX, TrendingUp, TrendingDown } from 'lucide-react';
import { RagOverrides, ChunkOverride, saveOverrides, addHistoryEntry } from '../../lib/rag/overrides';
import { documentStore } from '../../rag/store';
import { DocChunk } from '../../rag/schema';

interface ChunkInspectorTabProps {
  overrides: RagOverrides;
  onOverridesChange: (overrides: RagOverrides) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

interface ChunkFilters {
  programId: string;
  pageStart: number;
  pageEnd: number;
  section: string;
  showMuted: boolean;
  showBoosted: boolean;
}

export default function ChunkInspectorTab({ 
  overrides, 
  onOverridesChange, 
  onShowToast 
}: ChunkInspectorTabProps) {
  const [programMeta, setProgramMeta] = useState<Record<string, any>>({});
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ChunkFilters>({
    programId: '',
    pageStart: 1,
    pageEnd: 100,
    section: '',
    showMuted: true,
    showBoosted: true
  });
  const [selectedChunk, setSelectedChunk] = useState<DocChunk | null>(null);
  const [chunks, setChunks] = useState<DocChunk[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Load programMeta from runtime source
  useEffect(() => {
    const loadProgramMeta = async () => {
      try {
        const BASE = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
        const response = await fetch(`${BASE}/rag/programMeta.json`);
        if (response.ok) {
          const data = await response.json();
          // Convert array to object if needed
          const metaObj = Array.isArray(data) ? 
            data.reduce((acc, item) => ({ ...acc, [item.programId]: item }), {}) : 
            data;
          setProgramMeta(metaObj);
        }
      } catch (error) {
        console.warn('Failed to load programMeta:', error);
      }
    };
    
    loadProgramMeta();
  }, []);

  // Load chunks on mount
  useEffect(() => {
    const allChunks = documentStore.getChunksByProgram('');
    setChunks(allChunks);
  }, []);

  // Apply search and filters
  useEffect(() => {
    let filteredChunks = chunks;

    // Apply filters
    if (filters.programId) {
      filteredChunks = filteredChunks.filter(c => c.programId === filters.programId);
    }
    
    filteredChunks = filteredChunks.filter(c => 
      c.page >= filters.pageStart && c.page <= filters.pageEnd
    );
    
    if (filters.section) {
      filteredChunks = filteredChunks.filter(c => 
        c.section.toLowerCase().includes(filters.section.toLowerCase())
      );
    }

    // Apply overrides and filter by muted/boosted
    const chunksWithOverrides = filteredChunks.map(chunk => {
      const override = overrides.chunks?.find(o => 
        o.programId === chunk.programId && o.page === chunk.page
      );
      
      return {
        ...chunk,
        muted: override?.muted || false,
        boost: override?.boost || 0,
        sectionOverride: override?.section
      };
    });

    let finalChunks = chunksWithOverrides;
    
    if (!filters.showMuted) {
      finalChunks = finalChunks.filter(c => !c.muted);
    }
    
    if (!filters.showBoosted) {
      finalChunks = finalChunks.filter(c => c.boost === 0);
    }

    // Apply search if query exists
    if (query.trim()) {
      const searchResult = documentStore.search(query, 50);
      const searchChunkIds = new Set(searchResult.map(r => `${r.programName}-${r.page}`));
      
      finalChunks = finalChunks
        .filter(c => searchChunkIds.has(`${c.programName}-${c.page}`))
        .map(c => {
          const searchItem = searchResult.find(r => 
            r.programName === c.programName && r.page === c.page
          );
          return {
            ...c,
            score: searchItem?.score || 0
          };
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    setSearchResults(finalChunks);
  }, [chunks, filters, query, overrides]);

  const handleToggleMute = async (chunk: DocChunk) => {
    const newOverrides = { ...overrides };
    if (!newOverrides.chunks) newOverrides.chunks = [];
    
    const existingIndex = newOverrides.chunks.findIndex(o => 
      o.programId === chunk.programId && o.page === chunk.page
    );
    
    const currentMuted = existingIndex >= 0 ? newOverrides.chunks[existingIndex].muted : false;
    const newMuted = !currentMuted;
    
    if (existingIndex >= 0) {
      newOverrides.chunks[existingIndex] = {
        ...newOverrides.chunks[existingIndex],
        muted: newMuted
      };
    } else {
      newOverrides.chunks.push({
        programId: chunk.programId,
        page: chunk.page,
        muted: newMuted
      });
    }
    
    try {
      await saveOverrides(newOverrides);
      onOverridesChange(newOverrides);
      await addHistoryEntry({
        action: 'chunk_mute',
        description: `Chunk ${chunk.programId} S.${chunk.page} ${newMuted ? 'gemutet' : 'entmutet'}`
      });
      onShowToast(`Chunk ${newMuted ? 'gemutet' : 'entmutet'}`, 'success');
    } catch (error) {
      onShowToast('Fehler beim Speichern', 'error');
    }
  };

  const handleBoostChange = async (chunk: DocChunk, delta: number) => {
    const newOverrides = { ...overrides };
    if (!newOverrides.chunks) newOverrides.chunks = [];
    
    const existingIndex = newOverrides.chunks.findIndex(o => 
      o.programId === chunk.programId && o.page === chunk.page
    );
    
    const currentBoost = existingIndex >= 0 ? (newOverrides.chunks[existingIndex].boost || 0) : 0;
    const newBoost = Math.max(-1, Math.min(1, currentBoost + delta));
    
    if (existingIndex >= 0) {
      newOverrides.chunks[existingIndex] = {
        ...newOverrides.chunks[existingIndex],
        boost: newBoost
      };
    } else {
      newOverrides.chunks.push({
        programId: chunk.programId,
        page: chunk.page,
        boost: newBoost
      });
    }
    
    try {
      await saveOverrides(newOverrides);
      onOverridesChange(newOverrides);
      await addHistoryEntry({
        action: 'chunk_boost',
        description: `Chunk ${chunk.programId} S.${chunk.page} Boost: ${newBoost.toFixed(1)}`
      });
      onShowToast(`Boost auf ${newBoost.toFixed(1)} gesetzt`, 'success');
    } catch (error) {
      onShowToast('Fehler beim Speichern', 'error');
    }
  };

  const handleSectionOverride = async (chunk: DocChunk, newSection: string) => {
    const newOverrides = { ...overrides };
    if (!newOverrides.chunks) newOverrides.chunks = [];
    
    const existingIndex = newOverrides.chunks.findIndex(o => 
      o.programId === chunk.programId && o.page === chunk.page
    );
    
    if (existingIndex >= 0) {
      newOverrides.chunks[existingIndex] = {
        ...newOverrides.chunks[existingIndex],
        section: newSection
      };
    } else {
      newOverrides.chunks.push({
        programId: chunk.programId,
        page: chunk.page,
        section: newSection
      });
    }
    
    try {
      await saveOverrides(newOverrides);
      onOverridesChange(newOverrides);
      await addHistoryEntry({
        action: 'chunk_boost',
        description: `Chunk ${chunk.programId} S.${chunk.page} Section: ${newSection}`
      });
      onShowToast('Section überschrieben', 'success');
    } catch (error) {
      onShowToast('Fehler beim Speichern', 'error');
    }
  };

  const getChunkOverride = (chunk: DocChunk): ChunkOverride | undefined => {
    return overrides.chunks?.find(o => 
      o.programId === chunk.programId && o.page === chunk.page
    );
  };

  const getDisplaySection = (chunk: DocChunk): string => {
    const override = getChunkOverride(chunk);
    return override?.section !== undefined ? override.section || 'null' : chunk.section;
  };

  return (
    <div className="admin-chunk-inspector">
      <div className="admin-inspector-header">
        {/* Search */}
        <div className="admin-search-section">
          <div className="admin-search-wrapper">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Test-Query für Chunk-Suche..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
          {query && (
            <div className="admin-search-results">
              {searchResults.length} Treffer
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="admin-filters-section">
          <div className="admin-filters-row">
            <select
              value={filters.programId}
              onChange={(e) => setFilters({ ...filters, programId: e.target.value })}
              className="admin-filter-select"
            >
              <option value="">Alle Programme</option>
              {Object.entries(programMeta).map(([id, data]) => (
                <option key={id} value={id}>{data.name}</option>
              ))}
            </select>
            
            <div className="admin-filter-range">
              <input
                type="number"
                value={filters.pageStart}
                onChange={(e) => setFilters({ ...filters, pageStart: parseInt(e.target.value) || 1 })}
                className="admin-filter-input w-16"
                min="1"
                placeholder="Von"
              />
              <span>-</span>
              <input
                type="number"
                value={filters.pageEnd}
                onChange={(e) => setFilters({ ...filters, pageEnd: parseInt(e.target.value) || 100 })}
                className="admin-filter-input w-16"
                min="1"
                placeholder="Bis"
              />
            </div>
            
            <input
              type="text"
              placeholder="Section..."
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              className="admin-filter-input w-32"
            />
          </div>
          
          <div className="admin-filters-toggles">
            <label className="admin-filter-toggle">
              <input
                type="checkbox"
                checked={filters.showMuted}
                onChange={(e) => setFilters({ ...filters, showMuted: e.target.checked })}
              />
              <span>Gemutete anzeigen</span>
            </label>
            <label className="admin-filter-toggle">
              <input
                type="checkbox"
                checked={filters.showBoosted}
                onChange={(e) => setFilters({ ...filters, showBoosted: e.target.checked })}
              />
              <span>Geboostete anzeigen</span>
            </label>
          </div>
        </div>
      </div>

      <div className="admin-inspector-content">
        {/* Chunk List */}
        <div className="admin-chunk-list">
          {searchResults.map((chunk, index) => {
            const override = getChunkOverride(chunk);
            const displaySection = getDisplaySection(chunk);
            const isMuted = override?.muted || false;
            const boost = override?.boost || 0;
            const hasOverride = !!override;
            
            return (
              <div
                key={`${chunk.programId}-${chunk.page}-${index}`}
                className={`admin-chunk-row ${selectedChunk?.id === chunk.id ? 'selected' : ''} ${isMuted ? 'muted' : ''}`}
                onClick={() => setSelectedChunk(chunk)}
              >
                <div className="admin-chunk-main">
                  <div className="admin-chunk-id">
                    <span className="admin-chunk-program">{chunk.programId}</span>
                    <span className="admin-chunk-page">S. {chunk.page}</span>
                    {query && chunk.score !== undefined && (
                      <span className="admin-chunk-score">Score: {chunk.score.toFixed(1)}</span>
                    )}
                  </div>
                  
                  <div className="admin-chunk-section-display">
                    <span className={`admin-section-tag ${hasOverride ? 'overridden' : ''}`}>
                      {displaySection}
                      {hasOverride && <span className="admin-override-marker">*</span>}
                    </span>
                  </div>
                  
                  <div className="admin-chunk-flags">
                    {isMuted && (
                      <span className="admin-flag admin-flag-muted">
                        <VolumeX size={12} />
                        Muted
                      </span>
                    )}
                    {boost !== 0 && (
                      <span className={`admin-flag admin-flag-boost ${boost > 0 ? 'positive' : 'negative'}`}>
                        {boost > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {boost > 0 ? '+' : ''}{boost.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="admin-chunk-actions">
                  <button
                    className={`btn btn-ghost btn-sm ${isMuted ? 'text-green-600' : 'text-red-600'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMute(chunk);
                    }}
                    title={isMuted ? 'Entmuten' : 'Muten'}
                  >
                    {isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                  
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoostChange(chunk, 0.2);
                    }}
                    title="Boost +0.2"
                  >
                    <TrendingUp size={14} />
                  </button>
                  
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoostChange(chunk, -0.2);
                    }}
                    title="Boost -0.2"
                  >
                    <TrendingDown size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          
          {searchResults.length === 0 && (
            <div className="admin-empty-state">
              <div className="text-center py-8">
                <Search size={32} className="text-gray-400 mx-auto mb-4" />
                <div className="text-gray-600">
                  {query ? 'Keine Chunks gefunden' : 'Geben Sie eine Suchanfrage ein oder passen Sie die Filter an'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Pane */}
        {selectedChunk && (
          <div className="admin-chunk-preview-pane">
            <div className="admin-preview-header">
              <h3 className="admin-preview-title">Chunk-Details</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedChunk(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="admin-preview-content">
              <div className="admin-preview-meta">
                <div className="admin-meta-grid">
                  <div className="admin-meta-item">
                    <span className="admin-meta-label">Programm:</span>
                    <span className="admin-meta-value">{selectedChunk.programName}</span>
                  </div>
                  <div className="admin-meta-item">
                    <span className="admin-meta-label">Seite:</span>
                    <span className="admin-meta-value">{selectedChunk.page}</span>
                  </div>
                  <div className="admin-meta-item">
                    <span className="admin-meta-label">Section:</span>
                    <span className="admin-meta-value">{getDisplaySection(selectedChunk)}</span>
                  </div>
                  <div className="admin-meta-item">
                    <span className="admin-meta-label">Länge:</span>
                    <span className="admin-meta-value">{selectedChunk.text.length} Zeichen</span>
                  </div>
                </div>
              </div>
              
              <div className="admin-preview-text">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Text-Snippet:</h4>
                <div className="admin-text-snippet">
                  {selectedChunk.text.substring(0, 400)}
                  {selectedChunk.text.length > 400 && '...'}
                </div>
              </div>
              
              <div className="admin-preview-actions">
                <div className="admin-section-override">
                  <label className="admin-form-label">Section überschreiben:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Neue Section..."
                      className="admin-form-input flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value;
                          if (value.trim()) {
                            handleSectionOverride(selectedChunk, value.trim());
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}