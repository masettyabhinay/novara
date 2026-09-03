import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft,
  X, 
  Brain, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Award,
  AlertTriangle,
  Code2,
  Check
} from 'lucide-react';

export const ActiveRevisionModal = () => {
  const { 
    activeRevisionSession, 
    setActiveRevisionSession, 
    isRevisionModeOpen, 
    setIsRevisionModeOpen,
    submitAdaptiveRevision,
    showToast 
  } = useApp();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [answersList, setAnswersList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revisionResult, setRevisionResult] = useState(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer ticker
  useEffect(() => {
    if (!isRevisionModeOpen || revisionResult) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRevisionModeOpen, revisionResult]);

  // Reset state on open
  useEffect(() => {
    if (isRevisionModeOpen && activeRevisionSession) {
      setCurrentIdx(0);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setAnswersList([]);
      setRevisionResult(null);
      setShowQuitConfirm(false);
      setElapsedSeconds(0);
    }
  }, [isRevisionModeOpen, activeRevisionSession?.revisionId]);

  if (!isRevisionModeOpen || !activeRevisionSession) return null;

  const questions = activeRevisionSession.questions || [];
  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const progressPercent = Math.round(((currentIdx + (isAnswerRevealed ? 1 : 0)) / Math.max(1, totalQuestions)) * 100);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectOption = (opt) => {
    if (isAnswerRevealed) return;
    setSelectedOption(opt);
  };

  const checkIsCorrect = (opt, q) => {
    if (!q || !opt) return false;
    if (typeof q.correctAnswer === 'number' && Array.isArray(q.options)) {
      return q.options[q.correctAnswer] === opt;
    }
    return q.correctAnswer === opt || q.correctAnswerText === opt;
  };

  const handleRevealAnswer = () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = checkIsCorrect(selectedOption, currentQuestion);
    const answerRecord = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedOption,
      correctAnswer: currentQuestion.correctAnswerText || currentQuestion.correctAnswer,
      isCorrect
    };

    setAnswersList((prev) => [...prev, answerRecord]);
    setIsAnswerRevealed(true);
  };

  const handleNextOrFinish = async () => {
    if (currentIdx + 1 < totalQuestions) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      // Final question submitted - send to server
      setIsSubmitting(true);
      try {
        const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
        const result = await submitAdaptiveRevision(answersList, durationMins);
        setRevisionResult(result);
      } catch (err) {
        showToast('Submission Failed', 'Could not record revision attempt.', 'terracotta');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setIsRevisionModeOpen(false);
    setActiveRevisionSession(null);
    setRevisionResult(null);
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        zIndex: 1050,
        backgroundColor: 'rgba(28, 33, 31, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '12px'
      }}
    >
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 22px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-beige)',
          boxShadow: '0 24px 60px rgba(35, 25, 15, 0.28)',
          overflow: 'hidden'
        }}
      >
        {/* =================================================================== */}
        {/* RESULT VIEW AFTER COMPLETION */}
        {/* =================================================================== */}
        {revisionResult ? (
          <div style={{ animation: 'fadeIn 250ms ease', textAlign: 'center', padding: '12px 6px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: revisionResult.scorePercent >= 80 ? 'var(--accent-sage-light)' : 'var(--accent-terracotta-light)',
              color: revisionResult.scorePercent >= 80 ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <Award size={32} />
            </div>

            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-terracotta)', marginBottom: '4px' }}>
              Adaptive Revision Complete
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
              {activeRevisionSession.topic}
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Spaced repetition interval adapted based on your recall accuracy.
            </p>

            {/* Main Score & Retention Pill */}
            <div style={{
              backgroundColor: 'var(--bg-warm-cream)',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Recall Score
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
                    {revisionResult.correctCount} / {revisionResult.totalQuestions}
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-terracotta)', marginLeft: '6px' }}>
                      ({revisionResult.scorePercent}%)
                    </span>
                  </div>
                </div>

                <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-beige)' }} />

                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Retention Estimate
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                      {revisionResult.retentionBefore}%
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-muted)' }}>→</span>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: revisionResult.retentionAfter >= 80 ? 'var(--accent-sage)' : 'var(--accent-terracotta)' }}>
                      {revisionResult.retentionAfter}%
                    </span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    NOVARA retention estimate
                  </div>
                </div>
              </div>
            </div>

            {/* Next Scheduled Interval Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="var(--accent-terracotta)" />
                <div>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Next Revision Scheduled
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                    In {revisionResult.nextIntervalDays} day{revisionResult.nextIntervalDays > 1 ? 's' : ''} ({revisionResult.nextRevisionDate})
                  </div>
                </div>
              </div>

              <span className="pill-badge pill-sage" style={{ fontSize: '11px', fontWeight: 700 }}>
                Level {revisionResult.revision?.intervalLevel || 2}
              </span>
            </div>

            {/* Qualitative Feedback */}
            <div style={{
              textAlign: 'left',
              backgroundColor: 'var(--bg-warm-cream-alt)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '12px',
              lineHeight: '1.5'
            }}>
              <div style={{ color: 'var(--accent-sage)', fontWeight: 700, marginBottom: '4px' }}>
                {revisionResult.strongFeedback}
              </div>
              <div style={{ color: 'var(--accent-terracotta)', fontWeight: 600 }}>
                {revisionResult.improveFeedback}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)'
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ================================================================= */
          /* ACTIVE REVISION QUIZ QUESTION VIEW */
          /* ================================================================= */
          <>
            {/* Top Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-beige-light)'
            }}>
              <button
                type="button"
                onClick={() => setShowQuitConfirm(true)}
                className="btn-secondary"
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  gap: '6px',
                  borderRadius: 'var(--radius-pill)',
                  minHeight: '32px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Exit</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={16} color="var(--accent-terracotta)" />
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-charcoal)' }}>
                  Revision Mode
                </span>
              </div>

              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)'
              }}>
                ⏱️ {formatTimer(elapsedSeconds)}
              </div>
            </div>

            {/* Progress Bar & Subtitle */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span style={{ color: 'var(--accent-terracotta)' }}>{activeRevisionSession.topic}</span>
                <span>Question {currentIdx + 1} of {totalQuestions}</span>
              </div>

              <div style={{
                width: '100%',
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--accent-terracotta)',
                  transition: 'width 300ms ease'
                }} />
              </div>
            </div>

            {/* Scrollable Question Body */}
            {currentQuestion && (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {/* Question Type Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span className="pill-badge pill-terracotta" style={{ fontSize: '9.5px', textTransform: 'uppercase' }}>
                    {currentQuestion.type?.replace('_', ' ')}
                  </span>
                  {currentQuestion.testedSubconcept && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      • {currentQuestion.testedSubconcept}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--text-charcoal)',
                  lineHeight: '1.4',
                  marginBottom: currentQuestion.codeSnippet ? '10px' : '16px'
                }}>
                  {currentQuestion.question}
                </h3>

                {/* Code Snippet Block if present */}
                {currentQuestion.codeSnippet && (
                  <div style={{
                    backgroundColor: '#1C211F',
                    color: '#FAF7F2',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    lineHeight: '1.45',
                    marginBottom: '16px',
                    overflowX: 'auto'
                  }}>
                    <pre style={{ margin: 0 }}>{currentQuestion.codeSnippet}</pre>
                  </div>
                )}

                {/* Answer Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {currentQuestion.options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrectAnswer = checkIsCorrect(opt, currentQuestion);
                    
                    let bg = '#FFFFFF';
                    let border = 'var(--border-beige)';
                    let color = 'var(--text-charcoal)';

                    if (isAnswerRevealed) {
                      if (isCorrectAnswer) {
                        bg = 'var(--accent-sage-light)';
                        border = 'var(--accent-sage)';
                        color = 'var(--accent-sage)';
                      } else if (isSelected && !isCorrectAnswer) {
                        bg = 'var(--accent-terracotta-light)';
                        border = 'var(--accent-terracotta)';
                        color = 'var(--accent-terracotta)';
                      }
                    } else if (isSelected) {
                      bg = 'var(--accent-terracotta-light)';
                      border = 'var(--accent-terracotta)';
                      color = 'var(--accent-terracotta)';
                    }

                    return (
                      <div
                        key={i}
                        onClick={() => handleSelectOption(opt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: bg,
                          border: `1.5px solid ${border}`,
                          cursor: isAnswerRevealed ? 'default' : 'pointer',
                          transition: 'all 160ms ease',
                          fontSize: '13px',
                          fontWeight: isSelected || (isAnswerRevealed && isCorrectAnswer) ? 700 : 500,
                          color: color
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: `1.5px solid ${border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {isAnswerRevealed && isCorrectAnswer ? (
                            <Check size={13} strokeWidth={3} />
                          ) : isAnswerRevealed && isSelected && !isCorrectAnswer ? (
                            <X size={13} strokeWidth={3} />
                          ) : (
                            String.fromCharCode(65 + i)
                          )}
                        </div>
                        <div style={{ flex: 1 }}>{opt}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card upon Reveal */}
                {isAnswerRevealed && (
                  <div style={{
                    backgroundColor: selectedOption === currentQuestion.correctAnswer ? 'var(--accent-sage-light)' : 'var(--bg-warm-cream)',
                    border: `1px solid ${selectedOption === currentQuestion.correctAnswer ? 'rgba(94, 140, 113, 0.3)' : 'var(--border-beige)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    animation: 'fadeIn 200ms ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: selectedOption === currentQuestion.correctAnswer ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
                      marginBottom: '4px'
                    }}>
                      {selectedOption === currentQuestion.correctAnswer ? (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Correct! Excellent recall.</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={15} />
                          <span>Not quite. Review concept below:</span>
                        </>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-charcoal)', lineHeight: '1.45', margin: 0 }}>
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Controls */}
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-beige-light)' }}>
              {!isAnswerRevealed ? (
                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleRevealAnswer}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-pill)',
                    opacity: selectedOption ? 1 : 0.5,
                    cursor: selectedOption ? 'pointer' : 'not-allowed'
                  }}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleNextOrFinish}
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
                  <span>{currentIdx + 1 < totalQuestions ? 'Next Question' : 'Complete Revision'}</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </>
        )}

        {/* Quit Confirmation Dialog */}
        {showQuitConfirm && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
              textAlign: 'center',
              animation: 'fadeIn 180ms ease',
              zIndex: 1100
            }}
          >
            <AlertTriangle size={32} color="var(--accent-terracotta)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
              Leave Revision Mode?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', maxWidth: '300px' }}>
              Your progress in this revision session will not be saved until all questions are answered.
            </p>
            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '280px' }}>
              <button
                type="button"
                onClick={() => setShowQuitConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--text-charcoal)' }}
              >
                Leave
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
