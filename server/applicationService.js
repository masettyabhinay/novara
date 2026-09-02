/**
 * Server-Side Application Tracker Service for NOVARA
 * Handles:
 * - Application lifecycle (Saved, Applied, Online Assessment, Interview, Offer, Rejected, Withdrawn)
 * - Multi-stage interview tracking (Technical, DSA, System Design, HR, Behavioral)
 * - Grounded conversion funnel analytics
 * - Upcoming deadline & interview scheduling
 * - Preparation recommendations
 */

import { loadDb, saveDb } from './db.js';

/**
 * Default sample applications for a student
 */
export const SEED_APPLICATIONS = [
  {
    id: 'app_msft_01',
    userId: 'usr_alex_rivera',
    company: 'Microsoft',
    role: 'Software Engineer Intern',
    status: 'Interview',
    applicationDate: '2026-08-15',
    deadline: '2026-09-12',
    jobUrl: 'https://careers.microsoft.com/students',
    location: 'Hyderabad / Bangalore',
    workType: 'Hybrid',
    notes: 'Referral from alumni. 3 rounds total (OA + 2 Tech).',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-09-01T14:30:00.000Z',
    interviews: [
      {
        id: 'int_msft_oa',
        type: 'Technical',
        title: 'Online Assessment',
        scheduledAt: '2026-08-22T10:00:00.000Z',
        status: 'completed',
        notes: '3 Codility problems on DP and Trees. Passed all test cases.',
        result: 'passed'
      },
      {
        id: 'int_msft_r1',
        type: 'Technical',
        title: 'Technical Round 1 (DSA & Problem Solving)',
        scheduledAt: '2026-09-08T16:00:00.000Z',
        status: 'scheduled',
        notes: '60 min live coding on Graph algorithms and Binary Trees with Senior SDE.',
        result: 'pending'
      }
    ]
  },
  {
    id: 'app_google_02',
    userId: 'usr_alex_rivera',
    company: 'Google',
    role: 'Software Engineer',
    status: 'Applied',
    applicationDate: '2026-09-01',
    deadline: '2026-09-10',
    jobUrl: 'https://careers.google.com/jobs',
    location: 'Bangalore',
    workType: 'Hybrid',
    notes: 'Submitted resume via student portal. High focus on DSA and clean code.',
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
    interviews: []
  },
  {
    id: 'app_amzn_03',
    userId: 'usr_alex_rivera',
    company: 'Amazon',
    role: 'Software Development Engineer (SDE-1)',
    status: 'Online Assessment',
    applicationDate: '2026-08-20',
    deadline: '2026-09-02',
    jobUrl: 'https://amazon.jobs/university',
    location: 'Hyderabad',
    workType: 'On-site',
    notes: 'OA link received on HackerRank. 2 coding questions + Work Style Assessment.',
    createdAt: '2026-08-20T11:00:00.000Z',
    updatedAt: '2026-08-29T16:00:00.000Z',
    interviews: [
      {
        id: 'int_amzn_oa',
        type: 'DSA',
        title: 'Online Assessment (OA 1 & 2)',
        scheduledAt: '2026-09-02T18:00:00.000Z',
        status: 'scheduled',
        notes: 'Arrays, Sliding Window, and Leadership Principles review.',
        result: 'pending'
      }
    ]
  },
  {
    id: 'app_uber_04',
    userId: 'usr_alex_rivera',
    company: 'Uber',
    role: 'Backend Engineer Intern',
    status: 'Interview',
    applicationDate: '2026-08-10',
    deadline: '2026-09-15',
    jobUrl: 'https://uber.com/careers',
    location: 'Bangalore',
    workType: 'Hybrid',
    notes: 'Passed OA with 100% score. Moving into System Design & Concurrency round.',
    createdAt: '2026-08-10T14:00:00.000Z',
    updatedAt: '2026-08-30T12:00:00.000Z',
    interviews: [
      {
        id: 'int_uber_oa',
        type: 'Technical',
        title: 'Online Coding Challenge',
        scheduledAt: '2026-08-18T15:00:00.000Z',
        status: 'completed',
        notes: 'Concurrent data structures & caching problem.',
        result: 'passed'
      },
      {
        id: 'int_uber_r1',
        type: 'System Design',
        title: 'System Design & High-Level Architecture',
        scheduledAt: '2026-09-06T14:00:00.000Z',
        status: 'scheduled',
        notes: 'Rate limiter and Ride-matching service architecture.',
        result: 'pending'
      }
    ]
  },
  {
    id: 'app_stripe_05',
    userId: 'usr_alex_rivera',
    company: 'Stripe',
    role: 'Software Engineer',
    status: 'Offer',
    applicationDate: '2026-07-28',
    deadline: '2026-09-05',
    jobUrl: 'https://stripe.com/jobs',
    location: 'Remote',
    workType: 'Remote',
    notes: 'Full loop completed. Formal offer received on Aug 28.',
    createdAt: '2026-07-28T08:00:00.000Z',
    updatedAt: '2026-08-28T18:00:00.000Z',
    interviews: [
      {
        id: 'int_stripe_oa',
        type: 'Technical',
        title: 'Coding Exercise',
        scheduledAt: '2026-08-05T10:00:00.000Z',
        status: 'completed',
        notes: 'JSON API design and pagination.',
        result: 'passed'
      },
      {
        id: 'int_stripe_loop',
        type: 'Technical',
        title: 'Full Virtual Onsite Loop',
        scheduledAt: '2026-08-20T11:00:00.000Z',
        status: 'completed',
        notes: 'Debugging, integration, architecture, and team values.',
        result: 'passed'
      }
    ]
  },
  {
    id: 'app_meta_06',
    userId: 'usr_alex_rivera',
    company: 'Meta',
    role: 'Software Engineer',
    status: 'Rejected',
    applicationDate: '2026-08-01',
    deadline: '2026-08-20',
    jobUrl: 'https://metacareers.com',
    location: 'London / Remote',
    workType: 'Hybrid',
    notes: 'Screening round concluded. Reapply in 6 months.',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-22T10:00:00.000Z',
    interviews: []
  },
  {
    id: 'app_adobe_07',
    userId: 'usr_alex_rivera',
    company: 'Adobe',
    role: 'Software Engineer - Platform',
    status: 'Rejected',
    applicationDate: '2026-08-01',
    deadline: '2026-08-20',
    jobUrl: 'https://adobe.com/careers',
    location: 'Noida',
    workType: 'Hybrid',
    notes: 'Online test concluded. Kept on file for upcoming product teams.',
    createdAt: '2026-08-01T14:00:00.000Z',
    updatedAt: '2026-08-22T14:00:00.000Z',
    interviews: []
  },
  {
    id: 'app_goldman_08',
    userId: 'usr_alex_rivera',
    company: 'Goldman Sachs',
    role: 'Summer Technology Analyst',
    status: 'Rejected',
    applicationDate: '2026-07-20',
    deadline: '2026-08-15',
    jobUrl: 'https://goldmansachs.com/careers',
    location: 'Bangalore',
    workType: 'On-site',
    notes: 'Aptitude screening concluded.',
    createdAt: '2026-07-20T16:00:00.000Z',
    updatedAt: '2026-08-16T16:00:00.000Z',
    interviews: []
  },
  {
    id: 'app_cisco_09',
    userId: 'usr_alex_rivera',
    company: 'Cisco',
    role: 'Software Engineer (Networking & Cloud)',
    status: 'Saved',
    applicationDate: '2026-08-29',
    deadline: '2026-09-22',
    jobUrl: 'https://cisco.com/careers',
    location: 'Bangalore',
    workType: 'Hybrid',
    notes: 'Networking and Computer Networks knowledge needed.',
    createdAt: '2026-08-29T10:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z',
    interviews: []
  },
  {
    id: 'app_salesforce_10',
    userId: 'usr_alex_rivera',
    company: 'Salesforce',
    role: 'Member of Technical Staff (MTS)',
    status: 'Withdrawn',
    applicationDate: '2026-08-10',
    deadline: '2026-08-30',
    jobUrl: 'https://salesforce.com/careers',
    location: 'Hyderabad',
    workType: 'Hybrid',
    notes: 'Withdrawn due to schedule overlap.',
    createdAt: '2026-08-10T11:00:00.000Z',
    updatedAt: '2026-08-30T11:00:00.000Z',
    interviews: []
  },
  {
    id: 'app_oracle_11',
    userId: 'usr_alex_rivera',
    company: 'Oracle',
    role: 'Cloud Infrastructure Intern',
    status: 'Rejected',
    applicationDate: '2026-07-25',
    deadline: '2026-08-18',
    jobUrl: 'https://oracle.com/careers',
    location: 'Bangalore',
    workType: 'On-site',
    notes: 'Distributed systems and Linux OS focus.',
    createdAt: '2026-07-25T15:00:00.000Z',
    updatedAt: '2026-08-19T15:00:00.000Z',
    interviews: []
  },
  {
    id: 'app_atlassian_12',
    userId: 'usr_alex_rivera',
    company: 'Atlassian',
    role: 'Associate Software Engineer',
    status: 'Interview',
    applicationDate: '2026-08-12',
    deadline: '2026-09-14',
    jobUrl: 'https://atlassian.com/company/careers',
    location: 'Remote',
    workType: 'Remote',
    notes: 'Cleared technical screens. Final Values & HR interview scheduled.',
    createdAt: '2026-08-12T13:00:00.000Z',
    updatedAt: '2026-08-31T17:00:00.000Z',
    interviews: [
      {
        id: 'int_atlassian_oa',
        type: 'Technical',
        title: 'Karate Coding OA',
        scheduledAt: '2026-08-19T10:00:00.000Z',
        status: 'completed',
        notes: 'Data structures and REST API design.',
        result: 'passed'
      },
      {
        id: 'int_atlassian_hr',
        type: 'Behavioral',
        title: 'Atlassian Values & Team Fit Interview',
        scheduledAt: '2026-09-05T11:00:00.000Z',
        status: 'scheduled',
        notes: 'Be authentic, Open company, no bullshit, Play as a team.',
        result: 'pending'
      }
    ]
  }
];

