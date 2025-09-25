import React, { useState } from 'react';
import { Program } from '../types';
import { Mail, Copy } from 'lucide-react';
import Modal from './Modal';

interface EmailTextPreviewProps {
  program: Program;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export default function EmailTextPreview({ program, isOpen, onClose, onShowToast }: EmailTextPreviewProps) {
  const generateEmailText = () => {
    const maxFoerderung = program.foerderhoehe.reduce((max, f) => {
      const amount = f.max || f.deckel || 0;
      return amount > max ? amount : max;
    }, 0);

    const foerderungText = maxFoerderung > 0 
      ? `bis zu ${maxFoerderung.toLocaleString()}€`
      : `${program.foerderhoehe[0]?.quote || 0}%`;

    const antragswegText = program.antragsweg === 'eams' ? 'eAMS Portal' :
                          program.antragsweg === 'land_ooe_portal' ? 'Land OÖ Portal' :
                          program.antragsweg === 'wko_verbund' ? 'WKO Verbund' : 'Direkt beim Träger';

    const fristText = program.frist.typ === 'laufend' ? 'laufende Antragstellung' : 
                      `Stichtag ${program.frist.datum}`;

    return `Betreff: Förderinfo - ${program.name}

Hallo,

kurze Info zu einer passenden Fördermöglichkeit:

**${program.name}**
${program.teaser}

Die wichtigsten Eckdaten:
• Zielgruppe: ${program.zielgruppe.join(', ')}
• Förderung: ${foerderungText} 
• Antragsweg: ${antragswegText}
• Frist: ${fristText}

Nächste Schritte:
• Eignung anhand der Voraussetzungen prüfen
• Passenden Kurs/Anbieter auswählen
• Antrag rechtzeitig stellen

Bei Fragen gerne melden!

---
Quelle: ${program.name} · S. ${program.quelle.seite} · Stand ${program.quelle.stand}`;
  };

  const [emailText, setEmailText] = useState(generateEmailText());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailText);
      onShowToast('E-Mail-Text in Zwischenablage kopiert');
    } catch (err) {
      onShowToast('Kopieren fehlgeschlagen');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="E-Mail-Text" maxWidth="max-w-3xl">
      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            E-Mail-Kurztext für "{program.name}"
          </label>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            className="btn btn-primary"
            onClick={handleCopy}
          >
            <Copy size={14} className="mr-1" />
            In Zwischenablage
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
  );
}