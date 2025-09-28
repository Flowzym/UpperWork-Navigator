import { Program } from '../types';

export interface RagProgramMeta {
  programId: string;
  programName: string;
  pages: [number, number];
  stand: string | null;
  status: 'aktiv' | 'ausgesetzt' | 'endet_am' | 'entfallen' | null;
}

export interface RagChunk {
  id: string;
  text: string;
  normalizedText: string;
  programId: string;
  programName: string;
  page: number;
  section: string;
  stand: string;
  status: 'aktiv' | 'ausgesetzt' | 'endet_am' | 'entfallen';
  startChar: number;
  endChar: number;
}

type ProgramStatus = 'aktiv' | 'ausgesetzt' | 'endet_am' | 'entfallen';

function normalizeStatus(raw?: string | null): ProgramStatus {
  const t = (raw ?? '').toLowerCase();
  if (!t) return 'aktiv';
  if (t.includes('endet')) return 'endet_am';
  if (t.includes('ausgesetzt') || t.includes('paus')) return 'ausgesetzt';
  if (t.includes('eingestellt') || t.includes('entfallen') || t.includes('beendet')) return 'entfallen';
  return ['aktiv','ausgesetzt','endet_am','entfallen'].includes(t as any) ? (t as ProgramStatus) : 'aktiv';
}

// Extrahiere Zielgruppe aus Chunks
function extractZielgruppe(chunks: RagChunk[]): string[] {
  const zielgruppeChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('zielgruppe') ||
    c.text.toLowerCase().includes('zielgruppe')
  );
  
  const zielgruppen = new Set<string>();
  
  zielgruppeChunks.forEach(chunk => {
    const text = chunk.text.toLowerCase();
    if (text.includes('beschäftigte')) zielgruppen.add('Beschäftigte');
    if (text.includes('arbeitsuchende')) zielgruppen.add('Arbeitsuchende');
    if (text.includes('unternehmen')) zielgruppen.add('Unternehmen');
    if (text.includes('kmu')) zielgruppen.add('KMU');
    if (text.includes('frauen')) zielgruppen.add('Frauen');
    if (text.includes('lehrling')) zielgruppen.add('Lehrlinge');
    if (text.includes('wiedereinstieg')) zielgruppen.add('Wiedereinsteigerinnen');
    if (text.includes('50+') || text.includes('älter')) zielgruppen.add('50+');
  });
  
  return Array.from(zielgruppen);
}

// Extrahiere Förderart aus Chunks
function extractFoerderart(chunks: RagChunk[]): ('kurskosten' | 'personalkosten' | 'beihilfe' | 'beratung')[] {
  const foerderartChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('förderhöhe') ||
    c.section.toLowerCase().includes('förderart') ||
    c.text.toLowerCase().includes('förder')
  );
  
  const foerderarten = new Set<'kurskosten' | 'personalkosten' | 'beihilfe' | 'beratung'>();
  
  foerderartChunks.forEach(chunk => {
    const text = chunk.text.toLowerCase();
    if (text.includes('kurskosten') || text.includes('kurs')) foerderarten.add('kurskosten');
    if (text.includes('personalkosten') || text.includes('personal')) foerderarten.add('personalkosten');
    if (text.includes('beihilfe') || text.includes('lebensunterhalt')) foerderarten.add('beihilfe');
    if (text.includes('beratung') || text.includes('coaching')) foerderarten.add('beratung');
  });
  
  return Array.from(foerderarten);
}

// Extrahiere Förderhöhe aus Chunks
function extractFoerderhoehe(chunks: RagChunk[]) {
  const foerderhoeheChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('förderhöhe') ||
    c.text.toLowerCase().includes('förder')
  );
  
  const foerderhoehe = [];
  
  foerderhoeheChunks.forEach(chunk => {
    const text = chunk.text;
    
    // Suche nach Prozentangaben
    const percentMatch = text.match(/(\d+)%/);
    const euroMatch = text.match(/(\d+\.?\d*)\s*€/);
    const maxMatch = text.match(/max(?:imal)?\s*(\d+\.?\d*)/i);
    
    if (percentMatch || euroMatch || maxMatch) {
      foerderhoehe.push({
        label: 'Förderung',
        quote: percentMatch ? parseInt(percentMatch[1]) : undefined,
        max: maxMatch ? parseInt(maxMatch[1]) : euroMatch ? parseInt(euroMatch[1]) : undefined,
        note: 'aus Broschüre extrahiert'
      });
    }
  });
  
  // Fallback wenn nichts gefunden
  if (foerderhoehe.length === 0) {
    foerderhoehe.push({
      label: 'Förderung',
      quote: 50,
      note: 'Details siehe Broschüre'
    });
  }
  
  return foerderhoehe;
}

