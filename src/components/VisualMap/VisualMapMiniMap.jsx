import React from 'react';

/**
 * VisualMapMiniMap — Compact overview thumbnail / phase navigator for large roadmap trees.
 */
export default function VisualMapMiniMap({
  phases = [],
  activePhaseId = null,
  onSelectPhase
}) {
  if (!Array.isArray(phases) || phases.length <= 1) return null;

  return (
    <nav
      aria-label="Roadmap phase navigator"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-beige)',
        maxWidth: '100%'
      }}
    >
      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', flexShrink: 0 }}>
        Phases:
      </span>
      <button
        type="button"
        onClick={() => onSelectPhase && onSelectPhase(null)}
        style={{
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 700,
          borderRadius: '9999px',
          border: `1px solid ${!activePhaseId ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
          backgroundColor: !activePhaseId ? 'var(--accent-terracotta)' : 'var(--bg-card)',
          color: !activePhaseId ? 'var(--text-on-accent, var(--bg-card))' : 'var(--text-secondary)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          minHeight: '28px',
          transition: 'all 150ms ease'
        }}
        aria-current={!activePhaseId ? 'true' : undefined}
      >
        All Phases
      </button>
      {phases.map((p, idx) => {
        const isSelected = activePhaseId === p.id;
        const isCompleted = p.status === 'completed' || p.topics?.every(t => t.status === 'completed');

        return (
          <button
            key={p.id || idx}
            type="button"
            onClick={() => onSelectPhase && onSelectPhase(p.id)}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '9999px',
              border: `1px solid ${isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
              backgroundColor: isSelected ? 'var(--accent-terracotta)' : isCompleted ? 'var(--accent-sage-light, rgba(94, 140, 113, 0.12))' : 'var(--bg-card)',
              color: isSelected ? 'var(--text-on-accent, var(--bg-card))' : isCompleted ? 'var(--accent-sage)' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minHeight: '28px',
              transition: 'all 150ms ease'
            }}
            aria-current={isSelected ? 'true' : undefined}
          >
            P{p.number || idx + 1}
          </button>
        );
      })}
    </nav>
  );
}
