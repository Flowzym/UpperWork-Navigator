export type Foerderart = 'kurskosten' | 'lohnkostenzuschuss' | 'betrieb' | 'beratung' | string;

export interface Program {
  id: string;
  title: string;
  provider?: string;
  region?: string;
  frist?: string;
  antragsweg?: string;
  foerderart?: Foerderart;
  zielgruppe?: string[];
  voraussetzungen?: string[];
  summary?: string;
}