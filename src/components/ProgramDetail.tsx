import React from 'react';
import { Program } from '../types';
import { CheckSquare, FileText, Upload, BarChart3, MessageSquare, Mail, Star, X, AlertTriangle, Clock, Pause } from 'lucide-react';
import Modal from './Modal';
import ExportPreviewModal from './ExportPreviewModal';

interface ProgramDetailProps {
  program: Program;
  isOpen: boolean;
  onClose: () => void;
  onShowChecklist: () => void;
  onShowOnePager: () => void;
  onShowEmail: () => void;
  onToggleCompare: (programId: string) => void;
  onToggleStar: (programId: string) => void;
  onOpenChat: (programId: string) => void;
  onShowToast: (message: string) => void;
  isCompared: boolean;
  isStarred: boolean;
}

export default function ProgramDetail({ 
  program, 
  isOpen, 
  onClose, 
  onShowChecklist, 
  onShowOnePager,
  onShowEmail,
  onToggleCompare,
  onToggleStar,
  onOpenChat,
  onShowToast,
  isCompared,
  isStarred
}: ProgramDetailProps) {
  const [showExportPreview, setShowExportPreview] = React.useState(false);
  const [exportType, setExportType] = React.useState<'onepager' | 'email'>('onepager');

  const getStatusBanner = () => {
    switch (program.status) {
      case 'ausgesetzt':
        return (
          <div className="status-banner status-banner-paused">
            <div className="flex items-center">
              <Pause size={16} className="mr-2" />
              <span className="font-medium">Programm ist derzeit ausgesetzt</span>
            </div>
          </div>
        );
      case 'endet_am':
        return (
          <div className="status-banner status-banner-ending">
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span className="font-medium">Programm endet am {program.frist.datum}</span>
            </div>
          </div>
        );
      case 'entfallen':
        return (
          <div className="status-banner status-banner-cancelled">
            <div className="flex items-center">
              <X size={16} className="mr-2" />
              <span className="font-medium">Programm ist entfallen</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getAntragswegLabel = () => {
    if (!program.antragsweg) return '';
    switch (program.antragsweg) {
      case 'eams': return 'eAMS Portal';
      case 'land_ooe_portal': return 'Land OÖ Portal';
      case 'wko_verbund': return 'WKO Verbund';
      case 'traeger_direkt': return 'Direkt beim Träger';
      default: return String(program.antragsweg || '—');
    }
  };

  const handleShowExport = (type: 'onepager' | 'email') => {
    setExportType(type);
    setShowExportPreview(true);
  };

  const handleCloseExport = () => {
    setShowExportPreview(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.name}</h1>
          </div>
          <button
            className="btn btn-ghost p-2"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={onShowChecklist}>
              <CheckSquare size={14} className="mr-1" />
              Checkliste
            </button>
            <button className="btn btn-primary" onClick={onShowOnePager}>
              <FileText size={14} className="mr-1" />
              1-Pager
            </button>
            <button className="btn btn-secondary" onClick={() => handleShowExport('onepager')}>
              <Upload size={14} className="mr-1" />
              Export
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          <div className="flex gap-2">
            <button 
              className={`btn ${isCompared ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onToggleCompare(program.id)}
            >
              <BarChart3 size={14} className="mr-1" />
              {isCompared ? 'Im Vergleich' : 'Vergleichen'}
            </button>
            <button className="btn btn-secondary" onClick={() => onOpenChat(program.id)}>
              <MessageSquare size={14} className="mr-1" />
              An Chat
            </button>
            <button className="btn btn-secondary" onClick={onShowEmail}>
              <Mail size={14} className="mr-1" />
              E-Mail-Text
            </button>
            <button className="btn btn-secondary" onClick={() => handleShowExport('email')}>
              <Mail size={14} className="mr-1" />
              E-Mail Export
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          <button 
            className={`btn btn-ghost ${isStarred ? 'text-yellow-500' : 'text-gray-400'}`}
            onClick={() => onToggleStar(program.id)}
          >
            <Star size={14} className="mr-1" fill={isStarred ? 'currentColor' : 'none'} />
            Merken
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Banner */}
        {getStatusBanner()}

        {/* 1. Kurzüberblick */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Kurzüberblick</h2>
          <p className="text-gray-700 leading-relaxed">{program.teaser}</p>
        </div>

        {/* 2. Zielgruppe */}
        {Array.isArray(program.zielgruppe) && program.zielgruppe.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Zielgruppe</h2>
            <div className="flex flex-wrap gap-2">
              {program.zielgruppe.map((target) => (
                <span key={target} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  {target}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. Förderart & -höhe */}
        {((Array.isArray(program.foerderart) && program.foerderart.length > 0) || 
          (Array.isArray(program.foerderhoehe) && program.foerderhoehe.length > 0)) && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Förderart & -höhe</h2>
            <div className="space-y-3">
              {Array.isArray(program.foerderart) && program.foerderart.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {program.foerderart.map((art) => (
                    <span key={art} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                      {art === 'kurskosten' ? 'Kurskosten' : 
                       art === 'personalkosten' ? 'Personalkosten' :
                       art === 'beihilfe' ? 'Beihilfe' : 'Beratung'}
                    </span>
                  ))}
                </div>
              )}
              {Array.isArray(program.foerderhoehe) && program.foerderhoehe.length > 0 && (
                <div className="space-y-3">
                  {program.foerderhoehe.map((foerder, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">{foerder.label}</div>
                      <div className="text-gray-700">
                        {foerder.quote && `bis ${foerder.quote}%`}
                        {foerder.min && ` (min. ${foerder.min}€)`}
                        {foerder.max && ` (max. ${foerder.max}€)`}
                        {foerder.deckel && ` (Deckel: ${foerder.deckel}€)`}
                        {foerder.note && ` - ${foerder.note}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Voraussetzungen */}
        {Array.isArray(program.voraussetzungen) && program.voraussetzungen.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Voraussetzungen</h2>
            <ul className="space-y-2">
              {program.voraussetzungen.map((req, index) => (
                <li key={index} className="text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Frist/Status */}
        {program.frist && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Frist/Status</h2>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">
                {program.frist.typ === 'laufend' ? 'Laufende Antragstellung'
                 : program.frist.typ === 'stichtag' ? 'Stichtag'
                 : program.frist.typ}
              </div>
              {program.frist.datum && (
                <div className="text-gray-700">Bis: {program.frist.datum}</div>
              )}
            </div>
          </div>
        )}

        {/* 6. Antragsweg */}
        {program.antragsweg && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Antragsweg</h2>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-900">{getAntragswegLabel()}</div>
            </div>
          </div>
        )}

        {/* 7. Passt wenn / Passt nicht wenn */}
        {((Array.isArray(program.passt_wenn) && program.passt_wenn.length > 0) || 
          (Array.isArray(program.passt_nicht_wenn) && program.passt_nicht_wenn.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(program.passt_wenn) && program.passt_wenn.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Passt, wenn...</h3>
                <ul className="space-y-2">
                  {program.passt_wenn.map((item, index) => (
                    <li key={index} className="text-gray-700 flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(program.passt_nicht_wenn) && program.passt_nicht_wenn.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Passt nicht, wenn...</h3>
                <ul className="space-y-2">
                  {program.passt_nicht_wenn.map((item, index) => (
                    <li key={index} className="text-gray-700 flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 8. Quelle */}
        <div className="border-t pt-4">
          <div className="source-badge">
            <strong>Quelle:</strong> {program.name} · S. {program.quelle.seite} · Stand {program.quelle.stand}
          </div>
        </div>
      </div>
    </Modal>

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={showExportPreview}
        onClose={handleCloseExport}
        type={exportType}
        program={program}
        onShowToast={onShowToast}
      />
    </>
  );
}