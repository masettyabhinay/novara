import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Clock, 
  ExternalLink, 
  ChevronRight, 
  Building2, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Video,
  ArrowRight,
  ArrowUpRight,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { AddApplicationModal } from './AddApplicationModal';
import { ApplicationDetailModal } from './ApplicationDetailModal';

const STATUS_FILTERS = [
  'All',
  'Saved',
  'Applied',
  'Online Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn'
];

const STATUS_BADGE_MAP = {
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
    return { label: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true, days: diffDays };
  } else if (diffDays === 0) {
    return { label: 'Due Today', isDueSoon: true, days: 0 };
  } else if (diffDays === 1) {
    return { label: 'Due Tomorrow', isDueSoon: true, days: 1 };
  } else {
    return { label: `In ${diffDays} days`, isDueSoon: diffDays <= 3, days: diffDays };
  }
};

export const ApplicationsView = () => {
  const { 
    applications, 
    applicationMetrics, 
    upcomingAppEvents, 
    appPrepRecommendation,
    refreshApplications, 
    setSelectedApplication, 
    setIsAppDetailsModalOpen, 
    setIsAddAppModalOpen,
    setActiveTab,
    setPendingInterviewTarget,
    showToast
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'deadline' | 'company'
  const [activeSubTab, setActiveSubTab] = useState('pipeline'); // 'pipeline' | 'upcoming'

  useEffect(() => {
    if (refreshApplications) {
      refreshApplications();
    }
  }, []);

  const totalAppsCount = applications?.length || 0;

  const metrics = useMemo(() => {
    if (applicationMetrics && typeof applicationMetrics.totalApplications === 'number') {
      return applicationMetrics;
    }
    const total = totalAppsCount;
    const applied = (applications || []).filter(a => a.status !== 'Saved').length;
    const inProcess = (applications || []).filter(a => ['Applied', 'Online Assessment', 'Interview'].includes(a.status)).length;
    const interviews = (applications || []).filter(a => a.status === 'Interview').length;
    const offers = (applications || []).filter(a => a.status === 'Offer').length;
    const rejected = (applications || []).filter(a => a.status === 'Rejected').length;
    return {
      totalApplications: total,
      appliedCount: applied,
      inProcessCount: inProcess,
      interviewCount: interviews,
      offerCount: offers,
      rejectedCount: rejected,
      funnel: { appliedToAssessmentRate: 0, assessmentToInterviewRate: 0, interviewToOfferRate: 0 }
    };
  }, [applicationMetrics, applications, totalAppsCount]);

  // Filter & Search
  const filteredApplications = useMemo(() => {
    return (applications || []).filter((app) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        (app.company && app.company.toLowerCase().includes(query)) ||
        (app.role && app.role.toLowerCase().includes(query)) ||
        (app.location && app.location.toLowerCase().includes(query)) ||
        (app.notes && app.notes.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (activeFilter === 'All') return true;
      if (activeFilter === 'OA') return app.status === 'Online Assessment';
      return app.status.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [applications, searchQuery, activeFilter]);

  // Sort
  const sortedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || b.applicationDate || 0) - new Date(a.createdAt || a.applicationDate || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || a.applicationDate || 0) - new Date(b.createdAt || b.applicationDate || 0);
      }
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (sortBy === 'company') {
        return (a.company || '').localeCompare(b.company || '');
      }
      return 0;
    });
  }, [filteredApplications, sortBy]);

  const handleOpenDetail = (app) => {
    setSelectedApplication(app);
    setIsAppDetailsModalOpen(true);
  };

  const handleStartMockInterview = (company, role, applicationId = null) => {
    if (setPendingInterviewTarget) {
      setPendingInterviewTarget({
        applicationId,
        company,
        role,
        domain: 'Technical'
      });
    }
    setActiveTab('interview');
    showToast('Mock Interview Setup 🎙️', `Configuring mock round for ${company} ${role}...`, 'sage');
  };

  return (
    <div 
      style={{ 
        animation: 'fadeIn 200ms ease', 
        width: '100%', 
        maxWidth: '840px', 
        margin: '0 auto', 
        padding: '8px 0 24px 0' 
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER & PRIMARY ADD CTA                                        */}
      {/* ------------------------------------------------------------------ */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span className="pill-badge pill-terracotta" style={{ fontSize: '10.5px', fontWeight: 800 }}>
              Placement Pipeline
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              • {totalAppsCount} Active Opportunities
            </span>
          </div>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
            marginBottom: '3px'
          }}>
            Applications
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Track your placement applications, assessments, interviews, and offers in one unified workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddAppModalOpen(true)}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '12.5px',
            fontWeight: 700,
            borderRadius: 'var(--radius-pill)',
            gap: '6px',
            whiteSpace: 'nowrap',
            minHeight: '44px',
            boxShadow: 'var(--shadow-sm)'
          }}
          aria-label="Add new job application"
        >
          <Plus size={15} />
          <span>+ Add Application</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SUMMARY METRICS (6 REAL PERSISTED METRIC TILES)                 */}
      {/* ------------------------------------------------------------------ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '8px',
        marginBottom: '18px'
      }}>
        <div className="card-white" style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border-beige)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Total
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: 1 }}>
            {metrics.totalApplications || totalAppsCount}
          </div>
        </div>

        <div className="card-white" style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border-beige)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Applied
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-navy)', lineHeight: 1 }}>
            {metrics.appliedCount || 0}
          </div>
        </div>

        <div className="card-white" style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border-beige)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            In Process
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-amber)', lineHeight: 1 }}>
            {metrics.inProcessCount || 0}
          </div>
        </div>

        <div className="card-white" style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border-beige)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Interviews
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-terracotta)', lineHeight: 1 }}>
            {metrics.interviewCount || 0}
          </div>
        </div>

        <div className="card-white" style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border-beige)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Offers
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-sage)', lineHeight: 1 }}>
            {metrics.offerCount || 0}
          </div>
        </div>

        <div className="card-white" style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border-beige)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Rejected
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary)', lineHeight: 1 }}>
            {metrics.rejectedCount || 0}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. PREPARATION ADVISORY BANNER                                      */}
      {/* ------------------------------------------------------------------ */}
      {appPrepRecommendation && (
        <div style={{
          backgroundColor: 'var(--accent-sage-light)',
          border: '1px solid rgba(94, 140, 113, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-sage)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-charcoal)', lineHeight: '1.3' }}>
                {appPrepRecommendation.advisoryText}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Recommended focus: <strong style={{ color: 'var(--text-charcoal)' }}>{appPrepRecommendation.recommendedFocus}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => handleStartMockInterview(appPrepRecommendation.company, appPrepRecommendation.role)}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px', minHeight: '34px' }}
            >
              <Video size={13} />
              <span>Start Mock</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', minHeight: '34px' }}
            >
              Today's Plan
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. SUB-TABS (PIPELINE VS UPCOMING TIMELINE) & SORT                 */}
      {/* ------------------------------------------------------------------ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        borderBottom: '1px solid var(--border-beige-light)',
        paddingBottom: '8px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('pipeline')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeSubTab === 'pipeline' ? 'var(--text-charcoal)' : 'transparent',
              color: activeSubTab === 'pipeline' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              minHeight: '36px'
            }}
          >
            All Applications ({totalAppsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('upcoming')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeSubTab === 'upcoming' ? 'var(--text-charcoal)' : 'transparent',
              color: activeSubTab === 'upcoming' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '36px'
            }}
          >
            <Calendar size={13} />
            <span>Upcoming Events</span>
            {upcomingAppEvents.length > 0 && (
              <span style={{
                backgroundColor: 'var(--accent-terracotta)',
                color: '#FFFFFF',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontWeight: 800
              }}>
                {upcomingAppEvents.length}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'pipeline' && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort applications"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-beige)',
              fontSize: '11.5px',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              color: 'var(--text-secondary)',
              outline: 'none',
              cursor: 'pointer',
              minHeight: '36px'
            }}
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="deadline">Sort: Upcoming Deadline</option>
            <option value="company">Sort: Company (A-Z)</option>
          </select>
        )}
      </div>

      {/* =================================================================== */}
      {/* 5. VIEW 1: APPLICATION PIPELINE & CARDS                             */}
      {/* =================================================================== */}
      {activeSubTab === 'pipeline' && (
        <>
          {/* Search Input & Status Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-pill)',
              padding: '8px 14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by company, role, location, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search applications"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  fontSize: '12.5px',
                  outline: 'none',
                  color: 'var(--text-charcoal)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    minHeight: '24px',
                    minWidth: '24px'
                  }}
                  title="Clear search query"
                  aria-label="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: activeFilter === filter ? 'var(--accent-terracotta)' : '#FFFFFF',
                    color: activeFilter === filter ? '#FFFFFF' : 'var(--text-secondary)',
                    border: `1px solid ${activeFilter === filter ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minHeight: '32px'
                  }}
                  aria-pressed={activeFilter === filter}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          {sortedApplications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedApplications.map((app) => {
                const nextInterview = app.interviews?.find((i) => i.status === 'scheduled');
                const deadlineInfo = getRelativeDeadlineInfo(app.deadline);
                const isFinished = ['Offer', 'Rejected', 'Withdrawn'].includes(app.status);

                return (
                  <div
                    key={app.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenDetail(app)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenDetail(app);
                      }
                    }}
                    className="card-white"
                    style={{
                      padding: '14px 18px',
                      cursor: 'pointer',
                      transition: 'all 160ms ease',
                      borderLeft: `4px solid ${
                        app.status === 'Offer' ? 'var(--accent-sage)' :
                        app.status === 'Interview' ? 'var(--accent-terracotta)' :
                        app.status === 'Online Assessment' ? 'var(--accent-amber)' : 'var(--border-beige)'
                      }`,
                      borderTop: '1px solid var(--border-beige)',
                      borderRight: '1px solid var(--border-beige)',
                      borderBottom: '1px solid var(--border-beige)',
                      borderRadius: 'var(--radius-md)',
                      outline: 'none'
                    }}
                    aria-label={`View details for ${app.company} ${app.role}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span className={`pill-badge ${STATUS_BADGE_MAP[app.status] || 'pill-neutral'}`} style={{ fontSize: '10px', padding: '1px 8px' }}>
                            {app.status}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {app.workType || 'Hybrid'} • {app.location || 'Remote'}
                          </span>
                        </div>

                        <h2 style={{ 
                          fontSize: '15px', 
                          fontWeight: 800, 
                          color: isFinished && app.status !== 'Offer' ? 'var(--text-secondary)' : 'var(--text-charcoal)', 
                          lineHeight: '1.25', 
                          marginBottom: '2px',
                          wordBreak: 'break-word'
                        }}>
                          {app.company}
                        </h2>

                        <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                          {app.role}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Applied: <strong>{app.applicationDate || 'Recent'}</strong>
                        </span>

                        {deadlineInfo && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: deadlineInfo.isOverdue ? 'var(--accent-terracotta)' : deadlineInfo.isDueSoon ? 'var(--accent-amber)' : 'var(--text-secondary)', 
                            fontWeight: 700, 
                            marginTop: '2px' 
                          }}>
                            {deadlineInfo.label}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Next scheduled interview highlight */}
                    {nextInterview && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--accent-terracotta-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-terracotta)', fontWeight: 700, minWidth: 0 }}>
                          <Clock size={14} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {nextInterview.title} ({new Date(nextInterview.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                          </span>
                        </div>
                        <span style={{ color: 'var(--accent-terracotta)', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                          View Round →
                        </span>
                      </div>
                    )}

                    {/* Notes preview if notes exist */}
                    {app.notes && !nextInterview && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        <FileText size={12} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-white" style={{ textAlign: 'center', padding: '48px 20px', border: '1px solid var(--border-beige)' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-terracotta-light)',
                color: 'var(--accent-terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Briefcase size={24} />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '6px' }}>
                {searchQuery || activeFilter !== 'All' ? 'No matching applications found' : 'No applications yet'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 20px auto', lineHeight: '1.45' }}>
                {searchQuery || activeFilter !== 'All' ? 'Try adjusting your search terms or clearing your filter to view all applications.' : 'Add your placement applications to track deadlines, interview rounds, and offers in one unified dashboard.'}
              </p>
              {searchQuery || activeFilter !== 'All' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('All');
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 20px', fontSize: '12.5px', borderRadius: 'var(--radius-pill)', minHeight: '40px' }}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddAppModalOpen(true)}
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '13px', borderRadius: 'var(--radius-pill)', gap: '6px', minHeight: '44px' }}
                >
                  <Plus size={15} />
                  <span>+ Add Application</span>
                </button>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* 6. CONVERSION FUNNEL ANALYTICS                                 */}
          {/* -------------------------------------------------------------- */}
          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <TrendingUp size={16} color="var(--accent-terracotta)" />
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                Application Conversion Funnel
              </h2>
            </div>

            <div className="card-white" style={{ padding: '16px 18px', border: '1px solid var(--border-beige)' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                    Applied → OA
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
                    {metrics.funnel?.appliedToAssessmentRate || 0}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {metrics.oaCount || 0} of {metrics.appliedCount || 0}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                    OA → Interview
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '2px' }}>
                    {metrics.funnel?.assessmentToInterviewRate || 0}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {metrics.interviewCount || 0} of {metrics.oaCount || 0}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                    Interview → Offer
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-sage)', marginTop: '2px' }}>
                    {metrics.funnel?.interviewToOfferRate || 0}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {metrics.offerCount || 0} of {metrics.interviewCount || 0}
                  </div>
                </div>
              </div>

              {/* Visual Funnel Bar */}
              <div style={{
                width: '100%',
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-warm-cream-alt)',
                overflow: 'hidden',
                display: 'flex'
              }}>
                <div style={{ width: `${metrics.funnel?.appliedToAssessmentRate || 0}%`, backgroundColor: 'var(--accent-navy)', height: '100%' }} />
                <div style={{ width: `${metrics.funnel?.assessmentToInterviewRate || 0}%`, backgroundColor: 'var(--accent-amber)', height: '100%' }} />
                <div style={{ width: `${metrics.funnel?.interviewToOfferRate || 0}%`, backgroundColor: 'var(--accent-sage)', height: '100%' }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: UPCOMING EVENTS & CALENDAR TIMELINE                         */}
      {/* =================================================================== */}
      {activeSubTab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {upcomingAppEvents.length > 0 ? (
            upcomingAppEvents.map((evt) => (
              <div 
                key={evt.id}
                className="card-white"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderLeft: `4px solid ${evt.type === 'interview' ? 'var(--accent-terracotta)' : 'var(--accent-amber)'}`,
                  borderTop: '1px solid var(--border-beige)',
                  borderRight: '1px solid var(--border-beige)',
                  borderBottom: '1px solid var(--border-beige)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: evt.type === 'interview' ? 'var(--accent-terracotta-light)' : 'var(--accent-amber-light)',
                    color: evt.type === 'interview' ? 'var(--accent-terracotta)' : 'var(--accent-amber)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {evt.type === 'interview' ? <Video size={17} /> : <Calendar size={17} />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {evt.company} • {evt.type === 'interview' ? 'Interview' : 'Deadline'}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-charcoal)', lineHeight: '1.3' }}>
                      {evt.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {evt.relativeTime || evt.date}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const matchedApp = applications.find(a => a.id === evt.applicationId);
                    if (matchedApp) handleOpenDetail(matchedApp);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11.5px', minHeight: '34px', borderRadius: 'var(--radius-pill)', flexShrink: 0 }}
                >
                  View Application
                </button>
              </div>
            ))
          ) : (
            <div className="card-white" style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid var(--border-beige)' }}>
              <Calendar size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                No upcoming application deadlines or interviews
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                When you add interview dates or application deadlines, they will appear here and sync with your Placement Calendar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. MODALS: ADD APPLICATION & APPLICATION DETAILS                   */}
      {/* ------------------------------------------------------------------ */}
      <AddApplicationModal />
      <ApplicationDetailModal />

      {/* Safe bottom spacer for mobile navigation */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
