// ============================================================================
// Storage Manager - LocalStorage CRUD Operations
// Handles all persistent data storage for natal chart records
// ============================================================================

const STORAGE_KEY = 'starmatch_records';

const StorageManager = {
  /**
   * Load all records from localStorage
   * @returns {Array} Array of record objects
   */
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading records:', e);
      return [];
    }
  },

  /**
   * Save records array to localStorage
   * @param {Array} records - Array of record objects to save
   */
  save(records) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records:', e);
      throw new Error('Failed to save records to localStorage');
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
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}
