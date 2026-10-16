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

/**
 * Validate and normalise one imported record; null if it is unusable
 */
function sanitiseRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const date = String(raw.date || '');
  const time = String(raw.time || '');
  const lat = parseFloat(raw.lat);
  const lon = parseFloat(raw.lon);
  if (!/^-?\d{1,6}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  if (!(lat >= -90 && lat <= 90) || !(lon >= -180 && lon <= 180)) return null;

  const pick = (value, allowed, fallback) => allowed.includes(String(value)) ? String(value) : fallback;
  const id = typeof raw.id === 'string' && /^[A-Za-z0-9-]{1,64}$/.test(raw.id) ? raw.id : crypto.randomUUID();
  const name = String(raw.name || '').trim().slice(0, 200) || 'Untitled';
  const tz = typeof raw.tz === 'string' && typeof TimezoneHelper !== 'undefined' && TimezoneHelper.isValidZone(raw.tz) ? raw.tz : '';
  const now = new Date().toISOString();

  return {
    id,
    name,
    date,
    time,
    lat: String(lat),
    lon: String(lon),
    orbType: pick(raw.orbType, ['0', '1'], '0'),
    aspectOrbSet: pick(raw.aspectOrbSet, ['0', '1', '2', '3', '4'], '0'),
    planetOrbSet: pick(raw.planetOrbSet, ['0', '1'], '0'),
    traditionalFactors: pick(raw.traditionalFactors ?? raw.rulershipSet, ['0', '4', '8'], '0'),
    precession: Number(raw.precession) === 1 ? 1 : 0,
    tz,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt.slice(0, 40) : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt.slice(0, 40) : now
  };
}

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
      planetOrbSet: inputs.planetOrbSet || '0',
      traditionalFactors: inputs.traditionalFactors || '0',
      precession: inputs.precession || 0,
      tz: inputs.tz || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * All records as a JSON document for download
   * @returns {string} JSON text
   */
  exportJSON() {
    return JSON.stringify({
      format: 'starmatch-records',
      version: 1,
      exportedAt: new Date().toISOString(),
      records: this.load()
    }, null, 2);
  },

  /**
   * Add records from an exported JSON document (or a bare array of records).
   * Every field is checked; records whose id is already saved are skipped.
   * @param {string} text - JSON text
   * @returns {{added: number, duplicates: number, invalid: number}}
   */
  importJSON(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('not a JSON file');
    }
    const incoming = Array.isArray(data) ? data : data && Array.isArray(data.records) ? data.records : null;
    if (!incoming) throw new Error('no records found in the file');

    const records = this.load();
    // Same id, or the same person and birth data (ids may have been replaced)
    const birthKey = r => [r.name, r.date, r.time, String(parseFloat(r.lat)), String(parseFloat(r.lon))].join('|');
    const ids = new Set(records.map(r => r.id));
    const births = new Set(records.map(birthKey));
    const result = { added: 0, duplicates: 0, invalid: 0 };

    incoming.forEach(raw => {
      const rec = sanitiseRecord(raw);
      if (!rec) {
        result.invalid++;
      } else if (ids.has(rec.id) || births.has(birthKey(rec))) {
        result.duplicates++;
      } else {
        ids.add(rec.id);
        births.add(birthKey(rec));
        records.push(rec);
        result.added++;
      }
    });

    if (result.added) this.save(records);
    return result;
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
