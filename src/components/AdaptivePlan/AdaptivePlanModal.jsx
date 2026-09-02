import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sliders, 
  X, 
  Calendar, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AdaptivePlanModal = () => {
  const { 
    isAdaptiveModalOpen, 
    setIsAdaptiveModalOpen, 
    todayTasks, 
    userProfile, 
    applyAdaptiveRescheduling 
  } = useApp();

  const [selectedStrategy, setSelectedStrategy] = useState('spread_3_days');

  if (!isAdaptiveModalOpen) return null;

  const incompleteTasks = todayTasks.filter((t) => !t.completed);

  const strategies = [
    {
      id: 'spread_3_days',
      title: 'Spread Over Next 3 Days (Recommended)',
      desc: 'Adds 20-25 mins per day without exceeding your daily 3.0h target capacity.'
    },
    {
      id: 'weekend_catchup',
      title: 'Weekend Catchup Session',
      desc: 'Keep weekday schedules light and move surplus problem drills to Saturday/Sunday.'
    },
    {
      id: 'prune_priority',
      title: 'Focus on High-Yield Topics Only',
      desc: 'Prune low-priority drills while strictly preserving Core CS & Hard DSA concepts.'
    }
  ];

  const handleConfirmAdjustment = () => {
    applyAdaptiveRescheduling(incompleteTasks);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsAdaptiveModalOpen(false)}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '28px 24px', maxWidth: '460px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill-badge pill-sage">
              <Sparkles size={12} /> Adaptive Engine
            </span>
          </div>

          <button
            onClick={() => setIsAdaptiveModalOpen(false)}
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

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
          Intelligent Plan Adjustment
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          You have {incompleteTasks.length} pending tasks. NOVARA rebalances your schedule rather than dumping backlog onto tomorrow.
        </p>

        {/* Strategies selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          {strategies.map((strat) => {
            const isSelected = selectedStrategy === strat.id;
            return (
              <div
                key={strat.id}
                onClick={() => setSelectedStrategy(strat.id)}
                className="card-white interactive"
                style={{
                  padding: '14px 16px',
                  borderColor: isSelected ? 'var(--accent-sage)' : 'var(--border-beige)',
                  backgroundColor: isSelected ? 'var(--accent-sage-light)' : '#FFFFFF'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '2px' }}>
                  {strat.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {strat.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Protection badge */}
        <div style={{
          backgroundColor: 'var(--bg-warm-cream-alt)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginBottom: '20px'
        }}>
          <ShieldCheck size={16} color="var(--accent-sage)" />
          <span>Preserves your {userProfile.targetDate} target placement milestone date.</span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmAdjustment}
          className="btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '14px' }}
        >
          <span>Apply Adaptive Adjustment</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
