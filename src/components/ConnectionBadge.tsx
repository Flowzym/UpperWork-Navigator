import React from 'react';

interface ConnectionBadgeProps {
  isConnected: boolean;
  error?: string;
  className?: string;
}

export default function ConnectionBadge({ isConnected, error, className = '' }: ConnectionBadgeProps) {
  if (isConnected) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-green-700 font-medium">Verbunden</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-red-700 font-medium">Nicht verbunden</span>
      </div>
      {error && (
        <div className="text-xs text-red-600 ml-4">
          {error}
        </div>
      )}
    </div>
  );
}