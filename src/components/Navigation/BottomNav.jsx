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
    <nav style={{
      position: 'fixed',
      bottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      left: 0,
      right: 0,
      zIndex: 900,
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'center',
      padding: '0 16px'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-beige)',
        borderRadius: 'var(--radius-pill)',
        padding: '5px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 10px 30px rgba(35, 28, 20, 0.12)',
        width: '100%',
        maxWidth: '400px',
        pointerEvents: 'auto'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: isActive ? 'var(--accent-terracotta)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                minWidth: '52px',
                minHeight: '44px'
              }}
              aria-label={item.label}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                {item.badge > 0 && !isActive && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-7px',
                    backgroundColor: 'var(--accent-terracotta)',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    fontWeight: 700,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.01em'
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
