// Polyfill for window.storage API using localStorage
// This implements the storage API interface as specified in the requirements

if (!window.storage) {
  window.storage = {
    // Prefixes to distinguish shared vs personal storage
    SHARED_PREFIX: 'shared_',
    PERSONAL_PREFIX: 'personal_',

    // Get the prefixed key based on shared flag
    _getKey(key, shared) {
      const prefix = shared ? this.SHARED_PREFIX : this.PERSONAL_PREFIX;
      return prefix + key;
    },

    // Set a value
    async set(key, value, shared = false) {
      return new Promise((resolve, reject) => {
        try {
          const prefixedKey = this._getKey(key, shared);
          localStorage.setItem(prefixedKey, value);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    },

    // Get a value
    async get(key, shared = false) {
      return new Promise((resolve, reject) => {
        try {
          const prefixedKey = this._getKey(key, shared);
          const value = localStorage.getItem(prefixedKey);
          if (value === null) {
            resolve(null);
          } else {
            resolve({ value });
          }
        } catch (e) {
          reject(e);
        }
      });
    },

    // List all keys with a given prefix
    async list(prefix, shared = false) {
      return new Promise((resolve, reject) => {
        try {
          const storagePrefix = this._getKey(prefix, shared);
          const keys = [];
          const prefixToRemove = shared ? this.SHARED_PREFIX : this.PERSONAL_PREFIX;
          
          console.log(`[storage.list] Looking for prefix: "${prefix}", shared: ${shared}, storagePrefix: "${storagePrefix}"`);
          
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(storagePrefix)) {
              // Remove the storage prefix (shared_ or personal_) to return the original key
              const originalKey = key.substring(prefixToRemove.length);
              keys.push(originalKey);
              console.log(`[storage.list] Found matching key: "${key}" -> "${originalKey}"`);
            }
          }
          
          console.log(`[storage.list] Total keys found: ${keys.length}`, keys);
          resolve({ keys });
        } catch (e) {
          console.error('[storage.list] Error:', e);
          reject(e);
        }
      });
    },

    // Delete a value
    async delete(key, shared = false) {
      return new Promise((resolve, reject) => {
        try {
          const prefixedKey = this._getKey(key, shared);
          localStorage.removeItem(prefixedKey);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }
  };
}

