import { Program } from '../../types';
import { hasList, hasText } from '../../lib/ui/guards';
import { prettyFoerderart, prettyAntragsweg } from '../../lib/text/normalizeProgram';
import { FieldRow } from './FieldRow';

export function ProgramCardV2({ p, onOpen }:{ p: Program; onOpen?: (id:string)=>void }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-shadow bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-tight text-gray-900">{p.name}</h3>
          {hasText(p.portal) && <div className="text-sm text-gray-500">{p.portal}</div>}
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
      
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {prettyFoerderart(p.foerderart)?.[0] && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border border-gray-300 bg-gray-50"><span className="opacity-60 mr-1">Art:</span>{prettyFoerderart(p.foerderart)![0]}</span>
        )}
        {prettyAntragsweg(p.antragsweg)?.[0] && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border border-gray-300 bg-gray-50"><span className="opacity-60 mr-1">Antrag:</span>{prettyAntragsweg(p.antragsweg)![0]}</span>
        )}
        {p.frist && typeof p.frist === 'object' && p.frist.typ && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border border-gray-300 bg-gray-50"><span className="opacity-60 mr-1">Frist:</span>{p.frist.typ}</span>
        )}
      </div>
      
      {hasText(p.teaser) && (
        <p className="mt-3 text-sm leading-relaxed text-gray-700 line-clamp-3">{p.teaser}</p>
      )}
      
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {p.region && <FieldRow label="Region" value={p.region} />}
        {hasList(p.zielgruppe) && (
          <FieldRow label="Zielgruppe" value={[...p.zielgruppe!.slice(0,3), p.zielgruppe!.length>3?`+${p.zielgruppe!.length-3} mehr`:null].filter(Boolean).join(', ')} />
        )}
        {hasList(p.voraussetzungen) && (
          <FieldRow label="Voraussetzungen" value={[...p.voraussetzungen!.slice(0,3), p.voraussetzungen!.length>3?`+${p.voraussetzungen!.length-3} mehr`:null].filter(Boolean).join(', ')} />
        )}
      </div>
    </div>
  );
}