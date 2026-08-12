# Studio NEL — implementation specs

How the site is built. Every number here was read from the code, not from a
previous comment. The code is the authority; if the two disagree, the code is
right and this file is stale.

`CLAUDE.md` owns agent behaviour and working preferences. It does not repeat
anything below.

---

## Files & load order

| File | Owns |
|---|---|
| `index.html` | Markup only, plus the pre-paint theme lock |
| `styles.css` | All styling, in 13 numbered groups |
| `cards.js` | WriteLite card magnet/tilt + the first-paint `body.ready` gate |
| `contact.js` | Submit-button magnet/ripple + the form's POST |
| `deck.js` | Rune deck |
| `stage.js` | kaku |
| `grid.js` | Cursor feed for the background grid glow |
| `icons/` | Deck icons: `analytics`, `architecture`, `debugging`, `design`, `human`, `reset` |
| `wl_logo.svg` | WriteLite mark (`<img>`) |
| `kaku_logo.svg` | Source for the kaku glyph, which is **inlined** into `index.html` |

Scripts load as classic `defer` in `<head>`, in the order the inline blocks used
to run: `cards.js`, `contact.js`, `deck.js`, `stage.js`, then `grid.js`. `grid.js`
shares no state with the others, so its position is free.

Three constraints on that arrangement:

- **Not `type="module"`.** Modules fail under `file://` because of CORS, which
  would break local preview of the whole page. Nothing imports anything.
- **The pre-paint theme lock stays inline** in `<head>`. Its whole job is
  setting `data-theme` before first paint; an external file would put a network
  round-trip in front of first paint to save three lines.
- **`getComputedStyle` is safe.** Both magnets read `--range` / `--pull` off
  their element. A pending stylesheet blocks script execution, so the CSSOM is
  populated before any deferred script runs.

`stage.js` gates kaku's boot on an `animationend` from `.writelite-card`, whose
glide is 2.2s. All four scripts run in the same tick, far ahead of that, and
there is a 2,500ms fallback regardless.

### Cascade constraints

Rule order in `styles.css` is load-bearing in exactly two places. Both are
same-specificity conflicts, decided by position alone:

1. **`.contact-form__field` must stay above `.contact-form__topics`.** The
   topics fieldset carries both classes; `__field` sets
   `flex-direction: column`, `__topics` sets `row`. Swap them and the radio
   chips stack vertically.
2. **Both `@media` blocks must stay last.** Every `max-width: 720px` override
   (`.hero__title`, `.section`, `.grid`, `.foot`, `.writelite-card*`) is the
   same specificity as its base rule.

One more same-specificity pair, currently correct and worth not disturbing:
`:focus-visible` (group 13) sets `border-radius: 4px` and `.toggle` (group 6)
sets `50%`. A focused toggle matches both; `:focus-visible` wins because it
comes later.

Everything else is settled by specificity and may be moved freely — `#software`
beats `.section`, `.writelite-card.is-landed` beats `.writelite-card`,
`.rune-stack[data-state="init"] .rune-stack__cover` beats `.rune-stack__cover`.

---

## Design tokens & theming

Raw stone palettes live in `:root` and are theme-agnostic. The `[data-theme]`
blocks only point at them — **never put a raw hex in a theme block.**

- **Dark granite** is built off `#16181f`, a cool blue-grey.
- **Yellow limestone** is built off `#f0e1bd`, warm and sandy.
- `--blue-fill` (`#139fe8`) is the site accent for fills and reads well on dark
  granite. `--blue-deep` (`#14509c`) exists because `--blue-fill` does **not**
  pass AA as link text on limestone; `--blue-deep` is ~6:1 there.
- `--accent-artists` / `--accent-thinkers` are fixed hero-word colours and
  deliberately do not follow the theme. `.accent--alt` swaps the local
  `--accent-artists` token so colour *and* glow both go purple from one change.

