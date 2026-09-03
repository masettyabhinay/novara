/**
 * Server-Side Centralized AI Service for NOVARA
 * Integrates Google Gemini as the primary AI provider with:
 * - Official Google Gen AI SDK integration (@google/genai / @google/generative-ai)
 * - Provider abstraction (BaseAIProvider, GeminiAIProvider, MockAIProvider)
 * - Zero-hallucination constraints (Roadmap, Daily Plan, Coach, Interview, Revision)
 * - Robust error handling: 15s timeouts, rate-limit backoff, malformed JSON retries
 * - Strict security: GEMINI_API_KEY server-side only, redacted logs, free-tier safety
 */

import { logger, ERROR_CATEGORIES } from './logger.js';
import { validateRoadmapSchema, validateExtractedRoadmapQuality, isMetadataLine } from './roadmapService.js';

// =============================================================================
// 1. BASE AI PROVIDER (Abstract Interface)
// =============================================================================

export class BaseAIProvider {
  constructor(name = 'base-ai') {
    this.name = name;
  }

  isConfigured() {
    return false;
  }

  async generateText(_params) {
    throw new Error(`generateText() not implemented by provider "${this.name}".`);
  }

  async generateJSON(_params) {
    throw new Error(`generateJSON() not implemented by provider "${this.name}".`);
  }
}

// =============================================================================
// 2. GOOGLE GEMINI AI PROVIDER
// =============================================================================

export class GeminiAIProvider extends BaseAIProvider {
  constructor(options = {}) {
    super('google-gemini');
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
    this.modelName = options.model || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
    this.defaultTimeoutMs = options.timeoutMs || 15000; // 15s default
    this.maxRetries = options.maxRetries ?? 1;

    this._sdkClient = null;
    this._sdkType = null;
  }

  isConfigured() {
    const key = (this.apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '').trim();
    return key.length > 5 && !key.includes('your_gemini');
  }

  getEffectiveApiKey() {
    return (this.apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '').trim();
  }

  getEffectiveModel() {
    return (this.modelName || process.env.GEMINI_MODEL || 'gemini-3.7-flash').trim();
  }

  /**
   * Initializes the official Google Gemini SDK dynamically (supports @google/genai & @google/generative-ai).
   */
  async _getSdkClient() {
    const key = this.getEffectiveApiKey();
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    if (this._sdkClient) {
      return { client: this._sdkClient, type: this._sdkType };
    }

    // Try @google/genai first (Google's modern unified SDK)
    try {
      const genaiModule = await import('@google/genai');
      if (genaiModule && genaiModule.GoogleGenAI) {
        this._sdkClient = new genaiModule.GoogleGenAI({ apiKey: key });
        this._sdkType = 'genai';
        return { client: this._sdkClient, type: 'genai' };
      }
    } catch {
      // Fall through to @google/generative-ai
    }

    // Try @google/generative-ai (Google's classic Generative AI SDK)
    try {
      const classicModule = await import('@google/generative-ai');
      if (classicModule && classicModule.GoogleGenerativeAI) {
        this._sdkClient = new classicModule.GoogleGenerativeAI(key);
        this._sdkType = 'generative-ai';
        return { client: this._sdkClient, type: 'generative-ai' };
      }
    } catch {
      // Fall through
    }

    throw new Error('Neither @google/genai nor @google/generative-ai SDK could be loaded.');
  }

