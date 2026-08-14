/* ===========================================================================
   deck.js — the interactive client package decks
     • click the toggle button      → fan the deck open / collapse it shut
     • click the face card          → fan the deck open
     • click a layer (deck open)    → lift it out + open its inscription
     • click the open readout/layer → close it back into the deck

   Runs once per [data-deck] on the page — the .package column wrapping one
   deck. Each deck keeps its own layers and its own open/selected state on its
   [data-deck-stack]'s dataset.

   Content — face card and layer cards — comes from packages.js, looked up by
   the deck's data-package value. No copy lives in this file.

   All layout transforms are computed here; the stylesheet owns only the resting
   look. See SPECS.md §Client packages for the fan maths and state model.
   =========================================================================== */

(function () {
  // Build a masked glyph element for one icon file. --icon feeds the
  // mask-image in the stylesheet; colour + glow come from the CSS.
  function makeGlyph(file) {
    var g = document.createElement('span');
    g.className = 'package-deck__glyph';
    g.style.setProperty('--icon', 'url("icons/' + file + '.svg")');
    return g;
  }

  // Fan geometry per card, keyed by the deck's card count. `m` is how far along
  // the fan axis the layer sits; `k` is the scale that cancels the perspective
  // foreshortening at that depth. Together they give every card the same size
  // and every gap the same height. Precomputed — SPECS.md §Fan maths has the
  // derivation and the recipe for a new row.
  // WARNING: a deck whose card count has no row here still renders, but with
  // the uneven sizes and spacing this table exists to remove. Add a card, add
  // a row.
  var FAN = {
    3: [{ m:  -88.0, k: 0.9560 }, { m:    0.0, k: 1.0000 }, { m:   96.4, k: 1.0482 }],
    4: [{ m: -129.1, k: 0.9355 }, { m:  -45.0, k: 0.9775 },
        { m:   47.1, k: 1.0235 }, { m:  148.2, k: 1.0741 }],
    7: [{ m: -242.5, k: 0.8788 }, { m: -168.5, k: 0.9158 }, { m:  -88.0, k: 0.9560 },
        { m:    0.0, k: 1.0000 },
        { m:   96.4, k: 1.0482 }, { m:  202.6, k: 1.1013 }, { m:  320.2, k: 1.1600 }]
  };

  // ---- One deck per [data-deck] ----------------------------------------
  // `root` is the .package column. `container` is the deck itself and stays the
  // state holder — data-state / data-sel live there, as do the scene, the face
  // card, the detail slab and the toggle.
  function initDeck(root) {
    var container = root.querySelector('[data-deck-stack]');
    if (!container) return;

    // This deck's content, keyed by data-package. No entry → build nothing and
    // say so: bailing before any listener is bound leaves the deck inert rather
    // than half-wired, so a mistyped key is obvious instead of silently showing
    // another package's cards.
    var key  = root.dataset.package;
    var data = (window.PACKAGE_DECKS || {})[key];
    if (!data || !data.cards || !data.cards.length) {
      console.warn('deck.js: no card data for data-package="' + key + '"');
      return;
    }
    var cards = data.cards;
    var face  = data.face || {};
    var N = cards.length;                        // layer count, per deck

    // This deck's row of the fan table. A count with no row still renders —
    // evenly offset, uncorrected, exactly as the deck looked before the table
    // existed — so a new card is visibly wrong rather than invisibly missing.
    if (!FAN[N]) {
      console.warn('deck.js: no fan geometry for a ' + N + '-card deck ("' + key +
                   '") — its cards will be uneven. Add a row to FAN; see SPECS.md §Fan maths.');
    }
    var fan = FAN[N] || cards.map(function (_, i) {
      return { m: (i - (N - 1) / 2) * 92, k: 1 };
    });

    var scene  = container.querySelector('[data-scene]');
    var cover  = container.querySelector('[data-cover]');
    var detail = container.querySelector('[data-detail]');
    var toggleBtn = root.querySelector('[data-deck-toggle]');
    var titleEl   = root.querySelector('[data-package-title]');     // names the toggle
    var dName  = detail.querySelector('[data-d-name]');
    var dIcon  = detail.querySelector('[data-d-icon]');
    var dHead  = detail.querySelector('[data-d-head]');
    var dBody  = detail.querySelector('[data-d-body]');

    // ---- Face card -------------------------------------------------------
    // Filled before anything else, because syncToggle reads the title back out
    // of the DOM to name the button.
    var coverIcon = container.querySelector('[data-cover-icon]');
    var coverSub  = container.querySelector('[data-cover-sub]');
    if (coverIcon && face.icon) {
      coverIcon.style.setProperty('--icon', 'url("icons/' + face.icon + '.svg")');
    }
    if (titleEl && face.title) titleEl.textContent = face.title;
    if (coverSub && face.sub)  coverSub.textContent = face.sub;
    // Only when the package asks for it — otherwise the stylesheet's site blue
    // stands, which is what all three faces use today.
    if (cover && face.col) cover.style.setProperty('--lc', face.col);
    if (face.title) container.setAttribute('aria-label', face.title + ' package');

    // ---- Build the layer DOM into the scene ------------------------------
    var layerEls = cards.map(function (L, i) {
      var layer = document.createElement('div');
      layer.className = 'package-deck__layer';
      layer.dataset.idx = String(i);
      layer.style.setProperty('--lc', L.col);

      var face = document.createElement('div');
      face.className = 'package-deck__face';
      face.appendChild(makeGlyph(L.file));

      var rim = document.createElement('div');
      rim.className = 'package-deck__rim';

      var tag = document.createElement('div');
      tag.className = 'package-deck__tag';
      tag.textContent = L.name;

      layer.appendChild(face);
      layer.appendChild(rim);
      layer.appendChild(tag);
      scene.appendChild(layer);
      return layer;
    });

    // ---- Layout ----------------------------------------------------------
    // openness: 1 = fully fanned, 0 = stacked monolith. sel: index of the
    // popped-out layer, or -1.
    function applyLayout(openness, sel) {
      scene.style.transform = openness > 0.0005
        ? 'rotateX(' + (-58 * openness) + 'deg) rotateZ(' + (-45 * openness) + 'deg)'
        : 'none';

      for (var i = 0; i < layerEls.length; i++) {
        var L = layerEls[i];
        if (i === sel && openness > 0.0005) {
          // popped card lifts toward the viewer, counter-rotating to face it
          L.style.transform =
            'rotateZ(' + (45 * openness) + 'deg) rotateX(' + (58 * openness) + 'deg) ' +
            'translate3d(0px,0px,' + (320 * openness) + 'px) scale(' + (1 + 0.05 * openness) + ')';
          L.style.opacity = '1';
          L.style.zIndex = '60';
        } else {
          var g = fan[i];
          var m = g.m * openness;
          var k = 1 + (g.k - 1) * openness;   // → 1 when collapsed; cards stack at z = 0
          L.style.transform =
            'translate3d(' + (-m) + 'px,' + m + 'px,0px) scale(' + k + ')';
          var deckOp = (sel >= 0 && sel !== i) ? 0.4 : 1;   // dim siblings while one is out
          L.style.opacity = String(deckOp * openness);      // all deck cards vanish when collapsed
          L.style.zIndex = String(i);
        }
      }

      // The cover is the collapsed monolith: opaque when closed, gone when fanned.
      if (cover) cover.style.opacity = String(1 - openness);
    }

    // Square the slab: find the width at which it is as wide as its copy makes
    // it tall. Bisection, because height(width) only ever decreases as width
    // grows — that makes (width - height) monotonically increasing, so halving
    // converges, where feeding the measured height straight back in would
    // oscillate between two values. The cap comes from the stylesheet's
    // max-width so the number lives in one place.
    // offsetHeight is the right measure: it ignores the slab's scale transform,
    // and reading it forces the reflow each step depends on.
    var SLAB_MIN = 200;                             // never narrower than it was
    function sizeDetail() {
      var max = parseFloat(getComputedStyle(detail).maxWidth) || 440;
      var lo = SLAB_MIN, hi = max;
      detail.style.width = hi + 'px';
      if (detail.offsetHeight >= hi) return;        // still taller than square at the cap
      for (var i = 0; i < 8; i++) {
        var mid = (lo + hi) / 2;
        detail.style.width = mid + 'px';
        if (detail.offsetHeight > mid) lo = mid; else hi = mid;
      }
      detail.style.width = hi + 'px';               // hi is always the wide-enough side
    }

    function updateDetail(openness, sel) {
      var show = (container.dataset.state === 'deck') && sel >= 0 && sel < cards.length;
      if (show) {
        var L = cards[sel];
        dName.textContent = '// ' + L.name.toUpperCase();
        dIcon.innerHTML = '';
        dIcon.appendChild(makeGlyph(L.file));
        dHead.textContent = L.head;
        dBody.textContent = L.body;
        detail.style.setProperty('--rc', L.col);
        sizeDetail();                 // after the copy is in, before it fades up
      }
      detail.style.opacity = show ? String(openness) : '0';
      detail.style.transform = 'translate(-50%,-50%) scale(' + (show ? (0.9 + 0.1 * openness) : 0.9) + ')';
      detail.style.pointerEvents = (show && openness > 0.5) ? 'auto' : 'none';
    }

    // Snap the deck to its committed state (deck/init). Transitions are on by
    // this point, so these changes animate.
    function applyState() {
      var deck = container.dataset.state === 'deck';
      var sel = deck ? +container.dataset.sel : -1;
      applyLayout(deck ? 1 : 0, sel);
      updateDetail(deck ? 1 : 0, sel);
    }

    // ---- Container click interaction -------------------------------------
    container.addEventListener('click', function (e) {
      var state = container.dataset.state || 'init';

      // Collapsed: only the face card opens the deck. CSS gives it pointer-events
      // in this state alone, so its click lands on it and bubbles here while the
      // rest of the transparent stage box stays inert. closest() is what catches
      // clicks on the card's icon/title/subtitle rather than the card itself.
      // Opening only — nothing but the toggle button collapses.
      if (state !== 'deck') {
        if (!(e.target instanceof Element) || !e.target.closest('[data-cover]')) return;
        container.dataset.state = 'deck';
        syncToggle(true);                           // aria → "Collapse"
        applyState();
        return;
      }

      var cur = +container.dataset.sel;

      if (cur >= 0 && e.target.closest('[data-detail]')) {   // click readout → close
        container.dataset.sel = '-1';
        applyState();
        return;
      }

      if (cur >= 0) {                               // a card is out — any click in the deck closes it
        container.dataset.sel = '-1';
        applyState();
        return;
      }

      // otherwise select the deck layer nearest the click
      var best = null, bd = Infinity;
      layerEls.forEach(function (l, i) {
        var b = l.getBoundingClientRect();
        var d = Math.hypot(e.clientX - (b.left + b.right) / 2, e.clientY - (b.top + b.bottom) / 2);
        if (d < bd) { bd = d; best = i; }
      });
      if (best !== null) {
        container.dataset.sel = String(best);
        applyState();
      }
    });

    // Click anywhere off the deck closes the popped card — but let interactive
    // controls (links, form fields, buttons) consume the click and stay open.
    // One listener per deck, each closing over its own container: a click in
    // deck B is "off the deck" for deck A, so A's popped card closes as intended.
    // The toggle lives inside `container`, so the contains() guard already skips
    // it; the button exemption and its stopPropagation are belt and braces.
    document.addEventListener('click', function (e) {
      if ((container.dataset.state || 'init') !== 'deck') return;   // deck not fanned
      if (+container.dataset.sel < 0) return;                       // no card out
      if (container.contains(e.target)) return;                     // in-deck: handled above
      if (e.target instanceof Element &&
          e.target.closest('a, button, input, textarea, select, label, [role="button"], [contenteditable="true"]')) {
        return;                                                     // interactive → suppress close
      }
      container.dataset.sel = '-1';
      applyState();
    });

    // ---- Deck toggle button ----------------------------------------------
    // The button is icon-only, so aria-label is its whole accessible name. The
    // package name is read from the visible face-card title — one source, no
    // second copy to drift.
    function syncToggle(deck) {
      if (!toggleBtn) return;
      var name = titleEl ? titleEl.textContent.trim() : 'deck';
      toggleBtn.setAttribute('aria-expanded', String(deck));
      toggleBtn.setAttribute('aria-label',
        (deck ? 'Collapse' : 'Expand') + ' the ' + name + ' package');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        // REQUIRED: the button sits INSIDE the stack, so without this the click
        // also reaches the container's layer-select handler above and pops a
        // card on the way past. It likewise stops the document-level click-away.
        e.stopPropagation();
        var deck = (container.dataset.state || 'init') !== 'deck';   // toggle target
        container.dataset.state = deck ? 'deck' : 'init';
        if (!deck) container.dataset.sel = '-1';                     // collapsing clears any popped layer
        syncToggle(deck);
        applyState();
      });
    }

    // Initial paint — deck loads collapsed (data-state="init" on the container).
    syncToggle(container.dataset.state === 'deck');
    applyState();
  }

  [].forEach.call(document.querySelectorAll('[data-deck]'), initDeck);
})();
