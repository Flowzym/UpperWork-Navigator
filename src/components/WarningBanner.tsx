import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WarningBannerProps {
  warning: string;
  type?: 'paused' | 'ending';
}

export default function WarningBanner({ warning, type = 'paused' }: WarningBannerProps) {
  return (
    <div className={`warning-banner warning-banner-${type}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} />
        <span className="font-medium">{warning}</span>
      </div>
    </div>
  );
}