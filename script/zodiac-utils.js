
// Zodiac Utils Module

// Handles zodiac sign calculations, coordinate transformations, and house
// calculations. Contains the sign reversal logic that will be fixed later.


const ZodiacUtils = (function() {
  'use strict';

  // ============================================================================
  // Sign Index Calculation (Display Logic - Currently Shifted)
  // ============================================================================

  function getSignIndexFromLongitude(longitude) {
    let normalisedLon = longitude % 360;
    if (normalisedLon < 0) normalisedLon += 360;
    
    // Base sign from longitude (0-29.99° = Aries, 30-59.99° = Taurus, etc.)
    let baseSign = Math.floor(normalisedLon / 30);
    
    // Shift backward by one sign for chart display
    let signIndex = (baseSign - 1 + 12) % 12;
    
    return signIndex;
  }

  function getSignInfo(longitude) {
    let normalisedLon = longitude % 360;
    if (normalisedLon < 0) normalisedLon += 360;
    
    const signIndex = getSignIndexFromLongitude(longitude);
    const degree = normalisedLon % 30;
    const signName = AstroConstants.SIGN_NAMES[signIndex];
    
    return { signIndex, signName, degree };
  }

  // ============================================================================
  // Sign Number Calculation (Engine Logic - Different Algorithm)
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
