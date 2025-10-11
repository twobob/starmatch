
// Starmatch Engine - Astronomy Engine Integration
// Uses astronomy-engine library for accurate planetary calculations


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
const aspectGridSection = document.querySelector('.aspect-grid-section');
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
const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
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


// Chart Configuration


// Main chart dimensions and radii
const MAIN_CHART_CONFIG = {
  outerRadius: 280,
  innerRadius: 220,
  planetRadius: 160  // innerRadius - 60
};

// Main chart house cusp display options
const MAIN_HOUSE_CUSP_OPTIONS = {
  fontSize: 36,
  labelFontSize: 12,
  labelOffset: 20,
  numeralRadiusFactor: 0.55
};

// Comparison chart dimensions and radii
const COMPARISON_CHART_CONFIG = {
  outerRadius: 180,
  innerRadius: 140
};

// Comparison chart house cusp display options
const COMPARISON_HOUSE_CUSP_OPTIONS = {
  fontSize: 14,
  labelFontSize: 10,
  labelOffset: 15,
  numeralRadiusFactor: 0.25
};



// Use ZodiacUtils module functions
// Functions now provided by zodiac-utils.js module
// Maintained as global references for backward compatibility

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
window.astronomyEngineReady = false;


// Load Astronomy Engine with Fallback


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
        window.astronomyEngineReady = true;
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


// Helper Functions


// TidyUpAndFloat - needed by engine.js
function TidyUpAndFloat(value) {
  return parseFloat(value) || 0;
}

// Note: toUTC, getEclipticLongitude, calculateAscendant, calculateMidheaven
// moved to astronomical-calculations.js module and accessed via AstroCalc.*


// Chart Calculation


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

  const date = AstroCalc.toUTC(dateStr, timeStr, latitude, longitude);
  if (!date || !isFinite(latitude) || !isFinite(longitude)) {
    showToast('Invalid date, time, or coordinates', 'error');
    return;
  }

  try {
    // Calculate planetary positions using Astronomy Engine
    const planetaryPositions = {};
    
    for (const planetName of PLANET_NAMES) {
      try {
        const longitude = AstroCalc.getEclipticLongitude(planetName, date);
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
    let ascendant = AstroCalc.calculateAscendant(date, latitude, longitude);
    let midheaven = AstroCalc.calculateMidheaven(date, longitude);

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
    AspectGrid.generateAspectGrid(planetaryPositions);
    SpectrumDisplays.displayThemes(theme);
    SpectrumDisplays.displayAspects(numAspects);
    SpectrumDisplays.displayTraditionalFactors(numTradFactors);
    SpectrumDisplays.displayDominants(tfDominant, theme);
    drawChartWheel(planetaryPositions, ascendant, midheaven);
    
    showToast('Chart calculated successfully', 'success', 2000);
  } catch (e) {
    console.error('Calculation error:', e);
    showToast(`Calculation error: ${e.message}`, 'error');
  }
}


// Display Functions


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

// Aspect Grid generation moved to aspect-grid.js module
// Now accessed via AspectGrid.generateAspectGrid(positions)

// Spectrum display functions moved to spectrum-displays.js module
// Now accessed via SpectrumDisplays.displayThemes(), displayAspects(), etc.


// Chart Wheel Visualisation 


function drawChartWheel(positions, ascendant, midheaven) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const outerRadius = MAIN_CHART_CONFIG.outerRadius;
  const innerRadius = MAIN_CHART_CONFIG.innerRadius;
  
  chartData.centerX = centerX;
  chartData.centerY = centerY;
  chartData.planetRadius = MAIN_CHART_CONFIG.planetRadius;
  chartData.innerRadius = innerRadius;
  chartData.outerRadius = outerRadius;
  chartData.aspects = [];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawZodiacWheel(centerX, centerY, outerRadius, innerRadius, ascendant);
  drawHouseCusps(centerX, centerY, innerRadius, ascendant);
  const planetsArray = drawPlanets(centerX, centerY, innerRadius - 30, positions, ascendant);
  drawAspects(centerX, centerY, innerRadius - 30, positions, ascendant, planetsArray);
}

