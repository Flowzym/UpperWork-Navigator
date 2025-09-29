// src/data/programs.fromRag.ts
import { Program, FoerderHoehe, Frist, Quelle } from '../types';
import { normalizeProgram } from '../lib/text/normalizeProgram';

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
  betrag: /\b((bis\s*)?(€|eur)\s?\d[\d.\s]*\s*(?:pro\s*(kurs|jahr|monat))?|\d{1,3}\s?%|max\.?\s*(€|eur)?\s?\d[\d.\s]*)\b/i,
  ziel: /\b(zielgruppe|unternehmen|betrieb(e)?|mitarbeiter(:innen)?|beschäftigte|arbeitssuchende|lehrling(e)?|kmu|frauen|wiedereinsteiger(:innen)?)\b/i,
  vrs: /\b(voraussetzungen?|bedingungen|erforderlich|nur wenn|mindestens|nachweis|mitgliedschaft|anwes(enheit|endheit)|anerk(annt|annte)r?\s+anbieter)\b/i,
  antrag: /\b(antragsweg|beantragung|wo\s*(beantragen|einreichen)|wie\s*(beantragen|einreichen)|portal|e-?ams|eams)\b/i,
};

const K_PROG = /(f(ö|oe)rder(ung|programm)|zuschuss|beihilfe|bonus|pr(ä|ae)mie|altersteilzeit|bildungsteilzeit|bildungskarenz|qualifizierungs|aq(u|ü)a|qbn|impuls|ibb|ibg)/i;
const K_SECT = /(zielgruppe|voraussetzungen|antragsweg|f(ö|oe)rderh(ö|oe)he|betrag|%|max\.)/i;
const K_NOISE = /(scanne den link|kontakt|adresse|telefon|e-?mail|www\.|europaplatz|straße\s+\d|str\.)/i;
const SKIP_TITLE = /^(vorw(ö|oe)rter|inhaltsverzeichnis|gesch(ä|ae)ftsabteilung|kontakt|impressum|service|notizen)$/i;

// Überschrifts-Synonyme für robuste Extraktion
const HEADS = {
  zielgruppe: /(zielgruppe|wer\s+wird\s+gef(ö|oe)rdert)/i,
  foerderart: /(f(ö|oe)rderart|was\s+wird\s+gef(ö|oe)rdert|wofür|wobei)/i,
  foerderhoehe: /(f(ö|oe)rderh(ö|oe)he|wie\s+(hoch|viel)|betrag|umfang)/i,
  voraussetzungen: /(voraussetzungen?|bedingungen|erforderlich|wer\s+darf)/i,
  antragsweg: /(antragsweg|beantragung|wo\s+(beantragen|einreichen)|wie\s+(beantragen|einreichen)|portal|e-?ams|eams)/i,
  frist: /(frist|einreichfrist|endet am|laufend|bis\s+\d{1,2}\.\d{1,2}\.\d{2,4})/i,
  region: /(region|ober(ö|oe)sterreich|ooe|bezirk|landesweit)/i,
};

const ANY_HEAD = new RegExp(Object.values(HEADS).map(r => r.source).join('|'), 'i');

function dedupe(a: string[]) {
  const seen = new Set<string>(); 
  const out: string[] = [];
  for (const s of a.map(x => x.replace(/\s+/g,' ').trim()).filter(Boolean)) {
    const k = s.toLowerCase();
    if (!seen.has(k)) { 
      seen.add(k); 
      out.push(s); 
    }
  }
  return out;
}

function push(arr: string[], s: string, rx: RegExp, max = 6) {
  if (arr.length >= max) return;
  if (!rx.test(s)) return;
  const t = s.replace(/\s+/g,' ').trim();
  if (!t) return;
  const v = t.length > 180 ? t.slice(0,180)+' …' : t;
  if (!arr.some(x => x.toLowerCase() === v.toLowerCase())) arr.push(v);
}

function splitToItems(segment: string): string[] {
  return segment
    .split(/\n|[•\u2022]|[\u2013-]/g)
    .map(s => s.replace(/\s+/g,' ').trim())
    .filter(s => s.length >= 6);
}

