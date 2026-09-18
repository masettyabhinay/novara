import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Play, 
  Clock, 
  Award, 
  TrendingUp, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  Code2, 
  Database, 
  Cpu, 
  Users, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Building2,
  X,
  Target,
  BarChart3
} from 'lucide-react';
import { ActiveInterview } from './ActiveInterview';
import { InterviewResultModal } from './InterviewResultModal';
import { 
  startInterviewApi, 
  submitInterviewAnswerApi, 
  completeInterviewApi, 
  fetchInterviewHistoryApi,
  fetchActiveInterviewApi,
  cancelInterviewApi
} from '../../services/interviewService';
import { VisualMap, buildInterviewPrepMap } from '../VisualMap';

export const InterviewView = () => {
  const { 
    userProfile, 
    showToast, 
    pendingInterviewTarget, 
    setPendingInterviewTarget,
    refreshCoachSnapshot,
    setActiveTab
  } = useApp();

  // Configuration State
  const [selectedType, setSelectedType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [timeMinutes, setTimeMinutes] = useState(15);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRestoringActive, setIsRestoringActive] = useState(true);
  const [completedReport, setCompletedReport] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // History & Trend State
  const [historyData, setHistoryData] = useState({
    history: [],
    stats: { interviewsCompleted: 0, averageScore: 0, bestScore: 0, latestScore: 0, trendPoints: 0, trendLabel: 'No sessions yet' }
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const configCardRef = useRef(null);

  const interviewMapData = useMemo(() => {
    return buildInterviewPrepMap(historyData, activeSession, userProfile?.targetRole || 'Software Engineer');
  }, [historyData, activeSession, userProfile?.targetRole]);

  const handleMapNodeClick = (node) => {
    if (!node) return;
    if (node.id === 'int_step_domain' || node.id === 'int_step_session') {
      scrollToConfig();
    } else if (node.entityType === 'revision') {
      if (setActiveTab) setActiveTab('revision');
    } else if (node.entityType === 'profile') {
      if (setActiveTab) setActiveTab('profile');
    }
  };

  const supportedDomains = [
    { id: 'Technical', label: 'Technical', desc: 'Comprehensive mix of DSA, OS, and Architecture', icon: Code2 },
    { id: 'DSA', label: 'DSA', desc: 'Algorithms, Data Structures & Complexity', icon: Layers },
    { id: 'Core CS', label: 'Core CS', desc: 'Operating Systems, DBMS & Computer Networks', icon: Cpu },
    { id: 'SQL', label: 'SQL', desc: 'Queries, Indexing, Joins & Optimization', icon: Database },
    { id: 'AI / ML', label: 'AI / ML', desc: 'Machine Learning, Neural Nets & Data Pipelines', icon: Sparkles },
    { id: 'HR & Behavioral', label: 'HR & Behavioral', desc: 'STAR technique, leadership & scenario questions', icon: Users }
  ];

  // Sync with pendingInterviewTarget if deep-linked from Coach or Application or Notification
  useEffect(() => {
    if (pendingInterviewTarget) {
      if (pendingInterviewTarget.domain) {
        const matchedDomain = supportedDomains.find(
          d => d.id.toLowerCase() === pendingInterviewTarget.domain.toLowerCase() ||
               d.label.toLowerCase() === pendingInterviewTarget.domain.toLowerCase()
        );
        if (matchedDomain) {
          setSelectedType(matchedDomain.id);
        }
      }
      if (pendingInterviewTarget.difficulty) {
        const validDiffs = ['Easy', 'Medium', 'Hard', 'Mixed'];
        if (validDiffs.includes(pendingInterviewTarget.difficulty)) {
          setDifficulty(pendingInterviewTarget.difficulty);
        }
      }
    }
  }, [pendingInterviewTarget]);

  // Check for existing active session & load history on mount
  useEffect(() => {
    let isMounted = true;

    const initInterviewState = async () => {
      try {
        setIsRestoringActive(true);
        const existingSession = await fetchActiveInterviewApi();
        if (isMounted && existingSession && existingSession.id) {
          setActiveSession(existingSession);
          showToast('Active Interview Resumed', `Continuing your ${existingSession.type} session.`);
        }
      } catch (err) {
        console.warn('[Active Interview Check]', err);
      } finally {
        if (isMounted) setIsRestoringActive(false);
      }

      try {
        setIsLoadingHistory(true);
        const hist = await fetchInterviewHistoryApi();
        if (isMounted && hist) {
          setHistoryData(hist);
        }
      } catch (err) {
        console.warn('[Interview History Load]', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    initInterviewState();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await fetchInterviewHistoryApi();
      if (data) setHistoryData(data);
    } catch (e) {
      console.warn('[Interview History Load Error]', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleStartInterview = async () => {
    if (isStarting) return;

    // Validate domain
    const isValidDomain = supportedDomains.some(d => d.id === selectedType);
    if (!isValidDomain) {
      showToast('Validation Error', 'Please select a valid supported interview domain.', 'terracotta');
      return;
    }

    // Validate difficulty
    if (!['Easy', 'Medium', 'Hard', 'Mixed'].includes(difficulty)) {
      showToast('Validation Error', 'Invalid difficulty selected.', 'terracotta');
      return;
    }

    // Validate duration
    if (![15, 30, 45].includes(timeMinutes)) {
      showToast('Validation Error', 'Invalid interview duration selected.', 'terracotta');
      return;
    }

    setIsStarting(true);

    try {
      const payload = {
        type: selectedType,
        difficulty,
        questionCount,
        timeMinutes,
        targetRole: pendingInterviewTarget?.targetRole || userProfile?.targetRole || 'Software Engineer',
        company: pendingInterviewTarget?.company || null,
        applicationId: pendingInterviewTarget?.applicationId || null
      };

      const session = await startInterviewApi(payload);

      setActiveSession(session);
      showToast('Interview Started 🎤', `${selectedType} Mock Interview in progress.`);
    } catch (err) {
      showToast('Start Error', err.message || 'Could not start interview session.', 'terracotta');
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswerEvaluated = async (interviewId, questionIndex, answerText) => {
    return await submitInterviewAnswerApi(interviewId, questionIndex, answerText);
  };

  const handleCompleteSession = async (interviewId) => {
    try {
      const report = await completeInterviewApi(interviewId);
      setActiveSession(null);
      setCompletedReport(report);
      setIsResultModalOpen(true);
      await loadHistory();
      if (refreshCoachSnapshot) {
        refreshCoachSnapshot();
      }
    } catch (err) {
      showToast('Completion Error', err.message || 'Could not finish session.', 'terracotta');
    }
  };

  const handleCancelSession = async () => {
    if (activeSession?.id) {
      try {
        await cancelInterviewApi(activeSession.id);
      } catch (e) {
        console.warn('[Cancel Interview]', e);
      }
    }
    setActiveSession(null);
    showToast('Interview Cancelled', 'Active session ended.');
  };

  const handleOpenHistoricalReport = (item) => {
    setCompletedReport(item);
    setIsResultModalOpen(true);
  };

  const scrollToConfig = () => {
    if (configCardRef.current) {
      configCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // If in an active interview session, show the focused interview workspace
  if (activeSession) {
    return (
      <ActiveInterview
        session={activeSession}
        onAnswerEvaluated={handleAnswerEvaluated}
        onCompleteSession={handleCompleteSession}
        onCancelInterview={handleCancelSession}
      />
    );
  }

  // Calculate authentic domain performance from completed history records (zero fabrication)
  const domainPerformance = {};
  if (historyData.history && historyData.history.length > 0) {
    historyData.history.forEach((rec) => {
      const dom = rec.type || 'Technical';
      if (!domainPerformance[dom]) {
        domainPerformance[dom] = { count: 0, totalScore: 0 };
      }
      domainPerformance[dom].count += 1;
      domainPerformance[dom].totalScore += (rec.overallScore || 0);
    });
  }

  const hasSufficientTrend = historyData.history && historyData.history.length >= 2;

  return (
    <div className="interview-landing-wrapper" style={{ animation: 'fadeIn 200ms ease', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '18px' }}>
        <span className="pill-badge pill-terracotta" style={{ marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} /> Practice Under Pressure
        </span>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          color: 'var(--text-charcoal)',
          letterSpacing: '-0.02em',
          marginBottom: '4px',
          lineHeight: '1.2'
        }}>
          AI Mock Interviews
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          Benchmark your placement readiness with realistic technical, coding, and behavioral interview questions.
        </p>
      </div>

      {/* Deep Link Targeted Recommendation Banner (from Coach, Application, or Notification) */}
      {pendingInterviewTarget && (
        <div 
          className="card-white"
          style={{
            padding: '14px 16px',
            marginBottom: '16px',
            backgroundColor: 'var(--accent-terracotta-light)',
            border: '1.5px solid var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={20} color="var(--accent-terracotta)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                Targeted Recommendation: {pendingInterviewTarget.title || `${selectedType} Mock Interview`}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {pendingInterviewTarget.company ? `Tailored for ${pendingInterviewTarget.company} • ` : ''}
                Domain preset to {selectedType} ({difficulty})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPendingInterviewTarget(null)}
            aria-label="Clear targeted recommendation"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Visual Interview Pathway Map */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)', margin: 0 }}>
              Interview Preparation Pathway
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Config → Evaluation → Targeted Revision
          </span>
        </div>
        <div className="card-white" style={{ padding: '16px' }}>
          <VisualMap
            nodes={interviewMapData.nodes}
            edges={interviewMapData.edges}
            summary={interviewMapData.summary}
            direction="horizontal"
            onNodeClick={handleMapNodeClick}
            ariaLabel="Mock Interview Pathway Visual Map"
          />
        </div>
      </div>

      {/* 2. INTERVIEW CONFIGURATION CARD */}
      <div 
        ref={configCardRef}
        className="card-white" 
        style={{ padding: '20px', marginBottom: '20px', border: '1.5px solid var(--border-beige)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
              Start an Interview
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Choose your domain, difficulty, duration, and question count.
            </p>
          </div>
          <span className="pill-badge pill-sage" style={{ fontSize: '11px' }}>
            Authoritative Timer
          </span>
        </div>

        {/* Domain Selection Grid */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Choose Domain
          </label>
          <div className="interview-domain-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px'
          }}>
            {supportedDomains.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedType === mode.id;

              return (
                <button
                  type="button"
                  key={mode.id}
                  onClick={() => setSelectedType(mode.id)}
                  className="interview-domain-card"
                  aria-pressed={isSelected}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream-alt)',
                    border: isSelected ? '1.5px solid var(--accent-terracotta)' : '1px solid var(--border-beige-light)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    minHeight: '44px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Icon size={16} color={isSelected ? 'var(--accent-terracotta)' : 'var(--text-secondary)'} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? 'var(--accent-terracotta)' : 'var(--text-charcoal)' }}>
                      {mode.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                    {mode.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Controls (Difficulty, Question Count, Time Limit) */}
        <div 
          className="interview-config-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-beige-light)',
            marginBottom: '16px'
          }}
        >
          {/* Difficulty */}
          <div>
            <label 
              htmlFor="interview-difficulty-select"
              style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}
            >
              Difficulty
            </label>
            <select
              id="interview-difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-beige)',
                backgroundColor: 'var(--bg-warm-cream)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-charcoal)',
                minHeight: '44px'
              }}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {/* Time Duration */}
          <div>
            <label 
              htmlFor="interview-duration-select"
              style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}
            >
              Duration
            </label>
            <select
              id="interview-duration-select"
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-beige)',
                backgroundColor: 'var(--bg-warm-cream)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-charcoal)',
                minHeight: '44px'
              }}
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
            </select>
          </div>

          {/* Number of Questions */}
          <div>
            <label 
              htmlFor="interview-questions-select"
              style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}
            >
              Questions
            </label>
            <select
              id="interview-questions-select"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-beige)',
                backgroundColor: 'var(--bg-warm-cream)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-charcoal)',
                minHeight: '44px'
              }}
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          </div>
        </div>

        {/* Configuration Preview Box */}
        <div 
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-warm-cream-alt)',
            border: '1px solid var(--border-beige-light)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Domain: </span>
              <strong style={{ color: 'var(--accent-terracotta)' }}>{selectedType}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Difficulty: </span>
              <strong style={{ color: 'var(--text-charcoal)' }}>{difficulty}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Duration: </span>
              <strong style={{ color: 'var(--text-charcoal)' }}>{timeMinutes} min</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Questions: </span>
              <strong style={{ color: 'var(--text-charcoal)' }}>{questionCount}</strong>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ~{Math.round(timeMinutes / questionCount * 10) / 10} min per question
          </div>
        </div>

        {/* Primary CTA: Start Interview */}
        <button
          type="button"
          onClick={handleStartInterview}
          disabled={isStarting}
          className="btn-primary"
          style={{ 
            width: '100%', 
            padding: '14px', 
            fontSize: '15px', 
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Play size={16} fill="#FFFFFF" />
          <span>{isStarting ? 'Preparing Interview Session...' : 'Start Interview'}</span>
        </button>
      </div>

      {/* 3. PERFORMANCE TRENDS (Authentic calculation from completed records only) */}
      <div 
        className="card-white"
        style={{
          padding: '20px',
          marginBottom: '20px',
          border: '1.5px solid var(--border-beige)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
              Performance Trends
            </h2>
          </div>

          {hasSufficientTrend && (
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: historyData.stats.trendPoints >= 0 ? 'var(--accent-sage-light)' : 'var(--accent-terracotta-light)',
              color: historyData.stats.trendPoints >= 0 ? 'var(--accent-sage)' : 'var(--accent-terracotta)'
            }}>
              {historyData.stats.trendLabel}
            </span>
          )}
        </div>

        {!hasSufficientTrend ? (
          <div style={{ 
            padding: '20px 16px', 
            backgroundColor: 'var(--bg-warm-cream-alt)', 
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            border: '1px dashed var(--border-beige)'
          }}>
            <BarChart3 size={24} color="var(--text-muted)" style={{ margin: '0 auto 6px auto', display: 'block' }} />
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
              Complete more interviews to see your performance trend.
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              At least 2 completed sessions are required to calculate trends and domain benchmarks without fabrication.
            </div>
          </div>
        ) : (
          <div>
            {/* 4 Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '8px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 6px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-charcoal)' }}>
                  {historyData.stats.interviewsCompleted}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Completed</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 6px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>
                  {historyData.stats.averageScore}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Avg Score</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 6px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-sage)' }}>
                  {historyData.stats.bestScore}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Best Score</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '10px 6px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-navy)' }}>
                  {historyData.stats.latestScore}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Latest</div>
              </div>
            </div>

            {/* Domain Performance Breakdown */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Domain Performance Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(domainPerformance).map(([dom, data]) => {
                  const avg = Math.round(data.totalScore / data.count);
                  return (
                    <div key={dom} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ width: '120px', fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        {dom} ({data.count})
                      </div>
                      <div 
                        role="progressbar" 
                        aria-valuenow={avg} 
                        aria-valuemin={0} 
                        aria-valuemax={100}
                        aria-label={`${dom} average score ${avg}% across ${data.count} interviews`}
                        style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-beige-light)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}
                      >
                        <div style={{ width: `${avg}%`, height: '100%', backgroundColor: avg >= 70 ? 'var(--accent-sage)' : avg >= 40 ? 'var(--accent-amber)' : 'var(--accent-terracotta)' }} />
                      </div>
                      <div style={{ width: '45px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: avg >= 70 ? 'var(--accent-sage)' : 'var(--accent-terracotta)' }}>
                        {avg}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Score Bars with Accessible Text */}
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Recent Scores
              </div>
              <div 
                aria-label={`Recent interview scores: ${historyData.history.slice(0, 5).map(h => `${h.type} ${h.overallScore}%`).join(', ')}`}
                style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '60px', paddingTop: '10px' }}
              >
                {historyData.history.slice(0, 5).map((item, idx) => (
                  <div key={item.id || idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                      {item.overallScore}%
                    </div>
                    <div 
                      style={{ 
                        width: '100%', 
                        maxWidth: '32px',
                        height: `${Math.max(12, item.overallScore * 0.4)}px`, 
                        backgroundColor: item.overallScore >= 70 ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
                        borderRadius: '3px 3px 0 0'
                      }} 
                    />
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40px' }}>
                      {item.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. PERFORMANCE HISTORY */}
      <div className="card-white" style={{ padding: '20px', marginBottom: '20px', border: '1.5px solid var(--border-beige)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', margin: 0 }}>
              Interview History ({historyData.history.length})
            </h2>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Detailed logs and evaluations from your authentic mock sessions.
            </p>
          </div>
          {historyData.history.length > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Newest first
            </span>
          )}
        </div>

        {historyData.history.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px 16px', 
            backgroundColor: 'var(--bg-warm-cream-alt)', 
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-beige)'
          }}>
            <ShieldCheck size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
              No interviews yet
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', marginBottom: '14px' }}>
              Practice answering questions under real time pressure to build interview confidence.
            </div>
            <button
              type="button"
              onClick={scrollToConfig}
              className="btn-secondary"
              style={{ padding: '10px 18px', fontSize: '13px', minHeight: '44px', margin: '0 auto' }}
            >
              Start Your First Interview
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historyData.history.map((item) => {
              const score = item.overallScore !== undefined ? item.overallScore : 0;
              const scoreColor = score >= 70 ? 'var(--accent-sage)' : score >= 40 ? 'var(--accent-amber)' : 'var(--accent-terracotta)';
              const durationMin = item.durationSeconds ? Math.round(item.durationSeconds / 60) : (item.timeMinutes || 15);

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleOpenHistoricalReport(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-warm-cream-alt)',
                    border: '1px solid var(--border-beige-light)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: '44px',
                    width: '100%',
                    transition: 'all 150ms ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                        {item.type} Interview
                      </span>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        padding: '1px 6px', 
                        borderRadius: 'var(--radius-pill)', 
                        backgroundColor: 'var(--border-beige)', 
                        color: 'var(--text-charcoal)' 
                      }}>
                        {item.difficulty || 'Medium'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        • {item.date}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span>{item.questionsCount || item.questions?.length || 0} Questions</span>
                      <span>•</span>
                      <span>{durationMin} min</span>
                      {item.company && (
                        <>
                          <span>•</span>
                          <span style={{ fontWeight: 700, color: 'var(--accent-navy)' }}>{item.company}</span>
                        </>
                      )}
                      {item.strongestTopic && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--accent-sage)' }}>Top: {item.strongestTopic}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: scoreColor }}>
                        {score}/100
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Completed
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Result & Feedback Modal */}
      {isResultModalOpen && (
        <InterviewResultModal
          isOpen={isResultModalOpen}
          report={completedReport}
          onClose={() => setIsResultModalOpen(false)}
          onRestart={() => {
            setIsResultModalOpen(false);
            scrollToConfig();
          }}
        />
      )}

      {/* Bottom spacer */}
      <div style={{ height: '80px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
