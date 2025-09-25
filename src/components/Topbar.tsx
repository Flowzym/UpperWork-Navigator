import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Provider, Mode, AppState } from '../types';
import SearchSuggestions from './SearchSuggestions';
import { SearchSuggestion } from '../search/searchIndex';

interface TopbarProps {
  state: AppState;
  searchQuery: string;
  searchSuggestions: SearchSuggestion[];
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onToggleSidebar: () => void;
  onStartWizard: () => void;
  onStartProfileMatching: () => void;
  onShowToast: (message: string) => void;
}

const providers: Provider[] = ['ChatGPT', 'Mistral', 'Claude', 'Lokal', 'Custom'];
const modes: Mode[] = ['Fakten', 'Vergleich', 'Checkliste', 'E-Mail', 'Was-wäre-wenn'];

export default function Topbar({
  state, 
  searchQuery,
  searchSuggestions,
  onSearchChange,
  onSearchSubmit,
  onSelectSuggestion,
  onToggleSidebar,
  onStartWizard,
  onStartProfileMatching,
  onShowToast 
}: TopbarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
      setShowSuggestions(false);
      searchRef.current?.blur();
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    onSelectSuggestion(suggestion);
    setShowSuggestions(false);
    searchRef.current?.blur();
  };

  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="topbar">
      <div className="flex items-center justify-between p-4 gap-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Förder-Navigator OÖ</h1>
          
          <div className="flex items-center gap-2" ref={containerRef}>
            <div className="relative">
              <form onSubmit={handleSearchSubmit}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Programme durchsuchen..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
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
              className="btn btn-primary"
              onClick={onStartWizard}
            >
              🧙‍♂️ Wizard starten
            </button>
            <button 
              className="btn btn-primary"
              onClick={onStartProfileMatching}
            >
              🎯 Profil-Matching
            </button>
            <button 
              className="btn btn-secondary"
              onClick={onToggleSidebar}
            >
              🔍 Filter
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Placeholder for future features */}
        </div>
      </div>
    </div>
  );
}