import React from 'react';
import { BarChart3, MessageSquare, Upload, Trash2 } from 'lucide-react';
import EmptyState from './EmptyState';

interface CompareTrayProps {
  compareIds: string[];
  onShowToast: (message: string) => void;
  onClearCompare: () => void;
  onOpenChat: () => void;
  onOpenCompare: () => void;
}

export default function CompareTray({ compareIds, onShowToast, onClearCompare, onOpenChat, onOpenCompare }: CompareTrayProps) {
  if (compareIds.length === 0) {
    return (
      <div className="compare-tray-empty">
        <div className="text-center py-3">
          <span className="text-sm text-gray-500">
            Noch keine Programme zum Vergleich gewählt
          </span>
        </div>
      </div>
    );
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'compare':
        onOpenCompare();
        break;
      case 'chat':
        onOpenChat();
        onShowToast(`${compareIds.length} Programme an Chat gesendet`);
        break;
      case 'export':
        onShowToast(`Export kommt im nächsten Schritt (${compareIds.length} Programme)`);
        break;
    }
  };

  return (
    <div className="compare-tray">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {compareIds.length}
            </div>
            <span className="font-medium text-gray-900">
              {compareIds.length} {compareIds.length === 1 ? 'Programm' : 'Programme'} zum Vergleich
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={() => handleAction('compare')}
            disabled={compareIds.length < 2}
          >
            <BarChart3 size={14} className="mr-1" />
            Vergleich öffnen
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleAction('chat')}
          >
            <MessageSquare size={14} className="mr-1" />
            An Chat
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleAction('export')}
          >
            <Upload size={14} className="mr-1" />
            Export
          </button>
          <button
            className="btn btn-ghost"
            onClick={onClearCompare}
          >
            <Trash2 size={14} className="mr-1" />
            Leeren
          </button>
        </div>
      </div>
    </div>
  );
}