import React, { useState, useEffect } from 'react';
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
  ArrowUpRight
} from 'lucide-react';
import { AddApplicationModal } from './AddApplicationModal';
import { ApplicationDetailModal } from './ApplicationDetailModal';

const STATUS_FILTERS = [
  'All',
  'Saved',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected'
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

  const metrics = applicationMetrics || {
    appliedCount: 0,
    inProcessCount: 0,
    interviewCount: 0,
    offerCount: 0,
    funnel: { appliedToAssessmentRate: 0, assessmentToInterviewRate: 0, interviewToOfferRate: 0 }
  };

  // Filter & Search
  const filteredApplications = (applications || []).filter((app) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      app.company.toLowerCase().includes(query) ||
      app.role.toLowerCase().includes(query) ||
      (app.location && app.location.toLowerCase().includes(query)) ||
      (app.notes && app.notes.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (activeFilter === 'All') return true;
    if (activeFilter === 'Assessment') return app.status === 'Online Assessment';
    return app.status.toLowerCase() === activeFilter.toLowerCase();
  });

  // Sort
  const sortedApplications = [...filteredApplications].sort((a, b) => {
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
      return a.company.localeCompare(b.company);
    }
    return 0;
  });

  const handleOpenDetail = (app) => {
    setSelectedApplication(app);
    setIsAppDetailsModalOpen(true);
  };

  const handleStartMockInterview = (company, role) => {
    setActiveTab('interview');
    showToast('Mock Interview Setup 🎙️', `Configuring mock round for ${company} ${role}...`, 'sage');
  };

  return (
    <div style={{ animation: 'fadeIn 250ms ease', width: '100%' }}>
      {/* 1. Header & Add Application Button */}
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
            Career Opportunities
          </span>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 800, 
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
            marginBottom: '2px'
          }}>
            Applications
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Keep track of every opportunity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddAppModalOpen(true)}
          className="btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: '12.5px',
            fontWeight: 700,
            borderRadius: 'var(--radius-pill)',
            gap: '6px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(200, 90, 50, 0.2)'
          }}
        >
          <Plus size={15} />
          <span>+ Add Application</span>
        </button>
      </div>

      {/* 2. Top 4 Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '18px'
      }}>
        <div className="card-white" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Applied
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
            {metrics.appliedCount}
          </div>
        </div>

        <div className="card-white" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            In Process
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {metrics.inProcessCount}
          </div>
        </div>

        <div className="card-white" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Interviews
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-terracotta)' }}>
            {metrics.interviewCount}
          </div>
        </div>

        <div className="card-white" style={{ padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
            Offers
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-sage)' }}>
            {metrics.offerCount}
          </div>
        </div>
      </div>

      {/* 3. Preparation Recommendation Banner if interview scheduled */}
      {appPrepRecommendation && (
        <div style={{
          backgroundColor: 'var(--accent-sage-light)',
          border: '1px solid rgba(94, 140, 113, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--accent-sage)" flexShrink={0} />
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                {appPrepRecommendation.advisoryText}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Recommended focus: <strong>{appPrepRecommendation.recommendedFocus}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleStartMockInterview(appPrepRecommendation.company, appPrepRecommendation.role)}
              className="btn-primary"
              style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)', gap: '4px' }}
            >
              <Video size={12} />
              <span>Start Mock Interview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '11.5px', borderRadius: 'var(--radius-pill)' }}
            >
              Open Today's Plan
            </button>
          </div>
        </div>
      )}

      {/* 4. Sub-Navigation Tabs: Pipeline vs Upcoming Timeline */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        borderBottom: '1px solid var(--border-beige-light)',
        paddingBottom: '8px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
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
              cursor: 'pointer'
            }}
          >
            All Applications ({applications.length})
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
              gap: '6px'
            }}
          >
            <span>Upcoming Calendar</span>
            {upcomingAppEvents.length > 0 && (
              <span style={{
                backgroundColor: 'var(--accent-terracotta)',
                color: '#FFFFFF',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)'
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
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-beige)',
              fontSize: '11.5px',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-secondary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="company">Sort: Company (A-Z)</option>
          </select>
        )}
      </div>

      {/* =================================================================== */}
      {/* VIEW 1: APPLICATION PIPELINE & LIST */}
      {/* =================================================================== */}
      {activeSubTab === 'pipeline' && (
        <>
          {/* Search Input & Status Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-pill)',
              padding: '7px 14px'
            }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search by company, role, location, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  fontSize: '12.5px',
                  outline: 'none',
                  color: 'var(--text-charcoal)'
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '4px 11px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: activeFilter === filter ? 'var(--accent-terracotta)' : '#FFFFFF',
                    color: activeFilter === filter ? '#FFFFFF' : 'var(--text-secondary)',
                    border: `1px solid ${activeFilter === filter ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
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

                return (
                  <div
                    key={app.id}
                    onClick={() => handleOpenDetail(app)}
                    className="card-white"
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 160ms ease',
                      borderLeft: `4px solid ${
                        app.status === 'Offer' ? 'var(--accent-sage)' :
                        app.status === 'Interview' ? 'var(--accent-terracotta)' :
                        app.status === 'Online Assessment' ? 'var(--accent-amber)' : 'var(--border-beige)'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span className={`pill-badge ${STATUS_BADGE_MAP[app.status] || 'pill-neutral'}`} style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                            {app.status}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {app.workType} • {app.location}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.25', marginBottom: '2px' }}>
                          {app.company}
                        </h3>

                        <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {app.role}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Applied: <strong>{app.applicationDate}</strong>
                        </span>
                        {app.deadline && (
                          <div style={{ fontSize: '10.5px', color: 'var(--accent-terracotta)', fontWeight: 700, marginTop: '2px' }}>
                            Deadline: {app.deadline}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Next scheduled interview highlight */}
                    {nextInterview && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-warm-cream-alt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-terracotta)', fontWeight: 700 }}>
                          <Clock size={13} />
                          <span>{nextInterview.title} ({new Date(nextInterview.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })})</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                          View Round →
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-white" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-terracotta-light)',
                color: 'var(--accent-terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Briefcase size={22} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
                {searchQuery || activeFilter !== 'All' ? 'No matching applications found' : 'Your placement journey starts here.'}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '340px', margin: '0 auto 16px auto', lineHeight: '1.4' }}>
                {searchQuery || activeFilter !== 'All' ? 'Try adjusting your search terms or filter.' : 'Track applications, interviews and offers in one unified workspace.'}
              </p>
              <button
                type="button"
                onClick={() => setIsAddAppModalOpen(true)}
                className="btn-primary"
                style={{ padding: '9px 20px', fontSize: '12.5px', borderRadius: 'var(--radius-pill)', gap: '6px' }}
              >
                <Plus size={14} />
                <span>+ Add Application</span>
              </button>
            </div>
          )}

          {/* 5. Application Conversion Analytics Section */}
          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <TrendingUp size={16} color="var(--accent-terracotta)" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                Application Conversion Funnel
              </h3>
            </div>

            <div className="card-white" style={{ padding: '16px 18px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Applied → OA
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '2px' }}>
                    {metrics.funnel?.appliedToAssessmentRate || 0}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {metrics.oaCount} of {metrics.appliedCount}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                    OA → Interview
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '2px' }}>
                    {metrics.funnel?.assessmentToInterviewRate || 0}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {metrics.interviewCount} of {metrics.oaCount}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Interview → Offer
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-sage)', marginTop: '2px' }}>
                    {metrics.funnel?.interviewToOfferRate || 0}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {metrics.offerCount} of {metrics.interviewCount}
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-warm-cream)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
                textAlign: 'center'
              }}>
                📊 Grounded in your {metrics.appliedCount} recorded placement applications.
              </div>
            </div>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: UPCOMING TIMELINE / CALENDAR */}
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
                  borderLeft: `4px solid ${evt.isInterview ? 'var(--accent-terracotta)' : 'var(--accent-amber)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className={`pill-badge ${evt.isInterview ? 'pill-terracotta' : 'pill-amber'}`} style={{ fontSize: '10px' }}>
                    {evt.relativeLabel}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {evt.time ? `⏰ ${evt.time}` : '📅 Deadline'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.25' }}>
                      {evt.company}
                    </h3>
                    <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {evt.title} ({evt.role})
                    </p>
                    {evt.notes && (
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {evt.notes}
                      </p>
                    )}
                  </div>

                  {evt.isInterview && (
                    <button
                      type="button"
                      onClick={() => handleStartMockInterview(evt.company, evt.role)}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '11px', borderRadius: 'var(--radius-pill)', gap: '4px', flexShrink: 0 }}
                    >
                      <Video size={12} />
                      <span>Prepare</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card-white" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <CheckCircle2 size={32} color="var(--accent-sage)" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '2px' }}>
                No upcoming deadlines or interviews scheduled.
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Add application deadlines and interview dates to track them here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Global Modals */}
      <AddApplicationModal />
      <ApplicationDetailModal />

      {/* Safe bottom spacer */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
