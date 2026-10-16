// ============================================================================
// Engine Tests
// Runs in the browser (engine-tests.html). ?engine=reference runs the same
// tests against the original modules in reference/, so failures there show
// which original behaviours each test catches.
// ============================================================================

(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const useReference = params.get('engine') === 'reference';

  const ASTRONOMY_LIB = '../script/astronomy.2.1.9.browser.min.js';
  const MODULES = useReference
    ? ['reference/constants-original.js', 'reference/zodiac-utils-original.js', 'reference/chart-renderer-original.js',
       'reference/timezone-helper-original.js', 'reference/astronomical-calculations-original.js',
       'reference/engine-v6.2-original.js', 'reference/comparison-engine-original.js']
    : ['../script/constants.js', '../script/zodiac-utils.js', '../script/chart-renderer.js',
       '../script/timezone-helper.js', '../script/astronomical-calculations.js',
       '../script/engine.js', '../script/comparison-engine.js'];
  const ENGINE_SRC = MODULES[5];
  const FIXTURE_LABEL = useReference ? 'before' : 'after';
  const FIXTURE_ENGINE = useReference
    ? 'test/reference/engine-v6.2-original.js (positions +30° as the original app fed it)'
    : 'script/engine.js';

  const { charts, settings, probes, caseId, mulberry32, lon, SIGNS, EDINBURGH_1974 } = window.StarmatchTestCases;
  const { run, withTableRow, computeAllCases, computeProbes, fixtureSource } = window.EngineHarness;

  const TOLERANCE = 1e-9;
  const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter',
                   'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const DEG = Math.PI / 180;

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

  function assertClose(actual, expected, message, tolerance = TOLERANCE) {
    if (!(Math.abs(actual - expected) <= tolerance)) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  function angleDiff(a, b) {
    return Math.abs(((a - b + 540) % 360) - 180);
  }

  function chartById(id) {
    return charts.find(c => c.id === id);
  }

  function diffRaw(runA, runB) {
    return runA.raw.map((v, i) => v - runB.raw[i]);
  }

  // Check a raw-theme difference against per-theme expectations:
  // a number means exactly that, '>=1' / '<=-1' allow the engine's "> 3" bump,
  // '>0' means any gain
  function assertThemeDiff(diff, expected, label) {
    diff.forEach((d, i) => {
      const want = expected[i];
      if (want === '>=1') {
        assert(d >= 1 - TOLERANCE, `${label}: ${SIGNS[i]} should gain at least 1, changed by ${d}`);
      } else if (want === '<=-1') {
        assert(d <= -1 + TOLERANCE, `${label}: ${SIGNS[i]} should lose at least 1, changed by ${d}`);
      } else if (want === '>0') {
        assert(d > TOLERANCE, `${label}: ${SIGNS[i]} should gain, changed by ${d}`);
      } else {
        assertClose(d, want, `${label}: ${SIGNS[i]} change`);
      }
    });
  }

  // ==========================================================================
  // Pinned values
  // ==========================================================================

  test('Pinned values', `matches the pinned "${FIXTURE_LABEL}" fixture for every chart and setting`, () => {
    const fixture = (window.STARMATCH_FIXTURES || {})[FIXTURE_LABEL];
    assert(fixture, `fixtures/engine-${FIXTURE_LABEL}.js is missing; use the Download button below to create it`);

    const actual = computeAllCases(useReference);
    const ids = Object.keys(actual);
    assert(ids.length === Object.keys(fixture.cases).length,
      `fixture has ${Object.keys(fixture.cases).length} cases, test-cases.js now produces ${ids.length}`);

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

    const probeValues = computeProbes();
    Object.keys(probeValues).forEach(id => {
      assert(fixture.probes && fixture.probes[id], `probe ${id} is not in the fixture`);
      probeValues[id].forEach((v, i) => assertClose(v, fixture.probes[id][i], `probe ${id}, ${SIGNS[i]}`));
    });
    return `${ids.length} cases, ${Object.keys(probeValues).length} probe`;
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
  // Engine: element and quality emphasis go to the right themes
  // Only the ptq lookup row changes between runs, so positions, houses and
  // aspects are identical and the difference is the emphasis bonus alone.
  // ==========================================================================

  const london = chartById('london-2000');
  const all = value => new Array(12).fill(value);

  test('Engine: emphasis bonuses', 'fire dominance rewards Aries, Leo, Sagittarius (not the air signs)', () => {
    const fire = withTableRow('ptq', 1, all(0), () => run(london, {}));
    const air = withTableRow('ptq', 1, all(2), () => run(london, {}));
    assert(fire.tfDominant[1] === 2 && air.tfDominant[1] === 4, 'setup: expected fire (2) and air (4) dominant');
    assertThemeDiff(diffRaw(fire, air), [1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0], 'fire minus air');
  });

  test('Engine: emphasis bonuses', 'earth dominance rewards Taurus, Virgo, Capricorn (not the water signs)', () => {
    const earth = withTableRow('ptq', 1, all(1), () => run(london, {}));
    const water = withTableRow('ptq', 1, all(3), () => run(london, {}));
    assert(earth.tfDominant[1] === 3 && water.tfDominant[1] === 5, 'setup: expected earth (3) and water (5) dominant');
    // Taurus, Virgo, Scorpio and Pisces get an extra point once above 3
    assertThemeDiff(diffRaw(earth, water), [0, '>=1', 0, -1, 0, '>=1', 0, '<=-1', 0, 1, 0, '<=-1'], 'earth minus water');
  });

  test('Engine: emphasis bonuses', 'cardinal dominance rewards Aries, Cancer, Libra, Capricorn', () => {
    const cardinal = withTableRow('ptq', 2, all(0), () => run(london, {}));
    const mutable = withTableRow('ptq', 2, all(2), () => run(london, {}));
    assert(cardinal.tfDominant[2] === 6 && mutable.tfDominant[2] === 8, 'setup: expected cardinal (6) and mutable (8) dominant');
    assertThemeDiff(diffRaw(cardinal, mutable), [1, 0, -1, 1, 0, '<=-1', 1, 0, -1, 1, 0, '<=-1'], 'cardinal minus mutable');
  });

  test('Engine: dominant aspect', 'a tie for the most frequent aspect type gives no dominant aspect (-1)', () => {
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
  // Engine: orbs (ResearchOptions.txt: aspect orbs and planet orbs are
  // mutually exclusive)
  // ==========================================================================

  // Only the modern ruler moves (250° = exact conjunction, 260° = no aspect);
  // everything else sits where it aspects neither position. Sagittarius is a
  // sign where none of these planets is in detriment or fall (modern factors).
  function pairChart(ancient, modern, modernLon) {
    const zone = [33, 36, 39, 42, 45, 48, 51, 54];
    const positions = [];
    for (let i = 0, z = 0; i < 10; i++) {
      if (i === ancient) positions.push(250);
      else if (i === modern) positions.push(modernLon);
      else positions.push(zone[z++]);
    }
    positions.push(180, 90);  // Ascendant, Midheaven
    return { year: 2000, positions };
  }

  [
    { label: 'Mars-Pluto adds to Scorpio', themeIndex: 7, ancient: 4, modern: 9 },
    { label: 'Saturn-Uranus adds to Aquarius', themeIndex: 10, ancient: 6, modern: 7 },
    { label: 'Jupiter-Neptune adds to Pisces', themeIndex: 11, ancient: 5, modern: 8 }
  ].forEach(pair => {
    test('Engine: orbs', `${pair.label} with planet orbs, as it does with aspect orbs`, () => {
      const conjunct = pairChart(pair.ancient, pair.modern, 250);
      const apart = pairChart(pair.ancient, pair.modern, 260);
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

  test('Engine: orbs', 'with planet orbs selected, the aspect orb sets have no effect', () => {
    const rand = mulberry32(11);
    const tiny = [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
    let compared = 0;
    for (let i = 0; i < 60; i++) {
      const chart = { year: 1980, positions: Array.from({ length: 12 }, () => rand() * 360) };
      [0, 4, 8].forEach(tfIndex => {
        const s = { orbType: 1, aoIndex: 0, tfIndex };
        const normal = run(chart, s).theme;
        const shrunk = withTableRow('ao', 0, tiny, () => run(chart, s)).theme;
        shrunk.forEach((v, k) => assertClose(v, normal[k], `chart ${i}, tfIndex ${tfIndex}, ${SIGNS[k]}`));
        compared++;
      });
    }
    return `${compared} runs`;
  });

  test('Engine: orbs', 'with aspect orbs selected, the planet orb sets have no effect', () => {
    const rand = mulberry32(12);
    const huge = new Array(10).fill(30);
    for (let i = 0; i < 60; i++) {
      const chart = { year: 1980, positions: Array.from({ length: 12 }, () => rand() * 360) };
      const s = { orbType: 0, poIndex: 0, tfIndex: 4 };
      const normal = run(chart, s).theme;
      const widened = withTableRow('po', 0, huge, () => run(chart, s)).theme;
      widened.forEach((v, k) => assertClose(v, normal[k], `chart ${i}, ${SIGNS[k]}`));
    }
  });

  // ==========================================================================
  // Engine: dignities (ResearchOptions.txt detriment and fall tables)
  // ==========================================================================

  test('Engine: dignities', 'a planet in detriment counts half (Mars in Libra, ancient factors)', () => {
    // Mars and the Sun conjunct in Libra; nothing else touches Mars-ruled themes
    const chart = { year: 1990, positions: [200, 290, 310, 130, 200.5, 20, 160, 100, 340, 70, 100, 10] };
    const ancientDetriment = window.tf[2].slice();
    const noLibraDetriment = ancientDetriment.slice();
    noLibraDetriment[6] = -1;
    const halved = run(chart, { tfIndex: 0 });
    const full = withTableRow('tf', 2, noLibraDetriment, () => run(chart, { tfIndex: 0 }));
    // Mars rules Aries and (ancient) Scorpio: only those themes change
    assertThemeDiff(diffRaw(full, halved), ['>0', 0, 0, 0, 0, 0, 0, '>0', 0, 0, 0, 0], 'full minus halved Mars');
  });

  test('Engine: dignities', 'mutual reception counts in Aquarius and Pisces too', () => {
    const probe = probes.find(p => p.id === 'mutual-reception-aquarius');
    const before = window.STARMATCH_FIXTURES && window.STARMATCH_FIXTURES.before;
    assert(before && before.probes && before.probes[probe.id], 'before fixture has no probe values');
    const raw = run(probe, probe.settings).raw;
    const diff = raw.map((v, i) => v - before.probes[probe.id][i]);
    // Saturn (ruler of Capricorn and Aquarius) in Sagittarius, Jupiter in Aquarius:
    // the Capricorn and Aquarius themes each find the reception, both credit Aquarius
    assertThemeDiff(diff, [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0], 'v2 minus original');
  });

  // ==========================================================================
  // Engine: precession (ResearchOptions.txt: 360 x (year + 130) / 25772)
  // ==========================================================================

  test('Engine: precession', 'BCE births use 360 x (year + 130) / 25772 like any other year', () => {
    const base = chartById('seeded-1');
    [-500, 1500].forEach(year => {
      const shift = 360 * (year + 130) / 25772;
      const precessed = run(Object.assign({}, base, { year }), { precessionFlag: 1 }).theme;
      const manual = run({
        year,
        positions: base.positions.map(p => ((p - shift) % 360 + 360) % 360)
      }, { precessionFlag: 0 }).theme;
      precessed.forEach((v, i) => assertClose(v, manual[i], `year ${year}, ${SIGNS[i]}`));
    });
  });

  test('Engine: precession', 'comparison charts are precessed once, for both themes and display', () => {
    const tropical = {};
    PLANETS.forEach((name, i) => { tropical[name] = EDINBURGH_1974.positions[i]; });
    const ascendant = EDINBURGH_1974.positions[10];
    const midheaven = EDINBURGH_1974.positions[11];
    const year = 1974;
    const shift = 360 * (year + 130) / 25772;
    const wrap = v => ((v % 360) + 360) % 360;

    // AstroCalc is a top-level const, so stub its methods in place rather than
    // replacing window.AstroCalc (comparison-engine.js uses the const binding)
    const calc = window.AstroCalc;
    const savedMethods = Object.assign({}, calc);
    window.PLANET_NAMES = PLANETS;
    Object.assign(calc, {
      getEclipticLongitude: name => tropical[name],
      calculateAscendant: () => ascendant,
      calculateMidheaven: () => midheaven,
      toUTC: () => new Date(Date.UTC(1974, 8, 11, 13, 14))
    });
    Object.assign(window, { orbType: 0, aoIndex: 0, poIndex: 0, tfIndex: 0, precessionFlag: 1 });

    try {
      const record = { name: 'Precession test', date: '1974-09-11', time: '14:14', lat: '55.9221', lon: '-3.1336' };
      const result = window.ComparisonEngine.calculateChartForRecord(record);
      assert(result, 'calculateChartForRecord returned null');

      PLANETS.forEach(name => {
        assertClose(result.positions[name], wrap(tropical[name] - shift), `${name} display position`);
      });

      const precessedOnce = {
        year,
        positions: PLANETS.map(name => wrap(tropical[name] - shift)).concat([wrap(ascendant - shift), wrap(midheaven - shift)])
      };
      const expected = run(precessedOnce, { precessionFlag: 0 }).theme;
      result.themes.forEach((v, i) => assertClose(v, expected[i], `${SIGNS[i]} theme`));
      return `shift ${shift.toFixed(2)}°`;
    } finally {
      Object.assign(calc, savedMethods);
    }
  });

  // ==========================================================================
  // xProfile (xProfileValues.txt: +1 same shape, 0 balance, -1 inverted shape)
  // ==========================================================================

  const xProfile = (a, b) => window.ComparisonEngine.calculateXProfileValue(a, b);

  test('xProfile', 'same shape gives +1 and an inverted shape gives -1', () => {
    const shape = [0.2, 0.9, 0.4, 1, 0.1, 0.6, 0.3, 0.8, 0.5, 0.05, 0.7, 0.35];
    assertClose(xProfile(shape, shape), 1, 'identical', 1e-12);
    assertClose(xProfile(shape, shape.map(v => 2 * v + 0.3)), 1, 'same shape, scaled and raised', 1e-12);
    assertClose(xProfile(shape, shape.map(v => 1 - v)), -1, 'inverted shape', 1e-12);
    assertClose(xProfile(shape, all(0.5)), 0, 'flat profile has no shape', 1e-12);
    const other = [0.9, 0.1, 0.5, 0.3, 1, 0.2, 0.7, 0.4, 0.6, 0.8, 0.05, 0.25];
    assertClose(xProfile(shape, other), xProfile(other, shape), 'symmetric', 1e-12);
  });

  test('xProfile', 'real chart pairs reach both the similar and the complementary side', () => {
    const rand = mulberry32(5);
    const themes = [];
    for (let i = 0; i < 40; i++) {
      const chart = { year: 1980, positions: Array.from({ length: 12 }, () => rand() * 360) };
      themes.push(run(chart, {}).theme);
    }
    let min = 1;
    let max = -1;
    for (let i = 0; i < themes.length; i++) {
      for (let j = i + 1; j < themes.length; j++) {
        const x = xProfile(themes[i], themes[j]);
        min = Math.min(min, x);
        max = Math.max(max, x);
      }
    }
    assert(min < -0.3, `most complementary pair only reached ${min.toFixed(3)}`);
    assert(max > 0.3, `most similar pair only reached ${max.toFixed(3)}`);
    return `range ${min.toFixed(2)} to ${max.toFixed(2)}`;
  });

  test('xProfile', 'interpretation bands follow the docs (±0.2 balance, ±0.8 extremes)', () => {
    [
      [0.1, 'Equality/Balance'], [-0.15, 'Equality/Balance'],
      [0.75, 'Moderate Similarity'], [0.85, 'Strong Similarity'],
      [-0.75, 'Moderate Complementarity'], [-0.85, 'Strong Complementarity']
    ].forEach(([value, type]) => {
      const result = window.ComparisonEngine.getRelationshipTypeInterpretation(value);
      assert(result.type === type, `${value} should read "${type}", got "${result.type}"`);
    });
  });

  // ==========================================================================
  // Astronomy: positions and angles
  // ==========================================================================

  // Edinburgh 1974 birth through the app's own time conversion
  function edinburghInstant() {
    const date = window.AstroCalc.toUTC('1974-09-11', '14:14', 55.9221, -3.1336);
    assert(date instanceof Date && !isNaN(date), 'toUTC failed');
    return date;
  }

  test('Astronomy', 'planet positions match the astro.com reference within 1 arcminute', () => {
    const date = edinburghInstant();
    PLANETS.forEach((name, i) => {
      const got = window.AstroCalc.getEclipticLongitude(name, date);
      const diff = angleDiff(got, EDINBURGH_1974.positions[i]) * 60;
      assert(diff < 1, `${name} is ${diff.toFixed(2)}' from the reference`);
    });
  });

  test('Astronomy', 'Ascendant and Midheaven match the astro.com reference within 1.5 arcminutes', () => {
    // The reference angles were cast for astro.com's "Edinburgh" (55°57'N 3°12'W),
    // not the app's default 55.9221, -3.1336 (about 4' further east)
    const latitude = 55 + 57 / 60;
    const longitude = -(3 + 12 / 60);
    const date = edinburghInstant();
    const asc = window.AstroCalc.calculateAscendant(date, latitude, longitude);
    const mc = window.AstroCalc.calculateMidheaven(date, longitude);
    const ascDiff = angleDiff(asc, EDINBURGH_1974.positions[10]) * 60;
    const mcDiff = angleDiff(mc, EDINBURGH_1974.positions[11]) * 60;
    assert(ascDiff < 1.5, `Ascendant ${asc.toFixed(3)}° is ${ascDiff.toFixed(1)}' from Sagittarius 3°16'02"`);
    assert(mcDiff < 1.5, `Midheaven ${mc.toFixed(3)}° is ${mcDiff.toFixed(1)}' from Libra 5°57'`);
    return `Asc ${ascDiff.toFixed(2)}', MC ${mcDiff.toFixed(2)}' off`;
  });

  // Independent check with Astronomy Engine's own horizon transform: the
  // Ascendant point must sit on the eastern horizon, the MC on the meridian
  function eclipticToHorizon(longitude, date, latitude, geoLongitude) {
    const T = ((date.getTime() / 86400000 + 2440587.5) - 2451545.0) / 36525.0;
    const eps = (23.439292 - 0.0130042 * T) * DEG;
    const l = longitude * DEG;
    const ra = Math.atan2(Math.cos(eps) * Math.sin(l), Math.cos(l)) / DEG;
    const dec = Math.asin(Math.sin(eps) * Math.sin(l)) / DEG;
    const observer = new Astronomy.Observer(latitude, geoLongitude, 0);
    return Astronomy.Horizon(Astronomy.MakeTime(date), observer, ((ra + 360) % 360) / 15, dec, null);
  }

  test('Astronomy', 'the Ascendant rises in the east and the MC culminates, anywhere and any time', () => {
    const rand = mulberry32(3);
    for (let i = 0; i < 40; i++) {
      const date = new Date(Date.UTC(1900, 0, 1) + rand() * 150 * 365.25 * 86400000);
      const latitude = -60 + rand() * 120;
      const longitude = -180 + rand() * 360;
      const asc = window.AstroCalc.calculateAscendant(date, latitude, longitude);
      const mc = window.AstroCalc.calculateMidheaven(date, longitude);
      const ascHor = eclipticToHorizon(asc, date, latitude, longitude);
      const mcHor = eclipticToHorizon(mc, date, latitude, longitude);
      const where = `case ${i} (${latitude.toFixed(1)}, ${longitude.toFixed(1)}, ${date.toISOString().slice(0, 16)})`;
      assert(Math.abs(ascHor.altitude) < 0.05, `${where}: Ascendant altitude ${ascHor.altitude.toFixed(3)}°`);
      assert(ascHor.azimuth > 0 && ascHor.azimuth < 180, `${where}: Ascendant azimuth ${ascHor.azimuth.toFixed(1)}° is not east`);
      const meridian = Math.min(angleDiff(mcHor.azimuth, 180), angleDiff(mcHor.azimuth, 0));
      assert(meridian < 0.05 || Math.abs(mcHor.altitude) > 89.9, `${where}: MC azimuth ${mcHor.azimuth.toFixed(3)}° is off the meridian`);
      assert(mcHor.altitude > 0, `${where}: MC is below the horizon`);
    }
    return '40 places and times';
  });

  // ==========================================================================
  // Time zones
  // ==========================================================================

  function utcOf(date, time, latitude, longitude, zone) {
    const d = window.AstroCalc.toUTC(date, time, latitude, longitude, zone);
    assert(d instanceof Date && !isNaN(d), `no UTC time for ${date} ${time}`);
    return d.toISOString().slice(0, 16);
  }

  [
    ['Edinburgh in British Summer Time', ['1974-09-11', '14:14', 55.9221, -3.1336], '1974-09-11T13:14'],
    ['London in January 1970 (British Standard Time, UTC+1 all year)', ['1970-01-15', '12:00', 51.5074, -0.1278], '1970-01-15T11:00'],
    ['London on 10 March 1990 (summer time not yet started)', ['1990-03-10', '12:00', 51.5074, -0.1278], '1990-03-10T12:00'],
    ['Paris in July 1975 (France had no summer time until 1976)', ['1975-07-01', '12:00', 48.8566, 2.3522], '1975-07-01T11:00'],
    ['Perth, Western Australia (UTC+8, no summer time)', ['2000-01-01', '12:00', -31.9505, 115.8605], '2000-01-01T04:00'],
    ['New York in July', ['1990-07-04', '12:00', 40.7128, -74.006], '1990-07-04T16:00'],
    ['a chosen zone overrides the guess', ['1990-07-04', '12:00', 51.5074, -0.1278, 'America/New_York'], '1990-07-04T16:00']
  ].forEach(([label, args, expected]) => {
    test('Time zones', label, () => {
      const got = utcOf(...args);
      assert(got === expected, `expected ${expected}Z, got ${got}Z`);
    });
  });

  test('Time zones', 'places outside the known regions get a flagged whole-hour guess', () => {
    const result = window.TimezoneHelper.localToUTC('2000-01-01', '12:00', 35.6762, 139.6503);
    assert(result && result.tzInfo, 'no conversion');
    assert(result.tzInfo.approximate === true, 'guess for Tokyo should be flagged approximate');
    assert(result.utcDate.toISOString().slice(0, 16) === '2000-01-01T03:00', `got ${result.utcDate.toISOString()}`);
  });

  // ==========================================================================
  // Display helpers
  // ==========================================================================

  test('Display', 'sign lookup is plain tropical (0° Aries to 30° Taurus)', () => {
    [[0, 0], [29.99, 0], [30, 1], [180, 6], [359.99, 11], [-1, 11]].forEach(([longitude, sign]) => {
      const got = window.ZodiacUtils.getSignIndexFromLongitude(longitude);
      assert(got === sign, `${longitude}° should be ${SIGNS[sign]}, got ${SIGNS[got]}`);
    });
  });

  test('Display', 'a planet on the Ascendant is drawn on the AC line (9 o\'clock)', () => {
    [0, 123.4, 359].forEach(asc => {
      assertClose(window.ChartRenderer.longitudeToCanvasAngle(asc, asc), Math.PI, `Ascendant ${asc}°`, 1e-12);
    });
  });

  test('Display', 'sign qualities and rulers follow the engine tables', () => {
    assert(typeof window.ZodiacUtils.getSignQuality === 'function', 'no getSignQuality helper');
    ['Cardinal', 'Fixed', 'Mutable', 'Cardinal'].forEach((quality, i) => {
      assert(window.ZodiacUtils.getSignQuality(i) === quality, `${SIGNS[i]} should be ${quality}`);
    });
    const savedTf = window.tfIndex;
    try {
      window.tfIndex = 0;
      assert(window.ZodiacUtils.getSignRuler(7) === 'Mars', 'ancient ruler of Scorpio should be Mars');
      window.tfIndex = 4;
      assert(window.ZodiacUtils.getSignRuler(7) === 'Pluto', 'modern ruler of Scorpio should be Pluto');
    } finally {
      window.tfIndex = savedTf;
    }
  });

  // ==========================================================================
  // Before vs after report (fixture data only)
  // ==========================================================================

  function renderComparison() {
    const fixtures = window.STARMATCH_FIXTURES || {};
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
      <p>Same birth data through the original app (positions +30°, original engine) and v2:
      ${changed} of ${total} pinned cases changed; the largest single theme change is ${largest.toFixed(3)}
      (themes are scaled so the strongest is 1).</p>
      <table>
        <thead><tr><th>Settings</th><th>Cases changed</th><th>Largest change</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    document.getElementById('diff-section').hidden = false;
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
    summary.textContent = `${passed} of ${results.length} tests passed` +
      (useReference ? ' (original modules: failures show the original behaviour each test catches)' : '');
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
    const source = fixtureSource(FIXTURE_LABEL, FIXTURE_ENGINE, computeAllCases(useReference), computeProbes());
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
    switchLink.textContent = useReference ? 'Run against v2' : 'Run against the original modules';
    document.getElementById('fixture-name').textContent = `engine-${FIXTURE_LABEL}.js`;
    document.getElementById('download').addEventListener('click', downloadFixture);

    try {
      await window.EngineHarness.loadScript(ASTRONOMY_LIB);
      window.astronomyEngineReady = true;
      for (const src of MODULES) {
        await window.EngineHarness.loadScript(src);
      }
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
