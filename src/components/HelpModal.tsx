import React, { useEffect } from 'react';
import { HelpTab } from '../types';
import { X, CheckSquare, RotateCcw } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  activeTab: HelpTab;
  showHelpOnStart: boolean;
  onClose: () => void;
  onTabChange: (tab: HelpTab) => void;
  onToggleShowOnStart: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const tabLabels: Record<HelpTab, string> = {
  'quickstart': 'Schnellstart',
  'tips': 'Tipps',
  'shortcuts': 'Tastenkürzel',
  'changelog': 'Changelog',
  'contact': 'Kontakt'
};

export default function HelpModal({
  isOpen,
  activeTab,
  showHelpOnStart,
  onClose,
  onTabChange,
  onToggleShowOnStart,
  onShowToast
}: HelpModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleToggleShowOnStart = () => {
    onToggleShowOnStart();
    onShowToast(
      `Hilfe wird ${!showHelpOnStart ? 'beim Start angezeigt' : 'nicht mehr beim Start angezeigt'}`,
      'info'
    );
  };

  const handleContactAction = (action: string) => {
    onShowToast(`(Dummy) ${action} - Funktion kommt später`, 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay">
      <div className="help-modal">
        {/* Header */}
        <div className="help-header">
          <h1 className="help-title">Hilfe & Information</h1>
          <button className="help-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="help-tabs">
          {(Object.keys(tabLabels) as HelpTab[]).map((tab) => (
            <button
              key={tab}
              className={`help-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="help-content">
          {activeTab === 'quickstart' && (
            <div className="help-section">
              <h2>Schnellstart</h2>
              <p>In 5 Schritten zu Ihrer passenden Förderung:</p>
              <ol className="help-steps">
                <li><strong>Wizard starten:</strong> Klicken Sie auf "Wizard starten" für eine geführte Auswahl</li>
                <li><strong>Filter nutzen:</strong> Oder verwenden Sie die Filter-Sidebar für gezielte Suche</li>
                <li><strong>Karte öffnen:</strong> Klicken Sie auf "Detail" für vollständige Programm-Informationen</li>
                <li><strong>Checkliste ansehen:</strong> "Checkliste" zeigt Ihnen die 5 Schritte zum Antrag</li>
                <li><strong>Programme vergleichen:</strong> Nutzen Sie "Vergleichen" für eine Gegenüberstellung</li>
              </ol>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="help-section">
              <h2>Tipps & Tricks</h2>
              <ul className="help-tips">
                <li><strong>Filter-Chips:</strong> Klicken Sie auf Chips um Filter zu aktivieren/deaktivieren</li>
                <li><strong>Suche:</strong> Verwenden Sie Synonyme wie "QBN" statt "Qualifizierungsförderung"</li>
                <li><strong>OR/AND-Regel:</strong> Innerhalb einer Gruppe OR, zwischen Gruppen AND</li>
                <li><strong>Warnbanner:</strong> Beachten Sie gelbe/rote Banner bei problematischen Programmen</li>
                <li><strong>Quelle-Badges:</strong> Graue Kästen zeigen Broschüren-Referenzen</li>
                <li><strong>Export-Funktionen:</strong> 1-Pager, Vergleiche und E-Mail-Texte sind verfügbar</li>
                <li><strong>KI-Assistent:</strong> Nutzen Sie verschiedene Provider und Modi für optimale Ergebnisse</li>
                <li><strong>Profil-Matching:</strong> Beschreiben Sie Ihr Profil für personalisierte Empfehlungen</li>
              </ul>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="help-section">
              <h2>Tastenkürzel</h2>
              <div className="help-shortcuts">
                <div className="shortcut-item">
                  <kbd>Esc</kbd>
                  <span>Schließen von Modals und Panels</span>
                </div>
                <div className="shortcut-item">
                  <kbd>?</kbd>
                  <span>Hilfe öffnen</span>
                </div>
                <div className="shortcut-item">
                  <kbd>g</kbd> <kbd>g</kbd>
                  <span>Nach oben scrollen</span>
                </div>
              </div>
              <p className="help-note">
                <em>Hinweis: Tastenkürzel sind derzeit nur teilweise implementiert.</em>
              </p>
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="help-section">
              <h2>Changelog</h2>
              <div className="changelog-entry">
                <h3>v0.1 – Grundgerüst (aktuell)</h3>
                <ul>
                  <li>Grundgerüst mit Suche, Filter und Programmkarten</li>
                  <li>Detailansicht mit 8 strukturierten Sektionen</li>
                  <li>KI-Panel mit Provider-Auswahl (Dummy-Antworten)</li>
                  <li>Vergleichsfunktion für Programme</li>
                  <li>Wizard für geführte Programmauswahl</li>
                  <li>Profil-Matching für personalisierte Empfehlungen</li>
                  <li>Export-Funktionen (1-Pager, Vergleich, E-Mail)</li>
                  <li>Leere-/Fehlerzustände und Tooltips</li>
                  <li>Navigation und Settings-System</li>
                </ul>
              </div>
              <div className="changelog-entry">
                <h3>v0.2 – Geplant</h3>
                <ul>
                  <li>Echte KI-Integration</li>
                  <li>PDF-Export-Funktionalität</li>
                  <li>Erweiterte Suchfunktionen</li>
                  <li>Benutzerkonten und Merkzettel</li>
                  <li>Mobile App</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="help-section">
              <h2>Kontakt</h2>
              <div className="contact-info">
                <div className="contact-item">
                  <h3>Beratung & Support</h3>
                  <p>
                    <strong>E-Mail:</strong> foerdernavigator@example.org<br />
                    <strong>Telefon:</strong> +43 732 123456 (Dummy)
                  </p>
                </div>
                
                <div className="contact-item">
                  <h3>Fehler melden</h3>
                  <p>Haben Sie einen Fehler gefunden oder Verbesserungsvorschläge?</p>
                  <div className="contact-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleContactAction('GitHub Issues')}
                    >
                      GitHub Issues
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleContactAction('Feedback senden')}
                    >
                      Feedback senden
                    </button>
                  </div>
                </div>

                <div className="contact-item">
                  <h3>Über das Projekt</h3>
                  <p>
                    Der Förder-Navigator OÖ ist ein Projekt zur Vereinfachung der 
                    Suche nach passenden Förderprogrammen in Oberösterreich.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="help-footer">
          <div className="help-footer-left">
            <button
              className={`toggle-btn ${showHelpOnStart ? 'active' : ''}`}
              onClick={handleToggleShowOnStart}
            >
              <CheckSquare size={14} className="mr-1" />
              Als Startoverlay zeigen
            </button>
          </div>
          <div className="help-footer-right">
            <button className="btn btn-primary" onClick={onClose}>
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}