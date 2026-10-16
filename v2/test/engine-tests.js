// ============================================================================
// Engine Tests
// Runs in the browser (engine-tests.html). ?engine=reference runs the same
// tests against the original v6.2 engine, to show which ones catch its bugs.
// ============================================================================

(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const useReference = params.get('engine') === 'reference';
  const ENGINE_SRC = useReference ? 'reference/engine-v6.2-original.js' : '../script/engine.js';
  const COMPARISON_SRC = useReference ? 'reference/comparison-engine-original.js' : '../script/comparison-engine.js';
  const FIXTURE_LABEL = useReference ? 'before' : 'after';
  const FIXTURE_ENGINE = useReference ? 'test/reference/engine-v6.2-original.js' : 'script/engine.js';

  const { charts, settings, caseId, mulberry32, lon, appShift } = window.StarmatchTestCases;
  const { run, withTableRow, computeAllCases, fixtureSource } = window.EngineHarness;

  const TOLERANCE = 1e-9;
  const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter',
                   'Saturn', 'Uranus', 'Neptune', 'Pluto'];

  // ==========================================================================
  // Minimal test runner
  // ==========================================================================

  const tests = [];

  function test(group, name, fn) {
    tests.push({ group, name, fn });
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function assertClose(actual, expected, message) {
    if (!(Math.abs(actual - expected) <= TOLERANCE)) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  function chartById(id) {
    return charts.find(c => c.id === id);
  }

  function diffRaw(runA, runB) {
    return runA.raw.map((v, i) => v - runB.raw[i]);
  }

  // Check a raw-theme difference against per-theme expectations:
  // a number means exactly that, '>=1' / '<=-1' allow the engine's "> 3" bump
  function assertThemeDiff(diff, expected, label) {
    diff.forEach((d, i) => {
      const want = expected[i];
      const sign = window.StarmatchTestCases.SIGNS[i];
      if (want === '>=1') {
        assert(d >= 1 - TOLERANCE, `${label}: ${sign} should gain at least 1, changed by ${d}`);
      } else if (want === '<=-1') {
        assert(d <= -1 + TOLERANCE, `${label}: ${sign} should lose at least 1, changed by ${d}`);
      } else {
        assertClose(d, want, `${label}: ${sign} change`);
      }
    });
  }

  // ==========================================================================
  // Pinned values
  // ==========================================================================

  test('Pinned values', `matches the pinned "${FIXTURE_LABEL}" fixture for every chart and setting`, () => {
    const fixture = (window.STARMATCH_FIXTURES || {})[FIXTURE_LABEL];
    assert(fixture, `fixtures/engine-${FIXTURE_LABEL}.js is missing; use the Download button below to create it`);

    const actual = computeAllCases();
    const ids = Object.keys(actual);
    const pinnedIds = Object.keys(fixture.cases);
    assert(ids.length === pinnedIds.length,
      `fixture has ${pinnedIds.length} cases, test-cases.js now produces ${ids.length}`);

    const mismatches = [];
    ids.forEach(id => {
      const pinned = fixture.cases[id];
      if (!pinned) {
        mismatches.push(`${id} (not in fixture)`);
        return;
      }
      const worst = Math.max(...actual[id].map((v, i) => Math.abs(v - pinned[i])));
      if (!(worst <= TOLERANCE)) mismatches.push(`${id} (max change ${worst.toFixed(6)})`);
    });

    assert(mismatches.length === 0,
      `${mismatches.length} of ${ids.length} cases differ, e.g. ${mismatches.slice(0, 3).join('; ')}`);
    return `${ids.length} cases`;
  });

  // ==========================================================================
  // Sanity
  // ==========================================================================

  test('Sanity', 'themes are 12 finite values in [0, 1] with a maximum of exactly 1', () => {
    charts.forEach(chart => {
      settings.forEach(s => {
        const { theme } = run(chart, s);
        const id = caseId(chart, s);
        assert(theme.length === 12, `${id}: ${theme.length} themes`);
        assert(theme.every(v => Number.isFinite(v) && v >= 0 && v <= 1), `${id}: value outside [0, 1]`);
        assertClose(Math.max(...theme), 1, `${id}: maximum theme`);
      });
    });
  });

  test('Sanity', 'repeat runs give identical results (no state leaks between charts)', () => {
    const [first, second] = charts;
    const s = { tfIndex: 4, orbType: 1, precessionFlag: 1 };
    const before = run(first, s).theme;
    run(second, { aoIndex: 4 });
    const after = run(first, s).theme;
    after.forEach((v, i) => assertClose(v, before[i], `theme ${i + 1}`));
  });

  // ==========================================================================
  // Fix 1: element and quality emphasis go to the right themes
  // The run-to-run difference isolates the bonus: only the ptq lookup row
  // changes, so positions, houses and aspects are identical in both runs.
  // ==========================================================================

  const london = chartById('london-2000');
  const all = value => new Array(12).fill(value);

  test('Fix 1: element/quality emphasis', 'fire dominance rewards Aries, Leo, Sagittarius (not the air signs)', () => {
    const fire = withTableRow('ptq', 1, all(0), () => run(london, {}));
    const air = withTableRow('ptq', 1, all(2), () => run(london, {}));
    assert(fire.tfDominant[1] === 2 && air.tfDominant[1] === 4, 'setup: expected fire (2) and air (4) dominant');
    assertThemeDiff(diffRaw(fire, air), [1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0], 'fire minus air');
  });

  test('Fix 1: element/quality emphasis', 'earth dominance rewards Taurus, Virgo, Capricorn (not the water signs)', () => {
    const earth = withTableRow('ptq', 1, all(1), () => run(london, {}));
    const water = withTableRow('ptq', 1, all(3), () => run(london, {}));
    assert(earth.tfDominant[1] === 3 && water.tfDominant[1] === 5, 'setup: expected earth (3) and water (5) dominant');
    // Taurus, Virgo, Scorpio and Pisces get an extra point once above 3
    assertThemeDiff(diffRaw(earth, water), [0, '>=1', 0, -1, 0, '>=1', 0, '<=-1', 0, 1, 0, '<=-1'], 'earth minus water');
  });

  test('Fix 1: element/quality emphasis', 'cardinal dominance rewards Aries, Cancer, Libra, Capricorn', () => {
    const cardinal = withTableRow('ptq', 2, all(0), () => run(london, {}));
    const mutable = withTableRow('ptq', 2, all(2), () => run(london, {}));
    assert(cardinal.tfDominant[2] === 6 && mutable.tfDominant[2] === 8, 'setup: expected cardinal (6) and mutable (8) dominant');
    assertThemeDiff(diffRaw(cardinal, mutable), [1, 0, -1, 1, 0, '<=-1', 1, 0, -1, 1, 0, '<=-1'], 'cardinal minus mutable');
  });

  // ==========================================================================
  // Fix 2: a tie for the most frequent aspect means no dominant aspect
  // ==========================================================================

  test('Fix 2: dominant aspect', 'a tie for the most frequent aspect type gives no dominant aspect (-1)', () => {
    const rand = mulberry32(7);
    let ties = 0;
    let checked = 0;
    for (let i = 0; i < 400; i++) {
      const chart = { year: 1990, positions: Array.from({ length: 12 }, () => rand() * 360) };
      [0, 1].forEach(orbType => {
        const result = run(chart, { orbType });
        const counts = result.numAspects;
        const max = Math.max(...counts);
        const leaders = counts.filter(c => c === max).length;
        const expected = leaders === 1 ? counts.indexOf(max) : -1;
        if (leaders > 1) ties++;
        checked++;
        assert(result.dominantAspect === expected,
          `chart ${i}, orbType ${orbType}: counts [${counts}] should give ${expected}, engine gave ${result.dominantAspect}`);
      });
    }
    assert(ties > 0, 'setup: no ties generated, test proves nothing');
    return `${checked} charts, ${ties} with ties`;
  });

  // ==========================================================================
  // Fix 3: planet orbs include the ancient/modern ruler aspect (themes 8, 11, 12)
  // Only the modern ruler moves (70° = exact conjunction, 80° = no aspect);
  // everything else sits where it aspects neither position.
  // ==========================================================================

  function pairChart(ancient, modern, modernLon) {
    const zone = [213, 216, 219, 222, 225, 228, 231, 234];
    const positions = [];
    for (let i = 0, z = 0; i < 10; i++) {
      if (i === ancient) positions.push(70);
      else if (i === modern) positions.push(modernLon);
      else positions.push(zone[z++]);
    }
    positions.push(0, 270);  // Ascendant, Midheaven
    return { year: 2000, positions };
  }

  [
    { label: 'Mars-Pluto adds to Scorpio', themeIndex: 7, ancient: 4, modern: 9 },
    { label: 'Saturn-Uranus adds to Aquarius', themeIndex: 10, ancient: 6, modern: 7 },
    { label: 'Jupiter-Neptune adds to Pisces', themeIndex: 11, ancient: 5, modern: 8 }
  ].forEach(pair => {
    test('Fix 3: planet orbs', `${pair.label} with planet orbs, as it does with aspect orbs`, () => {
      const conjunct = pairChart(pair.ancient, pair.modern, 70);
      const apart = pairChart(pair.ancient, pair.modern, 80);
      [
        { orbType: 0, tfIndex: 4 },
        { orbType: 1, tfIndex: 4, poIndex: 0 },
        { orbType: 1, tfIndex: 4, poIndex: 1 }
      ].forEach(s => {
        const label = `orbType ${s.orbType}${s.orbType ? ', poIndex ' + s.poIndex : ''}`;
        const withAspect = run(conjunct, s);
        const without = run(apart, s);
        assert(withAspect.dominantAspect === without.dominantAspect, `setup (${label}): dominant aspect changed`);
        const expected = new Array(12).fill(0);
        expected[pair.themeIndex] = 1;  // exact conjunction: strength 1 x factor 1, neither planet debilitated
        assertThemeDiff(diffRaw(withAspect, without), expected, label);
      });
    });
  });

  // ==========================================================================
  // Fix 4: precession is applied once (comparison-engine.js + engine.js)
  // ==========================================================================

  test('Fix 4: precession', 'comparison charts are precessed once, for both themes and display', () => {
    const tropical = {
      Sun: lon('Virgo', 18, 25, 15), Moon: lon('Cancer', 15, 4, 42), Mercury: lon('Libra', 8, 13, 58),
      Venus: lon('Virgo', 3, 51, 5), Mars: lon('Virgo', 29, 11, 41), Jupiter: lon('Pisces', 12, 7, 39),
      Saturn: lon('Cancer', 16, 42, 1), Uranus: lon('Libra', 25, 44, 3), Neptune: lon('Sagittarius', 6, 59, 41),
      Pluto: lon('Libra', 5, 59, 1)
    };
    const ascendant = appShift(lon('Sagittarius', 3, 16, 2));  // AstroCalc returns the shifted Ascendant
    const midheaven = lon('Libra', 5, 57, 0);
    const year = 1974;
    const shift = 360 * (year + 130) / 25772;
    const wrap = v => ((v % 360) + 360) % 360;

    window.PLANET_NAMES = PLANETS;
    window.AstroCalc = {
      getEclipticLongitude: name => tropical[name],
      calculateAscendant: () => ascendant,
      calculateMidheaven: () => midheaven,
      toUTC: () => new Date(Date.UTC(1974, 8, 11, 13, 14))
    };
    Object.assign(window, { orbType: 0, aoIndex: 0, poIndex: 0, tfIndex: 0, precessionFlag: 1 });

    const record = { name: 'Precession test', date: '1974-09-11', time: '14:14', lat: '55.9221', lon: '-3.1336' };
    const result = window.ComparisonEngine.calculateChartForRecord(record);
    assert(result, 'calculateChartForRecord returned null');

    // Display: shifted once
    PLANETS.forEach(name => {
      assertClose(result.positions[name], wrap(appShift(tropical[name]) - shift), `${name} display position`);
    });

    // Themes: same as the engine given positions precessed once, precession off
    const precessedOnce = {
      year,
      positions: PLANETS.map(name => wrap(appShift(tropical[name]) - shift))
        .concat([wrap(ascendant - shift), wrap(midheaven - shift)])
    };
    const expected = run(precessedOnce, { precessionFlag: 0 }).theme;
    result.themes.forEach((v, i) => assertClose(v, expected[i], `${window.StarmatchTestCases.SIGNS[i]} theme`));
    return `shift ${shift.toFixed(2)}°`;
  });

  // ==========================================================================
  // Before vs after report (fixture data only)
  // ==========================================================================

  function renderComparison() {
    const fixtures = window.STARMATCH_FIXTURES || {};
    const section = document.getElementById('diff-section');
    if (!fixtures.before || !fixtures.after) return;

    const groups = new Map();
    let changed = 0;
    let total = 0;
    let largest = 0;
    Object.keys(fixtures.before.cases).forEach(id => {
      const before = fixtures.before.cases[id];
      const after = fixtures.after.cases[id];
      if (!after) return;
      const worst = Math.max(...before.map((v, i) => Math.abs(v - after[i])));
      const s = id.split('|')[1];
      const key = (s.includes('ot0') ? 'Aspect orbs' : 'Planet orbs') + ', ' +
        ({ tf0: 'ancient', tf4: 'modern', tf8: 'alternative modern' })[s.match(/tf\d/)[0]];
      const g = groups.get(key) || { changed: 0, total: 0, largest: 0 };
      g.total++;
      total++;
      if (worst > TOLERANCE) {
        g.changed++;
        changed++;
      }
      g.largest = Math.max(g.largest, worst);
      largest = Math.max(largest, worst);
      groups.set(key, g);
    });

    const rows = [...groups.entries()].map(([key, g]) =>
      `<tr><td>${key}</td><td>${g.changed} / ${g.total}</td><td>${g.largest.toFixed(3)}</td></tr>`).join('');
    document.getElementById('diff').innerHTML = `
      <p>${changed} of ${total} pinned cases changed; the largest single theme change is ${largest.toFixed(3)}
      (themes are scaled so the strongest is 1). The precession fix is in the callers, not engine.js,
      so it shows in the Fix 4 test rather than here.</p>
      <table>
        <thead><tr><th>Settings</th><th>Cases changed</th><th>Largest change</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    section.hidden = false;
  }

  // ==========================================================================
  // Page
  // ==========================================================================

  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  function renderResults(results) {
    const passed = results.filter(r => r.ok).length;
    const summary = document.getElementById('summary');
    summary.textContent = `${passed} of ${results.length} tests passed`;
    summary.className = 'summary ' + (passed === results.length ? 'pass' : 'fail');
    document.title = `${passed}/${results.length} - Starmatch engine tests`;

    let html = '';
    let group = null;
    results.forEach(r => {
      if (r.group !== group) {
        if (group !== null) html += '</ul>';
        group = r.group;
        html += `<h2>${escapeHtml(group)}</h2><ul class="tests">`;
      }
      html += `<li class="${r.ok ? 'pass' : 'fail'}">
        <span class="mark">${r.ok ? '✓' : '✗'}</span>
        <span class="name">${escapeHtml(r.name)}${r.note ? ` <span class="note">(${escapeHtml(r.note)})</span>` : ''}</span>
        ${r.ok ? '' : `<div class="error">${escapeHtml(r.error)}</div>`}
      </li>`;
    });
    html += '</ul>';
    document.getElementById('results').innerHTML = html;
  }

  function downloadFixture() {
    const source = fixtureSource(FIXTURE_LABEL, FIXTURE_ENGINE, computeAllCases());
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    link.download = `engine-${FIXTURE_LABEL}.js`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function main() {
    document.getElementById('engine-src').textContent = ENGINE_SRC;
    const switchLink = document.getElementById('switch-link');
    switchLink.href = useReference ? '?' : '?engine=reference';
    switchLink.textContent = useReference ? 'Run against the v2 engine' : 'Run against the original v6.2 engine';
    document.getElementById('fixture-name').textContent = `engine-${FIXTURE_LABEL}.js`;
    document.getElementById('download').addEventListener('click', downloadFixture);

    try {
      await window.EngineHarness.loadScript(ENGINE_SRC);
      await window.EngineHarness.loadScript(COMPARISON_SRC);
    } catch (e) {
      document.getElementById('summary').textContent = e.message;
      document.getElementById('summary').className = 'summary fail';
      return;
    }

    const results = tests.map(t => {
      try {
        const note = t.fn();
        return { group: t.group, name: t.name, ok: true, note };
      } catch (e) {
        return { group: t.group, name: t.name, ok: false, error: e.message };
      }
    });

    renderResults(results);
    renderComparison();
    window.STARMATCH_TEST_RESULTS = results;
  }

  main();
})();
