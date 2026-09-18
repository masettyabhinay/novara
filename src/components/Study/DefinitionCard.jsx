import React from 'react';
import { BookOpen, BookmarkCheck } from 'lucide-react';

/**
 * DefinitionCard - Displays key domain vocabulary & definitions.
 */
export default function DefinitionCard({ definitions = [] }) {
  if (!Array.isArray(definitions) || definitions.length === 0) return null;

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
        <BookOpen size={14} color="var(--accent-terracotta)" style={{ flexShrink: 0 }} />
        <span>Essential Terminology & Definitions</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
        gap: '10px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {definitions.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              boxShadow: '0 1px 3px rgba(35, 25, 15, 0.02)',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {item.term || item.name}
              </span>
              {item.context && (
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  color: 'var(--text-muted)'
                }}>
                  {item.context}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0 }}>
              {item.definition || item.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