Four components are deliberate **fixed-dark islands** that ignore the page
theme entirely, each carrying its own palette on the class: `.writelite-card`
(amber `#d4a030`), `.kaku-stage` (kaku blue), `.rune-stack` (per-card accents),
`.contact-card` (static stone).

### The dark lock

The site is currently forced to dark for everyone. Restoring the light/dark
toggle means uncommenting **three** blocks:

1. `index.html` `<head>` — the `try`/`catch` detection block inside the
   pre-paint script, and removing the `setAttribute('data-theme', 'dark')` line
   above it.
2. `index.html` `<body>` — the `<button class="toggle">` markup and the handler
   `<script>` immediately beneath it. They are adjacent on purpose.
3. `styles.css` group 6 — nothing to do; the `.toggle` rules are already live,
   along with the whole `[data-theme="light"]` limestone palette in group 2.

### Grid background

The page ground is a blueprint grid in the site accent that lights up around the
cursor. It replaced a `feTurbulence` stone-grain texture, which was discarded
outright; the limestone palette survived that change untouched, because it only
ever fed the light-theme aliases and never the texture.

Two pseudo-elements on `body`, both `position: fixed; inset: 0; z-index: -1;
pointer-events: none`:

| Layer | Draws |
|---|---|
| `body::before` | The resting grid, in `--grid-dim` |
| `body::after` | The same grid in `--grid-lit`, revealed only through a radial mask centred on the cursor |

Each layer is two `repeating-linear-gradient`s — one `to right` for the vertical
lines, one `to bottom` for the horizontals — using the double-position stop form
so a `--grid-width` band of colour is followed by transparency out to
`--grid-size`.

| Token | Value | Is |
|---|---|---|
| `--grid-size` | 64px | cell pitch |
| `--grid-width` | 1px | line thickness |
| `--grid-dim` | `rgba(19,159,232,.10)` | resting line |
| `--grid-lit` | `rgba(19,159,232,.85)` | line inside the glow |
| `--glow-core` | 28px | full-strength radius |
| `--glow-edge` | 140px | fade reaches zero |

`--grid-dim` and `--grid-lit` restate `--blue-fill`'s channels by hand, because a
hex token cannot be given an alpha. They are the one place in the codebase that
duplicates a colour value; changing `--blue-fill` means changing both.

**Layering.** `html` carries no background, so `body`'s `background-color`
propagates to the page canvas and paints below negative-z-index children — which
is why `z-index: -1` puts the grid above the ground colour and below all content.
`body` has no transform, filter or opacity, so it is not a containing block and
`fixed` resolves against the viewport; the grid therefore stays put while the page
scrolls. `body`'s `overflow-x: hidden` propagates to the viewport rather than
clipping locally, so it does not cut the layers off.

**No `mix-blend-mode` on these layers.** A non-normal blend mode isolates the
parent group, making `body` a stacking context and blending the layer against an
empty backdrop instead of the page ground — the emissive effect it would be added
for cannot happen there. Brightness belongs in `--grid-lit`'s alpha.

**The cursor feed.** `grid.js` writes `--mx` / `--my` to `body`'s inline style from
a passive `pointermove` listener, using `clientX/Y` (viewport space, matching the
fixed layers — no scroll offset). The defaults are declared on the `body` rule, not
on `::after`: a declaration on the pseudo-element would beat the inherited value
and the glow would never move. They start at `-9999px` so nothing glows before the
first pointer event. Under `prefers-reduced-motion` the listener never attaches and
the grid stays at its resting state.

The write is direct, one per pointer event, matching the magnets in `cards.js` and
`contact.js`. It repaints a full-viewport masked layer each time, which is heavier
than their transform writes; if that ever costs frames, coalesce it into a single
pending `requestAnimationFrame`.

### Card grain

The two dark card islands keep the `feTurbulence` grain the page background gave
up — a grayscale SVG as a `data:` URI, over their own stone gradient.

