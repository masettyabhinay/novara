import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Clock, 
  Flame, 
  Check,
  Pause,
  BookOpen
} from 'lucide-react';

export const TaskCard = ({ task }) => {
  const { 
    toggleTaskCompletion, 
    startFocusSession, 
    activeFocusTask,
    activeFocusSession,
    setIsFocusModalOpen,
    openTaskStudyMaterial
  } = useApp();

  const isCurrentActive = activeFocusSession?.taskId === task.id || activeFocusTask?.id === task.id;

  // Category badge colors
  const getCategoryClass = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'DSA':
        return 'pill-terracotta';
      case 'CORE CS':
        return 'pill-navy';
      case 'CODING':
        return 'pill-terracotta';
      case 'SQL':
        return 'pill-purple';
      case 'APTITUDE':
        return 'pill-amber';
      case 'REVISION':
        return 'pill-sage';
      case 'COMMUNICATION':
      case 'INTERVIEW':
        return 'pill-purple';
      default:
        return 'pill-neutral';
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'High') {
      return (
        <span style={{
          fontSize: '10.5px',
          fontWeight: 700,
          color: 'var(--accent-terracotta)',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          <Flame size={11} fill="var(--accent-terracotta)" /> High
        </span>
      );
    }
    return (
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
        {priority}
      </span>
    );
  };

  const handleStartOrResume = () => {
    if (isCurrentActive) {
      setIsFocusModalOpen(true);
    } else {
      startFocusSession(task);
    }
  };

  const handleCardClick = (e) => {
    // If clicking buttons inside card, don't trigger modal
    if (e.target.closest('button')) return;
    openTaskStudyMaterial(task);
  };

  return (
    <div 
      className="card-white"
      onClick={handleCardClick}
      style={{
        marginBottom: '10px',
        padding: '14px 16px',
        backgroundColor: task.completed ? 'var(--bg-warm-cream-alt)' : isCurrentActive ? '#FFFAF7' : '#FFFFFF',
        borderColor: isCurrentActive ? 'var(--accent-terracotta)' : 'var(--border-beige)',
        opacity: task.completed ? 0.85 : 1,
        transition: 'all 180ms ease',
        boxShadow: task.completed ? 'none' : '0 1px 4px rgba(35, 25, 15, 0.03)',
        cursor: 'pointer'
      }}
    >
      {/* Top Meta Row: Category, Priority, Estimated Duration */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`pill-badge ${getCategoryClass(task.category)}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
            {task.category}
          </span>
          {getPriorityBadge(task.priority)}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontWeight: 600
        }}>
          <Clock size={12} strokeWidth={2} />
          <span>{task.estimatedDuration}</span>
        </div>
      </div>

      {/* Main Body: Checkbox, Title, and Description */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!task.completed) {
              openTaskStudyMaterial(task);
            } else {
              toggleTaskCompletion(task.id);
            }
          }}
          style={{
            marginTop: '1px',
            color: task.completed ? 'var(--accent-terracotta)' : 'var(--border-beige-dark)',
            minWidth: '24px',
            minHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            cursor: 'pointer'
          }}
          aria-label={task.completed ? "Mark incomplete" : "Open study material"}
        >
          {task.completed ? (
            <CheckCircle2 size={22} fill="var(--accent-terracotta-light)" strokeWidth={2.2} />
          ) : (
            <Circle size={22} strokeWidth={2} />
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 
            onClick={(e) => {
              e.stopPropagation();
              openTaskStudyMaterial(task);
            }}
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: task.completed ? 'var(--text-secondary)' : 'var(--text-charcoal)',
              textDecoration: task.completed ? 'line-through' : 'none',
              lineHeight: '1.3',
              cursor: 'pointer',
              marginBottom: '2px',
              wordBreak: 'break-word'
            }}
          >
            {task.name}
          </h3>

          <p style={{
            fontSize: '11.5px',
            color: task.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
            lineHeight: '1.4',
            wordBreak: 'break-word'
          }}>
            {task.description || task.notes}
          </p>

          {/* In-Progress Session Indicator */}
          {isCurrentActive && !task.completed && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              backgroundColor: 'var(--accent-terracotta-light)',
              padding: '2px 9px',
              borderRadius: 'var(--radius-pill)',
              marginTop: '5px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-terracotta)'
              }} />
              <span>In progress • Click Resume</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-beige-light)'
      }}>
        {!task.completed ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openTaskStudyMaterial(task);
              }}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                minHeight: '32px',
                gap: '5px'
              }}
            >
              <BookOpen size={12} color="var(--accent-terracotta)" />
              <span>Study</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartOrResume();
              }}
              className="btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                minHeight: '32px',
                gap: '5px'
              }}
            >
              <Play size={11} fill="#FFFFFF" />
              <span>{isCurrentActive ? 'Resume' : 'Start'}</span>
            </button>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              ✓ Completed • {task.actualMinutesStudied ? `${task.actualMinutesStudied} min studied` : task.estimatedDuration}
            </span>
            <button
              onClick={() => toggleTaskCompletion(task.id)}
              style={{
                fontSize: '11px',
                color: 'var(--accent-terracotta)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
