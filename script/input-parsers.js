// Input Parsers Module
// Handles conversion and parsing of text-based inputs for dates, times, and coordinates

const InputParsers = {
  /**
   * Parse date string in DD MM YYYY format (with or without separators)
   * @param {string} dateStr - Date string like "11 09 1974" or "11-09-1974" or "11091974"
   * @returns {object} - {year, month, day} or null if invalid
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Remove all non-digit characters
    const digitsOnly = dateStr.replace(/\D/g, '');
    
    // Should have exactly 8 digits: DDMMYYYY
    if (digitsOnly.length !== 8) return null;
    
    const day = parseInt(digitsOnly.substring(0, 2), 10);
    const month = parseInt(digitsOnly.substring(2, 4), 10);
    const year = parseInt(digitsOnly.substring(4, 8), 10);
    
    // Basic validation
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return null;
    }
    
    return { year, month, day };
  },

  /**
   * Convert parsed date to ISO format YYYY-MM-DD
   * @param {object} parsedDate - {year, month, day}
   * @returns {string} - ISO format date string
   */
  toISODate(parsedDate) {
    if (!parsedDate) return '';
    const { year, month, day } = parsedDate;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  },

  /**
   * Parse time string in HH MM format (with or without separators)
   * @param {string} timeStr - Time string like "14 14" or "14:14" or "1414"
   * @returns {object} - {hours, minutes} or null if invalid
   */
  parseTime(timeStr) {
    if (!timeStr) return null;
    
    // Remove all non-digit characters
    const digitsOnly = timeStr.replace(/\D/g, '');
    
    // Should have exactly 4 digits: HHMM
    if (digitsOnly.length !== 4) return null;
    
    const hours = parseInt(digitsOnly.substring(0, 2), 10);
    const minutes = parseInt(digitsOnly.substring(2, 4), 10);
    
    // Basic validation
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    
    return { hours, minutes };
  },

  /**
   * Convert parsed time to HH:MM format
   * @param {object} parsedTime - {hours, minutes}
   * @returns {string} - HH:MM format time string
   */
  toTimeString(parsedTime) {
    if (!parsedTime) return '';
    const { hours, minutes } = parsedTime;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  },

  /**
   * Parse latitude/longitude with N/S/E/W or +/- notation
   * @param {string} coordStr - Coordinate like "51.5074 N" or "-0.1278" or "0.1278 W"
   * @returns {number} - Decimal coordinate or null if invalid
   */
  parseCoordinate(coordStr) {
    if (!coordStr) return null;
    
    // Trim whitespace
    const trimmed = coordStr.trim().toUpperCase();
    
    // Check for N/S/E/W suffix
    let multiplier = 1;
    let numericPart = trimmed;
    
    if (trimmed.endsWith('N') || trimmed.endsWith('E')) {
      multiplier = 1;
      numericPart = trimmed.slice(0, -1).trim();
    } else if (trimmed.endsWith('S') || trimmed.endsWith('W')) {
      multiplier = -1;
      numericPart = trimmed.slice(0, -1).trim();
    }
    
    // Parse the numeric value
    const value = parseFloat(numericPart);
    
    if (isNaN(value)) return null;
    
    // Apply multiplier and return
    return value * multiplier;
  },

  /**
   * Validate latitude (-90 to 90)
   * @param {number} lat - Latitude value
   * @returns {boolean}
   */
  isValidLatitude(lat) {
    return typeof lat === 'number' && lat >= -90 && lat <= 90;
  },

  /**
   * Validate longitude (-180 to 180)
   * @param {number} lng - Longitude value
   * @returns {boolean}
   */
  isValidLongitude(lng) {
    return typeof lng === 'number' && lng >= -180 && lng <= 180;
  },

  /**
   * Format coordinate with direction suffix
   * @param {number} value - Coordinate value
   * @param {boolean} isLatitude - True for lat (N/S), false for lng (E/W)
   * @returns {string}
   */
  formatCoordinate(value, isLatitude) {
    if (typeof value !== 'number') return '';
    
    const absValue = Math.abs(value);
    let direction;
    
    if (isLatitude) {
      direction = value >= 0 ? 'N' : 'S';
    } else {
      direction = value >= 0 ? 'E' : 'W';
    }
    
    return `${absValue} ${direction}`;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputParsers;
}
