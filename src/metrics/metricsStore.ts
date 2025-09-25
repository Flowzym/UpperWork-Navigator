export type MetricEvent =
  | { t: 'search.submit'; at: number; query: string; results: number }
  | { t: 'search.result.click'; at: number; programId: string; position: number }
  | { t: 'filter.apply'; at: number; groupsActive: number }
  | { t: 'wizard.finish'; at: number; results: number }
  | { t: 'matching.apply'; at: number; topCount: number }
  | { t: 'rag.retrieve'; at: number; q: 'frei' | 'karte' | 'vergleich'; hits: number }
  | { t: 'answer.render'; at: number; provider: string; mode: string; context: string; hasCitations: boolean; citations: number; warning: boolean }
  | { t: 'answer.error'; at: number; provider: string; code: string }
  | { t: 'answer.latency'; at: number; provider: string; ms: number };

class MetricsStore {
  private events: MetricEvent[] = [];
  private maxEvents = 1000; // Limit für Memory-Management

  reset(): void {
    this.events = [];
  }

  track(event: MetricEvent): void {
    this.events.push(event);
    
    // Memory-Management: Behalte nur die letzten N Events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getAll(): MetricEvent[] {
    return [...this.events];
  }

  // Hilfsfunktionen für Aggregationen
  private getRecentEvents(hours: number = 24): MetricEvent[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.events.filter(e => e.at >= cutoff);
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  kpis(): {
    searchCTR: number;
    ragCoverageAvg: number;
    notGroundedRate: number;
    providerLatency: Record<string, { p50: number; p90: number }>;
    providerErrorRate: Record<string, number>;
    warningRate: number;
    modeShare: Record<string, number>;
  } {
    const recent = this.getRecentEvents();
    
    // Search CTR
    const searchSubmits = recent.filter(e => e.t === 'search.submit').length;
    const searchClicks = recent.filter(e => e.t === 'search.result.click').length;
    const searchCTR = searchSubmits > 0 ? (searchClicks / searchSubmits) * 100 : 0;

    // RAG Coverage
    const answerRenders = recent.filter(e => e.t === 'answer.render') as Array<Extract<MetricEvent, { t: 'answer.render' }>>;
    const totalCitations = answerRenders.reduce((sum, e) => sum + e.citations, 0);
    const ragCoverageAvg = answerRenders.length > 0 ? totalCitations / answerRenders.length : 0;

    // Not Grounded Rate
    const notGroundedCount = answerRenders.filter(e => !e.hasCitations).length;
    const notGroundedRate = answerRenders.length > 0 ? (notGroundedCount / answerRenders.length) * 100 : 0;

    // Provider Latency
    const providerLatency: Record<string, { p50: number; p90: number }> = {};
    const latencyEvents = recent.filter(e => e.t === 'answer.latency') as Array<Extract<MetricEvent, { t: 'answer.latency' }>>;
    
    const providerLatencies = latencyEvents.reduce((acc, e) => {
      if (!acc[e.provider]) acc[e.provider] = [];
      acc[e.provider].push(e.ms);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(providerLatencies).forEach(([provider, latencies]) => {
      providerLatency[provider] = {
        p50: this.percentile(latencies, 50),
        p90: this.percentile(latencies, 90)
      };
    });

    // Provider Error Rate
    const providerErrorRate: Record<string, number> = {};
    const errorEvents = recent.filter(e => e.t === 'answer.error') as Array<Extract<MetricEvent, { t: 'answer.error' }>>;
    
    const providerCounts = answerRenders.reduce((acc, e) => {
      acc[e.provider] = (acc[e.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const providerErrors = errorEvents.reduce((acc, e) => {
      acc[e.provider] = (acc[e.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.keys(providerCounts).forEach(provider => {
      const errors = providerErrors[provider] || 0;
      const total = providerCounts[provider] + errors;
      providerErrorRate[provider] = total > 0 ? (errors / total) * 100 : 0;
    });

    // Warning Rate
    const warningCount = answerRenders.filter(e => e.warning).length;
    const warningRate = answerRenders.length > 0 ? (warningCount / answerRenders.length) * 100 : 0;

    // Mode Share
    const modeShare: Record<string, number> = {};
    const totalModeEvents = answerRenders.length;
    
    answerRenders.forEach(e => {
      modeShare[e.mode] = (modeShare[e.mode] || 0) + 1;
    });

    Object.keys(modeShare).forEach(mode => {
      modeShare[mode] = totalModeEvents > 0 ? (modeShare[mode] / totalModeEvents) * 100 : 0;
    });

    return {
      searchCTR: Math.round(searchCTR * 10) / 10,
      ragCoverageAvg: Math.round(ragCoverageAvg * 10) / 10,
      notGroundedRate: Math.round(notGroundedRate * 10) / 10,
      providerLatency,
      providerErrorRate,
      warningRate: Math.round(warningRate * 10) / 10,
      modeShare
    };
  }

  series(): {
    searchSubmits: number[];
    ragHits: number[];
    latencyByProvider: Record<string, number[]>;
    lastErrors: Array<{ at: number; provider: string; code: string }>;
  } {
    const recent = this.getRecentEvents();
    
    // Search submits over time (last 20 data points)
    const searchSubmits = recent
      .filter(e => e.t === 'search.submit')
      .slice(-20)
      .map(e => (e as Extract<MetricEvent, { t: 'search.submit' }>).results);

    // RAG hits over time (last 20 data points)
    const ragHits = recent
      .filter(e => e.t === 'rag.retrieve')
      .slice(-20)
      .map(e => (e as Extract<MetricEvent, { t: 'rag.retrieve' }>).hits);

    // Latency by provider (last 10 per provider)
    const latencyByProvider: Record<string, number[]> = {};
    const latencyEvents = recent.filter(e => e.t === 'answer.latency') as Array<Extract<MetricEvent, { t: 'answer.latency' }>>;
    
    latencyEvents.forEach(e => {
      if (!latencyByProvider[e.provider]) latencyByProvider[e.provider] = [];
      latencyByProvider[e.provider].push(e.ms);
    });

    // Keep only last 10 per provider
    Object.keys(latencyByProvider).forEach(provider => {
      latencyByProvider[provider] = latencyByProvider[provider].slice(-10);
    });

    // Last errors (last 5)
    const lastErrors = recent
      .filter(e => e.t === 'answer.error')
      .slice(-5)
      .map(e => {
        const errorEvent = e as Extract<MetricEvent, { t: 'answer.error' }>;
        return {
          at: errorEvent.at,
          provider: errorEvent.provider,
          code: errorEvent.code
        };
      });

    return {
      searchSubmits,
      ragHits,
      latencyByProvider,
      lastErrors
    };
  }
}

// Singleton-Instanz
export const metrics = new MetricsStore();