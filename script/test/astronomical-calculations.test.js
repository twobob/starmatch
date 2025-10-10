// ============================================================================
// Astronomical Calculations - Self Tests
// ============================================================================

(() => {
  if (typeof TestHarness === 'undefined' || !ENABLE_TESTS.astronomical) {
    return;
  }

  // Wait for Astronomy Engine to load before registering tests
  const registerTests = () => {
    const tests = [];

  // Test: getEclipticLongitude - Sun
  tests.push({
    name: 'getEclipticLongitude - Sun',
    fn: () => {
      const date = new Date('2024-03-20T00:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Sun', date);
      const expected = 359.87139270404236;
      return Math.abs(lon - expected) < 0.01; // Within 0.01° tolerance
    }
  });

  // Test: getEclipticLongitude - Moon
  tests.push({
    name: 'getEclipticLongitude - Moon',
    fn: () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Moon', date);
      const expected = 155.9929313314413;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - Mercury
  tests.push({
    name: 'getEclipticLongitude - Mercury',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Mercury', date);
      const expected = 85.88507640391502;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - Venus
  tests.push({
    name: 'getEclipticLongitude - Venus',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Venus', date);
      const expected = 87.83258760457682;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - Mars
  tests.push({
    name: 'getEclipticLongitude - Mars',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Mars', date);
      const expected = 34.66931225425788;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - Jupiter
  tests.push({
    name: 'getEclipticLongitude - Jupiter',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Jupiter', date);
      const expected = 64.76625277433094;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - Saturn
  tests.push({
    name: 'getEclipticLongitude - Saturn',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Saturn', date);
      const expected = 349.25631016821484;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - Uranus
  tests.push({
    name: 'getEclipticLongitude - Uranus',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Uranus', date);
      const expected = 54.96119195273978;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - Neptune
  tests.push({
    name: 'getEclipticLongitude - Neptune',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Neptune', date);
      const expected = 359.8573324863018;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - Pluto
  tests.push({
    name: 'getEclipticLongitude - Pluto',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const lon = AstroCalc.getEclipticLongitude('Pluto', date);
      const expected = 301.687254035785;
      return Math.abs(lon - expected) < 0.01;
    }
  });

  // Test: getEclipticLongitude - missing Astronomy Engine
  tests.push({
    name: 'getEclipticLongitude - throws without Astronomy Engine',
    fn: () => {
      const oldReady = window.astronomyEngineReady;
      window.astronomyEngineReady = false;
      try {
        AstroCalc.getEclipticLongitude('Sun', new Date());
        return false;
      } catch (e) {
        return e.message.includes('Astronomy Engine not loaded');
      } finally {
        window.astronomyEngineReady = oldReady;
      }
    }
  });

  // Test: calculateAscendant - London
  tests.push({
    name: 'calculateAscendant - London coordinates',
    fn: () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const asc = AstroCalc.calculateAscendant(date, 51.5074, -0.1278);
      return asc >= 0 && asc < 360;
    }
  });

  // Test: calculateAscendant - New York
  tests.push({
    name: 'calculateAscendant - New York coordinates',
    fn: () => {
      const date = new Date('2024-06-15T18:00:00Z');
      const asc = AstroCalc.calculateAscendant(date, 40.7128, -74.0060);
      return asc >= 0 && asc < 360;
    }
  });

  // Test: calculateAscendant - Sydney
  tests.push({
    name: 'calculateAscendant - Sydney coordinates',
    fn: () => {
      const date = new Date('2024-03-20T06:00:00Z');
      const asc = AstroCalc.calculateAscendant(date, -33.8688, 151.2093);
      return asc >= 0 && asc < 360;
    }
  });

  // Test: calculateAscendant - equator
  tests.push({
    name: 'calculateAscendant - equator',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const asc = AstroCalc.calculateAscendant(date, 0, 0);
      return asc >= 0 && asc < 360;
    }
  });

  // Test: calculateMidheaven - basic
  tests.push({
    name: 'calculateMidheaven - returns valid longitude',
    fn: () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const mc = AstroCalc.calculateMidheaven(date, -0.1278);
      return mc >= 0 && mc < 360;
    }
  });

  // Test: calculateMidheaven - positive longitude
  tests.push({
    name: 'calculateMidheaven - positive longitude',
    fn: () => {
      const date = new Date('2024-06-15T18:00:00Z');
      const mc = AstroCalc.calculateMidheaven(date, 151.2093);
      return mc >= 0 && mc < 360;
    }
  });

  // Test: calculateMidheaven - negative longitude
  tests.push({
    name: 'calculateMidheaven - negative longitude',
    fn: () => {
      const date = new Date('2024-03-20T06:00:00Z');
      const mc = AstroCalc.calculateMidheaven(date, -74.0060);
      return mc >= 0 && mc < 360;
    }
  });

  // Test: toUTC - valid date/time
  tests.push({
    name: 'toUTC - valid date and time',
    fn: () => {
      const result = AstroCalc.toUTC('2024-01-01', '12:00', 51.5, -0.1);
      return result instanceof Date && !isNaN(result.getTime());
    }
  });

  // Test: toUTC - invalid date format
  tests.push({
    name: 'toUTC - invalid date format returns null',
    fn: () => {
      const result = AstroCalc.toUTC('01/01/2024', '12:00', 51.5, -0.1);
      return result === null;
    }
  });

  // Test: toUTC - invalid time format
  tests.push({
    name: 'toUTC - invalid time format returns null',
    fn: () => {
      const result = AstroCalc.toUTC('2024-01-01', '12pm', 51.5, -0.1);
      return result === null;
    }
  });

  // Test: toUTC - empty strings
  tests.push({
    name: 'toUTC - empty strings return null',
    fn: () => {
      const result = AstroCalc.toUTC('', '', 0, 0);
      return result === null;
    }
  });

  // Test: toUTC - leap year date
  tests.push({
    name: 'toUTC - leap year date',
    fn: () => {
      const result = AstroCalc.toUTC('2024-02-29', '23:59', 0, 0);
      return result instanceof Date && result.getUTCMonth() === 1 && result.getUTCDate() === 29;
    }
  });

  // Test: toUTC - uses TimezoneHelper when available
  tests.push({
    name: 'toUTC - integrates with TimezoneHelper',
    fn: () => {
      if (typeof window.TimezoneHelper === 'undefined') {
        return true; // Skip if TimezoneHelper not loaded
      }
      const result = AstroCalc.toUTC('2024-06-15', '14:30', 40.7128, -74.0060);
      return result instanceof Date;
    }
  });

  // Test: Sun longitude increases over time
  tests.push({
    name: 'Sun longitude progresses through zodiac',
    fn: () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-07-01T00:00:00Z');
      const lon1 = AstroCalc.getEclipticLongitude('Sun', date1);
      const lon2 = AstroCalc.getEclipticLongitude('Sun', date2);
      return Math.abs(lon2 - lon1) > 150 && Math.abs(lon2 - lon1) < 200;
    }
  });

  // Test: Ascendant changes with latitude
  tests.push({
    name: 'Ascendant varies with latitude',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const asc1 = AstroCalc.calculateAscendant(date, 0, 0);
      const asc2 = AstroCalc.calculateAscendant(date, 60, 0);
      return Math.abs(asc1 - asc2) > 1;
    }
  });

  // Test: MC changes with longitude
  tests.push({
    name: 'MC varies with longitude',
    fn: () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const mc1 = AstroCalc.calculateMidheaven(date, 0);
      const mc2 = AstroCalc.calculateMidheaven(date, 90);
      const diff = Math.abs(mc1 - mc2);
      return diff > 80 && diff < 100;
    }
  });

  const AstronomicalTests = {
    runAll() {
      console.log('Running Astronomical Calculation Tests...\n');
      let passed = 0;
      let failed = 0;
      const failures = [];

      tests.forEach(test => {
        try {
          const result = test.fn();
          if (result) {
            passed++;
          } else {
            failed++;
            failures.push({ name: test.name, error: 'Assertion failed' });
          }
        } catch (e) {
          failed++;
          failures.push({ name: test.name, error: e.message });
        }
      });

      console.log(`ASTRONOMICAL CALCULATIONS TEST RESULTS`);
      console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}\n`);

      if (failures.length > 0) {
        console.log('Failed tests:');
        failures.forEach(f => {
          console.log(`  ✗ ${f.name}: ${f.error}`);
        });
        console.log('');
      } else {
        console.log('All tests passed.\n');
      }

      return { passed, failed, total: tests.length };
    }
  };

  TestHarness.register('Astronomical Calculations', AstronomicalTests, 'astronomical');
  };

  // Listen for Astronomy Engine ready event
  if (window.astronomyEngineReady) {
    registerTests();
  } else {
    window.addEventListener('astronomyEngineReady', registerTests);
  }
})();
