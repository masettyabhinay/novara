import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  Check,
  Edit3,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  Flame,
  ArrowLeft,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { validateRoadmapFile, parseRoadmapDocument } from '../../services/roadmapParserService';
import { RoadmapEditorModal } from './RoadmapEditorModal';

export const RoadmapUploadFlow = ({ onCancel, onComplete }) => {
  const { 
    userProfile, 
    generateDailyTasksFromRoadmap, 
    setActiveTab, 
    showToast,
    roadmapProgress
  } = useApp();

  // Step 1: Upload Dropzone & File Selection
  // Step 2: AI Document Analysis Progress
  // Step 3: Roadmap Review & Plan Settings
  // Step 4: Plan Generation Progress
  // Step 5: Plan Ready Celebration
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [planGenProgress, setPlanGenProgress] = useState(0);
  const [extractedRoadmap, setExtractedRoadmap] = useState(null);
  const [generatedTasksList, setGeneratedTasksList] = useState([]);
  const [isDemoFallback, setIsDemoFallback] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({ 'ep-1': true, 'ep-2': true, 'phase-1': true, 'phase-2': true });
  const fileInputRef = useRef(null);

  // Editable Plan Settings
  const [planRole, setPlanRole] = useState(userProfile.targetRole || 'Software Engineer');
  const [planHours, setPlanHours] = useState(userProfile.dailyTargetHours || 3);
  const [planDate, setPlanDate] = useState(userProfile.targetDate || '2026-11-20');

  // Step 2 Analysis Checklist
  const analysisSteps = [
    'Reading your roadmap',
    'Finding phases',
    'Extracting topics',
    'Identifying practice areas',
    'Preparing your daily plan'
  ];

  // Step 4 Plan Generation Checklist
  const planGenSteps = [
    'Roadmap organized',
    'Topics prioritized',
    'Creating daily missions',
    'Scheduling revision',
    'Preparing reminders'
  ];

  const togglePhase = (phaseId) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  // File validation
  const handleFileSelect = (file) => {
    setFileError(null);
    setAnalysisError(null);
    if (!file) return;

    const validation = validateRoadmapFile(file);
    if (!validation.valid) {
      setFileError(validation.error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Get file type display label
  const getFileTypeLabel = (fileName) => {
    if (!fileName) return 'PDF';
    return fileName.split('.').pop().toUpperCase();
  };

  // Run AI Analysis Simulation
  const startAnalysis = async () => {
    if (!selectedFile) return;

    setCurrentStep(2);
    setAnalysisProgress(0);
    setAnalysisError(null);

    // Progressive visual sequence
    let progress = 0;
    const interval = setInterval(() => {
      progress++;
      setAnalysisProgress(progress);

      if (progress >= analysisSteps.length) {
        clearInterval(interval);
        setTimeout(async () => {
          try {
            const { roadmap, isDemoFallback: demoFlag } = await parseRoadmapDocument(selectedFile, {
              targetRole: planRole
            });
            setExtractedRoadmap(roadmap);
            setIsDemoFallback(demoFlag);
            setCurrentStep(3);
          } catch (err) {
            console.error('[Roadmap Analysis Error]', err);
            setAnalysisError(err.message || "We couldn't organize this roadmap correctly.");
            setCurrentStep(1);
          }
        }, 300);
      }
    }, 450);
  };

  // Run Plan Generation and await server persistence
  const startPlanGeneration = async () => {
    setCurrentStep(4);
    setPlanGenProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress++;
      setPlanGenProgress(Math.min(progress, planGenSteps.length - 1));
    }, 350);

    try {
      if (extractedRoadmap) {
        const tasks = await generateDailyTasksFromRoadmap(extractedRoadmap, {
          targetRole: planRole,
          dailyTargetHours: planHours,
          targetDate: planDate
        });
        setGeneratedTasksList(tasks || []);
      }
      clearInterval(interval);
      setPlanGenProgress(planGenSteps.length);
      setTimeout(() => {
        setCurrentStep(5);
      }, 300);
    } catch (err) {
      clearInterval(interval);
      console.error('[Plan Generation Error]', err);
      showToast('Plan Generation Error', err.message || "Couldn't create your daily plan.", 'terracotta');
      setCurrentStep(3);
    }
  };

  // Final confirmation: switch to Today's view
  const handleFinish = () => {
    if (onComplete) onComplete();
    setActiveTab('today');
  };

  return (
    <div style={{ animation: 'fadeIn 200ms ease', width: '100%' }}>
      {/* =========================================================================
          STEP 1: UPLOAD DROPZONE / FILE PICKER
          ========================================================================= */}
      {currentStep === 1 && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="pill-badge pill-terracotta">
                <Sparkles size={11} /> AI Roadmap Parser
              </span>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  Cancel
                </button>
              )}
            </div>

            <h1 style={{ 
              fontSize: '22px', 
              fontWeight: 800, 
              color: 'var(--text-charcoal)',
              letterSpacing: '-0.02em',
              lineHeight: '1.25',
              marginBottom: '4px'
            }}>
              Bring your roadmap
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
              Upload the roadmap you're using for your placement preparation.
            </p>
          </div>

          {/* Validation Error Alert */}
          {fileError && (
            <div style={{
              backgroundColor: 'var(--accent-terracotta-light)',
              border: '1px solid rgba(200, 90, 50, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: 'var(--accent-terracotta)',
              fontWeight: 600
            }}>
              <AlertCircle size={16} flexShrink={0} />
              <span>{fileError}</span>
            </div>
          )}

          {/* AI Extraction Failure Error Screen */}
          {analysisError && (
            <div 
              className="card-white"
              style={{
                backgroundColor: 'var(--accent-terracotta-light)',
                border: '1px solid rgba(200, 90, 50, 0.3)',
                padding: '20px',
                marginBottom: '18px',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: 'var(--accent-terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                We couldn't organize this roadmap correctly.
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {analysisError}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={startAnalysis}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  <RotateCcw size={13} />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setAnalysisError(null);
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Upload Another Roadmap
                </button>
              </div>
            </div>
          )}

          {/* Main Upload Card */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className="card-white"
              style={{
                border: `2px dashed ${dragActive ? 'var(--accent-terracotta)' : 'var(--border-beige-dark)'}`,
                backgroundColor: dragActive ? 'var(--accent-terracotta-light)' : '#FFFFFF',
                padding: '36px 20px',
                textAlign: 'center',
                marginBottom: '18px',
                transition: 'all 200ms ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt,.md"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />

              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '18px',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                color: 'var(--accent-terracotta)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <UploadCloud size={26} />
              </div>

              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                Upload your roadmap
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                PDF, DOCX, JPG or PNG
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                style={{ padding: '9px 24px', fontSize: '13px', minHeight: '38px', marginBottom: '16px' }}
              >
                Choose File
              </button>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Your roadmap stays connected to your NOVARA account.
              </p>
            </div>
          ) : (
            /* Selected File Preview Card */
            <div 
              className="card-white"
              style={{
                padding: '20px',
                marginBottom: '18px',
                borderLeft: '4px solid var(--accent-terracotta)'
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)', marginBottom: '8px' }}>
                File Selected
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--accent-terracotta-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-terracotta)',
                  flexShrink: 0
                }}>
                  <FileText size={22} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-charcoal)', wordBreak: 'break-word' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {getFileTypeLabel(selectedFile.name)} • {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              </div>

              {/* Actions: Change File & Analyze Roadmap */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileError(null);
                    setAnalysisError(null);
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px 12px', fontSize: '12.5px' }}
                >
                  Change File
                </button>

                <button
                  type="button"
                  onClick={startAnalysis}
                  className="btn-primary"
                  style={{ flex: 2, padding: '10px 16px', fontSize: '12.5px' }}
                >
                  <Sparkles size={14} />
                  <span>Analyze Roadmap</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Demo Sample Files for Development Testing */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Or test with sample syllabus files (Dev Demo):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const demoFile = new File(['mock SDE syllabus content with Arrays, Trees, Dynamic Programming, OS Concurrency and SQL'], 'placement-roadmap.pdf', { type: 'application/pdf' });
                  Object.defineProperty(demoFile, 'size', { value: 1024 * 1024 * 2.4 });
                  demoFile.isDemoPreset = true;
                  setSelectedFile(demoFile);
                }}
                className="card-white interactive"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-terracotta-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-terracotta)'
                  }}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                      placement-roadmap.pdf
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      PDF • 2.4 MB (SDE-1 90-Day Placement Sprint)
                    </div>
                  </div>
                </div>
                <ArrowRight size={15} color="var(--accent-terracotta)" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const demoFile = new File(['mock Data Science syllabus with Python Vectorization, Classical ML, and SQL Analytics'], 'datascience-roadmap.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                  Object.defineProperty(demoFile, 'size', { value: 1024 * 1024 * 1.8 });
                  demoFile.isDemoPreset = true;
                  setSelectedFile(demoFile);
                }}
                className="card-white interactive"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-navy-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-navy)'
                  }}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                      datascience-roadmap.docx
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      DOCX • 1.8 MB (Data Science & ML Track)
                    </div>
                  </div>
                </div>
                <ArrowRight size={15} color="var(--accent-navy)" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: ANALYSIS SCREEN (VERTICAL PROGRESS SEQUENCE)
          ========================================================================= */}
      {currentStep === 2 && (
        <div style={{ textAlign: 'center', padding: '24px 10px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-terracotta-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'var(--accent-terracotta)'
          }}>
            <Loader2 size={26} style={{ animation: 'spin 1.2s linear infinite' }} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
            Understanding your roadmap
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            NOVARA is organizing your preparation journey.
          </p>

          <div className="card-white" style={{ maxWidth: '360px', margin: '0 auto', padding: '18px 20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysisSteps.map((stepText, idx) => {
                const isDone = idx < analysisProgress;
                const isCurrent = idx === analysisProgress;

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: isDone ? 'var(--accent-sage)' : isCurrent ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 700 : 500
                  }}>
                    {isDone ? (
                      <CheckCircle2 size={17} color="var(--accent-sage)" />
                    ) : isCurrent ? (
                      <Loader2 size={17} style={{ animation: 'spin 1.5s linear infinite' }} color="var(--accent-terracotta)" />
                    ) : (
                      <div style={{ width: '17px', height: '17px', borderRadius: '50%', border: '1.5px solid var(--border-beige)' }} />
                    )}
                    <span>{stepText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: ROADMAP REVIEW SCREEN & PLAN SETTINGS
          ========================================================================= */}
      {currentStep === 3 && extractedRoadmap && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {extractedRoadmap.needsReview ? (
                <span className="pill-badge pill-amber" style={{ fontSize: '10.5px' }}>
                  <AlertTriangle size={11} /> Needs Review
                </span>
              ) : (
                <span className="pill-badge pill-terracotta">
                  <Check size={11} /> Extraction Ready
                </span>
              )}
              {/* Real vs Demo Source Badge */}
              {!isDemoFallback ? (
                <span className="pill-badge pill-sage" style={{ fontSize: '10.5px' }}>
                  Extracted from your uploaded roadmap
                </span>
              ) : (
                <span className="pill-badge pill-amber" style={{ fontSize: '10.5px' }}>
                  DEMO MODE
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.25', marginBottom: '2px' }}>
              Review your roadmap
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Check the topics before NOVARA builds your daily plan.
            </p>
          </div>

          {/* Development / Demo Transparency Banner if demo mode */}
          {isDemoFallback && (
            <div style={{
              backgroundColor: 'var(--accent-amber-light)',
              border: '1px solid rgba(217, 130, 43, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '12px'
            }}>
              <Info size={16} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-charcoal)', display: 'block', marginBottom: '2px' }}>
                  DEMO MODE
                </strong>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Sample roadmap data is being used for development.
                </span>
              </div>
            </div>
          )}

          {/* Extraction Needs Review Banner (Low Confidence / Corrupted Document Safeguard) */}
          {extractedRoadmap.needsReview && (
            <div style={{
              backgroundColor: 'var(--accent-amber-light)',
              border: '1px solid rgba(217, 130, 43, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '12.5px'
            }}>
              <AlertTriangle size={17} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ color: 'var(--text-charcoal)', display: 'block', marginBottom: '2px' }}>
                  Extraction Needs Review
                </strong>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  {extractedRoadmap.reviewReason || 'Some sections of this document may be low quality or formatted irregularly. Please review and adjust the extracted topics.'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--accent-amber)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--accent-amber)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={12} />
                  Edit Roadmap Topics
                </button>
              </div>
            </div>
          )}

          {/* Expandable Phase Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {extractedRoadmap.phases.map((phase) => {
              const isExpanded = expandedPhases[phase.id] ?? true;

              return (
                <div
                  key={phase.id}
                  className="card-white"
                  style={{ padding: '0', overflow: 'hidden' }}
                >
                  {/* Phase Accordion Header */}
                  <div 
                    onClick={() => togglePhase(phase.id)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)' }}>
                        PHASE {phase.number}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        {phase.title}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {phase.topics?.length || 0} topics
                      </span>
                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Topics List with ✓ Completed, ● Current, ○ Upcoming icons */}
                  {isExpanded && (
                    <div style={{
                      padding: '8px 16px 14px 16px',
                      borderTop: '1px solid var(--border-beige-light)',
                      backgroundColor: 'var(--bg-warm-cream-alt)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      {phase.topics?.map((topic, tIdx) => {
                        const isCompleted = topic.status === 'completed';
                        const isInProgress = topic.status === 'in_progress';
                        const isLowConfidence = topic.confidence === 'low';

                        return (
                          <div key={topic.id || tIdx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 0',
                            fontSize: '12px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                              <span style={{
                                color: isCompleted ? 'var(--accent-sage)' : isInProgress ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                                fontWeight: 800,
                                fontSize: '13px'
                              }}>
                                {isCompleted ? '✓' : isInProgress ? '●' : '○'}
                              </span>
                              <span style={{ color: 'var(--text-charcoal)', fontWeight: 500, wordBreak: 'break-word' }}>
                                {topic.name}
                              </span>

                              {/* Needs Review Pill for low confidence topics */}
                              {isLowConfidence && (
                                <span style={{
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '9999px',
                                  backgroundColor: 'var(--accent-amber-light)',
                                  color: 'var(--accent-amber)',
                                  flexShrink: 0
                                }}>
                                  Needs review
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', flexShrink: 0 }}>
                              {topic.problemsCount ? `${topic.problemsCount} problems` : topic.duration ? topic.duration : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Edit Roadmap Action */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '12.5px' }}
            >
              <Edit3 size={14} />
              <span>Edit Roadmap</span>
            </button>
          </div>

          {/* Plan Settings Section */}
          <div className="card-white" style={{ padding: '16px 18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-charcoal)', marginBottom: '12px' }}>
              Plan settings
            </div>

            {/* Target Role */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Target role:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-warm-cream)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px'
              }}>
                <Briefcase size={14} color="var(--accent-terracotta)" />
                <input
                  type="text"
                  value={planRole}
                  onChange={(e) => setPlanRole(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Daily Study Time */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Daily study time:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[1.5, 2.0, 3.0, 4.0].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setPlanHours(h)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: planHours === h ? 'var(--accent-terracotta)' : 'var(--bg-warm-cream)',
                      color: planHours === h ? '#FFFFFF' : 'var(--text-charcoal)',
                      border: `1px solid ${planHours === h ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {h} hours
                  </button>
                ))}
              </div>
            </div>

            {/* Placement Target Date */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Placement target:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-warm-cream)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px'
              }}>
                <Calendar size={14} color="var(--accent-terracotta)" />
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons: Generate My Plan (Primary) & Back (Secondary) */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px', fontSize: '12.5px' }}
            >
              Back
            </button>

            <button
              type="button"
              onClick={startPlanGeneration}
              className="btn-primary"
              style={{ flex: 2, padding: '10px 16px', fontSize: '12.5px' }}
            >
              <Sparkles size={14} />
              <span>Generate My Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 4: GENERATING PLAN (SHORT POLISHED TRANSITION)
          ========================================================================= */}
      {currentStep === 4 && (
        <div style={{ textAlign: 'center', padding: '24px 10px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-sage-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'var(--accent-sage)'
          }}>
            <Loader2 size={26} style={{ animation: 'spin 1.2s linear infinite' }} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
            Building your preparation plan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Allocating daily missions, spaced repetition, and milestone tracking.
          </p>

          <div className="card-white" style={{ maxWidth: '360px', margin: '0 auto', padding: '18px 20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {planGenSteps.map((stepText, idx) => {
                const isDone = idx < planGenProgress;
                const isCurrent = idx === planGenProgress;

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: isDone ? 'var(--accent-sage)' : isCurrent ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 700 : 500
                  }}>
                    {isDone ? (
                      <CheckCircle2 size={17} color="var(--accent-sage)" />
                    ) : isCurrent ? (
                      <Loader2 size={17} style={{ animation: 'spin 1.5s linear infinite' }} color="var(--accent-terracotta)" />
                    ) : (
                      <div style={{ width: '17px', height: '17px', borderRadius: '50%', border: '1.5px solid var(--border-beige)' }} />
                    )}
                    <span>{stepText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 5: PLAN READY CELEBRATION
          ========================================================================= */}
      {currentStep === 5 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-terracotta-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'var(--accent-terracotta)',
            boxShadow: '0 6px 18px var(--accent-terracotta-glow)'
          }}>
            <Sparkles size={32} />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
            Your plan is ready 🎯
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
            Your roadmap is now your daily preparation journey.
          </p>

          {/* 3 Summary Stats (Today's tasks: 6, Daily target: 3h, Roadmap progress: 47%) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '26px',
            textAlign: 'center'
          }}>
            <div className="card-white" style={{ padding: '14px 8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Today's tasks
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {generatedTasksList.length > 0 ? generatedTasksList.length : 6}
              </div>
            </div>

            <div className="card-white" style={{ padding: '14px 8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Daily target
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-terracotta)' }}>
                {planHours}h
              </div>
            </div>

            <div className="card-white" style={{ padding: '14px 8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Roadmap progress
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                {roadmapProgress || 47}%
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="btn-primary"
            style={{ width: '100%', padding: '13px 20px', fontSize: '14px', borderRadius: 'var(--radius-pill)' }}
          >
            <span>View Today's Mission</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Extracted Roadmap Editor Modal */}
      {isEditorOpen && extractedRoadmap && (
        <RoadmapEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          roadmap={extractedRoadmap}
          onSave={(updated) => {
            setExtractedRoadmap(updated);
            showToast('Roadmap Updated', 'Your modifications have been applied as the authoritative roadmap.', 'terracotta');
          }}
        />
      )}
    </div>
  );
};
