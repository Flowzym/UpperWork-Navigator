// src/data/programs.fromRag.ts
export type Program = {
  id: string;
  name: string;
  status?: string | null;
  frist?: string | null;
  region?: string[];
  foerderart?: string[];
  foerderhoehe?: string[];
  zielgruppe?: string[];
  voraussetzungen?: string[];
  antragsweg?: string[];
  quelle?: { seite?: number; stand?: string | null };
  pages?: { start: number; end: number };
  // optional für Karten-Teaser:
  summary?: string;
};

export type RagMeta = {
  programId: string;
  programName: string;
  pages: [number, number];
  stand?: string | null;
  status?: string | null;
};

export type RagChunk = {
  page: number;
  section: string;
  text: string;
  status?: string | null;
  stand?: string | null;
};

type ProgramStatus = 'aktiv' | 'ausgesetzt' | 'endet_am' | 'entfallen';

function normalizeStatus(raw?: string | null): ProgramStatus {
  const t = (raw ?? '').toLowerCase();
  if (!t) return 'aktiv';
  if (t.includes('endet')) return 'endet_am';
  if (t.includes('ausgesetzt') || t.includes('paus')) return 'ausgesetzt';
  if (t.includes('eingestellt') || t.includes('entfallen') || t.includes('beendet')) return 'entfallen';
  return (['aktiv','ausgesetzt','endet_am','entfallen'] as const).includes(t as any) ? (t as ProgramStatus) : 'aktiv';
}

// Heuristik-Regex
const RX = {
  frist: /\b(fr(i|í)st|einreichfrist|endet am\s+\d{1,2}\.\d{1,2}\.\d{2,4})\b/i,
  region: /\b(ober(ö|oe)sterreich|bezirk|region|landesweit)\b/i,
  foerderart: /\bf(ö|oe)rder(art|typ)|(zuschuss|bonus|darlehen|beihilfe|prämie)\b/i,
  betrag: /\b(€|\beur\w*|\bbetrag\b|%|max\.)/i,
  ziel: /\b(zielgruppe|unternehmen|lehrling|kmu|startup|betrieb|mitarbeiter)\b/i,
  vrs: /\bvoraussetzungen?\b/i,
  antrag: /\b(antragsweg|beantragung|online\-?formular|einreichung|antrag)\b/i,
};

// Programm-Evidenz + Teaser
const K_PROG = /(förder(ung|programm)|zuschuss|beihilfe|bonus|prämie|altersteilzeit|bildungsteilzeit|bildungskarenz|qualifizierungs|aq(u|ü)a|qbn|impuls|ibb|ibg)/i;
const K_SECT = /(zielgruppe|voraussetzungen|antragsweg|förderh(ö|oe)he|betrag|%|max\.)/i;
const K_NOISE = /(scanne den link|kontakt|adresse|telefon|e-?mail|www\.|europaplatz|straße\s+\d|str\.)/i;

function push(arr: string[], s: string, rx: RegExp, max = 4) {
  if (arr.length < max && rx.test(s)) arr.push(s.length > 180 ? s.slice(0, 180) + ' …' : s);
}

function buildPageIndex(meta: RagMeta[]) {
  const arr = meta
    .filter(m => Array.isArray(m.pages) && typeof m.pages[0] === 'number' && typeof m.pages[1] === 'number')
    .map(m => ({ start: m.pages[0], end: m.pages[1], id: m.programId, name: m.programName, stand: m.stand ?? null, status: m.status ?? null }))
    .sort((a, b) => a.start - b.start);

  function find(page: number) {
    let lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, it = arr[mid];
      if (page < it.start) hi = mid - 1;
      else if (page > it.end) lo = mid + 1;
      else return it;
    }
    return null;
  }
  return { arr, find };
}

function chunksForRange(chunks: RagChunk[], start: number, end: number) {
  return chunks.filter(c => c.page >= start && c.page <= end);
}

function isLikelyProgram(cs: RagChunk[]) {
  if (!cs.length) return false;
  const head = cs.slice(0, 8).map(c => c.text).join(' ');
  return K_PROG.test(head) && cs.some(c => K_SECT.test(c.text));
}

function deriveTeaser(cs: RagChunk[]) {
  for (const c of cs) {
    const t = (c.text || '').trim();
    if (!t) continue;
    if (K_NOISE.test(t)) continue;
    const s = t.replace(/\s+/g, ' ').trim();
    if (s.length <= 220) return s;
    const cut = s.slice(0, 220);
    return cut.slice(0, cut.lastIndexOf(' ')) + ' …';
  }
  return undefined;
}

// Hauptfunktion
export function buildProgramsFromRag(meta: RagMeta[], chunks: RagChunk[]): Program[] {
  const idx = buildPageIndex(meta);
  const byId = new Map<string, Program>();

  for (const m of idx.arr) {
    const status = normalizeStatus(m.status);
    if (status === 'entfallen') continue;

    const cs = chunksForRange(chunks, m.start, m.end);
    if (!isLikelyProgram(cs)) continue; // Container/Adressen raus

    const p: Program = {
      id: m.id,
      name: m.name,
      status,
      frist: null,
      region: [],
      foerderart: [],
      foerderhoehe: [],
      zielgruppe: [],
      voraussetzungen: [],
      antragsweg: [],
      quelle: { seite: m.start, stand: m.stand },
      pages: { start: m.start, end: m.end },
      summary: deriveTeaser(cs),
    };

    for (const c of cs) {
      const s = c.text || '';
      if (!p.frist && RX.frist.test(s)) p.frist = s.match(RX.frist)![0];
      switch (c.section) {
        case 'region':          push(p.region!, s, RX.region); break;
        case 'foerderart':      push(p.foerderart!, s, RX.foerderart); break;
        case 'foerderhoehe':    push(p.foerderhoehe!, s, RX.betrag); break;
        case 'zielgruppe':      push(p.zielgruppe!, s, RX.ziel); break;
        case 'voraussetzungen': push(p.voraussetzungen!, s, RX.vrs); break;
        case 'antragsweg':      push(p.antragsweg!, s, RX.antrag); break;
        default:
          push(p.foerderart!, s, RX.foerderart);
          push(p.foerderhoehe!, s, RX.betrag);
          push(p.zielgruppe!, s, RX.ziel);
          push(p.voraussetzungen!, s, RX.vrs);
          push(p.antragsweg!, s, RX.antrag);
          push(p.region!, s, RX.region);
      }
    }
    byId.set(p.id, p);
  }

  console.info('[RAG] Programme gebaut:', byId.size, 'von', idx.arr.length);
  return [...byId.values()];
}