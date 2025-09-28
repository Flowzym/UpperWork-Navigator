import React from 'react';
import { Program } from '../types';
import { FileText, Copy, Upload } from 'lucide-react';
import Modal from './Modal';
import ExportPreviewModal from './ExportPreviewModal';

interface OnePagerPreviewProps {
  program: Program;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export default function OnePagerPreview({ program, isOpen, onClose, onShowToast }: OnePagerPreviewProps) {
  const [showExportPreview, setShowExportPreview] = React.useState(false);

  const has = (v?: string | any[]) => (Array.isArray(v) ? v.length > 0 : !!v);
  
  const getAntragswegLabel = () => {
    if (!program.antragsweg) return '';
    switch (program.antragsweg) {
      case 'eams': return 'eAMS Portal';
      case 'land_ooe_portal': return 'Land OÖ Portal';
      case 'wko_verbund': return 'WKO Verbund';
      case 'traeger_direkt': return 'Direkt beim Träger';
      default: return program.antragsweg;
    }
  };

  const handleCopy = async () => {
    const onePagerText = `${program.name}
Förder-Navigator OÖ · Stand ${program.quelle.stand}

ÜBERBLICK
${program.teaser}

Zielgruppe: ${program.zielgruppe.join(', ')}
Region: ${program.region}

FÖRDERUNG
${program.foerderhoehe.map(f => `${f.label}: ${f.quote ? f.quote + '%' : ''}${f.min ? ' (min. ' + f.min + '€)' : ''}${f.max ? ' (max. ' + f.max + '€)' : ''}${f.note ? ' - ' + f.note : ''}`).join('\n')}

Antragsweg: ${getAntragswegLabel()}
Frist: ${program.frist.typ === 'laufend' ? 'Laufend' : program.frist.datum}

5-SCHRITTE-CHECKLISTE
1. Eignung prüfen (Zielgruppe: ${program.zielgruppe.join(', ')})
2. Kurs/Maßnahme bei anerkanntem Anbieter auswählen
3. Antrag über ${getAntragswegLabel()} stellen
4. Vollständige Unterlagen einreichen
5. Teilnahme & Abrechnung (Belege sammeln)

PASST, WENN...
${program.passt_wenn.slice(0, 4).map(item => `• ${item}`).join('\n')}

PASST NICHT, WENN...
${program.passt_nicht_wenn.slice(0, 4).map(item => `• ${item}`).join('\n')}

Quelle: ${program.name} · Seite ${program.quelle.seite} · Stand ${program.quelle.stand}
Förder-Navigator OÖ 2025 · Alle Angaben ohne Gewähr`;

    try {
      await navigator.clipboard.writeText(onePagerText);
      onShowToast('1-Pager in Zwischenablage kopiert');
    } catch (err) {
      onShowToast('Kopieren fehlgeschlagen');
    }
  };

  const handleShowExport = () => {
    setShowExportPreview(true);
  };

  const handleCloseExport = () => {
    setShowExportPreview(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="1-Pager" maxWidth="max-w-4xl">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg text-gray-700">{program.name}</h2>
        </div>

        {/* Content */}
        <div className="onepager-content bg-white border border-gray-200 rounded-lg p-8" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>
          {/* Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-blue-500">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.name}</h1>
            <div className="text-sm text-gray-600">
              Förder-Navigator OÖ · Stand {program.quelle.stand}
            </div>
          </div>

          {/* Steckbrief */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">📋 ÜBERBLICK</h3>
              <p className="text-sm text-gray-700 mb-3">{program.teaser}</p>
              
              {has(program.zielgruppe) && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">🎯 Zielgruppe</h4>
                  <p className="text-sm text-gray-700 mb-3">{program.zielgruppe!.join(', ')}</p>
                </>
              )}
              
              {program.region && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">📍 Region</h4>
                  <p className="text-sm text-gray-700">{program.region}</p>
                </>
              )}
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">💶 FÖRDERUNG</h3>
              {program.foerderhoehe.map((foerder, index) => (
                <div key={index} className="mb-2">
                  <div className="font-medium text-sm text-gray-900">{foerder.label}</div>
                  <div className="text-sm text-gray-700">
                    {foerder.quote && `${foerder.quote}%`}
                    {foerder.min && ` (min. ${foerder.min}€)`}
                    {foerder.max && ` (max. ${foerder.max}€)`}
                    {foerder.note && ` - ${foerder.note}`}
                  </div>
                </div>
              ))}
              
              {program.antragsweg && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm mt-3">📝 Antragsweg</h4>
                  <p className="text-sm text-gray-700">{getAntragswegLabel()}</p>
                </>
              )}
              
              {program.frist && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm mt-2">⏰ Frist</h4>
                  <p className="text-sm text-gray-700">
                    {program.frist.typ === 'laufend' ? 'Laufende Antragstellung' : program.frist.datum}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Checkliste */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">✅ 5-SCHRITTE-CHECKLISTE</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-600 text-sm">1.</span>
                <span className="text-sm text-gray-700">Eignung prüfen (Zielgruppe: {program.zielgruppe.join(', ')})</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-600 text-sm">2.</span>
                <span className="text-sm text-gray-700">Kurs/Maßnahme bei anerkanntem Anbieter auswählen</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-600 text-sm">3.</span>
                <span className="text-sm text-gray-700">Antrag {program.antragsweg ? `über ${getAntragswegLabel()}` : ''} stellen</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-600 text-sm">4.</span>
                <span className="text-sm text-gray-700">Vollständige Unterlagen einreichen</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-600 text-sm">5.</span>
                <span className="text-sm text-gray-700">Teilnahme & Abrechnung (Belege sammeln)</span>
              </div>
            </div>
          </div>

          {/* Voraussetzungen */}
          {(has(program.passt_wenn) || has(program.passt_nicht_wenn)) && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              {has(program.passt_wenn) && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">✅ PASST, WENN...</h3>
                  <ul className="space-y-1">
                    {program.passt_wenn!.slice(0, 4).map((item, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-1">
                        <span className="text-green-600">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {has(program.passt_nicht_wenn) && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">❌ PASST NICHT, WENN...</h3>
                  <ul className="space-y-1">
                    {program.passt_nicht_wenn!.slice(0, 4).map((item, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-1">
                        <span className="text-red-600">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 text-center">
            <div className="text-xs text-gray-500">
              Quelle: {program.name} · Seite {program.quelle.seite} · Stand {program.quelle.stand}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Förder-Navigator OÖ 2025 · Alle Angaben ohne Gewähr
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            className="btn btn-primary"
            onClick={handleCopy}
          >
            <Copy size={14} className="mr-1" />
            Kopieren
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleShowExport}
          >
            <Upload size={14} className="mr-1" />
            Export
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
      </div>
    </Modal>

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={showExportPreview}
        onClose={handleCloseExport}
        type="onepager"
        program={program}
        onShowToast={onShowToast}
      />
    </>
  );
}