# Changelog

Changes in Starmatch v2 compared with the original app (v1), now kept in
[`../v1`](../v1).

## v2 (unreleased)

Checked against Will's engine documentation in [`../engineDocs`](../engineDocs)
(ResearchOptions.txt, AspectStrengths.txt, xProfileValues.txt) and the feature
list in the main README. Every check below has a test in
[`test/engine-tests.html`](test/engine-tests.html).

### Site

- The site's main page opens v2. The original app moved to `v1/`; the old
  root links (`index.html`, `starmatch.html`, `privacy.html`) forward to v2.
- v2 has one app page, `index.html`, with the starfield background.
  `starmatch.html` forwards to it, so the app markup no longer exists in two
  copies that had to be kept in step.

### Changed

These change results, so v2 charts and comparisons differ from v1.

- **Planet and Ascendant positions are plain tropical longitudes.** v1 added
  30° to every planet, and to the Ascendant through a `+209.917` constant, so
  the engine scored each planet one sign ahead of where it is. The display
  shifted the signs back, so the chart looked right while themes, elements
  and qualities were worked out for the wrong signs.
- **Ascendant and Midheaven use the standard formulas** from local sidereal
  time, with no correction constants. v1's Midheaven was the sidereal time
  itself, up to about 2.5° out. The old constants had been tuned against an
  astro.com chart cast for astro.com's "Edinburgh" (55°57'N 3°12'W) rather
  than the app's default coordinates. With matching coordinates v2 agrees
  with that chart to within 1 arcminute.
- **xProfile is the correlation of the two 12-theme profiles**: +1 for the
  same shape, −1 for an inverted shape, 0 for balance, as xProfileValues.txt
  describes. v1 used cosine similarity, which can't go below 0 because themes
  are never negative, so complementary charts could not be shown.
- **xProfile interpretation bands follow the docs**: within ±0.2 is balance,
  ±0.8 to ±1 is extreme (v1 used ±0.7).
- **Birth times are converted with the browser's own time zone database**, so
  historical rules apply, for example the UK on UTC+1 all year in 1968 to
  1971, or France without summer time until 1976. v1 knew five regions,
  assumed summer time from March to October in all of them, and used UTC
  everywhere else.

### Fixed

Engine (`script/engine.js`):

- Element and quality emphasis bonuses go to the right signs. v1 compared the
  stored dominance indices with the wrong numbers, so quality bonuses never
  applied and fire and earth bonuses went to air and water signs.
- A tie for the most frequent aspect type means no dominant aspect. v1
  compared an aspect count with an index, so it missed real ties and
  sometimes reported ties that weren't there.
- With planet orbs selected, the ancient/modern ruler aspects for Scorpio,
  Aquarius and Pisces are counted. v1 used a loop variable left over from an
  earlier loop, so they were always skipped.
- The Moon and Ascendant aspect tests use planet orbs when those are
  selected. v1 tested with the aspect orb but scored with the planet orb, so
  an aspect inside one and outside the other could subtract from a theme.
- A planet in detriment or fall under the selected traditional factors counts
  half. v1 checked the ancient fall table and the modern *ruler* table, so it
  halved planets in signs they rule.
- Mutual reception is checked in all 12 signs (v1 skipped Aquarius and
  Pisces) and uses the selected rulers rather than always the ancient ones.
- Precession is applied once. v1 subtracted it in the app and again inside
  the engine.
- Precession for BCE births uses 360 × (year + 130) / 25772 like any other
  year. v1 used year − 130, roughly doubling the distance.
- The birth year for precession is read from the date itself. v1 parsed the
  date as UTC midnight, which gave the previous year for 1 January births
  west of Greenwich.

Chart and display:

- The chart wheel is no longer rotated 13°, so a planet on the Ascendant sits
  on the AC line and equal house cusps line up with the signs.
- The Midheaven marker no longer carries a hand-tuned 42° adjustment.
- Tooltips give sign qualities correctly (v1 showed Aries to Cancer as
  cardinal, Leo to Scorpio as fixed).
- Gold outlines mark each sign's ruler under the selected traditional
  factors, not always the modern rulers.
- Aspect lines and the aspect grid use the same orbs as the engine (v1 used a
  fixed 8° when planet orbs were selected).
- Theme differences in a comparison are coloured on the 0 to 1 scale the
  themes actually use (v1's thresholds of 2 and 5 meant everything showed
  green) and shown to two decimals.
- The Chart Mode and Starmatch Mode buttons no longer run twice per click.
- Page title typo ("Comparision").

Interface:

- Dropdown lists are readable. The selects' translucent backgrounds made the
  browser draw their option lists pale blue with near-white text; options now
  have a solid dark background.
- Dropdowns use Chrome's styleable select (Chrome and Edge 135+, Chrome on
  Android): a dark themed list with readable hover and selected rows (the
  native highlight was pale blue with white text), bold text, an accent
  arrow, and lists that open below the box. On phones a list is as wide as
  its box and long record names wrap; in the closed box they end in an
  ellipsis. Other browsers keep the dark native list.
- Zodiac signs on the chart wheels are drawn as glyphs in their element
  colours. Windows and Android showed them as purple emoji tiles.
- Notifications show their success, warning or error colour (the CSS and the
  class names never matched), fade out instead of vanishing, and sit at the
  bottom of the screen so they no longer cover the settings button.
- The settings button is a proper cog icon.
- On phones, engine settings put each label above its dropdown (selections were
  cut off), and the saved-records footer stacks its checkbox above the buttons.
- Long record names no longer push the Subject and Target pickers off the
  screen; the dropdown shortens them with an ellipsis.
- The overlay chart legend wraps one entry per line when space is tight.
- Every checkbox uses the accent colour, and the orb set that doesn't apply is
  clearly dimmed.

Security:

- Record names and fields, and location search results, are escaped before
  they are put into the page. This matters now that records can be imported
  from files.

### Added

- **Time zone picker** next to the birth data. *Auto* guesses from the
  coordinates for the UK, Ireland, Iberia, France and neighbours, the US and
  Australia; elsewhere it falls back to a whole-hour offset and says so. A
  hint shows the zone and UTC offset used for that date. The zone is saved
  with each record (`tz`).
- **Planet Orb Set** picker (Lilly / al-Biruni), saved with each record
  (`planetOrbSet`). Only the orb set that applies to the selected orb type is
  shown (aspect orb sets with aspect orbs, planet orb sets with planet orbs).
- **Alternative Modern** traditional factors in the picker (the engine
  already supported them).
- Orb set labels show their values (v1's "Tight" set was wider than the
  default for trines and squares).
- **Export and Import** of records as JSON, which the delete warning already
  promised. Imports are validated field by field, and records already saved
  (same id, or same name and birth data) are skipped.
- **`test/engine-tests.html`**: browser test page with pinned theme values for
  252 chart and setting combinations, a check for each fix, and
  `?engine=reference` to run the same checks against the original modules
  frozen in `test/reference/`. No Node or build step.

### Removed

- The old in-page test scripts (`script/test/`) and `script/self-test.js`.
  They encoded the v1 +30° shift and are replaced by `test/engine-tests.html`.
- The `ZODIAC_ROTATION_OFFSET` and `COMPARISON_ZODIAC_ROTATION_OFFSET`
  constants.

### Still to review

See [Still open](README.md#still-open) in the README: results differ from v1
throughout, the debility factor, Will's 2018 xProfile, and worldwide time
zone detection.
