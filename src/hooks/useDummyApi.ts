import { useState, useEffect } from 'react';
import { Program, Provider, Mode, ContextType, Answer } from '../types';
import { samplePrograms } from '../data/samplePrograms';
import { useMetrics } from '../metrics/useMetrics';

// Dummy API Hook für Programme
export function useFetchPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simuliere API-Call mit Verzögerung
    const timer = setTimeout(() => {
      try {
        setPrograms(samplePrograms);
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Programme');
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { programs, loading, error };
}

// Dummy API Hook für Chat-Antworten
export function useChatResponse() {
  const [loading, setLoading] = useState(false);
  const { track } = useMetrics();

  const generateResponse = async (
    query: string,
    provider: Provider,
    mode: Mode,
    context: ContextType,
    onlyBrochure: boolean,
    withSources: boolean
  ): Promise<Answer> => {
    setLoading(true);

    const startTime = performance.now();

    // Simuliere API-Call Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    const generateRandomPage = () => Math.floor(Math.random() * 36) + 5;

    let responseText = `Dummy-Antwort im Modus ${mode} mit Provider ${provider}, Kontext ${context}. Frage: "${query}"`;
    
    // Provider-spezifische Antworten
    switch (provider) {
      case 'ChatGPT':
        responseText += '\n\nDiese Antwort wurde präzise und sachlich formuliert.';
        break;
      case 'Mistral':
        responseText += '\n\n• Kompakte Stichpunkte\n• Direkte Antworten\n• Keine Umschweife';
        break;
      case 'Claude':
        responseText += '\n\nAusführliche Erläuterung mit strukturierter Gliederung:\n\n1. Hauptpunkt\n2. Detailanalyse\n3. Zusammenfassung';
        break;
      case 'Lokal':
        responseText += '\n\nStreng faktenorientierte Antwort ohne Interpretation.';
        break;
      case 'Custom':
        responseText += '\n\nAnpassbare Antwort je nach Konfiguration.';
        break;
    }

    if (onlyBrochure) {
      responseText += '\n\n(Hinweis: Nur Inhalte aus der Broschüre berücksichtigt.)';
    }

    const sources = withSources ? [{ 
      seite: generateRandomPage(), 
      stand: '09/2025' 
    }] : undefined;

    // Zufällige Warnungen für Demo
    let warning: string | undefined;
    if (Math.random() > 0.7) {
      const warnings = [
        'Programm derzeit ausgesetzt – keine Anträge möglich',
        'Programm endet am 31.12.2025 – begrenzte Laufzeit'
      ];
      warning = warnings[Math.floor(Math.random() * warnings.length)];
    }

    const answer: Answer = {
      id: `answer-${Date.now()}-${Math.random()}`,
      text: responseText,
      sources,
      warning,
      meta: {
        provider,
        mode,
        context,
        timestamp: new Date().toISOString()
      }
    };

    // Track latency (dummy)
    const latency = performance.now() - startTime;
    track({ t: 'answer.latency', at: Date.now(), provider, ms: latency });

    // Track answer render
    track({
      t: 'answer.render',
      at: Date.now(),
      provider,
      mode,
      context,
      hasCitations: (answer.sources?.length || 0) > 0,
      citations: answer.sources?.length || 0,
      warning: !!answer.warning
    });

    setLoading(false);
    return answer;
  };

  return { generateResponse, loading };
}

// Dummy API Hook für Suche
export function useSearch() {
  const [loading, setLoading] = useState(false);

  const search = async (query: string): Promise<string[]> => {
    if (!query.trim()) return [];
    
    setLoading(true);
    
    // Simuliere Suche mit Verzögerung
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Einfache Dummy-Suche
    const results = samplePrograms
      .filter(program => 
        program.name.toLowerCase().includes(query.toLowerCase()) ||
        program.teaser.toLowerCase().includes(query.toLowerCase()) ||
        program.themen.some(theme => theme.toLowerCase().includes(query.toLowerCase()))
      )
      .map(program => program.id);
    
    setLoading(false);
    return results;
  };

  return { search, loading };
}

// Dummy API Hook für Export-Funktionen
export function useExport() {
  const [loading, setLoading] = useState(false);

  const exportToPDF = async (content: string, filename: string): Promise<void> => {
    setLoading(true);
    
    // Simuliere PDF-Generierung
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In echter Implementierung würde hier PDF generiert
    console.log(`PDF Export: ${filename}`, content);
    
    setLoading(false);
  };

  const exportToEmail = async (content: string, recipient?: string): Promise<void> => {
    setLoading(true);
    
    // Simuliere E-Mail-Versand
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In echter Implementierung würde hier E-Mail versendet
    console.log(`Email Export to ${recipient || 'default'}:`, content);
    
    setLoading(false);
  };

  return { exportToPDF, exportToEmail, loading };
}