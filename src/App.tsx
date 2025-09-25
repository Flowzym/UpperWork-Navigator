import React, { useState } from 'react';
import { useEffect, useMemo } from 'react';
import { Search, Filter, Bot } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import Loader from './components/Loader';
import { AppState, Provider, Mode, ContextType, FilterState, FacetGroup, NavigationState, SettingsState, NavigationTab, HelpTab } from './types';
import { Program, Answer, HistoryEntry } from './types';
import { providerPresets } from './presets/providerPresets';
import { samplePrograms } from './data/samplePrograms';
import { useFetchPrograms, useChatResponse } from './hooks/useDummyApi';
import { useChatApi } from './hooks/useChatApi';
import { useRag } from './hooks/useRag';
import { buildIndex, search, generateSuggestions, SearchIndex, SearchSuggestion } from './search/searchIndex';
import { expandQueryTokens } from './search/synonyms';
import { applyFilters, getActiveFilterCount } from './filters/applyFilters';
import AppShell from './components/AppShell';
import BookmarkBar from './components/BookmarkBar';
import HistoryPanel from './components/HistoryPanel';
import SettingsDrawer from './components/SettingsDrawer';
import HelpModal from './components/HelpModal';
import FilterSidebar from './components/FilterSidebar';
import ProgramGrid from './components/ProgramGrid';
import KIPanel from './components/KIPanel';
import CompareTray from './components/CompareTray';
import ProgramDetail from './components/ProgramDetail';
import ChecklistView from './components/ChecklistView';
import OnePagerPreview from './components/OnePagerPreview';
import EmailTextPreview from './components/EmailTextPreview';
import ToastHost, { Toast } from './components/ToastHost';
import CompareModal from './components/CompareModal';
import WizardModal from './components/WizardModal';
import ProfileMatchingPanel from './components/ProfileMatchingPanel';
import SearchSuggestions from './components/SearchSuggestions';
import MetricsPanel from './components/MetricsPanel';
import EmptyState from './components/EmptyState';
import { useMetrics } from './metrics/useMetrics';
import { documentRetriever } from './rag/retriever';
import AdminApp from './features/admin/AdminApp';
import './styles.css';

let toastIdCounter = 0;
let historyIdCounter = 0;

