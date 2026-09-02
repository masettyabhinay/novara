import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopHeader } from './components/Navigation/TopHeader';
import { BottomNav } from './components/Navigation/BottomNav';
import { SidebarNav } from './components/Navigation/SidebarNav';

import { TodayView } from './components/Today/TodayView';
import { CalendarView } from './components/Calendar/CalendarView';
import { CoachView } from './components/Coach/CoachView';
import { InterviewView } from './components/Interview/InterviewView';
import { RoadmapView } from './components/Roadmap/RoadmapView';
import { RevisionView } from './components/Revision/RevisionView';
import { ApplicationsView } from './components/Applications/ApplicationsView';
import { ProgressView } from './components/Progress/ProgressView';
import { ProfileView } from './components/Profile/ProfileView';

import { AuthModal } from './components/Auth/AuthModal';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { RoadmapUploadModal } from './components/RoadmapUpload/RoadmapUploadModal';
import { FocusSessionModal } from './components/Focus/FocusSessionModal';
import { ActiveRevisionModal } from './components/Revision/ActiveRevisionModal';
import { TopicRevisionDetailModal } from './components/Revision/TopicRevisionDetailModal';
import { AdaptivePlanModal } from './components/AdaptivePlan/AdaptivePlanModal';
import { AddCalendarEventModal } from './components/Calendar/AddCalendarEventModal';
import { NotificationDrawer } from './components/Notifications/NotificationDrawer';
import { InstallBanner } from './components/InstallPrompt/InstallBanner';
import { UpdateBanner } from './components/InstallPrompt/UpdateBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WifiOff, Loader2, Compass } from 'lucide-react';

const AppContent = () => {
  const { activeTab, toastMessages, isOffline, isAuthLoading } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'today':
        return <TodayView />;
      case 'calendar':
        return <CalendarView />;
      case 'coach':
        return <CoachView />;
      case 'interview':
        return <InterviewView />;
      case 'roadmap':
        return <RoadmapView />;
      case 'revision':
        return <RevisionView />;
      case 'applications':
        return <ApplicationsView />;
      case 'progress':
        return <ProgressView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <TodayView />;
    }
  };

  if (isAuthLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-warm-cream)',
        gap: '16px',
        animation: 'fadeIn 200ms ease-out'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          backgroundColor: 'var(--accent-terracotta)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px var(--accent-terracotta-glow)'
        }}>
          <Compass size={32} strokeWidth={2.2} />
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            marginBottom: '4px'
          }}>
            NOVARA
          </div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Your placement journey, organized.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '8px' }}>
          <Loader2 size={14} style={{ animation: 'spin 1.2s linear infinite' }} />
          <span>Synchronizing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root-layout">
      {/* Offline Status Pill Notification */}
      {isOffline && (
        <div style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: 'var(--text-charcoal)',
          color: '#FFFFFF',
          fontSize: '11.5px',
          fontWeight: 600,
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <WifiOff size={13} color="var(--accent-terracotta)" />
          <span>You're offline. Changes will sync when you're back online.</span>
        </div>
      )}

      {/* Desktop & Tablet Sidebar */}
      <SidebarNav />

      {/* Main App Container */}
      <div className="app-main-container">
        {/* Mobile Header */}
        <div className="mobile-header-wrapper" style={{ display: 'block' }}>
          <TopHeader />
        </div>

        {/* Scrollable View Content */}
        <main className="app-content-body">
          {renderActiveView()}
        </main>

        {/* Mobile Floating Bottom Navigation */}
        <div className="mobile-nav-wrapper">
          <BottomNav />
        </div>
      </div>

      {/* PWA Lifecycle Banners */}
      <UpdateBanner />
      <InstallBanner />

      {/* Global Modals & Drawers */}
      <AuthModal />
      <OnboardingFlow />
      <RoadmapUploadModal />
      <FocusSessionModal />
      <ActiveRevisionModal />
      <TopicRevisionDetailModal />
      <AdaptivePlanModal />
      <AddCalendarEventModal />
      <NotificationDrawer />

      {/* Toast Notification Stack */}
      <div className="toast-container">
        {toastMessages.map((t) => (
          <div key={t.id} className="toast-item">
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: t.type === 'sage' ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
              flexShrink: 0
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                {t.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {t.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
