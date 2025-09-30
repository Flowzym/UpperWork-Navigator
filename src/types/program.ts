export type Foerderart = 'kurskosten' | 'lohnkostenzuschuss' | 'betrieb' | 'beratung' | string;

export interface Program {
  id: string;
  title: string;
  name?: string;
  provider?: string;
  region?: string | any;
  frist?: string | any;
  antragsweg?: string;
  foerderart?: Foerderart | any;
  zielgruppe?: string[];
  voraussetzungen?: string[];
  summary?: string;
  teaser?: string;
  themen?: string[];
  status?: string;
  foerderhoehe?: any[];
  passt_wenn?: string[];
  passt_nicht_wenn?: string[];
  quelle?: any;
  tags?: string[];
  portal?: string;
  description?: string;
  budget?: string;
  targetGroup?: string[];
  fundingType?: string;
  requirements?: string[];
  themeField?: string;
  deadline?: string;
}