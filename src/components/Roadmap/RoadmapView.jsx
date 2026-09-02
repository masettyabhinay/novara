import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Map, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  UploadCloud, 
  Search,
  Filter,
  Flame,
  Check,
  Edit3,
  Circle,
  ArrowRight,
  X,
  AlertTriangle
} from 'lucide-react';
import { RoadmapUploadFlow } from './RoadmapUploadFlow';
import { RoadmapEditorModal } from './RoadmapEditorModal';

export const RoadmapView = () => {
  const { 
    activeRoadmap, 
    roadmapProgress,
    totalRoadmapTopics,
    completedRoadmapTopics,
    updateRoadmapTopicStatus, 
    updateFullRoadmap, 
    showToast 
  } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [isReplaceConfirmOpen, setIsReplaceConfirmOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({ 'phase-1': true, 'phase-2': true, 'ep-1': true, 'ep-2': true, 'p-custom-2': true });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const togglePhase = (phaseId) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const handleUploadNewRoadmapClick = () => {
    if (activeRoadmap) {
      setIsReplaceConfirmOpen(true);
    } else {
      setIsUploading(true);
    }
  };

  const handleConfirmReplace = () => {
    setIsReplaceConfirmOpen(false);
    setIsUploading(true);
  };

  // If no active roadmap, show empty state
  if (!activeRoadmap && !isUploading) {
    return (
      <div style={{ animation: 'fadeIn 200ms ease', width: '100%', padding: '10px 0' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="pill-badge pill-terracotta" style={{ marginBottom: '6px' }}>
            Preparation Roadmap
          </span>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            marginBottom: '4px'
          }}>
            Your Roadmap
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Turn your placement syllabus into an adaptive, daily preparation plan.
          </p>
        </div>

        <div className="card-white" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-terracotta-light)',
            color: 'var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <UploadCloud size={28} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
            No roadmap uploaded yet.
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 20px auto', lineHeight: '1.45' }}>
            Upload your placement roadmap and NOVARA will turn it into your daily preparation plan.
          </p>

          <button
            type="button"
            onClick={() => setIsUploading(true)}
            className="btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              gap: '8px'
            }}
          >
            <UploadCloud size={16} />
            <span>+ Upload Roadmap</span>
          </button>
        </div>
      </div>
    );
  }

  // If user initiated upload flow, display the 6-step RoadmapUploadFlow
  if (isUploading) {
    return (
      <RoadmapUploadFlow
        onCancel={activeRoadmap ? () => setIsUploading(false) : null}
        onComplete={() => setIsUploading(false)}
      />
    );
  }

  // Find current active phase and topic
  const currentPhase = activeRoadmap.phases?.find(p => p.status === 'in_progress') || activeRoadmap.phases?.[0];
  const currentTopic = currentPhase?.topics?.find(t => t.status === 'in_progress') || currentPhase?.topics?.find(t => t.status === 'upcoming') || currentPhase?.topics?.[0];

  // Check if any topics match the current search and level filter
  const totalFilteredTopicsCount = activeRoadmap.phases?.reduce((acc, phase) => {
    const count = phase.topics?.filter(t => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        t.name.toLowerCase().includes(query) || 
        (t.description && t.description.toLowerCase().includes(query)) ||
        (phase.title && phase.title.toLowerCase().includes(query));
      const matchesDiff = selectedDifficulty === 'all' || t.difficulty === selectedDifficulty;
      return matchesSearch && matchesDiff;
    }).length || 0;
    return acc + count;
  }, 0) || 0;

  return (
    <div style={{ animation: 'fadeIn 200ms ease', width: '100%' }}>
      {/* 1. Header & Prominent Upload Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <span className="pill-badge pill-terracotta" style={{ marginBottom: '4px' }}>
            Active Journey
          </span>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
            marginBottom: '2px'
          }}>
            Your Roadmap
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {activeRoadmap.title || 'Placement Preparation Masterplan'} • <strong style={{ color: 'var(--accent-terracotta)' }}>{roadmapProgress}% complete</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleUploadNewRoadmapClick}
          className="btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: '12.5px',
            fontWeight: 700,
            borderRadius: 'var(--radius-pill)',
            gap: '6px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(200, 90, 50, 0.2)'
          }}
        >
          <UploadCloud size={15} />
          <span>+ Upload New Roadmap</span>
        </button>
      </div>

      {/* 2. Compact Roadmap Progress Card (Single Source of Truth) */}
      <div className="card-white" style={{ marginBottom: '16px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Roadmap Progress
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
              {roadmapProgress}%
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-terracotta)' }}>
              {completedRoadmapTopics} of {totalRoadmapTopics} topics
            </span>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              You're making steady progress.
            </div>
          </div>
        </div>

        {/* Global Progress Track */}
        <div style={{
          width: '100%',
          height: '7px',
          borderRadius: '9999px',
          backgroundColor: 'var(--bg-warm-cream-alt)',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{
            width: `${roadmapProgress}%`,
            height: '100%',
            backgroundColor: 'var(--accent-terracotta)',
            borderRadius: '9999px',
            transition: 'width 300ms ease'
          }} />
        </div>

        {/* Current Focus Highlight (Clean wrapping, no edge clipping) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          backgroundColor: 'var(--bg-warm-cream)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          marginBottom: '14px'
        }}>
          <div>
            <div style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Current Phase
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-charcoal)',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>
              {currentPhase?.title || 'Data Structures'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Current Topic
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>
              {currentTopic?.name || 'Graphs'}
            </div>
          </div>
        </div>

        {/* Phase-Level Progress Rows (Clean 2-line wrap on mobile, full names on desktop) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeRoadmap.phases?.map((phase) => {
            const phaseTotal = phase.topics?.length || 0;
            const phaseDone = phase.topics?.filter(t => t.status === 'completed').length || 0;
            const phasePercent = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;
            const cleanPhaseName = phase.title.replace(/^Phase \d+:\s*/i, '').replace(/^Phase \d+ - \s*/i, '');

            return (
              <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                <div style={{
                  flex: '0 0 115px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '11px',
                  lineHeight: '1.25',
                  wordBreak: 'break-word'
                }}>
                  {cleanPhaseName}
                </div>

                <div style={{ flex: 1, height: '6px', borderRadius: '9999px', backgroundColor: 'var(--bg-warm-cream-alt)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${phasePercent}%`,
                    height: '100%',
                    backgroundColor: phasePercent === 100 ? 'var(--accent-sage)' : phasePercent > 0 ? 'var(--accent-terracotta)' : 'transparent',
                    borderRadius: '9999px',
                    transition: 'width 250ms ease'
                  }} />
                </div>

                <span style={{ width: '34px', textAlign: 'right', fontWeight: 700, color: phasePercent === 100 ? 'var(--accent-sage)' : 'var(--text-charcoal)' }}>
                  {phasePercent}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Filter Bar (Real-time Filtering & Reset) */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '14px'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 12px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Search size={14} color="var(--text-muted)" flexShrink={0} />
          <input
            type="text"
            placeholder="Search topics or algorithms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '12px',
              backgroundColor: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                minHeight: '20px'
              }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          style={{
            backgroundColor: selectedDifficulty !== 'all' ? 'var(--accent-terracotta-light)' : '#FFFFFF',
            border: `1px solid ${selectedDifficulty !== 'all' ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
            borderRadius: 'var(--radius-pill)',
            padding: '6px 10px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: selectedDifficulty !== 'all' ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
            outline: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <option value="all">All Levels</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* 4. Empty State if Search / Filter Yields 0 Results */}
      {totalFilteredTopicsCount === 0 && (
        <div 
          className="card-white"
          style={{
            padding: '30px 20px',
            textAlign: 'center',
            marginBottom: '16px'
          }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-warm-cream)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto',
            color: 'var(--text-muted)'
          }}>
            <Search size={20} />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '3px' }}>
            No topics found
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Try another search term or reset your level filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDifficulty('all');
            }}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', minHeight: '32px' }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* 5. Visual Roadmap Timeline: Phases Accordion */}
      {totalFilteredTopicsCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeRoadmap.phases?.map((phase) => {
            const isExpanded = expandedPhases[phase.id] ?? false;
            const query = searchQuery.toLowerCase().trim();
            const filteredTopics = phase.topics?.filter(t => {
              const matchesSearch = !query || 
                t.name.toLowerCase().includes(query) || 
                (t.description && t.description.toLowerCase().includes(query)) ||
                (phase.title && phase.title.toLowerCase().includes(query));
              const matchesDiff = selectedDifficulty === 'all' || t.difficulty === selectedDifficulty;
              return matchesSearch && matchesDiff;
            }) || [];

            if (filteredTopics.length === 0 && (searchQuery || selectedDifficulty !== 'all')) return null;

            const isPhaseCompleted = phase.status === 'completed';
            const isPhaseInProgress = phase.status === 'in_progress';

            return (
              <div 
                key={phase.id}
                className="card-white"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  borderColor: isPhaseInProgress ? 'var(--accent-terracotta)' : 'var(--border-beige)'
                }}
              >
                {/* Phase Header */}
                <div 
                  onClick={() => togglePhase(phase.id)}
                  style={{
                    padding: '13px 16px',
                    cursor: 'pointer',
                    backgroundColor: isPhaseInProgress ? 'var(--accent-terracotta-light)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 150ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      borderRadius: '10px',
                      backgroundColor: isPhaseCompleted 
                        ? 'var(--accent-sage)' 
                        : isPhaseInProgress 
                          ? 'var(--accent-terracotta)' 
                          : 'var(--bg-warm-cream-alt)',
                      color: isPhaseCompleted || isPhaseInProgress ? '#FFFFFF' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '12px'
                    }}>
                      {isPhaseCompleted ? <Check size={16} strokeWidth={2.5} /> : phase.number}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: isPhaseInProgress ? 'var(--accent-terracotta)' : 'var(--text-muted)' }}>
                          Phase {phase.number}
                        </span>
                        {isPhaseInProgress && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '9999px', backgroundColor: 'var(--accent-terracotta)', color: '#FFFFFF' }}>
                            Current
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-charcoal)', wordBreak: 'break-word', lineHeight: '1.25' }}>
                        {phase.title}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {phase.progress}%
                    </span>
                    {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Topics Drilldown */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid var(--border-beige-light)',
                    padding: '6px 12px 12px 12px',
                    backgroundColor: 'var(--bg-warm-cream-alt)'
                  }}>
                    {filteredTopics.map((topic) => {
                      const isDone = topic.status === 'completed';
                      const isCurrentTopic = topic.status === 'in_progress';

                      return (
                        <div
                          key={topic.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--border-beige)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 12px',
                            marginTop: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            {/* Interactive Status Indicator Toggle */}
                            <button
                              onClick={() => updateRoadmapTopicStatus(phase.id, topic.id, isDone ? 'in_progress' : 'completed')}
                              style={{
                                width: '22px',
                                height: '22px',
                                minWidth: '22px',
                                minHeight: '22px',
                                borderRadius: '50%',
                                backgroundColor: isDone ? 'var(--accent-sage-light)' : isCurrentTopic ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream)',
                                border: `1px solid ${isDone ? 'var(--accent-sage)' : isCurrentTopic ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDone ? 'var(--accent-sage)' : isCurrentTopic ? 'var(--accent-terracotta)' : 'transparent',
                                padding: 0,
                                cursor: 'pointer'
                              }}
                              title="Toggle topic completion"
                            >
                              {isDone ? (
                                <Check size={13} strokeWidth={3} />
                              ) : isCurrentTopic ? (
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-terracotta)' }} />
                              ) : (
                                <Circle size={10} color="var(--border-beige-dark)" />
                              )}
                            </button>

                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: '12.5px',
                                fontWeight: 600,
                                color: isDone ? 'var(--text-secondary)' : 'var(--text-charcoal)',
                                textDecoration: isDone ? 'line-through' : 'none',
                                wordBreak: 'break-word',
                                lineHeight: '1.3'
                              }}>
                                {topic.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                <span>{topic.problemsCount || 15} problems</span>
                                <span>•</span>
                                <span>{topic.duration || '8h'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Difficulty pill */}
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: topic.difficulty === 'Hard' ? 'var(--accent-terracotta-light)' : topic.difficulty === 'Medium' ? 'var(--accent-amber-light)' : 'var(--accent-sage-light)',
                            color: topic.difficulty === 'Hard' ? 'var(--accent-terracotta)' : topic.difficulty === 'Medium' ? 'var(--accent-amber)' : 'var(--accent-sage)',
                            flexShrink: 0
                          }}>
                            {topic.difficulty || 'Medium'}
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
      )}

      {/* Replace Roadmap Confirmation Modal */}
      {isReplaceConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsReplaceConfirmOpen(false)}>
          <div 
            className="modal-content-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '24px' }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              backgroundColor: 'var(--accent-amber-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={24} />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
              Replace current roadmap?
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '22px' }}>
              Your current roadmap will be replaced after you confirm.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsReplaceConfirmOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReplace}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Roadmap Modal */}
      {isEditorOpen && activeRoadmap && (
        <RoadmapEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          roadmap={activeRoadmap}
          onSave={(updated) => {
            updateFullRoadmap(updated);
            showToast('Roadmap Updated', 'Your changes have been saved.', 'terracotta');
          }}
        />
      )}

      {/* Safe bottom spacer: Guarantees 100% visibility past floating bottom navigation */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
