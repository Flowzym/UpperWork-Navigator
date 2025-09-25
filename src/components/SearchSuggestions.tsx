import React from 'react';
import { SearchSuggestion } from '../search/searchIndex';
import { FileText, Tag, Target, Search } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onClose: () => void;
}

export default function SearchSuggestions({ suggestions, onSelectSuggestion, onClose }: SearchSuggestionsProps) {
  if (suggestions.length === 0) return null;

  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const key = suggestion.type === 'program' ? 'Programme' : 
                suggestion.category || 'Begriffe';
    if (!groups[key]) groups[key] = [];
    groups[key].push(suggestion);
    return groups;
  }, {} as Record<string, SearchSuggestion[]>);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-10" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div 
        role="combobox" 
        aria-expanded={true}
        aria-owns="search-results" 
        aria-haspopup="listbox"
        className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto"
      >
        {Object.entries(groupedSuggestions).map(([category, items]) => (
          <div key={category}>
            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
              {category}
            </div>
            <ul id="search-results" role="listbox">
              {items.map((suggestion, index) => (
                <li key={`${category}-${index}`} role="option" id={`opt-${category}-${index}`}>
                  <button
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                    onClick={() => onSelectSuggestion(suggestion)}
                  >
                    <span className="text-gray-400">
                      {suggestion.type === 'program' ? <FileText size={14} /> : 
                       suggestion.type === 'theme' ? <Tag size={14} /> :
                       suggestion.type === 'target' ? <Target size={14} /> : <Search size={14} />}
                    </span>
                    <span className="text-gray-900">{suggestion.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}