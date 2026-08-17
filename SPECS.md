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
| `scripts/cards.js` | WriteLite card magnet/tilt + the first-paint `body.ready` gate |
| `scripts/contact.js` | Submit-button magnet/ripple + the form's POST |
| `scripts/packages.js` | The three package decks' content — face cards and layer cards |
| `scripts/deck.js` | Client package decks |
| `scripts/stage.js` | kaku |
| `scripts/grid.js` | Cursor feed for the background grid glow |
| `icons/` | Deck icons: `analytics`, `architecture`, `debugging`, `design`, `human`, `reset` |
| `icons/wl_logo.svg` | WriteLite mark (`<img>`) |
| `icons/kaku_logo.svg` | Source for the kaku glyph, which is **inlined** into `index.html` |

Scripts load as classic `defer` in `<head>`, in the order the inline blocks used
to run: `cards.js`, `contact.js`, `packages.js`, `deck.js`, `stage.js`, then
`grid.js`. `grid.js` shares no state with the others, so its position is free.

Four constraints on that arrangement:

- **`packages.js` must precede `deck.js`.** It defines `window.PACKAGE_DECKS`,
  which `deck.js` reads at run time; deferred scripts execute in document order,
  so the line's position is the whole guarantee. Reversed, every deck warns and
  builds nothing. It is a single global rather than an IIFE because with no
  build step and classic scripts there is no other way to hand data across, and
  a data-only file has nothing to encapsulate.

- **Not `type="module"`.** Modules fail under `file://` because of CORS, which
  would break local preview of the whole page. Nothing imports anything.
- **The pre-paint theme lock stays inline** in `<head>`. Its whole job is
  setting `data-theme` before first paint; an external file would put a network
  round-trip in front of first paint to save three lines.
- **`getComputedStyle` is safe.** Both magnets read `--range` / `--pull` off
  their element. A pending stylesheet blocks script execution, so the CSSOM is
  populated before any deferred script runs.

`stage.js` gates kaku's boot on an `animationend` from `.writelite-card`, whose
glide is 2.2s. Every script runs in the same tick, far ahead of that, and
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
`.package-deck[data-state="init"] .package-deck__cover` beats `.package-deck__cover`.

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
(amber `#d4a030`), `.kaku-stage` (kaku blue), `.package-deck` (per-card accents),
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

The widest row is the packages row at **1337px**, and it is the width the footer
is anchored to. The other two rows are narrower and simply centre inside it:

```
packages:  377 (package) + 103 gap + 377 + 103 gap + 377 = 1337
contact:   598 (contact card), alone and centred
software:  564 (WriteLite)  + 36 gap + 434 (kaku stage) = 1034
```

A package column is not just its deck — it also reserves the lane its toggle
sits in:

```
package column:  40 (toggle lane) + 17 (lane → stage) + 320 (stage) = 377
```

The rows no longer share edges, and that is a deliberate trade, not an
oversight. Moving the toggle to the deck's centre-left made 1034px
unreachable: the open fan is ~298px wide and spans x=11→309 inside the 320px
stage (§Fan extent), and it is widest at exactly mid-height, so there is no
free space *inside* the column for the button. Even an icon-only 40px lane puts
three columns at 1119px before any gap. Neither of the other two rows can reach
1337px without being redesigned — contact is a single 598px card, and software
would need a 339px gap tearing WriteLite away from kaku — so they keep their
own widths.

The packages row is also the one place the shared 36px `.grid` gap does not
hold. `#packages .grid` overrides to **103px**, which does two jobs: it lands
the row on 1337, and it makes each toggle unambiguously the *right-hand* deck's
— 114px from a fan to the neighbouring button against 28px to its own, a 4×
difference that reads in either scanning direction. Column and gap are a pair:
change one and re-derive the other against 1337.

Because the lane is *inside* the column, no button overhangs the row at any
width. That permanently retires the clipping bug the old right-hand toggle had
(§Client packages).

320px decks came from the row being 1034px (`3×320 + 2×37`); before that they
were 400px, from when a single deck shared the row with the contact card
(`400 + 36 + 598 = 1034`). The stage stayed 320px through the move to 1337 —
the row grew to fit the toggles, not the decks.

