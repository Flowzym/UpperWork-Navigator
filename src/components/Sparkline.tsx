import React from 'react';

interface SparklineProps {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
}

export default function Sparkline({ 
  data, 
  height = 40, 
  color = '#3b82f6',
  className = '' 
}: SparklineProps) {
  if (data.length === 0) {
    return (
      <div className={`sparkline-empty ${className}`} style={{ height }}>
        <div className="sparkline-no-data">Keine Daten</div>
      </div>
    );
  }

  const max = Math.max(...data, 1); // Mindestens 1 für Division
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  return (
    <div className={`sparkline ${className}`} style={{ height }}>
      <div className="sparkline-bars">
        {data.map((value, index) => {
          const normalizedHeight = ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className="sparkline-bar"
              style={{
                height: `${Math.max(2, normalizedHeight)}%`,
                backgroundColor: color,
                opacity: 0.7 + (normalizedHeight / 100) * 0.3 // Dynamische Opacity
              }}
              title={`${value} (Position ${index + 1})`}
            />
          );
        })}
      </div>
      
      {/* Min/Max Labels */}
      <div className="sparkline-labels">
        <span className="sparkline-label-min">{min}</span>
        <span className="sparkline-label-max">{max}</span>
      </div>
    </div>
  );
}