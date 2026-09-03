import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  ArrowDown,
  ArrowLeftRight,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Info,
  Maximize2,
  Sparkles,
  Check
} from 'lucide-react';

/**
 * Generic Visual Diagram Component for NOVARA Study Guides
 * Supports: flow | sequence | structure | algorithm | comparison | architecture | data-structure
 * Provides interactive step-by-step stepper, accessible descriptions, and clean SVG/HTML cards.
 */
export default function StudyDiagram({ diagram }) {
  if (!diagram || typeof diagram !== 'object') return null;

  const {
    title = 'Visual Concept Diagram',
    purpose,
    type = 'algorithm',
    description,
    elements = [],
    connections = [],
    steps = []
  } = diagram;

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  const hasSteps = Array.isArray(steps) && steps.length > 0;
  const currentStep = hasSteps ? steps[currentStepIdx] : null;

  const activeElementIds = new Set(
    currentStep?.activeElementIds || (elements.filter(e => e.highlight).map(e => e.id))
  );

  const handleNextStep = () => {
    if (!hasSteps) return;
    setCurrentStepIdx(prev => (prev + 1) % steps.length);
  };

  const handlePrevStep = () => {
    if (!hasSteps) return;
    setCurrentStepIdx(prev => (prev - 1 + steps.length) % steps.length);
  };

  const handleResetStep = () => {
    setCurrentStepIdx(0);
  };

  return (
    <figure
      className="my-3.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] overflow-hidden shadow-sm"
      aria-label={title}
      style={{
        margin: '12px 0',
        borderRadius: '12px',
        border: '1px solid #E8E2D9',
        backgroundColor: '#FAF8F5',
        overflow: 'hidden'
      }}
    >
      {/* DIAGRAM HEADER */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: '#F5EFE6',
          borderBottom: '1px solid #E8E2D9',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(200, 90, 50, 0.12)',
            color: '#C85A32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 800,
            flexShrink: 0
          }}>
            <Layers size={13} />
          </div>
          <div>
            <figcaption style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              {title}
            </figcaption>
            {purpose && (
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                {purpose}
              </span>
            )}
          </div>
        </div>

        {/* Type Tag & Step Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2D8CC',
            color: '#475569'
          }}>
            {type}
          </span>

          {hasSteps && (
            <button
              type="button"
              onClick={() => setShowSteps(prev => !prev)}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '9999px',
                backgroundColor: showSteps ? '#C85A32' : '#FFFFFF',
                color: showSteps ? '#FFFFFF' : '#C85A32',
                border: '1px solid #C85A32',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Play size={10} fill={showSteps ? '#FFFFFF' : 'none'} />
              <span>{showSteps ? 'Hide steps' : 'Show steps'}</span>
            </button>
          )}
        </div>
      </div>

      {/* DIAGRAM CANVAS / RENDERER BODY */}
      <div style={{ padding: '16px', backgroundColor: '#FFFFFF' }}>
        
        {/* TYPE 1: ALGORITHM & DATA STRUCTURE (Array cell layout with animated pointers) */}
        {(type === 'algorithm' || type === 'data-structure' || type === 'array') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            
            {/* Array Cells Row */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#FAF8F5',
              borderRadius: '10px',
              border: '1px solid #E8E2D9'
            }}>
              {elements.map((el, idx) => {
                const isActive = activeElementIds.has(el.id);
                return (
                  <div
                    key={el.id || idx}
                    style={{
                      minWidth: '44px',
                      height: '52px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      backgroundColor: isActive ? 'rgba(200, 90, 50, 0.12)' : '#FFFFFF',
                      border: `1.5px solid ${isActive ? '#C85A32' : '#CBD5E1'}`,
                      boxShadow: isActive ? '0 0 8px rgba(200, 90, 50, 0.25)' : 'none',
                      transition: 'all 200ms ease',
                      padding: '2px 6px'
                    }}
                  >
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '14px',
                      fontWeight: 800,
                      color: isActive ? '#C85A32' : '#1E293B'
                    }}>
                      {el.label}
                    </span>
                    {el.sublabel && (
                      <span style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>
                        {el.sublabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pointer Indicators (if present in active step or elements) */}
            {currentStep?.pointerState && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                {Object.entries(currentStep.pointerState).map(([ptrKey, ptrVal]) => (
                  <span
                    key={ptrKey}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#FAF0EB',
                      color: '#8B361B',
                      border: '1px solid #F2D7CA'
                    }}
                  >
                    <span style={{ textTransform: 'uppercase', color: '#C85A32' }}>{ptrKey}:</span> {ptrVal}
                  </span>
                ))}
              </div>
            )}

            {/* Connections & Transformations */}
            {connections.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {connections.map((conn, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{conn.from}</span>
                    <ArrowRight size={12} color="#64748B" />
                    <span style={{ fontWeight: 700 }}>{conn.to}</span>
                    {conn.label && <span style={{ color: '#0F172A', fontStyle: 'italic' }}>({conn.label})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TYPE 2: STRUCTURE & LINKED LIST / GRAPH (Nodes with connected pointers) */}
        {(type === 'structure' || type === 'linked-list') && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 4px'
          }}>
            {elements.map((el, idx) => {
              const isActive = activeElementIds.has(el.id);
              const isLast = idx === elements.length - 1;
              return (
                <React.Fragment key={el.id || idx}>
                  <div
                    style={{
                      minWidth: '60px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? 'rgba(200, 90, 50, 0.1)' : '#FAF8F5',
                      border: `1.5px solid ${isActive ? '#C85A32' : '#CBD5E1'}`,
                      textAlign: 'center',
                      boxShadow: isActive ? '0 0 8px rgba(200, 90, 50, 0.2)' : '0 1px 3px rgba(35, 25, 15, 0.04)'
                    }}
                  >
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                      {el.label}
                    </div>
                    {el.sublabel && (
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                        {el.sublabel}
                      </div>
                    )}
                  </div>

                  {!isLast && (
                    <div style={{ display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                      <ArrowRight size={16} strokeWidth={2.5} color="#C85A32" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* TYPE 3: SEQUENCE (Step by step protocol / TCP Handshake / Request flow) */}
        {type === 'sequence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '440px', margin: '0 auto' }}>
            {connections.length > 0 ? (
              connections.map((conn, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#FAF8F5',
                    border: '1px solid #E8E2D9',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#1E293B' }}>{conn.from}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C85A32', fontWeight: 700 }}>
                    <span>{conn.label || '─►'}</span>
                    <ArrowRight size={13} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#1E293B' }}>{conn.to}</span>
                </div>
              ))
            ) : (
              elements.map((el, idx) => (
                <div
                  key={el.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: activeElementIds.has(el.id) ? 'rgba(200, 90, 50, 0.1)' : '#FAF8F5',
                    border: `1px solid ${activeElementIds.has(el.id) ? '#C85A32' : '#E8E2D9'}`
                  }}
                >
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#C85A32',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800
                  }}>
                    {idx + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>{el.label}</div>
                    {el.sublabel && <div style={{ fontSize: '10.5px', color: '#64748B' }}>{el.sublabel}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TYPE 4: FLOW & ARCHITECTURE (Cards with hierarchical or networked connections) */}
        {(type === 'flow' || type === 'architecture' || type === 'comparison') && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${type === 'comparison' ? '180px' : '140px'}, 1fr))`,
            gap: '10px'
          }}>
            {elements.map((el, idx) => {
              const isActive = activeElementIds.has(el.id);
              return (
                <div
                  key={el.id || idx}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(200, 90, 50, 0.08)' : '#FAF8F5',
                    border: `1.5px solid ${isActive ? '#C85A32' : '#E2E8F0'}`,
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(35, 25, 15, 0.03)'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                    {el.label}
                  </div>
                  {el.sublabel && (
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', lineHeight: '1.4' }}>
                      {el.sublabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* INTERACTIVE STEP-BY-STEP CONTROLLER */}
      {hasSteps && showSteps && currentStep && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#FFFDF9',
          borderTop: '1px solid #E8E2D9',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#C85A32',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Step {currentStep.step || (currentStepIdx + 1)} of {steps.length}:
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>
                {currentStep.title}
              </span>
            </div>

            {/* Stepper Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIdx === 0}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: currentStepIdx === 0 ? '#F1F5F9' : '#FFFFFF',
                  color: currentStepIdx === 0 ? '#94A3B8' : '#1E293B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentStepIdx === 0 ? 'not-allowed' : 'pointer'
                }}
                title="Previous step"
              >
                <ChevronLeft size={14} />
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: '1px solid #C85A32',
                  backgroundColor: '#C85A32',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
                title="Next step"
              >
                <span>{currentStepIdx === steps.length - 1 ? 'Restart' : 'Next'}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {currentStep.description && (
            <p style={{
              fontSize: '12px',
              color: '#475569',
              lineHeight: '1.5',
              margin: 0,
              paddingLeft: '2px'
            }}>
              {currentStep.description}
            </p>
          )}
        </div>
      )}

      {/* ACCESSIBLE DESCRIPTION FOOTER */}
      {description && (
        <div style={{
          padding: '8px 14px',
          backgroundColor: '#FAF8F5',
          borderTop: '1px solid #E8E2D9',
          fontSize: '11.5px',
          color: '#64748B',
          lineHeight: '1.45'
        }}>
          <strong style={{ color: '#334155' }}>Visual summary: </strong>
          {description}
        </div>
      )}
    </figure>
  );
}
