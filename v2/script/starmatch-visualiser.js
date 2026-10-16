
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
const traditionalFactorsSelect = document.getElementById('traditional-factors');
const precessionCheckbox = document.getElementById('precession-flag');
const planetOrbSetSelect = document.getElementById('planet-orb-set');
const timeZoneSelect = document.getElementById('birth-tz');
const timeZoneHint = document.getElementById('tz-hint');
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
const btnExportRecords = document.getElementById('btn-export-records');
const btnImportRecords = document.getElementById('btn-import-records');
const importRecordsFile = document.getElementById('import-records-file');

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

// Settings modal elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const useTextInputsCheckbox = document.getElementById('use-text-inputs');
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
const SIGN_SYMBOLS = AstroConstants.SIGN_SYMBOLS;
const PLANET_NAMES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 
                      'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECT_NAMES = ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile', 'Semi-square', 'Semi-sextile'];
const ELEMENT_NAMES = ['Fire', 'Earth', 'Air', 'Water'];
const QUALITY_NAMES = ['Cardinal', 'Fixed', 'Mutable'];

// Ruling planets for each sign (based on traditional and modern factors)
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

// Year straight from YYYY-MM-DD (new Date() would read it as UTC midnight,
// which is the previous year on 1 January west of Greenwich)
function birthYearFromDate(dateStr) {
  return parseInt(dateStr, 10);
}

// Time zone chosen in the picker, or '' for a guess from the location
function selectedTimeZone() {
  return timeZoneSelect ? timeZoneSelect.value : '';
}

function populateTimeZones() {
  if (!timeZoneSelect || typeof TimezoneHelper === 'undefined') return;
  const fragment = document.createDocumentFragment();
  TimezoneHelper.listTimeZones().forEach(zone => {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zone.replace(/_/g, ' ');
    fragment.appendChild(option);
  });
  timeZoneSelect.appendChild(fragment);
}

// Show which zone and UTC offset the birth time will be converted with
function updateTimeZoneHint() {
  if (!timeZoneHint || typeof TimezoneHelper === 'undefined') return;
  const dateStr = InputManager.getDate();
  const timeStr = InputManager.getTime();
  const latitude = InputManager.getLatitude();
  const longitude = InputManager.getLongitude();
  const result = (dateStr && timeStr && latitude !== null && longitude !== null)
    ? TimezoneHelper.localToUTC(dateStr, timeStr, latitude, longitude, selectedTimeZone())
    : null;

  timeZoneHint.classList.remove('warning');
  if (!result) {
    timeZoneHint.textContent = '';
    return;
  }

  const { zone, offsetLabel, guessed, approximate } = result.tzInfo;
  if (!guessed) {
    timeZoneHint.textContent = `${zone}, ${offsetLabel} on this date`;
  } else if (approximate) {
    timeZoneHint.textContent = `Rough guess ${offsetLabel} (no daylight saving). Pick the birthplace's time zone.`;
    timeZoneHint.classList.add('warning');
  } else {
    timeZoneHint.textContent = `Guessed ${zone}, ${offsetLabel} on this date. Change it if that's wrong.`;
  }
}

// Aspect orb sets apply only with aspect orbs, planet orb sets only with planet
// orbs, so show just the one that applies (a greyed-out list read as broken)
function syncOrbControls() {
  const planetOrbs = orbTypeSelect.value === '1';
  aspectOrbSetSelect.closest('.setting-row').hidden = planetOrbs;
  if (planetOrbSetSelect) planetOrbSetSelect.closest('.setting-row').hidden = !planetOrbs;
}

// Note: toUTC, getEclipticLongitude, calculateAscendant, calculateMidheaven
// moved to astronomical-calculations.js module and accessed via AstroCalc.*


// Chart Calculation


