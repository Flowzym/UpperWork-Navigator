import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<string, string[]>) => void;
  onShowToast: (message: string) => void;
}

const wizardCategories = [
  {
    key: 'status',
    title: 'Status',
    chips: ['beschäftigt', 'arbeitsuchend', 'lehrling', '50+', 'wiedereinstieg', 'frauen']
  },
  {
    key: 'ziel',
    title: 'Ziel',
    chips: ['umschulung', 'aufschulung', 'zertifikat', 'digital_skills', 'deutsch_b1_b2', 'führung', 'abschluss_nachholen']
  },
  {
    key: 'budget',
    title: 'Budget',
    chips: ['≤1k', '1–5k', '>5k', 'längerfristig', 'kurzmaßnahme']
  },
  {
    key: 'arbeitgeber',
    title: 'Arbeitgeber',
    chips: ['arbeitgeber_beteiligt', 'teamqualifizierung', 'einzelperson', 'selbstfinanziert']
  },
  {
    key: 'thema',
    title: 'Thema',
    chips: ['digitalisierung', 'sprache_deutsch', 'technik_handwerk', 'pflege_gesundheit', 'management_office', 'nachhaltigkeit']
  },
  {
    key: 'timing',
    title: 'Timing',
    chips: ['laufend', 'stichtag', 'start_4_wochen', 'start_2_3_monate']
  }
];

const chipLabels: Record<string, string> = {
  // Status
  'beschäftigt': 'Beschäftigt',
  'arbeitsuchend': 'Arbeitsuchend',
  'lehrling': 'Lehrling',
  '50+': '50+',
  'wiedereinstieg': 'Wiedereinstieg',
  'frauen': 'Frauen',
  
  // Ziel
  'umschulung': 'Umschulung',
  'aufschulung': 'Aufschulung',
  'zertifikat': 'Zertifikat',
  'digital_skills': 'Digital Skills',
  'deutsch_b1_b2': 'Deutsch B1/B2',
  'führung': 'Führung',
  'abschluss_nachholen': 'Abschluss nachholen',
  
  // Budget
  '≤1k': '≤ 1.000 €',
  '1–5k': '1–5 Tsd. €',
  '>5k': '> 5 Tsd. €',
  'längerfristig': 'Längerfristig',
  'kurzmaßnahme': 'Kurzmaßnahme',
  
  // Arbeitgeber
  'arbeitgeber_beteiligt': 'Arbeitgeber beteiligt',
  'teamqualifizierung': 'Teamqualifizierung',
  'einzelperson': 'Einzelperson',
  'selbstfinanziert': 'Selbstfinanziert',
  
  // Thema
  'digitalisierung': 'Digitalisierung',
  'sprache_deutsch': 'Sprache/Deutsch',
  'technik_handwerk': 'Technik/Handwerk',
  'pflege_gesundheit': 'Pflege/Gesundheit',
  'management_office': 'Management/Office',
  'nachhaltigkeit': 'Nachhaltigkeit',
  
  // Timing
  'laufend': 'Laufend',
  'stichtag': 'Stichtag',
  'start_4_wochen': 'Start in < 4 Wochen',
  'start_2_3_monate': 'Start in 2–3 Monaten'
};

export default function WizardModal({ isOpen, onClose, onComplete, onShowToast }: WizardModalProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

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

  const handleToggleChip = (categoryKey: string, chip: string) => {
    setAnswers(prev => {
      const currentAnswers = prev[categoryKey] || [];
      const newAnswers = currentAnswers.includes(chip)
        ? currentAnswers.filter(c => c !== chip)
        : [...currentAnswers, chip];
      
      return {
        ...prev,
        [categoryKey]: newAnswers
      };
    });
  };

  const handleComplete = () => {
    onComplete(answers);
    onClose();
    onShowToast('Wizard abgeschlossen - Ergebnisse werden angezeigt');
  };

  const handleReset = () => {
    setAnswers({});
    onShowToast('Auswahl zurückgesetzt');
  };

  const getTotalSelected = () => {
    return Object.values(answers).reduce((total, chips) => total + chips.length, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Zap size={24} />
              Welche Förderung passt?
            </h1>
            {getTotalSelected() > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {getTotalSelected()} Eigenschaften ausgewählt
              </p>
            )}
          </div>
          <button className="btn btn-ghost p-2" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wizardCategories.map((category) => {
              const selectedChips = answers[category.key] || [];
              
              return (
                <div key={category.key} className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {category.title}
                    {selectedChips.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {selectedChips.length}
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {category.chips.map((chip) => {
                      const isSelected = selectedChips.includes(chip);
                      return (
                        <button
                          key={chip}
                          className={`chip ${isSelected ? 'active' : ''}`}
                          onClick={() => handleToggleChip(category.key, chip)}
                        >
                          {chipLabels[chip] || chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button className="btn btn-ghost" onClick={handleReset}>
            Zurücksetzen
          </button>
          
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button
              className="btn btn-primary"
              onClick={handleComplete}
              disabled={getTotalSelected() === 0}
            >
              Ergebnisse anzeigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}