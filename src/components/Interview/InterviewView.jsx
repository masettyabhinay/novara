import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { ActiveInterview } from './ActiveInterview';
import { InterviewResultModal } from './InterviewResultModal';
import { 
  startInterviewApi, 
  submitInterviewAnswerApi, 
  completeInterviewApi, 
  fetchInterviewHistoryApi 
} from '../../services/interviewService';

export const InterviewView = () => {
  const { userProfile, coachAnalysis, showToast } = useApp();

  // Configuration State
  const [selectedType, setSelectedType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [timeMinutes, setTimeMinutes] = useState(15);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [completedReport, setCompletedReport] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // History & Trend State
  const [historyData, setHistoryData] = useState({
    history: [],
    stats: { interviewsCompleted: 0, averageScore: 0, bestScore: 0, latestScore: 0, trendPoints: 0, trendLabel: 'No sessions yet' }
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load history on mount
  useEffect(() => {
    loadHistory();
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

  const interviewModes = [
    { id: 'Technical', label: 'Technical', desc: 'Comprehensive mix of DSA, OS, and Architecture', icon: Code2 },
    { id: 'DSA', label: 'DSA', desc: 'Algorithms, Data Structures & Complexity', icon: Layers },
    { id: 'Core CS', label: 'Core CS', desc: 'Operating Systems, DBMS & Computer Networks', icon: Cpu },
    { id: 'SQL', label: 'SQL', desc: 'Queries, Indexing, Joins & Optimization', icon: Database },
    { id: 'AI / ML', label: 'AI / ML', desc: 'Machine Learning, Neural Nets & Data Pipelines', icon: Sparkles },
    { id: 'HR & Behavioral', label: 'HR & Behavioral', desc: 'STAR technique, leadership & scenario questions', icon: Users }
  ];

  const handleStartInterview = async () => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const session = await startInterviewApi({
        type: selectedType,
        difficulty,
        questionCount,
        timeMinutes
      });

      setActiveSession(session);
      showToast('Interview Started 🎤', `${selectedType} Mock Interview in progress.`);
    } catch (err) {
      showToast('Start Error', err.message || 'Could not start interview.', 'terracotta');
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
      loadHistory();
    } catch (err) {
      showToast('Completion Error', err.message || 'Could not finish session.', 'terracotta');
    }
  };

  const handleOpenHistoricalReport = (item) => {
    setCompletedReport(item);
    setIsResultModalOpen(true);
  };

  // If in an active interview session, show the focused interview interface
  if (activeSession) {
    return (
      <ActiveInterview
        session={activeSession}
        onAnswerEvaluated={handleAnswerEvaluated}
        onCompleteSession={handleCompleteSession}
        onCancelInterview={() => {
          if (window.confirm('Are you sure you want to end this interview early?')) {
            setActiveSession(null);
          }
        }}
      />
    );
  }

  return (
    <div style={{ animation: 'fadeIn 200ms ease', width: '100%' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '18px' }}>
        <span className="pill-badge pill-terracotta" style={{ marginBottom: '4px' }}>
          <Sparkles size={11} /> Practice Under Pressure
        </span>
        <h1 style={{ 
          fontSize: '22px', 
          fontWeight: 800, 
          color: 'var(--text-charcoal)',
          letterSpacing: '-0.02em',
          marginBottom: '2px',
          lineHeight: '1.25'
        }}>
          Ready for your interview?
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Practice under pressure. Learn from every answer.
        </p>
      </div>

      {/* 2. Performance Trend Hero Banner (If user has completed interviews) */}
      {historyData.stats.interviewsCompleted > 0 && (
        <div 
          className="card-white"
          style={{
            padding: '16px 18px',
            marginBottom: '16px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid var(--border-beige)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} color="var(--accent-terracotta)" />
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Performance Trend
              </span>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: historyData.stats.trendPoints >= 0 ? 'var(--accent-sage-light)' : 'var(--accent-terracotta-light)',
              color: historyData.stats.trendPoints >= 0 ? 'var(--accent-sage)' : 'var(--accent-terracotta)'
            }}>
              {historyData.stats.trendLabel}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            textAlign: 'center'
          }}>
            <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '8px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-charcoal)' }}>
                {historyData.stats.interviewsCompleted}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Interviews</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '8px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>
                {historyData.stats.averageScore}%
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Avg Score</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '8px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-sage)' }}>
                {historyData.stats.bestScore}%
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Best Score</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-warm-cream-alt)', padding: '8px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-navy)' }}>
                {historyData.stats.latestScore}%
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Latest</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. INTERVIEW MODE SELECTOR */}
      <div className="card-white" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '12px' }}>
          Select Interview Domain
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px',
          marginBottom: '18px'
        }}>
          {interviewModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedType === mode.id;

            return (
              <div
                key={mode.id}
                onClick={() => setSelectedType(mode.id)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--accent-terracotta-light)' : 'var(--bg-warm-cream-alt)',
                  border: isSelected ? '1.5px solid var(--accent-terracotta)' : '1px solid var(--border-beige-light)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
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
              </div>
            );
          })}
        </div>

        {/* 4. SETTINGS CONTROLS (Difficulty, Question Count, Time Limit) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-beige-light)',
          marginBottom: '18px'
        }}>
          {/* Difficulty */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-beige)',
                backgroundColor: 'var(--bg-warm-cream)',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {/* Number of Questions */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Questions
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-beige)',
                backgroundColor: 'var(--bg-warm-cream)',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          </div>

          {/* Time Duration */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Time Limit
            </label>
            <select
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-beige)',
                backgroundColor: 'var(--bg-warm-cream)',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
            </select>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={handleStartInterview}
          disabled={isStarting}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '14px' }}
        >
          <Play size={15} fill="#FFFFFF" />
          <span>{isStarting ? 'Preparing Interview...' : `Start ${selectedType} Interview`}</span>
        </button>
      </div>

      {/* 5. INTERVIEW HISTORY & PAST SESSIONS */}
      <div className="card-white" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '12px' }}>
          Interview History ({historyData.history.length})
        </h3>

        {historyData.history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>No mock interviews completed yet.</div>
            <div style={{ fontSize: '11.5px', marginTop: '2px' }}>Start your first session above to benchmark your readiness.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historyData.history.map((item) => (
              <div
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
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal)' }}>
                      {item.type} Interview
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      • {item.date}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Strongest: {item.strongestTopic}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    color: item.overallScore >= 70 ? 'var(--accent-sage)' : 'var(--accent-terracotta)'
                  }}>
                    {item.overallScore}/100
                  </div>
                  <ChevronRight size={15} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result & Feedback Modal */}
      {isResultModalOpen && (
        <InterviewResultModal
          isOpen={isResultModalOpen}
          report={completedReport}
          onClose={() => setIsResultModalOpen(false)}
          onRestart={handleStartInterview}
        />
      )}

      {/* Bottom spacer */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
