import React from 'react';
import { BookOpen } from 'lucide-react';

/**
 * StudyProgress - Responsive reading progress bar & touch-friendly horizontal section jump navigation.
 * Note: Reading progress is for study orientation and does not alter task completion state.
 */
export default function StudyProgress({
  sections = [],
  activeSection = '',
  readingProgress = 0,
  onJumpToSection
}) {
  const progress = readingProgress;
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div 
      className="study-progress-sticky-nav"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-beige)',
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(35, 25, 15, 0.04)',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0
      }}
    >
      {/* Row 1: Study Progress Header & Real Percentage */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <BookOpen size={14} color="var(--accent-terracotta)" />
          <span style={{ color: 'var(--text-charcoal)', fontWeight: 800, fontSize: '12.5px' }}>Study Progress</span>
        </div>
        <span style={{ color: roundedProgress >= 100 ? 'var(--accent-sage)' : 'var(--accent-terracotta)', fontWeight: 800, fontSize: '12.5px' }}>
          {roundedProgress}%
        </span>
      </div>

      {/* Progress Track */}
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: 'var(--border-beige)',
        borderRadius: '9999px',
        overflow: 'hidden',
        marginBottom: '10px'
      }}>
        <div style={{
          width: `${roundedProgress}%`,
          height: '100%',
          backgroundColor: roundedProgress >= 100 ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
          borderRadius: '9999px',
          transition: 'width 250ms ease'
        }} />
      </div>

      {/* Row 2: Quick Jump Topic Navigation Pills (Horizontally scrollable on one row) */}
      {sections.length > 0 && (
        <div 
          className="study-tabs-scroll-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '2px 0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            flexWrap: 'nowrap',
            width: '100%'
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
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0,
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${isActive ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                  backgroundColor: isActive ? 'var(--accent-terracotta)' : 'var(--bg-card-subtle)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
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
