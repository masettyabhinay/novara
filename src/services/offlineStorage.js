/**
 * Client-Side Offline Storage & IndexedDB Manager for NOVARA
 * Safely caches sanitized user state and manages the offline synchronization queue.
 *
 * Privacy Rule: NEVER cache passwords, OAuth client secrets, or private credentials.
 */

const DB_NAME = 'novara_offline_db';
const DB_VERSION = 1;

// Object store names
const STORES = {
  USER_DATA: 'user_data',
  SYNC_QUEUE: 'sync_queue',
  SYNC_META: 'sync_meta'
};

/**
 * Open or initialize the IndexedDB database
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null); // Fallback to memory/localStorage if IndexedDB is not available
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'userId' });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'operationId' });
        queueStore.createIndex('userId', 'userId', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.warn('[IndexedDB] Failed to open database:', event.target.error);
      resolve(null);
    };
  });
}

/**
 * Save sanitized user data to local cache
 */
export async function saveCachedUserData(userId, data) {
  if (!userId) return;

  // Sanitize data before saving (no sensitive credentials)
  const sanitized = {
    userId,
    profile: data.profile || null,
    roadmap: data.roadmap || null,
    tasks: data.tasks || [],
    streak: data.streak || null,
    revisions: data.revisions || [],
    applications: data.applications || [],
    calendarEvents: data.calendarEvents || [],
    notifications: data.notifications || [],
    notifPreferences: data.notifPreferences || {},
    readiness: data.readiness || null,
    coachAnalysis: data.coachAnalysis || null,
    cachedAt: new Date().toISOString()
  };

  try {
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORES.USER_DATA, 'readwrite');
      const store = tx.objectStore(STORES.USER_DATA);
      store.put(sanitized);
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`novara_cache_${userId}`, JSON.stringify(sanitized));
      return true;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error saving user cache:', err);
  }
  return false;
}

/**
 * Retrieve cached user data from local storage
 */
export async function getCachedUserData(userId) {
  if (!userId) return null;

  try {
    const db = await openDatabase();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.USER_DATA, 'readonly');
        const store = tx.objectStore(STORES.USER_DATA);
        const req = store.get(userId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } else if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`novara_cache_${userId}`);
      return raw ? JSON.parse(raw) : null;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error retrieving user cache:', err);
  }
  return null;
}

/**
 * Enqueue a pending synchronization operation
 */
export async function enqueueSyncOperation(operation) {
  const op = {
    operationId: operation.operationId || `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    userId: operation.userId,
    entityType: operation.entityType, // 'TASK' | 'FOCUS_SESSION' | 'REVISION' | 'APPLICATION' | 'INTERVIEW' | 'CALENDAR_EVENT'
    entityId: operation.entityId,
    operation: operation.operation,   // 'CREATE' | 'UPDATE' | 'DELETE' | 'COMPLETE'
    payload: operation.payload || {},
    createdAt: operation.createdAt || new Date().toISOString(),
    status: 'pending',
    retryCount: 0
  };

  try {
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      store.put(op);
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve(op);
        tx.onerror = () => resolve(null);
      });
    } else if (typeof localStorage !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem(`novara_sync_queue_${op.userId}`) || '[]');
      existing.push(op);
      localStorage.setItem(`novara_sync_queue_${op.userId}`, JSON.stringify(existing));
      return op;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error enqueueing sync operation:', err);
  }
  return op;
}

/**
 * Get all pending sync operations for a user
 */
export async function getPendingSyncOperations(userId) {
  if (!userId) return [];

  try {
    const db = await openDatabase();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
        const store = tx.objectStore(STORES.SYNC_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = (req.result || []).filter((o) => o.userId === userId && o.status !== 'completed');
          results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          resolve(results);
        };
        req.onerror = () => resolve([]);
      });
    } else if (typeof localStorage !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem(`novara_sync_queue_${userId}`) || '[]');
      return existing.filter((o) => o.status !== 'completed');
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error getting pending operations:', err);
  }
  return [];
}

/**
 * Update the status of a sync operation
 */
export async function updateSyncOperationStatus(operationId, status, errorMsg = null) {
  try {
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const req = store.get(operationId);
      req.onsuccess = () => {
        if (req.result) {
          const updated = {
            ...req.result,
            status,
            error: errorMsg,
            retryCount: (req.result.retryCount || 0) + (status === 'failed' ? 1 : 0),
            updatedAt: new Date().toISOString()
          };
          store.put(updated);
        }
      };
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error updating operation status:', err);
  }
  return false;
}

/**
 * Remove completed sync operation
 */
export async function removeSyncOperation(operationId, userId) {
  try {
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      store.delete(operationId);
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } else if (typeof localStorage !== 'undefined' && userId) {
      const existing = JSON.parse(localStorage.getItem(`novara_sync_queue_${userId}`) || '[]');
      const filtered = existing.filter((o) => o.operationId !== operationId);
      localStorage.setItem(`novara_sync_queue_${userId}`, JSON.stringify(filtered));
      return true;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error removing sync operation:', err);
  }
  return false;
}

/**
 * Clear all completed operations for a user
 */
export async function clearCompletedSyncOperations(userId) {
  const pending = await getPendingSyncOperations(userId);
  const db = await openDatabase();
  if (db) {
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const all = await new Promise((res) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    });

    all.forEach((op) => {
      if (op.userId === userId && op.status === 'completed') {
        store.delete(op.operationId);
      }
    });
  }
}

/**
 * Clear cached user data upon logout for privacy and multi-user isolation
 */
export async function clearCachedUserData(userId) {
  if (!userId) return;
  try {
    const db = await openDatabase();
    if (db) {
      const tx = db.transaction(STORES.USER_DATA, 'readwrite');
      const store = tx.objectStore(STORES.USER_DATA);
      store.delete(userId);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`novara_cache_${userId}`);
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error clearing user cache:', err);
  }
}
