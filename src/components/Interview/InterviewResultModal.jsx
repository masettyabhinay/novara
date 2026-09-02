import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  Award, 
  X, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Brain,
  Layers,
  Check
} from 'lucide-react';

export const InterviewResultModal = ({ report, isOpen, onClose, onRestart }) => {
  const { setActiveTab } = useApp();
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!isOpen || !report) return null;

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const metrics = report.metrics || {
    technical: 82,
    communication: 74,
    correctness: 80,
    completeness: 76
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 22px'
        }}
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
              <Award size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                Interview Complete 🎯
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {report.type} Mock Interview • {report.targetRole}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
          {/* Overall Score Banner */}
          <div 
            className="card-white"
            style={{
              padding: '18px 20px',
              marginBottom: '14px',
              backgroundColor: 'var(--bg-warm-cream-alt)',
              borderColor: 'var(--border-beige)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Overall Interview Score
            </div>
            <div style={{ fontSize: '42px', fontWeight: 900, color: 'var(--accent-terracotta)', letterSpacing: '-0.03em', lineHeight: '1.1', marginTop: '2px' }}>
              {report.overallScore}/100
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Evaluated across {report.questionsCount || report.questions?.length} structured questions
            </div>
          </div>

          {/* 4 Multi-Dimensional Competency Scores */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            marginBottom: '14px',
            textAlign: 'center'
          }}>
            <div className="card-white" style={{ padding: '10px 4px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)' }}>{metrics.technical}%</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Technical</div>
            </div>

            <div className="card-white" style={{ padding: '10px 4px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-sage)' }}>{metrics.communication}%</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Clarity</div>
            </div>

            <div className="card-white" style={{ padding: '10px 4px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-navy)' }}>{metrics.correctness}%</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Accuracy</div>
            </div>

            <div className="card-white" style={{ padding: '10px 4px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-amber)' }}>{metrics.completeness}%</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Coverage</div>
            </div>
          </div>

          {/* Strongest Area & Needs More Practice Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div 
              className="card-white"
              style={{
                padding: '12px 14px',
                borderLeft: '4px solid var(--accent-sage)',
                backgroundColor: '#FFFFFF'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-sage)', marginBottom: '2px' }}>
                Strongest Area
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {report.strongestTopic}
              </div>
            </div>

            <div 
              className="card-white"
              style={{
                padding: '12px 14px',
                borderLeft: '4px solid var(--accent-terracotta)',
                backgroundColor: '#FFFFFF'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-terracotta)', marginBottom: '2px' }}>
                Needs More Practice
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {report.weakestTopic}
              </div>
            </div>
          </div>

          {/* Question Breakdown Accordion */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              Question Breakdown & Answers ({report.questions?.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(report.questions || []).map((q, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="card-white"
                    style={{ padding: '12px 14px', cursor: 'pointer' }}
                    onClick={() => toggleExpand(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)' }}>
                            Q{idx + 1} • {q.topic}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: (q.score || 0) >= 70 ? 'var(--accent-sage)' : 'var(--accent-amber)' }}>
                            ({q.score}/100)
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {q.question}
                        </div>
                      </div>

                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-beige-light)', fontSize: '12px' }}>
                        {/* User Answer */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>
                            Your Answer:
                          </div>
                          <div style={{ backgroundColor: 'var(--bg-warm-cream)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', color: 'var(--text-charcoal)', fontStyle: q.userAnswer ? 'normal' : 'italic' }}>
                            {q.userAnswer || 'Question was skipped.'}
                          </div>
                        </div>

                        {/* Strengths & Improvements */}
                        {q.evaluation?.strengths?.map((s, i) => (
                          <div key={i} style={{ display: 'flex', gap: '6px', color: 'var(--accent-sage)', marginBottom: '3px' }}>
                            <span>✓</span>
                            <span>{s}</span>
                          </div>
                        ))}

                        {q.evaluation?.improvements?.map((imp, i) => (
                          <div key={i} style={{ display: 'flex', gap: '6px', color: 'var(--accent-terracotta)', marginBottom: '3px' }}>
                            <span>⚠</span>
                            <span>{imp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-beige-light)', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onRestart) onRestart();
            }}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px', fontSize: '12px' }}
          >
            <RotateCcw size={13} />
            <span>Practice Again</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              setActiveTab('coach');
            }}
            className="btn-primary"
            style={{ flex: 1, padding: '10px', fontSize: '12px' }}
          >
            <Sparkles size={13} />
            <span>View Coach Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
};
