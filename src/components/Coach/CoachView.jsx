import React, { useState, useMemo } from 'react';
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
  Award,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Play
} from 'lucide-react';
import { CoachAdjustmentModal } from './CoachAdjustmentModal';
import { VisualMap, buildCoachReadinessMap } from '../VisualMap';

export const CoachView = () => {
  const { 
    coachAnalysis, 
    userProfile,
    refreshCoachAnalysis, 
    applyCoachRecommendation, 
    navigateToCoachTarget,
    isCoachLoading, 
    setActiveTab,
    showToast 
  } = useApp();

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [openWhyThisMap, setOpenWhyThisMap] = useState({});
  const [isApplyingAdjustment, setIsApplyingAdjustment] = useState(false);

  const readinessMapData = useMemo(() => {
    return buildCoachReadinessMap(coachAnalysis, userProfile);
  }, [coachAnalysis, userProfile]);

  const handleMapNodeClick = (node) => {
    if (!node) return;
    if (node.entityType === 'roadmap') {
      setActiveTab('roadmap');
    } else if (node.entityType === 'revision') {
      setActiveTab('revision');
    } else if (node.entityType === 'interview') {
      setActiveTab('interview');
    } else if (node.entityType === 'applications') {
      setActiveTab('applications');
    }
  };

  const toggleWhyThis = (key) => {
    setOpenWhyThisMap((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 13. LOADING STATE
  if (isCoachLoading && !coachAnalysis) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 200ms ease' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-warm-cream-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: 'var(--accent-terracotta)'
        }}>
          <RotateCw size={26} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
          Evaluating Placement Readiness...
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Analyzing authentic roadmap topics, revision health, and interview schedule.
        </p>
      </div>
    );
  }

  // 13. EMPTY / INSUFFICIENT DATA STATE
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
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 20px auto', lineHeight: '1.45' }}>
          Upload and confirm your placement roadmap to unlock personalized AI Placement Coach insights and readiness tracking.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('roadmap')}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '13px', minHeight: '44px' }}
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
  const nextAction = coachAnalysis.nextBestAction;

  const handleApplyAdjustment = async (recommendation) => {
    setIsApplyingAdjustment(true);
    try {
      await applyCoachRecommendation(recommendation);
    } finally {
      setIsApplyingAdjustment(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 200ms ease', width: '100%' }}>
      {/* Header with Title & Refresh Action */}
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
            Understand where you stand, what is holding you back, and what to do next.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshCoachAnalysis(true)}
          disabled={isCoachLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--accent-terracotta)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-beige)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-pill)',
            cursor: isCoachLoading ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow-sm)',
            minHeight: '44px'
          }}
          title="Refresh Analysis with latest data"
          aria-label="Refresh analysis with latest data"
        >
          <RotateCw size={14} style={{ animation: isCoachLoading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: READINESS CARD
          ========================================================================= */}
      <div 
        className="card-white"
        style={{
          padding: '20px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF7F2 100%)',
          border: '1.5px solid var(--border-beige)',
          boxShadow: 'var(--shadow-sm)'
        }}
        role="region"
        aria-label="Placement readiness summary"
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

        {/* Dynamic Accessible Progress Bar */}
        <div 
          role="progressbar"
          aria-valuenow={coachAnalysis.readinessPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Placement readiness score percentage"
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border-beige-light)',
            overflow: 'hidden',
            marginBottom: '14px'
          }}
        >
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

      {/* =========================================================================
          SECTION 1.5: PLACEMENT READINESS MAP
          ========================================================================= */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)', margin: 0 }}>
              End-to-End Placement Pathway
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Click node to jump to feature
          </span>
        </div>
        <div className="card-white" style={{ padding: '16px' }}>
          <VisualMap
            nodes={readinessMapData.nodes}
            edges={readinessMapData.edges}
            summary={readinessMapData.summary}
            direction="horizontal"
            onNodeClick={handleMapNodeClick}
            ariaLabel="Placement Readiness Pipeline Visual Map"
          />
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: STRENGTHS (WHAT'S GOING WELL)
          ========================================================================= */}
      <div 
        className="card-white"
        style={{
          padding: '18px 20px',
          marginBottom: '16px',
          borderLeft: '4px solid var(--accent-sage)',
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} color="var(--accent-sage)" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-sage)', margin: 0 }}>
              Evidence-Based Strengths
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {coachAnalysis.strengths.length} verified
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {coachAnalysis.strengths.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--text-charcoal)' }}>
              <span style={{ color: 'var(--accent-sage)', fontWeight: 800, marginTop: '1px' }}>✓</span>
              <span style={{ lineHeight: '1.4' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: NEEDS ATTENTION (PRIORITY WEAKNESSES)
          ========================================================================= */}
      <div 
        className="card-white"
        style={{
          padding: '18px 20px',
          marginBottom: '16px',
          borderLeft: '4px solid var(--accent-terracotta)',
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)', margin: 0 }}>
              Needs Attention
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {coachAnalysis.weakAreas.length} priority area{coachAnalysis.weakAreas.length > 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {coachAnalysis.weakAreas.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--text-charcoal)' }}>
              <span style={{ color: 'var(--accent-terracotta)', fontWeight: 800, marginTop: '1px' }}>⚠</span>
              <span style={{ lineHeight: '1.4' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: NEXT BEST ACTION (PROMINENT CARD + EXACT DEEP LINK)
          ========================================================================= */}
      {nextAction && (
        <div 
          className="card-white"
          style={{
            padding: '20px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #FFFDFB 0%, #FAF6F0 100%)',
            border: '2px solid var(--accent-terracotta)',
            boxShadow: 'var(--shadow-md)'
          }}
          role="region"
          aria-label="Next best action recommended by placement coach"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={16} color="var(--accent-terracotta)" />
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)' }}>
                Next Best Action
              </span>
            </div>
            {nextAction.badge && (
              <span className="pill-badge pill-terracotta" style={{ fontSize: '10px', padding: '2px 8px' }}>
                {nextAction.badge}
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
            {nextAction.title}
          </h3>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '12px' }}>
            {nextAction.description}
          </p>

          {/* "Why This?" Compact Interaction */}
          <div style={{ marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => toggleWhyThis('next_action')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 0'
              }}
              aria-expanded={Boolean(openWhyThisMap.next_action)}
            >
              <HelpCircle size={13} />
              <span>Why this action?</span>
              {openWhyThisMap.next_action ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {openWhyThisMap.next_action && (
              <div style={{
                marginTop: '6px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-warm-cream)',
                borderRadius: 'var(--radius-md)',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                lineHeight: '1.4',
                border: '1px solid var(--border-beige-light)'
              }}>
                💡 {nextAction.whyThis}
              </div>
            )}
          </div>

          {/* Action CTA with Exact Deep Link */}
          <button
            type="button"
            onClick={() => navigateToCoachTarget && navigateToCoachTarget(nextAction)}
            className="btn-primary"
            style={{ width: '100%', padding: '12px 18px', fontSize: '13px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>{nextAction.ctaLabel || 'Take Action'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 5: WEEKLY PROGRESS (REAL PERSISTED DATA ONLY)
          ========================================================================= */}
      {coachAnalysis.weeklyReport && (
        <div className="card-white" style={{ padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <BarChart3 size={16} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)', margin: 0 }}>
              Weekly Progress Summary
            </h2>
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

      {/* =========================================================================
          SECTION 6: DOMAIN BREAKDOWN
          ========================================================================= */}
      <div className="card-white" style={{ padding: '18px 20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '12px' }}>
          Domain Readiness Breakdown
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {coachAnalysis.categories.map((cat, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '12.5px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{cat.name}</span>
                <span style={{ fontWeight: 800, color: cat.percentage < 50 ? 'var(--accent-terracotta)' : 'var(--text-charcoal)' }}>
                  {cat.percentage}% ({cat.completed}/{cat.total} topics)
                </span>
              </div>

              <div 
                role="progressbar"
                aria-valuenow={cat.percentage}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`${cat.name} completion percentage`}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--border-beige-light)',
                  overflow: 'hidden'
                }}
              >
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

      {/* =========================================================================
          SECTION 7: ACTIONABLE REDISTRIBUTION RECOMMENDATION (ADJUST PLAN)
          ========================================================================= */}
      {coachAnalysis.recommendation && (
        <div 
          className="card-white"
          style={{
            padding: '18px 20px',
            marginBottom: '16px',
            borderLeft: '4px solid var(--accent-terracotta)',
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Sparkles size={15} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)', margin: 0 }}>
              Capacity Redistribution Recommendation
            </h2>
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
              style={{ flex: 2, padding: '10px 14px', fontSize: '12px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Check size={15} />
              <span>Review & Apply Plan</span>
            </button>

            <button
              type="button"
              onClick={() => showToast('Recommendation Deferred', 'You can apply this adjustment anytime.', 'neutral')}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px 12px', fontSize: '12px', minHeight: '44px' }}
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* Plan Adjustment Confirmation Modal */}
      {isAdjustmentModalOpen && (
        <CoachAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          recommendation={coachAnalysis.recommendation}
          onConfirm={handleApplyAdjustment}
          isSubmitting={isApplyingAdjustment}
        />
      )}

      {/* Bottom spacer */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
