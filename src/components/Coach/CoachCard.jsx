import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CoachCard = ({ onOpenFullAnalysis }) => {
  const { coachAnalysis, isCoachLoading } = useApp();

  if (!coachAnalysis?.hasData) {
    return null;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'on_track':
        return <span className="pill-badge pill-sage" style={{ fontSize: '10px' }}>✓ On Track</span>;
      case 'needs_attention':
        return <span className="pill-badge pill-amber" style={{ fontSize: '10px' }}>⚠ Needs Attention</span>;
      case 'at_risk':
        return <span className="pill-badge pill-terracotta" style={{ fontSize: '10px' }}>🔥 At Risk</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      className="card-white"
      style={{
        padding: '14px 16px',
        marginBottom: '16px',
        borderLeft: '4px solid var(--accent-terracotta)',
        backgroundColor: '#FFFFFF',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-terracotta-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-terracotta)'
          }}>
            <Sparkles size={13} />
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-charcoal)', letterSpacing: '-0.01em' }}>
            NOVARA Coach
          </span>
        </div>

        {getStatusBadge(coachAnalysis.status)}
      </div>

      {/* Actionable Insight */}
      <p style={{
        fontSize: '12px',
        color: 'var(--text-charcoal)',
        fontWeight: 500,
        lineHeight: '1.45',
        marginBottom: '10px'
      }}>
        {coachAnalysis.compactInsight}
      </p>

      {/* Action Button: View Analysis */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onOpenFullAnalysis}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--accent-terracotta)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 0'
          }}
        >
          <span>View Analysis</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