function extractBlock(text: string, head: RegExp): string[] {
  const m = head.exec(text); 
  if (!m) return [];
  const start = m.index + m[0].length;
  const rest = text.slice(start);
  const stop = ANY_HEAD.exec(rest);
  const seg = stop ? rest.slice(0, stop.index) : rest;
  return splitToItems(seg);
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

function deriveSummary(r: any): string | undefined {
  const pick = [r.beschreibung, r.foerderhoehe, r.allgemein].find(x => typeof x === 'string' && x.trim());
  if (!pick) return undefined;
  return pick.trim().slice(0, 240);
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

    const full = cs.map(c => (c.text || '').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n');

    const p: Program = {
      id: m.id,
      name: m.name,
      status,
      teaser: deriveTeaser(cs) || '',
      zielgruppe: [],
      foerderart: [],
      foerderhoehe: [],
      voraussetzungen: [],
      antragsweg: undefined,
      frist: undefined,
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

    // 1) Abschnittsweise extrahieren
    const zielgruppeItems = extractBlock(full, HEADS.zielgruppe);
    const foerderartItems = extractBlock(full, HEADS.foerderart);
    const voraussetzungenItems = extractBlock(full, HEADS.voraussetzungen);
    const antragswegItems = extractBlock(full, HEADS.antragsweg);

    p.zielgruppe = dedupe(zielgruppeItems).slice(0, 6);
    p.foerderart = dedupe(foerderartItems).slice(0, 6).map(art => {
      if (art.toLowerCase().includes('kurs')) return 'kurskosten';
      if (art.toLowerCase().includes('personal')) return 'personalkosten';
      if (art.toLowerCase().includes('beihilfe')) return 'beihilfe';
      if (art.toLowerCase().includes('beratung')) return 'beratung';
      return 'kurskosten'; // default
    }) as any;
    p.voraussetzungen = dedupe(voraussetzungenItems).slice(0, 6);

    // Antragsweg normalisieren
    // Antragsweg aus Text ableiten (nur wenn vorhanden)
    const antragswegText = cs.map(c => c.text || '').join('\n').toLowerCase();
    if (/(e-?ams|eams)/i.test(antragswegText)) p.antragsweg = 'eams';
    else if (/(land\s*(oö|ooe)|amt\s*der\s*oö)/i.test(antragswegText)) p.antragsweg = 'land_ooe_portal';
    else if (/\bwko\b|\bwirtschaftskammer/i.test(antragswegText)) p.antragsweg = 'wko_verbund';
    else if (/(tr(ä|ae)ger|direkt\s+einreichen)/i.test(antragswegText)) p.antragsweg = 'traeger_direkt';

    // 2) Förderhöhe: zuerst Abschnitt, sonst Beträge/Prozente im gesamten Text
    const fh = extractBlock(full, HEADS.foerderhoehe);
    if (fh.length) {
      p.foerderhoehe = dedupe(fh).slice(0, 6).map(hoehe => ({
        label: hoehe
      }));
    } else {
      const amounts = full.match(new RegExp(RX.betrag.source, 'gi')) || [];
      p.foerderhoehe = dedupe(amounts.map(s => s.replace(/\s+/g,' ').trim())).slice(0, 4).map(hoehe => ({
        label: hoehe
      }));
    }

    // Frist direkt als kurze Info
    const date = full.match(/\b(\d{1,2}\.\d{1,2}\.\d{2,4})\b/);
    if (/\blaufend(e)?\b/i.test(full)) p.frist = { typ: 'laufend' };
    else if (date) p.frist = { typ: 'stichtag', datum: date[1] };

    // 3) Falls in den Chunks etwas markiert war, ergänzend aufnehmen
    const tempZielgruppe: string[] = [...p.zielgruppe];
    const tempFoerderart: string[] = [];
    const tempFoerderhoehe: string[] = [];
    const tempVoraussetzungen: string[] = [...p.voraussetzungen];
    const tempAntragsweg: string[] = [];
    const tempRegion: string[] = [];
    const tempThemen: string[] = [];

    for (const c of cs) {
      const s = c.text || '';
      
      switch ((c.section || '').toLowerCase()) {
        case 'region':          push(tempRegion, s, RX.region); break;
        case 'foerderart':      push(tempFoerderart, s, RX.foerderart); break;
        case 'foerderhoehe':    push(tempFoerderhoehe, s, RX.betrag); break;
        case 'zielgruppe':      push(tempZielgruppe, s, RX.ziel); break;
        case 'voraussetzungen': push(tempVoraussetzungen, s, RX.vrs); break;
        case 'antragsweg':      push(tempAntragsweg, s, RX.antrag); break;
        default:
          // opportunistisch
          push(tempFoerderhoehe, s, RX.betrag);
          push(tempFoerderart, s, RX.foerderart);
          push(tempZielgruppe, s, RX.ziel);
          push(tempVoraussetzungen, s, RX.vrs);
          push(tempAntragsweg, s, RX.antrag);
          push(tempRegion, s, RX.region);
          push(tempThemen, s, /\b(bildung|qualifizierung|innovation|digitalisierung|nachhaltigkeit)\b/i, 6);
      }
    }

    // 4) Finales Dedupe/Trim und Ergänzung
    p.zielgruppe = dedupe([...p.zielgruppe, ...tempZielgruppe]);
    
    // Ergänze Förderart falls noch leer
    if (p.foerderart.length === 0) {
      p.foerderart = dedupe(tempFoerderart).map(art => {
        if (art.toLowerCase().includes('kurs')) return 'kurskosten';
        if (art.toLowerCase().includes('personal')) return 'personalkosten';
        if (art.toLowerCase().includes('beihilfe')) return 'beihilfe';
        if (art.toLowerCase().includes('beratung')) return 'beratung';
        return undefined; // kein Default mehr
      }).filter(Boolean) as any;
    }
    
    // Ergänze Förderhöhe falls noch leer
    if (p.foerderhoehe.length === 0) {
      p.foerderhoehe = dedupe(tempFoerderhoehe).map(hoehe => ({
        label: hoehe
      }));
    }
    
    p.voraussetzungen = dedupe([...p.voraussetzungen, ...tempVoraussetzungen]);
    p.themen = dedupe(tempThemen);
    
    // Region normalisieren
    if (tempRegion.length > 0) {
      p.region = tempRegion[0];
    }

    // Legacy fields befüllen - nur wenn Daten vorhanden
    p.targetGroup = [...p.zielgruppe];
    p.requirements = [...p.voraussetzungen];
    p.tags = [...p.themen];
    p.fundingType = p.foerderart.length > 0 ? p.foerderart[0] : '';
    p.budget = p.foerderhoehe.length > 0 ? p.foerderhoehe[0].label : '';
    p.themeField = p.themen.length > 0 ? p.themen[0] : '';
    p.deadline = p.frist?.typ === 'laufend' ? 'laufend' : p.frist?.datum || '';

    byId.set(p.id, normalizeProgram(p));
  }

  console.info('[RAG] Programme gebaut:', byId.size, 'von', idx.arr.length);
  return [...byId.values()];
}