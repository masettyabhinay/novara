import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, ChevronRight, Zap, RefreshCw, MessageSquare } from 'lucide-react';

/**
 * StudyInteractiveActions - Lightweight interactive actions grounded in the current task.
 * "Test me" connects directly to the authoritative task-specific revision quiz.
 */
export default function StudyInteractiveActions({
  task,
  material,
  onStartQuiz,
  onExplainSimpler,
  onGiveAnotherExample
}) {
  const [activeModal, setActiveModal] = useState(null);
  const [simplifiedExplanation, setSimplifiedExplanation] = useState(null);

  const handleSimplerClick = () => {
    if (material?.overview) {
      setSimplifiedExplanation(
        `In simple terms: ${material.title} is like a structured way to solve problems without doing wasted work. ${material.overview}`
      );
      setActiveModal('simpler');
    }
  };

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '12px',
      backgroundColor: '#FAF8F5',
      border: '1px solid #E8E2D9',
      margin: '18px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
          <Sparkles size={13} color="#C85A32" />
          <span>Interactive AI Study Tools</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Simpler Explanation */}
        <button
          type="button"
          onClick={handleSimplerClick}
          style={{
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '11.5px',
            fontWeight: 700,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            color: '#334155',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 1px 2px rgba(35, 25, 15, 0.03)'
          }}
        >
          <Zap size={12} color="#D97706" />
          <span>Explain simpler</span>
        </button>

        {/* Test Me (Triggers Task Revision Quiz) */}
        {onStartQuiz && (
          <button
            type="button"
            onClick={onStartQuiz}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: 800,
              backgroundColor: '#C85A32',
              border: '1px solid #C85A32',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(200, 90, 50, 0.25)'
            }}
          >
            <CheckCircle2 size={13} />
            <span>Test me (5-Question Quiz) →</span>
          </button>
        )}
      </div>

      {activeModal === 'simpler' && simplifiedExplanation && (
        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2D8CC',
          fontSize: '12px',
          color: '#1E293B',
          lineHeight: '1.5',
          marginTop: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ color: '#C85A32' }}>💡 Plain-English Summary:</strong>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              style={{
                fontSize: '10px',
                color: '#64748B',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
          <p style={{ margin: 0 }}>{simplifiedExplanation}</p>
        </div>
      )}
    </div>
  );
}
