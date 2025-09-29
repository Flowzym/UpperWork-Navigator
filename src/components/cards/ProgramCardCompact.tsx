import type { Program } from '@/types/program';
import { hasList, hasText } from '@/lib/ui/guards';
import { prettyFoerderart, prettyAntragsweg, asText } from '@/lib/text/normalizeProgram';

export function ProgramCardCompact({ p, onOpen }:{ p: Program; onOpen?: (id:string)=>void }) {
  const foerderart = prettyFoerderart(p.foerderart)?.[0];
  const antrag = prettyAntragsweg(p.antragsweg)?.[0];
  const frist = asText(p.frist);

  const limitList = (items?: string[]) => {
    if (!Array.isArray(items) || items.length === 0) return undefined;
    const first = items.slice(0, 3);
    if (items.length > 3) first.push(`+${items.length - 3} mehr`);
    return first.join(', ');
  };

  return (
    <div className="rounded-xl border border-gray-200 px-3 py-2 hover:shadow-sm transition-shadow bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate text-gray-900">{p.title}</div>
          {hasText(p.provider) && (
            <div className="text-xs text-gray-500 truncate">{p.provider}</div>
          )}
        </div>
        {onOpen && (
          <button
            className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={()=>onOpen(p.id)}
          >
            Öffnen
          </button>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
        {typeof foerderart === 'string' && foerderart && (
          <span className="border border-gray-300 bg-gray-50 rounded-full px-2 py-0.5">
            Art: {foerderart}
          </span>
        )}
        {typeof antrag === 'string' && antrag && (
          <span className="border border-gray-300 bg-gray-50 rounded-full px-2 py-0.5">
            Antrag: {antrag}
          </span>
        )}
        {typeof frist === 'string' && frist && (
          <span className="border border-gray-300 bg-gray-50 rounded-full px-2 py-0.5">
            Frist: {frist}
          </span>
        )}
        {typeof p.region === 'string' && p.region && (
          <span className="border border-gray-300 bg-gray-50 rounded-full px-2 py-0.5">
            {p.region}
          </span>
        )}
        {typeof p.region === 'string' && p.region && (
          <span className="border border-gray-300 bg-gray-50 rounded-full px-2 py-0.5">
            {p.region}
          </span>
        )}
      </div>
      {hasText(p.summary) && (
        <p className="mt-1.5 text-xs leading-snug text-gray-700 line-clamp-2">{p.summary}</p>
      )}
      <div className="mt-1.5 space-y-0.5 text-xs">
        {hasList(p.zielgruppe) && (
          <div>
            <span className="text-gray-500">Zielgruppe: </span>
            <span className="text-gray-700">{limitList(p.zielgruppe)}</span>
          </div>
        )}
        {hasList(p.voraussetzungen) && (
          <div>
            <span className="text-gray-500">Voraussetzungen: </span>
            <span className="text-gray-700">{limitList(p.voraussetzungen)}</span>
          </div>
        )}
      </div>
    </div>
  );
}