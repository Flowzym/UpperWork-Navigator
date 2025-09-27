import { useState } from 'react';
import { Provider, Mode, ContextType, Answer } from '../types';
import { EndpointConfig, buildChatCompletionsUrl, buildModelsUrl, buildRequestHeaders, createAbortController } from '../config/endpoints';
import { useRag } from './useRag';
import { useMetrics } from '../metrics/useMetrics';
import { detectInjection } from '../lib/rag/guardrails';
import { showToast } from '../lib/ui/toast';

export function useChatApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rag = useRag();
  const { track } = useMetrics();

  const askChatGPT = async (
    prompt: string,
    mode: Mode,
    context: ContextType,
    onlyBrochure: boolean,
    withSources: boolean
  ): Promise<Answer> => {
    // Check for injection attempts
    if (detectInjection(prompt)) {
      showToast('Mögliche Prompt-Injection erkannt – bleibe streng bei der Broschüre.', 'warn');
    }
    
    let ragContext = '';
    let ragCitations: any[] = [];
    
    // RAG-Kontext für "Nur Broschüre" Modus
    if (onlyBrochure && rag.isReady) {
      ragContext = await rag.buildContextForQuery(prompt, 1500);
      const retrievalResult = await rag.retrieveForQuery(prompt, 4);
      ragCitations = retrievalResult.chunks;
    }
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Debug: API-Key Wert zur Laufzeit prüfen
    console.log('Debug: VITE_OPENAI_API_KEY in useChatApi:', apiKey);
    console.log('Debug: API-Key type:', typeof apiKey);
    console.log('Debug: API-Key length:', apiKey?.length || 0);
    console.log('Debug: Starts with sk-:', apiKey?.startsWith?.('sk-'));
    
    // Fallback to dummy if no API key
    if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
      return {
        id: `dummy-${Date.now()}`,
        text: '(Dummy-Antwort: Kein OpenAI API-Key konfiguriert)',
        sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
                 withSources ? [{ seite: 12, stand: '09/2025' }] : undefined,
        warning: 'API-Key fehlt - siehe .env.example',
        meta: {
          provider: 'ChatGPT',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };
    }

    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      // Build system prompt based on mode and context
      let systemPrompt = 'Du bist ein Förderassistent für Oberösterreich. Antworte klar, präzise und hilfreich.';
      
      if (onlyBrochure) {
        systemPrompt += ' Verwende nur die bereitgestellten Broschüren-Inhalte. Zitiere Seitenzahlen.';
      }

      // Build user prompt with mode and context
      let userPrompt = ragContext ? 
        `${ragContext}\n\nModus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}` :
        `Modus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}`;

      if (mode === 'Checkliste') {
        userPrompt += '\n\nBitte erstelle eine strukturierte 5-Schritte-Checkliste.';
      } else if (mode === 'Vergleich') {
        userPrompt += '\n\nBitte vergleiche die relevanten Aspekte systematisch.';
      } else if (mode === 'E-Mail') {
        userPrompt += '\n\nBitte formuliere eine professionelle E-Mail-Antwort.';
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '(Keine Antwort erhalten)';

      // Track latency
      const latency = performance.now() - startTime;
      track({ t: 'answer.latency', at: Date.now(), provider: 'ChatGPT', ms: latency });

      // Prüfe RAG-Warnungen
      let warning: string | undefined;
      if (ragCitations.length > 0) {
        const warnings = await rag.getWarningsForQuery(prompt);
        if (warnings.length > 0) {
          warning = warnings[0]; // Erste Warnung verwenden
        }
      } else if (onlyBrochure && rag.isReady) {
        warning = 'Keine relevanten Inhalte in der Broschüre gefunden';
      }

      const answer = {
        id: `chatgpt-${Date.now()}`,
        text,
        sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
                 withSources ? [{ seite: Math.floor(Math.random() * 36) + 5, stand: '09/2025' }] : undefined,
        warning,
        meta: {
          provider: 'ChatGPT',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };

      // Track answer render
      track({
        t: 'answer.render',
        at: Date.now(),
        provider: 'ChatGPT',
        mode,
        context,
        hasCitations: (answer.sources?.length || 0) > 0,
        citations: answer.sources?.length || 0,
        warning: !!answer.warning
      });

      return answer;

    } catch (err: any) {
      const errorMessage = err.message || 'Unbekannter Fehler beim API-Call';
      setError(errorMessage);
      
      // Track error
      track({
        t: 'answer.error',
        at: Date.now(),
        provider: 'ChatGPT',
        code: err.status ? `HTTP_${err.status}` : 'NETWORK_ERROR'
      });
      
      return {
        id: `error-${Date.now()}`,
        text: `Fehler beim ChatGPT API-Call: ${errorMessage}`,
        sources: undefined,
        warning: 'API-Fehler aufgetreten',
        meta: {
          provider: 'ChatGPT',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      setLoading(false);
    }
  };

  const askMistral = async (
    prompt: string,
    mode: Mode,
    context: ContextType,
    onlyBrochure: boolean,
    withSources: boolean
  ): Promise<Answer> => {
    let ragContext = '';
    let ragCitations: any[] = [];
    
    // RAG-Kontext für "Nur Broschüre" Modus
    if (onlyBrochure && rag.isReady) {
      ragContext = await rag.buildContextForQuery(prompt, 1500);
      const retrievalResult = await rag.retrieveForQuery(prompt, 4);
      ragCitations = retrievalResult.chunks;
    }
    
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    // Fallback to dummy if no API key
    if (!apiKey || apiKey === 'sk-or-your-openrouter-api-key-here') {
      return {
        id: `dummy-${Date.now()}`,
        text: '(Dummy-Antwort: Kein OpenRouter API-Key konfiguriert)',
        sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
                 withSources ? [{ seite: 15, stand: '09/2025' }] : undefined,
        warning: 'OpenRouter API-Key fehlt - siehe .env.example',
        meta: {
          provider: 'Mistral',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };
    }

    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      // Build system prompt - Mistral style: compact & fact-oriented
      let systemPrompt = 'Du bist ein Förderassistent für Oberösterreich. Antworte kompakt & faktenorientiert.';
      
      if (onlyBrochure) {
        systemPrompt += ' Verwende nur die bereitgestellten Broschüren-Inhalte. Zitiere Seitenzahlen.';
      }

      // Build user prompt with mode and context
      let userPrompt = ragContext ? 
        `${ragContext}\n\nModus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}` :
        `Modus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}`;

      if (mode === 'Checkliste') {
        userPrompt += '\n\nBitte erstelle eine kompakte 5-Schritte-Checkliste.';
      } else if (mode === 'Vergleich') {
        userPrompt += '\n\nBitte vergleiche die wichtigsten Aspekte in Stichpunkten.';
      } else if (mode === 'E-Mail') {
        userPrompt += '\n\nBitte formuliere eine kurze, professionelle E-Mail-Antwort.';
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '(Keine Antwort von Mistral erhalten)';

      // Track latency
      const latency = performance.now() - startTime;
      track({ t: 'answer.latency', at: Date.now(), provider: 'Mistral', ms: latency });

      // Prüfe RAG-Warnungen
      let warning: string | undefined;
      if (ragCitations.length > 0) {
        const warnings = await rag.getWarningsForQuery(prompt);
        if (warnings.length > 0) {
          warning = warnings[0];
        }
      } else if (onlyBrochure && rag.isReady) {
        warning = 'Keine relevanten Inhalte in der Broschüre gefunden';
      }

      const answer = {
        id: `mistral-${Date.now()}`,
        text,
        sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
                 withSources ? [{ seite: Math.floor(Math.random() * 36) + 5, stand: '09/2025' }] : undefined,
        warning,
        meta: {
          provider: 'Mistral',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };

      // Track answer render
      track({
        t: 'answer.render',
        at: Date.now(),
        provider: 'Mistral',
        mode,
        context,
        hasCitations: (answer.sources?.length || 0) > 0,
        citations: answer.sources?.length || 0,
        warning: !!answer.warning
      });

      return answer;

    } catch (err: any) {
      const errorMessage = err.message || 'Unbekannter Fehler beim API-Call';
      setError(errorMessage);
      
      // Track error
      track({
        t: 'answer.error',
        at: Date.now(),
        provider: 'Mistral',
        code: err.status ? `HTTP_${err.status}` : 'NETWORK_ERROR'
      });
      
      return {
        id: `error-${Date.now()}`,
        text: `Fehler beim Mistral API-Call: ${errorMessage}`,
        sources: undefined,
        warning: 'API-Fehler aufgetreten',
        meta: {
          provider: 'Mistral',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      setLoading(false);
    }
  };

  const askClaude = async (
    prompt: string,
    mode: Mode,
    context: ContextType,
    onlyBrochure: boolean,
    withSources: boolean
  ): Promise<Answer> => {
    let ragContext = '';
    let ragCitations: any[] = [];
    
    // RAG-Kontext für "Nur Broschüre" Modus
    if (onlyBrochure && rag.isReady) {
      ragContext = await rag.buildContextForQuery(prompt, 1500);
      const retrievalResult = await rag.retrieveForQuery(prompt, 4);
      ragCitations = retrievalResult.chunks;
    }
    
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    // Fallback to dummy if no API key
    if (!apiKey || apiKey === 'sk-ant-your-anthropic-api-key-here') {
      return {
        id: `dummy-${Date.now()}`,
        text: '(Dummy-Antwort: Kein Anthropic API-Key konfiguriert)',
        sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
                 withSources ? [{ seite: 18, stand: '09/2025' }] : undefined,
        warning: 'Anthropic API-Key fehlt - siehe .env.example',
        meta: {
          provider: 'Claude',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };
    }

    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      // Build system prompt - Claude style: structured & explanatory
      let systemPrompt = 'Du bist ein Förderassistent für Oberösterreich. Antworte strukturiert & erklärend.';
      
      if (onlyBrochure) {
        systemPrompt += ' Verwende nur die bereitgestellten Broschüren-Inhalte. Zitiere Seitenzahlen.';
      }

      // Build user prompt with mode and context
      let userPrompt = ragContext ? 
        `${ragContext}\n\nModus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}` :
        `Modus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}`;

      if (mode === 'Checkliste') {
        userPrompt += '\n\nBitte erstelle eine strukturierte 5-Schritte-Checkliste mit Erklärungen.';
      } else if (mode === 'Vergleich') {
        userPrompt += '\n\nBitte vergleiche die relevanten Aspekte systematisch und erkläre die Unterschiede.';
      } else if (mode === 'E-Mail') {
        userPrompt += '\n\nBitte formuliere eine professionelle, strukturierte E-Mail-Antwort.';
      }

      
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '(Keine Antwort von Claude erhalten)';

    // Track latency
    const latency = performance.now() - startTime;
    track({ t: 'answer.latency', at: Date.now(), provider: 'Claude', ms: latency });

    // Prüfe RAG-Warnungen
    let warning: string | undefined;
    if (ragCitations.length > 0) {
      const warnings = await rag.getWarningsForQuery(prompt);
      if (warnings.length > 0) {
        warning = warnings[0];
      }
    } else if (onlyBrochure && rag.isReady) {
      warning = 'Keine relevanten Inhalte in der Broschüre gefunden';
    }

    const answer = {
      id: `claude-${Date.now()}`,
      text,
      sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
               withSources ? [{ seite: Math.floor(Math.random() * 36) + 5, stand: '09/2025' }] : undefined,
      warning,
      meta: {
        provider: 'Claude',
        mode,
        context,
        timestamp: new Date().toISOString()
      }
    };

    // Track answer render
    track({
      t: 'answer.render',
      at: Date.now(),
      provider: 'Claude',
      mode,
      context,
      hasCitations: (answer.sources?.length || 0) > 0,
      citations: answer.sources?.length || 0,
      warning: !!answer.warning
    });

    return answer;

  } catch (err: any) {
    const errorMessage = err.message || 'Unbekannter Fehler beim API-Call';
    setError(errorMessage);
    
    // Track error
    track({
      t: 'answer.error',
      at: Date.now(),
      provider: 'Claude',
      code: err.status ? `HTTP_${err.status}` : 'NETWORK_ERROR'
    });
    
    return {
      id: `error-${Date.now()}`,
      text: `Fehler beim Claude API-Call: ${errorMessage}`,
      sources: undefined,
      warning: 'API-Fehler aufgetreten',
      meta: {
        provider: 'Claude',
        mode,
        context,
        timestamp: new Date().toISOString()
      }
    };
  } finally {
    setLoading(false);
  }
};

  const askLocal = async (
    prompt: string,
    mode: Mode,
    context: ContextType,
    onlyBrochure: boolean,
    withSources: boolean,
    endpoint: EndpointConfig
  ): Promise<Answer> => {
    let ragContext = '';
    let ragCitations: any[] = [];
    
    // RAG-Kontext für "Nur Broschüre" Modus
    if (onlyBrochure && rag.isReady) {
      ragContext = await rag.buildContextForQuery(prompt, 1500);
      const retrievalResult = await rag.retrieveForQuery(prompt, 4);
      ragCitations = retrievalResult.chunks;
    }
    
    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      // Build system prompt - Local style: strict & fact-oriented
      let systemPrompt = 'Du bist ein Förderassistent für Oberösterreich. Antworte streng faktenorientiert.';
      
      if (onlyBrochure) {
        systemPrompt += ' Verwende nur die bereitgestellten Broschüren-Inhalte. Zitiere Seitenzahlen.';
      }

      // Build user prompt with mode and context
      let userPrompt = ragContext ? 
        `${ragContext}\n\nModus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}` :
        `Modus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}`;

      if (mode === 'Checkliste') {
        userPrompt += '\n\nBitte erstelle eine faktische 5-Schritte-Checkliste.';
      } else if (mode === 'Vergleich') {
        userPrompt += '\n\nBitte vergleiche die Fakten systematisch.';
      } else if (mode === 'E-Mail') {
        userPrompt += '\n\nBitte formuliere eine sachliche E-Mail-Antwort.';
      }

      const url = buildChatCompletionsUrl(endpoint.baseUrl);
      const headers = buildRequestHeaders(endpoint.apiKey);
      const controller = createAbortController(12000);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: endpoint.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Local API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '(Keine Antwort vom lokalen Modell erhalten)';

      // Track latency
      const latency = performance.now() - startTime;
      track({ t: 'answer.latency', at: Date.now(), provider: 'Lokal', ms: latency });

      // Prüfe RAG-Warnungen
      let warning: string | undefined;
      if (ragCitations.length > 0) {
        const warnings = await rag.getWarningsForQuery(prompt);
        if (warnings.length > 0) {
          warning = warnings[0];
        }
      } else if (onlyBrochure && rag.isReady) {
        warning = 'Keine relevanten Inhalte in der Broschüre gefunden';
      }

      const answer = {
        id: `local-${Date.now()}`,
        text,
        sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
                 withSources ? [{ seite: Math.floor(Math.random() * 36) + 5, stand: '09/2025' }] : undefined,
        warning,
        meta: {
          provider: 'Lokal',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };

      // Track answer render
      track({
        t: 'answer.render',
        at: Date.now(),
        provider: 'Lokal',
        mode,
        context,
        hasCitations: (answer.sources?.length || 0) > 0,
        citations: answer.sources?.length || 0,
        warning: !!answer.warning
      });

      return answer;

    } catch (err: any) {
      const errorMessage = err.message || 'Unbekannter Fehler beim API-Call';
      setError(errorMessage);
      
      // Track error
      track({
        t: 'answer.error',
        at: Date.now(),
        provider: 'Lokal',
        code: err.name === 'AbortError' ? 'TIMEOUT' : err.status ? `HTTP_${err.status}` : 'NETWORK_ERROR'
      });
      
      return {
        id: `error-${Date.now()}`,
        text: `Fehler beim lokalen API-Call: ${errorMessage}`,
        sources: undefined,
        warning: 'API-Fehler aufgetreten',
        meta: {
          provider: 'Lokal',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      setLoading(false);
    }
  };

  const askCustom = async (
    prompt: string,
    mode: Mode,
    context: ContextType,
    onlyBrochure: boolean,
    withSources: boolean,
    endpoint: EndpointConfig
  ): Promise<Answer> => {
    let ragContext = '';
    let ragCitations: any[] = [];
    
    // RAG-Kontext für "Nur Broschüre" Modus
    if (onlyBrochure && rag.isReady) {
      ragContext = await rag.buildContextForQuery(prompt, 1500);
      const retrievalResult = await rag.retrieveForQuery(prompt, 4);
      ragCitations = retrievalResult.chunks;
    }
    
    if (!endpoint.apiKey) {
      return {
        id: `dummy-${Date.now()}`,
        text: '(Dummy-Antwort: Kein Custom API-Key konfiguriert)',
        sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
                 withSources ? [{ seite: 22, stand: '09/2025' }] : undefined,
        warning: 'Custom API-Key fehlt - siehe Settings',
        meta: {
          provider: 'Custom',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };
    }

    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      // Build system prompt - Custom style: adaptable
      let systemPrompt = 'Du bist ein Förderassistent für Oberösterreich. Antworte anpassbar je nach Konfiguration.';
      
      if (onlyBrochure) {
        systemPrompt += ' Verwende nur die bereitgestellten Broschüren-Inhalte. Zitiere Seitenzahlen.';
      }

      // Build user prompt with mode and context
      let userPrompt = ragContext ? 
        `${ragContext}\n\nModus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}` :
        `Modus: ${mode}\nKontext: ${context}\n\nFrage: ${prompt}`;

      if (mode === 'Checkliste') {
        userPrompt += '\n\nBitte erstelle eine strukturierte 5-Schritte-Checkliste.';
      } else if (mode === 'Vergleich') {
        userPrompt += '\n\nBitte vergleiche die relevanten Aspekte systematisch.';
      } else if (mode === 'E-Mail') {
        userPrompt += '\n\nBitte formuliere eine professionelle E-Mail-Antwort.';
      }

      const url = buildChatCompletionsUrl(endpoint.baseUrl);
      const headers = buildRequestHeaders(endpoint.apiKey);
      const controller = createAbortController(12000);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: endpoint.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Custom API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '(Keine Antwort vom Custom-Endpoint erhalten)';

      // Track latency
      const latency = performance.now() - startTime;
      track({ t: 'answer.latency', at: Date.now(), provider: 'Custom', ms: latency });

      // Prüfe RAG-Warnungen
      let warning: string | undefined;
      if (ragCitations.length > 0) {
        const warnings = await rag.getWarningsForQuery(prompt);
        if (warnings.length > 0) {
          warning = warnings[0];
        }
      } else if (onlyBrochure && rag.isReady) {
        warning = 'Keine relevanten Inhalte in der Broschüre gefunden';
      }

      const answer = {
        id: `custom-${Date.now()}`,
        text,
        sources: ragCitations.length > 0 ? ragCitations.map(c => ({ seite: c.page, stand: c.stand })) : 
                 withSources ? [{ seite: Math.floor(Math.random() * 36) + 5, stand: '09/2025' }] : undefined,
        warning,
        meta: {
          provider: 'Custom',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };

      // Track answer render
      track({
        t: 'answer.render',
        at: Date.now(),
        provider: 'Custom',
        mode,
        context,
        hasCitations: (answer.sources?.length || 0) > 0,
        citations: answer.sources?.length || 0,
        warning: !!answer.warning
      });

      return answer;

    } catch (err: any) {
      const errorMessage = err.message || 'Unbekannter Fehler beim API-Call';
      setError(errorMessage);
      
      // Track error
      track({
        t: 'answer.error',
        at: Date.now(),
        provider: 'Custom',
        code: err.name === 'AbortError' ? 'TIMEOUT' : err.status ? `HTTP_${err.status}` : 'NETWORK_ERROR'
      });
      
      return {
        id: `error-${Date.now()}`,
        text: `Fehler beim Custom API-Call: ${errorMessage}`,
        sources: undefined,
        warning: 'API-Fehler aufgetreten',
        meta: {
          provider: 'Custom',
          mode,
          context,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async (endpoint: EndpointConfig): Promise<{ ok: boolean; detail: string }> => {
    try {
      const url = buildModelsUrl(endpoint.baseUrl);
      const headers = buildRequestHeaders(endpoint.apiKey);
      const controller = createAbortController(8000);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      if (!response.ok) {
        return { ok: false, detail: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const hasModels = data.data && Array.isArray(data.data) && data.data.length > 0;
      
      if (!hasModels) {
        return { ok: false, detail: 'Keine Modelle verfügbar' };
      }

      return { ok: true, detail: `${data.data.length} Modelle verfügbar` };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { ok: false, detail: 'Timeout (8s)' };
      }
      return { ok: false, detail: err.message || 'Verbindungsfehler' };
    }
  };

  const ask = async (
    provider: Provider,
    prompt: string,
    mode: Mode,
    context: ContextType,
    onlyBrochure: boolean,
    withSources: boolean,
    localEndpoint: EndpointConfig,
    customEndpoint: EndpointConfig
  ): Promise<Answer> => {
    switch (provider) {
      case 'ChatGPT':
        return await askChatGPT(prompt, mode, context, onlyBrochure, withSources);
      case 'Mistral':
        return await askMistral(prompt, mode, context, onlyBrochure, withSources);
      case 'Claude':
        return await askClaude(prompt, mode, context, onlyBrochure, withSources);
      case 'Lokal':
        return await askLocal(prompt, mode, context, onlyBrochure, withSources, localEndpoint);
      case 'Custom':
        return await askCustom(prompt, mode, context, onlyBrochure, withSources, customEndpoint);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  };

  return {
    ask,
    checkConnection,
    loading,
    error
  };
}