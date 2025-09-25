export function detectInjection(q: string): boolean {
  const s = q.toLowerCase();
  const hits = [
    'ignore previous instructions','act as','system prompt',
    'jailbreak','do anything now','developer mode',
    'override','forget all rules','///','base64, http'
  ];
  return hits.some(h => s.includes(h));
}