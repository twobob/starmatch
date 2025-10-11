// ============================================================================
// Comparison Engine Module
// Handles chart comparisons and xProfile calculations for relationship analysis
// ============================================================================

(function() {
  'use strict';

  // ============================================================================
  // Chart Calculation
  // ============================================================================

  /**
   * Calculate complete chart data for a saved record
   * @param {Object} record - Saved record with date, time, lat, lon, name
   * @returns {Object|null} Chart data with positions, angles, and themes
   */
  function calculateChartForRecord(record) {
    if (!record.date || !record.time || !record.lat || !record.lon) {
      console.warn('calculateChartForRecord: Missing required record fields');
      return null;
    }
    
    // Verify required dependencies
    if (typeof AstroCalc === 'undefined') {
      console.error('calculateChartForRecord: AstroCalc module not loaded');
      return null;
    }
    
    if (typeof getThemeValues !== 'function') {
      console.error('calculateChartForRecord: engine.js getThemeValues not available');
      return null;
    }
    
    if (typeof TidyUpAndFloat !== 'function') {
      console.error('calculateChartForRecord: TidyUpAndFloat helper not available');
      return null;
    }
    
    try {
      const latitude = parseFloat(record.lat);
      const longitude = parseFloat(record.lon);
      
      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude)) {
        console.warn('calculateChartForRecord: Invalid lat/lon values');
        return null;
      }
      
      // Create UTC date from record - MUST PASS LAT/LON FOR TIMEZONE LOOKUP
      const date = AstroCalc.toUTC(record.date, record.time, latitude, longitude);
      if (!date) {
        console.error('calculateChartForRecord: Invalid date/time in record');
        return null;
      }
      
      const positions = {};
      
      // Calculate planetary positions using Astronomy Engine
      for (const planet of PLANET_NAMES) {
        positions[planet] = AstroCalc.getEclipticLongitude(planet, date) + 30;
        if (positions[planet] >= 360) {
          positions[planet] -= 360;
        }
      }
      
      let ascendant = AstroCalc.calculateAscendant(date, latitude, longitude);
      let midheaven = AstroCalc.calculateMidheaven(date, longitude);
      
      // Apply CURRENT UI engine settings to global variables from engine.js
      if (typeof orbTypeSelect !== 'undefined') {
        window.orbType = parseInt(orbTypeSelect.value);
        window.aoIndex = parseInt(aspectOrbSetSelect.value);
        window.tfIndex = parseInt(rulershipSetSelect.value);
        window.precessionFlag = precessionCheckbox.checked ? 1 : 0;
      }
      
      const birthYear = new Date(record.date).getFullYear();
      window.nativityYear = birthYear;
      window.nativity = birthYear;
      
      // Apply precession correction to ALL positions if enabled
      if (window.precessionFlag === 1) {
        const precessionDegrees = 360 * (birthYear + 130) / 25772;
        
        // Apply to all planetary positions
        for (const planet of PLANET_NAMES) {
          if (positions[planet] !== undefined) {
            positions[planet] -= precessionDegrees;
            if (positions[planet] < 0) {
              positions[planet] += 360;
            }
            if (positions[planet] >= 360) {
              positions[planet] -= 360;
            }
          }
        }
        
        // Apply to ascendant and midheaven
        ascendant -= precessionDegrees;
        if (ascendant < 0) ascendant += 360;
        if (ascendant >= 360) ascendant -= 360;
        
        midheaven -= precessionDegrees;
        if (midheaven < 0) midheaven += 360;
        if (midheaven >= 360) midheaven -= 360;
      }
      
      // Call engine - verify all values are clean before passing
      getThemeValues(
        TidyUpAndFloat(positions.Sun),
        TidyUpAndFloat(positions.Moon),
        TidyUpAndFloat(positions.Mercury),
        TidyUpAndFloat(positions.Venus),
        TidyUpAndFloat(positions.Mars),
        TidyUpAndFloat(positions.Jupiter),
        TidyUpAndFloat(positions.Saturn),
        TidyUpAndFloat(positions.Uranus),
        TidyUpAndFloat(positions.Neptune),
        TidyUpAndFloat(positions.Pluto),
        TidyUpAndFloat(ascendant),
        TidyUpAndFloat(midheaven)
      );
      
      // Verify theme array was populated
      if (typeof theme === 'undefined' || !Array.isArray(theme) || theme.length !== 12) {
        console.error('calculateChartForRecord: engine.js did not populate theme array correctly');
        return null;
      }
      
      return {
        positions: positions,
        ascendant: ascendant,
        midheaven: midheaven,
        themes: [...theme]  // Copy theme array
      };
    } catch (error) {
      console.error('calculateChartForRecord: Exception during calculation:', error);
      return null;
    }
  }

  // ============================================================================
  // xProfile Calculation
  // ============================================================================

  /**
   * Calculate xProfile value using cosine similarity between theme vectors
   * Range: -1 (inverted/complementary) to +1 (identical/similar)
   * Near 0: Balanced/equal relationship (optimal)
   * 
   * @param {Array<number>} subjectThemes - 12-element theme array for subject
   * @param {Array<number>} targetThemes - 12-element theme array for target
   * @returns {number} xProfile value between -1 and +1
   */
  function calculateXProfileValue(subjectThemes, targetThemes) {
    if (!Array.isArray(subjectThemes) || !Array.isArray(targetThemes)) {
      console.warn('calculateXProfileValue: Themes must be arrays');
      return 0;
    }
    
    if (subjectThemes.length !== 12 || targetThemes.length !== 12) {
      console.warn('calculateXProfileValue: Theme arrays must have 12 elements');
      return 0;
    }
    
    let sumProduct = 0;
    let sumSubjectSq = 0;
    let sumTargetSq = 0;
    
    for (let i = 0; i < 12; i++) {
      const s = parseFloat(subjectThemes[i]) || 0;
      const t = parseFloat(targetThemes[i]) || 0;
      
      sumProduct += s * t;
      sumSubjectSq += s * s;
      sumTargetSq += t * t;
    }
    
    const denominator = Math.sqrt(sumSubjectSq * sumTargetSq);
    return denominator !== 0 ? sumProduct / denominator : 0;
  }

  /**
   * Interpret xProfile value into relationship type with color and description
   * @param {number} xProfileValue - Value between -1 and +1
   * @returns {Object} Relationship type interpretation
   */
  function getRelationshipTypeInterpretation(xProfileValue) {
    const absValue = Math.abs(xProfileValue);
    
    if (absValue < 0.2) {
      return {
        type: 'Equality/Balance',
        color: '#51cf66',
        description: 'Optimal for long-lasting, significant relationships. A balanced blend of similarity and complementarity.',
        significance: 'High'
      };
    } else if (xProfileValue > 0.7) {
      return {
        type: 'Strong Similarity',
        color: '#74c0fc',
        description: 'Charts have the same shape. Good relationship potential, though may lack the balance for deepest partnerships.',
        significance: 'Moderate'
      };
    } else if (xProfileValue > 0.4) {
      return {
        type: 'Moderate Similarity',
        color: '#69db7c',
        description: 'Similar energies with some variation. Good compatibility with room for growth.',
        significance: 'Good'
      };
    } else if (xProfileValue < -0.7) {
      return {
        type: 'Strong Complementarity',
        color: '#b85eff',
        description: 'Charts are inverted relative to each other. Complementary energies, though may lack balance for lasting partnerships.',
        significance: 'Moderate'
      };
    } else if (xProfileValue < -0.4) {
      return {
        type: 'Moderate Complementarity',
        color: '#a78bfa',
        description: 'Complementary energies provide contrast and growth opportunities.',
        significance: 'Good'
      };
    } else {
      return {
        type: 'Mixed Balance',
        color: '#ffd43b',
        description: 'A mixture of similar and complementary energies. Approaching ideal balance.',
        significance: 'Good'
      };
    }
  }

  // ============================================================================
  // Module Export
  // ============================================================================

  window.ComparisonEngine = {
    calculateChartForRecord,
    calculateXProfileValue,
    getRelationshipTypeInterpretation
  };

})();