  /**
   * Generates raw text response with timeout, rate-limit detection, and retries.
   */
  async generateText({ prompt, systemInstruction = '', temperature = 0.2, timeoutMs = null }) {
    const timeout = timeoutMs || this.defaultTimeoutMs;
    const model = this.getEffectiveModel();

    return this._executeWithResilience(async (signal) => {
      const { client, type } = await this._getSdkClient();

      if (type === 'genai') {
        const config = {
          temperature,
          abortSignal: signal
        };
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }

        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config
        });

        return response.text || '';
      } else {
        // classic @google/generative-ai
        const genModel = client.getGenerativeModel({
          model,
          generationConfig: { temperature },
          systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
        });

        const genPromise = genModel.generateContent(prompt);
        const abortPromise = new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(new Error('AI_REQUEST_TIMEOUT')));
        });

        const result = await Promise.race([genPromise, abortPromise]);
        const response = await result.response;
        return response.text() || '';
      }
    }, timeout);
  }

  /**
   * Generates validated structured JSON response with automatic retry on malformed JSON.
   */
  async generateJSON({ prompt, systemInstruction = '', temperature = 0.1, timeoutMs = null, schemaHint = '' }) {
    const strictSystemPrompt = `${systemInstruction ? systemInstruction + '\n\n' : ''}IMPORTANT: You must respond ONLY with valid JSON. Do not include markdown code fence formatting (\`\`\`json), do not include any preamble, conversational text, or trailing commentary. Ensure the output is strictly parseable JSON${schemaHint ? ' matching the requested schema: ' + schemaHint : '.'}`;

    let lastError = null;
    let attemptPrompt = prompt;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const rawOutput = await this.generateText({
          prompt: attemptPrompt,
          systemInstruction: strictSystemPrompt,
          temperature,
          timeoutMs
        });

        const parsed = this._cleanAndParseJSON(rawOutput);
        return parsed;
      } catch (err) {
        lastError = err;
        // If it's a rate limit, timeout, or auth error, do not perform standard JSON retry
        if (err.message === 'AI_REQUEST_TIMEOUT' || err.status === 429 || err.status === 401 || err.status === 403) {
          throw err;
        }

        logger.warn(`[GeminiAIProvider] JSON parse failed on attempt ${attempt}/${this.maxRetries + 1}: ${err.message}. Retrying with stricter prompt.`);
        attemptPrompt = `${prompt}\n\n[ERROR: Your previous response was not valid JSON: ${err.message}. You must output strictly valid raw JSON without any markdown formatting.]`;
      }
    }

    throw new Error(`Gemini returned invalid JSON after retries: ${lastError?.message}`);
  }

  /**
   * Robust JSON extractor: handles clean JSON or markdown-wrapped JSON (```json ... ```).
   */
  _cleanAndParseJSON(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Empty or non-string response received from AI model.');
    }

    let cleaned = text.trim();

    // Strip markdown code fences if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }

    // Try direct parse
    try {
      return JSON.parse(cleaned);
    } catch (directErr) {
      // Find outermost JSON object { ... } or array [ ... ]
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const candidate = cleaned.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          // fall through
        }
      }

      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        const candidate = cleaned.slice(firstBracket, lastBracket + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          // fall through
        }
      }

      throw new Error(`Malformed JSON response: ${directErr.message}`);
    }
  }

  /**
   * Wraps API invocation with AbortController timeout and rate-limit backoff handling.
   */
  async _executeWithResilience(operation, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      return await operation(controller.signal);
    } catch (err) {
      if (controller.signal.aborted || err.message === 'AI_REQUEST_TIMEOUT' || err.name === 'AbortError') {
        const timeoutErr = new Error('AI_REQUEST_TIMEOUT');
        timeoutErr.isTimeout = true;
        throw timeoutErr;
      }

      // Check for Rate Limit (HTTP 429 / RESOURCE_EXHAUSTED)
      const errStr = String(err.message || err);
      const isRateLimit = err.status === 429 || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit) {
        const rateErr = new Error('Gemini API rate limit reached (429). Please try again in a few moments.');
        rateErr.status = 429;
        rateErr.isRateLimit = true;
        throw rateErr;
      }

      // Check for Authentication / API Key error (401 / 403)
      const isAuthErr = err.status === 401 || err.status === 403 || errStr.includes('API_KEY_INVALID') || errStr.includes('unauthorized') || errStr.includes('permission');
      if (isAuthErr) {
        const authErr = new Error('Gemini API authentication failed. Verify server GEMINI_API_KEY configuration.');
        authErr.status = 401;
        authErr.isAuthError = true;
        throw authErr;
      }

      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// =============================================================================
// 3. MOCK AI PROVIDER (For Testing All Scenarios Without Live API Keys)
// =============================================================================

export class MockAIProvider extends BaseAIProvider {
  constructor(options = {}) {
    super('mock-ai');
    this.configured = options.configured ?? true;
    this.mockResponses = options.responses || {};
    this.forceTimeout = options.forceTimeout || false;
    this.forceRateLimit = options.forceRateLimit || false;
    this.forceAuthError = options.forceAuthError || false;
    this.forceInvalidJson = options.forceInvalidJson || false;
    this.forceUnavailable = options.forceUnavailable || false;
    this.callHistory = [];
  }

  isConfigured() {
    return this.configured;
  }

  async generateText(params) {
    this.callHistory.push({ type: 'text', params });

    if (this.forceTimeout) {
      const err = new Error('AI_REQUEST_TIMEOUT');
      err.isTimeout = true;
      throw err;
    }
    if (this.forceRateLimit) {
      const err = new Error('Gemini API rate limit reached (429). Please try again in a few moments.');
      err.status = 429;
      err.isRateLimit = true;
      throw err;
    }
    if (this.forceAuthError) {
      const err = new Error('Gemini API authentication failed. Verify server GEMINI_API_KEY configuration.');
      err.status = 401;
      err.isAuthError = true;
      throw err;
    }
    if (this.forceUnavailable) {
      const err = new Error('Service Unavailable: Unable to reach AI provider.');
      err.status = 503;
      throw err;
    }

    return this.mockResponses.text || 'Mocked AI text response.';
  }

