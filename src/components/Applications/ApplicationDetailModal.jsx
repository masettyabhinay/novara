import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  Layers
} from 'lucide-react';
import { AddApplicationModal } from './AddApplicationModal';
import { AddInterviewModal } from './AddInterviewModal';
import { VisualMap, buildApplicationJourneyMap } from '../VisualMap';

const STATUS_OPTIONS = [
  'Saved',
  'Applied',
  'Online Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
];

const STATUS_BADGE_CLASS = {
  'Saved': 'pill-neutral',
  'Applied': 'pill-navy',
  'Online Assessment': 'pill-amber',
  'Interview': 'pill-terracotta',
  'Offer': 'pill-sage',
  'Rejected': 'pill-neutral',
  'Withdrawn': 'pill-neutral'
};

const getRelativeDeadlineInfo = (deadlineStr) => {
  if (!deadlineStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deadlineStr);
  target.setHours(0, 0, 0, 0);
  
  if (isNaN(target.getTime())) return null;

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
  } else if (diffDays === 0) {
    return { label: 'Due Today', isDueSoon: true };
  } else if (diffDays === 1) {
    return { label: 'Due Tomorrow', isDueSoon: true };
  } else {
    return { label: `In ${diffDays} days`, isDueSoon: diffDays <= 3 };
  }
};

