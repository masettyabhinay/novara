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
      backgroundColor: '#FAF8F5',
      border: '1px solid #E8E2D9',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(35, 25, 15, 0.03)'
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
            backgroundColor: '#FAF0EB',
            color: '#8B361B',
            border: '1px solid #F2D7CA'
          }}>
            {domain}
          </span>

          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '9999px',
            backgroundColor: difficulty.toLowerCase() === 'hard' ? '#FEF2F2' : difficulty.toLowerCase() === 'medium' ? '#FFFBEB' : '#F0FDF4',
            color: difficulty.toLowerCase() === 'hard' ? '#991B1B' : difficulty.toLowerCase() === 'medium' ? '#92400E' : '#166534',
            border: `1px solid ${difficulty.toLowerCase() === 'hard' ? '#FECACA' : difficulty.toLowerCase() === 'medium' ? '#FDE68A' : '#BBF7D0'}`
          }}>
            {difficulty}
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#64748B',
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
          color: '#C85A32',
          backgroundColor: '#FFFFFF',
          padding: '2px 8px',
          borderRadius: '9999px',
          border: '1px solid #E8E2D9'
        }}>
          <Sparkles size={11} color="#C85A32" />
          <span>Personalized study guide</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h1 style={{
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        fontSize: '20px',
        fontWeight: 800,
        color: '#1E293B',
        letterSpacing: '-0.02em',
        margin: '0 0 4px 0',
        lineHeight: '1.3'
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          fontSize: '12.5px',
          color: '#C85A32',
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
