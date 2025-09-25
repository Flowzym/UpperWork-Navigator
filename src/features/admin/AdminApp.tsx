import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { RagOverrides, loadOverrides } from '../../lib/rag/overrides';

interface AdminAppProps {
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function AdminApp({ isAdminMode, onToggleAdminMode, onShowToast }: AdminAppProps) {
  const [overrides, setOverrides] = useState<RagOverrides>({ version: 1 });
  const [loading, setLoading] = useState(true);

  // Check if admin mode should be enabled
  const shouldShowAdmin = isAdminMode || new URLSearchParams(window.location.search).get('admin') === '1';

  useEffect(() => {
    if (shouldShowAdmin) {
      loadOverrides().then(data => {
        setOverrides(data);
        setLoading(false);
      }).catch(error => {
        console.error('Failed to load overrides:', error);
        onShowToast('Fehler beim Laden der Admin-Daten', 'error');
        setLoading(false);
      });
    }
  }, [shouldShowAdmin, onShowToast]);

  const handleOverridesChange = (newOverrides: RagOverrides) => {
    setOverrides(newOverrides);
  };

  if (!shouldShowAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-600">Admin-Panel wird geladen...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      <AdminLayout
        overrides={overrides}
        onOverridesChange={handleOverridesChange}
        onClose={() => {
          onToggleAdminMode();
          window.history.replaceState({}, '', window.location.pathname);
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
}