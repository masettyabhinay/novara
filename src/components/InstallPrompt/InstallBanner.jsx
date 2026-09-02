import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, X, Sparkles } from 'lucide-react';
import { isNativePlatform } from '../../services/nativeBridge';

export const InstallBanner = () => {
  const { isInstallable, isStandaloneApp, handleInstallApp } = useApp();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('novara_pwa_dismissed') === 'true';
  });

  if (!isInstallable || isStandaloneApp || isDismissed || isNativePlatform()) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('novara_pwa_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    await handleInstallApp();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'max(80px, calc(env(safe-area-inset-bottom, 16px) + 70px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 850,
        width: 'calc(100% - 32px)',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-beige)',
        borderLeft: '4px solid var(--accent-terracotta)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-floating)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-terracotta-light)',
            color: 'var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Download size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Install NOVARA</span>
            <Sparkles size={12} color="var(--accent-terracotta)" />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Add to home screen for instant offline study.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={handleInstallClick}
          className="btn-primary"
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            minHeight: '34px',
            borderRadius: 'var(--radius-pill)',
            gap: '4px'
          }}
        >
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
          aria-label="Dismiss install prompt"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
