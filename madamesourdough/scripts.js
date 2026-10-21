// ============ Madame Sourdough — testimonials carousel ============
//
// Reviews are loaded from reviews.json (same folder as this file).
// Each review: { text, author, stars }  — stars: 0 (hide) or 1–5.

(function () {
  "use strict";

  var reviews = [];

  var AUTO_ADVANCE_MS = 7000;

  var carousel = document.getElementById("reviews-carousel");
  var viewport = document.getElementById("carousel-viewport");
  var dotsWrap = document.getElementById("carousel-dots");
  var prevBtn = document.getElementById("carousel-prev");
  var nextBtn = document.getElementById("carousel-next");

  var index = 0;
  var timer = null;

  function timeSince(dateStr) {
    if (!dateStr) return "";
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    var diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (isNaN(diffDays) || diffDays < 0) return "";

    if (diffDays >= 365) {
      var years = Math.max(1, Math.round(diffDays / 365.25));
      return years + (years === 1 ? " year ago" : " years ago");
    }
    if (diffDays < 42) {
      var weeks = Math.max(1, Math.round(diffDays / 7));
      return weeks + (weeks === 1 ? " week ago" : " weeks ago");
    }
    var months = Math.max(1, Math.round(diffDays / 30.44));
    return months + (months === 1 ? " month ago" : " months ago");
  }

  function render() {
    viewport.innerHTML = "";
    dotsWrap.innerHTML = "";

    if (!reviews.length) {
      return;
    }

    reviews.forEach(function (review, i) {
      var slide = document.createElement("figure");
      slide.className = "carousel__slide" + (i === index ? " is-active" : "");
      slide.setAttribute("aria-hidden", i === index ? "false" : "true");

      if (review.stars) {
        var stars = document.createElement("div");
        stars.className = "carousel__stars";
        stars.setAttribute("aria-label", review.stars + " out of 5 stars");
        stars.textContent =
          new Array(review.stars + 1).join("★") + new Array(5 - review.stars + 1).join("☆");
        slide.appendChild(stars);
      }

      var text = document.createElement("blockquote");
      text.className = "carousel__text";
      text.textContent = review.text;
      slide.appendChild(text);

      var meta = [];
      if (review.author) meta.push(review.author);
      var since = timeSince(review.date);
      if (since) meta.push(since);
      if (meta.length) {
        var author = document.createElement("figcaption");
        author.className = "carousel__author";
        author.textContent = "— " + meta.join(" · ");
        slide.appendChild(author);
      }

      viewport.appendChild(slide);

      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel__dot" + (i === index ? " is-active" : "");
      dot.setAttribute("aria-label", "Show review " + (i + 1));
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
      dotsWrap.appendChild(dot);
    });
  }

  function show(i) {
    if (!reviews.length) return;
    index = (i + reviews.length) % reviews.length;
    render();
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (reviews.length > 1) {
      timer = setInterval(function () {
        show(index + 1);
      }, AUTO_ADVANCE_MS);
    }
  }

  prevBtn.addEventListener("click", function () {
    show(index - 1);
    start();
  });

  nextBtn.addEventListener("click", function () {
    show(index + 1);
    start();
  });

  // Pause auto-advance while the user is interacting with the carousel
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);

  function loadReviews() {
    if (typeof fetch !== "function") {
      render();
      return;
    }
    fetch("reviews.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        reviews = (Array.isArray(data) ? data : [])
          .filter(function (r) {
            return r && typeof r.text === "string" && r.text.trim() !== "";
          })
          .map(function (r) {
            var s = Math.round(Number(r.stars));
            if (isNaN(s)) s = 0;
            return {
              text: r.text,
              author: (typeof r.author === "string" ? r.author : ""),
              stars: Math.min(5, Math.max(0, s)),
              date: (typeof r.date === "string" ? r.date : "")
            };
          });
        render();
        start();
      })
      .catch(function () {
        // reviews.json missing / empty / unreachable (e.g. opened via file://).
        // Leave the carousel area empty rather than showing stale data.
        reviews = [];
        render();
      });
  }

  loadReviews();
})();


// ============ Footer map — square, matched to the footer's content height ============
//
// A Google Maps iframe has no intrinsic ratio, so the square has to be imposed.
// The map column is set to the tallest text column, in pixels, for both width
// and height: same height as the rest of the footer content, and square.
// Below 800px the footer stacks and CSS (aspect-ratio) takes over instead.

(function () {
  "use strict";

  var grid = document.querySelector(".footer-grid");
  var frame = grid ? grid.querySelector(".footer-map__frame") : null;
  if (!grid || !frame) return;

  // Bounds for the square. MAX also stops the map column squeezing the text
  // columns on narrow desktop widths.
  var MIN_SIZE = 220;
  var MAX_SIZE = 360;

  var stacked = window.matchMedia("(max-width: 800px)");

  function tallestTextColumn() {
    var cols = grid.querySelectorAll(".footer-col:not(.footer-map)");
    var tallest = 0;
    Array.prototype.forEach.call(cols, function (col) {
      var h = col.getBoundingClientRect().height;
      if (h > tallest) tallest = h;
    });
    return tallest;
  }

  function clamp(px) {
    return Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, px)));
  }

  function apply(w, h) {
    frame.style.width = w + "px";
    frame.style.height = h + "px";
  }

  function clear() {
    frame.style.width = "";
    frame.style.height = "";
  }

  function size() {
    if (stacked.matches) {
      clear();
      return;
    }

    // Pass 1: measure with the map at its CSS default width.
    clear();
    var first = tallestTextColumn();
    if (!first) return;
    apply(560, clamp(first));

    // Pass 2: the map column steals width from the text columns, which can
    // make them taller. Re-measure once at the new widths and settle.
    var second = tallestTextColumn();
    if (second) apply(560, clamp(second));
  }

  var pending = null;
  function schedule() {
    if (pending !== null) return;
    pending = window.requestAnimationFrame(function () {
      pending = null;
      size();
    });
  }

  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(schedule);
  }

  size();
})();

// ============ Centre the page on the logo on load ============
(function () {
  "use strict";

  function centreOnLogo() {
    var logo = document.querySelector(".site-logo");
    if (!logo) return;
    var rect = logo.getBoundingClientRect();
    var target = window.pageYOffset
      + (rect.top + rect.height / 2)
      - (window.innerHeight / 2);
    window.scrollTo(0, Math.max(0, target));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", centreOnLogo);
  } else {
    centreOnLogo();
  }
})();
