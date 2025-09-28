import React, { useState, useEffect } from 'react';
import { X, Monitor, Bot, FileText, Settings, Eye, EyeOff, TestTube, Trash2, RefreshCw } from 'lucide-react';
import { Provider } from '../types';
import { EndpointConfig, defaultEndpoints } from '../config/endpoints';
import { useChatApi } from '../hooks/useChatApi';
import { getRagCacheInfo, clearRagCache } from '../lib/cache/ragCache';
import ConnectionBadge from './ConnectionBadge';
import SegmentControl from './SegmentControl';

type SettingsTab = 'display' | 'providers' | 'brochures';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    themeMode: 'light' | 'dark' | 'high-contrast';
    viewMode: 'grid' | 'list';
    cardDensity: 'comfort' | 'compact';
    noExternalProviders: boolean;
  };
  onSettingsChange: (settings: any) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const tabLabels: Record<SettingsTab, { label: string; icon: React.ReactNode }> = {
  display: { label: 'Darstellung', icon: <Monitor size={16} /> },
  providers: { label: 'KI-Provider', icon: <Bot size={16} /> },
  brochures: { label: 'Broschüren', icon: <FileText size={16} /> }
};

const providers: Provider[] = ['ChatGPT', 'Mistral', 'Claude', 'Lokal', 'Custom'];

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onShowToast
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('display');
  const [selectedProvider, setSelectedProvider] = useState<Provider>('ChatGPT');
  const [showApiKeys, setShowApiKeys] = useState<Record<Provider, boolean>>({
    ChatGPT: false,
    Mistral: false,
    Claude: false,
    Lokal: false,
    Custom: false
  });
  
  const [providerConfigs, setProviderConfigs] = useState({
    ChatGPT: {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 500,
      endpoint: 'https://api.openai.com/v1'
    },
    Mistral: {
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      model: 'mistralai/mistral-7b-instruct:free',
      temperature: 0.3,
      maxTokens: 500,
      endpoint: 'https://openrouter.ai/api/v1'
    },
    Claude: {
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
      model: 'claude-3-haiku-20240307',
      temperature: 0.3,
      maxTokens: 500,
      endpoint: 'https://api.anthropic.com/v1'
    },
    Lokal: {
      apiKey: import.meta.env.VITE_LOCAL_OPENAI_API_KEY || '',
      model: import.meta.env.VITE_LOCAL_OPENAI_MODEL || 'llama3.1:8b-instruct',
      temperature: 0.1,
      maxTokens: 500,
      endpoint: import.meta.env.VITE_LOCAL_OPENAI_BASEURL || 'http://localhost:11434/v1'
    },
    Custom: {
      apiKey: import.meta.env.VITE_CUSTOM_OPENAI_API_KEY || '',
      model: import.meta.env.VITE_CUSTOM_OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 500,
      endpoint: import.meta.env.VITE_CUSTOM_OPENAI_BASEURL || 'https://api.openai.com/v1'
    }
  });

  const [connectionStatus, setConnectionStatus] = useState<Record<Provider, { isConnected: boolean; error?: string }>>({
    ChatGPT: { isConnected: false },
    Mistral: { isConnected: false },
    Claude: { isConnected: false },
    Lokal: { isConnected: false },
    Custom: { isConnected: false }
  });

  const [brochureStatus, setBrochureStatus] = useState({
    loaded: false,
    filename: '',
    chunks: 0,
    lastUpdate: '',
    source: 'network' as 'network' | 'idb' | 'simulation',
    buildId: '',
    urlBase: ''
  });

  const chatApi = useChatApi();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      // Check brochure status
      checkBrochureStatus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const checkBrochureStatus = async () => {
    // Hole Cache-Info
    const cacheInfo = getRagCacheInfo();
    
    try {
      const BASE = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
      const statsResponse = await fetch(`${BASE}/rag/stats.json`, { cache: 'no-store' });
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setBrochureStatus({
          loaded: true,
          filename: stats?.source || 'brochure.pdf',
          chunks: stats.totalChunks || 0,
          lastUpdate: new Date().toLocaleDateString('de-DE'),
          source: cacheInfo.source,
          buildId: cacheInfo.buildId || 'unbekannt',
          urlBase: cacheInfo.urlBase
        });
      } else {
        setBrochureStatus({
          loaded: false,
          filename: 'Broschüre nicht gefunden',
          chunks: 0,
          lastUpdate: '',
          source: cacheInfo.source,
          buildId: cacheInfo.buildId || 'unbekannt',
          urlBase: cacheInfo.urlBase
        });
      }
    } catch (error) {
      setBrochureStatus({
        loaded: false,
        filename: 'Broschüre nicht verfügbar',
        chunks: 0,
        lastUpdate: '',
        source: cacheInfo.source,
        buildId: cacheInfo.buildId || 'unbekannt',
        urlBase: cacheInfo.urlBase
      });
    }
  };

  const handleProviderConfigChange = (provider: Provider, field: string, value: any) => {
    setProviderConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleTestConnection = async (provider: Provider) => {
    const config = providerConfigs[provider];
    
    setConnectionStatus(prev => ({
      ...prev,
      [provider]: { isConnected: false, error: 'Teste Verbindung...' }
    }));

    try {
      const result = await chatApi.checkConnection({
        baseUrl: config.endpoint,
        model: config.model,
        apiKey: config.apiKey
      });

      setConnectionStatus(prev => ({
        ...prev,
        [provider]: {
          isConnected: result.ok,
          error: result.ok ? undefined : result.detail
        }
      }));

      onShowToast(
        result.ok ? `${provider} erfolgreich verbunden` : `${provider} Verbindung fehlgeschlagen: ${result.detail}`,
        result.ok ? 'success' : 'error'
      );
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [provider]: { isConnected: false, error: 'Verbindungsfehler' }
      }));
      onShowToast(`${provider} Verbindungstest fehlgeschlagen`, 'error');
    }
  };

  const handleToggleApiKeyVisibility = (provider: Provider) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleLoadBrochure = () => {
    onShowToast('(Dummy) Broschüre wird neu geladen...', 'info');
    // In real implementation: trigger re-ingestion
  };

  const handleUploadBrochure = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onShowToast(`(Dummy) Broschüre "${file.name}" wird verarbeitet...`, 'info');
      // In real implementation: upload and process PDF
    }
  };

  const handleClearCache = async () => {
    try {
      await clearRagCache();
      onShowToast('Cache geleert - Seite wird neu geladen', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      onShowToast('Cache-Reset fehlgeschlagen', 'error');
    }
  };

  const handleClearCacheAndReload = () => {
    try {
      // Lösche IndexedDB komplett
      indexedDB.deleteDatabase('foerder-nav');
      indexedDB.deleteDatabase('rag-admin');
      onShowToast('Cache geleert - Seite wird neu geladen', 'success');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      onShowToast('Cache-Reset fehlgeschlagen', 'error');
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'network':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">🌐 Network</span>;
      case 'idb':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">💾 Cache</span>;
      case 'simulation':
        return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">🎭 Simulation</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">❓ Unbekannt</span>;
    }
  };
  const renderDisplayTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3 className="settings-section-title">Theme</h3>
        <SegmentControl
          options={['light', 'dark', 'high-contrast'] as const}
          value={settings.themeMode}
          onChange={(value) => onSettingsChange({ ...settings, themeMode: value })}
        />
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Ansicht</h3>
        <SegmentControl
          options={['grid', 'list'] as const}
          value={settings.viewMode}
          onChange={(value) => onSettingsChange({ ...settings, viewMode: value })}
        />
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Kartendichte</h3>
        <SegmentControl
          options={['comfort', 'compact'] as const}
          value={settings.cardDensity}
          onChange={(value) => onSettingsChange({ ...settings, cardDensity: value })}
        />
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Datenschutz</h3>
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={settings.noExternalProviders}
            onChange={(e) => onSettingsChange({ ...settings, noExternalProviders: e.target.checked })}
          />
          <span>Keine externen Provider zulassen</span>
        </label>
      </div>
    </div>
  );

  const renderProvidersTab = () => (
    <div className="settings-tab-content">
      {/* Provider Selection */}
      <div className="settings-provider-tabs">
        {providers.map((provider) => (
          <button
            key={provider}
            className={`settings-provider-tab ${selectedProvider === provider ? 'active' : ''}`}
            onClick={() => setSelectedProvider(provider)}
          >
            {provider}
          </button>
        ))}
      </div>

      {/* Provider Configuration */}
      <div className="settings-provider-config">
        <div className="settings-provider-header">
          <h3 className="settings-section-title">{selectedProvider} Konfiguration</h3>
          <ConnectionBadge
            isConnected={connectionStatus[selectedProvider].isConnected}
            error={connectionStatus[selectedProvider].error}
          />
        </div>

        <div className="settings-form">
          <div className="settings-form-row">
            <label className="settings-form-label">Endpoint</label>
            <input
              type="text"
              value={providerConfigs[selectedProvider].endpoint}
              onChange={(e) => handleProviderConfigChange(selectedProvider, 'endpoint', e.target.value)}
              className="settings-form-input"
              placeholder="https://api.example.com/v1"
            />
          </div>

          <div className="settings-form-row">
            <label className="settings-form-label">API Key</label>
            <div className="settings-api-key-row">
              <input
                type={showApiKeys[selectedProvider] ? 'text' : 'password'}
                value={providerConfigs[selectedProvider].apiKey}
                onChange={(e) => handleProviderConfigChange(selectedProvider, 'apiKey', e.target.value)}
                className="settings-form-input"
                placeholder="sk-..."
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleToggleApiKeyVisibility(selectedProvider)}
              >
                {showApiKeys[selectedProvider] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="settings-form-row">
            <label className="settings-form-label">Model</label>
            <input
              type="text"
              value={providerConfigs[selectedProvider].model}
              onChange={(e) => handleProviderConfigChange(selectedProvider, 'model', e.target.value)}
              className="settings-form-input"
              placeholder="gpt-4o-mini"
            />
          </div>

          <div className="settings-form-row">
            <label className="settings-form-label">Temperatur</label>
            <div className="settings-slider-row">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={providerConfigs[selectedProvider].temperature}
                onChange={(e) => handleProviderConfigChange(selectedProvider, 'temperature', parseFloat(e.target.value))}
                className="settings-slider"
              />
              <span className="settings-slider-value">
                {providerConfigs[selectedProvider].temperature}
              </span>
            </div>
          </div>

          <div className="settings-form-row">
            <label className="settings-form-label">Max Tokens</label>
            <input
              type="number"
              value={providerConfigs[selectedProvider].maxTokens}
              onChange={(e) => handleProviderConfigChange(selectedProvider, 'maxTokens', parseInt(e.target.value) || 500)}
              className="settings-form-input"
              min="100"
              max="4000"
              step="100"
            />
          </div>

          <div className="settings-form-actions">
            <button
              className="btn btn-primary"
              onClick={() => handleTestConnection(selectedProvider)}
            >
              <TestTube size={14} className="mr-1" />
              Verbindung testen
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrochuresTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3 className="settings-section-title">Aktuelle Broschüre</h3>
        
        {brochureStatus.loaded ? (
          <div className="settings-brochure-status">
            <div className="settings-brochure-info">
              <div className="settings-brochure-name">
                📄 {brochureStatus.filename}
              </div>
              <div className="settings-brochure-meta">
                {brochureStatus.chunks} Chunks • {getSourceBadge(brochureStatus.source)}
              </div>
              <div className="settings-brochure-meta">
                Build: <code className="text-xs">{brochureStatus.buildId}</code> • BASE_URL: <code className="text-xs">{brochureStatus.urlBase || '/'}</code>
              </div>
            </div>
            <div className="settings-brochure-actions">
              <button
                className="btn btn-secondary"
                onClick={handleLoadBrochure}
              >
                🔄 Neu laden
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-brochure-empty">
            <div className="settings-empty-icon">📄</div>
            <div className="settings-empty-title">Keine Broschüre geladen</div>
            <div className="settings-empty-text">
              {getSourceBadge(brochureStatus.source)} • Für echte RAG-Antworten bitte Broschüre hochladen.
            </div>
            <div className="settings-empty-text">
              BASE_URL: <code className="text-xs">{brochureStatus.urlBase || '/'}</code>
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Cache-Verwaltung</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span>Datenquelle:</span>
                {getSourceBadge(brochureStatus.source)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span>Build-ID:</span>
                <code className="text-xs bg-white px-2 py-1 rounded border">
                  {brochureStatus.buildId || 'unbekannt'}
                </code>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span>Chunks geladen:</span>
                <span className="font-medium">{brochureStatus.chunks}</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleClearCache}
              >
                <Trash2 size={14} className="mr-1" />
                Cache leeren
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleClearCacheAndReload}
              >
                <RefreshCw size={14} className="mr-1" />
                Cache leeren & neu laden
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={14} className="mr-1" />
                Neu laden
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-600">
          💡 "Cache leeren & neu laden" hilft bei veralteten Daten oder nach Hinzufügen neuer JSON-Dateien
        </div>
      </div>
      <div className="settings-section">
        <h3 className="settings-section-title">Neue Broschüre hochladen</h3>
        <div className="settings-upload-area">
          <label className="settings-upload-label">
            <input
              type="file"
              accept=".pdf"
              onChange={handleUploadBrochure}
              className="settings-upload-input"
            />
            <div className="settings-upload-content">
              <div className="settings-upload-icon">📁</div>
              <div className="settings-upload-text">
                PDF-Broschüre auswählen
              </div>
              <div className="settings-upload-hint">
                Klicken oder Datei hierher ziehen
              </div>
            </div>
          </label>
        </div>
        
        <div className="settings-upload-note">
          <div className="text-sm text-gray-600">
            💡 Nach dem Upload wird automatisch "npm run ingest" ausgeführt um die Broschüre zu verarbeiten.
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">RAG-Einstellungen</h3>
        <div className="settings-form">
          <div className="settings-form-row">
            <label className="settings-form-label">Chunk-Größe</label>
            <input
              type="number"
              defaultValue={800}
              className="settings-form-input"
              min="200"
              max="2000"
              step="50"
            />
          </div>
          <div className="settings-form-row">
            <label className="settings-form-label">Overlap</label>
            <input
              type="number"
              defaultValue={140}
              className="settings-form-input"
              min="0"
              max="500"
              step="20"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex">
        {/* Left Sidebar - Tabs */}
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <Settings size={20} />
            <span className="settings-sidebar-title">Einstellungen</span>
          </div>
          
          <div className="settings-sidebar-tabs">
            {(Object.keys(tabLabels) as SettingsTab[]).map((tab) => (
              <button
                key={tab}
                className={`settings-sidebar-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="settings-tab-icon">{tabLabels[tab].icon}</span>
                <span className="settings-tab-label">{tabLabels[tab].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="settings-content">
          <div className="settings-content-header">
            <h2 className="settings-content-title">
              {tabLabels[activeTab].label}
            </h2>
            <button
              className="btn btn-ghost p-2"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>

          <div className="settings-content-body">
            {activeTab === 'display' && renderDisplayTab()}
            {activeTab === 'providers' && renderProvidersTab()}
            {activeTab === 'brochures' && renderBrochuresTab()}
          </div>
        </div>
      </div>
    </div>
  );
}