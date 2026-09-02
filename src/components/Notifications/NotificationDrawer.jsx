import React, { useState } from 'react';
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
  ShieldAlert
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

  if (!isNotifDrawerOpen) return null;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'DAILY_PLAN':
      case 'plan':
        return <span style={{ fontSize: '18px' }}>🎯</span>;
      case 'TASK_REMINDER':
      case 'reminder':
        return <span style={{ fontSize: '18px' }}>⏰</span>;
      case 'STREAK_RISK':
      case 'streak':
        return <span style={{ fontSize: '18px' }}>🔥</span>;
      case 'REVISION_DUE':
      case 'revision':
        return <span style={{ fontSize: '18px' }}>🧠</span>;
      case 'WEEKLY_SUMMARY':
      case 'summary':
        return <span style={{ fontSize: '18px' }}>📊</span>;
      default:
        return <Bell size={18} color="var(--accent-terracotta)" />;
    }
  };

  // Group notifications into TODAY and EARLIER
  const todayNotifications = notifications.filter(
    (n) => n.time === 'Today' || n.time === 'Just now' || n.time?.includes('m ago') || n.time?.includes('h ago')
  );
  const earlierNotifications = notifications.filter(
    (n) => !todayNotifications.includes(n)
  );

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleTogglePref = (key) => {
    const updated = {
      ...notifPreferences,
      [key]: !notifPreferences[key]
    };
    setNotifPreferences(updated);
  };

  const handleTimeChange = (key, value) => {
    const updatedTimes = {
      ...(notifPreferences.preferredReminderTimes || {}),
      [key]: value
    };
    setNotifPreferences({
      ...notifPreferences,
      preferredReminderTimes: updatedTimes
    });
  };

  return (
    <div className="modal-overlay" onClick={() => setIsNotifDrawerOpen(false)}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px 20px', maxWidth: '460px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)'
            }}>
              <Bell size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.2' }}>
                Notifications
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNotifDrawerOpen(false)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Switcher: Activity & Settings */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-warm-cream-alt)',
          borderRadius: 'var(--radius-pill)',
          padding: '4px',
          marginBottom: '14px',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12.5px',
              fontWeight: 700,
              backgroundColor: activeTab === 'notifications' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'notifications' ? 'var(--text-charcoal)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'notifications' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 150ms ease'
            }}
          >
            Activity {unreadCount > 0 && <span style={{ color: 'var(--accent-terracotta)' }}>({unreadCount})</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12.5px',
              fontWeight: 700,
              backgroundColor: activeTab === 'settings' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'settings' ? 'var(--text-charcoal)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'settings' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 150ms ease'
            }}
          >
            Settings
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
          {activeTab === 'notifications' ? (
            <div>
              {/* Top Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Smart Reminders
                </span>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotifsRead}
                      style={{
                        fontSize: '11px',
                        color: 'var(--accent-terracotta)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCheck size={13} />
                      <span>Mark all read</span>
                    </button>
                  )}

                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Empty State */}
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-warm-cream-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    margin: '0 auto 10px auto'
                  }}>
                    <Bell size={20} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                    No notifications yet
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    NOVARA will proactively remind you when study sessions or revisions are due.
                  </p>
                  <button
                    type="button"
                    onClick={() => sendTestNotification('streak')}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px', padding: '6px 14px' }}
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
                              cursor: 'pointer'
                            }}
                            onClick={() => navigateToNotificationTarget(notif)}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                                {getNotifIcon(notif.type)}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', lineHeight: '1.3' }}>
                                    {notif.title}
                                  </h4>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                      {notif.time}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dismissNotification(notif.id);
                                      }}
                                      style={{
                                        border: 'none',
                                        background: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                      title="Dismiss"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                </div>

                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                                  {notif.message}
                                </p>

                                {notif.actionLabel && (
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: 'var(--accent-terracotta)',
                                    marginTop: '6px'
                                  }}>
                                    <span>{notif.actionLabel}</span>
                                    <ArrowRight size={12} />
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
                              cursor: 'pointer'
                            }}
                            onClick={() => navigateToNotificationTarget(notif)}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                                {getNotifIcon(notif.type)}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                                    {notif.title}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissNotification(notif.id);
                                    }}
                                    style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>

                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  {notif.message}
                                </p>

                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
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
               SETTINGS TAB: REAL REMINDER TIMES & BROWSER PERMISSIONS
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
                        Stay on track with NOVARA
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Get reminders for preparation sessions, revisions, and streak protection.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={requestBrowserPermission}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '11.5px' }}
                    >
                      Enable Notifications
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Categories & Custom Native Reminder Times */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Daily Plan Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Daily Plan Reminder
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Sent when your daily mission is ready
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPreferences.dailyPlanReminder !== false}
                      onChange={() => handleTogglePref('dailyPlanReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                  </div>
                  {notifPreferences.dailyPlanReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reminder Time:</span>
                      <input
                        type="time"
                        value={notifPreferences.preferredReminderTimes?.dailyPlan || '08:00'}
                        onChange={(e) => handleTimeChange('dailyPlan', e.target.value)}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Study Session Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Study Session Reminder
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Warning before scheduled practice sessions
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPreferences.studySessionReminder !== false}
                      onChange={() => handleTogglePref('studySessionReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                  </div>
                  {notifPreferences.studySessionReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Notify before:</span>
                      <select
                        value={notifPreferences.preferredReminderTimes?.studySessionMinutesBefore || 15}
                        onChange={(e) => handleTimeChange('studySessionMinutesBefore', parseInt(e.target.value))}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)'
                        }}
                      >
                        <option value={10}>10 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Unfinished Task Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Unfinished Task Reminder
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Alerts when daily placement tasks remain pending
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPreferences.unfinishedTaskReminder !== false}
                      onChange={() => handleTogglePref('unfinishedTaskReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                  </div>
                  {notifPreferences.unfinishedTaskReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reminder Time:</span>
                      <input
                        type="time"
                        value={notifPreferences.preferredReminderTimes?.unfinishedTask || '20:30'}
                        onChange={(e) => handleTimeChange('unfinishedTask', e.target.value)}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 4. Streak Risk Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Streak Risk Reminder
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Alerts before midnight if streak target is unmet
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPreferences.streakRiskReminder !== false}
                      onChange={() => handleTogglePref('streakRiskReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                  </div>
                  {notifPreferences.streakRiskReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reminder Time:</span>
                      <input
                        type="time"
                        value={notifPreferences.preferredReminderTimes?.streakRisk || '21:30'}
                        onChange={(e) => handleTimeChange('streakRisk', e.target.value)}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 5. Revision Reminder */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Revision Reminder
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Notifies when topics are due in Spaced Queue
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPreferences.revisionReminder !== false}
                      onChange={() => handleTogglePref('revisionReminder')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                  </div>
                  {notifPreferences.revisionReminder !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-beige-light)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reminder Time:</span>
                      <input
                        type="time"
                        value={notifPreferences.preferredReminderTimes?.revision || '09:00'}
                        onChange={(e) => handleTimeChange('revision', e.target.value)}
                        style={{
                          border: '1px solid var(--border-beige)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-warm-cream)'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 6. Weekly Progress Summary */}
                <div className="card-white" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Weekly Progress Summary
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Sunday digest of completed hours & growth
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPreferences.weeklySummary !== false}
                      onChange={() => handleTogglePref('weeklySummary')}
                      style={{ accentColor: 'var(--accent-terracotta)', transform: 'scale(1.15)', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              {/* Trigger Test Notification Buttons */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Test Local & Push Delivery
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => sendTestNotification('plan')}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '8px 4px' }}
                  >
                    🎯 Daily Plan
                  </button>

                  <button
                    type="button"
                    onClick={() => sendTestNotification('task')}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '8px 4px' }}
                  >
                    ⏰ Task Alert
                  </button>

                  <button
                    type="button"
                    onClick={() => sendTestNotification('streak')}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '8px 4px' }}
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
