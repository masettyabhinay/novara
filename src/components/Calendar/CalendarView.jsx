import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  BookOpen, 
  Video, 
  ExternalLink, 
  Briefcase, 
  RotateCcw, 
  Check, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { AddCalendarEventModal } from './AddCalendarEventModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarView = () => {
  const { 
    calendarEvents, 
    calendarConflicts, 
    calendarCapacity, 
    calendarTarget,
    selectedCalendarDate, 
    setSelectedCalendarDate,
    setIsAddEventModalOpen, 
    setSelectedCalendarEvent,
    openCalendarEventTarget,
    refreshCalendarEvents,
    userProfile,
    showToast
  } = useApp();

  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 8, 1)); // September 2026
  const [activeTabSubView, setActiveTabSubView] = useState('calendar'); // 'calendar' | 'upcoming'

  useEffect(() => {
    if (refreshCalendarEvents) {
      refreshCalendarEvents();
    }
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedCalendarDate(today.toISOString().split('T')[0]);
  };

  // Calendar Grid Calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Adjust starting day (Monday = 0 ... Sunday = 6)
  let startingDayIndex = firstDayOfMonth.getDay() - 1;
  if (startingDayIndex === -1) startingDayIndex = 6;

  const totalGridCells = Math.ceil((startingDayIndex + daysInMonth) / 7) * 7;

  // Group events by YYYY-MM-DD
  const eventsByDate = {};
  (calendarEvents || []).forEach((evt) => {
    if (!evt.date) return;
    if (!eventsByDate[evt.date]) eventsByDate[evt.date] = [];
    eventsByDate[evt.date].push(evt);
  });

  const selectedDateEvents = eventsByDate[selectedCalendarDate] || [];

  // Selected date conflict check
  const selectedDateConflict = (calendarConflicts || []).find((c) => c.date === selectedCalendarDate);

  // Formatted selected date header
  const formatSelectedDateTitle = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    return (
      <span>
        {isToday && <strong style={{ color: 'var(--accent-terracotta)', marginRight: '6px' }}>TODAY •</strong>}
        {dateObj.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    );
  };

  return (
    <div style={{ animation: 'fadeIn 250ms ease', width: '100%' }}>
      {/* 1. Header & Navigation Controls */}
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
            Preparation Schedule
          </span>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
            marginBottom: '2px'
          }}>
            Calendar
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Everything important in your placement journey.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleGoToToday}
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '12px', borderRadius: 'var(--radius-pill)', fontWeight: 700 }}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCalendarEvent(null);
              setIsAddEventModalOpen(true);
            }}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              gap: '5px',
              boxShadow: '0 2px 8px rgba(200, 90, 50, 0.2)'
            }}
          >
            <Plus size={15} />
            <span>+ Add Event</span>
          </button>
        </div>
      </div>

      {/* 2. Target Milestone & Daily Capacity Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: calendarTarget ? 'repeat(2, 1fr)' : '1fr',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {/* Placement Target Banner */}
        {calendarTarget && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-beige)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)',
              flexShrink: 0
            }}>
              <Target size={18} />
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-terracotta)', letterSpacing: '0.04em' }}>
                🎯 Placement Target
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
                {calendarTarget.formattedDate} ({calendarTarget.daysRemaining} days remaining)
              </div>
            </div>
          </div>
        )}

        {/* Daily Study Capacity Gauge */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-sage-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-sage)',
            flexShrink: 0
          }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-sage)', letterSpacing: '0.04em' }}>
              Study Capacity
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-charcoal)', marginTop: '2px' }}>
              {calendarCapacity.capacityText || `${calendarCapacity.targetHoursText} daily target`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Schedule Conflict Warning Banner */}
      {selectedDateConflict && (
        <div style={{
          backgroundColor: 'var(--accent-terracotta-light)',
          border: '1px solid rgba(200, 90, 50, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--accent-terracotta)" flexShrink={0} />
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
              {selectedDateConflict.warningMessage}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--accent-terracotta)', fontWeight: 800, textTransform: 'uppercase' }}>
            Review Schedule
          </span>
        </div>
      )}

      {/* 4. Month Navigator Header */}
      <div className="card-white" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-warm-cream)',
                border: '1px solid var(--border-beige)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-charcoal)'
              }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-warm-cream)',
                border: '1px solid var(--border-beige)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-charcoal)'
              }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 5. Calendar 7-Day Grid Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          textAlign: 'center',
          marginBottom: '6px'
        }}>
          {DAY_NAMES.map((day) => (
            <div key={day} style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', padding: '4px 0' }}>
              {day}
            </div>
          ))}
        </div>

        {/* 6. Calendar Days Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px'
        }}>
          {Array.from({ length: totalGridCells }).map((_, index) => {
            const dayNum = index - startingDayIndex + 1;
            const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;

            if (!isCurrentMonth) {
              return (
                <div
                  key={`empty-${index}`}
                  style={{
                    minHeight: '74px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(250, 247, 242, 0.4)',
                    border: '1px dashed rgba(220, 214, 203, 0.4)'
                  }}
                />
              );
            }

            const monthStr = String(currentMonth + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const cellDateKey = `${currentYear}-${monthStr}-${dayStr}`;

            const dayEvents = eventsByDate[cellDateKey] || [];
            const isSelected = selectedCalendarDate === cellDateKey;
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = cellDateKey === todayStr;

            const hasStudy = dayEvents.some((e) => e.type === 'STUDY_TASK');
            const hasRevision = dayEvents.some((e) => e.type === 'REVISION');
            const hasInterview = dayEvents.some((e) => e.type === 'INTERVIEW' || e.type === 'ONLINE_ASSESSMENT');
            const hasDeadline = dayEvents.some((e) => e.type === 'APPLICATION_DEADLINE');
            const hasMock = dayEvents.some((e) => e.type === 'MOCK_INTERVIEW');

            return (
              <div
                key={cellDateKey}
                onClick={() => setSelectedCalendarDate(cellDateKey)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedCalendarDate(cellDateKey);
                  }
                }}
                style={{
                  minHeight: '74px',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 4px',
                  backgroundColor: isSelected ? '#FFFFFF' : isToday ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream)',
                  border: `2px solid ${isSelected ? 'var(--accent-terracotta)' : isToday ? 'rgba(200, 90, 50, 0.4)' : 'var(--border-beige-light)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 150ms ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(200, 90, 50, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isToday || isSelected ? 800 : 600,
                    color: isToday ? 'var(--accent-terracotta)' : 'var(--text-charcoal)'
                  }}>
                    {dayNum}
                  </span>

                  {dayEvents.length > 0 && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      backgroundColor: isSelected ? 'var(--accent-terracotta)' : 'var(--bg-card)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '0 4px'
                    }}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Category Dots / Labels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                  {hasInterview && (
                    <div style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      color: 'var(--accent-sage)',
                      backgroundColor: 'var(--accent-sage-light)',
                      borderRadius: '3px',
                      padding: '1px 3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      🎯 Interview
                    </div>
                  )}

                  {hasDeadline && (
                    <div style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      color: 'var(--accent-navy)',
                      backgroundColor: 'var(--accent-navy-light)',
                      borderRadius: '3px',
                      padding: '1px 3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      💼 Deadline
                    </div>
                  )}

                  {hasStudy && (
                    <div style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      color: 'var(--accent-terracotta)',
                      backgroundColor: 'var(--accent-terracotta-light)',
                      borderRadius: '3px',
                      padding: '1px 3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      💻 Study
                    </div>
                  )}

                  {hasRevision && (
                    <div style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      color: 'var(--accent-amber)',
                      backgroundColor: 'var(--accent-amber-light)',
                      borderRadius: '3px',
                      padding: '1px 3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      🧠 Revision
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 7. DAY VIEW / SELECTED DATE SCHEDULE INSPECTOR */}
      {/* =================================================================== */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Day Schedule
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '1px' }}>
              {formatSelectedDateTitle(selectedCalendarDate)}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedCalendarEvent(null);
              setIsAddEventModalOpen(true);
            }}
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px' }}
          >
            <Plus size={12} />
            <span>Add to Day</span>
          </button>
        </div>

        {selectedDateEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedDateEvents.map((event) => {
              const isStudy = event.type === 'STUDY_TASK';
              const isRevision = event.type === 'REVISION';
              const isInterview = event.type === 'INTERVIEW' || event.type === 'ONLINE_ASSESSMENT';
              const isDeadline = event.type === 'APPLICATION_DEADLINE';
              const isMock = event.type === 'MOCK_INTERVIEW';

              return (
                <div
                  key={event.id}
                  className="card-white"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${
                      isInterview ? 'var(--accent-sage)' :
                      isDeadline ? 'var(--accent-navy)' :
                      isRevision ? 'var(--accent-amber)' : 'var(--accent-terracotta)'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      minWidth: '65px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      marginTop: '2px'
                    }}>
                      {event.time || '10:00 AM'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span className={`pill-badge ${
                          isInterview ? 'pill-sage' :
                          isDeadline ? 'pill-navy' :
                          isRevision ? 'pill-amber' : 'pill-terracotta'
                        }`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                          {event.category}
                        </span>

                        {event.durationMinutes > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {event.durationMinutes} min
                          </span>
                        )}

                        {event.completed && (
                          <span style={{ fontSize: '10px', color: 'var(--accent-sage)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Check size={11} strokeWidth={3} /> Done
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.3', marginBottom: '2px' }}>
                        {event.title}
                      </h4>

                      {event.description && (
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contextual Action Button */}
                  <div style={{ flexShrink: 0 }}>
                    {isStudy && (
                      <button
                        type="button"
                        onClick={() => openCalendarEventTarget(event)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px' }}
                      >
                        <span>Start Focus</span>
                        <ArrowRight size={12} />
                      </button>
                    )}

                    {isRevision && (
                      <button
                        type="button"
                        onClick={() => openCalendarEventTarget(event)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px', backgroundColor: 'var(--accent-amber)' }}
                      >
                        <RotateCcw size={12} />
                        <span>Start Revision</span>
                      </button>
                    )}

                    {isInterview && (
                      <button
                        type="button"
                        onClick={() => openCalendarEventTarget(event)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px' }}
                      >
                        <Video size={12} />
                        <span>Prepare</span>
                      </button>
                    )}

                    {isDeadline && (
                      <button
                        type="button"
                        onClick={() => openCalendarEventTarget(event)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px' }}
                      >
                        <span>View Job</span>
                        <ExternalLink size={12} />
                      </button>
                    )}

                    {(isMock || event.isPersonal) && (
                      <button
                        type="button"
                        onClick={() => openCalendarEventTarget(event)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)' }}
                      >
                        Edit Event
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-white" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <CheckCircle2 size={28} color="var(--accent-sage)" style={{ margin: '0 auto 8px auto' }} />
            <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '2px' }}>
              Your schedule is clear on this day.
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Your study tasks, revisions, and placement events will appear here.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCalendarEvent(null);
                setIsAddEventModalOpen(true);
              }}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)' }}
            >
              + Add Personal Event
            </button>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 8. UPCOMING PLACEMENT EVENTS SECTION */}
      {/* =================================================================== */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Sparkles size={16} color="var(--accent-terracotta)" />
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
            Upcoming Highlights
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(calendarEvents || [])
            .filter((e) => e.date >= new Date().toISOString().split('T')[0])
            .slice(0, 5)
            .map((evt) => (
              <div
                key={`upcoming_${evt.id}`}
                onClick={() => openCalendarEventTarget(evt)}
                className="card-white"
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 150ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: evt.type === 'INTERVIEW' ? 'var(--accent-sage-light)' : 'var(--accent-terracotta-light)',
                    color: evt.type === 'INTERVIEW' ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {evt.type === 'INTERVIEW' ? <Video size={16} /> : <CalendarIcon size={16} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="pill-badge pill-neutral" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {evt.date}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        {evt.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {evt.time} • {evt.description}
                    </div>
                  </div>
                </div>

                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            ))}
        </div>
      </div>

      {/* Global Add / Edit Modal */}
      <AddCalendarEventModal />

      {/* Bottom spacer for floating navigation */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
