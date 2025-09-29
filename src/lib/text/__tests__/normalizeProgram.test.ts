import { prettyFoerderart, prettyAntragsweg, canonicalRegion, cleanText, normalizeProgram } from '../normalizeProgram';

it('dedupliziert foerderart und mappt Synonyme', () => {
  expect(prettyFoerderart(['Kurs', 'kurskosten', 'Kurskosten'])).toEqual(['kurskosten']);
});

it('mappt antragsweg lesbar', () => {
  expect(prettyAntragsweg('traeger_direkt')?.[0]).toBe('Träger direkt');
  expect(prettyAntragsweg('eams')?.[0]).toBe('eAMS');
});

it('kanonisiert Region', () => {
  expect(canonicalRegion('gültig in Oberösterreich')).toBe('Oberösterreich');
  expect(canonicalRegion('bundesweit')).toBe('Österreichweit');
  expect(canonicalRegion('gültig in OÖ')).toBe('Oberösterreich');
});

it('cleanText entfernt OCR-Noise', () => {
  expect(cleanText('Scanne den Link13 Foo Bar')).toBe('Foo Bar');
});

it('normalizeProgram kürzt Summary und bereinigt Listen', () => {
  const program = normalizeProgram({
    id: '1',
    title: 'Test',
    summary: 'Dies ist ein sehr langer Text '.repeat(10),
    foerderart: ['Kurs', 'kurs'],
    antragsweg: 'eams',
    zielgruppe: ['  Beschäftigte  ', 'Beschäftigte'],
    voraussetzungen: ['Scanne den Link12 Nachweis', 'Wohnsitz OÖ'],
  });

  expect(program.summary?.endsWith('…')).toBe(true);
  expect(program.foerderart).toBe('kurskosten');
  expect(program.antragsweg).toBe('eAMS');
  expect(program.zielgruppe).toEqual(['Beschäftigte']);
  expect(program.voraussetzungen).toEqual(['Nachweis', 'Wohnsitz OÖ']);
});
