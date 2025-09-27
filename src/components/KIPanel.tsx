import React, { useState } from 'react';
import { Provider, Mode, ContextType, Answer, ProviderPreset } from '../types';
import { Pin, CheckSquare, Search as SearchIcon, Mail, X, Trash2, Bot, MoreVertical, Settings } from 'lucide-react';
import SegmentControl from './SegmentControl';
import AnswerCard from './AnswerCard';
import ConnectionBadge from './ConnectionBadge';
import OverflowMenu from './OverflowMenu';

interface KIPanelProps {
  isOpen: boolean;
  isExpanded?: boolean;
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
  onAddProgramCard?: (programId: string) => void;
  onExpand: () => void;
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
  isExpanded = false,
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
  onAddProgramCard,
  onExpand,
  onClose,
  onShowToast,
  chatLoading = false,
  chatApiError,
  noExternalProviders = false,
  localConnection,
  customConnection
}: KIPanelProps) {
  const [chatInput, setChatInput] = useState('');
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [pendingProgramCard, setPendingProgramCard] = useState<string | null>(null);

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
    setPendingProgramCard(null); // Clear pending card after sending
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

  const providerMenuItems = [
    {
      label: 'Provider',
      icon: <Settings size={14} />,
      onClick: () => {} // Header item, no action
    },
    ...providers.filter(p => {
      if (noExternalProviders) {
        return p === 'Lokal';
      }
      return true;
    }).map(p => ({
      label: p,
      icon: <Bot size={14} />,
      checked: provider === p,
      onClick: () => onProviderChange(p)
    })),
    {
      label: 'Nur Broschüre',
      icon: <CheckSquare size={14} />,
      checked: onlyBrochure,
      onClick: onToggleOnlyBrochure
    },
    {
      label: 'Quellen anfügen',
      icon: <CheckSquare size={14} />,
      checked: withSources,
      onClick: onToggleWithSources
    }
  ];

  // Handle program card addition
  const handleAddProgramCard = (programId: string) => {
    setPendingProgramCard(programId);
    if (onAddProgramCard) {
      onAddProgramCard(programId);
    }
  };

  if (!isOpen) return null;

  // Collapsed view
  if (!isExpanded) {
    return (
      <div className="right-panel collapsed">
        <div className="flex flex-col h-full p-2 gap-2">
          {/* Expand Button */}
          <button
            className="btn btn-ghost p-2 w-full"
            onClick={onExpand}
            title="KI-Panel erweitern"
          >
            🤖
          </button>
          
          {/* Quick Actions - Vertical */}
          <div className="flex flex-col gap-1">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="btn btn-ghost p-2 w-full text-xs"
                onClick={() => handleQuickAction(action)}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
          
          {/* Answer Count */}
          {answers.length > 0 && (
            <div className="mt-auto">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto">
                {answers.length}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="right-panel expanded">
      <div className="ki-panel-content">
        {/* Header */}
        <div className="ki-panel-header">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800">KI-Assistent</h2>
              <div className="relative">
                <button
                  className="btn btn-ghost btn-sm p-1"
                  onClick={() => setShowProviderMenu(!showProviderMenu)}
                  title="Provider & Einstellungen"
                >
                  <MoreVertical size={16} />
                </button>
                
                <OverflowMenu
                  items={providerMenuItems}
                  isOpen={showProviderMenu}
                  onClose={() => setShowProviderMenu(false)}
                  anchorRef={{ current: null }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="btn btn-ghost btn-sm p-1"
                onClick={onClearAnswers}
                disabled={answers.length === 0}
                title="Alle Antworten löschen"
              >
                <Trash2 size={14} />
              </button>
              <button 
                className="btn btn-ghost btn-sm p-1"
                onClick={onClose}
                title="KI-Panel einklappen"
              >
                ←
              </button>
              <button 
                className="btn btn-ghost btn-sm p-1"
                onClick={onClose}
              >
                <X size={14} />
              </button>
            </div>
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
            <div className="grid grid-cols-2 gap-1">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="quick-action-btn-small"
                  onClick={() => handleQuickAction(action)}
                  title={action.label}
                >
                  <span>{action.icon}</span>
                  <span className="text-xs leading-tight">{action.label}</span>
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
          {/* Pending Program Card */}
          {pendingProgramCard && (
            <div className="mb-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Bot size={14} />
                  <span>Programm "{pendingProgramCard}" wird analysiert...</span>
                </div>
              </div>
            </div>
          )}
          
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