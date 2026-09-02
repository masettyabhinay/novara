import React, { useState, useEffect } from 'react';
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
  FileText
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

  useEffect(() => {
    if (selectedCalendarEvent) {
      setTitle(selectedCalendarEvent.title || '');
      setType(selectedCalendarEvent.type === 'MOCK_INTERVIEW' ? 'Mock Interview' : selectedCalendarEvent.eventType || 'Study Session');
      setDate(selectedCalendarEvent.date || selectedCalendarDate || new Date().toISOString().split('T')[0]);
      setTime(selectedCalendarEvent.time || '10:00 AM');
      setDurationMinutes(selectedCalendarEvent.durationMinutes || 45);
      setNotes(selectedCalendarEvent.notes || '');
    } else {
      setTitle('');
      setType('Study Session');
      setDate(selectedCalendarDate || new Date().toISOString().split('T')[0]);
      setTime('10:00 AM');
      setDurationMinutes(45);
      setNotes('');
    }
    setError('');
  }, [selectedCalendarEvent, selectedCalendarDate, isAddEventModalOpen]);

  const handleClose = () => {
    setIsAddEventModalOpen(false);
    setSelectedCalendarEvent(null);
  };

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
        time,
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
      await deletePersonalEvent(selectedCalendarEvent.sourceId || selectedCalendarEvent.id);
      handleClose();
    } catch (err) {
      setError('Failed to delete event');
    }
  };

  if (!isAddEventModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1060 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)'
            }}>
              <CalendarIcon size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.2' }}>
                {selectedCalendarEvent ? 'Edit Personal Event' : 'Schedule New Event'}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Add study sessions, peer mocks, or milestones.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-beige)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--accent-terracotta-light)',
            border: '1px solid rgba(200, 90, 50, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            fontSize: '12px',
            color: 'var(--accent-terracotta)',
            fontWeight: 600,
            marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Event Type */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '6px' }}>
              Event Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: type === t ? 'var(--accent-terracotta)' : 'var(--bg-warm-cream)',
                    color: type === t ? '#FFFFFF' : 'var(--text-charcoal)',
                    border: `1px solid ${type === t ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. System Design Mock with Peer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-beige)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-warm-cream)',
                outline: 'none'
              }}
            />
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '12.5px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Time *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 07:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '12.5px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Duration (Minutes)
            </label>
            <select
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
                cursor: 'pointer'
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
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Notes & Agenda (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Partner link, topics to discuss, preparation instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-beige)',
                fontSize: '12.5px',
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
                onClick={handleDelete}
                className="btn-secondary"
                style={{ padding: '10px 14px', color: 'var(--accent-terracotta)' }}
                title="Delete Event"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '11px', fontSize: '13px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ flex: 1, padding: '11px', fontSize: '13px' }}
            >
              <Check size={15} />
              <span>{selectedCalendarEvent ? 'Update Event' : 'Save Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
