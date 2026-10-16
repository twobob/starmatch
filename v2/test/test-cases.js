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

  // The original app added 30° to the planets and (via its +209.917 constant)
  // the Ascendant before calling the engine; the Midheaven was passed as is.
  // Used to feed the original engine the way the original app did.
  function appShift(positions) {
    return positions.map((p, i) => (i < 11 ? (p + 30) % 360 : p));
  }

  // Engine argument order: Sun..Pluto, Ascendant, Midheaven (tropical degrees)
  const EDINBURGH_1974 = {
    id: 'edinburgh-1974',
    year: 1974,
    // Planets are geocentric so the exact birthplace barely matters; the Ascendant and
    // Midheaven were cast for astro.com's "Edinburgh" (55°57'N 3°12'W)
    note: '1974-09-11 14:14 BST, Edinburgh (astro.com reference values)',
    positions: [
      lon('Virgo', 18, 25, 15),
      lon('Cancer', 15, 4, 42),
      lon('Libra', 8, 13, 58),
      lon('Virgo', 3, 51, 5),
      lon('Virgo', 29, 11, 41),
      lon('Pisces', 12, 7, 39),
      lon('Cancer', 16, 42, 1),
      lon('Libra', 25, 44, 3),
      lon('Sagittarius', 6, 59, 41),
      lon('Libra', 5, 59, 1),
      lon('Sagittarius', 3, 16, 2),
      lon('Libra', 5, 57, 0)
    ]
  };

  const charts = [
    EDINBURGH_1974,
    {
      id: 'london-2000',
      year: 2000,
      note: '2000-01-01 12:00 GMT, London',
      positions: [280.3686, 223.3239, 271.8889, 241.5652, 327.9639, 25.2542,
                  40.3961, 314.8061, 303.1954, 251.4547, 23.9338, 280.3328]
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

  // Charts for single-rule checks, pinned with raw (unscaled) theme totals in
  // the "before" fixture so v2 can be compared with the original engine
  const probes = [
    {
      id: 'mutual-reception-aquarius',
      year: 1990,
      note: 'Saturn in Sagittarius, Jupiter in Aquarius (ancient rulers): mutual reception via Aquarius',
      settings: { tfIndex: 0 },
      // Found by search so that no other v2 fix applies (no debilitated planet under
      // either rule, no element or quality dominance, same dominant aspect)
      positions: [255.1, 328.6, 4.4, 298.9, 213.3, 310.8, 268.3, 18.6, 69.5, 170.8, 201.3, 169.6]
    }
  ];

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
    EDINBURGH_1974,
    charts,
    settings,
    probes,
    settingsId,
    caseId
  };
})(typeof window !== 'undefined' ? window : globalThis);
