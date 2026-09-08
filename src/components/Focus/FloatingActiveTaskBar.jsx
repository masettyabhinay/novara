import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause } from 'lucide-react';
import { calculateFocusTimerMetrics, formatFocusTime } from '../../utils/focusTimerUtils';

/**
 * FloatingActiveTaskBar
 * 
 * Appears dynamically when an authoritative Focus session/task is active and the main Focus modal is minimized.
 * Positioned safely above the mobile BottomNav or pinned nicely on desktop/tablet.
 * Fully synchronized with authoritative Focus session timestamps (zero timer drift, single authoritative timer).
 */
export const FloatingActiveTaskBar = () => {
  const {
    activeFocusSession,
    activeFocusTask,
    isFocusModalOpen,
    setIsFocusModalOpen,
    pauseFocusSession,
    resumeFocusSession
  } = useApp();

  const [nowMs, setNowMs] = useState(Date.now());

  // Real wall-clock ticker every 500ms when task bar is active
  useEffect(() => {
    if (!activeFocusSession || isFocusModalOpen) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [activeFocusSession, isFocusModalOpen]);

  // Derive exact authoritative metrics using shared utility
  const metrics = useMemo(() => {
    return calculateFocusTimerMetrics(activeFocusSession, nowMs);
  }, [activeFocusSession, nowMs]);

  // Requirement 1: Before task starts or after completion/cancellation, MUST NOT exist
  // When modal is open, modal is full-screen authoritative view so floating bar hides
  if (!activeFocusSession || !activeFocusTask || isFocusModalOpen) {
    return null;
  }

  const isPaused = metrics.isPaused;
  const timeFormatted = formatFocusTime(metrics.remainingSeconds);

  const handleBarClick = () => {
    // Return to the EXACT SAME active session
    setIsFocusModalOpen(true);
  };

  const handleTogglePlayPause = (e) => {
    e.stopPropagation();
    if (!activeFocusSession) return;
    if (isPaused) {
      resumeFocusSession(activeFocusSession.sessionId);
    } else {
      pauseFocusSession(activeFocusSession.sessionId);
    }
  };

  return (
    <div
      className="floating-active-task-bar-root"
      role="region"
      aria-label="Active Focus Session Bar"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 12px)',
        left: '12px',
        right: '12px',
        maxWidth: '430px',
        margin: '0 auto',
        zIndex: 950,
        boxSizing: 'border-box',
        animation: 'slideUp 220ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="floating-active-task-bar-card"
        onClick={handleBarClick}
        role="button"
        tabIndex={0}
        aria-label="Open active study session"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBarClick();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '8px 14px',
          minHeight: '52px',
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          border: `1.5px solid ${isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)'}`,
          boxShadow: isPaused
            ? '0 8px 24px rgba(217, 130, 43, 0.18)'
            : '0 8px 24px rgba(200, 90, 50, 0.2)',
          cursor: 'pointer',
          boxSizing: 'border-box',
          outline: 'none',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Left Section: Status dot + Task Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          {/* Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: isPaused ? 'var(--accent-amber-light)' : 'var(--accent-terracotta-light)',
              color: isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
              fontSize: '10.5px',
              fontWeight: 800,
              flexShrink: 0
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
                boxShadow: isPaused ? 'none' : '0 0 6px var(--accent-terracotta)'
              }}
            />
            <span>{isPaused ? '○ Paused' : '● Active'}</span>
          </div>

          {/* Title and Session label */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--text-charcoal)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.2'
              }}
              title={activeFocusTask.name}
            >
              {activeFocusTask.name}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.01em',
                lineHeight: '1.2'
              }}
            >
              Focus Session
            </div>
          </div>
        </div>

        {/* Right Section: Timer Display + Pause/Resume Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Authoritative Timer */}
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13.5px',
              fontWeight: 800,
              color: isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
              letterSpacing: '-0.02em',
              padding: '2px 4px'
            }}
          >
            {timeFormatted}
          </div>

          {/* Pause / Resume Button: >=44px Touch Target */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className="floating-bar-toggle-btn"
            aria-label={isPaused ? 'Resume focus session' : 'Pause focus session'}
            title={isPaused ? 'Resume focus session' : 'Pause focus session'}
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '50%',
              backgroundColor: isPaused ? 'var(--accent-amber)' : 'var(--accent-terracotta)',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              transition: 'transform 120ms ease, background-color 160ms ease',
              flexShrink: 0
            }}
          >
            {isPaused ? (
              <Play size={16} fill="#FFFFFF" style={{ marginLeft: '2px' }} />
            ) : (
              <Pause size={16} fill="#FFFFFF" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
