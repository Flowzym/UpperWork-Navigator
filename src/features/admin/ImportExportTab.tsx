import React, { useState, useEffect } from 'react';
import { Download, Upload, RotateCcw, Clock } from 'lucide-react';
import { 
  RagOverrides, 
  exportOverridesFile, 
  importOverridesFile, 
  resetOverrides, 
  saveOverrides,
  getHistory,
  AdminHistoryEntry,
  addHistoryEntry
} from '../../lib/rag/overrides';

interface ImportExportTabProps {
  overrides: RagOverrides;
  onOverridesChange: (overrides: RagOverrides) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function ImportExportTab({ 
  overrides, 
  onOverridesChange, 
  onShowToast 
}: ImportExportTabProps) {
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importing, setImporting] = useState(false);

  // Load history on mount
  useEffect(() => {
    getHistory(20).then(setHistory).catch(console.error);
  }, [overrides]); // Reload when overrides change

  const handleExport = async () => {
    try {
      await exportOverridesFile();
      onShowToast('Overrides exportiert', 'success');
    } catch (error) {
      onShowToast('Export fehlgeschlagen', 'error');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    try {
      const importedOverrides = await importOverridesFile(file);
      await saveOverrides(importedOverrides);
      onOverridesChange(importedOverrides);
      
      await addHistoryEntry({
        action: 'import',
        description: `Overrides importiert aus ${file.name}`
      });
      
      onShowToast('Overrides erfolgreich importiert', 'success');
      
      // Reload history
      const newHistory = await getHistory(20);
      setHistory(newHistory);
    } catch (error) {
      onShowToast(`Import fehlgeschlagen: ${error}`, 'error');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    try {
      await resetOverrides();
      const emptyOverrides: RagOverrides = { version: 1 };
      onOverridesChange(emptyOverrides);
      
      await addHistoryEntry({
        action: 'reset',
        description: 'Alle Overrides zurückgesetzt'
      });
      
      onShowToast('Alle Overrides zurückgesetzt', 'success');
      setShowResetConfirm(false);
      
      // Clear history display
      setHistory([]);
    } catch (error) {
      onShowToast('Reset fehlgeschlagen', 'error');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } else {
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getActionIcon = (action: AdminHistoryEntry['action']) => {
    switch (action) {
      case 'section_add': return '📝';
      case 'section_edit': return '✏️';
      case 'chunk_mute': return '🔇';
      case 'chunk_boost': return '📈';
      case 'meta_edit': return '⚙️';
      case 'import': return '📥';
      case 'reset': return '🔄';
      default: return '📋';
    }
  };

  const getOverridesSummary = () => {
    const sectionsCount = overrides.sections?.length || 0;
    const metaCount = overrides.programMeta?.length || 0;
    const chunksCount = overrides.chunks?.length || 0;
    
    return { sectionsCount, metaCount, chunksCount };
  };

  const { sectionsCount, metaCount, chunksCount } = getOverridesSummary();

  return (
    <div className="admin-import-export">
      {/* Export/Import Section */}
      <div className="admin-export-import-section">
        <h2 className="admin-section-title">Export & Import</h2>
        
        <div className="admin-export-import-grid">
          {/* Export */}
          <div className="admin-export-card">
            <div className="admin-card-header">
              <Download size={20} className="text-blue-600" />
              <h3 className="admin-card-title">Export</h3>
            </div>
            <div className="admin-card-content">
              <p className="admin-card-description">
                Exportiert alle Overrides als JSON-Datei
              </p>
              <div className="admin-export-summary">
                <div className="text-sm text-gray-600">
                  {sectionsCount} Sections, {metaCount} Meta, {chunksCount} Chunks
                </div>
              </div>
            </div>
            <div className="admin-card-actions">
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={sectionsCount + metaCount + chunksCount === 0}
              >
                <Download size={16} />
                overrides.json herunterladen
              </button>
            </div>
          </div>

          {/* Import */}
          <div className="admin-import-card">
            <div className="admin-card-header">
              <Upload size={20} className="text-green-600" />
              <h3 className="admin-card-title">Import</h3>
            </div>
            <div className="admin-card-content">
              <p className="admin-card-description">
                Lädt Overrides aus JSON-Datei (überschreibt aktuelle)
              </p>
              <div className="admin-import-warning">
                <div className="text-sm text-orange-600">
                  ⚠️ Überschreibt alle aktuellen Overrides
                </div>
              </div>
            </div>
            <div className="admin-card-actions">
              <label className="btn btn-secondary cursor-pointer">
                <Upload size={16} />
                {importing ? 'Importiere...' : 'overrides.json auswählen'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  disabled={importing}
                />
              </label>
            </div>
          </div>

          {/* Reset */}
          <div className="admin-reset-card">
            <div className="admin-card-header">
              <RotateCcw size={20} className="text-red-600" />
              <h3 className="admin-card-title">Reset</h3>
            </div>
            <div className="admin-card-content">
              <p className="admin-card-description">
                Löscht alle Overrides und History
              </p>
              <div className="admin-reset-warning">
                <div className="text-sm text-red-600">
                  ⚠️ Nicht rückgängig machbar
                </div>
              </div>
            </div>
            <div className="admin-card-actions">
              {showResetConfirm ? (
                <div className="flex gap-2">
                  <button
                    className="btn btn-error btn-sm"
                    onClick={handleReset}
                  >
                    ✓ Bestätigen
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-error"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={sectionsCount + metaCount + chunksCount === 0}
                >
                  <RotateCcw size={16} />
                  Alles zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="admin-history-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">
            <Clock size={20} />
            Änderungshistorie
          </h2>
          <div className="text-sm text-gray-600">
            Letzte {history.length} Aktionen
          </div>
        </div>
        
        {history.length > 0 ? (
          <div className="admin-history-list">
            {history.map((entry) => (
              <div key={entry.id} className="admin-history-item">
                <div className="admin-history-icon">
                  {getActionIcon(entry.action)}
                </div>
                <div className="admin-history-content">
                  <div className="admin-history-description">
                    {entry.description}
                  </div>
                  <div className="admin-history-timestamp">
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <div className="text-center py-8">
              <Clock size={32} className="text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600">Noch keine Änderungen vorgenommen</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}