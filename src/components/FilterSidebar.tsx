import React, { useState } from 'react';
import { FilterState, FacetGroup } from '../types';
import { RotateCcw } from 'lucide-react';
import Tooltip from './Tooltip';

interface FilterSidebarProps {
  isOpen: boolean;
  filters: FilterState;
  onToggleFilter: (group: FacetGroup, value: string) => void;
  onResetAll: () => void;
  onShowToast: (message: string) => void;
}

interface FilterGroup {
  name: string;
  key: FacetGroup;
  chips: string[];
}

const filterGroups: FilterGroup[] = [
  {
    name: 'Status', 
    key: 'status',
    chips: ['aktiv', 'endet_am', 'ausgesetzt']
  },
  {
    name: 'Zielgruppe',
    key: 'zielgruppe',
    chips: ['beschäftigte', 'arbeitsuchende', 'kmu', 'unternehmen', 'frauen', 'wiedereinstieg', 'lehrling', '50+']
  },
  {
    name: 'Förderart',
    key: 'foerderart',
    chips: ['kurskosten', 'personalkosten', 'beihilfe', 'beratung']
  },
  {
    name: 'Voraussetzungen',
    key: 'voraussetzungen',
    chips: ['eams', 'min75', 'anbieter', 'vorlauf7']
  },
  {
    name: 'Themen',
    key: 'themen',
    chips: ['digitalisierung', 'sprache', 'technik', 'management', 'nachhaltigkeit', 'pflege', 'handwerk', 'innovation']
  },
  {
    name: 'Frist',
    key: 'frist',
    chips: ['laufend', 'stichtag']
  },
  {
    name: 'Region',
    key: 'region',
    chips: ['oberösterreich', 'linz', 'wels', 'vöcklabruck', 'kirchdorf', 'steyr', 'braunau', 'ried']
  },
  {
    name: 'Budget',
    key: 'budget',
    chips: ['≤1k', '1–5k', '>5k']
  }
];

const chipLabels: Record<string, string> = {
  // Status
  'aktiv': 'Aktiv',
  'endet_am': 'Endet am',
  'ausgesetzt': 'Ausgesetzt',
  
  // Zielgruppe
  'beschäftigte': 'Beschäftigte',
  'arbeitsuchende': 'Arbeitsuchende',
  'kmu': 'KMU',
  'unternehmen': 'Unternehmen',
  'frauen': 'Frauen',
  'wiedereinstieg': 'Wiedereinstieg',
  'lehrling': 'Lehrlinge',
  '50+': '50+',
  
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
  
  // Themen
  'digitalisierung': 'Digitalisierung',
  'sprache': 'Sprache/Deutsch',
  'technik': 'Technik/Handwerk',
  'management': 'Management/Office',
  'nachhaltigkeit': 'Nachhaltigkeit',
  'pflege': 'Pflege/Gesundheit',
  'handwerk': 'Handwerk',
  'innovation': 'Innovation',
  
  // Frist
  'laufend': 'Laufend',
  'stichtag': 'Stichtag',
  
  // Region
  'oberösterreich': 'Ganz OÖ',
  'linz': 'Linz',
  'wels': 'Wels',
  'vöcklabruck': 'Vöcklabruck',
  'kirchdorf': 'Kirchdorf',
  'steyr': 'Steyr',
  'braunau': 'Braunau',
  'ried': 'Ried',
  
  // Budget
  '≤1k': '≤ 1.000 €',
  '1–5k': '1–5 Tsd. €',
  '>5k': '> 5 Tsd. €'
};

export default function FilterSidebar({ isOpen, filters, onToggleFilter, onResetAll, onShowToast }: FilterSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleChip = (group: FacetGroup, value: string) => {
    onToggleFilter(group, value);
    const isSelected = filters[group].includes(value as any);
    onShowToast(`Filter "${chipLabels[value] || value}" ${isSelected ? 'entfernt' : 'hinzugefügt'}`);
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const handleResetAll = () => {
    onResetAll();
    onShowToast('Alle Filter zurückgesetzt');
  };

  const getActiveCount = () => {
    return Object.values(filters).reduce((count, arr) => count + arr.length, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="sidebar w-80 h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Filter</h2>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={handleResetAll}
          >
            <RotateCcw size={14} className="mr-1" />
            Alle zurücksetzen
          </button>
        </div>

        <div className="space-y-6">
          {filterGroups.map((group) => {
            const isExpanded = expandedCategories[group.key];
            const activeCount = filters[group.key].length;
            const visibleChips = isExpanded ? group.chips : group.chips.slice(0, 6);
            const hasMore = group.chips.length > 6;

            return (
              <div key={group.key} className="space-y-3">
                <h3 className="font-medium text-gray-700">
                  {group.name}
                  {activeCount > 0 && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {activeCount}
                    </span>
                  )}
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {visibleChips.map((chip) => {
                    const isSelected = filters[group.key].includes(chip as any);
                    return (
                      <Tooltip
                        key={chip}
                        content={`Filter ${isSelected ? 'entfernen' : 'anwenden'}: ${chipLabels[chip] || chip}`}
                      >
                        <button
                          className={`chip ${isSelected ? 'active' : ''}`}
                          onClick={() => toggleChip(group.key, chip)}
                        >
                          {chipLabels[chip] || chip}
                        </button>
                      </Tooltip>
                    );
                  })}
                  
                  {hasMore && (
                    <button
                      className="chip"
                      onClick={() => toggleCategory(group.key)}
                    >
                      {isExpanded ? 'Weniger...' : `Mehr... (+${group.chips.length - 6})`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}