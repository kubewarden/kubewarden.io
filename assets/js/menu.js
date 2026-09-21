const toggle = document.getElementById('main-menu-toggle');
const menu = document.getElementById('main-menu');
const close = document.getElementById('main-menu-close');
const backdrop = document.querySelector('header .backdrop');
const mobile = matchMedia('(max-width: 767px)');

if (toggle && menu && close && backdrop) {
  const header = toggle.closest('header');
  const setOpen = (open, returnFocus = false) => {
    open = open && mobile.matches;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close main menu' : 'Open main menu');
    header.dataset.menuOpen = String(open);
    backdrop.hidden = !open;
    if (open) close.focus();
    else if (returnFocus) toggle.focus();
  };

  header.dataset.menuReady = 'true';
  toggle.hidden = false;
  close.hidden = false;
  setOpen(false);
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  close.addEventListener('click', () => setOpen(false, true));
  backdrop.addEventListener('click', () => setOpen(false, true));
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches) {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a') && mobile.matches) setOpen(false, true);
  });
  // This is a navigation disclosure, not a modal: Tab can leave the menu.
  header.addEventListener('focusout', event => {
    if (!menu.contains(event.relatedTarget) && event.relatedTarget !== toggle) setOpen(false);
  });
  mobile.addEventListener('change', () => {
    const focused = document.activeElement;
    setOpen(false);
    if (mobile.matches && menu.contains(focused)) toggle.focus();
    else if (!mobile.matches && (focused === close || focused === toggle)) menu.querySelector('a').focus();
  });
}
