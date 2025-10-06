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

// Global variables for engine.js compatibility
var nativity = 0;

// Global chart data
let chartData = {
  positions: {},
  ascendant: 0,
  midheaven: 0,
  aspects: [],
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

function toUTC(dateStr, timeStr) {
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
  if (!astronomyEngineReady || typeof Astronomy === 'undefined') {
    // Fallback to simplified calculation
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
                 0.000387933 * T * T - (T * T * T) / 38710000.0;
    let lst = (gmst + longitude) % 360;
    if (lst < 0) lst += 360;
    let asc = (lst + 90) % 360;
    if (asc < 0) asc += 360;
    return asc;
  }
  
  // Use Astronomy Engine for accurate ascendant
  const time = Astronomy.MakeTime(date);
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  
  // Calculate local sidereal time
  const gmst = Astronomy.SiderealTime(time);
  const lst = (gmst + longitude / 15.0) * 15.0; // Convert to degrees
  
  // Simplified ascendant (proper calculation requires obliquity and more complex math)
  let asc = (lst + 90) % 360;
  if (asc < 0) asc += 360;
  
  return asc;
}

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

  const date = toUTC(dateStr, timeStr);
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
        planetaryPositions[planetName] = longitude;
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

    let normalizedLon = longitude % 360;
    if (normalizedLon < 0) normalizedLon += 360;

    const sign = Math.floor(normalizedLon / 30);
    const degree = normalizedLon % 30;
    const signName = SIGN_NAMES[sign];

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
// Chart Wheel Visualization (Simplified - reuses existing drawing functions)
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
  drawPlanets(centerX, centerY, innerRadius - 60, positions);
  drawAspects(centerX, centerY, innerRadius - 60, positions);
}