export const ApplicationDetailModal = () => {
  const { 
    selectedApplication, 
    setSelectedApplication, 
    isAppDetailsModalOpen, 
    setIsAppDetailsModalOpen,
    updateApplication,
    deleteApplication,
    updateInterviewStage,
    deleteInterviewStage,
    setActiveTab,
    setPendingInterviewTarget,
    showToast
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingInterview, setIsAddingInterview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAppDetailsModalOpen && !isEditing && !isAddingInterview && !showDeleteConfirm) {
        setIsAppDetailsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAppDetailsModalOpen, isEditing, isAddingInterview, showDeleteConfirm]);

  if (!isAppDetailsModalOpen || !selectedApplication) return null;

  const app = selectedApplication;
  const interviews = app.interviews || [];
  const deadlineInfo = getRelativeDeadlineInfo(app.deadline);

  const applicationMapData = useMemo(() => {
    return buildApplicationJourneyMap(app);
  }, [app]);

  const handleMapNodeClick = (node) => {
    if (node?.label && STATUS_OPTIONS.includes(node.label)) {
      handleStatusChange(node.label);
    }
  };

  // Check for upcoming interview
  const upcomingInterview = interviews.find((i) => i.status === 'scheduled');

  const handleStatusChange = async (newStatus) => {
    if (newStatus === app.status || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateApplication(app.id, { status: newStatus });
      setSelectedApplication({ ...app, status: newStatus });
      showToast('Status Updated', `${app.company} updated to ${newStatus}`, 'sage');
    } catch (e) {
      showToast('Error', 'Failed to update application status', 'terracotta');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApplication(app.id);
      setIsAppDetailsModalOpen(false);
      setShowDeleteConfirm(false);
    } catch (e) {
      showToast('Error', 'Failed to delete application', 'terracotta');
    }
  };

  const handleStartMockInterview = () => {
    if (setPendingInterviewTarget) {
      setPendingInterviewTarget({
        applicationId: app.id,
        company: app.company,
        role: app.role,
        domain: 'Technical'
      });
    }
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
    } catch (e) {
      showToast('Error', 'Failed to update interview stage', 'terracotta');
    }
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
            backgroundColor: 'var(--bg-card)',
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
            borderBottom: '1px solid var(--border-beige-light)',
            gap: '10px'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span className={`pill-badge ${STATUS_BADGE_CLASS[app.status] || 'pill-neutral'}`} style={{ fontSize: '10px', padding: '1px 8px' }}>
                  {app.status}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {app.workType || 'Hybrid'} • {app.location || 'Remote'}
                </span>
              </div>

              <h2 style={{ 
                fontSize: '19px', 
                fontWeight: 800, 
                color: 'var(--text-charcoal)', 
                lineHeight: '1.25', 
                marginBottom: '2px',
                wordBreak: 'break-word' 
              }}>
                {app.company}
              </h2>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                {app.role}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Edit Application"
                aria-label="Edit Application"
                style={{
                  width: '34px',
                  height: '34px',
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
                <Edit3 size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete Application"
                aria-label="Delete Application"
                style={{
                  width: '34px',
                  height: '34px',
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
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => setIsAppDetailsModalOpen(false)}
                title="Close"
                aria-label="Close"
                style={{
                  width: '34px',
                  height: '34px',
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
            
            {/* Application Journey Map */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Application Journey Map
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  Click stage to advance status
                </span>
              </div>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-warm-cream-alt)', border: '1px solid var(--border-beige)' }}>
                <VisualMap
                  nodes={applicationMapData.nodes}
                  edges={applicationMapData.edges}
                  summary={applicationMapData.summary}
                  direction="horizontal"
                  onNodeClick={handleMapNodeClick}
                  ariaLabel="Application Journey Visual Map"
                />
              </div>
            </div>

            {/* Quick Status Lifecycle Selector */}
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Update Pipeline Status
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {STATUS_OPTIONS.map((statusOpt) => (
                  <button
                    key={statusOpt}
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(statusOpt)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: app.status === statusOpt ? 'var(--text-charcoal)' : '#FFFFFF',
                      color: app.status === statusOpt ? '#FFFFFF' : 'var(--text-secondary)',
                      border: `1px solid ${app.status === statusOpt ? 'var(--text-charcoal)' : 'var(--border-beige)'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      minHeight: '32px',
                      opacity: isUpdatingStatus ? 0.7 : 1
                    }}
                  >
                    {statusOpt}
                  </button>
                ))}
              </div>
            </div>

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
                  {deadlineInfo && (
                    <span style={{ fontSize: '10.5px', marginLeft: '6px', color: deadlineInfo.isOverdue ? 'var(--accent-terracotta)' : 'var(--accent-amber)', fontWeight: 700 }}>
                      ({deadlineInfo.label})
                    </span>
                  )}
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
                  <Sparkles size={16} color="var(--accent-sage)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--accent-sage)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Prepare for this interview
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-charcoal)', fontWeight: 700, marginTop: '2px' }}>
                      {upcomingInterview.title} ({formatDateTime(upcomingInterview.scheduledAt)})
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                      Focus your daily preparation on relevant DSA patterns, behavioral framing, and mock simulation.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleStartMockInterview}
                    className="btn-primary"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '5px', minHeight: '36px' }}
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
                    style={{ padding: '7px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', minHeight: '36px' }}
                  >
                    Today's Plan
                  </button>
                </div>
              </div>
            )}

            {/* Interview Stages & Timeline Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                  Interview Rounds & Timeline ({interviews.length})
                </h3>

                <button
                  type="button"
                  onClick={() => setIsAddingInterview(true)}
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '11px', borderRadius: 'var(--radius-pill)', gap: '4px', minHeight: '32px' }}
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
                        fontSize: '12.5px',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleInterviewDone(intItem)}
                          aria-label={intItem.status === 'completed' ? 'Mark interview as scheduled' : 'Mark interview as completed'}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: `2px solid ${intItem.status === 'completed' ? 'var(--accent-sage)' : 'var(--border-beige-dark)'}`,
                            backgroundColor: intItem.status === 'completed' ? 'var(--accent-sage)' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginTop: '2px',
                            padding: 0
                          }}
                        >
                          {intItem.status === 'completed' && <Check size={14} strokeWidth={3} />}
                        </button>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span className="pill-badge pill-terracotta" style={{ padding: '1px 6px', fontSize: '9.5px' }}>
                              {intItem.type}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--text-charcoal)', wordBreak: 'break-word' }}>
                              {intItem.title}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            📅 {formatDateTime(intItem.scheduledAt)}
                          </div>

                          {intItem.notes && (
                            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4', wordBreak: 'break-word' }}>
                              {intItem.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteInterviewStage(app.id, intItem.id)}
                        aria-label={`Delete interview ${intItem.title}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '6px',
                          minHeight: '28px',
                          minWidth: '28px'
                        }}
                      >
                        <Trash2 size={14} />
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
                  No interview rounds scheduled yet. Click <strong>+ Add Round</strong> to track online assessments and interviews.
                </div>
              )}
            </div>

            {/* Application Notes */}
            {app.notes && (
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Notes & Contacts
                </h4>
                <div style={{
                  backgroundColor: 'var(--bg-warm-cream-alt)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: '12.5px',
                  color: 'var(--text-charcoal)',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
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
        <div className="modal-overlay" style={{ zIndex: 1070 }} onClick={() => setShowDeleteConfirm(false)}>
          <div 
            className="modal-content-sheet" 
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '24px', maxWidth: '400px', textAlign: 'center' }}
          >
            <AlertCircle size={32} color="var(--accent-terracotta)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
              Delete Application?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.45' }}>
              Are you sure you want to remove <strong>{app.company}</strong> from your application tracker? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', minHeight: '44px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--accent-terracotta)', minHeight: '44px' }}
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
