import React, { useState } from 'react';
import { Provider, Mode, ContextType, Answer, ProviderPreset } from '../types';
import { Pin, CheckSquare, Search as SearchIcon, Mail, X, Trash2, Bot } from 'lucide-react';
import SegmentControl from './SegmentControl';
import AnswerCard from './AnswerCard';
import ConnectionBadge from './ConnectionBadge';

interface KIPanelProps {
  isOpen: boolean;
  provider: Provider;
  mode: Mode;
  context: ContextType;
  onlyBrochure: boolean;
  withSources: boolean;
  providerPreset: ProviderPreset;
  answers: Answer[];
  onProviderChange: (provider: Provider) => void;
  onModeChange: (mode: Mode) => void;
  onContextChange: (context: ContextType) => void;
  onToggleOnlyBrochure: () => void;
  onToggleWithSources: () => void;
  onAddAnswer: (answer: Answer) => void;
  onRemoveAnswer: (answerId: string) => void;
  onClearAnswers: () => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
  chatLoading?: boolean;
  chatApiError?: string | null;
  noExternalProviders?: boolean;
  localConnection?: { isConnected: boolean; error?: string };
  customConnection?: { isConnected: boolean; error?: string };
}

const providers: readonly Provider[] = ['ChatGPT', 'Mistral', 'Claude', 'Lokal', 'Custom'];
const modes: readonly Mode[] = ['Fakten', 'Vergleich', 'Checkliste', 'E-Mail', 'Was-wäre-wenn'];
const contexts: readonly ContextType[] = ['Aktuelle Karte', 'Vergleichsauswahl', 'Ergebnisliste', 'Freie Frage'];

const quickActions = [
  { 
    label: '3-Punkte-Überblick', 
    icon: <Pin size={16} />,
    template: 'Top 3 Fakten zum Programm/Filter (Dummy).'
  },
  { 
    label: 'Checkliste', 
    icon: <CheckSquare size={16} />,
    template: '5 Schritte: Eignung → Kurs → Portal → Antrag → Abrechnung (Dummy).'
  },
  { 
    label: 'Unterschiede (3)', 
    icon: <SearchIcon size={16} />,
    template: 'A vs. B – 3 Unterschiede (Dummy).'
  },
  { 
    label: 'E-Mail-Kurztext', 
    icon: <Mail size={16} />,
    template: 'Sehr geehrte/r … hier die wichtigsten Eckpunkte (Dummy).'
  }
];

