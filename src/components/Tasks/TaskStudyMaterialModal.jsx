import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  X,
  Code2,
  Check,
  Copy,
  Layers,
  Flame,
  Target,
  HelpCircle,
  RefreshCw,
  Zap,
  Compass,
  Cpu,
  BookmarkCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchTaskStudyMaterial } from '../../services/studyMaterialService';
import { useApp } from '../../context/AppContext';
import StudyDiagram from '../Study/StudyDiagram';

export default function TaskStudyMaterialModal({
  isOpen,
  task,
  onClose,
  onStartTask
}) {
  const { activeFocusSession, activeFocusTask } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [material, setMaterial] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  // Section collapse states for long guides
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  useEffect(() => {
    if (!isOpen || !task) {
      setMaterial(null);
      setError(null);
      return;
    }

    let isMounted = true;
    async function loadMaterial() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetchTaskStudyMaterial(task);
        if (!isMounted) return;

        if (res.success && res.material) {
          setMaterial(res.material);
          setIsCached(res.cached || false);
        } else {
          setError(res.error || 'Unable to load study material. Please try again.');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Error loading study material.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMaterial();

    return () => {
      isMounted = false;
    };
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const isCurrentActive = activeFocusSession?.taskId === task.id || activeFocusTask?.id === task.id;

  const handleCopyCode = (codeText, idx) => {
    if (!codeText) return;
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const difficultyColors = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    hard: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const currentDiff = (task.difficulty || 'Medium').toLowerCase();
  const diffBadgeClass = difficultyColors[currentDiff] || difficultyColors.medium;
  const taskDuration = task.estimatedMinutes || task.duration || (task.estimatedDuration ? parseInt(task.estimatedDuration) : 45) || 45;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E8E2D9] overflow-hidden text-[#1E293B]">
        
        {/* MODAL HEADER */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-7 py-3.5 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E8E2D9]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#C85A32]/10 text-[#C85A32] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C85A32]">
                  Study Document
                </span>
                {isCached && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    Instant Cache
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#1E293B] truncate">
                {task.name || task.taskTitle || task.topic || 'Curriculum Concept'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METADATA BAR */}
        <div className="flex flex-wrap items-center gap-2 px-5 sm:px-7 py-2.5 bg-[#F4EFEA] border-b border-[#E8E2D9] text-xs">
          {task.phase && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E0D8CE] text-slate-700 font-medium">
              <Layers className="w-3.5 h-3.5 text-[#C85A32]" />
              {task.phase}
            </span>
          )}
          {task.topic && task.topic !== task.name && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E0D8CE] text-slate-700 font-medium">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              {task.topic}
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-md border font-medium capitalize ${diffBadgeClass}`}>
            {task.difficulty || 'Medium'}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E0D8CE] text-slate-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {taskDuration} mins
          </span>
          {isCurrentActive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-900 font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              In Progress
            </span>
          )}
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-[#C85A32]/20 border-t-[#C85A32] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#C85A32] absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-800 text-base">
                  Preparing your personalized study guide...
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                  Generating verified concepts, algorithmic patterns, code examples, and placement tips.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-12 px-6 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-semibold text-rose-900">Study Material Temporarily Unavailable</h4>
                <p className="text-xs text-rose-700 max-w-md mx-auto">
                  {error || 'Study material is temporarily unavailable. Please try again.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchTaskStudyMaterial(task)
                    .then(res => {
                      if (res.success && res.material) setMaterial(res.material);
                      else setError(res.error || 'Retry failed.');
                    })
                    .finally(() => setLoading(false));
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          ) : material ? (
            <div className="space-y-7 animate-fadeIn">

              {/* 1. OVERVIEW & SUBTITLE */}
              <section className="space-y-2">
                {material.subtitle && (
                  <div className="text-xs sm:text-sm font-semibold text-[#C85A32] uppercase tracking-wide">
                    {material.subtitle}
                  </div>
                )}
                <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E8E2D9] shadow-sm text-slate-800 leading-relaxed text-sm sm:text-base">
                  {material.overview}
                </div>
              </section>

              {/* 2. LEARNING OBJECTIVES */}
              {Array.isArray(material.learningObjectives) && material.learningObjectives.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1E293B]">
                    <Target className="w-4 h-4 text-[#C85A32]" />
                    Learning Objectives
                  </div>
                  <div className="p-4 rounded-xl bg-[#FBF9F6] border border-[#E8E2D9] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {material.learningObjectives.map((obj, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                        <BookmarkCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 3. CORE CONCEPTS & INTUITIONS */}
              {Array.isArray(material.concepts) && material.concepts.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1E293B]">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Core Concepts & Intuition
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {material.concepts.map((concept, idx) => {
                      const matchingDiagram = Array.isArray(material.diagrams)
                        ? material.diagrams.find(d => d.conceptName?.toLowerCase() === concept.name?.toLowerCase() || (concept.name?.toLowerCase().includes(d.conceptName?.toLowerCase()) && d.conceptName))
                        : null;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white border border-[#E8E2D9] shadow-sm hover:border-[#C85A32]/40 transition-colors space-y-2.5"
                        >
                          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                            <span className="w-5 h-5 rounded-full bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span>{concept.name}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {concept.explanation}
                          </p>
                          {concept.intuition && (
                            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11.5px] text-amber-950 leading-relaxed">
                              <span className="font-semibold text-amber-800">💡 Intuition: </span>
                              {concept.intuition}
                            </div>
                          )}

                          {/* Contextual Visual Diagram */}
                          {matchingDiagram && (
                            <StudyDiagram diagram={matchingDiagram} />
                          )}

                          {concept.example && (
                            <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                              <span className="font-sans font-semibold text-slate-700">Example: </span>
                              {concept.example}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Standalone Unmatched Diagrams */}
                  {Array.isArray(material.diagrams) && material.diagrams.filter(d => !material.concepts?.some(c => c.name?.toLowerCase() === d.conceptName?.toLowerCase() || (c.name?.toLowerCase().includes(d.conceptName?.toLowerCase()) && d.conceptName))).map((diag, idx) => (
                    <div key={diag.id || idx} className="mt-3">
                      <StudyDiagram diagram={diag} />
                    </div>
                  ))}
                </section>
              )}

              {/* 4. ALGORITHMIC / ARCHITECTURAL PATTERNS */}
              {Array.isArray(material.patterns) && material.patterns.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1E293B]">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    Problem-Solving Patterns
                  </div>
                  <div className="space-y-3">
                    {material.patterns.map((pat, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white border border-[#E8E2D9] shadow-sm space-y-2">
                        <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          {pat.name}
                        </div>
                        {pat.whenToUse && (
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold text-indigo-900">When to use: </span>
                            {pat.whenToUse}
                          </div>
                        )}
                        {pat.howItWorks && (
                          <div className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">How it works: </span>
                            {pat.howItWorks}
                          </div>
                        )}
                        {pat.example && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            <span className="font-sans font-semibold text-slate-700">Classic problems: </span>
                            {pat.example}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 5. STEP-BY-STEP APPROACH */}
              {Array.isArray(material.stepByStep) && material.stepByStep.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1E293B]">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Step-by-Step Problem Solving Strategy
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#E8E2D9] shadow-sm space-y-2.5">
                    {material.stepByStep.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                        <div className="mt-0.5 min-w-[20px] h-5 rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center text-[11px] font-bold">
                          {idx + 1}
                        </div>
                        <p className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 6. CODE EXAMPLES WITH COMPLEXITY BREAKDOWNS */}
              {Array.isArray(material.codeExamples) && material.codeExamples.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1E293B]">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    Code Implementations & Complexity
                  </div>
                  <div className="space-y-4">
                    {material.codeExamples.map((ex, idx) => (
                      <div key={idx} className="rounded-xl border border-[#E8E2D9] bg-white overflow-hidden shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#F7F4F0] border-b border-[#E8E2D9]">
                          <span className="font-bold text-xs sm:text-sm text-slate-800">
                            {ex.title || `Implementation ${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-2">
                            {ex.complexity?.time && (
                              <span className="px-2 py-0.5 text-[10.5px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                                Time: {ex.complexity.time}
                              </span>
                            )}
                            {ex.complexity?.space && (
                              <span className="px-2 py-0.5 text-[10.5px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded">
                                Space: {ex.complexity.space}
                              </span>
                            )}
                            {ex.code && (
                              <button
                                onClick={() => handleCopyCode(ex.code, idx)}
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors"
                              >
                                {copiedCodeIdx === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-500" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        {ex.explanation && (
                          <div className="px-4 py-2 text-xs text-slate-600 bg-[#FCFBF9] border-b border-[#F0EBE3]">
                            {ex.explanation}
                          </div>
                        )}
                        {ex.code && (
                          <pre className="p-4 bg-[#1E293B] text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
                            <code>{ex.code}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 7. WORKED EXAMPLES */}
              {Array.isArray(material.workedExamples) && material.workedExamples.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1E293B]">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    Worked Problem Walkthroughs
                  </div>
                  <div className="space-y-3">
                    {material.workedExamples.map((w, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 shadow-sm space-y-2">
                        <div className="font-bold text-sm text-purple-950">
                          {w.title}
                        </div>
                        {w.problem && (
                          <div className="text-xs text-slate-800">
                            <span className="font-semibold text-purple-900">Problem: </span>
                            {w.problem}
                          </div>
                        )}
                        {w.approach && (
                          <div className="text-xs text-slate-700">
                            <span className="font-semibold text-purple-900">Approach: </span>
                            {w.approach}
                          </div>
                        )}
                        {w.solution && (
                          <div className="text-xs text-purple-900 font-mono pt-1">
                            <span className="font-sans font-semibold">Solution detail: </span>
                            {w.solution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 8. COMMON MISTAKES */}
              {Array.isArray(material.commonMistakes) && material.commonMistakes.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Common Pitfalls & Mistakes to Avoid
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                    {material.commonMistakes.map((mistake, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-900">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <p className="leading-relaxed">{mistake}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 9. INTERVIEW TIPS */}
              {Array.isArray(material.interviewTips) && material.interviewTips.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#C85A32]">
                    <Flame className="w-4 h-4" />
                    Interview Tips & Best Practices
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF0EB] border border-[#F2D7CA] space-y-2">
                    {material.interviewTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#8B361B]">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#C85A32] shrink-0" />
                        <p className="leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 10. PLACEMENT RELEVANCE */}
              {material.placementRelevance && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#C85A32]">
                    <Sparkles className="w-4 h-4" />
                    Placement & Company Relevance
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#E8E2D9] text-xs sm:text-sm text-slate-700 leading-relaxed shadow-sm">
                    {material.placementRelevance}
                  </div>
                </section>
              )}

              {/* 11. QUICK RECAP & KEY TAKEAWAYS */}
              {((Array.isArray(material.keyTakeaways) && material.keyTakeaways.length > 0) || (Array.isArray(material.quickRecap) && material.quickRecap.length > 0)) && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Quick Recap & Key Takeaways
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    {(material.keyTakeaways || material.quickRecap).map((recap, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-emerald-950">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{recap}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          ) : null}
        </div>

        {/* MODAL ACTION FOOTER (STICKY) */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between px-5 sm:px-7 py-3.5 bg-[#FAF8F5]/95 backdrop-blur border-t border-[#E8E2D9]">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-[#D5CDBD] rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={() => {
              onClose();
              if (onStartTask) onStartTask(task);
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#C85A32] hover:bg-[#B04C26] active:scale-[0.98] rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <span>{isCurrentActive ? 'Continue Task' : 'Start Task'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