function drawZodiacWheel(centerX, centerY, outerRadius, innerRadius, ascendant) {
  drawZodiacWheelOnCanvas(ctx, centerX, centerY, outerRadius, innerRadius, ascendant, false);
}

// Shared zodiac wheel drawing function for both main chart and comparison chart
function drawZodiacWheelOnCanvas(ctx, centerX, centerY, outerRadius, innerRadius, ascendant, isComparisonChart = false) {
  // Derive colours from elements: Fire, Earth, Air, Water pattern
  const getSignColour = (signIndex) => {
    const element = ELEMENT_NAMES[signIndex % 4];
    return ELEMENT_COLOURS[element];
  };

  const offset = 180 + ascendant;
  for (let i = 0; i < 12; i++) {
    const startDeg = (-i * 30 + offset) % 360;
    const endDeg = (-(i + 1) * 30 + offset) % 360;
    // Calculate which sign should be displayed in this segment
    const segmentLongitude = (i * 30) % 360;
    const signIndex = getSignIndexFromLongitude(segmentLongitude);
    const startAngle = (startDeg * Math.PI) / 180;
    const endAngle = (endDeg * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, true);
    ctx.closePath();
    const signColour = getSignColour(signIndex);
    ctx.fillStyle = signColour + '20';
    ctx.fill();
    
    // Draw radial segment dividers from outer edge to inner edge only
    ctx.beginPath();
    ctx.moveTo(
      centerX + Math.cos(startAngle) * innerRadius,
      centerY + Math.sin(startAngle) * innerRadius
    );
    ctx.lineTo(
      centerX + Math.cos(startAngle) * outerRadius,
      centerY + Math.sin(startAngle) * outerRadius
    );
    ctx.strokeStyle = signColour + '80';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center label in the middle of the segment
    const labelDeg = (offset - i * 30 - 15) % 360;
    const labelAngle = (labelDeg * Math.PI) / 180;
    
    // Calculate font sizes and offsets based on chart type
    const nameFontSize = isComparisonChart ? 10 : 12;
    const symbolFontSize = isComparisonChart ? 20 : 24;
    const nameOffset = isComparisonChart ? 10 : 15;
    const symbolOffset = isComparisonChart ? 12 : 24;
    
    // Draw sign name (further out)
    const nameRadius = outerRadius - nameOffset;
    const nameX = centerX + Math.cos(labelAngle) * nameRadius;
    const nameY = centerY + Math.sin(labelAngle) * nameRadius;

    ctx.save();
    ctx.translate(nameX, nameY);
    ctx.rotate(labelAngle + Math.PI / 2);
    ctx.fillStyle = getSignColour(signIndex);
    ctx.font = `bold ${nameFontSize}px "Segoe UI"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_NAMES[signIndex], 0, 0);
    ctx.restore();
    
    // Draw sign symbol (inner, larger)
    const symbolRadius = innerRadius + symbolOffset;
    const symbolX = centerX + Math.cos(labelAngle) * symbolRadius;
    const symbolY = centerY + Math.sin(labelAngle) * symbolRadius;

    ctx.save();
    ctx.translate(symbolX, symbolY);
    ctx.rotate(labelAngle + Math.PI / 2);
    ctx.fillStyle = getSignColour(signIndex);
    ctx.font = `bold ${symbolFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_SYMBOLS[signIndex], 0, 0);
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

// Shared function to draw house cusps and numerals on any canvas context
function drawHouseCuspsOnCanvas(canvasCtx, centerX, centerY, radius, options = {}) {
  const {
    fontSize = 24,
    labelFontSize = 12,
    labelOffset = 20,
    numeralRadiusFactor = 0.45
  } = options;
  
  const regularNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // Draw 12 house cusp lines at fixed clock positions
  for (let i = 0; i < 12; i++) {
    const houseAngle = ((-90 + i * 30) * Math.PI) / 180;
    const isAscendant = (i === 9);
    
    canvasCtx.beginPath();
    canvasCtx.moveTo(centerX, centerY);
    canvasCtx.lineTo(
      centerX + Math.cos(houseAngle) * radius,
      centerY + Math.sin(houseAngle) * radius
    );
    
    if (isAscendant) {
      canvasCtx.strokeStyle = '#ffb85e';
      canvasCtx.lineWidth = 3;
    } else {
      canvasCtx.strokeStyle = 'rgba(94, 197, 255, 0.3)';
      canvasCtx.lineWidth = 1;
    }
    canvasCtx.stroke();
    
    if (isAscendant) {
      canvasCtx.fillStyle = '#ffb95eff';
      canvasCtx.font = `bold ${labelFontSize}px "Segoe UI"`;
      canvasCtx.textAlign = 'center';
      const labelX = centerX + Math.cos(houseAngle) * (radius - labelOffset);
      const labelY = centerY + Math.sin(houseAngle) * (radius - labelOffset);
      canvasCtx.fillText('AC', labelX, labelY);
    }
  }
  
  // Draw numerals for houses
  for (let i = 0; i < 12; i++) {
    const houseNumAngle = ((-90 - (3 + i) * 30 - 15) * Math.PI) / 180;
    const numeralRadius = radius * numeralRadiusFactor;
    const numeralX = centerX + Math.cos(houseNumAngle) * numeralRadius;
    const numeralY = centerY + Math.sin(houseNumAngle) * numeralRadius;
    
    canvasCtx.save();
    canvasCtx.translate(numeralX, numeralY);
    canvasCtx.rotate(houseNumAngle + Math.PI / 2);
    canvasCtx.fillStyle = 'rgba(94, 197, 255, 0.05)';
    canvasCtx.font = `bold ${fontSize}px Georgia, serif`;
    canvasCtx.textAlign = 'center';
    canvasCtx.textBaseline = 'middle';
    canvasCtx.fillText(regularNumbers[i], 0, 0);
    canvasCtx.restore();
  }
}

function drawHouseCusps(centerX, centerY, radius, ascendant) {
  drawHouseCuspsOnCanvas(ctx, centerX, centerY, radius, MAIN_HOUSE_CUSP_OPTIONS);
}

// Collision detection and stacking helper function
function calculatePlanetPositionsWithCollisionDetection(positions, ascendant, centerX, centerY, baseRadius, collisionThreshold = 25, stackOffset = 15) {
  const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
  const planetsArray = [];
  
  // First pass: calculate initial positions
  Object.entries(positions).forEach(([name, longitude]) => {
    if (longitude === undefined || longitude === null || isNaN(longitude)) return;
    
    const angle = longitudeToCanvasAngle(longitude, ascendant);
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


// Shared Chart Drawing Utilities


// Convert zodiac longitude to canvas angle (in radians)
// This is the SINGLE SOURCE OF TRUTH for longitude→angle conversion
function longitudeToCanvasAngle(longitude, ascendant) {
  return (((-longitude - ascendant + 180) % 360) * Math.PI) / 180;
}

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
            const angle1 = longitudeToCanvasAngle(p1.longitude, ascendant);
            x1 = centerX + Math.cos(angle1) * radius;
            y1 = centerY + Math.sin(angle1) * radius;
          }
          
          if (planet2Data) {
            x2 = planet2Data.x;
            y2 = planet2Data.y;
          } else {
            const angle2 = longitudeToCanvasAngle(p2.longitude, ascendant);
            x2 = centerX + Math.cos(angle2) * radius;
            y2 = centerY + Math.sin(angle2) * radius;
          }

          // Calculate actual orb (difference from exact aspect)
          const actualOrb = Math.abs(diff - aspectAngle);
          
          // Determine aspect type name
          const aspectTypes = {
            0: 'Conjunction',
            30: 'Semi-sextile',
            45: 'Semi-square',
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


// UI Functions - Now provided by UIManager module - called like UIManager.*


// Use UIManager module functions instead of duplicates
const showToast = (message, type, duration) => UIManager.showToast(message, type, duration);
const openRecordsPanel = () => UIManager.openRecordsPanel();
const closeRecordsPanel = () => UIManager.closeRecordsPanel();
const renderRecords = () => UIManager.renderRecords();
const openSaveModal = () => UIManager.openSaveModal();
const closeSaveModal = () => UIManager.closeSaveModal();
const openDangerModal = () => UIManager.openDangerModal();
const closeDangerModal = () => UIManager.closeDangerModal();


// Storage & CRUD Functions, called like StorageManager.*


// Use StorageManager module functions instead of duplicates
const loadRecords = () => StorageManager.load();
const saveRecords = (records) => StorageManager.save(records);
const addRecord = (data) => StorageManager.add(data);
const updateRecord = (id, patch) => StorageManager.update(id, patch);
const deleteRecord = (id) => StorageManager.delete(id);
const clearAllRecords = () => StorageManager.clear();

function buildRecordPayload(name) {
  return StorageManager.build(name, {
    date: birthDate.value || '',
    time: birthTime.value || '',
    lat: latitudeInput.value || '',
    lon: longitudeInput.value || '',
    orbType: orbTypeSelect.value,
    aspectOrbSet: aspectOrbSetSelect.value,
    rulershipSet: rulershipSetSelect.value,
    precession: precessionCheckbox.checked ? 1 : 0
  });
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

// Use UIManager for danger modal stage updates
function updateDangerModal() {
  UIManager.updateDangerModal(dangerStage);
}


// Interactive Tooltips - Now provided by UIManager module, called like UIManager.*


// Tooltip update wrapper - delegates to UIManager
function updateTooltip(evt) {
  UIManager.updateTooltip(evt, chartData);
}


// Mode Switching


/**
 * Update visibility of UI elements based on the current mode.
 * This modular function centralises all mode-based show/hide logic.
 * @param {string} mode - Either 'chart' or 'starmatch'
 */
function updateModeVisibility(mode) {
  if (mode === 'chart') {
    // Show Chart Mode elements
    if (starmatchSection) starmatchSection.classList.add('hidden');
    if (chartInputControls) chartInputControls.style.display = 'grid';
    if (chartVisualisation) chartVisualisation.style.display = 'block';
    if (aspectGridSection) aspectGridSection.style.display = 'block';
    if (resultsContainer) resultsContainer.style.display = 'grid';
    if (analysisDetails) analysisDetails.style.display = 'block';
  } else if (mode === 'starmatch') {
    // Show Starmatch Mode elements, hide Chart Mode elements
    if (starmatchSection) starmatchSection.classList.remove('hidden');
    if (chartInputControls) chartInputControls.style.display = 'none';
    if (chartVisualisation) chartVisualisation.style.display = 'none';
    if (aspectGridSection) aspectGridSection.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (analysisDetails) analysisDetails.style.display = 'none';
  }
}

// Mode switching
function switchToChartMode() {
  btnChartMode.classList.add('active');
  btnStarmatchMode.classList.remove('active');
  updateModeVisibility('chart');
}

function switchToStarmatchMode() {
  const records = loadRecords();
  
  if (records.length < 2) {
    showToast('Please create at least 2 records before using Starmatch mode.', 'warning', 5000);
    return;
  }
  
  btnStarmatchMode.classList.add('active');
  btnChartMode.classList.remove('active');
  updateModeVisibility('starmatch');
  
  populateComparisonSelects();
}


// Starmatch Comparison Functions


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

// Note: calculateChartForRecord, calculateXProfileValue, getRelationshipTypeInterpretation
// moved to comparison-engine.js module and accessed via ComparisonEngine.*

function performComparison() {
  if (!currentSubject || !currentTarget) return;
  
  // Calculate both charts using ComparisonEngine module
  const subjectPos = ComparisonEngine.calculateChartForRecord(currentSubject);
  const targetPos = ComparisonEngine.calculateChartForRecord(currentTarget);
  
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

function displayComparisonResults(subjectThemes, targetThemes, subjectPos, targetPos, subjectAsc, targetAsc) {
  if (!comparisonOutput) return;
  
  // Calculate xProfile value using ComparisonEngine module
  const xProfileValue = ComparisonEngine.calculateXProfileValue(subjectThemes, targetThemes);
  const relType = ComparisonEngine.getRelationshipTypeInterpretation(xProfileValue);
  
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
  
  // Chart Visualisation - moved before theme comparison
  html += `<div class="comparison-chart-container">
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
  
  // Close the first comparison-grid
  html += '</div>';
  
  // Theme comparison - now after chart, will be placed in bottom grid
  const themeAnalysisHTML = `<div style="display: flex; flex-direction: column; gap: 0.6rem;">
  ${SIGN_NAMES.map((signName, i) => {
    const subjectVal = subjectThemes[i];
    const targetVal = targetThemes[i];
    const maxTheme = Math.max(...subjectThemes, ...targetThemes);
    const subjectPercent = (subjectVal / maxTheme) * 100;
    const targetPercent = (targetVal / maxTheme) * 100;
    const diff = Math.abs(subjectVal - targetVal);
    
    return `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
        <div style="min-width: 70px; color: #b8d0f0; text-align: right; font-weight: 500;">${signName}</div>
        
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
  }).join('')}
  </div>
  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(94,197,255,0.15); font-size: 0.7rem; color: #8fa8ce; display: flex; justify-content: space-between; align-items: center;">
    <div style="display: flex; gap: 1.5rem;">
      <div><span style="color: #74c0fc;">━━━</span> Subject</div>
      <div><span style="color: #b85eff;">━━━</span> Target</div>
    </div>
    <div style="font-style: italic;">Δ = Difference</div>
  </div>`;
  
  // Bottom section with theme analysis and info text side-by-side (responsive grid)
  html += `<div class="comparison-grid" style="margin-top: 1rem;">
    <div style="padding: 1rem; background: rgba(10,13,19,0.6); border-radius: 8px; border: 1px solid rgba(94,197,255,0.15);">
      <h4 style="color: var(--accent); margin-top: 0;">Theme-by-Theme Analysis</h4>
      ${themeAnalysisHTML}
    </div>
    <div style="padding: 1rem; background: rgba(10,13,19,0.6); border-radius: 8px; border: 1px solid rgba(94,197,255,0.15);">
      <div style="font-size: 0.75rem; color: #8fa8ce; line-height: 1.6;">
        <strong style="color: #b8d0f0;">Understanding xProfile Values:</strong><br><br>
        <span style="color: #74c0fc;">+1.0</span> = Charts have same shape (similarity)<br><br>
        <span style="color: #ffd43b;">0.0</span> = Perfect balance (ideal for lasting relationships)<br><br>
        <span style="color: #b85eff;">-1.0</span> = Charts are inverted (complementarity)
      </div>
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(94,197,255,0.15); font-size: 0.7rem; color: #6a7fa0; font-style: italic;">
        Subject: ${currentSubject.name}<br>Target: ${currentTarget.name}
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
  const outerRadius = COMPARISON_CHART_CONFIG.outerRadius;
  const innerRadius = COMPARISON_CHART_CONFIG.innerRadius;
  
  compCtx.clearRect(0, 0, compCanvas.width, compCanvas.height);
  compCtx.fillStyle = '#05070f';
  compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
  
  // Draw zodiac wheel using subject's ascendant
  drawZodiacWheelOnCanvas(compCtx, centerX, centerY, outerRadius, innerRadius, subjectAsc, true);
  
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
  
  // Draw house cusps (12 fixed clock positions)
  drawHouseCuspsOnCanvas(compCtx, centerX, centerY, innerRadius, COMPARISON_HOUSE_CUSP_OPTIONS);
  
  // Draw target ascendant line (dashed purple)
  const targetAscAngle = (((targetAsc - subjectAsc + 180) % 360) * Math.PI) / 180;
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
  
  // Setup tooltips with interactive aspect dimming
  setupComparisonChartTooltips(subjectPos, targetPos, subjectAsc, targetAsc, subjectPlanetsArray, targetPlanetsArray, subjectAspects, targetAspects);
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
    outerRadius: COMPARISON_CHART_CONFIG.outerRadius,
    innerRadius: COMPARISON_CHART_CONFIG.innerRadius,
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
    const outerRadius = COMPARISON_CHART_CONFIG.outerRadius;
    const innerRadius = COMPARISON_CHART_CONFIG.innerRadius;
    const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
    
    compCtx.clearRect(0, 0, compCanvas.width, compCanvas.height);
    compCtx.fillStyle = '#05070f';
    compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
    
    // Draw zodiac wheel
    drawZodiacWheelOnCanvas(compCtx, centerX, centerY, outerRadius, innerRadius, subjectAsc, true);
    
    // Draw house cusps (always visible, not affected by dimming)
    drawHouseCuspsOnCanvas(compCtx, centerX, centerY, innerRadius, COMPARISON_HOUSE_CUSP_OPTIONS);
    
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
    
    // Draw target ascendant line (dashed purple) with appropriate opacity
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
          // Calculate sign from visual position on canvas
          const dx = planet.x - compChartData.centerX;
          const dy = planet.y - compChartData.centerY;
          let angle_rad = Math.atan2(dy, dx);
          let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
          let zodiacLon = ((-canvas_angle + 180 + compChartData.subjectAsc) % 360 + 360) % 360;
          
          const signIndex = getSignIndexFromLongitude(zodiacLon);
          const signName = SIGN_NAMES[signIndex];
          const degree = zodiacLon % 30;
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
          // Calculate sign from visual position on canvas
          const dx = planet.x - compChartData.centerX;
          const dy = planet.y - compChartData.centerY;
          let angle_rad = Math.atan2(dy, dx);
          let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
          let zodiacLon = ((-canvas_angle + 180 + compChartData.subjectAsc) % 360 + 360) % 360;
          
          const signIndex = getSignIndexFromLongitude(zodiacLon);
          const signName = SIGN_NAMES[signIndex];
          const degree = zodiacLon % 30;
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
    const distToSubjectAsc = UIManager.distanceToLineSegment(
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
    const distToTargetAsc = UIManager.distanceToLineSegment(
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
      let zodiacLon = ((-canvas_angle - 180 + compChartData.subjectAsc) % 360 + 360) % 360;
      
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
      const distance = UIManager.distanceToLineSegment(
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
      const distance = UIManager.distanceToLineSegment(
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


// Event Listeners


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

// Collapsible sections for planetary positions and theme values
document.querySelectorAll('.collapsible-section .collapse-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const isCollapsed = targetElement.classList.toggle('collapsed');
      const icon = button.querySelector('.collapse-icon');
      if (icon) {
        icon.textContent = isCollapsed ? '▶' : '▼';
      }
    }
  });
});

// Canvas tooltips
canvas.addEventListener('mousemove', updateTooltip);
canvas.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
  canvas.style.cursor = 'default';
});

// Maintain square aspect grid cells on resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const aspectGrid = document.getElementById('aspect-grid');
    if (aspectGrid) {
      const cells = aspectGrid.querySelectorAll('td');
      cells.forEach(cell => {
        const width = cell.getBoundingClientRect().width;
        cell.style.height = `${width}px`;
        cell.style.minHeight = `${width}px`;
        cell.style.maxHeight = `${width}px`;
      });
    }
  }, 100);
});

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    const aspectGrid = document.getElementById('aspect-grid');
    if (aspectGrid) {
      const cells = aspectGrid.querySelectorAll('td');
      cells.forEach(cell => {
        const width = cell.getBoundingClientRect().width;
        cell.style.height = `${width}px`;
        cell.style.minHeight = `${width}px`;
        cell.style.maxHeight = `${width}px`;
      });
    }
  }, 200);
});

// Initialise on load
document.addEventListener('DOMContentLoaded', () => {
  renderRecords();
});

// Initialise
selectedLocationName.textContent = '';
