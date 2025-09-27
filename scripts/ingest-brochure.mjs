import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  { name: 'zielgruppe', pattern: /^zielgruppe/i },
  { name: 'förderhöhe', pattern: /^(förderhöhe|foerderhoehe|foerderung|förderung)/i },
  { name: 'voraussetzungen', pattern: /^voraussetzungen/i },
  { name: 'frist', pattern: /^(frist|status)/i },
  { name: 'antragsweg', pattern: /^(antragsweg|antrag)/i },
  { name: 'passt_wenn', pattern: /^passt,?\s+wenn/i },
  { name: 'passt_nicht_wenn', pattern: /^passt\s+nicht,?\s+wenn/i },
  { name: 'überblick', pattern: /^(überblick|beschreibung)/i },
  { name: 'region', pattern: /^region/i },
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
    const data = await fs.readFile(pdfPath);
    const pdf = await pdfjsLib.getDocument({ data }).promise;
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
    console.error('❌ PDF-Extraktion fehlgeschlagen:', error);
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
      console.log('⚠️ PDF nicht gefunden, verwende simulierte Inhalte');
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
      
      for (const line of lines) {
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
          sectionText += '\n' + line;
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
    
    return { chunks: allChunks, stats };
    
  } catch (error) {
    console.error('❌ Ingestion fehlgeschlagen:', error);
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
          content += `ÜBERBLICK\n${data.name} unterstützt die berufliche Weiterbildung.\n\nZIELGRUPPE\nBeschäftigte und Arbeitsuchende in Oberösterreich.`;
          break;
        case 1:
          content += `FÖRDERHÖHE\nBis zu 75% der Kurskosten, maximal 5.000€ pro Jahr.\n\nVORAUSSETZUNGEN\nHauptwohnsitz in Oberösterreich, Mindestalter 18 Jahre.`;
          break;
        case 2:
          content += `ANTRAGSWEG\nAntragstellung über das entsprechende Portal.\n\nFRIST\nLaufende Antragstellung möglich.`;
          break;
        default:
          content += `PASST WENN\nSie die Voraussetzungen erfüllen.\n\nPASST NICHT WENN\nVoraussetzungen nicht erfüllt sind.`;
      }
      
      pageTexts.set(page, content);
    }
  });
  
  return { pageTexts, totalPages: Math.max(...Object.values(programMeta).map(d => d.pages[1])) };
}

// Hauptfunktion ausführen
ingestBrochure().catch(console.error);