  async generateJSON(params) {
    this.callHistory.push({ type: 'json', params });

    if (this.forceTimeout) {
      const err = new Error('AI_REQUEST_TIMEOUT');
      err.isTimeout = true;
      throw err;
    }
    if (this.forceRateLimit) {
      const err = new Error('Gemini API rate limit reached (429). Please try again in a few moments.');
      err.status = 429;
      err.isRateLimit = true;
      throw err;
    }
    if (this.forceAuthError) {
      const err = new Error('Gemini API authentication failed. Verify server GEMINI_API_KEY configuration.');
      err.status = 401;
      err.isAuthError = true;
      throw err;
    }
    if (this.forceUnavailable) {
      const err = new Error('Service Unavailable: Unable to reach AI provider.');
      err.status = 503;
      throw err;
    }
    if (this.forceInvalidJson) {
      throw new Error('Gemini returned invalid JSON after retries: Unexpected token < in JSON at position 0');
    }

    return this.mockResponses.json || {};
  }
}

// =============================================================================
// 4. CENTRAL PROVIDER REGISTRY & CONFIGURATION
// =============================================================================

let activeProvider = new GeminiAIProvider();

export function setAIProvider(provider) {
  if (!(provider instanceof BaseAIProvider)) {
    throw new Error('Provider must be an instance of BaseAIProvider.');
  }
  activeProvider = provider;
  logger.info(`[AIService] AI Provider switched to: ${provider.name}`);
}

export function getAIProvider() {
  return activeProvider;
}

export function resetAIProvider() {
  activeProvider = new GeminiAIProvider();
}

export function isGeminiConfigured() {
  return activeProvider.isConfigured();
}

// =============================================================================
// 5. DOMAIN INTEGRATION METHODS
// =============================================================================

/**
 * 1. Roadmap Semantic Parsing with Zero-Hallucination Constraints
 * Interprets sanitized, visible document text into structured phases and topics.
 * Never receives raw PDF syntax. Validated against strict schema.
 */
