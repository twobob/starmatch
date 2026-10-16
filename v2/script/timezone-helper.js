
// Timezone Helper - Automatic timezone detection from coordinates


/**
 * Timezone regions defined by lat/lon boundaries
 * Each region includes DST rules where applicable
 */
const TIMEZONE_REGIONS = {
  // United Kingdom (including Northern Ireland)
  UK: {
    bounds: { latMin: 49.5, latMax: 61.0, lonMin: -8.5, lonMax: 2.0 },
    offset: 0,
    name: 'GMT/BST',
    dstRules: {
      // UK uses BST (British Summer Time) from last Sunday in March to last Sunday in October
      usesDST: true,
      hemisphere: 'north'
    }
  },
  
  // Ireland
  Ireland: {
    bounds: { latMin: 51.4, latMax: 55.5, lonMin: -10.5, lonMax: -6.0 },
    offset: 0,
    name: 'GMT/IST',
    dstRules: {
      usesDST: true,
      hemisphere: 'north'
    }
  },
  
  // Western Europe (France, Spain, Germany, etc.) - UTC+1
  WesternEurope: {
    bounds: { latMin: 36.0, latMax: 55.0, lonMin: -5.0, lonMax: 15.0 },
    offset: 1,
    name: 'CET/CEST',
    dstRules: {
      usesDST: true,
      hemisphere: 'north'
    }
  },
  
  // Eastern USA (EST/EDT)
  EasternUS: {
    bounds: { latMin: 25.0, latMax: 48.0, lonMin: -85.0, lonMax: -67.0 },
    offset: -5,
    name: 'EST/EDT',
    dstRules: {
      usesDST: true,
      hemisphere: 'north'
    }
  },
  
  // Australia (varies by state, this is a simplified version)
  Australia: {
    bounds: { latMin: -44.0, latMax: -10.0, lonMin: 113.0, lonMax: 154.0 },
    offset: 10,
    name: 'AEST/AEDT',
    dstRules: {
      usesDST: true,
      hemisphere: 'south'
    }
  }
};

/**
 * Detect timezone region from coordinates
 */
function detectTimezoneRegion(latitude, longitude) {
  // Check UK first (most specific)
  for (const [regionName, region] of Object.entries(TIMEZONE_REGIONS)) {
    const { latMin, latMax, lonMin, lonMax } = region.bounds;
    if (latitude >= latMin && latitude <= latMax && 
        longitude >= lonMin && longitude <= lonMax) {
      return region;
    }
  }
  
  // Default to UTC if no match
  return {
    offset: 0,
    name: 'UTC',
    dstRules: { usesDST: false }
  };
}

/**
 * Calculate if DST is in effect for a given date
 * Simplified: Assumes DST runs roughly March-October (Northern) or October-March (Southern)
 */
function isDSTActive(date, dstRules) {
  if (!dstRules.usesDST) return false;
  
  const month = date.getMonth(); // 0-11
  
  if (dstRules.hemisphere === 'north') {
    // Northern Hemisphere: DST roughly March (2) to October (9)
    // More precisely: last Sunday March to last Sunday October
    return month >= 2 && month <= 9;
  } else if (dstRules.hemisphere === 'south') {
    // Southern Hemisphere: DST roughly October to March
    return month >= 9 || month <= 2;
  }
  
  return false;
}

/**
 * Convert local time to UTC with automatic timezone detection
 * 
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM format (in LOCAL time)
 * @param {number} latitude - Latitude in degrees
 * @param {number} longitude - Longitude in degrees
 * @returns {Object} { utcDate: Date, tzInfo: Object }
 */
function localToUTC(dateStr, timeStr, latitude, longitude) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const t = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!m || !t) return null;
  
  const [_, Y, M, D] = m;
  const [__, h, min] = t;
  
  const year = +Y;
  const month = +M - 1;
  const day = +D;
  const hours = +h;
  const minutes = +min;
  
  // Detect timezone from coordinates
  const region = detectTimezoneRegion(latitude, longitude);
  
  // Create a temporary date to check DST status
  const tempDate = new Date(year, month, day);
  const isDST = isDSTActive(tempDate, region.dstRules);
  
  // Calculate total offset
  const totalOffset = region.offset + (isDST ? 1 : 0);
  
  // Create UTC date by subtracting the offset
  const utcDate = new Date(Date.UTC(year, month, day, hours - totalOffset, minutes, 0, 0));
  
  return {
    utcDate,
    tzInfo: {
      region: region.name,
      baseOffset: region.offset,
      isDST,
      totalOffset,
      detectedAutomatically: true
    }
  };
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TimezoneHelper = {
    localToUTC,
    detectTimezoneRegion,
    isDSTActive,
    TIMEZONE_REGIONS
  };
}


