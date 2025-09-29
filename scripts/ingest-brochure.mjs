import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url
).toString();

// Normalisierung für Suche (wie in searchIndex.ts)
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[àáâãäåæ]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .trim();
}

// Section-Erkennung per Regex
const sectionPatterns = [
  { 
    name: 'zielgruppe', 
    pattern: /^zielgruppe|wer\s+wird\s+gef(ö|oe)rdert|f(ü|ue)r\s+wen(\s+ist|\s+gilt)?|adressat(en)?|ziel-?adressat|zielpersona/i 
  },
  { 
    name: 'voraussetzungen', 
    pattern: /^voraussetzungen|bedingungen|erforderlich|erfordernis|nachweis(e)?|nur\s+wenn|sofern|vorausgesetzt|(teilnahme|aufnahme)\s*bedingungen/i 
  },
  { name: 'förderhöhe', pattern: /^(förderhöhe|foerderhoehe|foerderung|förderung)/i },
  { name: 'frist', pattern: /^(frist|status)/i },
  { name: 'antragsweg', pattern: /^(antragsweg|antrag)/i },
  { name: 'passt_wenn', pattern: /^passt,?\s+wenn/i },
  { name: 'passt_nicht_wenn', pattern: /^passt\s+nicht,?\s+wenn/i },
  { name: 'überblick', pattern: /^(überblick|beschreibung)/i },
  { name: 'region', pattern: /^region|(gilt|verf(ü|ue)gbar)\s+in\s+(ober(ö|oe)sterreich|oö|ooe|österreichweit|bundesweit)/i },
  { name: 'quelle', pattern: /^(quelle|stand)/i }
];

function detectSection(line) {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  for (const { name, pattern } of sectionPatterns) {
    if (pattern.test(trimmedLine)) {
      return name;
    }
  }
  return null;
}

function cleanse(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/Scanne den Link\d+/gi, '')
    .replace(/Kontakt .*?straße .*?\d+/gi, '')
    .replace(/^(\?|·|•|-)\s*/, '')
    .trim();
}

// Chunking mit Overlap
function createChunks(text, programId, programData, page, section, chunkSize = 800, overlap = 140) {
  const chunks = [];
  let chunkId = 0;
  
  for (let start = 0; start < text.length; start += chunkSize - overlap) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end).trim();
    
    if (chunkText.length < 100) continue; // Zu kleine Chunks überspringen
    
    chunks.push({
      id: `${programId}-chunk-${++chunkId}`,
      text: chunkText,
      normalizedText: normalizeText(chunkText),
      programId,
      programName: programData.name,
      page,
      section,
      stand: programData.stand,
      status: programData.status,
      startChar: start,
      endChar: end
    });
  }
  
  return chunks;
}

