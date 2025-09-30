import type { Program } from '@/types/program';

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

const TITLE_CASE: Record<string,string> = {
  'kurskosten':'Kurskosten',
  'beratung':'Beratung',
  'lohnkostenzuschuss':'Lohnkostenzuschuss',
  'betrieb':'Betrieb'
};

const OCR_NOISE = [
  /scanne\s+den\s+link\d+/i,
  /kontakt\s+.*?straße.*?\d+/i
];

const STOP_PHRASES = [
  'wer wird gefördert','wer wird gefoerdert',
  'was wird gefördert','was wird gefoerdert',
  'fördervoraussetzungen','foerdervoraussetzungen',
  'kurzüberblick','kurzueberblick'
];

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

export function asText(v: any): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return v.trim() || undefined;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    const first = v.find(x => asText(x));
    return asText(first);
  }
  if (typeof v === 'object') {
    const cand = v.typ ?? v.type ?? v.value ?? v.label ?? v.name ?? v.text ?? v.title;
    if (cand) return asText(cand);
  }
  try { return JSON.stringify(v); } catch { return undefined; }
}

export function cleanText(s?: string) {
  if (!s) return s;
  let t = s
    .replace(/\s+/g,' ')
    .replace(/\s+,/g,',')
    .trim();
  for (const rx of OCR_NOISE) t = t.replace(rx,'');
  t = t
    .replace(/Scanne den Link\d*/gi,'')
    .replace(/Wer wird gef(ö|oe)rdert\??/gi,'')
    .replace(/Was wird gef(ö|oe)rdert\??/gi,'')
    .replace(/F(ö|oe)rdervoraussetzungen/gi,'')
    .replace(/Kur(zu|z)berblick/gi,'');
  t = t.replace(/^(\?|·|•|-)\s*/,'').trim();
  return t || undefined;
}

export function clampWords(s?: string, max=55) {
  if (!s) return s;
  const parts = s.split(/\s+/);
  if (parts.length <= max) return s;
  return parts.slice(0,max).join(' ') + ' …';
}

export function shortTag(s?: string): string | undefined {
  if (!s) return undefined;
  const t = s.trim();
  if (!/[A-Za-zÄÖÜäöüß]/.test(t)) return undefined;
  if (/[.!?]$/.test(t)) return undefined;
  if (t.length > 60) return undefined;
  if (t.split(/\s+/).length > 9) return undefined;
  const low = t.toLowerCase();
  if (STOP_PHRASES.some(p => low.includes(p))) return undefined;
  return t;
}

export function normalizeList(v: any): string[] | undefined {
  const arr = (Array.isArray(v) ? v : (v != null ? [v] : []))
    .map(asText)
    .filter(Boolean)
    .map(cleanText)
    .map(shortTag)
    .filter(Boolean) as string[];
  return dedup(arr);
}

export function prettyFoerderart(v?: any) {
  const arr = (Array.isArray(v) ? v : (v != null ? [v] : [])).map(asText).filter(Boolean) as string[];
  const mapped = arr.map(s => {
    const k = s.toLowerCase();
    const hit = Object.keys(FOERDERART_MAP).find(p => k.includes(p));
    const norm = hit ? FOERDERART_MAP[hit] : s.trim();
    return TITLE_CASE[norm] ?? (norm.slice(0,1).toUpperCase()+norm.slice(1));
  });
  return dedup(mapped);
}

export function prettyAntragsweg(v?: any) {
  const arr = (Array.isArray(v) ? v : (v != null ? [v] : [])).map(asText).filter(Boolean) as string[];
  const mapped = arr.map(s => {
    const k = s.toLowerCase().replace(/\s+/g,' ').trim();
    const hit = Object.keys(ANTRAG_MAP).find(p => k.includes(p));
    return hit ? ANTRAG_MAP[hit] : s.trim();
  });
  return dedup(mapped);
}

const REGION_CANON = [
  { rx: /(ober(ö|oe)sterreich)/i, label:'Oberösterreich' },
  { rx: /\b(österreichweit|bundesweit)\b/i, label:'Österreichweit' },
];
export function canonicalRegion(t?: any) {
  const s = asText(t);
  if (!s) return undefined;
  const normalized = s.toLowerCase();
  const translit = normalized
    .replace(/ö/g,'oe')
    .replace(/ä/g,'ae')
    .replace(/ü/g,'ue')
    .replace(/ß/g,'ss');
  if (REGION_CANON[1].rx.test(normalized)) return 'Österreichweit';
  if (REGION_CANON[0].rx.test(normalized) || translit.includes('oberoesterreich') || /\boo(e)?\b/.test(translit)) {
    return 'Oberösterreich';
  }
  return undefined;
}

export function normalizeProgram(p: Program): Program {
  const ziel = normalizeList(p.zielgruppe) ?? [];
  const vor  = normalizeList(p.voraussetzungen) ?? [];
  return {
    ...p,
    foerderart: prettyFoerderart(p.foerderart)?.[0],
    antragsweg: prettyAntragsweg(p.antragsweg)?.[0],
    region: canonicalRegion(p.region) ?? asText(p.region),
    frist: asText(p.frist),
    zielgruppe: dedup(ziel),
    voraussetzungen: dedup(vor),
    summary: clampWords(cleanText(asText(p.summary)), 55),
  };
}

export default {
  dedup,
  asText,
  cleanText,
  clampWords,
  shortTag,
  normalizeList,
  prettyFoerderart,
  prettyAntragsweg,
  canonicalRegion,
  normalizeProgram,
};
