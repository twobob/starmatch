
// UI Manager Module

// Handles user interface interactions including:
// - Toast notifications
// - Modal windows (save, danger/delete confirmation)
// - Records panel management
// - Record rendering and display
// - Interactive tooltips for chart elements


const UIManager = (function() {
  'use strict';

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
  // Records Panel Management
  // ============================================================================

  function openRecordsPanel() {
    const recordsPanel = document.getElementById('records-panel');
    if (!recordsPanel) return;
    recordsPanel.classList.remove('hidden');
    renderRecords();
  }

  function closeRecordsPanel() {
    const recordsPanel = document.getElementById('records-panel');
    if (!recordsPanel) return;
    recordsPanel.classList.add('hidden');
  }

  function renderRecords() {
    const recordsList = document.getElementById('records-list');
    if (!recordsList) return;
    
    const records = StorageManager.load();
    recordsList.innerHTML = '';
    
    if (!records.length) {
      recordsList.classList.add('empty');
      recordsList.innerHTML = '<div class="empty-msg">No saved records yet.</div>';
      return;
    }
    
    recordsList.classList.remove('empty');
    records.sort((a, b) => a.name.localeCompare(b.name));
    
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

  // ============================================================================
  // Save Modal Management
  // ============================================================================

  function openSaveModal() {
    const saveModal = document.getElementById('save-modal');
    const recordNameInput = document.getElementById('record-name-input');
    if (!saveModal) return;
    
    if (recordNameInput) {
      recordNameInput.value = '';
      recordNameInput.focus();
    }
    saveModal.classList.remove('hidden');
  }

  function closeSaveModal() {
    const saveModal = document.getElementById('save-modal');
    if (!saveModal) return;
    saveModal.classList.add('hidden');
  }

  // ============================================================================
  // Danger Modal Management (Two-Stage Delete Confirmation)
  // ============================================================================

  function openDangerModal() {
    const dangerModal = document.getElementById('danger-modal');
    if (!dangerModal) return;
    
    updateDangerModal(0);
    dangerModal.classList.remove('hidden');
  }

  function closeDangerModal() {
    const dangerModal = document.getElementById('danger-modal');
    if (!dangerModal) return;
    dangerModal.classList.add('hidden');
  }

  function updateDangerModal(stage) {
    const dangerModalTitle = document.getElementById('danger-modal-title');
    const dangerModalText = document.getElementById('danger-modal-text');
    const dangerStageIndicator = document.getElementById('danger-stage-indicator');
    const dangerConfirm = document.getElementById('danger-confirm');
    
    if (!dangerModalTitle || !dangerModalText || !dangerStageIndicator || !dangerConfirm) return;
    
    if (stage === 0) {
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
  // Tooltip System
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

  function checkPlanetHover(mouseX, mouseY, chartData) {
    const planetRadius = 15;
    
    if (chartData.planetsArray && chartData.planetsArray.length > 0) {
      for (const planet of chartData.planetsArray) {
        const distance = Math.sqrt((mouseX - planet.x) ** 2 + (mouseY - planet.y) ** 2);
        
        if (distance <= planetRadius) {
          // Calculate sign from visual position on canvas
          const dx = planet.x - chartData.centerX;
          const dy = planet.y - chartData.centerY;
          let angle_rad = Math.atan2(dy, dx);
          let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
          let zodiacLon = ((-canvas_angle + 180 + chartData.ascendant) % 360 + 360) % 360;
          
          const signIndex = getSignIndexFromLongitude(zodiacLon);
          const signName = AstroConstants.SIGN_NAMES[signIndex];
          const degree = zodiacLon % 30;
          const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
          const quality = AstroConstants.QUALITY_NAMES[Math.floor(signIndex / 4)];
          const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
          const isRuling = AstroConstants.RULING_PLANETS[signName] === planet.name;
          
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

  function checkMainChartAscendantHover(mouseX, mouseY, chartData) {
    // Ascendant line is ALWAYS at 180 degrees (9 o'clock) - it's a fixed house cusp
    const ascAngle = Math.PI; // 180 degrees
    const x1 = chartData.centerX;
    const y1 = chartData.centerY;
    const x2 = chartData.centerX + Math.cos(ascAngle) * chartData.innerRadius;
    const y2 = chartData.centerY + Math.sin(ascAngle) * chartData.innerRadius;
    
    const distance = distanceToLineSegment(mouseX, mouseY, x1, y1, x2, y2);
    
    if (distance <= 8) {
      // Adjust for zodiac wheel rotation when displaying tooltip
      const adjustedAsc = (chartData.ascendant - AstroConstants.ZODIAC_ROTATION_OFFSET + 360) % 360;
      const { signName, degree } = getSignInfo(adjustedAsc);
      
      return {
        type: 'ascendant',
        name: 'Ascendant',
        position: `${degree.toFixed(2)}°`,
        sign: signName
      };
    }
    return null;
  }

  function checkAspectHover(mouseX, mouseY, chartData) {
    for (const aspect of chartData.aspects) {
      const distance = distanceToLineSegment(
        mouseX, mouseY,
        aspect.x1, aspect.y1,
        aspect.x2, aspect.y2
      );
      
      if (distance <= 5) {
        const p1Lon = chartData.positions[aspect.planet1];
        const p2Lon = chartData.positions[aspect.planet2];
        
        const p1SignIndex = getSignIndexFromLongitude(p1Lon);
        const p2SignIndex = getSignIndexFromLongitude(p2Lon);
        
        const p1Sign = AstroConstants.SIGN_NAMES[p1SignIndex];
        const p2Sign = AstroConstants.SIGN_NAMES[p2SignIndex];
        
        const p1Element = AstroConstants.ELEMENT_NAMES[p1SignIndex % 4];
        const p2Element = AstroConstants.ELEMENT_NAMES[p2SignIndex % 4];
        
        const p1Quality = AstroConstants.QUALITY_NAMES[Math.floor(p1SignIndex / 4)];
        const p2Quality = AstroConstants.QUALITY_NAMES[Math.floor(p2SignIndex / 4)];
        
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

  function checkSignHover(mouseX, mouseY, chartData) {
    const dx = mouseX - chartData.centerX;
    const dy = mouseY - chartData.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= chartData.innerRadius && distance <= chartData.outerRadius) {
      let angle_rad = Math.atan2(dy, dx);
      let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
      let zodiacLon = ((-canvas_angle + 180 + chartData.ascendant) % 360 + 360) % 360;
      const signIndex = getSignIndexFromLongitude(zodiacLon);
      const signName = AstroConstants.SIGN_NAMES[signIndex];
      const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
      const quality = AstroConstants.QUALITY_NAMES[Math.floor(signIndex / 4)];
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

  function updateTooltip(evt, chartData) {
    const tooltip = document.getElementById('chart-tooltip');
    const canvas = document.getElementById('chart-canvas');
    
    if (!tooltip || !canvas) return;
    
    if (!chartData.positions || Object.keys(chartData.positions).length === 0) {
      tooltip.style.display = 'none';
      return;
    }
    
    const mousePos = getMousePos(canvas, evt);
    const mouseX = mousePos.x;
    const mouseY = mousePos.y;
    
    let hoverInfo = checkPlanetHover(mouseX, mouseY, chartData);
    
    if (!hoverInfo) {
      hoverInfo = checkMainChartAscendantHover(mouseX, mouseY, chartData);
    }
    
    if (!hoverInfo) {
      hoverInfo = checkAspectHover(mouseX, mouseY, chartData);
    }
    
    if (!hoverInfo) {
      hoverInfo = checkSignHover(mouseX, mouseY, chartData);
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
      tooltip.style.left = (evt.clientX + 15) + 'px';
      tooltip.style.top = (evt.clientY + 15) + 'px';
      canvas.style.cursor = 'pointer';
    } else {
      tooltip.style.display = 'none';
      canvas.style.cursor = 'default';
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  return {
    // Toast notifications
    showToast,
    
    // Records panel
    openRecordsPanel,
    closeRecordsPanel,
    renderRecords,
    
    // Save modal
    openSaveModal,
    closeSaveModal,
    
    // Danger modal
    openDangerModal,
    closeDangerModal,
    updateDangerModal,
    
    // Tooltips
    updateTooltip,
    getMousePos,
    distanceToLineSegment
  };
})();

// Export to global scope
if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}
