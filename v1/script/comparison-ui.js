// ============================================================================
// Comparison UI Module
// Handles comparison results display and HTML generation
// ============================================================================

(function() {
  'use strict';

  /**
   * Display comparison results in the UI
   * @param {HTMLElement} comparisonOutput - Output container element
   * @param {Array<number>} subjectThemes - Subject's theme array
   * @param {Array<number>} targetThemes - Target's theme array  
   * @param {Object} subjectPos - Subject's planetary positions
   * @param {Object} targetPos - Target's planetary positions
   * @param {number} subjectAsc - Subject's ascendant
   * @param {number} targetAsc - Target's ascendant
   * @param {Object} currentSubject - Subject record with name
   * @param {Object} currentTarget - Target record with name
   * @param {Array<string>} SIGN_NAMES - Array of zodiac sign names
   * @param {Function} drawComparisonChart - Chart drawing callback
   */
  function displayComparisonResults(comparisonOutput, subjectThemes, targetThemes, subjectPos, targetPos, subjectAsc, targetAsc, currentSubject, currentTarget, SIGN_NAMES, drawComparisonChart) {
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

  // ============================================================================
  // Module Export
  // ============================================================================

  window.ComparisonUI = {
    displayComparisonResults
  };

})();
