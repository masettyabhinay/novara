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
import {
  validateRoadmapSchema,
  validateExtractedRoadmapQuality,
  isMetadataLine,
  extractSourceCurriculumBullets,
  validateCurriculumFaithfulness
} from './roadmapService.js';

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

  const sourceCurriculum = extractSourceCurriculumBullets(sanitizedText, fileName, targetRole);

  const prompt = `You are the NOVARA Placement Curriculum Specialist.
Analyze the following SANITIZED curriculum text extracted from an uploaded document (${fileName}) and organize it into a structured placement roadmap.

STRICT FAITHFUL CURRICULUM PRESERVATION RULES:
1. FAITHFUL TOPIC PRESERVATION (CRITICAL):
   - Every distinct bullet point, sub-topic, or list item in the source curriculum MUST become its own separate topic in the output roadmap.
   - Do NOT merge, combine, or consolidate two distinct source bullet points into one topic.
   - For example, if the source has:
     - Stacks
     - Queues
     the output MUST contain:
     - Stacks
     - Queues
     as two separate topics. NEVER merge them into "Stacks and Queues".
   - Similarly, preserve every distinct bullet/list item from the source unless the source itself explicitly combined them on a single line.
2. DO NOT SUMMARIZE, CONSOLIDATE, OR RENAME:
   - Do not use AI to unnecessarily summarize, consolidate, or rename individual topics.
   - Topic names MUST remain as close as possible to the exact source wording.
3. CURRICULUM HIERARCHY & BOUNDED PHASES:
   - Preserve the source document's phase hierarchy. Group topics into their respective source phases.
   - Do not invent additional topics that are not in the source text.
   - Do not remove or omit legitimate topics from the source text.
4. NEVER ADD DOCUMENT METADATA AS TOPICS OR PHASES:
   - Application or platform name ("NOVARA", "Placeready") MUST NEVER be topics or phases.
   - Document title or header ("Sample Software Engineer Placement Preparation Roadmap") MUST NEVER be topics or phases.
   - Duration metadata ("Duration: 12 Weeks", "12 Weeks") MUST NEVER be topics or phases.
   - Daily study time ("Daily Study Time: 2-3 hours", "2 hours/day") MUST NEVER be topics or phases.
   - Target role ("Target: Software Engineer / SDE Placement") MUST NEVER be topics or phases.
   - Section annotations, practice notes, project summaries, focus statements, or routine tables ("Practice: ...", "Project: ...", "Focus: ...", "Final Goals", weekly routine tables) MUST NEVER be topics.
   Document-level metadata should only be stored as top-level JSON fields (title, targetRole).
5. DURATIONS & PROBLEM COUNTS:
   - If duration is not explicitly stated in the source text for a specific topic, set duration to null. NEVER assign an artificial default duration like "6h".
   - If problem count is not explicitly stated for a topic, set problemsCount to null.
6. CLEAN TOPIC NAMES:
   - Strip leading "Topics:" or bullet markers (•, -, *).

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
      systemInstruction: 'You are an expert technical curriculum parser. Return only valid JSON matching the requested roadmap schema. Preserve every distinct source bullet point as a separate topic without merging (e.g. Stacks and Queues must remain two separate topics). Do not include document metadata as topics. Do not invent 6h durations.',
      schemaHint: 'Roadmap with title, targetRole, extractedSkills, and phases array with faithful topics.'
    });

    // Validate with strict schema, quality, and faithfulness validators
    let validation = validateRoadmapSchema(parsed);
    let quality = validation.valid ? validateExtractedRoadmapQuality(parsed, fileName, targetRole) : { valid: false, reason: validation.error };
    let faithfulness = (validation.valid && quality.valid) ? validateCurriculumFaithfulness(sourceCurriculum, parsed) : { valid: false, reason: validation.error || quality.reason };

    // If validation fails (e.g. metadata leaked or topics merged), retry Gemini ONCE with a targeted correction prompt
    if (!quality.valid || !faithfulness.valid) {
      const failureReason = quality.reason || faithfulness.reason;
      logger.warn(`[AIService] AI-generated roadmap failed check (${failureReason}). Retrying Gemini with targeted correction prompt...`);
      try {
        const retryPrompt = `${prompt}

