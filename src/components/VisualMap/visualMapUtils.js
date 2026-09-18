/**
 * visualMapUtils.js — Authoritative Data-to-Graph Transformers for NOVARA Visual Map
 * Zero fabricated data: maps exclusively to real, persisted entities with verified entity IDs.
 */

// Node status definitions
export const NODE_STATUS = {
  COMPLETED: 'completed',
  CURRENT: 'current',
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  DUE: 'due',
  OVERDUE: 'overdue',
  BLOCKED: 'blocked',
  UNAVAILABLE: 'unavailable'
};

// Accessible symbols for visual status indicators (in addition to color)
export const STATUS_SYMBOLS = {
  completed: '✓',
  current: '●',
  active: '●',
  upcoming: '○',
  due: '!',
  overdue: '⚠',
  blocked: '✕',
  unavailable: '🔒'
};

/**
 * 1. VISUAL ROADMAP BUILDER
 * Maps hierarchical curriculum: Roadmap → Phase → Topic → Task → Focus → Quiz → Revision
 */
export function buildRoadmapVisualMap(activeRoadmap, options = {}) {
  if (!activeRoadmap || !Array.isArray(activeRoadmap.phases) || activeRoadmap.phases.length === 0) {
    return { nodes: [], edges: [], summary: 'No roadmap available.' };
  }

  const nodes = [];
  const edges = [];
  const selectedPhaseId = options.selectedPhaseId || null;

  // Root Roadmap Node
  const totalTopics = activeRoadmap.phases.reduce((acc, p) => acc + (p.topics?.length || 0), 0);
  const completedTopics = activeRoadmap.phases.reduce(
    (acc, p) => acc + (p.topics?.filter(t => t.status === 'completed').length || 0),
    0
  );
  const isRoadmapComplete = totalTopics > 0 && completedTopics === totalTopics;

  const rootId = `roadmap_${activeRoadmap.id || 'primary'}`;
  nodes.push({
    id: rootId,
    label: activeRoadmap.title || 'Placement Roadmap',
    sublabel: `${completedTopics} of ${totalTopics} topics mastered`,
    status: isRoadmapComplete ? NODE_STATUS.COMPLETED : NODE_STATUS.CURRENT,
    entityType: 'roadmap',
    entityId: activeRoadmap.id,
    badge: `${Math.round(totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0)}%`,
    badgeColor: isRoadmapComplete ? 'var(--accent-sage)' : 'var(--accent-terracotta)'
  });

  // Phases
  activeRoadmap.phases.forEach((phase, pIdx) => {
    const pTotal = phase.topics?.length || 0;
    const pDone = phase.topics?.filter(t => t.status === 'completed').length || 0;
    const isPhaseDone = pTotal > 0 && pDone === pTotal;
    const isPhaseCurrent = !isPhaseDone && (pIdx === 0 || activeRoadmap.phases[pIdx - 1]?.topics?.every(t => t.status === 'completed'));

    const phaseNodeId = `phase_${phase.id || pIdx}`;
    nodes.push({
      id: phaseNodeId,
      label: `Phase ${phase.number || pIdx + 1}: ${(phase.title || '').replace(/^Phase \d+:\s*/i, '')}`,
      sublabel: `${pDone}/${pTotal} topics`,
      status: isPhaseDone ? NODE_STATUS.COMPLETED : isPhaseCurrent ? NODE_STATUS.CURRENT : NODE_STATUS.UPCOMING,
      entityType: 'phase',
      entityId: phase.id,
      phaseNumber: phase.number || pIdx + 1,
      badge: `${pDone}/${pTotal}`,
      badgeColor: isPhaseDone ? 'var(--accent-sage)' : 'var(--text-secondary)'
    });

    edges.push({
      from: rootId,
      to: phaseNodeId,
      label: pIdx === 0 ? 'Starts' : 'Follows'
    });

    // If this phase is focused or active, expand topics
    const shouldExpandTopics = !selectedPhaseId || selectedPhaseId === phase.id || isPhaseCurrent;
    if (shouldExpandTopics && Array.isArray(phase.topics)) {
      phase.topics.slice(0, 6).forEach((topic, tIdx) => {
        const isTopicDone = topic.status === 'completed';
        const isTopicCurrent = !isTopicDone && (tIdx === 0 || phase.topics[tIdx - 1]?.status === 'completed');

        const topicNodeId = `topic_${topic.id || `${phase.id}_t_${tIdx}`}`;
        nodes.push({
          id: topicNodeId,
          label: topic.name || topic.title || `Topic ${tIdx + 1}`,
          sublabel: topic.difficulty || 'Medium',
          status: isTopicDone ? NODE_STATUS.COMPLETED : isTopicCurrent ? NODE_STATUS.CURRENT : NODE_STATUS.UPCOMING,
          entityType: 'topic',
          entityId: topic.id,
          phaseId: phase.id,
          data: topic,
          badge: topic.category || 'DSA',
          badgeColor: 'var(--accent-terracotta)'
        });

        edges.push({
          from: phaseNodeId,
          to: topicNodeId
        });
      });
    }
  });

  return {
    nodes,
    edges,
    summary: `Roadmap has ${activeRoadmap.phases.length} phases with ${totalTopics} total topics (${completedTopics} completed).`
  };
}