/**
 * Ensure user applications exist in DB
 */
export function getUserApplicationsFromDb(userId) {
  const db = loadDb();
  if (!db.applications) db.applications = {};
  if (!db.applications[userId]) {
    if (userId === 'usr_alex_rivera') {
      db.applications[userId] = JSON.parse(JSON.stringify(SEED_APPLICATIONS));
    } else {
      db.applications[userId] = [];
    }
    saveDb(db);
  }
  return db.applications[userId];
}

/**
 * Calculate Summary Metrics & Conversion Funnel
 * Enforces proper cohort conversion bounds (always >= 0% and <= 100%)
 */
export function calculateApplicationMetrics(applications = []) {
  const total = applications.length;
  const activeOrCompleted = applications.filter((a) => a.status !== 'Saved');
  const appliedCount = activeOrCompleted.length;
  const savedCount = applications.filter((a) => a.status === 'Saved').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;
  const withdrawnCount = applications.filter((a) => a.status === 'Withdrawn').length;

  // Cohort Progression:
  // 1. Reached Assessment: OA, Interview, Offer, or has recorded stages
  const reachedAssessmentCount = applications.filter((a) => 
    ['Online Assessment', 'Interview', 'Offer'].includes(a.status) || 
    (Array.isArray(a.interviews) && a.interviews.length > 0)
  ).length;

  // 2. Reached Interview: Interview, Offer, or has technical/behavioral interview stage
  const reachedInterviewCount = applications.filter((a) => 
    ['Interview', 'Offer'].includes(a.status) || 
    (Array.isArray(a.interviews) && a.interviews.some(i => i.type !== 'Online Assessment'))
  ).length;

  // 3. Reached Offer: Offer status
  const reachedOfferCount = applications.filter((a) => a.status === 'Offer').length;

  // Current status counts
  const inProcessCount = applications.filter((a) => ['Applied', 'Online Assessment', 'Interview'].includes(a.status)).length;
  const currentOaCount = applications.filter((a) => a.status === 'Online Assessment').length;
  const currentInterviewCount = applications.filter((a) => a.status === 'Interview').length;

  // Funnel conversion percentages strictly mathematically bound between 0% and 100%
  const appliedToAssessmentRate = appliedCount > 0 
    ? Math.min(100, Math.max(0, Math.round((Math.min(reachedAssessmentCount, appliedCount) / appliedCount) * 100))) 
    : 0;

  const assessmentToInterviewRate = reachedAssessmentCount > 0 
    ? Math.min(100, Math.max(0, Math.round((Math.min(reachedInterviewCount, reachedAssessmentCount) / reachedAssessmentCount) * 100))) 
    : 0;

  const interviewToOfferRate = reachedInterviewCount > 0 
    ? Math.min(100, Math.max(0, Math.round((Math.min(reachedOfferCount, reachedInterviewCount) / reachedInterviewCount) * 100))) 
    : 0;

  return {
    totalApplications: total,
    appliedCount,
    savedCount,
    inProcessCount,
    oaCount: currentOaCount,
    interviewCount: currentInterviewCount,
    offerCount: reachedOfferCount,
    rejectedCount,
    withdrawnCount,
    funnel: {
      appliedToAssessmentRate,
      assessmentToInterviewRate,
      interviewToOfferRate
    }
  };
}

