import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Copy } from 'lucide-react';
import { RagOverrides, SectionOverride, ProgramMetaOverride, saveOverrides, addHistoryEntry } from '../../lib/rag/overrides';
import { programMeta } from '../../data/programMeta';
import { documentStore } from '../../rag/store';

interface ProgramsSectionsTabProps {
  overrides: RagOverrides;
  onOverridesChange: (overrides: RagOverrides) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function ProgramsSectionsTab({ 
  overrides, 
  onOverridesChange, 
  onShowToast 
}: ProgramsSectionsTabProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSection, setEditingSection] = useState<SectionOverride | null>(null);
  const [editingMeta, setEditingMeta] = useState<ProgramMetaOverride | null>(null);

  // Get all programs
  const allPrograms = Object.entries(programMeta).map(([id, data]) => ({
    id,
    ...data,
    // Apply meta overrides
    ...overrides.programMeta?.find(m => m.programId === id)
  }));

  // Filter programs by search
  const filteredPrograms = allPrograms.filter(program =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProgram = selectedProgramId ? 
    allPrograms.find(p => p.id === selectedProgramId) : null;

  // Get sections for selected program
  const programSections = selectedProgramId ? 
    (overrides.sections?.filter(s => s.programId === selectedProgramId) || []) : [];

  const handleSaveSection = async (section: SectionOverride) => {
    const newOverrides = { ...overrides };
    if (!newOverrides.sections) newOverrides.sections = [];
    
    const existingIndex = newOverrides.sections.findIndex(s => 
      s.programId === section.programId && 
      s.pageStart === section.pageStart && 
      s.pageEnd === section.pageEnd
    );
    
    if (existingIndex >= 0) {
      newOverrides.sections[existingIndex] = section;
    } else {
      newOverrides.sections.push(section);
    }
    
    try {
      await saveOverrides(newOverrides);
      onOverridesChange(newOverrides);
      await addHistoryEntry({
        action: 'section_add',
        description: `Section "${section.sectionTitle}" für ${section.programId} (S. ${section.pageStart}-${section.pageEnd})`
      });
      onShowToast('Section gespeichert', 'success');
      setEditingSection(null);
    } catch (error) {
      onShowToast('Fehler beim Speichern', 'error');
    }
  };

  const handleDeleteSection = async (section: SectionOverride) => {
    const newOverrides = { ...overrides };
    if (!newOverrides.sections) return;
    
    newOverrides.sections = newOverrides.sections.filter(s => 
      !(s.programId === section.programId && 
        s.pageStart === section.pageStart && 
        s.pageEnd === section.pageEnd)
    );
    
    try {
      await saveOverrides(newOverrides);
      onOverridesChange(newOverrides);
      await addHistoryEntry({
        action: 'section_edit',
        description: `Section "${section.sectionTitle}" gelöscht`
      });
      onShowToast('Section gelöscht', 'success');
    } catch (error) {
      onShowToast('Fehler beim Löschen', 'error');
    }
  };

  const handleSaveMeta = async (meta: ProgramMetaOverride) => {
    const newOverrides = { ...overrides };
    if (!newOverrides.programMeta) newOverrides.programMeta = [];
    
    const existingIndex = newOverrides.programMeta.findIndex(m => m.programId === meta.programId);
    
    if (existingIndex >= 0) {
      newOverrides.programMeta[existingIndex] = meta;
    } else {
      newOverrides.programMeta.push(meta);
    }
    
    try {
      await saveOverrides(newOverrides);
      onOverridesChange(newOverrides);
      await addHistoryEntry({
        action: 'meta_edit',
        description: `Meta für ${meta.programId} aktualisiert`
      });
      onShowToast('Programm-Meta gespeichert', 'success');
      setEditingMeta(null);
    } catch (error) {
      onShowToast('Fehler beim Speichern', 'error');
    }
  };

  const getChunkCount = (programId: string, pageStart?: number, pageEnd?: number) => {
    const chunks = documentStore.getChunksByProgram(programId);
    if (!pageStart || !pageEnd) return chunks.length;
    
    return chunks.filter(c => c.page >= pageStart && c.page <= pageEnd).length;
  };


  return (
    <div className="admin-programs-sections">
      <div className="admin-two-column">
        {/* Left: Program List */}
        <div className="admin-column-left">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Programme</h2>
            <input
              type="text"
              placeholder="Programme suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
          
          <div className="admin-program-list">
            {filteredPrograms.map((program) => {
              const hasOverrides = overrides.programMeta?.some(m => m.programId === program.id) ||
                                 overrides.sections?.some(s => s.programId === program.id);
              
              return (
                <button
                  key={program.id}
                  className={`admin-program-item ${selectedProgramId === program.id ? 'active' : ''}`}
                  onClick={() => setSelectedProgramId(program.id)}
                >
                  <div className="admin-program-name">{program.name}</div>
                  <div className="admin-program-meta">
                    <span className="admin-program-pages">S. {program.pages[0]}-{program.pages[1]}</span>
                    <span className={`admin-program-status status-${program.status}`}>
                      {program.status}
                    </span>
                    {hasOverrides && (
                      <span className="admin-override-badge">Override</span>
                    )}
                  </div>
                  <div className="admin-program-chunks">
                    {getChunkCount(program.id)} Chunks
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="admin-column-right">
          {selectedProgram ? (
            <div className="admin-editor">
              {/* Program Meta Editor */}
              <div className="admin-editor-section">
                <div className="admin-editor-header">
                  <h3 className="admin-editor-title">Programm-Meta</h3>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingMeta({
                      programId: selectedProgram.id,
                      pages: { start: selectedProgram.pages[0], end: selectedProgram.pages[1] },
                      status: selectedProgram.status,
                      stand: selectedProgram.stand
                    })}
                  >
                    <Edit2 size={14} />
                    Bearbeiten
                  </button>
                </div>
                
                {editingMeta ? (
                  <div className="admin-meta-form">
                    <div className="admin-form-row">
                      <label className="admin-form-label">Seiten</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingMeta.pages?.start || ''}
                          onChange={(e) => setEditingMeta({
                            ...editingMeta,
                            pages: { 
                              start: parseInt(e.target.value) || 1, 
                              end: editingMeta.pages?.end || 1 
                            }
                          })}
                          className="admin-form-input w-20"
                          min="1"
                        />
                        <span className="self-center">bis</span>
                        <input
                          type="number"
                          value={editingMeta.pages?.end || ''}
                          onChange={(e) => setEditingMeta({
                            ...editingMeta,
                            pages: { 
                              start: editingMeta.pages?.start || 1, 
                              end: parseInt(e.target.value) || 1 
                            }
                          })}
                          className="admin-form-input w-20"
                          min="1"
                        />
                      </div>
                    </div>
                    
                    <div className="admin-form-row">
                      <label className="admin-form-label">Status</label>
                      <select
                        value={editingMeta.status || ''}
                        onChange={(e) => setEditingMeta({
                          ...editingMeta,
                          status: e.target.value
                        })}
                        className="admin-form-input"
                      >
                        <option value="aktiv">Aktiv</option>
                        <option value="ausgesetzt">Ausgesetzt</option>
                        <option value="endet_am">Endet am</option>
                        <option value="entfallen">Entfallen</option>
                      </select>
                    </div>
                    
                    <div className="admin-form-row">
                      <label className="admin-form-label">Stand</label>
                      <input
                        type="text"
                        value={editingMeta.stand || ''}
                        onChange={(e) => setEditingMeta({
                          ...editingMeta,
                          stand: e.target.value
                        })}
                        className="admin-form-input"
                        placeholder="09/2025"
                      />
                    </div>
                    
                    <div className="admin-form-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveMeta(editingMeta)}
                      >
                        Speichern
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingMeta(null)}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="admin-meta-display">
                    <div className="admin-meta-item">
                      <span className="admin-meta-label">Seiten:</span>
                      <span className="admin-meta-value">{selectedProgram.pages[0]}-{selectedProgram.pages[1]}</span>
                    </div>
                    <div className="admin-meta-item">
                      <span className="admin-meta-label">Status:</span>
                      <span className={`admin-meta-value status-${selectedProgram.status}`}>
                        {selectedProgram.status}
                      </span>
                    </div>
                    <div className="admin-meta-item">
                      <span className="admin-meta-label">Stand:</span>
                      <span className="admin-meta-value">{selectedProgram.stand}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sections Editor */}
              <div className="admin-editor-section">
                <div className="admin-editor-header">
                  <h3 className="admin-editor-title">Sections</h3>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setEditingSection({
                      programId: selectedProgram.id,
                      pageStart: selectedProgram.pages[0],
                      pageEnd: selectedProgram.pages[1],
                      sectionTitle: 'Neue Section'
                    })}
                  >
                    <Plus size={14} />
                    Hinzufügen
                  </button>
                </div>
                
                {editingSection && (
                  <div className="admin-section-form">
                    <div className="admin-form-row">
                      <label className="admin-form-label">Titel</label>
                      <input
                        type="text"
                        value={editingSection.sectionTitle}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          sectionTitle: e.target.value
                        })}
                        className="admin-form-input"
                        placeholder="z.B. Voraussetzungen"
                      />
                    </div>
                    
                    <div className="admin-form-row">
                      <label className="admin-form-label">Seitenbereich</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingSection.pageStart}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            pageStart: parseInt(e.target.value) || 1
                          })}
                          className="admin-form-input w-20"
                          min="1"
                        />
                        <span className="self-center">bis</span>
                        <input
                          type="number"
                          value={editingSection.pageEnd}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            pageEnd: parseInt(e.target.value) || 1
                          })}
                          className="admin-form-input w-20"
                          min="1"
                        />
                      </div>
                    </div>
                    
                    <div className="admin-form-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveSection(editingSection)}
                      >
                        Speichern
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingSection(null)}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="admin-sections-list">
                  {programSections.map((section, index) => (
                    <div key={index} className="admin-section-item">
                      <div className="admin-section-info">
                        <div className="admin-section-title">{section.sectionTitle}</div>
                        <div className="admin-section-range">
                          S. {section.pageStart}-{section.pageEnd}
                          <span className="admin-chunk-count">
                            ({getChunkCount(section.programId, section.pageStart, section.pageEnd)} Chunks)
                          </span>
                        </div>
                      </div>
                      <div className="admin-section-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingSection(section)}
                          title="Bearbeiten"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-red-600"
                          onClick={() => handleDeleteSection(section)}
                          title="Löschen"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {programSections.length === 0 && (
                    <div className="admin-empty-state">
                      <div className="text-gray-500 text-sm">
                        Noch keine Sections definiert
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              {selectedProgram && (
                <div className="admin-editor-section">
                  <h3 className="admin-editor-title">Live-Vorschau</h3>
                  <div className="admin-preview">
                    <div className="admin-preview-stats">
                      <div className="admin-stat-item">
                        <span className="admin-stat-label">Gesamt-Chunks:</span>
                        <span className="admin-stat-value">{getChunkCount(selectedProgram.id)}</span>
                      </div>
                      <div className="admin-stat-item">
                        <span className="admin-stat-label">Sections:</span>
                        <span className="admin-stat-value">{programSections.length}</span>
                      </div>
                    </div>
                    
                    {programSections.length > 0 && (
                      <div className="admin-preview-chunks">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Beispiel-Chunks:</h4>
                        {programSections.slice(0, 2).map((section, index) => {
                          const chunks = documentStore.getChunksByProgram(selectedProgram.id)
                            .filter(c => c.page >= section.pageStart && c.page <= section.pageEnd)
                            .slice(0, 1);
                          
                          return chunks.map(chunk => (
                            <div key={`${section.sectionTitle}-${index}`} className="admin-chunk-preview">
                              <div className="admin-chunk-meta">
                                <span className="admin-chunk-section">{section.sectionTitle}</span>
                                <span className="admin-chunk-page">S. {chunk.page}</span>
                              </div>
                              <div className="admin-chunk-text">
                                {chunk.text.substring(0, 200)}...
                              </div>
                            </div>
                          ));
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="admin-empty-editor">
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Programm auswählen
                </h3>
                <p className="text-gray-600">
                  Wählen Sie ein Programm aus der Liste, um Meta-Daten und Sections zu bearbeiten.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}