async function extractTextFromPDF(pdfPath) {
  try {
    // Check if file exists and get basic info
    const stats = await fs.stat(pdfPath);
    console.log(`📄 PDF gefunden: ${path.basename(pdfPath)} (${Math.round(stats.size / 1024)}KB)`);
    
    // Read file as Buffer first, then convert
    const data = await fs.readFile(pdfPath);
    
    // Basic PDF validation
    if (data.length < 1024) {
      throw new Error('PDF-Datei zu klein (< 1KB) - möglicherweise beschädigt');
    }
    
    // Check PDF header
    const header = new TextDecoder().decode(data.slice(0, 8));
    if (!header.startsWith('%PDF-')) {
      throw new Error(`Ungültiger PDF-Header: "${header}" - Datei ist kein gültiges PDF`);
    }
    
    console.log(`📖 PDF-Header validiert: ${header}`);
    
    // Enhanced PDF loading with detailed error handling
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      verbosity: pdfjsLib.VerbosityLevel.WARNINGS,
      cMapUrl: null, // Disable CMap loading in WebContainer
      cMapPacked: false,
      standardFontDataUrl: null // Disable standard font loading
    });
    
    console.log(`📖 PDF-Loading-Task erstellt, starte Verarbeitung...`);
    
    const pdf = await loadingTask.promise;
    const pageTexts = new Map();
    
    console.log(`📖 PDF geladen: ${pdf.numPages} Seiten`);
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Sortiere Text-Items nach Position (y, dann x)
      const sortedItems = textContent.items.sort((a, b) => {
        const yDiff = Math.abs(a.transform[5] - b.transform[5]);
        if (yDiff > 5) return b.transform[5] - a.transform[5]; // y-Position (oben nach unten)
        return a.transform[4] - b.transform[4]; // x-Position (links nach rechts)
      });
      
      // Verbinde Text-Items zu Zeilen
      const lines = [];
      let currentLine = '';
      let lastY = null;
      
      for (const item of sortedItems) {
        const y = Math.round(item.transform[5]);
        const text = item.str.trim();
        
        if (!text) continue;
        
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          // Neue Zeile
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = text;
        } else {
          // Gleiche Zeile
          currentLine += (currentLine ? ' ' : '') + text;
        }
        
        lastY = y;
      }
      
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      
      pageTexts.set(pageNum, lines.join('\n'));
    }
    
    return { pageTexts, totalPages: pdf.numPages };
    
  } catch (error) {
    console.error('❌ PDF-Extraktion fehlgeschlagen:', error.message);
    console.error('❌ Vollständiger Fehler:', error);
    console.error('❌ Fehler-Stack:', error.stack);
    console.error('❌ Fehler-Name:', error.name);
    console.error('❌ Fehler-Code:', error.code);
    
    // Specific error handling
    if (error.name === 'InvalidPDFException') {
      console.error('💡 Mögliche Ursachen:');
      console.error('   - PDF ist beschädigt oder unvollständig');
      console.error('   - PDF ist passwortgeschützt');
      console.error('   - PDF verwendet ein ungewöhnliches Format');
      console.error('   - Datei ist kein echtes PDF (falscher MIME-Type)');
    } else if (error.name === 'PasswordException') {
      console.error('💡 PDF ist passwortgeschützt - Passwort erforderlich');
    } else if (error.name === 'MissingPDFException') {
      console.error('💡 PDF-Datei ist leer oder beschädigt');
    } else if (error.name === 'UnexpectedResponseException') {
      console.error('💡 Unerwartete Antwort beim PDF-Laden');
    } else if (error.message.includes('Invalid PDF structure')) {
      console.error('💡 PDF-Struktur-Probleme:');
      console.error('   - PDF könnte eine ungewöhnliche Version verwenden');
      console.error('   - PDF könnte linearisiert/optimiert sein');
      console.error('   - PDF könnte beschädigte Objekte enthalten');
      console.error('   - Versuchen Sie die PDF neu zu speichern/exportieren');
    } else if (error.message.includes('PDF-Header')) {
      console.error('💡 Die Datei ist kein gültiges PDF-Format');
    } else if (error.code === 'ENOENT') {
      console.error('💡 PDF-Datei nicht gefunden unter:', pdfPath);
    } else if (error.message.includes('Worker')) {
      console.error('💡 PDF.js Worker-Problem (WebContainer-Limitation)');
      console.error('   - Versuche alternative PDF-Verarbeitung...');
    } else {
      console.error('💡 Unerwarteter Fehler:', error.stack);
    }
    
    throw error;
  }
}

