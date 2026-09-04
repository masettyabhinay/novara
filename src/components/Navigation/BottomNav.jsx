import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckSquare, 
  Calendar,
  Map, 
  RotateCcw, 
  Briefcase,
  TrendingUp, 
  User
} from 'lucide-react';

export const BottomNav = () => {
  const { activeTab, setActiveTab, revisionQueue, applicationMetrics, isFocusModalOpen, isRevisionModeOpen } = useApp();

  if (isFocusModalOpen || isRevisionModeOpen) return null;

  const dueRevisionsCount = (revisionQueue || []).filter(
    (r) => r.revisionDueDate === 'Today' || (r.revisionDueDate || '').startsWith('Overdue')
  ).length;

  const navItems = [
    { id: 'today', label: 'Today', icon: CheckSquare },
    { id: 'calendar', label: 'Cal', icon: Calendar },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
    { id: 'revision', label: 'Revision', icon: RotateCcw, badge: dueRevisionsCount },
    { id: 'applications', label: 'Apps', icon: Briefcase, badge: applicationMetrics?.inProcessCount || 0 },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav 
      className="mobile-bottom-nav-container"
      style={{
        position: 'fixed',
        bottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        left: 0,
        right: 0,
        zIndex: 900,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 12px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="mobile-bottom-nav-bar"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-pill)',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 30px rgba(35, 28, 20, 0.12)',
          width: '100%',
          maxWidth: '430px',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`bottom-nav-tab-btn ${isActive ? 'active' : ''}`}
              style={{
                position: 'relative',
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '5px 2px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: isActive ? 'var(--accent-terracotta)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                minHeight: '44px',
                border: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
              aria-label={item.label}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} style={{ flexShrink: 0 }} />
                {item.badge > 0 && !isActive && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-9px',
                    backgroundColor: 'var(--accent-terracotta)',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    fontWeight: 800,
                    minWidth: '15px',
                    height: '15px',
                    padding: '0 3px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 1.5px #FFFFFF',
                    pointerEvents: 'none',
                    lineHeight: '1'
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? 800 : 600,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
