// src/data/programs.fromRag.ts
import { Program, FoerderHoehe, Frist, Quelle } from '../types';
import { cleanText } from '../lib/text/normalizeProgram';

export type RagMeta = { 
  programId: string; 
  title: string; 
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
  const cleaned = cleanText(s);
  const tag = shortTag(cleaned);
  if (!tag || !rx.test(tag)) return;
  if (!arr.some(x => x.toLowerCase() === tag.toLowerCase())) arr.push(tag);
}

function splitToItems(segment: string): string[] {
  return segment
    .split(/\n|[•\u2022]|[\u2013-]|;/g)
    .map(s => cleanText(s))
    .map(s => shortTag(s))
    .filter(Boolean) as string[];
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
      name: m.title, 
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

function isLikelyProgram(cs: RagChunk[], name: string) {
  if (SKIP_TITLE.test(name)) return false;
  if (name.toLowerCase().includes('inhaltsverzeichnis')) return false;
  if (name.toLowerCase().includes('vorwort')) return false;
  if (name.toLowerCase().includes('kontakt')) return false;
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
  console.log('[buildProgramsFromRag] Input:', { meta: meta.length, chunks: chunks.length });
  
  const idx = buildPageIndex(meta);
  const byId = new Map<string, Program>();

  console.log('[buildProgramsFromRag] Page index built:', idx.arr.length, 'entries');

  for (const m of idx.arr) {
    const status = normalizeStatus(m.status);
    if (status === 'entfallen') continue;

    const cs = chunksForRange(chunks, m.start, m.end);
    console.log(`[buildProgramsFromRag] Program ${m.id}: ${cs.length} chunks in range ${m.start}-${m.end}`);
    
    if (!isLikelyProgram(cs, m.name)) continue; // Container/Adressen raus

    const full = cs.map(c => (c.text || '').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n');
    console.log(`[buildProgramsFromRag] Program ${m.id}: ${full.length} chars full text`);

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

    console.log(`[buildProgramsFromRag] Program ${m.id} extracted:`, {
      zielgruppe: zielgruppeItems.length,
      foerderart: foerderartItems.length,
      voraussetzungen: voraussetzungenItems.length
    });

    // Nur evidenzbasierte Felder setzen
    if (zielgruppeItems.length > 0) {
      p.zielgruppe = dedupe(zielgruppeItems).slice(0, 6);
    }
    if (voraussetzungenItems.length > 0) {
      p.voraussetzungen = dedupe(voraussetzungenItems).slice(0, 6);
    }
    
    // Förderart nur bei klarer Evidenz
    if (foerderartItems.length > 0) {
      p.foerderart = dedupe(foerderartItems).slice(0, 6).map(art => {
        if (art.toLowerCase().includes('kurs')) return 'kurskosten';
        if (art.toLowerCase().includes('personal')) return 'personalkosten';
        if (art.toLowerCase().includes('beihilfe')) return 'beihilfe';
        if (art.toLowerCase().includes('beratung')) return 'beratung';
        return undefined; // Kein Default mehr
      }).filter(Boolean) as any;
    }

    // Antragsweg normalisieren
    // Antragsweg aus Text ableiten (nur wenn vorhanden)
    const antragswegText = cs.map(c => c.text || '').join('\n').toLowerCase();
    if (/(e-?ams|eams)/i.test(antragswegText)) p.antragsweg = 'eams';
    else if (/(land\s*(oö|ooe)|amt\s*der\s*oö)/i.test(antragswegText)) p.antragsweg = 'land_ooe_portal';
    else if (/\bwko\b|\bwirtschaftskammer/i.test(antragswegText)) p.antragsweg = 'wko_verbund';
    else if (/(tr(ä|ae)ger|direkt\s+einreichen)/i.test(antragswegText)) p.antragsweg = 'traeger_direkt';

    // Förderhöhe nur bei Evidenz
    const fh = extractBlock(full, HEADS.foerderhoehe);
    if (fh.length) {
      p.foerderhoehe = dedupe(fh).slice(0, 6).map(hoehe => ({
        label: hoehe
      }));
    }

    // Frist nur bei klarer Evidenz
    const date = full.match(/\b(\d{1,2}\.\d{1,2}\.\d{2,4})\b/);
    if (/\blaufend(e)?\b/i.test(full)) p.frist = { typ: 'laufend' };
    else if (date) p.frist = { typ: 'stichtag', datum: date[1] };

    // Region nur kanonisiert
    const regionChunks = cs.filter(c => c.section === 'region');
    if (regionChunks.length > 0) {
      const regionText = regionChunks.map(c => c.text).join(' ');
      const canonical = canonicalRegion(regionText);
      if (canonical) {
        p.region = canonical;
      }
    }

    // Summary aus allgemein-Section
    const allgemeinChunks = cs.filter(c => c.section === 'allgemein');
    if (allgemeinChunks.length > 0) {
      const summaryText = allgemeinChunks[0].text;
      const cleaned = cleanText(summaryText);
      if (cleaned && !STOP_PHRASES.some(phrase => cleaned.toLowerCase().includes(phrase))) {
        p.teaser = clampWords(cleaned, 40);
      }
    }

    // Themen aus verschiedenen Sections ableiten
    const themenSet = new Set<string>();
    cs.forEach(c => {
      const text = c.text.toLowerCase();
      if (text.includes('digital')) themenSet.add('Digitalisierung');
      if (text.includes('sprach') || text.includes('deutsch')) themenSet.add('Sprachen');
      if (text.includes('nachhaltig')) themenSet.add('Nachhaltigkeit');
      if (text.includes('innovation')) themenSet.add('Innovation');
      if (text.includes('qualifizierung')) themenSet.add('Qualifizierung');
    });
    p.themen = Array.from(themenSet);

    // Legacy fields nur wenn Daten vorhanden
    p.targetGroup = p.zielgruppe ? [...p.zielgruppe] : [];
    p.requirements = p.voraussetzungen ? [...p.voraussetzungen] : [];
    p.tags = p.themen ? [...p.themen] : [];
    p.fundingType = '';
    if (Array.isArray(p.foerderart) && p.foerderart.length > 0) {
      p.fundingType = p.foerderart[0];
    } else if (typeof p.foerderart === 'string') {
      p.fundingType = p.foerderart;
    }
    p.budget = p.foerderhoehe && p.foerderhoehe.length > 0 ? p.foerderhoehe[0].label : '';
    p.themeField = p.themen && p.themen.length > 0 ? p.themen[0] : '';
    p.deadline = p.frist?.typ === 'laufend' ? 'laufend' : p.frist?.datum || '';
    p.description = p.teaser || '';

    console.log(`[buildProgramsFromRag] Program ${m.id} final:`, {
      name: p.name,
      zielgruppe: p.zielgruppe?.length || 0,
      foerderart: p.foerderart?.length || 0,
      voraussetzungen: p.voraussetzungen?.length || 0,
      teaser: p.teaser?.length || 0
    });

    byId.set(p.id, p);
  }

  console.info('[RAG] Programme gebaut:', byId.size, 'von', idx.arr.length);
  return [...byId.values()];
}