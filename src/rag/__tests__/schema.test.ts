import {
  migrateStats,
  migrateProgramMeta,
  migrateChunks,
  validateStats,
  validateMeta,
  validateChunks
} from '../schema';

it('migrates snake_case to camelCase', () => {
  const s = migrateStats({ build_id: 'x', built_at: 't', pages: 1, programs: 2, chunks: 3, sections_count: { a: 1 } });
  expect(s.buildId).toBe('x');
  expect(s.sectionsCount?.a).toBe(1);
});

it('migrates programMeta start_page/end_page', () => {
  const m = migrateProgramMeta([{ id: 'a', title: 'T', start_page: 10, end_page: 12 }]);
  expect(m[0].startPage).toBe(10);
  expect(m[0].pages).toEqual([10, 12]);
});

it('migrates chunks program_id + seite→page', () => {
  const c = migrateChunks([{ id: 'x', program_id: 'p1', section: 'allgemein', seite: 5, text: 't' }]);
  expect(c[0].programId).toBe('p1');
  expect(c[0].page).toBe(5);
});

it('validates presence of required fields', () => {
  expect(validateStats({} as any).length).toBeGreaterThan(0);
  expect(validateMeta([{ id: 'x', programId: 'p', title: 't' }]).length).toBe(0);
  expect(validateChunks([{ id: 'x', programId: 'p', section: 's', text: 't' }]).length).toBe(0);
});
