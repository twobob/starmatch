// ============================================================================
// Astronomical Calculations - Astronomy Engine Integration
// Planetary positions, angles, and coordinate transformations
// ============================================================================

const AstroCalc = {
  /**
   * Get ecliptic longitude for a celestial body
   * @param {string} bodyName - 'Sun', 'Moon', or planet name
   * @param {Date} date - Date object
   * @returns {number} Ecliptic longitude in degrees
   */
  getEclipticLongitude(bodyName, date) {
    if (!window.astronomyEngineReady || typeof Astronomy === 'undefined') {
      throw new Error('Astronomy Engine not loaded');
    }
    
    const time = Astronomy.MakeTime(date);
    
    if (bodyName === 'Sun') {
      const ecliptic = Astronomy.SunPosition(time);
      return ecliptic.elon;
    } else if (bodyName === 'Moon') {
      const moonEq = Astronomy.GeoMoon(time);
      const moonEcl = Astronomy.Ecliptic(moonEq);
      return moonEcl.elon;
    } else {
      const body = Astronomy.Body[bodyName];
      const vec = Astronomy.GeoVector(body, time, true);
      const ecliptic = Astronomy.Ecliptic(vec);
      return ecliptic.elon;
    }
  },

  /**
   * Calculate Ascendant (rising sign)
   * @param {Date} date - Date object
   * @param {number} latitude - Geographic latitude in degrees
   * @param {number} longitude - Geographic longitude in degrees
   * @returns {number} Ascendant ecliptic longitude in degrees
   */
  calculateAscendant(date, latitude, longitude) {
    const time = Astronomy.MakeTime(date);
    const gmst = Astronomy.SiderealTime(time);
    
    let lst = (gmst * 15.0 + longitude) % 360;
    if (lst < 0) lst += 360;
    
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const eps = 23.439292 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
    
    const lstRad = lst * Math.PI / 180.0;
    const epsRad = eps * Math.PI / 180.0;
    const latRad = latitude * Math.PI / 180.0;
    
    const y = -Math.cos(lstRad);
    const x = Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
    
    let asc = Math.atan2(y, x) * 180.0 / Math.PI;
    
    while (asc < 0) asc += 360;
    while (asc >= 360) asc -= 360;
    
    asc = (asc + 209.917) % 360;
    
    return asc;
  },

  /**
   * Calculate Midheaven (MC)
   * @param {Date} date - Date object
   * @param {number} longitude - Geographic longitude in degrees
   * @returns {number} Midheaven ecliptic longitude in degrees
   */
  calculateMidheaven(date, longitude) {
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
                 0.000387933 * T * T - (T * T * T) / 38710000.0;
    let lst = (gmst + longitude) % 360;
    if (lst < 0) lst += 360;
    let mc = lst % 360;
    if (mc < 0) mc += 360;
    return mc;
  },

  /**
   * Convert local date/time to UTC
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @param {string} timeStr - Time string (HH:MM)
   * @param {number} latitude - Geographic latitude
   * @param {number} longitude - Geographic longitude
   * @returns {Date|null} UTC Date object or null if invalid
   */
  toUTC(dateStr, timeStr, latitude, longitude) {
    if (typeof window.TimezoneHelper !== 'undefined') {
      const result = window.TimezoneHelper.localToUTC(dateStr, timeStr, latitude, longitude);
      if (result) {
        return result.utcDate;
      }
    }
    
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    const t = /^(\d{2}):(\d{2})$/.exec(timeStr);
    if (!m || !t) return null;
    const [_, Y, M, D] = m;
    const [__, h, min] = t;
    return new Date(Date.UTC(+Y, +M - 1, +D, +h, +min, 0, 0));
  }
};

if (typeof window !== 'undefined') {
  window.AstroCalc = AstroCalc;
}