/**
 * Extract Upcoming Deadlines & Scheduled Interviews
 */
export function getUpcomingApplicationEvents(applications) {
  const events = [];
  const now = new Date();

  applications.forEach((app) => {
    // 1. Application Deadline
    if (app.deadline && !['Offer', 'Rejected', 'Withdrawn'].includes(app.status)) {
      const deadlineDate = new Date(app.deadline);
      const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
      
      let relativeLabel = 'Upcoming';
      if (diffDays === 0) relativeLabel = 'Today';
      else if (diffDays === 1) relativeLabel = 'Tomorrow';
      else if (diffDays > 1 && diffDays <= 7) relativeLabel = `In ${diffDays} days`;
      else if (diffDays < 0) relativeLabel = 'Passed';

      events.push({
        id: `event_dead_${app.id}`,
        applicationId: app.id,
        company: app.company,
        role: app.role,
        type: 'deadline',
        title: 'Application Deadline',
        date: app.deadline,
        diffDays,
        relativeLabel,
        isInterview: false
      });
    }

    // 2. Scheduled Interviews
    (app.interviews || []).forEach((intItem) => {
      if (intItem.status === 'scheduled' && intItem.scheduledAt) {
        const intDate = new Date(intItem.scheduledAt);
        const diffDays = Math.ceil((intDate - now) / (1000 * 60 * 60 * 24));

        let relativeLabel = 'Upcoming';
        if (diffDays === 0) relativeLabel = 'Today';
        else if (diffDays === 1) relativeLabel = 'Tomorrow';
        else if (diffDays > 1 && diffDays <= 7) relativeLabel = `In ${diffDays} days`;

        // Format time
        const timeStr = intDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        events.push({
          id: `event_int_${intItem.id}`,
          applicationId: app.id,
          interviewId: intItem.id,
          company: app.company,
          role: app.role,
          type: 'interview',
          interviewType: intItem.type || 'Technical',
          title: intItem.title || `${intItem.type} Interview`,
          date: intItem.scheduledAt,
          time: timeStr,
          diffDays,
          relativeLabel,
          notes: intItem.notes,
          isInterview: true
        });
      }
    });
  });

  // Sort chronologically (closest first)
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  return events;
}

