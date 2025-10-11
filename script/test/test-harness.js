// ============================================================================
// Test Harness - Global test runner with enable/disable flag
// ============================================================================

// Global test configuration
// Set ENABLE_TESTS.all to false to disable all testing
// Individual test suites can be enabled/disabled independently
// Useful for debugging specific modules without running entire test suite
window.ENABLE_TESTS = {
  all: false,                   // Master switch - disables everything if false
  constants: false,             // Configuration constants validation
  storage: false,               // LocalStorage CRUD operations (disabled - modifies data)
  astronomical: false,          // Astronomy calculations with verified expected values
  zodiacUtils: false,           // Zodiac math and coordinate transformations
  chartRenderer: true,          // Canvas rendering functions
  uiManager: false,             // UI management (toasts, modals, tooltips)
  comparison: false             // xProfile and comparison engine
};

const TestHarness = {
  allTests: [],
  
  register(name, testSuite, configKey) {
    this.allTests.push({ name, testSuite, configKey });
  },
  
  runAll() {
    if (!window.ENABLE_TESTS.all) {
      return;
    }
    
    // Check if any tests are actually enabled
    const hasEnabledTests = Object.keys(window.ENABLE_TESTS)
      .filter(key => key !== 'all')
      .some(key => window.ENABLE_TESTS[key]);
    
    if (!hasEnabledTests) {
      return;
    }
    
    console.log('\nSTARMATCH TEST SUITE\n');
    
    const results = [];
    
    this.allTests.forEach(({ name, testSuite, configKey }) => {
      if (window.ENABLE_TESTS[configKey]) {
        const result = testSuite.runAll();
        if (result) {
          results.push({ name, ...result });
        }
      }
    });
    
    console.log('\nOVERALL SUMMARY');
    
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const totalTests = results.reduce((sum, r) => sum + r.total, 0);
    
    results.forEach(r => {
      const status = r.failed === 0 ? '✓' : '✗';
      const color = r.failed === 0 ? 'color: #51cf66' : 'color: #ff6b6b; font-weight: bold';
      console.log(`%c${status} ${r.name}: ${r.passed}/${r.total} passed`, color);
    });
    
    console.log('');
    if (totalTests === 0) {
      console.log('%cNO TESTS REGISTERED', 'color: #ffa94d; font-weight: bold');
    } else if (totalFailed === 0) {
      console.log(`%cTOTAL: ${totalPassed}/${totalTests} passed - ALL TESTS PASSED`, 
        'color: #51cf66; font-weight: bold');
    } else {
      console.error(`%cTOTAL: ${totalPassed}/${totalTests} passed, ${totalFailed} FAILED`, 
        'color: #ff6b6b; font-weight: bold; font-size: 16px');
    }
    
    if (totalTests > 0 && totalFailed === 0) {
      console.log('\nAll tests passed.\n');
    } else if (totalFailed > 0) {
      console.error('\n⚠️  TESTS FAILED - SEE ERRORS ABOVE\n');
    }
    
    return { totalPassed, totalFailed, totalTests, results };
  }
};

// Auto-run tests on page load if enabled
window.addEventListener('DOMContentLoaded', () => {
  if (window.ENABLE_TESTS.all) {
    // Wait for Astronomy Engine to load if astronomical tests are enabled
    if (window.ENABLE_TESTS.astronomical) {
      window.addEventListener('astronomyEngineReady', () => {
        setTimeout(() => {
          TestHarness.runAll();
        }, 100);
      });
    } else {
      // No astronomical tests, run immediately
      setTimeout(() => {
        TestHarness.runAll();
      }, 500);
    }
  }
});

// Manual test runner
window.runTests = () => TestHarness.runAll();
window.TestHarness = TestHarness;
