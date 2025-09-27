import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { History, BarChart3, Settings, HelpCircle, Wrench, Search, Zap, Target, HelpCircle as Help, MoreVertical } from 'lucide-react';
import OverflowMenu from './OverflowMenu';

interface NavBarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onStartWizard: () => void;
  onStartProfileMatching: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenHistory: () => void;
  onOpenMetrics: () => void;
  onToggleAdminMode: () => void;
}

export function NavBar({ 
  activeTab,
  onTabChange,
  onStartWizard,
  onStartProfileMatching,
  onOpenSettings,
  onOpenHelp,
  onOpenHistory,
  onOpenMetrics,
  onToggleAdminMode
}: NavBarProps) {
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  const tabs: { key: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { key: 'explorer', label: 'Explorer', icon: <Search size={16} /> },
    { key: 'wizard', label: 'Wizard', icon: <Zap size={16} /> },
    { key: 'profil-matching', label: 'Profil-Matching', icon: <Target size={16} /> },
    { key: 'help', label: 'Hilfe', icon: <Help size={16} /> }
  ];

  const overflowMenuItems = [
    {
      label: 'Verlauf',
      icon: <History size={14} />,
      onClick: onOpenHistory
    },
    {
      label: 'Metriken',
      icon: <BarChart3 size={14} />,
      onClick: onOpenMetrics
    },
    {
      label: 'Admin-Modus',
      icon: <Wrench size={14} />,
      onClick: onToggleAdminMode
    },
    {
      label: 'Einstellungen',
      icon: <Settings size={14} />,
      onClick: onOpenSettings
    },
    {
      label: 'Hilfe',
      icon: <HelpCircle size={14} />,
      onClick: onOpenHelp
    }
  ];

  return (
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand flex items-center gap-2">
            <button className="brand-button">
              <Target size={20} className="brand-icon" />
              <span className="brand-text">Förder-Navigator OÖ</span>
            </button>
            <div className="relative">
              <button
                className="nav-action-btn"
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                title="Weitere Optionen"
              >
                <MoreVertical size={16} />
              </button>
              
              <OverflowMenu
                items={overflowMenuItems}
                isOpen={showOverflowMenu}
                onClose={() => setShowOverflowMenu(false)}
                anchorRef={{ current: null }}
              />
            </div>
          </div>

          <div className="navbar-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => {
                  if (tab.key === 'wizard') {
                    onStartWizard();
                  } else if (tab.key === 'profil-matching') {
                    onStartProfileMatching();
                  } else {
                    onTabChange(tab.key);
                  }
                }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
  );
}