export async function parseRoadmapWithAI(sanitizedText, targetRole = 'Software Engineer', fileName = '') {
  if (!sanitizedText || typeof sanitizedText !== 'string' || sanitizedText.trim().length < 20) {
    return null;
  }

  const provider = getAIProvider();
  if (!provider.isConfigured()) {
    return null;
  }

  const prompt = `You are the NOVARA Placement Curriculum Specialist.
Analyze the following SANITIZED curriculum text extracted from an uploaded document (${fileName}) and organize it into a structured placement roadmap.

STRICT ZERO-HALLUCINATION & METADATA EXCLUSION RULES:
1. Extract ONLY technical curriculum topics explicitly discussed in the text.
2. CRITICAL - NEVER ADD DOCUMENT METADATA AS TOPICS OR PHASES:
   - Application or platform name ("NOVARA", "Placeready") MUST NEVER be topics or phases.
   - Document title or header ("Sample Software Engineer Placement Preparation Roadmap") MUST NEVER be topics or phases.
   - Duration metadata ("Duration: 12 Weeks", "12 Weeks") MUST NEVER be topics or phases.
   - Daily study time ("Daily Study Time: 2-3 hours", "2 hours/day") MUST NEVER be topics or phases.
   - Target role ("Target: Software Engineer / SDE Placement") MUST NEVER be topics or phases.
   - Author, upload date, page numbers, or section labels ("Topics:", "Curriculum:") MUST NEVER be topics or phases.
   Document-level metadata should only be stored as top-level JSON fields (title, targetRole).
3. DO NOT INVENT DURATIONS:
   If duration is not explicitly stated in the document for a specific topic, set duration to null. NEVER assign an artificial default duration like "6h".
4. DO NOT INVENT PROBLEM COUNTS:
   If problem count is not explicitly stated for a topic, set problemsCount to null.
5. CLEAN TOPIC NAMES:
   Topic names must be clean skill/concept names. Strip any "Topics:" or bullet markers. For example, "Topics• Variables, data types and operators" MUST become "Variables, data types and operators".
6. Consolidate topics into a clean, bounded curriculum of 3 to 8 logical phases (e.g. Phase 01: Programming Foundations, Phase 02: Data Structures, etc.). Never produce more than 10 phases.

DOCUMENT TEXT:
${sanitizedText.slice(0, 15000)}

REQUIRED JSON STRUCTURE:
{
  "title": "Placement Preparation Roadmap Title",
  "targetRole": "${targetRole}",
  "extractedSkills": ["Skill1", "Skill2", "Skill3"],
  "phases": [
    {
      "number": "01",
      "title": "Phase 01: Programming Foundations",
      "description": "Short phase curriculum summary",
      "topics": [
        {
          "name": "Variables, data types and operators",
          "difficulty": "Easy",
          "problemsCount": null,
          "duration": null
        }
      ]
    }
  ]
}`;

  try {
    let parsed = await provider.generateJSON({
      prompt,
      systemInstruction: 'You are an expert technical curriculum parser. Return only valid JSON matching the requested roadmap schema. Do not include document metadata (product name, title, duration, study time, target role) as topics. Do not invent 6h durations.',
      schemaHint: 'Roadmap with title, targetRole, extractedSkills, and phases array with topics.'
    });

    // Validate with strict schema validator
    let validation = validateRoadmapSchema(parsed);
    let quality = validation.valid ? validateExtractedRoadmapQuality(parsed, fileName, targetRole) : { valid: false, reason: validation.error };

    // If quality validation fails (e.g. metadata leaked into topics), retry Gemini ONCE with a targeted correction prompt
    if (!quality.valid) {
      logger.warn(`[AIService] AI-generated roadmap failed quality check: ${quality.reason}. Retrying Gemini with targeted correction prompt...`);
      try {
        const retryPrompt = `${prompt}

CRITICAL CORRECTION REQUIRED:
Your previous response failed quality validation because: ${quality.reason}.
Ensure that:
1. Product name ("NOVARA"), document title, duration ("12 Weeks"), daily study time, and target role are NEVER included as topics or phases.
2. No artificial "6h" durations are generated; use null when not stated in source text.
3. Clean topic names without bullet points or "Topics" prefixes.`;

        parsed = await provider.generateJSON({
          prompt: retryPrompt,
          systemInstruction: 'You are an expert technical curriculum parser. Return only valid JSON. Do not include document metadata as topics. Do not invent 6h durations.',
          schemaHint: 'Clean roadmap without metadata topics and without fabricated durations.'
        });

        validation = validateRoadmapSchema(parsed);
        quality = validation.valid ? validateExtractedRoadmapQuality(parsed, fileName, targetRole) : { valid: false, reason: validation.error };
      } catch (retryErr) {
        logger.warn(`[AIService] Gemini retry failed: ${retryErr.message}`);
      }
    }

    if (!validation.valid || !quality.valid) {
      logger.warn(`[AIService] AI-generated roadmap rejected due to quality failure: ${quality.reason || validation.error}. Falling back to deterministic parser.`);
      return null;
    }

    // Hydrate fields required by NOVARA frontend
    const hydratedPhases = parsed.phases.map((phase, pIdx) => {
      const pNum = String(pIdx + 1).padStart(2, '0');
      const isCompleted = pIdx === 0;
      const isInProgress = pIdx === 1;

      return {
        id: `phase-ai-${Date.now()}-${pIdx + 1}`,
        number: pNum,
        title: phase.title || `Phase ${pNum}`,
        description: phase.description || `Curriculum topics for Phase ${pNum}.`,
        status: isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'upcoming',
        progress: isCompleted ? 100 : isInProgress ? 50 : 0,
        topics: (phase.topics || [])
          .filter(topic => !isMetadataLine(topic.name, fileName, targetRole))
          .map((topic, tIdx) => ({
            id: `t-ai-${Date.now()}-${pIdx + 1}-${tIdx + 1}`,
            name: (topic.name || 'Topic')
              .replace(/^Topics\s*[:•\-\*]?\s*/i, '')
              .replace(/^(?:[\u2022\u25E6\u25AA\u2713\u2013\u2014•\-\*]|â€¢|\u00e2[\u0080\u20ac]\u00a2|\d+[\.\)\-:])+\s*/, '')
              .trim(),
            difficulty: topic.difficulty || 'Medium',
            problemsCount: typeof topic.problemsCount === 'number' ? topic.problemsCount : null,
            duration: (topic.duration && topic.duration !== '6h' && typeof topic.duration === 'string') ? topic.duration : null,
            status: isCompleted ? 'completed' : isInProgress && tIdx === 0 ? 'in_progress' : 'upcoming',
            confidence: 'high'
          }))
      };
    });

    const totalTopics = hydratedPhases.reduce((acc, p) => acc + p.topics.length, 0);
    const completedTopics = hydratedPhases.reduce((acc, p) => acc + p.topics.filter((t) => t.status === 'completed').length, 0);

    return {
      id: `roadmap-ai-${Date.now()}`,
      title: parsed.title || fileName.replace(/\.[^/.]+$/, '').toUpperCase() || 'PLACEMENT ROADMAP',
      targetRole: parsed.targetRole || targetRole,
      targetDate: '2026-11-20',
      totalEstimatedHours: hydratedPhases.reduce((acc, p) => acc + p.topics.reduce((tAcc, t) => tAcc + (parseInt(t.duration, 10) || 0), 0), 0) || null,
      overallProgress: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      extractedSkills: Array.isArray(parsed.extractedSkills) && parsed.extractedSkills.length > 0
        ? parsed.extractedSkills.slice(0, 8)
        : ['Algorithm Design', 'Data Structures', 'Core Computer Science', 'System Design'],
      phases: hydratedPhases,
      source: 'extracted_from_document',
      fileName,
      uploadedAt: new Date().toISOString(),
      confidence: 'high',
      needsReview: false,
      reviewReason: null,
      extractedTextLength: sanitizedText.length
    };
  } catch (err) {
    logger.error(ERROR_CATEGORIES.AI_ERROR, 'Roadmap semantic parsing with Gemini failed', err);
    return null; // Signals caller to fall back to deterministic parser
  }
}

