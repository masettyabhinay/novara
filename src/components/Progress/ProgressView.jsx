import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, 
  Flame, 
  Award, 
  CheckCircle2, 
  Clock, 
  Code2, 
  Calendar, 
  Brain, 
  Sparkles,
  Target,
  ArrowUpRight,
  Play,
  Hourglass
} from 'lucide-react';

export const ProgressView = () => {
  const { 
    readinessMetrics, 
    streakData, 
    userProfile, 
    focusAnalytics, 
    refreshFocusAnalytics, 
    setActiveTab 
  } = useApp();

  useEffect(() => {
    if (refreshFocusAnalytics) {
      refreshFocusAnalytics();
    }
  }, []);

  const formatHoursAndMinutes = (minutes = 0) => {
    if (!minutes || minutes <= 0) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  const getBarColor = (colorName) => {
    switch (colorName) {
      case 'terracotta':
        return 'var(--accent-terracotta)';
      case 'navy':
        return 'var(--accent-navy)';
      case 'sage':
        return 'var(--accent-sage)';
      case 'amber':
        return 'var(--accent-amber)';
      case 'purple':
        return 'var(--accent-purple)';
      default:
        return 'var(--accent-terracotta)';
    }
  };

  const todayStudyMins = focusAnalytics?.todayStudyMinutes || 0;
  const weekStudyMins = focusAnalytics?.weekStudyMinutes || 0;
  const avgDailyMins = focusAnalytics?.averageDailyStudyMinutes || 0;
  const plannedHours = focusAnalytics?.plannedHours || (userProfile.dailyTargetHours || 3.0);
  const actualHours = focusAnalytics?.actualHours || 0;
  const completionRate = focusAnalytics?.completionRate || 0;
  const hasStudyHistory = (focusAnalytics?.totalCompletedSessions || 0) > 0 || todayStudyMins > 0;

  return (
    <div style={{ animation: 'fadeIn 250ms ease' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <span className="pill-badge pill-terracotta" style={{ marginBottom: '6px' }}>
          Analytics & Readiness
        </span>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          color: 'var(--text-charcoal)',
          letterSpacing: '-0.02em',
          marginBottom: '4px'
        }}>
          Placement Readiness
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Benchmark performance against target {userProfile.targetRole} criteria.
        </p>
      </div>

      {/* Main Hero Readiness Card */}
      <div 
        className="card-white"
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '20px',
          padding: '24px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, var(--bg-warm-cream-alt) 100%)',
          borderColor: 'var(--border-beige)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Overall Readiness Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '44px',
                fontWeight: 800,
                color: 'var(--text-charcoal)',
                lineHeight: '1'
              }}>
                {readinessMetrics.overallScore}%
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-sage)' }}>
                +6% this week
              </span>
            </div>
          </div>

          <div style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-terracotta-light)',
            border: '1px solid rgba(200, 90, 50, 0.2)',
            color: 'var(--accent-terracotta)',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sparkles size={13} />
            <span>Tier-1 Ready</span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div style={{
          width: '100%',
          height: '10px',
          borderRadius: '9999px',
          backgroundColor: 'var(--bg-cream-darker)',
          overflow: 'hidden',
          marginBottom: '10px'
        }}>
          <div style={{
            width: `${readinessMetrics.overallScore}%`,
            height: '100%',
            backgroundColor: 'var(--accent-terracotta)',
            borderRadius: '9999px',
            transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>Target Cutoff: 70%</span>
          <button
            type="button"
            onClick={() => setActiveTab('coach')}
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>Ask Coach</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* REAL STUDY TIME ANALYTICS (FOCUS MODE METRICS) */}
      {/* ------------------------------------------------------------------- */}
      <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-terracotta-light)',
              color: 'var(--accent-terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                Study Time Analytics
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Tracked in real-time through Focus Mode
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('today')}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Open Today →
          </button>
        </div>

        {hasStudyHistory ? (
          <>
            {/* 3 Metric Pills */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-warm-cream)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Today
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                  {formatHoursAndMinutes(todayStudyMins)}
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-warm-cream)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  This Week
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                  {formatHoursAndMinutes(weekStudyMins)}
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-warm-cream)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Daily Avg
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                  {formatHoursAndMinutes(avgDailyMins)}
                </div>
              </div>
            </div>

            {/* Planned vs Actual Section */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                  Planned vs Actual
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-sage)' }}>
                  {completionRate}% Completion Rate
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>Planned: <strong>{plannedHours}h</strong></span>
                <span>Actual: <strong>{actualHours}h</strong></span>
              </div>

              <div style={{
                width: '100%',
                height: '7px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${completionRate}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--accent-terracotta)',
                  transition: 'width 400ms ease'
                }} />
              </div>
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '24px 16px',
            backgroundColor: 'var(--bg-warm-cream)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-beige)'
          }}>
            <Hourglass size={24} color="var(--accent-terracotta)" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
              Your study activity will appear here.
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0 auto 12px auto' }}>
              Start your first Focus Session from Today's Mission to begin tracking real study analytics.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '12px', borderRadius: 'var(--radius-pill)', gap: '6px' }}
            >
              <Play size={12} fill="#FFFFFF" />
              <span>Start First Focus Session</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Key Performance Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* Stat 1: Tasks Completed */}
        <div className="card-white" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-sage)', marginBottom: '8px' }}>
            <CheckCircle2 size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tasks Done</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
            {readinessMetrics.stats.tasksCompleted}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Total missions completed
          </div>
        </div>

        {/* Stat 2: Active Streak */}
        <div className="card-white" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-terracotta)', marginBottom: '8px' }}>
            <Flame size={16} fill="var(--accent-terracotta)" />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Streak</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
            {streakData.currentStreak} Days
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Personal best: {streakData.longestStreak} days
          </div>
        </div>

        {/* Stat 3: Spaced Revisions */}
        <div className="card-white" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-navy)', marginBottom: '8px' }}>
            <Brain size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Problems Solved</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
            {readinessMetrics.stats.problemsSolved || 48}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Algorithms & SQL items
          </div>
        </div>

        {/* Stat 4: Days Active */}
        <div className="card-white" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', marginBottom: '8px' }}>
            <Calendar size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Days Completed</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
            {readinessMetrics.stats.daysCompleted || streakData.completedDays || 12}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Out of 90-Day Masterplan
          </div>
        </div>
      </div>

      {/* Domain Readiness Breakdown */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '14px' }}>
          Domain Breakdown
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {readinessMetrics.categories.map((cat, idx) => (
            <div 
              key={idx}
              className="card-white"
              style={{ padding: '16px 18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                  {cat.name}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: getBarColor(cat.color) }}>
                  {cat.percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                overflow: 'hidden',
                marginBottom: '6px'
              }}>
                <div style={{
                  width: `${cat.percentage}%`,
                  height: '100%',
                  backgroundColor: getBarColor(cat.color),
                  borderRadius: '9999px'
                }} />
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {cat.totalProblems ? `${cat.totalProblems} of ${cat.targetProblems} problems solved` : cat.completedTopics ? `${cat.completedTopics} of ${cat.targetTopics} core topics mastered` : `${cat.completedStories} STAR stories prepared`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safe bottom spacer */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
