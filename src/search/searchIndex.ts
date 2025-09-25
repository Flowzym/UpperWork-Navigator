export interface SearchIndex {
  programs: Program[];
  titleIndex: Map<string, string[]>;
  contentIndex: Map<string, { programId: string; field: string; weight: number }[]>;
}

export interface SearchResult {
  programId: string;
  score: number;
  matchedTerms: string[];
}

export interface SearchSuggestion {
  type: 'program' | 'theme' | 'target' | 'term';
  text: string;
  programId?: string;
  category?: string;
}

import { Program } from '../types';

// Normalisierung: Umlaute, ß, Diakritika, lowercase
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[àáâãäåæ]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .trim();
}

// Einfache Edit-Distance (Levenshtein)
export function editDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i] + 1,     // deletion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}

// Fuzzy Match: erlaubt Distanz ≤2 bei ≥6 Zeichen
export function isFuzzyMatch(term: string, text: string): boolean {
  const normalizedTerm = normalizeText(term);
  const normalizedText = normalizeText(text);
  
  if (normalizedText.includes(normalizedTerm)) return true;
  
  if (normalizedTerm.length >= 6) {
    const distance = editDistance(normalizedTerm, normalizedText);
    return distance <= 2;
  }
  
  return false;
}

// Index aufbauen
export function buildIndex(programs: Program[]): SearchIndex {
  const titleIndex = new Map<string, string[]>();
  const contentIndex = new Map<string, { programId: string; field: string; weight: number }[]>();
  
  programs.forEach(program => {
    // Titel-Index
    const titleTokens = normalizeText(program.name).split(/\s+/);
    titleTokens.forEach(token => {
      if (!titleIndex.has(token)) titleIndex.set(token, []);
      titleIndex.get(token)!.push(program.id);
    });
    
    // Content-Index mit Gewichtung
    const addToIndex = (text: string, field: string, weight: number) => {
      const tokens = normalizeText(text).split(/\s+/);
      tokens.forEach(token => {
        if (token.length < 2) return;
        if (!contentIndex.has(token)) contentIndex.set(token, []);
        contentIndex.get(token)!.push({ programId: program.id, field, weight });
      });
    };
    
    // Gewichtete Felder
    addToIndex(program.name, 'title', 5);
    addToIndex(program.teaser, 'teaser', 2);
    program.zielgruppe.forEach(z => addToIndex(z, 'zielgruppe', 3));
    program.themen.forEach(t => addToIndex(t, 'themen', 3));
    program.foerderart.forEach(f => addToIndex(f, 'foerderart', 3));
    program.voraussetzungen.forEach(v => addToIndex(v, 'voraussetzungen', 1));
  });
  
  return { programs, titleIndex, contentIndex };
}

// Suche durchführen
export function search(query: string, index: SearchIndex): SearchResult[] {
  if (!query.trim()) return [];
  
  const tokens = query.toLowerCase().split(/[\s,]+/).filter(t => t.length >= 2);
  if (tokens.length === 0) return [];
  
  const scores = new Map<string, number>();
  const matchedTerms = new Map<string, Set<string>>();
  
  tokens.forEach(token => {
    const normalizedToken = normalizeText(token);
    
    // Exakte Treffer
    if (index.contentIndex.has(normalizedToken)) {
      index.contentIndex.get(normalizedToken)!.forEach(entry => {
        scores.set(entry.programId, (scores.get(entry.programId) || 0) + entry.weight);
        if (!matchedTerms.has(entry.programId)) matchedTerms.set(entry.programId, new Set());
        matchedTerms.get(entry.programId)!.add(token);
      });
    }
    
    // Fuzzy-Treffer
    index.contentIndex.forEach((entries, indexToken) => {
      if (isFuzzyMatch(token, indexToken)) {
        entries.forEach(entry => {
          const fuzzyWeight = Math.max(1, Math.floor(entry.weight * 0.6));
          scores.set(entry.programId, (scores.get(entry.programId) || 0) + fuzzyWeight);
          if (!matchedTerms.has(entry.programId)) matchedTerms.set(entry.programId, new Set());
          matchedTerms.get(entry.programId)!.add(token);
        });
      }
    });
  });
  
  // Status-Strafen
  index.programs.forEach(program => {
    if (scores.has(program.id)) {
      if (program.status === 'ausgesetzt') {
        scores.set(program.id, scores.get(program.id)! - 3);
      } else if (program.status === 'entfallen') {
        scores.set(program.id, scores.get(program.id)! - 99);
      }
    }
  });
  
  // Ergebnisse zusammenstellen
  const results: SearchResult[] = [];
  scores.forEach((score, programId) => {
    if (score > 0) {
      results.push({
        programId,
        score,
        matchedTerms: Array.from(matchedTerms.get(programId) || [])
      });
    }
  });
  
  // Sortierung: Score desc, dann Titel A→Z
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const programA = index.programs.find(p => p.id === a.programId);
    const programB = index.programs.find(p => p.id === b.programId);
    return (programA?.name || '').localeCompare(programB?.name || '');
  });
  
  return results;
}

// Vorschläge generieren
export function generateSuggestions(query: string, index: SearchIndex): SearchSuggestion[] {
  if (!query.trim() || query.length < 2) return [];
  
  const suggestions: SearchSuggestion[] = [];
  const normalizedQuery = normalizeText(query);
  
  // Programme
  index.programs.forEach(program => {
    if (normalizeText(program.name).includes(normalizedQuery)) {
      suggestions.push({
        type: 'program',
        text: program.name,
        programId: program.id
      });
    }
  });
  
  // Themen
  const themes = new Set<string>();
  index.programs.forEach(program => {
    program.themen.forEach(theme => {
      if (normalizeText(theme).includes(normalizedQuery)) {
        themes.add(theme);
      }
    });
  });
  
  Array.from(themes).slice(0, 3).forEach(theme => {
    suggestions.push({
      type: 'theme',
      text: theme,
      category: 'Themen'
    });
  });
  
  // Zielgruppen
  const targets = new Set<string>();
  index.programs.forEach(program => {
    program.zielgruppe.forEach(target => {
      if (normalizeText(target).includes(normalizedQuery)) {
        targets.add(target);
      }
    });
  });
  
  Array.from(targets).slice(0, 3).forEach(target => {
    suggestions.push({
      type: 'target',
      text: target,
      category: 'Zielgruppe'
    });
  });
  
  // Begriffe (aus Teaser)
  if (suggestions.length < 5) {
    suggestions.push({
      type: 'term',
      text: query,
      category: 'Begriffe'
    });
  }
  
  return suggestions.slice(0, 7);
}