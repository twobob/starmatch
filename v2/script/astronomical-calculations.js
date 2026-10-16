// ============================================================================
// Astronomical Calculations - Astronomy Engine Integration
// Planetary positions, angles, and coordinate transformations
// All longitudes are tropical (ecliptic of date), 0° = 0° Aries
// ============================================================================

const AstroCalc = (function() {
  'use strict';

  const DEG = Math.PI / 180;

  function requireEngine() {
    if (!window.astronomyEngineReady || typeof Astronomy === 'undefined') {
      throw new Error('Astronomy Engine not loaded');
    }
  }

  // Mean obliquity of the ecliptic in degrees (IAU 1976 polynomial)
  function obliquity(date) {
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    return 23.439292 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
  }

  // Right ascension of the meridian (local apparent sidereal time as an angle)
  function ramc(date, longitude) {
    const gast = Astronomy.SiderealTime(Astronomy.MakeTime(date));  // hours
    return (((gast * 15 + longitude) % 360) + 360) % 360;
  }

  function normalise(degrees) {
    return ((degrees % 360) + 360) % 360;
  }

  return {
    /**
     * Get ecliptic longitude for a celestial body
     * @param {string} bodyName - 'Sun', 'Moon', or planet name
     * @param {Date} date - Date object (UTC instant)
     * @returns {number} Ecliptic longitude in degrees
     */
    getEclipticLongitude(bodyName, date) {
      requireEngine();
      const time = Astronomy.MakeTime(date);

      if (bodyName === 'Sun') {
        return Astronomy.SunPosition(time).elon;
      } else if (bodyName === 'Moon') {
        return Astronomy.Ecliptic(Astronomy.GeoMoon(time)).elon;
      }
      const vec = Astronomy.GeoVector(Astronomy.Body[bodyName], time, true);
      return Astronomy.Ecliptic(vec).elon;
    },

    /**
     * Calculate Ascendant: the ecliptic longitude rising on the eastern horizon
     * @param {Date} date - Date object (UTC instant)
     * @param {number} latitude - Geographic latitude in degrees (north positive)
     * @param {number} longitude - Geographic longitude in degrees (east positive)
     * @returns {number} Ascendant ecliptic longitude in degrees
     */
    calculateAscendant(date, latitude, longitude) {
      requireEngine();
      const r = ramc(date, longitude) * DEG;
      const eps = obliquity(date) * DEG;
      const lat = latitude * DEG;
      const asc = Math.atan2(
        Math.cos(r),
        -(Math.sin(r) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps))
      );
      return normalise(asc / DEG);
    },

    /**
     * Calculate Midheaven (MC): the ecliptic longitude on the upper meridian
     * @param {Date} date - Date object (UTC instant)
     * @param {number} longitude - Geographic longitude in degrees (east positive)
     * @returns {number} Midheaven ecliptic longitude in degrees
     */
    calculateMidheaven(date, longitude) {
      requireEngine();
      const r = ramc(date, longitude) * DEG;
      const eps = obliquity(date) * DEG;
      return normalise(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(eps)) / DEG);
    },

    /**
     * Convert local birth date/time to a UTC instant
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @param {string} timeStr - Time string (HH:MM), local clock time
     * @param {number} latitude - Geographic latitude
     * @param {number} longitude - Geographic longitude
     * @param {string} [timeZone] - IANA time zone; guessed from the location if omitted
     * @returns {Date|null} UTC Date object or null if invalid
     */
    toUTC(dateStr, timeStr, latitude, longitude, timeZone) {
      if (typeof window.TimezoneHelper !== 'undefined') {
        const result = window.TimezoneHelper.localToUTC(dateStr, timeStr, latitude, longitude, timeZone);
        return result ? result.utcDate : null;
      }

      const m = /^(-?\d{1,6})-(\d{2})-(\d{2})$/.exec(dateStr);
      const t = /^(\d{2}):(\d{2})$/.exec(timeStr);
      if (!m || !t) return null;
      const d = new Date(0);
      d.setUTCFullYear(+m[1], +m[2] - 1, +m[3]);
      d.setUTCHours(+t[1], +t[2], 0, 0);
      return d;
    }
  };
})();

if (typeof window !== 'undefined') {
  window.AstroCalc = AstroCalc;
}