`.contact-card` keeps its 598px — the width it was derived at — and now centres
in its own row rather than sitting beside the deck. Every card uses
`flex: 0 0 <n>px` with `max-width: 100%`, so they never grow or shrink to fill
— they only shrink when the viewport is narrower than the card.

`.foot` uses `padding-inline: max(0px, (100% - 1337px) / 2)` to anchor the
footer text to the packages row, reproducing exactly what flex centring leaves
at each side. Below 1337px it floors at 0.

### The 1336px step

`#packages .grid` drops its gap to 37px below 1337px, giving
`3×377 + 2×37 = 1205`. Without it every viewport under 1337px — a 1280px laptop
included — would wrap the three decks into a vertical stack. Inside that step
each toggle sits 48px from the neighbouring fan against 28px from its own:
tighter than the 4× at full width, still readable.

The footer carries **no top border**. It had a `1px solid var(--line)` rule from
before the glowing grid background existed; against a page that is already ruled,
a hairline across it read as a stray grid line. Its only separation now is its
`padding-block: 23px`. `--line` is still used by `.toggle`, so the token stays.

`.writelite-card { margin-top: 25px }` drops the card so its top meets the kaku
chip's top: the chip is centred in the 434px stage at 384px, so its top sits
`(434 − 384) / 2 = 25px` below the row top. The 720px media query zeroes it,
because stacked there is no kaku beside it to align to.

### Section gaps

`.section` is `40px` top / `27px` bottom. Where two sections meet, the gap is
the sum of both paddings — `27 + 40 = 67px`. Document order is `#packages`,
`#contact`, `#software`. To tune *only* the packages → contact gap without
touching hero → packages or contact → software, `#packages` sets its own end and
`#contact` its own start; every other boundary stays at the default `67px`.

That gap is **90px** (`50 + 40`), and unlike the rest of the vertical rhythm it
is derived, not chosen. An open fan overhangs its box's bottom edge by 49px
(§Fan extent), so 90px leaves `90 − 49 = 41px` of air above the contact card.
The earlier value was `13.5px`, giving 53.5px total and just 4.5px of clearance —
tight enough that an open deck all but touched the card below it.

`#packages .grid` adds `margin-top: 40px` alongside its 103px gap. With the
toggles out of normal flow, that is now the gap from the lede to the *stage
box*; the fan's highest point is 9px inside that box, so the real clearance is
49px. It no longer sets `align-items: flex-start` — that
existed to stop the deck column and the contact card stretching to each other's
height, and with three identical siblings there is nothing left for it to
prevent.

`.package` carries `align-self: stretch`, so every column takes the flex
line's cross-size and the decks stay level however tall the tallest column
grows. With nothing but a deck in each column that is currently inert, as are
the auto block margins on `.package .package-deck`; both are kept because they
are exactly what the package copy still to come will need. Below 1205px the row
wraps, each item gets its own line, and the stretch becomes a no-op.

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

## Client packages

Three packages, one deck each: a stack of stone layers — five today — that fans
open from a collapsed face card. `packages.js` holds every deck's content,
`deck.js` computes every layout transform, and `styles.css` owns only the
resting look.

The packages are `design`, `website` and `app` — left to right — carried on
`data-package` on each `[data-deck]` root. That attribute is the **key** each
deck's content is looked up by in `packages.js`, and it is what makes three
otherwise identical markup blocks self-identifying. Rename one and the deck it
names goes blank (§Deck data).

### Face card

The collapsed card is `.package-deck__cover`. Its markup is three empty spans in
`index.html`; `deck.js` fills them from `packages.js`'s `face` block for this
deck, before it builds anything else. It is a centred flex column of three parts:

| Part | Class / hook | Type |
|---|---|---|
| icon | `__cover-icon` / `[data-cover-icon]` | 40px masked glyph, `reset` on all three for now |
| title | `__cover-title` / `[data-package-title]` | 17px Public Sans 600, `text-wrap: balance` |
| prompt | `__cover-sub` / `[data-cover-sub]` | 9px Space Grotesk, uppercase, 2px tracking, 0.65 alpha |

The face's accent is `--lc`, set to `var(--blue-fill)` in `styles.css` — the
site blue all three currently use. `deck.js` overwrites it **only** when that
package declares `face.col`, so a deck's face can be recoloured on its own
without touching CSS.

