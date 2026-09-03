import React, { useState } from 'react';
import { Target, HelpCircle, ChevronDown, ChevronUp, Lightbulb, CheckCircle2 } from 'lucide-react';

/**
 * PracticeProblemCard - Interactive task-specific practice problems with Hint & Approach toggles.
 */
export default function PracticeProblemCard({ problems = [] }) {
  if (!Array.isArray(problems) || problems.length === 0) return null;

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
        <Target size={15} color="#C85A32" />
        <span>Grounded Practice Challenges</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      backgroundColor: '#FFFFFF',
      border: '1px solid #E8E2D9',
      boxShadow: '0 1px 3px rgba(35, 25, 15, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Title & Difficulty */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#FAF0EB',
            color: '#C85A32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 800
          }}>
            {index + 1}
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>
            {problem.title}
          </span>
        </div>

        <span style={{
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          padding: '2px 7px',
          borderRadius: '4px',
          backgroundColor: difficulty.toLowerCase() === 'hard' ? '#FEF2F2' : difficulty.toLowerCase() === 'medium' ? '#FFFBEB' : '#F0FDF4',
          color: difficulty.toLowerCase() === 'hard' ? '#991B1B' : difficulty.toLowerCase() === 'medium' ? '#92400E' : '#166534',
          border: `1px solid ${difficulty.toLowerCase() === 'hard' ? '#FECACA' : difficulty.toLowerCase() === 'medium' ? '#FDE68A' : '#BBF7D0'}`
        }}>
          {difficulty}
        </span>
      </div>

      {problem.skillTested && (
        <div style={{ fontSize: '11px', color: '#64748B' }}>
          <strong>Skill tested: </strong>{problem.skillTested}
        </div>
      )}

      {/* Problem Statement */}
      <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.55', margin: '2px 0 6px 0' }}>
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
              backgroundColor: showHint ? '#FEF3C7' : '#FAF8F5',
              color: '#92400E',
              border: '1px solid #FCD34D',
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
              backgroundColor: showApproach ? '#EEF2FF' : '#FAF8F5',
              color: '#3730A3',
              border: '1px solid #C7D2FE',
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
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          fontSize: '11.5px',
          color: '#92400E',
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
          backgroundColor: '#EEF2FF',
          border: '1px solid #C7D2FE',
          fontSize: '11.5px',
          color: '#312E81',
          lineHeight: '1.45',
          marginTop: '4px'
        }}>
          <strong>🔍 Optimal Approach: </strong>{problem.approach}
        </div>
      )}
    </div>
  );
}
