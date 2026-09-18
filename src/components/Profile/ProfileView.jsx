import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Target, 
  Clock, 
  Calendar, 
  Bell, 
  Globe, 
  UploadCloud, 
  ShieldCheck, 
  Info, 
  LogOut, 
  Check, 
  AlertTriangle, 
  Edit2, 
  X, 
  Loader2, 
  RefreshCw, 
  Flame, 
  Sparkles, 
  Send, 
  KeyRound, 
  ChevronRight, 
  CheckCircle2, 
  Layers,
  Database,
  Lock,
  ArrowRight,
  Palette,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { VisualMap, buildProfileSystemMap } from '../VisualMap';

const APP_VERSION = '1.0.0';

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time, UTC-5/4)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time, UTC-6/5)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time, UTC-7/6)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time, UTC-8/7)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST, UTC+0/1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central European Time, UTC+1/2)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (Central European Time, UTC+1/2)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (Indian Standard Time, UTC+5:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (Gulf Standard Time, UTC+4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (Singapore Time, UTC+8:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan Standard Time, UTC+9:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST, UTC+10/11)' }
];

export const ProfileView = () => {
  const { 
    currentUser, 
    userProfile, 
    setUserProfile, 
    activeRoadmap,
    streakData, 
    roadmapProgress,
    totalRoadmapTopics,
    completedRoadmapTopics,
    setIsNotifDrawerOpen, 
    setIsUploadModalOpen, 
    setIsAuthModalOpen,
    notifPreferences,
    setNotifPreferences,
    sendTestNotification,
    handleLogout,
    showToast,
    syncStatus,
    pendingSyncCount,
    lastSyncedAt,
    triggerManualSync,
    isOffline,
    themePreference,
    effectiveTheme,
    setThemePreference,
    setActiveTab
  } = useApp();

  const profileSystemMapData = useMemo(() => {
    return buildProfileSystemMap(userProfile, roadmapProgress || 0);
  }, [userProfile, roadmapProgress]);

  const handleProfileMapClick = (node) => {
    if (!node || !setActiveTab) return;
    if (node.entityType === 'roadmap') setActiveTab('roadmap');
    else if (node.entityType === 'today') setActiveTab('today');
    else if (node.entityType === 'revision') setActiveTab('revision');
    else if (node.entityType === 'applications') setActiveTab('applications');
  };

  // Navigation: 7 Logical Sections
  const [activeSection, setActiveSection] = useState('profile');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || userProfile?.name || '');
  const [roleInput, setRoleInput] = useState(userProfile?.targetRole || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Placement Plan Edit State
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [planRoleInput, setPlanRoleInput] = useState(userProfile?.targetRole || 'Software Engineer');
  const [planHoursInput, setPlanHoursInput] = useState(userProfile?.dailyTargetHours || 3);
  const [planDateInput, setPlanDateInput] = useState(userProfile?.targetDate || '2026-11-20');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planSuccess, setPlanSuccess] = useState('');
  const [planError, setPlanError] = useState('');
  const [planValidationErrors, setPlanValidationErrors] = useState({});

  // Timezone State
  const [selectedTimezone, setSelectedTimezone] = useState(userProfile?.timezone || 'UTC');
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  const [timezoneSuccess, setTimezoneSuccess] = useState('');
  const [timezoneError, setTimezoneError] = useState('');

  // Roadmap Modal State
  const [isReplaceConfirmOpen, setIsReplaceConfirmOpen] = useState(false);

  // Security / Password Reset State
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetMsg, setPasswordResetMsg] = useState('');
  const [passwordResetErr, setPasswordResetErr] = useState('');

  // Unsaved Changes Guard Modal
  const [pendingSectionSwitch, setPendingSectionSwitch] = useState(null);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);

  // Synchronize inputs if external userProfile / currentUser updates
  useEffect(() => {
    if (!isEditingProfile) {
      setNameInput(currentUser?.name || userProfile?.name || '');
      setRoleInput(userProfile?.targetRole || '');
    }
  }, [currentUser?.name, userProfile?.name, userProfile?.targetRole, isEditingProfile]);

  useEffect(() => {
    if (!isEditingPlan) {
      setPlanRoleInput(userProfile?.targetRole || 'Software Engineer');
      setPlanHoursInput(userProfile?.dailyTargetHours || 3);
      setPlanDateInput(userProfile?.targetDate || '2026-11-20');
    }
  }, [userProfile?.targetRole, userProfile?.dailyTargetHours, userProfile?.targetDate, isEditingPlan]);

  useEffect(() => {
    setSelectedTimezone(userProfile?.timezone || 'UTC');
  }, [userProfile?.timezone]);

  // Keyboard accessibility: Escape key closes active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isReplaceConfirmOpen) setIsReplaceConfirmOpen(false);
        if (isUnsavedModalOpen) setIsUnsavedModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReplaceConfirmOpen, isUnsavedModalOpen]);

  // Check for unsaved changes in profile or plan
  const hasUnsavedProfile = isEditingProfile && (
    nameInput !== (currentUser?.name || userProfile?.name || '') ||
    roleInput !== (userProfile?.targetRole || '')
  );

  const hasUnsavedPlan = isEditingPlan && (
    planRoleInput !== (userProfile?.targetRole || '') ||
    parseFloat(planHoursInput) !== parseFloat(userProfile?.dailyTargetHours || 3) ||
    planDateInput !== (userProfile?.targetDate || '')
  );

  const handleNavClick = (sectionId) => {
    if (sectionId === activeSection) return;
    if (hasUnsavedProfile || hasUnsavedPlan) {
      setPendingSectionSwitch(sectionId);
      setIsUnsavedModalOpen(true);
      return;
    }
    setActiveSection(sectionId);
  };

  const confirmDiscardAndSwitch = () => {
    setIsEditingProfile(false);
    setIsEditingPlan(false);
    setNameInput(currentUser?.name || userProfile?.name || '');
    setRoleInput(userProfile?.targetRole || '');
    setPlanRoleInput(userProfile?.targetRole || 'Software Engineer');
    setPlanHoursInput(userProfile?.dailyTargetHours || 3);
    setPlanDateInput(userProfile?.targetDate || '2026-11-20');
    setPlanValidationErrors({});
    setIsUnsavedModalOpen(false);
    if (pendingSectionSwitch) {
      setActiveSection(pendingSectionSwitch);
      setPendingSectionSwitch(null);
    }
  };

  // -------------------------------------------------------------------------
  // 1. SAVE PROFILE
  // -------------------------------------------------------------------------
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (isSavingProfile) return;

    if (!nameInput.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await setUserProfile({
        name: nameInput.trim(),
        targetRole: roleInput.trim() || userProfile?.targetRole || 'Software Engineer'
      });

      if (res && res.success === false) {
        setProfileError(res.error || 'Failed to update profile.');
      } else {
        setIsEditingProfile(false);
        setProfileSuccess('Profile updated successfully ✨');
        showToast('Profile Updated ✨', 'Your name and target role have been saved.', 'sage');
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err) {
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // -------------------------------------------------------------------------
  // 2. SAVE PLACEMENT PLAN
  // -------------------------------------------------------------------------
  const handleSavePlan = async (e) => {
    if (e) e.preventDefault();
    if (isSavingPlan) return;

    const errors = {};
    if (!planRoleInput.trim()) {
      errors.role = 'Target role is required.';
    }

    const hours = parseFloat(planHoursInput);
    if (isNaN(hours) || hours < 0.5 || hours > 12) {
      errors.hours = 'Daily study capacity must be between 0.5 and 12 hours.';
    }

    if (!planDateInput) {
      errors.date = 'Placement target date is required.';
    } else {
      const selected = new Date(planDateInput);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selected.getTime())) {
        errors.date = 'Invalid date format.';
      } else if (selected < today) {
        errors.date = 'Target date cannot be in the past.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setPlanValidationErrors(errors);
      return;
    }

    setPlanValidationErrors({});
    setIsSavingPlan(true);
    setPlanError('');
    setPlanSuccess('');

    try {
      const res = await setUserProfile({
        targetRole: planRoleInput.trim(),
        dailyTargetHours: hours,
        dailyStudyMinutes: Math.round(hours * 60),
        targetDate: planDateInput
      });

      if (res && res.success === false) {
        setPlanError(res.error || 'Failed to update placement plan.');
      } else {
        setIsEditingPlan(false);
        setPlanSuccess('Placement plan updated successfully ✨');
        showToast('Plan Updated ✨', 'Your target role, study capacity, and target date are synchronized.', 'sage');
        setTimeout(() => setPlanSuccess(''), 4000);
      }
    } catch (err) {
      setPlanError(err.message || 'Error updating plan.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // -------------------------------------------------------------------------
  // 3. SAVE TIMEZONE
  // -------------------------------------------------------------------------
  const handleSaveTimezone = async () => {
    if (isSavingTimezone) return;
    setIsSavingTimezone(true);
    setTimezoneError('');
    setTimezoneSuccess('');

    try {
      const res = await setUserProfile({ timezone: selectedTimezone });
      if (res && res.success === false) {
        setTimezoneError(res.error || 'Failed to update timezone.');
      } else {
        setTimezoneSuccess('Timezone updated successfully ✨');
        showToast('Timezone Updated ✨', `Your schedule is aligned to ${selectedTimezone}.`, 'sage');
        setTimeout(() => setTimezoneSuccess(''), 4000);
      }
    } catch (err) {
      setTimezoneError(err.message || 'Error saving timezone.');
    } finally {
      setIsSavingTimezone(false);
    }
  };

  const handleAutoDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setSelectedTimezone(detected);
        showToast('Timezone Detected', `Set to your browser timezone: ${detected}`, 'neutral');
      }
    } catch (e) {
      showToast('Detection Failed', 'Could not automatically detect browser timezone.', 'terracotta');
    }
  };

  // -------------------------------------------------------------------------
  // 4. NOTIFICATION TOGGLE
  // -------------------------------------------------------------------------
  const handleTogglePref = async (key) => {
    const updated = {
      ...notifPreferences,
      [key]: !notifPreferences[key]
    };
    await setNotifPreferences(updated);
  };

  // -------------------------------------------------------------------------
  // 5. PASSWORD RESET REQUEST
  // -------------------------------------------------------------------------
  const handleRequestPasswordReset = async () => {
    const email = currentUser?.email || userProfile?.email;
    if (!email) {
      setPasswordResetErr('No verified email address found for this session.');
      return;
    }
    setIsResettingPassword(true);
    setPasswordResetErr('');
    setPasswordResetMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordResetMsg(data.message || 'Password reset link sent to your registered email.');
        showToast('Reset Link Sent 📬', 'Check your inbox for password reset instructions.', 'sage');
      } else {
        setPasswordResetErr(data.error || 'Failed to request password reset.');
      }
    } catch (err) {
      setPasswordResetErr('Network error requesting password reset.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Fallback calculations for authentic presentation
  const displayName = currentUser?.name || userProfile?.name || 'Student';
  const displayEmail = currentUser?.email || userProfile?.email || 'student@novara.dev';
  const displayRole = userProfile?.targetRole || 'Not set';
  const displayCapacity = userProfile?.dailyTargetHours ? `${userProfile.dailyTargetHours} hrs / day` : 'Not set';
  const displayStreak = streakData?.currentStreak !== undefined ? `${streakData.currentStreak} Days` : 'Not enough data';
  const displayAccountStatus = isOffline 
    ? 'Offline Mode' 
    : (syncStatus === 'synced' ? 'Active & Synced' : 'Sync Pending');

  const navSections = [
    { id: 'profile', label: 'Profile', icon: User, desc: 'Personal details' },
    { id: 'plan', label: 'Placement Plan', icon: Target, desc: 'Target role, daily hours & date' },
    { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme & color scheme' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Smart alerts & reminders' },
    { id: 'timezone', label: 'Timezone', icon: Globe, desc: 'Regional schedule alignment' },
    { id: 'roadmap', label: 'Roadmap', icon: UploadCloud, desc: 'Syllabus & curriculum' },
    { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Session, password & isolation' },
    { id: 'about', label: 'About NOVARA', icon: Info, desc: `v${APP_VERSION} architecture` }
  ];

  return (
    <div className="settings-page-wrapper" style={{ animation: 'fadeIn 200ms ease' }}>
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
          Settings & Profile
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage your personal information, placement targets, reminders, and cloud synchronization.
        </p>
      </div>

      {/* Profile Header Card (Ground Truth, No Internal IDs) */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
          {/* Avatar Circle */}
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
            boxShadow: '0 6px 18px var(--accent-terracotta-glow)',
            flexShrink: 0
          }}>
            {currentUser?.avatar || (displayName ? displayName.slice(0, 2).toUpperCase() : 'ST')}
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                {displayName}
              </h2>
              <span className={`pill-badge ${isOffline ? 'pill-terracotta' : 'pill-sage'}`} style={{ fontSize: '10.5px' }}>
                {displayAccountStatus}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {displayEmail}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
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
                🎯 {displayRole}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-beige-light)'
              }}>
                ⏱️ {displayCapacity}
              </span>
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
          padding: '12px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Current Streak
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent-terracotta)', marginTop: '2px' }}>
              {displayStreak}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Target Date
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-charcoal)', marginTop: '4px' }}>
              {userProfile?.targetDate || 'Not set'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
              Roadmap Progress
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent-sage)', marginTop: '2px' }}>
              {roadmapProgress || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Tabs */}
      <div className="settings-mobile-tabs" role="tablist" aria-label="Settings sections">
        {navSections.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`section-panel-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`settings-mobile-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Responsive Layout (Left Nav + Right Content Panel) */}
      <div className="settings-desktop-grid">
        {/* Left Settings Sidebar (Visible on Desktop) */}
        <nav className="settings-sidebar-nav" aria-label="Settings navigation">
          {navSections.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`settings-nav-btn ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'true' : 'false'}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'var(--accent-terracotta)' : 'var(--bg-warm-cream-alt)',
                  color: isActive ? '#FFFFFF' : 'var(--accent-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>{item.label}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Right Content Panel */}
        <div id={`section-panel-${activeSection}`} role="tabpanel" style={{ flex: 1, minWidth: 0 }}>
          
          {/* =============================================================== */}
          {/* 1. PROFILE SECTION                                              */}
          {/* =============================================================== */}
          {activeSection === 'profile' && (
            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                    Profile Information
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Your public student profile information across NOVARA modules.
                  </p>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '12.5px', gap: '6px', minHeight: '44px' }}
                  >
                    <Edit2 size={13} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {profileSuccess && (
                <div role="status" style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(92, 131, 116, 0.12)',
                  border: '1px solid var(--accent-sage)',
                  color: 'var(--accent-sage)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={15} />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div role="alert" style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(200, 90, 50, 0.12)',
                  border: '1px solid var(--accent-terracotta)',
                  color: 'var(--accent-terracotta)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>{profileError}</span>
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="settings-form-group">
                    <label htmlFor="profile-name-input" className="settings-form-label">
                      Student Full Name *
                    </label>
                    <input
                      id="profile-name-input"
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="settings-form-input"
                      placeholder="e.g. Alex Rivera"
                      required
                    />
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="profile-role-input" className="settings-form-label">
                      Target Placement Role *
                    </label>
                    <input
                      id="profile-role-input"
                      type="text"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      className="settings-form-input"
                      placeholder="e.g. Software Engineer (Frontend / Full-Stack)"
                      required
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label">
                      Registered Email (Primary Identity)
                    </label>
                    <input
                      type="email"
                      value={displayEmail}
                      disabled
                      className="settings-form-input"
                      style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--bg-warm-cream-alt)' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Email is authenticated via your account provider and cannot be changed directly.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setNameInput(currentUser?.name || userProfile?.name || '');
                        setRoleInput(userProfile?.targetRole || '');
                        setProfileError('');
                      }}
                      disabled={isSavingProfile}
                      className="btn-secondary"
                      style={{ flex: 1, minHeight: '44px' }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="btn-primary"
                      style={{ flex: 1, minHeight: '44px', gap: '6px' }}
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 size={16} className="spin-icon" />
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Full Name</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{displayName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Email Address</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>{displayEmail}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target Role</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-terracotta)' }}>{displayRole}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Preparation Level</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>{userProfile?.currentPreparationLevel || 'Intermediate'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* 2. PLACEMENT PLAN SETTINGS                                      */}
          {/* =============================================================== */}
          {activeSection === 'plan' && (
            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                    Placement Plan Settings
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Configures daily mission workloads, topic priorities, and placement deadlines.
                  </p>
                </div>

                {!isEditingPlan && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPlan(true)}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '12.5px', gap: '6px', minHeight: '44px' }}
                  >
                    <Edit2 size={13} />
                    <span>Adjust Plan</span>
                  </button>
                )}
              </div>

              {planSuccess && (
                <div role="status" style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(92, 131, 116, 0.12)',
                  border: '1px solid var(--accent-sage)',
                  color: 'var(--accent-sage)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={15} />
                  <span>{planSuccess}</span>
                </div>
              )}

              {planError && (
                <div role="alert" style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(200, 90, 50, 0.12)',
                  border: '1px solid var(--accent-terracotta)',
                  color: 'var(--accent-terracotta)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>{planError}</span>
                </div>
              )}

              {/* Current Value → Proposed Value Comparison Box (when editing) */}
              {isEditingPlan ? (
                <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="settings-comparison-box">
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                        Current Configured Plan
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', marginTop: '4px' }}>
                        {userProfile?.targetRole || 'Software Engineer'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {userProfile?.dailyTargetHours || 3} hrs/day • Target: {userProfile?.targetDate || '2026-11-20'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--accent-terracotta)' }}>
                        Proposed Changes (Draft)
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-terracotta)', marginTop: '4px' }}>
                        {planRoleInput || '—'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {planHoursInput} hrs/day • Target: {planDateInput || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="plan-role-input" className="settings-form-label">
                      Target Placement Role *
                    </label>
                    <input
                      id="plan-role-input"
                      type="text"
                      value={planRoleInput}
                      onChange={(e) => setPlanRoleInput(e.target.value)}
                      className="settings-form-input"
                      placeholder="e.g. Software Engineer"
                      required
                    />
                    {planValidationErrors.role && (
                      <span role="alert" style={{ fontSize: '11.5px', color: 'var(--accent-terracotta)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                        {planValidationErrors.role}
                      </span>
                    )}
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="plan-hours-input" className="settings-form-label">
                      Daily Study Capacity (Hours / Day) *
                    </label>
                    <input
                      id="plan-hours-input"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={planHoursInput}
                      onChange={(e) => setPlanHoursInput(e.target.value)}
                      className="settings-form-input"
                      required
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Recommended: 2.0 to 4.0 hours for balanced college and interview preparation.
                    </span>
                    {planValidationErrors.hours && (
                      <span role="alert" style={{ fontSize: '11.5px', color: 'var(--accent-terracotta)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                        {planValidationErrors.hours}
                      </span>
                    )}
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="plan-date-input" className="settings-form-label">
                      Placement Target Deadline *
                    </label>
                    <input
                      id="plan-date-input"
                      type="date"
                      value={planDateInput}
                      onChange={(e) => setPlanDateInput(e.target.value)}
                      className="settings-form-input"
                      required
                    />
                    {planValidationErrors.date && (
                      <span role="alert" style={{ fontSize: '11.5px', color: 'var(--accent-terracotta)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                        {planValidationErrors.date}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPlan(false);
                        setPlanRoleInput(userProfile?.targetRole || 'Software Engineer');
                        setPlanHoursInput(userProfile?.dailyTargetHours || 3);
                        setPlanDateInput(userProfile?.targetDate || '2026-11-20');
                        setPlanValidationErrors({});
                        setPlanError('');
                      }}
                      disabled={isSavingPlan}
                      className="btn-secondary"
                      style={{ flex: 1, minHeight: '44px' }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingPlan}
                      className="btn-primary"
                      style={{ flex: 1, minHeight: '44px', gap: '6px' }}
                    >
                      {isSavingPlan ? (
                        <>
                          <Loader2 size={16} className="spin-icon" />
                          <span>Applying Plan...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Apply Plan Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target Role</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{userProfile?.targetRole || 'Software Engineer'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Daily Study Capacity</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-terracotta)' }}>{userProfile?.dailyTargetHours || 3} Hours / day</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Placement Target Date</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{userProfile?.targetDate || '2026-11-20'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Minimum Daily Streak Tasks</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>{userProfile?.minTasksForStreak || 2} tasks</span>
                  </div>

                  {/* Preparation System Visual Map */}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-beige-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Layers size={15} color="var(--accent-terracotta)" />
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          Your Preparation System Map
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                        Click node to navigate
                      </span>
                    </div>
                    <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-warm-cream-alt)', border: '1px solid var(--border-beige)' }}>
                      <VisualMap
                        nodes={profileSystemMapData.nodes}
                        edges={profileSystemMapData.edges}
                        summary={profileSystemMapData.summary}
                        direction="horizontal"
                        onNodeClick={handleProfileMapClick}
                        ariaLabel="Preparation System Visual Map"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* THEME & APPEARANCE SECTION                                      */}
          {/* =============================================================== */}
          {activeSection === 'appearance' && (
            <div className="settings-card">
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                  Theme & Appearance
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Customize how NOVARA looks on your device. Choose Light, Dark, or automatically synchronize with your device system preferences.
                </p>
              </div>

              {/* Theme Selector Radio Group */}
              <div 
                role="radiogroup" 
                aria-label="Theme selection"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
                  gap: '14px',
                  marginBottom: '20px'
                }}
              >
                {/* 1. LIGHT OPTION */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={themePreference === 'light'}
                  onClick={() => {
                    setThemePreference('light');
                    showToast('Theme Updated ☀️', 'Light theme applied.', 'neutral');
                  }}
                  className={`theme-option-card ${themePreference === 'light' ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: themePreference === 'light' ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream-alt)',
                    border: `2px solid ${themePreference === 'light' ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                    cursor: 'pointer',
                    minHeight: '110px',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#FAF7F2',
                      color: '#C85A32',
                      border: '1px solid #EAE3D8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Sun size={18} />
                    </div>
                    {themePreference === 'light' && (
                      <span className="pill-badge pill-terracotta" style={{ fontSize: '10px', padding: '2px 8px' }}>
                        <Check size={11} style={{ marginRight: '2px' }} /> Selected
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                    Light
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Crisp warm cream and terracotta minimalist aesthetic.
                  </div>
                </button>

                {/* 2. DARK OPTION */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={themePreference === 'dark'}
                  onClick={() => {
                    setThemePreference('dark');
                    showToast('Theme Updated 🌙', 'Dark theme applied.', 'neutral');
                  }}
                  className={`theme-option-card ${themePreference === 'dark' ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: themePreference === 'dark' ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream-alt)',
                    border: `2px solid ${themePreference === 'dark' ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                    cursor: 'pointer',
                    minHeight: '110px',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#1E2421',
                      color: '#E06D44',
                      border: '1px solid #2E3532',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Moon size={18} />
                    </div>
                    {themePreference === 'dark' && (
                      <span className="pill-badge pill-terracotta" style={{ fontSize: '10px', padding: '2px 8px' }}>
                        <Check size={11} style={{ marginRight: '2px' }} /> Selected
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                    Dark
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Deep warm obsidian and charcoal surfaces for eye comfort.
                  </div>
                </button>

                {/* 3. SYSTEM OPTION */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={themePreference === 'system'}
                  onClick={() => {
                    setThemePreference('system');
                    showToast('Theme Updated 💻', 'Following device system theme.', 'neutral');
                  }}
                  className={`theme-option-card ${themePreference === 'system' ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: themePreference === 'system' ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream-alt)',
                    border: `2px solid ${themePreference === 'system' ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                    cursor: 'pointer',
                    minHeight: '110px',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--accent-navy)',
                      border: '1px solid var(--border-beige)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Monitor size={18} />
                    </div>
                    {themePreference === 'system' && (
                      <span className="pill-badge pill-terracotta" style={{ fontSize: '10px', padding: '2px 8px' }}>
                        <Check size={11} style={{ marginRight: '2px' }} /> Selected
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                    System (Automatic)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Automatically switches based on your OS or browser light/dark setting.
                  </div>
                </button>
              </div>

              {/* Live Status Banner */}
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--accent-terracotta)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-charcoal)' }}>
                    Active Visual Mode:
                  </span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`pill-badge ${effectiveTheme === 'dark' ? 'pill-navy' : 'pill-amber'}`} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                    {effectiveTheme === 'dark' ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
                  </span>
                  {themePreference === 'system' && (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      (Synchronized with OS)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 3. NOTIFICATION PREFERENCES                                     */}
          {/* =============================================================== */}
          {activeSection === 'notifications' && (
            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                    Notification Preferences
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Configure smart automated alerts, study reminders, and streak protection warnings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNotifDrawerOpen(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px', minHeight: '44px' }}
                >
                  Open Center
                </button>
              </div>

              {/* Reminder Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {[
                  { key: 'dailyPlanReminder', label: 'Daily Mission Reminder', time: notifPreferences?.preferredReminderTimes?.dailyPlan || '08:00', desc: 'Alerts when your daily task plan is generated' },
                  { key: 'studySessionReminder', label: 'Study Session Reminder', time: '15 min before', desc: 'Pre-session notification for scheduled study blocks' },
                  { key: 'unfinishedTaskReminder', label: 'Unfinished Task Reminder', time: notifPreferences?.preferredReminderTimes?.unfinishedTask || '20:30', desc: 'Evening notice for pending daily targets' },
                  { key: 'streakRiskReminder', label: 'Streak Risk Warning', time: notifPreferences?.preferredReminderTimes?.streakRisk || '21:30', desc: 'Urgent notice if today\'s streak target is incomplete' },
                  { key: 'revisionReminder', label: 'Spaced Revision Reminder', time: notifPreferences?.preferredReminderTimes?.revision || '09:00', desc: 'Alerts when topics are due on the SM-2 retention ladder' },
                  { key: 'weeklySummary', label: 'Weekly Placement Summary', time: 'Sun 6:00 PM', desc: 'Sunday performance digest from Placement Coach' }
                ].map((item) => {
                  const isChecked = notifPreferences?.[item.key] !== false;
                  return (
                    <div 
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-warm-cream-alt)',
                        border: '1px solid var(--border-beige-light)',
                        minHeight: '44px'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Scheduled: {item.time} • {item.desc}
                        </div>
                      </div>

                      <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}>
                        <input
                          type="checkbox"
                          role="switch"
                          aria-checked={isChecked}
                          aria-label={item.label}
                          checked={isChecked}
                          onChange={() => handleTogglePref(item.key)}
                          style={{
                            width: '20px',
                            height: '20px',
                            accentColor: 'var(--accent-terracotta)',
                            cursor: 'pointer'
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Test Notification Triggers */}
              <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-beige-light)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
                  Send Test Notification:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => sendTestNotification('plan')}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 14px', minHeight: '44px' }}
                  >
                    🎯 Test Plan Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => sendTestNotification('task')}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 14px', minHeight: '44px' }}
                  >
                    ⏰ Test Task Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => sendTestNotification('streak')}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 14px', minHeight: '44px' }}
                  >
                    🔥 Test Streak Warning
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 4. TIMEZONE SETTINGS                                            */}
          {/* =============================================================== */}
          {activeSection === 'timezone' && (
            <div className="settings-card">
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                  Timezone Alignment
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Configures authoritative schedule boundary timing across all placement subsystems.
                </p>
              </div>

              {timezoneSuccess && (
                <div role="status" style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(92, 131, 116, 0.12)',
                  border: '1px solid var(--accent-sage)',
                  color: 'var(--accent-sage)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={15} />
                  <span>{timezoneSuccess}</span>
                </div>
              )}

              {timezoneError && (
                <div role="alert" style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(200, 90, 50, 0.12)',
                  border: '1px solid var(--accent-terracotta)',
                  color: 'var(--accent-terracotta)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>{timezoneError}</span>
                </div>
              )}

              <div style={{
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
                  Current Active Timezone: <span style={{ color: 'var(--accent-terracotta)' }}>{userProfile?.timezone || 'UTC'}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Timezone strictly determines when:
                  <br />• <strong>Daily Task Missions</strong> roll over at midnight.
                  <br />• <strong>Streak protection windows</strong> evaluate completed missions.
                  <br />• <strong>Calendar interviews & deadlines</strong> send conflict warnings.
                  <br />• <strong>Spaced Revision intervals</strong> advance to the next review date.
                  <br />• <strong>Placement Coach</strong> compiles weekly progress audits.
                </p>
              </div>

              <div className="settings-form-group">
                <label htmlFor="timezone-select" className="settings-form-label">
                  Select Timezone (IANA Standard)
                </label>
                <select
                  id="timezone-select"
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="settings-form-input"
                  style={{ cursor: 'pointer' }}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleAutoDetectTimezone}
                  className="btn-secondary"
                  style={{ flex: 1, minHeight: '44px', gap: '6px' }}
                >
                  <Globe size={15} />
                  <span>Auto-Detect Browser Timezone</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTimezone}
                  disabled={isSavingTimezone || selectedTimezone === (userProfile?.timezone || 'UTC')}
                  className="btn-primary"
                  style={{ flex: 1, minHeight: '44px', gap: '6px' }}
                >
                  {isSavingTimezone ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      <span>Saving Timezone...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Timezone</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 5. ROADMAP MANAGEMENT                                           */}
          {/* =============================================================== */}
          {activeSection === 'roadmap' && (
            <div className="settings-card">
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                  Curriculum & Roadmap Management
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Manage your placement curriculum, syllabi ingests, and preparation phases.
                </p>
              </div>

              {/* Active Roadmap Overview */}
              <div style={{
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                    Active Syllabus
                  </span>
                  <span className="pill-badge pill-sage" style={{ fontSize: '11px' }}>
                    {roadmapProgress || 0}% Completed
                  </span>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                  {activeRoadmap?.title || 'No Roadmap Uploaded'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {activeRoadmap 
                    ? `${activeRoadmap.phases?.length || 0} Phases • ${totalRoadmapTopics || 0} Topics • ${completedRoadmapTopics || 0} Completed`
                    : 'Upload a syllabus (PDF, DOCX, Markdown) to generate your customized placement roadmap.'}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                  style={{ flex: 1, minHeight: '44px', gap: '6px' }}
                >
                  <UploadCloud size={16} />
                  <span>{activeRoadmap ? 'Replace Roadmap' : 'Upload Syllabus'}</span>
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 6. ACCOUNT SECURITY                                             */}
          {/* =============================================================== */}
          {activeSection === 'security' && (
            <div className="settings-card">
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                  Account Security & Session
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Safe session management, credential security, and multi-tenant isolation.
                </p>
              </div>

              {passwordResetMsg && (
                <div role="status" style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(92, 131, 116, 0.12)',
                  border: '1px solid var(--accent-sage)',
                  color: 'var(--accent-sage)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={15} />
                  <span>{passwordResetMsg}</span>
                </div>
              )}

              {passwordResetErr && (
                <div role="alert" style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(200, 90, 50, 0.12)',
                  border: '1px solid var(--accent-terracotta)',
                  color: 'var(--accent-terracotta)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>{passwordResetErr}</span>
                </div>
              )}

              {/* Session Details */}
              <div style={{
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Session Status</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-sage)' }}>● Active Authenticated Session</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Signed in as</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{displayEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cloud Sync Status</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>
                    {pendingSyncCount > 0 ? `${pendingSyncCount} pending operations` : 'All changes synchronized'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>User Data Isolation</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>Enforced (Strict User Scope)</span>
                </div>
              </div>

              {/* Password Management */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                  Password & Credentials
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Request a single-use secure reset link to update your account password.
                </p>
                <button
                  type="button"
                  onClick={handleRequestPasswordReset}
                  disabled={isResettingPassword}
                  className="btn-secondary"
                  style={{ minHeight: '44px', gap: '6px' }}
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 size={15} className="spin-icon" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>Request Password Reset Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Account Session Actions */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-beige-light)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '10px' }}>
                  Session Actions
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="btn-secondary"
                    style={{ flex: 1, minHeight: '44px', gap: '6px' }}
                  >
                    <User size={15} />
                    <span>Switch Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      gap: '6px',
                      color: 'var(--accent-terracotta)',
                      borderColor: 'rgba(200, 90, 50, 0.3)'
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 7. ABOUT / APPLICATION INFORMATION                             */}
          {/* =============================================================== */}
          {activeSection === 'about' && (
            <div className="settings-card">
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                  About NOVARA
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Production application specifications, architecture, and security policies.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--accent-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '22px',
                  fontWeight: 900,
                  boxShadow: '0 6px 18px var(--accent-terracotta-glow)'
                }}>
                  N
                </div>

                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                    NOVARA Placement Platform
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    Version {APP_VERSION} (Production Build)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Release Version</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>v{APP_VERSION}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Core Architecture</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>Local-First with Replay Sync</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Spaced Repetition Algorithm</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-charcoal)' }}>SuperMemo SM-2 Adaptive</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-beige-light)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Data Privacy Policy</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-sage)' }}>Zero Telemetry • Isolated Partitions</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Network Status</span>
                  <span style={{ fontWeight: 700, color: isOffline ? 'var(--accent-terracotta)' : 'var(--accent-sage)' }}>
                    {isOffline ? 'Offline (Local Cache Active)' : 'Online (Connected)'}
                  </span>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                🔒 <strong>Security Guarantee:</strong> All student accounts, preparation goals, roadmaps, revision queues, and interviews are isolated per authenticated user session. Passwords and credentials are never stored in plaintext or exposed through client network payloads.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: REPLACE ROADMAP CONFIRMATION                               */}
      {/* =================================================================== */}
      {isReplaceConfirmOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsReplaceConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="replace-roadmap-dialog-title"
        >
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

            <h3 id="replace-roadmap-dialog-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              Replace current roadmap?
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '20px' }}>
              Your current roadmap curriculum will be replaced after you review and confirm the new syllabus. Your completed tasks, streak records, study sessions, and spaced revision history remain strictly preserved.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsReplaceConfirmOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, minHeight: '44px', fontSize: '13px' }}
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
                style={{ flex: 1, minHeight: '44px', fontSize: '13px' }}
              >
                Continue to Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: UNSAVED CHANGES CONFIRMATION GUARD                         */}
      {/* =================================================================== */}
      {isUnsavedModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsUnsavedModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-dialog-title"
        >
          <div 
            className="modal-content-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '24px', maxWidth: '420px', textAlign: 'center' }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-terracotta-light)',
              color: 'var(--accent-terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <AlertTriangle size={24} />
            </div>

            <h3 id="unsaved-dialog-title" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              Discard unsaved changes?
            </h3>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '18px' }}>
              You have unsaved changes in your settings. If you switch sections without saving, your edits will be discarded.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsUnsavedModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, minHeight: '44px', fontSize: '13px' }}
              >
                Stay on Section
              </button>

              <button
                type="button"
                onClick={confirmDiscardAndSwitch}
                className="btn-primary"
                style={{ flex: 1, minHeight: '44px', fontSize: '13px', backgroundColor: 'var(--accent-terracotta)' }}
              >
                Discard & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Bottom Safe-Area Spacer */}
      <div style={{ height: '80px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
