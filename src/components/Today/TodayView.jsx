import React from 'react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from './TaskCard';
import { StreakCard } from './StreakCard';
import { CoachCard } from '../Coach/CoachCard';
import { TodayRevisionSection } from './TodayRevisionSection';
import { 
  RotateCcw, 
  Sliders, 
  ArrowRight,
  UploadCloud
} from 'lucide-react';


export const TodayView = () => {
  const { 
    userProfile, 
    activeRoadmap,
    todayTasks, 
    revisionQueue, 
    setActiveTab,
    setIsUploadModalOpen,
    setIsAdaptiveModalOpen,
    lastPlanAdjustment
  } = useApp();

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning ☀️';
    if (hour < 17) return 'Good afternoon 🌤️';
    return 'Good evening 👋';
  };

  // Dynamic calculations
  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter((t) => t.completed).length;

  // Dynamic remaining time calculation
  const remainingMinutes = todayTasks
    .filter((t) => !t.completed)
    .reduce((acc, t) => acc + (t.durationMinutes || 30), 0);

  const formatHoursMins = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
  };

  return (
    <div style={{ animation: 'fadeIn 200ms ease', width: '100%' }}>
      {/* 1. Greeting */}
      <div style={{ marginBottom: '12px' }}>
        <h1 style={{ 
          fontSize: '21px', 
          fontWeight: 800, 
          color: 'var(--text-charcoal)',
          letterSpacing: '-0.02em',
          marginBottom: '2px',
          lineHeight: '1.25'
        }}>
          {getGreeting()}
        </h1>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Your placement journey, one day at a time.
        </p>
      </div>

      {/* 2. Daily Summary: 3 Compact Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '16px'
      }}>
        {/* Metric 1: Completion */}
        <div className="card-white" style={{ padding: '9px 6px', textAlign: 'center' }}>
          <div style={{ 
            fontSize: '9.5px', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            marginBottom: '1px'
          }}>
            Completion
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 800,
            color: completedTasks === totalTasks && totalTasks > 0 ? 'var(--accent-sage)' : 'var(--text-charcoal)'
          }}>
            {completedTasks}/{totalTasks}
          </div>
          <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
            tasks done
          </div>
        </div>

        {/* Metric 2: Dynamic Time Left */}
        <div className="card-white" style={{ padding: '9px 6px', textAlign: 'center' }}>
          <div style={{ 
            fontSize: '9.5px', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            marginBottom: '1px'
          }}>
            Time Left
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 800,
            color: remainingMinutes === 0 ? 'var(--accent-sage)' : 'var(--accent-terracotta)'
          }}>
            {remainingMinutes === 0 ? 'All done ✓' : formatHoursMins(remainingMinutes)}
          </div>
          <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
            remaining
          </div>
        </div>

        {/* Metric 3: Daily Target */}
        <div className="card-white" style={{ padding: '9px 6px', textAlign: 'center' }}>
          <div style={{ 
            fontSize: '9.5px', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            marginBottom: '1px'
          }}>
            Daily Target
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 800,
            color: 'var(--text-charcoal)'
          }}>
            {userProfile.dailyTargetHours}h
          </div>
          <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
            capacity
          </div>
        </div>
      </div>

      {/* 2.5 COMPACT AI PLACEMENT COACH CARD */}
      <CoachCard onOpenFullAnalysis={() => setActiveTab('coach')} />

      {/* Shortcut for New Users without Roadmap */}
      {!activeRoadmap && (
        <div 
          className="card-white" 
          style={{ 
            marginBottom: '16px', 
            padding: '18px 20px', 
            backgroundColor: 'var(--bg-warm-cream-alt)',
            border: '1.5px dashed var(--accent-terracotta)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-terracotta)', letterSpacing: '0.04em', marginBottom: '2px' }}>
              Start your preparation
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '2px' }}>
              Upload a roadmap to build your daily plan.
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              NOVARA will turn your syllabus into actionable daily missions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '12px', borderRadius: 'var(--radius-pill)', gap: '6px', flexShrink: 0 }}
          >
            <UploadCloud size={14} />
            <span>Upload Roadmap</span>
          </button>
        </div>
      )}

      {/* 3. TODAY'S MISSION (Primary Focus of Dashboard!) */}
      <div style={{ marginBottom: '18px' }}>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-charcoal)', lineHeight: '1.2' }}>
              Today's Mission
            </h2>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>

          {/* Quick adjust plan trigger */}
          <button
            onClick={() => setIsAdaptiveModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-terracotta)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--accent-terracotta-light)',
              cursor: 'pointer',
              minHeight: '28px'
            }}
          >
            <Sliders size={11} />
            <span>Adjust Plan</span>
          </button>
        </div>

        {/* Adaptive Adjustment Banner if active */}
        {lastPlanAdjustment && (
          <div style={{
            backgroundColor: 'var(--accent-sage-light)',
            border: '1px solid rgba(94, 140, 113, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 12px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px'
          }}>
            <span style={{ color: 'var(--accent-sage)', fontWeight: 700 }}>
              ✨ Your plan has been adjusted: {lastPlanAdjustment.summary}
            </span>
          </div>
        )}

        {/* Tasks List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {todayTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>

      {/* 4. TODAY'S REVISION SECTION */}
      <TodayRevisionSection />

      {/* 5. STREAK CARD (Placed after the main tasks list) */}
      <div style={{ marginBottom: '16px' }}>
        <StreakCard />
      </div>

      {/* Safe bottom spacer ensuring 100% visibility past floating bottom nav */}
      <div style={{ height: '70px', width: '100%', flexShrink: 0 }} />
    </div>
  );
};
