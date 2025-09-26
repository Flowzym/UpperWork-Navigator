import React from 'react';
import { Program } from '../types';
import ProgramCard from './ProgramCard';

interface ProgramGridProps {
  programs: Program[];
  onShowDetail: (programId: string) => void;
  onToggleCompare: (programId: string) => void;
  onToggleStar: (programId: string) => void;
  onOpenChat: (programId: string) => void;
  onShowOnePager: (program: Program) => void;
  onShowEmail: (program: Program) => void;
  onShowChecklist: (program: Program) => void;
  onShowToast: (message: string) => void;
  comparedPrograms: string[];
  starredPrograms: string[];
}

export default function ProgramGrid({
  programs,
  onShowDetail,
  onToggleCompare,
  onToggleStar,
  onOpenChat,
  onShowOnePager,
  onShowEmail,
  onShowChecklist,
  onShowToast,
  comparedPrograms,
  starredPrograms
}: ProgramGridProps) {
  return (
    <div className="program-grid">
      {programs.map((program) => (
        <ProgramCard
          key={program.id}
          program={program}
          onShowDetail={onShowDetail}
          onToggleCompare={onToggleCompare}
          onToggleStar={onToggleStar}
          onOpenChat={onOpenChat}
          onShowOnePager={onShowOnePager}
          onShowEmail={onShowEmail}
          onShowChecklist={onShowChecklist}
          onShowToast={onShowToast}
          isCompared={comparedPrograms.includes(program.id)}
          isStarred={starredPrograms.includes(program.id)}
        />
      ))}
    </div>
  );
}