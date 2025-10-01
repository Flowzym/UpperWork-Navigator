import { render, screen } from '@testing-library/react';
import { ProgramCardV2 } from '../ProgramCardV2';
import type { Program } from '@/types';

const base: Program = { id: 'p1', title: 'Testprogramm' };

it('rendert Titel, aber keine leeren Felder', () => {
  render(<ProgramCardV2 p={base} />);
  expect(screen.getByText('Testprogramm')).toBeInTheDocument();
  expect(screen.queryByText(/Zielgruppe/)).toBeNull();
  expect(screen.queryByText(/Voraussetzungen/)).toBeNull();
});

it('zeigt deduplizierte Badges', () => {
  render(<ProgramCardV2 p={{ ...base, foerderart: 'kurs', antragsweg: 'eams', frist: 'laufend' }} />);
  expect(screen.getByText(/Art:/)).toBeInTheDocument();
  expect(screen.getByText(/Antrag:/)).toBeInTheDocument();
  expect(screen.getByText(/Frist:/)).toBeInTheDocument();
});

it('rendert Listenfelder nur wenn befüllt', () => {
  render(<ProgramCardV2 p={{ ...base, zielgruppe: ['Jugendliche'], voraussetzungen: ['Wohnsitz OÖ'] }} />);
  expect(screen.getByText(/Zielgruppe/)).toBeInTheDocument();
  expect(screen.getByText(/Voraussetzungen/)).toBeInTheDocument();
});
