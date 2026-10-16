// ============================================================================
// UI Manager Tests
// ============================================================================
// Basic existence tests for UI management functions
// ============================================================================

const UIManagerTests = {
  runAll() {
    const results = [];
    let passed = 0;
    let failed = 0;

    // Helper function to run a test
    function test(name, fn) {
      try {
        fn();
        results.push(`✓ ${name}`);
        passed++;
      } catch (error) {
        results.push(`✗ ${name}: ${error.message}`);
        failed++;
        console.error(`Test failed: ${name}`, error);
      }
    }

    // ============================================================================
    // Toast Notification Tests
    // ============================================================================

    test('UIManager.showToast exists and is a function', () => {
      if (typeof UIManager.showToast !== 'function') {
        throw new Error('showToast is not a function');
      }
    });

    // ============================================================================
    // Records Panel Tests
    // ============================================================================

    test('UIManager.openRecordsPanel exists and is a function', () => {
      if (typeof UIManager.openRecordsPanel !== 'function') {
        throw new Error('openRecordsPanel is not a function');
      }
    });

    test('UIManager.closeRecordsPanel exists and is a function', () => {
      if (typeof UIManager.closeRecordsPanel !== 'function') {
        throw new Error('closeRecordsPanel is not a function');
      }
    });

    test('UIManager.renderRecords exists and is a function', () => {
      if (typeof UIManager.renderRecords !== 'function') {
        throw new Error('renderRecords is not a function');
      }
    });

    // ============================================================================
    // Save Modal Tests
    // ============================================================================

    test('UIManager.openSaveModal exists and is a function', () => {
      if (typeof UIManager.openSaveModal !== 'function') {
        throw new Error('openSaveModal is not a function');
      }
    });

    test('UIManager.closeSaveModal exists and is a function', () => {
      if (typeof UIManager.closeSaveModal !== 'function') {
        throw new Error('closeSaveModal is not a function');
      }
    });

    // ============================================================================
    // Danger Modal Tests
    // ============================================================================

    test('UIManager.openDangerModal exists and is a function', () => {
      if (typeof UIManager.openDangerModal !== 'function') {
        throw new Error('openDangerModal is not a function');
      }
    });

    test('UIManager.closeDangerModal exists and is a function', () => {
      if (typeof UIManager.closeDangerModal !== 'function') {
        throw new Error('closeDangerModal is not a function');
      }
    });

    test('UIManager.updateDangerModal exists and is a function', () => {
      if (typeof UIManager.updateDangerModal !== 'function') {
        throw new Error('updateDangerModal is not a function');
      }
    });

    // ============================================================================
    // Tooltip Tests
    // ============================================================================

    test('UIManager.updateTooltip exists and is a function', () => {
      if (typeof UIManager.updateTooltip !== 'function') {
        throw new Error('updateTooltip is not a function');
      }
    });

    test('UIManager.getMousePos exists and is a function', () => {
      if (typeof UIManager.getMousePos !== 'function') {
        throw new Error('getMousePos is not a function');
      }
    });

    test('UIManager.distanceToLineSegment exists and is a function', () => {
      if (typeof UIManager.distanceToLineSegment !== 'function') {
        throw new Error('distanceToLineSegment is not a function');
      }
    });

    // ============================================================================
    // Helper Function Tests
    // ============================================================================

    test('distanceToLineSegment calculates correct distance', () => {
      // Point at (5, 5), line from (0, 0) to (10, 0)
      const distance = UIManager.distanceToLineSegment(5, 5, 0, 0, 10, 0);
      if (Math.abs(distance - 5) > 0.001) {
        throw new Error(`Expected distance ~5, got ${distance}`);
      }
    });

    // ============================================================================
    // Summary
    // ============================================================================

    console.log('\n' + '='.repeat(50));
    console.log('UI Manager Test Results');
    console.log('='.repeat(50));
    results.forEach(result => console.log(result));
    console.log('='.repeat(50));
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(50) + '\n');

    return { passed, failed, total: passed + failed };
  }
};

// Register with TestHarness when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof TestHarness !== 'undefined') {
    TestHarness.register('UI Manager', UIManagerTests, 'uiManager');
  }
});