CRITICAL CORRECTION REQUIRED:
Your previous response failed validation because:
${failureReason}

Ensure that:
1. Every distinct bullet point in the source text MUST be a separate topic (e.g. if the source has "Stacks" and "Queues", output them as two separate topics, NEVER "Stacks and Queues").
2. Do not merge, consolidate, or omit any source topics.
3. Product name ("NOVARA"), document title, duration, daily study time, practice notes, and target role are NEVER included as topics or phases.
4. No artificial "6h" durations are generated; use null when not stated in source text.
5. Clean topic names without bullet points or "Topics" prefixes.`;

        parsed = await provider.generateJSON({
          prompt: retryPrompt,
          systemInstruction: 'You are an expert technical curriculum parser. Return only valid JSON. Faithfully preserve every bullet item as an individual topic without merging. Do not include document metadata as topics. Do not invent 6h durations.',
          schemaHint: 'Clean roadmap preserving all individual source topics faithfully.'
        });

        validation = validateRoadmapSchema(parsed);
        quality = validation.valid ? validateExtractedRoadmapQuality(parsed, fileName, targetRole) : { valid: false, reason: validation.error };
        faithfulness = (validation.valid && quality.valid) ? validateCurriculumFaithfulness(sourceCurriculum, parsed) : { valid: false, reason: validation.error || quality.reason };
      } catch (retryErr) {
        logger.warn(`[AIService] Gemini retry failed: ${retryErr.message}`);
      }
    }

    // If schema or severe quality validation completely fails, fall back to deterministic parser
    if (!validation.valid || !quality.valid) {
      logger.warn(`[AIService] AI-generated roadmap rejected due to quality failure: ${quality.reason || validation.error}. Falling back to deterministic parser.`);
      return null;
    }

    const needsReview = !faithfulness.valid;
    const reviewReason = needsReview ? faithfulness.reason : null;

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
            confidence: needsReview ? 'medium' : 'high'
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
      confidence: needsReview ? 'medium' : 'high',
      needsReview: needsReview,
      reviewReason: reviewReason,
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
 * Validates task-specific revision quiz output from Gemini.
 */
function validateTaskQuizSchema(parsed, expectedCount = 5) {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, reason: 'Quiz response is not a valid JSON object.' };
  }
  if (!Array.isArray(parsed.questions)) {
    return { valid: false, reason: 'Quiz response is missing questions array.' };
  }
  if (parsed.questions.length !== expectedCount) {
    return { valid: false, reason: `Quiz expected ${expectedCount} questions, but got ${parsed.questions.length}.` };
  }

  for (let i = 0; i < parsed.questions.length; i++) {
    const q = parsed.questions[i];
    if (!q || typeof q !== 'object') {
      return { valid: false, reason: `Question ${i + 1} is not a valid object.` };
    }
    if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 5) {
      return { valid: false, reason: `Question ${i + 1} has invalid or empty question text.` };
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { valid: false, reason: `Question ${i + 1} must have exactly 4 options.` };
    }
    const hasInvalidOpt = q.options.some(opt => typeof opt !== 'string' || opt.trim().length === 0);
    if (hasInvalidOpt) {
      return { valid: false, reason: `Question ${i + 1} contains empty or non-string options.` };
    }
    // Check for duplicate options in same question
    const uniqueOpts = new Set(q.options.map(o => o.trim().toLowerCase()));
    if (uniqueOpts.size < 4) {
      return { valid: false, reason: `Question ${i + 1} contains duplicate options.` };
    }
    // Validate correctAnswer (accept either 0-3 index or option string matching one of options)
    let ansIdx = -1;
    if (typeof q.correctAnswer === 'number' && Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer <= 3) {
      ansIdx = q.correctAnswer;
    } else if (typeof q.correctAnswer === 'string') {
      ansIdx = q.options.findIndex(opt => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());
    }
    if (ansIdx < 0 || ansIdx > 3) {
      return { valid: false, reason: `Question ${i + 1} has invalid correctAnswer (must be 0-3 index or match one option).` };
    }
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length < 5) {
      return { valid: false, reason: `Question ${i + 1} is missing educational explanation.` };
    }
  }

  return { valid: true, reason: null };
}

/**
 * 6. Generic Task-Specific Revision Quiz Generation
 * Generates verified, task-grounded active recall questions dynamically for ANY completed learning task.
 * Adheres strictly to grounding rules without fabricating questions or claiming unrelated concepts.
 * Database scheduling intervals remain 100% deterministic.
 */
export async function generateTaskRevisionQuiz(taskContext = {}) {
  const provider = getAIProvider();
  if (!provider.isConfigured()) {
    return null;
  }

  // Normalize task context fields
  const taskTitle = taskContext.taskTitle || taskContext.taskName || taskContext.topicName || taskContext.topic || 'Core Curriculum Concept';
  const taskDescription = taskContext.taskDescription || taskContext.description || 'Practice and comprehension of core curriculum topic.';
  const roadmapPhase = taskContext.roadmapPhase || taskContext.phase || '';
  const roadmapTopic = taskContext.roadmapTopic || taskContext.topic || taskTitle;
  const taskCategory = taskContext.taskCategory || taskContext.category || 'DSA';
  const difficulty = (taskContext.difficulty || 'Medium').toLowerCase();
  const learningObjectives = Array.isArray(taskContext.learningObjectives)
    ? taskContext.learningObjectives.join(', ')
    : (taskContext.learningObjectives || 'Understand and apply core concepts.');
  const relevantMetadata = taskContext.relevantMetadata || taskContext.metadata || '';
  const count = typeof taskContext.count === 'number' ? taskContext.count : 5;

  const prompt = `You are generating a knowledge-check quiz for a placement preparation learning task.

