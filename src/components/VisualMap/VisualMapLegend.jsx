import React from 'react';
import { STATUS_SYMBOLS } from './visualMapUtils';

/**
 * VisualMapLegend — Compact, accessible legend displaying node state indicators.
 */
export default function VisualMapLegend({ compact = false }) {
  const items = [
    { symbol: STATUS_SYMBOLS.completed, label: 'Completed', color: 'var(--accent-sage, #5E8C71)' },
    { symbol: STATUS_SYMBOLS.current, label: 'Current / Active', color: 'var(--accent-terracotta, #C85A32)' },
    { symbol: STATUS_SYMBOLS.upcoming, label: 'Upcoming', color: 'var(--text-muted, #78716C)' },
    { symbol: STATUS_SYMBOLS.due, label: 'Due Today', color: 'var(--accent-amber, #D97706)' },
    { symbol: STATUS_SYMBOLS.overdue, label: 'Overdue', color: '#DC2626' }
  ];

  return (
    <div
      className="visual-map-legend"
      aria-label="Map status legend"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: compact ? '8px 12px' : '10px 16px',
        padding: compact ? '6px 10px' : '8px 12px',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-beige)',
        fontSize: compact ? '10.5px' : '11.5px',
        color: 'var(--text-secondary)'
      }}
    >
      <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: '10px' }}>
        Key:
      </span>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${item.color}`,
              color: item.color,
              fontSize: '9.5px',
              fontWeight: 900
            }}
            aria-hidden="true"
          >
            {item.symbol}
          </span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
