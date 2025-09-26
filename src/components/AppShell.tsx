import React from 'react';
import { Program, AppState, HistoryEntry, Toast } from '../types';

interface AppShellProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  addToHistory: (entry: HistoryEntry) => void;
}

export default function AppShell({ state, setState, showToast, addToHistory }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-content">
        <h1>Förder-Navigator</h1>
        <p>Loading...</p>
      </div>
    </div>
  );
}