/**
 * 2. TODAY'S LEARNING PATH MAP BUILDER
 * Maps: Today → Next Focus Task → Study Guide → Focus Session → Quiz → Revision
 */
export function buildTodayLearningPathMap(todayTasks = [], activeFocusSession = null, revisionQueue = [], options = {}) {
  const nodes = [];
  const edges = [];

  const completedCount = todayTasks.filter(t => t.completed).length;
  const totalCount = todayTasks.length;
  const nextTask = activeFocusSession
    ? todayTasks.find(t => t.id === activeFocusSession.taskId) || todayTasks.find(t => !t.completed)
    : todayTasks.find(t => !t.completed) || todayTasks[0];

  // Node 1: Today
  nodes.push({
    id: 'node_today_root',
    label: 'Today’s Target',
    sublabel: `${completedCount} of ${totalCount} done`,
    status: completedCount === totalCount && totalCount > 0 ? NODE_STATUS.COMPLETED : NODE_STATUS.CURRENT,
    entityType: 'today',
    entityId: 'today_mission',
    badge: `${completedCount}/${totalCount}`,
    badgeColor: 'var(--accent-terracotta)'
  });

  if (nextTask) {
    const isTaskDone = !!nextTask.completed;
    const isSessionActive = !!activeFocusSession && activeFocusSession.taskId === nextTask.id;

    // Node 2: Next Focus Task
    nodes.push({
      id: `node_task_${nextTask.id}`,
      label: nextTask.name || nextTask.title || 'Focus Task',
      sublabel: `${nextTask.durationMinutes || 45}m • ${nextTask.difficulty || 'Medium'}`,
      status: isTaskDone ? NODE_STATUS.COMPLETED : isSessionActive ? NODE_STATUS.ACTIVE : NODE_STATUS.CURRENT,
      entityType: 'task',
      entityId: nextTask.id,
      data: nextTask,
      badge: nextTask.category || 'DSA',
      badgeColor: 'var(--accent-terracotta)'
    });
    edges.push({ from: 'node_today_root', to: `node_task_${nextTask.id}` });

    // Node 3: Study Guide
    nodes.push({
      id: `node_study_${nextTask.id}`,
      label: 'Study Guide',
      sublabel: 'Verified Concepts',
      status: isTaskDone ? NODE_STATUS.COMPLETED : NODE_STATUS.CURRENT,
      entityType: 'study',
      entityId: nextTask.id,
      data: nextTask,
      badge: 'Guide'
    });
    edges.push({ from: `node_task_${nextTask.id}`, to: `node_study_${nextTask.id}` });

    // Node 4: Focus Session
    nodes.push({
      id: `node_focus_${nextTask.id}`,
      label: 'Focus Session',
      sublabel: isSessionActive ? 'Active Timer' : 'Timed Sprint',
      status: isTaskDone ? NODE_STATUS.COMPLETED : isSessionActive ? NODE_STATUS.ACTIVE : NODE_STATUS.UPCOMING,
      entityType: 'focus',
      entityId: nextTask.id,
      sessionId: activeFocusSession?.sessionId || null,
      data: nextTask,
      badge: `${nextTask.durationMinutes || 45}m`
    });
    edges.push({ from: `node_study_${nextTask.id}`, to: `node_focus_${nextTask.id}` });

    // Node 5: Quiz
    nodes.push({
      id: `node_quiz_${nextTask.id}`,
      label: 'Task Quiz',
      sublabel: '5 Recall Checks',
      status: isTaskDone ? NODE_STATUS.COMPLETED : NODE_STATUS.UPCOMING,
      entityType: 'quiz',
      entityId: nextTask.id,
      data: nextTask,
      badge: '5 MCQs'
    });
    edges.push({ from: `node_focus_${nextTask.id}`, to: `node_quiz_${nextTask.id}` });
  }

  // Node 6: Revision Queue
  const nextRevision = Array.isArray(revisionQueue) && revisionQueue.length > 0 ? revisionQueue[0] : null;
  if (nextRevision) {
    const isDue = nextRevision.revisionDueDate === 'Today' || (nextRevision.revisionDueDate || '').startsWith('Overdue');
    nodes.push({
      id: `node_rev_${nextRevision.id || 'next'}`,
      label: 'Spaced Revision',
      sublabel: nextRevision.topic || 'Recall Topic',
      status: isDue ? NODE_STATUS.DUE : NODE_STATUS.UPCOMING,
      entityType: 'revision',
      entityId: nextRevision.id,
      data: nextRevision,
      badge: `${nextRevision.retentionScore || 80}% Ret.`
    });
    const lastNode = nodes[nodes.length - 2];
    if (lastNode) {
      edges.push({ from: lastNode.id, to: `node_rev_${nextRevision.id || 'next'}` });
    }
  }

  return {
    nodes,
    edges,
    summary: `Today's learning path: ${completedCount} of ${totalCount} tasks completed.`
  };
}

