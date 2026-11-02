(() => {
  const root = document.documentElement;
  const key = 'jamie-portfolio-theme';
  let theme = 'light';
  try { if (localStorage.getItem(key) === 'dark') theme = 'dark'; } catch (_) {}
  root.dataset.theme = theme;
  function updateButton() {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    const dark = root.dataset.theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    button.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
    button.hidden = false;
  }
  document.addEventListener('DOMContentLoaded', () => {
    updateButton();
    document.querySelector('.theme-toggle')?.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, root.dataset.theme); } catch (_) {}
      updateButton();
    });
  });
  window.addEventListener('storage', event => {
    if (event.key === key) { root.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light'; updateButton(); }
  });
})();
