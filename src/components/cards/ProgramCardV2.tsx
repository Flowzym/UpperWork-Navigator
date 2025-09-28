import { Program } from '../../types/program';
import { hasList, hasText } from '../../lib/ui/guards';
import { FieldRow } from './FieldRow';
import { BadgeList } from './BadgeList';

export function ProgramCardV2({ p, onOpen }:{ p: Program; onOpen?: (id:string)=>void }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-shadow bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-tight text-gray-900">{p.title}</h3>
          {hasText(p.provider) && <div className="text-sm text-gray-500">{p.provider}</div>}
        </div>
        {onOpen && (
          <button 
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors" 
            onClick={()=>onOpen(p.id)}
          >
            Details
          </button>
        )}
      </div>
      
      <div className="mt-3">
        <BadgeList p={p} />
      </div>
      
      {hasText(p.summary) && (
        <p className="mt-3 text-sm leading-relaxed text-gray-700">{p.summary}</p>
      )}
      
      <div className="mt-3 space-y-1.5">
        <FieldRow label="Region" value={p.region} />
        {hasList(p.zielgruppe) && <FieldRow label="Zielgruppe" value={p.zielgruppe!.join(', ')} />}
        {hasList(p.voraussetzungen) && <FieldRow label="Voraussetzungen" value={p.voraussetzungen!.join(', ')} />}
      </div>
    </div>
  );
}