import type { Program } from '@/types/program';
import { hasList, hasText } from '@/lib/ui/guards';
import { FieldRow } from './FieldRow';
import { prettyFoerderart, prettyAntragsweg, asText, normalizeProgram } from '@/lib/text/normalizeProgram';

function fmtList(v?: string[], limit=3): string | undefined {
  if (!Array.isArray(v) || v.length===0) return undefined;
  const shown = v.slice(0, limit).join(', ');
  const more = v.length - limit;
  return more > 0 ? `${shown}, +${more} mehr` : shown;
}

export function ProgramCardV2({ p:raw, onOpen }:{ p: Program; onOpen?: (id:string)=>void }) {
  const p = normalizeProgram(raw);
  const art = prettyFoerderart(p.foerderart)?.[0];
  const antrag = prettyAntragsweg(p.antragsweg)?.[0];
  const frist = asText(p.frist);

  return (
    <div className="rounded-2xl border p-4 hover:shadow-sm transition min-h-[220px] bg-white">
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

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {typeof art === 'string' && !!art && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border">
            <span className="opacity-60 mr-1">Art:</span>{art}
          </span>
        )}
        {typeof antrag === 'string' && !!antrag && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border">
            <span className="opacity-60 mr-1">Antrag:</span>{antrag}
          </span>
        )}
        {typeof frist === 'string' && !!frist && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border">
            <span className="opacity-60 mr-1">Frist:</span>{frist}
          </span>
        )}
      </div>

      {hasText(p.summary) && (
        <p className="mt-3 text-sm leading-relaxed line-clamp-3 text-gray-700">{p.summary}</p>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {hasText(p.region) && <FieldRow label="Region" value={p.region} />}
        {hasList(p.zielgruppe) && <FieldRow label="Zielgruppe" value={fmtList(p.zielgruppe!)} />}
        {hasList(p.voraussetzungen) && <FieldRow label="Voraussetzungen" value={fmtList(p.voraussetzungen!)} />}
      </div>
    </div>
  );
}