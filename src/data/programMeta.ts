import meta from './programMeta.json';

export const programMeta = meta as Record<string, {
  name: string; 
  pages: [number, number]; 
  stand: string; 
  status: 'aktiv'|'ausgesetzt'|'endet_am'|'entfallen';
}>;

export function getProgramMetaById(id: string) {
  return programMeta[id];
}

export function getAllProgramMeta() {
  return Object.entries(programMeta).map(([id, data]) => ({ id, ...data }));
}

export function getProgramsByPage(page: number) {
  return Object.entries(programMeta)
    .filter(([id, data]) => page >= data.pages[0] && page <= data.pages[1])
    .map(([id, data]) => ({ id, ...data }));
}