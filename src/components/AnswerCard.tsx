import React from 'react';
import { Answer } from '../types';
import { Copy, Trash2 } from 'lucide-react';
import SourceBadge from './SourceBadge';
import WarningBanner from './WarningBanner';

interface AnswerCardProps {
  answer: Answer;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  onShowToast: (message: string) => void;
}

export default function AnswerCard({ answer, onCopy, onDelete, onShowToast }: AnswerCardProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer.text);
      onShowToast('Antwort kopiert');
    } catch (err) {
      onCopy(answer.text);
      onShowToast('Antwort kopiert');
    }
  };

  const handleDelete = () => {
    onDelete(answer.id);
    onShowToast('Antwort gelöscht');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'Fakten': return 'Fakten';
      case 'Vergleich': return 'Vergleich';
      case 'Checkliste': return 'Checkliste';
      case 'E-Mail': return 'E-Mail';
      case 'Was-wäre-wenn': return 'Was-wäre-wenn';
      default: return mode;
    }
  };

  const getWarningType = (warning: string): 'paused' | 'ending' => {
    if (warning.includes('endet') || warning.includes('Endet')) {
      return 'ending';
    }
    return 'paused';
  };

  return (
    <div className="answer-card">
      {/* Header */}
      <div className="answer-header">
        <div className="flex items-center justify-between">
          <h3 className="answer-title">Antwort ({getModeLabel(answer.meta.mode)})</h3>
          <div className="answer-meta-info">
            <span className="text-xs text-gray-500">
              von {answer.meta.provider}, Kontext: {answer.meta.context}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {formatTime(answer.meta.timestamp)}
        </div>
      </div>
      
      {/* Warning Banner */}
      {answer.warning && (
        <WarningBanner 
          warning={answer.warning} 
          type={getWarningType(answer.warning)}
        />
      )}
      
      {/* Answer Body */}
      <div className="answer-body">
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {answer.text}
        </div>
        
        {/* Sources */}
        {answer.sources && answer.sources.length > 0 && (
          <div className="mt-3">
            <SourceBadge sources={answer.sources} />
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="answer-footer">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleCopy}
          >
            <Copy size={14} className="mr-1" />
            Kopieren
          </button>
          <button
            className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash2 size={14} className="mr-1" />
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}