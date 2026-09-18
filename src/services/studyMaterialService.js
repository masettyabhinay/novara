/**
 * Client-Side Study Material Service for NOVARA
 * Handles fetching, caching, and client fallback for task-specific study material.
 */

const CLIENT_STUDY_MATERIAL_CACHE = new Map();

/**
 * Generates client cache key for study material.
 */
function getClientCacheKey(task = {}) {
  const id = task.id || task.taskId || '';
  const name = task.name || task.taskTitle || task.topic || '';
  const cat = task.category || task.taskCategory || '';
  const desc = task.description || task.taskDescription || '';
  const text = `${name} ${desc} ${cat}`.toLowerCase();
  let dom = 'gen';
  if (text.includes('graph') || text.includes('bfs') || text.includes('dfs') || text.includes('dijkstra')) dom = 'graphs';
  else if (text.includes('tree') || text.includes('bst')) dom = 'trees';
  else if (text.includes('array') || text.includes('sliding') || text.includes('pointer')) dom = 'arrays';
  else if (text.includes('sql') || text.includes('query')) dom = 'sql';
  else if (text.includes('dbms') || text.includes('acid')) dom = 'dbms';
  else if (text.includes('os') || text.includes('operating')) dom = 'os';
  return `client_study_${id ? `id_${id}_` : ''}dom_${dom}_${name}`.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Validates that client material is grounded to task
 */
export function validateClientGrounding(material, task = {}) {
  if (!material) return false;
  const name = (task.name || task.taskTitle || task.topic || '').toLowerCase();
  const matTitle = (material.title || '').toLowerCase();
  const matSubtitle = (material.subtitle || '').toLowerCase();
  const matOverview = (material.overview || '').toLowerCase();
  const matDomain = (material.domain || '').toLowerCase();

  // If task is graph, material must not be arrays or Kadane
  if (name.includes('graph') || name.includes('bfs') || name.includes('dfs') || name.includes('dijkstra') || name.includes('topological')) {
    if (matDomain === 'arrays' || matTitle.includes('array') || matSubtitle.includes('sliding window') || matOverview.includes('kadane')) {
      return false;
    }
  }
  return true;
}

/**
 * Fetches task-specific study material from the backend API.
 * Uses client-side caching to avoid redundant round-trips when user re-opens the study modal.
 */
export async function fetchTaskStudyMaterial(taskContext = {}) {
  const cacheKey = getClientCacheKey(taskContext);
  if (CLIENT_STUDY_MATERIAL_CACHE.has(cacheKey)) {
    const cachedMat = CLIENT_STUDY_MATERIAL_CACHE.get(cacheKey);
    if (validateClientGrounding(cachedMat, taskContext)) {
      return {
        success: true,
        material: cachedMat,
        cached: true
      };
    }
    // Evict corrupted client cache entry
    CLIENT_STUDY_MATERIAL_CACHE.delete(cacheKey);
  }

  const payload = {
    taskId: taskContext.id || taskContext.taskId,
    taskTitle: taskContext.name || taskContext.taskTitle || taskContext.topic || 'Core Curriculum Concept',
    taskDescription: taskContext.description || taskContext.taskDescription || '',
    roadmapPhase: taskContext.phase || taskContext.roadmapPhase || '',
    roadmapTopic: taskContext.topic || taskContext.roadmapTopic || taskContext.name || '',
    taskCategory: taskContext.category || taskContext.taskCategory || 'DSA',
    difficulty: taskContext.difficulty || 'Medium',
    learningObjectives: taskContext.learningObjectives || '',
    relevantMetadata: taskContext.relevantMetadata || ''
  };

  const sessionToken = localStorage.getItem('novara_session_token') || localStorage.getItem('placeready_session_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  try {
    const res = await fetch('/api/study-material/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to fetch study material (${res.status})`);
    }

    const data = await res.json();
    if (data && data.success && data.material) {
      if (!validateClientGrounding(data.material, taskContext)) {
        throw new Error('Received ungrounded study material from server. Discarding contaminated content.');
      }
      CLIENT_STUDY_MATERIAL_CACHE.set(cacheKey, data.material);
      return {
        success: true,
        material: data.material,
        cached: data.cached || false
      };
    }

    throw new Error('Invalid response format from study material API');
  } catch (err) {
    console.warn('[StudyMaterialService] API fetch failed, falling back to local client material:', err.message);
    // If offline or network error, return local domain fallback
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Sends a query or action request to the server-side AI Study Tutor.
 */
export async function askTaskTutor(tutorPayload = {}) {
  const payload = {
    taskId: tutorPayload.taskId || tutorPayload.id || '',
    taskTitle: tutorPayload.taskTitle || tutorPayload.name || tutorPayload.topic || 'Core Curriculum Concept',
    taskDescription: tutorPayload.taskDescription || tutorPayload.description || '',
    roadmapPhase: tutorPayload.roadmapPhase || tutorPayload.phase || '',
    roadmapTopic: tutorPayload.roadmapTopic || tutorPayload.topic || tutorPayload.taskTitle || tutorPayload.name || '',
    taskCategory: tutorPayload.taskCategory || tutorPayload.category || 'DSA',
    difficulty: tutorPayload.difficulty || 'Medium',
    learningObjectives: tutorPayload.learningObjectives || '',
    currentStudyMaterial: tutorPayload.currentStudyMaterial || null,
    userQuery: tutorPayload.userQuery || tutorPayload.prompt || '',
    actionType: tutorPayload.actionType || 'custom_query',
    codeContext: tutorPayload.codeContext || '',
    conversationHistory: Array.isArray(tutorPayload.conversationHistory) ? tutorPayload.conversationHistory.slice(-4) : []
  };

  const sessionToken = localStorage.getItem('novara_session_token') || localStorage.getItem('placeready_session_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  try {
    const res = await fetch('/api/study/tutor', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to get tutor answer (${res.status})`);
    }

    const data = await res.json();
    if (data && data.success && data.answer) {
      return {
        success: true,
        answer: data.answer,
        actionType: data.actionType || payload.actionType,
        isFallback: data.isFallback || false
      };
    }

    throw new Error('Invalid response format from study tutor API');
  } catch (err) {
    console.warn('[StudyMaterialService] AI Tutor request failed:', err.message);
    return {
      success: false,
      error: err.message || 'Could not generate a response. Try again.'
    };
  }
}

/**
 * Clears the client-side study material cache.
 */
export function clearStudyMaterialCache() {
  CLIENT_STUDY_MATERIAL_CACHE.clear();
}

