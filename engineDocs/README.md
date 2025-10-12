# Starmatch Engine Documentation

Technical specifications for the astrological calculation engine's mathematical models and configurable parameters.

## Documents

### AspectStrengths.txt
**Mathematical derivation of aspect weighting system**

Derives numerical aspect strength values from geometric circle subdivisions using prime factorization:

```
Aspect strength = (highest_prime_divisor) × √(factor)
```

**Strength hierarchy** (by reciprocal value):
1. Conjunction (1.00)
2. Opposition (0.50)
3. Quincunx* (0.37)
4. Square (0.35)
5. Trine (0.33)
6. Semi-square (0.25)
7. Sextile (0.24)
8. Semi-sextile (0.17)

**Applied formula**:
```
chart_aspect_strength = (1 / aspect_value) × (1 - (orb_error / max_orb))
```

*Note: Quincunx (150°) and sesquiquadrate (135°) are excluded from engine calculations as they are not integer subdivisions of a single circle, representing subdivisions of 5 and 24 circles respectively. Their influence is traditionally considered variable and weak.

**Planetary weighting**: Sun and Moon receive factor of 2; all other planets unity (1).

---

### FunctionalAnalysis.txt
**Quadratic/linear function modeling of chart themes**

Models the 12-theme distribution using piecewise functions for peaks and troughs:

**Quadratic function** (peak/trough shape):
```
y = a(x - x_offset)² + b(x - x_offset) + c
```

**Linear functions** (left/right transitions):
```
L: y = m_L(x - x_offset) + c_L
R: y = m_R(x - x_offset) + c_R
```

**Combination ratio**:
```
y = (1 - fnRatio) × quadratic + fnRatio × linear
where fnRatio = 1/√2 ≈ 0.707
```

**Modulo 12 indexing**: x-values wrap circularly (if x < 0: x + 12; if x > 11: x - 12)

Provides analytical approximation of empirically calculated theme distributions. Error varies by feature: typical ~2-5%, outliers up to 72% at minima due to neglected linear contributions.

---

### ResearchOptions.txt
**Configurable calculation parameters**

#### Aspect Orb Index (`aoIndex`)
Five orb sets (degrees) for: Conjunction, Opposition, Trine, Square, Sextile, Semi-square, Semi-sextile

| Index | Conj | Opp | Tri | Sqr | Sex | S-sq | S-sex |
|-------|------|-----|-----|-----|-----|------|-------|
| 0 (default) | 9 | 9 | 7 | 7 | 5 | 3 | 3 |
| 1 | 9 | 9 | 9 | 9 | 6 | 2 | 3 |
| 2 | 10.8 | 10.0 | 8.3 | 7.5 | 5.7 | 2.5 | 1.5 |
| 3 | 10 | 8 | 6 | 6 | 4 | 5 | 1 |
| 4 | 2.6 | 2.5 | 2.3 | 2.3 | 1.3 | 1 | 1 |

#### Traditional Factors Index (`tfIndex`)
Planetary dignity allocations (Ruler, Exaltation, Detriment, Fall)

- **Index 0**: Ancient system (Mars rules Aries/Scorpio, Saturn rules Capricorn/Aquarius, Jupiter rules Sagittarius/Pisces)
- **Index 4**: Modern system (Uranus rules Aquarius, Neptune rules Pisces, Pluto rules Scorpio)
- **Index 8**: Alternative modern (hybrid assignments)

#### Precession (`precessionFlag`)
- **0** (default): Tropical zodiac (no precession correction)
- **1**: Sidereal adjustment relative to Hipparchus (130 BCE)

Formula: `degrees = 360 × (year + 130) / 25772`

Effect: ~30° backward shift for year 2000 (≈1 zodiac sign)

#### Orb Type (`orbType`)
- **0** (default): Aspect-based orbs (uses `aoIndex`)
- **1**: Planet-based orbs (uses `poIndex`, ignores `aoIndex`)

#### Planet Orb Index (`poIndex`)
Used only if `orbType = 1`

| Planet | Lilly (0) | al-Biruni (1) |
|--------|-----------|---------------|
| Sun | 15° | 17° |
| Moon | 12° | 12.5° |
| Mercury | 7° | 7° |
| Venus | 7° | 8° |
| Mars | 7° | 8° |
| Jupiter | 9° | 12° |
| Saturn | 9° | 10° |
| Uranus* | 5° | 5° |
| Neptune* | 5° | 5° |
| Pluto* | 5° | 5° |

*Modern allocations (used with `tfIndex` 4 or 8)

#### Chart Type (`chartType`)
- **0** (default): Natal chart data
- **1**: Averaged data (internal use for cross-profiling; not typically user-selectable)

---

### xProfileValues.txt
**Relationship compatibility spectrum interpretation**

Quantifies similarity-complementarity balance between two natal charts:

**Scale**:
```
+1.0  ← Similar (charts of same shape)
 0.0  ← Balanced (mixture of similarity/complementarity)
-1.0  ← Complementary (inverted chart shapes)
```

**Hypothesis** (from empirical observation, statistically unvalidated):
- **Extreme values** (±0.8 to ±1.0): Short-term or non-partner relationships
- **Near-zero** (±0.2): Long-lasting, significant partnerships
- **Mechanism**: Sustainable relationships balance similarity (shared values) with complementarity (mutual support)

**Calculation**: Normalized sum of theme differences across 12 signs

**Note**: Interpretation is observational, not statistically validated. Requires controlled dataset for significance testing.

---

## Implementation Notes

1. **Irregular aspects** (quincunx, sesquiquadrate) are explicitly excluded from engine calculations
2. **Precession** modifies all planetary/angle positions when enabled
3. **Parameter combinations** allow systematic research design (e.g., test ancient vs. modern traditional factors)
4. **xProfile** requires at least 2 charts; compatibility analysis is bidirectional symmetric
5. **Functional analysis** is descriptive/approximate, not prescriptive for calculations

## References

- Aspect strength hierarchy matches ancient tradition (negative > positive aspects)
- Planetary orbs from William Lilly (*Christian Astrology*, 1647) and al-Biruni (*Book of Instruction*, 1029)
- Precession epoch: Hipparchus of Nicaea (~130 BCE)
- Great year period: 25,772 years (current astronomical value: ~25,772 years)