function drawZodiacWheel(centerX, centerY, outerRadius, innerRadius, ascendant) {
  const signColors = [
    '#ff6b6b', '#51cf66', '#ffd43b', '#74c0fc',
    '#ff8787', '#69db7c', '#ffd43b', '#ff6b6b',
    '#cc5de8', '#51cf66', '#74c0fc', '#a78bfa'
  ];

  for (let i = 0; i < 12; i++) {
    const startAngle = ((i * 30 - ascendant - 90) * Math.PI) / 180;
    const endAngle = (((i + 1) * 30 - ascendant - 90) * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = signColors[i] + '20';
    ctx.fill();
    ctx.strokeStyle = signColors[i] + '80';
    ctx.lineWidth = 1;
    ctx.stroke();

    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const textRadius = (outerRadius + innerRadius) / 2 + 15;
    const textX = centerX + Math.cos(midAngle) * textRadius;
    const textY = centerY + Math.sin(midAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = signColors[i];
    ctx.font = 'bold 14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_NAMES[i], 0, 0);
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
  const ascAngle = ((-ascendant - 90) * Math.PI) / 180;
  
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

function drawPlanets(centerX, centerY, radius, positions) {
  const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
  const planetColors = [
    '#ffd700', '#c0c0c0', '#ffa500', '#ff69b4', '#ff0000',
    '#9370db', '#8b4513', '#00ced1', '#4169e1', '#8b0000'
  ];

  Object.entries(positions).forEach(([name, longitude]) => {
    if (longitude === undefined || longitude === null || isNaN(longitude)) return;

    const angle = ((-longitude - 90) * Math.PI) / 180;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    const planetIndex = PLANET_NAMES.indexOf(name);
    if (planetIndex === -1) return;

    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = planetColors[planetIndex];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(planetSymbols[planetIndex], x, y);
  });
}

function drawAspects(centerX, centerY, radius, positions) {
  const aspectColors = {
    0: 'rgba(255, 215, 0, 0.6)',
    180: 'rgba(255, 69, 0, 0.6)',
    120: 'rgba(0, 255, 127, 0.6)',
    90: 'rgba(255, 0, 0, 0.6)',
    60: 'rgba(135, 206, 250, 0.6)',
    45: 'rgba(255, 165, 0, 0.5)',
    30: 'rgba(173, 216, 230, 0.5)'
  };

  const aspectAngles = [0, 180, 120, 90, 60, 45, 30];
  const planetLongitudes = Object.entries(positions).map(([name, lon]) => ({
    name,
    longitude: lon,
    index: PLANET_NAMES.indexOf(name)
  })).filter(p => p.index !== -1);

  chartData.aspects = [];

  for (let i = 0; i < planetLongitudes.length; i++) {
    for (let j = i + 1; j < planetLongitudes.length; j++) {
      const p1 = planetLongitudes[i];
      const p2 = planetLongitudes[j];
      
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const aspectAngle of aspectAngles) {
        const orb = orbType === 0 ? ao[aoIndex][aspectAngles.indexOf(aspectAngle)] : 8;
        if (Math.abs(diff - aspectAngle) <= orb) {
          const angle1 = ((-p1.longitude - 90) * Math.PI) / 180;
          const angle2 = ((-p2.longitude - 90) * Math.PI) / 180;
          
          const x1 = centerX + Math.cos(angle1) * radius;
          const y1 = centerY + Math.sin(angle1) * radius;
          const x2 = centerX + Math.cos(angle2) * radius;
          const y2 = centerY + Math.sin(angle2) * radius;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = aspectColors[aspectAngle] || 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

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

          chartData.aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspect: aspectAngle,
            type: aspectTypes[aspectAngle] || `${aspectAngle}°`,
            angle: aspectAngle,
            orb: actualOrb,
            x1, y1, x2, y2
          });
          break;
        }
      }
    }
  }
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
  const planetRadius = 12; // Match the planet circle radius
  
  for (const [name, longitude] of Object.entries(chartData.positions)) {
    if (isNaN(longitude) || !isFinite(longitude)) continue;
    
    const angle = ((-longitude - 90) * Math.PI) / 180;
    const x = chartData.centerX + Math.cos(angle) * chartData.planetRadius;
    const y = chartData.centerY + Math.sin(angle) * chartData.planetRadius;
    
    const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
    
    if (distance <= planetRadius) {
      let normalizedLon = longitude % 360;
      if (normalizedLon < 0) normalizedLon += 360;
      const sign = Math.floor(normalizedLon / 30);
      const degree = normalizedLon % 30;
      const signName = SIGN_NAMES[sign];
      
      return {
        type: 'planet',
        name: name,
        longitude: longitude,
        position: `${degree.toFixed(2)}° ${signName}`,
        sign: signName
      };
    }
  }
  return null;
}

function checkAscendantHover(mouseX, mouseY) {
  const ascAngle = ((-chartData.ascendant - 90) * Math.PI) / 180;
  const x1 = chartData.centerX;
  const y1 = chartData.centerY;
  const x2 = chartData.centerX + Math.cos(ascAngle) * chartData.innerRadius;
  const y2 = chartData.centerY + Math.sin(ascAngle) * chartData.innerRadius;
  
  const distance = distanceToLineSegment(mouseX, mouseY, x1, y1, x2, y2);
  
  if (distance <= 5) {
    let normalizedAsc = chartData.ascendant % 360;
    if (normalizedAsc < 0) normalizedAsc += 360;
    const sign = Math.floor(normalizedAsc / 30);
    const degree = normalizedAsc % 30;
    const signName = SIGN_NAMES[sign];
    
    return {
      type: 'ascendant',
      name: 'Ascendant',
      position: `${degree.toFixed(2)}° ${signName}`,
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
      return {
        type: 'aspect',
        planet1: aspect.planet1,
        planet2: aspect.planet2,
        aspectType: aspect.type,
        angle: aspect.angle,
        orb: aspect.orb
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
    // Mirror about vertical axis by negating dx instead of the angle
    let angle = Math.atan2(dy, -dx) * (180 / Math.PI);
    // Convert to zodiac longitude (adjusted for ascendant and 90° offset)
    let zodiacLon = -angle - 90 + chartData.ascendant;
    while (zodiacLon < 0) zodiacLon += 360;
    while (zodiacLon >= 360) zodiacLon -= 360;
    
    const signIndex = Math.floor(zodiacLon / 30);
    const signName = SIGN_NAMES[signIndex];
    
    return {
      type: 'sign',
      name: signName,
      index: signIndex,
      element: ELEMENT_NAMES[signIndex % 4],
      quality: QUALITY_NAMES[Math.floor(signIndex / 4)]
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
    hoverInfo = checkAscendantHover(mouseX, mouseY);
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
        <strong>${hoverInfo.name}</strong><br>
        ${hoverInfo.position}
      `;
    } else if (hoverInfo.type === 'ascendant') {
      tooltipHTML = `
        <strong>Ascendant (Rising Sign)</strong><br>
        ${hoverInfo.position}
      `;
    } else if (hoverInfo.type === 'aspect') {
      tooltipHTML = `
        <strong>${hoverInfo.aspectType}</strong><br>
        ${hoverInfo.planet1} ⟷ ${hoverInfo.planet2}<br>
        <span style="font-size: 0.9em;">Orb: ${hoverInfo.orb.toFixed(2)}°</span>
      `;
    } else if (hoverInfo.type === 'sign') {
      tooltipHTML = `
        <strong>${hoverInfo.name}</strong><br>
        <span style="font-size: 0.9em;">${hoverInfo.element} • ${hoverInfo.quality}</span>
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
      positions[planet] = getEclipticLongitude(planet, date);
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
  
  // Bottom section with chart visualization
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
  
  // Draw subject planets (outer ring, blue)
  Object.entries(subjectPos).forEach(([name, longitude]) => {
    const angle = ((-longitude - 90) * Math.PI) / 180;
    const radius = innerRadius - 20;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    const planetIndex = PLANET_NAMES.indexOf(name);
    if (planetIndex === -1) return;
    
    compCtx.beginPath();
    compCtx.arc(x, y, 10, 0, Math.PI * 2);
    compCtx.fillStyle = '#74c0fc';
    compCtx.fill();
    compCtx.strokeStyle = '#fff';
    compCtx.lineWidth = 2;
    compCtx.stroke();
    
    // Draw planet symbol
    compCtx.fillStyle = '#000';
    compCtx.font = 'bold 14px Arial';
    compCtx.textAlign = 'center';
    compCtx.textBaseline = 'middle';
    compCtx.fillText(planetSymbols[planetIndex], x, y);
  });
  
  // Draw target planets (inner ring, purple)
  Object.entries(targetPos).forEach(([name, longitude]) => {
    const angle = ((-longitude - 90) * Math.PI) / 180;
    const radius = innerRadius - 65;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    const planetIndex = PLANET_NAMES.indexOf(name);
    if (planetIndex === -1) return;
    
    compCtx.beginPath();
    compCtx.arc(x, y, 10, 0, Math.PI * 2);
    compCtx.fillStyle = '#b85eff';
    compCtx.fill();
    compCtx.strokeStyle = '#fff';
    compCtx.lineWidth = 2;
    compCtx.stroke();
    
    // Draw planet symbol
    compCtx.fillStyle = '#000';
    compCtx.font = 'bold 14px Arial';
    compCtx.textAlign = 'center';
    compCtx.textBaseline = 'middle';
    compCtx.fillText(planetSymbols[planetIndex], x, y);
  });
  
  // Draw ascendant lines
  // Subject ascendant (blue)
  const subjectAscAngle = ((-subjectAsc - 90) * Math.PI) / 180;
  compCtx.beginPath();
  compCtx.moveTo(centerX, centerY);
  compCtx.lineTo(
    centerX + Math.cos(subjectAscAngle) * innerRadius,
    centerY + Math.sin(subjectAscAngle) * innerRadius
  );
  compCtx.strokeStyle = '#74c0fc';
  compCtx.lineWidth = 2;
  compCtx.stroke();
  
  // Target ascendant (purple)
  const targetAscAngle = ((-targetAsc - 90) * Math.PI) / 180;
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
  
  // Setup tooltips
  setupComparisonChartTooltips(subjectPos, targetPos, subjectAsc, targetAsc);
}

// Helper function to draw zodiac wheel on a specific canvas
function drawZodiacWheelOnCanvas(ctx, centerX, centerY, outerRadius, innerRadius, ascendant) {
  const signColors = [
    '#ff6b6b', '#51cf66', '#ffd43b', '#74c0fc',
    '#ff8787', '#69db7c', '#ffd43b', '#ff6b6b',
    '#cc5de8', '#51cf66', '#74c0fc', '#a78bfa'
  ];

  for (let i = 0; i < 12; i++) {
    const startAngle = ((i * 30 - ascendant - 90) * Math.PI) / 180;
    const endAngle = (((i + 1) * 30 - ascendant - 90) * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = signColors[i] + '20';
    ctx.fill();
    ctx.strokeStyle = signColors[i] + '80';
    ctx.lineWidth = 1;
    ctx.stroke();

    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const textRadius = (outerRadius + innerRadius) / 2 + 10;
    const textX = centerX + Math.cos(midAngle) * textRadius;
    const textY = centerY + Math.sin(midAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = signColors[i];
    ctx.font = 'bold 11px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_NAMES[i], 0, 0);
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
function setupComparisonChartTooltips(subjectPos, targetPos, subjectAsc, targetAsc) {
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
    subjectPlanetRadius: 120,
    targetPlanetRadius: 75,
    subjectPos,
    targetPos,
    subjectAsc,
    targetAsc
  };
  
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
    
    // Check subject planets
    for (const [name, longitude] of Object.entries(compChartData.subjectPos)) {
      if (isNaN(longitude) || !isFinite(longitude)) continue;
      
      const angle = ((-longitude - 90) * Math.PI) / 180;
      const x = compChartData.centerX + Math.cos(angle) * compChartData.subjectPlanetRadius;
      const y = compChartData.centerY + Math.sin(angle) * compChartData.subjectPlanetRadius;
      
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      
      if (distance <= planetRadius) {
        let normalizedLon = longitude % 360;
        if (normalizedLon < 0) normalizedLon += 360;
        const sign = Math.floor(normalizedLon / 30);
        const degree = normalizedLon % 30;
        const signName = SIGN_NAMES[sign];
        
        return {
          type: 'subject-planet',
          name: name,
          position: `${degree.toFixed(2)}° ${signName}`,
          person: currentSubject.name
        };
      }
    }
    
    // Check target planets
    for (const [name, longitude] of Object.entries(compChartData.targetPos)) {
      if (isNaN(longitude) || !isFinite(longitude)) continue;
      
      const angle = ((-longitude - 90) * Math.PI) / 180;
      const x = compChartData.centerX + Math.cos(angle) * compChartData.targetPlanetRadius;
      const y = compChartData.centerY + Math.sin(angle) * compChartData.targetPlanetRadius;
      
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      
      if (distance <= planetRadius) {
        let normalizedLon = longitude % 360;
        if (normalizedLon < 0) normalizedLon += 360;
        const sign = Math.floor(normalizedLon / 30);
        const degree = normalizedLon % 30;
        const signName = SIGN_NAMES[sign];
        
        return {
          type: 'target-planet',
          name: name,
          position: `${degree.toFixed(2)}° ${signName}`,
          person: currentTarget.name
        };
      }
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
      let angle = Math.atan2(dy, -dx) * (180 / Math.PI);
      // Convert to zodiac longitude (adjusted for ascendant and 90° offset)
      let zodiacLon = -angle - 90 + compChartData.subjectAsc;
      while (zodiacLon < 0) zodiacLon += 360;
      while (zodiacLon >= 360) zodiacLon -= 360;
      
      const signIndex = Math.floor(zodiacLon / 30);
      const signName = SIGN_NAMES[signIndex];
      
      return {
        type: 'sign',
        name: signName,
        element: ELEMENT_NAMES[signIndex % 4],
        quality: QUALITY_NAMES[Math.floor(signIndex / 4)]
      };
    }
    
    return null;
  }
  
  function updateTooltip(evt) {
    const mousePos = getMousePos(compCanvas, evt);
    const mouseX = mousePos.x;
    const mouseY = mousePos.y;
    
    // Check planets first, then signs
    let hoverInfo = checkPlanetHover(mouseX, mouseY);
    
    if (!hoverInfo) {
      hoverInfo = checkSignHover(mouseX, mouseY);
    }
    
    if (hoverInfo) {
      let tooltipHTML = '';
      
      if (hoverInfo.type === 'subject-planet') {
        tooltipHTML = `
          <div style="font-weight: 600; color: #74c0fc; margin-bottom: 0.25rem;">${hoverInfo.name} (${hoverInfo.person})</div>
          <div style="font-size: 0.85rem;">${hoverInfo.position}</div>
        `;
      } else if (hoverInfo.type === 'target-planet') {
        tooltipHTML = `
          <div style="font-weight: 600; color: #b85eff; margin-bottom: 0.25rem;">${hoverInfo.name} (${hoverInfo.person})</div>
          <div style="font-size: 0.85rem;">${hoverInfo.position}</div>
        `;
      } else if (hoverInfo.type === 'sign') {
        tooltipHTML = `
          <div style="font-weight: 600; color: var(--accent-warm); margin-bottom: 0.25rem;">${hoverInfo.name}</div>
          <div style="font-size: 0.85rem; color: #b8d0f0;">${hoverInfo.element} • ${hoverInfo.quality}</div>
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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  renderRecords();
});

// Initialize
selectedLocationName.textContent = '';
