/**
 * Shared authoritative calculation for Focus Session timers.
 * Pure wall-clock based calculation to guarantee synchronization
 * across FocusSessionModal and FloatingActiveTaskBar with 0% drift.
 */
export function calculateFocusTimerMetrics(activeFocusSession, currentMs = Date.now()) {
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
}

export function formatFocusTime(totalSec) {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
