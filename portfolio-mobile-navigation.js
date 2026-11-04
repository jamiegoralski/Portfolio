(() => {
  const nav = document.querySelector('nav[aria-label="Main navigation"]');
  const links = nav && nav.querySelector('.nav-links');
  if (!links || nav.querySelector('.mobile-nav-toggle')) return;
  const mobile = window.matchMedia('(max-width: 700px)');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mobile-nav-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  links.id = links.id || 'portfolio-navigation-links';
  toggle.setAttribute('aria-controls', links.id);
  toggle.textContent = 'Menu';
  toggle.hidden = !mobile.matches;
  toggle.style.display = mobile.matches ? '' : 'none';
  nav.insertBefore(toggle, links);
  nav.classList.add('mobile-menu-ready');
  const close = () => {
    nav.removeAttribute('data-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    nav.setAttribute('data-menu-open', String(open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close menu' : 'Menu';
  });
  links.addEventListener('click', (event) => {
    if (event.target.closest('a') && mobile.matches) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      close();
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target)) close();
  });
  mobile.addEventListener('change', () => {
    close();
    toggle.hidden = !mobile.matches;
    toggle.style.display = mobile.matches ? '' : 'none';
  });
})();
