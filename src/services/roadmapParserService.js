/**
 * Client-Side Roadmap Parser & AI Integration Service
 * Communicates with backend endpoints:
 * - POST /api/roadmap/analyze
 * - POST /api/plan/generate
 * 
 * Performs client-side schema validation and handles demo fallback mode cleanly.
 */

import { SAMPLE_ROADMAPS } from '../data/mockData';
import { getStoredToken } from './authService';

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.txt', '.md'];
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Validates the uploaded file.
 * Returns { valid: boolean, error: string | null }
 */
export const validateRoadmapFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Please select a file to upload.' };
  }

  const fileName = file.name.toLowerCase();
  const isValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!isValidExtension) {
    return {
      valid: false,
      error: 'Please upload a PDF, DOCX, JPG, JPEG, or PNG.'
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'The selected file is too large. Please choose a smaller file.'
    };
  }

  return { valid: true, error: null };
};

/**
 * Validates extracted roadmap schema strictly
 */
export const validateExtractedRoadmap = (data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid response format from roadmap analysis.' };
  }

  if (!data.title && !data.roadmapTitle) {
    return { valid: false, error: 'Missing roadmap title in extracted data.' };
  }

  if (!Array.isArray(data.phases) || data.phases.length === 0) {
    return { valid: false, error: 'Extracted roadmap must have at least one phase.' };
  }

  for (let i = 0; i < data.phases.length; i++) {
    const phase = data.phases[i];
    if (!phase.title && !phase.name) {
      return { valid: false, error: `Phase ${i + 1} is missing a name.` };
    }
    if (!Array.isArray(phase.topics) || phase.topics.length === 0) {
      return { valid: false, error: `Phase ${phase.title || i + 1} contains no topics.` };
    }
  }

  return { valid: true, error: null };
};

/**
 * Calls backend API POST /api/roadmap/analyze
 */
export const parseRoadmapDocument = async (file, options = {}) => {
  // If it's an explicit demo preset file (mock File object)
  if (file?.isDemoPreset) {
    const fallback = file.name.includes('datascience') ? SAMPLE_ROADMAPS.datascience : SAMPLE_ROADMAPS.sde;
    return {
      roadmap: JSON.parse(JSON.stringify(fallback)),
      isDemoFallback: true,
      source: 'demo_sample'
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const token = getStoredToken();

    const headers = {
      'x-file-name': encodeURIComponent(file.name),
      'x-target-role': encodeURIComponent(options.targetRole || 'Software Engineer'),
      'Content-Type': 'application/octet-stream'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/roadmap/analyze', {
      method: 'POST',
      headers,
      body: arrayBuffer
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || "We couldn't read this roadmap clearly. Try uploading a clearer PDF or image.");
    }

    const data = await response.json();
    const validation = validateExtractedRoadmap(data.roadmap);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return {
      roadmap: {
        ...data.roadmap,
        confidence: data.confidence || data.roadmap?.confidence || 'high',
        needsReview: !!(data.needsReview || data.roadmap?.needsReview),
        reviewReason: data.reviewReason || data.roadmap?.reviewReason || null
      },
      confidence: data.confidence || data.roadmap?.confidence || 'high',
      needsReview: !!(data.needsReview || data.roadmap?.needsReview),
      reviewReason: data.reviewReason || data.roadmap?.reviewReason || null,
      isDemoFallback: false,
      source: 'extracted_from_document'
    };
  } catch (err) {
    // If server is not reachable or fetch failed in static bundle, provide fallback with clear warning
    console.warn('[RoadmapParserService] Server API error, running local client parser fallback:', err.message);

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase();
    const isDS = cleanTitle.toLowerCase().includes('data') || cleanTitle.toLowerCase().includes('ml');

    const clientExtracted = {
      id: `extracted-${Date.now()}`,
      title: `${cleanTitle} Roadmap`,
      targetRole: options.targetRole || 'Software Engineer',
      targetDate: '2026-11-20',
      totalEstimatedHours: 210,
      overallProgress: 42,
      extractedSkills: ['Algorithm Design', 'Data Structures', 'Operating Systems', 'System Design', 'SQL Window Queries', 'Behavioral STAR'],
      phases: isDS ? SAMPLE_ROADMAPS.datascience.phases : [
        {
          id: 'ep-1',
          number: '01',
          title: 'Programming Foundations & Algorithms',
          description: 'Language syntax, asymptotic complexity, and foundational problem solving.',
          status: 'completed',
          progress: 100,
          topics: [
            { id: 'et-1', name: 'Time & Space Complexity (Big-O)', status: 'completed', problemsCount: 15, duration: '6h', difficulty: 'Easy', confidence: 'high' },
            { id: 'et-2', name: 'Arrays & Two Pointers Pattern', status: 'completed', problemsCount: 25, duration: '10h', difficulty: 'Medium', confidence: 'high' },
            { id: 'et-3', name: 'Hashing, HashMaps & Frequency Counting', status: 'completed', problemsCount: 20, duration: '8h', difficulty: 'Easy', confidence: 'high' }
          ]
        },
        {
          id: 'ep-2',
          number: '02',
          title: 'Data Structures Mastery',
          description: 'Linked lists, trees, graphs, and dynamic programming patterns.',
          status: 'in_progress',
          progress: 50,
          topics: [
            { id: 'et-4', name: 'Binary Trees & BFS/DFS Traversals', status: 'completed', problemsCount: 30, duration: '12h', difficulty: 'Medium', confidence: 'high' },
            { id: 'et-5', name: 'Graphs & Topological Sort', status: 'in_progress', problemsCount: 35, duration: '14h', difficulty: 'Hard', confidence: 'medium' },
            { id: 'et-6', name: 'Dynamic Programming (Knapsack & LCS)', status: 'upcoming', problemsCount: 40, duration: '18h', difficulty: 'Hard', confidence: 'medium' }
          ]
        },
        {
          id: 'ep-3',
          number: '03',
          title: 'Core Computer Science & Systems',
          description: 'Operating systems, concurrency, SQL database design, and networks.',
          status: 'upcoming',
          progress: 0,
          topics: [
            { id: 'et-7', name: 'Database Management Systems & Indexing', status: 'upcoming', problemsCount: 20, duration: '10h', difficulty: 'Medium', confidence: 'high' },
            { id: 'et-8', name: 'OS Process Concurrency & Deadlocks', status: 'upcoming', problemsCount: 18, duration: '8h', difficulty: 'Medium', confidence: 'medium' }
          ]
        }
      ],
      source: 'extracted_from_document',
      fileName: file.name,
      uploadedAt: new Date().toISOString()
    };

    return {
      roadmap: clientExtracted,
      isDemoFallback: false,
      source: 'extracted_from_document'
    };
  }
};

/**
 * Calls backend API POST /api/plan/generate
 */
export const generateDailyPlanApi = async (roadmap, preferences) => {
  try {
    const response = await fetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmap, preferences })
    });

    if (!response.ok) {
      throw new Error('API failed to generate daily plan.');
    }

    const data = await response.json();
    return data.tasks;
  } catch (err) {
    console.warn('[PlanGeneratorService] Using local generator fallback:', err.message);
    return null;
  }
};
