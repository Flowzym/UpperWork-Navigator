import React, { useState } from 'react';
import { X } from 'lucide-react';
import ProgramsSectionsTab from './ProgramsSectionsTab';
import ChunkInspectorTab from './ChunkInspectorTab';
import QualityHeuristicsTab from './QualityHeuristicsTab';
import ImportExportTab from './ImportExportTab';
import { RagOverrides } from '../../lib/rag/overrides';

type AdminTab = 'programs' | 'chunks' | 'quality' | 'import-export';

interface AdminLayoutProps {
  overrides: RagOverrides;
  onOverridesChange: (overrides: RagOverrides) => void;
  onClose: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const tabLabels: Record<AdminTab, string> = {
  'programs': 'Programme & Sections',
  'chunks': 'Chunk-Inspector',
  'quality': 'Qualität & Heuristik',
  'import-export': 'Import/Export'
};

export default function AdminLayout({ 
  overrides, 
  onOverridesChange, 
  onClose, 
  onShowToast 
}: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('programs');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'programs':
        return (
          <ProgramsSectionsTab
            overrides={overrides}
            onOverridesChange={onOverridesChange}
            onShowToast={onShowToast}
          />
        );
      case 'chunks':
        return (
          <ChunkInspectorTab
            overrides={overrides}
            onOverridesChange={onOverridesChange}
            onShowToast={onShowToast}
          />
        );
      case 'quality':
        return (
          <QualityHeuristicsTab
            overrides={overrides}
            onOverridesChange={onOverridesChange}
            onShowToast={onShowToast}
          />
        );
      case 'import-export':
        return (
          <ImportExportTab
            overrides={overrides}
            onOverridesChange={onOverridesChange}
            onShowToast={onShowToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-layout">
      {/* Header */}
      <div className="admin-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">RAG Admin-Panel</h1>
              <p className="text-sm text-gray-600">Chunk-Management & Qualitätskontrolle</p>
            </div>
          </div>
          <button
            className="btn btn-ghost p-2"
            onClick={onClose}
            title="Admin-Panel schließen"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {(Object.keys(tabLabels) as AdminTab[]).map((tab) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
}