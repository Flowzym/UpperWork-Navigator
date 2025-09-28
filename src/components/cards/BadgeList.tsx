import { Program } from '../../types/program';

export function BadgeList({p}:{p:Program}) {
  const items = [
    p.foerderart && { k:'Art', v:p.foerderart },
    p.antragsweg && { k:'Antrag', v:p.antragsweg },
    p.frist && { k:'Frist', v:p.frist },
  ].filter(Boolean) as {k:string; v:string}[];
  
  if (items.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({k,v}) => (
        <span key={k+v} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border border-gray-300 bg-gray-50">
          <span className="opacity-60 mr-1">{k}:</span> {v}
        </span>
      ))}
    </div>
  );
}