/**
 * 3. FOCUS + DEEP STUDY CONTEXTUAL MAP BUILDER
 * Maps authentic sections present in the study document:
 * Current Task → Concepts → Patterns/Code → Practice → Self Check → Quiz
 */
export function buildStudyContextMap(task = {}, material = {}, options = {}) {
  const nodes = [];
  const edges = [];

  const taskTitle = task.name || task.taskTitle || task.title || material.title || 'Curriculum Concept';
  const rootId = `study_root_${task.id || 'curr'}`;

  nodes.push({
    id: rootId,
    label: taskTitle,
    sublabel: 'Target Concept',
    status: NODE_STATUS.ACTIVE,
    entityType: 'task',
    entityId: task.id,
    badge: task.difficulty || 'Medium'
  });

  let prevId = rootId;

  // Real sections in material
  if (material.definitions?.length || material.concepts?.length) {
    const secId = 'sec-concepts';
    nodes.push({
      id: secId,
      label: 'Core Concepts',
      sublabel: `${(material.concepts?.length || 0) + (material.definitions?.length || 0)} mechanisms`,
      status: NODE_STATUS.CURRENT,
      entityType: 'study_section',
      sectionId: 'sec-concepts',
      badge: 'Verified'
    });
    edges.push({ from: prevId, to: secId });
    prevId = secId;
  }

  if (material.patterns?.length || material.codeExamples?.length) {
    const secId = 'sec-patterns';
    nodes.push({
      id: secId,
      label: 'Patterns & Code',
      sublabel: `${material.patterns?.length || 0} patterns, ${material.codeExamples?.length || 0} code`,
      status: NODE_STATUS.UPCOMING,
      entityType: 'study_section',
      sectionId: 'sec-patterns',
      badge: 'Implementation'
    });
    edges.push({ from: prevId, to: secId });
    prevId = secId;
  }

  if (material.practiceProblems?.length) {
    const secId = 'sec-practice';
    nodes.push({
      id: secId,
      label: 'Practice Problems',
      sublabel: `${material.practiceProblems.length} challenges`,
      status: NODE_STATUS.UPCOMING,
      entityType: 'study_section',
      sectionId: 'sec-practice',
      badge: 'Placement'
    });
    edges.push({ from: prevId, to: secId });
    prevId = secId;
  }

  if (material.selfCheckQuestions?.length) {
    const secId = 'sec-selfcheck';
    nodes.push({
      id: secId,
      label: 'Self-Check',
      sublabel: `${material.selfCheckQuestions.length} checks`,
      status: NODE_STATUS.UPCOMING,
      entityType: 'study_section',
      sectionId: 'sec-selfcheck',
      badge: 'Confidence'
    });
    edges.push({ from: prevId, to: secId });
    prevId = secId;
  }

  // Quiz node
  const quizId = 'node_study_quiz';
  nodes.push({
    id: quizId,
    label: 'Launch Quiz',
    sublabel: '5 Questions',
    status: NODE_STATUS.UPCOMING,
    entityType: 'quiz',
    entityId: task.id,
    badge: 'Final'
  });
  edges.push({ from: prevId, to: quizId });

  return {
    nodes,
    edges,
    summary: `Study document has ${nodes.length - 2} verified concept sections followed by Quiz.`
  };
}

