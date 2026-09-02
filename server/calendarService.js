/**
 * Server-Side Unified Placement Calendar & Schedule Service for NOVARA
 * Dynamically aggregates events from:
 * - Daily Tasks (STUDY_TASK)
 * - Spaced Revisions (REVISION)
 * - Application Deadlines (APPLICATION_DEADLINE)
 * - Scheduled Interviews & OAs (INTERVIEW / ONLINE_ASSESSMENT)
 * - Mock Interviews (MOCK_INTERVIEW)
 * - Placement Target Date (PLACEMENT_TARGET)
 * - Custom Personal Events (PERSONAL_EVENT)
 *
 * Provides Schedule Conflict Detection and Daily Study Capacity Calculations.
 */

import { loadDb, saveDb } from './db.js';
import { getUserApplicationsFromDb } from './applicationService.js';

export const EVENT_TYPES = {
  STUDY_TASK: 'STUDY_TASK',
  REVISION: 'REVISION',
  APPLICATION_DEADLINE: 'APPLICATION_DEADLINE',
  INTERVIEW: 'INTERVIEW',
  ONLINE_ASSESSMENT: 'ONLINE_ASSESSMENT',
  MOCK_INTERVIEW: 'MOCK_INTERVIEW',
  PLACEMENT_TARGET: 'PLACEMENT_TARGET',
  PERSONAL_EVENT: 'PERSONAL_EVENT'
};

/**
 * Format helper for YYYY-MM-DD
 */
