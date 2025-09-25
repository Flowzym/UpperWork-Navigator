import React from 'react';

interface SourceBadgeProps {
  sources: { seite: number; stand: string }[];
  maxVisible?: number;
}

export default function SourceBadge({ sources, maxVisible = 3 }: SourceBadgeProps) {
  if (sources.length === 0) return null;

  const visibleSources = sources.slice(0, maxVisible);
  const hasMore = sources.length > maxVisible;

  return (
    <div className="source-badges">
      {visibleSources.map((source, index) => (
        <div key={index} className="source-badge">
          <strong>Quelle:</strong> Broschüre OÖ 2025 · S. {source.seite} · Stand {source.stand}
        </div>
      ))}
      {hasMore && (
        <div className="source-badge source-badge-more">
          +{sources.length - maxVisible} weitere Quellen
        </div>
      )}
    </div>
  );
}