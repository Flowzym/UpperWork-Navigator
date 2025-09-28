// src/data/programs.fromRag.ts
import { Program, FoerderHoehe, Frist, Quelle } from '../types';

export type RagMeta = { 
  programId: string; 
  programName: string; 
  pages: [number, number]; 
  stand?: string | null; 
  status?: string | null 
};

export type RagChunk = { 
  page: number; 
  section: string; 
  text: string; 
  status?: string | null; 
  stand?: string | null 
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
  frist: /\b(fr(i|í)st|einreichfrist|endet am\s+\d{1,2}\.\d{1,2}\.\d{2,4}|laufend)\b/i,
  region: /\b(ober(ö|oe)sterreich|bezirk|region|landesweit|ooe|land o(ö|oe))\b/i,
  foerderart: /\b(f(ö|oe)rder(art|typ)|zuschuss|beihilfe|bonus|pr(ä|ae)mie|darlehen|stipendium|gutschein|beratung)\b/i,
  betrag: /\b((bis\s*)?(€|eur)\s?\d[\d.\s]*|\d{1,3}\s?%|max\.?\s*(€|eur)?\s?\d[\d.\s]*)\b/i,
  ziel: /\b(zielgruppe|unternehmen|betrieb(e)?|mitarbeiter(:innen)?|beschäftigte|arbeitssuchende|lehrling(e)?|kmu|frauen|wiedereinsteiger(:innen)?)\b/i,
  vrs: /\b(voraussetzungen?|erforderlich|nur wenn|mindestens|nachweis|mitgliedschaft|anwes(enheit|endheit)|anerk(annt|annte)r?\s+anbieter)\b/i,
  antrag: /\b(antragsweg|beantragung|online\-?formular|einreichung|antrag|portal|eams|e-?ams)\b/i,
};

const K_PROG = /(f(ö|oe)rder(ung|programm)|zuschuss|beihilfe|bonus|pr(ä|ae)mie|altersteilzeit|bildungsteilzeit|bildungskarenz|qualifizierungs|aq(u|ü)a|qbn|impuls|ibb|ibg)/i;
const K_SECT = /(zielgruppe|voraussetzungen|antragsweg|f(ö|oe)rderh(ö|oe)he|betrag|%|max\.)/i;
const K_NOISE = /(scanne den link|kontakt|adresse|telefon|e-?mail|www\.|europaplatz|straße\s+\d|str\.)/i;
const SKIP_TITLE = /^(vorw(ö|oe)rter|inhaltsverzeichnis|gesch(ä|ae)ftsabteilung|kontakt|impressum|service|notizen)$/i;

function dedupe(a: string[]) {
  const seen = new Set<string>(); 
  const out: string[] = [];
  for (const s of a.map(x => x.trim()).filter(Boolean)) {
    const k = s.toLowerCase();
    if (!seen.has(k)) { 
      seen.add(k); 
      out.push(s); 
    }
  }
  return out;
}

function push(arr: string[], s: string, rx: RegExp, max = 4) {
  if (arr.length >= max) return;
  if (!rx.test(s)) return;
  const t = s.replace(/\s+/g,' ').trim();
  if (!t) return;
  const v = t.length > 180 ? t.slice(0,180)+' …' : t;
  if (!arr.some(x => x.toLowerCase() === v.toLowerCase())) arr.push(v);
}

