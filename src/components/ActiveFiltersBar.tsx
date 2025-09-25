import React from 'react';
import { FilterState, FacetGroup } from '../types';
import { Search, X } from 'lucide-react';

interface ActiveFiltersBarProps {
  filters: FilterState;
  searchQuery: string;
  onRemoveFilter: (group: FacetGroup, value: string) => void;
  onClearAll: () => void;
  onClearSearch: () => void;
}

const filterLabels: Record<FacetGroup, string> = {
  status: 'Status',
  zielgruppe: 'Zielgruppe',
  foerderart: 'Förderart',
  voraussetzungen: 'Voraussetzungen',
  themen: 'Themen',
  frist: 'Frist',
  region: 'Region',
  budget: 'Budget'
};

const valueLabels: Record<string, string> = {
  // Status
  'aktiv': 'Aktiv',
  'ausgesetzt': 'Ausgesetzt',
  'endet_am': 'Endet am',
  
  // Förderart
  'kurskosten': 'Kurskosten',
  'personalkosten': 'Personalkosten',
  'beihilfe': 'Beihilfe',
  'beratung': 'Beratung',
  
  // Voraussetzungen
  'eams': 'eAMS',
  'min75': '75% Anwesenheit',
  'anbieter': 'Anerk. Anbieter',
  'vorlauf7': 'Vorlauf ≥ 1 Woche',
  
  // Frist
  'laufend': 'Laufend',
  'stichtag': 'Stichtag',
  
  // Budget
  '≤1k': '≤ 1.000 €',
  '1–5k': '1–5 Tsd. €',
  '>5k': '> 5 Tsd. €'
};

export default function ActiveFiltersBar({ 
  filters, 
  searchQuery, 
  onRemoveFilter, 
  onClearAll, 
  onClearSearch 
}: ActiveFiltersBarProps) {
  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const hasSearch = searchQuery.trim().length > 0;
  
  if (!hasActiveFilters && !hasSearch) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Search Pill */}
          {hasSearch && (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <Search size={12} className="mr-1" />
              <span>Suche: "{searchQuery}"</span>
              <button
                className="ml-1 text-blue-600 hover:text-blue-800"
                onClick={onClearSearch}
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {/* Filter Pills */}
          {Object.entries(filters).map(([group, values]) => 
            values.map(value => (
              <div
                key={`${group}-${value}`}
                className="flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{filterLabels[group as FacetGroup]}: {valueLabels[value] || value}</span>
                <button
                  className="ml-1 text-gray-600 hover:text-gray-800"
                  onClick={() => onRemoveFilter(group as FacetGroup, value)}
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
        
        {(hasActiveFilters || hasSearch) && (
          <button
            className="btn btn-ghost btn-sm text-blue-700 hover:bg-blue-100"
            onClick={onClearAll}
          >
            Alle löschen
          </button>
        )}
      </div>
    </div>
  );
}