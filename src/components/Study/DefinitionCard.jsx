import React from 'react';
import { BookOpen, BookmarkCheck } from 'lucide-react';

/**
 * DefinitionCard - Displays key domain vocabulary & definitions.
 */
export default function DefinitionCard({ definitions = [] }) {
  if (!Array.isArray(definitions) || definitions.length === 0) return null;

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
        <BookOpen size={14} color="#C85A32" />
        <span>Essential Terminology & Definitions</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '10px'
      }}>
        {definitions.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E2D9',
              boxShadow: '0 1px 3px rgba(35, 25, 15, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                {item.term || item.name}
              </span>
              {item.context && (
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569'
                }}>
                  {item.context}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.45', margin: 0 }}>
              {item.definition || item.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
