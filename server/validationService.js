/**
 * Server-Side Input Validation & Sanitization Service for NOVARA
 * Ensures strict schema enforcement, prevents injection, and rejects malformed payloads.
 */

import { sanitizeExternalUrl } from './securityMiddleware.js';

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim()) && email.length <= 254;
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
}

export function validateString(val, minLen = 1, maxLen = 500, fieldName = 'Field') {
  if (typeof val !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }
  const trimmed = val.trim();
  if (trimmed.length < minLen) {
    throw new Error(`${fieldName} cannot be empty (minimum ${minLen} characters).`);
  }
  if (trimmed.length > maxLen) {
    throw new Error(`${fieldName} exceeds maximum allowed length of ${maxLen} characters.`);
  }
  return trimmed;
}

export function validateDate(dateStr, fieldName = 'Date') {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') throw new Error(`${fieldName} must be a valid date string.`);
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new Error(`${fieldName} is an invalid date.`);
  }
  
  // Enforce reasonable year bounds (e.g. between 2020 and 2040)
  const year = d.getFullYear();
  if (year < 2020 || year > 2040) {
    throw new Error(`${fieldName} year is out of valid range (2020–2040).`);
  }

  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
}

export function validateNonNegativeNumber(num, fieldName = 'Number', max = 100000) {
  const parsed = Number(num);
  if (isNaN(parsed) || parsed < 0 || parsed > max) {
    throw new Error(`${fieldName} must be a non-negative number up to ${max}.`);
  }
  return parsed;
}

export function validateEnum(val, allowedList, fieldName = 'Field') {
  if (!allowedList.includes(val)) {
    throw new Error(`Invalid ${fieldName}: "${val}". Allowed values: ${allowedList.join(', ')}`);
  }
  return val;
}

export function sanitizeAndValidateApplicationInput(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid application data payload.');

  const company = validateString(data.company, 1, 100, 'Company name');
  const role = validateString(data.role, 1, 100, 'Role');
  const status = validateEnum(data.status || 'Applied', [
    'Saved', 'Applied', 'Online Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'
  ], 'Status');

  const applicationDate = validateDate(data.applicationDate || new Date().toISOString().split('T')[0], 'Application Date');
  const deadline = data.deadline ? validateDate(data.deadline, 'Deadline') : null;
  const workType = validateEnum(data.workType || 'Hybrid', ['Remote', 'Hybrid', 'On-site'], 'Work Type');
  const location = data.location ? validateString(data.location, 0, 150, 'Location') : '';
  const notes = data.notes ? validateString(data.notes, 0, 2000, 'Notes') : '';
  const jobUrl = data.jobUrl ? sanitizeExternalUrl(data.jobUrl) : '';

  return {
    company,
    role,
    status,
    applicationDate,
    deadline,
    workType,
    location,
    notes,
    jobUrl
  };
}

export function sanitizeAndValidateInterviewInput(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid interview stage payload.');

  const type = validateEnum(data.type || 'Technical', [
    'Technical', 'DSA', 'System Design', 'HR', 'Behavioral', 'Online Assessment', 'Other'
  ], 'Interview Type');
  const title = validateString(data.title || `${type} Round`, 1, 100, 'Stage Title');
  const status = validateEnum(data.status || 'scheduled', ['scheduled', 'completed', 'rescheduled'], 'Status');
  const result = validateEnum(data.result || 'pending', ['pending', 'passed', 'failed'], 'Result');
  const scheduledAt = data.scheduledAt ? validateDate(data.scheduledAt, 'Scheduled Date') : new Date().toISOString();
  const notes = data.notes ? validateString(data.notes, 0, 2000, 'Notes') : '';

  return {
    type,
    title,
    status,
    result,
    scheduledAt,
    notes
  };
}

export function sanitizeAndValidateCalendarEventInput(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid calendar event payload.');

  const title = validateString(data.title, 1, 150, 'Event Title');
  const type = validateEnum(data.type || 'Study Session', ['Study Session', 'Mock Interview', 'Other'], 'Event Type');
  const date = validateDate(data.date || new Date().toISOString().split('T')[0], 'Date');
  const time = data.time ? validateString(data.time, 1, 30, 'Time') : '10:00 AM';
  const durationMinutes = validateNonNegativeNumber(data.durationMinutes || 45, 'Duration Minutes', 720);
  const notes = data.notes ? validateString(data.notes, 0, 2000, 'Notes') : '';

  return {
    title,
    type,
    date,
    time,
    durationMinutes,
    notes
  };
}