TASK CONTEXT:
- Task Title: ${taskTitle}
- Task Description: ${taskDescription}
- Roadmap Phase: ${roadmapPhase || 'Placement Preparation'}
- Roadmap Topic: ${roadmapTopic}
- Task Category: ${taskCategory}
- Difficulty Level: ${difficulty}
- Learning Objectives: ${learningObjectives}
${relevantMetadata ? `- Additional Context: ${relevantMetadata}\n` : ''}
STRICT GROUNDING RULES:
1. Generate questions ONLY from concepts supported by the supplied task title, task description, roadmap topic, and learning context.
2. Do not assume the user studied concepts that are not represented in the provided context.
3. Do not generate unrelated questions.
4. Do not claim that the user learned something merely because it exists elsewhere in the roadmap.
5. Generate exactly ${count} objective questions.
6. Appropriate question types:
   - Coding / DSA task: code/output tracing + core complexity/concept questions
   - DBMS / Database task: ACID properties, transactions, normalization, indexing, query concepts
   - SQL task: SQL query structure, joins, aggregations, window functions, output interpretation
   - Operating Systems task: processes/threads, CPU scheduling, concurrency, deadlocks, virtual memory/paging
   - Computer Networks task: TCP/IP protocols, 3-way handshake, OSI layers, DNS, HTTP/HTTPS, routing
   - React / Frontend task: hooks, state vs props, component lifecycle, virtual DOM, JSX
   - REST API task: HTTP methods, status codes, RESTful constraints, idempotency
   - Git & GitHub task: branch management, commit history, merge vs rebase, pull requests
   - Aptitude task: objective quantitative problem-solving & logical reasoning questions
   - Resume / Interview task: STAR method, technical project presentation, behavioral scenarios
