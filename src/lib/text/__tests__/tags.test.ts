import { shortTag, normalizeList } from '@/lib/text/normalizeProgram';

describe('shortTag', () => {
  it('filtert Absätze & Sätze', () => {
    expect(shortTag('AK OÖ, Mitglieder')).toBe('AK OÖ, Mitglieder');
    expect(shortTag('Wer wird gefördert?')).toBeUndefined();
    expect(shortTag('Das ist ein sehr sehr sehr sehr langer Eintrag der abgelehnt wird.')).toBeUndefined();
  });
});

describe('normalizeList', () => {
  it('dedupliziert und filtert', () => {
    const out = normalizeList(['AK OÖ Mitglieder', 'Wer wird gefördert?', 'AK OÖ Mitglieder']);
    expect(out).toEqual(['AK OÖ Mitglieder']);
  });
});
