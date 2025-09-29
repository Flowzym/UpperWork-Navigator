import type { Program } from '../../types/program';

// --- Mappings ---
const FOERDERART_MAP: Record<string,string> = {
  'kurs':'kurskosten','kurskosten':'kurskosten','kurskostenförderung':'kurskosten',
  'beratung':'beratung','coaching':'beratung',
  'lohn':'lohnkostenzuschuss','gehalt':'lohnkostenzuschuss','lohnkostenzuschuss':'lohnkostenzuschuss',
  'betrieb':'betrieb','invest':'betrieb','anschaffung':'betrieb'
};

const ANTRAG_MAP: Record<string,string> = {
  'eams':'eAMS','e-ams':'eAMS','ams':'eAMS',
  'traeger_direkt':'Träger direkt','träger direkt':'Träger direkt','traeger direkt':'Träger direkt',
  'land_ooe':'Land OÖ','wko':'WKO OÖ','wk oö':'WKO OÖ','online':'Online-Formular','email':'E-Mail','persoenlich':'Persönlich'
};

export function dedup<T>(arr?: T[] | null): T[] | undefined {
  if (!Array.isArray(arr)) return undefined;
  const seen = new Set<string>(); 
  const out: T[] = [];
  for (const x of arr) {
    const k = String(x).trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k); 
    out.push(x);
  }
  return out.length ? out : undefined;
}

// Neu (export): beliebige Eingaben → String extrahieren
export function asText(v: any): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return v.trim() || undefined;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    const first = v.find(x => asText(x));
    return asText(first);
  }
  if (typeof v === 'object') {
    // häufige Felder: typ/type/value/label/name
    const cand = v.typ ?? v.type ?? v.value ?? v.label ?? v.name ?? v.text ?? v.title;
    if (cand) return asText(cand);
  }
  try { return JSON.stringify(v); } catch { return undefined; }
}

export function prettyFoerderart(v?: any) {
  const arr = Array.isArray(v) ? v : (v ? [v] : []);
  const mapped = arr.map((s: any) => {
    const text = asText(s);
    if (!text) return null;
    const k = text.toLowerCase();
    const hit = Object.keys(FOERDERART_MAP).find(p => k.includes(p));
    return hit ? FOERDERART_MAP[hit] : text.trim();
  }).filter(Boolean) as string[];
  return dedup(mapped);
}

export function prettyAntragsweg(v?: any) {
  const arr = Array.isArray(v) ? v : (v ? [v] : []);
  const mapped = arr.map((s: any) => {
    const text = asText(s);
    if (!text) return null;
    const k = text.toLowerCase().replace(/\s+/g,' ').trim();
    const hit = Object.keys(ANTRAG_MAP).find(p => k.includes(p));
    return hit ? ANTRAG_MAP[hit] : text.trim();
  }).filter(Boolean) as string[];
  return dedup(mapped);
}

export function canonicalRegion(t?: string) {
  if (!t) return undefined;
  const normalized = t.toLowerCase();
  const translit = normalized
    .replace(/ö/g, 'oe')
    .replace(/ä/g, 'ae')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
  if (normalized.includes('österreichweit') || translit.includes('osterreichweit') || normalized.includes('bundesweit')) {
    return 'Österreichweit';
  }
  if (
    normalized.includes('oberösterreich') ||
    translit.includes('oberoesterreich') ||
    /\boo(e)?\b/.test(translit)
  ) {
    return 'Oberösterreich';
  }
  return undefined;
}

const OCR_NOISE = [
  /scanne\s+den\s+link\d+/i,
  /kontakt\s+.*?straße.*?\d+/i
];

export function cleanText(s?: string) {
  if (!s) return s;
  let t = s.replace(/\s+/g,' ').replace(/\s+,/g,',').trim();
  for (const rx of OCR_NOISE) t = t.replace(rx,'');
  t = t.replace(/^(\?|·|•|-)\s*/,'').trim();
  return t || undefined;
}

export function clampWords(s?: string, max=55) {
  if (!s) return s;
  const parts = s.split(/\s+/);
  if (parts.length <= max) return s;
  return parts.slice(0,max).join(' ') + ' …';
}

export function normalizeProgram(p: Program): Program {
  return {
    ...p,
    foerderart: prettyFoerderart(p.foerderart)?.[0],
    antragsweg: prettyAntragsweg(p.antragsweg)?.[0],
    region: canonicalRegion(asText(p.region)) ?? asText(p.region),
    zielgruppe: dedup((Array.isArray(p.zielgruppe)?p.zielgruppe:[])
      .map(asText).filter(Boolean).map(cleanText) as string[]),
    voraussetzungen: dedup((Array.isArray(p.voraussetzungen)?p.voraussetzungen:[])
      .map(asText).filter(Boolean).map(cleanText) as string[]),
    summary: clampWords(cleanText(asText(p.summary)), 55)
  };
}