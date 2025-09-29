import type { Program } from '@/types/program';
import { hasList, hasText } from '@/lib/ui/guards';
import { FieldRow } from './FieldRow';
import { normalizeProgram, prettyFoerderart, prettyAntragsweg } from '@/lib/text/normalizeProgram';

export function ProgramCardV2({ p, onOpen }:{ p: Program; onOpen?: (id:string)=>void }) {
  const program = normalizeProgram(p);
  const foerderart = prettyFoerderart(program.foerderart)?.[0];
  const antrag = prettyAntragsweg(program.antragsweg)?.[0];

  const limitList = (items?: string[]) => {
    if (!Array.isArray(items) || items.length === 0) return undefined;
    const first = items.slice(0, 3);
    if (items.length > 3) first.push(`+${items.length - 3} mehr`);
    return first.join(', ');
  };

  return (
    <div className="rounded-2xl border p-4 hover:shadow-sm transition min-h-[220px] bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-tight text-gray-900">{program.title}</h3>
          {hasText(program.provider) && <div className="text-sm text-gray-500">{program.provider}</div>}
        </div>
        {onOpen && (
          <button
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={()=>onOpen(program.id)}
          >
            Details
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {foerderart && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border">
            <span className="opacity-60 mr-1">Art:</span>{foerderart}
          </span>
        )}
        {antrag && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border">
            <span className="opacity-60 mr-1">Antrag:</span>{antrag}
          </span>
        )}
        {program.frist && (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 border">
            <span className="opacity-60 mr-1">Frist:</span>{program.frist}
          </span>
        )}
      </div>

      {hasText(program.summary) && (
        <p className="mt-3 text-sm leading-relaxed line-clamp-3 text-gray-700">{program.summary}</p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {hasText(program.region) && <FieldRow label="Region" value={program.region} />}
        {hasList(program.zielgruppe) && <FieldRow label="Zielgruppe" value={limitList(program.zielgruppe)} />}
        {hasList(program.voraussetzungen) && <FieldRow label="Voraussetzungen" value={limitList(program.voraussetzungen)} />}
      </div>
    </div>
  );
}