| Where | Tile | `baseFrequency` | `numOctaves` | Blend |
|---|---|---|---|---|
| `.writelite-card__inner::before` | 200px | 0.7 | 3 | `overlay` @ 0.35 |
| `.contact-card__inner::before` | 200px | 0.7 | 3 | `overlay` @ 0.35 |

Tuning knobs: `baseFrequency` is grain size (higher = finer, useful range
~0.6–1.0); `numOctaves` is detail depth (more = rougher, ~2–3);
`mix-blend-mode` and `opacity` set overall strength.

**The encoded data-URI is the only source of truth.** A decoded "readable
copy" used to sit in a comment above `body`; it drifted to `0.85`/`2` while the
real value was `0.5`/`4`, and was removed for that reason. Decode the URI when
you need to read it — do not re-add a second copy.

---

## Layout & measurements

Both content rows are **1034px** wide and centred, which is what makes the
software and studio rows share identical edges:

```
software:  564 (WriteLite)  + 36 gap + 434 (kaku stage)  = 1034
studio:    400 (rune deck)  + 36 gap + 598 (contact card) = 1034
```

`.contact-card`'s 598px is derived: `1034 − 400 − 36`. Both cards use
`flex: 0 0 <n>px` with `max-width: 100%`, so they never grow or shrink to fill
— they only shrink when the viewport is narrower than the card.

`.foot` uses `padding-inline: max(0px, (100% - 1034px) / 2)` to anchor the
footer text to those rows, reproducing exactly what flex centring leaves at each
side. Below 1034px it floors at 0 — the same point where the rows wrap and the
cards go flush — so the two stay aligned on both sides of that breakpoint.

`.writelite-card { margin-top: 25px }` drops the card so its top meets the kaku
chip's top: the chip is centred in the 434px stage at 384px, so its top sits
`(434 − 384) / 2 = 25px` below the row top. The 720px media query zeroes it,
because stacked there is no kaku beside it to align to.

### Section gaps

`.section` is `40px` top / `27px` bottom. Where two sections meet, the gap is
the sum of both paddings — `27 + 40 = 67px`. To tune *only* the
software → studio gap without touching hero → software or studio → footer,
`#software` cuts its end to `13.5px` and `#studio` sets its own start.
`#studio .grid` then adds `margin-top: 40px` and switches to
`align-items: flex-start`, top-aligning the deck/contact pair to a shared top
edge instead of stretching either to the other's height (base `.grid` uses
`stretch`). Scoped to `#studio` so `.grid` and `#software` stay untouched.

One child opts back out: `.rune-column` carries `align-self: stretch`, so it —
and only it — takes the flex line's cross-size, which is whatever height the
contact card's content sets. That is what gives the deck column room to hold its
intro copy at the top and centre the deck beneath it. `align-self` on the one
child rather than `align-items: stretch` on the container is deliberate: the
container rule would reach the contact card too. Below 1034px the row wraps, each
item gets its own line, and the stretch becomes a no-op.

---

## WriteLite card

Two coordinated load animations, both 2.2s on `--ease`, both with `both` fill
and a `--glide-delay` offset:

- **Outer** (`pc-glide`) — `translateX(-140vw)` → `0`. The **backwards fill is
  load-bearing**: it parks the card off-screen-left rather than invisible, so it
  reads as a solid card flying in from outside the page. `body` carries
  `overflow-x: hidden` so this never flashes a scrollbar.
- **Inner** (`pc-bank`) — `rotateY(24deg) rotateZ(-6deg)` → level, like a ship
  settling into position.

On `animationend`, `cards.js` adds `.is-landed`, which swaps the outer to
`writelite-bob` (3.6s, `+2px` → `-9px`) and clears the inner's animation so JS
can own the inner's transform. **The bob lives on the outer and the magnet on
the inner, so the two never collide.**

### Magnet

Armed only after landing. Inside the card → tilt; outside but within range →
pull; never both.

