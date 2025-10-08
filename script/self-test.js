// ============================================================================
// Starmatch Self-Test Module
// Validates planetary calculations against known reference data
// ============================================================================

const SELFTEST = false;  // Set to true to enable self-test

function runSelfTest() {
  console.log('='.repeat(60));
  console.log('STARMATCH CALCULATION SELF-TEST');
  console.log('='.repeat(60));
  
  const testData = {
    date: '1974-09-11',
    time: '14:14',
    latitude: 55.9221,
    longitude: -3.1336,
    expected: {
      Sun: { sign: 'Virgo', degrees: 18, minutes: 25, seconds: 15 },
      Moon: { sign: 'Cancer', degrees: 15, minutes: 4, seconds: 42 },
      Mercury: { sign: 'Libra', degrees: 8, minutes: 13, seconds: 58 },
      Venus: { sign: 'Virgo', degrees: 3, minutes: 51, seconds: 5 },
      Mars: { sign: 'Virgo', degrees: 29, minutes: 11, seconds: 41 },
      Jupiter: { sign: 'Pisces', degrees: 12, minutes: 7, seconds: 39 },
      Saturn: { sign: 'Cancer', degrees: 16, minutes: 42, seconds: 1 },
      Uranus: { sign: 'Libra', degrees: 25, minutes: 44, seconds: 3 },
      Neptune: { sign: 'Sagittarius', degrees: 6, minutes: 59, seconds: 41 },
      Pluto: { sign: 'Libra', degrees: 5, minutes: 59, seconds: 1 },
      Ascendant: { sign: 'Sagittarius', degrees: 3, minutes: 16, seconds: 2 }
    },
    // Reference data for future calculations (not currently tested):
    expectedFuture: {
      TrueNode: { sign: 'Sagittarius', degrees: 14, minutes: 33, seconds: 45 },
      Chiron: { sign: 'Aries', degrees: 23, minutes: 39, seconds: 23, retrograde: true },
      Midheaven: { sign: 'Libra', degrees: 5, minutes: 57, seconds: 0 },
      // House cusps (Placidus system)
      House2: { sign: 'Capricorn', degrees: 8, minutes: 31, seconds: 0 },
      House3: { sign: 'Aquarius', degrees: 26, minutes: 49, seconds: 0 },
      House11: { sign: 'Scorpio', degrees: 1, minutes: 30, seconds: 0 },
      House12: { sign: 'Scorpio', degrees: 19, minutes: 18, seconds: 0 }
    }
  };
  
  console.log(`Test Date: ${testData.date} ${testData.time}`);
  console.log(`Location: ${testData.latitude}°N, ${testData.longitude}°E`);
  console.log('-'.repeat(60));
  
  // Parse the date and time using timezone helper for automatic DST detection
  const result = window.TimezoneHelper.localToUTC(
    testData.date, 
    testData.time, 
    testData.latitude, 
    testData.longitude
  );
  
  if (!result) {
    console.error('Failed to parse date/time');
    return;
  }
  
  const datetime = result.utcDate;
  console.log(`Timezone: ${result.tzInfo.region} (${result.tzInfo.isDST ? 'DST active' : 'Standard time'})`);
  console.log(`Offset: UTC${result.tzInfo.totalOffset >= 0 ? '+' : ''}${result.tzInfo.totalOffset}`);
  console.log('-'.repeat(60));
  
  // Calculate positions using the same method as main chart
  const calculatedPositions = {};
  const PLANET_NAMES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 
                        'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
  for (const planetName of PLANET_NAMES) {
    try {
      const longitude = getEclipticLongitude(planetName, datetime);
      let adjustedLon = longitude + 30;
      if (adjustedLon >= 360) adjustedLon -= 360;
      calculatedPositions[planetName] = adjustedLon;
    } catch (error) {
      console.error(`Error calculating ${planetName}:`, error);
    }
  }
  
  // Calculate Ascendant using the same function as the main chart
  try {
    const ascendant = calculateAscendant(datetime, testData.latitude, testData.longitude);
    calculatedPositions.Ascendant = ascendant;
  } catch (error) {
    console.error('Error calculating Ascendant:', error);
  }
  
  // Helper function to convert decimal degrees to DMS
  function toDMS(degrees) {
    const d = Math.floor(degrees);
    const minFloat = (degrees - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60);
    return { degrees: d, minutes: m, seconds: s };
  }
  
  // Helper function to convert DMS to total seconds
  function toTotalSeconds(dms) {
    return dms.degrees * 3600 + dms.minutes * 60 + dms.seconds;
  }
  
  // Compare results
  let hasSignificantDeviation = false;
  let successCount = 0;
  let totalCount = 0;
  
  Object.keys(testData.expected).forEach(planetName => {
    totalCount++;
    const expected = testData.expected[planetName];
    const calculatedLon = calculatedPositions[planetName];
    
    if (calculatedLon === undefined) {
      console.log(`❌ ${planetName.padEnd(10)} - Calculation failed`);
      hasSignificantDeviation = true;
      return;
    }
    
    const { signName, degree } = getSignInfo(calculatedLon);
    const calculatedDMS = toDMS(degree);
    
    const expectedTotalSec = toTotalSeconds(expected);
    const calculatedTotalSec = toTotalSeconds(calculatedDMS);
    const deviationSec = Math.abs(expectedTotalSec - calculatedTotalSec);
    
    // Format output
    const expectedStr = `${expected.sign} ${expected.degrees}°${expected.minutes}'${expected.seconds}"`;
    const calculatedStr = `${signName} ${calculatedDMS.degrees}°${calculatedDMS.minutes}'${calculatedDMS.seconds}"`;
    
    if (signName !== expected.sign || deviationSec > 60) {
      // Significant deviation (more than 1 minute or wrong sign)
      hasSignificantDeviation = true;
      console.log(`⚠️  ${planetName.padEnd(10)} Expected: ${expectedStr.padEnd(25)} Calculated: ${calculatedStr.padEnd(25)} Deviation: ${deviationSec}s`);
    } else if (deviationSec > 5) {
      // Small deviation (5-60 seconds)
      successCount++;
      console.log(`ℹ️  ${planetName.padEnd(10)} Expected: ${expectedStr.padEnd(25)} Calculated: ${calculatedStr.padEnd(25)} Deviation: ${deviationSec}s`);
    } else {
      // Negligible deviation
      successCount++;
      console.log(`✓  ${planetName.padEnd(10)} ${calculatedStr} (negligible deviation)`);
    }
  });
  
  console.log('-'.repeat(60));
  console.log(`Results: ${successCount}/${totalCount} within acceptable range`);
  
  if (!hasSignificantDeviation) {
    console.log('✓ Self-test PASSED - All calculations within acceptable range');
  } else {
    console.log('⚠️  Self-test completed with deviations - Review above results');
  }
  console.log('='.repeat(60));
}

// Run self-test when Astronomy Engine is ready
if (typeof window !== 'undefined') {
  window.addEventListener('astronomyEngineReady', () => {
    if (SELFTEST) {
      setTimeout(() => runSelfTest(), 500);
    }
  });
}