function toDateKey(d) {
  if (!d) return null;
  if (typeof d === 'string') {
    if (d.length === 10 && d.includes('-')) return d;
    return d.split('T')[0];
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse time string to minutes from midnight (e.g. "09:30 AM" -> 570)
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Ensure personal events collection exists in DB
 */
export function getPersonalEventsFromDb(userId) {
  const db = loadDb();
  if (!db.calendarEvents) db.calendarEvents = {};
  if (!db.calendarEvents[userId]) {
    // Seed initial personal events for demo account
    if (userId === 'usr_alex_rivera') {
      const now = new Date();
      const in2Days = new Date(now);
      in2Days.setDate(in2Days.getDate() + 2);
      const in5Days = new Date(now);
      in5Days.setDate(in5Days.getDate() + 5);

      db.calendarEvents[userId] = [
        {
          id: 'evt_personal_mock_01',
          userId,
          title: 'System Design Mock with Peer',
          type: 'Mock Interview',
          date: toDateKey(in2Days),
          time: '07:00 PM',
          durationMinutes: 45,
          notes: 'Focus on distributed cache and rate limiter design with Rahul.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'evt_personal_study_02',
          userId,
          title: 'Graph Algorithms Deep Dive Session',
          type: 'Study Session',
          date: toDateKey(in5Days),
          time: '04:00 PM',
          durationMinutes: 60,
          notes: 'Review Dijkstra, Bellman-Ford, and Topo Sort patterns.',
          createdAt: new Date().toISOString()
        }
      ];
      saveDb(db);
    } else {
      db.calendarEvents[userId] = [];
      saveDb(db);
    }
  }
  return db.calendarEvents[userId];
}

/**
 * Dynamically aggregates real-time placement events for a user
 */
export function getAggregatedCalendarEvents(userId, startDateStr = null, endDateStr = null) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');

  const tasks = db.tasks[userId] || [];
  const revisions = db.revisions[userId] || [];
  const applications = getUserApplicationsFromDb(userId);
  const personalEvents = getPersonalEventsFromDb(userId);

  const aggregated = [];
  const todayKey = toDateKey(new Date());

  // 1. Study Tasks (from daily tasks)
  tasks.forEach((task, idx) => {
    const taskDate = task.scheduledDate || todayKey;
    const durMinutes = parseInt(task.duration, 10) || 45;
    
    // Assign sensible sequential study times
    const defaultHours = [9, 11, 14, 16, 17, 19];
    const hour = defaultHours[idx % defaultHours.length];
    const timeStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

    aggregated.push({
      id: `task_${task.id}`,
      type: EVENT_TYPES.STUDY_TASK,
      category: 'Study',
      title: task.title,
      description: task.category ? `${task.category} • ${durMinutes} min` : `${durMinutes} min session`,
      date: taskDate,
      time: task.time || timeStr,
      durationMinutes: durMinutes,
      status: task.completed ? 'completed' : 'pending',
      completed: !!task.completed,
      priority: task.priority || 'medium',
      sourceType: 'task',
      sourceId: task.id,
      taskRef: task,
      isPersonal: false,
      colorToken: 'terracotta'
    });
  });

  // 2. Spaced Revisions (from adaptive revision queue)
  revisions.forEach((rev, idx) => {
    let revDate = toDateKey(new Date());
    if (rev.revisionDueDate === 'Tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      revDate = toDateKey(d);
    } else if (rev.revisionDueDate && rev.revisionDueDate.startsWith('In ')) {
      const days = parseInt(rev.revisionDueDate.replace('In ', ''), 10) || 3;
      const d = new Date();
      d.setDate(d.getDate() + days);
      revDate = toDateKey(d);
    } else if (rev.nextRevisionDate) {
      revDate = toDateKey(rev.nextRevisionDate);
    }

    const hour = (8 + (idx * 2)) % 20;
    const timeStr = `${hour > 12 ? hour - 12 : hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`;

    aggregated.push({
      id: `rev_${rev.id}`,
      type: EVENT_TYPES.REVISION,
      category: 'Revision',
      title: `${rev.topic} Revision`,
      description: `Active Recall Spaced Review • Retention: ${rev.retentionScore || '75%'}`,
      date: revDate,
      time: timeStr,
      durationMinutes: 20,
      status: rev.status === 'completed' ? 'completed' : 'due',
      completed: rev.status === 'completed',
      retentionScore: rev.retentionScore,
      intervalDays: rev.intervalDays || 1,
      sourceType: 'revision',
      sourceId: rev.id,
      revisionRef: rev,
      isPersonal: false,
      colorToken: 'amber'
    });
  });

  // 3. Applications: Deadlines & Scheduled Interviews
  applications.forEach((app) => {
    // 3.1 Application Deadline
    if (app.deadline && !['Offer', 'Rejected', 'Withdrawn'].includes(app.status)) {
      aggregated.push({
        id: `dead_${app.id}`,
        type: EVENT_TYPES.APPLICATION_DEADLINE,
        category: 'Application',
        title: `${app.company} Application Deadline`,
        description: `${app.role} • ${app.location} (${app.workType})`,
        date: toDateKey(app.deadline),
        time: '11:59 PM',
        durationMinutes: 0,
        status: 'active',
        completed: false,
        company: app.company,
        role: app.role,
        jobUrl: app.jobUrl,
        sourceType: 'application',
        sourceId: app.id,
        appRef: app,
        isPersonal: false,
        colorToken: 'navy'
      });
    }

    // 3.2 Scheduled Interviews
    (app.interviews || []).forEach((intItem) => {
      if (intItem.scheduledAt) {
        const intDate = new Date(intItem.scheduledAt);
        const timeStr = intDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isOA = intItem.type === 'Online Assessment' || intItem.title?.toLowerCase().includes('assessment') || intItem.title?.toLowerCase().includes('oa');

        aggregated.push({
          id: `int_${intItem.id}`,
          type: isOA ? EVENT_TYPES.ONLINE_ASSESSMENT : EVENT_TYPES.INTERVIEW,
          category: isOA ? 'Assessment' : 'Interview',
          title: `${app.company} — ${intItem.title || intItem.type}`,
          description: `${app.role} (${intItem.type}) • ${intItem.notes || 'Interview Stage'}`,
          date: toDateKey(intDate),
          time: timeStr,
          durationMinutes: 60,
          status: intItem.status || 'scheduled',
          completed: intItem.status === 'completed',
          result: intItem.result,
          company: app.company,
          role: app.role,
          roundType: intItem.type,
          sourceType: 'interview',
          sourceId: app.id,
          interviewId: intItem.id,
          appRef: app,
          isPersonal: false,
          colorToken: isOA ? 'amber' : 'sage'
        });
      }
    });
  });

  // 4. Placement Target Date (from Profile)
  const targetDateStr = user.placementTargetDate || user.targetDate;
  if (targetDateStr) {
    const targetKey = toDateKey(targetDateStr);
    const targetDateObj = new Date(targetDateStr);
    const daysRemaining = Math.max(0, Math.ceil((targetDateObj - new Date()) / (1000 * 60 * 60 * 24)));

    aggregated.push({
      id: 'evt_placement_target',
      type: EVENT_TYPES.PLACEMENT_TARGET,
      category: 'Milestone',
      title: '🎯 Placement Target Date',
      description: `${daysRemaining} days remaining for ${user.targetRole || 'Software Engineer'} preparation`,
      date: targetKey,
      time: 'All Day',
      durationMinutes: 0,
      status: 'milestone',
      completed: false,
      daysRemaining,
      sourceType: 'profile',
      sourceId: user.id,
      isPersonal: false,
      colorToken: 'terracotta'
    });
  }

  // 5. User-Created Personal Events
  personalEvents.forEach((pEvt) => {
    const isMock = pEvt.type === 'Mock Interview';
    aggregated.push({
      id: pEvt.id,
      type: isMock ? EVENT_TYPES.MOCK_INTERVIEW : EVENT_TYPES.PERSONAL_EVENT,
      category: isMock ? 'Mock Interview' : 'Personal',
      title: pEvt.title,
      description: pEvt.notes || `${pEvt.type} • ${pEvt.durationMinutes || 30} min`,
      date: toDateKey(pEvt.date),
      time: pEvt.time || '10:00 AM',
      durationMinutes: pEvt.durationMinutes || 30,
      status: 'scheduled',
      completed: false,
      notes: pEvt.notes,
      sourceType: 'personal',
      sourceId: pEvt.id,
      isPersonal: true,
      colorToken: isMock ? 'terracotta' : 'charcoal'
    });
  });

  // Sort events chronologically (Date asc, Time asc)
  aggregated.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    const minA = parseTimeToMinutes(a.time) ?? 0;
    const minB = parseTimeToMinutes(b.time) ?? 0;
    return minA - minB;
  });

  // Date range filter if requested
  let filtered = aggregated;
  if (startDateStr && endDateStr) {
    filtered = aggregated.filter((e) => e.date >= startDateStr && e.date <= endDateStr);
  }

  // Conflict Detection across filtered events
  const conflicts = detectScheduleConflicts(filtered);

  return {
    events: filtered,
    conflicts,
    todayKey,
    placementTarget: targetDateStr ? {
      date: targetDateStr,
      formattedDate: new Date(targetDateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      daysRemaining: Math.max(0, Math.ceil((new Date(targetDateStr) - new Date()) / (1000 * 60 * 60 * 24)))
    } : null
  };
}

