import React from 'react';

interface FooterBarProps {
  onOpenChangelog: () => void;
  onOpenContact: () => void;
}

export default function FooterBar({ onOpenChangelog, onOpenContact }: FooterBarProps) {
  return (
    <footer className="footer-bar">
      <div className="footer-content">
        <div className="footer-left">
          <span className="footer-text">Stand der Broschüre: 09/2025 (Dummy)</span>
        </div>
        
        <div className="footer-center">
          <span className="footer-text">Version: 0.1 (UI-Demo)</span>
        </div>
        
        <div className="footer-right">
          <button className="footer-link" onClick={onOpenChangelog}>
            Changelog
          </button>
          <span className="footer-separator">·</span>
          <button className="footer-link" onClick={onOpenContact}>
            Kontakt
          </button>
        </div>
      </div>
    </footer>
  );
}