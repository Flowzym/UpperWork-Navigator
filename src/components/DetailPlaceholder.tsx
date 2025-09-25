import React from 'react';
import { Program } from '../types';

interface DetailPlaceholderProps {
  program: Program;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export default function DetailPlaceholder({ program, onClose, onShowToast }: DetailPlaceholderProps) {
  const getStatusBadge = () => {
    switch (program.status) {
      case 'active':
        return <span className="badge badge-success">✓ Aktiv</span>;
      case 'ending':
        return <span className="badge badge-warning">⏰ Endet am {program.endDate}</span>;
      case 'paused':
        return <span className="badge badge-gray">⏸ Ausgesetzt</span>;
      default:
        return null;
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'checklist':
        onShowToast(`Checkliste für "${program.name}" wird erstellt`);
        break;
      case 'onepager':
        onShowToast(`1-Pager für "${program.name}" wird generiert`);
        break;
      case 'compare':
        onShowToast(`"${program.name}" zum Vergleich hinzugefügt`);
        break;
      case 'chat':
        onShowToast(`"${program.name}" an Chat gesendet`);
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                {getStatusBadge()}
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                  {program.portal}
                </span>
                <span className="text-sm text-gray-500">📍 {program.region}</span>
              </div>
            </div>
            <button
              className="btn btn-ghost p-2"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => handleAction('checklist')}
            >
              ✅ Checkliste
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleAction('onepager')}
            >
              📄 1-Pager
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleAction('compare')}
            >
              📊 Vergleichen
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleAction('chat')}
            >
              💬 An Chat
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Beschreibung</h2>
            <p className="text-gray-700 leading-relaxed">{program.description}</p>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">💰 Förderung</h3>
              <p className="text-gray-700">{program.budget || 'Nicht angegeben'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Zielgruppe</h3>
              <div className="flex flex-wrap gap-1">
                {program.targetGroup.map((target) => (
                  <span key={target} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {target}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📋 Förderart</h3>
              <p className="text-gray-700">{program.fundingType}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🏷️ Themenfeld</h3>
              <p className="text-gray-700">{program.themeField}</p>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">✅ Voraussetzungen</h3>
            <ul className="space-y-1">
              {program.requirements.map((req, index) => (
                <li key={index} className="text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🏷️ Schlagwörter</h3>
            <div className="flex flex-wrap gap-2">
              {program.tags.map((tag) => (
                <span key={tag} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Deadline */}
          {program.deadline && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">⏰ Frist</h3>
              <p className="text-gray-700">{program.deadline}</p>
            </div>
          )}

          {/* Placeholder Content */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📋 Platzhalter-Detailansicht</h3>
            <p className="text-gray-600 text-sm">
              Dies ist eine Platzhalter-Detailansicht. In der finalen Version würden hier weitere 
              Informationen wie Antragsverfahren, Kontaktdaten, ähnliche Programme, 
              Erfolgsgeschichten und detaillierte Förderrichtlinien angezeigt werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}