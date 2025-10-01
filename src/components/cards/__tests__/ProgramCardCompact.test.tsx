import { render, screen } from '@testing-library/react';
import { ProgramCardCompact } from '../ProgramCardCompact';
import type { Program } from '@/types';

const base: Program = { id: 'p1', title: 'Testprogramm' };

it('kompakt: zeigt nichts Leeres', () => {
  render(<ProgramCardCompact p={base} />);
  expect(screen.queryByText(/Zielgruppe/)).toBeNull();
  expect(screen.queryByText(/Voraussetzungen/)).toBeNull();
});

it('kompakt: zeigt normalisierte Badges', () => {
  render(<ProgramCardCompact p={{ ...base, foerderart: 'beratung', antragsweg: 'e-ams', frist: 'laufend', region: 'gültig in OÖ' }} />);
  expect(screen.getByText(/Art:/)).toBeInTheDocument();
  expect(screen.getByText(/Antrag:/)).toHaveTextContent(/eAMS/);
  expect(screen.getByText(/Frist:/)).toBeInTheDocument();
  expect(screen.getByText('Oberösterreich')).toBeInTheDocument();
});
