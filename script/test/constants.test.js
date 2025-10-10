// ============================================================================
// Constants Tests
// Self-tests for configuration constants
// ============================================================================

const ConstantsTests = {
  results: [],
  
  assert(condition, message) {
    if (condition) {
      this.results.push({ pass: true, message });
    } else {
      this.results.push({ pass: false, message });
      console.error('FAIL:', message);
    }
  },
  
  runAll() {
    console.log('Running Constants Tests...\n');
    this.results = [];
    
    this.testArrayLengths();
    this.testRulingPlanets();
    this.testColors();
    this.testAspectSymbols();
    this.testChartConfig();
    
    return this.printResults();
  },
  
  testArrayLengths() {
    const c = AstroConstants;
    
    this.assert(c.SIGN_NAMES.length === 12, 'SIGN_NAMES has 12 entries');
    this.assert(c.SIGN_SYMBOLS.length === 12, 'SIGN_SYMBOLS has 12 entries');
    this.assert(c.PLANET_NAMES.length === 10, 'PLANET_NAMES has 10 entries');
    this.assert(c.PLANET_SYMBOLS.length === 10, 'PLANET_SYMBOLS has 10 entries');
    this.assert(c.ASPECT_NAMES.length === 7, 'ASPECT_NAMES has 7 entries');
    this.assert(c.ELEMENT_NAMES.length === 4, 'ELEMENT_NAMES has 4 entries');
    this.assert(c.QUALITY_NAMES.length === 3, 'QUALITY_NAMES has 3 entries');
  },
  
  testRulingPlanets() {
    const c = AstroConstants;
    const rulerKeys = Object.keys(c.RULING_PLANETS);
    
    this.assert(rulerKeys.length === 12, 'RULING_PLANETS has 12 entries');
    
    // Check all signs have rulers
    c.SIGN_NAMES.forEach(sign => {
      const hasRuler = c.RULING_PLANETS[sign] !== undefined;
      this.assert(hasRuler, `${sign} has a ruling planet`);
      
      if (hasRuler) {
        const rulerExists = c.PLANET_NAMES.includes(c.RULING_PLANETS[sign]);
        this.assert(rulerExists, `${sign} ruler (${c.RULING_PLANETS[sign]}) is a valid planet`);
      }
    });
    
    // Check no duplicate keys
    const uniqueKeys = new Set(rulerKeys);
    this.assert(uniqueKeys.size === rulerKeys.length, 'RULING_PLANETS has no duplicate keys');
  },
  
  testColors() {
    const c = AstroConstants;
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    
    // Test element colors
    Object.entries(c.ELEMENT_COLOURS).forEach(([element, color]) => {
      this.assert(hexColorRegex.test(color), `${element} color is valid hex (${color})`);
    });
    
    this.assert(Object.keys(c.ELEMENT_COLOURS).length === 4, 'ELEMENT_COLOURS has 4 entries');
    
    // Test aspect symbol colors
    Object.entries(c.ASPECT_SYMBOLS).forEach(([aspect, data]) => {
      this.assert(hexColorRegex.test(data.color), `${aspect} color is valid hex (${data.color})`);
      this.assert(data.symbol !== undefined, `${aspect} has a symbol`);
      this.assert(data.symbol.length > 0, `${aspect} symbol is non-empty`);
    });
  },
  
  testAspectSymbols() {
    const c = AstroConstants;
    
    // Check all aspect names have corresponding symbols
    c.ASPECT_NAMES.forEach(aspectName => {
      const hasSymbol = c.ASPECT_SYMBOLS[aspectName] !== undefined;
      this.assert(hasSymbol, `${aspectName} has symbol data`);
    });
    
    // Check all symbols have both symbol and color properties
    Object.entries(c.ASPECT_SYMBOLS).forEach(([aspect, data]) => {
      this.assert(data.symbol !== undefined, `${aspect} has symbol property`);
      this.assert(data.color !== undefined, `${aspect} has color property`);
    });
  },
  
  testChartConfig() {
    const c = AstroConstants;
    
    // Main chart config
    this.assert(c.MAIN_CHART_CONFIG.outerRadius > c.MAIN_CHART_CONFIG.innerRadius, 
                'Main chart outer > inner radius');
    this.assert(c.MAIN_CHART_CONFIG.planetRadius < c.MAIN_CHART_CONFIG.innerRadius,
                'Main chart planet radius < inner radius');
    this.assert(c.MAIN_CHART_CONFIG.outerRadius > 0, 'Main chart outer radius positive');
    
    // Comparison chart config
    this.assert(c.COMPARISON_CHART_CONFIG.outerRadius > c.COMPARISON_CHART_CONFIG.innerRadius,
                'Comparison chart outer > inner radius');
    this.assert(c.COMPARISON_CHART_CONFIG.outerRadius > 0, 'Comparison chart outer radius positive');
    
    // House cusp options
    this.assert(c.MAIN_HOUSE_CUSP_OPTIONS.fontSize > 0, 'Main chart fontSize positive');
    this.assert(c.MAIN_HOUSE_CUSP_OPTIONS.numeralRadiusFactor > 0, 'Main chart numeralRadiusFactor positive');
    this.assert(c.MAIN_HOUSE_CUSP_OPTIONS.numeralRadiusFactor < 1, 'Main chart numeralRadiusFactor < 1');
    
    this.assert(c.COMPARISON_HOUSE_CUSP_OPTIONS.fontSize > 0, 'Comparison chart fontSize positive');
    this.assert(c.COMPARISON_HOUSE_CUSP_OPTIONS.numeralRadiusFactor > 0, 'Comparison chart numeralRadiusFactor positive');
    this.assert(c.COMPARISON_HOUSE_CUSP_OPTIONS.numeralRadiusFactor < 1, 'Comparison chart numeralRadiusFactor < 1');
  },
  
  printResults() {
    const passed = this.results.filter(r => r.pass).length;
    const failed = this.results.filter(r => !r.pass).length;
    
    console.log('\nCONSTANTS TEST RESULTS');
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
  window.ConstantsTests = ConstantsTests;
  
  // Register with global test harness
  window.addEventListener('DOMContentLoaded', () => {
    if (window.TestHarness) {
      TestHarness.register('Constants', ConstantsTests, 'constants');
    }
  });
}
