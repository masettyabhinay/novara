import React, { useState } from 'react';
import { Target, HelpCircle, ChevronDown, ChevronUp, Lightbulb, CheckCircle2 } from 'lucide-react';

/**
 * PracticeProblemCard - Interactive task-specific practice problems with Hint & Approach toggles.
 */
export default function PracticeProblemCard({ problems = [] }) {
  if (!Array.isArray(problems) || problems.length === 0) return null;

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
        <Target size={15} color="#C85A32" style={{ flexShrink: 0 }} />
        <span>Grounded Practice Challenges</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {problems.map((prob, idx) => (
          <ProblemItem key={idx} problem={prob} index={idx} />
        ))}
      </div>
    </div>
  );
}

function ProblemItem({ problem, index }) {
  const [showHint, setShowHint] = useState(false);
  const [showApproach, setShowApproach] = useState(false);

  const difficulty = problem.difficulty || 'Medium';

  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-beige)',
      boxShadow: '0 1px 3px rgba(35, 25, 15, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      {/* Title & Difficulty */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-terracotta-light)',
            color: 'var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 800
          }}>
            {index + 1}
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
            {problem.title}
          </span>
        </div>

        <span style={{
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          padding: '2px 7px',
          borderRadius: '4px',
          backgroundColor: difficulty.toLowerCase() === 'hard' ? 'rgba(239, 68, 68, 0.12)' : difficulty.toLowerCase() === 'medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)',
          color: difficulty.toLowerCase() === 'hard' ? 'var(--accent-terracotta)' : difficulty.toLowerCase() === 'medium' ? 'var(--accent-amber)' : 'var(--accent-sage)',
          border: `1px solid ${difficulty.toLowerCase() === 'hard' ? 'rgba(239, 68, 68, 0.25)' : difficulty.toLowerCase() === 'medium' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`
        }}>
          {difficulty}
        </span>
      </div>

      {problem.skillTested && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          <strong>Skill tested: </strong>{problem.skillTested}
        </div>
      )}

      {/* Problem Statement */}
      <p style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: '1.55', margin: '2px 0 6px 0' }}>
        {problem.problem || problem.description}
      </p>

      {/* Disclosures: Hint & Approach */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
        {problem.hint && (
          <button
            type="button"
            onClick={() => setShowHint(prev => !prev)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: showHint ? 'var(--accent-amber-light)' : 'var(--bg-card-subtle)',
              color: 'var(--accent-amber)',
              border: '1px solid var(--accent-amber)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Lightbulb size={12} />
            <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
          </button>
        )}

        {problem.approach && (
          <button
            type="button"
            onClick={() => setShowApproach(prev => !prev)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: showApproach ? 'var(--accent-terracotta-light)' : 'var(--bg-card-subtle)',
              color: 'var(--accent-terracotta)',
              border: '1px solid var(--border-accent)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CheckCircle2 size={12} />
            <span>{showApproach ? 'Hide Approach' : 'Reveal Approach'}</span>
          </button>
        )}
      </div>

      {showHint && problem.hint && (
        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          backgroundColor: 'var(--accent-amber-light)',
          border: '1px solid var(--accent-amber)',
          fontSize: '11.5px',
          color: 'var(--text-charcoal)',
          lineHeight: '1.45',
          marginTop: '4px'
        }}>
          <strong>💡 Hint: </strong>{problem.hint}
        </div>
      )}

      {showApproach && problem.approach && (
        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          backgroundColor: 'var(--accent-terracotta-light)',
          border: '1px solid var(--border-accent)',
          fontSize: '11.5px',
          color: 'var(--text-charcoal)',
          lineHeight: '1.45',
          marginTop: '4px'
        }}>
          <strong>🔍 Optimal Approach: </strong>{problem.approach}
        </div>
      )}
    </div>
  );
}
