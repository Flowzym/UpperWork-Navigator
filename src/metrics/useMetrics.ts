import { MetricEvent, metrics } from './metricsStore';

export function useMetrics() {
  const track = (event: MetricEvent) => {
    metrics.track(event);
  };

  const getKPIs = () => {
    return metrics.kpis();
  };

  const getSeries = () => {
    return metrics.series();
  };

  const reset = () => {
    metrics.reset();
  };

  const getAll = () => {
    return metrics.getAll();
  };

  return {
    track,
    getKPIs,
    getSeries,
    reset,
    getAll
  };
}