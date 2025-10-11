
// Comparison Chart Renderer Module
// Handles rendering of dual-person comparison charts with interactive tooltips

const ComparisonChartRenderer = (function() {
  'use strict';

  // Draw comparison chart with subject and target data
  function drawComparisonChart(compCtx, compCanvas, subjectPos, targetPos, subjectAsc, targetAsc, comparisonChartConfig, comparisonHouseCuspOptions) {
    if (!compCanvas) return null;
    
    const centerX = compCanvas.width / 2;
    const centerY = compCanvas.height / 2;
    const outerRadius = comparisonChartConfig.outerRadius;
    const innerRadius = comparisonChartConfig.innerRadius;
    
    compCtx.clearRect(0, 0, compCanvas.width, compCanvas.height);
    compCtx.fillStyle = '#05070f';
    compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
    
    // Draw zodiac wheel using subject's ascendant
    ChartRenderer.drawZodiacWheelOnCanvas(compCtx, centerX, centerY, outerRadius, innerRadius, subjectAsc, true);
    
    // Calculate positions with collision detection for both
    const subjectPlanetsArray = ChartRenderer.calculatePlanetPositionsWithCollisionDetection(
      subjectPos, subjectAsc, centerX, centerY, innerRadius - 20, 22, 12
    );
    
    const targetPlanetsArray = ChartRenderer.calculatePlanetPositionsWithCollisionDetection(
      targetPos, subjectAsc, centerX, centerY, innerRadius - 65, 22, 12
    );
    
    // Calculate aspects for both charts
    const subjectAspects = ChartRenderer.calculateAspects(subjectPos, subjectPlanetsArray, subjectAsc, centerX, centerY, innerRadius - 20);
    const targetAspects = ChartRenderer.calculateAspects(targetPos, targetPlanetsArray, subjectAsc, centerX, centerY, innerRadius - 65);
    
    // Draw aspects (dimmed initially)
    ChartRenderer.drawAspectsOnCanvas(compCtx, subjectAspects, 0.2);
    ChartRenderer.drawAspectsOnCanvas(compCtx, targetAspects, 0.2);
    
    // Draw planets
    drawDualPersonPlanets(compCtx, subjectPlanetsArray, targetPlanetsArray);
    
    // Draw house cusps
    ChartRenderer.drawHouseCuspsOnCanvas(compCtx, centerX, centerY, innerRadius, comparisonHouseCuspOptions);
    
    // Draw target ascendant line (dashed purple)
    drawTargetAscendantLine(compCtx, centerX, centerY, innerRadius, subjectAsc, targetAsc);
    
    // Return data needed for tooltips
    return {
      centerX,
      centerY,
      outerRadius,
      innerRadius,
      subjectPlanetsArray,
      targetPlanetsArray,
      subjectAspects,
      targetAspects
    };
  }

  // Draw planets for both people
  function drawDualPersonPlanets(compCtx, subjectPlanetsArray, targetPlanetsArray) {
    const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
    
    // Helper to get ruling planet for a sign
    const getRulingPlanet = (signName) => {
      const rulingPlanets = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
        'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Pluto',
        'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Uranus', 'Pisces': 'Neptune'
      };
      return rulingPlanets[signName];
    };
    
    // Draw subject planets (outer ring)
    subjectPlanetsArray.forEach((planet) => {
      const planetColour = ChartRenderer.getPlanetColourByLongitude(planet.longitude);
      const signIndex = getSignIndexFromLongitude(planet.longitude);
      const signName = AstroConstants.SIGN_NAMES[signIndex];
      const isRuling = getRulingPlanet(signName) === planet.name;
      
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
    });
    
    // Draw target planets (inner ring)
    targetPlanetsArray.forEach((planet) => {
      const planetColour = ChartRenderer.getPlanetColourByLongitude(planet.longitude);
      const signIndex = getSignIndexFromLongitude(planet.longitude);
      const signName = AstroConstants.SIGN_NAMES[signIndex];
      const isRuling = getRulingPlanet(signName) === planet.name;
      
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
    });
  }

  // Draw target ascendant line
  function drawTargetAscendantLine(compCtx, centerX, centerY, innerRadius, subjectAsc, targetAsc) {
    // The zodiac wheel is rotated so subject's ascendant is at 9 o'clock (180°)
    // Target's ascendant needs to be drawn relative to this rotation
    // Angular difference between target and subject ascendant
    let diff = targetAsc - subjectAsc;
    if (diff < 0) diff += 360;
    
    // Convert to canvas angle: start at 180° (9 o'clock) and subtract the difference
    const targetAscAngle = ((180 - diff) * Math.PI) / 180;
    
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
  }

  // Setup interactive tooltips for comparison chart
  function setupComparisonChartTooltips(compCanvas, compTooltip, subjectPos, targetPos, subjectAsc, targetAsc, subjectPlanetsArray, targetPlanetsArray, subjectAspects, targetAspects, comparisonChartConfig, comparisonHouseCuspOptions, currentSubject, currentTarget, comparisonTooltipListeners) {
    if (!compCanvas || !compTooltip) return null;
    
    // Remove old event listeners if they exist
    if (comparisonTooltipListeners) {
      compCanvas.removeEventListener('mousemove', comparisonTooltipListeners.mousemove);
      compCanvas.removeEventListener('mouseleave', comparisonTooltipListeners.mouseleave);
    }
    
    // Store chart data for tooltip calculations
    const compChartData = {
      centerX: compCanvas.width / 2,
      centerY: compCanvas.height / 2,
      outerRadius: comparisonChartConfig.outerRadius,
      innerRadius: comparisonChartConfig.innerRadius,
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
      const outerRadius = comparisonChartConfig.outerRadius;
      const innerRadius = comparisonChartConfig.innerRadius;
      const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
      
      compCtx.clearRect(0, 0, compCanvas.width, compCanvas.height);
      compCtx.fillStyle = '#05070f';
      compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
      
      // Draw zodiac wheel
      ChartRenderer.drawZodiacWheelOnCanvas(compCtx, centerX, centerY, outerRadius, innerRadius, subjectAsc, true);
      
      // Draw house cusps (always visible, not affected by dimming)
      ChartRenderer.drawHouseCuspsOnCanvas(compCtx, centerX, centerY, innerRadius, comparisonHouseCuspOptions);
      
      // Determine which aspects to lighten based on hovered planet
      let subjectOpacity = 0.2;
      let targetOpacity = 0.2;
      
      if (hoveredPlanet) {
        if (hoveredPlanet.type === 'subject-planet' || hoveredPlanet.type === 'aspect' && hoveredPlanet.person === currentSubject.name) {
          subjectOpacity = 1;
          targetOpacity = 0.2;
        } else if (hoveredPlanet.type === 'target-planet' || hoveredPlanet.type === 'aspect' && hoveredPlanet.person === currentTarget.name) {
          targetOpacity = 1;
          subjectOpacity = 0.2;
        }
      }
      
      // Draw aspects with appropriate opacity
      ChartRenderer.drawAspectsOnCanvas(compCtx, subjectAspects, subjectOpacity);
      ChartRenderer.drawAspectsOnCanvas(compCtx, targetAspects, targetOpacity);
      
      // Determine planet opacity based on hovered aspect
      let subjectPlanetOpacity = 1;
      let targetPlanetOpacity = 1;
      
      if (hoveredPlanet) {
        if (hoveredPlanet.type === 'subject-planet' || (hoveredPlanet.type === 'aspect' && hoveredPlanet.person === currentSubject.name)) {
          targetPlanetOpacity = 0.2;
        } else if (hoveredPlanet.type === 'target-planet' || (hoveredPlanet.type === 'aspect' && hoveredPlanet.person === currentTarget.name)) {
          subjectPlanetOpacity = 0.2;
        }
      }
      
      // Draw subject planets
      subjectPlanetsArray.forEach((planet) => {
        const planetColour = ChartRenderer.getPlanetColourByLongitude(planet.longitude);
        const signIndex = getSignIndexFromLongitude(planet.longitude);
        const signName = AstroConstants.SIGN_NAMES[signIndex];
        const rulingPlanets = AstroConstants.RULING_PLANETS;
        const isRuling = rulingPlanets[signName] === planet.name;
        
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
        const planetColour = ChartRenderer.getPlanetColourByLongitude(planet.longitude);
        const signIndex = getSignIndexFromLongitude(planet.longitude);
        const signName = AstroConstants.SIGN_NAMES[signIndex];
        const rulingPlanets = AstroConstants.RULING_PLANETS;
        const isRuling = rulingPlanets[signName] === planet.name;
        
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
      // The zodiac wheel is rotated so subject's ascendant is at 9 o'clock (180°)
      let diff = targetAsc - subjectAsc;
      if (diff < 0) diff += 360;
      const targetAscAngle = ((180 - diff) * Math.PI) / 180;
      
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
      
      // Check subject planets
      if (compChartData.subjectPlanetsArray) {
        for (const planet of compChartData.subjectPlanetsArray) {
          const distance = Math.sqrt((mouseX - planet.x) ** 2 + (mouseY - planet.y) ** 2);
          
          if (distance <= planetRadius) {
            const dx = planet.x - compChartData.centerX;
            const dy = planet.y - compChartData.centerY;
            let angle_rad = Math.atan2(dy, dx);
            let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
            let zodiacLon = ((-canvas_angle + 180 + compChartData.subjectAsc) % 360 + 360) % 360;
            
            const signIndex = getSignIndexFromLongitude(zodiacLon);
            const signName = AstroConstants.SIGN_NAMES[signIndex];
            const degree = zodiacLon % 30;
            const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
            const quality = AstroConstants.QUALITY_NAMES[Math.floor(signIndex / 4)];
            const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
            const isRuling = AstroConstants.RULING_PLANETS[signName] === planet.name;
            
            return {
              type: 'subject-planet',
              name: planet.name,
              position: `${degree.toFixed(2)}°`,
              sign: signName,
              person: currentSubject.name,
              element, quality, polarity, isRuling
            };
          }
        }
      }
      
      // Check target planets
      if (compChartData.targetPlanetsArray) {
        for (const planet of compChartData.targetPlanetsArray) {
          const distance = Math.sqrt((mouseX - planet.x) ** 2 + (mouseY - planet.y) ** 2);
          
          if (distance <= planetRadius) {
            const dx = planet.x - compChartData.centerX;
            const dy = planet.y - compChartData.centerY;
            let angle_rad = Math.atan2(dy, dx);
            let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
            let zodiacLon = ((-canvas_angle + 180 + compChartData.subjectAsc) % 360 + 360) % 360;
            
            const signIndex = getSignIndexFromLongitude(zodiacLon);
            const signName = AstroConstants.SIGN_NAMES[signIndex];
            const degree = zodiacLon % 30;
            const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
            const quality = AstroConstants.QUALITY_NAMES[Math.floor(signIndex / 4)];
            const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
            const isRuling = AstroConstants.RULING_PLANETS[signName] === planet.name;
            
            return {
              type: 'target-planet',
              name: planet.name,
              position: `${degree.toFixed(2)}°`,
              sign: signName,
              person: currentTarget.name,
              element, quality, polarity, isRuling
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
      
      const distToSubjectAsc = UIManager.distanceToLineSegment(
        mouseX, mouseY, centerX, centerY, subjectAscX, subjectAscY
      );
      
      if (distToSubjectAsc <= 5) {
        const { signName, degree } = getSignInfo(compChartData.subjectAsc);
        const signIndex = getSignIndexFromLongitude(compChartData.subjectAsc);
        const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
        const quality = AstroConstants.QUALITY_NAMES[Math.floor(signIndex / 4)];
        const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
        
        return {
          type: 'subject-ascendant',
          sign: signName,
          degree: degree,
          person: currentSubject.name,
          element, quality, polarity
        };
      }
      
      // Target ascendant (purple) - offset from subject's 9 o'clock position
      let diff = compChartData.targetAsc - compChartData.subjectAsc;
      if (diff < 0) diff += 360;
      const targetAscAngle = ((180 - diff) * Math.PI) / 180;
      const targetAscX = centerX + Math.cos(targetAscAngle) * innerRadius;
      const targetAscY = centerY + Math.sin(targetAscAngle) * innerRadius;
      
      const distToTargetAsc = UIManager.distanceToLineSegment(
        mouseX, mouseY, centerX, centerY, targetAscX, targetAscY
      );
      
      if (distToTargetAsc <= 5) {
        const { signName, degree } = getSignInfo(compChartData.targetAsc);
        const signIndex = getSignIndexFromLongitude(compChartData.targetAsc);
        const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
        const quality = AstroConstants.QUALITY_NAMES[Math.floor(signIndex / 4)];
        const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
        
        return {
          type: 'target-ascendant',
          sign: signName,
          degree: degree,
          person: currentTarget.name,
          element, quality, polarity
        };
      }
      
      return null;
    }
    
    function checkSignHover(mouseX, mouseY) {
      const dx = mouseX - compChartData.centerX;
      const dy = mouseY - compChartData.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= compChartData.innerRadius && distance <= compChartData.outerRadius) {
        let angle_rad = Math.atan2(dy, dx);
        let canvas_angle = (angle_rad * 180 / Math.PI + 360) % 360;
        let zodiacLon = ((-canvas_angle - 180 + compChartData.subjectAsc) % 360 + 360) % 360;
        
        const signIndex = getSignIndexFromLongitude(zodiacLon);
        const signName = AstroConstants.SIGN_NAMES[signIndex];
        const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
        const quality = AstroConstants.QUALITY_NAMES[Math.floor(signIndex / 4)];
        const polarity = (element === 'Fire' || element === 'Air') ? '+' : '-';
        
        return {
          type: 'sign',
          name: signName,
          element, quality, polarity
        };
      }
      
      return null;
    }
    
    function checkAspectHover(mouseX, mouseY) {
      // Check subject aspects
      for (const aspect of compChartData.subjectAspects) {
        const distance = UIManager.distanceToLineSegment(
          mouseX, mouseY, aspect.x1, aspect.y1, aspect.x2, aspect.y2
        );
        
        if (distance <= 5) {
          const p1Lon = compChartData.subjectPos[aspect.planet1];
          const p2Lon = compChartData.subjectPos[aspect.planet2];
          const p1SignIndex = getSignIndexFromLongitude(p1Lon);
          const p2SignIndex = getSignIndexFromLongitude(p2Lon);
          
          return {
            type: 'aspect',
            person: currentSubject.name,
            color: '#74c0fc',
            planet1: aspect.planet1,
            planet2: aspect.planet2,
            aspectType: aspect.type,
            angle: aspect.angle,
            orb: aspect.orb,
            p1Sign: AstroConstants.SIGN_NAMES[p1SignIndex],
            p2Sign: AstroConstants.SIGN_NAMES[p2SignIndex],
            p1Quality: AstroConstants.QUALITY_NAMES[Math.floor(p1SignIndex / 4)],
            p2Quality: AstroConstants.QUALITY_NAMES[Math.floor(p2SignIndex / 4)],
            p1Element: AstroConstants.ELEMENT_NAMES[p1SignIndex % 4],
            p2Element: AstroConstants.ELEMENT_NAMES[p2SignIndex % 4],
            p1Polarity: (AstroConstants.ELEMENT_NAMES[p1SignIndex % 4] === 'Fire' || AstroConstants.ELEMENT_NAMES[p1SignIndex % 4] === 'Air') ? '+' : '-',
            p2Polarity: (AstroConstants.ELEMENT_NAMES[p2SignIndex % 4] === 'Fire' || AstroConstants.ELEMENT_NAMES[p2SignIndex % 4] === 'Air') ? '+' : '-'
          };
        }
      }
      
      // Check target aspects
      for (const aspect of compChartData.targetAspects) {
        const distance = UIManager.distanceToLineSegment(
          mouseX, mouseY, aspect.x1, aspect.y1, aspect.x2, aspect.y2
        );
        
        if (distance <= 5) {
          const p1Lon = compChartData.targetPos[aspect.planet1];
          const p2Lon = compChartData.targetPos[aspect.planet2];
          const p1SignIndex = getSignIndexFromLongitude(p1Lon);
          const p2SignIndex = getSignIndexFromLongitude(p2Lon);
          
          return {
            type: 'aspect',
            person: currentTarget.name,
            color: '#b85eff',
            planet1: aspect.planet1,
            planet2: aspect.planet2,
            aspectType: aspect.type,
            angle: aspect.angle,
            orb: aspect.orb,
            p1Sign: AstroConstants.SIGN_NAMES[p1SignIndex],
            p2Sign: AstroConstants.SIGN_NAMES[p2SignIndex],
            p1Quality: AstroConstants.QUALITY_NAMES[Math.floor(p1SignIndex / 4)],
            p2Quality: AstroConstants.QUALITY_NAMES[Math.floor(p2SignIndex / 4)],
            p1Element: AstroConstants.ELEMENT_NAMES[p1SignIndex % 4],
            p2Element: AstroConstants.ELEMENT_NAMES[p2SignIndex % 4],
            p1Polarity: (AstroConstants.ELEMENT_NAMES[p1SignIndex % 4] === 'Fire' || AstroConstants.ELEMENT_NAMES[p1SignIndex % 4] === 'Air') ? '+' : '-',
            p2Polarity: (AstroConstants.ELEMENT_NAMES[p2SignIndex % 4] === 'Fire' || AstroConstants.ELEMENT_NAMES[p2SignIndex % 4] === 'Air') ? '+' : '-'
          };
        }
      }
      
      return null;
    }
    
    function updateTooltip(evt) {
      const mousePos = getMousePos(compCanvas, evt);
      const mouseX = mousePos.x;
      const mouseY = mousePos.y;
      
      let hoverInfo = checkPlanetHover(mouseX, mouseY);
      if (!hoverInfo) hoverInfo = checkComparisonChartAscendantHover(mouseX, mouseY);
      if (!hoverInfo) hoverInfo = checkAspectHover(mouseX, mouseY);
      if (!hoverInfo) hoverInfo = checkSignHover(mouseX, mouseY);
      
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
      redrawChart(null);
    };
    
    const newListeners = {
      mousemove: updateTooltip,
      mouseleave: mouseleaveHandler
    };
    
    compCanvas.addEventListener('mousemove', updateTooltip);
    compCanvas.addEventListener('mouseleave', mouseleaveHandler);
    
    return newListeners;
  }

  return {
    drawComparisonChart,
    drawDualPersonPlanets,
    drawTargetAscendantLine,
    setupComparisonChartTooltips
  };
})();

if (typeof window !== 'undefined') {
  window.ComparisonChartRenderer = ComparisonChartRenderer;
}
