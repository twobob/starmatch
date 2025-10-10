const ChartRendererTests = (function() {
  'use strict';

  const tests = [];

  function test(name, fn) {
    tests.push({ name, fn });
  }

  test('getPlanetColourByLongitude returns correct element colors', () => {
    if (typeof ChartRenderer === 'undefined') throw new Error('ChartRenderer not loaded');
    if (typeof AstroConstants === 'undefined') throw new Error('AstroConstants not loaded');
    if (typeof getSignIndexFromLongitude === 'undefined') throw new Error('getSignIndexFromLongitude not defined');

    const testCases = [
      { longitude: 310.36864016087605, expected: '#51cf66' },
      { longitude: 253.32389112747416, expected: '#a78bfa' },
      { longitude: 301.88891206646304, expected: '#51cf66' },
      { longitude: 271.5652329403621, expected: '#ff6b6b' },
    ];

    testCases.forEach(({ longitude, expected }) => {
      const color = ChartRenderer.getPlanetColourByLongitude(longitude);
      if (color !== expected) {
        throw new Error(`Expected ${expected} for longitude ${longitude}, got ${color}`);
      }
    });
  });

  test('calculatePlanetPositionsWithCollisionDetection handles no collisions', () => {
    if (typeof ChartRenderer === 'undefined') throw new Error('ChartRenderer not loaded');

    const positions = {
      Sun: 310.36864016087605,
      Moon: 253.32389112747416
    };
    const ascendant = 53.98772106753586;
    const centerX = 300;
    const centerY = 300;
    const radius = 160;

    const result = ChartRenderer.calculatePlanetPositionsWithCollisionDetection(
      positions, ascendant, centerX, centerY, radius
    );

    if (result.length !== 2) {
      throw new Error(`Expected 2 planets, got ${result.length}`);
    }

    result.forEach(planet => {
      if (!planet.name || !planet.longitude || planet.x === undefined || planet.y === undefined) {
        throw new Error(`Planet data incomplete: ${JSON.stringify(planet)}`);
      }
      if (planet.adjustedRadius !== radius) {
        throw new Error(`Expected radius ${radius}, got ${planet.adjustedRadius}`);
      }
    });
  });

  test('calculatePlanetPositionsWithCollisionDetection handles conjunctions', () => {
    if (typeof ChartRenderer === 'undefined') throw new Error('ChartRenderer not loaded');

    const positions = {
      Sun: 310.0,
      Mercury: 312.0,
      Venus: 314.0
    };
    const ascendant = 0;
    const centerX = 300;
    const centerY = 300;
    const radius = 160;
    const stackOffset = 15;

    const result = ChartRenderer.calculatePlanetPositionsWithCollisionDetection(
      positions, ascendant, centerX, centerY, radius, 25, stackOffset
    );

    if (result.length !== 3) {
      throw new Error(`Expected 3 planets, got ${result.length}`);
    }

    const sortedByRadius = [...result].sort((a, b) => b.adjustedRadius - a.adjustedRadius);
    
    for (let i = 0; i < sortedByRadius.length; i++) {
      const expectedRadius = radius - (i * stackOffset);
      if (Math.abs(sortedByRadius[i].adjustedRadius - expectedRadius) > 0.01) {
        throw new Error(`Planet ${i} expected radius ${expectedRadius}, got ${sortedByRadius[i].adjustedRadius}`);
      }
    }
  });

  test('calculateAspects detects conjunction', () => {
    if (typeof ChartRenderer === 'undefined') throw new Error('ChartRenderer not loaded');
    if (typeof window.orbType === 'undefined') window.orbType = 1;
    if (typeof window.ao === 'undefined') window.ao = [[8,8,8,8,8,8,8]];
    if (typeof window.aoIndex === 'undefined') window.aoIndex = 0;

    const positions = {
      Sun: 310.36864016087605,
      Mercury: 301.88891206646304
    };
    const ascendant = 53.98772106753586;
    const centerX = 300;
    const centerY = 300;
    const radius = 160;

    const planetsArray = ChartRenderer.calculatePlanetPositionsWithCollisionDetection(
      positions, ascendant, centerX, centerY, radius
    );

    const aspects = ChartRenderer.calculateAspects(
      positions, planetsArray, ascendant, centerX, centerY, radius
    );

    const conjunction = aspects.find(a => a.type === 'Conjunction');
    if (!conjunction) {
      throw new Error('Expected to find conjunction between Sun and Mercury');
    }

    if (conjunction.planet1 !== 'Sun' && conjunction.planet2 !== 'Sun') {
      throw new Error('Conjunction should involve Sun');
    }
    if (conjunction.planet1 !== 'Mercury' && conjunction.planet2 !== 'Mercury') {
      throw new Error('Conjunction should involve Mercury');
    }
  });

  test('calculateAspects detects trine', () => {
    if (typeof ChartRenderer === 'undefined') throw new Error('ChartRenderer not loaded');
    if (typeof window.orbType === 'undefined') window.orbType = 1;

    const positions = {
      Sun: 0,
      Mars: 120
    };
    const ascendant = 0;
    const centerX = 300;
    const centerY = 300;
    const radius = 160;

    const planetsArray = ChartRenderer.calculatePlanetPositionsWithCollisionDetection(
      positions, ascendant, centerX, centerY, radius
    );

    const aspects = ChartRenderer.calculateAspects(
      positions, planetsArray, ascendant, centerX, centerY, radius
    );

    const trine = aspects.find(a => a.type === 'Trine');
    if (!trine) {
      throw new Error('Expected to find trine between Sun and Mars');
    }
    if (trine.angle !== 120) {
      throw new Error(`Expected trine angle 120, got ${trine.angle}`);
    }
  });

  test('calculateAspects detects opposition', () => {
    if (typeof ChartRenderer === 'undefined') throw new Error('ChartRenderer not loaded');
    if (typeof window.orbType === 'undefined') window.orbType = 1;

    const positions = {
      Sun: 310.36864016087605,
      Saturn: 70.39612413717839 + 60
    };
    const ascendant = 53.98772106753586;
    const centerX = 300;
    const centerY = 300;
    const radius = 160;

    const planetsArray = ChartRenderer.calculatePlanetPositionsWithCollisionDetection(
      positions, ascendant, centerX, centerY, radius
    );

    const aspects = ChartRenderer.calculateAspects(
      positions, planetsArray, ascendant, centerX, centerY, radius
    );

    const opposition = aspects.find(a => a.type === 'Opposition');
    if (!opposition) {
      throw new Error('Expected to find opposition');
    }
    if (opposition.angle !== 180) {
      throw new Error(`Expected opposition angle 180, got ${opposition.angle}`);
    }
  });

  test('drawAspectsOnCanvas does not throw errors', () => {
    if (typeof ChartRenderer === 'undefined') throw new Error('ChartRenderer not loaded');

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    const aspects = [{
      planet1: 'Sun',
      planet2: 'Mercury',
      type: 'Conjunction',
      angle: 0,
      orb: 5,
      x1: 300,
      y1: 200,
      x2: 400,
      y2: 200,
      p1Colour: '#ff6b6b',
      p2Colour: '#74c0fc'
    }];

    try {
      ChartRenderer.drawAspectsOnCanvas(ctx, aspects);
      ChartRenderer.drawAspectsOnCanvas(ctx, aspects, 0.5);
    } catch (e) {
      throw new Error(`drawAspectsOnCanvas threw error: ${e.message}`);
    }
  });

  function runAll() {
    if (!window.ENABLE_TESTS || !window.ENABLE_TESTS.chartRenderer) {
      return;
    }

    console.log('Running Chart Renderer Tests...\n');
    let passed = 0;
    let failed = 0;

    tests.forEach(({ name, fn }) => {
      try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
      } catch (e) {
        console.error(`✗ ${name}: ${e.message}`);
        failed++;
      }
    });

    console.log(`\nCHART RENDERER TEST RESULTS`);
    console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
    
    if (passed === tests.length) {
      console.log('\nAll tests passed.');
    }
    console.log('');

    return { passed, failed, total: tests.length };
  }

  return { tests, runAll };
})();

if (typeof window !== 'undefined') {
  window.ChartRendererTests = ChartRendererTests;
  
  window.addEventListener('DOMContentLoaded', () => {
    if (window.TestHarness) {
      TestHarness.register('Chart Renderer', ChartRendererTests, 'chartRenderer');
    }
  });
}