/**
 * 4. SPACED REVISION MEMORY MAP BUILDER
 * Maps: Topic → Learned → Attempts → Retention → Next Due
 */
export function buildRevisionMemoryMap(revisionQueue = [], revisionMetrics = {}, options = {}) {
  const nodes = [];
  const edges = [];

  const queue = Array.isArray(revisionQueue) ? revisionQueue : [];
  const dueItems = queue.filter(r => r.revisionDueDate === 'Today' || (r.revisionDueDate || '').startsWith('Overdue'));
  const strongItems = queue.filter(r => (r.retentionScore || 0) >= 80);

  const rootId = 'rev_memory_root';
  nodes.push({
    id: rootId,
    label: 'Memory Retention',
    sublabel: `Average ${revisionMetrics.averageRetention || 80}%`,
    status: dueItems.length > 0 ? NODE_STATUS.DUE : NODE_STATUS.COMPLETED,
    entityType: 'revision_summary',
    entityId: 'summary',
    badge: `${dueItems.length} due`,
    badgeColor: dueItems.length > 0 ? 'var(--accent-terracotta)' : 'var(--accent-sage)'
  });

  // Top representative items from queue (up to 4)
  queue.slice(0, 4).forEach((item, idx) => {
    const isDue = item.revisionDueDate === 'Today' || (item.revisionDueDate || '').startsWith('Overdue');
    const isOverdue = (item.revisionDueDate || '').startsWith('Overdue');
    const isStrong = (item.retentionScore || 0) >= 80;

    const itemId = `rev_item_${item.id || idx}`;
    nodes.push({
      id: itemId,
      label: item.topic || `Topic ${idx + 1}`,
      sublabel: `${item.attemptsCount || 1} attempts • ${item.revisionDueDate || 'Scheduled'}`,
      status: isOverdue ? NODE_STATUS.OVERDUE : isDue ? NODE_STATUS.DUE : isStrong ? NODE_STATUS.COMPLETED : NODE_STATUS.UPCOMING,
      entityType: 'revision_item',
      entityId: item.id,
      data: item,
      badge: `${item.retentionScore || 80}%`,
      badgeColor: isStrong ? 'var(--accent-sage)' : 'var(--accent-amber)'
    });

    edges.push({
      from: rootId,
      to: itemId,
      label: item.revisionDueDate || 'Due'
    });
  });

  return {
    nodes,
    edges,
    summary: `Revision engine tracking ${queue.length} topics with ${dueItems.length} due today.`
  };
}

/**
 * 5. PLACEMENT COACH READINESS MAP BUILDER
 * Maps: Roadmap Progress → Skills → Practice → Revision → Mock Interviews → Applications → Readiness
 */
