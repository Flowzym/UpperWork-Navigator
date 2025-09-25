import React, { useEffect } from 'react';
import { Program } from '../types';
import { BarChart3, Upload, MessageSquare, X } from 'lucide-react';
import CompareTable from './CompareTable';
import ExportPreviewModal from './ExportPreviewModal';

interface CompareModalProps {
  isOpen: boolean;
  programs: Program[];
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export default function CompareModal({ isOpen, programs, onClose, onShowToast }: CompareModalProps) {
  const [showExportPreview, setShowExportPreview] = React.useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleExport = () => {
    onShowToast('Export-Funktion folgt in späteren Updates');
  };

  const handleChatToSelection = () => {
    onShowToast(`${programs.length} Programme an KI-Panel übergeben`);
  };

  const handleShowExport = () => {
    setShowExportPreview(true);
  };

  const handleCloseExport = () => {
    setShowExportPreview(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            <BarChart3 size={24} className="mr-2" />
            Programmvergleich ({programs.length} ausgewählt)
          </h2>
          
          <div className="flex items-center gap-3">
            <button
              className="btn btn-secondary"
              onClick={handleShowExport}
            >
              <Upload size={14} className="mr-1" />
              Export Vergleich
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleChatToSelection}
            >
              <MessageSquare size={14} className="mr-1" />
              Chat zu Auswahl
            </button>
            <button
              className="btn btn-ghost p-2"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <CompareTable programs={programs} />
        </div>
      </div>
    </div>

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={showExportPreview}
        onClose={handleCloseExport}
        type="comparison"
        programs={programs}
        onShowToast={onShowToast}
      />
    </>
  );
}