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
      backgroundColor: '#FEFDF8',
      border: '1px solid #F6E05E',
      borderLeft: '4px solid #D69E2E',
      boxShadow: '0 1px 3px rgba(35, 25, 15, 0.02)',
      margin: '12px 0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11.5px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#B7791F',
        marginBottom: '6px'
      }}>
        <Lightbulb size={14} color="#D69E2E" />
        <span>Real-World Analogy {mappedConcept ? `• ${mappedConcept}` : ''}</span>
      </div>

      <p style={{
        fontSize: '13px',
        color: '#744210',
        lineHeight: '1.55',
        margin: '0 0 4px 0',
        fontWeight: 500
      }}>
        "{analogyText}"
      </p>

      {explanation && (
        <p style={{
          fontSize: '11.5px',
          color: '#975A16',
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
