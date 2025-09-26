import React, { useState, useEffect } from 'react';
import { AppState, HistoryEntry, Toast, NavigationTab, HelpTab, FilterState, FacetGroup, Program, Provider, Mode, ContextType, Answer, ProviderPreset } from '../types';
import { samplePrograms } from '../data/samplePrograms';
import { buildIndex, search, generateSuggestions, SearchSuggestion } from '../search/searchIndex';
import { applyFilters } from '../filters/applyFilters';
import { expandQueryTokens, checkForEntfallenProgram } from '../search/synonyms';
import { providerPresets } from '../presets/providerPresets';
import { useChatApi } from '../hooks/useChatApi';
import { useRag } from '../hooks/useRag';
import { useMetrics } from '../metrics/useMetrics';
import { defaultEndpoints } from '../config/endpoints';

// Components
import NavBar from './NavBar';
import FooterBar from './FooterBar';
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
import SettingsDrawer from './SettingsDrawer';
import HistoryPanel from './HistoryPanel';
import MetricsPanel from './MetricsPanel';
import ActiveFiltersBar from './ActiveFiltersBar';
import BookmarkBar from './BookmarkBar';
import EmptyState from './EmptyState';
import ExportPreviewModal from './ExportPreviewModal';

interface AppShellProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  showToast: (message: string, type?: Toast['type']) => void;
  addToHistory: (query: string, results: Program[], type: HistoryEntry['type']) => void;
}

