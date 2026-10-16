// ============================================================================
// Zodiac Utils Tests
// ============================================================================
// Tests verify CURRENT behavior (including sign shift) to ensure refactoring
// doesn't break existing functionality. Sign fix will come later.
// ============================================================================

const ZodiacUtilsTests = {
  runAll() {
    const results = [];
    let passed = 0;
    let failed = 0;

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
    // getSignIndexFromLongitude Tests (Current Shifted Behavior)
    // ============================================================================

    test('getSignIndexFromLongitude: 0° → 11 (Pisces shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(0);
      if (result !== 11) throw new Error(`Expected 11, got ${result}`);
    });

    test('getSignIndexFromLongitude: 15° → 11 (Pisces shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(15);
      if (result !== 11) throw new Error(`Expected 11, got ${result}`);
    });

    test('getSignIndexFromLongitude: 30° → 0 (Aries shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(30);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    test('getSignIndexFromLongitude: 45° → 0 (Aries shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(45);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    test('getSignIndexFromLongitude: 60° → 1 (Taurus shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(60);
      if (result !== 1) throw new Error(`Expected 1, got ${result}`);
    });

    test('getSignIndexFromLongitude: 90° → 2 (Gemini shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(90);
      if (result !== 2) throw new Error(`Expected 2, got ${result}`);
    });

    test('getSignIndexFromLongitude: 180° → 5 (Virgo shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(180);
      if (result !== 5) throw new Error(`Expected 5, got ${result}`);
    });

    test('getSignIndexFromLongitude: 270° → 8 (Sagittarius shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(270);
      if (result !== 8) throw new Error(`Expected 8, got ${result}`);
    });

    test('getSignIndexFromLongitude: 300° → 9 (Capricorn shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(300);
      if (result !== 9) throw new Error(`Expected 9, got ${result}`);
    });

    test('getSignIndexFromLongitude: 330° → 10 (Aquarius shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(330);
      if (result !== 10) throw new Error(`Expected 10, got ${result}`);
    });

    test('getSignIndexFromLongitude: 359.99° → 10 (Aquarius shifted)', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(359.99);
      if (result !== 10) throw new Error(`Expected 10, got ${result}`);
    });

    // ============================================================================
    // getSignInfo Tests (Current Shifted Behavior)
    // ============================================================================

    test('getSignInfo: 0° → Pisces, 0.00°', () => {
      const result = ZodiacUtils.getSignInfo(0);
      if (result.signIndex !== 11) throw new Error(`Expected signIndex 11, got ${result.signIndex}`);
      if (result.signName !== 'Pisces') throw new Error(`Expected Pisces, got ${result.signName}`);
      if (Math.abs(result.degree - 0) > 0.01) throw new Error(`Expected degree 0, got ${result.degree}`);
    });

    test('getSignInfo: 15° → Pisces, 15.00°', () => {
      const result = ZodiacUtils.getSignInfo(15);
      if (result.signIndex !== 11) throw new Error(`Expected signIndex 11, got ${result.signIndex}`);
      if (result.signName !== 'Pisces') throw new Error(`Expected Pisces, got ${result.signName}`);
      if (Math.abs(result.degree - 15) > 0.01) throw new Error(`Expected degree 15, got ${result.degree}`);
    });

    test('getSignInfo: 30° → Aries, 0.00°', () => {
      const result = ZodiacUtils.getSignInfo(30);
      if (result.signIndex !== 0) throw new Error(`Expected signIndex 0, got ${result.signIndex}`);
      if (result.signName !== 'Aries') throw new Error(`Expected Aries, got ${result.signName}`);
      if (Math.abs(result.degree - 0) > 0.01) throw new Error(`Expected degree 0, got ${result.degree}`);
    });

    test('getSignInfo: 90° → Gemini, 0.00°', () => {
      const result = ZodiacUtils.getSignInfo(90);
      if (result.signIndex !== 2) throw new Error(`Expected signIndex 2, got ${result.signIndex}`);
      if (result.signName !== 'Gemini') throw new Error(`Expected Gemini, got ${result.signName}`);
      if (Math.abs(result.degree - 0) > 0.01) throw new Error(`Expected degree 0, got ${result.degree}`);
    });

    test('getSignInfo: 359.99° → Aquarius, 29.99°', () => {
      const result = ZodiacUtils.getSignInfo(359.99);
      if (result.signIndex !== 10) throw new Error(`Expected signIndex 10, got ${result.signIndex}`);
      if (result.signName !== 'Aquarius') throw new Error(`Expected Aquarius, got ${result.signName}`);
      if (Math.abs(result.degree - 29.99) > 0.01) throw new Error(`Expected degree 29.99, got ${result.degree}`);
    });

    // ============================================================================
    // signNum Tests (Engine Algorithm - Different from getSignIndexFromLongitude)
    // ============================================================================

    test('signNum: 0° → 0', () => {
      const result = ZodiacUtils.signNum(0);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    test('signNum: 15° → 0', () => {
      const result = ZodiacUtils.signNum(15);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    test('signNum: 30° → 1', () => {
      const result = ZodiacUtils.signNum(30);
      if (result !== 1) throw new Error(`Expected 1, got ${result}`);
    });

    test('signNum: 45° → 1', () => {
      const result = ZodiacUtils.signNum(45);
      if (result !== 1) throw new Error(`Expected 1, got ${result}`);
    });

    test('signNum: 90° → 3', () => {
      const result = ZodiacUtils.signNum(90);
      if (result !== 3) throw new Error(`Expected 3, got ${result}`);
    });

    test('signNum: 180° → 6', () => {
      const result = ZodiacUtils.signNum(180);
      if (result !== 6) throw new Error(`Expected 6, got ${result}`);
    });

    test('signNum: 270° → 9', () => {
      const result = ZodiacUtils.signNum(270);
      if (result !== 9) throw new Error(`Expected 9, got ${result}`);
    });

    test('signNum: 330° → 11', () => {
      const result = ZodiacUtils.signNum(330);
      if (result !== 11) throw new Error(`Expected 11, got ${result}`);
    });

    test('signNum: 359.99° → 11', () => {
      const result = ZodiacUtils.signNum(359.99);
      if (result !== 11) throw new Error(`Expected 11, got ${result}`);
    });

    // ============================================================================
    // Verify signNum ≠ getSignIndexFromLongitude (Different Algorithms)
    // ============================================================================

    test('signNum and getSignIndexFromLongitude return DIFFERENT values for 0°', () => {
      const signNumResult = ZodiacUtils.signNum(0);
      const signIndexResult = ZodiacUtils.getSignIndexFromLongitude(0);
      if (signNumResult === signIndexResult) {
        throw new Error(`Expected different values, both returned ${signNumResult}`);
      }
    });

    test('signNum and getSignIndexFromLongitude return DIFFERENT values for 30°', () => {
      const signNumResult = ZodiacUtils.signNum(30);
      const signIndexResult = ZodiacUtils.getSignIndexFromLongitude(30);
      if (signNumResult === signIndexResult) {
        throw new Error(`Expected different values, both returned ${signNumResult}`);
      }
    });

    // ============================================================================
    // house Tests
    // ============================================================================

    test('house: asc=0°, planet=0° → house 1', () => {
      const result = ZodiacUtils.house(0, 0);
      if (result !== 1) throw new Error(`Expected 1, got ${result}`);
    });

    test('house: asc=0°, planet=45° → house 2', () => {
      const result = ZodiacUtils.house(45, 0);
      if (result !== 2) throw new Error(`Expected 2, got ${result}`);
    });

    test('house: asc=0°, planet=90° → house 4', () => {
      const result = ZodiacUtils.house(90, 0);
      if (result !== 4) throw new Error(`Expected 4, got ${result}`);
    });

    test('house: asc=45°, planet=90° → house 2', () => {
      const result = ZodiacUtils.house(90, 45);
      if (result !== 2) throw new Error(`Expected 2, got ${result}`);
    });

    test('house: asc=180°, planet=270° → house 4', () => {
      const result = ZodiacUtils.house(270, 180);
      if (result !== 4) throw new Error(`Expected 4, got ${result}`);
    });

    // ============================================================================
    // Edge Cases
    // ============================================================================

    test('getSignIndexFromLongitude handles negative longitude', () => {
      const result = ZodiacUtils.getSignIndexFromLongitude(-30);
      if (result !== 10) throw new Error(`Expected 10, got ${result}`);
    });

    test('signNum handles negative longitude', () => {
      const result = ZodiacUtils.signNum(-30);
      if (result !== 11) throw new Error(`Expected 11, got ${result}`);
    });

    test('house handles negative house offset', () => {
      const result = ZodiacUtils.house(0, 90);
      if (result < 1 || result > 12) throw new Error(`House out of range: ${result}`);
    });

    // ============================================================================
    // Summary
    // ============================================================================

    console.log('\n' + '='.repeat(50));
    console.log('Zodiac Utils Test Results');
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
    TestHarness.register('Zodiac Utils', ZodiacUtilsTests, 'zodiacUtils');
  }
});
