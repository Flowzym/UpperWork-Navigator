import React, { useState } from 'react';
import { Provider, SettingsState } from '../types';
import { X, RotateCcw, Bot, Zap, Settings as SettingsIcon, Palette } from 'lucide-react';
import { providerPresets } from '../presets/providerPresets';
import SegmentControl from './SegmentControl';
import ConnectionBadge from './ConnectionBadge';
import { useChatApi } from '../hooks/useChatApi';

interface SettingsDrawerProps {
  isOpen: boolean;
  settings: SettingsState;
  onClose: () => void;
  onSettingsChange: (updates: Partial<SettingsState>) => void;
  onResetSettings: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

interface LocalSettingsProps {
  settings: SettingsState;
  onSettingsChange: (updates: Partial<SettingsState>) => void;
  onTestConnection: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  testing: boolean;
}

function LocalSettings({ settings, onSettingsChange, onTestConnection, onShowToast, testing }: LocalSettingsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="settings-label">Base-URL</label>
        <input
          type="text"
          value={settings.localEndpoint.baseUrl}
          onChange={(e) => onSettingsChange({
            localEndpoint: { ...settings.localEndpoint, baseUrl: e.target.value }
          })}
          placeholder="http://localhost:11434/v1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="settings-label">Model</label>
        <input
          type="text"
          value={settings.localEndpoint.model}
          onChange={(e) => onSettingsChange({
            localEndpoint: { ...settings.localEndpoint, model: e.target.value }
          })}
          placeholder="llama3.1:8b-instruct"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="settings-label">API-Key (optional)</label>
        <input
          type="password"
          value={settings.localEndpoint.apiKey || ''}
          onChange={(e) => onSettingsChange({
            localEndpoint: { ...settings.localEndpoint, apiKey: e.target.value || undefined }
          })}
          placeholder="Leer lassen für Ollama"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onTestConnection}
          disabled={testing}
        >
          {testing ? '⏳ Teste...' : '🔌 Verbindung testen'}
        </button>
        
        <ConnectionBadge
          isConnected={settings.localConnection.isConnected}
          error={settings.localConnection.error}
        />
      </div>
      
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
        💡 Lokales Modell verarbeitet Anfragen ohne externe Übertragung, sofern Base-URL lokal ist.
      </div>
    </div>
  );
}

function CustomSettings({ settings, onSettingsChange, onTestConnection, onShowToast, testing }: LocalSettingsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="settings-label">Base-URL</label>
        <input
          type="text"
          value={settings.customEndpoint.baseUrl}
          onChange={(e) => onSettingsChange({
            customEndpoint: { ...settings.customEndpoint, baseUrl: e.target.value }
          })}
          placeholder="https://your-endpoint.example.com/v1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="settings-label">Model</label>
        <input
          type="text"
          value={settings.customEndpoint.model}
          onChange={(e) => onSettingsChange({
            customEndpoint: { ...settings.customEndpoint, model: e.target.value }
          })}
          placeholder="custom-model"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="settings-label">API-Key</label>
        <input
          type="password"
          value={settings.customEndpoint.apiKey || ''}
          onChange={(e) => onSettingsChange({
            customEndpoint: { ...settings.customEndpoint, apiKey: e.target.value || undefined }
          })}
          placeholder="sk-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onTestConnection}
          disabled={testing}
        >
          {testing ? '⏳ Teste...' : '🔌 Verbindung testen'}
        </button>
        
        <ConnectionBadge
          isConnected={settings.customConnection.isConnected}
          error={settings.customConnection.error}
        />
      </div>
      
      <div className="text-xs text-orange-600 bg-orange-50 p-3 rounded">
        ⚠️ Nur OpenAI-kompatible Endpoints werden unterstützt. Prüfe Request/Response-Format.
      </div>
      
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        🔒 Achte auf Datenschutz & Vertragslage beim Endpoint.
      </div>
    </div>
  );
}

const providers: readonly Provider[] = ['ChatGPT', 'Mistral', 'Claude', 'Lokal', 'Custom'];

