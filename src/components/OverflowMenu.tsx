import React, { useEffect, useRef } from 'react';

interface OverflowMenuItem {
  label: string;
  onClick: () => void;
  checked?: boolean;
  icon?: string;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export default function OverflowMenu({ items, isOpen, onClose, anchorRef }: OverflowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48 py-1"
    >
      {items.map((item, index) => (
        <button
          key={index}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
          {item.checked !== undefined && (
            <span className="text-blue-500">{item.checked ? '✓' : ''}</span>
          )}
        </button>
      ))}
    </div>
  );
}