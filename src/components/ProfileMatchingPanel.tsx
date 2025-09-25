import React, { useState } from 'react';
import { Program } from '../types';
import { Target, X, RotateCcw, FileText } from 'lucide-react';
import MatchResultCard from './MatchResultCard';

interface MatchResult {
  programId: string;
  score: number;
  reasons: string[];
}

interface ProfileMatchingPanelProps {
  isOpen: boolean;
  programs: Program[];
  onClose: () => void;
  onShowDetail: (programId: string) => void;
  onShowChecklist: (program: Program) => void;
  onToggleCompare: (programId: string) => void;
  onOpenChat: (programId: string) => void;
  onShowAllResults: (matchResults: MatchResult[]) => void;
  onShowToast: (message: string) => void;
  compareIds: string[];
}

const profileSections = [
  {
    key: 'kundenprofil',
    title: 'Kundenprofil',
    chips: ['beschäftigt', 'arbeitsuchend', 'lehrling', '50+', 'wiedereinstieg', 'migration', 'behinderung']
  },
  {
    key: 'hintergrund',
    title: 'Hintergrund',
    chips: ['pflichtschule', 'lap', 'matura', 'fh_uni', 'technik', 'pflege', 'office']
  },
  {
    key: 'problemlage',
    title: 'Problemlage',
    chips: ['qualifikationslücke', 'finanzierung', 'zeit_schicht', 'sprache_a2_b1', 'anerkennung_fehlt', 'erreichbarkeit']
  },
  {
    key: 'wunschperspektive',
    title: 'Wunschperspektive',
    chips: ['umschulung', 'aufschulung', 'zertifikat', 'deutsch_b1_b2', 'digital_skills', 'führung', 'lap_nachholen']
  },
  {
    key: 'voraussetzungen_rahmen',
    title: 'Voraussetzungen/Rahmen',
    chips: ['eams', 'arbeitgeber_unterstützt', 'kursangebot_liegt_vor', 'start_6_wochen', 'bezirk_linz', 'budget_2000', 'abends_wochenende']
  }
];

const chipLabels: Record<string, string> = {
  // Kundenprofil
  'beschäftigt': 'Beschäftigt',
  'arbeitsuchend': 'Arbeitsuchend',
  'lehrling': 'Lehrling',
  '50+': '50+',
  'wiedereinstieg': 'Wiedereinstieg',
  'migration': 'Migration',
  'behinderung': 'Behinderung',
  
  // Hintergrund
  'pflichtschule': 'Pflichtschule',
  'lap': 'LAP',
  'matura': 'Matura',
  'fh_uni': 'FH/Uni',
  'technik': 'Technik',
  'pflege': 'Pflege',
  'office': 'Office',
  
  // Problemlage
  'qualifikationslücke': 'Qualifikationslücke',
  'finanzierung': 'Finanzierung',
  'zeit_schicht': 'Zeit/Schicht',
  'sprache_a2_b1': 'Sprache A2/B1',
  'anerkennung_fehlt': 'Anerkennung fehlt',
  'erreichbarkeit': 'Erreichbarkeit',
  
  // Wunschperspektive
  'umschulung': 'Umschulung',
  'aufschulung': 'Aufschulung',
  'zertifikat': 'Zertifikat',
  'deutsch_b1_b2': 'Deutsch B1–B2',
  'digital_skills': 'Digital Skills',
  'führung': 'Führung',
  'lap_nachholen': 'LAP nachholen',
  
  // Voraussetzungen/Rahmen
  'eams': 'eAMS',
  'arbeitgeber_unterstützt': 'Arbeitgeber unterstützt',
  'kursangebot_liegt_vor': 'Kursangebot liegt vor',
  'start_6_wochen': 'Start < 6 Wochen',
  'bezirk_linz': 'Bezirk Linz',
  'budget_2000': 'Budget ≤ 2000 €',
  'abends_wochenende': 'Abends/Wochenende'
};