export default function SettingsDrawer({
  isOpen,
  settings,
  onClose,
  onSettingsChange,
  onResetSettings,
  onShowToast
}: SettingsDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    provider: false,
    local: false,
    custom: false,
    switches: true,
    display: false
  });
  const [activeProviderTab, setActiveProviderTab] = useState<'main' | 'local' | 'custom'>('main');
  const [testing, setTesting] = useState(false);
  
  const { checkConnection } = useChatApi();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleProviderChange = (provider: Provider) => {
    onSettingsChange({ provider });
    onShowToast(`Provider gewechselt zu ${provider}`, 'info');
  };

  const handleToggleOnlyBrochure = () => {
    const newValue = !settings.onlyBrochure;
    onSettingsChange({ onlyBrochure: newValue });
    onShowToast(`Nur Broschüre ${newValue ? 'aktiviert' : 'deaktiviert'}`, 'info');
  };

  const handleToggleAttachSources = () => {
    const newValue = !settings.attachSources;
    onSettingsChange({ attachSources: newValue });
    onShowToast(`Quellen anfügen ${newValue ? 'aktiviert' : 'deaktiviert'}`, 'info');
  };

  const handleCardDensityChange = (density: 'comfort' | 'compact') => {
    onSettingsChange({ cardDensity: density });
    onShowToast(`Karten-Dichte: ${density === 'comfort' ? 'Komfort' : 'Kompakt'}`, 'info');
  };

  const handleContrastChange = (contrast: 'standard' | 'high') => {
    onSettingsChange({ contrastMode: contrast });
    onShowToast(`Kontrast: ${contrast === 'standard' ? 'Standard' : 'Hoch'}`, 'info');
  };

  const handleToggleNoExternalProviders = () => {
    const newValue = !settings.noExternalProviders;
    onSettingsChange({ noExternalProviders: newValue });
    onShowToast(`Externe Provider ${newValue ? 'gesperrt' : 'erlaubt'}`, 'info');
  };

  const handleTestLocalConnection = async () => {
    setTesting(true);
    try {
      const result = await checkConnection(settings.localEndpoint);
      onSettingsChange({
        localConnection: {
          isConnected: result.ok,
          error: result.detail,
          lastChecked: new Date().toISOString()
        }
      });
      
      if (result.ok) {
        onShowToast('Lokale Verbindung erfolgreich', 'success');
      } else {
        onShowToast(`Lokale Verbindung fehlgeschlagen: ${result.detail}`, 'error');
      }
    } catch (error) {
      onShowToast('Verbindungstest fehlgeschlagen', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleTestCustomConnection = async () => {
    setTesting(true);
    try {
      const result = await checkConnection(settings.customEndpoint);
      onSettingsChange({
        customConnection: {
          isConnected: result.ok,
          error: result.detail,
          lastChecked: new Date().toISOString()
        }
      });
      
      if (result.ok) {
        onShowToast('Custom Verbindung erfolgreich', 'success');
      } else {
        onShowToast(`Custom Verbindung fehlgeschlagen: ${result.detail}`, 'error');
      }
    } catch (error) {
      onShowToast('Verbindungstest fehlgeschlagen', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    onResetSettings();
    onShowToast('Alle Einstellungen zurückgesetzt', 'success');
  };

  if (!isOpen) return null;

  const currentPreset = providerPresets[settings.provider];

  return (
    <>
      {/* Backdrop */}
      <div className="settings-backdrop" onClick={onClose} />
      
      {/* Drawer */}
      <div className="settings-drawer">
        <div className="settings-header">
          <h2 className="settings-title">
            <SettingsIcon size={20} className="mr-2" />
            Einstellungen
          </h2>
          <button className="settings-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="settings-content">
          {/* KI-Provider & Presets */}
          <div className="settings-section">
            <button
              className="settings-section-header"
              onClick={() => toggleSection('provider')}
            >
              <span>
                <Bot size={16} className="mr-2" />
                KI-Provider & Presets
              </span>
              <span className="section-toggle">
                {expandedSections.provider ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.provider && (
              <div className="settings-section-content">
                {/* Provider Tabs */}
                <div className="mb-4 border-b border-gray-200">
                  <div className="flex gap-1">
                    <button
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeProviderTab === 'main'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveProviderTab('main')}
                    >
                      Haupt-Provider
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeProviderTab === 'local'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveProviderTab('local')}
                    >
                      Lokal
                      {settings.localConnection.isConnected && (
                        <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                      )}
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeProviderTab === 'custom'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveProviderTab('custom')}
                    >
                      Custom
                      {settings.customConnection.isConnected && (
                        <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Provider Tab */}
                {activeProviderTab === 'main' && (
                  <div className="mb-4">
                  <label className="settings-label">Provider</label>
                  <SegmentControl
                    options={providers}
                    value={settings.provider}
                    onChange={handleProviderChange}
                    className="settings-segment"
                  />
                  </div>
                )}

                {/* Local Provider Tab */}
                {activeProviderTab === 'local' && (
                  <LocalSettings
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                    onTestConnection={handleTestLocalConnection}
                    onShowToast={onShowToast}
                    testing={testing}
                  />
                )}

                {/* Custom Provider Tab */}
                {activeProviderTab === 'custom' && (
                  <CustomSettings
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                    onTestConnection={handleTestCustomConnection}
                    onShowToast={onShowToast}
                    testing={testing}
                  />
                )}
                
                {activeProviderTab === 'main' && (
                  <div className="settings-preset-info">
                  <div className="preset-label">Aktuelles Preset:</div>
                  <div className="preset-details">
                    {currentPreset.style}, {currentPreset.length}, Kreativität: {currentPreset.creativity}
                  </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Globale Schalter */}
          <div className="settings-section">
            <button
              className="settings-section-header"
              onClick={() => toggleSection('switches')}
            >
              <span>
                <SettingsIcon size={16} className="mr-2" />
                Globale Schalter
              </span>
              <span className="section-toggle">
                {expandedSections.switches ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.switches && (
              <div className="settings-section-content">
                <div className="settings-switch">
                  <button
                    className={`toggle-switch ${settings.onlyBrochure ? 'active' : ''}`}
                    onClick={handleToggleOnlyBrochure}
                  >
                    <span className="toggle-indicator" />
                  </button>
                  <div className="switch-info">
                    <div className="switch-label">Nur Broschüre</div>
                    <div className="switch-description">
                      KI-Antworten nur aus Broschüren-Inhalten
                    </div>
                  </div>
                </div>

                <div className="settings-switch">
                  <button
                    className={`toggle-switch ${settings.attachSources ? 'active' : ''}`}
                    onClick={handleToggleAttachSources}
                  >
                    <span className="toggle-indicator" />
                  </button>
                  <div className="switch-info">
                    <div className="switch-label">Quellen anfügen</div>
                    <div className="switch-description">
                      Seitenzahlen und Stand zu Antworten hinzufügen
                    </div>
                  </div>
                </div>

                <div className="settings-switch">
                  <button
                    className={`toggle-switch ${settings.noExternalProviders ? 'active' : ''}`}
                    onClick={handleToggleNoExternalProviders}
                  >
                    <span className="toggle-indicator" />
                  </button>
                  <div className="switch-info">
                    <div className="switch-label">Keine externen Provider zulassen</div>
                    <div className="switch-description">
                      Deaktiviert ChatGPT, Mistral, Claude und Custom - nur lokale Provider
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Darstellung */}
          <div className="settings-section">
            <button
              className="settings-section-header"
              onClick={() => toggleSection('display')}
            >
              <span>
                <Palette size={16} className="mr-2" />
                Darstellung
              </span>
              <span className="section-toggle">
                {expandedSections.display ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.display && (
              <div className="settings-section-content">
                <div className="mb-4">
                  <label className="settings-label">Karten-Dichte</label>
                  <SegmentControl
                    options={['comfort', 'compact'] as const}
                    value={settings.cardDensity}
                    onChange={handleCardDensityChange}
                    className="settings-segment"
                  />
                </div>

                <div className="mb-4">
                  <label className="settings-label">Kontrast</label>
                  <SegmentControl
                    options={['standard', 'high'] as const}
                    value={settings.contrastMode}
                    onChange={handleContrastChange}
                    className="settings-segment"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Zurücksetzen */}
          <div className="settings-section">
            <button
              className="settings-section-header"
              onClick={() => toggleSection('admin')}
            >
              <span>⚙️ Admin</span>
              <span className="section-toggle">
                {expandedSections.admin ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.admin && (
              <div className="settings-section-content">
                <div className="settings-switch">
                  <button
                    className={`toggle-switch ${settings.adminMode ? 'active' : ''}`}
                    onClick={() => {
                      const newValue = !settings.adminMode;
                      onSettingsChange({ adminMode: newValue });
                      onShowToast(`Admin-Modus ${newValue ? 'aktiviert' : 'deaktiviert'}`, 'info');
                    }}
                  >
                    <span className="toggle-indicator" />
                  </button>
                  <div className="switch-info">
                    <div className="switch-label">Admin-Modus</div>
                    <div className="switch-description">
                      Aktiviert RAG Admin-Panel für Chunk-Management
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zurücksetzen */}
          <div className="settings-section">
            <button className="settings-reset-btn" onClick={handleReset}>
              <RotateCcw size={16} className="mr-2" />
              Alle Einstellungen auf Standard
            </button>
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Schließen
          </button>
          <div className="settings-footer-note">
            Einstellungen wirken sofort
          </div>
        </div>
      </div>
    </>
  );
}