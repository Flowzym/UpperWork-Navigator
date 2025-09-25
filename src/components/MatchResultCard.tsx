import React from 'react';
import { Program } from '../types';
import { FileText, CheckSquare, BarChart3, MessageSquare, Mail, CheckCircle, Clock, Pause, X } from 'lucide-react';
import ExportPreviewModal from './ExportPreviewModal';

interface MatchResult {
  programId: string;
  score: number;
  reasons: string[];
}

interface MatchResultCardProps {
  program: Program;
  matchResult: MatchResult;
  onShowDetail: (programId: string) => void;
  onShowChecklist: (program: Program) => void;
  onToggleCompare: (programId: string) => void;
  onOpenChat: (programId: string) => void;
  onShowToast: (message: string) => void;
  isCompared: boolean;
}

export default function MatchResultCard({
  program,
  matchResult,
  onShowDetail,
  onShowChecklist,
  onToggleCompare,
  onOpenChat,
  onShowToast,
  isCompared
}: MatchResultCardProps) {
  const [showExportPreview, setShowExportPreview] = React.useState(false);

  const getStatusBadge = () => {
    switch (program.status) {
      case 'aktiv':
        return <span className="status-badge status-active"><CheckCircle size={12} className="mr-1" />Aktiv</span>;
      case 'endet_am':
        return <span className="status-badge status-ending"><Clock size={12} className="mr-1" />Endet {program.frist.datum}</span>;
      case 'ausgesetzt':
        return <span className="status-badge status-paused"><Pause size={12} className="mr-1" />Ausgesetzt</span>;
      case 'entfallen':
        return <span className="status-badge status-cancelled"><X size={12} className="mr-1" />Entfallen</span>;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 70) return 'text-green-700';
    if (score >= 40) return 'text-orange-700';
    return 'text-gray-600';
  };

  const handleShowEmailExport = () => {
    setShowExportPreview(true);
  };

  const handleCloseExport = () => {
    setShowExportPreview(false);
  };

  return (
    <>
      <div className="match-result-card">
      {/* Score Header */}
      <div className="match-score-header">
        <div className="match-score-bar">
          <div 
            className={`match-score-fill ${getScoreColor(matchResult.score)}`}
            style={{ width: `${matchResult.score}%` }}
          />
        </div>
        <div className={`match-score-text ${getScoreTextColor(matchResult.score)}`}>
          {matchResult.score}/100
        </div>
      </div>

      {/* Program Info */}
      <div className="match-program-info">
        <h3 className="match-program-title">{program.name}</h3>
        <div className="match-program-meta">
          {getStatusBadge()}
          <span className="portal-badge">{program.portal}</span>
        </div>
      </div>

      {/* Match Reasons */}
      <div className="match-reasons">
        <h4 className="match-reasons-title">Warum passt das Programm?</h4>
        <ul className="match-reasons-list">
          {matchResult.reasons.slice(0, 3).map((reason, index) => (
            <li key={index} className="match-reason-item">
              <span className="match-reason-icon">✓</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="match-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onShowDetail(program.id)}
        >
          <FileText size={14} className="mr-1" />
          Detail
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onShowChecklist(program)}
        >
          <CheckSquare size={14} className="mr-1" />
          Checkliste
        </button>
        <button
          className={`btn btn-sm ${isCompared ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onToggleCompare(program.id)}
        >
          <BarChart3 size={14} className="mr-1" />
          {isCompared ? 'Im Vergleich' : 'Vergleichen'}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onOpenChat(program.id)}
        >
          <MessageSquare size={14} className="mr-1" />
          Chat
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleShowEmailExport}
        >
          <Mail size={14} className="mr-1" />
          E-Mail
        </button>
      </div>
    </div>

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={showExportPreview}
        onClose={handleCloseExport}
        type="email"
        program={program}
        onShowToast={onShowToast}
      />
    </>
  );
}