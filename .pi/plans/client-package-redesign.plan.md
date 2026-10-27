# Client packages → process + services + packages

## 1. Intention (Nel)

Replace what is presented as packages/services on the site. The whole job lives in the
current `#client-package` area. `#studio-intro`, `#software`, hero and footer stay untouched.

Five components replace the existing two shells:

- **1 process card** — one card, three internal columns (Idea → Design → Build), purple accent.
  It must be exactly as wide as the two columns beneath it — no wider.
- **2 small packages** — Consultation, Basic Design — one row, build-blue accent, equal height
  (shorter grows to the taller).
- **2 big packages** — Website, Desktop/Mobile — next row, same columns as the row above,
  build-blue accent, two-column internals (includes on the left).

Locked decisions from check-in: three sibling sections (`#process`, `#client-services`,
`#client-packages`) · **no section titles** (cards carry their own headings) · big packages use
the existing two-column split · all four package cards blue (`--blue-fill`) · arrows reuse the
existing CSS `→` bridge (flips to `↓` at ≤720px) · `prompt.md` copy shipped **with typos fixed** · `data-offer` accent hooks renamed to
`data-accent="purple|blue"` · card glyphs human / design / website / app.

## 2. Layout

```
≥720px  — every row capped at 1337px by .client-package__shell, 16px between cards

#process
┌────────────────────────────────────────────── 1337px ─────────────────────────────────┐
│ ▸ purple #b06bff border + glow                                                         │
│  ┌──────────────┐   →   ┌──────────────┐   →   ┌──────────────┐                        │
│  │ 💡 Idea      │       │ ▣ Design     │       │ ▦ Build      │   3 equal cols         │
│  │ idea.svg     │       │ brief.svg    │       │ prototype.svg│                        │
│  │ lede         │       │ lede         │       │ lede         │                        │
│  │ • bullets    │       │ • bullets    │       │ • phases     │                        │
│  │ ▸ results    │       │ ▸ results    │       │ ▸ ongoing    │                        │
│  └──────────────┘       └──────────────┘       └──────────────┘                        │
└────────────────────────────────────────────────────────────────────────────────────────┘

#client-services   (same 1337px total → each card 660.5px, same width as today)
┌──────────────── 660.5px ────────────────┐ ┌──────────────── 660.5px ────────────────┐
│ Consultation            $89 per hour    │ │ Basic Design                      $200  │
│ stone card, --blue-fill border + glow   │ │ stone card, --blue-fill border + glow   │
│ lede / bullets                          │ │ lede / bullets / build-brief outcome    │
└─────────────────────────────────────────┘ └─────────────────────────────────────────┘

#client-packages   (identical columns to #client-services)
┌─────────────────────────────────────────┐ ┌─────────────────────────────────────────┐
│ Website          starting from $500     │ │ Desktop / Mobile   quoted per build     │
│  LEFT: Basic package list               │ │  LEFT: A Build includes                 │
│  RIGHT: Extras (quoted to spec)         │ │  RIGHT: Extra / on-going costs          │
│         Not included                    │ │         On-going maintenance options    │
│                                         │ │         Not included                    │
└─────────────────────────────────────────┘ └─────────────────────────────────────────┘

≤720px — every row becomes one column (existing .client-package__offers behaviour),
         process card's internal 3 columns also stack, bridges → "↓".
```

## 3. Reuse map (this is why the diff is mostly markup)

| New role | Existing piece reused | Note |
|---|---|---|
| Row width cap 1337px | `.client-package__shell` | keeps the process card level with the pairs below |
| Row centring (1337px column) | generic `.grid` (`justify-content: center`) | kept inside each section — today's centring lives in the `#client-package .grid` rule that step 5 deletes |
| Row of 2 cards / equal height | `.client-package__offers` (`flex`, `align-items: stretch`, `gap: 16px`) | already makes the pair equal-height |
| Card sizing | `.client-package__offers > .client-package__offer` (`flex: 1 1 0`) | unchanged |
| Stone card + accent border/glow | `.client-package__offer--detail` + accent hook | see step 1 for the rename |
| 3 process columns | `.client-package__offer-cols` / `__offer-col` | already a flex row, 16px gap |
| Arrow | `.client-package__bridge` + `::before "→"` | `↓` override already exists at ≤720px |
| Head (icon + name + price) | `.client-package__offer-head` / `__offer-titles` / `__offer-name` / `__offer-price` | unchanged |
| Body type | `__lede`, `__label`, `__list`, `__wrap` | unchanged |
| Icons | `.glyph` + `--icon: url(...)` mask | `icons/idea.svg`, `brief.svg`, `prototype.svg` all present |