function calculateChart() {
  if (!astronomyEngineReady) {
    showToast("Astronomy Engine not ready", "error");
    return;
  }
  
  const dateStr = InputManager.getDate();
  const timeStr = InputManager.getTime();
  const latitude = InputManager.getLatitude();
  const longitude = InputManager.getLongitude();

  if (!dateStr || !timeStr) {
    showToast('Please enter birth date and time', 'error');
    return;
  }

  if (!isFinite(latitude) || !isFinite(longitude)) {
    showToast('Invalid date, time, or coordinates', 'error');
    return;
  }

  const date = AstroCalc.toUTC(dateStr, timeStr, latitude, longitude, selectedTimeZone());
  updateTimeZoneHint();
  if (!date) {
    showToast('Invalid date, time, or coordinates', 'error');
    return;
  }

  try {
    // Calculate planetary positions using Astronomy Engine (tropical longitudes)
    const planetaryPositions = {};

    for (const planetName of PLANET_NAMES) {
      try {
        planetaryPositions[planetName] = AstroCalc.getEclipticLongitude(planetName, date);
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
    window.poIndex = parseInt(planetOrbSetSelect.value);
    window.tfIndex = parseInt(traditionalFactorsSelect.value);
    window.precessionFlag = precessionCheckbox.checked ? 1 : 0;

    const birthYear = birthYearFromDate(dateStr);
    window.nativityYear = birthYear;
    window.nativity = birthYear;

    // engine.js precesses its own input when precessionFlag is set,
    // so it gets the unprecessed values; the precessed ones are for display
    const enginePositions = { ...planetaryPositions };
    const engineAscendant = ascendant;
    const engineMidheaven = midheaven;

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
      enginePositions.Sun || 0,
      enginePositions.Moon || 0,
      enginePositions.Mercury || 0,
      enginePositions.Venus || 0,
      enginePositions.Mars || 0,
      enginePositions.Jupiter || 0,
      enginePositions.Saturn || 0,
      enginePositions.Uranus || 0,
      enginePositions.Neptune || 0,
      enginePositions.Pluto || 0,
      engineAscendant,
      engineMidheaven
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
    ...positions
    // Ascendant and Midheaven removed from planetary positions display
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

  ChartRenderer.drawZodiacWheelOnCanvas(ctx, centerX, centerY, outerRadius, innerRadius, ascendant, false);
  ChartRenderer.drawHouseCuspsOnCanvas(ctx, centerX, centerY, innerRadius, ascendant, MAIN_HOUSE_CUSP_OPTIONS);
  ChartRenderer.drawMidheavenIndicator(ctx, centerX, centerY, outerRadius, ascendant, midheaven);
  const planetsArray = drawPlanets(centerX, centerY, innerRadius - 30, positions, ascendant);
  drawAspects(centerX, centerY, innerRadius - 30, positions, ascendant, planetsArray);
}

// Zodiac wheel drawing function moved to chart-renderer.js module
// Now accessed via ChartRenderer.drawZodiacWheelOnCanvas()

// House cusps drawing function moved to chart-renderer.js module
// Now accessed via ChartRenderer.drawHouseCuspsOnCanvas()

// Collision detection moved to chart-renderer.js module
// Now accessed via ChartRenderer.calculatePlanetPositionsWithCollisionDetection()

function drawPlanets(centerX, centerY, radius, positions, ascendant) {
  const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
  
  // Calculate positions with collision detection
  const planetsArray = ChartRenderer.calculatePlanetPositionsWithCollisionDetection(
    positions, ascendant, centerX, centerY, radius, 25, 15
  );
  
  // Draw planets at their adjusted positions
  planetsArray.forEach((planet) => {
    const planetColour = ChartRenderer.getPlanetColourByLongitude(planet.longitude);
    const signIndex = getSignIndexFromLongitude(planet.longitude);
    const signName = SIGN_NAMES[signIndex];
    const isRuling = ZodiacUtils.getSignRuler(signIndex) === planet.name;

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


// Longitude to canvas angle conversion moved to chart-renderer.js module
// Now accessed via ChartRenderer.longitudeToCanvasAngle()
// This is the SINGLE SOURCE OF TRUTH for longitude→angle conversion (counter-clockwise)
function longitudeToCanvasAngle(longitude, ascendant) {
  return ChartRenderer.longitudeToCanvasAngle(longitude, ascendant);
}

// Planet colour calculation moved to chart-renderer.js module
// Now accessed via ChartRenderer.getPlanetColourByLongitude()
function getPlanetColourByLongitude(longitude) {
  return ChartRenderer.getPlanetColourByLongitude(longitude);
}

// Aspect calculation moved to chart-renderer.js module
// Now accessed via ChartRenderer.calculateAspects()

// Aspect drawing moved to chart-renderer.js module
// Now accessed via ChartRenderer.drawAspectsOnCanvas()

function drawAspects(centerX, centerY, radius, positions, ascendant, planetsArray) {
  const aspects = ChartRenderer.calculateAspects(positions, planetsArray, ascendant, centerX, centerY, radius);
  ChartRenderer.drawAspectsOnCanvas(ctx, aspects);
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
  const values = InputManager.getAllValues();
  return StorageManager.build(name, {
    date: values.date || '',
    time: values.time || '',
    lat: values.lat !== null ? String(values.lat) : '',
    lon: values.lon !== null ? String(values.lon) : '',
    orbType: orbTypeSelect.value,
    aspectOrbSet: aspectOrbSetSelect.value,
    planetOrbSet: planetOrbSetSelect.value,
    traditionalFactors: traditionalFactorsSelect.value,
    precession: precessionCheckbox.checked ? 1 : 0,
    tz: selectedTimeZone()
  });
}

function applyRecord(rec, doCalculate=false, includeSettings=true) {
  if (rec.date) InputManager.setDate(rec.date);
  if (rec.time) InputManager.setTime(rec.time);
  if (rec.lat) InputManager.setLatitude(parseFloat(rec.lat));
  if (rec.lon) InputManager.setLongitude(parseFloat(rec.lon));
  // The time zone belongs to the birth data, not the engine settings
  if (timeZoneSelect) {
    timeZoneSelect.value = TimezoneHelper.isValidZone(rec.tz) ? rec.tz : '';
  }
  if (includeSettings) {
    orbTypeSelect.value = rec.orbType || '0';
    aspectOrbSetSelect.value = rec.aspectOrbSet || '0';
    planetOrbSetSelect.value = rec.planetOrbSet || '0';
    // Support both old and new property names for backward compatibility
    traditionalFactorsSelect.value = rec.traditionalFactors || rec.rulershipSet || '0';
    precessionCheckbox.checked = rec.precession === 1;
    syncOrbControls();
  }
  updateTimeZoneHint();
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
  const escape = UIManager.escapeHtml;
  const options = records.map(r => `<option value="${escape(r.id)}">${escape(r.name)}</option>`).join('');
  // Replace only the options: the <button><selectedcontent> lets long names
  // end in an ellipsis in browsers with styleable dropdowns
  const fill = (select, placeholder) => {
    select.querySelectorAll('option').forEach(option => option.remove());
    select.insertAdjacentHTML('beforeend', `<option value="">${placeholder}</option>${options}`);
  };
  if (subjectSelect) fill(subjectSelect, '-- Select Subject --');
  if (targetSelect) fill(targetSelect, '-- Select Target --');
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

// The zone and UTC offset a record's birth time is converted with, saying
// which zone was guessed when the record has none saved
function describeRecordTimeZone(record) {
  const result = TimezoneHelper.localToUTC(record.date, record.time,
    parseFloat(record.lat), parseFloat(record.lon), record.tz);
  if (!result) return record.tz || 'unknown';
  const { zone, offsetLabel, guessed, approximate } = result.tzInfo;
  if (!guessed) return `${zone}, ${offsetLabel} on that date`;
  if (approximate) return `${offsetLabel}, rough guess from longitude (no daylight saving)`;
  return `${zone} (guessed from location), ${offsetLabel} on that date`;
}

function displayPersonInfo(record, container) {
  if (!container) return;
  const escape = UIManager.escapeHtml;
  container.innerHTML = `
    <div class="person-details">
      <p><strong>Date:</strong> ${escape(record.date)} ${escape(record.time)}</p>
      <p><strong>Location:</strong> ${escape(record.lat)}, ${escape(record.lon)}</p>
      <p><strong>Time zone:</strong> ${escape(describeRecordTimeZone(record))}</p>
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
  
  // Clear previous comparison output and cleanup old event listeners
  if (comparisonOutput) {
    comparisonOutput.innerHTML = '';
  }
  
  // Cleanup old tooltip listeners if they exist
  if (comparisonTooltipListeners) {
    const compCanvas = document.getElementById('comparison-chart-canvas');
    if (compCanvas) {
      compCanvas.removeEventListener('mousemove', comparisonTooltipListeners.mousemove);
      compCanvas.removeEventListener('mouseleave', comparisonTooltipListeners.mouseleave);
    }
    comparisonTooltipListeners = null;
  }
  
  // Calculate both charts using ComparisonEngine module
  const subjectPos = ComparisonEngine.calculateChartForRecord(currentSubject);
  const targetPos = ComparisonEngine.calculateChartForRecord(currentTarget);
  
  if (!subjectPos || !targetPos) {
    showToast('Failed to calculate chart positions', 'error');
    return;
  }
  
  ComparisonUI.displayComparisonResults(
    comparisonOutput,
    subjectPos.themes,
    targetPos.themes,
    subjectPos.positions,
    targetPos.positions,
    subjectPos.ascendant,
    targetPos.ascendant,
    currentSubject,
    currentTarget,
    SIGN_NAMES,
    drawComparisonChart
  );
  
  comparisonResults?.classList.remove('hidden');
}

// Note: displayComparisonResults moved to comparison-ui.js module
// Now accessed via ComparisonUI.displayComparisonResults()

function drawComparisonChart(subjectPos, targetPos, subjectAsc, targetAsc) {
  const compCanvas = document.getElementById('comparison-chart-canvas');
  if (!compCanvas) return;
  
  const compCtx = compCanvas.getContext('2d');
  
  // One tooltip at the top level of the page, created on first use: inside the
  // results it sat in panels whose backdrop-filter offset its fixed position
  let compTooltip = document.getElementById('comparison-tooltip');
  if (!compTooltip) {
    compTooltip = document.createElement('div');
    compTooltip.id = 'comparison-tooltip';
    compTooltip.className = 'chart-tooltip';
    document.body.appendChild(compTooltip);
  }
  
  // Use ComparisonChartRenderer module to draw the comparison chart
  const chartData = ComparisonChartRenderer.drawComparisonChart(
    compCtx,
    compCanvas,
    subjectPos,
    targetPos,
    subjectAsc,
    targetAsc,
    COMPARISON_CHART_CONFIG,
    COMPARISON_HOUSE_CUSP_OPTIONS
  );
  
  // Setup tooltips with interactive aspect dimming
  comparisonTooltipListeners = ComparisonChartRenderer.setupComparisonChartTooltips(
    compCanvas,
    compTooltip,
    subjectPos,
    targetPos,
    subjectAsc,
    targetAsc,
    chartData.subjectPlanetsArray,
    chartData.targetPlanetsArray,
    chartData.subjectAspects,
    chartData.targetAspects,
    COMPARISON_CHART_CONFIG,
    COMPARISON_HOUSE_CUSP_OPTIONS,
    currentSubject,
    currentTarget,
    comparisonTooltipListeners
  );
}

// Store event listeners for cleanup
let comparisonTooltipListeners = null;



// Event Listeners


btnCalculate.addEventListener('click', calculateChart);

locationLookupBtn?.addEventListener('click', () => {
  if (typeof initLocationPicker !== 'undefined') {
    const picker = initLocationPicker();
    picker.open((location) => {
      // Update the latitude and longitude inputs
      InputManager.setLatitude(location.latitude);
      InputManager.setLongitude(location.longitude);
      
      // Display the selected location name
      selectedLocationName.textContent = `📍 ${location.name} (${location.fullAddress})`;
      selectedLocationName.style.color = '#5ec5ff';
      updateTimeZoneHint();
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

// Export / import records as a JSON file (backup, or moving between devices)
btnExportRecords?.addEventListener('click', () => {
  const records = loadRecords();
  if (!records.length) {
    showToast('No records to export', 'warning');
    return;
  }
  const blob = new Blob([StorageManager.exportJSON()], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `starmatch-records-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast(`Exported ${records.length} record${records.length === 1 ? '' : 's'}`, 'success');
});

btnImportRecords?.addEventListener('click', () => importRecordsFile?.click());

importRecordsFile?.addEventListener('change', async () => {
  const file = importRecordsFile.files[0];
  importRecordsFile.value = '';
  if (!file) return;
  try {
    const result = StorageManager.importJSON(await file.text());
    renderRecords();
    populateComparisonSelects();
    const parts = [`Imported ${result.added}`];
    if (result.duplicates) parts.push(`${result.duplicates} already saved`);
    if (result.invalid) parts.push(`${result.invalid} invalid`);
    showToast(parts.join(', '), result.added ? 'success' : 'warning', 4000);
  } catch (e) {
    showToast(`Import failed: ${e.message}`, 'error', 5000);
  }
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

// Mode switching (bound once; a second DOMContentLoaded binding fired every handler twice)
btnChartMode?.addEventListener('click', switchToChartMode);
btnStarmatchMode?.addEventListener('click', switchToStarmatchMode);

// Settings modal handlers - ensure elements exist
if (settingsBtn && settingsModal) {
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
}

if (settingsClose && settingsModal) {
  settingsClose.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });
}

// Close settings modal when clicking outside
if (settingsModal) {
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });
}

// Load and save text input mode preference
if (useTextInputsCheckbox) {
  // Load saved preference
  const savedPreference = StorageManager.settings.get('useTextInputs', false);
  useTextInputsCheckbox.checked = savedPreference;
  
  // Save preference when changed and toggle input mode
  useTextInputsCheckbox.addEventListener('change', () => {
    const isTextMode = useTextInputsCheckbox.checked;
    StorageManager.settings.set('useTextInputs', isTextMode);
    
    // Toggle input mode using InputManager
    if (typeof InputManager !== 'undefined') {
      InputManager.setMode(isTextMode);
    }
    
    console.log('Text input mode:', isTextMode ? 'enabled' : 'disabled');
  });
}

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
  
  // Initialize InputManager
  if (typeof InputManager !== 'undefined') {
    InputManager.init();
  }

  populateTimeZones();
  syncOrbControls();
  updateTimeZoneHint();
});

orbTypeSelect.addEventListener('change', syncOrbControls);

// Keep the time zone hint in step with the birth data. Deferred so InputManager
// has copied picker values into the text inputs (its source of truth) first.
const refreshTimeZoneHint = () => setTimeout(updateTimeZoneHint, 0);
['birth-date', 'birth-date-text', 'birth-time', 'birth-time-text',
 'latitude', 'latitude-text', 'longitude', 'longitude-text', 'birth-tz'].forEach(id => {
  const el = document.getElementById(id);
  el?.addEventListener('change', refreshTimeZoneHint);
  el?.addEventListener('input', refreshTimeZoneHint);
});

// Initialise
selectedLocationName.textContent = '';
