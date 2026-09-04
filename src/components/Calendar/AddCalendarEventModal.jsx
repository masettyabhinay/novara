import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  Trash2, 
  BookOpen, 
  Video, 
  Sparkles,
  FileText,
  AlertTriangle
} from 'lucide-react';

const EVENT_TYPES = [
  'Study Session',
  'Mock Interview',
  'Other'
];

export const AddCalendarEventModal = () => {
  const { 
    isAddEventModalOpen, 
    setIsAddEventModalOpen, 
    selectedCalendarEvent, 
    setSelectedCalendarEvent,
    selectedCalendarDate,
    createPersonalEvent, 
    updatePersonalEvent, 
    deletePersonalEvent 
  } = useApp();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Study Session');
  const [date, setDate] = useState(selectedCalendarDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00 AM');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (selectedCalendarEvent) {
      setTitle(selectedCalendarEvent.title || '');
      setType(selectedCalendarEvent.type === 'MOCK_INTERVIEW' ? 'Mock Interview' : selectedCalendarEvent.category || selectedCalendarEvent.eventType || 'Study Session');
      setDate(selectedCalendarEvent.date || selectedCalendarDate || new Date().toISOString().split('T')[0]);
      setTime(selectedCalendarEvent.time || '10:00 AM');
      setDurationMinutes(selectedCalendarEvent.durationMinutes || 45);
      setNotes(selectedCalendarEvent.notes || selectedCalendarEvent.description || '');
    } else {
      setTitle('');
      setType('Study Session');
      setDate(selectedCalendarDate || new Date().toISOString().split('T')[0]);
      setTime('10:00 AM');
      setDurationMinutes(45);
      setNotes('');
    }
    setError('');
    setShowDeleteConfirm(false);
  }, [selectedCalendarEvent, selectedCalendarDate, isAddEventModalOpen]);

  const handleClose = useCallback(() => {
    if (setIsAddEventModalOpen) setIsAddEventModalOpen(false);
    if (setSelectedCalendarEvent) setSelectedCalendarEvent(null);
    setShowDeleteConfirm(false);
  }, [setIsAddEventModalOpen, setSelectedCalendarEvent]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAddEventModalOpen) {
        handleClose();
      }
    };
    if (isAddEventModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddEventModalOpen, handleClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Event title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        type,
        date,
        time: time.trim() || '10:00 AM',
        durationMinutes: parseInt(durationMinutes, 10) || 30,
        notes: notes.trim()
      };

      if (selectedCalendarEvent && selectedCalendarEvent.isPersonal) {
        await updatePersonalEvent(selectedCalendarEvent.sourceId || selectedCalendarEvent.id, payload);
      } else {
        await createPersonalEvent(payload);
      }
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCalendarEvent) return;
    try {
      setIsSubmitting(true);
      await deletePersonalEvent(selectedCalendarEvent.sourceId || selectedCalendarEvent.id);
      handleClose();
    } catch (err) {
      setError('Failed to delete event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAddEventModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1060 }} role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title">
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 22px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-beige)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-beige-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)',
              flexShrink: 0
            }}>
              <CalendarIcon size={18} />
            </div>
            <div>
              <h2 id="calendar-modal-title" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.2', margin: 0 }}>
                {selectedCalendarEvent ? 'Edit Personal Event' : 'Schedule New Event'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Add study sessions, peer mocks, or milestones.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--accent-terracotta-light)',
            border: '1px solid rgba(200, 90, 50, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            fontSize: '12.5px',
            color: 'var(--accent-terracotta)',
            fontWeight: 600,
            marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Delete Confirmation Warning */}
        {showDeleteConfirm && (
          <div style={{
            backgroundColor: 'var(--accent-terracotta-light)',
            border: '1px solid rgba(200, 90, 50, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={16} color="var(--accent-terracotta)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                Delete this scheduled event?
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
              This personal event will be removed from your timeline.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', minHeight: '36px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px', minHeight: '36px', backgroundColor: 'var(--accent-terracotta)' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Event Type Selector */}
          <div>
            <label id="category-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '6px' }}>
              Event Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }} role="group" aria-labelledby="category-label">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: type === t ? 'var(--accent-terracotta)' : 'var(--bg-warm-cream)',
                    color: type === t ? '#FFFFFF' : 'var(--text-charcoal)',
                    border: `1px solid ${type === t ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    minHeight: '40px'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="evt-title-input" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Event Title *
            </label>
            <input
              id="evt-title-input"
              type="text"
              required
              placeholder="e.g. System Design Mock with Peer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-beige)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-warm-cream)',
                outline: 'none',
                minHeight: '44px'
              }}
            />
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label htmlFor="evt-date-input" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Date *
              </label>
              <input
                id="evt-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  minHeight: '44px'
                }}
              />
            </div>

            <div>
              <label htmlFor="evt-time-input" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Time *
              </label>
              <input
                id="evt-time-input"
                type="text"
                required
                placeholder="e.g. 07:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  minHeight: '44px'
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="evt-duration-select" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Duration (Minutes)
            </label>
            <select
              id="evt-duration-select"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-beige)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-warm-cream)',
                outline: 'none',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={90}>1.5 Hours</option>
              <option value={120}>2 Hours</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="evt-notes-input" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Notes & Agenda (Optional)
            </label>
            <textarea
              id="evt-notes-input"
              rows={3}
              placeholder="Partner link, topics to discuss, preparation instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-beige)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-warm-cream)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-beige-light)', marginTop: '4px' }}>
            {selectedCalendarEvent && selectedCalendarEvent.isPersonal && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-secondary"
                aria-label="Delete Event"
                style={{ padding: '10px 14px', color: 'var(--accent-terracotta)', minHeight: '44px', minWidth: '44px' }}
                title="Delete Event"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '11px', fontSize: '13px', minHeight: '44px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ flex: 1, padding: '11px', fontSize: '13px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Saving...' : selectedCalendarEvent ? 'Update Event' : 'Save Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