export default function KIPanel({ 
  isOpen, 
  provider,
  mode,
  context,
  onlyBrochure,
  withSources,
  providerPreset,
  answers,
  onProviderChange,
  onModeChange,
  onContextChange,
  onToggleOnlyBrochure,
  onToggleWithSources,
  onAddAnswer,
  onRemoveAnswer,
  onClearAnswers,
  onClose,
  onShowToast,
  chatLoading = false,
  chatApiError,
  noExternalProviders = false,
  localConnection,
  customConnection
}: KIPanelProps) {
  const [chatInput, setChatInput] = useState('');

  console.log('KIPanel render:', { isOpen, provider, mode });

  const generateRandomPage = () => Math.floor(Math.random() * 36) + 5; // 5-40

  const generateAnswer = (baseText: string, isQuickAction = false) => {
    let text = baseText;
    
    // Add provider preset info for non-quick actions
    if (!isQuickAction) {
      text += ` (${providerPreset.style}, ${providerPreset.length}, Kreativität ${providerPreset.creativity})`;
    }
    
    // Add brochure hint if enabled
    if (onlyBrochure) {
      text += '\n\n(Hinweis: Nur Inhalte aus der Broschüre berücksichtigt.)';
    }
    
    // Generate sources if enabled
    const sources = withSources ? [{ 
      seite: generateRandomPage(), 
      stand: '09/2025' 
    }] : undefined;
    
    // Generate warning based on context (dummy logic)
    let warning: string | undefined;
    if (context === 'Aktuelle Karte' && Math.random() > 0.7) {
      // 30% chance of warning for demo purposes
      const warnings = [
        'Programm derzeit ausgesetzt – keine Anträge möglich',
        'Programm endet am 31.12.2025 – begrenzte Laufzeit'
      ];
      warning = warnings[Math.floor(Math.random() * warnings.length)];
    }
    
    const answer: Answer = {
      id: `answer-${Date.now()}`,
      text,
      sources,
      warning,
      meta: {
        provider,
        mode,
        context,
        timestamp: new Date().toISOString()
      }
    };
    onAddAnswer(answer);
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    generateAnswer(action.template, true);
    onShowToast(`${action.label} wird generiert...`);
  };

  const handleGenerateAnswer = () => {
    if (!chatInput.trim()) {
      onShowToast('Bitte geben Sie eine Frage ein');
      return;
    }
    
    const dummyText = `Dummy-Antwort im Modus ${mode} mit Provider ${provider}, Kontext ${context}. Frage: "${chatInput}"`;
    generateAnswer(dummyText, false);
    setChatInput('');
    onShowToast('Antwort wird generiert...');
  };

  const handleCopy = (text: string) => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const handleDeleteAnswer = (answerId: string) => {
    onRemoveAnswer(answerId);
  };

  if (!isOpen) return null;

  return (
    <div className="right-panel w-96 h-full overflow-y-auto">
      <div className="ki-panel-content">
        {/* Header */}
        <div className="ki-panel-header">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">KI-Assistent</h2>
            <div className="flex items-center gap-2">
              <button 
                className="btn btn-ghost btn-sm"
                onClick={onClearAnswers}
                disabled={answers.length === 0}
              >
                <Trash2 size={14} className="mr-1" />
                Leeren
              </button>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={onClose}
              >
                <X size={14} className="mr-1" />
                Schließen
              </button>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <button
                role="switch"
                aria-checked={onlyBrochure}
                className={`toggle-btn ${onlyBrochure ? 'active' : ''}`}
                onClick={onToggleOnlyBrochure}
              >
                <CheckSquare size={14} className="mr-1" />
                Nur Broschüre
              </button>
              <button
                role="switch"
                aria-checked={withSources}
                className={`toggle-btn ${withSources ? 'active' : ''}`}
                onClick={onToggleWithSources}
              >
                <CheckSquare size={14} className="mr-1" />
                Quellen anfügen
              </button>
            </div>
          </div>

          {/* Preset Display */}
          <div className="mb-4">
            <div className="text-xs text-gray-500">
              Preset: {providerPreset.style}, {providerPreset.length}, Kreativität: {providerPreset.creativity}
            </div>
          </div>

          {/* Provider Selection */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-2 block">Provider</label>
            <SegmentControl
              options={providers.filter(p => {
                if (noExternalProviders) {
                  return p === 'Lokal';
                }
                return true;
              })}
              value={provider}
              onChange={onProviderChange}
              className="ki-segment-small"
            />
            
            {/* Connection Status for Local/Custom */}
            {provider === 'Lokal' && localConnection && (
              <div className="mt-2">
                <ConnectionBadge
                  isConnected={localConnection.isConnected}
                  error={localConnection.error}
                />
                {!localConnection.isConnected && (
                  <div className="mt-1 text-xs text-orange-600">
                    Provider nicht geprüft. Konfiguration in Settings prüfen.
                  </div>
                )}
              </div>
            )}
            
            {provider === 'Custom' && customConnection && (
              <div className="mt-2">
                <ConnectionBadge
                  isConnected={customConnection.isConnected}
                  error={customConnection.error}
                />
                {!customConnection.isConnected && (
                  <div className="mt-1 text-xs text-orange-600">
                    Provider nicht geprüft. Konfiguration in Settings prüfen.
                  </div>
                )}
              </div>
            )}
            
            {/* External Provider Warning */}
            {noExternalProviders && ['ChatGPT', 'Mistral', 'Claude', 'Custom'].includes(provider) && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ Externe Provider durch Richtlinie gesperrt
              </div>
            )}
          </div>

          {/* Mode Selection */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-2 block">Modus</label>
            <SegmentControl
              options={modes}
              value={mode}
              onChange={onModeChange}
              className="ki-segment-small"
            />
          </div>

          {/* Context Selection */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-2 block">Kontext</label>
            <div className="context-pills">
              {contexts.map((ctx) => (
                <button
                  key={ctx}
                  className={`context-pill ${context === ctx ? 'active' : ''}`}
                  onClick={() => onContextChange(ctx)}
                >
                  {ctx}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-2 block">Schnell-Aktionen</label>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action)}
                >
                  <span className="mb-1">{action.icon}</span>
                  <span className="text-xs">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-2 block">Frage stellen</label>
            <div className="space-y-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Stellen Sie Ihre Frage zu den Förderprogrammen..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
              />
              <button
                className="btn btn-primary w-full"
                onClick={handleGenerateAnswer}
                disabled={chatLoading}
              >
                {chatLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Bot size={16} className="mr-2" />
                    Antwort erzeugen
                  </>
                )}
              </button>
              {chatApiError && (
                <div className="text-xs text-red-600 mt-1">
                  API-Fehler: {chatApiError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answers List */}
        <div className="ki-panel-answers">
          {answers.length > 0 && (
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-700">
                Antworten ({answers.length})
              </label>
            </div>
          )}
          
          <div className="space-y-3">
            {answers.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                onCopy={handleCopy}
                onDelete={handleDeleteAnswer}
                onShowToast={onShowToast}
              />
            ))}
          </div>

          {answers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Bot size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-sm">
                {chatLoading ? 'Antwort wird generiert...' : 'Stellen Sie eine Frage oder nutzen Sie die Schnell-Aktionen'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}