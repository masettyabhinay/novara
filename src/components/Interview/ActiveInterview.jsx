import React, { useState, useEffect } from 'react';
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
  Check
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

  // Countdown timer in seconds
  const [secondsRemaining, setSecondsRemaining] = useState(
    (session.timeLimitMinutes || 15) * 60
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          showToast('Time Expired ⏰', 'Wrapping up your mock interview.', 'terracotta');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showToast]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (isSkip = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const textToSubmit = isSkip ? '' : answerText;
      const result = await onAnswerEvaluated(
        session.interviewId,
        questionIndex,
        textToSubmit
      );

      setEvaluationResult(result.evaluation);
      setIsLastQuestion(result.isLastQuestion);
      setNextQuestionData(result.nextQuestion);

      if (!isSkip && result.evaluation?.score >= 70) {
        triggerConfetti();
      }
    } catch (err) {
      showToast('Evaluation Error', err.message || 'Could not submit answer.', 'terracotta');
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

  return (
    <div style={{ animation: 'fadeIn 200ms ease', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      {/* Top Session Progress Bar & Live Timer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        padding: '10px 16px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-beige)',
        boxShadow: 'var(--shadow-sm)'
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
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
            Question {questionIndex + 1} of {session.totalQuestions}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12.5px',
            fontWeight: 800,
            color: secondsRemaining < 120 ? 'var(--accent-terracotta)' : 'var(--text-charcoal)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            <Clock size={14} color={secondsRemaining < 120 ? 'var(--accent-terracotta)' : 'var(--text-muted)'} />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={onCancelInterview}
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '2px 6px'
            }}
          >
            End
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div 
        className="card-white"
        style={{
          padding: '22px 24px',
          marginBottom: '16px',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid var(--border-beige)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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
            {currentQuestion.difficulty}
          </span>
        </div>

        <h2 style={{
          fontSize: '16.5px',
          fontWeight: 800,
          color: 'var(--text-charcoal)',
          lineHeight: '1.4',
          marginBottom: '18px',
          letterSpacing: '-0.01em'
        }}>
          {currentQuestion.question}
        </h2>

        {/* Answer Input or Evaluated Feedback State */}
        {!evaluationResult ? (
          <div>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your explanation here. Mention key concepts, trade-offs, and examples..."
              rows={6}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-beige)',
                fontSize: '13px',
                lineHeight: '1.5',
                outline: 'none',
                backgroundColor: 'var(--bg-warm-cream)',
                color: 'var(--text-charcoal)',
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: '14px',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  fontWeight: 600
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
                  padding: '10px 22px',
                  fontSize: '13px',
                  opacity: answerText.trim().length === 0 ? 0.6 : 1
                }}
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Evaluating...' : 'Submit Answer'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ===============================================================
             QUESTION-BY-QUESTION INSTANT EVALUATION FEEDBACK
             =============================================================== */
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            {/* Score & Verdict Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: evaluationResult.score >= 70 ? 'var(--accent-sage-light)' : 'var(--accent-amber-light)',
              marginBottom: '14px',
              border: '1px solid var(--border-beige-light)'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Question Score
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: evaluationResult.score >= 70 ? 'var(--accent-sage)' : 'var(--accent-amber)' }}>
                  {evaluationResult.score}/100
                </div>
              </div>

              <div style={{
                fontSize: '12px',
                fontWeight: 800,
                color: evaluationResult.score >= 70 ? 'var(--accent-sage)' : 'var(--accent-amber)'
              }}>
                {evaluationResult.score >= 80 ? 'Excellent explanation ✨' : evaluationResult.score >= 60 ? 'Good answer 👍' : 'Needs more depth 💡'}
              </div>
            </div>

            {/* Strengths */}
            {evaluationResult.strengths?.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-sage)', marginBottom: '4px' }}>
                  Strong Points
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {evaluationResult.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: 'var(--text-charcoal)' }}>
                      <span style={{ color: 'var(--accent-sage)', fontWeight: 800 }}>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {evaluationResult.improvements?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-terracotta)', marginBottom: '4px' }}>
                  To Improve
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {evaluationResult.improvements.map((imp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: 'var(--text-charcoal)' }}>
                      <span style={{ color: 'var(--accent-terracotta)', fontWeight: 800 }}>⚠</span>
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleNextQuestion}
                className="btn-primary"
                style={{ padding: '10px 22px', fontSize: '13px' }}
              >
                <span>{isLastQuestion ? 'Complete Interview 🎯' : 'Next Question'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
