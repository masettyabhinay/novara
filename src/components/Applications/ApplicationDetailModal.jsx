import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Briefcase, 
  Building2, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Brain,
  Video,
  Check,
  ChevronRight
} from 'lucide-react';
import { AddApplicationModal } from './AddApplicationModal';
import { AddInterviewModal } from './AddInterviewModal';

const STATUS_BADGE_CLASS = {
  'Saved': 'pill-neutral',
  'Applied': 'pill-navy',
  'Online Assessment': 'pill-amber',
  'Interview': 'pill-terracotta',
  'Offer': 'pill-sage',
  'Rejected': 'pill-neutral',
  'Withdrawn': 'pill-neutral'
};

export const ApplicationDetailModal = () => {
  const { 
    selectedApplication, 
    setSelectedApplication, 
    isAppDetailsModalOpen, 
    setIsAppDetailsModalOpen,
    deleteApplication,
    updateInterviewStage,
    deleteInterviewStage,
    setActiveTab,
    showToast
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingInterview, setIsAddingInterview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isAppDetailsModalOpen || !selectedApplication) return null;

  const app = selectedApplication;
  const interviews = app.interviews || [];

  // Check for upcoming interview
  const upcomingInterview = interviews.find((i) => i.status === 'scheduled');

  const handleDelete = async () => {
    try {
      await deleteApplication(app.id);
    } catch (e) {
      showToast('Error', 'Failed to delete application', 'terracotta');
    }
  };

  const handleStartMockInterview = () => {
    setIsAppDetailsModalOpen(false);
    setActiveTab('interview');
    showToast('Mock Interview Setup 🎙️', `Configuring mock round for ${app.company} ${app.role}...`, 'sage');
  };

  const handleToggleInterviewDone = async (intItem) => {
    const newStatus = intItem.status === 'completed' ? 'scheduled' : 'completed';
    const newResult = newStatus === 'completed' ? 'passed' : 'pending';
    try {
      await updateInterviewStage(app.id, intItem.id, {
        status: newStatus,
        result: newResult
      });
    } catch (e) {}
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsAppDetailsModalOpen(false)}>
        <div 
          className="modal-content-sheet" 
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '540px',
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
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-beige-light)'
          }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className={`pill-badge ${STATUS_BADGE_CLASS[app.status] || 'pill-neutral'}`}>
                  {app.status}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {app.workType} • {app.location}
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.25', marginBottom: '2px' }}>
                {app.company}
              </h2>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {app.role}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Edit Application"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={14} />
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete Application"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-terracotta)',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} />
              </button>

              <button
                type="button"
                onClick={() => setIsAppDetailsModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
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
          </div>

          {/* Scrollable Body */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Metadata Summary Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              backgroundColor: 'var(--bg-warm-cream)',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
              fontSize: '12px'
            }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Applied Date
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)', marginTop: '2px' }}>
                  {app.applicationDate || 'Not specified'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Deadline
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: app.deadline ? 'var(--accent-terracotta)' : 'var(--text-secondary)', marginTop: '2px' }}>
                  {app.deadline || 'No deadline set'}
                </div>
              </div>
            </div>

            {/* Job Posting Link */}
            {app.jobUrl && (app.jobUrl.startsWith('http://') || app.jobUrl.startsWith('https://')) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                border: '1px solid var(--border-beige-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <ExternalLink size={13} />
                  <span style={{ fontWeight: 600 }}>Original Job Posting</span>
                </div>

                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px', borderRadius: 'var(--radius-pill)', gap: '4px', textDecoration: 'none' }}
                >
                  <span>Open Job</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            )}

            {/* Preparation Advisory Banner (if upcoming interview) */}
            {upcomingInterview && (
              <div style={{
                backgroundColor: 'var(--accent-sage-light)',
                border: '1px solid rgba(94, 140, 113, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Sparkles size={16} color="var(--accent-sage)" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-sage)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Prepare for this interview
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-charcoal)', fontWeight: 600, marginTop: '2px' }}>
                      {upcomingInterview.title} ({formatDateTime(upcomingInterview.scheduledAt)})
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      Focus your daily preparation on relevant DSA patterns and mock interview simulation.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleStartMockInterview}
                    className="btn-primary"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '5px' }}
                  >
                    <Video size={13} />
                    <span>Start Mock Interview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAppDetailsModalOpen(false);
                      setActiveTab('today');
                    }}
                    className="btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)' }}
                  >
                    Open Today's Plan
                  </button>
                </div>
              </div>
            )}

            {/* Interview Stages & Timeline Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                  Interview Rounds & Timeline
                </h3>

                <button
                  type="button"
                  onClick={() => setIsAddingInterview(true)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px', borderRadius: 'var(--radius-pill)', gap: '4px' }}
                >
                  <Plus size={12} />
                  <span>Add Round</span>
                </button>
              </div>

              {interviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {interviews.map((intItem, idx) => (
                    <div
                      key={intItem.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: intItem.status === 'completed' ? 'var(--bg-warm-cream)' : '#FFFFFF',
                        border: `1.5px solid ${intItem.status === 'scheduled' ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                        fontSize: '12.5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                        <div
                          onClick={() => handleToggleInterviewDone(intItem)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: `2px solid ${intItem.status === 'completed' ? 'var(--accent-sage)' : 'var(--border-beige)'}`,
                            backgroundColor: intItem.status === 'completed' ? 'var(--accent-sage)' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {intItem.status === 'completed' && <Check size={13} strokeWidth={3} />}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="pill-badge pill-terracotta" style={{ padding: '1px 6px', fontSize: '9px' }}>
                              {intItem.type}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--text-charcoal)' }}>
                              {intItem.title}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            📅 {formatDateTime(intItem.scheduledAt)}
                          </div>

                          {intItem.notes && (
                            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                              {intItem.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteInterviewStage(app.id, intItem.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-warm-cream)',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  No interview rounds scheduled yet. Click <strong>+ Add Round</strong> to track online tests and interviews.
                </div>
              )}
            </div>

            {/* Application Notes */}
            {app.notes && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Notes & Contacts
                </h4>
                <div style={{
                  backgroundColor: 'var(--bg-warm-cream-alt)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: '12.5px',
                  color: 'var(--text-charcoal)',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-wrap'
                }}>
                  {app.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <AddApplicationModal
          editApplication={app}
          onClose={() => setIsEditing(false)}
        />
      )}

      {/* Add Interview Stage Modal */}
      {isAddingInterview && (
        <AddInterviewModal
          application={app}
          onClose={() => setIsAddingInterview(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 1070 }}>
          <div 
            className="modal-content-sheet" 
            style={{ padding: '24px', maxWidth: '400px', textAlign: 'center' }}
          >
            <AlertCircle size={32} color="var(--accent-terracotta)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
              Delete Application?
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Are you sure you want to remove <strong>{app.company}</strong> from your application tracker?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--accent-terracotta)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