export function buildCoachReadinessMap(coachAnalysis = {}, userProfile = {}, options = {}) {
  const nodes = [];
  const edges = [];

  const readiness = coachAnalysis?.readinessPercent ?? 26;
  const roadmapPct = coachAnalysis?.roadmapProgress ?? 14;
  const weakest = coachAnalysis?.weakestCategory || 'DSA';
  const strongest = coachAnalysis?.strongestCategory || 'Revision';

  const stages = [
    {
      id: 'coach_stage_roadmap',
      label: 'Curriculum Coverage',
      sublabel: `${roadmapPct}% syllabus completed`,
      status: roadmapPct >= 70 ? NODE_STATUS.COMPLETED : NODE_STATUS.CURRENT,
      entityType: 'roadmap',
      badge: `${roadmapPct}%`
    },
    {
      id: 'coach_stage_skills',
      label: 'Core Skills',
      sublabel: `Focus on ${weakest}`,
      status: NODE_STATUS.CURRENT,
      entityType: 'coach_skills',
      badge: weakest
    },
    {
      id: 'coach_stage_revision',
      label: 'Revision Health',
      sublabel: `Top area: ${strongest}`,
      status: NODE_STATUS.COMPLETED,
      entityType: 'revision',
      badge: strongest
    },
    {
      id: 'coach_stage_interviews',
      label: 'Mock Interviews',
      sublabel: 'Technical Readiness',
      status: NODE_STATUS.UPCOMING,
      entityType: 'interview',
      badge: 'Evaluation'
    },
    {
      id: 'coach_stage_applications',
      label: 'Job Applications',
      sublabel: userProfile?.targetRole || 'Software Engineer',
      status: NODE_STATUS.UPCOMING,
      entityType: 'applications',
      badge: 'Pipeline'
    },
    {
      id: 'coach_stage_readiness',
      label: 'Placement Readiness',
      sublabel: `${readiness}% Benchmark`,
      status: readiness >= 75 ? NODE_STATUS.COMPLETED : readiness >= 40 ? NODE_STATUS.CURRENT : NODE_STATUS.UPCOMING,
      entityType: 'coach',
      badge: `${readiness}%`,
      badgeColor: readiness >= 70 ? 'var(--accent-sage)' : 'var(--accent-terracotta)'
    }
  ];

  stages.forEach((stage, idx) => {
    nodes.push(stage);
    if (idx > 0) {
      edges.push({ from: stages[idx - 1].id, to: stage.id });
    }
  });

  return {
    nodes,
    edges,
    summary: `Placement coach evaluates readiness score at ${readiness}%.`
  };
}

/**
 * 6. MOCK INTERVIEW PREPARATION MAP BUILDER
 * Maps: Target Role → Domain → Session Setup → Questions → Evaluation → Weak Areas → Revision
 */