`deck.js` also writes the deck's own `aria-label` (`"<title> package"`) from the
same title, so the accessible name of the deck, the toggle and the visible card
all come from one string.

Titles are **Design My Idea**, **Personal Website**, **Desktop & Mobile Apps**.
The 17px title is what keeps the longest of those to two lines inside the 182px
card's 154px of text width; the height budget is roughly
`40 + 8 + 42 + 8 + 12 = 110px` of 182. The glow (`text-shadow`) sits on the title
alone, so the prompt stays quiet.

The title also **names the toggle**: `syncToggle` reads
`[data-package-title]`'s text back out of the DOM to build `aria-label`. That is
why the face is populated first — the name exists once, in `packages.js`, and
cannot drift out of sync with the button.

### Fan maths

`N` is the deck's own card count — `cards.length`, currently 3 (design), 4
(website) and 7 (app). Layers are 182px squares centred with `margin: -91px`.
`openness` is 1 (fanned) or 0 (collapsed). Each layer's `m` and `k` come from
`FAN[N][i]`, the fan table at the top of `deck.js`.

```
scene           rotateX(-58 · openness)  rotateZ(-45 · openness)
deck layer      translate3d(-m · openness,  m · openness, 0)
                scale(1 + (k − 1) · openness)
popped layer    rotateZ(45 · openness) rotateX(58 · openness)
                translate3d(0, 0, 320 · openness) scale(1 + 0.05 · openness)
```

**Why the fan needs a table at all.** It runs into the screen, not across it:
composed with the scene's rotation, an offset of `m` puts a layer's centre at
`z = −1.1993 · m`, which `perspective: 2400px` then projects. Two artifacts
follow, both growing with the card count — cards further down the fan render
smaller, and their centres bunch together. Uncorrected on the seven-card app
deck that was a 32% size spread and gaps of 88px at the top against 55px at the
bottom, which reads as a bug rather than as depth.

`m` is therefore **not** a plain multiple of 92: it is pre-compensated so the
*projected* centres land on an even 68.9465px step, and `k` cancels the
foreshortening at that depth so every card renders at a true 182px. The
`openness` factor takes `k` to 1 when collapsed, where the cards are stacked at
z = 0 and there is nothing to cancel.

The table is **hardcoded rather than computed**, deliberately. The formula is a
rational function of `o` whose constants have to be derived by hand off-line;
inlined, it put four magic numbers in the layout path and hid where they came
from. Precomputing puts the values where they can be read and this file where
they can be explained. Card counts are stable, and a count with no row degrades
to even 92px offsets with a console warning rather than failing silently.

To generate a row (rounding `m` to 1dp and `k` to 4dp is precise enough — worst
size error 0.005%, worst gap deviation 0.045px):

```
KY   = cos(58°)·√2 = 0.749419     world y per unit m
KZ   = sin(58°)·√2 = 1.199321     world −z per unit m
step = KY · 92     = 68.9465      target projected spacing

o = i − (N−1)/2
m = step·2400·o / (KY·2400 − step·KZ·o)
k = (2400 + KZ·m) / 2400
```

Odd counts share one grid — the 3-card row is exactly the 7-card row's middle
three. An even count puts `o` on half-steps, so the 4-card website deck sits
between those positions. That is inherent to even counts, not a discrepancy.

The popped layer counter-rotates by the scene's exact inverse, which is what
turns it to face the viewer. Siblings dim to `opacity: 0.4`; all deck layers
fade to 0 when collapsed, leaving only the face card.

Stacking order inside the deck, bottom to top: deck layers `0…N−1` → popped
layer `60` → face card `65` → detail slab `70`. The face card sits above the
layers so no fading card bleeds over it. The toggle is in this context too but
needs no z-index: it is positioned outside the stage box, where nothing else
paints.

The page carries **three decks**, each with its own content. `deck.js` runs its
`initDeck` once per `[data-deck]`, the `.package` column; each run resolves that
deck's entry from `packages.js`, then injects its own layers and keeps its own
state on its deck's dataset. Nothing about the content is shared between decks —
`cards`, `N`, `fan` and the face are per-deck closure values. See §State model.

