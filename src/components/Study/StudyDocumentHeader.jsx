import React from 'react';
import { Sparkles, Clock, Layers, BookOpen, CheckCircle2, Award } from 'lucide-react';

/**
 * StudyDocumentHeader - Clean, structured header for NOVARA Deep Study Guides.
 * Displays task metadata, domain, difficulty, duration, and personalized indicator.
 */
export default function StudyDocumentHeader({
  task,
  material,
  estimatedMinutes = 45,
  isCached = false
}) {
  const title = material?.title || task?.name || task?.taskTitle || 'Curriculum Concept';
  const subtitle = material?.subtitle || '';
  const domain = material?.domain || task?.category || 'DSA';
  const difficulty = task?.difficulty || 'Medium';

  return (
    <div style={{
      padding: '16px 18px',
      borderRadius: '12px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-beige)',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(35, 25, 15, 0.03)',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      {/* Top Meta Row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '3px 8px',
            borderRadius: '9999px',
            backgroundColor: 'var(--accent-terracotta-light)',
            color: 'var(--accent-terracotta)',
            border: '1px solid var(--border-accent)'
          }}>
            {domain}
          </span>

          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '9999px',
            backgroundColor: difficulty.toLowerCase() === 'hard' ? 'rgba(239, 68, 68, 0.12)' : difficulty.toLowerCase() === 'medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)',
            color: difficulty.toLowerCase() === 'hard' ? 'var(--accent-terracotta)' : difficulty.toLowerCase() === 'medium' ? 'var(--accent-amber)' : 'var(--accent-sage)',
            border: `1px solid ${difficulty.toLowerCase() === 'hard' ? 'rgba(239, 68, 68, 0.25)' : difficulty.toLowerCase() === 'medium' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`
          }}>
            {difficulty}
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            paddingLeft: '4px'
          }}>
            <Clock size={13} />
            <span>{estimatedMinutes} min study plan</span>
          </div>
        </div>

        {/* AI Personalized Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent-terracotta)',
          backgroundColor: 'var(--bg-card-subtle)',
          padding: '2px 8px',
          borderRadius: '9999px',
          border: '1px solid var(--border-beige)'
        }}>
          <Sparkles size={11} color="var(--accent-terracotta)" />
          <span>Personalized study guide</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h1 style={{
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        fontSize: '20px',
        fontWeight: 800,
        color: 'var(--text-charcoal)',
        letterSpacing: '-0.02em',
        margin: '0 0 4px 0',
        lineHeight: '1.3',
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          fontSize: '12.5px',
          color: 'var(--accent-terracotta)',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '0.01em'
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
