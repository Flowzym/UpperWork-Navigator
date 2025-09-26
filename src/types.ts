export interface Program {
  id: string;
  name: string;
  status: 'aktiv' | 'endet_am' | 'ausgesetzt' | 'entfallen';
  teaser: string;
  zielgruppe: string[];
  foerderart: ('kurskosten' | 'personalkosten' | 'beihilfe' | 'beratung')[];
  foerderhoehe: FoerderHoehe[];
  voraussetzungen: string[];
  antragsweg: 'eams' | 'land_ooe_portal' | 'wko_verbund' | 'traeger_direkt';
  frist: Frist;
  region: string;
  themen: string[];
  passt_wenn: string[];
  passt_nicht_wenn: string[];
  quelle: Quelle;
  
  // Legacy compatibility
  tags: string[];
  portal: string;
  description: string;
  budget: string;
  targetGroup: string[];
  fundingType: string;
  requirements: string[];
  themeField: string;
  deadline: string;
}

export interface FoerderHoehe {
  label: string;
  quote?: number;
  min?: number;
  max?: number;
  deckel?: number;
  note?: string;
}

export interface Frist {
  typ: 'laufend' | 'stichtag' | 'entfallen';
  datum?: string;
}

export interface Quelle {
  seite: number;
  stand: string;
}

export type Provider = 'ChatGPT' | 'Mistral' | 'Claude' | 'Lokal' | 'Custom';
export type Mode = 'Fakten' | 'Vergleich' | 'Checkliste' | 'E-Mail' | 'Was-wäre-wenn';
export type ContextType = 'Aktuelle Karte' | 'Vergleichsauswahl' | 'Ergebnisliste' | 'Freie Frage';
export type NavigationTab = 'explorer' | 'wizard' | 'profil-matching' | 'help';
export type HelpTab = 'quickstart' | 'tips' | 'shortcuts' | 'changelog' | 'contact';
export type FacetGroup = 'status' | 'zielgruppe' | 'foerderart' | 'voraussetzungen' | 'themen' | 'frist' | 'region' | 'budget';

export interface FilterState {
  status: string[];
  zielgruppe: string[];
  foerderart: string[];
  voraussetzungen: string[];
  themen: string[];
  frist: string[];
  region: string[];
  budget?: string[];
}

export interface ProviderPreset {
  style: string;
  length: string;
  creativity: string;
}

export interface Answer {
  id: string;
  text: string;
  sources?: { seite: number; stand: string }[];
  warning?: string;
  meta: {
    provider: Provider;
    mode: Mode;
    context: ContextType;
    timestamp: string;
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  programId: string;
  programName: string;
  type: 'view' | 'checkliste' | 'vergleich' | 'chat' | 'onepager' | 'email' | 'search' | 'filter' | 'wizard';
}

export interface AppState {
  programs: Program[];
  filteredPrograms: Program[];
  selectedProgram: Program | null;
  comparedPrograms: string[];
  starredPrograms: string[];
  searchQuery: string;
  filters: FilterState;
  showWizard: boolean;
  showHelp: boolean;
  showSettings: boolean;
  showKI: boolean;
  showHistory: boolean;
  showMetrics: boolean;
  showAdmin: boolean;
  showCompare?: boolean;
  toasts: any[];
  history: HistoryEntry[];
  theme: 'light' | 'dark' | 'high-contrast';
  viewMode: 'comfort' | 'compact';
}