import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  X, 
  Sparkles, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Building2,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export const InterviewResultModal = ({ report, isOpen, onClose, onRestart }) => {
  const { setActiveTab, applications, setSelectedApplication, setIsAppDetailsModalOpen } = useApp();
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const metrics = report.metrics || {
    technical: 80,
    communication: 75,
    correctness: 80,
    completeness: 75
  };

  const handleViewApplication = () => {
    if (report.applicationId && applications) {
      const app = applications.find(a => a.id === report.applicationId);
      if (app) {
        setSelectedApplication(app);
        setIsAppDetailsModalOpen(true);
      }
    }
    onClose();
    setActiveTab('applications');
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-result-title"
    >
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 22px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)',
              flexShrink: 0
            }}>
              <Award size={20} />
            </div>
            <div>
              <h2 id="interview-result-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0, lineHeight: 1.2 }}>
                Interview Complete 🎯
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {report.type} Mock Interview • {report.difficulty || 'Medium'} • {report.targetRole || 'Software Engineer'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close review dialog"
            style={{
              width: '36px',
              height: '36px',
              minWidth: '44px',
              minHeight: '44px',
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
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
          {/* Targeted Application Link if applicable */}
          {(report.company || report.applicationId) && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-navy-light)',
                border: '1px solid var(--accent-navy-border, rgba(43,76,89,0.15))',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color="var(--accent-navy)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-navy)' }}>
                  Targeted Mock for {report.company || 'Application'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleViewApplication}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-navy)',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  minHeight: '44px'
                }}
              >
                <span>View Application</span>
                <ExternalLink size={13} />
              </button>
            </div>
          )}

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
              Overall Score
            </div>
            <div style={{ fontSize: '42px', fontWeight: 900, color: report.overallScore >= 70 ? 'var(--accent-sage)' : 'var(--accent-terracotta)', letterSpacing: '-0.03em', lineHeight: '1.1', marginTop: '2px' }}>
              {report.overallScore}/100
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Evaluated across {report.questionsCount || report.questions?.length} structured questions in {Math.round((report.durationSeconds || 0) / 60)} min
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
                {report.strongestTopic || 'General Understanding'}
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
                {report.weakestTopic || 'Specific Depth'}
              </div>
            </div>
          </div>

          {/* Question Breakdown Accordion */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              Question Breakdown & Detailed Evaluation ({report.questions?.length || 0})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(report.questions || []).map((q, idx) => {
                const isExpanded = expandedIndex === idx;
                const scoreColor = (q.score || 0) >= 70 ? 'var(--accent-sage)' : (q.score || 0) >= 40 ? 'var(--accent-amber)' : 'var(--accent-terracotta)';
                
                return (
                  <div 
                    key={idx}
                    className="card-white"
                    style={{ padding: '12px 14px', cursor: 'pointer' }}
                    onClick={() => toggleExpand(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)' }}>
                            Q{idx + 1} • {q.topic || 'General'}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: scoreColor }}>
                            ({q.score !== undefined ? `${q.score}/100` : 'Not Scored'})
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '12.5px', 
                          fontWeight: 700, 
                          color: 'var(--text-charcoal)',
                          lineHeight: 1.35,
                          whiteSpace: isExpanded ? 'normal' : 'nowrap',
                          overflow: isExpanded ? 'visible' : 'hidden',
                          textOverflow: isExpanded ? 'clip' : 'ellipsis'
                        }}>
                          {q.question}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', flexShrink: 0 }}>
                        {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-beige-light)', fontSize: '12px' }}>
                        {/* User Answer */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
                            Your Answer:
                          </div>
                          <div style={{ 
                            backgroundColor: 'var(--bg-warm-cream)', 
                            padding: '10px 12px', 
                            borderRadius: 'var(--radius-sm)', 
                            color: 'var(--text-charcoal)', 
                            fontStyle: q.userAnswer ? 'normal' : 'italic',
                            lineHeight: 1.45,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {q.userAnswer || 'Question was skipped.'}
                          </div>
                        </div>

                        {/* Evaluation explanation if present */}
                        {q.evaluation?.explanation && (
                          <div style={{ marginBottom: '8px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {q.evaluation.explanation}
                          </div>
                        )}

                        {/* Strengths */}
                        {q.evaluation?.strengths?.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-sage)', textTransform: 'uppercase', marginBottom: '3px' }}>
                              Strengths:
                            </div>
                            {q.evaluation.strengths.map((s, i) => (
                              <div key={i} style={{ display: 'flex', gap: '6px', color: 'var(--accent-sage)', marginBottom: '3px', lineHeight: 1.35 }}>
                                <CheckCircle2 size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Improvements / Guidance */}
                        {(q.evaluation?.improvements?.length > 0 || q.evaluation?.improvementGuidance) && (
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-terracotta)', textTransform: 'uppercase', marginBottom: '3px' }}>
                              Areas for Improvement:
                            </div>
                            {q.evaluation?.improvements?.map((imp, i) => (
                              <div key={i} style={{ display: 'flex', gap: '6px', color: 'var(--accent-terracotta)', marginBottom: '3px', lineHeight: 1.35 }}>
                                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{imp}</span>
                              </div>
                            ))}
                            {q.evaluation?.improvementGuidance && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                                {q.evaluation.improvementGuidance}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Missing Concepts if available */}
                        {q.evaluation?.missingConcepts?.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: '3px' }}>
                              Missing Key Concepts:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {q.evaluation.missingConcepts.map((mc, i) => (
                                <span 
                                  key={i} 
                                  style={{
                                    fontSize: '10.5px',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-pill)',
                                    backgroundColor: 'var(--accent-amber-light)',
                                    color: 'var(--accent-amber)',
                                    fontWeight: 700
                                  }}
                                >
                                  {mc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ideal Answer / Reference Outline if available */}
                        {q.evaluation?.idealAnswerOutline && (
                          <div style={{ 
                            marginTop: '10px', 
                            padding: '10px 12px', 
                            borderRadius: 'var(--radius-sm)', 
                            backgroundColor: 'var(--accent-sage-light)',
                            border: '1px solid rgba(74, 124, 89, 0.2)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--accent-sage)' }}>
                              <Lightbulb size={14} />
                              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                                Ideal Answer Reference Outline
                              </span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-charcoal)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                              {q.evaluation.idealAnswerOutline}
                            </div>
                          </div>
                        )}
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
            style={{ flex: 1, padding: '12px 10px', fontSize: '13px', minHeight: '44px' }}
          >
            <RotateCcw size={14} />
            <span>Start Another Interview</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              setActiveTab('coach');
            }}
            className="btn-primary"
            style={{ flex: 1, padding: '12px 10px', fontSize: '13px', minHeight: '44px' }}
          >
            <Sparkles size={14} />
            <span>View Coach Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
};
