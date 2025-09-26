import React from 'react';
import { X, Settings, Palette, Monitor } from 'lucide-react';
import SegmentControl from './SegmentControl';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    themeMode: 'light' | 'dark';
    viewMode: 'grid' | 'list';
  };
  onSettingsChange: (settings: { themeMode: 'light' | 'dark'; viewMode: 'grid' | 'list' }) => void;
}

export default function SettingsDrawer({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}: SettingsDrawerProps) {
  const handleThemeChange = (themeMode: 'light' | 'dark') => {
    onSettingsChange({ ...settings, themeMode });
  };

  const handleViewModeChange = (viewMode: 'grid' | 'list') => {
    onSettingsChange({ ...settings, viewMode });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-drawer">
        <div className="settings-header">
          <div className="flex items-center">
            <Settings size={20} className="mr-2" />
            <h2 className="text-lg font-semibold">Einstellungen</h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            <X size={16} />
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <div className="settings-label">
              <Palette size={16} className="mr-2" />
              Theme
            </div>
            <SegmentControl
              options={['light', 'dark'] as const}
              value={settings.themeMode}
              onChange={handleThemeChange}
              className="settings-segment"
            />
          </div>

          <div className="settings-section">
            <div className="settings-label">
              <Monitor size={16} className="mr-2" />
              Ansicht
            </div>
            <SegmentControl
              options={['grid', 'list'] as const}
              value={settings.viewMode}
              onChange={handleViewModeChange}
              className="settings-segment"
            />
          </div>
        </div>
      </div>
    </>
  );
}