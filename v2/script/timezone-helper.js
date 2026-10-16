// Timezone Helper - local birth time to UTC
// Offsets and daylight saving come from the browser's own time zone database
// (Intl), so historical rules are honoured and no tz data ships with the app.
// The zone itself is either chosen by the user or guessed from coordinates.

const TimezoneHelper = (function() {
  'use strict';

  // Coarse location -> IANA zone guesses, checked in order.
  // Anywhere else falls back to a nautical zone (whole hours from longitude,
  // no daylight saving), which the UI flags as approximate.
  const ZONE_REGIONS = [
    { zone: 'Europe/Dublin', bounds: { latMin: 51.4, latMax: 55.5, lonMin: -10.5, lonMax: -6.0 } },
    { zone: 'Europe/London', bounds: { latMin: 49.5, latMax: 61.0, lonMin: -8.5, lonMax: 2.0 } },
    { zone: 'Europe/Lisbon', bounds: { latMin: 36.9, latMax: 42.2, lonMin: -9.6, lonMax: -7.0 } },
    { zone: 'Europe/Madrid', bounds: { latMin: 36.0, latMax: 42.4, lonMin: -9.4, lonMax: 3.4 } },
    { zone: 'Europe/Madrid', bounds: { latMin: 42.4, latMax: 43.9, lonMin: -9.4, lonMax: -1.8 } },
    { zone: 'Europe/Paris', bounds: { latMin: 36.0, latMax: 55.0, lonMin: -5.0, lonMax: 15.0 } },
    { zone: 'America/New_York', bounds: { latMin: 24.0, latMax: 50.0, lonMin: -85.0, lonMax: -67.0 } },
    { zone: 'America/Chicago', bounds: { latMin: 24.0, latMax: 50.0, lonMin: -102.0, lonMax: -85.0 } },
    { zone: 'America/Phoenix', bounds: { latMin: 31.0, latMax: 37.0, lonMin: -114.8, lonMax: -109.0 } },
    { zone: 'America/Denver', bounds: { latMin: 24.0, latMax: 50.0, lonMin: -114.0, lonMax: -102.0 } },
    { zone: 'America/Los_Angeles', bounds: { latMin: 24.0, latMax: 50.0, lonMin: -125.0, lonMax: -114.0 } },
    { zone: 'Australia/Perth', bounds: { latMin: -36.0, latMax: -13.0, lonMin: 112.0, lonMax: 129.0 } },
    { zone: 'Australia/Darwin', bounds: { latMin: -26.0, latMax: -10.0, lonMin: 129.0, lonMax: 138.0 } },
    { zone: 'Australia/Adelaide', bounds: { latMin: -39.0, latMax: -26.0, lonMin: 129.0, lonMax: 141.0 } },
    { zone: 'Australia/Brisbane', bounds: { latMin: -29.0, latMax: -10.0, lonMin: 138.0, lonMax: 154.0 } },
    { zone: 'Australia/Sydney', bounds: { latMin: -44.0, latMax: -29.0, lonMin: 141.0, lonMax: 154.0 } }
  ];

  const formatters = new Map();

  function formatterFor(zone) {
    if (!formatters.has(zone)) {
      formatters.set(zone, new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hourCycle: 'h23',
        era: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      }));
    }
    return formatters.get(zone);
  }

  function isValidZone(zone) {
    if (!zone || typeof zone !== 'string') return false;
    try {
      formatterFor(zone);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Build a UTC timestamp from calendar fields (safe for years < 100 and BCE)
  function utcFromFields(year, month, day, hours, minutes, seconds) {
    const d = new Date(0);
    d.setUTCFullYear(year, month - 1, day);
    d.setUTCHours(hours, minutes, seconds, 0);
    return d.getTime();
  }

  /**
   * Offset of a zone from UTC at an instant, in milliseconds (local - UTC)
   */
  function offsetMs(zone, utcMs) {
    const parts = {};
    formatterFor(zone).formatToParts(new Date(utcMs)).forEach(p => { parts[p.type] = p.value; });
    let year = +parts.year;
    if (/^B/.test(parts.era || '')) year = 1 - year;  // 1 BC is astronomical year 0
    return utcFromFields(year, +parts.month, +parts.day, +parts.hour, +parts.minute, +parts.second) - utcMs;
  }

  function nauticalZone(longitude) {
    const hours = Math.max(-12, Math.min(12, Math.round(longitude / 15)));
    if (hours === 0) return 'Etc/GMT';
    // Etc/GMT signs are inverted: Etc/GMT-1 is UTC+1
    return hours > 0 ? `Etc/GMT-${hours}` : `Etc/GMT+${-hours}`;
  }

  /**
   * Guess an IANA zone from coordinates
   * @returns {{zone: string, approximate: boolean}}
   */
  function guessTimeZone(latitude, longitude) {
    for (const region of ZONE_REGIONS) {
      const { latMin, latMax, lonMin, lonMax } = region.bounds;
      if (latitude >= latMin && latitude <= latMax && longitude >= lonMin && longitude <= lonMax) {
        return { zone: region.zone, approximate: false };
      }
    }
    return { zone: nauticalZone(longitude || 0), approximate: true };
  }

  function formatOffset(ms) {
    const sign = ms < 0 ? '-' : '+';
    const totalMinutes = Math.round(Math.abs(ms) / 60000);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `UTC${sign}${hours}:${minutes}`;
  }

  /**
   * Convert local clock time at the birthplace to UTC
   *
   * @param {string} dateStr - Date in YYYY-MM-DD format
   * @param {string} timeStr - Time in HH:MM format (local clock time)
   * @param {number} latitude - Latitude in degrees
   * @param {number} longitude - Longitude in degrees
   * @param {string} [zone] - IANA zone chosen by the user; guessed if omitted
   * @returns {Object|null} { utcDate: Date, tzInfo: Object }
   */
  function localToUTC(dateStr, timeStr, latitude, longitude, zone) {
    const m = /^(-?\d{1,6})-(\d{2})-(\d{2})$/.exec(dateStr || '');
    const t = /^(\d{2}):(\d{2})$/.exec(timeStr || '');
    if (!m || !t) return null;

    const chosen = isValidZone(zone) ? { zone, approximate: false } : guessTimeZone(latitude, longitude);
    const wallMs = utcFromFields(+m[1], +m[2], +m[3], +t[1], +t[2], 0);

    // Two passes: the offset at the true instant can differ from the offset
    // at the wall-clock reading when a daylight saving change falls between them
    let offset = offsetMs(chosen.zone, wallMs);
    const second = offsetMs(chosen.zone, wallMs - offset);
    if (second !== offset) offset = second;

    return {
      utcDate: new Date(wallMs - offset),
      tzInfo: {
        zone: chosen.zone,
        offsetMinutes: offset / 60000,
        offsetLabel: formatOffset(offset),
        guessed: !isValidZone(zone),
        approximate: chosen.approximate
      }
    };
  }

  /**
   * All zones this browser knows, for the time zone picker
   */
  function listTimeZones() {
    const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return zones.includes('UTC') ? zones : ['UTC', ...zones];
  }

  return {
    localToUTC,
    guessTimeZone,
    isValidZone,
    listTimeZones,
    offsetMs,
    formatOffset,
    ZONE_REGIONS
  };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TimezoneHelper = TimezoneHelper;
}