- **Tilt:** `rotateY(px * 10deg) rotateX(-py * 10deg) translateY(-6px)`, where
  `px`/`py` are cursor position within the box, centred to ±0.5.
- **Pull:** distance from the nearest *edge*, ramped on a bell curve —
  `sin(π · edge / range) · pull`. Zero at the edge, peak mid-range, zero by
  `range`.
- `--range: 24`, `--pull: 5`, both read from CSS via `getComputedStyle`.
- `body.ready` adds `transition: transform 1.5s var(--ease)`, giving the lazy
  cursor-follow: the card drafts after the mouse instead of snapping to it.

`--glide-delay` is consumed with a `0ms` fallback and never set — it is the
stagger hook for a second product card.

---

## kaku

A self-booting circuit card. It never flies in and has no glide; it powers up in
place once WriteLite has landed. Plays once and rests in `hold` — no loop, no
click-to-restart.

```
.kaku-stage        fixed square, min(434px, 90vw), the grid sibling
  __inner          the magnet's free transform layer (holds data-phase)
  __shadow         ground shadow
  __glow           radial aura
  __circuit        the SVG circuit board, injected by stage.js
  __lift           88.4% box; carries the hoverbob
    .kaku-card     the square that lifts + resizes
    __rim          kaku-blue aura; flickers once then holds
```

`stage.js` drives the timeline by mutating inline styles. **The base styles in
`styles.css` group 8 ARE the `dormant` look** — keep them that way, or the card
flashes a later phase before the boot starts.

### Phase timeline

Durations in ms, each divided by `SPEED` (fixed at 1):

| Phase | Duration | What happens |
|---|---|---|
| `dormant` | 1000 | Resting state; card at `scale(1/1.7)`, traces dead |
| `boot` | 700 | First faint glow, circuit drop-shadow appears |
| `flow` | **3250** | Traces energise in a cascade |
| `flicker` | 650 | Card + rim ignite together on one 0.62s flicker |
| `glow` | 750 | Steady at full brightness |
| `levitate` | 1500 | Card grows to `scale(1)`, shadow spreads, bob starts |
| `hold` | 1900 | Rests. Sets `booted = true`, arms the magnet, reveals the face |

`flow`'s duration is not a constant — it is computed as `igniteMs` so the phase
cannot end before the trace cascade does:

```
GAP = 500, CASC = 130
d_large   = 0        d_medium = 500     chipDelay = 1000
d_small   = 1500     d_right2 = 2000
d_pair    = 2130     then +130 each: d_c1 2260 … d_c4 2650
igniteMs  = max(all delays, chipDelay) + 600 = 2650 + 600 = 3250
```

Boot start → `hold` is therefore **6,850ms**.

**Start gate:** `animationend` on `.writelite-card`, with a 2,500ms
`setTimeout` fallback if that event is missed. Under
`prefers-reduced-motion` the whole timeline is skipped — `applyPhase('glow')`
plus `revealInstant()`, then an early return, which also makes the magnet
unreachable.

### The scale derivation

This is the part most likely to be broken by a well-meaning edit.

`LIFT = 1.7`, so `INV = 1 / 1.7 = 0.5882352941`.

The card's **box is its levitated size**. `.kaku-stage__lift` is `88.4%` of the
stage (`0.52 × 1.7 = 0.884`), which at 434px is ~384px. The card **rests
untransformed at `scale(1)`** and the boot runs the growth *upward* from
`scale(INV)`.

That direction matters for two reasons:

- **Text.** Resting untransformed means the face rasterises at 1:1 and stays
  crisp. Authoring the face against a scale rasterises it small and stretches
  it — that is what made it blurry before.
- **First paint.** `.kaku-card`'s base `transform` must be `scale(INV)`, not
  identity, or the card flashes at full size before the boot starts.

Because the card rests at levitated size, its decoration lengths are authored
there too — the dormant phase scales them back down to the originals:

