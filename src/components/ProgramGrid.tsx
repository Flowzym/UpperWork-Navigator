import React from 'react';
import { Program } from '../types';
import { AlertTriangle, Search, Target, Zap } from 'lucide-react';
import ProgramCard from './ProgramCard';
import ActiveFiltersBar from './ActiveFiltersBar';
import EmptyState from './EmptyState';
import { checkForEntfallenProgram } from '../search/synonyms';
import { FilterState, FacetGroup } from '../types';

interface ProgramGridProps {
  programs: Program[];
  filteredProgramIds?: string[] | null;
  searchQuery?: string;
  filters: FilterState;
  activeFilterCount: number;
  isWizardResult?: boolean;
  isProfileMatchResult?: boolean;
  onResetWizard?: () => void;
  onResetProfileMatching?: () => void;
  selectedPrograms: string[];
  onShowDetail: (programId: string) => void;
  onToggleCompare: (programId: string) => void;
  onShowToast: (message: string) => void;
  onShowChecklist: (program: Program) => void;
  onClearSearch?: () => void;
  onRemoveFilter: (group: FacetGroup, value: string) => void;
  onClearAllFilters: () => void;
}

export default function ProgramGrid({ 
  programs, 
  filteredProgramIds,
  searchQuery,
  filters,
  activeFilterCount,
  isWizardResult = false,
  isProfileMatchResult = false,
  onResetWizard,
  onResetProfileMatching,
  selectedPrograms, 
  onShowDetail, 
  onToggleCompare, 
  onShowToast,
  onShowChecklist,
  onClearSearch,
  onRemoveFilter,
  onClearAllFilters
}: ProgramGridProps) {
  // Filter Programme basierend auf Suche
  const displayPrograms = filteredProgramIds 
    ? programs.filter(p => filteredProgramIds.includes(p.id))
    : programs;

  // Prüfe auf entfallenes Programm
  const entfallenProgram = searchQuery ? checkForEntfallenProgram(searchQuery) : null;
  const showEntfallenHint = entfallenProgram && displayPrograms.length === 0;

  return (
    <div>
      {/* Active Filters Bar */}
      <ActiveFiltersBar
        filters={filters}
        searchQuery={searchQuery || ''}
        onRemoveFilter={onRemoveFilter}
        onClearAll={() => {
          onClearAllFilters();
          if (onClearSearch) onClearSearch();
        }}
        onClearSearch={onClearSearch || (() => {})}
      />

      {/* Wizard Results Banner */}
      {isWizardResult && (
        <div className="wizard-results-banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={20} />
              <div>
                <div className="font-semibold text-gray-900">
                  Wizard-Ergebnisse ({displayPrograms.length} Programme)
                </div>
                <div className="text-sm text-gray-600">
                  Basierend auf Ihren Antworten im Förder-Wizard
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  // TODO: Reopen wizard with current answers
                  onShowToast('Filter können in der Sidebar angepasst werden');
                }}
              >
                Filter anpassen
              </button>
              {onResetWizard && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={onResetWizard}
                >
                  Wizard zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Matching Results Banner */}
      {isProfileMatchResult && (
        <div className="profile-match-results-banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target size={20} />
              <div>
                <div className="font-semibold text-gray-900">
                  Profil-Matching Ergebnisse ({displayPrograms.length} Programme)
                </div>
                <div className="text-sm text-gray-600">
                  Sortiert nach Übereinstimmung mit Ihrem Profil
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  // TODO: Reopen profile matching with current answers
                  onShowToast('Filter können in der Sidebar angepasst werden');
                }}
              >
                Profil anpassen
              </button>
              {onResetProfileMatching && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={onResetProfileMatching}
                >
                  Profil-Matching zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trefferanzeige */}
      {(searchQuery || activeFilterCount > 0) && !isWizardResult && !isProfileMatchResult && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              {displayPrograms.length} Treffer
            </span>
            {searchQuery && (
              <>
                <span className="text-gray-500">·</span>
                <span className="text-gray-600">
                  Suche: „{searchQuery}"
                </span>
              </>
            )}
            {activeFilterCount > 0 && (
              <>
                <span className="text-gray-500">·</span>
                <span className="text-gray-600">
                  {activeFilterCount} Filter aktiv
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Entfallen-Hinweis */}
      {showEntfallenHint && (
        <div className="card p-6 mb-6 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">
                Programm „{entfallenProgram}" ist entfallen
              </h3>
              <p className="text-orange-800 text-sm">
                Dieses Förderprogramm wird nicht mehr angeboten. Keine aktuellen Anträge möglich.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Keine Ergebnisse */}
      {!showEntfallenHint && displayPrograms.length === 0 && (searchQuery || activeFilterCount > 0 || isWizardResult || isProfileMatchResult) && (
        <EmptyState
          icon={<Search size={48} />}
          title={isWizardResult ? 'Keine passenden Programme gefunden' : 
                 isProfileMatchResult ? 'Keine passenden Programme für Ihr Profil gefunden' : 
                 'Keine Ergebnisse gefunden'}
          description={isWizardResult ? 'Die Wizard-Kombination liefert kein Programm.' :
                      isProfileMatchResult ? 'Keine ausreichende Übereinstimmung mit Ihrem Profil.' :
                      'Ihre Suche und Filter ergaben keine Treffer.'}
          tips={isProfileMatchResult ? [
            'Weniger spezifische Eigenschaften im Profil wählen',
            'Profil-Matching mit anderen Angaben wiederholen',
            'Filter in der Sidebar anpassen',
            'Status-Filter prüfen („Ausgesetzt/Entfallen")'
          ] : isWizardResult ? [
            'Weniger spezifische Antworten im Wizard wählen',
            'Filter in der Sidebar anpassen',
            'Wizard mit anderen Antworten wiederholen',
            'Status-Filter prüfen („Ausgesetzt/Entfallen")'
          ] : [
            'Kürzer suchen (1–2 Begriffe)',
            'Einen Filter entfernen',
            'Synonym testen (z.B. „QBN" statt „Qualifizierungsförderung")',
            'Status-Filter prüfen („Ausgesetzt/Entfallen")',
            'Rechtschreibung überprüfen'
          ]}
          action={(onClearSearch || activeFilterCount > 0 || isWizardResult || isProfileMatchResult) ? {
            label: isWizardResult ? 'Zurück zum Wizard' :
                   isProfileMatchResult ? 'Profil anpassen' :
                   'Alle Programme anzeigen',
            onClick: () => {
              if (isWizardResult && onResetWizard) {
                onResetWizard();
              } else if (isProfileMatchResult && onResetProfileMatching) {
                onResetProfileMatching();
              } else {
                if (onClearSearch) onClearSearch();
                onClearAllFilters();
              }
            }
          } : undefined}
        />
      )}

      {/* Programm-Grid */}
      {displayPrograms.length > 0 && (
        <div className="program-grid">
          {displayPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onShowDetail={onShowDetail}
              onToggleCompare={() => onToggleCompare(program.id)}
              onToggleStar={() => onShowToast(`"${program.name}" gemerkt/entfernt`)}
              onOpenChat={() => onShowToast(`"${program.name}" an Chat gesendet`)}
              onShowOnePager={() => onShowToast(`1-Pager für "${program.name}" wird geöffnet`)}
              onShowEmail={() => onShowToast(`E-Mail-Text für "${program.name}" wird geöffnet`)}
              onShowToast={onShowToast}
              isCompared={selectedPrograms.includes(program.id)}
              isStarred={false}
              onShowChecklist={onShowChecklist}
            />
          ))}
        </div>
      )}
    </div>
  );
}