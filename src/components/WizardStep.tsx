import React from 'react';

interface WizardStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description?: string;
  chips: string[];
  selectedChips: string[];
  onToggleChip: (chip: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

const chipLabels: Record<string, string> = {
  // Status (Schritt 1)
  'beschäftigt': 'Beschäftigt',
  'arbeitsuchend': 'Arbeitsuchend',
  'lehrling': 'Lehrling',
  '50+': '50+',
  'wiedereinstieg': 'Wiedereinstieg',
  'frauen': 'Frauen',
  
  // Ziel (Schritt 2)
  'umschulung': 'Umschulung',
  'aufschulung': 'Aufschulung',
  'zertifikat': 'Zertifikat',
  'digital_skills': 'Digital Skills',
  'deutsch_b1_b2': 'Deutsch B1/B2',
  'führung': 'Führung',
  'abschluss_nachholen': 'Abschluss nachholen',
  
  // Umfang/Budget (Schritt 3)
  '≤1k': '≤ 1.000 €',
  '1–5k': '1–5 Tsd. €',
  '>5k': '> 5 Tsd. €',
  'längerfristig': 'Längerfristig',
  'kurzmaßnahme': 'Kurzmaßnahme',
  
  // Arbeitgeberbezug (Schritt 4)
  'arbeitgeber_beteiligt': 'Arbeitgeber beteiligt',
  'teamqualifizierung': 'Teamqualifizierung',
  'einzelperson': 'Einzelperson',
  'selbstfinanziert': 'Selbstfinanziert',
  
  // Thema (Schritt 5)
  'digitalisierung': 'Digitalisierung',
  'sprache_deutsch': 'Sprache/Deutsch',
  'technik_handwerk': 'Technik/Handwerk',
  'pflege_gesundheit': 'Pflege/Gesundheit',
  'management_office': 'Management/Office',
  'nachhaltigkeit': 'Nachhaltigkeit',
  
  // Frist/Timing (Schritt 6)
  'laufend': 'Laufend',
  'stichtag': 'Stichtag',
  'start_4_wochen': 'Start in < 4 Wochen',
  'start_2_3_monate': 'Start in 2–3 Monaten'
};

export default function WizardStep({
  stepNumber,
  totalSteps,
  title,
  description,
  chips,
  selectedChips,
  onToggleChip,
  onNext,
  onBack,
  onSkip,
  canGoBack,
  isLastStep
}: WizardStepProps) {
  const [showMore, setShowMore] = React.useState(false);
  const visibleChips = showMore ? chips : chips.slice(0, 6);
  const hasMore = chips.length > 6;

  return (
    <div className="wizard-step">
      {/* Progress Bar */}
      <div className="wizard-progress">
        <div className="wizard-progress-bar">
          <div 
            className="wizard-progress-fill"
            style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          />
        </div>
        <div className="wizard-progress-text">
          Schritt {stepNumber} von {totalSteps}
        </div>
      </div>

      {/* Content */}
      <div className="wizard-content">
        <div className="wizard-header">
          <h2 className="wizard-title">{title}</h2>
          {description && (
            <p className="wizard-description">{description}</p>
          )}
        </div>

        {/* Chips */}
        <div className="wizard-chips">
          {visibleChips.map((chip) => (
            <button
              key={chip}
              className={`wizard-chip ${selectedChips.includes(chip) ? 'active' : ''}`}
              onClick={() => onToggleChip(chip)}
            >
              {chipLabels[chip] || chip}
            </button>
          ))}
          
          {hasMore && (
            <button
              className="wizard-chip wizard-chip-more"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? 'Weniger...' : `Mehr... (+${chips.length - 6})`}
            </button>
          )}
        </div>

        {/* Selection Info */}
        {selectedChips.length > 0 && (
          <div className="wizard-selection-info">
            {selectedChips.length} ausgewählt
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard-navigation">
        <div className="wizard-nav-left">
          {canGoBack && (
            <button
              className="btn btn-secondary"
              onClick={onBack}
            >
              ← Zurück
            </button>
          )}
        </div>
        
        <div className="wizard-nav-right">
          <button
            className="btn btn-ghost"
            onClick={onSkip}
          >
            Überspringen
          </button>
          <button
            className="btn btn-primary"
            onClick={onNext}
          >
            {isLastStep ? 'Fertig & Ergebnisse' : 'Weiter →'}
          </button>
        </div>
      </div>
    </div>
  );
}