| Property | Authored | ÷ 1.7 |
|---|---|---|
| `border-radius` | 23.8px | 14px |
| `border` | 1.7px | 1px |
| `box-shadow` blur | 74.8px | 44px |
| `box-shadow` offset | 37.4px | 22px |
| `__rim` blur | 40.8px | 24px |
| `__rim` spread | 3.4px | 2px |

`.kaku-stage__rim` is authored at the same levitated size and scaled by the same
inverse while dormant, so the card and its aura never drift apart.

### The card face

A dictionary entry, revealed as a second sequence on entry to `hold`. Four
beats:

1. **Unlit glyph fades in** — pure CSS, off `data-face="on"`.
2. **Entry text**, staggered: `__word` 500ms, `__pos` 620ms, `__gloss` 740ms.
   The 500ms start matches the glyph's own fade, so the entry begins as the mark
   lands.
3. **`building...` types**, one character per 75ms, starting 2,200ms after
   `data-face`. The caret appears and blinks via `data-typing="on"`.
4. **Glyph ignites** 400ms after the last character — fired from the end of the
   typing loop, never off a CSS delay, because only the JS knows when the last
   character lands. Shares the card's 0.62s boot-flicker duration so the two
   read as one electrical event.

End to end, the glyph ignites ~10,275ms after the boot begins.

**To replay the reveal in devtools:** toggle `data-face="on"` and then
`data-glyph="lit"` on `.kaku-card`.

Other face notes:

- The glyph is **floated, not absolute**, so the entry text runs beside it and
  then leaks underneath line by line, like a dictionary page. This is why
  `.kaku-card__face` must stay plain block flow — flex, grid or `overflow` all
  stop the float shortening the text's line boxes.
- The glyph is 144px, matching the size the WriteLite logo renders at, so the
  two marks read as a pair across the row.
- Type scale mirrors `.writelite-card`'s 46/20/16/14 so the cards read as one
  family. Only the headword sits under its twin (42 vs 46), because it shares
  its line with the 144px glyph.
- `.kaku-card__ipa` breaks onto its own line beneath the headword. `kaku` plus
  the pronunciation is wider than the column the glyph leaves, and the space
  between them is the only break opportunity — the dictionary setting is forced
  by the geometry rather than left to chance.
- `--k-lit` exists because `--acc` (`#1c4bd9`) is only ~1.8:1 on this face —
  fine for a big shape, hard to read as 28px text. The `building...` ink is
  lifted toward white while its `text-shadow` stays raw `--acc`. **The glyph
  does not use `--k-lit`:** it is a 144px mark, not text, and paints raw
  `--blue-kaku` so it matches the circuit nodes exactly.
- The glyph's `color` is deliberately **not** transitioned; the ignition
  keyframes own it. `--k-dead` is a token because those keyframes must name it.
- `.kaku-card__build` sits at `bottom: 100px` rather than on the padding, so the
  caret has room to blink without crowding the corner.

---

## Rune deck

Five stone layers that fan open from a collapsed monolith. `deck.js` computes
every layout transform; `styles.css` owns only the resting look.

### Fan maths

`N = 5`. Layers are 182px squares centred with `margin: -91px`. `openness` is
1 (fanned) or 0 (collapsed); `o = i − (N−1)/2` is a layer's signed offset from
the middle of the deck.

```
scene           rotateX(-58 · openness)  rotateZ(-45 · openness)
deck layer      translate3d(-o · 92 · openness,  o · 92 · openness, 0)
popped layer    rotateZ(45 · openness) rotateX(58 · openness)
                translate3d(0, 0, 320 · openness) scale(1 + 0.05 · openness)
```

The popped layer counter-rotates by the scene's exact inverse, which is what
turns it to face the viewer. Siblings dim to `opacity: 0.4`; all deck layers
fade to 0 when collapsed, leaving only the cover.