/**
 * Detect schedule conflicts (overlapping time intervals on the same date)
 */
export function detectScheduleConflicts(events) {
  const dateGroups = {};
  events.forEach((evt) => {
    if (!evt.date || !evt.time || evt.time === 'All Day' || evt.durationMinutes <= 0) return;
    if (!dateGroups[evt.date]) dateGroups[evt.date] = [];
    dateGroups[evt.date].push(evt);
  });

  const conflicts = [];

  Object.entries(dateGroups).forEach(([date, dayEvents]) => {
    const timedEvents = dayEvents
      .map((e) => {
        const startMin = parseTimeToMinutes(e.time);
        if (startMin === null) return null;
        return {
          ...e,
          startMin,
          endMin: startMin + (e.durationMinutes || 30)
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.startMin - b.startMin);

    for (let i = 0; i < timedEvents.length - 1; i++) {
      const current = timedEvents[i];
      const next = timedEvents[i + 1];

      // Overlap detected
      if (current.endMin > next.startMin) {
        conflicts.push({
          date,
          eventA: { id: current.id, title: current.title, time: current.time, durationMinutes: current.durationMinutes },
          eventB: { id: next.id, title: next.title, time: next.time, durationMinutes: next.durationMinutes },
          warningMessage: `Schedule conflict on ${date}: "${current.title}" (${current.time}) overlaps with "${next.title}" (${next.time}).`
        });
      }
    }
  });

  return conflicts;
}

/**
 * Calculate Daily Study Capacity for selected date
 */
export function calculateDailyCapacity(user, events, selectedDateStr = null) {
  const targetDateKey = selectedDateStr || toDateKey(new Date());
  const dailyTargetMinutes = user.dailyStudyMinutes || (user.dailyTargetHours ? user.dailyTargetHours * 60 : 180);

  // Sum planned study, revision, mock interview, and personal events on target date
  const dayEvents = events.filter((e) => e.date === targetDateKey && (
    e.type === EVENT_TYPES.STUDY_TASK || 
    e.type === EVENT_TYPES.REVISION || 
    e.type === EVENT_TYPES.PERSONAL_EVENT ||
    e.type === EVENT_TYPES.MOCK_INTERVIEW
  ));

  const plannedMinutes = dayEvents.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  const remainingMinutes = Math.max(0, dailyTargetMinutes - plannedMinutes);
  const isCapacityExceeded = plannedMinutes > dailyTargetMinutes;

  const targetHoursText = `${(dailyTargetMinutes / 60).toFixed(1).replace('.0', '')}h`;
  const plannedHoursText = `${Math.floor(plannedMinutes / 60)}h ${plannedMinutes % 60}m`;
  const remainingText = remainingMinutes > 0
    ? `${remainingMinutes >= 60 ? `${Math.floor(remainingMinutes / 60)}h ` : ''}${remainingMinutes % 60}m of study capacity remaining.`
    : isCapacityExceeded
    ? `Study target exceeded by ${plannedMinutes - dailyTargetMinutes}m. Consider spreading tasks.`
    : 'Daily study capacity fully allocated.';

  return {
    date: targetDateKey,
    dailyTargetMinutes,
    plannedMinutes,
    remainingMinutes,
    isCapacityExceeded,
    targetHoursText,
    plannedHoursText,
    capacityText: remainingText
  };
}

/**
 * Personal Events CRUD Operations
 */
export function createPersonalEventInDb(userId, data) {
  const db = loadDb();
  if (!db.calendarEvents) db.calendarEvents = {};
  if (!db.calendarEvents[userId]) db.calendarEvents[userId] = [];

  const newEvent = {
    id: `evt_personal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    title: data.title?.trim() || 'Untitled Event',
    type: data.type || 'Study Session',
    date: toDateKey(data.date) || toDateKey(new Date()),
    time: data.time || '10:00 AM',
    durationMinutes: parseInt(data.durationMinutes, 10) || 45,
    notes: data.notes?.trim() || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.calendarEvents[userId].unshift(newEvent);
  saveDb(db);
  return newEvent;
}

export function updatePersonalEventInDb(userId, eventId, updates) {
  const db = loadDb();
  if (!db.calendarEvents || !db.calendarEvents[userId]) return null;

  const idx = db.calendarEvents[userId].findIndex((e) => e.id === eventId);
  if (idx === -1) return null;

  const current = db.calendarEvents[userId][idx];
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  db.calendarEvents[userId][idx] = updated;
  saveDb(db);
  return updated;
}

export function deletePersonalEventFromDb(userId, eventId) {
  const db = loadDb();
  if (!db.calendarEvents || !db.calendarEvents[userId]) return false;

  const initialLen = db.calendarEvents[userId].length;
  db.calendarEvents[userId] = db.calendarEvents[userId].filter((e) => e.id !== eventId);
  const deleted = db.calendarEvents[userId].length < initialLen;
  if (deleted) saveDb(db);
  return deleted;
}
