import React from 'react';
import Tooltip from './Tooltip';

interface MiniKPIProps {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'error';
  tooltip?: string;
  className?: string;
}

export default function MiniKPI({ 
  label, 
  value, 
  suffix = '', 
  tone = 'neutral', 
  tooltip,
  className = '' 
}: MiniKPIProps) {
  const getToneStyles = () => {
    switch (tone) {
      case 'ok':
        return 'border-green-200 bg-green-50';
      case 'warn':
        return 'border-orange-200 bg-orange-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getValueColor = () => {
    switch (tone) {
      case 'ok':
        return 'text-green-700';
      case 'warn':
        return 'text-orange-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-900';
    }
  };

  const kpiContent = (
    <div className={`mini-kpi ${getToneStyles()} ${className}`}>
      <div className={`mini-kpi-value ${getValueColor()}`}>
        {typeof value === 'number' ? value.toFixed(1) : value}{suffix}
      </div>
      <div className="mini-kpi-label">
        {label}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        {kpiContent}
      </Tooltip>
    );
  }

  return kpiContent;
}