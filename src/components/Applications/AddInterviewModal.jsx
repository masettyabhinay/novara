import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Calendar, 
  Clock, 
  Check, 
  Sparkles,
  Users,
  Code2,
  Layers,
  FileText
} from 'lucide-react';

const INTERVIEW_TYPES = [
  'Technical',
  'DSA',
  'System Design',
  'HR',
  'Behavioral',
  'Other'
];

export const AddInterviewModal = ({ application, onClose }) => {
  const { addInterviewStage } = useApp();

  const [type, setType] = useState('Technical');
  const [title, setTitle] = useState('Technical Interview');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(16, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'DSA') setTitle('DSA & Problem Solving Round');
    else if (newType === 'System Design') setTitle('System Design Architecture Round');
    else if (newType === 'HR') setTitle('HR & Culture Fit Round');
    else if (newType === 'Behavioral') setTitle('Behavioral & Leadership Round');
    else if (newType === 'Technical') setTitle('Technical Interview Round 1');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!application) return;

    setIsSubmitting(true);
    setError('');
    try {
      await addInterviewStage(application.id, {
        type,
        title: title.trim() || `${type} Interview`,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status,
        notes: notes.trim(),
        result
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add interview round');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1060 }}>
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
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-terracotta)', letterSpacing: '0.04em' }}>
              {application?.company}
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.2', marginTop: '2px' }}>
              Add Interview Round
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
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
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Interview Type Selector */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '6px' }}>
              Interview Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {INTERVIEW_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  style={{
                    padding: '7px 8px',
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
              Round Title *
            </label>
            <input
              type="text"
              required
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

          {/* Scheduled Date & Time */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
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

          {/* Round Notes & Agenda */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Preparation Notes / Interviewer Info
            </label>
            <textarea
              rows={3}
              placeholder="Interviewer name, platform (Google Meet/Teams), topics to revise, questions asked..."
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
            <button
              type="button"
              onClick={onClose}
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
              <span>Save Round</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
