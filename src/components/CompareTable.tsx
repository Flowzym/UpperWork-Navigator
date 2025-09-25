import React from 'react';
import { Program } from '../types';

interface CompareTableProps {
  programs: Program[];
}

export default function CompareTable({ programs }: CompareTableProps) {
  // Limit to first 4 programs
  const displayPrograms = programs.slice(0, 4);
  const hasMorePrograms = programs.length > 4;

  const getStatusBadge = (program: Program) => {
    switch (program.status) {
      case 'aktiv':
        return <span className="status-badge status-active">✓ Aktiv</span>;
      case 'endet_am':
        return <span className="status-badge status-ending">⏰ Endet {program.frist.datum}</span>;
      case 'ausgesetzt':
        return <span className="status-badge status-paused">⏸ Ausgesetzt</span>;
      case 'entfallen':
        return <span className="status-badge status-cancelled">✕ Entfallen</span>;
      default:
        return null;
    }
  };

  const getAntragswegLabel = (antragsweg: string) => {
    switch (antragsweg) {
      case 'eams': return 'eAMS';
      case 'land_ooe_portal': return 'Land OÖ';
      case 'wko_verbund': return 'WKO';
      case 'traeger_direkt': return 'Träger';
      default: return antragsweg;
    }
  };

  const getFoerderartLabels = (foerderart: string[]) => {
    return foerderart.map(art => {
      switch (art) {
        case 'kurskosten': return 'Kurskosten';
        case 'personalkosten': return 'Personalkosten';
        case 'beihilfe': return 'Beihilfe';
        case 'beratung': return 'Beratung';
        default: return art;
      }
    }).join(', ');
  };

  const getFoerderhoehe = (program: Program) => {
    const foerder = program.foerderhoehe[0];
    if (!foerder) return 'Nicht angegeben';
    
    let text = '';
    if (foerder.quote) text += `bis ${foerder.quote}%`;
    if (foerder.max) text += ` / max ${foerder.max.toLocaleString()}€`;
    if (foerder.deckel) text += ` / Deckel ${foerder.deckel.toLocaleString()}€`;
    
    return text || 'Nicht angegeben';
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatBulletList = (items: string[], maxItems: number = 2) => {
    const displayItems = items.slice(0, maxItems);
    return (
      <div className="space-y-1">
        {displayItems.map((item, index) => (
          <div key={index} className="text-sm flex items-start gap-1">
            <span className="text-gray-400 mt-1">•</span>
            <span title={item}>{truncateText(item, 80)}</span>
          </div>
        ))}
        {items.length > maxItems && (
          <div className="text-xs text-gray-500">+{items.length - maxItems} weitere</div>
        )}
      </div>
    );
  };

  if (displayPrograms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Keine Programme zum Vergleich ausgewählt
      </div>
    );
  }

  return (
    <div className="compare-table-container">
      {hasMorePrograms && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm text-orange-800">
            <strong>Hinweis:</strong> Nur die ersten 4 Programme werden angezeigt ({programs.length} ausgewählt)
          </div>
        </div>
      )}

      <div className="compare-table-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-table-header-row">Kriterium</th>
              {displayPrograms.map((program) => (
                <th key={program.id} className="compare-table-header-col">
                  {program.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Name + Status */}
            <tr className="compare-table-row">
              <td className="compare-table-row-header">Status</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  {getStatusBadge(program)}
                </td>
              ))}
            </tr>

            {/* Zielgruppe */}
            <tr className="compare-table-row compare-table-row-alt">
              <td className="compare-table-row-header">Zielgruppe</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  {formatBulletList(program.zielgruppe)}
                </td>
              ))}
            </tr>

            {/* Förderart */}
            <tr className="compare-table-row">
              <td className="compare-table-row-header">Förderart</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  <div className="text-sm">{getFoerderartLabels(program.foerderart)}</div>
                </td>
              ))}
            </tr>

            {/* Förderhöhe */}
            <tr className="compare-table-row compare-table-row-alt">
              <td className="compare-table-row-header">Förderhöhe</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  <div className="text-sm font-medium text-green-700">
                    {getFoerderhoehe(program)}
                  </div>
                </td>
              ))}
            </tr>

            {/* Voraussetzungen */}
            <tr className="compare-table-row">
              <td className="compare-table-row-header">Voraussetzungen</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  {formatBulletList(program.voraussetzungen, 3)}
                </td>
              ))}
            </tr>

            {/* Frist */}
            <tr className="compare-table-row compare-table-row-alt">
              <td className="compare-table-row-header">Frist</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  <div className="text-sm">
                    {program.frist.typ === 'laufend' ? 'Laufend' : program.frist.datum}
                  </div>
                </td>
              ))}
            </tr>

            {/* Antragsweg */}
            <tr className="compare-table-row">
              <td className="compare-table-row-header">Antragsweg</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  <div className="text-sm font-medium text-blue-700">
                    {getAntragswegLabel(program.antragsweg)}
                  </div>
                </td>
              ))}
            </tr>

            {/* Region */}
            <tr className="compare-table-row compare-table-row-alt">
              <td className="compare-table-row-header">Region</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  <div className="text-sm">{program.region}</div>
                </td>
              ))}
            </tr>

            {/* Passt wenn */}
            <tr className="compare-table-row">
              <td className="compare-table-row-header">Passt wenn...</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  {formatBulletList(program.passt_wenn, 2)}
                </td>
              ))}
            </tr>

            {/* Passt nicht wenn */}
            <tr className="compare-table-row compare-table-row-alt">
              <td className="compare-table-row-header">Passt nicht wenn...</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  {formatBulletList(program.passt_nicht_wenn, 2)}
                </td>
              ))}
            </tr>

            {/* Quelle */}
            <tr className="compare-table-row">
              <td className="compare-table-row-header">Quelle</td>
              {displayPrograms.map((program) => (
                <td key={program.id} className="compare-table-cell">
                  <div className="text-xs text-gray-500">
                    S. {program.quelle.seite} · {program.quelle.stand}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}