No new colours, no new fonts, no new tokens. No JS change — confirmed nothing in
`scripts/` touches the client-package DOM or `data-offer`.

## 4. Steps

### Step 1 — Accent hook rename (`index.html` + `styles.css`)

**What:** the stage hooks `[data-offer="design"]` / `[data-offer="build"]` carry *colour*, and
after this change "design"/"build" no longer describe the cards (the Website package is a build
package; the process card is the purple one). Rename the attribute to `[data-accent="purple"]`
and `[data-accent="blue"]` and update the six rules that read it (lines ~766, 771, 776, 781,
813, 814).
**Why:** markup that says `data-offer="design"` on a Website package will mislead the next
reader; the rename is mechanical and has no JS/anchor dependency.
**Risk:** low — grep-verified single consumer (the stylesheet). Miss one selector and a card
loses its border colour; visible immediately.
**Confirmed:** rename approved, so the misleading attribute does not survive this change.

### Step 2 — Three sections replace the one `#client-package` section (index.html)

**What:** delete the whole `#client-package` section (opens line 61, closes just above the
`#studio-intro` comment) and write three sections in the same spot, in this order: `#process`, `#client-services`, `#client-packages`, each
`<section class="section" id="…"> > .wrap > .grid > .client-package__shell > .client-package__offers`.
No `__heading` / `__title` row above any of them (locked).
**Why:** the three rows are independently scannable and the section rhythm comes free from
`.section` padding.
**Risk:** the old `#client-package` id disappears. Confirmed nothing links to it
(no `href="#"` anchors in the page, no JS reference). The `.grid` div must be kept in each
section — it is what centres the 1337px shell (generic `.grid` `justify-content: center`).
Today's centring lives in the `#client-package .grid` rule that step 5 deletes; without a
`.grid` in the DOM, the rows would sit left-aligned on wide screens and the footer (which
anchors to the 1337px column) would misalign.
**Note:** row gap becomes the site's standard section rhythm — 67px on desktop (27px + 40px),
60px at ≤720 (the ≤720 block already trims `.section` padding-block-end to 20px) — replacing
today's 72px / 48px numbers. Approved — no extra gap rule.

### Step 3 — Process card (index.html)

**What:** inside `#process`, a single `<article class="client-package__offer
client-package__offer--detail" data-accent="purple">` containing `.client-package__offer-cols`
with three `.client-package__offer-col` blocks (`Idea` / `Design` / `Build`, glyphs `idea.svg`,
`brief.svg`, `prototype.svg`) and two `<p class="client-package__bridge" aria-hidden="true">`
between them. Each column: head → lede → bullets → outcome line.
**Why:** one purple card, three columns, exactly shell-width (1337px), as approved.
**Risk:** `.client-package__lede` is hard-capped at `calc((100% - 16px) / 2)` (a measure built
for the split build cards) — inside a process column that would render at half the column width.
Fixed in step 6. Headings become `h3` (see step 7).

### Step 4 — Services row + packages row (index.html)

**What:** `#client-services` gets Consultation ($89 per hour) and Basic Design ($200) as two
`data-accent="blue"` detail cards; `#client-packages` gets Website (starting from $500) and
Desktop / Mobile (quoted per build), each with `__offer-cols` → left column = the includes group,
right column = extras / maintenance / not-included groups, and a head glyph per card (§5).
**Why:** straight reuse of today's Build card anatomy.
**Risk:** Desktop/Mobile has four label groups against Website's three, so its right column runs
taller; equal-height cards mean the Website card grows to match. That is the intended behaviour
(stretch), but it will look like extra bottom padding on the shorter card — check it visually.
`__wrap` labels are the warm `#ffb27a` accent already used for "extra / not included".

### Step 5 — Dead row-title CSS + the stale doc reference

**What:** remove `.client-package__heading`, `.client-package__title`,
`.client-package__title-icon`, `#client-package .grid` (with the `/* Stacked shells, 72 desktop /
48 below 720 … */` comment above it), and the `#client-package .grid { gap: 48px }` line in the
≤720px block. Also update the AGENTS.md Sections line that names `Client packages
(#client-package)` to the three new section ids — doc only, no rendering impact.
**Why:** nothing renders them after step 2; leaving them is dead weight that reads as live
structure. The AGENTS.md line would otherwise point at an id that no longer exists.
**Risk:** none if step 2 landed — verify by grepping the class names after editing.
`icons/website.svg` and `icons/app.svg` survive by moving to the big cards’ heads (§5).

### Step 6 — Four small CSS deltas (styles.css, section 7)

