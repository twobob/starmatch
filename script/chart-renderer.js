const ChartRenderer = (function() {
  'use strict';

  // Convert zodiac longitude to canvas angle (in radians)
  // This is the SINGLE SOURCE OF TRUTH for longitude→angle conversion (counter-clockwise)
  function longitudeToCanvasAngle(longitude, ascendant) {
    return (((180 + ascendant + AstroConstants.ZODIAC_ROTATION_OFFSET - longitude) % 360) * Math.PI) / 180;
  }

  function calculatePlanetPositionsWithCollisionDetection(positions, ascendant, centerX, centerY, baseRadius, collisionThreshold = 25, stackOffset = 15) {
    const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
    const planetsArray = [];
    
    Object.entries(positions).forEach(([name, longitude]) => {
      if (longitude === undefined || longitude === null || isNaN(longitude)) return;
      
      const angle = longitudeToCanvasAngle(longitude, ascendant);
      const planetIndex = AstroConstants.PLANET_NAMES.indexOf(name);
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
    
    planetsArray.sort((a, b) => a.longitude - b.longitude);
    
    const groups = [];
    let currentGroup = [planetsArray[0]];
    
    for (let i = 1; i < planetsArray.length; i++) {
      const prevPlanet = planetsArray[i - 1];
      const currPlanet = planetsArray[i];
      
      let angularDiff = Math.abs(currPlanet.longitude - prevPlanet.longitude);
      if (angularDiff > 180) angularDiff = 360 - angularDiff;
      
      if (angularDiff < 8) {
        currentGroup.push(currPlanet);
      } else {
        groups.push(currentGroup);
        currentGroup = [currPlanet];
      }
    }
    groups.push(currentGroup);
    
    for (const group of groups) {
      if (group.length === 1) {
        const planet = group[0];
        planet.x = centerX + Math.cos(planet.angle) * planet.adjustedRadius;
        planet.y = centerY + Math.sin(planet.angle) * planet.adjustedRadius;
      } else {
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

  function getPlanetColourByLongitude(longitude) {
    const signIndex = getSignIndexFromLongitude(longitude);
    const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
    return AstroConstants.ELEMENT_COLOURS[element];
  }

  function calculateAspects(positions, planetsArray, ascendant, centerX, centerY, radius) {
    const aspectAngles = [0, 180, 120, 90, 60, 45, 30];
    const aspects = [];
    
    const planetLongitudes = Object.entries(positions).map(([name, lon]) => ({
      name,
      longitude: lon,
      index: AstroConstants.PLANET_NAMES.indexOf(name)
    })).filter(p => p.index !== -1);

    for (let i = 0; i < planetLongitudes.length; i++) {
      for (let j = i + 1; j < planetLongitudes.length; j++) {
        const p1 = planetLongitudes[i];
        const p2 = planetLongitudes[j];
        
        let diff = Math.abs(p1.longitude - p2.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const aspectAngle of aspectAngles) {
          const orb = window.orbType === 0 ? window.ao[window.aoIndex][aspectAngles.indexOf(aspectAngle)] : 8;
          if (Math.abs(diff - aspectAngle) <= orb) {
            const planet1Data = planetsArray.find(p => p.name === p1.name);
            const planet2Data = planetsArray.find(p => p.name === p2.name);
            
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

            const actualOrb = Math.abs(diff - aspectAngle);
            
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

  function drawAspectsOnCanvas(ctx, aspects, opacity = 1) {
    aspects.forEach(aspect => {
      const gradient = ctx.createLinearGradient(aspect.x1, aspect.y1, aspect.x2, aspect.y2);
      const alpha = Math.floor(170 * opacity).toString(16).padStart(2, '0');
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

  // Draw zodiac wheel with signs (counter-clockwise)
  function drawZodiacWheelOnCanvas(ctx, centerX, centerY, outerRadius, innerRadius, ascendant, isComparisonChart = false) {
    const getSignColour = (signIndex) => {
      const element = AstroConstants.ELEMENT_NAMES[signIndex % 4];
      return AstroConstants.ELEMENT_COLOURS[element];
    };

    const offset = 180 + ascendant + AstroConstants.ZODIAC_ROTATION_OFFSET;
    for (let i = 0; i < 12; i++) {
      const segmentLongitude = (i * 30) % 360;
      const startDeg = (-segmentLongitude + offset) % 360;
      const endDeg = (-(segmentLongitude + 30) + offset) % 360;
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

      const labelDeg = (offset - segmentLongitude - 15) % 360;
      const labelAngle = (labelDeg * Math.PI) / 180;
      
      const nameFontSize = isComparisonChart ? 10 : 12;
      const symbolFontSize = isComparisonChart ? 20 : 24;
      const nameOffset = isComparisonChart ? 10 : 15;
      const symbolOffset = isComparisonChart ? 12 : 24;
      
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
      ctx.fillText(AstroConstants.SIGN_NAMES[signIndex], 0, 0);
      ctx.restore();
      
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
      ctx.fillText(AstroConstants.SIGN_SYMBOLS[signIndex], 0, 0);
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

  // Draw house cusps at fixed clock positions
  function drawHouseCuspsOnCanvas(canvasCtx, centerX, centerY, radius, ascendant, options = {}) {
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

  // Draw midheaven indicator on the outer edge of the chart
  function drawMidheavenIndicator(canvasCtx, centerX, centerY, outerRadius, ascendant, midheaven, options = {}) {
    const {
      colour = '#ffd700',
      lineWidth = 2,
      labelFontSize = 11,
      labelOffset = 15,
      markerSize = 8
    } = options;

    // Calculate MC angle with 42 degree adjustment
    const mcAngle = longitudeToCanvasAngle(midheaven, ascendant) - (42 * Math.PI / 180);
    const mcX = centerX + Math.cos(mcAngle) * outerRadius;
    const mcY = centerY + Math.sin(mcAngle) * outerRadius;
    
    // Draw radial line through MC position
    const innerLineRadius = outerRadius - 30;
    const outerLineRadius = outerRadius + 15;
    const lineInnerX = centerX + Math.cos(mcAngle) * innerLineRadius;
    const lineInnerY = centerY + Math.sin(mcAngle) * innerLineRadius;
    const lineOuterX = centerX + Math.cos(mcAngle) * outerLineRadius;
    const lineOuterY = centerY + Math.sin(mcAngle) * outerLineRadius;
    
    canvasCtx.beginPath();
    canvasCtx.moveTo(lineInnerX, lineInnerY);
    canvasCtx.lineTo(lineOuterX, lineOuterY);
    canvasCtx.strokeStyle = colour;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    
    // Draw a small marker at the midheaven position
    canvasCtx.beginPath();
    canvasCtx.arc(mcX, mcY, markerSize, 0, Math.PI * 2);
    canvasCtx.fillStyle = colour;
    canvasCtx.fill();
    canvasCtx.strokeStyle = '#000';
    canvasCtx.lineWidth = 1;
    canvasCtx.stroke();
    
    // Draw MC label outside the wheel
    const labelX = centerX + Math.cos(mcAngle) * (outerRadius + labelOffset);
    const labelY = centerY + Math.sin(mcAngle) * (outerRadius + labelOffset);
    
    canvasCtx.fillStyle = colour;
    canvasCtx.font = `bold ${labelFontSize}px "Segoe UI"`;
    canvasCtx.textAlign = 'center';
    canvasCtx.textBaseline = 'middle';
    canvasCtx.fillText('MC', labelX, labelY);
  }

  return {
    longitudeToCanvasAngle,
    calculatePlanetPositionsWithCollisionDetection,
    getPlanetColourByLongitude,
    calculateAspects,
    drawAspectsOnCanvas,
    drawZodiacWheelOnCanvas,
    drawHouseCuspsOnCanvas,
    drawMidheavenIndicator
  };
})();

if (typeof window !== 'undefined') {
  window.ChartRenderer = ChartRenderer;
}
