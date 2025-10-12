(function(){
  const BASE_FONT_PX = 12; // baseline to measure natural size

  function contentWidth(el){
    const s = getComputedStyle(el);
    const pl = parseFloat(s.paddingLeft) || 0;
    const pr = parseFloat(s.paddingRight) || 0;
    return el.clientWidth - pl - pr;
  }

  function fit(){
    const pre = document.getElementById('ascii-banner');
    const container = document.getElementById('ascii-banner-container');
    if(!pre || !container) return;

    // Reset to baseline for correct intrinsic measurement
    pre.style.transform = 'none';
    pre.style.fontSize = BASE_FONT_PX + 'px';

    const natW = pre.scrollWidth;
    const natH = pre.scrollHeight;
    const maxW = Math.max(0, contentWidth(container));
    if(natW <= 0 || maxW <= 0) return;

    const scale = maxW / natW;
    pre.style.transform = `scale(${scale})`;
    pre.style.display = 'inline-block';

    // Adjust container height to the scaled height
    const scaledH = Math.ceil(natH * scale);
    container.style.height = scaledH + 'px';
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
})();
