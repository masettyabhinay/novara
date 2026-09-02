import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  RotateCcw, 
  Calendar, 
  Brain, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  HelpCircle,
  Clock,
  X,
  ChevronRight,
  AlertTriangle,
  Award,
  Layers,
  Flame,
  AlertCircle
} from 'lucide-react';

export const RevisionView = () => {
  const { 
    revisionQueue, 
    revisionMetrics,
    refreshRevisions, 
    startAdaptiveRevision, 
    setSelectedTopicDetail, 
    setIsTopicDetailOpen,
    setActiveTab 
  } = useApp();

  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    if (refreshRevisions) {
      refreshRevisions();
    }
  }, []);

  // Filter revisions by category tab
  const categories = ['ALL', 'DSA', 'Core CS', 'SQL', 'System Design'];
  const filteredQueue = (revisionQueue || []).filter((r) => {
    if (filterCategory === 'ALL') return true;
    return r.category?.toUpperCase() === filterCategory.toUpperCase();
  });

  const dueRevisions = filteredQueue.filter(
    (r) => r.revisionDueDate === 'Today' || (r.revisionDueDate || '').startsWith('Overdue')
  );

  const upcomingRevisions = filteredQueue.filter(
    (r) => r.revisionDueDate !== 'Today' && !(r.revisionDueDate || '').startsWith('Overdue')
  );

  const metrics = revisionMetrics || {
    dueTodayCount: dueRevisions.filter((r) => r.revisionDueDate === 'Today').length,
    overdueCount: dueRevisions.filter((r) => (r.revisionDueDate || '').startsWith('Overdue')).length,
    strongCount: (revisionQueue || []).filter((r) => (r.retentionScore || 0) >= 80).length,
    needsReviewCount: (revisionQueue || []).filter((r) => (r.retentionScore || 0) < 65).length,
    averageRetention: 80
  };

  return (
    <div style={{ animation: 'fadeIn 250ms ease' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <span className="pill-badge pill-sage" style={{ marginBottom: '6px' }}>
          Adaptive Spaced Repetition
        </span>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          color: 'var(--text-charcoal)',
          letterSpacing: '-0.02em',
          marginBottom: '4px'
        }}>
          Revision
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Strengthen what you've already learned based on active memory decay curves.
        </p>
      </div>

      {/* 4 Key Revision Metrics Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {/* Metric 1: Due Today */}
        <div className="card-white" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Due Today
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: metrics.dueTodayCount > 0 ? 'var(--accent-terracotta)' : 'var(--text-charcoal)' }}>
            {metrics.dueTodayCount}
          </div>
        </div>

        {/* Metric 2: Overdue */}
        <div className="card-white" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Overdue
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: metrics.overdueCount > 0 ? 'var(--accent-terracotta)' : 'var(--text-charcoal)' }}>
            {metrics.overdueCount}
          </div>
        </div>

        {/* Metric 3: Strong */}
        <div className="card-white" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Strong
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-sage)' }}>
            {metrics.strongCount}
          </div>
        </div>

        {/* Metric 4: Needs Review */}
        <div className="card-white" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Needs Review
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: metrics.needsReviewCount > 0 ? 'var(--accent-amber)' : 'var(--text-charcoal)' }}>
            {metrics.needsReviewCount}
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '11.5px',
              fontWeight: 700,
              backgroundColor: filterCategory === cat ? 'var(--text-charcoal)' : '#FFFFFF',
              color: filterCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-beige)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* =================================================================== */}
      {/* 1. TODAY'S PRIORITY REVISION QUEUE */}
      {/* =================================================================== */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Brain size={17} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
              Due Today ({dueRevisions.length})
            </h2>
          </div>
        </div>

        {dueRevisions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dueRevisions.map((item) => {
              const retention = item.retentionScore || 65;
              const isOverdue = (item.revisionDueDate || '').startsWith('Overdue');

              return (
                <div 
                  key={item.id}
                  className="card-white"
                  style={{
                    padding: '16px 18px',
                    borderLeft: `4px solid ${isOverdue ? 'var(--accent-terracotta)' : 'var(--accent-sage)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Category & Retention Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`pill-badge ${item.category === 'DSA' ? 'pill-terracotta' : 'pill-navy'}`} style={{ fontSize: '10px' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isOverdue ? 'var(--accent-terracotta)' : 'var(--accent-sage)' }}>
                        {item.revisionDueDate}
                      </span>
                    </div>

                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: retention >= 80 ? 'var(--accent-sage)' : retention < 60 ? 'var(--accent-terracotta)' : 'var(--accent-amber)' }}>
                      {retention}% retention {retention < 60 && '⚠'}
                    </span>
                  </div>

                  {/* Topic Title */}
                  <div
                    onClick={() => {
                      setSelectedTopicDetail(item);
                      setIsTopicDetailOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.35', marginBottom: '2px' }}>
                      {item.topic}
                    </h3>
                  </div>

                  {/* Priority Reason Banner if present */}
                  {item.priorityReason && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--bg-warm-cream-alt)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)'
                    }}>
                      <AlertCircle size={13} color="var(--accent-terracotta)" />
                      <span>{item.priorityReason}</span>
                    </div>
                  )}

                  {/* Action Buttons: [Details] and [Start Revision] */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border-beige-light)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopicDetail(item);
                        setIsTopicDetailOpen(true);
                      }}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      View History & Details →
                    </button>

                    <button
                      type="button"
                      onClick={() => startAdaptiveRevision(item)}
                      className="btn-primary"
                      style={{ padding: '7px 16px', fontSize: '12px', borderRadius: 'var(--radius-pill)', gap: '5px' }}
                    >
                      <Brain size={13} />
                      <span>Start Revision</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-white" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-sage-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-sage)',
              margin: '0 auto 10px auto'
            }}>
              <CheckCircle2 size={22} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '2px' }}>
              You're all caught up on revisions!
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              New revisions will appear automatically as you complete roadmap topics.
            </p>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. UPCOMING & MASTERED REVISION TOPICS */}
      {/* =================================================================== */}
      {upcomingRevisions.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '12px' }}>
            Upcoming Topics ({upcomingRevisions.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingRevisions.map((item) => {
              const retention = item.retentionScore || 70;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedTopicDetail(item);
                    setIsTopicDetailOpen(true);
                  }}
                  className="card-white"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 160ms ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span className={`pill-badge ${item.category === 'DSA' ? 'pill-terracotta' : 'pill-navy'}`} style={{ padding: '1px 6px', fontSize: '9px' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Level {item.intervalLevel || 1} • Next: {item.revisionDueDate}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', lineHeight: '1.3' }}>
                      {item.topic}
                    </h4>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: retention >= 80 ? 'var(--accent-sage)' : 'var(--text-charcoal)' }}>
                      {retention}%
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                      retention
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safe bottom spacer */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
