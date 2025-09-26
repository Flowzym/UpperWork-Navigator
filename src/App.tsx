import React, { useState, useEffect } from 'react';
import { Program } from './types';
import { samplePrograms } from './data/samplePrograms';
import AppShell from './components/AppShell';
import ToastHost from './components/ToastHost';
import { documentRetriever } from "./rag/retriever";
import AdminApp from "./features/admin/AdminApp";

let toastIdCounter = 0;
let historyIdCounter = 0;

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  query: string;
  results: Program[];
  type: 'search' | 'filter' | 'wizard';
}

export interface AppState {
  programs: Program[];
  filteredPrograms: Program[];
  selectedProgram: Program | null;
  comparedPrograms: string[];
  starredPrograms: string[];
  searchQuery: string;
  filters: {
    status: string[];
    zielgruppe: string[];
    foerderart: string[];
    voraussetzungen: string[];
    themen: string[];
    frist: string[];
    region: string[];
  };
  showWizard: boolean;
  showHelp: boolean;
  showSettings: boolean;
  showKI: boolean;
  showHistory: boolean;
  showMetrics: boolean;
  showAdmin: boolean;
  toasts: Toast[];
  history: HistoryEntry[];
  theme: 'light' | 'dark' | 'high-contrast';
  viewMode: 'comfort' | 'compact';
}

function App() {
  const [state, setState] = useState<AppState>({
    programs: samplePrograms,
    filteredPrograms: samplePrograms,
    selectedProgram: null,
    comparedPrograms: [],
    starredPrograms: [],
    searchQuery: '',
    filters: {
      status: [],
      zielgruppe: [],
      foerderart: [],
      voraussetzungen: [],
      themen: [],
      frist: [],
      region: []
    },
    showWizard: false,
    showHelp: false,
    showSettings: false,
    showKI: false,
    showHistory: false,
    showMetrics: false,
    showAdmin: false,
    toasts: [],
    history: [],
    theme: 'light',
    viewMode: 'comfort'
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const showToast = (message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const toast: Toast = {
      id: `toast-${++toastIdCounter}`,
      message,
      type,
      duration
    };
    
    setState(prev => ({
      ...prev,
      toasts: [...prev.toasts, toast]
    }));
  };

  const removeToast = (id: string) => {
    setState(prev => ({
      ...prev,
      toasts: prev.toasts.filter(toast => toast.id !== id)
    }));
  };

  const addToHistory = (query: string, results: Program[], type: HistoryEntry['type']) => {
    const entry: HistoryEntry = {
      id: `history-${++historyIdCounter}`,
      timestamp: new Date(),
      query,
      results,
      type
    };
    
    setState(prev => ({
      ...prev,
      history: [entry, ...prev.history.slice(0, 49)] // Keep last 50 entries
    }));
  };

  if (state.showAdmin) {
    return <AdminApp onClose={() => setState(prev => ({ ...prev, showAdmin: false }))} />;
  }

  return (
    <>
      <AppShell 
        state={state}
        setState={setState}
        showToast={showToast}
        addToHistory={addToHistory}
      />
      <ToastHost 
        toasts={state.toasts}
        onRemove={removeToast}
      />
    </>
  );
}

export default App;