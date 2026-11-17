(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  if (motion.matches || !pointer.matches) return;
  let mouse = null, frame = 0, lastTime = 0;
  const layers = [];
  const active = () => !motion.matches && pointer.matches && !document.hidden;
  const schedule = () => {
    if (!frame && active() && layers.some(layer => layer.visible)) frame = requestAnimationFrame(draw);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const layer = layers.find(layer => layer.svg === entry.target);
      if (layer) layer.visible = entry.isIntersecting;
    }
    schedule();
  });
  function draw(time) {
    frame = 0;
    if (!active()) return;
    // Cap updates at 30fps, independent of the display's refresh rate.
    if (time - lastTime < 32) { schedule(); return; }
    const ease = 1 - Math.exp(-Math.min(time - lastTime, 64) / 110);
    lastTime = time;
    for (const {svg, dots, visible, index} of layers) {
      if (!visible) continue;
      const matrix = svg.getScreenCTM();
      if (!matrix) continue;
      const point = mouse && new DOMPoint(mouse.x, mouse.y).matrixTransform(matrix.inverse());
      const scale = Math.max(Math.abs(matrix.a), .1);
      const radius = 155 / scale;
      // One localized, slowly drifting shimmer per 13-second cycle.
      const phase = ((time / 1000 + index * 4) % 13) / 13;
      const pulse = phase < .46 ? Math.sin(Math.PI * phase / .46) ** 2 : 0;
      const sx = 320 + 440 * phase, sy = 260 + 90 * Math.sin(phase * Math.PI * 2 + index);
      for (const d of dots) {
        const dx = point ? d.x - point.x : 0, dy = point ? d.y - point.y : 0;
        const distance = Math.hypot(dx, dy);
        const influence = point ? Math.max(0, 1 - distance / radius) ** 2 : 0;
        const ripple = point && distance < radius ? Math.sin(Math.PI * distance / radius) * (1 - distance / radius) : 0;
        const shift = 9 / scale * ripple;
        const tx = d.x + dx / (distance || 1) * shift;
        const ty = d.y + dy / (distance || 1) * shift;
        const shimmer = pulse * Math.exp(-((d.x-sx)**2 + (d.y-sy)**2) / (2 * 85**2));
        const opacity = .19 + influence * .30 + shimmer * .13;
        if (Math.abs(tx-d.cx) + Math.abs(ty-d.cy) + Math.abs(opacity-d.o)*10 < .008) continue;
        d.cx += (tx-d.cx)*ease; d.cy += (ty-d.cy)*ease; d.o += (opacity-d.o)*ease;
        d.node.setAttribute('x', (d.cx-d.half).toFixed(3));
        d.node.setAttribute('y', (d.cy-d.half).toFixed(3));
        d.node.setAttribute('fill-opacity', d.o.toFixed(3));
      }
    }
    schedule();
  }
  fetch('images/halftone-wave-traced.svg?v=8').then(r => { if (!r.ok) throw Error('Pattern unavailable'); return r.text(); }).then(text => {
    document.querySelectorAll('.wave-pattern').forEach((layer, index) => {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      if (doc.querySelector('parsererror')) return;
      const svg = document.importNode(doc.documentElement, true);
      const ids = [...svg.querySelectorAll('[id]')].map(n => n.id);
      for (const node of svg.querySelectorAll('*')) {
        for (const attr of [...node.attributes]) {
          let value = attr.value;
          for (const id of ids) value = value.replaceAll(`url(#${id})`, `url(#dots-${index}-${id})`);
          node.setAttribute(attr.name, value);
        }
      }
      for (const n of svg.querySelectorAll('[id]')) n.id = `dots-${index}-${n.id}`;
      svg.setAttribute('aria-hidden','true');
      const dots = [...svg.querySelectorAll('rect.pattern-dot')].map(node => {
        const half = +node.getAttribute('width') / 2;
        const x = +node.getAttribute('x') + half, y = +node.getAttribute('y') + half;
        node.setAttribute('fill-opacity','.19');
        return {node,x,y,half,cx:x,cy:y,o:.19};
      });
      layer.append(svg); layer.classList.add('is-interactive'); layers.push({svg,dots,index,visible:false});
      observer.observe(svg);
    });
    syncMotion();
  }).catch(() => {}); // Static SVG background remains available if loading fails.
  window.addEventListener('pointermove', e => {
    mouse = !motion.matches && pointer.matches && e.pointerType === 'mouse' ? {x:e.clientX,y:e.clientY} : null;
    schedule();
  }, {passive:true});
  const reset = () => { mouse=null; schedule(); };
  const syncMotion = () => {
    mouse = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    for (const {svg,dots} of layers) {
      svg.parentElement.classList.toggle('is-interactive', !motion.matches && pointer.matches);
      for (const d of dots) {
        d.cx = d.x; d.cy = d.y; d.o = .19;
        d.node.setAttribute('x', (d.x-d.half).toFixed(3));
        d.node.setAttribute('y', (d.y-d.half).toFixed(3));
        d.node.setAttribute('fill-opacity','.19');
      }
    }
    schedule();
  };
  document.addEventListener('visibilitychange', syncMotion);
  document.documentElement.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('scroll', reset, {passive:true});
  motion.addEventListener('change', syncMotion);
  pointer.addEventListener('change', syncMotion);
})();
