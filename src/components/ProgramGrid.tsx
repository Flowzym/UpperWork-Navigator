import React from 'react';
import { Program } from '../types';
import { ProgramCardV2 } from './cards/ProgramCardV2';

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
      {programs.map((program: Program) => (
        <ProgramCardV2
          key={program.id}
          p={program}
          onOpen={(id) => onShowDetail(id)}
        />
      ))}
    </div>
  );
}