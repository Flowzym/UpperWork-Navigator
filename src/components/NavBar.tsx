import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { History, BarChart3, Settings, HelpCircle, Wrench, Search, Zap, Target, HelpCircle as Help } from 'lucide-react';

interface NavBarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenHistory: () => void;
  onOpenMetrics: () => void;
  onToggleAdminMode: () => void;
}

export function NavBar({ 
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenHelp,
  onOpenHistory,
  onOpenMetrics,
  onToggleAdminMode
}: NavBarProps) {
  const tabs: { key: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { key: 'explorer', label: 'Explorer', icon: <Search size={16} /> },
    { key: 'wizard', label: 'Wizard', icon: <Zap size={16} /> },
    { key: 'profil-matching', label: 'Profil-Matching', icon: <Target size={16} /> },
    { key: 'help', label: 'Hilfe', icon: <Help size={16} /> }
  ];
  return (
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <button className="brand-button">
              <Target size={20} className="brand-icon" />
              <span className="brand-text">Förder-Navigator OÖ</span>
            </button>
          </div>

          <div className="navbar-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => onTabChange(tab.key)}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="navbar-actions">
            <button 
              className="nav-action-btn"
              onClick={onOpenHistory}
              title="Verlauf anzeigen"
            >
              <History size={16} />
            </button>
            <button 
              className="nav-action-btn"
              onClick={onOpenMetrics}
              title="Metriken anzeigen"
            >
              <BarChart3 size={16} />
            </button>
            <button 
              className="nav-action-btn"
              onClick={onToggleAdminMode}
              title="Admin-Modus"
            >
              <Wrench size={16} />
            </button>
            <button 
              className="nav-action-btn"
              onClick={onOpenSettings}
              title="Einstellungen"
            >
              <Settings size={16} />
            </button>
            <button 
              className="nav-action-btn"
              onClick={onOpenHelp}
              title="Hilfe"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </nav>
  );
}