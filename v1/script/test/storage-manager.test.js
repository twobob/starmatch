// ============================================================================
// Storage Manager Tests
// Self-tests for localStorage CRUD operations
// ============================================================================

const StorageTests = {
  results: [],
  testStorageKey: 'starmatch_records_TEST',
  originalKey: null,
  
  assert(condition, message) {
    if (condition) {
      this.results.push({ pass: true, message });
    } else {
      this.results.push({ pass: false, message });
      console.error('FAIL:', message);
    }
  },
  
  setupTestEnvironment() {
    // Temporarily swap storage key to avoid destroying user data
    this.originalKey = localStorage.getItem('starmatch_records');
    localStorage.removeItem('starmatch_records_TEST');
  },
  
  teardownTestEnvironment() {
    // Remove test data
    localStorage.removeItem('starmatch_records_TEST');
    // Restore original data if it existed
    if (this.originalKey !== null) {
      localStorage.setItem('starmatch_records', this.originalKey);
    }
  },
  
  clearTestData() {
    // Clear only test data
    localStorage.removeItem('starmatch_records_TEST');
  },
  
  runAll() {
    console.log('Running Storage Manager Tests...\n');
    this.results = [];
    this.setupTestEnvironment();
    
    // Override StorageManager to use test key
    const originalStorageKey = window.StorageManager.load;
    const testKey = this.testStorageKey;
    
    // Monkey patch for tests
    const originalLoad = StorageManager.load;
    const originalSave = StorageManager.save;
    
    StorageManager.load = function() {
      try {
        const stored = localStorage.getItem(testKey);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('Error loading records:', e);
        return [];
      }
    };
    
    StorageManager.save = function(records) {
      try {
        localStorage.setItem(testKey, JSON.stringify(records));
      } catch (e) {
        console.error('Error saving records:', e);
        throw new Error('Failed to save records to localStorage');
      }
    };
    
    try {
      this.testLoadEmpty();
      this.testAddRecord();
      this.testUpdateRecord();
      this.testDeleteRecord();
      this.testClearAll();
      this.testBuildPayload();
      this.testInvalidData();
      
      return this.printResults();
    } finally {
      // Restore original functions
      StorageManager.load = originalLoad;
      StorageManager.save = originalSave;
      this.teardownTestEnvironment();
    }
  },
  
  testLoadEmpty() {
    StorageManager.clear();
    const records = StorageManager.load();
    this.assert(Array.isArray(records), 'load() returns array');
    this.assert(records.length === 0, 'Empty storage returns empty array');
  },
  
  testAddRecord() {
    StorageManager.clear();
    const testData = {
      id: 'test-1',
      name: 'Test Chart',
      date: '1990-01-01',
      time: '12:00',
      lat: '51.5074',
      lon: '-0.1278'
    };
    
    const records = StorageManager.add(testData);
    this.assert(records.length === 1, 'Add record increases count');
    this.assert(records[0].id === 'test-1', 'Record has correct ID');
    this.assert(records[0].name === 'Test Chart', 'Record has correct name');
    
    // Verify persistence
    const loaded = StorageManager.load();
    this.assert(loaded.length === 1, 'Record persists after reload');
    this.assert(loaded[0].id === 'test-1', 'Persisted record has correct ID');
  },
  
  testUpdateRecord() {
    StorageManager.clear();
    StorageManager.add({ id: 'test-2', name: 'Original Name' });
    
    const updated = StorageManager.update('test-2', { name: 'Updated Name' });
    this.assert(updated[0].name === 'Updated Name', 'Update changes record data');
    this.assert(updated[0].id === 'test-2', 'Update preserves record ID');
    this.assert(updated[0].updatedAt !== undefined, 'Update sets updatedAt timestamp');
    
    // Verify persistence
    const loaded = StorageManager.load();
    this.assert(loaded[0].name === 'Updated Name', 'Updated record persists');
  },
  
  testDeleteRecord() {
    StorageManager.clear();
    StorageManager.add({ id: 'test-3', name: 'To Delete' });
    StorageManager.add({ id: 'test-4', name: 'To Keep' });
    
    const remaining = StorageManager.delete('test-3');
    this.assert(remaining.length === 1, 'Delete removes one record');
    this.assert(remaining[0].id === 'test-4', 'Delete removes correct record');
    
    // Verify persistence
    const loaded = StorageManager.load();
    this.assert(loaded.length === 1, 'Deletion persists');
    this.assert(loaded[0].id === 'test-4', 'Correct record remains');
  },
  
  testClearAll() {
    StorageManager.clear();
    StorageManager.add({ id: 'test-5', name: 'Record 1' });
    StorageManager.add({ id: 'test-6', name: 'Record 2' });
    
    StorageManager.clear();
    const records = StorageManager.load();
    this.assert(records.length === 0, 'Clear removes all records');
  },
  
  testBuildPayload() {
    const inputs = {
      date: '1985-06-15',
      time: '14:30',
      lat: '40.7128',
      lon: '-74.0060',
      orbType: '1',
      aspectOrbSet: '2',
      traditionalFactors: '0',
      precession: 1
    };
    
    const payload = StorageManager.build('Test Name', inputs);
    
    this.assert(payload.id !== undefined, 'Build creates UUID');
    this.assert(payload.name === 'Test Name', 'Build uses provided name');
    this.assert(payload.date === '1985-06-15', 'Build copies date');
    this.assert(payload.time === '14:30', 'Build copies time');
    this.assert(payload.lat === '40.7128', 'Build copies latitude');
    this.assert(payload.lon === '-74.0060', 'Build copies longitude');
    this.assert(payload.orbType === '1', 'Build copies orbType');
    this.assert(payload.createdAt !== undefined, 'Build sets createdAt');
    this.assert(payload.updatedAt !== undefined, 'Build sets updatedAt');
    
    // Test empty name fallback
    const noName = StorageManager.build('', inputs);
    this.assert(noName.name === 'Untitled', 'Build uses "Untitled" for empty name');
    
    // Test whitespace name
    const whitespace = StorageManager.build('   ', inputs);
    this.assert(whitespace.name === 'Untitled', 'Build trims whitespace-only names');
  },
  
  testInvalidData() {
    StorageManager.clear();
    
    // Test updating non-existent record
    const before = StorageManager.load();
    const after = StorageManager.update('nonexistent-id', { name: 'Test' });
    this.assert(before.length === after.length, 'Update of nonexistent ID is no-op');
    
    // Test deleting non-existent record
    StorageManager.add({ id: 'test-7', name: 'Exists' });
    const deleted = StorageManager.delete('nonexistent-id');
    this.assert(deleted.length === 1, 'Delete of nonexistent ID preserves existing records');
  },
  
  printResults() {
    const passed = this.results.filter(r => r.pass).length;
    const failed = this.results.filter(r => !r.pass).length;
    
    console.log('\nSTORAGE MANAGER TEST RESULTS');
    console.log(`Total: ${this.results.length} | Passed: ${passed} | Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.results.filter(r => !r.pass).forEach(r => {
        console.log(`  ✗ ${r.message}`);
      });
    }
    
    if (passed === this.results.length) {
      console.log('\nAll tests passed.');
    }
    console.log('');
    
    return { passed, failed, total: this.results.length };
  }
};

// Register with test harness
if (typeof window !== 'undefined') {
  window.StorageTests = StorageTests;
  
  // Register with global test harness
  window.addEventListener('DOMContentLoaded', () => {
    if (window.TestHarness) {
      TestHarness.register('Storage Manager', StorageTests, 'storage');
    }
  });
}