function buildPageIndex(meta: RagMeta[]) {
  const arr = meta
    .filter(m => Array.isArray(m.pages))
    .map(m => ({ 
      start: m.pages[0], 
      end: m.pages[1], 
      id: m.programId, 
      name: m.programName, 
      stand: m.stand ?? null, 
      status: m.status ?? null 
    }))
    .sort((a,b) => a.start - b.start);

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

function isLikelyProgram(cs: RagChunk[], title: string) {
  if (SKIP_TITLE.test(title)) return false;
  if (!cs.length) return false;
  const head = cs.slice(0, 8).map(c => c.text).join(' ');
  return K_PROG.test(head) && cs.some(c => K_SECT.test(c.text));
}

function deriveTeaser(cs: RagChunk[]) {
  for (const c of cs) {
    const raw = (c.text || '').trim(); 
    if (!raw) continue;
    if (K_NOISE.test(raw)) continue;
    const s = raw.replace(/\s+/g,' ').trim();
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
    if (!isLikelyProgram(cs, m.name)) continue; // Container/Adressen raus

    const p: Program = {
      id: m.id,
      name: m.name,
      status,
      teaser: deriveTeaser(cs) || '',
      zielgruppe: [],
      foerderart: [],
      foerderhoehe: [],
      voraussetzungen: [],
      antragsweg: 'eams',
      frist: { typ: 'laufend' },
      region: 'Oberösterreich',
      themen: [],
      passt_wenn: [],
      passt_nicht_wenn: [],
      quelle: { seite: m.start, stand: m.stand || '09/2025' },
      
      // Legacy compatibility
      tags: [],
      portal: 'Land OÖ',
      description: deriveTeaser(cs) || '',
      budget: '',
      targetGroup: [],
      fundingType: '',
      requirements: [],
      themeField: '',
      deadline: '',
    };

    // Temporäre Arrays für Heuristik
    const tempZielgruppe: string[] = [];
    const tempFoerderart: string[] = [];
    const tempFoerderhoehe: string[] = [];
    const tempVoraussetzungen: string[] = [];
    const tempAntragsweg: string[] = [];
    const tempRegion: string[] = [];
    const tempThemen: string[] = [];

    for (const c of cs) {
      const s = c.text || '';
      if (p.frist.typ === 'laufend' && RX.frist.test(s)) {
        const match = s.match(RX.frist)![0];
        p.frist = { typ: 'stichtag', datum: match };
        p.deadline = match;
      }

      // Section-gesteuert + Fallback
      const sec = (c.section || '').toLowerCase();
      if (sec === 'zielgruppe')         push(tempZielgruppe, s, RX.ziel, 6);
      else if (sec === 'foerderart')    push(tempFoerderart, s, RX.foerderart, 6);
      else if (sec === 'foerderhoehe')  push(tempFoerderhoehe, s, RX.betrag, 6);
      else if (sec === 'voraussetzungen') push(tempVoraussetzungen, s, RX.vrs, 6);
      else if (sec === 'antragsweg')    push(tempAntragsweg, s, RX.antrag, 4);
      else if (sec === 'region')        push(tempRegion, s, RX.region, 4);
      else {
        // Fallback: alle Patterns testen
        push(tempFoerderhoehe, s, RX.betrag, 6);
        push(tempFoerderart, s, RX.foerderart, 6);
        push(tempZielgruppe, s, RX.ziel, 6);
        push(tempVoraussetzungen, s, RX.vrs, 6);
        push(tempAntragsweg, s, RX.antrag, 4);
        push(tempRegion, s, RX.region, 4);
        push(tempThemen, s, /\b(bildung|qualifizierung|innovation|digitalisierung|nachhaltigkeit)\b/i, 6);
      }
    }

    // Konvertiere zu finalen Strukturen
    p.zielgruppe = dedupe(tempZielgruppe);
    p.foerderart = dedupe(tempFoerderart).map(art => {
      if (art.toLowerCase().includes('kurs')) return 'kurskosten';
      if (art.toLowerCase().includes('personal')) return 'personalkosten';
      if (art.toLowerCase().includes('beihilfe')) return 'beihilfe';
      if (art.toLowerCase().includes('beratung')) return 'beratung';
      return 'kurskosten'; // default
    }) as any;
    
    p.foerderhoehe = dedupe(tempFoerderhoehe).map(hoehe => ({
      label: hoehe
    }));
    
    p.voraussetzungen = dedupe(tempVoraussetzungen);
    p.themen = dedupe(tempThemen);
    
    // Antragsweg normalisieren
    if (tempAntragsweg.length > 0) {
      const antrag = tempAntragsweg[0].toLowerCase();
      if (antrag.includes('eams')) p.antragsweg = 'eams';
      else if (antrag.includes('land') || antrag.includes('oö')) p.antragsweg = 'land_ooe_portal';
      else if (antrag.includes('wko')) p.antragsweg = 'wko_verbund';
      else if (antrag.includes('träger')) p.antragsweg = 'traeger_direkt';
    }
    
    // Region normalisieren
    if (tempRegion.length > 0) {
      p.region = tempRegion[0];
    }

    // Legacy fields befüllen
    p.targetGroup = [...p.zielgruppe];
    p.requirements = [...p.voraussetzungen];
    p.tags = [...p.themen];
    p.fundingType = p.foerderart.length > 0 ? p.foerderart[0] : '';
    p.budget = p.foerderhoehe.length > 0 ? p.foerderhoehe[0].label : '';
    p.themeField = p.themen.length > 0 ? p.themen[0] : '';

    byId.set(p.id, p);
  }

  console.info('[RAG] Programme gebaut:', byId.size, 'von', idx.arr.length);
  return [...byId.values()];
}