import { render, screen } from '@testing-library/react';
import { ProgramCardV2 } from '../ProgramCardV2';
import type { Program } from '../../../types/program';

const base: Program = { id: 'p1', title: 'Testprogramm' };

it('rendert Pflichttitel und keine leeren Felder', () => {
  render(<ProgramCardV2 p={base} />);
  expect(screen.getByText('Testprogramm')).toBeInTheDocument();
  // Felder ohne Werte sollen NICHT erscheinen:
  expect(screen.queryByText(/Zielgruppe:/)).toBeNull();
  expect(screen.queryByText(/Voraussetzungen:/)).toBeNull();
});

it('zeigt Badges nur bei Daten', () => {
  render(<ProgramCardV2 p={{...base, frist:'laufend', antragsweg:'eAMS', foerderart:'kurskosten'}} />);
  expect(screen.getByText(/Frist:/)).toBeInTheDocument();
  expect(screen.getByText(/Antrag:/)).toBeInTheDocument();
  expect(screen.getByText(/Art:/)).toBeInTheDocument();
});

it('rendert Listenfelder nur wenn befüllt', () => {
  render(<ProgramCardV2 p={{...base, zielgruppe:['Jugendliche'], voraussetzungen:['Wohnsitz OÖ']}} />);
  expect(screen.getByText(/Zielgruppe/)).toBeInTheDocument();
  expect(screen.getByText(/Voraussetzungen/)).toBeInTheDocument();
});