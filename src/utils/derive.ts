import { Program } from '../types';

export function getBudgetCategory(program: Program): '≤1k'|'1–5k'|'>5k'|null {
  let maxAmount = 0;
  
  program.foerderhoehe.forEach(foerder => {
    if (foerder.deckel && foerder.deckel > maxAmount) {
      maxAmount = foerder.deckel;
    }
    if (foerder.max && foerder.max > maxAmount) {
      maxAmount = foerder.max;
    }
  });
  
  if (maxAmount === 0) return null;
  
  if (maxAmount <= 1000) return '≤1k';
  if (maxAmount <= 5000) return '1–5k';
  return '>5k';
}