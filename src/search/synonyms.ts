// Programm-Aliase
export const programAliases: Record<string, string[]> = {
  "bildungskonto_ooe": ["bildungskonto", "land oö bildungskonto", "bildungskonto oberösterreich"],
  "qbn": ["qbn", "qualifizierungsförderung für beschäftigte", "qualifizierungsförderung beschäftigte"],
  "innovative_skills": ["innovative skills", "innovative skills land oö", "zukunftskompetenzen"],
  "qualifizierungsverbund": ["qualifizierungsverbund", "verbund digital", "digitale kompetenz nachhaltigkeit"],
  "aqua": ["aqua", "arbeitsplatznahe qualifizierung", "arbeitsplatz qualifizierung"],
  "fit": ["fit", "frauen in handwerk und technik", "frauen technik", "frauen handwerk"]
};

// Facetten-Synonyme
export const facetSynonyms = {
  zielgruppe: {
    "beschäftigte": ["beschäftigte", "arbeitnehmer", "angestellte", "mitarbeiter"],
    "arbeitsuchende": ["arbeitsuchende", "arbeitslose", "jobsuchende"],
    "kmu": ["kmu", "kleine und mittlere unternehmen", "kleinbetriebe", "mittelstand"],
    "unternehmen": ["unternehmen", "betriebe", "firmen", "arbeitgeber"],
    "frauen": ["frauen", "weiblich"],
    "einzelpersonen": ["einzelpersonen", "privatpersonen", "individuen"]
  },
  
  themen: {
    "digitalisierung": ["digitalisierung", "digital", "it", "computer", "online"],
    "sprache_deutsch": ["deutsch", "deutsch b1", "deutsch b2", "deutschkurs", "sprachkurs"],
    "weiterbildung": ["weiterbildung", "fortbildung", "qualifizierung", "schulung"],
    "berufliche_weiterbildung": ["berufliche weiterbildung", "beruflich", "karriere"],
    "nachhaltigkeit": ["nachhaltigkeit", "nachhaltig", "umwelt", "green"],
    "innovation": ["innovation", "innovativ", "zukunft", "modern"],
    "handwerk": ["handwerk", "handwerklich", "technisch", "technik"],
    "qualifikation": ["qualifikation", "qualifizierung", "kompetenz", "fähigkeiten"]
  },
  
  foerderart: {
    "kurskosten": ["kurskosten", "kurs", "schulungskosten", "bildungskosten"],
    "personalkosten": ["personalkosten", "lohnkosten", "gehalt", "personal"],
    "beihilfe": ["beihilfe", "unterstützung", "lebensunterhalt", "zuschuss"],
    "beratung": ["beratung", "coaching", "begleitung", "unterstützung"]
  }
};

// Erweitere Query-Tokens um Synonyme
export function expandQueryTokens(tokens: string[]): {
  programHints: string[];
  facetHints: { [key: string]: string[] };
} {
  const programHints: string[] = [];
  const facetHints: { [key: string]: string[] } = {};
  
  tokens.forEach(token => {
    const normalizedToken = token.toLowerCase().trim();
    
    // Programm-Aliase prüfen
    Object.entries(programAliases).forEach(([programKey, aliases]) => {
      if (aliases.some(alias => alias.includes(normalizedToken) || normalizedToken.includes(alias))) {
        programHints.push(programKey);
      }
    });
    
    // Facetten-Synonyme prüfen
    Object.entries(facetSynonyms).forEach(([facetType, synonymMap]) => {
      Object.entries(synonymMap).forEach(([facetValue, synonyms]) => {
        if (synonyms.some(synonym => synonym.includes(normalizedToken) || normalizedToken.includes(synonym))) {
          if (!facetHints[facetType]) facetHints[facetType] = [];
          if (!facetHints[facetType].includes(facetValue)) {
            facetHints[facetType].push(facetValue);
          }
        }
      });
    });
  });
  
  return { programHints, facetHints };
}

// Prüfe ob Query einem entfallenen Programm entspricht
export function checkForEntfallenProgram(query: string): string | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  const entfallenePrograms = [
    "weiterbildungsgeld",
    "bildungskarenz plus"
  ];
  
  for (const program of entfallenePrograms) {
    if (normalizedQuery.includes(program) || program.includes(normalizedQuery)) {
      return program;
    }
  }
  
  return null;
}