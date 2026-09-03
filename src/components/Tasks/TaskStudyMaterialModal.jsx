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
import DeepStudyDocument from '../Study/DeepStudyDocument';

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
            <DeepStudyDocument
              material={material}
              task={task}
              estimatedMinutes={task?.durationMinutes || 45}
              isCached={isCached}
              onStartQuiz={() => {
                onClose();
                if (onStartTask) onStartTask(task);
              }}
            />
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
