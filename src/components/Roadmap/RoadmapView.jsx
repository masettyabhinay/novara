import React, { useState, useMemo } from 'react';
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
  Check, 
  Edit3, 
  Circle, 
  ArrowRight, 
  X, 
  AlertTriangle,
  BookOpen,
  Award,
  Target
} from 'lucide-react';
import { RoadmapUploadFlow } from './RoadmapUploadFlow';
import { RoadmapEditorModal } from './RoadmapEditorModal';
import { VisualMap, VisualMapMiniMap, buildRoadmapVisualMap } from '../VisualMap';

export const RoadmapView = () => {
  const { 
    activeRoadmap, 
    roadmapProgress,
    totalRoadmapTopics,
    completedRoadmapTopics,
    updateRoadmapTopicStatus, 
    updateFullRoadmap, 
    userProfile,
    showToast,
    openTaskStudyMaterial 
  } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [isReplaceConfirmOpen, setIsReplaceConfirmOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState(() => {
    // Default expand all phases on first load for rapid scanning
    const initial = {};
    if (activeRoadmap?.phases) {
      activeRoadmap.phases.forEach((p, idx) => {
        initial[p.id] = idx === 0 || p.status === 'in_progress' || true;
      });
    }
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [selectedPhaseForMap, setSelectedPhaseForMap] = useState(null);

  const roadmapMapData = useMemo(() => {
    return buildRoadmapVisualMap(activeRoadmap, { selectedPhaseId: selectedPhaseForMap });
  }, [activeRoadmap, selectedPhaseForMap]);

  const handleMapNodeClick = (node) => {
    if (!node) return;
    if (node.entityType === 'topic') {
      const topicData = node.data || {};
      const parentPhase = activeRoadmap?.phases?.find(p => p.id === node.phaseId);
      openTaskStudyMaterial({
        id: node.entityId || `task_${node.id}`,
        name: topicData.name || node.label,
        taskTitle: topicData.name || node.label,
        topic: topicData.name || node.label,
        phase: parentPhase?.title || 'Roadmap Topic',
        difficulty: topicData.difficulty || 'Medium',
        category: topicData.category || 'DSA',
        learningObjectives: Array.isArray(topicData.learningObjectives) && topicData.learningObjectives.length > 0
          ? topicData.learningObjectives
          : [`Master core principles of ${node.label}`],
        duration: topicData.duration || '45m',
        estimatedMinutes: 45
      });
    } else if (node.entityType === 'phase') {
      setSelectedPhaseForMap(prev => (prev === node.entityId ? null : node.entityId));
      togglePhase(node.entityId);
    } else if (node.entityType === 'roadmap') {
      setSelectedPhaseForMap(null);
    }
  };

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

  // Authoritative State Calculation
  const isAllComplete = totalRoadmapTopics > 0 && completedRoadmapTopics === totalRoadmapTopics;
  const remainingTopicsCount = Math.max(0, totalRoadmapTopics - completedRoadmapTopics);

  // Determine current active phase deterministically from authoritative state
  const currentPhaseIndex = useMemo(() => {
    if (!activeRoadmap?.phases || isAllComplete) return -1;
    // Find the first phase where topics completed < total topics
    const idx = activeRoadmap.phases.findIndex((p) => {
      const total = p.topics?.length || 0;
      const done = p.topics?.filter((t) => t.status === 'completed').length || 0;
      return total > 0 && done < total;
    });
    return idx !== -1 ? idx : 0;
  }, [activeRoadmap, isAllComplete]);

  const currentPhase = currentPhaseIndex !== -1 && activeRoadmap?.phases ? activeRoadmap.phases[currentPhaseIndex] : null;

  // Determine current next topic to study in current phase
  const currentTopic = useMemo(() => {
    if (!currentPhase?.topics) return null;
    return currentPhase.topics.find((t) => t.status !== 'completed') || currentPhase.topics[0];
  }, [currentPhase]);

  // If no active roadmap, show clean, dedicated empty state
  if (!activeRoadmap && !isUploading) {
    return (
      <div 
        style={{ 
          animation: 'fadeIn 200ms ease', 
          width: '100%', 
          maxWidth: '840px', 
          margin: '0 auto', 
          padding: '12px 0 32px 0' 
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="pill-badge pill-terracotta" style={{ fontSize: '11px', fontWeight: 700 }}>
              NOVARA
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              • Target Role: {userProfile?.targetRole || 'Software Engineer'}
            </span>
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            marginBottom: '4px'
          }}>
            Preparation Roadmap
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Turn your placement syllabus into an adaptive, daily preparation plan.
          </p>
        </div>

        <div className="card-white" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-terracotta-light)',
            color: 'var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px auto',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <UploadCloud size={30} />
          </div>

          <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
            No roadmap yet
          </h2>
          <p style={{ 
            fontSize: '13.5px', 
            color: 'var(--text-secondary)', 
            maxWidth: '420px', 
            margin: '0 auto 24px auto', 
            lineHeight: '1.5' 
          }}>
            Upload your placement roadmap to build your personalized study plan.
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
              gap: '8px',
              minHeight: '44px'
            }}
          >
            <UploadCloud size={17} />
            <span>Upload Roadmap</span>
          </button>
        </div>
      </div>
    );
  }

  // If user initiated upload flow, display the RoadmapUploadFlow component
  if (isUploading) {
    return (
      <RoadmapUploadFlow
        onCancel={activeRoadmap ? () => setIsUploading(false) : null}
        onComplete={() => setIsUploading(false)}
      />
    );
  }

  // Filtered topics count
  const totalFilteredTopicsCount = activeRoadmap.phases?.reduce((acc, phase) => {
    const count = phase.topics?.filter((t) => {
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
    <div 
      style={{ 
        animation: 'fadeIn 200ms ease', 
        width: '100%', 
        maxWidth: '840px', 
        margin: '0 auto',
        padding: '8px 0 24px 0' 
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER & ACTIONS                                                */}
      {/* ------------------------------------------------------------------ */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span className="pill-badge pill-terracotta" style={{ fontSize: '10.5px', fontWeight: 800 }}>
              NOVARA
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Target: {userProfile?.targetRole || activeRoadmap.targetRole || 'Software Development Engineer'}
            </span>
          </div>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
            marginBottom: '3px'
          }}>
            Preparation Roadmap
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {activeRoadmap.title || 'Placement Preparation Masterplan'} • <strong style={{ color: roadmapProgress === 100 ? 'var(--accent-sage)' : 'var(--accent-terracotta)' }}>{roadmapProgress}% overall progress</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* List vs Visual Map Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-beige)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                backgroundColor: viewMode === 'list' ? 'var(--accent-terracotta)' : 'transparent',
                color: viewMode === 'list' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                minHeight: '36px',
                transition: 'all 150ms ease'
              }}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                backgroundColor: viewMode === 'map' ? 'var(--accent-terracotta)' : 'transparent',
                color: viewMode === 'map' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                minHeight: '36px',
                transition: 'all 150ms ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Map size={13} />
              <span>Visual Map</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              gap: '6px',
              minHeight: '44px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)'
            }}
            title="Customize phases and topics"
          >
            <Edit3 size={14} color="var(--text-secondary)" />
            <span>Customize</span>
          </button>

          <button
            type="button"
            onClick={handleUploadNewRoadmapClick}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              gap: '6px',
              whiteSpace: 'nowrap',
              minHeight: '44px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <UploadCloud size={15} />
            <span>+ Upload New Roadmap</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. OVERALL PROGRESS CARD (AUTHORITATIVE SOURCE OF TRUTH)           */}
      {/* ------------------------------------------------------------------ */}
      <div 
        className="card-white" 
        style={{ 
          marginBottom: '16px', 
          padding: '18px 20px',
          border: '1px solid var(--border-beige)'
        }}
      >
        {/* Progress Header Stats */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between', 
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ 
              fontSize: '10.5px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              color: 'var(--text-muted)',
              marginBottom: '2px'
            }}>
              Curriculum Completion
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: 800, 
                color: roadmapProgress === 100 ? 'var(--accent-sage)' : 'var(--text-charcoal)',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                {roadmapProgress}%
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                ({completedRoadmapTopics} / {totalRoadmapTopics} topics)
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: roadmapProgress === 100 ? 'var(--accent-sage)' : 'var(--accent-terracotta)' 
            }}>
              {isAllComplete ? 'All Topics Mastered 🎉' : `${remainingTopicsCount} topics remaining`}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {activeRoadmap.phases?.length || 0} preparation phases
            </div>
          </div>
        </div>

        {/* Global Authoritative Progress Bar */}
        <div 
          role="progressbar"
          aria-valuenow={roadmapProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall curriculum progress"
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-warm-cream-alt)',
            overflow: 'hidden',
            marginBottom: '14px'
          }}
        >
          <div style={{
            width: `${roadmapProgress}%`,
            height: '100%',
            backgroundColor: roadmapProgress === 100 ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
            borderRadius: '9999px',
            transition: 'width 300ms ease'
          }} />
        </div>

        {/* Dynamic Context Navigator: Where am I? What should I study next? */}
        {isAllComplete ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--accent-sage-light)',
            border: '1px solid rgba(94, 140, 113, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-sage)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-sage)', letterSpacing: '0.04em' }}>
                ROADMAP COMPLETE
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-charcoal)', lineHeight: '1.3' }}>
                You have completed all {totalRoadmapTopics} topics in your placement syllabus!
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px',
            backgroundColor: 'var(--bg-warm-cream)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            {/* Where am I? Current Phase */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  Current Phase
                </span>
                <span style={{ 
                  fontSize: '9px', 
                  fontWeight: 800, 
                  padding: '1px 6px', 
                  borderRadius: '9999px', 
                  backgroundColor: 'var(--accent-terracotta)', 
                  color: '#FFFFFF' 
                }}>
                  CURRENT
                </span>
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-charcoal)',
                lineHeight: '1.35',
                wordBreak: 'break-word'
              }}>
                {currentPhase ? `Phase ${currentPhase.number}: ${currentPhase.title.replace(/^Phase \d+:\s*/i, '')}` : 'Foundations'}
              </div>
            </div>

            {/* What should I study next? Current Next Topic */}
            {currentTopic && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '3px' }}>
                    What to Study Next
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--accent-terracotta)',
                    lineHeight: '1.35',
                    wordBreak: 'break-word'
                  }}>
                    {currentTopic.name}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    openTaskStudyMaterial({
                      id: currentTopic.id || `topic_${currentPhase?.id}_${currentTopic.name}`,
                      taskId: currentTopic.id || `topic_${currentPhase?.id}_${currentTopic.name}`,
                      name: currentTopic.name,
                      topic: currentTopic.name,
                      taskTitle: currentTopic.name,
                      phase: currentPhase?.title || '',
                      roadmapPhase: currentPhase?.title || '',
                      difficulty: currentTopic.difficulty || 'Medium',
                      learningObjectives: Array.isArray(currentTopic.learningObjectives) && currentTopic.learningObjectives.length > 0
                        ? currentTopic.learningObjectives
                        : [
                            `Master foundational principles of ${currentTopic.name}`,
                            `Understand key patterns, algorithmic approaches, and complexity analysis`,
                            `Solve standard placement interview problems for ${currentTopic.name}`
                          ],
                      duration: currentTopic.duration || '45m',
                      estimatedMinutes: 45
                    });
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--accent-terracotta)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '2px 0',
                    cursor: 'pointer'
                  }}
                >
                  <span>Open Study Guide</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Visual Map Section */}
      {viewMode === 'map' ? (
        <section aria-label="Visual Roadmap Diagram" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <VisualMapMiniMap
              phases={activeRoadmap?.phases || []}
              activePhaseId={selectedPhaseForMap}
              onSelectPhase={(phaseId) => setSelectedPhaseForMap(prev => (prev === phaseId ? null : phaseId))}
            />
          </div>
          <VisualMap
            nodes={roadmapMapData.nodes}
            edges={roadmapMapData.edges}
            title="Curriculum Learning Graph"
            subtitle="Click any topic node to open its study guide or click phases to toggle expansion"
            orientation="horizontal"
            compact={false}
            interactive={true}
            onNodeClick={handleMapNodeClick}
            selectedNodeId={selectedPhaseForMap ? `phase_${selectedPhaseForMap}` : null}
            showLegend={true}
            ariaLabel="Interactive Curriculum Roadmap Graph"
            accessibleSummary={roadmapMapData.summary}
          />
        </section>
      ) : (
        <section aria-label="Curriculum Overview Map" style={{ marginBottom: '14px' }}>
          <VisualMap
            nodes={roadmapMapData.nodes.slice(0, 8)}
            edges={roadmapMapData.edges.slice(0, 7)}
            title="Curriculum Pathway"
            subtitle="Current learning trajectory across phases and core topics"
            orientation="horizontal"
            compact={true}
            interactive={true}
            onNodeClick={handleMapNodeClick}
            showLegend={false}
            ariaLabel="Curriculum Pathway Overview"
            accessibleSummary={roadmapMapData.summary}
          />
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. SEARCH & DIFFICULTY FILTER (HIDDEN IN FULL MAP MODE)            */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'list' && (
      <>
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '14px',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-pill)',
          padding: '8px 14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search topics, algorithms, or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search roadmap topics"
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              backgroundColor: 'transparent',
              color: 'var(--text-charcoal)'
            }}
          />
          {searchQuery && (
            <button
              type="button"
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
                minHeight: '24px',
                minWidth: '24px'
              }}
              title="Clear search"
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          aria-label="Filter by difficulty"
          style={{
            backgroundColor: selectedDifficulty !== 'all' ? 'var(--accent-terracotta-light)' : 'var(--bg-card)',
            border: `1px solid ${selectedDifficulty !== 'all' ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
            borderRadius: 'var(--radius-pill)',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: selectedDifficulty !== 'all' ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
            outline: 'none',
            cursor: 'pointer',
            minHeight: '40px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <option value="all">All Levels</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. ZERO RESULTS EMPTY STATE                                       */}
      {/* ------------------------------------------------------------------ */}
      {totalFilteredTopicsCount === 0 && (
        <div 
          className="card-white"
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            marginBottom: '16px'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-warm-cream)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            color: 'var(--text-muted)'
          }}>
            <Search size={22} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
            No matching topics found
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Try another search term or reset your level filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedDifficulty('all');
            }}
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: '12.5px', minHeight: '40px', borderRadius: 'var(--radius-pill)' }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. PHASE CARDS ACCORDION                                           */}
      {/* ------------------------------------------------------------------ */}
      {totalFilteredTopicsCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeRoadmap.phases?.map((phase, pIdx) => {
            const isExpanded = expandedPhases[phase.id] ?? false;
            const query = searchQuery.toLowerCase().trim();
            const filteredTopics = phase.topics?.filter((t) => {
              const matchesSearch = !query || 
                t.name.toLowerCase().includes(query) || 
                (t.description && t.description.toLowerCase().includes(query)) ||
                (phase.title && phase.title.toLowerCase().includes(query));
              const matchesDiff = selectedDifficulty === 'all' || t.difficulty === selectedDifficulty;
              return matchesSearch && matchesDiff;
            }) || [];

            if (filteredTopics.length === 0 && (searchQuery || selectedDifficulty !== 'all')) return null;

            const phaseTotal = phase.topics?.length || 0;
            const phaseDone = phase.topics?.filter((t) => t.status === 'completed').length || 0;
            const phasePercent = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;
            const isPhaseCompleted = phaseTotal > 0 && phaseDone === phaseTotal;
            const isPhaseCurrent = !isAllComplete && pIdx === currentPhaseIndex;
            const cleanPhaseTitle = phase.title.replace(/^Phase \d+:\s*/i, '').replace(/^Phase \d+ - \s*/i, '');
            const formattedPhaseNum = String(phase.number || pIdx + 1).padStart(2, '0');

            return (
              <div 
                key={phase.id || `phase_${pIdx}`}
                className="card-white"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg)',
                  border: isPhaseCurrent 
                    ? '1.5px solid var(--accent-terracotta)' 
                    : isPhaseCompleted 
                      ? '1px solid rgba(94, 140, 113, 0.35)' 
                      : '1px solid var(--border-beige)',
                  boxShadow: isPhaseCurrent ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  transition: 'all 200ms ease'
                }}
              >
                {/* Phase Header */}
                <div 
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`phase-panel-${phase.id}`}
                  onClick={() => togglePhase(phase.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePhase(phase.id);
                    }
                  }}
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    backgroundColor: isPhaseCurrent ? 'var(--accent-terracotta-light)' : isPhaseCompleted ? 'var(--accent-sage-light)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 150ms ease',
                    userSelect: 'none',
                    outline: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {/* Phase Number / Completion Circle */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      borderRadius: '12px',
                      backgroundColor: isPhaseCompleted 
                        ? 'var(--accent-sage)' 
                        : isPhaseCurrent 
                          ? 'var(--accent-terracotta)' 
                          : 'var(--bg-warm-cream-alt)',
                      color: isPhaseCompleted || isPhaseCurrent ? '#FFFFFF' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '13px',
                      flexShrink: 0
                    }}>
                      {isPhaseCompleted ? <Check size={18} strokeWidth={3} /> : formattedPhaseNum}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 800, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.06em', 
                          color: isPhaseCurrent ? 'var(--accent-terracotta)' : isPhaseCompleted ? 'var(--accent-sage)' : 'var(--text-muted)' 
                        }}>
                          PHASE {formattedPhaseNum}
                        </span>

                        {isPhaseCurrent && (
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            padding: '1px 6px', 
                            borderRadius: '9999px', 
                            backgroundColor: 'var(--accent-terracotta)', 
                            color: '#FFFFFF' 
                          }}>
                            CURRENT
                          </span>
                        )}

                        {isPhaseCompleted && (
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            padding: '1px 6px', 
                            borderRadius: '9999px', 
                            backgroundColor: 'var(--accent-sage)', 
                            color: '#FFFFFF' 
                          }}>
                            COMPLETED
                          </span>
                        )}
                      </div>

                      <h2 style={{ 
                        fontSize: '15px', 
                        fontWeight: 700, 
                        color: 'var(--text-charcoal)', 
                        wordBreak: 'break-word', 
                        lineHeight: '1.25' 
                      }}>
                        {cleanPhaseTitle}
                      </h2>

                      <div style={{ 
                        fontSize: '11.5px', 
                        color: 'var(--text-secondary)', 
                        fontWeight: 600, 
                        marginTop: '2px' 
                      }}>
                        {phaseDone} / {phaseTotal} topics completed
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Percentage & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, paddingLeft: '8px' }}>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 800, 
                      color: isPhaseCompleted ? 'var(--accent-sage)' : isPhaseCurrent ? 'var(--accent-terracotta)' : 'var(--text-secondary)' 
                    }}>
                      {phasePercent}%
                    </span>

                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Phase Progress Bar Track */}
                <div 
                  role="progressbar"
                  aria-valuenow={phasePercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cleanPhaseTitle} completion`}
                  style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'var(--border-beige-light)',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    width: `${phasePercent}%`,
                    height: '100%',
                    backgroundColor: isPhaseCompleted ? 'var(--accent-sage)' : isPhaseCurrent ? 'var(--accent-terracotta)' : 'var(--accent-terracotta)',
                    transition: 'width 250ms ease'
                  }} />
                </div>

                {/* Topics List Drilldown */}
                {isExpanded && (
                  <div 
                    id={`phase-panel-${phase.id}`}
                    style={{
                      borderTop: '1px solid var(--border-beige-light)',
                      padding: '8px 14px 14px 14px',
                      backgroundColor: 'var(--bg-warm-cream-alt)'
                    }}
                  >
                    {filteredTopics.map((topic, tIdx) => {
                      const isDone = topic.status === 'completed';
                      const isTopicCurrent = isPhaseCurrent && currentTopic?.name === topic.name;

                      return (
                        <div
                          key={topic.id || `topic_${phase.id}_${tIdx}`}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: `1px solid ${isTopicCurrent ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 14px',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            minHeight: '44px',
                            transition: 'border-color 150ms ease, box-shadow 150ms ease',
                            boxShadow: isTopicCurrent ? 'var(--shadow-sm)' : 'none'
                          }}
                        >
                          {/* Left: Checkmark & Details */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                            {/* Interactive Completion Status Toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRoadmapTopicStatus(phase.id, topic.id, isDone ? 'in_progress' : 'completed');
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                minWidth: '28px',
                                minHeight: '28px',
                                borderRadius: '50%',
                                backgroundColor: isDone ? 'var(--accent-sage)' : isTopicCurrent ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream)',
                                border: `1.5px solid ${isDone ? 'var(--accent-sage)' : isTopicCurrent ? 'var(--accent-terracotta)' : 'var(--border-beige-dark)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDone ? '#FFFFFF' : isTopicCurrent ? 'var(--accent-terracotta)' : 'transparent',
                                padding: 0,
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                              title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                              aria-label={isDone ? `Mark ${topic.name} as incomplete` : `Mark ${topic.name} as complete`}
                            >
                              {isDone ? (
                                <Check size={15} strokeWidth={3} />
                              ) : isTopicCurrent ? (
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-terracotta)' }} />
                              ) : (
                                <Circle size={12} color="var(--border-beige-dark)" />
                              )}
                            </button>

                            {/* Topic Title & Subtitle (Readable, NO aggressive strikethrough) */}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: isDone ? 600 : 700,
                                color: isDone ? 'var(--text-secondary)' : 'var(--text-charcoal)',
                                wordBreak: 'break-word',
                                lineHeight: '1.35'
                              }}>
                                {topic.name}
                              </div>

                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                marginTop: '2px', 
                                fontSize: '11px', 
                                color: 'var(--text-muted)',
                                flexWrap: 'wrap'
                              }}>
                                {topic.problemsCount ? <span>{topic.problemsCount} problems</span> : null}
                                {topic.problemsCount && topic.duration ? <span>•</span> : null}
                                {topic.duration ? <span>{topic.duration}</span> : null}
                                {isDone && (
                                  <span style={{ color: 'var(--accent-sage)', fontWeight: 700 }}>
                                    • Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Difficulty Pill & Study Action */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {/* Difficulty Pill */}
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: topic.difficulty === 'Hard' 
                                ? 'var(--accent-terracotta-light)' 
                                : topic.difficulty === 'Medium' 
                                  ? 'var(--accent-amber-light)' 
                                  : 'var(--accent-sage-light)',
                              color: topic.difficulty === 'Hard' 
                                ? 'var(--accent-terracotta)' 
                                : topic.difficulty === 'Medium' 
                                  ? 'var(--accent-amber)' 
                                  : 'var(--accent-sage)',
                              flexShrink: 0
                            }}>
                              {topic.difficulty || 'Medium'}
                            </span>

                            {/* Study Guide Action Button (Ensures Topic A opens Topic A) */}
                            <button
                              type="button"
                              onClick={() => {
                                openTaskStudyMaterial({
                                  id: topic.id || `topic_${phase.id}_${topic.name}`,
                                  taskId: topic.id || `topic_${phase.id}_${topic.name}`,
                                  name: topic.name,
                                  topic: topic.name,
                                  taskTitle: topic.name,
                                  phase: phase.title,
                                  roadmapPhase: phase.title,
                                  difficulty: topic.difficulty || 'Medium',
                                  learningObjectives: Array.isArray(topic.learningObjectives) && topic.learningObjectives.length > 0
                                    ? topic.learningObjectives
                                    : [
                                        `Master foundational concepts of ${topic.name}`,
                                        `Understand key patterns, algorithmic approaches, and complexity analysis`,
                                        `Solve standard placement interview problems for ${topic.name}`
                                      ],
                                  duration: topic.duration || '45m',
                                  estimatedMinutes: 45
                                });
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: isTopicCurrent ? 'var(--accent-terracotta)' : 'var(--bg-warm-cream)',
                                color: isTopicCurrent ? '#FFFFFF' : 'var(--text-charcoal)',
                                border: `1px solid ${isTopicCurrent ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                minHeight: '34px'
                              }}
                              title={`Open study guide for ${topic.name}`}
                              aria-label={`Study ${topic.name}`}
                            >
                              <BookOpen size={13} />
                              <span>Study</span>
                            </button>
                          </div>
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
      </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. REPLACE ROADMAP CONFIRMATION MODAL                               */}
      {/* ------------------------------------------------------------------ */}
      {isReplaceConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsReplaceConfirmOpen(false)}>
          <div 
            className="modal-content-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '24px' }}
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

            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
              Upload New Placement Roadmap?
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '22px' }}>
              Your current roadmap and active daily schedule will be replaced with the new syllabus once confirmed. Your historical study logs and analytics are safely preserved.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsReplaceConfirmOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '13px', minHeight: '44px' }}
              >
                Keep Current
              </button>

              <button
                type="button"
                onClick={handleConfirmReplace}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '13px', minHeight: '44px' }}
              >
                Upload New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. CUSTOMIZE / EDIT ROADMAP MODAL                                  */}
      {/* ------------------------------------------------------------------ */}
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

      {/* Safe bottom spacer for mobile floating navigation */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
