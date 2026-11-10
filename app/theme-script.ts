// The light/dark switch, run in <head> before the page draws (see the layout). Added by KOOMPI Cloud; design_app replaces it.
// It follows the device until the person chooses; a button with data-theme-toggle switches and remembers.
// It never changes the buttons before React has started (that is a hydration warning): ThemeToggle shows
// the right icon with CSS (dark:).
export const themeScript = `(function () {
  var key = 'd-theme';
  var root = document.documentElement;
  var device = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var saved = null;
  try { saved = localStorage.getItem(key); } catch (e) {}
  function apply() {
    var dark = saved === 'dark' || (saved !== 'light' && !!device && device.matches);
    root.classList.toggle('dark', dark);
    root.classList.toggle('light', !dark);
    return dark;
  }
  apply();
  if (device && device.addEventListener) device.addEventListener('change', function () { if (saved !== 'light' && saved !== 'dark') apply(); });
  document.addEventListener('click', function (e) {
    var button = e.target && e.target.closest && e.target.closest('[data-theme-toggle]');
    if (!button) return;
    saved = root.classList.contains('dark') ? 'light' : 'dark';
    try { localStorage.setItem(key, saved); } catch (e2) {}
    var dark = apply();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', dark ? 'true' : 'false'); });
  });
})();
`;