A deck may hold any card count: `N` comes from the array. But **the geometry no
longer follows for free** — a count needs its own `FAN` row, or the deck falls
back to even 92px offsets and renders with the size and spacing artifacts the
table exists to remove. `deck.js` warns on the console when that happens. Adding
a card to `packages.js` therefore means adding a row here too; the recipe is
above.

Each extra card extends the fan by `68.9465px` of projected `y` in both
directions, evenly — that is now exact rather than approximate, which is what
lets §Fan extent's reach follow the card count directly.

The layers are `position: absolute`, so the stack has no natural size.
`--package-width` (320px) and `--deck-stage` (380px, dropping to 320px under 720px)
reserve the box the fan spreads from. The box is transparent with
`overflow: visible`, so the open fan is allowed to spill past it.

`--package-width` is **declared on `.package`**, not on the deck, so one token
sizes both the column's stage and (with the toggle lane added) its flex basis.
`.package-deck` reads it as `var(--package-width, 320px)`; the fallback covers
the deck being used outside a column.

### Where the toggle sits

`.package-deck__toggle` is absolutely positioned at its deck's **centre-left**:
`top: 50%` with a `translateY(-50%)`, offset left by
`--toggle-lane + --toggle-gap` = `40 + 17 = 57px`. Both tokens are declared on
`.package`, which also carries them as `padding-inline-start`, so the button
lands in a lane the column has actually reserved rather than in its neighbour's
space. The 17px gap becomes 28px of *visible* air, because the fan stops 11px
inside the stage's left edge (§Fan extent).

Visible is the operative word: that air never protected the button from clicks.
The scene's own box reaches ~90px past the deck on each side once rotated, so it
sat over the whole button and the click landed on the scene — which bubbles into
the layer-select handler and pops a card. The button carries `z-index: 80` and
the scene `pointer-events: none` for exactly this. See §Fan extent.

It is a child of `.package-deck`, not of `.package`. Anchoring it to the column
would centre it correctly only while the column holds nothing but a deck — the
per-package copy still to come sits above the deck and would drag the button off
centre. Anchored to the deck, it is right in both states.

That placement is why the button's handler **must** call `stopPropagation`: it
now sits inside the element whose click handler selects layers. See §State
model.

The button is **icon-only** — `aria-label` is its whole accessible name. It
previously carried a visible EXPAND/COLLAPSE caption below it, reserving 72px so
the button would not shift when the word swapped. That 72px would have set the
lane instead of the 40px button: columns of 409px and a row of 1433px. Dropping
the caption buys back 96px of row.

Two earlier placements, both retired: `right: -24px` outside the stage box, from
when one deck sat at the left of the row and had the interior gutter to itself —
with three decks the rightmost button overhung the row and was clipped silently
by `body`'s `overflow-x: hidden` between roughly 1034px and 1082px. Then above
the deck in normal flow, centred, which was safe but spent ~65px of column
height. The current lane sits inside the column, so it cannot overhang at any
width.

### Fan extent

How far the open fan actually reaches, derived from the composed transforms
rather than eyeballed — it is what decides how much can sit above the deck. The
scene's `rotateX(-58°) rotateZ(-45°)` composed with each layer's
`translate3d(-o·92, o·92, 0)`, projected through `perspective: 2400px`:

- Layer centres land at `y = 68.95·o`, `z = -110.33·o` from the stage centre.
- Each 182px card spans `±68.2` in y and `±109.1` in z about its own centre.
- Highest point: `y = 206.1` at `z = -329.8` → `× 2400/2729.8` = **181px up**.
- Lowest point: `y = -206.1` at `z = +329.8` → `× 2400/2070.2` = **239px down**.

Horizontally the same projection is far tamer, because the layer *centres* land
on a purely vertical axis — `rotateZ(-45°)` maps `(-92o, 92o)` to `x = 0`. All
the width comes from each card's own rotated footprint: `0.7071 × 182 = ±128.7`,
at worst-case perspective `2400/2070.2` → **±149px, ~298px across**. That is
what lets three decks sit in 320px boxes without their open fans meeting — and
it is also why the toggle cannot live inside the box: those ±149px are reached
at exactly the mid-height where the button sits, leaving 11px of free stage on
each side.

