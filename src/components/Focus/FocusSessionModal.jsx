import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft,
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  ExternalLink, 
  FileText,
  Clock,
  Sparkles,
  Plus,
  AlertCircle,
  Check,
  Award,
  ListTodo
} from 'lucide-react';

export const FocusSessionModal = () => {
  const { 
    activeFocusTask, 
    activeFocusSession,
    isFocusModalOpen, 
    setIsFocusModalOpen,
    pauseFocusSession,
    resumeFocusSession,
    completeFocusSession,
    startTaskRevisionQuiz,
    abandonFocusSession,
    toggleSubtask,
    showToast 
  } = useApp();

  const [sessionNotes, setSessionNotes] = useState('');
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  // Update timer tick every 500ms using real wall-clock timestamps
  useEffect(() => {
    if (!isFocusModalOpen || !activeFocusSession) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [isFocusModalOpen, activeFocusSession]);

  // Compute accurate real-time countdown & study metrics from session timestamps
  const timerMetrics = useMemo(() => {
    if (!activeFocusSession || !activeFocusSession.startedAt) {
      return {
        remainingSeconds: 45 * 60,
        elapsedSeconds: 0,
        totalPlannedSeconds: 45 * 60,
        actualMinutes: 0,
        isExpired: false,
        isPaused: false
      };
    }

    const totalPlannedSeconds = (activeFocusSession.plannedMinutes || 45) * 60;
    const startMs = new Date(activeFocusSession.startedAt).getTime();
    const currentMs = nowMs;

    let totalPausedMs = 0;
    if (Array.isArray(activeFocusSession.pauseHistory)) {
      for (const p of activeFocusSession.pauseHistory) {
        if (p.durationMs) {
          totalPausedMs += p.durationMs;
        } else if (p.pausedAt && p.resumedAt) {
          totalPausedMs += Math.max(0, new Date(p.resumedAt).getTime() - new Date(p.pausedAt).getTime());
        }
      }
    }

    const isPaused = activeFocusSession.status === 'paused';
    if (isPaused && activeFocusSession.pausedAt) {
      totalPausedMs += Math.max(0, currentMs - new Date(activeFocusSession.pausedAt).getTime());
    }

    const rawElapsedMs = Math.max(0, currentMs - startMs);
    const netElapsedMs = Math.max(0, rawElapsedMs - totalPausedMs);
    const elapsedSeconds = Math.floor(netElapsedMs / 1000);
    const remainingSeconds = Math.max(0, totalPlannedSeconds - elapsedSeconds);
    const actualMinutes = Math.max(1, Math.round(netElapsedMs / 60000));

    return {
      remainingSeconds,
      elapsedSeconds,
      totalPlannedSeconds,
      actualMinutes,
      isExpired: remainingSeconds === 0,
      isPaused
    };
  }, [activeFocusSession, nowMs]);

  if (!isFocusModalOpen || !activeFocusTask) return null;

  const minutes = Math.floor(timerMetrics.remainingSeconds / 60);
  const seconds = timerMetrics.remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(
    100,
    Math.round((timerMetrics.elapsedSeconds / Math.max(1, timerMetrics.totalPlannedSeconds)) * 100)
  );

  const handleBackClick = () => {
    if (timerMetrics.elapsedSeconds > 10) {
      setShowLeaveConfirm(true);
    } else {
      setIsFocusModalOpen(false);
    }
  };

  const handleConfirmAbandon = () => {
    setShowLeaveConfirm(false);
    if (activeFocusSession?.sessionId) {
      abandonFocusSession(activeFocusSession.sessionId, sessionNotes);
    } else {
      setIsFocusModalOpen(false);
    }
  };

  const handleConfirmComplete = () => {
    setShowCompleteConfirm(false);
    if (activeFocusTask) {
      startTaskRevisionQuiz(activeFocusTask, activeFocusSession);
    } else if (activeFocusSession?.sessionId) {
      completeFocusSession(activeFocusSession.sessionId, sessionNotes);
    } else {
      setIsFocusModalOpen(false);
    }
  };

  const handleAddTenMinutes = () => {
    if (activeFocusSession) {
      activeFocusSession.plannedMinutes = (activeFocusSession.plannedMinutes || 45) + 10;
      setNowMs(Date.now());
      showToast('10 Minutes Added ⏱️', 'Keep pushing! Session extended.', 'sage');
    }
  };

  const togglePauseResume = () => {
    if (!activeFocusSession) return;
    if (timerMetrics.isPaused) {
      resumeFocusSession(activeFocusSession.sessionId);
    } else {
      pauseFocusSession(activeFocusSession.sessionId);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        zIndex: 1000,
        backgroundColor: 'rgba(28, 33, 31, 0.75)',
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
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 22px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-beige)',
          boxShadow: '0 20px 50px rgba(35, 25, 15, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* TOP HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-beige-light)'
        }}>
          <button
            type="button"
            onClick={handleBackClick}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              gap: '6px',
              borderRadius: 'var(--radius-pill)',
              minHeight: '34px'
            }}
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
              boxShadow: timerMetrics.isPaused ? 'none' : '0 0 8px var(--accent-terracotta)'
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-charcoal)'
            }}>
              Focus Mode
            </span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: timerMetrics.isPaused ? 'var(--accent-amber-light)' : 'var(--accent-terracotta-light)',
            color: timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
            fontSize: '11px',
            fontWeight: 700
          }}>
            <span>{timerMetrics.isPaused ? 'Paused' : 'In Session'}</span>
          </div>
        </div>

        {/* SCROLLABLE CONTENT BODY */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* TASK TITLE & CATEGORY */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pill-badge pill-terracotta" style={{ fontSize: '10.5px' }}>
                {activeFocusTask.category || 'DSA'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {activeFocusSession?.plannedMinutes || 45} min planned
              </span>
            </div>

            <h2 style={{
              fontSize: '21px',
              fontWeight: 800,
              color: 'var(--text-charcoal)',
              lineHeight: '1.3',
              marginBottom: '4px'
            }}>
              {activeFocusTask.name}
            </h2>

            {activeFocusTask.description && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                {activeFocusTask.description}
              </p>
            )}
          </div>

          {/* MAIN TIMER HERO CARD */}
          <div 
            className="card-white"
            style={{
              padding: '24px 20px',
              textAlign: 'center',
              backgroundColor: timerMetrics.isPaused ? '#FFFDF8' : '#FFFFFF',
              borderColor: timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--border-beige)',
              boxShadow: '0 4px 20px rgba(35, 25, 15, 0.05)',
              marginBottom: '20px'
            }}
          >
            {/* Session Status Pill */}
            <div style={{ marginBottom: '8px' }}>
              {timerMetrics.isExpired ? (
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-sage)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🎯 Planned Time Reached
                </span>
              ) : timerMetrics.isPaused ? (
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ⏸ Session Paused
                </span>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Time Remaining
                </span>
              )}
            </div>

            {/* BIG MONOSPACE COUNTDOWN DISPLAY */}
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '56px',
              fontWeight: 800,
              color: timerMetrics.isExpired 
                ? 'var(--accent-sage)' 
                : timerMetrics.isPaused 
                ? 'var(--accent-amber)' 
                : 'var(--text-charcoal)',
              letterSpacing: '-0.04em',
              lineHeight: '1',
              marginBottom: '16px'
            }}>
              {timeFormatted}
            </div>

            {/* PROGRESS TRACK */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: timerMetrics.isExpired 
                    ? 'var(--accent-sage)' 
                    : timerMetrics.isPaused 
                    ? 'var(--accent-amber)' 
                    : 'var(--accent-terracotta)',
                  transition: 'width 400ms ease'
                }} />
              </div>
            </div>

            {/* TIMER EXPIRATION MESSAGE & EXTEND BUTTON */}
            {timerMetrics.isExpired && (
              <div style={{
                backgroundColor: 'var(--accent-sage-light)',
                border: '1px solid rgba(94, 140, 113, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 14px',
                marginBottom: '16px',
                animation: 'fadeIn 200ms ease'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-sage)', marginBottom: '2px' }}>
                  Session Complete 🎯
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  You reached your planned study goal. Ready to mark complete or extend?
                </div>
              </div>
            )}

            {/* CONTROLS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {!timerMetrics.isExpired && (
                <button
                  type="button"
                  onClick={togglePauseResume}
                  className="btn-secondary"
                  style={{
                    padding: '11px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    minWidth: '125px',
                    borderRadius: 'var(--radius-pill)',
                    gap: '6px'
                  }}
                >
                  {timerMetrics.isPaused ? (
                    <>
                      <Play size={15} fill="var(--text-charcoal)" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause size={15} />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}

              {timerMetrics.isExpired && (
                <button
                  type="button"
                  onClick={handleAddTenMinutes}
                  className="btn-secondary"
                  style={{
                    padding: '11px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-pill)',
                    gap: '6px'
                  }}
                >
                  <Plus size={15} />
                  <span>Add 10 Minutes</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCompleteConfirm(true)}
                className="btn-primary"
                style={{
                  padding: '11px 24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-pill)',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>Complete Session</span>
              </button>
            </div>
          </div>

          {/* SUBTASKS CHECKLIST */}
          {activeFocusTask.subtasks && activeFocusTask.subtasks.length > 0 && (
            <div className="card-white" style={{ marginBottom: '16px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <ListTodo size={15} color="var(--accent-terracotta)" />
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                  Session Objectives
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeFocusTask.subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => toggleSubtask(activeFocusTask.id, st.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '4px 0',
                      color: st.done ? 'var(--text-muted)' : 'var(--text-charcoal)'
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      border: `1.5px solid ${st.done ? 'var(--accent-terracotta)' : 'var(--border-beige-dark)'}`,
                      backgroundColor: st.done ? 'var(--accent-terracotta)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF'
                    }}>
                      {st.done && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span style={{ textDecoration: st.done ? 'line-through' : 'none' }}>
                      {st.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCRATCHPAD & INTERVIEW NOTES */}
          <div className="card-white" style={{ marginBottom: '14px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <FileText size={14} color="var(--text-secondary)" />
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                Session Scratchpad / Notes
              </h4>
            </div>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Record time complexities, edge cases, formulas, or key observations..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-beige)',
                backgroundColor: 'var(--bg-warm-cream)',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

        </div>

        {/* ------------------------------------------------------------------- */}
        {/* COMPLETE CONFIRMATION DIALOG MODAL */}
        {/* ------------------------------------------------------------------- */}
        {showCompleteConfirm && (
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
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-sage-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-sage)',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={28} />
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
              Complete this study session?
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', maxWidth: '340px' }}>
              <strong>{activeFocusTask.name}</strong>
            </p>

            <div style={{
              backgroundColor: 'var(--bg-warm-cream)',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 18px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--text-charcoal)'
            }}>
              Study time: <strong>{timerMetrics.actualMinutes} minutes</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '300px' }}>
              <button
                type="button"
                onClick={() => setShowCompleteConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                Keep Studying
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="btn-primary"
                style={{ flex: 1, padding: '12px' }}
              >
                Complete
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* LEAVE / ABANDON CONFIRMATION DIALOG MODAL */}
        {/* ------------------------------------------------------------------- */}
        {showLeaveConfirm && (
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
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)',
              marginBottom: '16px'
            }}>
              <AlertCircle size={28} />
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
              Leave Focus Mode?
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '320px' }}>
              Your current session is still running. Elapsed study time ({timerMetrics.actualMinutes} min) will be recorded, but the task will remain incomplete.
            </p>

            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px' }}>
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                Continue Session
              </button>
              <button
                type="button"
                onClick={handleConfirmAbandon}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', backgroundColor: 'var(--text-charcoal)' }}
              >
                Leave Session
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
