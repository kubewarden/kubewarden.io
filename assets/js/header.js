const siteHeader = document.querySelector('.site-header');

if (siteHeader) {
  const updateHeaderHeight = () => {
    document.documentElement.style.setProperty('--header-height', `${siteHeader.getBoundingClientRect().height}px`);
  };
  updateHeaderHeight();
  new ResizeObserver(updateHeaderHeight).observe(siteHeader);

  // Keep keyboard focus visible even when the browser scrolls only minimally.
  document.addEventListener('focusin', event => {
    if (getComputedStyle(siteHeader).position !== 'sticky' ||
        siteHeader.contains(event.target) || event.target.matches('.skip-link')) return;
    const bounds = event.target.getBoundingClientRect();
    const bottom = siteHeader.getBoundingClientRect().bottom;
    if (bounds.height && bounds.top < bottom && window.scrollY > 0) {
      window.scrollBy(0, bounds.top - bottom - 12);
    }
  });
}
