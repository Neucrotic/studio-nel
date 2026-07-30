/* ===========================================================================
   contact.js — submit-button motion, and the form's POST
   See SPECS.md §Contact form for the endpoint contract and the button states.

   The two IIFEs below are independent but coupled by one deliberate omission:
   the ripple handler does NOT preventDefault, so the native submit reaches the
   POST handler, which owns cancellation. Do not add preventDefault to the
   ripple — it would silently kill form submission.
   =========================================================================== */

(function () {
  // Submit button: magnetic pull toward the cursor + a click ripple.
  // Skipped entirely under prefers-reduced-motion.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var btn = document.querySelector('[data-magnetic]');
  if (!btn || reduce) return;

  var RANGE = 180;   // px from centre where the pull begins
  var PULL  = 6;     // base intensity

  // Magnet: drift the button toward the cursor within RANGE, else rest.
  window.addEventListener('pointermove', function (e) {
    var r = btn.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy;
    var dist = Math.hypot(dx, dy) || 1;
    if (dist < RANGE) {
      var f = (1 - dist / RANGE) * PULL * 1.6;
      btn.style.transform = 'translate(' + ((dx / dist) * f) + 'px,' + ((dy / dist) * f) + 'px)';
    } else {
      btn.style.transform = 'translate(0,0)';
    }
  }, { passive: true });

  // Ripple: bloom an accent circle from the click point, then remove it.
  btn.addEventListener('click', function (e) {
    var r = btn.getBoundingClientRect();
    var rp = document.createElement('span');
    rp.style.cssText = 'position:absolute; left:' + (e.clientX - r.left) + 'px; top:' + (e.clientY - r.top) +
      'px; width:6px; height:6px; border-radius:50%; background:var(--accent); transform:translate(-50%,-50%); pointer-events:none; opacity:.8;';
    btn.appendChild(rp);
    rp.animate(
      [{ width: '6px', height: '6px', opacity: 0.8 }, { width: '320px', height: '320px', opacity: 0 }],
      { duration: 650, easing: 'ease-out' }
    ).onfinish = function () { rp.remove(); };
  });
})();

(function () {
  // Form submit — POSTs to splitforms.com (no backend). Hooks the form's
  // `submit` event (not the button's click) so it works with Enter and under
  // reduced motion.
  var form = document.querySelector('.contact-form');
  if (!form) return;
  var btn    = form.querySelector('.contact-form__submit');
  var label  = form.querySelector('.contact-form__submit-label');
  var status = form.querySelector('.contact-form__status');

  var ACCESS_KEY    = 'e0733441b70b4294b054be68fcd426e5';
  var ENDPOINT      = 'https://splitforms.com/api/submit';
  var DEFAULT_LABEL = label.textContent;             // restore on retry

  // Change the label span, never the button's textContent — the latter would
  // wipe the ripple <span> the click handler appends as a button child.

  function showError(msg) {
    status.textContent = msg;
    status.hidden = false;
  }
  function clearError() {
    status.textContent = '';
    status.hidden = true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name    = form.elements['name'].value.trim();
    var email   = form.elements['email'].value.trim();
    var message = form.elements['message'].value.trim();
    var topicEl = form.querySelector('input[name="topic"]:checked');
    var topic   = topicEl ? topicEl.value : '';

    // All fields required.
    if (!name || !email || !topic || !message) {
      showError('Please fill in every field before sending.');
      return;
    }
    if (!form.elements['email'].checkValidity()) {
      showError('That email address doesn’t look right.');
      return;
    }

    clearError();
    btn.disabled      = true;
    label.textContent = 'Sending…';

    fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: ACCESS_KEY,
        botcheck:   '',            // honeypot — leave empty
        source:     'nel.studio',
        name:       name,
        email:      email,
        topic:      topic,
        message:    message
      })
    })
    .then(function (res) {
      // fetch only rejects on network failure — a bad key or blocked domain
      // returns a non-2xx response, so check res.ok explicitly.
      if (!res.ok) throw new Error('splitforms responded ' + res.status);
      label.textContent = 'Sent ✓';   // stays disabled
    })
    .catch(function () {
      btn.disabled      = false;
      label.textContent = DEFAULT_LABEL;
      showError('Couldn’t send — please try again.');
    });
  });
})();
