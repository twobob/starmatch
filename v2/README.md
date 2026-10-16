# Starmatch v2

The current version of Starmatch: the app with every known difference from
the documented behaviour fixed. The site's main page opens it. The original
app (v1) is kept unchanged in [`../v1`](../v1) as the reference.

Everything runs in the browser: no server, no build step, no Node. Open
`index.html` (the app over the starfield background) directly, or serve the
repository with any static file server. `starmatch.html` forwards to it so
old links keep working.

## Tests

Open [`test/engine-tests.html`](test/engine-tests.html). It runs every check
in the page and lists the results:

- **Pinned values**: theme values for 6 charts across every engine setting
  (252 cases), stored in `test/fixtures/`. A change to them must be deliberate.
  Use the page's *Download fixture* button to regenerate one.
- **Engine, xProfile, astronomy, time zone and display checks**: one or more
  per fix in the [changelog](CHANGELOG.md).
- **`?engine=reference`**: runs the same checks against the original modules
  frozen in `test/reference/`. The failures there show which original
  behaviour each check catches.

## What changed from v1

See [CHANGELOG.md](CHANGELOG.md) for the full list. In short: positions are
plain tropical longitudes (v1 shifted every planet one sign), the Ascendant and
Midheaven use the standard formulas, the engine follows
[`../engineDocs/ResearchOptions.txt`](../engineDocs/ResearchOptions.txt), xProfile
reaches −1 for inverted charts, birth times use the browser's historical time
zone rules, and records can be exported and imported.

## Formulas

```
Ascendant  = atan2(cos RAMC, −(sin RAMC · cos ε + tan φ · sin ε))
Midheaven  = atan2(sin RAMC, cos RAMC · cos ε)
             RAMC = local apparent sidereal time as an angle, ε = mean obliquity
Precession = 360 × (year + 130) / 25772 degrees, subtracted from all positions
xProfile   = Σ(sᵢ − s̄)(tᵢ − t̄) / √(Σ(sᵢ − s̄)² · Σ(tᵢ − t̄)²)   over the 12 themes
```

## Record format

As v1, plus two optional fields: `planetOrbSet` (`"0"` Lilly, `"1"` al-Biruni)
and `tz` (an IANA zone such as `"Europe/London"`, or `""` to guess from the
coordinates). Older records load unchanged.

## Still open

- **Results differ from v1.** Every pinned case changed, mostly because of the
  +30° shift. Will should review some real charts before v2 replaces v1.
- **Debility factor**: v2 halves debilitated planets, as v6.2 intended. Will's
  2018 engine set this factor to 1 (no reduction).
- **Will's 2018 xProfile** (similarity and complementarity fits with a
  significance test, documented in the Starmatch-docs repository) is not ported.
- **Automatic time zones worldwide** need a time zone boundary dataset (for
  example the `tz-lookup` library); the picker covers it meanwhile.
