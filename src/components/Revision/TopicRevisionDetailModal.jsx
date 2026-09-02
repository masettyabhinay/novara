import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Brain, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  RotateCcw,
  Sparkles,
  AlertCircle,
  History,
  CalendarDays
} from 'lucide-react';

export const TopicRevisionDetailModal = () => {
  const { 
    selectedTopicDetail, 
    setSelectedTopicDetail, 
    isTopicDetailOpen, 
    setIsTopicDetailOpen,
    startAdaptiveRevision,
    handleRescheduleRevision 
  } = useApp();

  const [rescheduleOption, setRescheduleOption] = useState(null);

  if (!isTopicDetailOpen || !selectedTopicDetail) return null;

  const handleStartReview = () => {
    setIsTopicDetailOpen(false);
    startAdaptiveRevision(selectedTopicDetail);
  };

  const onReschedule = (days) => {
    handleRescheduleRevision(selectedTopicDetail.id, days);
    setRescheduleOption(null);
  };

  const retention = selectedTopicDetail.retentionScore || 70;
  const history = selectedTopicDetail.history || [];

  return (
    <div className="modal-overlay" onClick={() => setIsTopicDetailOpen(false)}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 22px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-beige)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-beige-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`pill-badge ${selectedTopicDetail.category === 'DSA' ? 'pill-terracotta' : 'pill-navy'}`}>
              {selectedTopicDetail.category}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {selectedTopicDetail.difficulty || 'Medium'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTopicDetailOpen(false)}
            style={{
              width: '30px',
              height: '30px',
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
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {/* Topic Title */}
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.3', marginBottom: '8px' }}>
            {selectedTopicDetail.topic}
          </h2>

          {/* Retention Estimate Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-warm-cream)',
            border: '1px solid var(--border-beige)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                Retention Estimate
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: retention >= 80 ? 'var(--accent-sage)' : retention < 60 ? 'var(--accent-terracotta)' : 'var(--text-charcoal)' }}>
                  {retention}%
                </span>
                {retention < 60 && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-terracotta)' }}>
                    ⚠ Needs practice
                  </span>
                )}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                NOVARA retention estimate
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                Spaced Interval
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', marginTop: '2px' }}>
                Level {selectedTopicDetail.intervalLevel || 1} ({selectedTopicDetail.intervalDays || 1}d cycle)
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-terracotta)', marginTop: '2px' }}>
                {selectedTopicDetail.revisionDueDate}
              </div>
            </div>
          </div>

          {/* Priority Reason if flagged */}
          {selectedTopicDetail.priorityReason && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--accent-terracotta-light)',
              border: '1px solid rgba(200, 90, 50, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-terracotta)',
              marginBottom: '16px'
            }}>
              <AlertCircle size={15} flexShrink={0} />
              <span>{selectedTopicDetail.priorityReason}</span>
            </div>
          )}

          {/* Past Revision Attempt History */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <History size={15} color="var(--text-muted)" />
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                Past Revision History
              </h4>
            </div>

            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((att, i) => (
                  <div
                    key={att.attemptId || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border-beige)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        {att.date}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Score: <strong>{att.score}/{att.totalQuestions} ({att.scorePercent}%)</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`pill-badge ${att.performanceGrade === 'strong' ? 'pill-sage' : 'pill-terracotta'}`} style={{ fontSize: '10px' }}>
                        {att.performanceGrade === 'strong' ? 'Strong Recall' : 'Review Done'}
                      </span>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {att.retentionBefore}% → {att.retentionAfter}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '16px',
                backgroundColor: 'var(--bg-warm-cream)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                No completed recall attempts yet. Start your first revision session below!
              </div>
            )}
          </div>

          {/* Reschedule Drawer Section */}
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setRescheduleOption(rescheduleOption ? null : true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <CalendarDays size={14} />
              <span>{rescheduleOption ? 'Cancel reschedule' : 'Need to reschedule this topic?'}</span>
            </button>

            {rescheduleOption && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginTop: '10px',
                animation: 'fadeIn 180ms ease'
              }}>
                <button
                  type="button"
                  onClick={() => onReschedule(1)}
                  className="btn-secondary"
                  style={{ padding: '8px', fontSize: '11px', borderRadius: 'var(--radius-md)' }}
                >
                  Tomorrow (+1d)
                </button>
                <button
                  type="button"
                  onClick={() => onReschedule(3)}
                  className="btn-secondary"
                  style={{ padding: '8px', fontSize: '11px', borderRadius: 'var(--radius-md)' }}
                >
                  In 3 days (+3d)
                </button>
                <button
                  type="button"
                  onClick={() => onReschedule(7)}
                  className="btn-secondary"
                  style={{ padding: '8px', fontSize: '11px', borderRadius: 'var(--radius-md)' }}
                >
                  Next week (+7d)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-beige-light)' }}>
          <button
            type="button"
            onClick={handleStartReview}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              gap: '6px'
            }}
          >
            <Brain size={15} />
            <span>Start Revision Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
