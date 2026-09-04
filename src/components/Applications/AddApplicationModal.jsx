import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Briefcase, 
  Building2, 
  Calendar, 
  MapPin, 
  Link2, 
  FileText, 
  Check, 
  Globe 
} from 'lucide-react';

const STATUS_OPTIONS = [
  'Saved',
  'Applied',
  'Online Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
];

const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];

export const AddApplicationModal = ({ editApplication = null, onClose }) => {
  const { 
    isAddAppModalOpen, 
    setIsAddAppModalOpen, 
    createApplication, 
    updateApplication 
  } = useApp();

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('Applied');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('Hybrid');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Synchronize form when editing or opening
  useEffect(() => {
    if (editApplication) {
      setCompany(editApplication.company || '');
      setRole(editApplication.role || '');
      setStatus(editApplication.status || 'Applied');
      setApplicationDate(editApplication.applicationDate || new Date().toISOString().split('T')[0]);
      setDeadline(editApplication.deadline || '');
      setJobUrl(editApplication.jobUrl || '');
      setLocation(editApplication.location || '');
      setWorkType(editApplication.workType || 'Hybrid');
      setNotes(editApplication.notes || '');
    } else {
      setCompany('');
      setRole('');
      setStatus('Applied');
      setApplicationDate(new Date().toISOString().split('T')[0]);
      setDeadline('');
      setJobUrl('');
      setLocation('');
      setWorkType('Hybrid');
      setNotes('');
    }
    setError('');
  }, [editApplication, isAddAppModalOpen]);

  const handleClose = () => {
    if (onClose) onClose();
    else setIsAddAppModalOpen(false);
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (isAddAppModalOpen || editApplication)) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddAppModalOpen, editApplication]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!role.trim()) {
      setError('Job role is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        company: company.trim(),
        role: role.trim(),
        status,
        applicationDate,
        deadline: deadline || null,
        jobUrl: jobUrl.trim(),
        location: location.trim() || 'Remote',
        workType,
        notes: notes.trim()
      };

      if (editApplication) {
        await updateApplication(editApplication.id, payload);
      } else {
        await createApplication(payload);
      }
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAddAppModalOpen && !editApplication) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 22px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-beige)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
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
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)'
            }}>
              <Briefcase size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.2' }}>
                {editApplication ? 'Edit Application' : 'Add New Application'}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Track interview stages, notes, and deadlines.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              width: '32px',
              height: '32px',
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
            <X size={16} />
          </button>
        </div>

        {/* Error message */}
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
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Company & Role */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label htmlFor="app-company" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Company *
              </label>
              <input
                id="app-company"
                type="text"
                required
                placeholder="e.g. Microsoft, Google"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  color: 'var(--text-charcoal)',
                  minHeight: '40px'
                }}
              />
            </div>

            <div>
              <label htmlFor="app-role" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Role *
              </label>
              <input
                id="app-role"
                type="text"
                required
                placeholder="e.g. Software Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  color: 'var(--text-charcoal)',
                  minHeight: '40px'
                }}
              />
            </div>
          </div>

          {/* Status & Work Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label htmlFor="app-status" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Status
              </label>
              <select
                id="app-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-charcoal)',
                  minHeight: '40px'
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="app-worktype" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Work Type
              </label>
              <select
                id="app-worktype"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-charcoal)',
                  minHeight: '40px'
                }}
              >
                {WORK_TYPES.map((wt) => (
                  <option key={wt} value={wt}>{wt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Job Posting URL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label htmlFor="app-location" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Location
              </label>
              <input
                id="app-location"
                type="text"
                placeholder="e.g. Bengaluru, Hyderabad, Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  color: 'var(--text-charcoal)',
                  minHeight: '40px'
                }}
              />
            </div>

            <div>
              <label htmlFor="app-joburl" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Job Posting URL
              </label>
              <input
                id="app-joburl"
                type="url"
                placeholder="https://company.com/careers/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  color: 'var(--text-charcoal)',
                  minHeight: '40px'
                }}
              />
            </div>
          </div>

          {/* Dates: Application Date & Deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label htmlFor="app-applied-date" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Application Date
              </label>
              <input
                id="app-applied-date"
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  color: 'var(--text-charcoal)',
                  minHeight: '40px'
                }}
              />
            </div>

            <div>
              <label htmlFor="app-deadline" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Deadline / OA Expiry
              </label>
              <input
                id="app-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-beige)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-warm-cream)',
                  outline: 'none',
                  color: 'var(--text-charcoal)',
                  minHeight: '40px'
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="app-notes" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Notes, Referrals & Preparation Focus
            </label>
            <textarea
              id="app-notes"
              rows={3}
              placeholder="e.g. Referred by alumni, OA link on HackerRank, prepare Graph BFS and Sliding Window..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-beige)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-warm-cream)',
                outline: 'none',
                resize: 'vertical',
                color: 'var(--text-charcoal)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-beige-light)'
          }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              style={{ padding: '9px 18px', fontSize: '12.5px', borderRadius: 'var(--radius-pill)', minHeight: '44px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: '9px 24px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                gap: '6px',
                minHeight: '44px',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>{editApplication ? 'Update Application' : 'Save Application'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