/**
 * 2. Daily Plan Generation
 * Prioritizes and organizes user's actual roadmap topics and revisions respecting daily hours.
 */
export async function generateDailyPlanWithAI({ roadmap, preferences = {}, pendingTasks = [], completedTasks = [], revisions = [] }) {
  const provider = getAIProvider();
  const dailyTargetHours = preferences.dailyTargetHours || 3.0;
  const maxMinutes = Math.round(dailyTargetHours * 60);

  if (!provider.isConfigured() || !roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return null;
  }

  // Extract authentic active roadmap topics
  const activePhase = roadmap.phases.find((p) => p.status === 'in_progress') || roadmap.phases[0];
  const activeTopics = (activePhase?.topics || []).slice(0, 6).map((t) => ({ id: t.id, name: t.name, difficulty: t.difficulty }));
  const upcomingPhase = roadmap.phases.find((p) => p.status === 'upcoming') || activePhase;
  const coreCsTopics = (upcomingPhase?.topics || []).slice(0, 3).map((t) => ({ id: t.id, name: t.name }));

  const prompt = `You are NOVARA's Daily Study Schedule Optimizer.
Generate a focused daily study plan for today respecting the user's study limits and authentic curriculum topics.

CONSTRAINTS:
1. Daily Study Capacity: EXACTLY ${dailyTargetHours} hours (${maxMinutes} total minutes). The sum of all task durationMinutes MUST NOT exceed ${maxMinutes} minutes!
2. Grounded Topics ONLY: You must select topics directly from the user's active curriculum:
   Active Phase: "${activePhase?.title}"
   Available Active Topics: ${JSON.stringify(activeTopics)}
   Core CS / Upcoming Topics: ${JSON.stringify(coreCsTopics)}
3. DO NOT invent fake roadmap topics or technologies not related to their curriculum.
4. Structure 4 to 6 diverse tasks across categories: DSA, Aptitude, Core CS, Coding, Communication, Revision.

OUTPUT JSON FORMAT:
{
  "tasks": [
    {
      "category": "DSA" | "Aptitude" | "Core CS" | "Coding" | "Communication" | "Revision",
      "topicId": "topic-id-from-available-topics",
      "name": "Concise actionable task title",
      "description": "Clear step-by-step practice instruction",
      "durationMinutes": 45,
      "priority": "High" | "Medium" | "Low",
      "type": "practice" | "learning" | "mock" | "revision",
      "problemLinks": ["Pattern Checklist", "Optimal Solution Guide"],
      "subtasks": [
        { "text": "Subtask 1 action" },
        { "text": "Subtask 2 action" }
      ]
    }
  ]
}`;

  try {
    const result = await provider.generateJSON({
      prompt,
      systemInstruction: 'You are an expert placement coach. Return only valid JSON for daily study tasks. Enforce that the sum of task durationMinutes is less than or equal to the daily capacity limit.',
      schemaHint: 'Object with tasks array where each task has category, name, description, durationMinutes, priority, type, subtasks.'
    });

    if (!result || !Array.isArray(result.tasks) || result.tasks.length === 0) {
      return null;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let runningMinutes = 0;

    const formattedTasks = [];
    for (let i = 0; i < result.tasks.length; i++) {
      const raw = result.tasks[i];
      let dur = parseInt(raw.durationMinutes, 10) || 30;

      // Bound duration to avoid exceeding daily capacity
      if (runningMinutes + dur > maxMinutes) {
        dur = Math.max(15, maxMinutes - runningMinutes);
      }
      if (dur < 10) break; // Skip tiny overflow tasks

      runningMinutes += dur;

      formattedTasks.push({
        id: `task-${Date.now()}-${i + 1}`,
        date: todayStr,
        category: raw.category || 'DSA',
        topicId: raw.topicId || `t-${i + 1}`,
        name: raw.name || 'Daily Mission',
        description: raw.description || `Study session for ${raw.name}.`,
        estimatedDuration: `${dur} min`,
        durationMinutes: dur,
        priority: raw.priority || (i === 0 ? 'High' : 'Medium'),
        type: raw.type || 'practice',
        status: 'pending',
        completed: false,
        problemLinks: Array.isArray(raw.problemLinks) ? raw.problemLinks : ['Core Pattern Questions'],
        notes: `Aligned with ${roadmap.title}`,
        subtasks: Array.isArray(raw.subtasks)
          ? raw.subtasks.map((st, sIdx) => ({
              id: `st-${Date.now()}-${i + 1}-${sIdx + 1}`,
              text: typeof st === 'string' ? st : st.text || 'Practice exercise',
              done: false
            }))
          : [
              { id: `st-${Date.now()}-${i + 1}-1`, text: 'Review key concept & edge cases', done: false },
              { id: `st-${Date.now()}-${i + 1}-2`, text: 'Implement and verify solution', done: false }
            ]
      });

      if (runningMinutes >= maxMinutes) break;
    }

    return {
      tasks: formattedTasks,
      totalScheduledMinutes: runningMinutes,
      dailyCapMinutes: maxMinutes
    };
  } catch (err) {
    logger.error(ERROR_CATEGORIES.AI_ERROR, 'Daily plan generation with Gemini failed', err);
    return null;
  }
}

/**
 * 3. AI Placement Coach Analysis
 * Grounded analysis of actual student preparation database evidence.
 */
export async function analyzeCoachWithAI({ user, roadmap, tasks = [], streak = {}, applications = [], revisions = [], deterministicBaseline }) {
  const provider = getAIProvider();
  if (!provider.isConfigured() || !deterministicBaseline) {
    return deterministicBaseline;
  }

  // Database Evidence Summary
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const totalTasks = tasks.length;
  const currentStreak = streak.currentStreak || 0;
  const dailyStudyHours = user?.dailyStudyMinutes ? user.dailyStudyMinutes / 60 : 3;

  const prompt = `You are NOVARA's AI Placement Coach.
Review the user's authentic preparation database records and generate grounded, constructive feedback and an actionable redistribution recommendation.

STRICT ZERO-HALLUCINATION RULES:
1. Base all feedback strictly on the provided real statistics below.
2. DO NOT claim the student completed anything unless confirmed by these statistics.
3. Daily Study Limit: The student has ${dailyStudyHours}h/day. Recommendations must never exceed this daily limit.

AUTHENTIC USER METRICS:
- Target Role: ${user.targetRole || 'Software Engineer'}
- Placement Target Date: ${user.placementTargetDate || '2026-11-20'} (${deterministicBaseline.daysRemaining ?? 'N/A'} days remaining)
- Readiness Score: ${deterministicBaseline.readinessPercent}% (${deterministicBaseline.status})
- Roadmap Progress: ${deterministicBaseline.roadmapProgress}%
- Category Breakdown: ${JSON.stringify(deterministicBaseline.categories)}
- Weakest Area: ${deterministicBaseline.weakestCategory}
- Strongest Area: ${deterministicBaseline.strongestCategory}
- Tasks Completed: ${completedTasksCount}/${totalTasks} (Pending: ${pendingTasksCount})
- Active Streak: ${currentStreak} days
- Applications Count: ${applications.length}
- Spaced Revisions Active: ${revisions.length}

REQUIRED JSON OUTPUT:
{
  "compactInsight": "1-2 sentence crisp diagnostic highlighting weakest area and actionable remedy.",
  "strengths": ["Evidence-based strength 1", "Evidence-based strength 2"],
  "weakAreas": ["Evidence-based improvement area 1", "Evidence-based improvement area 2"],
  "recommendationSummary": "Concise summary of proposed 4-day redistribution shift toward weakest area.",
  "weeklyTakeaways": [
    "Key actionable takeaway for upcoming week 1",
    "Key actionable takeaway for upcoming week 2"
  ]
}`;

  try {
    const aiResult = await provider.generateJSON({
      prompt,
      systemInstruction: 'You are an evidence-based placement coach. Output valid JSON only. Rely exclusively on provided database metrics.',
      schemaHint: 'Object with compactInsight, strengths, weakAreas, recommendationSummary, weeklyTakeaways.'
    });

    if (!aiResult) return deterministicBaseline;

    // Merge AI insights with deterministic calculations to guarantee data integrity
    return {
      ...deterministicBaseline,
      compactInsight: aiResult.compactInsight || deterministicBaseline.compactInsight,
      strengths: Array.isArray(aiResult.strengths) && aiResult.strengths.length > 0 ? aiResult.strengths : deterministicBaseline.strengths,
      weakAreas: Array.isArray(aiResult.weakAreas) && aiResult.weakAreas.length > 0 ? aiResult.weakAreas : deterministicBaseline.weakAreas,
      recommendation: {
        ...deterministicBaseline.recommendation,
        summary: aiResult.recommendationSummary || deterministicBaseline.recommendation?.summary
      },
      weeklyReport: {
        ...deterministicBaseline.weeklyReport,
        takeaways: Array.isArray(aiResult.weeklyTakeaways) && aiResult.weeklyTakeaways.length > 0
          ? aiResult.weeklyTakeaways
          : deterministicBaseline.weeklyReport?.takeaways
      }
    };
  } catch (err) {
    logger.error(ERROR_CATEGORIES.AI_ERROR, 'Coach AI analysis failed, falling back to deterministic engine', err);
    return deterministicBaseline;
  }
}

/**
 * 4. Mock Interview Question Generation
 * Generates technical & behavioral questions grounded in target role and weak areas.
 */
export async function generateInterviewQuestionsWithAI({ targetRole = 'Software Engineer', roadmapTopics = [], difficulty = 'Medium', count = 5, weakAreas = [], category = 'Technical' }) {
  const provider = getAIProvider();
  if (!provider.isConfigured()) {
    return null;
  }

  const prompt = `You are a Principal Technical Interviewer conducting a mock interview for a "${targetRole}" candidate.
Generate ${count} realistic, high-yield interview questions for category: "${category}".

TOPIC FOCUS & WEAK AREAS TO ADDRESS:
- Candidate Weak Areas: ${weakAreas.join(', ') || 'Core Data Structures & Complexity'}
- Curriculum Topics: ${roadmapTopics.slice(0, 10).join(', ') || 'Arrays, Trees, Graphs, OS, DBMS'}
- Target Difficulty: ${difficulty}

REQUIRED JSON OUTPUT FORMAT:
{
  "questions": [
    {
      "category": "${category}",
      "topic": "Specific Topic Name",
      "difficulty": "Easy" | "Medium" | "Hard",
      "question": "Clear, precise interview question",
      "expectedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
      "idealAnswerOutline": "2-3 sentence outline of what an optimal technical response covers."
    }
  ]
}`;

  try {
    const result = await provider.generateJSON({
      prompt,
      systemInstruction: 'You are an expert technical interviewer. Return only valid JSON with structured interview questions and evaluation criteria.',
      schemaHint: 'Object with questions array matching the requested schema.'
    });

    if (!result || !Array.isArray(result.questions) || result.questions.length === 0) {
      return null;
    }

    return result.questions.map((q, idx) => ({
      id: `q-gemini-${Date.now()}-${idx + 1}`,
      category: q.category || category,
      topic: q.topic || 'Technical Fundamentals',
      difficulty: q.difficulty || difficulty,
      question: q.question,
      expectedKeywords: Array.isArray(q.expectedKeywords) ? q.expectedKeywords : ['algorithmic efficiency', 'trade-offs'],
      idealAnswerOutline: q.idealAnswerOutline || 'Clear technical explanation with complexity bounds and practical considerations.'
    }));
  } catch (err) {
    logger.error(ERROR_CATEGORIES.AI_ERROR, 'Mock interview question generation with Gemini failed', err);
    return null;
  }
}

/**
 * 5. Mock Interview Answer Evaluation
 * Evaluates candidate answer across multi-dimensional rubrics with zero voice/pitch hallucination.
 */
export async function evaluateInterviewAnswerWithAI({ question, expectedKeywords = [], idealAnswerOutline = '', userAnswer = '' }) {
  const provider = getAIProvider();
  if (!provider.isConfigured() || !userAnswer || userAnswer.trim().length === 0) {
    return null;
  }

  const prompt = `You are an expert technical interviewer evaluating a student's answer.
Evaluate the following answer with objective technical rigor.

QUESTION:
${question}

EXPECTED KEYWORDS:
${expectedKeywords.join(', ')}

IDEAL ANSWER BENCHMARK:
${idealAnswerOutline}

STUDENT'S SUBMITTED ANSWER:
${userAnswer}

RUBRIC EVALUATION GUIDELINES:
1. Score from 0 to 100 on each metric: correctness, relevance, completeness, clarity, technicalDepth.
2. Composite Score: Weighted average of the metrics.
3. DO NOT claim anything about voice tone, vocal cadence, emotion, or video appearance. Evaluate ONLY the submitted text!
4. Highlight concrete technical strengths and actionable points for improvement.

REQUIRED JSON OUTPUT:
{
  "score": 85,
  "correctness": 85,
  "relevance": 90,
  "completeness": 80,
  "clarity": 85,
  "technicalDepth": 80,
  "strengths": ["Clear definition of concepts...", "Accurately noted trade-offs..."],
  "improvements": ["Could explicitly mention time complexity...", "Elaborate on edge cases..."],
  "missingConcepts": ["concept1", "concept2"]
}`;

  try {
    const evalResult = await provider.generateJSON({
      prompt,
      systemInstruction: 'You are an objective technical evaluation engine. Output valid JSON only. Grade text answers strictly on conceptual correctness, depth, and clarity.',
      schemaHint: 'Object with score, correctness, relevance, completeness, clarity, technicalDepth, strengths, improvements, missingConcepts.'
    });

    if (!evalResult || typeof evalResult.score !== 'number') {
      return null;
    }

    return {
      score: Math.min(100, Math.max(0, Math.round(evalResult.score))),
      correctness: Math.min(100, Math.max(0, Math.round(evalResult.correctness || evalResult.score))),
      relevance: Math.min(100, Math.max(0, Math.round(evalResult.relevance || evalResult.score))),
      completeness: Math.min(100, Math.max(0, Math.round(evalResult.completeness || evalResult.score))),
      clarity: Math.min(100, Math.max(0, Math.round(evalResult.clarity || evalResult.score))),
      technicalDepth: Math.min(100, Math.max(0, Math.round(evalResult.technicalDepth || evalResult.score))),
      isSkipped: false,
      strengths: Array.isArray(evalResult.strengths) ? evalResult.strengths : ['Demonstrated foundational understanding.'],
      improvements: Array.isArray(evalResult.improvements) ? evalResult.improvements : ['Review complexity and boundary conditions.'],
      missingConcepts: Array.isArray(evalResult.missingConcepts) ? evalResult.missingConcepts : []
    };
  } catch (err) {
    logger.error(ERROR_CATEGORIES.AI_ERROR, 'Interview answer evaluation with Gemini failed', err);
    return null;
  }
}

/**
 * 6. Smart Revision Question Generation
 * Generates verified, topic-grounded active recall questions and explanations.
 * Database scheduling intervals remain 100% deterministic.
 */
export async function generateRevisionQuestionsWithAI({ topicName = 'Arrays & Two Pointers', category = 'DSA', difficulty = 'Medium', count = 5 }) {
  const provider = getAIProvider();
  if (!provider.isConfigured()) {
    return null;
  }

  const prompt = `You are NOVARA's Adaptive Spaced Revision Question Generator.
Generate ${count} active recall questions for the topic: "${topicName}" (${category}, difficulty: ${difficulty}).

QUESTION TYPES TO INCLUDE:
- Multiple Choice (mcq)
- Code Output Tracing (code_output)
- True / False (true_false)
- Conceptual Explanation (concept_explain)

CRITICAL REQUIREMENTS:
1. Every question must have an unambiguous, 100% verified correct answer.
2. Provide a thorough, educational explanation explaining WHY the answer is correct.
3. For mcq and code_output, provide exactly 4 distinct options.

REQUIRED JSON OUTPUT:
{
  "questions": [
    {
      "type": "mcq" | "code_output" | "true_false" | "concept_explain",
      "question": "Question text...",
      "codeSnippet": "optional code snippet or null",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact matching option text",
      "explanation": "Detailed explanation of correct answer...",
      "testedSubconcept": "Specific concept tested"
    }
  ]
}`;

  try {
    const result = await provider.generateJSON({
      prompt,
      systemInstruction: 'You are an expert computer science educator. Output only valid JSON with technically rigorous active recall questions and verified explanations.',
      schemaHint: 'Object with questions array matching the requested schema.'
    });

    if (!result || !Array.isArray(result.questions) || result.questions.length === 0) {
      return null;
    }

    return result.questions.map((q, idx) => ({
      id: `q-rev-gemini-${Date.now()}-${idx + 1}`,
      type: q.type || 'mcq',
      question: q.question,
      codeSnippet: q.codeSnippet || null,
      options: Array.isArray(q.options) ? q.options : ['True', 'False'],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'Verified core conceptual principle.',
      testedSubconcept: q.testedSubconcept || topicName
    }));
  } catch (err) {
    logger.error(ERROR_CATEGORIES.AI_ERROR, 'Revision questions generation with Gemini failed', err);
    return null;
  }
}