/**
 * Get Preparation Recommendation based on upcoming interviews
 */
export function getPreparationRecommendation(applications) {
  const upcomingEvents = getUpcomingApplicationEvents(applications);
  const nextInterview = upcomingEvents.find((e) => e.isInterview && e.diffDays >= 0);

  if (!nextInterview) return null;

  let topicFocus = 'DSA + Problem Solving';
  if (nextInterview.interviewType === 'System Design') {
    topicFocus = 'System Design + Architecture & Caching';
  } else if (nextInterview.interviewType === 'Behavioral' || nextInterview.interviewType === 'HR') {
    topicFocus = 'Behavioral STAR Responses & Company Values';
  } else if (nextInterview.interviewType === 'Core CS') {
    topicFocus = 'OS, DBMS & Computer Networks';
  }

  return {
    company: nextInterview.company,
    role: nextInterview.role,
    interviewType: nextInterview.interviewType,
    daysRemaining: nextInterview.diffDays,
    scheduledDate: nextInterview.date,
    recommendedFocus: topicFocus,
    advisoryText: nextInterview.diffDays === 0 
      ? `Your ${nextInterview.company} interview is today. Do a quick revision of key algorithms.`
      : nextInterview.diffDays === 1 
      ? `Your ${nextInterview.company} interview is tomorrow. Focus on ${topicFocus}.`
      : `Your next interview with ${nextInterview.company} is in ${nextInterview.diffDays} days. Focus on ${topicFocus}.`
  };
}

