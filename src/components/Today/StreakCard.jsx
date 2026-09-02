import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StreakFreezeModal } from './StreakFreezeModal';
import { 
  Flame, 
  Award, 
  ShieldCheck, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const StreakCard = () => {
  const { streakData, userProfile, todayTasks } = useApp();
  const [showMilestones, setShowMilestones] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);

  const completedCount = todayTasks.filter((t) => t.completed).length;
  const targetRequired = userProfile.minTasksForStreak || 2;
  const isTargetMet = streakData.todayTargetMet;
  const tasksRemaining = Math.max(0, targetRequired - completedCount);

  const milestones = [
    { days: 3, label: 'Getting Started' },
    { days: 7, label: 'One Week Strong' },
    { days: 14, label: 'Consistent' },
    { days: 30, label: 'Placement Warrior' },
    { days: 60, label: 'Serious Candidate' },
    { days: 100, label: 'Elite Consistency' }
  ];

  return (
    <>
      <div 
        className="card-white"
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '16px',
          padding: '18px 20px'
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              backgroundColor: 'var(--accent-terracotta-light)',
              border: '1px solid rgba(200, 90, 50, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)'
            }}>
              <Flame size={26} fill="var(--accent-terracotta)" strokeWidth={1.8} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--text-charcoal)',
                  lineHeight: '1'
                }}>
                  {streakData.currentStreak}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: 'var(--accent-terracotta)',
                  textTransform: 'uppercase'
                }}>
                  Day Streak
                </span>
              </div>
              
              <p style={{
                fontSize: '12px',
                color: isTargetMet ? 'var(--accent-sage)' : 'var(--text-secondary)',
                fontWeight: 600,
                marginTop: '3px'
              }}>
                {isTargetMet 
                  ? '🔥 Goal reached! Day 13 locked in.'
                  : `Complete ${tasksRemaining} more ${tasksRemaining === 1 ? 'task' : 'tasks'} today to reach 13 days.`
                }
              </p>
            </div>
          </div>

          {/* Freezes Available Pill Button */}
          <button
            onClick={() => setIsFreezeModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--accent-navy-light)',
              border: '1px solid rgba(61, 90, 128, 0.2)',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-navy)',
              cursor: 'pointer'
            }}
            title="Click to manage or use streak freeze"
          >
            <ShieldCheck size={13} />
            <span>{streakData.streakFreezesRemaining ?? 2} Freezes</span>
          </button>
        </div>

        {/* Weekly Streak Indicator with Simple Circular Indicators */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-warm-cream-alt)',
          border: '1px solid var(--border-beige-light)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          marginBottom: '14px'
        }}>
          {streakData.weeklyHistory.map((dayItem, index) => {
            const isToday = index === streakData.weeklyHistory.length - 1;
            const isCompleted = dayItem.status === 'completed' || (isToday && isTargetMet);

            return (
              <div 
                key={dayItem.day}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: isToday ? 'var(--accent-terracotta)' : 'var(--text-muted)'
                }}>
                  {dayItem.day}
                </span>

                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted 
                    ? 'var(--accent-terracotta)' 
                    : isToday 
                      ? 'rgba(200, 90, 50, 0.15)' 
                      : '#FFFFFF',
                  border: isToday 
                    ? '2px solid var(--accent-terracotta)' 
                    : '1px solid var(--border-beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCompleted ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 200ms ease'
                }}>
                  {isCompleted ? (
                    <Flame size={14} fill="#FFFFFF" />
                  ) : (
                    <span>○</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Strip: Longest: 18 days & Milestones accordion toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-beige-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Award size={14} color="var(--accent-amber)" />
            <span>Longest: <strong>{streakData.longestStreak} days</strong></span>
          </div>

          <button
            onClick={() => setShowMilestones(!showMilestones)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              cursor: 'pointer'
            }}
          >
            <span>Milestones</span>
            {showMilestones ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Milestones Expansion */}
        {showMilestones && (
          <div style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-beige-light)',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            animation: 'fadeIn 200ms ease'
          }}>
            {milestones.map((m) => {
              const isUnlocked = streakData.currentStreak >= m.days;
              return (
                <div
                  key={m.days}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isUnlocked ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream)',
                    border: `1px solid ${isUnlocked ? 'rgba(200, 90, 50, 0.3)' : 'var(--border-beige)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Flame size={13} color={isUnlocked ? 'var(--accent-terracotta)' : 'var(--text-muted)'} fill={isUnlocked ? 'var(--accent-terracotta)' : 'transparent'} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isUnlocked ? 'var(--accent-terracotta)' : 'var(--text-charcoal)' }}>
                      {m.days} Days
                    </div>
                    <div style={{ fontSize: '10px', color: isUnlocked ? 'var(--accent-terracotta)' : 'var(--text-muted)' }}>
                      {m.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StreakFreezeModal 
        isOpen={isFreezeModalOpen} 
        onClose={() => setIsFreezeModalOpen(false)} 
      />
    </>
  );
};
