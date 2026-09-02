import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Flame, 
  Award, 
  TrendingUp, 
  Settings, 
  Calendar, 
  Clock, 
  Bell, 
  UploadCloud, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Edit2,
  Check,
  BellRing,
  AlertTriangle,
  RefreshCw,
  Database
} from 'lucide-react';

export const ProfileView = () => {
  const { 
    currentUser, 
    userProfile, 
    setUserProfile, 
    activeRoadmap,
    streakData, 
    roadmapProgress,
    applications,
    applicationMetrics,
    readinessMetrics, 
    setActiveTab,
    setIsNotifDrawerOpen, 
    setIsUploadModalOpen, 
    setIsAuthModalOpen,
    notifPreferences,
    setNotifPreferences,
    sendTestNotification,
    browserPermission,
    requestBrowserPermission,
    handleLogout,
    showToast,
    syncStatus,
    pendingSyncCount,
    lastSyncedAt,
    triggerManualSync
  } = useApp();

  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isReplaceConfirmOpen, setIsReplaceConfirmOpen] = useState(false);
  const [roleInput, setRoleInput] = useState(userProfile.targetRole);
  const [timeInput, setTimeInput] = useState(userProfile.dailyTargetHours);

  const handleSaveProfile = () => {
    setUserProfile({
      targetRole: roleInput,
      dailyTargetHours: parseFloat(timeInput)
    });
    setIsEditingRole(false);
    showToast('Profile Updated ✨', 'Your target role and daily capacity have been saved.');
  };

  const handleTogglePref = (key) => {
    const updated = {
      ...notifPreferences,
      [key]: !notifPreferences[key]
    };
    setNotifPreferences(updated);
  };

  return (
    <div style={{ animation: 'fadeIn 250ms ease' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '20px' }}>
        <span className="pill-badge pill-neutral" style={{ marginBottom: '6px' }}>
          Account & Preferences
        </span>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          color: 'var(--text-charcoal)',
          letterSpacing: '-0.02em',
          marginBottom: '4px'
        }}>
          Student Profile
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage your placement target goals, smart notifications, and cloud sync.
        </p>
      </div>

      {/* Main Profile Header Card */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          {/* Avatar circle */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '24px',
            backgroundColor: 'var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '24px',
            fontWeight: 800,
            boxShadow: '0 6px 18px var(--accent-terracotta-glow)'
          }}>
            {currentUser?.avatar || 'AR'}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '2px' }}>
              {currentUser?.name || userProfile.name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {currentUser?.email || 'student@novara.dev'}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--accent-terracotta-light)',
              color: 'var(--accent-terracotta)'
            }}>
              🎯 {userProfile.targetRole}
            </div>
          </div>
        </div>

        {/* 3 Quick Performance Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          backgroundColor: 'var(--bg-warm-cream-alt)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Current Streak
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-terracotta)', marginTop: '2px' }}>
              {streakData.currentStreak || 0} Days
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Longest
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
              {streakData.longestStreak || 0} Days
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Roadmap Progress
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-sage)', marginTop: '2px' }}>
              {roadmapProgress || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Target Goals Configuration Card */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
            Placement Preparation Goals
          </h3>
          <button
            type="button"
            onClick={() => setIsEditingRole(!isEditingRole)}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Edit2 size={13} />
            <span>{isEditingRole ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {isEditingRole ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Target Role
              </label>
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-warm-cream)'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Daily Study Capacity (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="8"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-warm-cream)'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              className="btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '13px' }}
            >
              <Check size={15} />
              <span>Save Goals</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Target Role</span>
              <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{userProfile.targetRole}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Placement Target Date</span>
              <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{userProfile.targetDate}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Daily Study Capacity</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-terracotta)' }}>{userProfile.dailyTargetHours} Hours / day</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Timezone</span>
              <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{userProfile.timezone || 'Local'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ROADMAP MANAGEMENT CARD */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Roadmap
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
              {activeRoadmap?.title || 'No Roadmap Uploaded'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {activeRoadmap ? `${roadmapProgress}% complete • ${activeRoadmap.phases?.length || 0} preparation phases` : 'Upload your placement roadmap and NOVARA will turn it into your daily preparation plan.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeRoadmap) {
              setIsReplaceConfirmOpen(true);
            } else {
              setIsUploadModalOpen(true);
            }
          }}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '11px',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: 'var(--radius-pill)',
            gap: '6px'
          }}
        >
          <UploadCloud size={15} />
          <span>Upload New Roadmap</span>
        </button>
      </div>

      {/* APPLICATIONS SUMMARY CARD */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Placement Applications
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
              Active Opportunities
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px' }}
          >
            <span>View Applications</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          backgroundColor: 'var(--bg-warm-cream-alt)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Applications
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
              {applicationMetrics?.appliedCount ?? applications.length}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Interviews
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-terracotta)', marginTop: '2px' }}>
              {applicationMetrics?.interviewCount ?? 0}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Offers
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-sage)', marginTop: '2px' }}>
              {applicationMetrics?.offerCount ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* CLOUD SYNC & RELIABILITY CARD */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Offline & Cloud Persistence
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
              Sync Reliability
            </h3>
          </div>

          <button
            type="button"
            onClick={triggerManualSync}
            disabled={syncStatus === 'syncing'}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '5px' }}
          >
            <RefreshCw size={12} className={syncStatus === 'syncing' ? 'spin-icon' : ''} />
            <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: 'var(--bg-warm-cream-alt)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-beige)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={15} color="var(--accent-terracotta)" />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                  Cloud Synchronization Status
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {pendingSyncCount > 0
                    ? `${pendingSyncCount} offline change(s) waiting to sync`
                    : 'All local changes synchronized with cloud'}
                </div>
              </div>
            </div>

            <span className={`pill-badge ${
              syncStatus === 'synced' ? 'pill-sage' :
              syncStatus === 'offline' ? 'pill-terracotta' :
              pendingSyncCount > 0 ? 'pill-amber' : 'pill-neutral'
            }`}>
              {syncStatus === 'synced' ? '✓ Synced' :
               syncStatus === 'offline' ? 'Offline' :
               syncStatus === 'syncing' ? 'Syncing...' : 'Pending'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span>Last synchronized:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS & SMART REMINDERS CARD */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
              Notifications & Reminders
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Configure proactive schedule alerts and streak warnings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNotifDrawerOpen(true)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            Open Center
          </button>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {[
            { key: 'dailyPlanReminder', label: 'Daily Plan Reminder', time: notifPreferences.preferredReminderTimes?.dailyPlan || '08:00' },
            { key: 'studySessionReminder', label: 'Study Session Reminder', time: '15 min before' },
            { key: 'unfinishedTaskReminder', label: 'Unfinished Task Reminder', time: notifPreferences.preferredReminderTimes?.unfinishedTask || '20:30' },
            { key: 'streakRiskReminder', label: 'Streak Risk Reminder', time: notifPreferences.preferredReminderTimes?.streakRisk || '21:30' },
            { key: 'revisionReminder', label: 'Revision Reminder', time: notifPreferences.preferredReminderTimes?.revision || '09:00' },
            { key: 'weeklySummary', label: 'Weekly Progress Summary', time: 'Sun 6:00 PM' }
          ].map((item) => (
            <div 
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige-light)'
              }}
            >
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-charcoal)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  Scheduled: {item.time}
                </div>
              </div>

              <input
                type="checkbox"
                checked={notifPreferences[item.key] !== false}
                onChange={() => handleTogglePref(item.key)}
                style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>

        {/* Test Notification Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-beige-light)' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Test Notification:
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => sendTestNotification('plan')}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              🎯 Plan
            </button>
            <button
              type="button"
              onClick={() => sendTestNotification('task')}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              ⏰ Task
            </button>
            <button
              type="button"
              onClick={() => sendTestNotification('streak')}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              🔥 Streak
            </button>
          </div>
        </div>
      </div>

      {/* PLACEMENT COACH SETTINGS CARD */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
              Placement Coach
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Manage AI preparation analysis and weekly coach takeaways.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('coach')}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            Open Coach
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-warm-cream-alt)',
              border: '1px solid var(--border-beige-light)'
            }}
          >
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-charcoal)' }}>
                Coach Insights & Warnings
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Shows actionable recommendations on Today screen
              </div>
            </div>

            <input
              type="checkbox"
              defaultChecked={true}
              style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
            />
          </div>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-warm-cream-alt)',
              border: '1px solid var(--border-beige-light)'
            }}
          >
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-charcoal)' }}>
                Weekly Coach Report
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Generates end-of-week preparation progress breakdown
              </div>
            </div>

            <input
              type="checkbox"
              defaultChecked={true}
              style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* MOCK INTERVIEW STATS CARD */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
              Mock Interviews
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Track live technical and behavioral interview performance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('interview')}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            Start Interview
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          textAlign: 'center'
        }}>
          <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 4px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-charcoal)' }}>
              {streakData.interviewsCompleted || 2}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Done</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 4px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>
              78%
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Avg Score</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 4px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-sage)' }}>
              84%
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Best</div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 4px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-navy)' }}>
              78%
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Latest</div>
          </div>
        </div>
      </div>

      {/* Settings Navigation Action List */}
      <div className="card-white" style={{ marginBottom: '24px', padding: '10px 16px' }}>


        {[
          { icon: Bell, label: 'Notification Center', action: () => setIsNotifDrawerOpen(true), desc: 'View activity & manage reminder times' },
          { icon: UploadCloud, label: 'Roadmap Management', action: () => setIsUploadModalOpen(true), desc: 'Upload or re-analyze syllabus' },
          { icon: ShieldCheck, label: 'Streak Freezes Inventory', action: () => showToast('Streak Freezes', `You currently have ${streakData.freezeCount ?? 2} freezes available.`), desc: `${streakData.freezeCount ?? 2} available` }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              onClick={item.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: i < 2 ? '1px solid var(--border-beige-light)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-terracotta)'
                }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          );
        })}
      </div>

      {/* Logout / Switch Account Button */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="btn-secondary"
          style={{ flex: 1, padding: '12px' }}
        >
          <User size={15} />
          <span>Switch Account</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-secondary"
          style={{ padding: '12px 18px', color: 'var(--accent-terracotta)', borderColor: 'rgba(200, 90, 50, 0.3)' }}
        >
          <LogOut size={15} />
          <span>Log Out</span>
        </button>
      </div>

      {/* Replace Roadmap Confirmation Modal */}
      {isReplaceConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsReplaceConfirmOpen(false)}>
          <div 
            className="modal-content-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '24px', maxWidth: '440px', textAlign: 'center' }}
          >
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-terracotta-light)',
              color: 'var(--accent-terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              Replace current roadmap?
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '20px' }}>
              Your current roadmap will be replaced after you confirm the new plan. Your completed tasks, streak, study sessions, and revision records will remain safely preserved.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsReplaceConfirmOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '11px', fontSize: '13px' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsReplaceConfirmOpen(false);
                  setIsUploadModalOpen(true);
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: '13px' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe bottom spacer */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
