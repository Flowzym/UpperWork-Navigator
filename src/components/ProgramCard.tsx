import React, { useState } from 'react';
import { Program } from '../types';
import { CheckCircle, Clock, Pause, X, MapPin, Euro, MoreHorizontal, FileText, CheckSquare, BarChart3, MessageSquare, Mail, Star } from 'lucide-react';
import OverflowMenu from './OverflowMenu';
import Tooltip from './Tooltip';
import { useRef } from 'react';

interface ProgramCardProps {
  program: Program;
  onShowDetail: (programId: string) => void;
  onToggleCompare: (programId: string) => void;
  onToggleStar: (programId: string) => void;
  onOpenChat: (programId: string) => void;
  onShowOnePager: (program: Program) => void;
  onShowEmail: (program: Program) => void;
  onShowToast: (message: string) => void;
  isCompared: boolean;
  isStarred: boolean;
  onShowChecklist: (program: Program) => void;
}

export default function ProgramCard({ 
  program, 
  onShowDetail, 
  onToggleCompare, 
  onToggleStar,
  onOpenChat,
  onShowOnePager,
  onShowEmail,
  onShowToast,
  isCompared,
  isStarred,
  onShowChecklist
}: ProgramCardProps) {
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLButtonElement>(null);

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

  const overflowItems = [
    {
      label: 'Vergleichen',
      icon: <BarChart3 size={14} />,
      checked: isCompared,
      onClick: () => onToggleCompare(program.id)
    },
    {
      label: 'An Chat',
      icon: <MessageSquare size={14} />,
      onClick: () => onOpenChat(program.id)
    },
    {
      label: '1-Pager',
      icon: <FileText size={14} />,
      onClick: () => onShowOnePager(program)
    },
    {
      label: 'E-Mail-Text',
      icon: <Mail size={14} />,
      onClick: () => onShowEmail(program)
    },
    {
      label: 'Merken',
      icon: isStarred ? <Star size={14} fill="currentColor" /> : <Star size={14} />,
      checked: isStarred,
      onClick: () => onToggleStar(program.id)
    }
  ];

  return (
    <div className={`program-card ${isCompared ? 'compared' : ''}`}>
      {/* Header */}
      <div className="card-header">
        <div className="flex-1">
          <h3 className="card-title">{program.name}</h3>
          <div className="card-meta">
            {getStatusBadge()}
            <span className="portal-badge">{program.portal}</span>
          </div>
        </div>
        
        <div className="relative">
          <Tooltip content="Weitere Aktionen">
            <button
              ref={overflowRef}
              className="overflow-trigger"
              onClick={() => setShowOverflow(!showOverflow)}
            >
              <MoreHorizontal size={16} />
            </button>
          </Tooltip>
          
          <OverflowMenu
            items={overflowItems}
            isOpen={showOverflow}
            onClose={() => setShowOverflow(false)}
            anchorRef={overflowRef}
          />
        </div>
      </div>

      {/* Description */}
      <div className="card-teaser">
        <p>{program.teaser}</p>
      </div>

      {/* Tags */}
      <div className="card-tags">
        {program.themen.slice(0, 4).map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        {program.themen.length > 4 && (
          <span className="tag-more">+{program.themen.length - 4}</span>
        )}
      </div>

      {/* Info Row */}
      <div className="card-info">
        <span className="info-item">
          <Euro size={12} className="mr-1" />
          {program.foerderhoehe[0]?.max ? `bis ${program.foerderhoehe[0].max.toLocaleString()}€` : `${program.foerderhoehe[0]?.quote || 0}%`}
        </span>
        <span className="info-item">
          <MapPin size={12} className="mr-1" />
          {program.region}
        </span>
        <span className="info-item">
          <Clock size={12} className="mr-1" />
          {program.frist.typ === 'laufend' ? 'Laufend' : program.frist.datum}
        </span>
      </div>

      {/* Primary Actions */}
      <div className="card-actions">
        <Tooltip content="Detailansicht öffnen">
          <button
            className="btn btn-primary flex-1"
            onClick={() => onShowDetail(program.id)}
          >
            <FileText size={14} className="mr-1" />
            Detail
          </button>
        </Tooltip>
        <Tooltip content="5-Schritte-Checkliste anzeigen">
          <button
            className="btn btn-secondary flex-1"
            onClick={() => onShowChecklist(program)}
          >
            <CheckSquare size={14} className="mr-1" />
            Checkliste
          </button>
        </Tooltip>
      </div>
    </div>
  );
}