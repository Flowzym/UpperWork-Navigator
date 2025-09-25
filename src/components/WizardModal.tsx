import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import WizardStep from './WizardStep';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<string, string[]>) => void;
  onShowToast: (message: string) => void;
}

const wizardSteps = [
  {
    title: 'Ihr aktueller Status',
    description: 'Welche Situation trifft auf Sie zu?',
    chips: ['beschäftigt', 'arbeitsuchend', 'lehrling', '50+', 'wiedereinstieg', 'frauen']
  },
  {
    title: 'Ihr Ziel',
    description: 'Was möchten Sie erreichen?',
    chips: ['umschulung', 'aufschulung', 'zertifikat', 'digital_skills', 'deutsch_b1_b2', 'führung', 'abschluss_nachholen']
  },
  {
    title: 'Umfang & Budget',
    description: 'Welcher Rahmen passt zu Ihnen?',
    chips: ['≤1k', '1–5k', '>5k', 'längerfristig', 'kurzmaßnahme']
  },
  {
    title: 'Arbeitgeberbezug',
    description: 'Wie ist Ihr Arbeitgeber eingebunden?',
    chips: ['arbeitgeber_beteiligt', 'teamqualifizierung', 'einzelperson', 'selbstfinanziert']
  },
  {
    title: 'Themenbereich',
    description: 'Welches Thema interessiert Sie?',
    chips: ['digitalisierung', 'sprache_deutsch', 'technik_handwerk', 'pflege_gesundheit', 'management_office', 'nachhaltigkeit']
  },
  {
    title: 'Timing & Frist',
    description: 'Wann möchten Sie starten?',
    chips: ['laufend', 'stichtag', 'start_4_wochen', 'start_2_3_monate']
  }
];

export default function WizardModal({ isOpen, onClose, onComplete, onShowToast }: WizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
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

  const handleToggleChip = (chip: string) => {
    const stepKey = `step${currentStep + 1}`;
    const currentAnswers = answers[stepKey] || [];
    
    const newAnswers = currentAnswers.includes(chip)
      ? currentAnswers.filter(c => c !== chip)
      : [...currentAnswers, chip];
    
    setAnswers(prev => ({
      ...prev,
      [stepKey]: newAnswers
    }));
  };

  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish wizard
      onComplete(answers);
      onClose();
      onShowToast('Wizard abgeschlossen - Ergebnisse werden angezeigt');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      onShowToast('Schritt übersprungen');
    } else {
      // Finish wizard
      onComplete(answers);
      onClose();
      onShowToast('Wizard abgeschlossen - Ergebnisse werden angezeigt');
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setAnswers({});
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = wizardSteps[currentStep];
  const stepKey = `step${currentStep + 1}`;
  const selectedChips = answers[stepKey] || [];

  return (
    <div className="wizard-modal-overlay">
      <div className="wizard-modal">
        {/* Close Button */}
        <button
          className="wizard-close"
          onClick={handleClose}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="wizard-header-main">
          <h1 className="wizard-main-title">
            <Zap size={24} className="mr-2" />
            Welche Förderung passt?
          </h1>
          <p className="wizard-main-subtitle">
            Beantworten Sie 6 kurze Fragen und finden Sie passende Programme
          </p>
        </div>

        {/* Step Content */}
        <WizardStep
          stepNumber={currentStep + 1}
          totalSteps={wizardSteps.length}
          title={currentStepData.title}
          description={currentStepData.description}
          chips={currentStepData.chips}
          selectedChips={selectedChips}
          onToggleChip={handleToggleChip}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
          canGoBack={currentStep > 0}
          isLastStep={currentStep === wizardSteps.length - 1}
        />
      </div>
    </div>
  );
}