export default function AppShell({ state, setState, showToast, addToHistory }: AppShellProps) {
  const [searchIndex, setSearchIndex] = useState(buildIndex(samplePrograms));
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showChecklist, setShowChecklist] = useState<Program | null>(null);
  const [showOnePager, setShowOnePager] = useState<Program | null>(null);
  const [showEmail, setShowEmail] = useState<Program | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportType, setExportType] = useState<'onepager' | 'comparison' | 'email'>('onepager');
  const [exportProgram, setExportProgram] = useState<Program | null>(null);
  const [exportPrograms, setExportPrograms] = useState<Program[]>([]);

  // KI Panel State
  const [provider, setProvider] = useState<Provider>('ChatGPT');
  const [mode, setMode] = useState<Mode>('Fakten');
  const [context, setContext] = useState<ContextType>('Freie Frage');
  const [onlyBrochure, setOnlyBrochure] = useState(true);
  const [withSources, setWithSources] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [localEndpoint, setLocalEndpoint] = useState(defaultEndpoints.local);
  const [customEndpoint, setCustomEndpoint] = useState(defaultEndpoints.custom);
  const [noExternalProviders, setNoExternalProviders] = useState(false);
  const [localConnection, setLocalConnection] = useState({ isConnected: false });
  const [customConnection, setCustomConnection] = useState({ isConnected: false });

  // Settings State
  const [showHelpOnStart, setShowHelpOnStart] = useState(false);

  // Hooks
  const chatApi = useChatApi();
  const rag = useRag();
  const { track } = useMetrics();

  // Initialize RAG on mount
  useEffect(() => {
    rag.buildIndex();
  }, []);

  // Update filtered programs when search/filters change
  useEffect(() => {
    let filtered = samplePrograms;

    // Apply search
    if (state.searchQuery.trim()) {
      const searchResults = search(state.searchQuery, searchIndex);
      const resultIds = new Set(searchResults.map(r => r.programId));
      filtered = filtered.filter(p => resultIds.has(p.id));
    }

    // Apply filters
    filtered = applyFilters(filtered, state.filters);

    setState(prev => ({ ...prev, filteredPrograms: filtered }));
  }, [state.searchQuery, state.filters, searchIndex]);

  // Generate search suggestions
  useEffect(() => {
    if (state.searchQuery.length >= 2) {
      const suggestions = generateSuggestions(state.searchQuery, searchIndex);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [state.searchQuery, searchIndex]);

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleSearchSubmit = (query: string) => {
    const searchResults = search(query, searchIndex);
    const resultPrograms = samplePrograms.filter(p => 
      searchResults.some(r => r.programId === p.id)
    );
    
    addToHistory(query, resultPrograms, 'search');
    track({ t: 'search.submit', at: Date.now(), query, results: resultPrograms.length });
    
    // Check for entfallene Programme
    const entfallenProgram = checkForEntfallenProgram(query);
    if (entfallenProgram) {
      showToast(`Hinweis: "${entfallenProgram}" ist entfallen und nicht mehr verfügbar`, 'warning');
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'program' && suggestion.programId) {
      const program = samplePrograms.find(p => p.id === suggestion.programId);
      if (program) {
        setSelectedProgram(program);
        track({ t: 'search.result.click', at: Date.now(), programId: program.id, position: 1 });
      }
    } else {
      setState(prev => ({ ...prev, searchQuery: suggestion.text }));
      handleSearchSubmit(suggestion.text);
    }
  };

  const handleToggleFilter = (group: FacetGroup, value: string) => {
    setState(prev => {
      const currentFilters = prev.filters[group];
      const newFilters = currentFilters.includes(value as any)
        ? currentFilters.filter(f => f !== value)
        : [...currentFilters, value as any];
      
      const newFilterState = {
        ...prev.filters,
        [group]: newFilters
      };

      // Track filter usage
      const activeGroups = Object.values(newFilterState).filter(arr => arr.length > 0).length;
      track({ t: 'filter.apply', at: Date.now(), groupsActive: activeGroups });

      return {
        ...prev,
        filters: newFilterState
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

  const handleClearSearch = () => {
    setState(prev => ({ ...prev, searchQuery: '' }));
  };

  const handleClearAll = () => {
    handleResetFilters();
    handleClearSearch();
  };

  const handleShowDetail = (programId: string) => {
    const program = samplePrograms.find(p => p.id === programId);
    if (program) {
      setSelectedProgram(program);
      addToHistory(`Detail: ${program.name}`, [program], 'view');
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
    const program = samplePrograms.find(p => p.id === programId);
    if (program) {
      setState(prev => ({ ...prev, showKI: true }));
      setContext('Aktuelle Karte');
      addToHistory(`Chat: ${program.name}`, [program], 'chat');
    }
  };

  const handleShowChecklist = (program: Program) => {
    setShowChecklist(program);
    addToHistory(`Checkliste: ${program.name}`, [program], 'checkliste');
  };

  const handleShowOnePager = (program: Program) => {
    setShowOnePager(program);
    addToHistory(`1-Pager: ${program.name}`, [program], 'onepager');
  };

  const handleShowEmail = (program: Program) => {
    setShowEmail(program);
    addToHistory(`E-Mail: ${program.name}`, [program], 'email');
  };

  const handleClearCompare = () => {
    setState(prev => ({ ...prev, comparedPrograms: [] }));
    showToast('Vergleichsauswahl geleert');
  };

  const handleOpenCompare = () => {
    setShowCompareModal(true);
    const comparePrograms = samplePrograms.filter(p => state.comparedPrograms.includes(p.id));
    addToHistory(`Vergleich: ${comparePrograms.length} Programme`, comparePrograms, 'vergleich');
  };

  const handleTabChange = (tab: NavigationTab) => {
    setState(prev => ({ ...prev, activeTab: tab }));
    
    if (tab === 'wizard') {
      setState(prev => ({ ...prev, showWizard: true }));
    } else if (tab === 'profil-matching') {
      setState(prev => ({ ...prev, showProfileMatching: true }));
    } else if (tab === 'help') {
      setState(prev => ({ ...prev, showHelp: true }));
    }
  };

  const handleWizardComplete = (answers: Record<string, string[]>) => {
    // Convert wizard answers to filter state
    const newFilters: FilterState = {
      status: [],
      zielgruppe: answers.step1 || [],
      foerderart: [],
      voraussetzungen: [],
      themen: answers.step5 || [],
      frist: answers.step6 || [],
      region: [],
      budget: answers.step3 || []
    };

    setState(prev => ({ 
      ...prev, 
      filters: newFilters,
      showWizard: false,
      wizardResults: true
    }));

    const wizardPrograms = applyFilters(samplePrograms, newFilters);
    addToHistory('Wizard-Ergebnisse', wizardPrograms, 'wizard');
    track({ t: 'wizard.finish', at: Date.now(), results: wizardPrograms.length });
  };

  const handleProfileMatchingComplete = (matchResults: any[]) => {
    setState(prev => ({ 
      ...prev, 
      showProfileMatching: false,
      profileResults: matchResults
    }));

    const topPrograms = matchResults.slice(0, 3).map(r => 
      samplePrograms.find(p => p.id === r.programId)
    ).filter(Boolean) as Program[];

    addToHistory('Profil-Matching', topPrograms, 'matching');
    track({ t: 'matching.apply', at: Date.now(), topCount: topPrograms.length });
  };

  const handleAddAnswer = async (answer: Answer) => {
    setAnswers(prev => [answer, ...prev]);
  };

  const handleGenerateAnswer = async (prompt: string) => {
    try {
      const answer = await chatApi.ask(
        provider,
        prompt,
        mode,
        context,
        onlyBrochure,
        withSources,
        localEndpoint,
        customEndpoint
      );
      
      handleAddAnswer(answer);
    } catch (error) {
      showToast('Fehler beim Generieren der Antwort', 'error');
    }
  };

  const comparedPrograms = samplePrograms.filter(p => state.comparedPrograms.includes(p.id));
  const starredPrograms = samplePrograms.filter(p => state.starredPrograms.includes(p.id));
  const providerPreset = providerPresets[provider];

  return (
    <div className="app-shell">
      {/* Navigation */}
      <NavBar
        activeTab={state.activeTab || 'explorer'}
        onTabChange={handleTabChange}
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
          <ActiveFiltersBar
            filters={state.filters}
            searchQuery={state.searchQuery}
            onRemoveFilter={(group, value) => handleToggleFilter(group, value)}
            onClearAll={handleClearAll}
            onClearSearch={handleClearSearch}
          />

          {/* Bookmark Bar */}
          {starredPrograms.length > 0 && (
            <BookmarkBar
              starredPrograms={starredPrograms}
              onShowDetail={handleShowDetail}
              onShowAllBookmarks={() => {
                setState(prev => ({ ...prev, bookmarkResults: true }));
                showToast(`${starredPrograms.length} gemerkte Programme angezeigt`);
              }}
              onShowToast={showToast}
            />
          )}

          {/* Program Grid */}
          <div className="flex-1 overflow-y-auto">
            {state.filteredPrograms.length > 0 ? (
              <ProgramGrid
                programs={state.filteredPrograms}
                onShowDetail={handleShowDetail}
                onToggleCompare={handleToggleCompare}
                onToggleStar={handleToggleStar}
                onOpenChat={handleOpenChat}
                onShowOnePager={handleShowOnePager}
                onShowEmail={handleShowEmail}
                onShowChecklist={handleShowChecklist}
                onShowToast={showToast}
                comparedPrograms={state.comparedPrograms}
                starredPrograms={state.starredPrograms}
                viewMode={state.viewMode}
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Keine Programme gefunden"
                description="Versuchen Sie andere Suchbegriffe oder passen Sie die Filter an."
                tips={[
                  'Verwenden Sie Synonyme (z.B. "QBN" statt "Qualifizierungsförderung")',
                  'Reduzieren Sie die Anzahl aktiver Filter',
                  'Prüfen Sie die Schreibweise'
                ]}
                action={{
                  label: 'Filter zurücksetzen',
                  onClick: handleClearAll
                }}
              />
            )}
          </div>

          {/* Compare Tray */}
          {state.comparedPrograms.length > 0 && (
            <CompareTray
              compareIds={state.comparedPrograms}
              onShowToast={showToast}
              onClearCompare={handleClearCompare}
              onOpenChat={() => setState(prev => ({ ...prev, showKI: true }))}
              onOpenCompare={handleOpenCompare}
            />
          )}
        </div>

        {/* KI Panel */}
        {state.showKI && (
          <KIPanel
            isOpen={state.showKI}
            provider={provider}
            mode={mode}
            context={context}
            onlyBrochure={onlyBrochure}
            withSources={withSources}
            providerPreset={providerPreset}
            answers={answers}
            onProviderChange={setProvider}
            onModeChange={setMode}
            onContextChange={setContext}
            onToggleOnlyBrochure={() => setOnlyBrochure(!onlyBrochure)}
            onToggleWithSources={() => setWithSources(!withSources)}
            onAddAnswer={handleAddAnswer}
            onRemoveAnswer={(id) => setAnswers(prev => prev.filter(a => a.id !== id))}
            onClearAnswers={() => setAnswers([])}
            onClose={() => setState(prev => ({ ...prev, showKI: false }))}
            onShowToast={showToast}
            chatLoading={chatApi.loading}
            chatApiError={chatApi.error}
            noExternalProviders={noExternalProviders}
            localConnection={localConnection}
            customConnection={customConnection}
          />
        )}
      </div>

      {/* Footer */}
      <FooterBar
        onOpenChangelog={() => setState(prev => ({ ...prev, showHelp: true, helpTab: 'changelog' }))}
        onOpenContact={() => setState(prev => ({ ...prev, showHelp: true, helpTab: 'contact' }))}
      />

      {/* Modals */}
      {selectedProgram && (
        <ProgramDetail
          program={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          onShowChecklist={() => handleShowChecklist(selectedProgram)}
          onShowOnePager={() => handleShowOnePager(selectedProgram)}
          onShowEmail={() => handleShowEmail(selectedProgram)}
          onToggleCompare={handleToggleCompare}
          onToggleStar={handleToggleStar}
          onOpenChat={handleOpenChat}
          onShowToast={showToast}
          isCompared={state.comparedPrograms.includes(selectedProgram.id)}
          isStarred={state.starredPrograms.includes(selectedProgram.id)}
        />
      )}

      {showChecklist && (
        <ChecklistView
          program={showChecklist}
          isOpen={!!showChecklist}
          onClose={() => setShowChecklist(null)}
          onShowToast={showToast}
        />
      )}

      {showOnePager && (
        <OnePagerPreview
          program={showOnePager}
          isOpen={!!showOnePager}
          onClose={() => setShowOnePager(null)}
          onShowToast={showToast}
        />
      )}

      {showEmail && (
        <EmailTextPreview
          program={showEmail}
          isOpen={!!showEmail}
          onClose={() => setShowEmail(null)}
          onShowToast={showToast}
        />
      )}

      {showCompareModal && (
        <CompareModal
          isOpen={showCompareModal}
          programs={comparedPrograms}
          onClose={() => setShowCompareModal(false)}
          onShowToast={showToast}
        />
      )}

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
          programs={samplePrograms}
          onClose={() => setState(prev => ({ ...prev, showProfileMatching: false }))}
          onShowDetail={handleShowDetail}
          onShowChecklist={handleShowChecklist}
          onToggleCompare={handleToggleCompare}
          onOpenChat={handleOpenChat}
          onShowAllResults={handleProfileMatchingComplete}
          onShowToast={showToast}
          compareIds={state.comparedPrograms}
        />
      )}

      {state.showHelp && (
        <HelpModal
          isOpen={state.showHelp}
          activeTab={state.helpTab || 'quickstart'}
          showHelpOnStart={showHelpOnStart}
          onClose={() => setState(prev => ({ ...prev, showHelp: false }))}
          onTabChange={(tab) => setState(prev => ({ ...prev, helpTab: tab }))}
          onToggleShowOnStart={() => setShowHelpOnStart(!showHelpOnStart)}
          onShowToast={showToast}
        />
      )}

      {state.showSettings && (
        <SettingsDrawer
          isOpen={state.showSettings}
          theme={state.theme}
          viewMode={state.viewMode}
          provider={provider}
          onlyBrochure={onlyBrochure}
          withSources={withSources}
          localEndpoint={localEndpoint}
          customEndpoint={customEndpoint}
          noExternalProviders={noExternalProviders}
          localConnection={localConnection}
          customConnection={customConnection}
          onClose={() => setState(prev => ({ ...prev, showSettings: false }))}
          onThemeChange={(theme) => setState(prev => ({ ...prev, theme }))}
          onViewModeChange={(viewMode) => setState(prev => ({ ...prev, viewMode }))}
          onProviderChange={setProvider}
          onToggleOnlyBrochure={() => setOnlyBrochure(!onlyBrochure)}
          onToggleWithSources={() => setWithSources(!withSources)}
          onLocalEndpointChange={setLocalEndpoint}
          onCustomEndpointChange={setCustomEndpoint}
          onToggleNoExternalProviders={() => setNoExternalProviders(!noExternalProviders)}
          onShowToast={showToast}
          onConnectionTest={chatApi.checkConnection}
          onConnectionUpdate={(type, connection) => {
            if (type === 'local') setLocalConnection(connection);
            if (type === 'custom') setCustomConnection(connection);
          }}
        />
      )}

      {state.showHistory && (
        <HistoryPanel
          isOpen={state.showHistory}
          history={state.history}
          onClose={() => setState(prev => ({ ...prev, showHistory: false }))}
          onClearHistory={() => setState(prev => ({ ...prev, history: [] }))}
          onShowDetail={handleShowDetail}
          onShowToast={showToast}
        />
      )}

      {state.showMetrics && (
        <MetricsPanel
          isOpen={state.showMetrics}
          onClose={() => setState(prev => ({ ...prev, showMetrics: false }))}
          onShowToast={showToast}
        />
      )}

      {showExportPreview && (
        <ExportPreviewModal
          isOpen={showExportPreview}
          onClose={() => setShowExportPreview(false)}
          type={exportType}
          program={exportProgram}
          programs={exportPrograms}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}