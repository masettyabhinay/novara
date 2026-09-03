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
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');
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

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const scrollTop = el.scrollTop || window.scrollY;
      const scrollHeight = (el.scrollHeight || document.documentElement.scrollHeight) - (el.clientHeight || window.innerHeight);
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        setReadingProgress(progress);
      }
    };

    const targetEl = containerRef.current || window;
    targetEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => targetEl.removeEventListener('scroll', handleScroll);
  }, []);

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
        lineHeight: '1.6'
      }}
    >
      {/* 1. DOCUMENT HEADER */}
      <StudyDocumentHeader
        task={task}
        material={material}
        estimatedMinutes={estimatedMinutes}
        isCached={isCached}
      />

      {/* 2. STICKY READING PROGRESS & SECTION JUMP */}
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
          boxShadow: '0 1px 3px rgba(35, 25, 15, 0.02)'
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
        <div>
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
            gap: '8px'
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
        <div id="sec-definitions">
          <DefinitionCard definitions={material.definitions} />
        </div>
      )}

      {material.formulas && material.formulas.length > 0 && (
        <div id="sec-formulas">
          <FormulaCard formulas={material.formulas} />
        </div>
      )}

      {/* 6. CORE CONCEPTS & CONTEXTUAL DIAGRAMS */}
      {Array.isArray(material.concepts) && material.concepts.length > 0 && (
        <div id="sec-concepts">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '10px' }}>
            <Zap size={14} color="#D97706" />
            <span>Core Concepts & Mechanisms</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    gap: '8px'
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
            <div key={diag.id || idx} style={{ marginTop: '12px' }}>
              <StudyDiagram diagram={diag} />
            </div>
          ))}
        </div>
      )}

      {/* 7. PATTERNS */}
      {Array.isArray(material.patterns) && material.patterns.length > 0 && (
        <div id="sec-patterns">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '10px' }}>
            <Compass size={14} color="#4F46E5" />
            <span>Problem-Solving Patterns</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {material.patterns.map((pat, idx) => (
              <div key={idx} style={{
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
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
        <div id="sec-code">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-charcoal)', marginBottom: '10px' }}>
            <Code2 size={14} color="#059669" />
            <span>Idiomatic Implementations & Complexity</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(material.codeExamples || material.examples || []).map((ex, idx) => (
              <div key={idx} style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                backgroundColor: '#1E293B',
                color: '#F8FAFC'
              }}>
                {/* Code Header with Copy and Complexity */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  backgroundColor: '#0F172A',
                  borderBottom: '1px solid #334155'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#E2E8F0' }}>{ex.title || 'Implementation'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {ex.complexity?.time && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#334155', color: '#93C5FD' }}>
                        Time: {ex.complexity.time}
                      </span>
                    )}
                    {ex.complexity?.space && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#334155', color: '#86EFAC' }}>
                        Space: {ex.complexity.space}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCodeForTutor(ex.code);
                        handleJumpToSection('sec-ask-tutor');
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        backgroundColor: 'rgba(200, 90, 50, 0.2)',
                        color: '#FED7AA',
                        border: '1px solid rgba(200, 90, 50, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Explain this code in Ask NOVARA"
                    >
                      <Sparkles size={11} color="var(--accent-terracotta)" />
                      <span>Explain Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(ex.code, idx)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        backgroundColor: copiedIndex === idx ? '#059669' : '#334155',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {copiedIndex === idx ? <Check size={11} /> : <Copy size={11} />}
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
                  overflowX: 'auto'
                }}>
                  <code>{ex.code}</code>
                </pre>

                {ex.explanation && (
                  <div style={{ padding: '8px 14px', backgroundColor: '#0F172A', fontSize: '11px', color: '#94A3B8', borderTop: '1px solid #334155' }}>
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
        <div id="sec-practice">
          <PracticeProblemCard problems={material.practiceProblems} />
        </div>
      )}

      {/* 10. SELF-CHECK QUESTIONS */}
      {material.selfCheckQuestions && material.selfCheckQuestions.length > 0 && (
        <div id="sec-selfcheck">
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
      <div id="sec-ask-tutor">
        <StudyTutor
          task={task}
          material={material}
          onStartQuiz={onStartQuiz}
          activeCodeSnippet={activeCodeForTutor}
          onClearCodeSnippet={() => setActiveCodeForTutor(null)}
        />
      </div>

      {/* 13. COMMON MISTAKES & RECAP */}
      <div id="sec-recap" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              gap: '6px'
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
              gap: '6px'
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
    </div>
  );
}
