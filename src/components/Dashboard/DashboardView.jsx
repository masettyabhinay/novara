import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../Today/TaskCard';
import { 
  Sparkles, 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Map, 
  Calendar, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  UploadCloud, 
  WifiOff, 
  Target, 
  Flame, 
  Award,
  BookOpen,
  HelpCircle,
  Sliders,
  Bell,
  Activity,
  Check
} from 'lucide-react';
import { calculateFocusTimerMetrics, formatFocusTime } from '../../utils/focusTimerUtils';
import { VisualMap, buildTodayLearningPathMap, buildDashboardJourneyMap } from '../VisualMap';

export const DashboardView = () => {
  const {
    userProfile,
    currentUser,
    activeRoadmap,
    roadmapProgress,
    totalRoadmapTopics,
    completedRoadmapTopics,
    todayTasks,
    activeFocusTask,
    activeFocusSession,
    isFocusModalOpen,
    setIsFocusModalOpen,
    startFocusSession,
    openTaskStudyMaterial,
    startTaskRevisionQuiz,
    pauseFocusSession,
    resumeFocusSession,
    focusAnalytics,
    revisionQueue,
    revisionMetrics,
    startAdaptiveRevision,
    setSelectedTopicDetail,
    setIsTopicDetailOpen,
    coachAnalysis,
    isCoachLoading,
    refreshCoachAnalysis,
    navigateToCoachTarget,
    calendarEvents,
    openCalendarEventTarget,
    streakData,
    notifications,
    setIsNotifDrawerOpen,
    setIsUploadModalOpen,
    setIsAdaptiveModalOpen,
    lastPlanAdjustment,
    setActiveTab,
    isOffline,
    showToast
  } = useApp();

  // Local state for UI controls
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [openWhyThis, setOpenWhyThis] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  // Real-time wall-clock ticker when active focus session exists
  useEffect(() => {
    if (!activeFocusSession || isFocusModalOpen) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [activeFocusSession, isFocusModalOpen]);

  // Authoritative focus timer metrics using pure utility
  const focusTimerMetrics = useMemo(() => {
    if (!activeFocusSession) return null;
    return calculateFocusTimerMetrics(activeFocusSession, nowMs);
  }, [activeFocusSession, nowMs]);

  // Time-of-day personalized greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = currentUser?.name || userProfile?.name || 'Student';
  const targetRole = (userProfile?.targetRole || 'Software Engineer').split('(')[0].trim();

  // Task statistics derived from authentic persisted data
  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter((t) => t.completed).length;
  const totalPlannedMinutes = todayTasks.reduce((sum, t) => sum + (t.durationMinutes || 45), 0);
  const completedMinutes = todayTasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + (t.durationMinutes || 45), 0);
  const remainingMinutes = Math.max(0, totalPlannedMinutes - completedMinutes);

  // Next recommended task (first incomplete task)
  const nextTask = useMemo(() => {
    return todayTasks.find((t) => !t.completed) || null;
  }, [todayTasks]);

  // Actual studied minutes today (persisted focus analytics or completed task duration)
  const actualStudiedMinutes = useMemo(() => {
    if (focusAnalytics?.todayStudyMinutes && focusAnalytics.todayStudyMinutes > 0) {
      return focusAnalytics.todayStudyMinutes;
    }
    return completedMinutes;
  }, [focusAnalytics, completedMinutes]);

  // Authentic Today Learning Path Map
  const todayLearningPathMap = useMemo(() => {
    return buildTodayLearningPathMap(todayTasks, activeFocusSession, revisionQueue);
  }, [todayTasks, activeFocusSession, revisionQueue]);

  // Authentic Overall Placement Career Journey Map
  const careerJourneyMap = useMemo(() => {
    return buildDashboardJourneyMap({
      roadmapProgress,
      todayTasks,
      revisionQueue,
      interviewStats: focusAnalytics,
      appMetrics: {},
      coachAnalysis
    });
  }, [roadmapProgress, todayTasks, revisionQueue, focusAnalytics, coachAnalysis]);

  const handleTodayMapNodeClick = (node) => {
    if (!node) return;
    if (node.entityType === 'task' || node.entityType === 'focus') {
      const task = node.data || todayTasks.find((t) => t.id === node.entityId) || nextTask;
      if (task) startFocusSession(task);
    } else if (node.entityType === 'study') {
      const task = node.data || todayTasks.find((t) => t.id === node.entityId) || nextTask;
      if (task && openTaskStudyMaterial) openTaskStudyMaterial(task);
    } else if (node.entityType === 'quiz') {
      const task = node.data || todayTasks.find((t) => t.id === node.entityId) || nextTask;
      if (task) {
        if (startTaskRevisionQuiz) startTaskRevisionQuiz(task, activeFocusSession);
        else if (startFocusSession) startFocusSession(task);
      }
    } else if (node.entityType === 'revision') {
      const revItem = node.data || revisionQueue?.[0];
      if (revItem && setSelectedTopicDetail && setIsTopicDetailOpen) {
        setSelectedTopicDetail(revItem);
        setIsTopicDetailOpen(true);
      } else {
        setActiveTab('revision');
      }
    }
  };

  // Due revisions from authentic queue
  const dueRevisions = useMemo(() => {
    return (revisionQueue || []).filter(
      (r) => r.status !== 'completed' && (r.revisionDueDate === 'Today' || (r.revisionDueDate || '').startsWith('Overdue') || !r.completedAt)
    );
  }, [revisionQueue]);

  const dueRevisionsCount = dueRevisions.length;
  const priorityRevision = dueRevisions[0] || null;

  // Authoritative roadmap details
  const currentPhase = useMemo(() => {
    if (!activeRoadmap?.phases || activeRoadmap.phases.length === 0) return null;
    return activeRoadmap.phases.find((p) => p.status === 'in_progress' || (p.topics || []).some((t) => t.status !== 'completed')) || activeRoadmap.phases[0];
  }, [activeRoadmap]);

  const nextRoadmapTopic = useMemo(() => {
    if (!currentPhase?.topics) return null;
    return currentPhase.topics.find((t) => t.status !== 'completed') || currentPhase.topics[0] || null;
  }, [currentPhase]);

  // Upcoming calendar events (today and future, sorted chronologically)
  const upcomingEvents = useMemo(() => {
    if (!calendarEvents || calendarEvents.length === 0) return [];
    const todayIso = new Date().toISOString().split('T')[0];
    return calendarEvents
      .filter((evt) => evt.date && evt.date >= todayIso)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      })
      .slice(0, 3);
  }, [calendarEvents]);

  // Real user recent activity feed assembled strictly from persisted records
  const recentActivityFeed = useMemo(() => {
    const feed = [];

    // 1. Completed tasks with authentic completion
    todayTasks
      .filter((t) => t.completed)
      .forEach((t) => {
        feed.push({
          id: `act-task-${t.id}`,
          type: 'TASK',
          title: `Completed mission: ${t.name || t.title}`,
          timestamp: t.completedAt || new Date().toISOString(),
          timeLabel: 'Today',
          icon: CheckCircle2,
          color: 'var(--accent-sage)'
        });
      });

    // 2. Completed revisions
    (revisionQueue || [])
      .filter((r) => r.status === 'completed')
      .slice(0, 2)
      .forEach((r) => {
        feed.push({
          id: `act-rev-${r.id}`,
          type: 'REVISION',
          title: `Reviewed topic: ${r.topic} (${r.retentionScore || '80%'} retention)`,
          timestamp: r.completedAt || r.lastReviewedAt || new Date().toISOString(),
          timeLabel: 'Recent',
          icon: RotateCcw,
          color: 'var(--accent-terracotta)'
        });
      });

    // 3. Authentic system/coach notifications
    (notifications || [])
      .slice(0, 3)
      .forEach((n) => {
        feed.push({
          id: `act-notif-${n.id}`,
          type: n.type || 'NOTIFICATION',
          title: n.title,
          timestamp: n.createdAt || new Date().toISOString(),
          timeLabel: n.time || 'Recent',
          icon: n.title.includes('Coach') ? Sparkles : Bell,
          color: 'var(--accent-terracotta)'
        });
      });

    // Sort by timestamp descending and take top 4 items
    return feed
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);
  }, [todayTasks, revisionQueue, notifications]);

  // Format minutes helper (e.g. 90 -> "1h 30m", 45 -> "45m")
  const formatMinutes = (mins) => {
    if (!mins || mins <= 0) return '0m';
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hrs === 0) return `${remainder}m`;
    if (remainder === 0) return `${hrs}h`;
    return `${hrs}h ${remainder}m`;
  };

  const handleStartPrimaryFocus = () => {
    if (nextTask) {
      startFocusSession(nextTask);
    } else if (todayTasks.length > 0) {
      startFocusSession(todayTasks[0]);
    } else {
      setIsUploadModalOpen(true);
    }
  };

  const handleOpenRevision = (revItem) => {
    if (!revItem) {
      setActiveTab('revision');
      return;
    }
    if (startAdaptiveRevision) {
      startAdaptiveRevision(revItem);
    } else {
      setSelectedTopicDetail(revItem);
      setIsTopicDetailOpen(true);
      setActiveTab('revision');
    }
  };

  return (
    <div 
      className="dashboard-command-center" 
      style={{ 
        animation: 'fadeIn 200ms ease', 
        width: '100%', 
        maxWidth: '820px', 
        margin: '0 auto', 
        paddingBottom: '24px',
        overflowX: 'hidden'
      }}
    >
      {/* Offline Status Alert */}
      {isOffline && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-amber-light)',
            border: '1px solid rgba(217, 130, 43, 0.3)',
            color: 'var(--accent-amber)',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '14px'
          }}
          role="status"
          aria-live="polite"
        >
          <WifiOff size={16} />
          <span>You are offline. Persisted data is active and changes will sync automatically when back online.</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: HERO / GREETING & STATUS
          ========================================================================= */}
      <section 
        className="dashboard-hero-section" 
        style={{ marginBottom: '16px' }}
        aria-label="Student overview greeting"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="pill-badge pill-terracotta" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                <Target size={11} /> Placement Command Center
              </span>
              {streakData?.currentStreak > 0 && (
                <span className="pill-badge pill-amber" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                  <Flame size={11} /> {streakData.currentStreak} Day Streak
                </span>
              )}
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 900,
              color: 'var(--text-charcoal)',
              letterSpacing: '-0.025em',
              lineHeight: '1.2',
              margin: '0 0 4px 0'
            }}>
              {greeting}, {userName} 👋
            </h1>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Targeting <strong>{targetRole}</strong> • Today’s target: <strong>{userProfile?.dailyTargetHours || 3}h</strong>
              {actualStudiedMinutes > 0 && (
                <span> ({formatMinutes(actualStudiedMinutes)} completed)</span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('coach')}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '8px 14px',
              minHeight: '44px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-charcoal)',
              border: '1px solid var(--border-beige)',
              boxShadow: 'var(--shadow-sm)'
            }}
            aria-label="Open AI Placement Coach diagnostics"
          >
            <Sparkles size={14} color="var(--accent-terracotta)" />
            <span>Coach Insights</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: TODAY'S MISSION (PRIMARY CARD)
          ========================================================================= */}
      <section 
        className="card-white dashboard-primary-mission-card"
        style={{
          padding: '20px',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative'
        }}
        role="region"
        aria-label="Today's primary placement mission"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)'
            }}>
              <Target size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0, lineHeight: '1.2' }}>
                Today's Mission
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {completedTasks} of {totalTasks} tasks completed ({formatMinutes(completedMinutes)} of {formatMinutes(totalPlannedMinutes)})
              </span>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            fontWeight: 800,
            color: completedTasks === totalTasks && totalTasks > 0 ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
            backgroundColor: completedTasks === totalTasks && totalTasks > 0 ? 'var(--accent-sage-light)' : 'var(--accent-terracotta-light)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)'
          }}>
            {completedTasks === totalTasks && totalTasks > 0 ? 'Goal Met ✓' : `${formatMinutes(remainingMinutes)} remaining`}
          </div>
        </div>

        {/* Progress bar */}
        <div 
          role="progressbar"
          aria-valuenow={totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Today's task completion progress"
          style={{
            width: '100%',
            height: '7px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border-beige-light)',
            overflow: 'hidden',
            marginBottom: '14px'
          }}
        >
          <div style={{
            width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
            height: '100%',
            backgroundColor: 'var(--accent-terracotta)',
            borderRadius: '9999px',
            transition: 'width 300ms ease'
          }} />
        </div>

        {/* Compact Today's Learning Path Visual Map */}
        {todayTasks.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <VisualMap
              nodes={todayLearningPathMap.nodes}
              edges={todayLearningPathMap.edges}
              title="Today's Learning Path"
              subtitle="Current placement sprint flow: Focus → Study → Quiz → Revision"
              orientation="horizontal"
              compact={true}
              interactive={true}
              onNodeClick={handleTodayMapNodeClick}
              showLegend={false}
              ariaLabel="Today's Learning Path Flow"
              accessibleSummary={todayLearningPathMap.summary}
            />
          </div>
        )}

        {/* Next Recommended Task Highlight */}
        {nextTask ? (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-beige)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pill-badge pill-terracotta" style={{ fontSize: '10px', padding: '1px 6px' }}>
                  Next Focus Task
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {nextTask.category || 'DSA'}
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-terracotta)' }}>
                {nextTask.durationMinutes || 45} min
              </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', margin: '0 0 4px 0' }}>
              {nextTask.name || nextTask.title}
            </h3>

            {nextTask.description && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                {nextTask.description}
              </p>
            )}
          </div>
        ) : totalTasks > 0 ? (
          <div style={{
            backgroundColor: 'var(--accent-sage-light)',
            border: '1px solid rgba(94, 140, 113, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-sage)', margin: '0 0 2px 0' }}>
              All daily placement missions completed! 🎉
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Great job maintaining consistency today. Review spaced revisions or practice mock interviews next.
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--bg-warm-cream)',
            border: '1px dashed var(--border-beige)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', margin: '0 0 4px 0' }}>
              No tasks scheduled for today
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
              Build your daily study plan from your placement roadmap.
            </p>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px', minHeight: '38px', borderRadius: 'var(--radius-pill)' }}
            >
              Upload / Generate Plan
            </button>
          </div>
        )}

        {/* CTA Button Row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleStartPrimaryFocus}
            className="btn-primary"
            style={{
              flex: 2,
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: 800,
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            aria-label="Start focus session for next recommended task"
          >
            <Play size={16} fill="#FFFFFF" />
            <span>{nextTask ? `Start Focus: ${nextTask.name || nextTask.title}` : 'Start Focus Session'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPlanDetails((prev) => !prev)}
            className="btn-secondary"
            style={{
              flex: 1,
              padding: '12px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            aria-expanded={showPlanDetails}
            aria-label={showPlanDetails ? "Hide today's detailed plan" : "View today's detailed plan"}
          >
            <span>{showPlanDetails ? 'Hide Plan' : "View Today's Plan"}</span>
            {showPlanDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Expandable Full Tasks List */}
        {showPlanDetails && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-beige-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-charcoal)', textTransform: 'uppercase' }}>
                All Today Tasks ({todayTasks.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAdaptiveModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--accent-terracotta)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Sliders size={12} />
                <span>Adjust Plan</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 3: ACTIVE FOCUS SESSION (ONLY IF ACTIVELY RUNNING/PAUSED)
          ========================================================================= */}
      {activeFocusSession && activeFocusTask && focusTimerMetrics && (
        <section 
          className="card-white dashboard-active-focus-card"
          style={{
            padding: '16px 18px',
            marginBottom: '16px',
            border: `2px solid ${focusTimerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)'}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)'
          }}
          role="region"
          aria-label="Active focus session status"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: focusTimerMetrics.isPaused ? 'var(--accent-amber-light)' : 'var(--accent-terracotta-light)',
                color: focusTimerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
                fontSize: '11px',
                fontWeight: 800
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: focusTimerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
                  boxShadow: focusTimerMetrics.isPaused ? 'none' : '0 0 6px var(--accent-terracotta)'
                }} />
                {focusTimerMetrics.isPaused ? 'Paused' : 'Running'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {activeFocusTask.name || activeFocusTask.title}
              </span>
            </div>

            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '16px',
              fontWeight: 800,
              color: focusTimerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)'
            }}>
              {formatFocusTime(focusTimerMetrics.remainingSeconds)}
            </span>
          </div>

          {/* Progress bar */}
          <div 
            role="progressbar"
            aria-valuenow={Math.round((focusTimerMetrics.elapsedSeconds / focusTimerMetrics.totalPlannedSeconds) * 100)}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Active focus timer progress"
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '9999px',
              backgroundColor: 'var(--border-beige-light)',
              overflow: 'hidden',
              marginBottom: '12px'
            }}
          >
            <div style={{
              width: `${Math.min(100, Math.round((focusTimerMetrics.elapsedSeconds / focusTimerMetrics.totalPlannedSeconds) * 100))}%`,
              height: '100%',
              backgroundColor: focusTimerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
              borderRadius: '9999px',
              transition: 'width 500ms linear'
            }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                if (focusTimerMetrics.isPaused) {
                  resumeFocusSession(activeFocusSession.sessionId);
                } else {
                  pauseFocusSession(activeFocusSession.sessionId);
                }
              }}
              className="btn-secondary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '12px', minHeight: '44px', gap: '6px' }}
              aria-label={focusTimerMetrics.isPaused ? 'Resume focus timer' : 'Pause focus timer'}
            >
              {focusTimerMetrics.isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
              <span>{focusTimerMetrics.isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFocusModalOpen(true)}
              className="btn-primary"
              style={{ flex: 2, padding: '8px 12px', fontSize: '12px', minHeight: '44px' }}
              aria-label="Open full focus modal"
            >
              <span>Open Focus View</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 4: QUICK PROGRESS (REAL-DATA SUMMARY METRICS)
          ========================================================================= */}
      <section 
        className="dashboard-quick-progress-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}
        aria-label="Quick progress metrics"
      >
        {/* Metric 1: Study Today */}
        <div className="card-white" style={{ padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Study Today
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-charcoal)' }}>
            {formatMinutes(actualStudiedMinutes)}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Target: {userProfile?.dailyTargetHours || 3}h
          </div>
        </div>

        {/* Metric 2: Tasks Completed */}
        <div className="card-white" style={{ padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Tasks Completed
          </div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 900, 
            color: completedTasks === totalTasks && totalTasks > 0 ? 'var(--accent-sage)' : 'var(--text-charcoal)' 
          }}>
            {totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '0/0'}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {completedTasks === totalTasks && totalTasks > 0 ? 'All finished ✓' : `${totalTasks - completedTasks} remaining`}
          </div>
        </div>

        {/* Metric 3: Revision Due */}
        <div className="card-white" style={{ padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Revision Due
          </div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 900, 
            color: dueRevisionsCount > 0 ? 'var(--accent-terracotta)' : 'var(--accent-sage)' 
          }}>
            {dueRevisionsCount}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {dueRevisionsCount > 0 ? 'Topics recall' : 'Caught up ✨'}
          </div>
        </div>

        {/* Metric 4: Readiness */}
        <div className="card-white" style={{ padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Readiness
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-charcoal)' }}>
            {coachAnalysis?.hasData ? `${coachAnalysis.readinessPercent}%` : 'Not enough data'}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {coachAnalysis?.hasData ? coachAnalysis.status.replace('_', ' ').toUpperCase() : 'Roadmap needed'}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CAREER JOURNEY SUMMARY MAP
          ========================================================================= */}
      <section aria-label="Placement Career Journey Overview" style={{ marginBottom: '16px' }}>
        <VisualMap
          nodes={careerJourneyMap.nodes}
          edges={careerJourneyMap.edges}
          title="Career Journey"
          subtitle="Connected preparation pipeline across curriculum, daily sprint, recall, and readiness"
          orientation="horizontal"
          compact={true}
          interactive={true}
          onNodeClick={(node) => {
            if (!node) return;
            if (node.entityType === 'roadmap') setActiveTab('roadmap');
            else if (node.entityType === 'today') setActiveTab('today');
            else if (node.entityType === 'revision') setActiveTab('revision');
            else if (node.entityType === 'interview') setActiveTab('interview');
            else if (node.entityType === 'applications') setActiveTab('applications');
            else if (node.entityType === 'coach') setActiveTab('coach');
          }}
          showLegend={false}
          ariaLabel="Overall placement career journey map"
          accessibleSummary={careerJourneyMap.summary}
        />
      </section>

      {/* =========================================================================
          SECTION 5: REVISION DUE (FOCUSED ACTIVE RECALL CARD)
          ========================================================================= */}
      <section 
        className="card-white dashboard-revision-card"
        style={{
          padding: '18px 20px',
          marginBottom: '16px',
          borderLeft: `4px solid ${dueRevisionsCount > 0 ? 'var(--accent-terracotta)' : 'var(--accent-sage)'}`,
          boxShadow: 'var(--shadow-sm)'
        }}
        role="region"
        aria-label="Spaced revision status"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCcw size={16} color={dueRevisionsCount > 0 ? 'var(--accent-terracotta)' : 'var(--accent-sage)'} />
            <h2 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0 }}>
              Spaced Revision Health
            </h2>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: dueRevisionsCount > 0 ? 'var(--accent-terracotta)' : 'var(--accent-sage)' }}>
            {dueRevisionsCount > 0 ? `${dueRevisionsCount} due today` : 'Up to date'}
          </span>
        </div>

        {priorityRevision ? (
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', margin: '0 0 4px 0' }}>
              Priority Recall: {priorityRevision.topic}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
              Estimated retention at <strong>{priorityRevision.retentionScore || '68%'}</strong>. Review before active recall decay accelerates.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleOpenRevision(priorityRevision)}
                className="btn-primary"
                style={{ flex: 2, padding: '10px 14px', fontSize: '12.5px', minHeight: '44px', gap: '6px' }}
                aria-label={`Start revision session for ${priorityRevision.topic}`}
              >
                <RotateCcw size={14} />
                <span>Start Revision</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('revision')}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 12px', fontSize: '12px', minHeight: '44px' }}
                aria-label="View all scheduled revisions"
              >
                <span>View Queue</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-sage)', margin: '0 0 4px 0' }}>
              You're caught up ✨
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
              All spaced repetition reviews are currently up to date. Memory retention is fully protected across your placement roadmap topics.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('revision')}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px 14px', fontSize: '12px', minHeight: '44px' }}
              aria-label="Explore all revision topics"
            >
              <span>Explore Revision Queue ({revisionQueue.length} topics tracked)</span>
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 6: ROADMAP SNAPSHOT (AUTHORITATIVE PROGRESSION)
          ========================================================================= */}
      <section 
        className="card-white dashboard-roadmap-card"
        style={{
          padding: '18px 20px',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}
        role="region"
        aria-label="Visual roadmap snapshot"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Map size={16} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0 }}>
              Roadmap Progression
            </h2>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>
            {roadmapProgress}%
          </span>
        </div>

        {activeRoadmap && activeRoadmap.phases && activeRoadmap.phases.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
                {currentPhase?.title || activeRoadmap.title}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {completedRoadmapTopics} / {totalRoadmapTopics} topics
              </span>
            </div>

            {/* Authoritative progress bar */}
            <div 
              role="progressbar"
              aria-valuenow={roadmapProgress}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Overall roadmap progress"
              style={{
                width: '100%',
                height: '7px',
                borderRadius: '9999px',
                backgroundColor: 'var(--border-beige-light)',
                overflow: 'hidden',
                margin: '8px 0 12px 0'
              }}
            >
              <div style={{
                width: `${roadmapProgress}%`,
                height: '100%',
                backgroundColor: 'var(--accent-terracotta)',
                borderRadius: '9999px',
                transition: 'width 400ms ease'
              }} />
            </div>

            {nextRoadmapTopic && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
                Next in queue: <strong>{nextRoadmapTopic.name}</strong>
              </p>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('roadmap')}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '12.5px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              aria-label="Open visual roadmap view"
            >
              <span>Continue Roadmap</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', margin: '0 0 4px 0' }}>
              Upload your roadmap to start
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Transform your college placement curriculum or coding target into structured learning phases.
            </p>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary"
              style={{ width: '100%', padding: '10px 14px', fontSize: '12px', minHeight: '44px', gap: '6px' }}
              aria-label="Upload placement roadmap"
            >
              <UploadCloud size={14} />
              <span>Upload Roadmap</span>
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 7: AI COACH SNAPSHOT
          ========================================================================= */}
      <section 
        className="card-white dashboard-coach-card"
        style={{
          padding: '18px 20px',
          marginBottom: '16px',
          border: '1.5px solid var(--accent-terracotta)',
          boxShadow: 'var(--shadow-sm)'
        }}
        role="region"
        aria-label="Placement Coach snapshot"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)', margin: 0 }}>
              AI Placement Coach
            </h2>
          </div>

          {coachAnalysis?.hasData && (
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: coachAnalysis.status === 'on_track' ? 'var(--accent-sage-light)' : 'var(--accent-amber-light)',
              color: coachAnalysis.status === 'on_track' ? 'var(--accent-sage)' : 'var(--accent-amber)'
            }}>
              {coachAnalysis.status === 'on_track' ? 'ON TRACK' : coachAnalysis.status === 'needs_attention' ? 'NEEDS ATTENTION' : 'AT RISK'}
            </span>
          )}
        </div>

        {coachAnalysis?.hasData ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-charcoal)' }}>
                {coachAnalysis.readinessPercent}%
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Overall Placement Readiness
              </span>
            </div>

            {coachAnalysis.nextBestAction && (
              <div style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                border: '1px solid var(--border-beige)',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="pill-badge pill-terracotta" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                    {coachAnalysis.nextBestAction.badge || 'Recommended Action'}
                  </span>
                </div>

                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '2px' }}>
                  {coachAnalysis.nextBestAction.title}
                </div>

                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                  {coachAnalysis.nextBestAction.description}
                </p>

                {coachAnalysis.nextBestAction.whyThis && (
                  <div style={{ marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setOpenWhyThis((prev) => !prev)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      aria-expanded={openWhyThis}
                      aria-label="Toggle algorithmic reasoning for recommended action"
                    >
                      <HelpCircle size={12} />
                      <span>Why this action?</span>
                      {openWhyThis ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {openWhyThis && (
                      <div style={{
                        marginTop: '6px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-warm-cream)',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4'
                      }}>
                        💡 {coachAnalysis.nextBestAction.whyThis}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigateToCoachTarget && navigateToCoachTarget(coachAnalysis.nextBestAction)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '12px', minHeight: '44px', gap: '6px' }}
                  aria-label={`Execute coach action: ${coachAnalysis.nextBestAction.title}`}
                >
                  <span>{coachAnalysis.nextBestAction.ctaLabel || 'Take Action'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('coach')}
              className="btn-secondary"
              style={{ width: '100%', padding: '9px 12px', fontSize: '12px', minHeight: '44px' }}
              aria-label="Open AI Placement Coach full report"
            >
              <span>Open Placement Coach Full Report</span>
            </button>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', margin: '0 0 4px 0' }}>
              AI Coach Diagnostics Pending
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Confirm your roadmap and complete tasks to generate readiness scores, strength audits, and weekly pacing.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('coach')}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px 12px', fontSize: '12px', minHeight: '44px' }}
              aria-label="View coach status"
            >
              <span>View Coach Status</span>
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 8: UPCOMING EVENTS (CALENDAR INTEGRATION)
          ========================================================================= */}
      <section 
        className="card-white dashboard-calendar-card"
        style={{
          padding: '18px 20px',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}
        role="region"
        aria-label="Upcoming calendar events"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0 }}>
              Upcoming Schedule
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px'
            }}
            aria-label="Open full calendar view"
          >
            Full Calendar →
          </button>
        </div>

        {upcomingEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {upcomingEvents.map((evt, idx) => (
              <div
                key={evt.id || idx}
                onClick={() => openCalendarEventTarget && openCalendarEventTarget(evt)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-warm-cream-alt)',
                  border: '1px solid var(--border-beige)',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open event: ${evt.title} on ${evt.date}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCalendarEventTarget && openCalendarEventTarget(evt);
                  }
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                    {evt.title}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {evt.date} {evt.time ? `• ${evt.time}` : ''}
                  </div>
                </div>

                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: evt.type === 'INTERVIEW' ? 'var(--accent-terracotta-light)' : 'var(--bg-card)',
                  color: evt.type === 'INTERVIEW' ? 'var(--accent-terracotta)' : 'var(--text-secondary)'
                }}>
                  {evt.type ? evt.type.replace('_', ' ') : 'EVENT'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '14px',
            backgroundColor: 'var(--bg-warm-cream)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Nothing scheduled. Your upcoming interviews, deadlines, and study sessions will appear here.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className="btn-secondary"
          style={{ width: '100%', padding: '10px 14px', fontSize: '12px', minHeight: '44px' }}
          aria-label="View placement calendar"
        >
          <span>View Calendar</span>
        </button>
      </section>

      {/* =========================================================================
          SECTION 9: RECENT ACTIVITY (AUTHENTIC FEED)
          ========================================================================= */}
      <section 
        className="card-white dashboard-activity-card"
        style={{
          padding: '18px 20px',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}
        role="region"
        aria-label="Recent student activity feed"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Activity size={16} color="var(--accent-terracotta)" />
          <h2 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0 }}>
            Recent Activity
          </h2>
        </div>

        {recentActivityFeed.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentActivityFeed.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '12px',
                    color: 'var(--text-charcoal)'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-warm-cream-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0,
                    marginTop: '1px'
                  }}>
                    <Icon size={13} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, lineHeight: '1.3' }}>
                      {item.title}
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {item.timeLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, textAlign: 'center', padding: '10px 0' }}>
            No recent activity recorded yet. Start a focus mission or active recall session to log your progress.
          </p>
        )}
      </section>

      {/* Safe bottom spacer ensuring 100% visibility past floating bottom nav */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
