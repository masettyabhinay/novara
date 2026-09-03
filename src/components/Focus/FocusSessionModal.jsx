import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft,
  X, 
  Play, 
  Pause, 
  CheckCircle2, 
  Flame, 
  Clock, 
  Sparkles, 
  Plus, 
  AlertCircle, 
  Check, 
  ListTodo,
  BookOpen,
  Layers,
  Target,
  Zap,
  Compass,
  Lightbulb,
  Code2,
  Cpu,
  AlertTriangle,
  BookmarkCheck,
  Copy,
  RefreshCw,
  FileText
} from 'lucide-react';
import { fetchTaskStudyMaterial } from '../../services/studyMaterialService';
import StudyDiagram from '../Study/StudyDiagram';
import DeepStudyDocument from '../Study/DeepStudyDocument';

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

  // Study Material states
  const [studyLoading, setStudyLoading] = useState(true);
  const [studyError, setStudyError] = useState(null);
  const [studyMaterial, setStudyMaterial] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  // Update timer tick every 500ms using real wall-clock timestamps
  useEffect(() => {
    if (!isFocusModalOpen || !activeFocusSession) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [isFocusModalOpen, activeFocusSession]);

  // Load Task-Specific Study Material asynchronously while timer is running
  useEffect(() => {
    if (!isFocusModalOpen || !activeFocusTask) {
      setStudyMaterial(null);
      setStudyError(null);
      return;
    }

    let isMounted = true;
    async function loadMaterial() {
      setStudyLoading(true);
      setStudyError(null);

      try {
        const res = await fetchTaskStudyMaterial(activeFocusTask);
        if (!isMounted) return;

        if (res.success && res.material) {
          setStudyMaterial(res.material);
          setIsCached(res.cached || false);
        } else {
          setStudyError(res.error || 'Unable to load AI study guide. You can still complete your focus session.');
        }
      } catch (err) {
        if (!isMounted) return;
        setStudyError(err.message || 'Error loading study guide.');
      } finally {
        if (isMounted) setStudyLoading(false);
      }
    }

    loadMaterial();

    return () => {
      isMounted = false;
    };
  }, [isFocusModalOpen, activeFocusTask?.id, activeFocusTask?.name]);

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

  const handleCopyCode = (codeText, idx) => {
    if (!codeText) return;
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        zIndex: 1000,
        backgroundColor: 'rgba(24, 20, 16, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '8px'
      }}
    >
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FAF8F5',
          border: '1px solid #E8E2D9',
          boxShadow: '0 25px 60px rgba(35, 25, 15, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* =================================================================== */}
        {/* TOP UNIFIED HEADER                                                  */}
        {/* =================================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: '#FAF8F5',
          borderBottom: '1px solid #E8E2D9',
          gap: '12px',
          flexShrink: 0
        }}>
          {/* Left: Back Action + Mode Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              type="button"
              onClick={handleBackClick}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                gap: '5px',
                borderRadius: 'var(--radius-pill)',
                minHeight: '32px',
                flexShrink: 0
              }}
              title="Leave or minimize session"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(200, 90, 50, 0.12)',
                color: 'var(--accent-terracotta)',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                flexShrink: 0
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
                  boxShadow: timerMetrics.isPaused ? 'none' : '0 0 6px var(--accent-terracotta)'
                }} />
                <span>FOCUS + STUDY</span>
              </div>

              <h2 style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--text-charcoal)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0
              }}>
                {activeFocusTask.name}
              </h2>
            </div>
          </div>

          {/* Right: Live Timer Status + Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: timerMetrics.isPaused ? 'var(--accent-amber-light)' : '#FFFFFF',
              border: `1px solid ${timerMetrics.isPaused ? 'var(--accent-amber)' : '#E8E2D9'}`,
              boxShadow: '0 1px 3px rgba(35, 25, 15, 0.04)'
            }}>
              <Clock size={13} color={timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)'} />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                fontWeight: 800,
                color: timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--text-charcoal)'
              }}>
                {timeFormatted}
              </span>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--text-secondary)',
                paddingLeft: '4px',
                borderLeft: '1px solid #E8E2D9'
              }}>
                {timerMetrics.isPaused ? 'Paused' : 'In Session'}
              </span>
            </div>

            <button
              onClick={handleBackClick}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Exit Session"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* WORKSPACE BODY (2-COLUMN ON DESKTOP, SINGLE ON MOBILE)             */}
        {/* =================================================================== */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          minHeight: 0,
          overflow: 'hidden'
        }} className="focus-study-grid">

          {/* --------------------------------------------------------------- */}
          {/* LEFT COLUMN: TIMER, CONTROLS & SESSION OBJECTIVES              */}
          {/* --------------------------------------------------------------- */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E8E2D9',
            padding: '20px 18px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            
            {/* Meta Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span className="pill-badge pill-terracotta" style={{ fontSize: '10.5px' }}>
                {activeFocusTask.category || 'DSA'}
              </span>
              {activeFocusTask.difficulty && (
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--bg-warm-cream-alt)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-beige)'
                }}>
                  {activeFocusTask.difficulty}
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {activeFocusSession?.plannedMinutes || 45} min target
              </span>
            </div>

            {/* MAIN TIMER HERO CARD */}
            <div style={{
              padding: '20px 16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: timerMetrics.isPaused ? '#FFFDF8' : '#FAF8F5',
              border: `1px solid ${timerMetrics.isPaused ? 'var(--accent-amber)' : '#E8E2D9'}`,
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(35, 25, 15, 0.03)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: timerMetrics.isExpired ? 'var(--accent-sage)' : timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--text-muted)',
                marginBottom: '4px'
              }}>
                {timerMetrics.isExpired ? '🎯 Time Goal Met' : timerMetrics.isPaused ? '⏸ Timer Paused' : 'Time Remaining'}
              </div>

              {/* Countdown Display */}
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '46px',
                fontWeight: 800,
                color: timerMetrics.isExpired ? 'var(--accent-sage)' : timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--text-charcoal)',
                letterSpacing: '-0.04em',
                lineHeight: '1',
                marginBottom: '14px'
              }}>
                {timeFormatted}
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Elapsed: {Math.floor(timerMetrics.elapsedSeconds / 60)}m</span>
                  <span>{progressPercent}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: '#E8E2D9',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    borderRadius: '9999px',
                    backgroundColor: timerMetrics.isExpired ? 'var(--accent-sage)' : timerMetrics.isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
                    transition: 'width 400ms ease'
                  }} />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={togglePauseResume}
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-pill)',
                      gap: '5px'
                    }}
                  >
                    {timerMetrics.isPaused ? (
                      <>
                        <Play size={14} fill="var(--text-charcoal)" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause size={14} />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleAddTenMinutes}
                    className="btn-secondary"
                    style={{
                      padding: '9px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-pill)',
                      gap: '4px'
                    }}
                    title="Add 10 minutes to session"
                  >
                    <Plus size={14} />
                    <span>+10m</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCompleteConfirm(true)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-pill)',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(200, 90, 50, 0.25)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Complete & Start Quiz →</span>
                </button>
              </div>
            </div>

            {/* Session Objectives & Subtasks */}
            {activeFocusTask.subtasks && activeFocusTask.subtasks.length > 0 && (
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FAF8F5',
                border: '1px solid #E8E2D9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <ListTodo size={14} color="var(--accent-terracotta)" />
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)' }}>
                    Session Checklist
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeFocusTask.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => toggleSubtask(activeFocusTask.id, st.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px 0',
                        color: st.done ? 'var(--text-muted)' : 'var(--text-charcoal)'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: `1.5px solid ${st.done ? 'var(--accent-terracotta)' : '#C4B9A9'}`,
                        backgroundColor: st.done ? 'var(--accent-terracotta)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                      }}>
                        {st.done && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span style={{ textDecoration: st.done ? 'line-through' : 'none' }}>
                        {st.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scratchpad / Notes */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FAF8F5',
              border: '1px solid #E8E2D9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FileText size={13} color="var(--text-secondary)" />
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)' }}>
                  Study Notes
                </span>
              </div>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Key formulas, complexities, or edge cases noticed..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #E8E2D9',
                  backgroundColor: '#FFFFFF',
                  fontSize: '12px',
                  color: 'var(--text-charcoal)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

          </div>

          {/* --------------------------------------------------------------- */}
          {/* RIGHT COLUMN: AI STUDY GUIDE PANEL (SCROLLABLE)                */}
          {/* --------------------------------------------------------------- */}
          <div style={{
            padding: '24px 28px',
            overflowY: 'auto',
            backgroundColor: '#FAF8F5',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {studyLoading ? (
              <div style={{
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '4px solid rgba(200, 90, 50, 0.2)',
                  borderTopColor: 'var(--accent-terracotta)',
                  animation: 'spin 1s linear infinite'
                }} />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                    Preparing your personalized study guide...
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto' }}>
                    Generating topic-grounded concepts, algorithmic patterns, code implementations, and placement tips.
                  </p>
                </div>
              </div>
            ) : studyError ? (
              <div style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#FFF5F5',
                border: '1px solid #FED7D7',
                textAlign: 'center'
              }}>
                <AlertTriangle size={32} color="#E53E3E" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#9B2C2C', marginBottom: '4px' }}>
                  Study Guide Temporarily Unavailable
                </h4>
                <p style={{ fontSize: '12px', color: '#C53030', marginBottom: '14px', maxWidth: '420px', margin: '0 auto 14px' }}>
                  {studyError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStudyLoading(true);
                    setStudyError(null);
                    fetchTaskStudyMaterial(activeFocusTask)
                      .then(res => {
                        if (res.success && res.material) setStudyMaterial(res.material);
                        else setStudyError(res.error || 'Retry failed.');
                      })
                      .finally(() => setStudyLoading(false));
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px', gap: '5px', borderRadius: 'var(--radius-pill)' }}
                >
                  <RefreshCw size={12} />
                  <span>Retry Loading Guide</span>
                </button>
              </div>
            ) : studyMaterial ? (
              <DeepStudyDocument
                material={studyMaterial}
                task={activeFocusTask}
                estimatedMinutes={activeFocusTask?.durationMinutes || 45}
                onStartQuiz={() => setShowCompleteConfirm(true)}
              />
            ) : null}
          </div>

        </div>

        {/* ------------------------------------------------------------------- */}
        {/* COMPLETE CONFIRMATION DIALOG MODAL                                  */}
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
              Finish session and launch quiz?
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

            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px' }}>
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
                Launch Quiz →
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* LEAVE / ABANDON CONFIRMATION DIALOG MODAL                           */}
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
              Leave Focus + Study?
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '320px' }}>
              Your session timer is running. You can resume anytime from Today's Mission or Roadmap.
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
                Exit Session
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
