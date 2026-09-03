import React, { useState } from 'react';
import { HelpCircle, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * SelfCheckCard - Interactive self-reflection questions for learning verification.
 * Note: These checks are for personal recall and do not alter task completion state.
 */
export default function SelfCheckCard({ questions = [] }) {
  if (!Array.isArray(questions) || questions.length === 0) return null;

  return (
    <div style={{ margin: '18px 0' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12.5px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--text-charcoal)',
        marginBottom: '10px'
      }}>
        <HelpCircle size={15} color="#C85A32" />
        <span>Self-Check & Concept Verification</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
      backgroundColor: '#FAF8F5',
      border: '1px solid #E8E2D9',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
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
            color: '#C85A32',
            paddingTop: '1px'
          }}>
            Q{index + 1}:
          </span>
          <p style={{
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#1E293B',
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
              backgroundColor: revealed ? '#FAF0EB' : '#FFFFFF',
              color: '#C85A32',
              border: '1px solid #E2D8CC',
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
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2D8CC',
          fontSize: '11.5px',
          color: '#475569',
          lineHeight: '1.45',
          marginTop: '2px'
        }}>
          <strong>Key insight: </strong>{answerText}
        </div>
      )}
    </div>
  );
}
