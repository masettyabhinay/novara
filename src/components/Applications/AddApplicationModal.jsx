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
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-terracotta-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terracotta)'
            }}>
              <Briefcase size={16} />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Company *
              </label>
              <input
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
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Role *
              </label>
              <input
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
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Status & Work Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Status
              </label>
              <select
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
                  cursor: 'pointer'
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Work Type
              </label>
              <select
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
                  cursor: 'pointer'
                }}
              >
                {WORK_TYPES.map((wt) => (
                  <option key={wt} value={wt}>{wt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Application Date & Deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Application Date
              </label>
              <input
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
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
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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

          {/* Location & Job URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore / Remote / Hyderabad"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
                Job Posting URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
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
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '4px' }}>
              Notes & Recruiter Contact
            </label>
            <textarea
              rows={3}
              placeholder="Referral name, tech stack requirements, compensation, preparation focus..."
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

          {/* Bottom Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-beige-light)', marginTop: '6px' }}>
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
              <span>{editApplication ? 'Update Application' : 'Save Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
