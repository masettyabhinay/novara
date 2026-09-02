import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  TrendingUp, 
  RotateCw, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  Layers, 
  ShieldCheck, 
  Target,
  BarChart3,
  Flame,
  Award
} from 'lucide-react';
import { CoachAdjustmentModal } from './CoachAdjustmentModal';

export const CoachView = () => {
  const { 
    coachAnalysis, 
    refreshCoachAnalysis, 
    applyCoachRecommendation, 
    isCoachLoading, 
    userProfile, 
    streakData, 
    roadmapProgress,
    setActiveTab,
    showToast 
  } = useApp();

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  if (!coachAnalysis || !coachAnalysis.hasData) {
    return (
      <div style={{ animation: 'fadeIn 200ms ease', textAlign: 'center', padding: '40px 16px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          backgroundColor: 'var(--bg-warm-cream-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-terracotta)',
          margin: '0 auto 16px auto',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Sparkles size={26} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
          Not enough preparation data yet
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto 20px auto', lineHeight: '1.45' }}>
          Upload and confirm your placement roadmap to unlock personalized AI Placement Coach insights and readiness tracking.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('roadmap')}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '13px' }}
        >
          <span>Go to Roadmap</span>
          <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'on_track':
        return { label: 'ON TRACK', color: 'var(--accent-sage)', bg: 'var(--accent-sage-light)', icon: CheckCircle2 };
      case 'needs_attention':
        return { label: 'NEEDS ATTENTION', color: 'var(--accent-amber)', bg: 'var(--accent-amber-light)', icon: AlertTriangle };
      case 'at_risk':
        return { label: 'AT RISK', color: 'var(--accent-terracotta)', bg: 'var(--accent-terracotta-light)', icon: AlertTriangle };
      default:
        return { label: 'EVALUATING', color: 'var(--text-secondary)', bg: 'var(--bg-warm-cream-alt)', icon: Sparkles };
    }
  };

  const getPaceDisplay = (pace) => {
    switch (pace) {
      case 'ahead':
        return { label: 'Ahead of Pace', color: 'var(--accent-sage)' };
      case 'behind':
        return { label: 'Behind Pace', color: 'var(--accent-terracotta)' };
      case 'on_track':
        return { label: 'On Track', color: 'var(--accent-sage)' };
      default:
        return { label: 'Target Date Not Set', color: 'var(--text-muted)' };
    }
  };

  const statusInfo = getStatusDisplay(coachAnalysis.status);
  const paceInfo = getPaceDisplay(coachAnalysis.pacingStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div style={{ animation: 'fadeIn 200ms ease', width: '100%' }}>
      {/* 1. Header with Refresh Trigger */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <span className="pill-badge pill-terracotta" style={{ marginBottom: '4px' }}>
            <Sparkles size={11} /> AI Placement Coach
          </span>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            marginBottom: '2px',
            lineHeight: '1.25'
          }}>
            Your Placement Coach
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Understand where you stand and what to focus on next.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshCoachAnalysis}
          disabled={isCoachLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--accent-terracotta)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-beige)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
          title="Refresh Analysis with latest data"
        >
          <RotateCw size={12} style={{ animation: isCoachLoading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. PLACEMENT READINESS HERO CARD */}
      <div 
        className="card-white"
        style={{
          padding: '20px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF7F2 100%)',
          border: '1.5px solid var(--border-beige)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Placement Readiness
            </div>
            <div style={{ fontSize: '38px', fontWeight: 900, color: 'var(--text-charcoal)', letterSpacing: '-0.03em', lineHeight: '1.1', marginTop: '2px' }}>
              {coachAnalysis.readinessPercent}%
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: statusInfo.bg,
            color: statusInfo.color,
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.02em'
          }}>
            <StatusIcon size={14} />
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          borderRadius: '9999px',
          backgroundColor: 'var(--border-beige-light)',
          overflow: 'hidden',
          marginBottom: '14px'
        }}>
          <div style={{
            width: `${coachAnalysis.readinessPercent}%`,
            height: '100%',
            backgroundColor: statusInfo.color,
            borderRadius: '9999px',
            transition: 'width 400ms ease'
          }} />
        </div>

        {/* Placement Countdown & Current Pace Sub-card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-beige-light)'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Placement Countdown
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
              {coachAnalysis.daysRemaining !== null ? `${coachAnalysis.daysRemaining} days` : 'No date set'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Current Pace
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: paceInfo.color, marginTop: '2px' }}>
              {paceInfo.label}
            </div>
          </div>
        </div>
      </div>

      {/* 3. COACH'S ACTIONABLE RECOMMENDATION */}
      {coachAnalysis.recommendation && (
        <div 
          className="card-white"
          style={{
            padding: '18px 20px',
            marginBottom: '16px',
            borderLeft: '4px solid var(--accent-terracotta)',
            backgroundColor: '#FFFFFF',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Sparkles size={15} color="var(--accent-terracotta)" />
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)' }}>
              Coach's Recommendation
            </span>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
            {coachAnalysis.recommendation.title}
          </h3>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '8px' }}>
            {coachAnalysis.recommendation.summary}
          </p>

          <div style={{
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-warm-cream-alt)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px'
          }}>
            💡 <strong>Reasoning:</strong> {coachAnalysis.recommendation.reasoning}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="btn-primary"
              style={{ flex: 2, padding: '9px 14px', fontSize: '12px' }}
            >
              <Check size={14} />
              <span>Apply Recommendation</span>
            </button>

            <button
              type="button"
              onClick={() => showToast('Recommendation Deferred', 'You can apply this adjustment anytime.', 'neutral')}
              className="btn-secondary"
              style={{ flex: 1, padding: '9px 10px', fontSize: '12px' }}
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* 4. PREPARATION BREAKDOWN BY REAL CATEGORY */}
      <div className="card-white" style={{ padding: '18px 20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '12px' }}>
          Preparation Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {coachAnalysis.categories.map((cat, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '12.5px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{cat.name}</span>
                <span style={{ fontWeight: 800, color: cat.percentage < 50 ? 'var(--accent-terracotta)' : 'var(--text-charcoal)' }}>
                  {cat.percentage}% ({cat.completed}/{cat.total} topics)
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: 'var(--border-beige-light)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${cat.percentage}%`,
                  height: '100%',
                  backgroundColor: cat.percentage < 50 ? 'var(--accent-terracotta)' : 'var(--accent-sage)',
                  borderRadius: '9999px'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. STRENGTHS & AREAS TO IMPROVE */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Strengths */}
        <div 
          className="card-white"
          style={{
            padding: '16px 18px',
            borderLeft: '4px solid var(--accent-sage)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--accent-sage)', marginBottom: '10px' }}>
            What's Going Well
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {coachAnalysis.strengths.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-charcoal)' }}>
                <span style={{ color: 'var(--accent-sage)', fontWeight: 800 }}>✓</span>
                <span style={{ lineHeight: '1.4' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div 
          className="card-white"
          style={{
            padding: '16px 18px',
            borderLeft: '4px solid var(--accent-terracotta)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--accent-terracotta)', marginBottom: '10px' }}>
            Needs Attention
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {coachAnalysis.weakAreas.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-charcoal)' }}>
                <span style={{ color: 'var(--accent-terracotta)', fontWeight: 800 }}>⚠</span>
                <span style={{ lineHeight: '1.4' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. WEEKLY COACH REPORT */}
      {coachAnalysis.weeklyReport && (
        <div className="card-white" style={{ padding: '18px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <BarChart3 size={16} color="var(--accent-terracotta)" />
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)' }}>
              Weekly Coach Report
            </span>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '12px' }}>
            Your week with NOVARA
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '14px',
            textAlign: 'center'
          }}>
            <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {coachAnalysis.weeklyReport.tasksCompleted}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tasks done</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-terracotta)' }}>
                {coachAnalysis.weeklyReport.hoursStudied}h
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Studied</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-sage)' }}>
                {coachAnalysis.weeklyReport.currentStreak}d
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Streak</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {(coachAnalysis.weeklyReport.takeaways || []).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ color: 'var(--accent-terracotta)', fontWeight: 800 }}>•</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <CoachAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          recommendation={coachAnalysis.recommendation}
          onConfirm={applyCoachRecommendation}
        />
      )}

      {/* Bottom spacer */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
