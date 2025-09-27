import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { RagOverrides, loadOverrides } from '../../lib/rag/overrides';

interface AdminAppProps {
  onClose: () => void;
}

export default function AdminApp({ onClose }: AdminAppProps) {
  const [overrides, setOverrides] = useState<RagOverrides>({ version: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverrides().then(data => {
      setOverrides(data);
      setLoading(false);
    }).catch(error => {
      console.error('Failed to load overrides:', error);
      setLoading(false);
    });
  }, []);

  const handleOverridesChange = (newOverrides: RagOverrides) => {
    setOverrides(newOverrides);
  };

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
        onClose={onClose}
        onShowToast={(msg, type) => console.log(`[${type}] ${msg}`)}
      />
    </div>
  );
}