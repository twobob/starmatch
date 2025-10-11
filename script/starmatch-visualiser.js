
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

  ChartRenderer.drawZodiacWheelOnCanvas(ctx, centerX, centerY, outerRadius, innerRadius, ascendant, false);
  ChartRenderer.drawHouseCuspsOnCanvas(ctx, centerX, centerY, innerRadius, MAIN_HOUSE_CUSP_OPTIONS);
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
  
  // Get the tooltip element (created dynamically in the HTML)
  const compTooltip = document.getElementById('comparison-tooltip');
  if (!compTooltip) {
    console.error('Comparison tooltip element not found');
    return;
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
