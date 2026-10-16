
// Aspect Grid Module
// Handles visual grid display of planetary aspects

const AspectGrid = (function() {
  'use strict';

  // Planet symbols
  const PLANET_SYMBOLS = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
  
  // Planet speeds (degrees per day, approximate) - used to determine applying/separating
  const PLANET_SPEEDS = [1.0, 13.2, 1.6, 1.2, 0.5, 0.08, 0.03, 0.01, 0.006, 0.004];
  
  // Aspect symbols and colors
  const ASPECT_SYMBOLS = {
    'Conjunction': { symbol: '☌', color: '#ff6b6b' },
    'Semi-sextile': { symbol: '⚺', color: '#51cf66' },
    'Semi-square': { symbol: '∠', color: '#ffd43b' },
    'Sextile': { symbol: '⚹', color: '#74c0fc' },
    'Square': { symbol: '□', color: '#ff6b6b' },
    'Trine': { symbol: '△', color: '#51cf66' },
    'Opposition': { symbol: '☍', color: '#a78bfa' }
  };

  function generateAspectGrid(positions) {
    const aspectGrid = document.getElementById('aspect-grid');
    if (!aspectGrid) return;
    
    // Calculate all aspects between planets
    const planetLongitudes = Object.entries(positions).map(([name, lon]) => ({
      name,
      longitude: lon,
      index: AstroConstants.PLANET_NAMES.indexOf(name)
    })).filter(p => p.index !== -1).sort((a, b) => a.index - b.index);
    
    const aspectAngles = [0, 180, 120, 90, 60, 45, 30];
    const aspectMap = {};
    
    // Build aspect map
    planetLongitudes.forEach((p1, i) => {
      planetLongitudes.forEach((p2, j) => {
        if (i >= j) return; // Only calculate each pair once, skip diagonal
        
        let diff = Math.abs(p1.longitude - p2.longitude);
        if (diff > 180) diff = 360 - diff;
        
        for (const aspectAngle of aspectAngles) {
          const orb = window.orbType === 0 ? window.ao[window.aoIndex][aspectAngles.indexOf(aspectAngle)] : 8;
          if (Math.abs(diff - aspectAngle) <= orb) {
            const aspectTypes = {
              0: 'Conjunction',
              30: 'Semi-sextile',
              45: 'Semi-square',
              60: 'Sextile',
              90: 'Square',
              120: 'Trine',
              180: 'Opposition'
            };
            
            // Calculate orb - this gives us the signed offset from exactness
            const orbDifference = diff - aspectAngle;
            const orbValue = Math.abs(orbDifference);
            
            // Determine if applying or separating based on planetary motion
            const fasterPlanetIndex = PLANET_SPEEDS[p1.index] > PLANET_SPEEDS[p2.index] ? i : j;
            const slowerPlanetIndex = fasterPlanetIndex === i ? j : i;
            const fasterLon = planetLongitudes[fasterPlanetIndex].longitude;
            const slowerLon = planetLongitudes[slowerPlanetIndex].longitude;
            
            // Calculate if faster planet is ahead or behind slower planet
            let separation = (fasterLon - slowerLon + 360) % 360;
            const isApplying = separation > 180; // Faster planet is behind, approaching
            
            const key = `${i}-${j}`;
            aspectMap[key] = {
              type: aspectTypes[aspectAngle],
              orb: orbValue,
              signedOrb: orbDifference,
              applying: isApplying,
              angle: aspectAngle
            };
            break;
          }
        }
      });
    });
    
    // Generate HTML table
    let html = '<table><thead><tr><th></th>';
    planetLongitudes.forEach(p => {
      html += `<th>${PLANET_SYMBOLS[p.index]}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    planetLongitudes.forEach((p1, i) => {
      html += `<tr><th>${PLANET_SYMBOLS[p1.index]}</th>`;
      planetLongitudes.forEach((p2, j) => {
        if (i === j) {
          html += '<td class="diagonal"></td>';
        } else {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          const aspect = aspectMap[key];
          
          if (aspect) {
            const aspectInfo = ASPECT_SYMBOLS[aspect.type] || { symbol: '?', color: '#888' };
            const letter = aspect.applying ? 'A' : 'S';
            html += `<td class="has-aspect" data-aspect="${aspect.type}" data-orb="${aspect.signedOrb.toFixed(0)}" data-letter="${letter}" title="${aspect.type} (${aspect.applying ? 'Applying' : 'Separating'} ${aspect.orb.toFixed(2)}°)"><canvas width="60" height="60" data-symbol="${aspectInfo.symbol}" data-color="${aspectInfo.color}" data-orb="${aspect.signedOrb.toFixed(0)}" data-letter="${letter}"></canvas></td>`;
          } else {
            html += '<td></td>';
          }
        }
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    aspectGrid.innerHTML = html;
    
    enforceSquareCells(aspectGrid);
    drawAspectSymbols(aspectGrid);
  }

  function enforceSquareCells(aspectGrid) {
    const applyCellSizes = () => {
      const cells = aspectGrid.querySelectorAll('td');
      cells.forEach(cell => {
        const width = cell.getBoundingClientRect().width;
        cell.style.height = `${width}px`;
        cell.style.minHeight = `${width}px`;
        cell.style.maxHeight = `${width}px`;
      });
    };
    
    applyCellSizes();
    
    requestAnimationFrame(() => {
      applyCellSizes();
      setTimeout(applyCellSizes, 100);
    });
  }

  function drawAspectSymbols(aspectGrid) {
    requestAnimationFrame(() => {
      aspectGrid.querySelectorAll('canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const symbol = canvas.dataset.symbol;
        const color = canvas.dataset.color;
        const orb = canvas.dataset.orb;
        const letter = canvas.dataset.letter;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw aspect symbol on left side (lower-left area)
        ctx.fillStyle = color;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(symbol, 8, canvas.height - 8);
        
        // Draw orb number on right side (top-right)
        ctx.fillStyle = '#e2eeff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(orb, canvas.width - 4, 4);
        
        // Draw letter on right side (bottom-right)
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(letter, canvas.width - 4, canvas.height - 4);
      });
    });
  }

  return {
    generateAspectGrid
  };
})();

// Export to global scope
if (typeof window !== 'undefined') {
  window.AspectGrid = AspectGrid;
}
