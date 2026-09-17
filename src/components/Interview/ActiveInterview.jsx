import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  HelpCircle,
  XCircle,
  Code2,
  Check,
  BookOpen,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const ActiveInterview = ({ 
  session, 
  onAnswerEvaluated, 
  onCompleteSession, 
  onCancelInterview 
}) => {
  const { showToast, triggerConfetti } = useApp();

  const [currentQuestion, setCurrentQuestion] = useState(session.currentQuestion);
  const [questionIndex, setQuestionIndex] = useState(session.currentQuestionIndex || 0);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [nextQuestionData, setNextQuestionData] = useState(null);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);

  // Authoritative Wall-Clock Timer Calculation
  const timeLimitSeconds = session.timeLimitSeconds || (session.timeLimitMinutes || 15) * 60;
  const startTimeMs = useRef(new Date(session.startTime || Date.now()).getTime());

  const getRemainingSeconds = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTimeMs.current) / 1000);
    return Math.max(0, timeLimitSeconds - elapsed);
  }, [timeLimitSeconds]);

  const [secondsRemaining, setSecondsRemaining] = useState(() => getRemainingSeconds());

  // Authoritative 1000ms countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getRemainingSeconds();
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        showToast('Time Expired ⏰', 'Your interview time limit has concluded.', 'terracotta');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [getRemainingSeconds, showToast]);

  // Window beforeunload safety guard while active
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You have an active mock interview in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Keyboard Escape listener for End dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isEndConfirmOpen) {
        setIsEndConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEndConfirmOpen]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (isSkip = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const textToSubmit = isSkip ? '' : answerText.trim();
      const result = await onAnswerEvaluated(
        session.interviewId,
        questionIndex,
        textToSubmit
      );

      if (result && result.evaluation) {
        setEvaluationResult(result.evaluation);
        setIsLastQuestion(result.isLastQuestion);
        setNextQuestionData(result.nextQuestion);

        if (!isSkip && result.evaluation?.score >= 75) {
          triggerConfetti();
        }
      }
    } catch (err) {
      showToast('Evaluation Error', err.message || 'Could not submit answer. Please try again.', 'terracotta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onCompleteSession(session.interviewId);
      return;
    }

    if (nextQuestionData) {
      setCurrentQuestion(nextQuestionData);
      setQuestionIndex((prev) => prev + 1);
      setAnswerText('');
      setEvaluationResult(null);
      setNextQuestionData(null);
    }
  };

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const progressPercent = Math.round(((questionIndex + 1) / session.totalQuestions) * 100);

  return (
    <div className="interview-workspace-wrapper">
      {/* Top Session Bar with Authoritative Timer & Progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        padding: '12px 18px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-beige)',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-terracotta-light)',
            color: 'var(--accent-terracotta)'
          }}>
            {session.type}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--bg-warm-cream-alt)',
            color: 'var(--text-secondary)'
          }}>
            {session.difficulty}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
            Question {questionIndex + 1} of {session.totalQuestions}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            aria-label={`Time remaining: ${formatTimer(secondsRemaining)}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '13px',
              fontWeight: 800,
              color: secondsRemaining < 120 ? 'var(--accent-terracotta)' : 'var(--text-charcoal)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            <Clock size={15} color={secondsRemaining < 120 ? 'var(--accent-terracotta)' : 'var(--text-muted)'} />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsEndConfirmOpen(true)}
            aria-label="End interview session early"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              border: '1px solid var(--border-beige-light)',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-warm-cream)',
              cursor: 'pointer',
              padding: '4px 10px',
              minHeight: '32px'
            }}
          >
            End
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        role="progressbar"
        aria-valuenow={questionIndex + 1}
        aria-valuemin={1}
        aria-valuemax={session.totalQuestions}
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'var(--border-beige-light)',
          borderRadius: 'var(--radius-pill)',
          marginBottom: '16px',
          overflow: 'hidden'
        }}
      >
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          backgroundColor: 'var(--accent-terracotta)',
          transition: 'width 250ms ease'
        }} />
      </div>

      {/* Main Question & Answer Card */}
      <div 
        className="card-white"
        style={{
          padding: '24px',
          marginBottom: '18px',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid var(--border-beige)'
        }}
      >
        {/* Domain & Topic Chip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {currentQuestion.topic || currentQuestion.category}
          </span>
          <span style={{
            fontSize: '10.5px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--bg-warm-cream-alt)',
            color: 'var(--text-secondary)'
          }}>
            {currentQuestion.difficulty || session.difficulty}
          </span>
        </div>

        {/* Question Title */}
        <h2 
          id="interview-question-heading"
          style={{
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--text-charcoal)',
            lineHeight: '1.45',
            marginBottom: '18px',
            letterSpacing: '-0.01em'
          }}
        >
          {currentQuestion.question}
        </h2>

        {/* State A: Input Mode (Before Evaluation) */}
        {!evaluationResult ? (
          <div>
            <label htmlFor="interview-answer-textarea" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '6px' }}>
              Your Answer / Technical Explanation:
            </label>

            <textarea
              id="interview-answer-textarea"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Explain your approach, core principles, edge cases, and algorithmic complexity..."
              disabled={isSubmitting}
              className="interview-question-textarea"
              rows={6}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', marginBottom: '14px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <span>{wordCount} words entered</span>
              <span>Explain clearly with key terminology</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  fontWeight: 600,
                  minHeight: '44px'
                }}
              >
                Skip Question
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || answerText.trim().length === 0}
                className="btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '13.5px',
                  opacity: (isSubmitting || answerText.trim().length === 0) ? 0.6 : 1,
                  minHeight: '44px',
                  gap: '6px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Evaluating Answer...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* State B: Instant Evaluation Feedback Mode */
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            {/* Score & Verdict Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: evaluationResult.score >= 70 ? 'var(--accent-sage-light)' : 'var(--accent-amber-light)',
              marginBottom: '16px',
              border: '1px solid var(--border-beige-light)',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Question Score
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: evaluationResult.score >= 70 ? 'var(--accent-sage)' : 'var(--accent-amber)' }}>
                  {evaluationResult.score}/100
                </div>
              </div>

              <div style={{
                fontSize: '13px',
                fontWeight: 800,
                color: evaluationResult.score >= 70 ? 'var(--accent-sage)' : 'var(--accent-amber)'
              }}>
                {evaluationResult.score >= 80 ? 'Excellent Technical Explanation ✨' : evaluationResult.score >= 60 ? 'Good Answer 👍' : 'Needs Technical Elaboration 💡'}
              </div>
            </div>

            {/* Preserved User's Answer */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Your Answer:
              </div>
              <div style={{
                padding: '10px 14px',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                color: 'var(--text-charcoal)',
                fontStyle: evaluationResult.isSkipped ? 'italic' : 'normal',
                lineHeight: 1.5
              }}>
                {evaluationResult.isSkipped ? 'Question was skipped.' : answerText}
              </div>
            </div>

            {/* Strengths */}
            {evaluationResult.strengths?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-sage)', marginBottom: '4px' }}>
                  Strong Points
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {evaluationResult.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px', color: 'var(--text-charcoal)' }}>
                      <span style={{ color: 'var(--accent-sage)', fontWeight: 800 }}>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {evaluationResult.improvements?.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-terracotta)', marginBottom: '4px' }}>
                  Actionable Improvements
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {evaluationResult.improvements.map((imp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px', color: 'var(--text-charcoal)' }}>
                      <span style={{ color: 'var(--accent-terracotta)', fontWeight: 800 }}>⚠</span>
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ideal Answer Reference Outline (If Available) */}
            {evaluationResult.idealAnswerOutline && (
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <BookOpen size={13} color="var(--accent-terracotta)" />
                  <span>Reference Answer Outline</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-charcoal)', lineHeight: 1.5, margin: 0 }}>
                  {evaluationResult.idealAnswerOutline}
                </p>
              </div>
            )}

            {/* Next Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={handleNextQuestion}
                className="btn-primary"
                style={{ padding: '11px 26px', fontSize: '13.5px', minHeight: '44px', gap: '6px' }}
              >
                <span>{isLastQuestion ? 'Complete Interview 🎯' : 'Next Question'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal to End Interview Early */}
      {isEndConfirmOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsEndConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-interview-dialog-title"
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

            <h3 id="end-interview-dialog-title" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              End mock interview early?
            </h3>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '18px' }}>
              Are you sure you want to end this interview? Completed questions will be preserved in your session report, but remaining questions will conclude.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsEndConfirmOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, minHeight: '44px', fontSize: '13px' }}
              >
                Continue Practice
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEndConfirmOpen(false);
                  onCancelInterview();
                }}
                className="btn-primary"
                style={{ flex: 1, minHeight: '44px', fontSize: '13px', backgroundColor: 'var(--accent-terracotta)' }}
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
