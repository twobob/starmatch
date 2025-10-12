/*
  Starfield — Beautiful performant mobile canvas
  Features:
  - Star grid (lattice) with gentle flowing motion
  - Multi-attractor physics (invisible orbital points that pull stars)
  - Smooth twinkling with varied brightness
  - Ephemeral constellation outlines (≤1s) appearing frequently
  - Touch/pointer interaction to stir the field
  - Deep space nebula gradients
  
  Optimized for 60fps on mobile:
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
  
  // Central state object
  const state = {
    w: 0, 
    h: 0, 
    time: 0,
    stars: [],
    constellationLinks: [],
    attractors: [],
    pointer: { x: 0, y: 0, active: false },
    maxLinkLifetime: 60, // frames (~1 second at 60fps)
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
    
    initializeStarfield();
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
  function initializeSpriteLibrary() {
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

  initializeSpriteLibrary();

  // Initialize stars with natural, random distribution
  function initializeStarfield() {
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
          twinkleSpeed: 0.8 + Math.random() * 0.25, // slower, more subtle
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
        pullStrength: 3 + Math.random() * 5, // much weaker
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
    
    // Pick random star as constellation center
    const centerIdx = Math.floor(Math.random() * stars.length);
    const center = stars[centerIdx];
    
    // Find nearby stars within radius
    const maxDistance = Math.min(state.w, state.h) * 0.2;
    const candidates = [];
    
    for (let i = 0; i < stars.length; i++) {
      if (i === centerIdx) continue;
      
      const dx = stars[i].x - center.x;
      const dy = stars[i].y - center.y;
      const distSquared = dx * dx + dy * dy;
      
      if (distSquared < maxDistance * maxDistance && distSquared > 900) {
        candidates.push({ index: i, distSquared });
      }
      
      // Sample only subset for performance
      if (candidates.length > 12) break;
    }
    
    // Sort by distance and pick closest
    candidates.sort((a, b) => a.distSquared - b.distSquared);
    
    // Create 2-5 links from center star
    const linkCount = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < Math.min(linkCount, candidates.length); i++) {
      state.constellationLinks.push({
        starA: centerIdx,
        starB: candidates[i].index,
        lifetime: 30 + Math.floor(Math.random() * 30),
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    
    // Limit total links to prevent memory issues
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

    // Spawn new constellation links periodically
    nextConstellationTime -= deltaTime;
    if (nextConstellationTime <= 0) {
      createConstellationLinks();
      nextConstellationTime = 200 + Math.random() * 300; // every 0.2-0.5 seconds
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

    // Draw constellation links first (behind stars)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    
    for (let i = 0; i < state.constellationLinks.length; i++) {
      const link = state.constellationLinks[i];
      const starA = state.stars[link.starA];
      const starB = state.stars[link.starB];
      
      if (!starA || !starB) continue;
      
      // Fade in and out smoothly
      const lifeFraction = link.lifetime / state.maxLinkLifetime;
      const fadeIn = Math.min(1, (1 - lifeFraction) * 3);
      const fadeOut = Math.min(1, lifeFraction * 3);
      const fade = Math.min(fadeIn, fadeOut);
      
      // Gentle pulsing
      const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(link.pulsePhase + state.time * 0.025));
      const alpha = 0.15 * fade * fade * pulse;
      
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
