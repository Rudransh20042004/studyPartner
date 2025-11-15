// Cross-tab synchronization using BroadcastChannel and storage events
// This ensures sessions are visible across all tabs in real-time

let broadcastChannel = null;

// Initialize BroadcastChannel for cross-tab communication
export const initCrossTabSync = () => {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('study-session-sync');
    console.log('✅ BroadcastChannel initialized');
  } else {
    console.warn('⚠️ BroadcastChannel not available');
  }
};

// Send a message to all other tabs
export const broadcastToTabs = (type, data) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
    console.log('📡 Broadcasted:', type, data);
  }
};

// Listen for messages from other tabs
export const onTabMessage = (callback) => {
  if (!broadcastChannel) {
    initCrossTabSync();
  }
  
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      console.log('📨 Received broadcast:', event.data);
      callback(event.data);
    };
    
    return () => {
      if (broadcastChannel) {
        broadcastChannel.onmessage = null;
      }
    };
  }
  
  return () => {};
};

// Listen for localStorage changes (for tabs that don't support BroadcastChannel)
// Note: storage events only fire in OTHER tabs, not the tab that made the change
export const onStorageChange = (callback) => {
  const handler = (e) => {
    // Listen to changes in shared storage (sessions and messages)
    if (e.key && (e.key.startsWith('shared_session:') || e.key.startsWith('shared_message:'))) {
      console.log('💾 Storage changed in another tab:', e.key, e.newValue ? 'created/updated' : 'deleted');
      callback({ key: e.key, newValue: e.newValue, oldValue: e.oldValue });
    }
  };
  
  window.addEventListener('storage', handler);
  
  return () => {
    window.removeEventListener('storage', handler);
  };
};

// Cleanup
export const cleanupCrossTabSync = () => {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
    console.log('🧹 BroadcastChannel closed');
  }
};

