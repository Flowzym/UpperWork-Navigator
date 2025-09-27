import React, { useState, useEffect } from 'react';
import { AppState, HistoryEntry, Program, NavigationTab, HelpTab, FilterState, FacetGroup, Provider, Mode, ContextType, Answer } from '../types';
import { samplePrograms } from '../data/samplePrograms';
import { buildIndex, search, generateSuggestions, SearchSuggestion } from '../search/searchIndex';
import { applyFilters } from '../filters/applyFilters';
import { expandQueryTokens, checkForEntfallenProgram } from '../search/synonyms';
import { useRag } from '../hooks/useRag';
import { useChatApi } from '../hooks/useChatApi';
import { useMetrics } from '../metrics/useMetrics';
import { defaultEndpoints } from '../config/endpoints';
import { providerPresets } from '../presets/providerPresets';

// Components
import { NavBar } from './NavBar';
import FilterSidebar from './FilterSidebar';
import ProgramGrid from './ProgramGrid';
import ProgramDetail from './ProgramDetail';
import ChecklistView from './ChecklistView';
import OnePagerPreview from './OnePagerPreview';
import EmailTextPreview from './EmailTextPreview';
import CompareModal from './CompareModal';
import CompareTray from './CompareTray';
import KIPanel from './KIPanel';
import WizardModal from './WizardModal';
import ProfileMatchingPanel from './ProfileMatchingPanel';
import HelpModal from './HelpModal';
import SettingsModal from './SettingsModal';
import HistoryPanel from './HistoryPanel';
import MetricsPanel from './MetricsPanel';
import BookmarkBar from './BookmarkBar';
import ActiveFiltersBar from './ActiveFiltersBar';
import FooterBar from './FooterBar';
import EmptyState from './EmptyState';

interface AppShellProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addToHistory: (query: string, results: Program[], type: HistoryEntry['type']) => void;
}

