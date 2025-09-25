export type Note = { id:string; label:string; programId:string; page:number };

const RX = /\[#(?<pid>[A-Za-z0-9_-]+)\s+S\.(?<page>\d+)\]/g;

export function extractCitations(text: string){
  const seen = new Map<string, Note>();
  const cleaned = text.replace(RX, (_m, _1, _2, _o, _s, g:any) => {
    const id = `${g.pid}-${g.page}`;
    if (!seen.has(id)) {
      seen.set(id, { 
        id, 
        label:`[#${g.pid} S.${g.page}]`, 
        programId:g.pid, 
        page:Number(g.page) 
      });
    }
    return `<sup class="cite" data-cite="${id}">${seen.get(id)!.label}</sup>`;
  });
  
  return { 
    cleanedHtml: cleaned, 
    notes: [...seen.values()] 
  };
}