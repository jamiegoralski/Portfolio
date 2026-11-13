(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  if (motion.matches || !pointer.matches) return;
  let mouse = null, frame = 0;
  const layers = [];
  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
  function draw() {
    frame = 0;
    let changing = false;
    for (const {svg, dots} of layers) {
      const matrix = svg.getScreenCTM();
      if (!matrix) continue;
      const point = mouse && new DOMPoint(mouse.x, mouse.y).matrixTransform(matrix.inverse());
      const radius = 165 / Math.max(Math.abs(matrix.a), .1);
      for (const d of dots) {
        const dx = point ? point.x - d.x : 0, dy = point ? point.y - d.y : 0;
        const influence = point ? Math.max(0, 1 - Math.hypot(dx, dy) / radius) ** 2 : 0;
        const tx = d.x + dx * influence * .48, ty = d.y + dy * influence * .48;
        const opacity = .19 + influence * .81;
        if (Math.abs(tx-d.cx) + Math.abs(ty-d.cy) + Math.abs(opacity-d.o)*10 < .015) continue;
        d.cx += (tx-d.cx)*.16; d.cy += (ty-d.cy)*.16; d.o += (opacity-d.o)*.16;
        d.node.setAttribute('cx', d.cx.toFixed(3));
        d.node.setAttribute('cy', d.cy.toFixed(3));
        d.node.setAttribute('fill-opacity', d.o.toFixed(3));
        changing = true;
      }
    }
    if (changing) schedule();
  }
  fetch('images/halftone-wave-traced.svg?v=4').then(r => { if (!r.ok) throw Error('Pattern unavailable'); return r.text(); }).then(text => {
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
      const dots = [...svg.querySelectorAll('circle')].map(node => {
        const x = +node.getAttribute('cx'), y = +node.getAttribute('cy');
        node.setAttribute('fill-opacity','.19');
        return {node,x,y,cx:x,cy:y,o:.19};
      });
      layer.append(svg); layer.classList.add('is-interactive'); layers.push({svg,dots});
    });
  }).catch(() => {}); // Static SVG background remains available if loading fails.
  window.addEventListener('pointermove', e => {
    mouse = !motion.matches && pointer.matches && e.pointerType === 'mouse' ? {x:e.clientX,y:e.clientY} : null;
    schedule();
  }, {passive:true});
  const reset = () => { mouse=null; schedule(); };
  document.documentElement.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('scroll', reset, {passive:true});
  motion.addEventListener('change', reset);
  pointer.addEventListener('change', reset);
})();
