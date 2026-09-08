import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Target,
  Zap,
  Compass,
  Code2,
  BookmarkCheck,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Award,
  Layers,
  Sparkles,
  RefreshCw,
  Sigma
} from 'lucide-react';
import StudyDocumentHeader from './StudyDocumentHeader';
import StudyProgress from './StudyProgress';
import StudyDiagram from './StudyDiagram';
import AnalogyCard from './AnalogyCard';
import DefinitionCard from './DefinitionCard';
import FormulaCard from './FormulaCard';
import PracticeProblemCard from './PracticeProblemCard';
import SelfCheckCard from './SelfCheckCard';
import StudyInteractiveActions from './StudyInteractiveActions';
import StudyTutor from './StudyTutor';

/**
 * DeepStudyDocument - Complete professional learning document renderer for NOVARA.
 * Integrates overview, objectives, analogies, definitions, formulas, concepts, diagrams,
 * patterns, step-by-step strategies, code examples, practice challenges, self-checks, Ask Tutor, and placement tips.
 */
export default function DeepStudyDocument({
  material,
  task,
  estimatedMinutes = 45,
  isCached = false,
  onStartQuiz
}) {
  if (!material) return null;

  const containerRef = useRef(null);
  
  // Real reading progress persistence per task session
  const storageKey = task?.id ? `novara_study_prog_${task.id}` : null;
  const [readingProgress, setReadingProgress] = useState(() => {
    if (!storageKey) return 0;
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? Math.min(100, Math.max(0, parseInt(saved, 10))) : 0;
    } catch {
      return 0;
    }
  });

  const [activeSection, setActiveSection] = useState('sec-overview');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeCodeForTutor, setActiveCodeForTutor] = useState(null);

  // Available sections for sticky navigation
  const sections = [
    { id: 'sec-overview', label: 'Overview' },
    material.definitions?.length ? { id: 'sec-definitions', label: 'Definitions' } : null,
    material.formulas?.length ? { id: 'sec-formulas', label: 'Formulas' } : null,
    material.concepts?.length ? { id: 'sec-concepts', label: 'Concepts' } : null,
    material.patterns?.length ? { id: 'sec-patterns', label: 'Patterns' } : null,
    (material.codeExamples?.length || material.examples?.length) ? { id: 'sec-code', label: 'Code' } : null,
    material.practiceProblems?.length ? { id: 'sec-practice', label: 'Practice' } : null,
    material.selfCheckQuestions?.length ? { id: 'sec-selfcheck', label: 'Self-Check' } : null,
    { id: 'sec-ask-tutor', label: 'Ask Tutor' },
    { id: 'sec-recap', label: 'Recap' }
  ].filter(Boolean);

  // Track authentic reading progress across ancestor scroll container
  useEffect(() => {
    // Find active scrollable container
    const findScrollContainer = () => {
      let node = containerRef.current?.parentElement;
      while (node && node !== document.body && node !== document.documentElement) {
        if (node.classList.contains('focus-study-grid') || node.classList.contains('focus-study-right-col')) {
          return node;
        }
        const overflowY = window.getComputedStyle(node).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          return node;
        }
        node = node.parentElement;
      }
      return window;
    };

    const scrollTarget = findScrollContainer();
    let rafId = null;

    const calculateProgress = () => {
      if (!containerRef.current) return;

      let pct = 0;
      if (scrollTarget === window) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const maxScroll = scrollHeight - clientHeight;
        pct = maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100))) : 0;
      } else {
        const scrollTop = scrollTarget.scrollTop;
        const scrollHeight = scrollTarget.scrollHeight;
        const clientHeight = scrollTarget.clientHeight;
        const maxScroll = scrollHeight - clientHeight;
        if (maxScroll > 0) {
          pct = Math.min(100, Math.max(0, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)));
        } else {
          pct = 100;
        }
      }

      setReadingProgress(pct);
      if (storageKey && pct > 0) {
        try {
          sessionStorage.setItem(storageKey, String(pct));
        } catch {}
      }
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculateProgress);
    };

    // Calculate initial reading progress
    calculateProgress();

    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        onScroll();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      scrollTarget.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (ro) ro.disconnect();
    };
  }, [task?.id, storageKey]);

  const handleJumpToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyCode = (code, index) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <div
      ref={containerRef}
      className="deep-study-document"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: 'var(--text-charcoal)',
        lineHeight: '1.6',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* 1. DOCUMENT HEADER */}
      <StudyDocumentHeader
        task={task}
        material={material}
        estimatedMinutes={estimatedMinutes}
        isCached={isCached}
      />

      {/* 2. READING PROGRESS & SECTION JUMP */}
      <StudyProgress
        sections={sections}
        activeSection={activeSection}
        readingProgress={readingProgress}
        onJumpToSection={handleJumpToSection}
      />

      {/* 3. OVERVIEW & ANALOGY */}
      <div id="sec-overview" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{
          padding: '16px 18px',
          borderRadius: '12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E2D9',
          fontSize: '13.5px',
          lineHeight: '1.65',
          boxShadow: '0 1px 3px rgba(35, 25, 15, 0.02)',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%'
        }}>
          {material.overview}
        </div>

        {/* Optional Real-World Analogy */}
        {material.realWorldAnalogy && (
          <AnalogyCard analogy={material.realWorldAnalogy} />
        )}
      </div>

      {/* 4. LEARNING OBJECTIVES */}
      {Array.isArray(material.learningObjectives) && material.learningObjectives.length > 0 && (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '8px' }}>
            <Target size={14} color="#C85A32" />
            <span>Learning Objectives</span>
          </div>
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: '#FAF0EB',
            border: '1px solid #F2D7CA',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '8px',
            boxSizing: 'border-box',
            width: '100%'
          }}>
            {material.learningObjectives.map((obj, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#8B361B' }}>
                <BookmarkCheck size={14} color="#2E7D32" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DEFINITIONS & FORMULAS */}
      {material.definitions && material.definitions.length > 0 && (
        <div id="sec-definitions" style={{ width: '100%' }}>
          <DefinitionCard definitions={material.definitions} />
        </div>
      )}

      {material.formulas && material.formulas.length > 0 && (
        <div id="sec-formulas" style={{ width: '100%' }}>
          <FormulaCard formulas={material.formulas} />
        </div>
      )}

      {/* 6. CORE CONCEPTS & CONTEXTUAL DIAGRAMS */}
      {Array.isArray(material.concepts) && material.concepts.length > 0 && (
        <div id="sec-concepts" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '10px' }}>
            <Zap size={14} color="#D97706" />
            <span>Core Concepts & Mechanisms</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {material.concepts.map((concept, idx) => {
              const matchingDiagram = Array.isArray(material.diagrams)
                ? material.diagrams.find(d => d.conceptName?.toLowerCase() === concept.name?.toLowerCase() || (concept.name?.toLowerCase().includes(d.conceptName?.toLowerCase()) && d.conceptName))
                : null;

              return (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E8E2D9',
                    boxShadow: '0 1px 3px rgba(35, 25, 15, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxSizing: 'border-box',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(200, 90, 50, 0.1)',
                      color: '#C85A32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    <span>{concept.name}</span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.55', margin: 0 }}>
                    {concept.explanation}
                  </p>

                  {concept.intuition && (
                    <div style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#FEFDF8',
                      border: '1px solid #FEEBC8',
                      fontSize: '11.5px',
                      color: '#744210',
                      lineHeight: '1.45'
                    }}>
                      <strong>💡 Intuition: </strong>{concept.intuition}
                    </div>
                  )}

                  {/* Contextual Visual Diagram if matched with concept */}
                  {matchingDiagram && (
                    <StudyDiagram diagram={matchingDiagram} />
                  )}

                  {concept.example && (
                    <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', paddingTop: '4px', borderTop: '1px solid #F5EFE6' }}>
                      <span style={{ fontFamily: 'inherit', fontWeight: 700, color: '#334155' }}>Example: </span>
                      {concept.example}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Standalone Unmatched Diagrams */}
          {Array.isArray(material.diagrams) && material.diagrams.filter(d => !material.concepts?.some(c => c.name?.toLowerCase() === d.conceptName?.toLowerCase() || (c.name?.toLowerCase().includes(d.conceptName?.toLowerCase()) && d.conceptName))).map((diag, idx) => (
            <div key={diag.id || idx} style={{ marginTop: '12px', width: '100%' }}>
              <StudyDiagram diagram={diag} />
            </div>
          ))}
        </div>
      )}

      {/* 7. PATTERNS */}
      {Array.isArray(material.patterns) && material.patterns.length > 0 && (
        <div id="sec-patterns" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '10px' }}>
            <Compass size={14} color="#4F46E5" />
            <span>Problem-Solving Patterns</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            {material.patterns.map((pat, idx) => (
              <div key={idx} style={{
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxSizing: 'border-box',
                width: '100%'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{pat.name}</span>
                {pat.whenToUse && (
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>
                    <strong style={{ color: '#0F172A' }}>When to use: </strong>{pat.whenToUse}
                  </div>
                )}
                {pat.howItWorks && (
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>
                    <strong style={{ color: '#0F172A' }}>How it works: </strong>{pat.howItWorks}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. CODE EXAMPLES */}
      {(Array.isArray(material.codeExamples) ? material.codeExamples : material.examples || []).length > 0 && (
        <div id="sec-code" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '10px' }}>
            <Code2 size={14} color="#059669" />
            <span>Idiomatic Implementations & Complexity</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {(material.codeExamples || material.examples || []).map((ex, idx) => (
              <div key={idx} style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                boxSizing: 'border-box',
                width: '100%'
              }}>
                {/* Responsive Code Header */}
                <div className="study-code-header" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#0F172A',
                  borderBottom: '1px solid #334155',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#E2E8F0' }}>{ex.title || 'Implementation'}</span>
                    {ex.complexity?.time && (
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', backgroundColor: '#334155', color: '#93C5FD', fontWeight: 700 }}>
                        Time: {ex.complexity.time}
                      </span>
                    )}
                    {ex.complexity?.space && (
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', backgroundColor: '#334155', color: '#86EFAC', fontWeight: 700 }}>
                        Space: {ex.complexity.space}
                      </span>
                    )}
                  </div>

                  <div className="study-code-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCodeForTutor(ex.code);
                        handleJumpToSection('sec-ask-tutor');
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-pill, 9999px)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(200, 90, 50, 0.2)',
                        color: '#FED7AA',
                        border: '1px solid rgba(200, 90, 50, 0.4)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        minHeight: '44px'
                      }}
                      title="Explain this code in Ask NOVARA"
                    >
                      <Sparkles size={13} color="var(--accent-terracotta)" />
                      <span>Explain Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(ex.code, idx)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-pill, 9999px)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: copiedIndex === idx ? '#059669' : '#334155',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        minHeight: '44px'
                      }}
                    >
                      {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <pre style={{
                  padding: '14px',
                  margin: 0,
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: '1.5',
                  overflowX: 'auto',
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%'
                }}>
                  <code>{ex.code}</code>
                </pre>

                {ex.explanation && (
                  <div style={{ padding: '8px 14px', backgroundColor: '#0F172A', fontSize: '11.5px', color: '#94A3B8', borderTop: '1px solid #334155', lineHeight: '1.45' }}>
                    {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. PRACTICE PROBLEMS */}
      {material.practiceProblems && material.practiceProblems.length > 0 && (
        <div id="sec-practice" style={{ width: '100%' }}>
          <PracticeProblemCard problems={material.practiceProblems} />
        </div>
      )}

      {/* 10. SELF-CHECK QUESTIONS */}
      {material.selfCheckQuestions && material.selfCheckQuestions.length > 0 && (
        <div id="sec-selfcheck" style={{ width: '100%' }}>
          <SelfCheckCard questions={material.selfCheckQuestions} />
        </div>
      )}

      {/* 11. INTERACTIVE ACTIONS */}
      <StudyInteractiveActions
        task={task}
        material={material}
        onStartQuiz={onStartQuiz}
      />

      {/* 12. INTERACTIVE AI TUTOR (ASK NOVARA) */}
      <div id="sec-ask-tutor" style={{ width: '100%' }}>
        <StudyTutor
          task={task}
          material={material}
          onStartQuiz={onStartQuiz}
          activeCodeSnippet={activeCodeForTutor}
          onClearCodeSnippet={() => setActiveCodeForTutor(null)}
        />
      </div>

      {/* 13. COMMON MISTAKES & RECAP */}
      <div id="sec-recap" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {Array.isArray(material.commonMistakes) && material.commonMistakes.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              <AlertTriangle size={14} color="#DC2626" />
              <span>Common Pitfalls to Avoid</span>
            </div>
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              {material.commonMistakes.map((mis, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#991B1B' }}>
                  • {mis}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Recap & Key Takeaways */}
        {((material.quickRecap && material.quickRecap.length > 0) || (material.keyTakeaways && material.keyTakeaways.length > 0)) && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              <BookmarkCheck size={14} color="#059669" />
              <span>High-Yield Recap & Takeaways</span>
            </div>
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              {(material.keyTakeaways || material.quickRecap || []).map((item, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#166534' }}>
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 14. COMPLETION CTA */}
      {onStartQuiz && (
        <div style={{
          marginTop: '16px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <button
            type="button"
            onClick={onStartQuiz}
            className="btn-primary"
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '14px 20px',
              fontSize: '14px',
              fontWeight: 800,
              borderRadius: 'var(--radius-pill, 9999px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(200, 90, 50, 0.25)',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={18} />
            <span>Complete & Start Quiz →</span>
          </button>
        </div>
      )}
    </div>
  );
}
