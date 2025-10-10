const ChartRenderer = (function() {
  'use strict';

  function calculatePlanetPositionsWithCollisionDetection(positions, ascendant, centerX, centerY, baseRadius, collisionThreshold = 25, stackOffset = 15) {
    const planetSymbols = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'];
    const planetsArray = [];
    
    Object.entries(positions).forEach(([name, longitude]) => {
      if (longitude === undefined || longitude === null || isNaN(longitude)) return;
      
      const angle = (((longitude - ascendant + 180) % 360) * Math.PI) / 180;
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
              const angle1 = (((p1.longitude - ascendant + 180) % 360) * Math.PI) / 180;
              x1 = centerX + Math.cos(angle1) * radius;
              y1 = centerY + Math.sin(angle1) * radius;
            }
            
            if (planet2Data) {
              x2 = planet2Data.x;
              y2 = planet2Data.y;
            } else {
              const angle2 = (((p2.longitude - ascendant + 180) % 360) * Math.PI) / 180;
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

  return {
    calculatePlanetPositionsWithCollisionDetection,
    getPlanetColourByLongitude,
    calculateAspects,
    drawAspectsOnCanvas
  };
})();

if (typeof window !== 'undefined') {
  window.ChartRenderer = ChartRenderer;
}
