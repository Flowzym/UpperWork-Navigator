import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
import { RagOverrides } from '../../lib/rag/overrides';
import { validateDataset, AdminIssue, getIssuesByLevel } from '../../lib/rag/validate';
import { documentStore } from '../../rag/store';
import { programMeta } from '../../data/programMeta';

interface QualityHeuristicsTabProps {
  overrides: RagOverrides;
  onOverridesChange: (overrides: RagOverrides) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

interface QualityMetrics {
  totalChunks: number;
  avgChunkLength: number;
  minChunkLength: number;
  maxChunkLength: number;
  p95ChunkLength: number;
  mutedCount: number;
  boostedCount: number;
  sectionCoverage: Record<string, number>;
  programCoverage: Record<string, number>;
}

export default function QualityHeuristicsTab({ 
  overrides, 
  onOverridesChange, 
  onShowToast 
}: QualityHeuristicsTabProps) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [heuristicParams, setHeuristicParams] = useState({
    chunkSize: 800,
    overlap: 120,
    minSectionLen: 50
  });

  // Calculate metrics
  useEffect(() => {
    const allChunks = documentStore.getChunksByProgram('');
    
    if (allChunks.length === 0) {
      setMetrics(null);
      return;
    }

    const lengths = allChunks.map(c => c.text.length);
    lengths.sort((a, b) => a - b);
    
    const mutedCount = overrides.chunks?.filter(o => o.muted).length || 0;
    const boostedCount = overrides.chunks?.filter(o => o.boost && o.boost !== 0).length || 0;
    
    const sectionCoverage: Record<string, number> = {};
    const programCoverage: Record<string, number> = {};
    
    allChunks.forEach(chunk => {
      sectionCoverage[chunk.section] = (sectionCoverage[chunk.section] || 0) + 1;
      programCoverage[chunk.programId] = (programCoverage[chunk.programId] || 0) + 1;
    });

    const newMetrics: QualityMetrics = {
      totalChunks: allChunks.length,
      avgChunkLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
      minChunkLength: lengths[0] || 0,
      maxChunkLength: lengths[lengths.length - 1] || 0,
      p95ChunkLength: lengths[Math.floor(lengths.length * 0.95)] || 0,
      mutedCount,
      boostedCount,
      sectionCoverage,
      programCoverage
    };
    
    setMetrics(newMetrics);
    
    // Validate dataset
    const validationIssues = validateDataset(allChunks, overrides);
    setIssues(validationIssues);
  }, [overrides]);

  const { errors, warnings } = getIssuesByLevel(issues);

  const simulateRechunking = () => {
    if (!selectedProgramId) {
      onShowToast('Bitte Programm auswählen', 'warning');
      return;
    }
    
    onShowToast(`Rechunking-Simulation für ${selectedProgramId} mit Parametern: ${heuristicParams.chunkSize}/${heuristicParams.overlap}`, 'info');
  };

  return (
    <div className="admin-quality-heuristics">
      {/* Metrics Overview */}
      <div className="admin-metrics-section">
        <h2 className="admin-section-title">Qualitäts-Metriken</h2>
        
        {metrics ? (
          <div className="admin-metrics-grid">
            <div className="admin-metric-card">
              <div className="admin-metric-label">Gesamt-Chunks</div>
              <div className="admin-metric-value">{metrics.totalChunks}</div>
            </div>
            
            <div className="admin-metric-card">
              <div className="admin-metric-label">Ø Länge</div>
              <div className="admin-metric-value">{Math.round(metrics.avgChunkLength)}</div>
            </div>
            
            <div className="admin-metric-card">
              <div className="admin-metric-label">Min/Max</div>
              <div className="admin-metric-value">{metrics.minChunkLength}/{metrics.maxChunkLength}</div>
            </div>
            
            <div className="admin-metric-card">
              <div className="admin-metric-label">P95 Länge</div>
              <div className="admin-metric-value">{metrics.p95ChunkLength}</div>
            </div>
            
            <div className="admin-metric-card">
              <div className="admin-metric-label">Gemutet</div>
              <div className="admin-metric-value text-red-600">{metrics.mutedCount}</div>
            </div>
            
            <div className="admin-metric-card">
              <div className="admin-metric-label">Geboostet</div>
              <div className="admin-metric-value text-blue-600">{metrics.boostedCount}</div>
            </div>
          </div>
        ) : (
          <div className="admin-loading">Metriken werden berechnet...</div>
        )}
      </div>

      {/* Issues */}
      <div className="admin-issues-section">
        <h2 className="admin-section-title">Validierung</h2>
        
        <div className="admin-issues-summary">
          <div className={`admin-issue-count ${errors.length > 0 ? 'errors' : 'clean'}`}>
            {errors.length > 0 ? (
              <>
                <AlertTriangle size={16} className="text-red-500" />
                <span>{errors.length} Fehler</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} className="text-green-500" />
                <span>Keine Fehler</span>
              </>
            )}
          </div>
          
          {warnings.length > 0 && (
            <div className="admin-issue-count warnings">
              <AlertTriangle size={16} className="text-orange-500" />
              <span>{warnings.length} Warnungen</span>
            </div>
          )}
        </div>
        
        {issues.length > 0 && (
          <div className="admin-issues-list">
            {issues.slice(0, 10).map((issue, index) => (
              <div key={index} className={`admin-issue-item ${issue.level}`}>
                <div className="admin-issue-icon">
                  {issue.level === 'error' ? '❌' : '⚠️'}
                </div>
                <div className="admin-issue-content">
                  <div className="admin-issue-code">{issue.code}</div>
                  <div className="admin-issue-message">{issue.msg}</div>
                </div>
              </div>
            ))}
            
            {issues.length > 10 && (
              <div className="admin-issue-more">
                +{issues.length - 10} weitere Issues
              </div>
            )}
          </div>
        )}
      </div>

      {/* Heuristic Simulator */}
      <div className="admin-heuristic-section">
        <h2 className="admin-section-title">Heuristik-Simulator</h2>
        
        <div className="admin-heuristic-form">
          <div className="admin-form-row">
            <label className="admin-form-label">Programm</label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="admin-form-input"
            >
              <option value="">Programm wählen...</option>
              {Object.entries(programMeta).map(([id, data]) => (
                <option key={id} value={id}>{data.name}</option>
              ))}
            </select>
          </div>
          
          <div className="admin-form-row">
            <label className="admin-form-label">Chunk-Größe</label>
            <input
              type="number"
              value={heuristicParams.chunkSize}
              onChange={(e) => setHeuristicParams({
                ...heuristicParams,
                chunkSize: parseInt(e.target.value) || 800
              })}
              className="admin-form-input w-24"
              min="200"
              max="2000"
              step="50"
            />
          </div>
          
          <div className="admin-form-row">
            <label className="admin-form-label">Overlap</label>
            <input
              type="number"
              value={heuristicParams.overlap}
              onChange={(e) => setHeuristicParams({
                ...heuristicParams,
                overlap: parseInt(e.target.value) || 120
              })}
              className="admin-form-input w-24"
              min="0"
              max="500"
              step="20"
            />
          </div>
          
          <button
            className="btn btn-secondary"
            onClick={simulateRechunking}
            disabled={!selectedProgramId}
          >
            <BarChart3 size={16} />
            Re-chunk Vorschau
          </button>
        </div>
        
        <div className="admin-heuristic-note">
          <div className="text-sm text-gray-600">
            💡 Simulation zeigt nur Vorschau. Echtes Re-Chunking würde neue ChunkOverrides erzeugen.
          </div>
        </div>
      </div>
    </div>
  );
}