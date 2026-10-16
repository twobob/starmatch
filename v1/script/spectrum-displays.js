
// Spectrum Displays Module
// Handles theme bars, aspect counts, traditional factors, and dominants display

const SpectrumDisplays = (function() {
  'use strict';

  function displayThemes(themeValues) {
    const themeBars = document.getElementById('theme-bars');
    if (!themeBars) return;
    
    themeBars.innerHTML = '';
    const maxTheme = Math.max(...themeValues);

    AstroConstants.SIGN_NAMES.forEach((sign, index) => {
      const value = themeValues[index];
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

  function displayAspects(aspectCounts) {
    const aspectCountsEl = document.getElementById('aspect-counts');
    if (!aspectCountsEl) return;
    
    aspectCountsEl.innerHTML = '';

    AstroConstants.ASPECT_NAMES.forEach((name, index) => {
      const count = aspectCounts[index];
      const item = document.createElement('div');
      item.className = 'info-item';
      item.innerHTML = `
        <span class="info-label">${name}</span>
        <span class="info-value">${count}</span>
      `;
      aspectCountsEl.appendChild(item);
    });
  }

  function displayTraditionalFactors(tradFactors) {
    const tradFactorsEl = document.getElementById('trad-factors');
    if (!tradFactorsEl) return;
    
    tradFactorsEl.innerHTML = '';

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
      const value = tradFactors[index];
      const item = document.createElement('div');
      item.className = 'info-item';
      item.innerHTML = `
        <span class="info-label">${label}</span>
        <span class="info-value">${value}</span>
      `;
      tradFactorsEl.appendChild(item);
    });
  }

  function displayDominants(tfDominant, themeValues) {
    const dominantInfo = document.getElementById('dominant-info');
    if (!dominantInfo) return;
    
    dominantInfo.innerHTML = '';

    const polarityItem = document.createElement('div');
    polarityItem.className = 'info-item';
    polarityItem.innerHTML = `
      <span class="info-label">Dominant Polarity</span>
      <span class="info-value dominant">${tfDominant[0] === 1 ? 'Positive' : 'Negative'}</span>
    `;
    dominantInfo.appendChild(polarityItem);

    const elementIndex = tfDominant[1] - 2;
    const elementName = elementIndex >= 0 && elementIndex < 4 ? AstroConstants.ELEMENT_NAMES[elementIndex] : 'None';
    const elementItem = document.createElement('div');
    elementItem.className = 'info-item';
    elementItem.innerHTML = `
      <span class="info-label">Dominant Element</span>
      <span class="info-value dominant">${elementName}</span>
    `;
    dominantInfo.appendChild(elementItem);

    const qualityIndex = tfDominant[2] - 6;
    const qualityName = qualityIndex >= 0 && qualityIndex < 3 ? AstroConstants.QUALITY_NAMES[qualityIndex] : 'None';
    const qualityItem = document.createElement('div');
    qualityItem.className = 'info-item';
    qualityItem.innerHTML = `
      <span class="info-label">Dominant Quality</span>
      <span class="info-value dominant">${qualityName}</span>
    `;
    dominantInfo.appendChild(qualityItem);

    let maxThemeIndex = 0;
    let maxThemeValue = themeValues[0];
    for (let i = 1; i < 12; i++) {
      if (themeValues[i] > maxThemeValue) {
        maxThemeValue = themeValues[i];
        maxThemeIndex = i;
      }
    }

    const themeItem = document.createElement('div');
    themeItem.className = 'info-item';
    themeItem.innerHTML = `
      <span class="info-label">Strongest Theme</span>
      <span class="info-value dominant">${AstroConstants.SIGN_NAMES[maxThemeIndex]} (${maxThemeValue.toFixed(2)})</span>
    `;
    dominantInfo.appendChild(themeItem);
  }

  return {
    displayThemes,
    displayAspects,
    displayTraditionalFactors,
    displayDominants
  };
})();

// Export to global scope
if (typeof window !== 'undefined') {
  window.SpectrumDisplays = SpectrumDisplays;
}
