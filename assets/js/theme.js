// Run before styles load so the first paint uses the reader's preference.
(() => {
  const key = 'kubewarden-theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  const readPreference = () => {
    try {
      const stored = localStorage.getItem(key);
      preference = stored === 'light' || stored === 'dark' ? stored : null;
    } catch (_) {
      // Keep an in-memory choice if storage is unavailable.
    }
  };
  readPreference();

  const apply = () => {
    const dark = preference ? preference === 'dark' : system.matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.hidden = false;
      const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
      button.setAttribute('aria-label', label);
      button.title = label;
      button.querySelector('use').setAttribute('href', dark ? '#icon-sun' : '#icon-moon');
    }
  };
  apply();
  system.addEventListener('change', apply);
  // A page restored from the back/forward cache can have an outdated preference.
  window.addEventListener('pageshow', () => {
    readPreference();
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    readPreference();
    apply();
  });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch (_) { /* Use the choice for this page. */ }
      apply();
    });
  });
})();