7. Questions should test whether the user actually understood the task, not merely whether they can recognize the task title.
8. Avoid trivial questions, duplicate questions, ambiguous questions, or answers that are obvious from wording.
9. Each question must have exactly 4 options and exactly one unambiguous correct answer.
10. "correctAnswer" must be the 0-indexed integer (0, 1, 2, or 3) pointing to the correct choice in options[].
11. "explanation" is required for every question explaining WHY the correct answer is true.
12. "topic" must correspond to the completed task: "${roadmapTopic}".

REQUIRED JSON STRUCTURE:
{
  "questions": [
    {
      "question": "Objective question text...",
      "options": [
        "Option 0",
        "Option 1",
        "Option 2",
        "Option 3"
      ],
      "correctAnswer": 0,
      "explanation": "Thorough educational explanation of why Option 0 is correct...",
      "difficulty": "${difficulty}",
      "topic": "${roadmapTopic}"
    }
  ]
}`;

  try {
    let result = await provider.generateJSON({
      prompt,
      systemInstruction: 'You are generating a knowledge-check quiz for a placement preparation learning task. Generate questions ONLY from concepts supported by the supplied task title, task description, roadmap topic, and learning context. Do not assume concepts not in context. Output strictly valid JSON.',
      schemaHint: 'JSON object with questions array of 5 task-grounded questions.'
    });

    let validation = validateTaskQuizSchema(result, count);

    // If schema validation failed, retry Gemini ONCE with targeted correction prompt
    if (!validation.valid) {
      logger.warn(`[AIService] Task revision quiz failed validation (${validation.reason}). Retrying Gemini with correction prompt...`);
      try {
        const retryPrompt = `${prompt}

CRITICAL CORRECTION REQUIRED:
Your previous response failed validation because: ${validation.reason}.
Ensure that:
1. Exactly ${count} questions are returned in the "questions" array.
2. Each question has exactly 4 distinct non-empty string options.
3. "correctAnswer" is an integer index from 0 to 3.
4. "explanation" is a clear educational explanation.
5. Questions are strictly grounded in "${roadmapTopic}".`;

        result = await provider.generateJSON({
          prompt: retryPrompt,
          systemInstruction: 'You are an expert technical educator. Return only valid JSON with 5 strictly grounded quiz questions matching the exact schema.',
          schemaHint: 'Valid JSON with exactly 5 grounded questions.'
        });

        validation = validateTaskQuizSchema(result, count);
      } catch (retryErr) {
        logger.warn(`[AIService] Gemini task quiz retry failed: ${retryErr.message}`);
      }
    }

    if (!validation.valid || !result || !Array.isArray(result.questions)) {
      logger.warn(`[AIService] Task revision quiz rejected: ${validation.reason}. Falling back to grounded question bank.`);
      return null;
    }

    // Format and return normalized questions
    return result.questions.map((q, idx) => {
      const options = Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [];
      let ansIdx = 0;
      if (typeof q.correctAnswer === 'number' && Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < options.length) {
        ansIdx = q.correctAnswer;
      } else if (typeof q.correctAnswer === 'string') {
        const found = options.findIndex(opt => opt.toLowerCase() === q.correctAnswer.trim().toLowerCase());
        if (found >= 0) ansIdx = found;
      }

      return {
        id: `q-task-ai-${Date.now()}-${idx + 1}`,
        type: 'mcq',
        question: q.question.trim(),
        options,
        correctAnswer: ansIdx,
        correctAnswerText: options[ansIdx] || '',
        explanation: q.explanation ? q.explanation.trim() : 'Core principle validated.',
        difficulty: (q.difficulty || difficulty).toLowerCase(),
        topic: q.topic || roadmapTopic,
        testedSubconcept: q.testedSubconcept || roadmapTopic
      };
    });
  } catch (err) {
    logger.error(ERROR_CATEGORIES.AI_ERROR, 'Task revision quiz generation with Gemini failed', err);
    return null;
  }
}

/**
 * Backward compatibility alias for generateTaskRevisionQuiz
 */
export async function generateRevisionQuestionsWithAI(taskContext = {}) {
  return generateTaskRevisionQuiz(taskContext);
}