Stacking order, bottom to top: deck layers `0–4` → popped layer `60` → cover
`65` → detail slab `70` → toggle button `80`. The cover sits above the layers so
no fading card bleeds over it; the toggle sits above the slab so it stays
visible and clickable in **both** states.

The layers are `position: absolute`, so the stack has no natural size.
`--rune-width` (400px) and `--rune-stage` (380px, dropping to 320px under 720px)
reserve the box the fan spreads from. The box is transparent with
`overflow: visible`, so the open fan is allowed to spill past it — raise
`--rune-stage` if the fan starts reaching the label.

`--rune-width` is **declared on `.rune-column`**, not on the stack, so one token
sizes both the column's flex basis and the stage. `.rune-stack` reads it as
`var(--rune-width, 400px)`; the fallback covers the stack being used outside a
column.

### Fan extent

How far the open fan actually reaches, derived from the composed transforms
rather than eyeballed — it is what decides how much can sit above the deck. The
scene's `rotateX(-58°) rotateZ(-45°)` composed with each layer's
`translate3d(-o·92, o·92, 0)`, projected through `perspective: 2400px`:

- Layer centres land at `y = 68.95·o`, `z = -110.33·o` from the stage centre.
- Each 182px card spans `±68.2` in y and `±109.1` in z about its own centre.
- Highest point: `y = 206.1` at `z = -329.8` → `× 2400/2729.8` = **181px up**.
- Lowest point: `y = -206.1` at `z = +329.8` → `× 2400/2070.2` = **239px down**.

Against the 380px box's ±190px edges, the fan **clears the top edge by 9px and
overhangs the bottom by 49px**. The upward spill does not exist, which is why
`.rune-column`'s copy is safe above the box with any positive gap — but that 9px
is the whole margin. Shrinking `--rune-stage` below 380px pushes the fan out
through the top and into the copy.

The popped card projects to ~220px square (`z: 320px`, `scale 1.05`) and the
detail slab runs ~340px tall; both stay inside the box.

### State model

| Attribute | Values |
|---|---|
| `data-state` | `init` (collapsed) · `deck` (fanned) |
| `data-sel` | index of the popped layer, or `-1` |

- **Opening** has two entry points: the cover card, or the toggle button.
- **Collapsing** has one: the toggle button. Closing therefore has a single
  clearly labelled control.
- While fanned, clicks only pop or close an individual layer.
- Collapsed, CSS gives the cover `pointer-events: auto` and nothing else in the
  box has it, so the transparent margin stays inert. Fanned, the cover drops to
  `pointer-events: none` so it cannot swallow clicks meant for the layers
  underneath.
- A document-level click closes a popped layer, but clicks on `a`, `button`,
  `input`, `textarea`, `select`, `label`, `[role="button"]` and
  `[contenteditable]` are exempt so form controls keep working.
- The toggle's handler calls `stopPropagation`, or the container's layer-select
  handler would also fire and pick a layer.
- `.rune-stack__toggle-label` reserves `min-width: 72px` — the width of the
  longest caption, `COLLAPSE` — so the button centred above it does not shift
  when the label swaps.

### Icons

Icon files in `icons/` are the single source of truth. They are pulled in as a
**CSS mask**, not inlined: `--icon` supplies the shape,
`background: currentColor` fills it with the card's accent, and `drop-shadow`
adds the glow. That is what lets one file recolour per card.

Sizes: 60px on a deck face, 72px in the popped slab, 22px on the toggle button.

**To add an icon:**

1. Save a stroke-based SVG into `icons/`. It **must** be `fill="none"`
   `stroke="currentColor"`, or its shape will not mask cleanly.
2. Add its basename to `FILES` in `deck.js`.

It then inherits colour and glow with no per-icon CSS.

### Deck data

`FILES`, `COLS`, `NAMES`, `HEADS` and `BODIES` in `deck.js` are
**index-parallel** — one card is built from the same index across all five.
Reorder one and you must reorder all five, or a card gets another card's colour,
name or inscription.

