import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Brain, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export const TodayRevisionSection = () => {
  const { 
    revisionQueue, 
    startAdaptiveRevision, 
    setSelectedTopicDetail, 
    setIsTopicDetailOpen,
    setActiveTab,
    userProfile,
    todayTasks 
  } = useApp();

  // Filter due and overdue revisions
  const dueRevisions = (revisionQueue || []).filter(
    (r) => r.revisionDueDate === 'Today' || (r.revisionDueDate || '').startsWith('Overdue')
  );

  if (dueRevisions.length === 0) return null;

  // Calculate daily capacity check
  const totalPlannedTaskMinutes = (todayTasks || [])
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + (t.durationMinutes || 30), 0);
  const totalRevisionMinutes = dueRevisions.length * 15;
  const totalPlannedToday = totalPlannedTaskMinutes + totalRevisionMinutes;
  const userDailyCapacity = userProfile?.dailyStudyMinutes || 180;
  const isOverCapacity = totalPlannedToday > userDailyCapacity;

  return (
    <div style={{ marginBottom: '18px' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Brain size={16} color="var(--accent-terracotta)" />
          <h2 style={{
            fontSize: '14px',
            fontWeight: 800,
            color: 'var(--text-charcoal)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Today's Revision 🧠
          </h2>
          <span className="pill-badge pill-terracotta" style={{ padding: '2px 7px', fontSize: '10px' }}>
            {dueRevisions.length} due
          </span>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('revision')}
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--accent-terracotta)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span>All Revisions</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Daily Capacity Notice if close to limit */}
      {isOverCapacity && (
        <div style={{
          backgroundColor: 'var(--bg-warm-cream-alt)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} color="var(--accent-amber)" />
            <span>Daily study capacity is full ({totalPlannedToday}m / {userDailyCapacity}m).</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('revision')}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reschedule →
          </button>
        </div>
      )}

      {/* List of Compact Revision Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {dueRevisions.slice(0, 3).map((item) => {
          const retention = item.retentionScore || 65;
          const isOverdue = (item.revisionDueDate || '').startsWith('Overdue');

          return (
            <div
              key={item.id}
              className="card-white"
              style={{
                padding: '12px 14px',
                borderLeft: `3px solid ${isOverdue ? 'var(--accent-terracotta)' : 'var(--accent-sage)'}`,
                boxShadow: '0 1px 4px rgba(35, 25, 15, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span className={`pill-badge ${item.category === 'DSA' ? 'pill-terracotta' : 'pill-navy'}`} style={{ padding: '1px 6px', fontSize: '9.5px' }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: isOverdue ? 'var(--accent-terracotta)' : 'var(--accent-sage)' }}>
                      {item.revisionDueDate}
                    </span>
                  </div>

                  <h3 
                    onClick={() => {
                      setSelectedTopicDetail(item);
                      setIsTopicDetailOpen(true);
                    }}
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: 'var(--text-charcoal)',
                      lineHeight: '1.3',
                      cursor: 'pointer',
                      marginBottom: '2px'
                    }}
                  >
                    {item.topic}
                  </h3>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Retention: <strong>{retention}%</strong>
                    {retention < 60 && <span style={{ color: 'var(--accent-terracotta)', fontWeight: 700, marginLeft: '4px' }}>⚠ Low</span>}
                  </div>
                </div>

                {/* Start Revision Action */}
                <button
                  type="button"
                  onClick={() => startAdaptiveRevision(item)}
                  className="btn-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-pill)',
                    minHeight: '32px',
                    gap: '4px',
                    flexShrink: 0
                  }}
                >
                  <Brain size={13} />
                  <span>Start Revision</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