**What:**
1. `#process .client-package__lede, #client-services .client-package__lede { width: 100%; }` —
   cards/columns with no internal split get a full measure.
2. `#process .client-package__offer-cols { align-items: stretch; }` — the three columns match
   height so the two bridges sit centred against a level block.
3. `@media (max-width: 720px) { #process .client-package__offer-cols { flex-direction: column; } }`
   — three columns cannot survive 720px; the existing global bridge override flips them to `↓`
   automatically.
4. Update the section 7 header comment ("Website | Apps offer cards") and the bridge comment
   ("between Design and Build") so they describe what the classes do now.
**Why:** this is the whole styling cost of the redesign.
**Risk:** `#process` id selectors beat the class selectors by specificity, so no `!important`
needed; both must stay inside the load-bearing ordering (media blocks last).

### Step 7 — Copy and heading levels (index.html)

**What:** copy comes from `prompt.md` — process block, `## Basic Design Package $200`,
`## Consultation $89 per hour`, `## Website`, `## Desktop/Mobile`. The file is the single
source of the text: fix its spelling/grammar errors as you transcribe (several remain in the
file, including in the Desktop/Mobile block) and do not reproduce them on the site.
Card names become `<h3 class="client-package__offer-name">` (was `h4`) and process step headings
`<h3>`: with the row titles gone there is no `h3` above them, and the current `h4` would be an
orphan level. `.client-package__offer-name { font: inherit }` so the level change is
non-visual. Bridges keep `aria-hidden="true"`.
**Why:** keeps the doc outline honest; keeps the approved source of copy in one place.
**Risk:** `prompt.md` stays as the source file and still contains the typos — it is not part of
this change. Say the word if you want it corrected too.

## 5. Card glyphs (decided)

| Card | Glyph |
|---|---|
| Consultation | `icons/human.svg` |
| Basic Design | `icons/design.svg` |
| Website | `icons/website.svg` |
| Desktop / Mobile | `icons/app.svg` |

Process steps keep the icons you named: `idea.svg`, `brief.svg`, `prototype.svg`.
`website.svg` / `app.svg` move from the deleted row titles to the card heads, so nothing in
`icons/` becomes orphaned. `human.svg` is already used (studio-intro title) and masks cleanly.

`design.svg` is unused today, so it is unverified in the `.glyph` mask: it has 6 `stroke="black"`
paths **and 2 `fill="black"` paths**. Filled shapes still mask (the mask reads alpha), but the
CSS comment states the house rule as stroke-based-only, so eyeball it in verification steps 3
and 9 — if it masks oddly, swap to `architecture.svg` or `brief.svg`.

## 6. Your Invariants

- `#studio-intro`, `#software`, hero, footer, `scripts/` — byte-for-byte untouched.
- No new colours, fonts, tokens, or animations; every visual property comes from the existing
  package cards.
- The process card is one card with three columns and never exceeds the width of the two-column
  rows below it (both are `.client-package__shell` at 1337px).
- Equal-height cards come from `align-items: stretch` — no fixed heights, no JS.
- Accessibility preserved: `.glyph` mask idiom unchanged, bridges `aria-hidden`, headings keep
  today's h1→h3 skip with no new level skip introduced, `:focus-visible` untouched,
  `prefers-reduced-motion` block untouched (no motion added).
- ≤720px: all three rows stack to one column, arrows read `↓`.
- No testing code, no build, no git state changes.

## 7. Manual verification (you in the browser)

1. Open `index.html` locally at desktop width: three rows appear in order
   process → services → packages; the purple process card lines up exactly with the outer edges
   of the two cards below it.
2. Two `→` arrows sit between Idea/Design/Build, vertically centred, at 55% stone.
3. Consultation and Basic Design are the same height, both with blue borders and glow; the
   shorter one shows trailing space rather than a shorter box.
4. Website and Desktop/Mobile sit in the same column widths as the row above; each has includes
   on the left, extras/maintenance/not-included on the right.
5. Process column ledes and bullet text fill the column width (not half-width).
6. Narrow to <720px: rows stack, process columns stack, both arrows become `↓`, no horizontal
   scrollbar.
7. Tab through the page: form and footer focus rings unchanged; no new focusable elements.
8. Text matches `prompt.md` with its spelling/grammar errors fixed and prices correct
   ($89 per hour, $200, starting from $500, quoted per build).
9. All seven glyphs actually paint inside their boxes — `idea` / `brief` / `prototype` in the
   process card, `human` / `design` / `website` / `app` in the card heads — and each takes the
   card's accent colour (purple in the process card, blue in the four packages).
