import React from 'react';
import { BookOpen } from 'lucide-react';

/**
 * StudyProgress - Sticky reading progress bar & touch-friendly horizontal section jump navigation.
 * Note: Reading progress is purely for study orientation and does not mark the task complete.
 */
export default function StudyProgress({
  sections = [],
  activeSection = '',
  readingProgress = 0,
  onJumpToSection
}) {
  const roundedProgress = Math.min(100, Math.max(0, Math.round(readingProgress)));

  return (
    <div 
      className="study-progress-sticky-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E2D9',
        borderRadius: '10px',
        padding: '8px 12px',
        marginBottom: '14px',
        boxShadow: '0 2px 8px rgba(35, 25, 15, 0.04)',
        boxSizing: 'border-box'
      }}
    >
      {/* Progress Track */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#64748B'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={12} color="#C85A32" />
          <span style={{ color: 'var(--text-charcoal)', fontWeight: 800 }}>Reading Progress</span>
        </div>
        <span style={{ color: roundedProgress >= 100 ? 'var(--accent-sage)' : '#C85A32', fontWeight: 800 }}>
          {roundedProgress}%
        </span>
      </div>

      <div style={{
        width: '100%',
        height: '5px',
        backgroundColor: '#F1EFEA',
        borderRadius: '9999px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{
          width: `${roundedProgress}%`,
          height: '100%',
          backgroundColor: roundedProgress >= 100 ? 'var(--accent-sage)' : '#C85A32',
          borderRadius: '9999px',
          transition: 'width 200ms ease'
        }} />
      </div>

      {/* Quick Jump Section Pills (Horizontally scrollable with touch momentum) */}
      {sections.length > 0 && (
        <div 
          className="study-tabs-scroll-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            padding: '2px 0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain'
          }}
        >
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onJumpToSection && onJumpToSection(sec.id)}
                className={`study-tab-pill ${isActive ? 'active' : ''}`}
                style={{
                  padding: '4px 11px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: `1px solid ${isActive ? '#C85A32' : '#E2D8CC'}`,
                  backgroundColor: isActive ? '#C85A32' : '#FAF8F5',
                  color: isActive ? '#FFFFFF' : '#475569',
                  transition: 'all 150ms ease',
                  boxShadow: isActive ? '0 2px 6px rgba(200, 90, 50, 0.2)' : 'none'
                }}
              >
                {sec.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
