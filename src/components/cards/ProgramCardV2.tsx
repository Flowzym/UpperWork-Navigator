import type { Program } from '@/types/program';
import { hasList, hasText } from '@/lib/ui/guards';
import { FieldRow } from './FieldRow';
import { prettyFoerderart, prettyAntragsweg, asText } from '@/lib/text/normalizeProgram';

function fmtList(v?: string[], limit=3): string | undefined {
  if (!Array.isArray(v) || v.length===0) return undefined;
  const shown = v.slice(0, limit).join(', ');
  const more = v.length - limit;
  return more > 0 ? `${shown}, +${more} mehr` : shown;
}

export function ProgramCardV2({ p, onOpen }:{ p: Program; onOpen?: (id:string)=>void }) {
  const art = prettyFoerderart(p.foerderart)?.[0];
  const antrag = prettyAntragsweg(p.antragsweg)?.[0];
  const frist = asText(p.frist);

  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-tight text-gray-900">{p.title || p.name}</h3>
          {hasText(p.provider) && (
            <div className="text-sm text-gray-500 mt-1">{p.provider}</div>
          )}
        </div>
        {onOpen && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={()=>onOpen(p.id)}
          >
            Details
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {typeof art === 'string' && !!art && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border border-gray-300 bg-gray-50">
            <span className="opacity-60 mr-1">Art:</span>{art}
          </span>
        )}
        {typeof antrag === 'string' && !!antrag && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border border-gray-300 bg-gray-50">
            <span className="opacity-60 mr-1">Antrag:</span>{antrag}
          </span>
        )}
        {typeof frist === 'string' && !!frist && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border border-gray-300 bg-gray-50">
            <span className="opacity-60 mr-1">Frist:</span>{frist}
          </span>
        )}
      </div>

      {hasText(p.summary || p.teaser) && (
        <p className="mt-3 text-sm leading-relaxed text-gray-700 line-clamp-3">
          {p.summary || p.teaser}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {hasText(p.region) && <FieldRow label="Region" value={p.region} />}
        {hasList(p.zielgruppe) && <FieldRow label="Zielgruppe" value={fmtList(p.zielgruppe!)} />}
        {hasList(p.voraussetzungen) && <FieldRow label="Voraussetzungen" value={fmtList(p.voraussetzungen!)} />}
      </div>
    </div>
  );
}