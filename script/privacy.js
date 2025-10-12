(function(){
  const BASE_FONT_PX = 12; // baseline to measure natural size

  function contentWidth(el){
    const s = getComputedStyle(el);
    const pl = parseFloat(s.paddingLeft) || 0;
    const pr = parseFloat(s.paddingRight) || 0;
    return Math.max(0, el.clientWidth - pl - pr);
  }

  function fit(){
    const pre = document.getElementById('ascii-banner');
    const container = document.getElementById('ascii-banner-container');
    if(!pre || !container) return;

      // One-time normalization: remove common leading spaces so banner hugs the left edge
      if(!pre.dataset.normalized && !pre.hasAttribute('data-no-normalize')){
        const raw = pre.textContent.replace(/\r\n/g,'\n');
        const lines = raw.split('\n');
        // Compute minimal leading spaces across all non-empty lines
        let minLead = Infinity;
        for(const line of lines){
          const expanded = line.replace(/\t/g, '    ');
          const idx = expanded.search(/\S/);
          if(idx === -1) continue; // empty line
          if(idx < minLead) minLead = idx;
        }
        // Keep a tiny left margin (1 space) so it doesn't hug the border
        if(Number.isFinite(minLead) && minLead > 1){
          const base = minLead - 1;
          const trimmed = lines.map(l => l.length ? l.slice(Math.min(base, l.length)) : l).join('\n');
          pre.textContent = trimmed;
        }
        pre.dataset.normalized = 'true';
      }

    // Reset to baseline for correct intrinsic measurement
    pre.style.transform = 'none';
    pre.style.fontSize = BASE_FONT_PX + 'px';

    const natW = pre.scrollWidth;
    const natH = pre.scrollHeight;
    const maxW = Math.max(0, contentWidth(container));
    if(natW <= 0 || maxW <= 0) return;

    // Fit by changing the font-size so layout width == visual width
    const inset = 4; // px
    const scale = (maxW - inset) / natW;
  const targetFont = Math.max(2, Math.floor(BASE_FONT_PX * scale * 100) / 100);
    pre.style.fontSize = targetFont + 'px';
    pre.style.display = 'inline-block';
    // Let the container height be natural after font-size change
    container.style.height = 'auto';

    // Safety second pass: correct any rounding/font-load differences
    requestAnimationFrame(()=>{
      const curW = pre.scrollWidth;
      const allowed = Math.max(0, contentWidth(container)) - inset;
      if(curW > 0 && allowed > 0 && curW > allowed){
        const ratio = allowed / curW;
        const curSize = parseFloat(getComputedStyle(pre).fontSize) || targetFont;
        const newSize = Math.max(2, Math.floor(curSize * ratio * 100) / 100);
        pre.style.fontSize = newSize + 'px';
      }
    });
  }

  // Observe size changes for robust fitting
  const init = () => {
    const container = document.getElementById('ascii-banner-container');
    if(container && 'ResizeObserver' in window){
      const ro = new ResizeObserver(fit);
      ro.observe(container);
    }
    fit();
  };

  window.addEventListener('load', init);
  window.addEventListener('resize', fit);
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(()=>{
      // Refit once fonts are fully ready to account for metric changes
      fit();
    });
  }
})();
