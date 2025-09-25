import React from 'react';
import { Program } from '../types';
import { Star, CheckCircle, Clock, Pause, X } from 'lucide-react';

interface BookmarkBarProps {
  starredPrograms: Program[];
  onShowDetail: (programId: string) => void;
  onShowAllBookmarks: () => void;
  onShowToast: (message: string) => void;
}

export default function BookmarkBar({ 
  starredPrograms, 
  onShowDetail, 
  onShowAllBookmarks, 
  onShowToast 
}: BookmarkBarProps) {
  if (starredPrograms.length === 0) {
    return (
      <div className="bookmark-bar">
        <div className="bookmark-empty">
          <Star size={16} className="bookmark-empty-icon" />
          <span className="bookmark-empty-text">Noch keine Programme gemerkt</span>
        </div>
      </div>
    );
  }

  const visiblePrograms = starredPrograms.slice(0, 6);
  const hasMore = starredPrograms.length > 6;

  const getStatusBadge = (program: Program) => {
    switch (program.status) {
      case 'aktiv':
        return <CheckCircle size={12} className="bookmark-status bookmark-status-active" />;
      case 'endet_am':
        return <Clock size={12} className="bookmark-status bookmark-status-ending" />;
      case 'ausgesetzt':
        return <Pause size={12} className="bookmark-status bookmark-status-paused" />;
      case 'entfallen':
        return <X size={12} className="bookmark-status bookmark-status-cancelled" />;
      default:
        return null;
    }
  };

  const handlePillClick = (programId: string, programName: string) => {
    onShowDetail(programId);
    onShowToast(`Detail geöffnet: ${programName}`);
  };

  const handleShowAll = () => {
    onShowAllBookmarks();
    onShowToast(`${starredPrograms.length} gemerkte Programme angezeigt`);
  };

  return (
    <div className="bookmark-bar">
      <div className="bookmark-content">
        <div className="bookmark-label">
          <Star size={16} className="bookmark-icon" fill="currentColor" />
          <span className="bookmark-text">Gemerkt:</span>
        </div>
        
        <div className="bookmark-pills">
          {visiblePrograms.map((program) => (
            <button
              key={program.id}
              className="bookmark-pill"
              onClick={() => handlePillClick(program.id, program.name)}
              title={`Detail öffnen: ${program.name}`}
            >
              <span className="bookmark-pill-name">{program.name}</span>
              {getStatusBadge(program)}
            </button>
          ))}
          
          {hasMore && (
            <button
              className="bookmark-pill bookmark-pill-more"
              onClick={handleShowAll}
              title={`Alle ${starredPrograms.length} gemerkten Programme anzeigen`}
            >
              +{starredPrograms.length - 6} weitere
            </button>
          )}
        </div>
        
        <button
          className="bookmark-show-all"
          onClick={handleShowAll}
        >
          Alle ansehen
        </button>
      </div>
    </div>
  );
}