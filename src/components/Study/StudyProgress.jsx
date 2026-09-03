import React, { useState, useEffect } from 'react';
import { BookOpen, Compass, Code2, Target, CheckCircle2, Zap, HelpCircle } from 'lucide-react';

/**
 * StudyProgress - Sticky reading progress bar & section jump navigation.
 * Note: Reading progress is purely for study orientation and does not mark the task complete.
 */
export default function StudyProgress({
  sections = [],
  activeSection = '',
  readingProgress = 0,
  onJumpToSection
}) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 20,
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E8E2D9',
      padding: '8px 12px',
      marginBottom: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(35, 25, 15, 0.04)'
    }}>
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
          <span>Study Progress</span>
        </div>
        <span style={{ color: '#1E293B', fontWeight: 800 }}>{Math.round(readingProgress)}%</span>
      </div>

      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: '#F1F5F9',
        borderRadius: '9999px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{
          width: `${Math.min(100, Math.max(0, readingProgress))}%`,
          height: '100%',
          backgroundColor: '#C85A32',
          borderRadius: '9999px',
          transition: 'width 150ms ease'
        }} />
      </div>

      {/* Quick Jump Section Pills */}
      {sections.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none'
        }}>
          {sections.map(sec => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onJumpToSection && onJumpToSection(sec.id)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? '#C85A32' : '#E2D8CC'}`,
                  backgroundColor: isActive ? '#C85A32' : '#FAF8F5',
                  color: isActive ? '#FFFFFF' : '#475569',
                  transition: 'all 150ms ease'
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
