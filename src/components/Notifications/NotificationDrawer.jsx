import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Clock, 
  Flame, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Sliders,
  Trash2,
  BellRing,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Briefcase,
  Target,
  BarChart3
} from 'lucide-react';

export const NotificationDrawer = () => {
  const { 
    notifications, 
    isNotifDrawerOpen, 
    setIsNotifDrawerOpen, 
    notifPreferences, 
    setNotifPreferences,
    markSingleNotificationRead,
    dismissNotification,
    clearAllNotifications,
    markAllNotifsRead,
    navigateToNotificationTarget,
    browserPermission,
    requestBrowserPermission,
    sendTestNotification,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'settings'

  const handleClose = useCallback(() => {
    if (setIsNotifDrawerOpen) setIsNotifDrawerOpen(false);
  }, [setIsNotifDrawerOpen]);

  // Escape key close listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isNotifDrawerOpen) {
        handleClose();
      }
    };
    if (isNotifDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNotifDrawerOpen, handleClose]);

  if (!isNotifDrawerOpen) return null;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'DAILY_PLAN':
      case 'plan':
        return <Target size={18} color="var(--accent-terracotta)" />;
      case 'TASK_REMINDER':
      case 'reminder':
        return <Clock size={18} color="var(--accent-terracotta)" />;
      case 'STREAK_RISK':
      case 'streak':
        return <Flame size={18} color="var(--accent-terracotta)" />;
      case 'REVISION_DUE':
      case 'revision':
        return <RotateCcw size={18} color="var(--accent-amber)" />;
      case 'APPLICATION_DEADLINE':
      case 'INTERVIEW_SCHEDULED':
      case 'interview':
        return <Briefcase size={18} color="var(--accent-sage)" />;
      case 'WEEKLY_SUMMARY':
      case 'summary':
        return <BarChart3 size={18} color="var(--accent-navy)" />;
      default:
        return <Bell size={18} color="var(--accent-terracotta)" />;
    }
  };

  // Group notifications into TODAY and EARLIER
  const todayNotifications = (notifications || []).filter(
    (n) => n.time === 'Today' || n.time === 'Just now' || n.time?.includes('m ago') || n.time?.includes('h ago')
  );
  const earlierNotifications = (notifications || []).filter(
    (n) => !todayNotifications.includes(n)
  );

  const unreadCount = (notifications || []).filter((n) => n.unread).length;

  const handleTogglePref = (key) => {
    const updated = {
      ...(notifPreferences || {}),
      [key]: !notifPreferences?.[key]
    };
    if (setNotifPreferences) setNotifPreferences(updated);
  };

  const handleTimeChange = (key, value) => {
    const updatedTimes = {
      ...(notifPreferences?.preferredReminderTimes || {}),
      [key]: value
    };
    if (setNotifPreferences) {
      setNotifPreferences({
        ...(notifPreferences || {}),
        preferredReminderTimes: updatedTimes
      });
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-drawer-title"
      style={{ zIndex: 1060 }}
    >
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          padding: '24px 20px', 
          maxWidth: '480px', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-beige)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)',
              flexShrink: 0
            }}>
              <Bell size={18} />
            </div>
            <div>
              <h2 id="notif-drawer-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.2', margin: 0 }}>
                Notifications
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close notification drawer"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Subheader: unread count • Mark all as read • Notification preferences */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-warm-cream)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '14px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: unreadCount > 0 ? 800 : 600,
              color: unreadCount > 0 ? 'var(--accent-terracotta)' : 'var(--text-muted)' 
            }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "0 unread (Caught up ✨)"}
            </span>

            {unreadCount > 0 && (
              <>
                <span style={{ color: 'var(--border-beige-dark)', fontSize: '10px' }}>•</span>
                <button
                  type="button"
                  onClick={markAllNotifsRead}
                  style={{
                    fontSize: '12px',
                    color: 'var(--accent-terracotta)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    minHeight: '28px'
                  }}
                >
                  <CheckCheck size={13} />
                  <span>Mark all as read</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'settings' ? 'notifications' : 'settings')}
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: activeTab === 'settings' ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px'
            }}
          >
            <Sliders size={13} />
            <span>{activeTab === 'settings' ? 'View activity' : 'Preferences'}</span>
          </button>
        </div>

        {/* Navigation & Controls Bar: Tabs & Clear */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '14px',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-warm-cream-alt)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px',
            flex: 1
          }} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: activeTab === 'notifications' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'notifications' ? 'var(--text-charcoal)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'notifications' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 150ms ease',
                minHeight: '36px'
              }}
            >
              Activity {unreadCount > 0 && <span style={{ color: 'var(--accent-terracotta)', fontWeight: 800 }}>({unreadCount})</span>}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: activeTab === 'settings' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'settings' ? 'var(--text-charcoal)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'settings' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 150ms ease',
                minHeight: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <Sliders size={13} />
              <span>Preferences</span>
            </button>
          </div>

          {activeTab === 'notifications' && (notifications || []).length > 0 && (
            <button
              type="button"
              onClick={clearAllNotifications}
              title="Clear all notifications"
              aria-label="Clear all notifications"
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                padding: '6px 10px',
                minHeight: '36px',
                flexShrink: 0
              }}
            >
              <Trash2 size={12} />
              <span>Clear all</span>
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
          {activeTab === 'notifications' ? (
            <div>
              {/* Top Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Smart Reminders
                </span>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotifsRead}
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--accent-terracotta)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 0'
                      }}
                    >
                      <CheckCheck size={14} />
                      <span>Mark all read</span>
                    </button>
                  )}

                  {(notifications || []).length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 0'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Empty State */}
              {(!notifications || notifications.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-warm-cream-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    margin: '0 auto 12px auto'
                  }}>
                    <Bell size={22} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', margin: '0 0 4px 0' }}>
                    You're all caught up! ✨
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                    NOVARA will proactively notify you when study tasks, revisions, or application deadlines require attention.
                  </p>
                  <button
                    type="button"
                    onClick={() => sendTestNotification && sendTestNotification('streak')}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 16px', borderRadius: 'var(--radius-pill)', minHeight: '40px' }}
                  >
                    Send Test Reminder
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* TODAY GROUP */}
                  {todayNotifications.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                        Today
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {todayNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="card-white interactive"
                            style={{
                              padding: '12px 14px',
                              backgroundColor: notif.unread ? 'var(--accent-terracotta-light)' : '#FFFFFF',
                              borderColor: notif.unread ? 'rgba(200, 90, 50, 0.35)' : 'var(--border-beige)',
                              position: 'relative',
                              cursor: 'pointer',
                              borderLeft: notif.unread ? '4px solid var(--accent-terracotta)' : '1px solid var(--border-beige)'
                            }}
                            onClick={() => navigateToNotificationTarget && navigateToNotificationTarget(notif)}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: '1px solid var(--border-beige-light)',
                                marginTop: '1px'
                              }}>
                                {getNotifIcon(notif.type)}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', lineHeight: '1.3', margin: 0 }}>
                                    {notif.title}
                                  </h4>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                      {notif.time}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label="Dismiss notification"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (dismissNotification) dismissNotification(notif.id);
                                      }}
                                      style={{
                                        border: 'none',
                                        background: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        minHeight: '44px',
                                        minWidth: '44px',
                                        justifyContent: 'center',
                                        borderRadius: 'var(--radius-pill)',
                                        margin: '-6px -8px -6px 0'
                                      }}
                                      title="Dismiss"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>

                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0', lineHeight: '1.4' }}>
                                  {notif.message}
                                </p>

                                {notif.actionLabel && (
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    color: 'var(--accent-terracotta)',
                                    marginTop: '6px'
                                  }}>
                                    <span>{notif.actionLabel}</span>
                                    <ArrowRight size={13} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EARLIER GROUP */}
                  {earlierNotifications.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                        Earlier
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {earlierNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="card-white interactive"
                            style={{
                              padding: '12px 14px',
                              backgroundColor: notif.unread ? 'var(--accent-terracotta-light)' : '#FFFFFF',
                              borderColor: notif.unread ? 'rgba(200, 90, 50, 0.35)' : 'var(--border-beige)',
                              cursor: 'pointer',
                              borderLeft: notif.unread ? '4px solid var(--accent-terracotta)' : '1px solid var(--border-beige)'
                            }}
                            onClick={() => navigateToNotificationTarget && navigateToNotificationTarget(notif)}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: '1px solid var(--border-beige-light)',
                                marginTop: '1px'
                              }}>
                                {getNotifIcon(notif.type)}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', margin: 0 }}>
                                    {notif.title}
                                  </h4>
                                  <button
                                    type="button"
                                    aria-label="Dismiss notification"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (dismissNotification) dismissNotification(notif.id);
                                    }}
                                    style={{ 
                                      border: 'none', 
                                      background: 'none', 
                                      color: 'var(--text-muted)', 
                                      cursor: 'pointer',
                                      padding: '10px',
                                      minHeight: '44px',
                                      minWidth: '44px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: 'var(--radius-pill)',
                                      margin: '-6px -8px -6px 0'
                                    }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                                  {notif.message}
                                </p>

                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {notif.time}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ===============================================================
               SETTINGS / PREFERENCES TAB
               =============================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Web Push Permission Banner */}
              {browserPermission !== 'granted' && (
                <div 
                  className="card-white"
                  style={{
                    backgroundColor: 'var(--bg-warm-cream-alt)',
                    borderColor: 'var(--accent-terracotta)',
                    padding: '14px',
                    borderLeft: '4px solid var(--accent-terracotta)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <BellRing size={18} color="var(--accent-terracotta)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Stay on track with Placement Alerts
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        Receive browser reminders for daily missions, revisions, and application deadlines.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={requestBrowserPermission}
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '12px', minHeight: '38px' }}
                    >
                      Enable Push Notifications
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Categories & Custom Reminder Times */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Daily Plan Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <label htmlFor="pref-daily-plan" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', cursor: 'pointer' }}>
                        Daily Plan Reminder
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Sent when your daily mission is ready
                      </div>
                    </div>
                    <input
                      id="pref-daily-plan"
                      type="checkbox"
                      checked={notifPreferences?.dailyPlanReminder !== false}
                      onChange={() => handleTogglePref('dailyPlanReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.2)', cursor: 'pointer', minWidth: '20px', minHeight: '20px' }}
                    />
                  </div>
                  {notifPreferences?.dailyPlanReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Reminder Time:</span>
                      <input
                        type="time"
                        aria-label="Daily plan reminder time"
                        value={notifPreferences?.preferredReminderTimes?.dailyPlan || '08:00'}
                        onChange={(e) => handleTimeChange('dailyPlan', e.target.value)}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)',
                          minHeight: '32px'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Study Session Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <label htmlFor="pref-study-session" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', cursor: 'pointer' }}>
                        Study Session Reminder
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Warning before scheduled practice sessions
                      </div>
                    </div>
                    <input
                      id="pref-study-session"
                      type="checkbox"
                      checked={notifPreferences?.studySessionReminder !== false}
                      onChange={() => handleTogglePref('studySessionReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.2)', cursor: 'pointer', minWidth: '20px', minHeight: '20px' }}
                    />
                  </div>
                  {notifPreferences?.studySessionReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Notify before:</span>
                      <select
                        aria-label="Study session notice interval"
                        value={notifPreferences?.preferredReminderTimes?.studySessionMinutesBefore || 15}
                        onChange={(e) => handleTimeChange('studySessionMinutesBefore', parseInt(e.target.value, 10))}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)',
                          minHeight: '32px'
                        }}
                      >
                        <option value={10}>10 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Streak Risk Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <label htmlFor="pref-streak-risk" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', cursor: 'pointer' }}>
                        Streak Risk Reminder
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Alerts before midnight if streak target is unmet
                      </div>
                    </div>
                    <input
                      id="pref-streak-risk"
                      type="checkbox"
                      checked={notifPreferences?.streakRiskReminder !== false}
                      onChange={() => handleTogglePref('streakRiskReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.2)', cursor: 'pointer', minWidth: '20px', minHeight: '20px' }}
                    />
                  </div>
                  {notifPreferences?.streakRiskReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Reminder Time:</span>
                      <input
                        type="time"
                        aria-label="Streak risk reminder time"
                        value={notifPreferences?.preferredReminderTimes?.streakRisk || '21:30'}
                        onChange={(e) => handleTimeChange('streakRisk', e.target.value)}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)',
                          minHeight: '32px'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 4. Revision Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <label htmlFor="pref-revision" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', cursor: 'pointer' }}>
                        Revision Reminder
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Notifies when topics are due in Spaced Queue
                      </div>
                    </div>
                    <input
                      id="pref-revision"
                      type="checkbox"
                      checked={notifPreferences?.revisionReminder !== false}
                      onChange={() => handleTogglePref('revisionReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.2)', cursor: 'pointer', minWidth: '20px', minHeight: '20px' }}
                    />
                  </div>
                  {notifPreferences?.revisionReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Reminder Time:</span>
                      <input
                        type="time"
                        aria-label="Revision reminder time"
                        value={notifPreferences?.preferredReminderTimes?.revision || '09:00'}
                        onChange={(e) => handleTimeChange('revision', e.target.value)}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)',
                          minHeight: '32px'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 5. Application & Interview Alerts */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label htmlFor="pref-application-alerts" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', cursor: 'pointer' }}>
                        Application & Interview Alerts
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Reminders for upcoming application deadlines & interviews
                      </div>
                    </div>
                    <input
                      id="pref-application-alerts"
                      type="checkbox"
                      checked={notifPreferences?.applicationAlerts !== false}
                      onChange={() => handleTogglePref('applicationAlerts')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.2)', cursor: 'pointer', minWidth: '20px', minHeight: '20px' }}
                    />
                  </div>
                </div>

                {/* 6. Weekly Progress Summary */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label htmlFor="pref-weekly-summary" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', cursor: 'pointer' }}>
                        Weekly Progress Summary
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Sunday digest of completed hours & growth
                      </div>
                    </div>
                    <input
                      id="pref-weekly-summary"
                      type="checkbox"
                      checked={notifPreferences?.weeklySummary !== false}
                      onChange={() => handleTogglePref('weeklySummary')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.2)', cursor: 'pointer', minWidth: '20px', minHeight: '20px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Trigger Test Notification Buttons */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Test Delivery
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => sendTestNotification && sendTestNotification('plan')}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px', padding: '8px 4px', minHeight: '38px' }}
                  >
                    🎯 Daily Plan
                  </button>

                  <button
                    type="button"
                    onClick={() => sendTestNotification && sendTestNotification('task')}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px', padding: '8px 4px', minHeight: '38px' }}
                  >
                    ⏰ Task Alert
                  </button>

                  <button
                    type="button"
                    onClick={() => sendTestNotification && sendTestNotification('streak')}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px', padding: '8px 4px', minHeight: '38px' }}
                  >
                    🔥 Streak Risk
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
