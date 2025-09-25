import React from 'react';
import { Program } from '../types';
import { FileText, BarChart3, Mail } from 'lucide-react';
import Modal from './Modal';
import CopyButton from './CopyButton';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'onepager' | 'comparison' | 'email';
  program?: Program;
  programs?: Program[];
  onShowToast: (message: string) => void;
}

export default function ExportPreviewModal({ 
  isOpen, 
  onClose, 
  type, 
  program, 
  programs = [], 
  onShowToast 
}: ExportPreviewModalProps) {
  const getTitle = () => {
    switch (type) {
      case 'onepager': return '1-Pager Export';
      case 'comparison': return 'Vergleichstabelle Export';
      case 'email': return 'E-Mail-Text Export';
      default: return 'Export';
    }
  };

  const generateOnePagerContent = (prog: Program) => {
    const maxFoerderung = prog.foerderhoehe.reduce((max, f) => {
      const amount = f.max || f.deckel || 0;
      return amount > max ? amount : max;
    }, 0);

    const foerderungText = maxFoerderung > 0 
      ? `bis ${maxFoerderung.toLocaleString()}€`
      : `${prog.foerderhoehe[0]?.quote || 0}%`;

    const antragswegText = prog.antragsweg === 'eams' ? 'eAMS Portal' :
                          prog.antragsweg === 'land_ooe_portal' ? 'Land OÖ Portal' :
                          prog.antragsweg === 'wko_verbund' ? 'WKO Verbund' : 'Direkt beim Träger';

    return `Programm: ${prog.name} (Dummy 1-Pager)

Zielgruppe: ${prog.zielgruppe.join(', ')}
Förderhöhe: ${foerderungText}
Antrag: ${antragswegText}
Region: ${prog.region}
Status: ${prog.status === 'aktiv' ? 'Aktiv' : prog.status}

Beschreibung:
${prog.teaser}

Voraussetzungen:
${prog.voraussetzungen.map(v => `• ${v}`).join('\n')}

Passt wenn:
${prog.passt_wenn.slice(0, 3).map(p => `• ${p}`).join('\n')}

Quelle: S. ${prog.quelle.seite}, Stand ${prog.quelle.stand}
Förder-Navigator OÖ 2025 (Dummy Export)`;
  };

  const generateComparisonContent = () => {
    return `Vergleich (Dummy Export)

Programme: ${programs.map(p => p.name).join(', ')}

Spalten: Zielgruppe | Förderart | Förderhöhe | Frist | Status

${programs.map(prog => {
  const maxFoerderung = prog.foerderhoehe.reduce((max, f) => {
    const amount = f.max || f.deckel || 0;
    return amount > max ? amount : max;
  }, 0);
  
  return `${prog.name}:
- Zielgruppe: ${prog.zielgruppe.join(', ')}
- Förderart: ${prog.foerderart.join(', ')}
- Förderhöhe: ${maxFoerderung > 0 ? `bis ${maxFoerderung.toLocaleString()}€` : `${prog.foerderhoehe[0]?.quote || 0}%`}
- Frist: ${prog.frist.typ === 'laufend' ? 'Laufend' : prog.frist.datum}
- Status: ${prog.status === 'aktiv' ? 'Aktiv' : prog.status}`;
}).join('\n\n')}

Quelle: Förder-Navigator OÖ 2025 (Dummy Export)`;
  };

  const generateEmailContent = (prog: Program) => {
    const maxFoerderung = prog.foerderhoehe.reduce((max, f) => {
      const amount = f.max || f.deckel || 0;
      return amount > max ? amount : max;
    }, 0);

    const foerderungText = maxFoerderung > 0 
      ? `bis ${maxFoerderung.toLocaleString()}€`
      : `${prog.foerderhoehe[0]?.quote || 0}%`;

    const antragswegText = prog.antragsweg === 'eams' ? 'eAMS Portal' :
                          prog.antragsweg === 'land_ooe_portal' ? 'Land OÖ Portal' :
                          prog.antragsweg === 'wko_verbund' ? 'WKO Verbund' : 'Direkt beim Träger';

    return `Betreff: Förderinfo - ${prog.name}

Sehr geehrte/r ...,

hier ein Kurzüberblick zu ${prog.name}:

– Zielgruppe: ${prog.zielgruppe.join(', ')}
– Förderhöhe: ${foerderungText}
– Antrag: ${antragswegText}
– Status: ${prog.status === 'aktiv' ? 'Aktiv' : prog.status}

Kurzbeschreibung:
${prog.teaser}

Bei Fragen gerne melden!

Mit freundlichen Grüßen

---
Quelle: Broschüre OÖ 2025 (Dummy Export)`;
  };

  const getContent = () => {
    switch (type) {
      case 'onepager':
        return program ? generateOnePagerContent(program) : '';
      case 'comparison':
        return generateComparisonContent();
      case 'email':
        return program ? generateEmailContent(program) : '';
      default:
        return '';
    }
  };

  const content = getContent();

  const handleExportPDF = () => {
    const exportType = type === 'onepager' ? '1-Pager' : 
                      type === 'comparison' ? 'Vergleich' : 'E-Mail';
    onShowToast(`(Dummy) ${exportType} als PDF erstellt`);
  };

  const handleCopySuccess = () => {
    const exportType = type === 'onepager' ? '1-Pager' : 
                      type === 'comparison' ? 'Vergleich' : 'E-Mail-Text';
    onShowToast(`${exportType} in Zwischenablage kopiert`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="max-w-4xl">
      <div className="export-preview-container">
        {/* Preview Content */}
        <div className="export-preview-content">
          <div className="export-preview-paper">
            <pre className="export-preview-text">
              {content}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="export-preview-actions">
          {type !== 'email' && (
            <button
              className="btn btn-primary"
              onClick={handleExportPDF}
            >
              <FileText size={14} className="mr-1" />
              Als PDF exportieren
            </button>
          )}
          
          <CopyButton
            text={content}
            label={type === 'email' ? 'In Zwischenablage kopieren' : 'Als Text kopieren'}
            className="btn btn-secondary"
            onCopy={handleCopySuccess}
          />
          
          <button
            className="btn btn-ghost"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
      </div>
    </Modal>
  );
}