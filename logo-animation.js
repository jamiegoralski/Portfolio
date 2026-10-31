(function () {
  const stage = document.querySelector('.motion-identity');
  if (!stage) return;
  const canvas = stage.querySelector('.identity-canvas');
  const logo = stage.querySelector('.identity-logo');
  const wordmark = stage.querySelector('.identity-wordmark-text');
  const button = stage.querySelector('.motion-control');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let state = 'finished';
  function finish() {
    state = 'finished';
    stage.classList.remove('motion-playing', 'motion-paused');
    button.textContent = 'Replay animation';
  }
  function start() {
    if (preference.matches) { finish(); button.hidden = true; return; }
    stage.classList.remove('motion-playing', 'motion-paused');
    // Flush only on replay so CSS can restart both layers together.
    void canvas.offsetWidth;
    stage.classList.add('motion-playing');
    state = 'playing';
    button.hidden = false;
    button.textContent = 'Pause animation';
  }
  button.addEventListener('click', function () {
    if (state === 'finished') { start(); return; }
    if (state === 'playing') {
      stage.classList.add('motion-paused');
      state = 'paused';
      button.textContent = 'Play animation';
    } else {
      stage.classList.remove('motion-paused');
      state = 'playing';
      button.textContent = 'Pause animation';
    }
  });
  wordmark.addEventListener('animationend', function (event) {
    if (event.animationName === 'jg-name-enter') finish();
  });
  preference.addEventListener('change', function () {
    if (preference.matches) { finish(); button.hidden = true; }
    else start();
  });
  // Animation is CSS-driven. Wait for the real font and source logo to avoid a font swap mid-sequence.
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const logoReady = logo.decode ? logo.decode().catch(function () {}) : Promise.resolve();
  Promise.all([fontsReady, logoReady]).then(start);
})();
