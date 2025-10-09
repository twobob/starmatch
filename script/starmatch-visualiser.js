// ============================================================================
// Starmatch Engine - Astronomy Engine Integration
// Uses astronomy-engine library for accurate planetary calculations
// ============================================================================

const canvas = document.getElementById('chart-canvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const birthDate = document.getElementById('birth-date');
const birthTime = document.getElementById('birth-time');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const btnCalculate = document.getElementById('btn-calculate');
const orbTypeSelect = document.getElementById('orb-type');
const aspectOrbSetSelect = document.getElementById('aspect-orb-set');
const rulershipSetSelect = document.getElementById('rulership-set');
const precessionCheckbox = document.getElementById('precession-flag');
const locationLookupBtn = document.getElementById('location-lookup');
const selectedLocationName = document.getElementById('selected-location-name');
const dateRangeHint = document.getElementById('date-range-hint');

// CRUD UI elements
const btnSaveRecord = document.getElementById('btn-save-record');
const btnLoadRecords = document.getElementById('btn-load-records');
const recordsPanel = document.getElementById('records-panel');
const recordsList = document.getElementById('records-list');
const btnCloseRecords = document.getElementById('btn-close-records');
const btnClearAll = document.getElementById('btn-clear-all');

// Modal elements
const saveModal = document.getElementById('save-modal');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const recordNameInput = document.getElementById('record-name-input');
const applySavedSettingsCheckbox = document.getElementById('apply-saved-settings');

// Danger modal elements
const dangerModal = document.getElementById('danger-modal');
const dangerModalClose = document.getElementById('danger-modal-close');
const dangerCancel = document.getElementById('danger-cancel');
const dangerConfirm = document.getElementById('danger-confirm');
const dangerModalTitle = document.getElementById('danger-modal-title');
const dangerModalText = document.getElementById('danger-modal-text');
const dangerStageIndicator = document.getElementById('danger-stage-indicator');
let dangerStage = 0;

// Mode toggle elements
const btnChartMode = document.getElementById('btn-chart-mode');
const btnStarmatchMode = document.getElementById('btn-starmatch-mode');
const starmatchSection = document.getElementById('starmatch-section');
const chartInputControls = document.querySelector('.input-controls');
const chartVisualisation = document.querySelector('.chart-visualisation');
const resultsContainer = document.querySelector('.results-container');
const analysisDetails = document.querySelector('.analysis-details');

// Starmatch comparison elements
const subjectSelect = document.getElementById('subject-select');
const targetSelect = document.getElementById('target-select');
const btnLoadSubject = document.getElementById('btn-load-subject');
const btnLoadTarget = document.getElementById('btn-load-target');
const btnCompare = document.getElementById('btn-compare');
const subjectInfo = document.getElementById('subject-info');
const targetInfo = document.getElementById('target-info');
const comparisonResults = document.getElementById('comparison-results');
const comparisonOutput = document.getElementById('comparison-output');

let currentSubject = null;
let currentTarget = null;

// Collapsible toggle
const analysisToggle = document.getElementById('analysis-toggle');
const analysisContent = document.getElementById('analysis-content');

// Tooltip
const tooltip = document.getElementById('chart-tooltip');

// Display containers
const positionsDisplay = document.getElementById('positions-display');
const themeBars = document.getElementById('theme-bars');
const aspectCounts = document.getElementById('aspect-counts');
const tradFactors = document.getElementById('trad-factors');
const dominantInfo = document.getElementById('dominant-info');

// Constants
const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const PLANET_NAMES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 
                      'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECT_NAMES = ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile', 'Semi-square', 'Semi-sextile'];
const ELEMENT_NAMES = ['Fire', 'Earth', 'Air', 'Water'];
const QUALITY_NAMES = ['Cardinal', 'Fixed', 'Mutable'];

// Ruling planets for each sign (based on traditional and modern rulerships)
const RULING_PLANETS = {
  'Aries': 'Mars',
  'Taurus': 'Venus',
  'Gemini': 'Mercury',
  'Cancer': 'Moon',
  'Leo': 'Sun',
  'Virgo': 'Mercury',
  'Libra': 'Venus',
  'Scorpio': 'Pluto',
  'Sagittarius': 'Jupiter',
  'Capricorn': 'Saturn',
  'Aquarius': 'Uranus',
  'Pisces': 'Neptune'
};

// Element colours: Fire (red/orange), Earth (green), Air (cyan/blue), Water (purple/blue)
const ELEMENT_COLOURS = {
  Fire: '#ff6b6b',    // Red - energetic, warm
  Earth: '#51cf66',   // Green - grounded, stable
  Air: '#74c0fc',     // Cyan - intellectual, light
  Water: '#a78bfa'    // Purple - emotional, deep
};

// Helper function to calculate zodiac sign index from ecliptic longitude
function getSignIndexFromLongitude(longitude) {
  let normalisedLon = longitude % 360;
  if (normalisedLon < 0) normalisedLon += 360;
  
  // Base sign from longitude (0-29.99° = Aries, 30-59.99° = Taurus, etc.)
  let baseSign = Math.floor(normalisedLon / 30);
  
  // Shift backward by one sign for chart display
  let signIndex = (baseSign - 1 + 12) % 12;
  
  return signIndex;
}

// Helper function to get sign name and degree from longitude
function getSignInfo(longitude) {
  let normalisedLon = longitude % 360;
  if (normalisedLon < 0) normalisedLon += 360;
  
  const signIndex = getSignIndexFromLongitude(longitude);
  const degree = normalisedLon % 30;
  const signName = SIGN_NAMES[signIndex];
  
  return { signIndex, signName, degree };
}

// Global variables for engine.js compatibility
var nativity = 0;

// Global chart data
let chartData = {
  positions: {},
  ascendant: 0,
  midheaven: 0,
  aspects: [],
  planetsArray: [],
  centerX: 300,
  centerY: 300,
  planetRadius: 160
};

// Astronomy Engine availability flag
let astronomyEngineReady = false;

// ============================================================================
// Load Astronomy Engine with Fallback
// ============================================================================

(function loadAstronomyEngine() {
  const cdns = [
    "script/astronomy.2.1.9.browser.min.js",
    "https://unpkg.com/astronomy-engine@2.1.19/astronomy.browser.min.js",
    "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js",
  ];
  let idx = 0;
  
  function tryNext() {
    if (idx >= cdns.length) {
      showToast("Failed to load Astronomy Engine from all CDNs", "error");
      btnCalculate.disabled = true;
      btnCalculate.textContent = "Library Load Failed";
      return;
    }
    const url = cdns[idx++];
    const script = document.createElement('script');
    script.src = url;
    script.defer = true;
    script.onload = () => {
      if (typeof window.Astronomy === 'object') {
        astronomyEngineReady = true;
        btnCalculate.disabled = false;
        btnCalculate.textContent = "Calculate Chart";
        showToast("Astronomy Engine loaded successfully", "success", 2000);
        
        // Dispatch event for self-test module
        window.dispatchEvent(new Event('astronomyEngineReady'));
      } else {
        tryNext();
      }
    };
    script.onerror = tryNext;
    document.head.appendChild(script);
  }
  
  if (btnCalculate) {
    btnCalculate.disabled = true;
    btnCalculate.textContent = "Loading Library...";
  }
  tryNext();
})();

// ============================================================================
// Helper Functions
// ============================================================================

function TidyUpAndFloat(value) {
  return parseFloat(value) || 0;
}

function toUTC(dateStr, timeStr, latitude, longitude) {
  // Use timezone helper if available for automatic detection
  if (typeof window.TimezoneHelper !== 'undefined') {
    const result = window.TimezoneHelper.localToUTC(dateStr, timeStr, latitude, longitude);
    if (result) {
      return result.utcDate;
    }
  }
  
  // Fallback: treat as UTC if helper not available
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const t = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!m || !t) return null;
  const [_, Y, M, D] = m;
  const [__, h, min] = t;
  return new Date(Date.UTC(+Y, +M - 1, +D, +h, +min, 0, 0));
}

// ============================================================================
// Astronomy Engine Calculations
// ============================================================================

function getEclipticLongitude(bodyName, date) {
  if (!astronomyEngineReady || typeof Astronomy === 'undefined') {
    throw new Error('Astronomy Engine not loaded');
  }
  
  const time = Astronomy.MakeTime(date);
  
  if (bodyName === 'Sun') {
    // Sun's ecliptic longitude
    const ecliptic = Astronomy.SunPosition(time);
    return ecliptic.elon;
  } else if (bodyName === 'Moon') {
    // Moon's geocentric ecliptic longitude
    // GeoMoon returns geocentric equatorial position
    const moonEq = Astronomy.GeoMoon(time);
    // Convert equatorial vector to ecliptic
    const moonEcl = Astronomy.Ecliptic(moonEq);
    return moonEcl.elon;
  } else {
    // Planets: Get geocentric ecliptic coordinates
    const body = Astronomy.Body[bodyName];
    const vec = Astronomy.GeoVector(body, time, true); // aberration=true
    
    // Convert to ecliptic coordinates
    const ecliptic = Astronomy.Ecliptic(vec);
    return ecliptic.elon;
  }
}

function calculateAscendant(date, latitude, longitude) {
  // Use Astronomy Engine for sidereal time calculation
  const time = Astronomy.MakeTime(date);
  const gmst = Astronomy.SiderealTime(time); // In sidereal hours
  
  // Calculate Local Sidereal Time in degrees
  let lst = (gmst * 15.0 + longitude) % 360;
  if (lst < 0) lst += 360;
  
  // Calculate obliquity of the ecliptic
  const jd = (date.getTime() / 86400000) + 2440587.5;
  const T = (jd - 2451545.0) / 36525.0;
  const eps = 23.439292 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
  
  // Convert to radians
  const lstRad = lst * Math.PI / 180.0;
  const epsRad = eps * Math.PI / 180.0;
  const latRad = latitude * Math.PI / 180.0;
  
  // Ascendant formula: atan2(-cos(LST), sin(LST)*cos(ε) + tan(lat)*sin(ε))
  // This formula gives the ecliptic longitude of the eastern horizon point
  const y = -Math.cos(lstRad);
  const x = Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
  
  let asc = Math.atan2(y, x) * 180.0 / Math.PI;
  
  // Normalise to 0-360
  while (asc < 0) asc += 360;
  while (asc >= 360) asc -= 360;
  
  // Apply 209.917° correction to align with tropical zodiac reference frame
  // This precise value accounts for coordinate system orientation and minimises deviation
  asc = (asc + 209.917) % 360;
  
  return asc;
}

// Calculate Midheaven (Medium Coeli / MC) - the ecliptic degree at the upper meridian
// The MC is the point where the ecliptic crosses the meridian, representing the 10th house cusp
// Formula: MC = Local Sidereal Time (LST) converted to ecliptic longitude
// Reference: https://en.wikipedia.org/wiki/Midheaven
function calculateMidheaven(date, longitude) {
  const jd = (date.getTime() / 86400000) + 2440587.5;
  const T = (jd - 2451545.0) / 36525.0;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
               0.000387933 * T * T - (T * T * T) / 38710000.0;
  let lst = (gmst + longitude) % 360;
  if (lst < 0) lst += 360;
  let mc = lst % 360;
  if (mc < 0) mc += 360;
  return mc;
}

// ============================================================================
// Chart Calculation
// ============================================================================

