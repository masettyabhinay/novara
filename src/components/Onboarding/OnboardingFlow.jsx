import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SAMPLE_ROADMAPS } from '../../data/mockData';
import { 
  Compass, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Calendar, 
  Clock, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  GraduationCap,
  Layers,
  Code2,
  Brain,
  BarChart3,
  Cpu,
  Loader2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export const OnboardingFlow = () => {
  const { 
    isOnboardingOpen, 
    setIsOnboardingOpen, 
    userProfile, 
    generateDailyTasksFromRoadmap,
    setActiveTab,
    showToast,
    triggerConfetti
  } = useApp();

  const [step, setStep] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState(null);
  const [formData, setFormData] = useState({
    targetRole: userProfile?.targetRole || 'Software Engineer',
    customRole: '',
    targetDate: userProfile?.targetDate || '2026-11-20',
    dailyTargetHours: userProfile?.dailyTargetHours || 3.0,
    prepLevel: userProfile?.prepLevel || 'Intermediate',
    selectedPresetRoadmap: 'sde'
  });

  if (!isOnboardingOpen) return null;

  const rolesList = [
    { id: 'Software Engineer', label: 'Software Engineer', icon: Code2, desc: 'DSA, System Design, Core CS, OOP' },
    { id: 'AI/ML Engineer', label: 'AI/ML Engineer', icon: Brain, desc: 'PyTorch, ML Algorithms, Linear Algebra' },
    { id: 'Data Scientist', label: 'Data Scientist', icon: BarChart3, desc: 'Advanced SQL, Statistics, Modeling' },
    { id: 'Data Analyst', label: 'Data Analyst', icon: Layers, desc: 'SQL Windowing, PowerBI/Tableau, EDA' },
    { id: 'Other', label: 'Other Role', icon: Cpu, desc: 'Custom tech / product roadmap' }
  ];

  const timesList = [
    { hours: 1.0, label: '1 hour / day', desc: 'Light pace for busy semester' },
    { hours: 2.0, label: '2 hours / day', desc: 'Balanced steady consistency' },
    { hours: 3.0, label: '3 hours / day', desc: 'Recommended placement sprint' },
    { hours: 4.5, label: '4+ hours / day', desc: 'Intensive immersion / Bootcamp' }
  ];

  const levelsList = [
    { id: 'Beginner', label: 'Beginner', desc: 'Starting from scratch / fundamentals' },
    { id: 'Intermediate', label: 'Intermediate', desc: 'Know basic DSA, need speed & interview patterns' },
    { id: 'Advanced', label: 'Advanced', desc: 'Polishing hard topics, system design & live mocks' }
  ];

  const handleLaunchDailyPlan = async () => {
    if (isLaunching) return;

    setLaunchError(null);
    setIsLaunching(true);

    try {
      const selectedKey = formData.selectedPresetRoadmap || 'sde';
      const selectedRoadmap = SAMPLE_ROADMAPS[selectedKey] || SAMPLE_ROADMAPS.sde;

      if (!selectedRoadmap) {
        throw new Error('No roadmap selected. Please choose a roadmap before continuing.');
      }

      const finalRole = formData.targetRole === 'Other' && formData.customRole ? formData.customRole : formData.targetRole;

      await generateDailyTasksFromRoadmap(selectedRoadmap, {
        targetRole: finalRole,
        dailyTargetHours: formData.dailyTargetHours,
        targetDate: formData.targetDate,
        prepLevel: formData.prepLevel
      });

      setIsOnboardingOpen(false);
      setActiveTab('today');
    } catch (err) {
      console.error('[Launch Plan Error]', err);
      setLaunchError(err.message || "Couldn't create your daily plan.");
      showToast('Plan Launch Error', err.message || "Couldn't create your daily plan.", 'terracotta');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleLaunchDailyPlan();
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content-sheet"
        style={{ padding: '30px 26px', maxWidth: '480px' }}
      >
        {/* Top Progress Track */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-terracotta)' }}>
              Step {step} of 5
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {Math.round((step / 5) * 100)}% Completed
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '6px',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-warm-cream-alt)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(step / 5) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--accent-terracotta)',
              borderRadius: '9999px',
              transition: 'width 300ms ease'
            }} />
          </div>
        </div>

        {/* STEP 1: TARGET ROLE */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
              Welcome to NOVARA 👋
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Let's build your career journey. What role are you targeting?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {rolesList.map((r) => {
                const isSelected = formData.targetRole === r.id;
                const Icon = r.icon;
                return (
                  <div
                    key={r.id}
                    onClick={() => setFormData({ ...formData, targetRole: r.id })}
                    className="card-white interactive"
                    style={{
                      padding: '14px 16px',
                      borderColor: isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige)',
                      backgroundColor: isSelected ? 'var(--accent-terracotta-light)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'var(--accent-terracotta)' : 'var(--bg-warm-cream)',
                        color: isSelected ? '#FFFFFF' : 'var(--accent-terracotta)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {r.desc}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                      backgroundColor: isSelected ? 'var(--accent-terracotta)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF'
                    }}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: TARGET DATE */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
              Target Placement Date 🎯
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              When do your placement drives or target company interviews begin?
            </p>

            <div className="card-white" style={{ marginBottom: '20px', padding: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '8px' }}>
                Select Target Date
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'var(--bg-warm-cream)',
                border: '1px solid var(--border-beige)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}>
                <Calendar size={18} color="var(--accent-terracotta)" />
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                {['2026-10-15', '2026-11-20', '2026-12-30'].map((presetDate, i) => (
                  <button
                    key={presetDate}
                    type="button"
                    onClick={() => setFormData({ ...formData, targetDate: presetDate })}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: formData.targetDate === presetDate ? 'var(--accent-terracotta)' : 'var(--bg-warm-cream-alt)',
                      color: formData.targetDate === presetDate ? '#FFFFFF' : 'var(--text-secondary)',
                      border: '1px solid var(--border-beige)'
                    }}
                  >
                    {i === 0 ? '45-Day' : i === 1 ? '90-Day' : '120-Day'} Sprint
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DAILY PREPARATION TIME */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
              Daily Study Capacity ⏱️
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              How much time can you realistically dedicate every day?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {timesList.map((t) => {
                const isSelected = formData.dailyTargetHours === t.hours;
                return (
                  <div
                    key={t.hours}
                    onClick={() => setFormData({ ...formData, dailyTargetHours: t.hours })}
                    className="card-white interactive"
                    style={{
                      padding: '14px 16px',
                      borderColor: isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige)',
                      backgroundColor: isSelected ? 'var(--accent-terracotta-light)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Clock size={18} color="var(--accent-terracotta)" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {t.desc}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                      backgroundColor: isSelected ? 'var(--accent-terracotta)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF'
                    }}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: PREPARATION LEVEL */}
        {step === 4 && (
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
              Current Preparation Level 📊
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              We'll calibrate the difficulty curve and spaced revision intervals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {levelsList.map((lvl) => {
                const isSelected = formData.prepLevel === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => setFormData({ ...formData, prepLevel: lvl.id })}
                    className="card-white interactive"
                    style={{
                      padding: '16px',
                      borderColor: isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige)',
                      backgroundColor: isSelected ? 'var(--accent-terracotta-light)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        {lvl.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {lvl.desc}
                      </div>
                    </div>

                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige)'}`,
                      backgroundColor: isSelected ? 'var(--accent-terracotta)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF'
                    }}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: UPLOAD OR SELECT ROADMAP */}
        {step === 5 && (
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '4px' }}>
              Bring your roadmap 🗺️
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Upload your placement roadmap and we'll turn it into a daily plan.
            </p>

            {/* Launch Error Alert if any */}
            {launchError && (
              <div style={{
                backgroundColor: '#FFF1EE',
                border: '1px solid rgba(200, 90, 50, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-terracotta)' }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{launchError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLaunchDailyPlan}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--accent-terracotta)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div 
                onClick={() => !isLaunching && setFormData({ ...formData, selectedPresetRoadmap: 'sde' })}
                className="card-white interactive"
                style={{
                  padding: '14px 16px',
                  borderColor: formData.selectedPresetRoadmap === 'sde' ? 'var(--accent-terracotta)' : 'var(--border-beige)',
                  backgroundColor: formData.selectedPresetRoadmap === 'sde' ? 'var(--accent-terracotta-light)' : '#FFFFFF',
                  cursor: isLaunching ? 'not-allowed' : 'pointer',
                  opacity: isLaunching ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} color="var(--accent-terracotta)" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Top Tech SDE-1 Masterplan (90-Day Sprint)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        4 Phases • DSA, Core CS, LLD, Mock Interviews
                      </div>
                    </div>
                  </div>
                  {formData.selectedPresetRoadmap === 'sde' && <Check size={16} color="var(--accent-terracotta)" strokeWidth={3} />}
                </div>
              </div>

              <div 
                onClick={() => !isLaunching && setFormData({ ...formData, selectedPresetRoadmap: 'datascience' })}
                className="card-white interactive"
                style={{
                  padding: '14px 16px',
                  borderColor: formData.selectedPresetRoadmap === 'datascience' ? 'var(--accent-navy)' : 'var(--border-beige)',
                  backgroundColor: formData.selectedPresetRoadmap === 'datascience' ? 'var(--accent-navy-light)' : '#FFFFFF',
                  cursor: isLaunching ? 'not-allowed' : 'pointer',
                  opacity: isLaunching ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Brain size={18} color="var(--accent-navy)" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                        Data Science & ML Placement Blueprint
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        3 Phases • Math, Classical ML, SQL Analytics
                      </div>
                    </div>
                  </div>
                  {formData.selectedPresetRoadmap === 'datascience' && <Check size={16} color="var(--accent-navy)" strokeWidth={3} />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => !isLaunching && setStep(step - 1)}
              disabled={isLaunching}
              className="btn-secondary"
              style={{ 
                padding: '10px 18px', 
                fontSize: '13px',
                opacity: isLaunching ? 0.5 : 1,
                cursor: isLaunching ? 'not-allowed' : 'pointer'
              }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isLaunching}
            className="btn-primary"
            style={{ 
              padding: '12px 24px', 
              fontSize: '14px',
              opacity: isLaunching ? 0.8 : 1,
              cursor: isLaunching ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isLaunching ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1.2s linear infinite' }} />
                <span>Building your plan...</span>
              </>
            ) : (
              <>
                <span>{step === 5 ? 'Launch My Daily Plan 🚀' : 'Continue'}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