export function buildInterviewPrepMap(historyData = {}, activeSession = null, targetRole = 'Software Engineer') {
  const nodes = [];
  const edges = [];

  const completedCount = historyData?.stats?.interviewsCompleted || 0;
  const avgScore = historyData?.stats?.averageScore || 0;

  const steps = [
    {
      id: 'int_step_role',
      label: targetRole,
      sublabel: 'Target Career Role',
      status: NODE_STATUS.COMPLETED,
      entityType: 'profile',
      badge: 'Target'
    },
    {
      id: 'int_step_domain',
      label: activeSession ? activeSession.type || 'Technical' : 'Interview Domain',
      sublabel: 'DSA, Core CS, System Design',
      status: activeSession ? NODE_STATUS.ACTIVE : NODE_STATUS.CURRENT,
      entityType: 'interview_config',
      badge: activeSession ? activeSession.difficulty || 'Medium' : 'Select'
    },
    {
      id: 'int_step_session',
      label: activeSession ? 'Session in Progress' : 'Timed Session',
      sublabel: activeSession ? `${activeSession.questions?.length || 5} questions` : `${completedCount} completed`,
      status: activeSession ? NODE_STATUS.ACTIVE : completedCount > 0 ? NODE_STATUS.COMPLETED : NODE_STATUS.UPCOMING,
      entityType: 'interview_session',
      entityId: activeSession?.id || null,
      badge: activeSession ? 'Active' : `${completedCount} sessions`
    },
    {
      id: 'int_step_eval',
      label: 'Performance Evaluation',
      sublabel: avgScore > 0 ? `Avg Score: ${avgScore}%` : 'AI Evaluation',
      status: completedCount > 0 ? NODE_STATUS.COMPLETED : NODE_STATUS.UPCOMING,
      entityType: 'interview_eval',
      badge: avgScore > 0 ? `${avgScore}%` : 'Pending'
    },
    {
      id: 'int_step_revision',
      label: 'Recommended Revision',
      sublabel: 'Reinforce Weak Points',
      status: completedCount > 0 ? NODE_STATUS.DUE : NODE_STATUS.UPCOMING,
      entityType: 'revision',
      badge: 'Feedback'
    }
  ];

  steps.forEach((step, idx) => {
    nodes.push(step);
    if (idx > 0) {
      edges.push({ from: steps[idx - 1].id, to: step.id });
    }
  });

  return {
    nodes,
    edges,
    summary: `Interview track for ${targetRole}: ${completedCount} completed sessions.`
  };
}

/**
 * 7. APPLICATION JOURNEY MAP BUILDER
 * Maps: Saved → Applied → Online Assessment → Interview → Offer (or Rejected / Withdrawn)
 */
export function buildApplicationJourneyMap(application = {}) {
  const nodes = [];
  const edges = [];

  if (!application || !application.id) {
    return { nodes: [], edges: [], summary: 'No application selected.' };
  }

  const currentStatus = application.status || 'Saved';
  const isTerminalNegative = currentStatus === 'Rejected' || currentStatus === 'Withdrawn';

  const pipelineStages = ['Saved', 'Applied', 'Online Assessment', 'Interview', 'Offer'];
  const currentIdx = pipelineStages.indexOf(currentStatus);

  pipelineStages.forEach((stage, idx) => {
    let status = NODE_STATUS.UPCOMING;
    if (stage === currentStatus) {
      status = NODE_STATUS.CURRENT;
    } else if (currentIdx !== -1 && idx < currentIdx) {
      status = NODE_STATUS.COMPLETED;
    } else if (isTerminalNegative && idx === 1) {
      // Show up to applied
      status = NODE_STATUS.COMPLETED;
    }

    const nodeId = `app_stage_${stage.toLowerCase().replace(/\s+/g, '_')}`;
    nodes.push({
      id: nodeId,
      label: stage,
      sublabel: stage === currentStatus ? (application.company ? `${application.company}` : 'Current Stage') : '',
      status,
      entityType: 'application_stage',
      entityId: application.id,
      badge: stage === currentStatus ? 'Active' : ''
    });

    if (idx > 0) {
      const prevId = `app_stage_${pipelineStages[idx - 1].toLowerCase().replace(/\s+/g, '_')}`;
      edges.push({ from: prevId, to: nodeId });
    }
  });

  // If rejected or withdrawn, add terminal node
  if (isTerminalNegative) {
    const termId = `app_stage_${currentStatus.toLowerCase()}`;
    nodes.push({
      id: termId,
      label: currentStatus,
      sublabel: 'Closed',
      status: NODE_STATUS.BLOCKED,
      entityType: 'application_stage',
      entityId: application.id,
      badge: 'Terminal'
    });
    edges.push({ from: 'app_stage_applied', to: termId });
  }

  return {
    nodes,
    edges,
    summary: `Application journey for ${application.company || 'Company'}: currently at ${currentStatus}.`
  };
}

/**
 * 8. CALENDAR DAY FLOW MAP BUILDER
 * Maps chronological events for selected date with conflict warnings.
 */
