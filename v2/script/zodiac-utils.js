
// Zodiac Utils Module

// Handles zodiac sign calculations, coordinate transformations, and house
// calculations. Longitudes are tropical: 0-29.99° Aries, 30-59.99° Taurus, ...


const ZodiacUtils = (function() {
  'use strict';

  // ============================================================================
  // Sign Index Calculation (Display Logic)
  // ============================================================================

  function getSignIndexFromLongitude(longitude) {
    let normalisedLon = longitude % 360;
    if (normalisedLon < 0) normalisedLon += 360;
    return Math.floor(normalisedLon / 30) % 12;
  }

  function getSignInfo(longitude) {
    let normalisedLon = longitude % 360;
    if (normalisedLon < 0) normalisedLon += 360;

    const signIndex = getSignIndexFromLongitude(longitude);
    const degree = normalisedLon % 30;
    const signName = AstroConstants.SIGN_NAMES[signIndex];

    return { signIndex, signName, degree };
  }

  // Element cycles every 4 signs, quality every 3 (Aries cardinal, Taurus fixed, ...)
  function getSignElement(signIndex) {
    return AstroConstants.ELEMENT_NAMES[signIndex % 4];
  }

  function getSignQuality(signIndex) {
    return AstroConstants.QUALITY_NAMES[signIndex % 3];
  }

  /**
   * Ruler of a sign under the selected traditional factors (engine.js tf table),
   * falling back to the modern rulers before the engine has loaded
   * @param {number} signIndex - 0 (Aries) to 11 (Pisces)
   * @returns {string|null} Planet name
   */
  function getSignRuler(signIndex) {
    if (Array.isArray(window.tf) && Number.isInteger(window.tfIndex) && window.tf[window.tfIndex]) {
      return AstroConstants.PLANET_NAMES[window.tf[window.tfIndex][signIndex]] || null;
    }
    return AstroConstants.RULING_PLANETS[AstroConstants.SIGN_NAMES[signIndex]] || null;
  }

  // ============================================================================
  // Sign Number Calculation (Engine Logic)
  // ============================================================================

  function signNum(pos) {
    // Normalize position to 0-360 range
    var normalizedPos = pos % 360;
    if (normalizedPos < 0) normalizedPos += 360;

    var value = normalizedPos / 30 - 0.5;
    value = (value < 0 ? 0 : value);
    value = Math.round(value);
    value = (value >= 12 ? 11 : value);
    return value;
  }

  // ============================================================================
  // House Calculation
  // ============================================================================

  function house(pos, ascendant) {
    var value = (pos - ascendant) / 30 - 0.5;
    value = Math.round(value);
    value = (value < 0 ? value + 12 : value);
    value = (value > 12 ? value - 12 : value);
    return value + 1;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  return {
    getSignIndexFromLongitude,
    getSignInfo,
    getSignElement,
    getSignQuality,
    getSignRuler,
    signNum,
    house
  };
})();

// Export to global scope
if (typeof window !== 'undefined') {
  window.ZodiacUtils = ZodiacUtils;

  // Maintain backward compatibility with global functions
  window.getSignIndexFromLongitude = ZodiacUtils.getSignIndexFromLongitude;
  window.getSignInfo = ZodiacUtils.getSignInfo;
  window.signNum = ZodiacUtils.signNum;
  window.house = ZodiacUtils.house;
}
