// ============================================================================
// Engine Test Cases
// Charts and engine settings shared by engine-tests.html and its fixtures.
// Plain browser script: no build step, no Node, works from file:// as well.
// ============================================================================

(function (root) {
  'use strict';

  // Deterministic PRNG (mulberry32) so the "seeded" charts are identical
  // in every browser and every run
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  // Tropical longitude from sign + d/m/s
  function lon(sign, d, m, s) {
    return SIGNS.indexOf(sign) * 30 + d + m / 60 + s / 3600;
  }

  // The app adds 30° to planets (and, via its +209.917 constant, the Ascendant)
  // before calling the engine; the Midheaven is passed unshifted.
  function appShift(longitude) {
    return (longitude + 30) % 360;
  }

  // Engine argument order: Sun..Pluto, Ascendant, Midheaven
  const charts = [
    {
      id: 'edinburgh-1974',
      year: 1974,
      note: 'self-test.js reference chart (1974-09-11 14:14 BST, Edinburgh), with the app shift',
      positions: [
        appShift(lon('Virgo', 18, 25, 15)),
        appShift(lon('Cancer', 15, 4, 42)),
        appShift(lon('Libra', 8, 13, 58)),
        appShift(lon('Virgo', 3, 51, 5)),
        appShift(lon('Virgo', 29, 11, 41)),
        appShift(lon('Pisces', 12, 7, 39)),
        appShift(lon('Cancer', 16, 42, 1)),
        appShift(lon('Libra', 25, 44, 3)),
        appShift(lon('Sagittarius', 6, 59, 41)),
        appShift(lon('Libra', 5, 59, 1)),
        appShift(lon('Sagittarius', 3, 16, 2)),
        lon('Libra', 5, 57, 0)
      ]
    },
    {
      id: 'london-2000',
      year: 2000,
      note: 'comparison-engine.test.js integration record (2000-01-01 12:00, London), already shifted',
      positions: [310.3686, 253.3239, 301.8889, 271.5652, 357.9639, 55.2542,
                  70.3961, 344.8061, 333.1954, 281.4547, 53.9338, 280.3328]
    }
  ];

  const rand = mulberry32(18);
  for (let i = 1; i <= 4; i++) {
    const positions = [];
    for (let j = 0; j < 12; j++) {
      positions.push(Math.round(rand() * 360 * 1e4) / 1e4);
    }
    charts.push({
      id: 'seeded-' + i,
      year: 1900 + Math.floor(rand() * 126),
      note: 'mulberry32(18) random chart',
      positions
    });
  }

  // Every engine option the UI or engine supports:
  // aspect orbs (5 sets) and planet orbs (Lilly, al-Biruni), each with
  // ancient/modern/alternative-modern factors, with and without precession
  const settings = [];
  [0, 4, 8].forEach(tfIndex => {
    [0, 1].forEach(precessionFlag => {
      for (let aoIndex = 0; aoIndex < 5; aoIndex++) {
        settings.push({ orbType: 0, aoIndex, poIndex: 0, tfIndex, precessionFlag });
      }
      for (let poIndex = 0; poIndex < 2; poIndex++) {
        settings.push({ orbType: 1, aoIndex: 0, poIndex, tfIndex, precessionFlag });
      }
    });
  });

  function settingsId(s) {
    return `ot${s.orbType}-ao${s.aoIndex}-po${s.poIndex}-tf${s.tfIndex}-pr${s.precessionFlag}`;
  }

  function caseId(chart, s) {
    return chart.id + '|' + settingsId(s);
  }

  root.StarmatchTestCases = {
    SIGNS,
    mulberry32,
    lon,
    appShift,
    charts,
    settings,
    settingsId,
    caseId
  };
})(typeof window !== 'undefined' ? window : globalThis);
