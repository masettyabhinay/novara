import React from 'react';
import { Sigma, ArrowRight } from 'lucide-react';

/**
 * FormulaCard - Renders mathematical equations, recurrences, and algorithmic complexity formulas.
 */
export default function FormulaCard({ formulas = [] }) {
  if (!Array.isArray(formulas) || formulas.length === 0) return null;

  return (
    <div style={{ margin: '14px 0' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--text-charcoal)',
        marginBottom: '8px'
      }}>
        <Sigma size={14} color="#C85A32" />
        <span>Core Formulas & Recurrences</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {formulas.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: '#FAF8F5',
              border: '1px solid #E8E2D9',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1E293B' }}>
                {item.name || item.title}
              </span>
            </div>

            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13.5px',
              fontWeight: 800,
              color: '#C85A32',
              backgroundColor: '#FFFFFF',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #E2D8CC',
              margin: '4px 0'
            }}>
              {item.formula || item.equation}
            </div>

            {item.variables && (
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                <strong>Variables: </strong>{item.variables}
              </div>
            )}

            {item.intuition && (
              <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>
                💡 {item.intuition}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
