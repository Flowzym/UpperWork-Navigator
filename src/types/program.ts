export type Foerderart = 'kurskosten' | 'lohnkostenzuschuss' | 'betrieb' | 'beratung' | string;

export interface Program {
  id: string;
  title: string;
  provider?: string;
  region?: string | any;
  frist?: string | any;
  antragsweg?: string;
  foerderart?: Foerderart | any;
  zielgruppe?: string[];
  voraussetzungen?: string[];
  summary?: string;
}