import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Check, ArrowRight, Clock, ShieldCheck } from 'lucide-react';

export const CoachAdjustmentModal = ({ isOpen, onClose, recommendation, onConfirm }) => {
  if (!isOpen || !recommendation) return null;

  const beforeTotal = (recommendation.beforeAllocation || []).reduce((sum, item) => sum + item.minutes, 0);
  const afterTotal = (recommendation.afterAllocation || []).reduce((sum, item) => sum + item.minutes, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px 20px', maxWidth: '460px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)'
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                Adjust your preparation plan?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Explanation */}
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '16px' }}>
          NOVARA will redistribute your study time over the next {recommendation.days || 4} days while strictly maintaining your <strong>{recommendation.dailyCapHours || 3}-hour daily limit</strong>. Already completed tasks will never be modified.
        </p>

        {/* Before vs After Allocation Preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {/* Before */}
          <div 
            className="card-white"
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-warm-cream-alt)',
              borderColor: 'var(--border-beige)'
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Current Plan
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
              {(recommendation.beforeAllocation || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name.split('&')[0]}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>{item.minutes}m</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-beige)', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800 }}>
              <span>Total</span>
              <span>{beforeTotal} min</span>
            </div>
          </div>

          {/* After */}
          <div 
            className="card-white"
            style={{
              padding: '12px 14px',
              backgroundColor: '#FFFFFF',
              borderColor: 'var(--accent-terracotta)',
              borderWidth: '1.5px'
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-terracotta)', marginBottom: '8px' }}>
              Recommended Plan
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
              {(recommendation.afterAllocation || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: item.name.includes(recommendation.targetCategory) ? 'var(--accent-terracotta)' : 'var(--text-secondary)', fontWeight: item.name.includes(recommendation.targetCategory) ? 700 : 500 }}>
                    {item.name.split('&')[0]}
                  </span>
                  <span style={{ fontWeight: 700, color: item.name.includes(recommendation.targetCategory) ? 'var(--accent-terracotta)' : 'var(--text-charcoal)' }}>
                    {item.minutes}m
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-beige-light)', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800 }}>
              <span style={{ color: 'var(--accent-terracotta)' }}>Total</span>
              <span style={{ color: 'var(--accent-terracotta)' }}>{afterTotal} min</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, padding: '11px', fontSize: '12.5px' }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm(recommendation);
              onClose();
            }}
            className="btn-primary"
            style={{ flex: 2, padding: '11px 16px', fontSize: '12.5px' }}
          >
            <Check size={15} />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
