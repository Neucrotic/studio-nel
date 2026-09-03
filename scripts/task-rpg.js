/* ===========================================================================
   task-rpg.js — support amount chips, validation, Stripe stub open
   See SPECS.md §Task RPG for the amount contract and Stripe behaviour.
   =========================================================================== */

(function () {
  // EDIT: replace with real Stripe Payment Link / Checkout URL
  var STRIPE_SUPPORT_URL = 'https://stripe.com';

  var input = document.getElementById('support-amount');
  var errorEl = document.getElementById('support-error');
  var submit = document.getElementById('support-submit');
  var chips = document.querySelectorAll('.chip[data-amount]');

  if (!input || !errorEl || !submit) return;

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  }

  // Valid: finite number, >= 1, <= 500, at most 2 decimal places.
  function validateAmount(raw) {
    var trimmed = String(raw).trim();
    if (trimmed === '') {
      return { ok: false, message: 'Enter an amount between 1 and 500.' };
    }
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      return { ok: false, message: 'Enter a valid amount (up to 2 decimal places).' };
    }
    var n = Number(trimmed);
    if (!Number.isFinite(n) || n < 1 || n > 500) {
      return { ok: false, message: 'Enter an amount between 1 and 500.' };
    }
    return { ok: true, value: n };
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      input.value = chip.getAttribute('data-amount');
      clearError();
    });
  });

  input.addEventListener('blur', function () {
    var result = validateAmount(input.value);
    if (result.ok) clearError();
    else showError(result.message);
  });

  submit.addEventListener('click', function () {
    var result = validateAmount(input.value);
    if (!result.ok) {
      showError(result.message);
      return;
    }
    clearError();
    // Same stub URL for every valid amount; amount is not passed as a query param.
    window.open(STRIPE_SUPPORT_URL, '_blank', 'noopener,noreferrer');
  });
})();
