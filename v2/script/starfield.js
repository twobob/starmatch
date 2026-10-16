/*
  Starfield — Beautiful performant mobile canvas
  Features:
  - Star grid (lattice) with gentle flowing motion
  - Multi-attractor physics (invisible orbital points that pull stars)
  - Smooth twinkling with varied brightness
  - Ephemeral constellation outlines (≤1s) appearing frequently
  - Touch/pointer interaction to stir the field
  - Deep space nebula gradients
  
  Optimised for 60fps on mobile:
  - Offscreen pre-rendered star sprites
  - Careful memory management
  - Batched drawing operations
  - DPR scaling for crisp rendering
*/

(() => {
  'use strict';
  
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d', { 
    alpha: false,
    desynchronized: true // hint for better performance
  });

  // Device pixel ratio capped at 2 to balance quality vs performance
  const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  
  // Cheap bloom: track bright star positions with smooth transitions
  const activeBloomCenters = [];
  const MAX_BLOOM_CENTERS = 12; // brutal limit for mobile
  const BLOOM_FADE_TIME = 240; // frames (~4 seconds) for smooth fade in/out
  
  // Central state object
  const state = {
    w: 0, 
    h: 0, 
    time: 0,
    stars: [],
    constellationLinks: [],
    attractors: [],
    pointer: { x: 0, y: 0, active: false },
    maxLinkLifetime: 240, // frames (~4 seconds at 60fps for slower fades)
  };

  // Resize canvas maintaining DPR
  function resizeCanvas() {
    const { innerWidth, innerHeight } = window;
    state.w = innerWidth;
    state.h = innerHeight;
    
    canvas.style.width = `${state.w}px`;
    canvas.style.height = `${state.h}px`;
    canvas.width = Math.floor(state.w * DPR);
    canvas.height = Math.floor(state.h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    
    initialiseStarfield();
  }

  // Cosmic star colors - galactic vibe with purples, blues, reds, yellows, greens
  const starColors = [
    { name: 'Deep Purple', color: [180, 120, 255], weight: 0.12 },
    { name: 'Magenta', color: [255, 100, 200], weight: 0.10 },
    { name: 'Electric Blue', color: [120, 180, 255], weight: 0.15 },
    { name: 'Cyan', color: [100, 220, 255], weight: 0.12 },
    { name: 'Golden', color: [255, 220, 100], weight: 0.15 },
    { name: 'Amber', color: [255, 180, 80], weight: 0.10 },
    { name: 'Emerald', color: [120, 255, 180], weight: 0.08 },
    { name: 'Lime', color: [180, 255, 120], weight: 0.06 },
    { name: 'Coral', color: [255, 140, 120], weight: 0.08 },
    { name: 'Rose', color: [255, 160, 200], weight: 0.04 },
  ];

  function getStarColor() {
    const rand = Math.random();
    let cumulative = 0;
    for (const star of starColors) {
      cumulative += star.weight;
      if (rand < cumulative) return star.color;
    }
    return starColors[2].color; // default to blue
  }

  // Pre-render star sprites at various sizes and colors for performance
  const starSprites = [];
  const spriteSizes = [0.4, 0.8, 1.2, 1.8, 2.5, 3.5, 5.0]; // variety of sizes from pinprick to huge
  
  function createStarSprite(size, color) {
    const canvas = document.createElement('canvas');
    const padding = 12;
    const canvasSize = (size + padding) * 2 * DPR;
    
    canvas.width = canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    ctx.translate(size + padding, size + padding);
    
    const [r, g, b] = color;
    
    // For pinprick stars (size <= 0.5), just a tiny dot with minimal glow
    if (size <= 0.5) {
      // Tiny bright pixel
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
      ctx.fillRect(-0.3, -0.3, 0.6, 0.6);
      
      // Minimal glow
      const tinyGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
      tinyGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
      tinyGlow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
      tinyGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      
      ctx.fillStyle = tinyGlow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      return { 
        canvas, 
        offset: size + padding,
        size: size
      };
    }
    
    // Bright white core
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillRect(-0.6, -0.6, 1.2, 1.2);
    
    // Colored glow with multiple layers
    const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.8);
    innerGlow.addColorStop(0, `rgba(255, 255, 255, 0.95)`);
    innerGlow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.85)`);
    innerGlow.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.4)`);
    innerGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer glow
    const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
    outerGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
    outerGlow.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.25)`);
    outerGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Diffraction spikes for larger stars
    if (size > 2) {
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
      ctx.lineWidth = 0.6;
      ctx.lineCap = 'round';
      
      const spikeLength = size * 2.5;
      
      // Four main spikes
      ctx.beginPath();
      ctx.moveTo(0, -spikeLength);
      ctx.lineTo(0, spikeLength);
      ctx.moveTo(-spikeLength, 0);
      ctx.lineTo(spikeLength, 0);
      ctx.stroke();
      
      // Diagonal spikes
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
      ctx.beginPath();
      const diagLen = spikeLength * 0.7;
      ctx.moveTo(-diagLen * 0.7, -diagLen * 0.7);
      ctx.lineTo(diagLen * 0.7, diagLen * 0.7);
      ctx.moveTo(-diagLen * 0.7, diagLen * 0.7);
      ctx.lineTo(diagLen * 0.7, -diagLen * 0.7);
      ctx.stroke();
    }
    
    return { 
      canvas, 
      offset: size + padding,
      size: size
    };
  }

  // Create sprite library for all size/color combinations
  function initialiseSpriteLibrary() {
    starSprites.length = 0;
    for (const size of spriteSizes) {
      for (const colorDef of starColors) {
        starSprites.push({
          sprite: createStarSprite(size, colorDef.color),
          color: colorDef.color,
          colorName: colorDef.name,
          size: size
        });
      }
    }
  }

  initialiseSpriteLibrary();

  // Initialise stars with natural, random distribution
  function initialiseStarfield() {
    state.stars = [];
    
    // Calculate target star count based on screen size
    const area = state.w * state.h;
    
    // Size distribution weights (inversely proportional to size)
    // size 0.4 (pinprick): weight 8, size 5.0 (huge): weight 1
    const sizeDistribution = [
      { sizeIndex: 0, size: 0.4, weight: 8 },   // pinprick - most common
      { sizeIndex: 1, size: 0.8, weight: 7 },   // tiny
      { sizeIndex: 2, size: 1.2, weight: 3 },   // small
      { sizeIndex: 3, size: 1.8, weight: 2 },   // medium
      { sizeIndex: 4, size: 2.5, weight: .5 },   // large
      { sizeIndex: 5, size: 3.5, weight: .1 },   // very large
      { sizeIndex: 6, size: 5.0, weight: .03 },   // huge - most rare
    ];
    
    const totalWeight = sizeDistribution.reduce((sum, s) => sum + s.weight, 0);
    
    // Create stars for each size category based on weights
    for (const sizeDef of sizeDistribution) {
      const starsOfThisSize = Math.floor((area / 800) * (sizeDef.weight / totalWeight));
      
      for (let i = 0; i < starsOfThisSize; i++) {
        // Pick a random sprite from this size category
        const spritesInSize = starSprites.filter(s => s.size === spriteSizes[sizeDef.sizeIndex]);
        const chosenSprite = spritesInSize[Math.floor(Math.random() * spritesInSize.length)];
        
        const spawnX = Math.random() * state.w;
        const spawnY = Math.random() * state.h;
        
        state.stars.push({
          x: spawnX,
          y: spawnY,
          homeX: spawnX,
          homeY: spawnY,
          maxDrift: 20 + Math.random() * 40,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          spriteData: chosenSprite,
          baseBrightness: 0.5 + Math.random() * 0.5,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.02 + Math.random() * 0.06, // much slower, gentle twinkling
          twinkleIntensity: 0.5 + Math.random() * 0.15, // how much brightness varies
          returnStrength: 0.5 + Math.random() * 1.5,
        });
      }
    }

    // Create fewer, weaker attractors for very subtle drift
    state.attractors = [];
    const attractorCount = 3 + Math.floor(Math.random() * 2); // 3-4 attractors
    
    for (let i = 0; i < attractorCount; i++) {
      const centerX = 0.2 * state.w + Math.random() * 0.6 * state.w;
      const centerY = 0.2 * state.h + Math.random() * 0.6 * state.h;
      
      state.attractors.push({
        centerX,
        centerY,
        phase: Math.random() * Math.PI * 2,
        orbitRadius: Math.min(state.w, state.h) * (0.2 + Math.random() * 0.4),
        angularSpeed: (Math.random() < 0.5 ? -1 : 1) * (0.00005 + Math.random() * 0.0001), // much slower
        pullStrength: 3 + Math.random() * 10, // weakish pull
        frequencyX: 0.6 + Math.random() * 0.8,
        frequencyY: 0.7 + Math.random() * 0.9,
        x: 0,
        y: 0,
      });
    }
  }

  // Pointer event handlers for interactive stirring
  canvas.addEventListener('pointerdown', (e) => {
    state.pointer.active = true;
    const rect = canvas.getBoundingClientRect();
    state.pointer.x = e.clientX - rect.left;
    state.pointer.y = e.clientY - rect.top;
    
    // Fade out hint on first interaction
    const hint = document.getElementById('hint');
    if (hint) hint.style.opacity = '0';
  }, { passive: true });

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.pointer.x = e.clientX - rect.left;
    state.pointer.y = e.clientY - rect.top;
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    state.pointer.active = false;
  }, { passive: true });

  // Spawn ephemeral constellation patterns
  function createConstellationLinks() {
    const stars = state.stars;
    if (stars.length < 3) return;
    
    // ONE constellation at a time, simple stick figure in a local area
    // Start with a larger star - they're the constellation anchors
    const weightedStars = stars.map((star, index) => ({
      index,
      star,
      weight: Math.pow(star.spriteData.size, 2.5) // strongly favour large stars as starting points
    }));
    
    const totalWeight = weightedStars.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    let centerIdx = 0;
    
    for (const ws of weightedStars) {
      rand -= ws.weight;
      if (rand <= 0) {
        centerIdx = ws.index;
        break;
      }
    }
    
    const center = stars[centerIdx];
    
    // Local area only - constellations are compact
    const maxDistance = Math.min(state.w, state.h) * 0.30; // slightly larger area
    const maxLineLength = maxDistance * 0.5; // shorter individual lines
    const candidates = [];
    
    for (let i = 0; i < stars.length; i++) {
      if (i === centerIdx) continue;
      
      const dx = stars[i].x - center.x;
      const dy = stars[i].y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < maxDistance && dist > 20) {
        // Slight preference for larger stars, but distance is primary factor
        const sizeWeight = stars[i].spriteData.size;
        candidates.push({ 
          index: i, 
          dist, 
          x: stars[i].x, 
          y: stars[i].y,
          size: stars[i].spriteData.size,
          weight: (sizeWeight * 2) / dist // balanced: closer stars preferred, size is tie-breaker
        });
      }
      
      if (candidates.length > 30) break;
    }
    
    if (candidates.length < 2) return;
    
    // Sort by weight (size/distance ratio) - prefer larger, closer stars
    candidates.sort((a, b) => b.weight - a.weight);
    
    // Build a more complex branching pattern: 6-15 stars, up to 20 connections
    const patternSize = 6 + Math.floor(Math.random() * 10);
    const usedStars = [centerIdx];
    const patternStars = [{ index: centerIdx, x: center.x, y: center.y }];
    const connections = [];
    
    // Build branching tree structure - each star can have 1-3 branches
    let attemptsLeft = patternSize * 3; // prevent infinite loops
    
    while (patternStars.length < patternSize && attemptsLeft > 0) {
      attemptsLeft--;
      
      // Pick a random existing star to branch from
      const branchFrom = patternStars[Math.floor(Math.random() * patternStars.length)];
      
      // Check how many connections this star already has
      const existingConnections = connections.filter(c => 
        c.starA === branchFrom.index || c.starB === branchFrom.index
      );
      
      // Limit to 2 connections per star to avoid hubs that create triangles
      if (existingConnections.length >= 2) continue;
      
      // Find closest unused star within line length
      let bestCandidate = null;
      let bestScore = -1;
      
      for (const candidate of candidates) {
        if (usedStars.includes(candidate.index)) continue;
        
        const dx = candidate.x - branchFrom.x;
        const dy = candidate.y - branchFrom.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Only consider if line isn't too long
        if (dist < maxLineLength && dist > 20) {
          // Check angle constraint - avoid creating triangles
          let angleOK = true;
          
          // For each existing connection from branchFrom, check the angle
          for (const conn of existingConnections) {
            const otherStarIdx = conn.starA === branchFrom.index ? conn.starB : conn.starA;
            const otherStar = patternStars.find(s => s.index === otherStarIdx);
            
            if (otherStar) {
              // Calculate vectors
              const v1x = otherStar.x - branchFrom.x;
              const v1y = otherStar.y - branchFrom.y;
              const v2x = candidate.x - branchFrom.x;
              const v2y = candidate.y - branchFrom.y;
              
              // Calculate angle using dot product
              const dot = v1x * v2x + v1y * v2y;
              const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
              const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
              const cosAngle = dot / (mag1 * mag2);
              
              // Reject if angle is too small (< 60 degrees) - would create acute triangle
              // cos(60°) = 0.5, so reject if cosAngle > 0.5
              if (cosAngle > 0.5) {
                angleOK = false;
                break;
              }
            }
          }
          
          if (!angleOK) continue;
          
          // Also check that adding this star won't complete a triangle with any two existing stars
          let createsTriangle = false;
          for (let i = 0; i < patternStars.length - 1; i++) {
            for (let j = i + 1; j < patternStars.length; j++) {
              const star1 = patternStars[i];
              const star2 = patternStars[j];
              
              // Check if star1 and star2 are already connected
              const alreadyConnected = connections.some(c =>
                (c.starA === star1.index && c.starB === star2.index) ||
                (c.starB === star1.index && c.starA === star2.index)
              );
              
              if (alreadyConnected) {
                // Check if candidate is close to both
                const dist1 = Math.sqrt(
                  (candidate.x - star1.x) ** 2 + (candidate.y - star1.y) ** 2
                );
                const dist2 = Math.sqrt(
                  (candidate.x - star2.x) ** 2 + (candidate.y - star2.y) ** 2
                );
                
                // Would create a triangle if close to both
                if (dist1 < maxLineLength * 0.8 && dist2 < maxLineLength * 0.8) {
                  createsTriangle = true;
                  break;
                }
              }
            }
            if (createsTriangle) break;
          }
          
          if (createsTriangle) continue;
          
          // Score based on distance primarily, with slight bonus for larger stars
          const sizeBonus = candidate.size * 0.5; // small bonus for size
          const score = candidate.weight * (1 - dist / maxLineLength) + sizeBonus;
          
          if (score > bestScore) {
            bestScore = score;
            bestCandidate = { ...candidate, dist };
          }
        }
      }
      
      if (bestCandidate) {
        connections.push({
          starA: branchFrom.index,
          starB: bestCandidate.index,
          lifetime: 140 + Math.floor(Math.random() * 120), // 2.3-4.3 seconds - double the fade time
          pulsePhase: Math.random() * Math.PI * 2,
        });
        
        usedStars.push(bestCandidate.index);
        patternStars.push(bestCandidate);
      }
    }
    
    // Skip the extra connections section - they create triangles
    // Just use the tree structure which naturally avoids triangles
    
    // Add all connections to the state
    state.constellationLinks.push(...connections);
    
    // Keep it clean - remove old links
    if (state.constellationLinks.length > 150) {
      state.constellationLinks.splice(0, state.constellationLinks.length - 150);
    }
  }

  let nextConstellationTime = 0;

  // Physics simulation step
  function updatePhysics(deltaTime) {
    const stars = state.stars;
    const attractors = state.attractors;

    // Update attractor positions (complex Lissajous curves)
    for (let i = 0; i < attractors.length; i++) {
      const att = attractors[i];
      att.phase += att.angularSpeed * deltaTime;
      
      // Varied frequency ratios create diverse orbital patterns
      att.x = att.centerX + Math.cos(att.phase * att.frequencyX) * att.orbitRadius;
      att.y = att.centerY + Math.sin(att.phase * att.frequencyY) * att.orbitRadius;
    }

    // Update each star
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      let forceX = 0;
      let forceY = 0;

      // Calculate distance from home position
      const dxHome = star.homeX - star.x;
      const dyHome = star.homeY - star.y;
      const distFromHome = Math.sqrt(dxHome * dxHome + dyHome * dyHome);
      
      // Strong restoring force if beyond allowed drift
      if (distFromHome > star.maxDrift) {
        const overshoot = distFromHome - star.maxDrift;
        const restoreForce = overshoot * star.returnStrength * 0.5;
        const invDist = 1 / (distFromHome + 1);
        forceX += dxHome * invDist * restoreForce;
        forceY += dyHome * invDist * restoreForce;
      } else {
        // Gentle pull back toward home even within allowed range
        const pullBack = star.returnStrength * 0.05;
        forceX += dxHome * pullBack;
        forceY += dyHome * pullBack;
      }

      // Very subtle gravitational attraction - barely noticeable drift
      for (let j = 0; j < attractors.length; j++) {
        const att = attractors[j];
        const dx = att.x - star.x;
        const dy = att.y - star.y;
        const distSquared = dx * dx + dy * dy + 10000; // very soft
        const invDist = 1 / Math.sqrt(distSquared);
        const forceMag = att.pullStrength * invDist * invDist * 0.03; // much weaker
        
        forceX += dx * forceMag;
        forceY += dy * forceMag;
      }
      
      // Extremely subtle turbulence
      const turbulence = Math.sin(state.time * 0.0003 + i * 0.1) * 0.01;
      forceX += turbulence;
      forceY += Math.cos(state.time * 0.0004 + i * 0.15) * 0.01;

      // Interactive pointer force - gentle push
      if (state.pointer.active) {
        const dx = state.pointer.x - star.x;
        const dy = state.pointer.y - star.y;
        const distSquared = dx * dx + dy * dy + 200;
        const invDist = 1 / Math.sqrt(distSquared);
        const forceMag = 20 * invDist * invDist; // gentler interaction
        
        forceX += dx * forceMag;
        forceY += dy * forceMag;
      }

      // Velocity integration with high damping for slow, gentle motion
      const damping = 0.97; // stronger damping to prevent runaway
      star.vx = (star.vx + forceX * deltaTime * 0.008) * damping;
      star.vy = (star.vy + forceY * deltaTime * 0.008) * damping;
      
      // Position integration - very slow
      star.x += star.vx * deltaTime * 0.008;
      star.y += star.vy * deltaTime * 0.008;

      // Soft boundary wrapping - only if WAY off screen
      if (star.x < -100) star.x = state.w + 100;
      else if (star.x > state.w + 100) star.x = -100;
      
      if (star.y < -100) star.y = state.h + 100;
      else if (star.y > state.h + 100) star.y = -100;

      // Update twinkle animation - gentle, slow oscillation
      star.twinklePhase += star.twinkleSpeed * deltaTime * 0.002;
    }

    // Spawn new constellation links - one simple pattern at a time
    nextConstellationTime -= deltaTime;
    if (nextConstellationTime <= 0) {
      createConstellationLinks();
      // 44% less frequent - every 0.7-1.8 seconds (was 0.4-1.0)
      nextConstellationTime = 700 + Math.random() * 1100;
    }

    // Update and expire constellation links
    for (let i = state.constellationLinks.length - 1; i >= 0; i--) {
      const link = state.constellationLinks[i];
      link.lifetime--;
      
      if (link.lifetime <= 0) {
        state.constellationLinks.splice(i, 1);
      }
    }
  }

  // Render the starfield
  function render() {
    // Deep space background
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, state.w, state.h);

    // Layered nebula gradients for depth
    const nebula1 = ctx.createRadialGradient(
      state.w * 0.75, state.h * 0.25, 20,
      state.w * 0.75, state.h * 0.25, Math.max(state.w, state.h) * 0.8
    );
    nebula1.addColorStop(0, 'rgba(80, 130, 255, 0.06)');
    nebula1.addColorStop(0.5, 'rgba(60, 100, 200, 0.02)');
    nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = nebula1;
    ctx.fillRect(0, 0, state.w, state.h);

    const nebula2 = ctx.createRadialGradient(
      state.w * 0.2, state.h * 0.7, 20,
      state.w * 0.2, state.h * 0.7, Math.max(state.w, state.h) * 0.6
    );
    nebula2.addColorStop(0, 'rgba(100, 80, 180, 0.04)');
    nebula2.addColorStop(0.6, 'rgba(70, 50, 120, 0.015)');
    nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, state.w, state.h);

    // Reset bloom centers for this frame
    const currentBloomCandidates = [];

    // Draw constellation links first (behind stars)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    
    for (let i = 0; i < state.constellationLinks.length; i++) {
      const link = state.constellationLinks[i];
      const starA = state.stars[link.starA];
      const starB = state.stars[link.starB];
      
      if (!starA || !starB) continue;
      
      // Smooth fade in and out over the full lifetime
      const lifeFraction = link.lifetime / state.maxLinkLifetime;
      
      // Slow fade in: takes 30% of lifetime to reach full opacity
      const fadeIn = lifeFraction > 0.7 ? Math.min(1, (1 - lifeFraction) / 0.3) : 1;
      
      // Slow fade out: takes 40% of lifetime to fade to zero
      const fadeOut = lifeFraction < 0.4 ? Math.min(1, lifeFraction / 0.4) : 1;
      
      // Combine fades with smooth easing
      const fade = Math.min(fadeIn, fadeOut);
      const smoothFade = fade * fade * (3 - 2 * fade); // smoothstep easing
      
      // Very gentle, slow pulsing - barely noticeable
      const pulse = 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(link.pulsePhase + state.time * 0.008));
      const alpha = 0.18 * smoothFade * pulse;
      
      ctx.strokeStyle = `rgba(170, 220, 255, ${alpha})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(starA.x, starA.y);
      ctx.lineTo(starB.x, starB.y);
      ctx.stroke();
    }
    
    ctx.restore();

    // Draw stars using pre-rendered sprites for performance
    for (let i = 0; i < state.stars.length; i++) {
      const star = state.stars[i];
      
      // Natural twinkling - varied intensity per star
      // Oscillate brightness using sine wave
      const twinkleValue = Math.sin(star.twinklePhase); // -1 to 1
      const twinkleModulation = 1.0 + (twinkleValue * star.twinkleIntensity); // varies by intensity
      const brightness = star.baseBrightness * twinkleModulation;
      const alpha = Math.max(0.3, Math.min(1.0, brightness)); // clamp between 0.3 and 1.0
      
      // Track bright large stars for bloom effect
      if (star.spriteData.size > 2.0 && brightness > 0.7 && currentBloomCandidates.length < MAX_BLOOM_CENTERS * 2) {
        currentBloomCandidates.push({
          x: star.x,
          y: star.y,
          color: star.spriteData.color,
          size: star.spriteData.size,
          intensity: brightness * (star.spriteData.size / 5.0),
          starIndex: i
        });
      }
      
      // Draw pre-rendered sprite
      const sprite = star.spriteData.sprite;
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        sprite.canvas,
        star.x - sprite.offset,
        star.y - sprite.offset
      );
    }
    
    ctx.globalAlpha = 1;
    
    // Update active bloom centers with smooth fading
    // Fade out old blooms
    for (let i = activeBloomCenters.length - 1; i >= 0; i--) {
      const bloom = activeBloomCenters[i];
      
      // Check if this star is still a candidate
      const stillActive = currentBloomCandidates.some(c => c.starIndex === bloom.starIndex);
      
      if (stillActive) {
        // Fade in or maintain
        bloom.fadeProgress = Math.min(BLOOM_FADE_TIME, bloom.fadeProgress + 2);
      } else {
        // Fade out
        bloom.fadeProgress = Math.max(0, bloom.fadeProgress - 1);
        if (bloom.fadeProgress <= 0) {
          activeBloomCenters.splice(i, 1);
        }
      }
    }
    
    // Add new blooms from candidates
    for (const candidate of currentBloomCandidates) {
      const exists = activeBloomCenters.find(b => b.starIndex === candidate.starIndex);
      
      if (!exists && activeBloomCenters.length < MAX_BLOOM_CENTERS) {
        activeBloomCenters.push({
          ...candidate,
          fadeProgress: 0,
          bloomSize: Math.random() < 0.3 ? 'large' : 'normal' // 30% chance of large bloom
        });
      } else if (exists) {
        // Update position
        exists.x = candidate.x;
        exists.y = candidate.y;
        exists.intensity = candidate.intensity;
      }
    }
    
    // Cheap bloom: draw soft glows around bright star clusters (mobile-optimised)
    if (activeBloomCenters.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      for (const bloom of activeBloomCenters) {
        const [r, g, b] = bloom.color;
        
        // Varied bloom sizes - some large, some normal, subtle
        const baseSize = Math.min(state.w, state.h) * (bloom.bloomSize === 'large' ? 0.18 : 0.10);
        const bloomSize = baseSize * (1 + bloom.intensity * 0.3);
        
        // Smooth fade based on fadeProgress
        const fadeFactor = Math.min(1, bloom.fadeProgress / BLOOM_FADE_TIME);
        const smoothFade = fadeFactor * fadeFactor * (3 - 2 * fadeFactor); // smoothstep
        
        // Single gradient per bloom - no nested loops
        const bloomGrad = ctx.createRadialGradient(
          bloom.x, bloom.y, 0,
          bloom.x, bloom.y, bloomSize
        );
        const bloomAlpha = bloom.intensity * 0.08 * smoothFade; // subtle
        bloomGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${bloomAlpha})`);
        bloomGrad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${bloomAlpha * 0.5})`);
        bloomGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = bloomGrad;
        ctx.fillRect(
          bloom.x - bloomSize,
          bloom.y - bloomSize,
          bloomSize * 2,
          bloomSize * 2
        );
      }
      
      ctx.restore();
    }
  }

  // Main animation loop
  let lastFrameTime = performance.now();
  
  function animationLoop(currentTime) {
    const deltaTime = Math.min(50, currentTime - lastFrameTime);
    lastFrameTime = currentTime;
    
    state.time += deltaTime;
    updatePhysics(deltaTime);
    render();
    
    requestAnimationFrame(animationLoop);
  }

  // Initialize
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  requestAnimationFrame(animationLoop);
})();
