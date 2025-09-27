import React from 'react';

interface SegmentControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function SegmentControl<T extends string>({ 
  options, 
  value, 
  onChange, 
  className = '' 
}: SegmentControlProps<T>) {
  return (
    <div 
      className={`segment-control ${className}`}
      role="radiogroup"
      aria-label="Auswahl"
    >
      {options.map((option) => (
        <button
          key={option}
          className={`segment-option ${value === option ? 'active' : ''}`}
          onClick={() => onChange(option)}
          role="radio"
          aria-checked={value === option}
          aria-label={option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}