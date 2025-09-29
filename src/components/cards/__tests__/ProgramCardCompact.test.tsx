import { render, screen } from '@testing-library/react';
import { ProgramCardCompact } from '../ProgramCardCompact';
import type { Program } from '../../../types';

const base: Program = { id: 'p1', name: 'Testprogramm' };

it('kompakt: zeigt nichts Leeres', () => {
  render(<ProgramCardCompact p={base} />);
  // keine leeren Labels ohne Werte
  expect(screen.queryByText(/Zielgruppe:/)).toBeNull();
  expect(screen.queryByText(/Voraussetzungen:/)).toBeNull();
});

it('kompakt: zeigt Badges bei Daten', () => {
  render(<ProgramCardCompact p={{...base, frist:'laufend', antragsweg:'eAMS', foerderart:'beratung', region:'OÖ'}} />);
  expect(screen.getByText(/Art:/)).toBeInTheDocument();
  expect(screen.getByText(/Antrag:/)).toBeInTheDocument();
  expect(screen.getByText(/Frist:/)).toBeInTheDocument();
  expect(screen.getByText('OÖ')).toBeInTheDocument();
});