export default function AppShell({ state, setState, showToast, addToHistory }: AppShellProps) {
  const [searchIndex, setSearchIndex] = useState(buildIndex(samplePrograms));
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('explorer');
  const [helpTab, setHelpTab] = useState<HelpTab>('quickstart');
  const [showHelpOnStart, setShowHelpOnStart] = useState(false);
  
  const rag = useRag();
  const chatApi = useChatApi();
  const { track } = useMetrics();
  const [localEndpoint, setLocalEndpoint] = useState(defaultEndpoints.local);
  const [customEndpoint, setCustomEndpoint] = useState(defaultEndpoints.custom);
  const [localConnectionStatus, setLocalConnectionStatus] = useState({ isConnected: false });
  const [customConnectionStatus, setCustomConnectionStatus] = useState({ isConnected: false });

  // Initialize RAG on mount
  useEffect(() => {
    rag.buildIndex();
  }, []);

  // Update search suggestions when query changes
  useEffect(() => {
    if (state.searchQuery.length >= 2) {
      const suggestions = generateSuggestions(state.searchQuery, searchIndex);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [state.searchQuery, searchIndex]);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...state.programs];

    // Apply search
    if (state.searchQuery.trim()) {
      const searchResults = search(state.searchQuery, searchIndex);
      const resultIds = new Set(searchResults.map(r => r.programId));
      filtered = filtered.filter(p => resultIds.has(p.id));
    }

    // Apply filters
    filtered = applyFilters(filtered, state.filters);

    setState(prev => ({ ...prev, filteredPrograms: filtered }));
  }, [state.searchQuery, state.filters, state.programs, searchIndex]);

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleSearchSubmit = (query: string) => {
    track({ t: 'search.submit', at: Date.now(), query, results: state.filteredPrograms.length });
    addToHistory(query, state.filteredPrograms, 'search');
    showToast(`${state.filteredPrograms.length} Programme gefunden`);
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'program' && suggestion.programId) {
      const program = state.programs.find(p => p.id === suggestion.programId);
      if (program) {
        setState(prev => ({ ...prev, selectedProgram: program }));
        track({ t: 'search.result.click', at: Date.now(), programId: suggestion.programId, position: 1 });
      }
    } else {
      setState(prev => ({ ...prev, searchQuery: suggestion.text }));
    }
  };

  const handleToggleFilter = (group: FacetGroup, value: string) => {
    setState(prev => {
      const currentFilters = prev.filters[group];
      const newFilters = currentFilters.includes(value as any)
        ? currentFilters.filter(f => f !== value)
        : [...currentFilters, value as any];
      
      return {
        ...prev,
        filters: {
          ...prev.filters,
          [group]: newFilters
        }
      };
    });
  };

  const handleResetFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        status: [],
        zielgruppe: [],
        foerderart: [],
        voraussetzungen: [],
        themen: [],
        frist: [],
        region: [],
        budget: []
      }
    }));
  };

  const handleShowDetail = (programId: string) => {
    const program = state.programs.find(p => p.id === programId);
    if (program) {
      setState(prev => ({ ...prev, selectedProgram: program }));
      addToHistory(program.name, [program], 'view');
    }
  };

  const handleToggleCompare = (programId: string) => {
    setState(prev => {
      const isCompared = prev.comparedPrograms.includes(programId);
      const newCompared = isCompared
        ? prev.comparedPrograms.filter(id => id !== programId)
        : [...prev.comparedPrograms, programId];
      
      return { ...prev, comparedPrograms: newCompared };
    });
  };

  const handleToggleStar = (programId: string) => {
    setState(prev => {
      const isStarred = prev.starredPrograms.includes(programId);
      const newStarred = isStarred
        ? prev.starredPrograms.filter(id => id !== programId)
        : [...prev.starredPrograms, programId];
      
      return { ...prev, starredPrograms: newStarred };
    });
  };

  const handleOpenChat = (programId: string) => {
    setState(prev => ({ ...prev, kiExpanded: true }));
    const program = state.programs.find(p => p.id === programId);
    if (program) {
      addToHistory(program.name, [program], 'chat');
      showToast(`${program.name} an KI-Chat gesendet`);
    }
  };

  // KI-Panel Handlers
  const handleKIProviderChange = (provider: Provider) => {
    setState(prev => ({ ...prev, kiProvider: provider }));
  };

  const handleKIModeChange = (mode: Mode) => {
    setState(prev => ({ ...prev, kiMode: mode }));
  };

  const handleKIContextChange = (context: ContextType) => {
    setState(prev => ({ ...prev, kiContext: context }));
  };

  const handleToggleOnlyBrochure = () => {
    setState(prev => ({ ...prev, kiOnlyBrochure: !prev.kiOnlyBrochure }));
  };

  const handleToggleWithSources = () => {
    setState(prev => ({ ...prev, kiWithSources: !prev.kiWithSources }));
  };

  const handleAddAnswer = (answer: Answer) => {
    setState(prev => ({ ...prev, kiAnswers: [answer, ...prev.kiAnswers] }));
  };

  const handleGenerateAnswer = async (prompt: string) => {
    if (!prompt.trim()) {
      showToast('Bitte geben Sie eine Frage ein');
      return;
    }

    try {
      const answer = await chatApi.ask(
        state.kiProvider,
        prompt,
        state.kiMode,
        state.kiContext,
        state.kiOnlyBrochure,
        state.kiWithSources,
        localEndpoint,
        customEndpoint
      );
      
      handleAddAnswer(answer);
      showToast('Antwort generiert');
    } catch (error) {
      showToast('Fehler beim Generieren der Antwort', 'error');
    }
  };

  const handleRemoveAnswer = (answerId: string) => {
    setState(prev => ({ 
      ...prev, 
      kiAnswers: prev.kiAnswers.filter(a => a.id !== answerId) 
    }));
  };

  const handleClearAnswers = () => {
    setState(prev => ({ ...prev, kiAnswers: [] }));
  };

  const handleStartWizard = () => {
    setState(prev => ({ ...prev, showWizard: true }));
    setActiveTab('wizard');
  };

  const handleStartProfileMatching = () => {
    setState(prev => ({ ...prev, showProfileMatching: true }));
    setActiveTab('profil-matching');
  };

  const handleWizardComplete = (answers: Record<string, string[]>) => {
    // Convert wizard answers to filter state
    const newFilters: FilterState = {
      status: [],
      zielgruppe: [],
      foerderart: [],
      voraussetzungen: [],
      themen: [],
      frist: [],
      region: [],
      budget: []
    };

    // Map wizard answers to filters
    if (answers.status) {
      if (answers.status.includes('beschäftigt')) newFilters.zielgruppe.push('beschäftigte');
      if (answers.status.includes('arbeitsuchend')) newFilters.zielgruppe.push('arbeitsuchende');
      if (answers.status.includes('frauen')) newFilters.zielgruppe.push('frauen');
    }

    if (answers.budget) {
      newFilters.budget = answers.budget.filter(b => ['≤1k', '1–5k', '>5k'].includes(b));
    }

    if (answers.thema) {
      if (answers.thema.includes('digitalisierung')) newFilters.themen.push('digitalisierung');
      if (answers.thema.includes('sprache_deutsch')) newFilters.themen.push('sprache');
      if (answers.thema.includes('technik_handwerk')) newFilters.themen.push('technik');
    }

    if (answers.timing) {
      if (answers.timing.includes('laufend')) newFilters.frist.push('laufend');
      if (answers.timing.includes('stichtag')) newFilters.frist.push('stichtag');
    }

    setState(prev => ({
      ...prev,
      filters: newFilters,
      showWizard: false
    }));

    addToHistory('Wizard-Ergebnisse', state.filteredPrograms, 'wizard');
    showToast(`Wizard abgeschlossen - ${state.filteredPrograms.length} passende Programme gefunden`);
  };

  const handleProfileMatchingResults = (matchResults: any[]) => {
    const matchedPrograms = matchResults
      .map(result => state.programs.find(p => p.id === result.programId))
      .filter(Boolean) as Program[];

    setState(prev => ({
      ...prev,
      filteredPrograms: matchedPrograms,
      showProfileMatching: false
    }));

    addToHistory('Profil-Matching-Ergebnisse', matchedPrograms, 'search');
    showToast(`Profil-Matching abgeschlossen - ${matchedPrograms.length} passende Programme gefunden`);
  };

  const starredPrograms = state.programs.filter(p => state.starredPrograms.includes(p.id));
  const comparedPrograms = state.programs.filter(p => state.comparedPrograms.includes(p.id));

  return (
    <div className="app-shell">
      {/* Navigation */}
      <NavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStartWizard={handleStartWizard}
        onStartProfileMatching={handleStartProfileMatching}
        onOpenSettings={() => setState(prev => ({ ...prev, showSettings: true }))}
        onOpenHelp={() => setState(prev => ({ ...prev, showHelp: true }))}
        onOpenHistory={() => setState(prev => ({ ...prev, showHistory: true }))}
        onOpenMetrics={() => setState(prev => ({ ...prev, showMetrics: true }))}
        onToggleAdminMode={() => setState(prev => ({ ...prev, showAdmin: true }))}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        {showSidebar && (
          <FilterSidebar
            isOpen={showSidebar}
            filters={state.filters}
            onToggleFilter={handleToggleFilter}
            onResetAll={handleResetFilters}
            onShowToast={showToast}
          />
        )}

        {/* Content Area */}
        <div className="content-area">
          {/* Active Filters Bar */}
          <div className="p-4">
            <ActiveFiltersBar
              filters={state.filters}
              searchQuery={state.searchQuery}
              onRemoveFilter={(group, value) => handleToggleFilter(group, value)}
              onClearAll={() => {
                handleResetFilters();
                setState(prev => ({ ...prev, searchQuery: '' }));
              }}
              onClearSearch={() => setState(prev => ({ ...prev, searchQuery: '' }))}
            />

            {/* Bookmark Bar */}
            {starredPrograms.length > 0 && (
              <BookmarkBar
                starredPrograms={starredPrograms}
                onShowDetail={handleShowDetail}
                onShowAllBookmarks={() => {
                  setState(prev => ({
                    ...prev,
                    filteredPrograms: starredPrograms
                  }));
                }}
                onShowToast={showToast}
              />
            )}
          </div>

          {/* Program Grid */}
          <div className="flex-1 overflow-auto">
            {state.filteredPrograms.length > 0 ? (
              <ProgramGrid
                programs={state.filteredPrograms}
                onShowDetail={handleShowDetail}
                onToggleCompare={handleToggleCompare}
                onToggleStar={handleToggleStar}
                onOpenChat={handleOpenChat}
                onShowOnePager={(program) => setState(prev => ({ ...prev, selectedProgram: program }))}
                onShowEmail={(program) => setState(prev => ({ ...prev, selectedProgram: program }))}
                onShowChecklist={(program) => setState(prev => ({ ...prev, selectedProgram: program }))}
                onShowToast={showToast}
                comparedPrograms={state.comparedPrograms}
                starredPrograms={state.starredPrograms}
              />
            ) : (
              <div className="p-8">
                <EmptyState
                  icon="🔍"
                  title="Keine Programme gefunden"
                  description="Versuchen Sie andere Suchbegriffe oder passen Sie die Filter an."
                  tips={[
                    'Verwenden Sie weniger spezifische Begriffe',
                    'Entfernen Sie einige Filter',
                    'Nutzen Sie den Wizard für eine geführte Suche'
                  ]}
                  action={{
                    label: 'Filter zurücksetzen',
                    onClick: () => {
                      handleResetFilters();
                      setState(prev => ({ ...prev, searchQuery: '' }));
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Compare Tray */}
          {state.comparedPrograms.length > 0 && (
            <CompareTray
              compareIds={state.comparedPrograms}
              onShowToast={showToast}
              onClearCompare={() => setState(prev => ({ ...prev, comparedPrograms: [] }))}
              onOpenChat={() => setState(prev => ({ ...prev, showKI: true }))}
              onOpenCompare={() => setState(prev => ({ ...prev, showCompare: true }))}
            />
          )}
        </div>

        {/* KI Panel */}
        <KIPanel
          isOpen={true}
          isExpanded={state.kiExpanded}
          provider={state.kiProvider}
          mode={state.kiMode}
          context={state.kiContext}
          onlyBrochure={state.kiOnlyBrochure}
          withSources={state.kiWithSources}
          providerPreset={providerPresets[state.kiProvider]}
          answers={state.kiAnswers}
          onProviderChange={handleKIProviderChange}
          onModeChange={handleKIModeChange}
          onContextChange={handleKIContextChange}
          onToggleOnlyBrochure={handleToggleOnlyBrochure}
          onToggleWithSources={handleToggleWithSources}
          onAddAnswer={handleAddAnswer}
          onRemoveAnswer={handleRemoveAnswer}
          onClearAnswers={handleClearAnswers}
          onGenerateAnswer={handleGenerateAnswer}
          onExpand={() => setState(prev => ({ ...prev, kiExpanded: true }))}
          onClose={() => setState(prev => ({ ...prev, kiExpanded: false }))}
          onShowToast={showToast}
          chatLoading={chatApi.loading}
          chatApiError={chatApi.error}
          localConnection={localConnectionStatus}
          customConnection={customConnectionStatus}
        />
      </div>

      {/* Footer */}
      <FooterBar
        onOpenChangelog={() => {
          setState(prev => ({ ...prev, showHelp: true }));
          setHelpTab('changelog');
        }}
        onOpenContact={() => {
          setState(prev => ({ ...prev, showHelp: true }));
          setHelpTab('contact');
        }}
      />

      {/* Modals */}
      {state.showWizard && (
        <WizardModal
          isOpen={state.showWizard}
          onClose={() => setState(prev => ({ ...prev, showWizard: false }))}
          onComplete={handleWizardComplete}
          onShowToast={showToast}
        />
      )}

      {state.showProfileMatching && (
        <ProfileMatchingPanel
          isOpen={state.showProfileMatching}
          programs={state.programs}
          onClose={() => setState(prev => ({ ...prev, showProfileMatching: false }))}
          onShowDetail={handleShowDetail}
          onShowChecklist={(program) => setState(prev => ({ ...prev, selectedProgram: program }))}
          onToggleCompare={handleToggleCompare}
          onOpenChat={handleOpenChat}
          onShowAllResults={handleProfileMatchingResults}
          onShowToast={showToast}
          compareIds={state.comparedPrograms}
        />
      )}

      {state.showCompare && comparedPrograms.length > 0 && (
        <CompareModal
          isOpen={state.showCompare}
          programs={comparedPrograms}
          onClose={() => setState(prev => ({ ...prev, showCompare: false }))}
          onShowToast={showToast}
        />
      )}

      {state.selectedProgram && (
        <ProgramDetail
          program={state.selectedProgram}
          isOpen={!!state.selectedProgram}
          onClose={() => setState(prev => ({ ...prev, selectedProgram: null }))}
          onShowChecklist={() => {}}
          onShowOnePager={() => {}}
          onShowEmail={() => {}}
          onToggleCompare={handleToggleCompare}
          onToggleStar={handleToggleStar}
          onOpenChat={handleOpenChat}
          onShowToast={showToast}
          isCompared={state.comparedPrograms.includes(state.selectedProgram.id)}
          isStarred={state.starredPrograms.includes(state.selectedProgram.id)}
        />
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={state.showHelp}
        activeTab={helpTab}
        showHelpOnStart={showHelpOnStart}
        onClose={() => setState(prev => ({ ...prev, showHelp: false }))}
        onTabChange={setHelpTab}
        onToggleShowOnStart={() => setShowHelpOnStart(!showHelpOnStart)}
        onShowToast={showToast}
      />

      {/* Settings Drawer */}
      <SettingsModal
        isOpen={state.showSettings}
        onClose={() => setState(prev => ({ ...prev, showSettings: false }))}
        settings={{
          themeMode: state.theme === 'dark' ? 'dark' : 'light',
          viewMode: state.viewMode === 'compact' ? 'list' : 'grid',
          cardDensity: state.viewMode,
          noExternalProviders: false
        }}
        onSettingsChange={(settings) => setState(prev => ({ 
          ...prev, 
          theme: settings.themeMode === 'dark' ? 'dark' : 'light',
          viewMode: settings.viewMode === 'list' ? 'compact' : 'comfort'
        }))}
        onShowToast={showToast}
      />
    </div>
  );
}