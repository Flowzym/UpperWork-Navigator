export type Status = 'aktiv' | 'ausgesetzt' | 'endet_am' | 'entfallen';

export interface Frist {
  typ: 'laufend' | 'stichtag' | 'entfallen';
  datum?: string;
}

export interface FoerderHoehe {
  label: string;
  quote?: number;
  min?: number;
  max?: number;
  deckel?: number;
  note?: string;
}

export interface Program {
  id: string;
  name: string;
  status: Status;
  teaser: string;
  zielgruppe: string[];
  foerderart: ('kurskosten'|'personalkosten'|'beihilfe'|'beratung')[];
  foerderhoehe: FoerderHoehe[];
  voraussetzungen: string[];
  antragsweg: 'eams'|'land_ooe_portal'|'wko_verbund'|'traeger_direkt';
  frist: Frist;
  region: string;
  themen: string[];
  passt_wenn: string[];
  passt_nicht_wenn: string[];
  quelle: { seite: number; stand: string };
  // Legacy fields for compatibility
  tags: string[];
  portal: string;
  description: string;
  budget?: string;
  targetGroup: string[];
  fundingType: string;
  requirements: string[];
  themeField: string;
  deadline?: string;
}

export interface FilterState {
  status: string[];
  targetGroup: string[];
  fundingType: string[];
  requirements: string[];
  themeField: string[];
  deadline: string[];
  region: string[];
  budget: string[];
}

export type Provider = 'ChatGPT' | 'Mistral' | 'Claude' | 'Lokal' | 'Custom';
export type Mode = 'Fakten' | 'Vergleich' | 'Checkliste' | 'E-Mail' | 'Was-wäre-wenn';
export type ContextType = 'Aktuelle Karte' | 'Vergleichsauswahl' | 'Ergebnisliste' | 'Freie Frage';

export type NavigationTab = 'explorer' | 'wizard' | 'profil-matching' | 'help';
export type CardDensity = 'comfort' | 'compact';
export type ContrastMode = 'standard' | 'high';
export type HelpTab = 'quickstart' | 'tips' | 'shortcuts' | 'changelog' | 'contact';

export interface EndpointConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  error?: string;
  lastChecked?: string;
}

export interface ProviderPreset {
  style: string;
  length: string;
  creativity: string;
}

export interface Answer {
  id: string;
  text: string;
  meta: {
    provider: Provider;
    mode: Mode;
    context: ContextType;
    timestamp: string;
  };
  sources?: { seite: number; stand: string }[];
  warning?: string;
}

export interface NavigationState {
  activeTab: NavigationTab;
  showSettingsDrawer: boolean;
  showHelpModal: boolean;
  activeHelpTab: HelpTab;
  showHelpOnStart: boolean;
}

export interface SettingsState {
  provider: Provider;
  onlyBrochure: boolean;
  attachSources: boolean;
  noExternalProviders: boolean;
  adminMode: boolean;
  cardDensity: CardDensity;
  contrastMode: ContrastMode;
  localEndpoint: EndpointConfig;
  customEndpoint: EndpointConfig;
  localConnection: ConnectionStatus;
  customConnection: ConnectionStatus;
}

export type FacetGroup =
  | 'status' | 'zielgruppe' | 'foerderart' | 'voraussetzungen'
  | 'themen' | 'frist' | 'region' | 'budget';

export type FilterState = {
  status: Array<'aktiv'|'ausgesetzt'|'endet_am'>;
  zielgruppe: string[];
  foerderart: Array<'kurskosten'|'personalkosten'|'beihilfe'|'beratung'>;
  voraussetzungen: Array<'eams'|'min75'|'anbieter'|'vorlauf7'>;
  themen: string[];
  frist: Array<'laufend'|'stichtag'>;
  region: string[];
  budget: Array<'≤1k'|'1–5k'|'>5k'>;
};

export interface AppState {
  selectedProvider: Provider;
  selectedMode: Mode;
  onlyBrochure: boolean;
  attachSources: boolean;
  leftSidebarOpen: boolean;
  rightPanelOpen: boolean;
  selectedPrograms: string[];
  currentContext: ContextType;
  showDetailPlaceholder: boolean;
  detailProgramId?: string;
}
export interface HistoryEntry {
  id: string;
  type: 'view' | 'checkliste' | 'vergleich' | 'chat' | 'onepager' | 'email';
  programId: string;
  programName: string;
  timestamp: number;
}