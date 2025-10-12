# Starmatch

**A celestially computational natal chart research tool**

An interactive browser-based astrological calculation engine for precise natal chart analysis and relationship compatibility research. Starmatch combines astronomical accuracy with traditional astrological interpretation, offering configurable calculation parameters and quantitative comparison methods.

## Usage

### Chart Mode (Single Natal Chart Analysis)

1. **Open Application**: Load `starmatch.html` in a modern browser [try it here](https://twobob.github.io/starmatch/)
2. **Optional: Configure Engine Settings**:
   - **Orb Type**: Aspect-based (default) or Planet-based
   - **Aspect Orb Set**: Select tolerance levels for aspect detection
   - **Rulership System**: Ancient (traditional), Modern, or Alternative modern
   - **Precession Correction**: Enable for sidereal adjustment (optional)
3. **Enter Birth Data**:
   - Date, time (24-hour format)
   - Location: Use search icon for geocoding or enter lat/lon manually
4. **Calculate**: Click **Calculate Chart**
5. **Analyze Results**:
   - **Positions**: Planetary longitudes in zodiacal degrees
   - **Chart Wheel**: Visual representation with aspects
   - **Themes**: 12-sign strength distribution (bar chart)
   - **Aspects**: Detected aspects with orbs
   - **Traditional Factors**: Elemental/quality/polarity counts
   - **Dominants**: Strongest polarity, element, and quality
6. **Save Record**: Click **Save** to store chart for comparison

### Starmatch Mode (Relationship Compatibility)

1. **Prerequisite**: Save at least 2 natal chart records
2. **Switch Mode**: Click **Starmatch Mode** button
3. **Select Charts**:
   - **Subject**: Choose first person's chart
   - **Target**: Choose second person's chart
4. **Compare**: Click **Compare Charts**
5. **Interpret Results**:
   - **xProfile Value**: Similarity-complementarity metric
   - **Relationship Type**: Similar / Balanced / Complementary / Inverted
   - **Theme Comparison**: Side-by-side bar chart showing differences
   - **Overlay Chart**: Both charts displayed simultaneously (blue vs red)
6. **Quick Test**: Press `0` key to auto-load first two records and compare

<img width="532"  alt="image" src="https://github.com/user-attachments/assets/c25ef90f-827e-4fb4-b837-0bd72fd87f2d" />

<img width="526"  alt="image" src="https://github.com/user-attachments/assets/d3822ccd-885a-4df3-b802-a891ba9984f2" />

<img width="516"  alt="image" src="https://github.com/user-attachments/assets/3a9f6fb0-efc4-4d70-b14a-8fc2213ed620" />

## Core Files

### Application
- **`starmatch.html`** - Main application interface with dual-mode functionality (Chart Mode / Starmatch Mode)
- **`script/starmatch-visualiser.js`** - Primary visualization and UI logic
- **`script/engine.js`** - Astrological theme analysis engine with configurable calculation parameters
- **`script/location-picker.js`** - Geocoding search integration (OpenStreetMap Nominatim API)
- **`script/astronomy.2.1.9.browser.min.js`** - [Astronomy Engine](https://github.com/cosinekitty/astronomy) library for VSOP87-based planetary calculations

### Styling
- **`style/style.css`** - Main application styling
- **`style/engine-visualiser.css`** - Chart visualization and theme display styling
- **`style/location-picker.css`** - Location search modal styling

### Documentation
- **`engineDocs/`** - Technical documentation on calculation methods
  - `AspectStrengths.txt` - Mathematical derivation of aspect weighting system
  - `FunctionalAnalysis.txt` - Quadratic/linear function modeling of chart themes
  - `ResearchOptions.txt` - Detailed explanation of all engine configuration parameters
  - `xProfileValues.txt` - Interpretation guide for relationship compatibility spectrum 

## Features

### Astronomical Calculations
- **High-precision planetary positions** using VSOP87 theory (sub-arcsecond accuracy)
- **Full planetary ephemeris**: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- **Chart angles**: Ascendant (rising sign) and Midheaven calculation from sidereal time
- **Geocentric ecliptic coordinates** with aberration correction
- **Valid date range**: All practical historical dates (when humans existed)
- **No ephemeris files required**: All calculations performed algorithmically

### Configurable Calculation Engine
- **Aspect Orb Sets** (5 options): Different orb tolerances for aspect detection
  - Default (9°-3°), Tight (2.6°-1°), Wide (10.8°-1.5°), and custom allocations
- **Orb Type Selection**: Aspect-based orbs or planet-based orbs (Lilly/al-Biruni systems)
- **Rulership Systems** (3 options): Ancient rulers, Modern rulers, or Alternative modern
  - Configurable planetary dignities: rulership, exaltation, detriment, fall
- **Precession Correction**: Optional sidereal adjustment relative to Hipparchus (130 BCE)
  - Applies ~30° backward shift for modern dates (one zodiac sign)
- **Aspect Strength Weighting**: Mathematically derived from circle subdivisions
  - Based on highest prime divisors and integer factors
  - Reciprocal values for traditional strength ordering

### Chart Analysis & Visualization
- **12-fold Theme Analysis**: Quantitative strength distribution across zodiac signs
- **Traditional Factors**: Element (Fire/Earth/Air/Water), Quality (Cardinal/Fixed/Mutable), Polarity (Positive/Negative)
- **Aspect Detection**: Conjunction, Opposition, Trine, Square, Sextile, Semi-square, Semi-sextile
  - Excludes irregular aspects (quincunx, sesquiquadrate) as per engine design
- **Interactive Chart Wheel**: 
  - Zodiac ring with sign divisions
  - Planetary position markers with astrological symbols (☉☽☿♀♂♃♄⛢♆♇)
  - Aspect lines color-coded by type
  - Ascendant line indicator
- **Hover Tooltips**: Planet names/positions, aspect types/orbs, zodiac sign attributes

### Starmatch: Relationship Compatibility Analysis
- **xProfile Calculation**: Quantitative similarity-complementarity spectrum
  - Range: -1 (complementary) to +1 (similar)
  - Balanced relationships cluster near 0
  - Based on theme-by-theme comparison across 12 signs
- **Relationship Type Interpretation**:
  - Similar (positive xProfile): Charts of same shape
  - Complementary (negative xProfile): Charts inverted relative to each other
  - Balanced (near-zero): Mixture of similarity and complementarity
- **Comparative Visualization**:
  - Side-by-side theme strength bars showing differences
  - xProfile spectrum gradient display
  - Dual-chart overlay wheel (Subject in blue, Target in red)
  - Theme-by-theme delta calculations
- **Research Application**: Test astrological hypotheses across relationship types

### Data Persistence & Management
- **Browser localStorage**: Persistent chart storage with no server dependency
- **Record Management**: Save, load, overwrite, delete natal chart records
- **Inline Editing**: Rename saved records directly in the interface
- **Settings Preservation**: Each record stores its calculation parameters
- **JSON Format**: Structured data for potential export/analysis
- **Keyboard Shortcuts**: Press `0` to quick-load first two records for comparison

### Location Services
- **Global Geocoding**: Search by city, hospital, venue, or address
- **OpenStreetMap Integration**: Nominatim API for coordinate lookup
- **Auto-fill**: Latitude/longitude populated from search results
- **No API key required**: Free public geocoding service

### Research Workflow

For investigating astrological hypotheses:

1. **Build Dataset**: Save multiple charts in each category (e.g., married couples, siblings, parent-child)
2. **Record xProfile Values**: Note similarity-complementarity spectrum for each pair
3. **Statistical Analysis**: Look for patterns (e.g., do long-term partners cluster near xProfile = 0?)
4. **Parameter Testing**: Re-run with different orb sets, rulership systems, or precession on/off

## Technical Details

### Astronomical Calculation Method
- **Library**: Astronomy Engine v2.1.19 (browser build)
- **Planetary Theory**: VSOP87 (Variations Séculaires des Orbites Planétaires)
- **Coordinate System**: Geocentric ecliptic longitude (Earth-centered celestial sphere)
- **Aberration Correction**: Applied for light-time delay
- **Moon Calculation**: `Astronomy.GeoMoon()` for high-precision lunar positions
- **Coordinate Transformations**: `Astronomy.Ecliptic()` for equatorial ↔ ecliptic conversion
- **CDN Fallback**: jsdelivr serves as backup if unpkg unavailable

### Astrological Engine Algorithm
- **Theme Calculation**: Point-scoring system across 12 zodiac signs
  - Planetary positions in houses (Placidus-equivalent via equal house approximation)
  - Rulership dignity weights (ruler, exaltation, detriment, fall)
  - Aspect contributions to house themes
  - Mutual reception bonuses
  - Strong planet counts (rulers, exalted planets)
- **Aspect Strength Formula**: 
  ```
  strength = (1 / aspect_value) × (1 - (orb_error / max_orb))
  ```
  - Where `aspect_value` = expression value from circle subdivision table
  - Weighted by planet strength (Sun/Moon = 2, others = 1)
- **Precession Formula**: 
  ```
  precession_degrees = 360 × (birth_year + 130) / 25772
  ```
  - Reference epoch: 130 BCE (Hipparchus)
  - ~30° for year 2000 (approximately one zodiac sign)
  - Applied as backward shift to all planetary/angle positions
- **xProfile Calculation**: 
  ```
  xProfile = Σ(subject_theme[i] - target_theme[i]) / 12
  ```
  - Normalized sum of theme differences
  - Positive = similar charts, Negative = complementary charts

### Data Storage Format
Records stored in browser localStorage as JSON:
```json
{
  "id": "unique-uuid-string",
  "name": "Chart Name",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "lat": "55.9221",
  "lon": "-3.1336",
  "orbType": "0",
  "aspectOrbSet": "0",
  "rulershipSet": "0",
  "precession": 0,
  "createdAt": "2025-10-06T12:34:56.789Z",
  "updatedAt": "2025-10-06T12:34:56.789Z"
}
```

**Storage Key**: `starmatch_records`  
**Format**: Array of record objects  
**Persistence**: Survives browser restarts, cleared only by user action or localStorage quota

### Aspect Strength Values (Mathematical Derivation)

Aspects are subdivisions of a circle, weighted by their geometric properties:

| Aspect | Angle | Division | Factor | Prime | Expression | 1/Value | Rank |
|--------|-------|----------|--------|-------|------------|---------|------|
| Conjunction | 0° | 1 | 1 | 1 | 1×√1 = 1 | 1.00 | 1 |
| Opposition | 180° | 2 | 1 | 2 | 2×√1 = 2 | 0.50 | 2 |
| Square | 90° | 4 | 2 | 2 | 2×√2 = 2.83 | 0.35 | 3 |
| Trine | 120° | 3 | 1 | 3 | 3×√1 = 3 | 0.33 | 4 |
| Semi-square | 45° | 8 | 4 | 2 | 2×√4 = 4 | 0.25 | 5 |
| Sextile | 60° | 6 | 2 | 3 | 3×√2 = 4.24 | 0.24 | 6 |
| Semi-sextile | 30° | 12 | 4 | 3 | 3×√4 = 6 | 0.17 | 7 |

**Note**: Quincunx (150°) and sesquiquadrate (135°) are **not** integer subdivisions of a single circle and are excluded from the engine. These "irregular" aspects are traditionally considered variable in influence.

## Browser Compatibility

**Requirements**:
- JavaScript enabled
- ES6+ support (arrow functions, template literals, async/await)
- localStorage API (for data persistence)
- Canvas API (for chart wheel rendering)

**Not Supported**: Internet Explorer (all versions)

## Research Applications

Starmatch is designed for quantitative astrological research:

1. **Relationship Studies**: Test whether xProfile values correlate with relationship duration, satisfaction, or type
2. **Family Patterns**: Compare parent-child, sibling, or multi-generational charts for hereditary patterns
3. **Parameter Sensitivity**: Investigate how different orb sets or rulership systems affect chart interpretation
4. **Precession Testing**: Compare tropical (no precession) vs. sidereal (with precession) results
5. **Statistical Validation**: Build datasets of chart comparisons to test traditional astrological claims
6. **Aspect Research**: Analyze which aspects appear most frequently in specific relationship types

The tool's configurable parameters allow systematic variation of calculation methods while maintaining astronomical accuracy.

## License & Attribution

- **Starmatch Engine**:  MIT License © 2016-2025 Original astrological calculation algorithm  Will 18
- **Starmatch visualiser**:  MIT License © 2016-2025 Twobob
- **Astronomy Engine**: MIT License © 2019-2023 Don Cross
- **OpenStreetMap Nominatim**: ODbL © OpenStreetMap contributors

## References

- **Astronomy Engine**: https://github.com/cosinekitty/astronomy
- **VSOP87 Theory**: Bureau des Longitudes, Paris (1987)
- **Aspect Strength Derivation**: See `engineDocs/AspectStrengths.txt`
- **xProfile Methodology**: See `engineDocs/xProfileValues.txt`
- **Traditional Astrology**: Ptolemy's Tetrabiblos, William Lilly's Christian Astrology
