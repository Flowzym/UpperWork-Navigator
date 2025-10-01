import { Program, FilterState } from '../types';
import { getBudgetCategory } from '../utils/derive';

export function applyFilters(programs: Program[], filters: FilterState): Program[] {
  return programs.filter(program => {
    // Status Filter
    if (filters.status.length > 0) {
      if (!filters.status.includes(program.status as any)) {
        return false;
      }
    }
    
    // Zielgruppe Filter (OR)
    if (filters.zielgruppe.length > 0) {
      if (!program.zielgruppe || !Array.isArray(program.zielgruppe) || program.zielgruppe.length === 0) {
        return false;
      }
      const hasMatch = filters.zielgruppe.some(filter =>
        program.zielgruppe.some(ziel =>
          ziel && typeof ziel === 'string' && (
            ziel.toLowerCase().includes(filter.toLowerCase()) ||
            filter.toLowerCase().includes(ziel.toLowerCase())
          )
        )
      );
      if (!hasMatch) return false;
    }
    
    // Förderart Filter (OR)
    if (filters.foerderart.length > 0) {
      if (!program.foerderart || !Array.isArray(program.foerderart) || program.foerderart.length === 0) {
        return false;
      }
      const hasMatch = filters.foerderart.some(filter =>
        program.foerderart.includes(filter as any)
      );
      if (!hasMatch) return false;
    }
    
    // Voraussetzungen Filter (OR)
    if (filters.voraussetzungen.length > 0) {
      const hasMatch = filters.voraussetzungen.some(filter => {
        switch (filter) {
          case 'eams':
            return program.antragsweg === 'eams';
          case 'min75':
            return program.voraussetzungen && Array.isArray(program.voraussetzungen) && program.voraussetzungen.some(v =>
              v && typeof v === 'string' && (v.toLowerCase().includes('75%') || v.toLowerCase().includes('anwesenheit'))
            );
          case 'anbieter':
            return program.voraussetzungen && Array.isArray(program.voraussetzungen) && program.voraussetzungen.some(v =>
              v && typeof v === 'string' && (v.toLowerCase().includes('anerkannt') || v.toLowerCase().includes('anbieter'))
            );
          case 'vorlauf7':
            return (program.frist && program.frist.typ === 'stichtag') ||
                   (program.voraussetzungen && Array.isArray(program.voraussetzungen) && program.voraussetzungen.some(v => v && typeof v === 'string' && v.toLowerCase().includes('vorlauf')));
          default:
            return false;
        }
      });
      if (!hasMatch) return false;
    }
    
    // Themen Filter (OR)
    if (filters.themen.length > 0) {
      if (!program.themen || !Array.isArray(program.themen) || program.themen.length === 0) {
        return false;
      }
      const hasMatch = filters.themen.some(filter =>
        program.themen.some(thema =>
          thema && typeof thema === 'string' && (
            thema.toLowerCase().includes(filter.toLowerCase()) ||
            filter.toLowerCase().includes(thema.toLowerCase())
          )
        )
      );
      if (!hasMatch) return false;
    }
    
    // Frist Filter (OR)
    if (filters.frist.length > 0) {
      if (!program.frist || !program.frist.typ || !filters.frist.includes(program.frist.typ as any)) {
        return false;
      }
    }
    
    // Region Filter (OR)
    if (filters.region.length > 0) {
      if (!program.region || typeof program.region !== 'string') {
        return false;
      }
      const hasMatch = filters.region.some(filter =>
        program.region.toLowerCase().includes(filter.toLowerCase()) ||
        filter.toLowerCase().includes(program.region.toLowerCase())
      );
      if (!hasMatch) return false;
    }
    
    // Budget Filter (OR)
    if (filters.budget.length > 0) {
      const budgetCategory = getBudgetCategory(program);
      if (!budgetCategory || !filters.budget.includes(budgetCategory)) {
        return false;
      }
    }
    
    return true;
  });
}

export function getActiveFilterCount(filters: FilterState): number {
  return Object.values(filters).reduce((count, filterArray) => count + filterArray.length, 0);
}