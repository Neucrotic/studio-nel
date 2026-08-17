/* ===========================================================================
   stage.js — kaku, the self-booting circuit card

   Builds an SVG circuit, then runs a one-time power-up timeline
     dormant → boot → flow → flicker → glow → levitate → hold
   igniting the traces, flickering a kaku-blue rim aura on, then lifting +
   growing .kaku-card. It:
     • starts only once the WriteLite card has finished flying in
     • plays once, then rests in "hold" (no loop, no click-to-restart)
     • honours prefers-reduced-motion (jumps straight to a lit, static state)

   See SPECS.md §kaku for the phase durations, the scale derivation and the
   face-reveal beats.
   =========================================================================== */

(function () {
  var stage = document.querySelector('.kaku-stage');
  if (!stage) return;
  var inner = stage.querySelector('.kaku-stage__inner');   // holds data-phase

  // ---- fixed props -----------------------------------------------------
  // The accent is NOT one of these: it lives in CSS as --blue-kaku, aliased
  // to --acc on .kaku-stage. Keep it that way — a JS copy would inline-style
  // the stage and silently override the stylesheet.
  var GLOW = 1, SPEED = 1, LIFT = 1.7;
  // The card's box IS its levitated size, so 'hold' is scale(1) and the boot
  // runs the growth from this inverse. Never author the card at a scale — its
  // text would be rasterised small and stretched.
  var INV = 1 / LIFT;

  var PHASES = ['dormant','boot','flow','flicker','glow','levitate','hold'];
  var BASE = { dormant:1000, boot:700, flow:1300, flicker:650, glow:750, levitate:1500, hold:1900 };
  var chipDelay = 260, igniteMs = 0;

  // ---- SVG builders ----------------------------------------------------
  function rng(seed){ var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function(){ return (s = s * 16807 % 2147483647) / 2147483647; }; }
  function litStyle(delay, base){ return 'opacity:' + (base == null ? '.09' : base) + '; transition:opacity .5s ease; transition-delay:' + delay + 'ms'; }
  function shuffledDelays(r, n, step){ var arr = []; for (var i = 0; i < n; i++) arr.push(i * (step || 60)); for (var j = n - 1; j > 0; j--){ var k = Math.floor(r() * (j + 1)); var t = arr[j]; arr[j] = arr[k]; arr[k] = t; } return arr; }

  function wrap(svgInner){
    return '<div style="position:absolute; inset:0; color:var(--acc)">' +
      '<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block; overflow:visible">' +
      svgInner + '</svg></div>';
  }

  function chipBorder(){
    var s = '<rect x="20" y="20" width="60" height="60" rx="7" fill="none" stroke="#3c414a" stroke-width="1.1"/>';
    s += '<rect data-energised x="20" y="20" width="60" height="60" rx="7" fill="none" stroke="currentColor" stroke-width="1.3" style="' + litStyle(0, '.12') + '"/>';
    s += '<rect data-energised x="23.5" y="23.5" width="53" height="53" rx="5" fill="none" stroke="currentColor" stroke-width="0.45" style="' + litStyle(60, '.09') + '"/>';
    for (var i = 0; i < 7; i++){
      var p = (26 + i * 8).toFixed(1);
      var dir = [[p,20,p,13.5], [p,80,p,86.5], [20,p,13.5,p], [80,p,86.5,p]];
      for (var di = 0; di < dir.length; di++){
        var d = dir[di];
        if (di === 1 && (i === 0 || i === 1)) continue;   // bottom edge: drop two left-most pins
        if (di === 2 && (i === 2 || i === 6)) continue;   // left edge: drop 3rd-from-top + bottom-most
        if (di === 2 && i === 5) d = [d[0], d[1], (d[0] + d[2]) / 2, d[3]];          // half-length pin
        if (di === 0 && i === 3) d = [d[0], d[1], d[2], d[1] - (d[1] - d[3]) * 1.5]; // 50% longer
        if (di === 0 && i === 4) d = [d[0], d[1], d[2], d[1] - (d[1] - d[3]) * 3.5]; // longest pin
        s += '<line x1="' + d[0] + '" y1="' + d[1] + '" x2="' + d[2] + '" y2="' + d[3] + '" stroke="#5a6068" stroke-width="0.7"/>';
        s += '<line data-energised x1="' + d[0] + '" y1="' + d[1] + '" x2="' + d[2] + '" y2="' + d[3] + '" stroke="currentColor" stroke-width="0.9" style="' + litStyle(120 + di * 40, '.12') + '"/>';
      }
    }
    return s;
  }

  function _seg(pts){
    var dstr = '';
    for (var i = 0; i < pts.length; i++) dstr += (i ? 'L' : 'M') + ' ' + pts[i][0] + ' ' + pts[i][1] + ' ';
    return '<path d="' + dstr.trim() + '" fill="none" stroke="#3a3f47" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function _socket(x, y, r){ return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#14171d" stroke="#40454d" stroke-width="0.5"/>'; }
  function _dot(x, y, r){ return function(d){ return '<circle data-lit data-delay="' + d + '" cx="' + x + '" cy="' + y + '" r="' + r + '" fill="currentColor" style="opacity:.08; transition:opacity .5s ease; transition-delay:0ms"/>'; }; }

  function compose(base, lit, r, step, order){
    var delays = Array.isArray(order) ? order
               : (order ? lit.map(function(_, i){ return i * (step || 110); }) : shuffledDelays(r, lit.length, step || 110));
    var threads = base.filter(function(s){ return s.indexOf('<circle') === -1; });
    var nodes   = base.filter(function(s){ return s.indexOf('<circle') !== -1; });
    return wrap(chipBorder() + threads.join('') + nodes.join('') + lit.map(function(f, i){ return f(delays[i]); }).join(''));
  }

  function _busShared(){
    return {
      base: [
        '<line x1="91" y1="30" x2="91" y2="70" stroke="#3a3f47" stroke-width="0.9"/>',
        _socket(91,34,2.4), _socket(91,50,2.4), _socket(91,66,2.4),
        _seg([[80,50],[91,50]]), _seg([[80,66],[91,66]]),
        _seg([[20,40],[10,40]]), _socket(10,40,3)
      ],
      lit: [ _dot(91,34,1.6), _dot(91,50,1.6), _dot(91,66,1.6), _dot(85,50,1.2) ]
    };
  }

  function buildDeco(){
    var r = rng(214); var shared = _busShared(); var base = shared.base, lit = shared.lit;
    base.push(_seg([[91,66],[91,90],[42,90]]));   // powered bottom run
    base.push(_seg([[42,86.5],[42,90]]));
    base.push(_seg([[58,86.5],[58,90]]));
    base.push(_seg([[74,86.5],[74,90]]));
    base.push(_socket(32,90,1.8));                 // dead terminal
    base.push(_seg([[32,90],[11,74],[11,58]]));
    base.push(_socket(11,58,1.8));
    base.push(_seg([[13.5,58],[11,58]]));
    base.push(_socket(11,50,1.8));
    base.push(_seg([[13.5,50],[11,50]]));
    base.push(_seg([[11,50],[11,44],[10,40]]));
    lit.push(_dot(91,80,1.4), _dot(74,90,1.5), _dot(58,90,1.5), _dot(42,90,1.9));
    base.push(_socket(50,10.25,2.4));              // medium top node
    base.push(_socket(58,-2.75,3.2));              // large top node
    lit.push(_dot(50,10.25,1.6), _dot(58,-2.75,2.2));
    var GAP = 500, CASC = 130;
    var d_large = 0, d_medium = GAP, d_small = 3 * GAP, d_right2 = 4 * GAP;
    chipDelay = 2 * GAP;                            // circuit lights between medium + small
    var d_pair = d_right2 + CASC, d_c1 = d_pair + CASC, d_c2 = d_c1 + CASC, d_c3 = d_c2 + CASC, d_c4 = d_c3 + CASC;
    var delays = [d_pair, d_right2, d_pair, d_small, d_c1, d_c2, d_c3, d_c4, d_medium, d_large];
    igniteMs = Math.max.apply(null, delays.concat([chipDelay])) + 600;   // hold flow until ignition ends
    return compose(base, lit, r, CASC, delays);
  }

  // ---- timeline --------------------------------------------------------
  var timer = null;
  var booted = false;   // true once the boot settles at 'hold' → magnet may act
  function setTimer(fn, ms){ if (timer) clearTimeout(timer); timer = setTimeout(fn, ms); }

  function runPhase(idx){
    var phase = PHASES[idx];
    applyPhase(phase);
    var t = ((phase === 'flow' ? (igniteMs || BASE.flow) : BASE[phase]) || 1000) / SPEED;
    if (idx < PHASES.length - 1) setTimer(function(){ runPhase(idx + 1); }, t);
    // autoPlay is off → the sequence stops at 'hold'
  }

  function applyPhase(phase){
    inner.dataset.phase = phase;
    var body   = inner.querySelector('.kaku-card');
    var glow   = inner.querySelector('.kaku-stage__glow');
    var shadow = inner.querySelector('.kaku-stage__shadow');
    var hover  = inner.querySelector('.kaku-stage__lift');
    var deco   = inner.querySelector('.kaku-stage__circuit');
    var rim    = inner.querySelector('.kaku-stage__rim');
    var chips  = inner.querySelectorAll('[data-energised]');
    var lits   = inner.querySelectorAll('[data-lit]');
    var setChips     = function(o){ for (var i = 0; i < chips.length; i++) chips[i].style.opacity = o; };
    var setChipDelay = function(d){ for (var i = 0; i < chips.length; i++) chips[i].style.transitionDelay = d + 'ms'; };
    var setLits      = function(o, useDelay){ for (var i = 0; i < lits.length; i++){ lits[i].style.transitionDelay = (useDelay ? (lits[i].dataset.delay || 0) : 0) + 'ms'; lits[i].style.opacity = o; } };
    var powered = phase === 'levitate' || phase === 'hold';

    if (phase !== 'flicker') body.style.animation = 'none';
    hover.style.animation = powered ? ('kaku-hoverbob ' + (3.6 / SPEED).toFixed(2) + 's ease-in-out infinite') : 'none';
    if (!powered) hover.style.transform = 'translateY(0)';

    switch (phase){
      case 'dormant':
        body.style.transform = 'scale(' + INV + ')'; body.style.filter = 'brightness(.5) saturate(.55)';
        glow.style.opacity = '0'; glow.style.transform = 'translate(-50%,-50%) scale(.7)';
        shadow.style.opacity = '.5'; shadow.style.transform = 'translate(-50%,0) scale(1)'; shadow.style.filter = 'blur(8px)';
        deco.style.filter = 'none'; setChipDelay(0); setChips('.12'); setLits('.08');
        rim.style.animation = 'none'; rim.style.opacity = '0'; rim.style.transform = 'scale(' + INV + ')'; break;
      case 'boot':
        body.style.filter = 'brightness(.6) saturate(.7)'; glow.style.opacity = '.05';
        deco.style.filter = 'drop-shadow(0 0 2px var(--acc))'; setChipDelay(0); setChips('.12'); setLits('.08');
        rim.style.animation = 'none'; rim.style.opacity = '0'; break;
      case 'flow':
        body.style.filter = 'brightness(.72) saturate(.85)';
        glow.style.opacity = '.14'; glow.style.transform = 'translate(-50%,-50%) scale(.85)';
        deco.style.filter = 'drop-shadow(0 0 3px var(--acc))'; setChipDelay(chipDelay || 260); setChips('1'); setLits('1', true);
        rim.style.animation = 'none'; rim.style.opacity = '0'; break;
      case 'flicker':
        body.style.animation = 'kaku-flicker ' + (0.62 / SPEED).toFixed(2) + 's ease-out';
        body.style.filter = 'brightness(.9) saturate(.95)'; glow.style.opacity = String(.26 * GLOW);
        deco.style.filter = 'drop-shadow(0 0 4px var(--acc))'; setChips('1'); setLits('1');
        // rim aura ignites here: flicker once, then it holds steady at opacity 1
        rim.style.animation = 'kaku-rim-flicker ' + (0.62 / SPEED).toFixed(2) + 's ease-out'; rim.style.opacity = '1'; break;
      case 'glow':
        body.style.animation = 'none'; body.style.filter = 'brightness(1) saturate(1)';
        glow.style.opacity = String(.42 * GLOW); glow.style.transform = 'translate(-50%,-50%) scale(1)';
        deco.style.filter = 'drop-shadow(0 0 ' + (5 * GLOW).toFixed(1) + 'px var(--acc))'; setChips('1'); setLits('1');
        rim.style.animation = 'none'; rim.style.opacity = '1'; rim.style.transform = 'scale(' + INV + ')'; break;
      case 'levitate':
      case 'hold':
        body.style.transform = 'scale(1)'; body.style.filter = 'brightness(1.08) saturate(1.08)';
        glow.style.opacity = String(Math.min(1, .85 * GLOW)); glow.style.transform = 'translate(-50%,-50%) scale(1.15)';
        shadow.style.opacity = '.42'; shadow.style.transform = 'translate(-50%,30px) scale(1.9)'; shadow.style.filter = 'blur(22px)';
        deco.style.filter = 'drop-shadow(0 0 ' + (7 * GLOW).toFixed(1) + 'px var(--acc)) drop-shadow(0 0 ' + (16 * GLOW).toFixed(1) + 'px var(--acc))';
        setChips('1'); setLits('1');
        // rim grows with the card
        rim.style.animation = 'none'; rim.style.opacity = '1'; rim.style.transform = 'scale(1)';
        if (phase === 'hold'){ booted = true; reveal(); }   // boot done → arm the magnet, light the face
        break;
    }
  }

  // ---- card face reveal ------------------------------------------------
  // Runs once, on entry to 'hold' — i.e. after the card has finished growing.
  // Four beats: unlit glyph → entry text → "building..." typed → the glyph
  // ignites. The first two are pure CSS off data-face; the ignition fires from
  // the end of the typing loop, never off a CSS delay — only the JS knows when
  // the last character lands.
  var card = inner.querySelector('.kaku-card');
  var BUILD_TEXT = 'building...', TYPE_MS = 75, TYPE_START = 2200;
  var IGNITE_BEAT = 400;                              // caret blinks alone before the mark lights
  var revealed = false;

  function typeBuild(){
    var out = card.querySelector('.kaku-card__typed');
    card.dataset.typing = 'on';                       // caret appears + blinks
    var i = 0;
    (function tick(){
      out.textContent = BUILD_TEXT.slice(0, ++i);
      if (i < BUILD_TEXT.length){ setTimeout(tick, TYPE_MS / SPEED); return; }
      setTimeout(function(){ card.dataset.glyph = 'lit'; }, IGNITE_BEAT / SPEED);
    })();
  }

  function reveal(){
    if (revealed) return;
    revealed = true;
    card.dataset.face = 'on';
    setTimeout(typeBuild, TYPE_START / SPEED);
  }

  // Reduced-motion twin: everything present and lit, nothing animating.
  function revealInstant(){
    revealed = true;
    card.dataset.face = 'on';
    card.dataset.glyph = 'lit';                       // mark present + lit, no fade, no flicker
    card.querySelector('.kaku-card__typed').textContent = BUILD_TEXT;
    card.dataset.typing = 'static';                   // caret lit, not blinking
  }

  // ---- build the circuit -----------------------------------------------
  // --acc is deliberately not set here; the stylesheet owns it.
  inner.querySelector('.kaku-stage__circuit').innerHTML = buildDeco();
  stage.style.setProperty('--glow', GLOW);

  // ---- WriteLite reference (used only by the start gate below) ---------
  var wl = document.querySelector('.writelite-card');

  // ---- start gate ------------------------------------------------------
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce){ applyPhase('glow'); revealInstant(); return; }   // lit, static, no motion

  applyPhase('dormant');                             // explicit resting state
  var started = false;
  function start(){ if (started) return; started = true; runPhase(1); }   // begin at 'boot'
  if (wl) wl.addEventListener('animationend', start, { once: true });
  setTimeout(start, 2500);                           // fallback if the glide's animationend is missed

  // ---- magnet follow ---------------------------------------------------
  // Drives the whole chip assembly via .kaku-stage__inner — the free transform
  // layer (the bob lives on __lift, the boot's scale on .kaku-card).
  // Gated on `booted` so it never fights the boot timeline; this path is
  // unreachable under reduced motion (the early return above). Inside the
  // square → tilt; near an outside edge → pull; the two never coexist.
  window.addEventListener('pointermove', function (e) {
    if (!booted) return;
    var r = stage.getBoundingClientRect();
    var cs = getComputedStyle(stage);
    var range = parseFloat(cs.getPropertyValue('--range')) || 24;
    var pull  = parseFloat(cs.getPropertyValue('--pull'))  || 5;

    var inside = e.clientX >= r.left && e.clientX <= r.right &&
                 e.clientY >= r.top  && e.clientY <= r.bottom;

    if (inside) {
      var px = (e.clientX - r.left) / r.width  - 0.5;
      var py = (e.clientY - r.top)  / r.height - 0.5;
      inner.style.transform = 'rotateY(' + (px * 10) + 'deg) rotateX(' + (-py * 10) + 'deg) translateY(-6px)';
      return;
    }
    inner.style.transform = '';

    var edgeX = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    var edgeY = Math.max(r.top  - e.clientY, 0, e.clientY - r.bottom);
    var edge  = Math.hypot(edgeX, edgeY);
    if (edge >= range) return;                        // beyond reach — inner reset above

    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy;
    var dist = Math.hypot(dx, dy) || 1;
    var f = Math.sin(Math.PI * (edge / range)) * pull;
    inner.style.transform = 'translate(' + ((dx / dist) * f) + 'px,' + ((dy / dist) * f) + 'px)';
  }, { passive: true });
})();
