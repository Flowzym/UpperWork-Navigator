export type MetricEvent =
  | { t: 'search.submit'; at: number; query: string; results: number }
  | { t: 'search.result.click'; at: number; programId: string; position: number }
  | { t: 'filter.apply'; at: number; groupsActive: number }
  | { t: 'wizard.finish'; at: number; results: number }
  | { t: 'matching.apply'; at: number; topCount: number }
  | { t: 'rag.retrieve'; at: number; q: 'frei' | 'karte' | 'vergleich'; hits: number }
  | {
      t: 'answer.render';
      at: number;
      provider: string;
      mode: string;
      hasCitations: boolean;
      citations: number;
      warning: boolean;
    }
  | { t: 'answer.error'; at: number; provider: string; code: string }
  | { t: 'answer.latency'; at: number; provider: string; ms: number };

export class MetricsStore {
  private events: MetricEvent[] = [];
  private maxEvents = 1000;

  track(e: MetricEvent) {
    this.events.push(e);
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }

  getAll(): MetricEvent[] {
    return [...this.events];
  }

  getSummary() {
    const last10 = this.events.slice(-10);
    const citations = last10
      .filter((e): e is Extract<MetricEvent, { t: 'answer.render' }> => e.t === 'answer.render')
      .map(e => e.citations);
    const p = (arr: number[], q: number) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a, b) => a - b);
      const idx = Math.ceil((q / 100) * s.length) - 1;
      return s[Math.max(0, Math.min(s.length - 1, idx))];
    };
    return {
      lastEvents: last10,
      citationsAvg: citations.length ? citations.reduce((a, b) => a + b, 0) / citations.length : 0,
      citationsP90: p(citations, 90),
    };
  }
}

export const metrics = new MetricsStore();