// Extrahiere Voraussetzungen aus Chunks
function extractVoraussetzungen(chunks: RagChunk[]): string[] {
  const voraussetzungenChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('voraussetzung') ||
    c.text.toLowerCase().includes('voraussetzung')
  );
  
  const voraussetzungen = new Set<string>();
  
  voraussetzungenChunks.forEach(chunk => {
    const lines = chunk.text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        const cleaned = line.replace(/^[•\-*\s]+/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 100) {
          voraussetzungen.add(cleaned);
        }
      }
    });
  });
  
  return Array.from(voraussetzungen).slice(0, 5); // Max 5 Voraussetzungen
}

// Extrahiere Themen aus Chunks
function extractThemen(chunks: RagChunk[]): string[] {
  const themen = new Set<string>();
  
  chunks.forEach(chunk => {
    const text = chunk.text.toLowerCase();
    if (text.includes('digital')) themen.add('Digitalisierung');
    if (text.includes('sprach') || text.includes('deutsch')) themen.add('Sprachen');
    if (text.includes('technik') || text.includes('handwerk')) themen.add('Technik & Handwerk');
    if (text.includes('management') || text.includes('führung')) themen.add('Management');
    if (text.includes('nachhaltig')) themen.add('Nachhaltigkeit');
    if (text.includes('innovation')) themen.add('Innovation');
    if (text.includes('pflege') || text.includes('gesundheit')) themen.add('Pflege & Gesundheit');
    if (text.includes('qualifizierung') || text.includes('weiterbildung')) themen.add('Berufliche Weiterbildung');
  });
  
  return Array.from(themen);
}

// Extrahiere Antragsweg aus Chunks
function extractAntragsweg(chunks: RagChunk[]): 'eams' | 'land_ooe_portal' | 'wko_verbund' | 'traeger_direkt' {
  const antragswegChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('antragsweg') ||
    c.text.toLowerCase().includes('antrag')
  );
  
  for (const chunk of antragswegChunks) {
    const text = chunk.text.toLowerCase();
    if (text.includes('eams')) return 'eams';
    if (text.includes('land') && text.includes('oö')) return 'land_ooe_portal';
    if (text.includes('wko') || text.includes('verbund')) return 'wko_verbund';
    if (text.includes('träger') || text.includes('direkt')) return 'traeger_direkt';
  }
  
  return 'land_ooe_portal'; // Default
}

// Extrahiere Frist aus Chunks
function extractFrist(chunks: RagChunk[]) {
  const fristChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('frist') ||
    c.text.toLowerCase().includes('frist') ||
    c.text.toLowerCase().includes('stichtag')
  );
  
  for (const chunk of fristChunks) {
    const text = chunk.text;
    const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dateMatch) {
      return { typ: 'stichtag' as const, datum: dateMatch[0] };
    }
    if (text.toLowerCase().includes('laufend')) {
      return { typ: 'laufend' as const };
    }
  }
  
  return { typ: 'laufend' as const };
}

// Extrahiere Region aus Chunks
function extractRegion(chunks: RagChunk[]): string {
  const regionChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('region') ||
    c.text.toLowerCase().includes('oberösterreich') ||
    c.text.toLowerCase().includes('oö')
  );
  
  for (const chunk of regionChunks) {
    const text = chunk.text.toLowerCase();
    if (text.includes('oberösterreich') || text.includes('oö')) return 'Oberösterreich';
    if (text.includes('österreich')) return 'Österreich';
    if (text.includes('linz')) return 'Linz';
    if (text.includes('wels')) return 'Wels';
  }
  
  return 'Oberösterreich'; // Default
}

