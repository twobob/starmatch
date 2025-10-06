# Starmatch Testing & Validation

## Current Status

The testing infrastructure has been archived. The project now uses the **Astronomy Engine** library for planetary calculations, which provides built-in validation and accuracy guarantees.

## Available Test Utilities

### Zodiac Converter

**File:** `zodiac_converter.js`

Convert between zodiac notation and decimal degrees:

```powershell
# Convert zodiac to degrees
node testing/zodiac_converter.js "8°♈11'15"    # Returns: 8.1875°

# Convert degrees to zodiac  
node testing/zodiac_converter.js 158.65         # Returns: 8°♍39'0"
```

**Purpose:** Helper tool for manual validation of planetary positions against Swiss Ephemeris or other reference data.

### Reference Data

**File:** `seprember1974.png`

Swiss Ephemeris planetary positions for September 1974, used for manual accuracy verification.

## Live Application Testing

### Keyboard Shortcuts

**Quick Testing Shortcuts:**

- **`0` (Numpad or regular)**: Auto-load first two saved records and run comparison
  - Automatically switches to Starmatch Mode
  - Loads records[0] as Subject, records[1] as Target
  - Automatically clicks "Compare Charts"
  - Perfect for rapid testing during development!

**Requirements:** At least 2 saved records must exist. If fewer than 2 records are saved, you'll see a warning toast.

**Example workflow:**
1. Save 2+ charts in Chart Mode
2. Press `0` anywhere on the page
3. Comparison results appear instantly

### Starmatch (Astronomy Engine)

**File:** `starmatch.html`

**What to test:**
1. Open `starmatch.html` in a modern browser
2. Verify Astronomy Engine loads successfully (toast notification appears)
3. Test planetary calculations:
   - Enter birth date: `1974-09-11`, time: `14:14`, location: `55.9221, -3.1336`
   - Click **Calculate Chart**
   - Verify positions match expected values for that date/time
4. Test location lookup:
   - Click 🔍 button
   - Search for "Edinburgh, UK"
   - Verify lat/lon auto-fills correctly
5. Test record storage:
   - Click **Save** to store chart
   - Reload page and click **Load** to verify persistence
6. Test Starmatch comparison (requires 2+ saved records):
   - Switch to **Starmatch Mode**
   - Select two different charts
   - Click **Compare Charts**
   - Verify xProfile calculation and theme comparison displays

**Expected Accuracy:**
- Astronomy Engine uses VSOP87 theory with sub-arcsecond precision
- Valid for dates 1800-2100+ (with degrading accuracy outside ±2000 years)
- Includes aberration, nutation, and other corrections

**Browser Console Checks:**
```javascript
// After calculating a chart, verify in console:
console.log(chartData.positions);  // Should show all 10 planetary positions
console.log(chartData.ascendant);  // Should be 0-360°
console.log(theme);                // Should show 12 theme values
```

### Visual Validation

**Chart Wheel:**
-  12 zodiac signs displayed in correct order
-  Planets positioned at correct angles
-   Ascendant line marked in yellow/orange
-  Aspects drawn between planets
-  Hover tooltips show planet names, signs, degrees

**Theme Bars:**
-  12 bars for each zodiac sign
-  Relative heights reflect thematic emphasis
-  Values update when chart is recalculated

**Aspects:**
-  Conjunction (0°), Opposition (180°), Trine (120°), Square (90°), Sextile (60°)
-  Aspect counts match visual lines on chart
-  Orb settings affect which aspects are detected

## Manual Validation Against Reference Data

To verify accuracy against Swiss Ephemeris or other sources:

1. Use a date from `seprember1974.png` reference image
2. Calculate chart in Starmatch
3. Compare planetary longitudes using `zodiac_converter.js`
4. Expected differences:
   - Sun: < 0.1° (very accurate)
   - Moon: < 0.5° (faster motion, slight timing differences)
   - Planets: < 0.2° (high accuracy)

Example validation for 1974-09-11 00:00 UT:
```
Swiss Eph → Starmatch conversion:
Sun: 17°♍52' → 17.87° Virgo → 157.87° absolute
Moon: 1°♐28' → 1.47° Sagittarius → 241.47° absolute
(Convert using zodiac_converter.js and compare to Starmatch output)
```

## Comparison Mode Testing

**xProfile Validation:**

The xProfile value ranges from -1 (inverted themes) to +1 (similar themes):

```
xProfile = (Σ subject[i] × target[i]) / √(Σ subject[i]² × Σ target[i]²)
```

**Test cases:**
1. **Same chart vs itself:** Should return xProfile ≈ 1.0
2. **Daytime vs nighttime chart (6hr apart):** Should return xProfile ≈ 0.0-0.3 (ASC shifted ~90°)
3. **Opposite season (6mo apart):** Should return xProfile ≈ -0.3 to 0.0 (Sun in opposite sign)

**Relationship categories:**
- `xProfile > 0.7`: Very Similar
- `0.3 to 0.7`: Similar
- `-0.3 to 0.3`: Balanced (most significant relationships)
- `-0.7 to -0.3`: Complementary
- `< -0.7`: Inverted

## Known Limitations

1. **Ascendant calculation:** Currently uses a simplified formula based on Local Sidereal Time (LST). This gives the approximate rising degree on the eastern horizon, but doesn't implement full topocentric corrections for the observer's exact location on Earth's surface. Professional astrology software uses more complex algorithms that account for Earth's oblate shape and geographic latitude variations. The current implementation is accurate to within ~1-2° for most locations, which is acceptable for thematic analysis but may not satisfy requirements for precise house cusp calculations.

2. **House systems:** Only Ascendant (1st house cusp) and Midheaven (10th house cusp) are calculated. The 12 intermediate house cusps (2nd-9th, 11th-12th houses) are not implemented.

3. **Asteroids:** Only major planets included (no Chiron, Ceres, etc.)
4. **Fixed stars:** Not included in analysis
5. **Progressions/Transits:** Static natal chart only; no time-based progressions

## Accuracy Specifications

**Astronomy Engine guarantees:**
- Planetary positions: ±1 arcsecond for years 1700-2200
- Moon position: ±10 arcseconds for years 1700-2200
- Time range: Valid for ±10000 years from J2000 epoch
- Reference frame: ICRS (International Celestial Reference System)
- Includes: Aberration, nutation, precession

**Our implementation adds:**
- Precession correction (optional toggle)
- Aspect orb calculations (configurable)
- Thematic analysis based on traditional rulerships
- Geocentric ecliptic longitude conversions

## Troubleshooting

**Incorrect positions:**
- Verify date/time entered correctly
- Check timezone (all times are UTC)
- Confirm latitude/longitude sign (N/E positive, S/W negative)

**Storage issues:**
- Check browser allows localStorage
- Clear localStorage if corrupted: `localStorage.clear()`
- Check console for quota errors (>5MB storage used)

**Comparison not working:**
- Ensure at least 2 records saved
- Verify both charts calculated successfully
- Check console for calculation errors

## Future Testing Enhancements

Potential additions:
- Automated regression tests for known charts
- Accuracy comparisons vs Astro.com API
- Performance benchmarks for large datasets
- Cross-browser compatibility matrix
- Mobile/tablet UI validation