async function ingestBrochure() {
  const startTime = Date.now();
  console.log('🚀 Starte PDF-Ingestion...');
  
  try {
    // Lade Programm-Metadaten
    const metaPath = path.join(__dirname, '../src/data/programMeta.json');
    const metaContent = await fs.readFile(metaPath, 'utf-8');
    const programMeta = JSON.parse(metaContent);
    
    console.log(`📋 ${Object.keys(programMeta).length} Programme in Metadaten gefunden`);
    
    // PDF-Pfad (falls vorhanden)
    const pdfPath = path.join(__dirname, '../src/data/brochure.pdf');
    let pageTexts;
    let totalPages;
    
    try {
      await fs.access(pdfPath);
      const result = await extractTextFromPDF(pdfPath);
      pageTexts = result.pageTexts;
      totalPages = result.totalPages;
      console.log(`📄 PDF erfolgreich extrahiert: ${totalPages} Seiten`);
    } catch (pdfError) {
      console.log(`⚠️ PDF-Verarbeitung fehlgeschlagen: ${pdfError.name}: ${pdfError.message}`);
      console.log(`⚠️ PDF-Fehler-Details:`, pdfError);
      console.log('🎭 Verwende simulierte Inhalte als Fallback');
      // Fallback: Simulierte Inhalte (wie in ursprünglichem ingest.ts)
      const { pageTexts: simPageTexts, totalPages: simTotalPages } = generateSimulatedContent(programMeta);
      pageTexts = simPageTexts;
      totalPages = simTotalPages;
    }
    
    // Chunks erstellen
    const allChunks = [];
    const statsByProgram = {};
    const statsBySection = {};
    
    pageTexts.forEach((pageText, pageNum) => {
      // Finde zugehöriges Programm
      const programEntry = Object.entries(programMeta).find(([id, data]) => 
        pageNum >= data.pages[0] && pageNum <= data.pages[1]
      );
      
      if (!programEntry) {
        console.log(`⏭️ Seite ${pageNum} übersprungen (kein Programm zugeordnet)`);
        return;
      }
      
      const [programId, programData] = programEntry;
      
      // Section-Erkennung
      const lines = pageText.split('\n');
      let currentSection = 'allgemein';
      let sectionText = '';
      
      for (const rawLine of lines) {
        const line = cleanse(rawLine);
        if (!line) continue;

        const detectedSection = detectSection(line);

        if (detectedSection) {
          // Vorherige Section abschließen
          if (sectionText.trim()) {
            const chunks = createChunks(sectionText.trim(), programId, programData, pageNum, currentSection);
            allChunks.push(...chunks);
            
            // Statistiken
            if (!statsByProgram[programId]) statsByProgram[programId] = 0;
            if (!statsBySection[currentSection]) statsBySection[currentSection] = 0;
            statsByProgram[programId] += chunks.length;
            statsBySection[currentSection] += chunks.length;
          }
          
          // Neue Section starten
          currentSection = detectedSection;
          sectionText = line;
        } else {
          sectionText = sectionText ? `${sectionText}\n${line}` : line;
        }
      }
      
      // Letzte Section abschließen
      if (sectionText.trim()) {
        const chunks = createChunks(sectionText.trim(), programId, programData, pageNum, currentSection);
        allChunks.push(...chunks);
        
        if (!statsByProgram[programId]) statsByProgram[programId] = 0;
        if (!statsBySection[currentSection]) statsBySection[currentSection] = 0;
        statsByProgram[programId] += chunks.length;
        statsBySection[currentSection] += chunks.length;
      }
    });
    
    // Statistiken
    const stats = {
      totalPages,
      totalChunks: allChunks.length,
      programsFound: Object.keys(statsByProgram).length,
      processingTime: Date.now() - startTime,
      byProgram: statsByProgram,
      bySections: statsBySection,
      avgChunkLength: allChunks.reduce((sum, chunk) => sum + chunk.text.length, 0) / allChunks.length
    };
    
    // Output schreiben
    const outputDir = path.join(__dirname, '../public/rag');
    await fs.mkdir(outputDir, { recursive: true });
    
    await fs.writeFile(
      path.join(outputDir, 'chunks.json'),
      JSON.stringify(allChunks, null, 2)
    );
    
    await fs.writeFile(
      path.join(outputDir, 'stats.json'),
      JSON.stringify(stats, null, 2)
    );
    
    // Zusammenfassung
    console.log('\n✅ Ingestion abgeschlossen:');
    console.log(`   📊 ${stats.totalChunks} Chunks aus ${stats.totalPages} Seiten`);
    console.log(`   📋 ${stats.programsFound} Programme verarbeitet`);
    console.log(`   ⏱️ ${stats.processingTime}ms Verarbeitungszeit`);
    console.log(`   📏 Ø ${Math.round(stats.avgChunkLength)} Zeichen pro Chunk`);
    console.log('\n📁 Output:');
    console.log(`   public/rag/chunks.json (${stats.totalChunks} Chunks)`);
    console.log(`   public/rag/stats.json (Statistiken)`);
    console.log('\n💡 Nächste Schritte:');
    console.log('   1. Seite neu laden (Ctrl+R)');
    console.log('   2. Cache leeren falls nötig (Settings → Broschüren → Cache leeren)');
    console.log('   3. Bei PDF-Problemen: Datei neu exportieren/speichern');
    
    return { chunks: allChunks, stats };
    
  } catch (error) {
    console.error('❌ Ingestion fehlgeschlagen:', error.name, error.message);
    console.error('❌ Vollständiger Fehler:', error);
    process.exit(1);
  }
}

// Simulierte Inhalte als Fallback (falls PDF nicht vorhanden)
function generateSimulatedContent(programMeta) {
  const pageTexts = new Map();
  
  Object.entries(programMeta).forEach(([programId, data]) => {
    const [startPage, endPage] = data.pages;
    
    for (let page = startPage; page <= endPage; page++) {
      const pageOffset = page - startPage;
      
      let content = `${data.name}\n\n`;
      
      switch (pageOffset) {
        case 0:
          content += `ÜBERBLICK\n${data.name} unterstützt die berufliche Weiterbildung durch gezielte Fördermaßnahmen.\n\nZIELGRUPPE\nBeschäftigte und Arbeitsuchende in Oberösterreich mit Hauptwohnsitz.`;
          break;
        case 1:
          content += `FÖRDERHÖHE\nBis zu 75% der Kurskosten werden übernommen, maximal 5.000€ pro Jahr und Person.\n\nVORAUSSETZUNGEN\nHauptwohnsitz in Oberösterreich, Mindestalter 18 Jahre, anerkannter Bildungsträger erforderlich.`;
          break;
        case 2:
          content += `ANTRAGSWEG\nAntragstellung erfolgt über das entsprechende Online-Portal mit digitaler Signatur.\n\nFRIST\nLaufende Antragstellung ist möglich, Bearbeitungszeit beträgt 4-6 Wochen.`;
          break;
        default:
          content += `PASST WENN\nSie alle formalen Voraussetzungen erfüllen und einen anerkannten Kurs besuchen möchten.\n\nPASST NICHT WENN\nVoraussetzungen nicht erfüllt sind oder der Bildungsträger nicht anerkannt ist.`;
      }
      
      pageTexts.set(page, content);
    }
  });
  
  return { pageTexts, totalPages: Math.max(...Object.values(programMeta).map(d => d.pages[1])) };
}

// Hauptfunktion ausführen
ingestBrochure().catch(console.error);