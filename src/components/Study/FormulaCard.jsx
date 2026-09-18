import React from 'react';
import { Sigma, ArrowRight } from 'lucide-react';

/**
 * FormulaCard - Renders mathematical equations, recurrences, and algorithmic complexity formulas.
 */
export default function FormulaCard({ formulas = [] }) {
  if (!Array.isArray(formulas) || formulas.length === 0) return null;

  return (
    <div style={{ margin: '14px 0', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--text-charcoal)',
        marginBottom: '8px',
        flexWrap: 'wrap'
      }}>
        <Sigma size={14} color="var(--accent-terracotta)" style={{ flexShrink: 0 }} />
        <span>Core Formulas & Recurrences</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {formulas.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {item.name || item.title}
              </span>
            </div>

            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13.5px',
              fontWeight: 800,
              color: 'var(--accent-terracotta)',
              backgroundColor: 'var(--bg-card-subtle)',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-beige)',
              margin: '4px 0',
              overflowX: 'auto',
              maxWidth: '100%',
              boxSizing: 'border-box',
              wordBreak: 'break-word'
            }}>
              {item.formula || item.equation}
            </div>

            {item.variables && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <strong>Variables: </strong>{item.variables}
              </div>
            )}

            {item.intuition && (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                💡 {item.intuition}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