Against the 380px box's ±190px edges, the fan **clears the top edge by 9px,
overhangs the bottom by 49px, and stops 11px inside each side**:

- **The 11px at the sides** is the only air between the fan and the toggle; the
  lane's 17px gap sits on top of it for 28px. Widen the fan and the button gets
  covered — see §Where the toggle sits.

**Superseded — every figure above predates the fan table** (§Fan maths) and
describes a five-card deck whose cards varied in size and spacing. No deck works
that way now. Corrected reach, which follows the card count directly because the
spacing is uniform:

- **Vertical** ≈ `±(68.9465 · (N−1)/2 + 68)` — about ±137 (3 cards), ±171 (4),
  ±275 (7). Symmetric, replacing the asymmetric 181-up / 239-down above.
- **Horizontal** `±128.7`, uniform, replacing the worst-case `±149`.

The `≈` is honest rather than cautious: `k` corrects each card at its centre, not
per corner, so a card keeps a slight internal keystone — a few px on the
outermost app card, and present before the table too.

The rest of this section, and the figures §Where the toggle sits quotes from it,
have not been re-derived. Both err in the safe direction: the fan is narrower
than they claim, so the toggle has more air than the 11px stated, not less.

All of the above is the reach of the **cards**. The scene that carries them is a
different shape: a 320×380 box, wider and taller than the fan inside it, rotated
by the same transform. Its hit-test quad measures ~495px across against the
deck's 320 — roughly 90px of overhang on each side, over the toggle's lane. It
paints nothing, so this is invisible until a click disappears into it; hence
`pointer-events: none` on the scene and `auto` back on the layers. A transform
moves an element's hit target, not only its pixels, and an empty box is still a
box.
- **The 49px below** is why `#packages` carries a 50px block end rather than the
  13.5px it had while the row was the deck's alone. See §Section gaps.
- **The 9px above** is now only clearance from the lede (49px with the grid's
  `margin-top`). It stopped being load-bearing when the toggle left the column's
  normal flow.

The popped card projects to ~220px square (`z: 320px`, `scale 1.05`), well inside
the box. The detail slab is **not** bounded by it — see §The detail slab.

### The detail slab

`.package-deck__detail` is the inscription that opens in front of the deck when a
layer is popped. Its height is content-driven — however tall that card's `body`
in `packages.js` makes it — and its **width is solved to match, so the slab reads
as a square**. Copy length is therefore the only size control; there is no
per-card width to set.

The solve lives in `deck.js` (`sizeDetail`, called from `updateDetail` once the
copy is in the DOM and before the slab fades up) rather than in CSS, because CSS
cannot derive an inline size from a content-driven block size: `aspect-ratio`
resolves the other way — with both axes auto it sizes the width from content
first and derives the height — which on an absolutely-positioned box gives one
long line of text.

It bisects on width, 8 halvings between a 200px floor and the cap, measuring
`offsetHeight` each step. Bisection rather than a fixed-point loop because
`height(width)` decreases as width grows, so `width − height` is monotonically
increasing and halving converges, where feeding the measured height straight back
in can bounce between two values indefinitely. `offsetHeight` is deliberate: it
ignores the slab's `scale` transform, which `getBoundingClientRect` would not.

The cap is the stylesheet's `max-width: min(440px, 92vw)`, which `sizeDetail`
reads back through `getComputedStyle` — one source for the number, and the `92vw`
term follows for free on narrow viewports. Past the cap the slab stops widening
and simply grows taller.

At 440px the slab is 60px wider than the 320px stage on each side and **covers
the toggle button**. That is intended: only one layer on the whole page can be
popped at a time (§State model), and clicking the slab closes it before the
toggle is needed again. At the 1336px breakpoint's 37px gap, neighbouring stage
centres sit 414px apart, so a 440px slab still stops ~194px short of the next
deck's fan.

### State model

| Attribute | Values |
|---|---|
| `data-state` | `init` (collapsed) · `deck` (fanned) |
| `data-sel` | index of the popped layer, or `-1` |

- **Opening** has two entry points: the face card, or the toggle button.
- **Collapsing** has one: the toggle button. Closing therefore has a single
  clearly labelled control.
