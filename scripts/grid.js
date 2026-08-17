/* ===========================================================================
   grid.js — cursor feed for the background grid glow
   Writes --mx/--my onto <body>; the mask in styles.css reads them.
   See SPECS.md §Grid background.
   =========================================================================== */

(function () {
  // Skipped entirely under prefers-reduced-motion — the mask stays off-screen
  // and the grid renders at its resting dim state.
  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var body = document.body;

  // clientX/Y, not pageX/Y — the grid layers are position:fixed, so viewport
  // coordinates are already the right space. No scroll offset to add.
  window.addEventListener('pointermove', function (e) {
    body.style.setProperty('--mx', e.clientX + 'px');
    body.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });
})();
