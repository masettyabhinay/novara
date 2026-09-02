import React from 'react';
import { useApp } from '../../context/AppContext';
import { RefreshCw } from 'lucide-react';

export const UpdateBanner = () => {
  const { isUpdateAvailable, applyAppUpdate, isFocusModalOpen } = useApp();

  // Do not show update banner during an active focus session to avoid disruption
  if (!isUpdateAvailable || isFocusModalOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
        backgroundColor: 'var(--text-charcoal)',
        color: '#FFFFFF',
        borderRadius: 'var(--radius-pill)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: 'var(--shadow-floating)',
        animation: 'slideDownToast 300ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600 }}>
        <RefreshCw size={15} color="var(--accent-terracotta)" />
        <span>NOVARA has been updated.</span>
      </div>

      <button
        onClick={applyAppUpdate}
        style={{
          backgroundColor: 'var(--accent-terracotta)',
          color: '#FFFFFF',
          border: 'none',
          padding: '4px 12px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '11.5px',
          fontWeight: 700,
          cursor: 'pointer',
          minHeight: '28px'
        }}
      >
        Refresh
      </button>
    </div>
  );
};