- While fanned, clicks only pop or close an individual layer.
- Collapsed, CSS gives the face card `pointer-events: auto` and it sits above the
  stacked layers, so it is what a click in the centre lands on; the transparent
  margin around it stays inert. Fanned, it drops to `pointer-events: none` so it
  cannot swallow clicks meant for the layers underneath. Either way the handler
  ignores everything but `[data-cover]` while collapsed.
- All of it is **per deck**. Each deck's scope root is `[data-deck]`, the
  `.package` column; `initDeck` finds the face-card title there and everything
  else — including the toggle — on the inner `[data-deck-stack]`. State lives on
  that deck's dataset, never in a variable shared between decks, so opening one
  leaves the other two alone.
- A document-level click closes a popped layer, but clicks on `a`, `button`,
  `input`, `textarea`, `select`, `label`, `[role="button"]` and
  `[contenteditable]` are exempt so form controls keep working. That listener is
  bound once per deck, each closing over its own container: a click in deck B is
  "off the deck" for deck A, which is what closes A's popped card.
- The toggle's handler calls `stopPropagation`, and since the button moved
  inside the deck this is **required, not defensive**: without it a click on the
  toggle bubbles into the container's layer-select handler, which would pop a
  card on the way past. It also spares the document-level click-away, though
  that already skips the toggle via its `container.contains` guard and its
  `button` exemption.
- The toggle's `aria-label` is built from `[data-package-title]`'s text, which
  `deck.js` has already written from `packages.js`, so the package name lives
  once and the button's accessible name cannot drift from it.

### Icons

Icon files in `icons/` are the single source of truth. They are pulled in as a
**CSS mask**, not inlined: `--icon` supplies the shape,
`background: currentColor` fills it with the card's accent, and `drop-shadow`
adds the glow. That is what lets one file recolour per card.

Sizes: 60px on a deck face, 72px in the popped slab, 40px on the face card,
22px on the toggle button.

**To add an icon:**

1. Save a stroke-based SVG into `icons/`. It **must** be `fill="none"`
   `stroke="currentColor"`, or its shape will not mask cleanly.
2. Put its basename in a card's `file` (or a face's `icon`) in `packages.js`.

It then inherits colour and glow with no per-icon CSS.

### Deck data

All package copy lives in `packages.js`, in `window.PACKAGE_DECKS` — one entry
per package, keyed by the deck's `data-package` value. `deck.js` holds no copy.

```
PACKAGE_DECKS[key] = {
  face:  { icon, title, sub, col? },        // col optional — see §Face card
  cards: [ { file, col, name, head, body }, … ]
}
```

Each card is **one self-contained object**, so a card can be edited, reordered
or removed on its own. This replaced five index-parallel arrays, where reordering
one and not the other four silently gave a card another card's colour or text.

`file` and `face.icon` are basenames in `icons/`, without the extension. `col`
becomes the layer's `--lc` and, when it is popped, the slab's `--rc`. `name` is
the layer's tag and, uppercased, the slab's `// NAME` line.

An **unknown or missing key** makes that deck build nothing and log
`deck.js: no card data for data-package="…"`. `initDeck` returns before binding
any listener, so the deck is inert rather than half-wired: a mistyped key shows
as an empty deck plus a console warning, never as another package's cards.

Card order runs red (ember) first through green (origin) last — swapped from
the original demo, where green led. The three sets are identical copy for now;
they are independent data and diverge as soon as one is edited.

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
- The deck toggle is icon-only, so its `aria-label` is its whole name. It tracks
  both `aria-expanded` and a stateful, per-package label — `Expand`/`Collapse
  the <package> package`, built from the face-card title.
- `.package-deck` carries its package name as an `aria-label`; the kaku article
  has one too, and the contact card is a labelled `<section>`.

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
| `packages-heading / packages-lede` | Packages section title + intro paragraph |
| `wl-description` | WriteLite card body copy |
| `contact-heading` | Contact card heading — "Ask NEL about building your software" |
| `contact-fields` | The form's field set |

The package decks are the exception: their copy is data, not markup. Each deck's
`EDIT:` marker in `index.html` points at `packages.js`, where the face card and
every layer card for all three packages live (§Deck data).

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
