import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Flame, 
  X, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const StreakFreezeModal = ({ isOpen, onClose }) => {
  const { streakData, setStreakData, showToast, triggerConfetti } = useApp();

  if (!isOpen) return null;

  const freezesLeft = streakData.streakFreezesRemaining ?? 2;

  const handleApplyFreeze = () => {
    if (freezesLeft <= 0) {
      showToast('No Freezes Available', 'Complete 7 consecutive days to earn a new freeze.', 'terracotta');
      return;
    }

    setStreakData((prev) => ({
      ...prev,
      streakFreezesRemaining: prev.streakFreezesRemaining - 1,
      todayTargetMet: true,
      streakFreezeUsedToday: true
    }));

    triggerConfetti();
    showToast('Streak Shield Activated! 🛡️', 'Your 12-day streak has been protected for today.', 'sage');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '28px 24px', maxWidth: '440px' }}
      >
        {/* Header Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
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
              color: 'var(--text-secondary)'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Shield Icon Graphic */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            backgroundColor: 'var(--accent-navy-light)',
            border: '1px solid rgba(61, 90, 128, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-navy)',
            margin: '0 auto 12px auto'
          }}>
            <ShieldCheck size={32} strokeWidth={2.2} />
          </div>

          <h2 style={{
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--text-charcoal)',
            marginBottom: '6px'
          }}>
            Protect Your Momentum
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
            Life happens. Use a Streak Freeze to preserve your <strong>{streakData.currentStreak}-day streak</strong> without losing consistency credit.
          </p>
        </div>

        {/* Freeze Inventory Status Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-xl)',
          padding: '18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-navy-light)',
              color: 'var(--accent-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                Available Freezes
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Earn 1 freeze every 7 days
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '20px',
            fontWeight: 800,
            color: freezesLeft > 0 ? 'var(--accent-navy)' : 'var(--text-muted)'
          }}>
            {freezesLeft} Left
          </div>
        </div>

        {/* Explain Rule */}
        <div style={{
          backgroundColor: 'var(--bg-warm-cream-alt)',
          border: '1px solid var(--border-beige-light)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.45',
          marginBottom: '20px'
        }}>
          📌 <strong>How it works:</strong> Activating this freeze marks today as shielded on your weekly tracker. Your missed tasks will be adaptively rescheduled for tomorrow without penalty.
        </div>

        {/* Action Button */}
        <button
          onClick={handleApplyFreeze}
          disabled={freezesLeft <= 0}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '14px',
            backgroundColor: freezesLeft > 0 ? 'var(--accent-navy)' : 'var(--border-beige-dark)',
            color: '#FFFFFF'
          }}
        >
          <ShieldCheck size={16} />
          <span>{freezesLeft > 0 ? 'Use 1 Streak Freeze' : 'No Freezes Remaining'}</span>
        </button>
      </div>
    </div>
  );
};
