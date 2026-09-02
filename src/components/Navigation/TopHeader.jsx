import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Compass, 
  Bell, 
  Map
} from 'lucide-react';

export const TopHeader = () => {
  const { 
    userProfile, 
    notifications, 
    setIsNotifDrawerOpen, 
    setActiveTab,
    roadmapProgress,
    currentUser,
    syncStatus,
    pendingSyncCount
  } = useApp();

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      backgroundColor: 'var(--bg-warm-cream)',
      borderBottom: '1px solid var(--border-beige-light)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Brand & Role */}
      <div 
        onClick={() => setActiveTab('today')}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: 0 }}
      >
        <div style={{
          width: '34px',
          height: '34px',
          minWidth: '34px',
          borderRadius: '10px',
          backgroundColor: 'var(--accent-terracotta)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 3px 10px var(--accent-terracotta-glow)'
        }}>
          <Compass size={18} strokeWidth={2.2} />
        </div>

        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ 
              fontFamily: 'Outfit, sans-serif', 
              fontSize: '17px', 
              fontWeight: 800, 
              color: 'var(--text-charcoal)',
              letterSpacing: '-0.02em',
              lineHeight: '1.2'
            }}>
              NOVARA
            </span>
            <span style={{
              fontSize: '8px',
              padding: '1px 5px',
              borderRadius: '9999px',
              backgroundColor: 'var(--accent-terracotta-light)',
              color: 'var(--accent-terracotta)',
              fontWeight: 700
            }}>
              AI
            </span>
          </div>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            display: 'block'
          }}>
            {userProfile.targetRole.split('(')[0]}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Offline & Sync Status Pill */}
        {syncStatus === 'offline' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--accent-terracotta-light)',
              border: '1px solid rgba(200, 90, 50, 0.3)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)'
            }}
            title="Changes will sync when you're back online"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-terracotta)' }} />
            <span>Offline</span>
          </div>
        )}

        {syncStatus === 'syncing' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--accent-sage)'
            }}
          >
            <span>Syncing...</span>
          </div>
        )}

        {pendingSyncCount > 0 && syncStatus !== 'syncing' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--accent-amber-light)',
              border: '1px solid rgba(217, 130, 43, 0.3)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--accent-amber)'
            }}
            title={`${pendingSyncCount} change(s) waiting to sync`}
          >
            <span>{pendingSyncCount} queued</span>
          </div>
        )}

        {/* Roadmap Progress Indicator */}
        <button
          onClick={() => setActiveTab('roadmap')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-beige)',
            padding: '5px 10px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-charcoal)',
            boxShadow: 'var(--shadow-sm)',
            minHeight: '34px'
          }}
          title="View full roadmap"
        >
          <Map size={12} color="var(--accent-terracotta)" />
          <span>Roadmap: <strong style={{ color: 'var(--accent-terracotta)' }}>{roadmapProgress}%</strong></span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setIsNotifDrawerOpen(true)}
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-beige)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-charcoal)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer'
          }}
          aria-label="Open notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-terracotta)',
              boxShadow: '0 0 0 2px #FFFFFF'
            }} />
          )}
        </button>

        {/* Profile Avatar button */}
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-terracotta-light)',
            border: '1px solid rgba(200, 90, 50, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-terracotta)',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
          aria-label="Profile"
        >
          {currentUser?.avatar || 'AR'}
        </button>
      </div>
    </header>
  );
};