// Generiere Teaser aus ersten Chunks
function generateTeaser(chunks: RagChunk[]): string {
  const overviewChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('überblick') ||
    c.section.toLowerCase().includes('allgemein') ||
    c.section.toLowerCase().includes('beschreibung')
  );
  
  if (overviewChunks.length > 0) {
    const text = overviewChunks[0].text;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      return sentences[0].trim() + '.';
    }
  }
  
  // Fallback: Erste Zeilen des ersten Chunks
  if (chunks.length > 0) {
    const firstLines = chunks[0].text.split('\n').slice(0, 2).join(' ').trim();
    return firstLines.length > 50 ? firstLines.substring(0, 150) + '...' : firstLines;
  }
  
  return 'Förderung für berufliche Weiterbildung in Oberösterreich.';
}

// Generiere "Passt wenn" aus Chunks
function extractPasstWenn(chunks: RagChunk[]): string[] {
  const passtChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('passt') ||
    c.text.toLowerCase().includes('passt wenn')
  );
  
  const items = new Set<string>();
  
  passtChunks.forEach(chunk => {
    const lines = chunk.text.split('\n');
    lines.forEach(line => {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        const cleaned = line.replace(/^[•\-*\s]+/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 80) {
          items.add(cleaned);
        }
      }
    });
  });
  
  return Array.from(items).slice(0, 4);
}

// Generiere "Passt nicht wenn" aus Chunks
function extractPasstNichtWenn(chunks: RagChunk[]): string[] {
  const passtNichtChunks = chunks.filter(c => 
    c.section.toLowerCase().includes('passt nicht') ||
    c.text.toLowerCase().includes('passt nicht wenn')
  );
  
  const items = new Set<string>();
  
  passtNichtChunks.forEach(chunk => {
    const lines = chunk.text.split('\n');
    lines.forEach(line => {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        const cleaned = line.replace(/^[•\-*\s]+/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 80) {
          items.add(cleaned);
        }
      }
    });
  });
  
  return Array.from(items).slice(0, 4);
}

// Hauptfunktion: Baue Program[] aus RAG-Daten
export function buildProgramsFromRag(
  programMeta: RagProgramMeta[],
  chunks: RagChunk[]
): Program[] {
  const programs: Program[] = [];
  
  programMeta.forEach(meta => {
    // Status normalisieren und nur wirklich entfallene Programme ausblenden
    const status = normalizeStatus(meta.status);
    if (status === 'entfallen') return;
    
    const programChunks = chunks.filter(c => c.programId === meta.programId);
    if (programChunks.length === 0) return;
    
    const zielgruppe = extractZielgruppe(programChunks);
    const foerderart = extractFoerderart(programChunks);
    const foerderhoehe = extractFoerderhoehe(programChunks);
    const voraussetzungen = extractVoraussetzungen(programChunks);
    const themen = extractThemen(programChunks);
    const antragsweg = extractAntragsweg(programChunks);
    const frist = extractFrist(programChunks);
    const region = extractRegion(programChunks);
    const teaser = generateTeaser(programChunks);
    const passt_wenn = extractPasstWenn(programChunks);
    const passt_nicht_wenn = extractPasstNichtWenn(programChunks);
    
    // Bestimme Portal basierend auf Antragsweg
    const portal = antragsweg === 'eams' ? 'AMS' :
                  antragsweg === 'land_ooe_portal' ? 'Land OÖ' :
                  antragsweg === 'wko_verbund' ? 'WKO' : 'Träger';
    
    const program: Program = {
      id: meta.programId,
      name: meta.programName,
      status,
      teaser,
      zielgruppe,
      foerderart,
      foerderhoehe,
      voraussetzungen,
      antragsweg,
      frist,
      region,
      themen,
      passt_wenn,
      passt_nicht_wenn,
      quelle: { 
        seite: meta.pages[0], 
        stand: meta.stand || '09/2025' 
      },
      
      // Legacy compatibility
      tags: themen,
      portal,
      description: teaser,
      budget: foerderhoehe[0]?.max ? `bis ${foerderhoehe[0].max.toLocaleString()}€` : 
              foerderhoehe[0]?.quote ? `${foerderhoehe[0].quote}%` : 'siehe Details',
      targetGroup: zielgruppe,
      fundingType: foerderart.join(', '),
      requirements: voraussetzungen,
      themeField: themen[0] || 'Weiterbildung',
      deadline: frist.typ === 'laufend' ? 'laufend' : frist.datum || 'siehe Details'
    };
    
    programs.push(program);
  });
  
  return programs;
}