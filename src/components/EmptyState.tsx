import React from 'react';
import { AlertTriangle, Search, Target } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tips?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'default' | 'error' | 'warning';
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  tips = [], 
  action, 
  type = 'default' 
}: EmptyStateProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <div className={`empty-state-icon ${getTypeStyles()}`}>
          {icon}
        </div>
        
        <h3 className="empty-state-title">
          {title}
        </h3>
        
        {description && (
          <p className="empty-state-description">
            {description}
          </p>
        )}
        
        {tips.length > 0 && (
          <div className="empty-state-tips">
            <p className="empty-state-tips-title">Tipps:</p>
            <ul className="empty-state-tips-list">
              {tips.map((tip, index) => (
                <li key={index} className="empty-state-tip">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {action && (
          <button
            className="btn btn-primary empty-state-action"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}