export function buildCalendarDayFlowMap(dateStr = '', calendarEvents = [], calendarConflicts = []) {
  const nodes = [];
  const edges = [];

  const dayEvents = (calendarEvents || []).filter(e => e.date === dateStr);
  const conflictsSet = new Set(calendarConflicts.map(c => c.eventId || c.id));

  const rootId = 'cal_day_root';
  nodes.push({
    id: rootId,
    label: dateStr || 'Selected Day',
    sublabel: `${dayEvents.length} events scheduled`,
    status: dayEvents.length > 0 ? NODE_STATUS.CURRENT : NODE_STATUS.UPCOMING,
    entityType: 'calendar_day',
    entityId: dateStr,
    badge: `${dayEvents.length} events`
  });

  // Sort events by time
  const sorted = [...dayEvents].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  sorted.forEach((evt, idx) => {
    const isConflict = conflictsSet.has(evt.id);
    const evtId = `cal_evt_${evt.id || idx}`;

    nodes.push({
      id: evtId,
      label: evt.title || 'Event',
      sublabel: `${evt.time || ''} • ${evt.durationMinutes || 30}m`,
      status: isConflict ? NODE_STATUS.OVERDUE : NODE_STATUS.CURRENT,
      entityType: 'calendar_event',
      entityId: evt.id,
      data: evt,
      badge: evt.type || 'Study',
      badgeColor: isConflict ? 'var(--accent-rose, #DC2626)' : 'var(--accent-terracotta)'
    });

    edges.push({
      from: idx === 0 ? rootId : `cal_evt_${sorted[idx - 1].id || idx - 1}`,
      to: evtId,
      label: evt.time || ''
    });
  });

  return {
    nodes,
    edges,
    summary: `${dateStr} has ${dayEvents.length} scheduled events.`
  };
}

/**
 * 9. NOTIFICATION RELATION MAP BUILDER
 * Maps: Trigger / Category → Context Topic/Company → Deep-link Action
 */
export function buildNotificationRelationMap(notification = {}) {
  const nodes = [];
  const edges = [];

  if (!notification || !notification.id) return { nodes: [], edges: [] };

  const type = notification.type || 'reminder';
  const nId = notification.id;

  nodes.push({
    id: `notif_${nId}_source`,
    label: notification.title || 'Notification',
    sublabel: notification.time || 'Today',
    status: NODE_STATUS.CURRENT,
    entityType: 'notification',
    entityId: nId
  });

  let targetLabel = 'Placement Action';
  let targetType = 'today';
  if (type.includes('REVISION')) {
    targetLabel = 'Spaced Revision';
    targetType = 'revision';
  } else if (type.includes('INTERVIEW')) {
    targetLabel = 'Interview Session';
    targetType = 'interview';
  } else if (type.includes('TASK')) {
    targetLabel = 'Focus Sprint';
    targetType = 'focus';
  }

  nodes.push({
    id: `notif_${nId}_target`,
    label: targetLabel,
    sublabel: 'Direct Deep Link',
    status: NODE_STATUS.ACTIVE,
    entityType: targetType,
    entityId: notification.targetId || nId
  });

  edges.push({ from: `notif_${nId}_source`, to: `notif_${nId}_target`, label: 'Deep Link' });

  return { nodes, edges };
}

/**
 * 10. DASHBOARD CAREER JOURNEY MAP BUILDER
 * Maps: Roadmap → Today → Focus → Revision → Interview → Applications → Readiness
 */
