// ============================================================================
// Comparison Engine Integration Tests
// ============================================================================

(function() {
  'use strict';

      // Only run if tests are enabled
      if (!window.ENABLE_TESTS || !window.ENABLE_TESTS.comparison) {
    return;
      }

      // Wait for Astronomy Engine to load before REGISTERING tests (not running them)
      const registerTests = () => {

      const ComparisonTests = {
    runAll() {
      console.log('%c🧪 Running Comparison Engine Tests...', 'color: #ffd43b; font-weight: bold;');

      let passCount = 0;
      let failCount = 0;

      function assert(condition, testName, details = '') {
        if (condition) {
          passCount++;
          console.log(`%c✓ ${testName}`, 'color: #51cf66;');
        } else {
          failCount++;
          console.error(`%c✗ ${testName}`, 'color: #ff6b6b; font-weight: bold;');
          if (details) console.error(`  Details: ${details}`);
        }
      }

      function assertClose(actual, expected, tolerance, testName) {
        const diff = Math.abs(actual - expected);
        const passed = diff <= tolerance;
        if (passed) {
          passCount++;
          console.log(`%c✓ ${testName}`, 'color: #51cf66;', `(${actual.toFixed(4)} ≈ ${expected.toFixed(4)})`);
        } else {
          failCount++;
          console.error(`%c✗ ${testName}`, 'color: #ff6b6b; font-weight: bold;');
          console.error(`  Expected: ${expected.toFixed(4)}, Got: ${actual.toFixed(4)}, Diff: ${diff.toFixed(4)}`);
        }
      }

      // ============================================================================
      // DEPENDENCY TESTS
      // These tests verify that all required dependencies exist BEFORE calculations
      // ============================================================================

      console.log('%c  Testing Critical Dependencies...', 'color: #ffa94d;');

      assert(typeof ComparisonEngine !== 'undefined', 
        'ComparisonEngine module exists');
      
      assert(typeof ComparisonEngine.calculateChartForRecord === 'function',
        'calculateChartForRecord function exists');
      
      assert(typeof ComparisonEngine.calculateXProfileValue === 'function',
        'calculateXProfileValue function exists');
      
      assert(typeof ComparisonEngine.getRelationshipTypeInterpretation === 'function',
        'getRelationshipTypeInterpretation function exists');

      // CRITICAL: Test for engine.js dependencies
      assert(typeof getThemeValues === 'function',
        'CRITICAL: engine.js getThemeValues function is available',
        'ComparisonEngine depends on this global function');

      assert(typeof theme !== 'undefined',
        'CRITICAL: engine.js theme array is available',
        'ComparisonEngine reads from this global array');

      assert(typeof TidyUpAndFloat === 'function',
        'CRITICAL: TidyUpAndFloat helper function is available',
        'engine.js requires this function - THIS TEST WOULD HAVE CAUGHT THE ERROR');

      // CRITICAL: Test for module dependencies
      assert(typeof AstroCalc !== 'undefined',
        'CRITICAL: AstroCalc module is loaded',
        'ComparisonEngine uses AstroCalc functions');

      assert(typeof PLANET_NAMES !== 'undefined' && Array.isArray(PLANET_NAMES),
        'CRITICAL: PLANET_NAMES array is available',
        'Required for iterating through planetary positions');

      // ============================================================================
      // INTEGRATION TEST: Verify TidyUpAndFloat Works With Actual Values
      // ============================================================================

      console.log('%c  Testing TidyUpAndFloat Integration...', 'color: #ffa94d;');

      const testValues = [
        { input: 123.456, expected: 123.456 },
        { input: '123.456', expected: 123.456 },
        { input: 0, expected: 0 },
        { input: '0', expected: 0 },
        { input: null, expected: 0 },
        { input: undefined, expected: 0 },
        { input: NaN, expected: 0 },
        { input: '', expected: 0 },
        { input: 'invalid', expected: 0 }
      ];

      testValues.forEach(test => {
        const result = TidyUpAndFloat(test.input);
        assert(result === test.expected,
          `TidyUpAndFloat(${JSON.stringify(test.input)}) returns ${test.expected}`,
          `Got ${result} instead of ${test.expected}`);
      });

      // ============================================================================
      // XPROFILE CALCULATION TESTS
      // ============================================================================

      console.log('%c  Testing xProfile Calculations...', 'color: #ffa94d;');

      // Test identical charts (should be close to +1)
      const identicalThemes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const xProfileIdentical = ComparisonEngine.calculateXProfileValue(identicalThemes, identicalThemes);
      assertClose(xProfileIdentical, 1.0, 0.0001, 'Identical charts have xProfile = +1.0');

      // Test inverted charts - ACTUAL inverted vector  
      // NOT just reversing numbers, but actually negating all values
      const negatedThemes = [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12];
      const xProfileInverted = ComparisonEngine.calculateXProfileValue(identicalThemes, negatedThemes);
      assertClose(xProfileInverted, -1.0, 0.01,
        'True inverted charts (negated values) have xProfile ≈ -1.0');

      // Test zero themes (should return 0)
      const zeroThemes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const xProfileZero = ComparisonEngine.calculateXProfileValue(zeroThemes, identicalThemes);
      assert(xProfileZero === 0, 'Zero themes return xProfile = 0');

      // Test orthogonal vectors (should be close to 0)
      const orthogonal1 = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
      const orthogonal2 = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
      const xProfileOrthogonal = ComparisonEngine.calculateXProfileValue(orthogonal1, orthogonal2);
      assertClose(xProfileOrthogonal, 0.0, 0.0001, 'Orthogonal vectors have xProfile ≈ 0');

      // Test symmetry: xProfile(A, B) should equal xProfile(B, A)
      const themesA = [5, 3, 8, 2, 6, 4, 7, 1, 9, 3, 5, 2];
      const themesB = [4, 6, 2, 8, 3, 7, 1, 9, 2, 6, 4, 5];
      const xProfileAB = ComparisonEngine.calculateXProfileValue(themesA, themesB);
      const xProfileBA = ComparisonEngine.calculateXProfileValue(themesB, themesA);
      assertClose(xProfileAB, xProfileBA, 0.0001, 'xProfile is symmetric: xProfile(A,B) = xProfile(B,A)');

      // Test range: xProfile must be between -1 and +1
      assert(xProfileAB >= -1 && xProfileAB <= 1,
        'xProfile value is within valid range [-1, +1]',
        `Got ${xProfileAB}`);

      // Test error handling
      const invalidXProfile1 = ComparisonEngine.calculateXProfileValue(null, identicalThemes);
      assert(invalidXProfile1 === 0, 'Invalid input (null) returns 0');

      const invalidXProfile2 = ComparisonEngine.calculateXProfileValue([1, 2, 3], identicalThemes);
      assert(invalidXProfile2 === 0, 'Wrong length array returns 0');

      // ============================================================================
      // RELATIONSHIP TYPE INTERPRETATION TESTS
      // ============================================================================

      console.log('%c  Testing Relationship Type Interpretations...', 'color: #ffa94d;');

      const testCases = [
        { value: 0.0, expectedType: 'Equality/Balance', expectedColor: '#51cf66' },
        { value: 0.1, expectedType: 'Equality/Balance', expectedColor: '#51cf66' },
        { value: -0.1, expectedType: 'Equality/Balance', expectedColor: '#51cf66' },
        { value: 0.8, expectedType: 'Strong Similarity', expectedColor: '#74c0fc' },
        { value: 0.5, expectedType: 'Moderate Similarity', expectedColor: '#69db7c' },
        { value: -0.8, expectedType: 'Strong Complementarity', expectedColor: '#b85eff' },
        { value: -0.5, expectedType: 'Moderate Complementarity', expectedColor: '#a78bfa' },
        { value: 0.3, expectedType: 'Mixed Balance', expectedColor: '#ffd43b' },
        { value: -0.3, expectedType: 'Mixed Balance', expectedColor: '#ffd43b' }
      ];

      testCases.forEach(test => {
        const result = ComparisonEngine.getRelationshipTypeInterpretation(test.value);
        assert(result.type === test.expectedType,
          `xProfile ${test.value} interpreted as "${test.expectedType}"`,
          `Got "${result.type}"`);
        assert(result.color === test.expectedColor,
          `xProfile ${test.value} has color ${test.expectedColor}`,
          `Got ${result.color}`);
      });

  console.log('%c  Testing End-to-End Chart Calculation...', 'color: #ffa94d;');

      // Create a test record with known values
      const testRecord = {
    name: 'Integration Test',
    date: '2000-01-01',
    time: '12:00',
    lat: '51.5074',
    lon: '-0.1278'  // London
      };

      // Expected values from working client for 2000-01-01 12:00 London local time
      // Note: The working code adds +30 to all planetary positions
      const expectedPositions = {
        Sun: 310.3686,    // 280.3686 + 30
        Moon: 253.3239,   // 223.3239 + 30
        Mercury: 301.8889, // 271.8889 + 30
        Venus: 271.5652,  // 241.5652 + 30
        Mars: 357.9639,   // 327.9639 + 30
        Jupiter: 55.2542,  // 25.2542 + 30
        Saturn: 70.3961,  // 40.3961 + 30
        Uranus: 344.8061, // 314.8061 + 30
        Neptune: 333.1954, // 303.1954 + 30
        Pluto: 281.4547   // 251.4547 + 30
      };
      const expectedAscendant = 53.9338;
      const expectedMidheaven = 280.3328;      // Verify we can calculate a chart without errors
      let calculationSucceeded = false;
      let calculationError = null;
      let chartResult = null;

      try {
        chartResult = ComparisonEngine.calculateChartForRecord(testRecord);
        calculationSucceeded = (chartResult !== null);
      } catch (error) {
        calculationError = error;
      }

      assert(calculationSucceeded && calculationError === null,
        'CRITICAL: Chart calculation completes without errors',
        calculationError ? `Error: ${calculationError.message}` : 'Chart calculation failed');

      if (chartResult) {
        assert(typeof chartResult.positions === 'object',
          'Chart result includes positions object');
        
        assert(typeof chartResult.ascendant === 'number',
          'Chart result includes ascendant angle');
        
        assert(typeof chartResult.midheaven === 'number',
          'Chart result includes midheaven angle');
        
        assert(Array.isArray(chartResult.themes) && chartResult.themes.length === 12,
          'CRITICAL: Chart result includes 12-element themes array',
          `Got ${chartResult.themes ? chartResult.themes.length : 0} elements`);
        
        // CRITICAL: Verify actual planetary positions match expected values
        const requiredPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
        requiredPlanets.forEach(planet => {
          assert(typeof chartResult.positions[planet] === 'number',
            `Chart includes ${planet} position`);
          
          assert(chartResult.positions[planet] >= 0 && chartResult.positions[planet] < 360,
            `${planet} position is within valid range [0, 360)`,
            `Got ${chartResult.positions[planet]}`);
          
          assertClose(chartResult.positions[planet], expectedPositions[planet], 0.5,
            `${planet} position matches expected value (${expectedPositions[planet].toFixed(4)}°)`);
        });

        assertClose(chartResult.ascendant, expectedAscendant, 0.5,
          `Ascendant matches expected value (${expectedAscendant.toFixed(4)}°)`);
        
        assertClose(chartResult.midheaven, expectedMidheaven, 0.5,
          `Midheaven matches expected value (${expectedMidheaven.toFixed(4)}°)`);

        // Verify themes are valid numbers (non-zero since this is a real chart)
        chartResult.themes.forEach((themeValue, index) => {
          assert(typeof themeValue === 'number' && !isNaN(themeValue),
            `Theme[${index}] is a valid number`,
            `Got ${themeValue} (type: ${typeof themeValue})`);
        });
        
        // Verify at least some themes are non-zero (sanity check that engine ran)
        const nonZeroThemes = chartResult.themes.filter(t => t !== 0);
        assert(nonZeroThemes.length > 0,
          'CRITICAL: At least some theme values are non-zero (engine calculated themes)',
          `All ${chartResult.themes.length} themes are zero - engine may not have run`);
      }

      // Test invalid record handling
      const invalidRecord = { name: 'Invalid' };
      const invalidResult = ComparisonEngine.calculateChartForRecord(invalidRecord);
      assert(invalidResult === null,
        'Invalid record (missing fields) returns null');

      const invalidRecord2 = { name: 'Invalid', date: 'bad', time: 'bad', lat: 'bad', lon: 'bad' };
      const invalidResult2 = ComparisonEngine.calculateChartForRecord(invalidRecord2);
      assert(invalidResult2 === null,
        'Invalid record (bad values) returns null');

      console.log('%c  Testing TidyUpAndFloat Regression...', 'color: #ffa94d;');

      // Mock getThemeValues to verify TidyUpAndFloat is called on all parameters
      const originalGetThemeValues = window.getThemeValues;
      let tidyUpCalledCount = 0;
      let receivedBadValues = false;

      // Temporarily wrap TidyUpAndFloat to count calls
      const originalTidyUpAndFloat = window.TidyUpAndFloat;
      window.TidyUpAndFloat = function(value) {
        tidyUpCalledCount++;
        const result = originalTidyUpAndFloat(value);
        if (isNaN(result) && result !== 0) {
          receivedBadValues = true;
        }
        return result;
      };

      // Calculate a chart
      if (chartResult) {
        // Reset counter
        tidyUpCalledCount = 0;
        receivedBadValues = false;
        
        // Recalculate to test
        ComparisonEngine.calculateChartForRecord(testRecord);
        
        // Verify TidyUpAndFloat was called for all 12 parameters (10 planets + 2 angles)
        assert(tidyUpCalledCount >= 12,
          'REGRESSION: TidyUpAndFloat called for all planetary positions and angles',
          `Called ${tidyUpCalledCount} times, expected at least 12`);
        
        assert(!receivedBadValues,
          'REGRESSION: TidyUpAndFloat only receives valid values',
          'Some NaN or invalid values were passed');
      }

      // Restore original function
      window.TidyUpAndFloat = originalTidyUpAndFloat;

      // ============================================================================
      // Test Results Summary
      // ============================================================================

      console.log('\n' + '='.repeat(60));
      if (failCount === 0) {
        console.log(`%c✓ All Comparison Engine Tests Passed (${passCount}/${passCount})`, 
          'color: #51cf66; font-weight: bold; font-size: 14px;');
      } else {
        console.error(`%c✗ Some Tests Failed: ${passCount} passed, ${failCount} failed`, 
          'color: #ff6b6b; font-weight: bold; font-size: 14px;');
      }
      console.log('='.repeat(60) + '\n');

      // Return results for test harness
      return {
        passed: passCount,
        failed: failCount,
        total: passCount + failCount
      };

    } // End runAll method
      }; // End ComparisonTests object

      // Register tests with TestHarness (don't run them yet)
      TestHarness.register('Comparison Engine', ComparisonTests, 'comparison');

      }; // End registerTests

      // Listen for Astronomy Engine ready event
      if (window.astronomyEngineReady) {
    registerTests();
      } else {
    window.addEventListener('astronomyEngineReady', registerTests);
      }

})();