function App() {
  // API Hooks
  const { programs: apiPrograms, loading: programsLoading, error: programsError } = useFetchPrograms();
  const { generateResponse, loading: chatLoading } = useChatResponse();
  const { ask, loading: chatApiLoading, error: chatApiError } = useChatApi();
  const rag = useRag();

  // Metrics
  const metrics = useMetrics();

  // Navigation State
  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeTab: 'explorer',
    showSettingsDrawer: false,
    showHelpModal: false,
    activeHelpTab: 'quickstart',
    showHelpOnStart: false
  });

  // Settings State
  const [settingsState, setSettingsState] = useState<SettingsState>({
    provider: 'ChatGPT',
    onlyBrochure: true,
    attachSources: true,
    noExternalProviders: false,
    adminMode: false,
    cardDensity: 'comfort',
    contrastMode: 'standard',
    localEndpoint: {
      baseUrl: import.meta.env.VITE_LOCAL_OPENAI_BASEURL || 'http://localhost:11434/v1',
      model: import.meta.env.VITE_LOCAL_OPENAI_MODEL || 'llama3.1:8b-instruct',
      apiKey: import.meta.env.VITE_LOCAL_OPENAI_API_KEY || undefined
    },
    customEndpoint: {
      baseUrl: import.meta.env.VITE_CUSTOM_OPENAI_BASEURL || 'https://api.openai.com/v1',
      model: import.meta.env.VITE_CUSTOM_OPENAI_MODEL || 'gpt-3.5-turbo',
      apiKey: import.meta.env.VITE_CUSTOM_OPENAI_API_KEY || undefined
    },
    localConnection: {
      isConnected: false,
      error: undefined,
      lastChecked: undefined
    },
    customConnection: {
      isConnected: false,
      error: undefined,
      lastChecked: undefined
    }
  });

  const [state, setState] = useState<AppState>({
    selectedProvider: settingsState.provider,
    selectedMode: 'Fakten',
    onlyBrochure: settingsState.onlyBrochure,
    attachSources: settingsState.attachSources,
    leftSidebarOpen: true,
    rightPanelOpen: true,
    selectedPrograms: [], // Legacy - keeping for compatibility
    currentContext: 'Aktuelle Karte',
    showDetailPlaceholder: false,
    detailProgramId: undefined
  });

  // Suchzustand
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);

  // Filter-Zustand
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    zielgruppe: [],
    foerderart: [],
    voraussetzungen: [],
    themen: [],
    frist: [],
    region: [],
    budget: []
  });

  // New state for polished features
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showOnePager, setShowOnePager] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string[]>>({});
  const [isWizardResult, setIsWizardResult] = useState(false);
  const [showProfileMatching, setShowProfileMatching] = useState(false);
  const [profileMatchResults, setProfileMatchResults] = useState<{programId: string; score: number; reasons: string[]}[]>([]);
  const [isProfileMatchResult, setIsProfileMatchResult] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);

  // RAG Index beim Start aufbauen
  useEffect(() => {
    rag.buildIndex();
  }, []);

  // Setup metrics tracking for RAG
  useEffect(() => {
    documentRetriever.setTracker(metrics.track);
  }, [metrics.track]);

  // Setup metrics tracking for RAG
  useEffect(() => {
    documentRetriever.setTracker(metrics.track);
  }, [metrics.track]);

  // Show help on start if enabled
  useEffect(() => {
    if (navigationState.showHelpOnStart) {
      setNavigationState(prev => ({ ...prev, showHelpModal: true }));
    }
  }, []);

  // Sync settings with legacy state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      selectedProvider: settingsState.provider,
      onlyBrochure: settingsState.onlyBrochure,
      attachSources: settingsState.attachSources
    }));
  }, [settingsState]);

  // Toast management
  const pushToast = (text: string, type: Toast['type'] = 'info') => {
    const newToast: Toast = {
      id: `toast-${++toastIdCounter}`,
      text,
      type
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // History management
  const addHistoryEntry = (type: HistoryEntry['type'], programId: string, programName: string) => {
    const newEntry: HistoryEntry = {
      id: `history-${++historyIdCounter}`,
      type,
      programId,
      programName,
      timestamp: Date.now()
    };
    setHistory(prev => [newEntry, ...prev.slice(0, 49)]); // Keep max 50 entries
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleOpenHistory = () => {
    setShowHistory(true);
  };

  const handleOpenMetrics = () => {
    setShowMetrics(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  const handleCloseMetrics = () => {
    setShowMetrics(false);
  };

  const handleToggleAdminMode = () => {
    const newAdminMode = !showAdminMode;
    setShowAdminMode(newAdminMode);
    updateSettingsState({ adminMode: newAdminMode });
    
    if (newAdminMode) {
      pushToast('Admin-Modus aktiviert', 'info');
    } else {
      pushToast('Admin-Modus deaktiviert', 'info');
    }
  };

  // Suchindex erstellen
  const searchIndex = useMemo(() => buildIndex(apiPrograms), [apiPrograms]);

  // Suchvorschläge aktualisieren
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const suggestions = generateSuggestions(searchQuery, searchIndex);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, searchIndex]);

  // Kombiniere Suche und Filter
  const visiblePrograms = useMemo(() => {
    let programs = apiPrograms;
    
    console.log('visiblePrograms calculation:', {
      totalPrograms: programs.length,
      searchResults,
      hasSearchResults: searchResults !== null,
    });
    
    // Erst Suche anwenden
    if (searchResults) {
      programs = programs.filter(p => searchResults.includes(p.id));
      console.log('After search filter:', programs.length);
    }
    
    // Dann Filter anwenden
    programs = applyFilters(programs, filters);
    console.log('After filters applied:', programs.length);
    
    return programs;
  }, [apiPrograms, searchResults, filters]);

  const activeFilterCount = getActiveFilterCount(filters);

  // State update helpers
  const updateNavigationState = (updates: Partial<NavigationState>) => {
    setNavigationState(prev => ({ ...prev, ...updates }));
  };

  // Debug logging for initial state
  console.log('App Debug:', {
    apiPrograms: apiPrograms.length,
    searchResults,
    activeFilterCount,
    visibleProgramsLength: visiblePrograms.length,
    rightPanelOpen: state.rightPanelOpen
  });

  const updateSettingsState = (updates: Partial<SettingsState>) => {
    setSettingsState(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettingsState({
      provider: 'ChatGPT',
      onlyBrochure: true,
      attachSources: true,
      noExternalProviders: false,
      adminMode: false,
      cardDensity: 'comfort',
      contrastMode: 'standard',
      localEndpoint: {
        baseUrl: import.meta.env.VITE_LOCAL_OPENAI_BASEURL || 'http://localhost:11434/v1',
        model: import.meta.env.VITE_LOCAL_OPENAI_MODEL || 'llama3.1:8b-instruct',
        apiKey: import.meta.env.VITE_LOCAL_OPENAI_API_KEY || undefined
      },
      customEndpoint: {
        baseUrl: import.meta.env.VITE_CUSTOM_OPENAI_BASEURL || 'https://api.openai.com/v1',
        model: import.meta.env.VITE_CUSTOM_OPENAI_MODEL || 'gpt-3.5-turbo',
        apiKey: import.meta.env.VITE_CUSTOM_OPENAI_API_KEY || undefined
      },
      localConnection: {
        isConnected: false,
        error: undefined,
        lastChecked: undefined
      },
      customConnection: {
        isConnected: false,
        error: undefined,
        lastChecked: undefined
      }
    });
  };

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Suchfunktionen
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
    }
  };

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const results = search(query, searchIndex);
    const programIds = results.map(r => r.programId);
    setSearchResults(programIds);
    
    // Track search submit
    metrics.track({
      t: 'search.submit',
      at: Date.now(),
      query,
      results: results.length
    });
    
    // Track search submit
    metrics.track({
      t: 'search.submit',
      at: Date.now(),
      query,
      results: results.length
    });
    
    pushToast(`${results.length} Treffer für "${query}"`, 'info');
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'program' && suggestion.programId) {
      setSearchQuery(suggestion.text);
      setSearchResults([suggestion.programId]);
      pushToast(`Programm "${suggestion.text}" ausgewählt`, 'success');
    } else {
      setSearchQuery(suggestion.text);
      handleSearchSubmit(suggestion.text);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchSuggestions([]);
    pushToast('Suche zurückgesetzt', 'info');
  };

  // Filter-Funktionen
  const handleToggleFilter = (group: FacetGroup, value: string) => {
    setFilters(prev => {
      const groupFilters = prev[group];
      const isSelected = groupFilters.includes(value as any);
      
      if (isSelected) {
        return {
          ...prev,
          [group]: groupFilters.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [group]: [...groupFilters, value as any]
        };
      }
    });
    
    // Track filter apply (count active groups after change)
    setTimeout(() => {
      const activeGroups = Object.values(filters).filter(arr => arr.length > 0).length;
      metrics.track({
        t: 'filter.apply',
        at: Date.now(),
        groupsActive: activeGroups
      });
    }, 0);
  };

  const handleRemoveFilter = (group: FacetGroup, value: string) => {
    setFilters(prev => ({
      ...prev,
      [group]: prev[group].filter(v => v !== value)
    }));
  };
    
    // Track filter apply (count active groups after change)
    setTimeout(() => {
      const activeGroups = Object.values(filters).filter(arr => arr.length > 0).length;
      metrics.track({
        t: 'filter.apply',
        at: Date.now(),
        groupsActive: activeGroups
      });
    }, 0);

  const handleClearAllFilters = () => {
    setFilters({
      status: [],
      zielgruppe: [],
      foerderart: [],
      voraussetzungen: [],
      themen: [],
      frist: [],
      region: [],
      budget: []
    });
  };

  const handleProviderChange = (provider: Provider) => {
    updateSettingsState({ provider });
    pushToast(`Provider gewechselt zu ${provider}`, 'info');
  };

  const handleModeChange = (mode: Mode) => {
    setState(prev => ({ ...prev, selectedMode: mode }));
    pushToast(`Modus gewechselt zu ${mode}`, 'info');
  };

  const handleToggleOnlyBrochure = () => {
    const newValue = !settingsState.onlyBrochure;
    updateSettingsState({ onlyBrochure: newValue });
    pushToast(`Nur Broschüre ${newValue ? 'aktiviert' : 'deaktiviert'}`, 'info');
  };

  const handleToggleWithSources = () => {
    const newValue = !settingsState.attachSources;
    updateSettingsState({ attachSources: newValue });
    pushToast(`Quellen anfügen ${newValue ? 'aktiviert' : 'deaktiviert'}`, 'info');
  };

  const handleToggleSidebar = () => {
    const newSidebarState = !state.leftSidebarOpen;
    updateState({ 
      leftSidebarOpen: newSidebarState,
      // Auto-collapse right panel if sidebar opens
      rightPanelOpen: newSidebarState ? false : state.rightPanelOpen
    });
  };

  const handleToggleRightPanel = () => {
    const newPanelState = !state.rightPanelOpen;
    updateState({ 
      rightPanelOpen: newPanelState,
      // Auto-collapse sidebar if right panel opens
      leftSidebarOpen: newPanelState ? false : state.leftSidebarOpen
    });
  };

  const handleStartWizard = () => {
    updateNavigationState({ activeTab: 'wizard' });
    setShowWizard(true);
    pushToast('Förder-Wizard wird gestartet...', 'info');
  };

  const handleStartProfileMatching = () => {
    updateNavigationState({ activeTab: 'profil-matching' });
    setShowProfileMatching(true);
    pushToast('Profil-Matching wird gestartet...', 'info');
  };

  const handleCloseProfileMatching = () => {
    updateNavigationState({ activeTab: 'explorer' });
    setShowProfileMatching(false);
  };

  const handleProfileMatchingResults = (matchResults: {programId: string; score: number; reasons: string[]}[]) => {
    setProfileMatchResults(matchResults);
    setIsProfileMatchResult(true);
    
    // Track matching apply
    const topCount = matchResults.filter(r => r.score >= 70).length;
    metrics.track({
      t: 'matching.apply',
      at: Date.now(),
      topCount
    });
    
    // Filter programs based on match results (show top matches)
    const topMatchIds = matchResults.filter(r => r.score >= 30).map(r => r.programId);
    setSearchResults(topMatchIds);
    
    const resultCount = topMatchIds.length;
    pushToast(`${resultCount} passende Programme gefunden`, 'success');
  };

  const handleResetProfileMatching = () => {
    setProfileMatchResults([]);
    setIsProfileMatchResult(false);
    setSearchResults(null);
    pushToast('Profil-Matching zurückgesetzt', 'info');
  };

  const handleCloseWizard = () => {
    updateNavigationState({ activeTab: 'explorer' });
    setShowWizard(false);
  };

  const handleWizardComplete = (answers: Record<string, string[]>) => {
    setWizardAnswers(answers);
    setShowWizard(false);
    
    // Apply wizard filters
    const wizardFilters = applyWizardFilters(answers);
    setFilters(wizardFilters);
    setIsWizardResult(true);
    
    const resultCount = applyFilters(apiPrograms, wizardFilters).length;
    
    // Track wizard finish
    metrics.track({
      t: 'wizard.finish',
      at: Date.now(),
      results: resultCount
    });
    
    // Track wizard finish
    metrics.track({
      t: 'wizard.finish',
      at: Date.now(),
      results: resultCount
    });
    
    pushToast(`Wizard abgeschlossen - ${resultCount} passende Programme gefunden`, 'success');
  };

  const handleResetWizard = () => {
    setWizardAnswers({});
    setIsWizardResult(false);
    handleClearAllFilters();
    pushToast('Wizard-Ergebnisse zurückgesetzt', 'info');
  };

  // Program actions
  const handleShowDetail = (programId: string) => {
    const program = apiPrograms.find(p => p.id === programId);
    if (program) {
      // Track search result click if this came from search
      if (searchResults && searchResults.includes(programId)) {
        const position = searchResults.indexOf(programId) + 1;
        metrics.track({
          t: 'search.result.click',
          at: Date.now(),
          programId,
          position
        });
      }
      
      // Track search result click if this came from search
      if (searchResults && searchResults.includes(programId)) {
        const position = searchResults.indexOf(programId) + 1;
        metrics.track({
          t: 'search.result.click',
          at: Date.now(),
          programId,
          position
        });
      }
      
      setSelectedProgram(program);
      setShowDetail(true);
      addHistoryEntry('view', program.id, program.name);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setShowChecklist(false);
    setShowOnePager(false);
    setShowEmail(false);
    // Keep selectedProgram for potential reopening
  };

  const handleShowChecklist = (program?: Program) => {
    if (program) {
      setSelectedProgram(program);
      addHistoryEntry('checkliste', program.id, program.name);
    }
    setShowEmail(false);
    setShowChecklist(true);
  };

  const handleShowOnePager = (program?: Program) => {
    if (program) {
      setSelectedProgram(program);
      addHistoryEntry('onepager', program.id, program.name);
    }
    setShowDetail(false);
    setShowChecklist(false);
    setShowEmail(false);
    setShowOnePager(true);
  };

  const handleShowEmail = (program?: Program) => {
    if (program) {
      setSelectedProgram(program);
      addHistoryEntry('email', program.id, program.name);
    }
    setShowDetail(false);
    setShowChecklist(false);
    setShowOnePager(false);
    setShowEmail(true);
  };

  // Compare functionality
  const handleToggleCompare = (programId: string) => {
    const isCompared = compareIds.includes(programId);
    const newCompareIds = isCompared
      ? compareIds.filter(id => id !== programId)
      : [...compareIds, programId];
    
    setCompareIds(newCompareIds);
    
    const program = apiPrograms.find(p => p.id === programId);
    if (program) {
      pushToast(`"${program.name}" ${isCompared ? 'aus Vergleich entfernt' : 'zum Vergleich hinzugefügt'}`, 'success');
      if (!isCompared) {
        addHistoryEntry('vergleich', program.id, program.name);
      }
    }
  };

  const handleClearCompare = () => {
    setCompareIds([]);
    pushToast('Vergleichsauswahl geleert', 'info');
  };

  // Compare modal functionality
  const handleOpenCompare = () => {
    setShowCompare(true);
  };

  const handleCloseCompare = () => {
    setShowCompare(false);
  };

  // Star functionality
  const handleToggleStar = (programId: string) => {
    const isStarred = starredIds.includes(programId);
    const newStarredIds = isStarred
      ? starredIds.filter(id => id !== programId)
      : [...starredIds, programId];
    
    setStarredIds(newStarredIds);
    
    const program = apiPrograms.find(p => p.id === programId);
    pushToast(`"${program?.name}" ${isStarred ? 'von Merkzettel entfernt' : 'zu Merkzettel hinzugefügt'}`, 'success');
  };

  // Chat functionality
  const handleOpenChat = (programId?: string) => {
    updateState({ 
      rightPanelOpen: true,
      leftSidebarOpen: false // Auto-collapse sidebar
    });
    
    if (programId) {
      const program = apiPrograms.find(p => p.id === programId);
      if (program) {
        pushToast(`"${program.name}" an Chat gesendet`, 'info');
        addHistoryEntry('chat', program.id, program.name);
      }
    } else {
      pushToast('Chat geöffnet', 'info');
    }
  };

  // Legacy compatibility
  const handleToggleCompareLegacy = (programId: string) => {
    handleToggleCompare(programId);
  };

  const handleClearSelectionLegacy = () => {
    handleClearCompare();
  };

  const handleContextChange = (context: ContextType) => {
    setState(prev => ({ ...prev, currentContext: context }));
    pushToast(`Kontext gewechselt zu "${context}"`, 'info');
  };

  // KI Panel functionality
  const handleAddAnswer = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      let answer: Answer;
      
      // Use real API for ChatGPT, Mistral, Claude, Lokal, Custom - dummy for others
      if (['ChatGPT', 'Mistral', 'Claude', 'Lokal', 'Custom'].includes(settingsState.provider)) {
        answer = await ask(
          settingsState.provider,
          query,
          state.selectedMode,
          state.currentContext,
          settingsState.onlyBrochure,
          settingsState.attachSources,
          settingsState.localEndpoint,
          settingsState.customEndpoint
        );
      } else {
        answer = await generateResponse(
          query,
          settingsState.provider,
          state.selectedMode,
          state.currentContext,
          settingsState.onlyBrochure,
          settingsState.attachSources
        );
      }
      
      setAnswers(prev => [answer, ...prev]); // Newest first
      pushToast('Antwort generiert', 'success');
    } catch (error) {
      pushToast('Fehler beim Generieren der Antwort', 'error');
    }
  };

  const handleAddAnswerDirect = (answer: Answer) => {
    setAnswers(prev => [answer, ...prev]); // Newest first
  };

  const handleRemoveAnswer = (answerId: string) => {
    setAnswers(prev => prev.filter(a => a.id !== answerId));
  };

  const handleClearAnswers = () => {
    setAnswers([]);
    pushToast('Alle Antworten gelöscht', 'info');
  };

  const handleCloseKIPanel = () => {
    updateState({ rightPanelOpen: false });
  };

  // Legacy toast function for compatibility
  // Legacy - keeping for compatibility but using new compare system
  const legacySelectedPrograms = compareIds;

  const handleShowChecklistLegacy = (program: Program) => {
    setSelectedProgram(program);
    setShowChecklist(true);
    addHistoryEntry('checkliste', program.id, program.name);
  };

  // Bookmark functionality
  const handleShowAllBookmarks = () => {
    // Filter to show only starred programs
    const starredProgramIds = starredIds;
    setSearchResults(starredProgramIds);
    setSearchQuery('');
    handleClearAllFilters();
    pushToast(`${starredIds.length} gemerkte Programme angezeigt`, 'info');
  };

  // Get starred programs for BookmarkBar
  const starredPrograms = apiPrograms.filter(p => starredIds.includes(p.id));

  // Add missing wizard filter mapping function
  const applyWizardFilters = (answers: Record<string, string[]>): FilterState => {
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

    // Map wizard answers to filter state
    const step1 = answers.step1 || [];
    const step2 = answers.step2 || [];
    const step3 = answers.step3 || [];
    const step4 = answers.step4 || [];
    const step5 = answers.step5 || [];
    const step6 = answers.step6 || [];

    // Step 1: Status → Zielgruppe
    if (step1.includes('beschäftigt')) newFilters.zielgruppe.push('beschäftigte');
    if (step1.includes('arbeitsuchend')) newFilters.zielgruppe.push('arbeitsuchende');
    if (step1.includes('frauen')) newFilters.zielgruppe.push('frauen');
    if (step1.includes('50+')) newFilters.zielgruppe.push('50+');

    // Step 2: Ziel → Themen
    if (step2.includes('digital_skills')) newFilters.themen.push('digitalisierung');
    if (step2.includes('deutsch_b1_b2')) newFilters.themen.push('sprache');
    if (step2.includes('führung')) newFilters.themen.push('management');

    // Step 3: Budget → Budget
    if (step3.includes('≤1k')) newFilters.budget.push('≤1k');
    if (step3.includes('1–5k')) newFilters.budget.push('1–5k');
    if (step3.includes('>5k')) newFilters.budget.push('>5k');

    // Step 4: Arbeitgeber → Zielgruppe
    if (step4.includes('arbeitgeber_beteiligt')) newFilters.zielgruppe.push('unternehmen');
    if (step4.includes('einzelperson')) newFilters.zielgruppe.push('einzelpersonen');

    // Step 5: Thema → Themen
    if (step5.includes('digitalisierung')) newFilters.themen.push('digitalisierung');
    if (step5.includes('sprache_deutsch')) newFilters.themen.push('sprache');
    if (step5.includes('technik_handwerk')) newFilters.themen.push('technik');
    if (step5.includes('nachhaltigkeit')) newFilters.themen.push('nachhaltigkeit');

    // Step 6: Timing → Frist
    if (step6.includes('laufend')) newFilters.frist.push('laufend');
    if (step6.includes('stichtag')) newFilters.frist.push('stichtag');

    return newFilters;
  };

  // Gefilterte Programme für Anzeige
  const displayProgramCount = visiblePrograms.length;

  // Show loading state if programs are still loading
  if (programsLoading || rag.loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader size="lg" text={rag.loading ? "Broschüre wird indexiert..." : "Programme werden geladen..."} />
        </div>
      </ErrorBoundary>
    );
  }

  // Show error state if programs failed to load
  if (programsError || rag.error) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <EmptyState
            icon="⚠️"
            title="Fehler beim Laden"
            description={programsError || rag.error || 'Unbekannter Fehler'}
            action={{
              label: '🔄 Erneut versuchen',
              onClick: () => window.location.reload()
            }}
            type="error"
          />
        </div>
      </ErrorBoundary>
    );
  }

  // Handle navigation tab changes
  const handleNavigationTabChange = (tab: NavigationTab) => {
    updateNavigationState({ activeTab: tab });
    
    switch (tab) {
      case 'explorer':
        // Already in explorer view
        break;
      case 'wizard':
        handleStartWizard();
        break;
      case 'profil-matching':
        handleStartProfileMatching();
        break;
      case 'help':
        updateNavigationState({ showHelpModal: true });
        break;
    }
  };

  // Render different views based on active tab
  const renderMainContent = () => {
    if (navigationState.activeTab !== 'explorer') {
      return null; // Wizard and Profile Matching are modals
    }

    return (
      <>
        <FilterSidebar
          isOpen={state.leftSidebarOpen}
          filters={filters}
          onToggleFilter={handleToggleFilter}
          onResetAll={handleClearAllFilters}
          onShowToast={pushToast}
        />

        <main className="main-content">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Förderprogramme ({displayProgramCount})
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) handleSearchSubmit(searchQuery); }}>
                  <input
                    type="text"
                    placeholder="Programme durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </form>
                
                {showSuggestions && searchSuggestions.length > 0 && (
                  <SearchSuggestions
                    suggestions={searchSuggestions}
                    onSelectSuggestion={handleSelectSuggestion}
                    onClose={() => setShowSuggestions(false)}
                  />
                )}
              </div>
              
              <button
                className="btn btn-secondary"
                onClick={handleToggleSidebar}
              >
                <Filter size={14} className="mr-1" />
                Filter
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleOpenChat()}
              >
                <Bot size={14} className="mr-1" />
                KI-Assistent {state.rightPanelOpen ? 'schließen' : 'öffnen'}
              </button>
            </div>
          </div>

          <ProgramGrid
            programs={visiblePrograms}
            filteredProgramIds={searchResults}
            searchQuery={searchQuery}
            filters={filters}
            activeFilterCount={activeFilterCount}
            isWizardResult={isWizardResult}
            isProfileMatchResult={isProfileMatchResult}
            onResetWizard={handleResetWizard}
            onResetProfileMatching={handleResetProfileMatching}
            selectedPrograms={legacySelectedPrograms}
            onShowDetail={handleShowDetail}
            onToggleCompare={handleToggleCompareLegacy}
            onShowToast={pushToast}
            onShowChecklist={handleShowChecklistLegacy}
            onClearSearch={handleClearSearch}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={handleClearAllFilters}
          />
        </main>

        <KIPanel
          isOpen={state.rightPanelOpen}
          provider={state.selectedProvider}
          mode={state.selectedMode}
          context={state.currentContext}
          onlyBrochure={settingsState.onlyBrochure}
          withSources={settingsState.attachSources}
          providerPreset={providerPresets[state.selectedProvider]}
          answers={answers}
          onProviderChange={handleProviderChange}
          onModeChange={handleModeChange}
          onContextChange={handleContextChange}
          onToggleOnlyBrochure={handleToggleOnlyBrochure}
          onToggleWithSources={handleToggleWithSources}
          onAddAnswer={handleAddAnswerDirect}
          onRemoveAnswer={handleRemoveAnswer}
          onClearAnswers={handleClearAnswers}
          onClose={handleCloseKIPanel}
          onShowToast={pushToast}
          chatLoading={chatApiLoading || chatLoading}
          noExternalProviders={settingsState.noExternalProviders}
          localConnection={settingsState.localConnection}
          customConnection={settingsState.customConnection}
        />
      </>
    );
  };

  return (
    <ErrorBoundary>
    <AdminApp
      isAdminMode={showAdminMode}
      onToggleAdminMode={handleToggleAdminMode}
      onShowToast={pushToast}
    />
    
    <AdminApp
      isAdminMode={showAdminMode}
      onToggleAdminMode={handleToggleAdminMode}
      onShowToast={pushToast}
    />
    
    <AppShell
      navigationState={navigationState}
      settingsState={settingsState}
      onNavigationChange={(updates) => {
        updateNavigationState(updates);
        if (updates.activeTab) {
          handleNavigationTabChange(updates.activeTab);
        }
      }}
      onSettingsChange={updateSettingsState}
      onResetSettings={resetSettings}
      onOpenHistory={handleOpenHistory}
      onOpenMetrics={handleOpenMetrics}
      onToggleAdminMode={handleToggleAdminMode}
    >
      {renderMainContent()}

      {/* Bookmark Bar */}
      {starredPrograms.length > 0 && navigationState.activeTab === 'explorer' && (
        <BookmarkBar
          starredPrograms={starredPrograms}
          onShowDetail={handleShowDetail}
          onShowAllBookmarks={handleShowAllBookmarks}
          onShowToast={pushToast}
        />
      )}

      <CompareTray
        compareIds={compareIds}
        onShowToast={pushToast}
        onClearCompare={handleClearCompare}
        onOpenChat={() => handleOpenChat()}
        onOpenCompare={handleOpenCompare}
      />

      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistory}
        history={history}
        onClose={handleCloseHistory}
        onClearHistory={clearHistory}
        onShowDetail={handleShowDetail}
        onShowToast={pushToast}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={navigationState.showSettingsDrawer}
        settings={settingsState}
        onClose={() => updateNavigationState({ showSettingsDrawer: false })}
        onSettingsChange={updateSettingsState}
        onResetSettings={resetSettings}
        onShowToast={pushToast}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={navigationState.showHelpModal}
        activeTab={navigationState.activeHelpTab}
        showHelpOnStart={navigationState.showHelpOnStart}
        onClose={() => updateNavigationState({ showHelpModal: false })}
        onTabChange={(tab) => updateNavigationState({ activeHelpTab: tab })}
        onToggleShowOnStart={() => updateNavigationState({ 
          showHelpOnStart: !navigationState.showHelpOnStart 
        })}
        onShowToast={pushToast}
      />

      {/* Detail Modal */}
      {selectedProgram && showDetail && (
        <ProgramDetail
          program={selectedProgram}
          isOpen={showDetail}
          onClose={handleCloseDetail}
          onShowChecklist={() => handleShowChecklist()}
          onShowOnePager={() => handleShowOnePager()}
          onShowEmail={() => handleShowEmail()}
          onToggleCompare={handleToggleCompare}
          onToggleStar={handleToggleStar}
          onOpenChat={handleOpenChat}
          onShowToast={pushToast}
          isCompared={compareIds.includes(selectedProgram.id)}
          isStarred={starredIds.includes(selectedProgram.id)}
        />
      )}

      {/* Checklist Modal */}
      {selectedProgram && showChecklist && (
        <ChecklistView
          program={selectedProgram}
          isOpen={showChecklist}
          onClose={handleCloseDetail}
          onShowToast={pushToast}
        />
      )}

      {/* OnePager Modal */}
      {selectedProgram && showOnePager && (
        <OnePagerPreview
          program={selectedProgram}
          isOpen={showOnePager}
          onClose={handleCloseDetail}
          onShowToast={pushToast}
        />
      )}

      {/* Email Modal */}
      {selectedProgram && showEmail && (
        <EmailTextPreview
          program={selectedProgram}
          isOpen={showEmail}
          onClose={handleCloseDetail}
          onShowToast={pushToast}
        />
      )}

      {/* Compare Modal */}
      <CompareModal
        isOpen={showCompare}
        programs={apiPrograms.filter(p => compareIds.includes(p.id))}
        onClose={handleCloseCompare}
        onShowToast={pushToast}
      />

      {/* Toast Host */}
      <ToastHost toasts={toasts} onRemoveToast={removeToast} />

      {/* Wizard Modal */}
      <WizardModal
        isOpen={showWizard}
        onClose={handleCloseWizard}
        onComplete={handleWizardComplete}
        onShowToast={pushToast}
      />

      {/* Profile Matching Panel */}
      <ProfileMatchingPanel
        isOpen={showProfileMatching}
        programs={apiPrograms}
        onClose={handleCloseProfileMatching}
        onShowDetail={handleShowDetail}
        onShowChecklist={handleShowChecklistLegacy}
        onToggleCompare={handleToggleCompare}
        onOpenChat={handleOpenChat}
        onShowAllResults={handleProfileMatchingResults}
        onShowToast={pushToast}
        compareIds={compareIds}
      />

      {/* Metrics Panel */}
      <MetricsPanel
        isOpen={showMetrics}
        onClose={handleCloseMetrics}
        onShowToast={pushToast}
      />
    </AppShell>
    </ErrorBoundary>
  );
}

export default App;