Current order runs red (ember) first through green (origin) last — swapped from
the original demo, where green led.

---

## Contact form

Posts to splitforms.com; there is no backend.

- **Endpoint:** `POST https://splitforms.com/api/submit`, JSON.
- **Payload:** `access_key`, `botcheck` (honeypot — must stay empty), `source`,
  `name`, `email`, `topic`, `message`.
- The access key is a **public submit key** and is meant to ship in client-side
  code on a public static site.

**Validation** is client-side only: all four fields required, plus the browser's
own `checkValidity()` on the email input.

**States** are driven on the label `<span>`, never the button's `textContent` —
the latter would wipe the ripple `<span>` the click handler appends as a child.

| Outcome | Button | Status line |
|---|---|---|
| Submitting | disabled, `Sending…` | cleared |
| Success | stays disabled, `Sent ✓` | cleared |
| Failure | re-enabled, label restored | error shown |

Two coupling rules:

- The handler hooks the form's `submit` event, not the button's `click`, so it
  works with Enter and under reduced motion.
- The ripple handler **must not** `preventDefault` — the native submit has to
  reach the POST handler, which owns cancellation.

`fetch` only rejects on network failure. A bad key or a blocked domain returns a
non-2xx response, so `res.ok` is checked explicitly.

---

## Accessibility & reduced motion

- `:focus-visible` gives a global 2px accent outline at 3px offset. The radio
  chips get their own scoped ring because the real `<input>` is visually hidden.
- `.kaku-card__build` is `aria-hidden` so a half-typed string is never read out.
- The deck toggle tracks both `aria-expanded` and a stateful `aria-label`
  (`Expand`/`Collapse the deck`).
- `.rune-stack` and the kaku article carry `aria-label`s; the contact card is a
  labelled `<section>`.

Under `prefers-reduced-motion: reduce`:

- All transitions and animations are killed with `!important`, and
  `scroll-behavior` drops to `auto`.
- `.writelite-card` and its inner are pinned to `transform: none` so the card
  sits at its resting position — no off-screen fill, no glide, no tilt, no pull.
- `cards.js` and `contact.js` return before binding anything.
- `stage.js` jumps to `glow` and calls `revealInstant()`: face on, glyph lit, the
  full `building...` string present, and `data-typing="static"` so the caret sits
  lit rather than blinking.

---

## Editable content points

Marked `EDIT:` in `index.html`:

| Marker | What |
|---|---|
| `values-line` | The studio one-liner under the title |
| `wl-description` | WriteLite card body copy |
| `studio-intro` | Section title/copy for the "as a developer" pitch — TBD |
| `contact-heading` | Contact card heading — "Ask NEL about building your software" |
| `contact-fields` | The form's field set |

---

## Known quirks

Documented rather than changed — each is either harmless or carries a real risk
if "fixed" carelessly.

- **Unreachable magnet fallbacks.** Both magnets do
  `parseFloat(getComputedStyle(el).getPropertyValue('--range')) || 24`. The CSS
  always sets `--range: 24` / `--pull: 5`, so the fallback can never fire.
  `cards.js` and `stage.js` carry the same values. It is kept rather than
  stripped because of how it fails: with the tokens missing, `parseFloat('')`
  returns `NaN`, the `edge >= range` guard stops firing (every comparison with
  `NaN` is false), and the emitted `translate(NaNpx,NaNpx)` is silently dropped
  by the CSSOM — the pull would die with no error and no visible breakage. The
  fallback makes that degrade to working behaviour instead.
- **`--glide-delay`** is read with a `0ms` fallback and never set. Stagger hook
  for a second product card. This is a *consumed* variable with no definition,
  which is not the same thing as an unused definition — don't "clean" it away.
- **`.kaku-card__build`** previously carried a comment deriving its position from
  a 38px font size; the actual `font-size` is 28px. The arithmetic was stale, so
  only the intent (a deliberate tail of space below the line) is recorded above.
