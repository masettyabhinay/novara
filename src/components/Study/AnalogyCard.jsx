import React from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';

/**
 * AnalogyCard - Renders an intuitive real-world analogy to ground abstract concepts.
 */
export default function AnalogyCard({ analogy }) {
  if (!analogy) return null;

  const analogyText = typeof analogy === 'string' ? analogy : (analogy.analogy || analogy.text);
  const explanation = typeof analogy === 'object' ? analogy.explanation : null;
  const mappedConcept = typeof analogy === 'object' ? analogy.mappedConcept : null;

  if (!analogyText) return null;

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '12px',
      backgroundColor: 'var(--accent-amber-light)',
      border: '1px solid var(--accent-amber)',
      borderLeft: '4px solid var(--accent-amber)',
      boxShadow: '0 1px 3px rgba(35, 25, 15, 0.02)',
      margin: '12px 0',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11.5px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--accent-amber)',
        marginBottom: '6px'
      }}>
        <Lightbulb size={14} color="var(--accent-amber)" />
        <span>Real-World Analogy {mappedConcept ? `• ${mappedConcept}` : ''}</span>
      </div>

      <p style={{
        fontSize: '13px',
        color: 'var(--text-charcoal)',
        lineHeight: '1.55',
        margin: '0 0 4px 0',
        fontWeight: 500
      }}>
        "{analogyText}"
      </p>

      {explanation && (
        <p style={{
          fontSize: '11.5px',
          color: 'var(--text-secondary)',
          lineHeight: '1.45',
          margin: '4px 0 0 0',
          fontStyle: 'italic'
        }}>
          <strong>Why this works: </strong>{explanation}
        </p>
      )}
    </div>
  );
}
