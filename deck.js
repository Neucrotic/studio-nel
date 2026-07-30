/* ===========================================================================
   deck.js — the interactive rune deck
     • click the toggle button      → fan the deck open / collapse it shut
     • click the cover (collapsed)  → fan the deck open
     • click a layer (deck open)    → lift it out + open its inscription
     • click the open readout/layer → close it back into the deck

   All layout transforms are computed here; the stylesheet owns only the
   resting look. See SPECS.md §Rune deck for the fan maths and state model.
   =========================================================================== */

(function () {
  var container = document.querySelector('[data-rune-stack]');
  if (!container) return;

  var scene  = container.querySelector('[data-scene]');
  var cover  = container.querySelector('[data-cover]');
  var detail = container.querySelector('[data-detail]');
  var toggleBtn = container.querySelector('[data-deck-toggle]');
  var toggleLabel = container.querySelector('[data-deck-label]');
  var dName  = detail.querySelector('[data-d-name]');
  var dRune  = detail.querySelector('[data-d-rune]');
  var dHead  = detail.querySelector('[data-d-head]');
  var dBody  = detail.querySelector('[data-d-body]');

  // ---- Deck data -------------------------------------------------------
  // FILES/COLS/NAMES/HEADS/BODIES are index-parallel — one card is built from
  // the same index across all five. Reorder one and you must reorder all five,
  // or a card gets another card's colour, name or inscription.
  var FILES  = ['debugging', 'analytics', 'architecture', 'design', 'human'];

  // Build a masked glyph element for one icon file. --icon feeds the
  // mask-image in the stylesheet; colour + glow come from the CSS.
  function makeGlyph(file) {
    var g = document.createElement('span');
    g.className = 'rune-stack__glyph';
    g.style.setProperty('--icon', 'url("icons/' + file + '.svg")');
    return g;
  }
  var COLS   = ['#ff5a6a','#ffb27a','#139fe8','#b06bff','#39e6b0'];
  var NAMES  = ['maintenance','analyics','systems','design','human'];
  var HEADS  = ['BUG-FIXES','DATA','ARCHITECTURE','DESIGN','HUMAN'];
  var BODIES = [
    'NEL provides on-going support to quickly resolve issues and patch software.',
    'Collect essential user data to identify user trends & inform business decisions.',
    'NEL build scalable architecture that makes it easy to build & test additional features.',
    'Build something beautiful. NEL can quickly prototype ideas & deliver a product that feels alive.',
    'Talk to a real person – not a chat bot.\n NEL makes developing your software easy.'
  ];

  var N = 5;                                   // layer count
  var DATA = [];
  for (var i = 0; i < N; i++) {
    DATA.push({
      idx: i,
      file: FILES[i % FILES.length],
      col:  COLS[i % COLS.length],
      name: NAMES[i % NAMES.length],
      head: HEADS[i % HEADS.length],
      body: BODIES[i % BODIES.length]
    });
  }

  // ---- Build the layer DOM into the scene ------------------------------
  var layerEls = DATA.map(function (L) {
    var layer = document.createElement('div');
    layer.className = 'rune-stack__layer';
    layer.dataset.idx = String(L.idx);
    layer.style.setProperty('--lc', L.col);

    var face = document.createElement('div');
    face.className = 'rune-stack__face';
    face.appendChild(makeGlyph(L.file));

    var rim = document.createElement('div');
    rim.className = 'rune-stack__rim';

    var tag = document.createElement('div');
    tag.className = 'rune-stack__tag';
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

    var c = (N - 1) / 2;
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
        var o = i - c;
        L.style.transform =
          'translate3d(' + (-o * 92 * openness) + 'px,' + (o * 92 * openness) + 'px,0px)';
        var deckOp = (sel >= 0 && sel !== i) ? 0.4 : 1;   // dim siblings while one is out
        L.style.opacity = String(deckOp * openness);      // all deck cards vanish when collapsed
        L.style.zIndex = String(i);
      }
    }

    // The cover is the collapsed monolith: opaque when closed, gone when fanned.
    if (cover) cover.style.opacity = String(1 - openness);
  }

  function updateDetail(openness, sel) {
    var show = (container.dataset.state === 'deck') && sel >= 0 && sel < DATA.length;
    if (show) {
      var L = DATA[sel];
      dName.textContent = '// ' + L.name.toUpperCase();
      dRune.innerHTML = '';
      dRune.appendChild(makeGlyph(L.file));
      dHead.textContent = L.head;
      dBody.textContent = L.body;
      detail.style.setProperty('--rc', L.col);
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

    // Collapsed: only the cover card opens the deck. CSS gives the cover
    // pointer-events in this state alone, so its click lands on it and bubbles
    // here while the rest of the transparent stage box stays inert. Opening
    // only — nothing but the toggle button collapses.
    if (state !== 'deck') {
      if (!(e.target instanceof Element) || !e.target.closest('[data-cover]')) return;
      container.dataset.state = 'deck';
      syncToggle(true);                           // button label/aria → "Collapse"
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
  function syncToggle(deck) {
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(deck));
      toggleBtn.setAttribute('aria-label', (deck ? 'Collapse' : 'Expand') + ' the deck');
    }
    if (toggleLabel) toggleLabel.textContent = deck ? 'Collapse' : 'Expand';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function (e) {
      // stopPropagation keeps the click off the container's layer-select
      // handler above, which would otherwise pick a layer when open.
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
})();
