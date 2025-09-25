import React from 'react';
import { NavBar } from './NavBar';
import FooterBar from './FooterBar';
import { NavigationState, SettingsState } from '../types';

interface AppShellProps {
  navigationState: NavigationState;
  settingsState: SettingsState;
  onNavigationChange: (updates: Partial<NavigationState>) => void;
  onSettingsChange: (updates: Partial<SettingsState>) => void;
  onResetSettings: () => void;
  onOpenHistory: () => void;
  onOpenMetrics: () => void;
  onToggleAdminMode: () => void;
  children: React.ReactNode;
}

export default function AppShell({
  navigationState,
  settingsState,
  onNavigationChange,
  onSettingsChange,
  onResetSettings,
  onOpenHistory,
  onOpenMetrics,
  onToggleAdminMode,
  children
}: AppShellProps) {
  return (
    <div className={`app-shell ${settingsState.contrastMode === 'high' ? 'high-contrast' : ''}`}>
      <NavBar
        activeTab={navigationState.activeTab}
        onTabChange={(tab) => onNavigationChange({ activeTab: tab })}
        onOpenSettings={() => onNavigationChange({ showSettingsDrawer: true })}
        onOpenHelp={() => onNavigationChange({ showHelpModal: true })}
        onOpenHistory={onOpenHistory}
        onOpenMetrics={onOpenMetrics}
        onToggleAdminMode={onToggleAdminMode}
      />
      
      <main className={`app-content ${settingsState.cardDensity}`}>
        {children}
      </main>
      
      <FooterBar
        onOpenChangelog={() => onNavigationChange({ 
          showHelpModal: true, 
          activeHelpTab: 'changelog' 
        })}
        onOpenContact={() => onNavigationChange({ 
          showHelpModal: true, 
          activeHelpTab: 'contact' 
        })}
      />
    </div>
  );
}