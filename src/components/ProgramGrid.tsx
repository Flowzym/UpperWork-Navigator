import React from 'react';
import { useState } from 'react';
import { Program } from '../types';
import { normalizeProgram } from '../lib/text/normalizeProgram';
import { ProgramCardV2, ProgramCardCompact } from './cards';

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
  const [compact, setCompact] = useState(false);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Programme ({programs.length})</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Kompakt</label>
          <input
            type="checkbox"
            checked={compact}
            onChange={(e) => setCompact(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {programs.map((raw: Program) => {
          const program = normalizeProgram(raw);
          return compact
            ? <ProgramCardCompact key={program.id} p={program} onOpen={(id) => onShowDetail(id)} />
            : <ProgramCardV2 key={program.id} p={program} onOpen={(id) => onShowDetail(id)} />;
        })}
      </div>
    </div>
  );
}