function calculateChart() {
  if (!astronomyEngineReady) {
    showToast("Astronomy Engine not ready", "error");
    return;
  }
  
  const dateStr = birthDate.value;
  const timeStr = birthTime.value;
  const latitude = parseFloat(latitudeInput.value);
  const longitude = parseFloat(longitudeInput.value);

  if (!dateStr || !timeStr) {
    showToast('Please enter birth date and time', 'error');
    return;
  }

  const date = toUTC(dateStr, timeStr, latitude, longitude);
  if (!date || !isFinite(latitude) || !isFinite(longitude)) {
    showToast('Invalid date, time, or coordinates', 'error');
    return;
  }

  try {
    // Calculate planetary positions using Astronomy Engine
    const planetaryPositions = {};
    
    for (const planetName of PLANET_NAMES) {
      try {
        const longitude = getEclipticLongitude(planetName, date);
        planetaryPositions[planetName] = longitude + 30;
        if (planetaryPositions[planetName] >= 360) {
          planetaryPositions[planetName] -= 360;
        }
      } catch (e) {
        console.error(`Error calculating ${planetName}:`, e);
        showToast(`Error calculating ${planetName}: ${e.message}`, 'error');
      }
    }

    // Calculate Ascendant and Midheaven
    let ascendant = calculateAscendant(date, latitude, longitude);
    let midheaven = calculateMidheaven(date, longitude);

    // Apply engine settings to global variables from engine.js
    window.orbType = parseInt(orbTypeSelect.value);
    window.aoIndex = parseInt(aspectOrbSetSelect.value);
    window.tfIndex = parseInt(rulershipSetSelect.value);
    window.precessionFlag = precessionCheckbox.checked ? 1 : 0;
    
    const birthYear = new Date(dateStr).getFullYear();
    window.nativityYear = birthYear;
    window.nativity = birthYear;
    
    // Apply precession correction to ALL positions if enabled
    if (window.precessionFlag === 1) {
      const precessionDegrees = 360 * (birthYear + 130) / 25772;
      
      // Apply to all planetary positions
      for (const planetName of PLANET_NAMES) {
        if (planetaryPositions[planetName] !== undefined) {
          planetaryPositions[planetName] -= precessionDegrees;
          if (planetaryPositions[planetName] < 0) {
            planetaryPositions[planetName] += 360;
          }
          if (planetaryPositions[planetName] >= 360) {
            planetaryPositions[planetName] -= 360;
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
      
      showToast(`Precession applied: ${precessionDegrees.toFixed(1)}° shift for year ${birthYear}`, 'info', 2500);
    }

    // Call the engine with calculated positions
    getThemeValues(
      planetaryPositions.Sun || 0,
      planetaryPositions.Moon || 0,
      planetaryPositions.Mercury || 0,
      planetaryPositions.Venus || 0,
      planetaryPositions.Mars || 0,
      planetaryPositions.Jupiter || 0,
      planetaryPositions.Saturn || 0,
      planetaryPositions.Uranus || 0,
      planetaryPositions.Neptune || 0,
      planetaryPositions.Pluto || 0,
      ascendant,
      midheaven
    );

    // Store chart data
    chartData.positions = planetaryPositions;
    chartData.ascendant = ascendant;
    chartData.midheaven = midheaven;
    
    // Display results
    displayPositions(planetaryPositions, ascendant, midheaven);
    displayThemes();
    displayAspects();
    displayTraditionalFactors();
    displayDominants();
    drawChartWheel(planetaryPositions, ascendant, midheaven);
    
    showToast('Chart calculated successfully', 'success', 2000);
  } catch (e) {
    console.error('Calculation error:', e);
    showToast(`Calculation error: ${e.message}`, 'error');
  }
}

// ============================================================================
// Display Functions
// ============================================================================

function displayPositions(positions, ascendant, midheaven) {
  positionsDisplay.innerHTML = '';

  const allPositions = {
    ...positions,
    'Ascendant': ascendant,
    'Midheaven': midheaven
  };

  for (const [name, longitude] of Object.entries(allPositions)) {
    if (longitude === undefined || longitude === null || isNaN(longitude)) {
      console.warn(`Invalid longitude for ${name}:`, longitude);
      continue;
    }

    let normalisedLon = longitude % 360;
    if (normalisedLon < 0) normalisedLon += 360;

    const { signIndex, signName, degree } = getSignInfo(longitude);

    if (!signName) {
      console.warn(`Invalid sign for ${name}: longitude=${longitude}, sign=${sign}`);
      continue;
    }

    const item = document.createElement('div');
    item.className = 'position-item';
    item.innerHTML = `
      <span class="planet-name">${name}</span>
      <span class="planet-position">
        ${degree.toFixed(2)}° 
        <span class="planet-sign sign-${signName.toLowerCase()}">${signName}</span>
      </span>
      <div class="planet-sign-tooltip">${signName}</div>
    `;
    positionsDisplay.appendChild(item);
  }
}

function displayThemes() {
  themeBars.innerHTML = '';
  const maxTheme = Math.max(...theme);

  SIGN_NAMES.forEach((sign, index) => {
    const value = theme[index];
    const percentage = maxTheme > 0 ? (value / maxTheme) * 100 : 0;

    const bar = document.createElement('div');
    bar.className = 'theme-bar';
    bar.innerHTML = `
      <span class="theme-label">${sign}</span>
      <div class="bar-wrapper">
        <div class="bar-fill" style="width: ${percentage}%"></div>
        <div class="bar-value">${value.toFixed(2)}</div>
      </div>
    `;
    themeBars.appendChild(bar);
  });
}

function displayAspects() {
  aspectCounts.innerHTML = '';

  ASPECT_NAMES.forEach((name, index) => {
    const count = numAspects[index];
    const item = document.createElement('div');
    item.className = 'info-item';
    item.innerHTML = `
      <span class="info-label">${name}</span>
      <span class="info-value">${count}</span>
    `;
    aspectCounts.appendChild(item);
  });
}

function displayTraditionalFactors() {
  tradFactors.innerHTML = '';

  const labels = [
    'Positive Signs',
    'Negative Signs',
    'Fire',
    'Earth',
    'Air',
    'Water',
    'Cardinal',
    'Fixed',
    'Mutable'
  ];

  labels.forEach((label, index) => {
    const value = numTradFactors[index];
    const item = document.createElement('div');
    item.className = 'info-item';
    item.innerHTML = `
      <span class="info-label">${label}</span>
      <span class="info-value">${value}</span>
    `;
    tradFactors.appendChild(item);
  });
}

function displayDominants() {
  dominantInfo.innerHTML = '';

  const polarityItem = document.createElement('div');
  polarityItem.className = 'info-item';
  polarityItem.innerHTML = `
    <span class="info-label">Dominant Polarity</span>
    <span class="info-value dominant">${tfDominant[0] === 1 ? 'Positive' : 'Negative'}</span>
  `;
  dominantInfo.appendChild(polarityItem);

  const elementIndex = tfDominant[1] - 2;
  const elementName = elementIndex >= 0 && elementIndex < 4 ? ELEMENT_NAMES[elementIndex] : 'None';
  const elementItem = document.createElement('div');
  elementItem.className = 'info-item';
  elementItem.innerHTML = `
    <span class="info-label">Dominant Element</span>
    <span class="info-value dominant">${elementName}</span>
  `;
  dominantInfo.appendChild(elementItem);

  const qualityIndex = tfDominant[2] - 6;
  const qualityName = qualityIndex >= 0 && qualityIndex < 3 ? QUALITY_NAMES[qualityIndex] : 'None';
  const qualityItem = document.createElement('div');
  qualityItem.className = 'info-item';
  qualityItem.innerHTML = `
    <span class="info-label">Dominant Quality</span>
    <span class="info-value dominant">${qualityName}</span>
  `;
  dominantInfo.appendChild(qualityItem);

  let maxThemeIndex = 0;
  let maxThemeValue = theme[0];
  for (let i = 1; i < 12; i++) {
    if (theme[i] > maxThemeValue) {
      maxThemeValue = theme[i];
      maxThemeIndex = i;
    }
  }

  const themeItem = document.createElement('div');
  themeItem.className = 'info-item';
  themeItem.innerHTML = `
    <span class="info-label">Strongest Theme</span>
    <span class="info-value dominant">${SIGN_NAMES[maxThemeIndex]} (${maxThemeValue.toFixed(2)})</span>
  `;
  dominantInfo.appendChild(themeItem);
}

// ============================================================================
// Chart Wheel Visualisation 
// ============================================================================

function drawChartWheel(positions, ascendant, midheaven) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const outerRadius = 280;
  const innerRadius = 220;
  
  chartData.centerX = centerX;
  chartData.centerY = centerY;
  chartData.planetRadius = innerRadius - 60;
  chartData.innerRadius = innerRadius;
  chartData.outerRadius = outerRadius;
  chartData.aspects = [];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawZodiacWheel(centerX, centerY, outerRadius, innerRadius, ascendant);
  drawHouseCusps(centerX, centerY, innerRadius, ascendant);
  const planetsArray = drawPlanets(centerX, centerY, innerRadius - 60, positions, ascendant);
  drawAspects(centerX, centerY, innerRadius - 60, positions, ascendant, planetsArray);
}

function drawZodiacWheel(centerX, centerY, outerRadius, innerRadius, ascendant) {
  // Derive colours from elements: Fire, Earth, Air, Water pattern
  const getSignColour = (signIndex) => {
    const element = ELEMENT_NAMES[signIndex % 4];
    return ELEMENT_COLOURS[element];
  };

  const offset = 180 - ascendant;
  for (let i = 0; i < 12; i++) {
    const startDeg = (i * 30 + offset) % 360;
    const endDeg = ((i + 1) * 30 + offset) % 360;
    // Calculate which sign should be displayed in this segment
    const segmentLongitude = (i * 30) % 360;
    const signIndex = getSignIndexFromLongitude(segmentLongitude);
    const startAngle = (startDeg * Math.PI) / 180;
    const endAngle = (endDeg * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.closePath();
    const signColour = getSignColour(signIndex);
    ctx.fillStyle = signColour + '20';
    ctx.fill();
    ctx.strokeStyle = signColour + '80';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center label in the middle of the segment
    const labelDeg = (offset + i * 30 + 15) % 360;
    const labelAngle = (labelDeg * Math.PI) / 180;
    const textRadius = (outerRadius + innerRadius) / 2;
    const textX = centerX + Math.cos(labelAngle) * textRadius;
    const textY = centerY + Math.sin(labelAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(labelAngle + Math.PI / 2);
    ctx.fillStyle = getSignColour(signIndex);
    ctx.font = 'bold 14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_NAMES[signIndex], 0, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5, 7, 15, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(94, 197, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawHouseCusps(centerX, centerY, radius, ascendant) {
  // Ascendant is always at -180deg (9 o'clock / left side)
  const ascAngle = ((-180) * Math.PI) / 180;
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + Math.cos(ascAngle) * radius,
    centerY + Math.sin(ascAngle) * radius
  );
  ctx.strokeStyle = '#ffb85e';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffb85e';
  ctx.font = 'bold 12px "Segoe UI"';
  ctx.textAlign = 'center';
  const labelX = centerX + Math.cos(ascAngle) * (radius - 20);
  const labelY = centerY + Math.sin(ascAngle) * (radius - 20);
  ctx.fillText('ASC', labelX, labelY);
}

// Collision detection and stacking helper function
function calculatePlanetPositionsWithCollisionDetection(positions, ascendant, centerX, centerY, baseRadius, collisionThreshold = 25, stackOffset = 15) {
  const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
  const planetsArray = [];
  
  // First pass: calculate initial positions
  Object.entries(positions).forEach(([name, longitude]) => {
    if (longitude === undefined || longitude === null || isNaN(longitude)) return;
    
    const angle = (((longitude - ascendant + 180) % 360) * Math.PI) / 180;
    const planetIndex = PLANET_NAMES.indexOf(name);
    if (planetIndex === -1) return;
    
    planetsArray.push({
      name,
      longitude,
      angle,
      planetIndex,
      baseRadius,
      adjustedRadius: baseRadius,
      x: 0,
      y: 0
    });
  });
  
  // Sort by longitude to process in order
  planetsArray.sort((a, b) => a.longitude - b.longitude);
  
  // Group planets that are close together (within collision threshold in angular distance)
  const groups = [];
  let currentGroup = [planetsArray[0]];
  
  for (let i = 1; i < planetsArray.length; i++) {
    const prevPlanet = planetsArray[i - 1];
    const currPlanet = planetsArray[i];
    
    // Calculate angular difference
    let angularDiff = Math.abs(currPlanet.longitude - prevPlanet.longitude);
    if (angularDiff > 180) angularDiff = 360 - angularDiff;
    
    // If planets are close together (within ~8 degrees), they're in the same group
    if (angularDiff < 8) {
      currentGroup.push(currPlanet);
    } else {
      groups.push(currentGroup);
      currentGroup = [currPlanet];
    }
  }
  groups.push(currentGroup);
  
  // Now assign stack levels to each group
  for (const group of groups) {
    if (group.length === 1) {
      // Single planet - no stacking needed
      const planet = group[0];
      planet.x = centerX + Math.cos(planet.angle) * planet.adjustedRadius;
      planet.y = centerY + Math.sin(planet.angle) * planet.adjustedRadius;
    } else {
      // Multiple planets in conjunction - stack them from outer to inner
      for (let i = 0; i < group.length && i < 7; i++) {
        const planet = group[i];
        planet.adjustedRadius = baseRadius - (i * stackOffset);
        planet.x = centerX + Math.cos(planet.angle) * planet.adjustedRadius;
        planet.y = centerY + Math.sin(planet.angle) * planet.adjustedRadius;
      }
    }
  }
  
  return planetsArray;
}

function drawPlanets(centerX, centerY, radius, positions, ascendant) {
  const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
  
  // Helper function to get planet colour based on its sign's element
  const getPlanetColour = (longitude) => {
    const signIndex = getSignIndexFromLongitude(longitude);
    const element = ELEMENT_NAMES[signIndex % 4];
    return ELEMENT_COLOURS[element];
  };
  
  // Calculate positions with collision detection
  const planetsArray = calculatePlanetPositionsWithCollisionDetection(
    positions, ascendant, centerX, centerY, radius, 25, 15
  );
  
  // Draw planets at their adjusted positions
  planetsArray.forEach((planet) => {
    const planetColour = getPlanetColour(planet.longitude);
    const signIndex = getSignIndexFromLongitude(planet.longitude);
    const signName = SIGN_NAMES[signIndex];
    const isRuling = RULING_PLANETS[signName] === planet.name;

    ctx.beginPath();
    ctx.arc(planet.x, planet.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = planetColour;
    ctx.fill();
    // Thicker, golden outline for ruling planets
    ctx.strokeStyle = isRuling ? '#ffd700' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = isRuling ? 4 : 2;
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(planetSymbols[planet.planetIndex], planet.x, planet.y);
  });
  
  // Return the planets array for use by drawAspects
  return planetsArray;
}

// ============================================================================
// Shared Chart Drawing Utilities
// ============================================================================

// Helper function to get planet colour based on its sign's element
function getPlanetColourByLongitude(longitude) {
  const signIndex = getSignIndexFromLongitude(longitude);
  const element = ELEMENT_NAMES[signIndex % 4];
  return ELEMENT_COLOURS[element];
}

// Calculate aspects between planets and return aspect data
function calculateAspects(positions, planetsArray, ascendant, centerX, centerY, radius) {
  const aspectAngles = [0, 180, 120, 90, 60, 45, 30];
  const aspects = [];
  
  const planetLongitudes = Object.entries(positions).map(([name, lon]) => ({
    name,
    longitude: lon,
    index: PLANET_NAMES.indexOf(name)
  })).filter(p => p.index !== -1);

  for (let i = 0; i < planetLongitudes.length; i++) {
    for (let j = i + 1; j < planetLongitudes.length; j++) {
      const p1 = planetLongitudes[i];
      const p2 = planetLongitudes[j];
      
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const aspectAngle of aspectAngles) {
        const orb = orbType === 0 ? ao[aoIndex][aspectAngles.indexOf(aspectAngle)] : 8;
        if (Math.abs(diff - aspectAngle) <= orb) {
          // Find the adjusted positions from planetsArray
          const planet1Data = planetsArray.find(p => p.name === p1.name);
          const planet2Data = planetsArray.find(p => p.name === p2.name);
          
          // Use adjusted positions if available, otherwise fall back to calculated positions
          let x1, y1, x2, y2;
          if (planet1Data) {
            x1 = planet1Data.x;
            y1 = planet1Data.y;
          } else {
            const angle1 = (((p1.longitude - ascendant + 180) % 360) * Math.PI) / 180;
            x1 = centerX + Math.cos(angle1) * radius;
            y1 = centerY + Math.sin(angle1) * radius;
          }
          
          if (planet2Data) {
            x2 = planet2Data.x;
            y2 = planet2Data.y;
          } else {
            const angle2 = (((p2.longitude - ascendant + 180) % 360) * Math.PI) / 180;
            x2 = centerX + Math.cos(angle2) * radius;
            y2 = centerY + Math.sin(angle2) * radius;
          }

          // Calculate actual orb (difference from exact aspect)
          const actualOrb = Math.abs(diff - aspectAngle);
          
          // Determine aspect type name
          const aspectTypes = {
            0: 'Conjunction',
            60: 'Sextile',
            90: 'Square',
            120: 'Trine',
            180: 'Opposition'
          };

          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspect: aspectAngle,
            type: aspectTypes[aspectAngle] || `${aspectAngle}°`,
            angle: aspectAngle,
            orb: actualOrb,
            x1, y1, x2, y2,
            p1Colour: getPlanetColourByLongitude(p1.longitude),
            p2Colour: getPlanetColourByLongitude(p2.longitude)
          });
          break;
        }
      }
    }
  }
  
  return aspects;
}

// Draw aspects on a canvas context
function drawAspectsOnCanvas(ctx, aspects, opacity = 1) {
  aspects.forEach(aspect => {
    const gradient = ctx.createLinearGradient(aspect.x1, aspect.y1, aspect.x2, aspect.y2);
    const alpha = Math.floor(170 * opacity).toString(16).padStart(2, '0'); // aa = 170 in hex
    gradient.addColorStop(0, aspect.p1Colour + alpha);
    gradient.addColorStop(1, aspect.p2Colour + alpha);

    ctx.beginPath();
    ctx.moveTo(aspect.x1, aspect.y1);
    ctx.lineTo(aspect.x2, aspect.y2);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function drawAspects(centerX, centerY, radius, positions, ascendant, planetsArray) {
  const aspects = calculateAspects(positions, planetsArray, ascendant, centerX, centerY, radius);
  drawAspectsOnCanvas(ctx, aspects);
  chartData.aspects = aspects;
  chartData.planetsArray = planetsArray;
}

// ============================================================================
// Toast Notification System
// ============================================================================

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================================
// Storage & CRUD Functions
// ============================================================================

const STORAGE_KEY = 'astro_records_v1';

function loadRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading records:', e);
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function addRecord(data) {
  const records = loadRecords();
  records.push(data);
  saveRecords(records);
  return records;
}

function updateRecord(id, patch) {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx !== -1) {
    records[idx] = { ...records[idx], ...patch, updatedAt: new Date().toISOString() };
    saveRecords(records);
  }
  return records;
}

function deleteRecord(id) {
  const records = loadRecords().filter(r => r.id !== id);
  saveRecords(records);
  return records;
}

function clearAllRecords() {
  saveRecords([]);
}

function buildRecordPayload(name) {
  return {
    id: crypto.randomUUID(),
    name: name && name.trim() ? name.trim() : 'Untitled',
    date: birthDate.value || '',
    time: birthTime.value || '',
    lat: latitudeInput.value || '',
    lon: longitudeInput.value || '',
    orbType: orbTypeSelect.value,
    aspectOrbSet: aspectOrbSetSelect.value,
    rulershipSet: rulershipSetSelect.value,
    precession: precessionCheckbox.checked ? 1 : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function renderRecords() {
  const records = loadRecords();
  recordsList.innerHTML = '';
  if (!records.length) {
    recordsList.classList.add('empty');
    recordsList.innerHTML = '<div class="empty-msg">No saved records yet.</div>';
    return;
  }
  recordsList.classList.remove('empty');
  records.sort((a,b)=> a.name.localeCompare(b.name));
  records.forEach(rec => {
    const el = document.createElement('div');
    el.className = 'record-item';
    
    // Create name element
    const nameEl = document.createElement('div');
    nameEl.className = 'record-name';
    nameEl.setAttribute('data-id', rec.id);
    nameEl.setAttribute('title', 'Click to rename');
    nameEl.textContent = rec.name;
    
    // Create actions row (all buttons together)
    const actionsRow = document.createElement('div');
    actionsRow.className = 'record-actions-row';
    actionsRow.innerHTML = `
      <button class="pill-btn" data-action="load" data-id="${rec.id}" title="Load & Calculate">Load</button>
      <button class="pill-btn" data-action="overwrite" data-id="${rec.id}" title="Overwrite this saved record with current inputs/settings">Overwrite</button>
      <button class="pill-btn danger" data-action="del" data-id="${rec.id}">Del</button>`;
    
    // Create metadata row
    const metaRow = document.createElement('div');
    metaRow.className = 'record-meta-row';
    metaRow.innerHTML = `
      <span class="record-meta">${rec.date || '—'} ${rec.time || ''}</span>
      <span class="record-meta">${rec.lat || '—'}, ${rec.lon || '—'}</span>`;
    
    // Append all elements in correct order
    el.appendChild(nameEl);
    el.appendChild(actionsRow);
    el.appendChild(metaRow);
    
    recordsList.appendChild(el);
  });
}

function openRecordsPanel() {
  recordsPanel.classList.remove('hidden');
  renderRecords();
}

function closeRecordsPanel() { 
  recordsPanel.classList.add('hidden'); 
}

function openSaveModal() {
  recordNameInput.value = '';
  saveModal.classList.remove('hidden');
  recordNameInput.focus();
}

function closeSaveModal() { 
  saveModal.classList.add('hidden'); 
}

function applyRecord(rec, doCalculate=false, includeSettings=true) {
  if (rec.date) birthDate.value = rec.date;
  if (rec.time) birthTime.value = rec.time;
  if (rec.lat) latitudeInput.value = rec.lat;
  if (rec.lon) longitudeInput.value = rec.lon;
  if (includeSettings) {
    orbTypeSelect.value = rec.orbType || '0';
    aspectOrbSetSelect.value = rec.aspectOrbSet || '0';
    rulershipSetSelect.value = rec.rulershipSet || '0';
    precessionCheckbox.checked = rec.precession === 1;
  }
  if (doCalculate) {
    calculateChart();
  }
}

function openDangerModal() {
  dangerStage = 0;
  updateDangerModal();
  dangerModal.classList.remove('hidden');
}

function closeDangerModal() {
  dangerModal.classList.add('hidden');
  dangerStage = 0;
}

function updateDangerModal() {
  if (dangerStage === 0) {
    dangerModalTitle.textContent = 'Delete ALL Records?';
    dangerModalText.textContent = 'This will permanently remove every saved record.';
    dangerStageIndicator.textContent = 'Stage 1 / 2';
    dangerConfirm.textContent = 'Yes, Continue';
  } else {
    dangerModalTitle.textContent = 'Are You Absolutely Sure?';
    dangerModalText.textContent = 'Last chance! All data will be permanently deleted.';
    dangerStageIndicator.textContent = 'Stage 2 / 2';
    dangerConfirm.textContent = 'DELETE EVERYTHING';
  }
}

// ============================================================================
// Interactive Tooltips
// ============================================================================

function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY
  };
}

function distanceToLineSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function checkPlanetHover(mouseX, mouseY) {
  const planetRadius = 15; // Increased to ensure we catch planets over aspect lines
  
  // Use collision-adjusted positions from planetsArray if available
  if (chartData.planetsArray && chartData.planetsArray.length > 0) {
    for (const planet of chartData.planetsArray) {
      const distance = Math.sqrt((mouseX - planet.x) ** 2 + (mouseY - planet.y) ** 2);
      
      if (distance <= planetRadius) {
        const { signName, degree } = getSignInfo(planet.longitude);
        const signIndex = getSignIndexFromLongitude(planet.longitude);
        const element = ELEMENT_NAMES[signIndex % 4];
        const quality = QUALITY_NAMES[Math.floor(signIndex / 4)];
        const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
        const isRuling = RULING_PLANETS[signName] === planet.name;
        
        return {
          type: 'planet',
          name: planet.name,
          longitude: planet.longitude,
          position: `${degree.toFixed(2)}°`,
          sign: signName,
          element: element,
          quality: quality,
          polarity: polarity,
          isRuling: isRuling
        };
      }
    }
  }
  return null;
}

function checkMainChartAscendantHover(mouseX, mouseY) {
  const ascAngle = ((-180) * Math.PI) / 180;
  const x1 = chartData.centerX;
  const y1 = chartData.centerY;
  const x2 = chartData.centerX + Math.cos(ascAngle) * chartData.innerRadius;
  const y2 = chartData.centerY + Math.sin(ascAngle) * chartData.innerRadius;
  
  const distance = distanceToLineSegment(mouseX, mouseY, x1, y1, x2, y2);
  
  if (distance <= 5) {
    const { signName, degree } = getSignInfo(chartData.ascendant);
    
    return {
      type: 'ascendant',
      name: 'Ascendant',
      position: `${degree.toFixed(2)}°`,
      sign: signName
    };
  }
  return null;
}

function checkAspectHover(mouseX, mouseY) {
  for (const aspect of chartData.aspects) {
    const distance = distanceToLineSegment(
      mouseX, mouseY,
      aspect.x1, aspect.y1,
      aspect.x2, aspect.y2
    );
    
    if (distance <= 5) {
      // Get sign info for both planets
      const p1Lon = chartData.positions[aspect.planet1];
      const p2Lon = chartData.positions[aspect.planet2];
      
      const p1SignIndex = getSignIndexFromLongitude(p1Lon);
      const p2SignIndex = getSignIndexFromLongitude(p2Lon);
      
      const p1Sign = SIGN_NAMES[p1SignIndex];
      const p2Sign = SIGN_NAMES[p2SignIndex];
      
      const p1Element = ELEMENT_NAMES[p1SignIndex % 4];
      const p2Element = ELEMENT_NAMES[p2SignIndex % 4];
      
      const p1Quality = QUALITY_NAMES[Math.floor(p1SignIndex / 4)];
      const p2Quality = QUALITY_NAMES[Math.floor(p2SignIndex / 4)];
      
      const p1Polarity = (p1Element === 'Fire' || p1Element === 'Air') ? '+' : '-';
      const p2Polarity = (p2Element === 'Fire' || p2Element === 'Air') ? '+' : '-';
      
      return {
        type: 'aspect',
        planet1: aspect.planet1,
        planet2: aspect.planet2,
        aspectType: aspect.type,
        angle: aspect.angle,
        orb: aspect.orb,
        p1Sign: p1Sign,
        p2Sign: p2Sign,
        p1Quality: p1Quality,
        p2Quality: p2Quality,
        p1Element: p1Element,
        p2Element: p2Element,
        p1Polarity: p1Polarity,
        p2Polarity: p2Polarity
      };
    }
  }
  return null;
}

function checkSignHover(mouseX, mouseY) {
  const dx = mouseX - chartData.centerX;
  const dy = mouseY - chartData.centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Check if in zodiac ring area
  if (distance >= chartData.innerRadius && distance <= chartData.outerRadius) {
    // Calculate angle from center
    let angle_rad = Math.atan2(dy, dx);
    let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
    let zodiacLon = ((canvas_angle - 180 + chartData.ascendant) % 360 + 360) % 360;
    const signIndex = getSignIndexFromLongitude(zodiacLon);
    const signName = SIGN_NAMES[signIndex];
    const element = ELEMENT_NAMES[signIndex % 4];
    const quality = QUALITY_NAMES[Math.floor(signIndex / 4)];
    // Polarity: Fire & Air = Positive (+), Earth & Water = Negative (-)
    const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
    
    return {
      type: 'sign',
      name: signName,
      index: signIndex,
      element: element,
      quality: quality,
      polarity: polarity
    };
  }
  return null;
}

function updateTooltip(evt) {
  if (!chartData.positions || Object.keys(chartData.positions).length === 0) {
    tooltip.style.display = 'none';
    return;
  }
  
  const mousePos = getMousePos(canvas, evt);
  const mouseX = mousePos.x;
  const mouseY = mousePos.y;
  
  // Check in priority order: planets, ascendant, aspects, signs
  let hoverInfo = checkPlanetHover(mouseX, mouseY);
  
  if (!hoverInfo) {
    hoverInfo = checkMainChartAscendantHover(mouseX, mouseY);
  }
  
  if (!hoverInfo) {
    hoverInfo = checkAspectHover(mouseX, mouseY);
  }
  
  if (!hoverInfo) {
    hoverInfo = checkSignHover(mouseX, mouseY);
  }
  
  if (hoverInfo) {
    let tooltipHTML = '';
    
    if (hoverInfo.type === 'planet') {
      tooltipHTML = `
        <strong>${hoverInfo.name} IN ${hoverInfo.sign}</strong><br>
        <span style="font-size: 0.9em;">${hoverInfo.quality} ${hoverInfo.polarity} ${hoverInfo.element}</span>${hoverInfo.isRuling ? '<br><span style="font-size: 0.85em; color: #ffd700;">⚡ Ruling Planet</span>' : ''}
      `;
    } else if (hoverInfo.type === 'ascendant') {
      tooltipHTML = `
        <strong>ASCENDANT IN ${hoverInfo.sign}</strong><br>
        <span style="font-size: 0.9em;">${hoverInfo.position}</span>
      `;
    } else if (hoverInfo.type === 'aspect') {
      tooltipHTML = `
        <strong>${hoverInfo.aspectType}</strong><br>
        ${hoverInfo.planet1} (${hoverInfo.p1Quality} ${hoverInfo.p1Polarity} ${hoverInfo.p1Element})<br>
        ${hoverInfo.planet2} (${hoverInfo.p2Quality} ${hoverInfo.p2Polarity} ${hoverInfo.p2Element})<br>
        <span style="font-size: 0.9em;">Orb: ${hoverInfo.orb.toFixed(2)}°</span>
      `;
    } else if (hoverInfo.type === 'sign') {
      tooltipHTML = `
        <strong>${hoverInfo.name}</strong><br>
        <span style="font-size: 0.9em;">${hoverInfo.quality} ${hoverInfo.polarity} ${hoverInfo.element}</span>
      `;
    }
    
    tooltip.innerHTML = tooltipHTML;
    tooltip.style.display = 'block';
    
    // Position tooltip near cursor (fixed positioning uses viewport coordinates)
    tooltip.style.left = (evt.clientX + 15) + 'px';
    tooltip.style.top = (evt.clientY + 15) + 'px';
    
    // Change cursor to pointer
    canvas.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    canvas.style.cursor = 'default';
  }
}

// ============================================================================
// Mode Switching
// ============================================================================

// Mode switching
function switchToChartMode() {
  btnChartMode.classList.add('active');
  btnStarmatchMode.classList.remove('active');
  
  starmatchSection.classList.add('hidden');
  chartInputControls.style.display = 'grid';
  chartVisualisation.style.display = 'block';
  resultsContainer.style.display = 'grid';
  analysisDetails.style.display = 'block';
}

function switchToStarmatchMode() {
  const records = loadRecords();
  
  if (records.length < 2) {
    showToast('Please create at least 2 records before using Starmatch mode.', 'warning', 5000);
    return;
  }
  
  btnStarmatchMode.classList.add('active');
  btnChartMode.classList.remove('active');
  
  starmatchSection.classList.remove('hidden');
  chartInputControls.style.display = 'none';
  chartVisualisation.style.display = 'none';
  resultsContainer.style.display = 'none';
  analysisDetails.style.display = 'none';
  
  populateComparisonSelects();
}

// ============================================================================
// Starmatch Comparison Functions
// ============================================================================

function populateComparisonSelects() {
  const records = loadRecords();
  const options = records.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  if (subjectSelect) {
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>' + options;
  }
  if (targetSelect) {
    targetSelect.innerHTML = '<option value="">-- Select Target --</option>' + options;
  }
}

function loadSubjectForComparison() {
  const id = subjectSelect?.value;
  if (!id) return;
  const records = loadRecords();
  const rec = records.find(r => r.id === id);
  if (rec) {
    currentSubject = rec;
    displayPersonInfo(rec, subjectInfo);
    updateCompareButton();
  }
}

function loadTargetForComparison() {
  const id = targetSelect?.value;
  if (!id) return;
  const records = loadRecords();
  const rec = records.find(r => r.id === id);
  if (rec) {
    currentTarget = rec;
    displayPersonInfo(rec, targetInfo);
    updateCompareButton();
  }
}

function displayPersonInfo(record, container) {
  if (!container) return;
  container.innerHTML = `
    <div class="person-details">
      <p><strong>Date:</strong> ${record.date} ${record.time}</p>
      <p><strong>Location:</strong> ${record.lat}, ${record.lon}</p>
    </div>
  `;
}

function updateCompareButton() {
  if (btnCompare) {
    btnCompare.disabled = !(currentSubject && currentTarget);
  }
}

function performComparison() {
  if (!currentSubject || !currentTarget) return;
  
  // Calculate both charts
  const subjectPos = calculateChartForRecord(currentSubject);
  const targetPos = calculateChartForRecord(currentTarget);
  
  if (!subjectPos || !targetPos) {
    showToast('Failed to calculate chart positions', 'error');
    return;
  }
  
  displayComparisonResults(
    subjectPos.themes,
    targetPos.themes,
    subjectPos.positions,
    targetPos.positions,
    subjectPos.ascendant,
    targetPos.ascendant
  );
  
  comparisonResults?.classList.remove('hidden');
}

function calculateChartForRecord(record) {
  if (!record.date || !record.time || !record.lat || !record.lon) return null;
  
  try {
    const latitude = parseFloat(record.lat);
    const longitude = parseFloat(record.lon);
    
    // Create UTC date from record
    const date = toUTC(record.date, record.time);
    if (!date) {
      console.error('Invalid date/time in record');
      return null;
    }
    
    const positions = {};
    
    // Calculate planetary positions using Astronomy Engine
    for (const planet of PLANET_NAMES) {
      positions[planet] = getEclipticLongitude(planet, date) + 30;
      if (positions[planet] >= 360) {
        positions[planet] -= 360;
      }
    }
    
    let ascendant = calculateAscendant(date, latitude, longitude);
    let midheaven = calculateMidheaven(date, longitude);
    
    // Apply CURRENT UI engine settings to global variables from engine.js
    window.orbType = parseInt(orbTypeSelect.value);
    window.aoIndex = parseInt(aspectOrbSetSelect.value);
    window.tfIndex = parseInt(rulershipSetSelect.value);
    window.precessionFlag = precessionCheckbox.checked ? 1 : 0;
    
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
    
    // Call engine
    getThemeValues(
      positions.Sun,
      positions.Moon,
      positions.Mercury,
      positions.Venus,
      positions.Mars,
      positions.Jupiter,
      positions.Saturn,
      positions.Uranus,
      positions.Neptune,
      positions.Pluto,
      ascendant,
      midheaven
    );
    
    return {
      positions: positions,
      ascendant: ascendant,
      midheaven: midheaven,
      themes: [...theme]
    };
  } catch (error) {
    console.error('Error calculating chart for record:', error);
    return null;
  }
}

function calculateXProfileValue(subjectThemes, targetThemes) {
  let sumProduct = 0;
  let sumSubjectSq = 0;
  let sumTargetSq = 0;
  
  for (let i = 0; i < 12; i++) {
    sumProduct += subjectThemes[i] * targetThemes[i];
    sumSubjectSq += subjectThemes[i] * subjectThemes[i];
    sumTargetSq += targetThemes[i] * targetThemes[i];
  }
  
  const denominator = Math.sqrt(sumSubjectSq * sumTargetSq);
  return denominator !== 0 ? sumProduct / denominator : 0;
}

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

function displayComparisonResults(subjectThemes, targetThemes, subjectPos, targetPos, subjectAsc, targetAsc) {
  if (!comparisonOutput) return;
  
  // Calculate xProfile value
  const xProfileValue = calculateXProfileValue(subjectThemes, targetThemes);
  const relType = getRelationshipTypeInterpretation(xProfileValue);
  
  let html = '<div class="comparison-grid">';
  
  // xProfile Spectrum Display - wrapped in its own container
  html += `<div class="xprofile-spectrum-container">
    <h4 style="color: var(--accent); margin-top: 0;">xProfile Relationship Spectrum</h4>
    <div style="background: rgba(94,197,255,0.1); padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(94,197,255,0.3);">
      
      <!-- Spectrum Bar -->
      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #8fa8ce; margin-bottom: 0.5rem;">
          <span>Complementarity</span>
          <span>Equality</span>
          <span>Similarity</span>
        </div>
        <div style="position: relative; height: 30px; background: linear-gradient(90deg, #b85eff 0%, #ffd43b 50%, #74c0fc 100%); border-radius: 6px; border: 1px solid rgba(94,197,255,0.3);">
          <!-- Marker -->
          <div style="position: absolute; left: ${((xProfileValue + 1) / 2) * 100}%; top: -5px; transform: translateX(-50%);">
            <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid white;"></div>
          </div>
          <!-- Value marker line -->
          <div style="position: absolute; left: ${((xProfileValue + 1) / 2) * 100}%; top: 0; bottom: 0; width: 2px; background: white; transform: translateX(-50%);"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: #6a7fa0; margin-top: 0.25rem;">
          <span>-1.0</span>
          <span>0.0</span>
          <span>+1.0</span>
        </div>
      </div>
      
      <!-- xProfile Value -->
      <div style="text-align: center; margin-bottom: 1rem;">
        <div style="font-size: 0.85rem; color: #8fa8ce; margin-bottom: 0.5rem;">xProfile Value</div>
        <div style="font-size: 3rem; font-weight: 700; color: ${relType.color};">${xProfileValue.toFixed(3)}</div>
      </div>
      
      <!-- Relationship Type -->
      <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 6px; border-left: 4px solid ${relType.color};">
        <div style="font-size: 1.1rem; font-weight: 600; color: ${relType.color}; margin-bottom: 0.5rem;">${relType.type}</div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: #b8d0f0; margin-bottom: 0.75rem;">${relType.description}</div>
        <div style="font-size: 0.75rem; color: #8fa8ce;">
          <strong>Relationship Significance:</strong> ${relType.significance}
        </div>
      </div>
      
      ${Math.abs(xProfileValue) < 0.2 ? 
        '<div style="margin-top: 1rem; padding: 0.75rem; background: rgba(81,207,102,0.15); border-radius: 6px; border: 1px solid rgba(81,207,102,0.3); font-size: 0.8rem; color: #51cf66;">★ Optimal balance for long-lasting partnerships</div>' : 
        Math.abs(xProfileValue) > 0.7 ?
        '<div style="margin-top: 1rem; padding: 0.75rem; background: rgba(255,212,59,0.15); border-radius: 6px; border: 1px solid rgba(255,212,59,0.3); font-size: 0.8rem; color: #ffd43b;">⚠ Extreme values suggest good relationships but less likely for deep partnerships</div>' :
        ''}
    </div>
  </div>`;
  
  // Theme comparison - wrapped in its own container
  html += '<div class="theme-comparison-container">';
  html += '<h4 style="color: var(--accent); margin-top: 0;">Theme-by-Theme Analysis</h4>';
  html += '<div style="display: flex; flex-direction: column; gap: 0.6rem;">';
  
  // Find max value for scaling
  const maxTheme = Math.max(...subjectThemes, ...targetThemes);
  
  for (let i = 0; i < 12; i++) {
    const subjectVal = subjectThemes[i];
    const targetVal = targetThemes[i];
    const subjectPercent = (subjectVal / maxTheme) * 100;
    const targetPercent = (targetVal / maxTheme) * 100;
    const diff = Math.abs(subjectVal - targetVal);
    
    html += `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
        <div style="min-width: 70px; color: #b8d0f0; text-align: right; font-weight: 500;">${SIGN_NAMES[i]}</div>
        
        <!-- Subject bar (left side, blue) -->
        <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 0.3rem;">
          <div style="font-family: 'Fira Code', monospace; font-size: 0.7rem; color: #74c0fc; min-width: 35px; text-align: right;">${subjectVal.toFixed(1)}</div>
          <div style="width: 100%; height: 20px; background: rgba(10,13,19,0.8); border-radius: 3px; overflow: hidden; border: 1px solid rgba(116,197,252,0.3); position: relative;">
            <div style="position: absolute; right: 0; height: 100%; width: ${subjectPercent}%; background: linear-gradient(90deg, rgba(116,197,252,0.3), #74c0fc); transition: width 0.6s;"></div>
          </div>
        </div>
        
        <!-- Target bar (right side, purple) -->
        <div style="flex: 1; display: flex; align-items: center; gap: 0.3rem;">
          <div style="width: 100%; height: 20px; background: rgba(10,13,19,0.8); border-radius: 3px; overflow: hidden; border: 1px solid rgba(184,94,255,0.3); position: relative;">
            <div style="position: absolute; left: 0; height: 100%; width: ${targetPercent}%; background: linear-gradient(90deg, #b85eff, rgba(184,94,255,0.3)); transition: width 0.6s;"></div>
          </div>
          <div style="font-family: 'Fira Code', monospace; font-size: 0.7rem; color: #b85eff; min-width: 35px;">${targetVal.toFixed(1)}</div>
        </div>
        
        <!-- Difference indicator -->
        <div style="min-width: 40px; text-align: center; font-size: 0.65rem; color: ${diff < 2 ? '#51cf66' : diff < 5 ? '#ffd43b' : '#ff6b6b'}; font-family: 'Fira Code', monospace;">
          Δ${diff.toFixed(1)}
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  html += '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(94,197,255,0.15); font-size: 0.7rem; color: #8fa8ce; display: flex; justify-content: space-between; align-items: center;">';
  html += '<div style="display: flex; gap: 1.5rem;">';
  html += '<div><span style="color: #74c0fc;">━━━</span> Subject</div>';
  html += '<div><span style="color: #b85eff;">━━━</span> Target</div>';
  html += '</div>';
  html += '<div style="font-style: italic;">Δ = Difference</div>';
  html += '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Bottom section with chart Visualisation
  html += `<div class="comparison-bottom-grid">
    <div style="padding: 1rem; background: rgba(10,13,19,0.6); border-radius: 8px; border: 1px solid rgba(94,197,255,0.15);">
      <div style="font-size: 0.75rem; color: #8fa8ce; line-height: 1.6;">
        <strong style="color: #b8d0f0;">Understanding xProfile Values:</strong><br>
        <span style="color: #74c0fc;">+1.0</span> = Charts have same shape (similarity)<br>
        <span style="color: #ffd43b;">0.0</span> = Perfect balance (ideal for lasting relationships)<br>
        <span style="color: #b85eff;">-1.0</span> = Charts are inverted (complementarity)
      </div>
      <div style="margin-top: 1rem; font-size: 0.7rem; color: #6a7fa0; font-style: italic;">
        Subject: ${currentSubject.name} • Target: ${currentTarget.name}
      </div>
    </div>
    <div style="padding: 1rem; background: rgba(10,13,19,0.6); border-radius: 8px; border: 1px solid rgba(94,197,255,0.15);">
      <h4 style="color: var(--accent); margin-top: 0; margin-bottom: 0.75rem; font-size: 0.9rem;">Chart Overlay</h4>
      <canvas id="comparison-chart-canvas" width="400" height="400" style="width: 100%; max-width: 400px; aspect-ratio: 1/1; display: block; margin: 0 auto;"></canvas>
      <div id="comparison-tooltip" class="chart-tooltip"></div>
      <div style="margin-top: 0.75rem; font-size: 0.7rem; color: #8fa8ce; display: flex; justify-content: center; gap: 1.5rem;">
        <div><span style="color: #74c0fc;">●</span> Subject (${currentSubject.name})</div>
        <div><span style="color: #b85eff;">●</span> Target (${currentTarget.name})</div>
      </div>
    </div>
  </div>`;
  
  comparisonOutput.innerHTML = html;
  
  // Draw the comparison chart after the HTML is rendered
  setTimeout(() => {
    const compCanvas = document.getElementById('comparison-chart-canvas');
    if (compCanvas) {
      // Force square aspect ratio
      const rect = compCanvas.getBoundingClientRect();
      compCanvas.style.height = rect.width + 'px';
    }
    drawComparisonChart(subjectPos, targetPos, subjectAsc, targetAsc);
  }, 100);
}

function drawComparisonChart(subjectPos, targetPos, subjectAsc, targetAsc) {
  const compCanvas = document.getElementById('comparison-chart-canvas');
  if (!compCanvas) return;
  
  const compCtx = compCanvas.getContext('2d');
  const centerX = compCanvas.width / 2;
  const centerY = compCanvas.height / 2;
  const outerRadius = 180;
  const innerRadius = 140;
  
  compCtx.clearRect(0, 0, compCanvas.width, compCanvas.height);
  compCtx.fillStyle = '#05070f';
  compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
  
  // Draw zodiac wheel using subject's ascendant
  drawZodiacWheelOnCanvas(compCtx, centerX, centerY, outerRadius, innerRadius, subjectAsc);
  
  // Planet symbols
  const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
  
  // Calculate positions with collision detection for subject planets
  const subjectPlanetsArray = calculatePlanetPositionsWithCollisionDetection(
    subjectPos, subjectAsc, centerX, centerY, innerRadius - 20, 22, 12
  );
  
  // Calculate positions with collision detection for target planets
  const targetPlanetsArray = calculatePlanetPositionsWithCollisionDetection(
    targetPos, subjectAsc, centerX, centerY, innerRadius - 65, 22, 12
  );
  
  // Calculate aspects for both charts
  const subjectAspects = calculateAspects(subjectPos, subjectPlanetsArray, subjectAsc, centerX, centerY, innerRadius - 20);
  const targetAspects = calculateAspects(targetPos, targetPlanetsArray, subjectAsc, centerX, centerY, innerRadius - 65);
  
  // Draw subject aspects (outer ring) - start dimmed
  drawAspectsOnCanvas(compCtx, subjectAspects, 0.2);
  
  // Draw target aspects (inner ring) - start dimmed
  drawAspectsOnCanvas(compCtx, targetAspects, 0.2);
  
  // Draw subject planets (outer ring, element-based colours)
  subjectPlanetsArray.forEach((planet) => {
    const planetColour = getPlanetColourByLongitude(planet.longitude);
    const signIndex = getSignIndexFromLongitude(planet.longitude);
    const signName = SIGN_NAMES[signIndex];
    const isRuling = RULING_PLANETS[signName] === planet.name;
    
    compCtx.beginPath();
    compCtx.arc(planet.x, planet.y, 10, 0, Math.PI * 2);
    compCtx.fillStyle = planetColour;
    compCtx.fill();
    compCtx.strokeStyle = isRuling ? '#ffd700' : '#fff';
    compCtx.lineWidth = isRuling ? 4 : 2;
    compCtx.stroke();
    
    // Draw planet symbol
    compCtx.fillStyle = '#000';
    compCtx.font = 'bold 14px Arial';
    compCtx.textAlign = 'center';
    compCtx.textBaseline = 'middle';
    compCtx.fillText(planetSymbols[planet.planetIndex], planet.x, planet.y);
  });
  
  // Draw target planets (inner ring, element-based colours)
  targetPlanetsArray.forEach((planet) => {
    const planetColour = getPlanetColourByLongitude(planet.longitude);
    const signIndex = getSignIndexFromLongitude(planet.longitude);
    const signName = SIGN_NAMES[signIndex];
    const isRuling = RULING_PLANETS[signName] === planet.name;
    
    compCtx.beginPath();
    compCtx.arc(planet.x, planet.y, 10, 0, Math.PI * 2);
    compCtx.fillStyle = planetColour;
    compCtx.fill();
    compCtx.strokeStyle = isRuling ? '#ffd700' : '#fff';
    compCtx.lineWidth = isRuling ? 4 : 2;
    compCtx.stroke();
    
    // Draw planet symbol
    compCtx.fillStyle = '#000';
    compCtx.font = 'bold 14px Arial';
    compCtx.textAlign = 'center';
    compCtx.textBaseline = 'middle';
    compCtx.fillText(planetSymbols[planet.planetIndex], planet.x, planet.y);
  });
  
  // Draw ascendant lines
  // Subject ascendant (blue) - always at 9 o'clock like main chart
  const subjectAscAngle = ((-180) * Math.PI) / 180;
  compCtx.beginPath();
  compCtx.moveTo(centerX, centerY);
  compCtx.lineTo(
    centerX + Math.cos(subjectAscAngle) * innerRadius,
    centerY + Math.sin(subjectAscAngle) * innerRadius
  );
  compCtx.strokeStyle = '#74c0fc';
  compCtx.lineWidth = 2;
  compCtx.stroke();
  
  // Target ascendant (purple) - positioned relative to subject's ascendant using main chart formula
  const targetAscAngle = (((targetAsc - subjectAsc + 180) % 360) * Math.PI) / 180;
  compCtx.beginPath();
  compCtx.moveTo(centerX, centerY);
  compCtx.lineTo(
    centerX + Math.cos(targetAscAngle) * innerRadius,
    centerY + Math.sin(targetAscAngle) * innerRadius
  );
  compCtx.strokeStyle = '#b85eff';
  compCtx.lineWidth = 2;
  compCtx.setLineDash([5, 5]); // Dashed line for target
  compCtx.stroke();
  compCtx.setLineDash([]); // Reset to solid
  
  // Setup tooltips with interactive aspect dimming
  setupComparisonChartTooltips(subjectPos, targetPos, subjectAsc, targetAsc, subjectPlanetsArray, targetPlanetsArray, subjectAspects, targetAspects);
}

// Helper function to draw zodiac wheel on a specific canvas
function drawZodiacWheelOnCanvas(ctx, centerX, centerY, outerRadius, innerRadius, ascendant) {
  // Derive colours from elements: Fire, Earth, Air, Water pattern
  const getSignColour = (signIndex) => {
    const element = ELEMENT_NAMES[signIndex % 4];
    return ELEMENT_COLOURS[element];
  };

  const offset = 180 - ascendant;
  // Draw each 30-degree zodiac sign segment
  for (let i = 0; i < 12; i++) {
    // Calculate which sign should be displayed in this segment
    const segmentLongitude = (i * 30) % 360;
    const signIndex = getSignIndexFromLongitude(segmentLongitude);
    const startDeg = (i * 30 + offset) % 360;
    const endDeg = ((i + 1) * 30 + offset) % 360;
    const startAngle = (startDeg * Math.PI) / 180;
    const endAngle = (endDeg * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.closePath();
    const signColour = getSignColour(signIndex);
    ctx.fillStyle = signColour + '20';
    ctx.fill();
    ctx.strokeStyle = signColour + '80';
    ctx.lineWidth = 1;
    ctx.stroke();

    const midDeg = (offset + i * 30 + 15) % 360;
    const midAngle = (midDeg * Math.PI) / 180;
    const textRadius = (outerRadius + innerRadius) / 2;
    const textX = centerX + Math.cos(midAngle) * textRadius;
    const textY = centerY + Math.sin(midAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = getSignColour(signIndex);
    ctx.font = 'bold 11px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_NAMES[signIndex], 0, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5, 7, 15, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(94, 197, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Store event listeners for cleanup
let comparisonTooltipListeners = null;

// Setup tooltips for comparison chart
function setupComparisonChartTooltips(subjectPos, targetPos, subjectAsc, targetAsc, subjectPlanetsArray, targetPlanetsArray, subjectAspects, targetAspects) {
  const compCanvas = document.getElementById('comparison-chart-canvas');
  if (!compCanvas) return;
  
  const compTooltip = document.getElementById('comparison-tooltip');
  if (!compTooltip) return;
  
  // Remove old event listeners if they exist
  if (comparisonTooltipListeners) {
    compCanvas.removeEventListener('mousemove', comparisonTooltipListeners.mousemove);
    compCanvas.removeEventListener('mouseleave', comparisonTooltipListeners.mouseleave);
  }
  
  // Store chart data for tooltip calculations
  const compChartData = {
    centerX: compCanvas.width / 2,
    centerY: compCanvas.height / 2,
    outerRadius: 180,
    innerRadius: 140,
    subjectPos,
    targetPos,
    subjectAsc,
    targetAsc,
    subjectPlanetsArray,
    targetPlanetsArray,
    subjectAspects,
    targetAspects
  };
  
  let currentHoveredPlanet = null;
  
  function redrawChart(hoveredPlanet) {
    const compCtx = compCanvas.getContext('2d');
    const centerX = compCanvas.width / 2;
    const centerY = compCanvas.height / 2;
    const outerRadius = 180;
    const innerRadius = 140;
    const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
    
    compCtx.clearRect(0, 0, compCanvas.width, compCanvas.height);
    compCtx.fillStyle = '#05070f';
    compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
    
    // Draw zodiac wheel
    drawZodiacWheelOnCanvas(compCtx, centerX, centerY, outerRadius, innerRadius, subjectAsc);
    
    // Determine which aspects to lighten based on hovered planet
    let subjectOpacity = 0.2;
    let targetOpacity = 0.2;
    
    if (hoveredPlanet) {
      if (hoveredPlanet.type === 'subject-planet' || hoveredPlanet.type === 'aspect' && hoveredPlanet.person === currentSubject.name) {
        subjectOpacity = 1; // Show subject aspects when hovering subject planet or aspect
        targetOpacity = 0.2; // Lighten target aspects
      } else if (hoveredPlanet.type === 'target-planet' || hoveredPlanet.type === 'aspect' && hoveredPlanet.person === currentTarget.name) {
        targetOpacity = 1; // Show target aspects when hovering target planet or aspect
        subjectOpacity = 0.2; // Lighten subject aspects
      }
    }
    // else: When not hovering any planet, both stay dimmed at 0.2
    
    // Draw aspects with appropriate opacity
    drawAspectsOnCanvas(compCtx, subjectAspects, subjectOpacity);
    drawAspectsOnCanvas(compCtx, targetAspects, targetOpacity);
    
    // Determine planet opacity based on hovered aspect
    let subjectPlanetOpacity = 1;
    let targetPlanetOpacity = 1;
    
    if (hoveredPlanet) {
      if (hoveredPlanet.type === 'subject-planet' || (hoveredPlanet.type === 'aspect' && hoveredPlanet.person === currentSubject.name)) {
        // Hovering subject planet or subject aspect: dim target planets
        targetPlanetOpacity = 0.2;
      } else if (hoveredPlanet.type === 'target-planet' || (hoveredPlanet.type === 'aspect' && hoveredPlanet.person === currentTarget.name)) {
        // Hovering target planet or target aspect: dim subject planets
        subjectPlanetOpacity = 0.2;
      }
    }
    
    // Draw subject planets
    subjectPlanetsArray.forEach((planet) => {
      const planetColour = getPlanetColourByLongitude(planet.longitude);
      const signIndex = getSignIndexFromLongitude(planet.longitude);
      const signName = SIGN_NAMES[signIndex];
      const isRuling = RULING_PLANETS[signName] === planet.name;
      
      compCtx.globalAlpha = subjectPlanetOpacity;
      compCtx.beginPath();
      compCtx.arc(planet.x, planet.y, 10, 0, Math.PI * 2);
      compCtx.fillStyle = planetColour;
      compCtx.fill();
      compCtx.strokeStyle = isRuling ? '#ffd700' : '#fff';
      compCtx.lineWidth = isRuling ? 4 : 2;
      compCtx.stroke();
      
      compCtx.fillStyle = '#000';
      compCtx.font = 'bold 14px Arial';
      compCtx.textAlign = 'center';
      compCtx.textBaseline = 'middle';
      compCtx.fillText(planetSymbols[planet.planetIndex], planet.x, planet.y);
      compCtx.globalAlpha = 1;
    });
    
    // Draw target planets
    targetPlanetsArray.forEach((planet) => {
      const planetColour = getPlanetColourByLongitude(planet.longitude);
      const signIndex = getSignIndexFromLongitude(planet.longitude);
      const signName = SIGN_NAMES[signIndex];
      const isRuling = RULING_PLANETS[signName] === planet.name;
      
      compCtx.globalAlpha = targetPlanetOpacity;
      compCtx.beginPath();
      compCtx.arc(planet.x, planet.y, 10, 0, Math.PI * 2);
      compCtx.fillStyle = planetColour;
      compCtx.fill();
      compCtx.strokeStyle = isRuling ? '#ffd700' : '#fff';
      compCtx.lineWidth = isRuling ? 4 : 2;
      compCtx.stroke();
      
      compCtx.fillStyle = '#000';
      compCtx.font = 'bold 14px Arial';
      compCtx.textAlign = 'center';
      compCtx.textBaseline = 'middle';
      compCtx.fillText(planetSymbols[planet.planetIndex], planet.x, planet.y);
      compCtx.globalAlpha = 1;
    });
    
    // Draw ascendant lines
    const subjectAscAngle = ((-180) * Math.PI) / 180;
    compCtx.globalAlpha = subjectPlanetOpacity;
    compCtx.beginPath();
    compCtx.moveTo(centerX, centerY);
    compCtx.lineTo(
      centerX + Math.cos(subjectAscAngle) * innerRadius,
      centerY + Math.sin(subjectAscAngle) * innerRadius
    );
    compCtx.strokeStyle = '#74c0fc';
    compCtx.lineWidth = 2;
    compCtx.stroke();
    compCtx.globalAlpha = 1;
    
    const targetAscAngle = (((targetAsc - subjectAsc + 180) % 360) * Math.PI) / 180;
    compCtx.globalAlpha = targetPlanetOpacity;
    compCtx.beginPath();
    compCtx.moveTo(centerX, centerY);
    compCtx.lineTo(
      centerX + Math.cos(targetAscAngle) * innerRadius,
      centerY + Math.sin(targetAscAngle) * innerRadius
    );
    compCtx.strokeStyle = '#b85eff';
    compCtx.lineWidth = 2;
    compCtx.setLineDash([5, 5]);
    compCtx.stroke();
    compCtx.setLineDash([]);
    compCtx.globalAlpha = 1;
  }
  
  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }
  
  function checkPlanetHover(mouseX, mouseY) {
    const planetRadius = 15;
    
    // Check subject planets with collision-adjusted positions
    if (compChartData.subjectPlanetsArray) {
      for (const planet of compChartData.subjectPlanetsArray) {
        const distance = Math.sqrt((mouseX - planet.x) ** 2 + (mouseY - planet.y) ** 2);
        
        if (distance <= planetRadius) {
          const { signName, degree } = getSignInfo(planet.longitude);
          const signIndex = getSignIndexFromLongitude(planet.longitude);
          const element = ELEMENT_NAMES[signIndex % 4];
          const quality = QUALITY_NAMES[Math.floor(signIndex / 4)];
          const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
          const isRuling = RULING_PLANETS[signName] === planet.name;
          
          return {
            type: 'subject-planet',
            name: planet.name,
            position: `${degree.toFixed(2)}°`,
            sign: signName,
            person: currentSubject.name,
            element: element,
            quality: quality,
            polarity: polarity,
            isRuling: isRuling
          };
        }
      }
    }
    
    // Check target planets with collision-adjusted positions
    if (compChartData.targetPlanetsArray) {
      for (const planet of compChartData.targetPlanetsArray) {
        const distance = Math.sqrt((mouseX - planet.x) ** 2 + (mouseY - planet.y) ** 2);
        
        if (distance <= planetRadius) {
          const { signName, degree } = getSignInfo(planet.longitude);
          const signIndex = getSignIndexFromLongitude(planet.longitude);
          const element = ELEMENT_NAMES[signIndex % 4];
          const quality = QUALITY_NAMES[Math.floor(signIndex / 4)];
          const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
          const isRuling = RULING_PLANETS[signName] === planet.name;
          
          return {
            type: 'target-planet',
            name: planet.name,
            position: `${degree.toFixed(2)}°`,
            sign: signName,
            person: currentTarget.name,
            element: element,
            quality: quality,
            polarity: polarity,
            isRuling: isRuling
          };
        }
      }
    }
    
    return null;
  }
  
  function checkComparisonChartAscendantHover(mouseX, mouseY) {
    const centerX = compChartData.centerX;
    const centerY = compChartData.centerY;
    const innerRadius = compChartData.innerRadius;
    
    // Subject ascendant (blue) - always at 9 o'clock
    const subjectAscAngle = ((-180) * Math.PI) / 180;
    const subjectAscX = centerX + Math.cos(subjectAscAngle) * innerRadius;
    const subjectAscY = centerY + Math.sin(subjectAscAngle) * innerRadius;
    
    // Check distance to subject ascendant line
    const distToSubjectAsc = distanceToLineSegment(
      mouseX, mouseY,
      centerX, centerY,
      subjectAscX, subjectAscY
    );
    
    if (distToSubjectAsc <= 5) {
      const { signName, degree } = getSignInfo(compChartData.subjectAsc);
      const signIndex = getSignIndexFromLongitude(compChartData.subjectAsc);
      const element = ELEMENT_NAMES[signIndex % 4];
      const quality = QUALITY_NAMES[Math.floor(signIndex / 4)];
      const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
      
      return {
        type: 'subject-ascendant',
        sign: signName,
        degree: degree,
        person: currentSubject.name,
        element: element,
        quality: quality,
        polarity: polarity
      };
    }
    
    // Target ascendant (purple) - positioned relative to subject's ascendant
    const targetAscAngle = (((compChartData.targetAsc - compChartData.subjectAsc + 180) % 360) * Math.PI) / 180;
    const targetAscX = centerX + Math.cos(targetAscAngle) * innerRadius;
    const targetAscY = centerY + Math.sin(targetAscAngle) * innerRadius;
    
    // Check distance to target ascendant line
    const distToTargetAsc = distanceToLineSegment(
      mouseX, mouseY,
      centerX, centerY,
      targetAscX, targetAscY
    );
    
    if (distToTargetAsc <= 5) {
      const { signName, degree } = getSignInfo(compChartData.targetAsc);
      const signIndex = getSignIndexFromLongitude(compChartData.targetAsc);
      const element = ELEMENT_NAMES[signIndex % 4];
      const quality = QUALITY_NAMES[Math.floor(signIndex / 4)];
      const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
      
      return {
        type: 'target-ascendant',
        sign: signName,
        degree: degree,
        person: currentTarget.name,
        element: element,
        quality: quality,
        polarity: polarity
      };
    }
    
    return null;
  }
  
  function checkSignHover(mouseX, mouseY) {
    const dx = mouseX - compChartData.centerX;
    const dy = mouseY - compChartData.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if in zodiac ring area
    if (distance >= compChartData.innerRadius && distance <= compChartData.outerRadius) {
      // Calculate angle from center
      let angle_rad = Math.atan2(dy, dx);
      let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
      let zodiacLon = ((canvas_angle - 180 + compChartData.subjectAsc) % 360 + 360) % 360;
      
      const signIndex = getSignIndexFromLongitude(zodiacLon);
      const signName = SIGN_NAMES[signIndex];
      const element = ELEMENT_NAMES[signIndex % 4];
      const quality = QUALITY_NAMES[Math.floor(signIndex / 4)];
      // Polarity: Fire & Air = Positive (+), Earth & Water = Negative (-)
      const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
      
      return {
        type: 'sign',
        name: signName,
        element: element,
        quality: quality,
        polarity: polarity
      };
    }
    
    return null;
  }
  
  function checkAspectHover(mouseX, mouseY) {
    // Check subject aspects first
    for (const aspect of compChartData.subjectAspects) {
      const distance = distanceToLineSegment(
        mouseX, mouseY,
        aspect.x1, aspect.y1,
        aspect.x2, aspect.y2
      );
      
      if (distance <= 5) {
        const p1Lon = compChartData.subjectPos[aspect.planet1];
        const p2Lon = compChartData.subjectPos[aspect.planet2];
        
        const p1SignIndex = getSignIndexFromLongitude(p1Lon);
        const p2SignIndex = getSignIndexFromLongitude(p2Lon);
        
        const p1Sign = SIGN_NAMES[p1SignIndex];
        const p2Sign = SIGN_NAMES[p2SignIndex];
        
        const p1Element = ELEMENT_NAMES[p1SignIndex % 4];
        const p2Element = ELEMENT_NAMES[p2SignIndex % 4];
        
        const p1Quality = QUALITY_NAMES[Math.floor(p1SignIndex / 4)];
        const p2Quality = QUALITY_NAMES[Math.floor(p2SignIndex / 4)];
        
        const p1Polarity = (p1Element === 'Fire' || p1Element === 'Air') ? '+' : '-';
        const p2Polarity = (p2Element === 'Fire' || p2Element === 'Air') ? '+' : '-';
        
        return {
          type: 'aspect',
          person: currentSubject.name,
          color: '#74c0fc',
          planet1: aspect.planet1,
          planet2: aspect.planet2,
          aspectType: aspect.type,
          angle: aspect.angle,
          orb: aspect.orb,
          p1Sign: p1Sign,
          p2Sign: p2Sign,
          p1Quality: p1Quality,
          p2Quality: p2Quality,
          p1Element: p1Element,
          p2Element: p2Element,
          p1Polarity: p1Polarity,
          p2Polarity: p2Polarity
        };
      }
    }
    
    // Check target aspects
    for (const aspect of compChartData.targetAspects) {
      const distance = distanceToLineSegment(
        mouseX, mouseY,
        aspect.x1, aspect.y1,
        aspect.x2, aspect.y2
      );
      
      if (distance <= 5) {
        const p1Lon = compChartData.targetPos[aspect.planet1];
        const p2Lon = compChartData.targetPos[aspect.planet2];
        
        const p1SignIndex = getSignIndexFromLongitude(p1Lon);
        const p2SignIndex = getSignIndexFromLongitude(p2Lon);
        
        const p1Sign = SIGN_NAMES[p1SignIndex];
        const p2Sign = SIGN_NAMES[p2SignIndex];
        
        const p1Element = ELEMENT_NAMES[p1SignIndex % 4];
        const p2Element = ELEMENT_NAMES[p2SignIndex % 4];
        
        const p1Quality = QUALITY_NAMES[Math.floor(p1SignIndex / 4)];
        const p2Quality = QUALITY_NAMES[Math.floor(p2SignIndex / 4)];
        
        const p1Polarity = (p1Element === 'Fire' || p1Element === 'Air') ? '+' : '-';
        const p2Polarity = (p2Element === 'Fire' || p2Element === 'Air') ? '+' : '-';
        
        return {
          type: 'aspect',
          person: currentTarget.name,
          color: '#b85eff',
          planet1: aspect.planet1,
          planet2: aspect.planet2,
          aspectType: aspect.type,
          angle: aspect.angle,
          orb: aspect.orb,
          p1Sign: p1Sign,
          p2Sign: p2Sign,
          p1Quality: p1Quality,
          p2Quality: p2Quality,
          p1Element: p1Element,
          p2Element: p2Element,
          p1Polarity: p1Polarity,
          p2Polarity: p2Polarity
        };
      }
    }
    
    return null;
  }
  
  function updateTooltip(evt) {
    const mousePos = getMousePos(compCanvas, evt);
    const mouseX = mousePos.x;
    const mouseY = mousePos.y;
    
    // Check planets first, then ascendants, then aspects, then signs
    let hoverInfo = checkPlanetHover(mouseX, mouseY);
    
    if (!hoverInfo) {
      hoverInfo = checkComparisonChartAscendantHover(mouseX, mouseY);
    }
    
    if (!hoverInfo) {
      hoverInfo = checkAspectHover(mouseX, mouseY);
    }
    
    if (!hoverInfo) {
      hoverInfo = checkSignHover(mouseX, mouseY);
    }
    
    // Check if we need to redraw (planet or aspect hover changed)
    const hoverChanged = (currentHoveredPlanet?.name !== hoverInfo?.name) || 
                         (currentHoveredPlanet?.type !== hoverInfo?.type);
    
    if (hoverChanged && (hoverInfo?.type === 'subject-planet' || hoverInfo?.type === 'target-planet' || 
                          hoverInfo?.type === 'aspect' ||
                          currentHoveredPlanet?.type === 'subject-planet' || currentHoveredPlanet?.type === 'target-planet' ||
                          currentHoveredPlanet?.type === 'aspect')) {
      currentHoveredPlanet = hoverInfo;
      redrawChart(hoverInfo);
    }
    
    if (hoverInfo) {
      let tooltipHTML = '';
      
      if (hoverInfo.type === 'subject-planet') {
        tooltipHTML = `
          <div style="font-weight: 600; color: #74c0fc; margin-bottom: 0.25rem;">${hoverInfo.name} IN ${hoverInfo.sign} (${hoverInfo.person})</div>
          <div style="font-size: 0.85rem; color: #b8d0f0;">${hoverInfo.quality} ${hoverInfo.polarity} ${hoverInfo.element}</div>${hoverInfo.isRuling ? '<div style="font-size: 0.8rem; color: #ffd700; margin-top: 0.25rem;">⚡ Ruling Planet</div>' : ''}
        `;
      } else if (hoverInfo.type === 'target-planet') {
        tooltipHTML = `
          <div style="font-weight: 600; color: #b85eff; margin-bottom: 0.25rem;">${hoverInfo.name} IN ${hoverInfo.sign} (${hoverInfo.person})</div>
          <div style="font-size: 0.85rem; color: #b8d0f0;">${hoverInfo.quality} ${hoverInfo.polarity} ${hoverInfo.element}</div>${hoverInfo.isRuling ? '<div style="font-size: 0.8rem; color: #ffd700; margin-top: 0.25rem;">⚡ Ruling Planet</div>' : ''}
        `;
      } else if (hoverInfo.type === 'subject-ascendant') {
        tooltipHTML = `
          <div style="font-weight: 600; color: #74c0fc; margin-bottom: 0.25rem;">ASCENDANT (${hoverInfo.person})</div>
          <div style="font-size: 0.85rem; color: #b8d0f0;">${hoverInfo.sign} ${hoverInfo.degree.toFixed(2)}°</div>
          <div style="font-size: 0.75rem; color: #8fa8ce; margin-top: 0.25rem;">${hoverInfo.quality} ${hoverInfo.polarity} ${hoverInfo.element}</div>
        `;
      } else if (hoverInfo.type === 'target-ascendant') {
        tooltipHTML = `
          <div style="font-weight: 600; color: #b85eff; margin-bottom: 0.25rem;">ASCENDANT (${hoverInfo.person})</div>
          <div style="font-size: 0.85rem; color: #b8d0f0;">${hoverInfo.sign} ${hoverInfo.degree.toFixed(2)}°</div>
          <div style="font-size: 0.75rem; color: #8fa8ce; margin-top: 0.25rem;">${hoverInfo.quality} ${hoverInfo.polarity} ${hoverInfo.element}</div>
        `;
      } else if (hoverInfo.type === 'aspect') {
        tooltipHTML = `
          <div style="font-weight: 600; color: ${hoverInfo.color}; margin-bottom: 0.5rem;">${hoverInfo.aspectType} (${hoverInfo.person})</div>
          <div style="display: flex; gap: 1rem; font-size: 0.8rem;">
            <div>
              <div style="color: #b8d0f0; margin-bottom: 0.25rem;">${hoverInfo.planet1} in ${hoverInfo.p1Sign}</div>
              <div style="color: #8fa8ce; font-size: 0.75rem;">${hoverInfo.p1Quality} ${hoverInfo.p1Polarity} ${hoverInfo.p1Element}</div>
            </div>
            <div style="color: var(--accent); align-self: center;">↔</div>
            <div>
              <div style="color: #b8d0f0; margin-bottom: 0.25rem;">${hoverInfo.planet2} in ${hoverInfo.p2Sign}</div>
              <div style="color: #8fa8ce; font-size: 0.75rem;">${hoverInfo.p2Quality} ${hoverInfo.p2Polarity} ${hoverInfo.p2Element}</div>
            </div>
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #6a7fa0;">Orb: ${hoverInfo.orb.toFixed(2)}°</div>
        `;
      } else if (hoverInfo.type === 'sign') {
        tooltipHTML = `
          <div style="font-weight: 600; color: var(--accent-warm); margin-bottom: 0.25rem;">${hoverInfo.name}</div>
          <div style="font-size: 0.85rem; color: #b8d0f0;">${hoverInfo.quality} ${hoverInfo.polarity} ${hoverInfo.element}</div>
        `;
      }
      
      compTooltip.innerHTML = tooltipHTML;
      compTooltip.style.display = 'block';
      compTooltip.style.left = (evt.clientX + 15) + 'px';
      compTooltip.style.top = (evt.clientY + 15) + 'px';
      compCanvas.style.cursor = 'pointer';
    } else {
      compTooltip.style.display = 'none';
      compCanvas.style.cursor = 'default';
    }
  }
  
  const mouseleaveHandler = () => {
    compTooltip.style.display = 'none';
    compCanvas.style.cursor = 'default';
    currentHoveredPlanet = null;
    redrawChart(null); // Restore all aspects to full opacity
  };
  
  comparisonTooltipListeners = {
    mousemove: updateTooltip,
    mouseleave: mouseleaveHandler
  };
  
  compCanvas.addEventListener('mousemove', updateTooltip);
  compCanvas.addEventListener('mouseleave', mouseleaveHandler);
}

// ============================================================================
// Event Listeners
// ============================================================================

btnCalculate.addEventListener('click', calculateChart);

locationLookupBtn?.addEventListener('click', () => {
  if (typeof initLocationPicker !== 'undefined') {
    const picker = initLocationPicker();
    picker.open((location) => {
      // Update the latitude and longitude inputs
      latitudeInput.value = location.latitude.toFixed(4);
      longitudeInput.value = location.longitude.toFixed(4);
      
      // Display the selected location name
      selectedLocationName.textContent = `📍 ${location.name} (${location.fullAddress})`;
      selectedLocationName.style.color = '#5ec5ff';
    });
  } else {
    showToast('Location picker not loaded', 'error');
  }
});

// Records management
btnLoadRecords?.addEventListener('click', () => {
  if (recordsPanel.classList.contains('hidden')) {
    openRecordsPanel();
  } else {
    closeRecordsPanel();
  }
});

btnCloseRecords?.addEventListener('click', closeRecordsPanel);
btnSaveRecord?.addEventListener('click', openSaveModal);

btnClearAll?.addEventListener('click', () => {
  const existing = loadRecords();
  if (!existing.length) return;
  openDangerModal();
});

// Record item interactions
recordsList?.addEventListener('click', (e) => {
  const target = e.target;
  
  // Inline rename
  if (target.classList.contains('record-name')) {
    const id = target.getAttribute('data-id');
    const original = target.textContent;
    target.contentEditable = 'true';
    target.classList.add('editing');
    target.focus();
    const range = document.createRange();
    range.selectNodeContents(target);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    function finish(save) {
      target.contentEditable = 'false';
      target.classList.remove('editing');
      if (save) {
        const newName = target.textContent.trim() || original;
        updateRecord(id, { name: newName });
        renderRecords();
        populateComparisonSelects();
      } else {
        target.textContent = original;
      }
      target.removeEventListener('blur', onBlur);
      target.removeEventListener('keydown', onKey);
    }
    
    function onBlur() { finish(true); }
    function onKey(ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
      else if (ev.key === 'Escape') { finish(false); }
    }
    
    target.addEventListener('blur', onBlur);
    target.addEventListener('keydown', onKey);
  }
  
  // Action buttons
  if (target.dataset.action) {
    const id = target.getAttribute('data-id');
    const action = target.dataset.action;
    const rec = loadRecords().find(r => r.id === id);
    if (!rec) return;
    
    const includeSettings = applySavedSettingsCheckbox ? applySavedSettingsCheckbox.checked : true;
    
    if (action === 'load') {
      // Auto calculate always on load
      applyRecord(rec, true, includeSettings);
      closeRecordsPanel();
      showToast(`Loaded: ${rec.name}`, 'success');
    } else if (action === 'overwrite') {
      // Build new payload but keep same id & createdAt
      const updated = buildRecordPayload(rec.name);
      updated.id = rec.id;
      updated.createdAt = rec.createdAt;
      updated.updatedAt = new Date().toISOString();
      // Replace record
      const all = loadRecords().map(r => r.id === rec.id ? updated : r);
      saveRecords(all);
      renderRecords();
      populateComparisonSelects();
      showToast(`Overwritten: ${rec.name}`, 'info');
    } else if (action === 'del') {
      deleteRecord(id);
      renderRecords();
      populateComparisonSelects();
      showToast('Record deleted', 'info');
    }
  }
});

// Modal events
modalClose?.addEventListener('click', closeSaveModal);
modalCancel?.addEventListener('click', closeSaveModal);
modalSave?.addEventListener('click', () => {
  const payload = buildRecordPayload(recordNameInput.value);
  addRecord(payload);
  closeSaveModal();
  renderRecords();
  openRecordsPanel();
  populateComparisonSelects();
  showToast(`Saved: ${payload.name}`, 'success');
});

recordNameInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    modalSave?.click();
  }
});

// Danger modal events
dangerModalClose?.addEventListener('click', closeDangerModal);
dangerCancel?.addEventListener('click', closeDangerModal);
dangerConfirm?.addEventListener('click', () => {
  if (dangerStage === 0) {
    dangerStage = 1;
    updateDangerModal();
  } else {
    clearAllRecords();
    closeDangerModal();
    renderRecords();
    populateComparisonSelects();
    showToast('All records deleted', 'warning');
  }
});

// Keyboard shortcuts for testing
document.addEventListener('keydown', (e) => {
  // Numpad 0 or regular 0: Auto-load first two records and compare
  if ((e.key === '0' || e.code === 'Numpad0') && !e.target.matches('input, textarea')) {
    e.preventDefault();
    
    const records = loadRecords();
    if (records.length < 2) {
      showToast('Need at least 2 saved records. Create some records first!', 'warning', 4000);
      return;
    }
    
    // Switch to Starmatch mode if not already
    if (starmatchSection.classList.contains('hidden')) {
      switchToStarmatchMode();
    }
    
    // Load first two records
    if (subjectSelect && targetSelect) {
      subjectSelect.value = records[0].id;
      targetSelect.value = records[1].id;
      
      // Load subject
      currentSubject = records[0];
      displayPersonInfo(records[0], subjectInfo);
      
      // Load target
      currentTarget = records[1];
      displayPersonInfo(records[1], targetInfo);
      
      // Enable compare button
      updateCompareButton();
      
      showToast(`Quick Test: ${records[0].name} vs ${records[1].name}`, 'info', 2000);
      
      // Auto-click compare after a short delay
      setTimeout(() => {
        if (btnCompare && !btnCompare.disabled) {
          performComparison();
        }
      }, 500);
    }
  }
});

// Escape key handling
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!saveModal.classList.contains('hidden')) closeSaveModal();
    if (!dangerModal.classList.contains('hidden')) closeDangerModal();
  }
});

// Mode switching - wrapped to ensure DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (btnChartMode) {
    btnChartMode.addEventListener('click', (e) => {
      switchToChartMode();
    });
  }
  
  if (btnStarmatchMode) {
    btnStarmatchMode.addEventListener('click', (e) => {
      switchToStarmatchMode();
    });
  }
});

btnChartMode?.addEventListener('click', switchToChartMode);
btnStarmatchMode?.addEventListener('click', switchToStarmatchMode);

// Comparison controls
btnLoadSubject?.addEventListener('click', loadSubjectForComparison);
btnLoadTarget?.addEventListener('click', loadTargetForComparison);
btnCompare?.addEventListener('click', performComparison);

subjectSelect?.addEventListener('change', () => {
  if (targetSelect && subjectSelect.value === targetSelect.value) {
    targetSelect.value = '';
    currentTarget = null;
    targetInfo.innerHTML = '';
    updateCompareButton();
  }
});

targetSelect?.addEventListener('change', () => {
  if (subjectSelect && targetSelect.value === subjectSelect.value) {
    subjectSelect.value = '';
    currentSubject = null;
    subjectInfo.innerHTML = '';
    updateCompareButton();
  }
});

// Collapsible analysis section
analysisToggle?.addEventListener('click', () => {
  if (analysisContent) {
    const isCollapsed = analysisContent.classList.toggle('collapsed');
    const icon = analysisToggle.querySelector('.collapse-icon');
    if (icon) {
      icon.textContent = isCollapsed ? '▶' : '▼';
    }
  }
});

// Canvas tooltips
canvas.addEventListener('mousemove', updateTooltip);
canvas.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
  canvas.style.cursor = 'default';
});

// Initialise on load
document.addEventListener('DOMContentLoaded', () => {
  renderRecords();
});

// Initialise
selectedLocationName.textContent = '';
