import React, { useState, useEffect } from 'react';
import { useMetrics } from '../metrics/useMetrics';
import MiniKPI from './MiniKPI';
import Sparkline from './Sparkline';
import Modal from './Modal';

interface MetricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

type MetricsTab = 'search' | 'rag' | 'providers';

const tabLabels: Record<MetricsTab, string> = {
  search: 'Suche',
  rag: 'RAG',
  providers: 'KI-Provider'
};

export default function MetricsPanel({ isOpen, onClose, onShowToast }: MetricsPanelProps) {
  const [activeTab, setActiveTab] = useState<MetricsTab>('search');
  const { getKPIs, getSeries, reset, getAll } = useMetrics();
  const [kpis, setKPIs] = useState(getKPIs());
  const [series, setSeries] = useState(getSeries());

  // Aktualisiere Metriken alle 2 Sekunden wenn Panel offen
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setKPIs(getKPIs());
      setSeries(getSeries());
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, getKPIs, getSeries]);

  const handleReset = () => {
    reset();
    setKPIs(getKPIs());
    setSeries(getSeries());
    onShowToast('Metriken zurückgesetzt', 'success');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTone = (value: number, thresholds: { ok: number; warn: number }) => {
    if (value >= thresholds.ok) return 'ok';
    if (value >= thresholds.warn) return 'warn';
    return 'error';
  };

  const getClickPositionStats = () => {
    const clickEvents = getAll().filter(e => e.t === 'search.result.click') as Array<Extract<import('../metrics/metricsStore').MetricEvent, { t: 'search.result.click' }>>;
    const positions = clickEvents.reduce((acc, e) => {
      const pos = e.position <= 3 ? e.position.toString() : '4+';
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(positions)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 4);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📊 Metriken (lokal)" maxWidth="max-w-6xl">
      <div className="metrics-panel">
        {/* Header */}
        <div className="metrics-header">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">
                Lokale Qualitätsmetriken · {getAll().length} Events erfasst
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleReset}
            >
              🔄 Zurücksetzen
            </button>
          </div>

          {/* Tabs */}
          <div className="metrics-tabs">
            {(Object.keys(tabLabels) as MetricsTab[]).map((tab) => (
              <button
                key={tab}
                className={`metrics-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="metrics-content">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="metrics-section">
              <div className="metrics-kpi-grid">
                <MiniKPI
                  label="CTR Suche"
                  value={kpis.searchCTR}
                  suffix="%"
                  tone={getTone(kpis.searchCTR, { ok: 20, warn: 10 })}
                  tooltip="Click-Through-Rate: Klicks / Submits"
                />
                <MiniKPI
                  label="Submits"
                  value={series.searchSubmits.length}
                  tooltip="Anzahl Suchanfragen (letzte 20)"
                />
                <MiniKPI
                  label="Ø Treffer"
                  value={series.searchSubmits.length > 0 ? 
                    series.searchSubmits.reduce((a, b) => a + b, 0) / series.searchSubmits.length : 0}
                  tooltip="Durchschnittliche Trefferanzahl pro Suche"
                />
              </div>

              <div className="metrics-charts">
                <div className="metrics-chart">
                  <h4 className="metrics-chart-title">Suchergebnisse (letzte 20)</h4>
                  <Sparkline 
                    data={series.searchSubmits} 
                    color="#3b82f6"
                  />
                </div>

                <div className="metrics-table">
                  <h4 className="metrics-table-title">Klick-Positionen</h4>
                  <div className="metrics-table-content">
                    {getClickPositionStats().map(([position, count]) => (
                      <div key={position} className="metrics-table-row">
                        <span className="metrics-table-label">Position {position}:</span>
                        <span className="metrics-table-value">{count} Klicks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RAG Tab */}
          {activeTab === 'rag' && (
            <div className="metrics-section">
              <div className="metrics-kpi-grid">
                <MiniKPI
                  label="Ø Citations"
                  value={kpis.ragCoverageAvg}
                  tooltip="Durchschnittliche Anzahl Quellenangaben pro Antwort"
                  tone={getTone(kpis.ragCoverageAvg, { ok: 2, warn: 1 })}
                />
                <MiniKPI
                  label="Nicht belegt"
                  value={kpis.notGroundedRate}
                  suffix="%"
                  tooltip="Anteil Antworten ohne Broschüren-Quellen"
                  tone={getTone(100 - kpis.notGroundedRate, { ok: 80, warn: 60 })}
                />
                <MiniKPI
                  label="Warnungen"
                  value={kpis.warningRate}
                  suffix="%"
                  tooltip="Anteil Antworten mit Warnbannern"
                  tone={getTone(100 - kpis.warningRate, { ok: 90, warn: 70 })}
                />
              </div>

              <div className="metrics-charts">
                <div className="metrics-chart">
                  <h4 className="metrics-chart-title">RAG-Treffer (letzte 20)</h4>
                  <Sparkline 
                    data={series.ragHits} 
                    color="#059669"
                  />
                </div>

                <div className="metrics-info">
                  <h4 className="metrics-info-title">RAG-Status</h4>
                  <div className="metrics-info-content">
                    <div className="text-sm text-gray-600">
                      {kpis.ragCoverageAvg > 0 ? (
                        <span className="text-green-700">✓ RAG-System aktiv</span>
                      ) : (
                        <span className="text-orange-700">⚠️ Keine RAG-Treffer</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Tipp: "Nur Broschüre" aktivieren für Citations
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Providers Tab */}
          {activeTab === 'providers' && (
            <div className="metrics-section">
              <div className="metrics-provider-grid">
                {Object.entries(kpis.providerLatency).map(([provider, latency]) => (
                  <div key={provider} className="metrics-provider-card">
                    <h4 className="metrics-provider-title">{provider}</h4>
                    
                    <div className="metrics-provider-kpis">
                      <MiniKPI
                        label="p50 Latenz"
                        value={latency.p50}
                        suffix="ms"
                        tone={getTone(3000 - latency.p50, { ok: 2000, warn: 1000 })}
                        tooltip="50. Perzentil der Antwortzeiten"
                        className="mini"
                      />
                      <MiniKPI
                        label="p90 Latenz"
                        value={latency.p90}
                        suffix="ms"
                        tone={getTone(5000 - latency.p90, { ok: 3000, warn: 2000 })}
                        tooltip="90. Perzentil der Antwortzeiten"
                        className="mini"
                      />
                      <MiniKPI
                        label="Fehlerrate"
                        value={kpis.providerErrorRate[provider] || 0}
                        suffix="%"
                        tone={getTone(100 - (kpis.providerErrorRate[provider] || 0), { ok: 95, warn: 85 })}
                        tooltip="Anteil fehlgeschlagener Requests"
                        className="mini"
                      />
                    </div>

                    {/* Latency Sparkline */}
                    {series.latencyByProvider[provider] && (
                      <div className="metrics-provider-chart">
                        <div className="text-xs text-gray-600 mb-1">Latenz-Verlauf</div>
                        <Sparkline 
                          data={series.latencyByProvider[provider]} 
                          height={30}
                          color={latency.p90 > 3000 ? '#dc2626' : latency.p90 > 2000 ? '#d97706' : '#059669'}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mode Share */}
              <div className="metrics-mode-share">
                <h4 className="metrics-section-title">Modus-Verteilung</h4>
                <div className="metrics-mode-bars">
                  {Object.entries(kpis.modeShare).map(([mode, percentage]) => (
                    <div key={mode} className="metrics-mode-bar">
                      <div className="metrics-mode-label">{mode}</div>
                      <div className="metrics-mode-progress">
                        <div 
                          className="metrics-mode-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="metrics-mode-value">{percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Errors */}
              {series.lastErrors.length > 0 && (
                <div className="metrics-errors">
                  <h4 className="metrics-section-title">Letzte Fehler</h4>
                  <div className="metrics-errors-table">
                    {series.lastErrors.map((error, index) => (
                      <div key={index} className="metrics-error-row">
                        <span className="metrics-error-time">{formatTime(error.at)}</span>
                        <span className="metrics-error-provider">{error.provider}</span>
                        <span className="metrics-error-code">{error.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}