import type { Program } from '@/types/program';

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
  const seen = new Set<string>(), out: T[] = [];
  for (const x of arr) {
    const k = String(x).trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k); out.push(x);
  }
  return out.length ? out : undefined;
}

export function prettyFoerderart(v?: string | string[]) {
  const arr = Array.isArray(v) ? v : (v ? [v] : []);
  const mapped = arr.map(s => {
    const k = s.toLowerCase();
    const hit = Object.keys(FOERDERART_MAP).find(p => k.includes(p));
    return hit ? FOERDERART_MAP[hit] : s.trim();
  });
  return dedup(mapped);
}

export function prettyAntragsweg(v?: string | string[]) {
  const arr = Array.isArray(v) ? v : (v ? [v] : []);
  const mapped = arr.map(s => {
    const k = s.toLowerCase().replace(/\s+/g,' ').trim();
    const hit = Object.keys(ANTRAG_MAP).find(p => k.includes(p));
    return hit ? ANTRAG_MAP[hit] : s.trim();
  });
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
    region: canonicalRegion(p.region) ?? p.region,
    zielgruppe: dedup((p.zielgruppe || []).map(cleanText).filter(Boolean) as string[]),
    voraussetzungen: dedup((p.voraussetzungen || []).map(cleanText).filter(Boolean) as string[]),
    summary: clampWords(cleanText(p.summary), 55)
  };
}
