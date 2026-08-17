/* ===========================================================================
   cards.js — first-paint gate + WriteLite card magnet
   See SPECS.md §WriteLite card for the motion design and the magnet maths.
   =========================================================================== */

(function () {
  // Enable colour transitions only after the first paint.
  requestAnimationFrame(function () { document.body.classList.add('ready'); });
})();

(function () {
  // Edge-based magnet pull + 3D cursor tilt, armed once each card's glide lands.
  // Skipped entirely under prefers-reduced-motion.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = [].slice.call(document.querySelectorAll('[data-magnet]'));
  if (!cards.length || reduce) return;

  // Mark a card "landed" when its glide finishes — the magnet stays off until then.
  cards.forEach(function (card) {
    card.addEventListener('animationend', function () {
      card.classList.add('is-landed');
    }, { once: true });
  });

  window.addEventListener('pointermove', function (e) {
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (!card.classList.contains('is-landed')) continue;   // still flying in
      var inner = card.querySelector('.writelite-card__inner');
      var r = card.getBoundingClientRect();
      var cs = getComputedStyle(card);
      var range = parseFloat(cs.getPropertyValue('--range')) || 24;
      var pull  = parseFloat(cs.getPropertyValue('--pull'))  || 5;

      var inside = e.clientX >= r.left && e.clientX <= r.right &&
                   e.clientY >= r.top  && e.clientY <= r.bottom;

      // Pull and tilt both drive the INNER element — the outer card owns the
      // idle bob. Inside → tilt; outside → pull; they never coexist.

      // tilt toward the cursor while hovering
      if (inside) {
        var px = (e.clientX - r.left) / r.width  - 0.5;
        var py = (e.clientY - r.top)  / r.height - 0.5;
        inner.style.transform = 'rotateY(' + (px * 10) + 'deg) rotateX(' + (-py * 10) + 'deg) translateY(-6px)';
        continue;
      }
      inner.style.transform = '';

      // distance from the nearest EDGE → smooth ramp
      var edgeX = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      var edgeY = Math.max(r.top  - e.clientY, 0, e.clientY - r.bottom);
      var edge  = Math.hypot(edgeX, edgeY);

      if (edge >= range) continue;   // beyond reach — inner already reset above

      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = e.clientX - cx, dy = e.clientY - cy;
      var dist = Math.hypot(dx, dy) || 1;
      // bell curve: 0 at edge, peak mid-range, 0 by `range`
      var f = Math.sin(Math.PI * (edge / range)) * pull;
      inner.style.transform = 'translate(' + ((dx / dist) * f) + 'px,' + ((dy / dist) * f) + 'px)';
    }
  }, { passive: true });
})();
