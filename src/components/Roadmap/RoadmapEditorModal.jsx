import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Layers,
  Sparkles
} from 'lucide-react';

export const RoadmapEditorModal = ({ isOpen, onClose, roadmap, onSave }) => {
  if (!isOpen || !roadmap) return null;

  const [editableRoadmap, setEditableRoadmap] = useState(() => {
    try {
      return roadmap ? JSON.parse(JSON.stringify(roadmap)) : null;
    } catch (e) {
      return roadmap || null;
    }
  });

  React.useEffect(() => {
    if (roadmap) {
      try {
        setEditableRoadmap(JSON.parse(JSON.stringify(roadmap)));
      } catch (e) {
        setEditableRoadmap(roadmap);
      }
    }
  }, [roadmap]);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState('Medium');
  const [newTopicCount, setNewTopicCount] = useState(15);
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // Phase Title change
  const handlePhaseTitleChange = (phaseIndex, newTitle) => {
    const updated = { ...editableRoadmap };
    updated.phases[phaseIndex].title = newTitle;
    setEditableRoadmap(updated);
  };

  // Delete Topic
  const handleDeleteTopic = (phaseIndex, topicIndex) => {
    const updated = { ...editableRoadmap };
    updated.phases[phaseIndex].topics.splice(topicIndex, 1);
    setEditableRoadmap(updated);
  };

  // Move Topic Up / Down
  const handleMoveTopic = (phaseIndex, topicIndex, direction) => {
    const updated = { ...editableRoadmap };
    const topics = updated.phases[phaseIndex].topics;
    const targetIndex = direction === 'up' ? topicIndex - 1 : topicIndex + 1;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    const [movedTopic] = topics.splice(topicIndex, 1);
    topics.splice(targetIndex, 0, movedTopic);
    setEditableRoadmap(updated);
  };

  // Add Topic
  const handleAddTopic = (phaseIndex) => {
    if (!newTopicName.trim()) return;

    const updated = { ...editableRoadmap };
    const newTopic = {
      id: `custom-t-${Date.now()}`,
      name: newTopicName.trim(),
      status: 'upcoming',
      problemsCount: parseInt(newTopicCount) || 15,
      duration: '10h',
      difficulty: newTopicDifficulty
    };

    updated.phases[phaseIndex].topics.push(newTopic);
    setEditableRoadmap(updated);
    setNewTopicName('');
    setIsAddingTopic(false);
  };

  const handleSave = () => {
    onSave(editableRoadmap);
    onClose();
  };

  const currentPhase = editableRoadmap.phases[activePhaseIndex] || editableRoadmap.phases[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '22px',
          maxWidth: '560px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <span className="pill-badge pill-terracotta" style={{ marginBottom: '4px' }}>
              <Edit3 size={11} /> Edit Extracted Roadmap
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.2' }}>
              Customize Phases & Topics
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Phase Selector Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '14px',
          borderBottom: '1px solid var(--border-beige-light)'
        }}>
          {editableRoadmap.phases.map((phase, idx) => {
            const isActive = idx === activePhaseIndex;
            return (
              <button
                key={phase.id || idx}
                onClick={() => {
                  setActivePhaseIndex(idx);
                  setIsAddingTopic(false);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive ? 'var(--accent-terracotta)' : 'var(--bg-card)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  minHeight: '32px'
                }}
              >
                Phase {phase.number || idx + 1} ({phase.topics?.length || 0})
              </button>
            );
          })}
        </div>

        {/* Phase Title Editor */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Phase Title
          </label>
          <input
            type="text"
            value={currentPhase.title}
            onChange={(e) => handlePhaseTitleChange(activePhaseIndex, e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-beige)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: '#FFFFFF',
              color: 'var(--text-charcoal)',
              outline: 'none'
            }}
          />
        </div>

        {/* Topics List for Current Phase */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Topics in this phase ({currentPhase.topics?.length || 0})
            </span>

            {!isAddingTopic && (
              <button
                onClick={() => setIsAddingTopic(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--accent-terracotta)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--accent-terracotta-light)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={12} /> Add Topic
              </button>
            )}
          </div>

          {/* Inline Add Topic Box */}
          {isAddingTopic && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--accent-terracotta)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '10px',
              animation: 'fadeIn 150ms ease'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '8px' }}>
                Add New Topic
              </div>
              <input
                type="text"
                placeholder="e.g. Dynamic Programming on Trees"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '12px',
                  marginBottom: '8px',
                  outline: 'none'
                }}
                autoFocus
              />

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <select
                  value={newTopicDifficulty}
                  onChange={(e) => setNewTopicDifficulty(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-beige)',
                    fontSize: '11.5px',
                    outline: 'none',
                    backgroundColor: 'var(--bg-warm-cream)'
                  }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <input
                  type="number"
                  placeholder="Problems"
                  value={newTopicCount}
                  onChange={(e) => setNewTopicCount(e.target.value)}
                  style={{
                    width: '80px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-beige)',
                    fontSize: '11.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button
                  onClick={() => setIsAddingTopic(false)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px', minHeight: '30px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddTopic(activePhaseIndex)}
                  className="btn-primary"
                  style={{ padding: '4px 12px', fontSize: '11.5px', minHeight: '30px' }}
                >
                  Add Topic
                </button>
              </div>
            </div>
          )}

          {/* List of Topics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {currentPhase.topics?.map((topic, tIdx) => (
              <div
                key={topic.id || tIdx}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-beige)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-charcoal)',
                    wordBreak: 'break-word'
                  }}>
                    {topic.name}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px' }}>
                    <span>{topic.problemsCount || 15} problems</span>
                    <span>•</span>
                    <span style={{
                      color: topic.difficulty === 'Hard' ? 'var(--accent-terracotta)' : topic.difficulty === 'Medium' ? 'var(--accent-amber)' : 'var(--accent-sage)',
                      fontWeight: 700
                    }}>
                      {topic.difficulty || 'Medium'}
                    </span>
                  </div>
                </div>

                {/* Reorder and Delete Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={() => handleMoveTopic(activePhaseIndex, tIdx, 'up')}
                    disabled={tIdx === 0}
                    style={{
                      width: '26px',
                      height: '26px',
                      minHeight: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tIdx === 0 ? 'var(--border-beige)' : 'var(--text-secondary)',
                      padding: 0
                    }}
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>

                  <button
                    onClick={() => handleMoveTopic(activePhaseIndex, tIdx, 'down')}
                    disabled={tIdx === currentPhase.topics.length - 1}
                    style={{
                      width: '26px',
                      height: '26px',
                      minHeight: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tIdx === currentPhase.topics.length - 1 ? 'var(--border-beige)' : 'var(--text-secondary)',
                      padding: 0
                    }}
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>

                  <button
                    onClick={() => handleDeleteTopic(activePhaseIndex, tIdx)}
                    style={{
                      width: '26px',
                      height: '26px',
                      minHeight: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-terracotta)',
                      padding: 0,
                      marginLeft: '4px'
                    }}
                    title="Remove topic"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          display: 'flex',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-beige-light)'
        }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px', fontSize: '12.5px' }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ flex: 2, padding: '10px', fontSize: '12.5px' }}
          >
            <Check size={14} />
            <span>Save & Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
