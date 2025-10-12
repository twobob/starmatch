// ============================================================================
// Storage Manager - LocalStorage CRUD Operations
// Handles all persistent data storage for natal chart records and settings
// ============================================================================

const STORAGE_KEY = 'starmatch_records';
const SETTINGS_KEY = 'starmatch_settings';

// Detect if localStorage is available
const hasLocalStorage = (() => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
})();

// Cookie fallback utilities
const CookieStorage = {
  setItem(key, value) {
    const expiryDays = 365;
    const date = new Date();
    date.setTime(date.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${key}=${encodeURIComponent(value)};${expires};path=/;SameSite=Strict`;
  },

  getItem(key) {
    const name = key + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length);
      }
    }
    return null;
  },

  removeItem(key) {
    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

// Storage abstraction layer
const storage = hasLocalStorage ? localStorage : CookieStorage;

const StorageManager = {
  /**
   * Load all records from storage
   * @returns {Array} Array of record objects
   */
  load() {
    try {
      const stored = storage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading records:', e);
      return [];
    }
  },

  /**
   * Save records array to storage
   * @param {Array} records - Array of record objects to save
   */
  save(records) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records:', e);
      throw new Error('Failed to save records to storage');
    }
  },

  /**
   * Add a new record
   * @param {Object} data - Record data object
   * @returns {Array} Updated records array
   */
  add(data) {
    const records = this.load();
    records.push(data);
    this.save(records);
    return records;
  },

  /**
   * Update an existing record by ID
   * @param {string} id - Record ID to update
   * @param {Object} patch - Partial data to merge into record
   * @returns {Array} Updated records array
   */
  update(id, patch) {
    const records = this.load();
    const idx = records.findIndex(r => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...patch, updatedAt: new Date().toISOString() };
      this.save(records);
    }
    return records;
  },

  /**
   * Delete a record by ID
   * @param {string} id - Record ID to delete
   * @returns {Array} Updated records array
   */
  delete(id) {
    const records = this.load().filter(r => r.id !== id);
    this.save(records);
    return records;
  },

  /**
   * Clear all records from storage
   */
  clear() {
    this.save([]);
  },

  /**
   * Build a record payload from current form inputs
   * @param {string} name - Record name
   * @param {Object} inputs - Form input values
   * @returns {Object} Complete record object
   */
  build(name, inputs) {
    return {
      id: crypto.randomUUID(),
      name: name && name.trim() ? name.trim() : 'Untitled',
      date: inputs.date || '',
      time: inputs.time || '',
      lat: inputs.lat || '',
      lon: inputs.lon || '',
      orbType: inputs.orbType || '0',
      aspectOrbSet: inputs.aspectOrbSet || '0',
      rulershipSet: inputs.rulershipSet || '0',
      precession: inputs.precession || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Settings Management
   * Separate from records, stored in starmatch_settings key
   */
  settings: {
    /**
     * Load all settings from storage
     * @returns {Object} Settings object
     */
    load() {
      try {
        const stored = storage.getItem(SETTINGS_KEY);
        return stored ? JSON.parse(stored) : {};
      } catch (e) {
        console.error('Error loading settings:', e);
        return {};
      }
    },

    /**
     * Save entire settings object to storage
     * @param {Object} settings - Complete settings object
     */
    save(settings) {
      try {
        storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {
        console.error('Error saving settings:', e);
        throw new Error('Failed to save settings to storage');
      }
    },

    /**
     * Get a specific setting value
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Setting value or default
     */
    get(key, defaultValue = null) {
      const settings = this.load();
      return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
    },

    /**
     * Set a specific setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    set(key, value) {
      const settings = this.load();
      settings[key] = value;
      this.save(settings);
    },

    /**
     * Update multiple settings at once
     * @param {Object} updates - Object with key-value pairs to update
     */
    update(updates) {
      const settings = this.load();
      Object.assign(settings, updates);
      this.save(settings);
    },

    /**
     * Clear all settings
     */
    clear() {
      this.save({});
    },

    /**
     * Remove a specific setting
     * @param {string} key - Setting key to remove
     */
    remove(key) {
      const settings = this.load();
      delete settings[key];
      this.save(settings);
    }
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}
