import React from 'react';
import { Program } from '../types';
import { CheckSquare, Copy, Upload, Euro } from 'lucide-react';
import Modal from './Modal';
import ExportPreviewModal from './ExportPreviewModal';

interface ChecklistViewProps {
  program: Program;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export default function ChecklistView({ program, isOpen, onClose, onShowToast }: ChecklistViewProps) {
  const [showExportPreview, setShowExportPreview] = React.useState(false);

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

  const getBeilagen = () => {
    const beilagen = [];
    if (program.voraussetzungen.some(v => v.includes('Hauptwohnsitz') || v.includes('Wohnsitz'))) {
      beilagen.push('Meldezettel');
    }
    if (program.voraussetzungen.some(v => v.includes('Beschäftigung') || v.includes('Unternehmen'))) {
      beilagen.push('Arbeitsvertrag/Dienstzettel');
    }
    if (program.foerderart.includes('kurskosten')) {
      beilagen.push('Kostenvoranschlag des Bildungsträgers');
    }
    if (program.voraussetzungen.some(v => v.includes('anerkannt'))) {
      beilagen.push('Nachweis anerkannter Bildungsträger');
    }
    return beilagen.length > 0 ? beilagen : ['Antragsformular', 'Identitätsnachweis', 'Kostenvoranschlag'];
  };

  const handleCopy = async () => {
    const checklistText = `Checkliste: ${program.name}

1. Eignung prüfen
   - Zielgruppe: ${program.zielgruppe.join(', ')}
   - Region: ${program.region}
   - Status: ${program.status === 'aktiv' ? 'Aktiv' : program.status}

2. Kurs/Maßnahme fixieren
   - Anbieter auswählen (muss anerkannt sein)
   - Dauer und Termine klären
   - Gesamtkosten ermitteln

3. Portal & Frist
   - Antragsweg: ${getAntragswegLabel()}
   - Frist: ${program.frist.typ === 'laufend' ? 'Laufende Antragstellung' : `Bis ${program.frist.datum}`}

4. Antrag + Beilagen
   ${getBeilagen().map(b => `- ${b}`).join('\n   ')}

5. Teilnahme & Abrechnung
   - Alle Rechnungen und Belege sammeln
   - Teilnahmebestätigung/Zertifikat erhalten
   - Abrechnung fristgerecht einreichen

Quelle: ${program.name} · S. ${program.quelle.seite} · Stand ${program.quelle.stand}`;

    try {
      await navigator.clipboard.writeText(checklistText);
      onShowToast('Checkliste in Zwischenablage kopiert');
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
      <Modal isOpen={isOpen} onClose={onClose} title="Checkliste" maxWidth="max-w-3xl">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg text-gray-700">{program.name}</h2>
        </div>

        <div className="space-y-6">
          {/* Schritt 1: Eignung prüfen */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Eignung prüfen</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-gray-700 mb-3">Prüfen Sie, ob Sie zur Zielgruppe gehören und alle Voraussetzungen erfüllen:</p>
              <div className="space-y-1">
                {Array.isArray(program.zielgruppe) && program.zielgruppe.length > 0 && (
                  <div className="text-sm"><strong>Zielgruppe:</strong> {program.zielgruppe.join(', ')}</div>
                )}
                {program.region && (
                  <div className="text-sm"><strong>Region:</strong> {program.region}</div>
                )}
                <div className="text-sm"><strong>Status:</strong> {program.status === 'aktiv' ? 'Aktiv' : program.status === 'endet_am' ? `Endet am ${program.frist?.datum}` : 'Ausgesetzt'}</div>
              </div>
            </div>
          </div>

          {/* Schritt 2: Kurs/Maßnahme fixieren */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Kurs/Maßnahme fixieren</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-gray-700 mb-3">Wählen Sie einen passenden Kurs oder eine Maßnahme aus:</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Titel und Inhalt der Weiterbildung festlegen</li>
                <li>• Anbieter auswählen (muss anerkannt sein)</li>
                <li>• Dauer und Termine klären</li>
                <li>• Gesamtkosten ermitteln</li>
                {program.voraussetzungen.some(v => v.includes('16')) && (
                  <li>• Mindestdauer von 16 Unterrichtseinheiten beachten</li>
                )}
              </ul>
            </div>
          </div>

          {/* Schritt 3: Portal & Frist */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Portal & Frist</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-gray-700 mb-3">Antrag rechtzeitig über das richtige Portal stellen:</p>
              {(program.antragsweg || program.frist) && (
                <div className="bg-blue-50 p-3 rounded">
                  {program.antragsweg && (
                    <div className="text-sm"><strong>Antragsweg:</strong> {getAntragswegLabel()}</div>
                  )}
                  {program.frist && (
                    <div className="text-sm"><strong>Frist:</strong> {program.frist.typ === 'laufend' ? 'Laufende Antragstellung' : `Bis ${program.frist.datum}`}</div>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">
                Tipp: Bei laufender Antragstellung mindestens 4-6 Wochen vor Kursbeginn beantragen.
              </p>
            </div>
          </div>

          {/* Schritt 4: Antrag + Beilagen */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Antrag + Beilagen</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-gray-700 mb-3">Vollständigen Antrag mit allen erforderlichen Unterlagen einreichen:</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {getBeilagen().map((beilage, index) => (
                  <li key={index}>• {beilage}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Schritt 5: Teilnahme & Abrechnung */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Teilnahme & Abrechnung</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-gray-700 mb-3">Nach Förderzusage:</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {program.voraussetzungen.some(v => v.includes('75%') || v.includes('Anwesenheit')) && (
                  <li>• Mindestens 75% Anwesenheit sicherstellen</li>
                )}
                <li>• Alle Rechnungen und Belege sammeln</li>
                <li>• Teilnahmebestätigung/Zertifikat erhalten</li>
                <li>• Abrechnung fristgerecht einreichen</li>
                {program.foerderart.includes('beihilfe') && (
                  <li>• Monatliche Beihilfe beantragen</li>
                )}
              </ul>
            </div>
          </div>

          {/* Förderdetails */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              <Euro size={16} className="mr-1" />
              Ihre Förderung
            </h4>
            <div className="space-y-1 text-sm text-green-800">
              {program.foerderhoehe.map((foerder, index) => (
                <div key={index}>
                  <strong>{foerder.label}:</strong> 
                  {foerder.quote && ` ${foerder.quote}%`}
                  {foerder.min && ` (min. ${foerder.min}€)`}
                  {foerder.max && ` (max. ${foerder.max}€)`}
                  {foerder.note && ` - ${foerder.note}`}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
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

        {/* Quelle */}
        <div className="mt-6">
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
        type="onepager"
        program={program}
        onShowToast={onShowToast}
      />
    </>
  );
}