import React, { useState } from 'react';
import { HelpCircle, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * SelfCheckCard - Interactive self-reflection questions for learning verification.
 * Note: These checks are for personal recall and do not alter task completion state.
 */
export default function SelfCheckCard({ questions = [] }) {
  if (!Array.isArray(questions) || questions.length === 0) return null;

  return (
    <div style={{ margin: '18px 0', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12.5px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--text-charcoal)',
        marginBottom: '10px',
        flexWrap: 'wrap'
      }}>
        <HelpCircle size={15} color="var(--accent-terracotta)" style={{ flexShrink: 0 }} />
        <span>Self-Check & Concept Verification</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {questions.map((q, idx) => (
          <SelfCheckItem key={idx} item={q} index={idx} />
        ))}
      </div>
    </div>
  );
}

function SelfCheckItem({ item, index }) {
  const [revealed, setRevealed] = useState(false);
  const questionText = typeof item === 'string' ? item : (item.question || item.prompt);
  const answerText = typeof item === 'object' ? item.answerSummary : null;

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: '10px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-beige)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--accent-terracotta)',
            paddingTop: '1px'
          }}>
            Q{index + 1}:
          </span>
          <p style={{
            fontSize: '12.5px',
            fontWeight: 700,
            color: 'var(--text-charcoal)',
            lineHeight: '1.45',
            margin: 0
          }}>
            {questionText}
          </p>
        </div>

        {answerText && (
          <button
            type="button"
            onClick={() => setRevealed(prev => !prev)}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: revealed ? 'var(--accent-terracotta-light)' : 'var(--bg-card-subtle)',
              color: 'var(--accent-terracotta)',
              border: '1px solid var(--border-beige)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {revealed ? 'Hide Guidance' : 'Reflect'}
          </button>
        )}
      </div>

      {revealed && answerText && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-beige)',
          fontSize: '11.5px',
          color: 'var(--text-secondary)',
          lineHeight: '1.45',
          marginTop: '2px'
        }}>
          <strong>Key insight: </strong>{answerText}
        </div>
      )}
    </div>
  );
}
