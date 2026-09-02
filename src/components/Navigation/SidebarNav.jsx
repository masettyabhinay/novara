import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Compass, 
  CheckSquare, 
  Calendar,
  Map, 
  RotateCcw, 
  TrendingUp, 
  User, 
  Users,
  Briefcase,
  UploadCloud, 
  Bell, 
  Flame, 
  LogOut,
  Sparkles
} from 'lucide-react';

export const SidebarNav = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    userProfile, 
    streakData, 
    revisionQueue, 
    applicationMetrics,
    notifications,
    setIsUploadModalOpen,
    setIsNotifDrawerOpen,
    setIsAuthModalOpen,
    handleLogout
  } = useApp();

  const unreadCount = notifications.filter(n => n.unread).length;

  const dueRevisionsCount = (revisionQueue || []).filter(
    (r) => r.revisionDueDate === 'Today' || (r.revisionDueDate || '').startsWith('Overdue')
  ).length;

  const navLinks = [
    { id: 'today', label: "Today's Mission", icon: CheckSquare },
    { id: 'calendar', label: 'Calendar & Schedule', icon: Calendar },
    { id: 'coach', label: 'Placement Coach', icon: Sparkles },
    { id: 'interview', label: 'Mock Interview', icon: Users },
    { id: 'roadmap', label: 'Visual Roadmap', icon: Map },
    { id: 'revision', label: 'Spaced Revision', icon: RotateCcw, badge: dueRevisionsCount },
    { id: 'applications', label: 'Application Tracker', icon: Briefcase, badge: applicationMetrics?.inProcessCount || 0 },
    { id: 'progress', label: 'Readiness & Analytics', icon: TrendingUp },
    { id: 'profile', label: 'Student Profile', icon: User }
  ];



  return (
    <aside className="app-desktop-sidebar">
      {/* Top Brand Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px var(--accent-terracotta-glow)'
          }}>
            <Compass size={22} strokeWidth={2.2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-charcoal)',
                letterSpacing: '-0.02em'
              }}>
                NOVARA
              </span>
              <span style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-terracotta-light)',
                color: 'var(--accent-terracotta)',
                fontWeight: 700
              }}>
                AI
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '24px', paddingLeft: '2px' }}>
          Your new career begins here.
        </p>

        {/* Upload Roadmap Action Button */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: 'var(--accent-terracotta-light)',
            border: '1px solid rgba(200, 90, 50, 0.25)',
            color: 'var(--accent-terracotta)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '20px',
            transition: 'all 200ms ease'
          }}
        >
          <UploadCloud size={16} />
          <span>Upload Roadmap</span>
        </button>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--accent-terracotta)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '13px',
                  transition: 'all 150ms ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--accent-terracotta)',
                    color: '#FFFFFF'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Streak Widget */}
      <div>
        {/* Compact Streak Widget */}
        <div style={{
          backgroundColor: 'var(--bg-warm-cream)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={20} fill="var(--accent-terracotta)" color="var(--accent-terracotta)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {streakData.currentStreak} Day Streak
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {streakData.todayTargetMet ? 'Goal Met Today ✓' : '1 task remaining'}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & User Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-beige-light)'
        }}>
          <div 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-terracotta)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 800
            }}>
              {currentUser?.avatar || 'AR'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', lineHeight: '1.2' }}>
                {currentUser?.name || userProfile.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {userProfile.targetRole.split('(')[0]}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsNotifDrawerOpen(true)}
            style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-warm-cream)',
              border: '1px solid var(--border-beige)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
            title="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-terracotta)'
              }} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
