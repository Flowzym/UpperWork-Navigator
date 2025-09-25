import React, { useEffect } from 'react';
import { HistoryEntry } from '../types';
import { FileText, CheckSquare, Scale, MessageSquare, Mail, X, Trash2, Clock } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  history: HistoryEntry[];
  onClose: () => void;
  onClearHistory: () => void;
  onShowDetail: (programId: string) => void;
  onShowToast: (message: string) => void;
}

export default function HistoryPanel({
  isOpen,
  history,
  onClose,
  onClearHistory,
  onShowDetail,
  onShowToast
}: HistoryPanelProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const getActionIcon = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'view': return <FileText size={14} />;
      case 'checkliste': return <CheckSquare size={14} />;
      case 'vergleich': return <Scale size={14} />;
      case 'chat': return <MessageSquare size={14} />;
      case 'onepager': return <FileText size={14} />;
      case 'email': return <Mail size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getActionText = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'view': return 'Detail geöffnet';
      case 'checkliste': return 'Checkliste genutzt';
      case 'vergleich': return 'Zum Vergleich hinzugefügt';
      case 'chat': return 'An Chat übergeben';
      case 'onepager': return '1-Pager angesehen';
      case 'email': return 'E-Mail-Text erstellt';
      default: return 'Aktion ausgeführt';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const groupedHistory = history.reduce((groups, entry) => {
    const date = new Date(entry.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Gestern';
    } else {
      groupKey = date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(entry);
    
    return groups;
  }, {} as Record<string, HistoryEntry[]>);

  const handleClearHistory = () => {
    onClearHistory();
    onShowToast('Verlauf gelöscht');
  };

  const handleEntryClick = (entry: HistoryEntry) => {
    onShowDetail(entry.programId);
    onShowToast(`Detail geöffnet: ${entry.programName}`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="history-backdrop" onClick={onClose} />
      
      {/* Panel */}
      <div className="history-panel">
        <div className="history-header">
          <h2 className="history-title">
            <Clock size={20} className="mr-2" />
            Verlauf
          </h2>
          <button className="history-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="history-content">
          {history.length === 0 ? (
            <div className="history-empty">
              <Clock size={48} className="history-empty-icon" />
              <div className="history-empty-title">Noch keine Aktionen</div>
              <div className="history-empty-text">
                Ihre Aktivitäten werden hier angezeigt
              </div>
            </div>
          ) : (
            <div className="history-list">
              {Object.entries(groupedHistory).map(([groupKey, entries]) => (
                <div key={groupKey} className="history-group">
                  <div className="history-group-header">{groupKey}</div>
                  <div className="history-group-entries">
                    {entries.map((entry) => (
                      <button
                        key={entry.id}
                        className="history-entry"
                        onClick={() => handleEntryClick(entry)}
                        title={`Detail öffnen: ${entry.programName}`}
                      >
                        <div className="history-entry-icon">
                          {getActionIcon(entry.type)}
                        </div>
                        <div className="history-entry-content">
                          <div className="history-entry-text">
                            {getActionText(entry.type)}: {entry.programName}
                          </div>
                          <div className="history-entry-time">
                            {formatTime(entry.timestamp)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="history-footer">
          <button
            className="btn btn-ghost"
            onClick={handleClearHistory}
            disabled={history.length === 0}
          >
            <Trash2 size={14} className="mr-1" />
            Alles löschen
          </button>
          <button
            className="btn btn-primary"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
      </div>
    </>
  );
}