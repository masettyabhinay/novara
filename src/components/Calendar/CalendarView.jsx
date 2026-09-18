import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ArrowRight,
  Filter,
  User,
  ListFilter
} from 'lucide-react';
import { AddCalendarEventModal } from './AddCalendarEventModal';
import { VisualMap, buildCalendarDayFlowMap } from '../VisualMap';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_FILTERS = [
  { key: 'ALL', label: 'All Events' },
  { key: 'STUDY_TASK', label: 'Study' },
  { key: 'REVISION', label: 'Revision' },
  { key: 'APPLICATION_DEADLINE', label: 'Deadlines' },
  { key: 'INTERVIEW', label: 'Interviews' },
  { key: 'PERSONAL_EVENT', label: 'Personal' }
];

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

  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (refreshCalendarEvents) {
      refreshCalendarEvents();
    }
  }, [refreshCalendarEvents]);

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
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todayStr = today.toISOString().split('T')[0];
    if (setSelectedCalendarDate) {
      setSelectedCalendarDate(todayStr);
    }
  };

  // Calendar Grid Calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Adjust starting day (Monday = 0 ... Sunday = 6)
  let startingDayIndex = firstDayOfMonth.getDay() - 1;
  if (startingDayIndex === -1) startingDayIndex = 6;

  const totalGridCells = Math.ceil((startingDayIndex + daysInMonth) / 7) * 7;

  // Filter events by selected category
  const filteredEvents = useMemo(() => {
    if (!calendarEvents || calendarEvents.length === 0) return [];
    if (selectedCategoryFilter === 'ALL') return calendarEvents;
    
    return calendarEvents.filter((evt) => {
      if (selectedCategoryFilter === 'STUDY_TASK') return evt.type === 'STUDY_TASK';
      if (selectedCategoryFilter === 'REVISION') return evt.type === 'REVISION';
      if (selectedCategoryFilter === 'APPLICATION_DEADLINE') return evt.type === 'APPLICATION_DEADLINE';
      if (selectedCategoryFilter === 'INTERVIEW') return evt.type === 'INTERVIEW' || evt.type === 'ONLINE_ASSESSMENT';
      if (selectedCategoryFilter === 'PERSONAL_EVENT') return evt.isPersonal || evt.type === 'PERSONAL_EVENT' || evt.type === 'MOCK_INTERVIEW';
      return true;
    });
  }, [calendarEvents, selectedCategoryFilter]);

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = {};
    (filteredEvents || []).forEach((evt) => {
      if (!evt.date) return;
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [filteredEvents]);

  const activeSelectedDate = selectedCalendarDate || new Date().toISOString().split('T')[0];
  const selectedDateEvents = eventsByDate[activeSelectedDate] || [];

  // Selected date conflict check
  const selectedDateConflicts = useMemo(() => {
    if (!calendarConflicts) return [];
    return calendarConflicts.filter((c) => c.date === activeSelectedDate);
  }, [calendarConflicts, activeSelectedDate]);

  const dayFlowMapData = useMemo(() => {
    return buildCalendarDayFlowMap(activeSelectedDate, calendarEvents, calendarConflicts);
  }, [activeSelectedDate, calendarEvents, calendarConflicts]);

  const handleDayFlowClick = (node) => {
    if (node?.data) {
      if (setSelectedCalendarEvent) setSelectedCalendarEvent(node.data);
      if (openCalendarEventTarget) openCalendarEventTarget(node.data);
    }
  };

  // Formatted selected date header
  const formatSelectedDateTitle = useCallback((dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    return (
      <span>
        {isToday && <strong style={{ color: 'var(--accent-terracotta)', marginRight: '6px' }}>TODAY •</strong>}
        {dateObj.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    );
  }, []);

  const totalEventCount = (calendarEvents || []).length;

  return (
    <div style={{ animation: 'fadeIn 250ms ease', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
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
          <span className="pill-badge pill-terracotta" style={{ marginBottom: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CalendarIcon size={12} />
            <span>Placement Timeline</span>
          </span>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
            margin: '2px 0'
          }}>
            Calendar
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Unified schedule for study sessions, revisions, application deadlines, and interviews.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleGoToToday}
            className="btn-secondary"
            aria-label="Jump to Today"
            style={{ 
              padding: '8px 14px', 
              fontSize: '12px', 
              borderRadius: 'var(--radius-pill)', 
              fontWeight: 700,
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CalendarIcon size={14} />
            <span>Today</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (setSelectedCalendarEvent) setSelectedCalendarEvent(null);
              if (setIsAddEventModalOpen) setIsAddEventModalOpen(true);
            }}
            className="btn-primary"
            aria-label="Add Calendar Event"
            style={{
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              gap: '6px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(200, 90, 50, 0.2)'
            }}
          >
            <Plus size={16} />
            <span>+ Add Event</span>
          </button>
        </div>
      </div>

      {/* 2. Target Milestone & Daily Capacity Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: calendarTarget ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Placement Target Banner */}
        {calendarTarget && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-beige)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)',
              flexShrink: 0
            }}>
              <Target size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-terracotta)', letterSpacing: '0.04em' }}>
                🎯 Placement Target
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
                {calendarTarget.formattedDate} • <span style={{ color: 'var(--accent-terracotta)' }}>{calendarTarget.daysRemaining} days remaining</span>
              </div>
            </div>
          </div>
        )}

        {/* Daily Study Capacity Gauge */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-beige)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent-sage-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-sage)',
            flexShrink: 0
          }}>
            <Clock size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-sage)', letterSpacing: '0.04em' }}>
              Study Capacity
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', marginTop: '2px' }}>
              {calendarCapacity?.capacityText || `${calendarCapacity?.targetHoursText || '3h'} daily target`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Chips */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '6px',
        marginBottom: '16px',
        scrollbarWidth: 'none'
      }}>
        {CATEGORY_FILTERS.map((f) => {
          const isSelected = selectedCategoryFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelectedCategoryFilter(f.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: isSelected ? 800 : 600,
                backgroundColor: isSelected ? 'var(--accent-terracotta)' : 'var(--bg-card)',
                color: isSelected ? '#FFFFFF' : 'var(--text-charcoal)',
                border: `1px solid ${isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
                minHeight: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Schedule Conflict Warning Banner */}
      {selectedDateConflicts.length > 0 && (
        <div style={{
          backgroundColor: 'var(--accent-terracotta-light)',
          border: '1px solid rgba(200, 90, 50, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--accent-terracotta)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
              {selectedDateConflicts[0].warningMessage}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--accent-terracotta)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Schedule Overlap
          </span>
        </div>
      )}

      {/* 5. Main Calendar Section (Responsive 2-column or stacked layout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* LEFT COLUMN: Month Navigator & Calendar Grid */}
        <div className="card-white" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Month Navigator Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  border: '1px solid var(--border-beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-charcoal)',
                  minHeight: '44px',
                  minWidth: '44px'
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  border: '1px solid var(--border-beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-charcoal)',
                  minHeight: '44px',
                  minWidth: '44px'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* 7-Day Grid Headers */}
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

          {/* Calendar Days Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            flex: 1
          }}>
            {Array.from({ length: totalGridCells }).map((_, index) => {
              const dayNum = index - startingDayIndex + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;

              if (!isCurrentMonth) {
                return (
                  <div
                    key={`empty-${index}`}
                    style={{
                      minHeight: '70px',
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
              const isSelected = activeSelectedDate === cellDateKey;
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = cellDateKey === todayStr;

              const hasStudy = dayEvents.some((e) => e.type === 'STUDY_TASK');
              const hasRevision = dayEvents.some((e) => e.type === 'REVISION');
              const hasInterview = dayEvents.some((e) => e.type === 'INTERVIEW' || e.type === 'ONLINE_ASSESSMENT');
              const hasDeadline = dayEvents.some((e) => e.type === 'APPLICATION_DEADLINE');
              const hasMockOrPersonal = dayEvents.some((e) => e.type === 'MOCK_INTERVIEW' || e.isPersonal);

              return (
                <div
                  key={cellDateKey}
                  onClick={() => setSelectedCalendarDate && setSelectedCalendarDate(cellDateKey)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${cellDateKey}: ${dayEvents.length} events`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (setSelectedCalendarDate) setSelectedCalendarDate(cellDateKey);
                    }
                  }}
                  style={{
                    minHeight: '70px',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 4px',
                    backgroundColor: isSelected ? 'var(--bg-card)' : isToday ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream)',
                    border: `2px solid ${isSelected ? 'var(--accent-terracotta)' : isToday ? 'rgba(200, 90, 50, 0.4)' : 'var(--border-beige-light)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 150ms ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(200, 90, 50, 0.15)' : 'none',
                    outline: 'none'
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
                        padding: '0 4px',
                        lineHeight: '1.4'
                      }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Category Badges */}
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

                    {hasMockOrPersonal && !hasInterview && !hasDeadline && !hasStudy && !hasRevision && (
                      <div style={{
                        fontSize: '8.5px',
                        fontWeight: 700,
                        color: 'var(--text-charcoal)',
                        backgroundColor: 'rgba(0,0,0,0.06)',
                        borderRadius: '3px',
                        padding: '1px 3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        ⭐ Event
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Day Schedule Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                Day Schedule
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', margin: '1px 0 0 0' }}>
                {formatSelectedDateTitle(activeSelectedDate)}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                if (setSelectedCalendarEvent) setSelectedCalendarEvent(null);
                if (setIsAddEventModalOpen) setIsAddEventModalOpen(true);
              }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-pill)', gap: '4px', minHeight: '38px' }}
            >
              <Plus size={14} />
              <span>Add to Day</span>
            </button>
          </div>

          {/* Day Flow Visual Timeline Map */}
          <div className="card-white" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Day Flow Timeline
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                Chronological sequence
              </span>
            </div>
            <VisualMap
              nodes={dayFlowMapData.nodes}
              edges={dayFlowMapData.edges}
              summary={dayFlowMapData.summary}
              direction="horizontal"
              onNodeClick={handleDayFlowClick}
              ariaLabel={`Day flow visual timeline for ${activeSelectedDate}`}
            />
          </div>

          {selectedDateEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      borderLeft: `4px solid ${
                        isInterview ? 'var(--accent-sage)' :
                        isDeadline ? 'var(--accent-navy)' :
                        isRevision ? 'var(--accent-amber)' : 'var(--accent-terracotta)'
                      }`,
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        minWidth: '68px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        marginTop: '2px'
                      }}>
                        {event.time || '10:00 AM'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span className={`pill-badge ${
                            isInterview ? 'pill-sage' :
                            isDeadline ? 'pill-navy' :
                            isRevision ? 'pill-amber' : 'pill-terracotta'
                          }`} style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                            {event.category}
                          </span>

                          {event.durationMinutes > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {event.durationMinutes} min
                            </span>
                          )}

                          {event.completed && (
                            <span style={{ fontSize: '10px', color: 'var(--accent-sage)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Check size={12} strokeWidth={3} /> Done
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.3', margin: '0 0 2px 0' }}>
                          {event.title}
                        </h4>

                        {event.description && (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
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
                          onClick={() => openCalendarEventTarget && openCalendarEventTarget(event)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px', minHeight: '36px' }}
                        >
                          <span>Start Focus</span>
                          <ArrowRight size={13} />
                        </button>
                      )}

                      {isRevision && (
                        <button
                          type="button"
                          onClick={() => openCalendarEventTarget && openCalendarEventTarget(event)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px', backgroundColor: 'var(--accent-amber)', minHeight: '36px' }}
                        >
                          <RotateCcw size={13} />
                          <span>Start Revision</span>
                        </button>
                      )}

                      {isInterview && (
                        <button
                          type="button"
                          onClick={() => openCalendarEventTarget && openCalendarEventTarget(event)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px', minHeight: '36px' }}
                        >
                          <Video size={13} />
                          <span>Prepare</span>
                        </button>
                      )}

                      {isDeadline && (
                        <button
                          type="button"
                          onClick={() => openCalendarEventTarget && openCalendarEventTarget(event)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px', minHeight: '36px' }}
                        >
                          <span>View App</span>
                          <Briefcase size={13} />
                        </button>
                      )}

                      {(isMock || event.isPersonal) && (
                        <button
                          type="button"
                          onClick={() => openCalendarEventTarget && openCalendarEventTarget(event)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', minHeight: '36px' }}
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
            <div className="card-white" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <CheckCircle2 size={32} color="var(--accent-sage)" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', margin: '0 0 4px 0' }}>
                Your schedule is clear on this day.
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
                Your study tasks, revisions, and placement events will appear here.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (setSelectedCalendarEvent) setSelectedCalendarEvent(null);
                  if (setIsAddEventModalOpen) setIsAddEventModalOpen(true);
                }}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-pill)', minHeight: '40px' }}
              >
                + Add Personal Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. UPCOMING HIGHLIGHTS SECTION */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} color="var(--accent-terracotta)" />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
            Upcoming Timeline Highlights
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(calendarEvents || [])
            .filter((e) => e.date >= new Date().toISOString().split('T')[0])
            .slice(0, 5)
            .map((evt) => (
              <div
                key={`upcoming_${evt.id}`}
                onClick={() => openCalendarEventTarget && openCalendarEventTarget(evt)}
                className="card-white"
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 150ms ease',
                  minHeight: '44px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
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

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="pill-badge pill-neutral" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                        {evt.date}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        {evt.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.time} • {evt.description}
                    </div>
                  </div>
                </div>

                <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
            ))}
        </div>
      </div>

      {/* Global Add / Edit Modal */}
      <AddCalendarEventModal />

      {/* Bottom spacer for mobile navigation */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