export default function ProfileMatchingPanel({
  isOpen,
  programs,
  onClose,
  onShowDetail,
  onShowChecklist,
  onToggleCompare,
  onOpenChat,
  onShowAllResults,
  onShowToast,
  compareIds
}: ProfileMatchingPanelProps) {
  const [activeSection, setActiveSection] = useState('kundenprofil');
  const [profileAnswers, setProfileAnswers] = useState<Record<string, string[]>>({});
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const handleToggleChip = (sectionKey: string, chip: string) => {
    setProfileAnswers(prev => {
      const sectionAnswers = prev[sectionKey] || [];
      const isSelected = sectionAnswers.includes(chip);
      
      if (isSelected) {
        return {
          ...prev,
          [sectionKey]: sectionAnswers.filter(c => c !== chip)
        };
      } else {
        return {
          ...prev,
          [sectionKey]: [...sectionAnswers, chip]
        };
      }
    });
  };

  const calculateMatching = () => {
    const results: MatchResult[] = [];
    
    programs.forEach(program => {
      let score = 0;
      const reasons: string[] = [];
      
      // Zielgruppen-Fit (30 Punkte)
      const kundenprofilAnswers = profileAnswers['kundenprofil'] || [];
      const hintergrundAnswers = profileAnswers['hintergrund'] || [];
      
      if (kundenprofilAnswers.includes('beschäftigt') && program.zielgruppe.some(z => z.toLowerCase().includes('beschäftigt'))) {
        score += 15;
        reasons.push('Zielgruppe passt (Beschäftigte)');
      }
      if (kundenprofilAnswers.includes('arbeitsuchend') && program.zielgruppe.some(z => z.toLowerCase().includes('arbeitsuchend'))) {
        score += 15;
        reasons.push('Zielgruppe passt (Arbeitsuchende)');
      }
      if (kundenprofilAnswers.includes('frauen') && program.zielgruppe.some(z => z.toLowerCase().includes('frauen'))) {
        score += 10;
        reasons.push('Spezielle Förderung für Frauen');
      }
      
      // Themen-Fit (25 Punkte)
      const wunschAnswers = profileAnswers['wunschperspektive'] || [];
      
      if (wunschAnswers.includes('digital_skills') && program.themen.some(t => t.toLowerCase().includes('digital'))) {
        score += 12;
        reasons.push('Digitale Kompetenzen werden gefördert');
      }
      if (wunschAnswers.includes('deutsch_b1_b2') && program.themen.some(t => t.toLowerCase().includes('sprach'))) {
        score += 12;
        reasons.push('Sprachförderung verfügbar');
      }
      if (wunschAnswers.includes('zertifikat') && program.foerderart.includes('kurskosten')) {
        score += 8;
        reasons.push('Zertifikatskurse förderbar');
      }
      
      // Formale Passung (20 Punkte)
      const rahmenAnswers = profileAnswers['voraussetzungen_rahmen'] || [];
      
      if (rahmenAnswers.includes('eams') && program.antragsweg === 'eams') {
        score += 10;
        reasons.push('Antrag über eAMS möglich');
      }
      if (rahmenAnswers.includes('arbeitgeber_unterstützt') && program.zielgruppe.some(z => z.toLowerCase().includes('unternehmen'))) {
        score += 8;
        reasons.push('Arbeitgeber kann beteiligt werden');
      }
      
      // Budget-Fit (15 Punkte)
      if (rahmenAnswers.includes('budget_2000')) {
        const maxFoerderung = Math.max(...program.foerderhoehe.map(f => f.max || f.deckel || 0));
        if (maxFoerderung <= 2000 && maxFoerderung > 0) {
          score += 10;
          reasons.push('Budget passt (≤ 2000 €)');
        } else if (maxFoerderung > 2000) {
          score += 5;
          reasons.push('Höhere Förderung möglich');
        }
      }
      
      // Praktikabilität (10 Punkte)
      if (rahmenAnswers.includes('bezirk_linz') && program.region.toLowerCase().includes('linz')) {
        score += 5;
        reasons.push('Region Linz passt');
      }
      if (program.frist.typ === 'laufend') {
        score += 3;
        reasons.push('Laufende Antragstellung');
      }
      
      // Bonus für aktive Programme
      if (program.status === 'aktiv') {
        score += 5;
      } else if (program.status === 'ausgesetzt') {
        score -= 10;
        reasons.push('⚠️ Programm derzeit ausgesetzt');
      }
      
      // Mindestens ein Grund muss vorhanden sein
      if (reasons.length === 0) {
        reasons.push('Grundsätzlich passende Förderung');
      }
      
      results.push({
        programId: program.id,
        score: Math.min(100, Math.max(0, score)),
        reasons: reasons.slice(0, 3) // Max 3 Gründe
      });
    });
    
    // Sortiere nach Score
    results.sort((a, b) => b.score - a.score);
    
    return results;
  };

  const handleApplyProfile = () => {
    const results = calculateMatching();
    setMatchResults(results);
    setShowResults(true);
    
    const topScore = results[0]?.score || 0;
    onShowToast(`Profil-Matching abgeschlossen - Bestes Match: ${topScore}/100 Punkte`);
  };

  const handleReset = () => {
    setProfileAnswers({});
    setMatchResults([]);
    setShowResults(false);
    onShowToast('Profil zurückgesetzt');
  };

  const handleShowAllResults = () => {
    onShowAllResults(matchResults);
    onClose();
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const getTotalSelectedChips = () => {
    return Object.values(profileAnswers).reduce((total, chips) => total + chips.length, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              <Target size={24} className="mr-2" />
              Profil-Matching
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Beschreiben Sie Ihr Profil für personalisierte Förderempfehlungen
              {getTotalSelectedChips() > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({getTotalSelectedChips()} Eigenschaften ausgewählt)
                </span>
              )}
            </p>
          </div>
          <button
            className="btn btn-ghost p-2"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!showResults ? (
            <div className="p-6">
              {/* Section Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
                {profileSections.map((section) => {
                  const selectedCount = profileAnswers[section.key]?.length || 0;
                  return (
                    <button
                      key={section.key}
                      className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                        activeSection === section.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveSection(section.key)}
                    >
                      {section.title}
                      {selectedCount > 0 && (
                        <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          {selectedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Section */}
              {profileSections.map((section) => {
                if (activeSection !== section.key) return null;
                
                const selectedChips = profileAnswers[section.key] || [];
                const isExpanded = expandedSections[section.key];
                const visibleChips = isExpanded ? section.chips : section.chips.slice(0, 6);
                const hasMore = section.chips.length > 6;

                return (
                  <div key={section.key} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    
                    <div className="flex flex-wrap gap-3">
                      {visibleChips.map((chip) => {
                        const isSelected = selectedChips.includes(chip);
                        return (
                          <button
                            key={chip}
                            className={`profile-chip ${isSelected ? 'active' : ''}`}
                            onClick={() => handleToggleChip(section.key, chip)}
                          >
                            {chipLabels[chip] || chip}
                          </button>
                        );
                      })}
                      
                      {hasMore && (
                        <button
                          className="profile-chip profile-chip-more"
                          onClick={() => toggleSection(section.key)}
                        >
                          {isExpanded ? 'Weniger...' : `Mehr... (+${section.chips.length - 6})`}
                        </button>
                      )}
                    </div>

                    {selectedChips.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {selectedChips.length} ausgewählt: {selectedChips.map(chip => chipLabels[chip] || chip).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Top-Empfehlungen für Ihr Profil
                </h3>
                <p className="text-sm text-gray-600">
                  Basierend auf {getTotalSelectedChips()} ausgewählten Eigenschaften
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {matchResults.slice(0, 3).map((result) => {
                  const program = programs.find(p => p.id === result.programId);
                  if (!program) return null;

                  return (
                    <MatchResultCard
                      key={result.programId}
                      program={program}
                      matchResult={result}
                      onShowDetail={onShowDetail}
                      onShowChecklist={onShowChecklist}
                      onToggleCompare={onToggleCompare}
                      onOpenChat={onOpenChat}
                      onShowToast={onShowToast}
                      isCompared={compareIds.includes(program.id)}
                    />
                  );
                })}
              </div>

              <div className="text-center">
                <button
                  className="btn btn-primary"
                  onClick={handleShowAllResults}
                >
                  <FileText size={14} className="mr-1" />
                  Alle {matchResults.length} Ergebnisse anzeigen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            className="btn btn-ghost"
            onClick={handleReset}
          >
            <RotateCcw size={14} className="mr-1" />
            Zurücksetzen
          </button>
          
          <div className="flex gap-3">
            {showResults && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowResults(false)}
              >
                ← Profil bearbeiten
              </button>
            )}
            {!showResults && (
              <button
                className="btn btn-primary"
                onClick={handleApplyProfile}
                disabled={getTotalSelectedChips() === 0}
              >
                <Target size={14} className="mr-1" />
                Profil anwenden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}