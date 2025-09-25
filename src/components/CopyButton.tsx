import React from 'react';
import { Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  onCopy?: (success: boolean) => void;
}

export default function CopyButton({ text, label = "Kopieren", className = "btn btn-secondary", onCopy }: CopyButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopy?.(true);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onCopy?.(true);
    }
  };

  return (
    <button
      className={className}
      onClick={handleCopy}
    >
      <Copy size={14} className="mr-1" />
      {label}
    </button>
  );
}