/**
 * CRUD Operations
 */
export function createApplicationInDb(userId, data) {
  const db = loadDb();
  if (!db.applications) db.applications = {};
  if (!db.applications[userId]) db.applications[userId] = [];

  const newApp = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    company: data.company?.trim() || 'Untitled Company',
    role: data.role?.trim() || 'Software Engineer',
    status: data.status || 'Applied',
    applicationDate: data.applicationDate || new Date().toISOString().split('T')[0],
    deadline: data.deadline || null,
    jobUrl: data.jobUrl || '',
    location: data.location || 'Remote',
    workType: data.workType || 'Remote',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interviews: data.interviews || []
  };

  db.applications[userId].unshift(newApp);
  saveDb(db);
  return newApp;
}

export function updateApplicationInDb(userId, appId, updates) {
  const db = loadDb();
  if (!db.applications || !db.applications[userId]) return null;

  const idx = db.applications[userId].findIndex((a) => a.id === appId);
  if (idx === -1) return null;

  const current = db.applications[userId][idx];
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  db.applications[userId][idx] = updated;
  saveDb(db);
  return updated;
}

export function deleteApplicationFromDb(userId, appId) {
  const db = loadDb();
  if (!db.applications || !db.applications[userId]) return false;

  const initialLen = db.applications[userId].length;
  db.applications[userId] = db.applications[userId].filter((a) => a.id !== appId);
  const deleted = db.applications[userId].length < initialLen;
  if (deleted) saveDb(db);
  return deleted;
}

export function addInterviewToAppInDb(userId, appId, interviewData) {
  const db = loadDb();
  if (!db.applications || !db.applications[userId]) return null;

  const app = db.applications[userId].find((a) => a.id === appId);
  if (!app) return null;

  if (!app.interviews) app.interviews = [];
  const newInterview = {
    id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: interviewData.type || 'Technical',
    title: interviewData.title || `${interviewData.type || 'Technical'} Interview`,
    scheduledAt: interviewData.scheduledAt || new Date().toISOString(),
    status: interviewData.status || 'scheduled',
    notes: interviewData.notes || '',
    result: interviewData.result || 'pending'
  };

  app.interviews.push(newInterview);
  app.status = 'Interview';
  app.updatedAt = new Date().toISOString();
  saveDb(db);
  return { application: app, interview: newInterview };
}

export function updateInterviewInAppInDb(userId, appId, interviewId, updates) {
  const db = loadDb();
  if (!db.applications || !db.applications[userId]) return null;

  const app = db.applications[userId].find((a) => a.id === appId);
  if (!app || !app.interviews) return null;

  const intIdx = app.interviews.findIndex((i) => i.id === interviewId);
  if (intIdx === -1) return null;

  app.interviews[intIdx] = {
    ...app.interviews[intIdx],
    ...updates
  };
  app.updatedAt = new Date().toISOString();
  saveDb(db);
  return { application: app, interview: app.interviews[intIdx] };
}

export function deleteInterviewFromAppInDb(userId, appId, interviewId) {
  const db = loadDb();
  if (!db.applications || !db.applications[userId]) return null;

  const app = db.applications[userId].find((a) => a.id === appId);
  if (!app || !app.interviews) return null;

  app.interviews = app.interviews.filter((i) => i.id !== interviewId);
  app.updatedAt = new Date().toISOString();
  saveDb(db);
  return app;
}