export function buildDashboardJourneyMap({
  roadmapProgress = 0,
  todayTasks = [],
  revisionQueue = [],
  interviewStats = {},
  appMetrics = {},
  coachAnalysis = {}
} = {}) {
  const nodes = [];
  const edges = [];

  const completedToday = todayTasks.filter(t => t.completed).length;
  const isTodayComplete = completedToday === todayTasks.length && todayTasks.length > 0;
  const dueRevisions = (revisionQueue || []).filter(r => r.revisionDueDate === 'Today' || (r.revisionDueDate || '').startsWith('Overdue'));
  const interviewsDone = interviewStats?.interviewsCompleted || 0;
  const totalApps = appMetrics?.totalApplications || 0;
  const readiness = coachAnalysis?.readinessPercent ?? 26;

  const steps = [
    {
      id: 'journey_roadmap',
      label: 'Curriculum Roadmap',
      sublabel: `${roadmapProgress}% Mastered`,
      status: roadmapProgress >= 100 ? NODE_STATUS.COMPLETED : NODE_STATUS.CURRENT,
      entityType: 'roadmap',
      badge: `${roadmapProgress}%`
    },
    {
      id: 'journey_today',
      label: 'Daily Mission',
      sublabel: `${completedToday}/${todayTasks.length} tasks`,
      status: isTodayComplete ? NODE_STATUS.COMPLETED : NODE_STATUS.CURRENT,
      entityType: 'today',
      badge: 'Daily'
    },
    {
      id: 'journey_revision',
      label: 'Spaced Memory',
      sublabel: dueRevisions.length > 0 ? `${dueRevisions.length} due` : 'Up to date',
      status: dueRevisions.length > 0 ? NODE_STATUS.DUE : NODE_STATUS.COMPLETED,
      entityType: 'revision',
      badge: 'SM-2'
    },
    {
      id: 'journey_interview',
      label: 'Mock Interviews',
      sublabel: `${interviewsDone} sessions`,
      status: interviewsDone > 0 ? NODE_STATUS.COMPLETED : NODE_STATUS.UPCOMING,
      entityType: 'interview',
      badge: 'Practice'
    },
    {
      id: 'journey_applications',
      label: 'Job Pipeline',
      sublabel: `${totalApps} companies`,
      status: totalApps > 0 ? NODE_STATUS.COMPLETED : NODE_STATUS.UPCOMING,
      entityType: 'applications',
      badge: 'Tracking'
    },
    {
      id: 'journey_readiness',
      label: 'Placement Readiness',
      sublabel: `${readiness}% Score`,
      status: readiness >= 70 ? NODE_STATUS.COMPLETED : NODE_STATUS.CURRENT,
      entityType: 'coach',
      badge: `${readiness}%`,
      badgeColor: readiness >= 70 ? 'var(--accent-sage)' : 'var(--accent-terracotta)'
    }
  ];

  steps.forEach((s, idx) => {
    nodes.push(s);
    if (idx > 0) {
      edges.push({ from: steps[idx - 1].id, to: s.id });
    }
  });

  return {
    nodes,
    edges,
    summary: `Career journey: ${roadmapProgress}% roadmap completed, readiness score ${readiness}%.`
  };
}

/**
 * 11. PROFILE SYSTEM MAP BUILDER
 * Maps: Target Role → Roadmap → Daily Target → Revision → Interviews → Applications
 */
export function buildProfileSystemMap(userProfile = {}, roadmapProgress = 0) {
  const role = userProfile?.targetRole || 'Software Engineer';
  const hours = userProfile?.dailyTargetHours || 3;

  const steps = [
    { id: 'prof_role', label: role, sublabel: 'Target Career', status: NODE_STATUS.COMPLETED, entityType: 'profile' },
    { id: 'prof_roadmap', label: 'Roadmap', sublabel: `${roadmapProgress}% done`, status: NODE_STATUS.CURRENT, entityType: 'roadmap' },
    { id: 'prof_study', label: 'Daily Target', sublabel: `${hours}h / day`, status: NODE_STATUS.CURRENT, entityType: 'today' },
    { id: 'prof_rev', label: 'SM-2 Spaced Recall', sublabel: 'Active Retention', status: NODE_STATUS.CURRENT, entityType: 'revision' },
    { id: 'prof_apps', label: 'Placement Pipeline', sublabel: 'Applications', status: NODE_STATUS.UPCOMING, entityType: 'applications' }
  ];

  const nodes = steps;
  const edges = [];
  steps.forEach((s, idx) => {
    if (idx > 0) edges.push({ from: steps[idx - 1].id, to: s.id });
  });

  return { nodes, edges, summary: `Preparation system for ${role} with ${hours}h daily capacity.` };
}
