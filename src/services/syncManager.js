/**
 * Client-Side Sync Manager & Dispatcher for NOVARA
 * Dispatches queued offline operations to the server batch sync endpoint with exponential backoff.
 */

import { getStoredToken } from './authService';
import { 
  getPendingSyncOperations, 
  updateSyncOperationStatus, 
  removeSyncOperation 
} from './offlineStorage';

let isSyncInProgress = false;
let retryTimeout = null;
const listeners = new Set();

/**
 * Register listener for sync state changes
 */
export function onSyncStateChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifySyncListeners(state) {
  listeners.forEach((cb) => {
    try {
      cb(state);
    } catch (e) {
      console.warn('[SyncManager] Listener error:', e);
    }
  });
}

/**
 * Process the synchronization queue for the authenticated user
 */
export async function processSyncQueue(userId) {
  if (!userId) return { success: false, reason: 'No user ID' };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifySyncListeners({ status: 'offline' });
    return { success: false, reason: 'Offline' };
  }
  if (isSyncInProgress) {
    return { success: false, reason: 'Sync already in progress' };
  }

  const token = getStoredToken();
  if (!token) {
    notifySyncListeners({ status: 'unauthorized' });
    return { success: false, reason: 'No session token' };
  }

  const pendingOps = await getPendingSyncOperations(userId);
  if (pendingOps.length === 0) {
    notifySyncListeners({ status: 'synced', pendingCount: 0 });
    return { success: true, processedCount: 0 };
  }

  isSyncInProgress = true;
  notifySyncListeners({ status: 'syncing', pendingCount: pendingOps.length });

  try {
    const response = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        operations: pendingOps
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Batch sync failed with status ${response.status}`);
    }

    const data = await response.json();

    // Mark processed operations as completed and remove from queue
    for (const op of pendingOps) {
      await removeSyncOperation(op.operationId, userId);
    }

    notifySyncListeners({ 
      status: 'synced', 
      pendingCount: 0, 
      lastSyncedAt: new Date().toISOString(),
      updatedState: data.fullState 
    });

    isSyncInProgress = false;
    return { 
      success: true, 
      processedCount: pendingOps.length, 
      fullState: data.fullState 
    };

  } catch (err) {
    console.warn('[SyncManager] Sync batch error:', err.message);

    // Increment retry count for pending operations
    for (const op of pendingOps) {
      await updateSyncOperationStatus(op.operationId, 'failed', err.message);
    }

    notifySyncListeners({ 
      status: 'error', 
      error: err.message, 
      pendingCount: pendingOps.length 
    });

    isSyncInProgress = false;

    // Schedule exponential backoff retry if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const minRetryCount = Math.min(...pendingOps.map((o) => o.retryCount || 0));
      const delays = [2000, 5000, 10000, 20000];
      const delay = delays[Math.min(minRetryCount, delays.length - 1)];

      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => {
        processSyncQueue(userId);
      }, delay);
    }

    return { success: false, error: err.message };
  }
}
